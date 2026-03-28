import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CHAT_SERVICE_ID = "saju-ai-chat";
const OWNER_USER_KEY_REGEX = /^owner:user:([0-9a-fA-F-]{36})$/;

const isSchemaColumnMissing = (error: unknown, columnName: string) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  const haystack = [maybeError.message, maybeError.details, maybeError.hint]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();

  if (!haystack.includes(columnName.toLowerCase())) {
    return false;
  }

  if (maybeError.code === "PGRST204") {
    return true;
  }

  return (
    haystack.includes("schema cache") ||
    haystack.includes("column") ||
    haystack.includes("does not exist")
  );
};

const isBuyerEmailColumnMissing = (error: unknown) => isSchemaColumnMissing(error, "buyer_email");
const isOwnerKeyColumnMissing = (error: unknown) => isSchemaColumnMissing(error, "owner_key");
const isUserIdColumnMissing = (error: unknown) => isSchemaColumnMissing(error, "user_id");
const isPgProviderColumnMissing = (error: unknown) => isSchemaColumnMissing(error, "pg_provider");
const isPaymentMethodColumnMissing = (error: unknown) => isSchemaColumnMissing(error, "payment_method");

const normalizePhone = (value: unknown) => String(value ?? "").replace(/[^0-9]/g, "");
const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
const normalizeOwnerKey = (value: unknown) => String(value ?? "").trim();
const extractUserIdFromOwnerKey = (value: string | null) => {
  if (!value) {
    return null;
  }
  const match = value.match(OWNER_USER_KEY_REGEX);
  return match ? match[1] : null;
};

