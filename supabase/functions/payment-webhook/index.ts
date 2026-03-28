import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CHAT_SERVICE_ID = "saju-ai-chat";

type GrantPackRow = {
  applied: boolean;
  free_used: number;
  paid_remaining: number;
  total: number;
  remaining: number;
  next_free_reset_at: string | null;
};

type OrderRow = {
  id: string;
  report_id: string;
  status: string;
  service_id: string;
  order_number: string;
  amount_krw: number;
  owner_key?: string | null;
  user_id?: string | null;
};

const isMissingColumnError = (error: unknown, columnName?: string) => {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string };
  const haystack = [maybeError.message, maybeError.details, maybeError.hint]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();

  if (columnName && !haystack.includes(columnName.toLowerCase())) {
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

const toNonEmptyString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const extractErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object") {
    const maybeError = error as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    const parts = [
      typeof maybeError.code === "string" ? `code=${maybeError.code}` : null,
      typeof maybeError.message === "string" ? `message=${maybeError.message}` : null,
      typeof maybeError.details === "string" ? `details=${maybeError.details}` : null,
      typeof maybeError.hint === "string" ? `hint=${maybeError.hint}` : null,
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }
  return "payment-webhook error";
};

const fetchOrderByNumber = async (
  supabase: ReturnType<typeof createClient>,
  orderNumber: string,
): Promise<OrderRow> => {
  const selectCandidates = [
    "id, report_id, status, service_id, owner_key, user_id, order_number, amount_krw",
    "id, report_id, status, service_id, user_id, order_number, amount_krw",
    "id, report_id, status, service_id, owner_key, order_number, amount_krw",
    "id, report_id, status, service_id, order_number, amount_krw",
  ];

  let missingColumnRetries = 0;
  for (const selectClause of selectCandidates) {
    const { data, error } = await supabase
      .from("orders")
      .select(selectClause)
      .eq("order_number", orderNumber)
      .single();

    if (!error && data) {
      return data as OrderRow;
    }

    if (error && isMissingColumnError(error)) {
      missingColumnRetries += 1;
      continue;
    }

    if (error) {
      throw error;
    }
  }

  if (missingColumnRetries > 0) {
    console.warn(`Order lookup used fallback selects for ${orderNumber}:`, missingColumnRetries);
  }

  throw new Error(`Order ${orderNumber} not found`);
};