const hashHex = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await self.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const resolveOwnerKey = async (params: {
  ownerKey?: unknown;
  phone: string;
  email?: string | null;
}) => {
  const normalizedOwnerKey = normalizeOwnerKey(params.ownerKey);
  if (normalizedOwnerKey) {
    return normalizedOwnerKey;
  }

  if (params.phone) {
    const phoneHash = await hashHex(`phone:${params.phone}`);
    return `owner:phone:${phoneHash}`;
  }

  const normalizedEmail = normalizeEmail(params.email);
  if (normalizedEmail) {
    const emailHash = await hashHex(`email:${normalizedEmail}`);
    return `owner:email:${emailHash}`;
  }

  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      serviceId,
      serviceType,
      inputSnapshot,
      reportPayload,
      previewPayload,
      buyerInfo,
      ownerKey: rawOwnerKey,
    } = payload;

    const guestId = req.headers.get("x-guest-id") || null;
    const normalizedBuyerName =
      String(buyerInfo?.name ?? "").trim().replace(/\s+/g, " ") || "guest";
    const normalizedBuyerEmail = normalizeEmail(buyerInfo?.email) || null;
    const normalizedBuyerPhone = normalizePhone(buyerInfo?.phone);
    const ownerKey = await resolveOwnerKey({
      ownerKey: rawOwnerKey,
      phone: normalizedBuyerPhone,
      email: normalizedBuyerEmail,
    });
    const ownerUserId = extractUserIdFromOwnerKey(ownerKey);

    if (!serviceId || !serviceType || !normalizedBuyerPhone) {
      throw new Error(
        `Missing required fields: ${!serviceId ? "serviceId " : ""}${!serviceType ? "serviceType " : ""}${
          !normalizedBuyerPhone ? "phone" : ""
        }`,
      );
    }
    if (serviceId === CHAT_SERVICE_ID && !ownerKey && !ownerUserId) {
      throw new Error("Chat checkout requires owner identity (owner_key or owner:user key).");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const randomPart = self.crypto.randomUUID().split("-")[0].toUpperCase();
    const orderNumber = `CJ-${timestamp}-${randomPart}`;

    const buyerPhoneHash = await hashHex(normalizedBuyerPhone);

    const reportInsertPayload: Record<string, unknown> = {
      guest_id: guestId,
      service_id: serviceId,
      service_type: serviceType,
      input_snapshot: inputSnapshot || {},
      report_payload: reportPayload || {},
      preview_payload: previewPayload || {},
      is_unlocked: false,
    };
    if (ownerUserId) {
      reportInsertPayload.user_id = ownerUserId;
    }

    let { data: report, error: reportError } = await supabase
      .from("reports")
      .insert(reportInsertPayload)
      .select("id")
      .single();

    if (reportError && isUserIdColumnMissing(reportError)) {
      console.warn("reports.user_id column missing; retrying create-order report insert without user_id.");
      delete reportInsertPayload.user_id;
      const retryWithoutUserId = await supabase
        .from("reports")
        .insert(reportInsertPayload)
        .select("id")
        .single();
      report = retryWithoutUserId.data;
      reportError = retryWithoutUserId.error;
    }

    if (reportError) {
      console.error("Report creation error:", reportError);
      throw new Error(`Failed to create report record: ${reportError.message}`);
    }

    const orderPayloadBase = {
      order_number: orderNumber,
      report_id: report.id,
      guest_id: guestId,
      owner_key: ownerKey,
      user_id: ownerUserId,
      buyer_name: normalizedBuyerName,
      buyer_phone_hash: buyerPhoneHash,
      service_id: serviceId,
      amount_krw: buyerInfo.amount || 2000,
      status: "pending",
      pg_provider: "portone",
    };

    const orderPayloadWithEmail = normalizedBuyerEmail
      ? {
          ...orderPayloadBase,
          buyer_email: normalizedBuyerEmail,
        }
      : orderPayloadBase;

    let insertPayload: Record<string, unknown> = { ...orderPayloadWithEmail };
    let { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select("id")
      .single();

    if (orderError && isBuyerEmailColumnMissing(orderError)) {
      console.warn("orders.buyer_email column missing; retrying create-order without buyer_email.");
      delete insertPayload.buyer_email;
      const retryWithoutEmail = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id")
        .single();
      order = retryWithoutEmail.data;
      orderError = retryWithoutEmail.error;
    }

    if (orderError && isOwnerKeyColumnMissing(orderError)) {
      const hasUserIdFallback =
        typeof insertPayload.user_id === "string" && String(insertPayload.user_id).trim().length > 0;
      if (serviceId === CHAT_SERVICE_ID && !hasUserIdFallback) {
        throw new Error("orders.owner_key column missing and no user_id fallback for chat checkout.");
      }
      console.warn("orders.owner_key column missing; retrying create-order without owner_key.");
      delete insertPayload.owner_key;
      const retryWithoutOwner = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id")
        .single();
      order = retryWithoutOwner.data;
      orderError = retryWithoutOwner.error;
    }

    if (orderError && isUserIdColumnMissing(orderError)) {
      const hasOwnerKeyFallback =
        typeof insertPayload.owner_key === "string" && String(insertPayload.owner_key).trim().length > 0;
      if (serviceId === CHAT_SERVICE_ID && !hasOwnerKeyFallback) {
        throw new Error("orders.user_id column missing and no owner_key fallback for chat checkout.");
      }
      console.warn("orders.user_id column missing; retrying create-order without user_id.");
      delete insertPayload.user_id;
      const retryWithoutUserId = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id")
        .single();
      order = retryWithoutUserId.data;
      orderError = retryWithoutUserId.error;
    }

    if (orderError && isPgProviderColumnMissing(orderError)) {
      console.warn("orders.pg_provider column missing; retrying create-order without pg_provider.");
      delete insertPayload.pg_provider;
      const retryWithoutPg = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id")
        .single();
      order = retryWithoutPg.data;
      orderError = retryWithoutPg.error;
    }

    if (orderError && isPaymentMethodColumnMissing(orderError)) {
      console.warn("orders.payment_method column missing; retrying create-order without payment_method.");
      delete insertPayload.payment_method;
      const retryWithoutMethod = await supabase
        .from("orders")
        .insert(insertPayload)
        .select("id")
        .single();
      order = retryWithoutMethod.data;
      orderError = retryWithoutMethod.error;
    }

    if (orderError) {
      console.error("Order creation error:", orderError);
      await supabase.from("reports").delete().eq("id", report.id);
      throw new Error(`Failed to create order record: ${orderError.message}`);
    }

    const persistedHasOwnerKey =
      typeof insertPayload.owner_key === "string" && String(insertPayload.owner_key).trim().length > 0;
    const persistedHasUserId =
      typeof insertPayload.user_id === "string" && String(insertPayload.user_id).trim().length > 0;
    if (serviceId === CHAT_SERVICE_ID && !persistedHasOwnerKey && !persistedHasUserId) {
      await supabase.from("orders").delete().eq("id", order.id);
      await supabase.from("reports").delete().eq("id", report.id);
      throw new Error("Chat checkout requires persisted owner identity on order (owner_key or user_id).");
    }

    return new Response(
      JSON.stringify({
        ok: true,
        orderNumber,
        reportId: report.id,
        orderId: order.id,
        ownerKey,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown create-order error";
    console.error("create-order error:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