const toChatCreditPayload = (grantPackResult: GrantPackRow | null) => {
  if (!grantPackResult) {
    return {
      applied: false,
      remaining: 0,
      total: 0,
      nextFreeResetAt: null,
    };
  }

  return {
    applied: Boolean(grantPackResult.applied),
    remaining: Number(grantPackResult.remaining ?? 0),
    total: Number(grantPackResult.total ?? 0),
    nextFreeResetAt:
      typeof grantPackResult.next_free_reset_at === "string" &&
      grantPackResult.next_free_reset_at.trim()
        ? grantPackResult.next_free_reset_at
        : null,
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("Webhook payload received:", JSON.stringify(payload));

    // PortOne V2 vs V1 Payload 매핑
    // V2: { type, data: { payment_id, transaction_id, store_id } }
    // V1: { imp_uid, merchant_uid, status }
    
    let merchant_uid = payload.merchant_uid;
    let imp_uid = payload.imp_uid;
    let status = payload.status;

    if (payload.type && payload.data) {
      // V2 Case
      merchant_uid = payload.data.payment_id;
      imp_uid = payload.data.transaction_id || payload.data.payment_id;
      status = payload.type === "Transaction.Paid" ? "paid" : payload.type;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const order = await fetchOrderByNumber(supabase, merchant_uid);

    // [Security] PortOne API를 통한 실제 결제 내역 검증
    const apiSecret = Deno.env.get("PORTONE_API_SECRET");
    if (apiSecret && !merchant_uid.startsWith("ASSUME-")) {
      try {
        console.log(`Verifying payment ${merchant_uid} via PortOne API...`);
        const verifyRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(merchant_uid)}`, {
          headers: {
            "Authorization": `PortOne ${apiSecret}`,
            "Content-Type": "application/json",
          },
        });

        if (!verifyRes.ok) {
          throw new Error(`PortOne API verification failed with status ${verifyRes.status}`);
        }

        const paymentData = await verifyRes.json();
        const actualAmount = paymentData.amount?.total || paymentData.amount;
        const actualStatus = paymentData.status;

        if (actualStatus !== "PAID") {
          throw new Error(`Payment status mismatch: expected PAID, got ${actualStatus}`);
        }

        if (Number(actualAmount) !== Number(order.amount_krw || 2000)) {
          throw new Error(`Payment amount mismatch: expected ${order.amount_krw}, got ${actualAmount}`);
        }
        console.log(`Payment ${merchant_uid} verified successfully.`);
      } catch (verifyErr) {
        console.error("Payment verification failed:", verifyErr);
        return new Response(JSON.stringify({ ok: false, error: "Payment verification failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else if (!apiSecret) {
      console.warn("PORTONE_API_SECRET not set. Skipping server-side verification.");
    }

    if (order.status !== "paid") {
      const updatePayload: Record<string, unknown> = {
        status: "paid",
        pg_tid: imp_uid,
        paid_at: new Date().toISOString(),
      };
      const removableColumns = ["pg_tid", "paid_at"] as const;

      let orderUpdateRetries = 0;
      while (orderUpdateRetries < 3) {
        orderUpdateRetries++;
        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update(updatePayload)
          .eq("id", order.id);

        if (!orderUpdateError) {
          break;
        }

        const retryColumn = removableColumns.find(
          (column) =>
            Object.prototype.hasOwnProperty.call(updatePayload, column) &&
            isMissingColumnError(orderUpdateError, column),
        );

        if (!retryColumn) {
          throw orderUpdateError;
        }

        console.warn(`${retryColumn} column missing, retrying order update without it...`);
        delete updatePayload[retryColumn];
      }
    }

    const reportUpdatePayload: Record<string, unknown> = { is_unlocked: true, updated_at: new Date().toISOString() };
    let reportUpdateRetries = 0;
    while (reportUpdateRetries < 3) {
      reportUpdateRetries++;
      const { error: reportUpdateError } = await supabase
        .from("reports")
        .update(reportUpdatePayload)
        .eq("id", order.report_id);

      if (!reportUpdateError) {
        break;
      }

      if (
        Object.prototype.hasOwnProperty.call(reportUpdatePayload, "updated_at") &&
        isMissingColumnError(reportUpdateError, "updated_at")
      ) {
        console.warn("reports.updated_at column missing, retrying report unlock without updated_at...");
        delete reportUpdatePayload.updated_at;
        continue;
      }

      throw reportUpdateError;
    }

    let grantPackResult: GrantPackRow | null = null;
    if (order.service_id === CHAT_SERVICE_ID) {
      const ownerKeyByOrder = toNonEmptyString(order.owner_key);
      const ownerKeyByUserId = toNonEmptyString(order.user_id)
        ? `owner:user:${String(order.user_id).trim()}`
        : null;
      const grantOwnerKey = ownerKeyByOrder ?? ownerKeyByUserId;
      if (!grantOwnerKey) {
        throw new Error(`Chat order ${order.order_number} missing owner_key and user_id.`);
      }

      const { data: grantData, error: grantError } = await supabase.rpc("chat_credit_grant_pack", {
        p_owner_key: grantOwnerKey,
        p_order_number: order.order_number,
        p_pack_size: 10,
        p_source: "payment-webhook",
      });

      if (grantError) {
        throw grantError;
      }

      grantPackResult = (Array.isArray(grantData) ? grantData[0] : grantData) as GrantPackRow | null;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        orderId: order.id,
        reportId: order.report_id,
        chatCredit: toChatCreditPayload(grantPackResult),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = extractErrorMessage(error);
    console.error("payment-webhook error:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
