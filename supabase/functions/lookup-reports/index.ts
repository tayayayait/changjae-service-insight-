import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const REPORT_RETENTION_DAYS = 30;
const REPORT_RETENTION_MS = REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const LOOKUP_EXCLUDED_SERVICE_IDS = new Set(["saju-ai-chat"]);

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

  if (maybeError.code === "PGRST204" || maybeError.code === "42703") {
    return true;
  }

  return (
    haystack.includes("schema cache") ||
    haystack.includes("column") ||
    haystack.includes("does not exist")
  );
};

const isBuyerEmailColumnMissing = (error: unknown) =>
  isSchemaColumnMissing(error, "buyer_email");

const toDateMs = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return NaN;
  }
  return Date.parse(value);
};

const isWithinReportRetention = (paidAt: unknown, createdAt: unknown) => {
  const paidAtMs = toDateMs(paidAt);
  const createdAtMs = toDateMs(createdAt);
  const baseMs = Number.isFinite(paidAtMs) ? paidAtMs : createdAtMs;
  if (!Number.isFinite(baseMs)) {
    return false;
  }
  return Date.now() - baseMs <= REPORT_RETENTION_MS;
};

const isLookupExcludedService = (orderServiceId: unknown, reportServiceId: unknown) =>
  (typeof orderServiceId === "string" && LOOKUP_EXCLUDED_SERVICE_IDS.has(orderServiceId)) ||
  (typeof reportServiceId === "string" && LOOKUP_EXCLUDED_SERVICE_IDS.has(reportServiceId));

const hashPhone = async (phone: string) => {
  const bytes = new TextEncoder().encode(phone);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toNumberOr = (value: unknown, fallback: number) => {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildAstrologyBirthRequestFromSnapshot = (snapshot: unknown) => {
  if (!isRecord(snapshot)) {
    return null;
  }

  const name = typeof snapshot.name === "string" ? snapshot.name.trim() : "";
  const year = toNumberOr(snapshot.year, NaN);
  const month = toNumberOr(snapshot.month, NaN);
  const day = toNumberOr(snapshot.day, NaN);
  const hourRaw = snapshot.hour;
  const minuteRaw = snapshot.minute;
  const hour = toNumberOr(hourRaw, 12);
  const minute = toNumberOr(minuteRaw, 0);
  const lat = toNumberOr(snapshot.lat, 37.5665);
  const lng = toNumberOr(snapshot.lng, 126.978);
  const timezoneRaw =
    typeof snapshot.timezone === "string" && snapshot.timezone.trim().length > 0
      ? snapshot.timezone.trim()
      : typeof snapshot.tz_str === "string" && snapshot.tz_str.trim().length > 0
        ? snapshot.tz_str.trim()
        : "Asia/Seoul";

  if (!name || !Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return {
    name,
    year: Math.trunc(year),
    month: Math.trunc(month),
    day: Math.trunc(day),
    hour: Math.trunc(hour),
    minute: Math.trunc(minute),
    lat,
    lng,
    tz_str: timezoneRaw,
    birthTimeKnown: Number.isFinite(Number(hourRaw)) && Number.isFinite(Number(minuteRaw)),
  };
};

const isEmptyPayload = (value: unknown) => {
  if (!isRecord(value)) return true;
  return Object.keys(value).length === 0;
};

const generateAstrologyReportPayload = async (
  birthRequest: Record<string, unknown>,
) => {
  const functionEndpoint = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/astrology-natal-api`;
  const response = await fetch(functionEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({
      action: "birth_report",
      payload: birthRequest,
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string" && payload.error.trim().length > 0
        ? payload.error
        : "Failed to generate astrology report payload";
    throw new Error(message);
  }

  if (!isRecord(payload)) {
    throw new Error("Generated astrology report payload is invalid");
  }

  return payload;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const mode = body?.mode === "report" ? "report" : "list";

    const normalizedName = String(body?.buyerName ?? "").trim().replace(/\s+/g, " ");
    const normalizedPhone = String(body?.buyerPhone ?? "").replace(/[^0-9]/g, "");
    const normalizedEmail = String(body?.buyerEmail ?? "").trim().toLowerCase();
    const reportId = String(body?.reportId ?? "").trim();

    if (!normalizedName || !normalizedPhone) {
      throw new Error("Missing required fields: buyerName, buyerPhone");
    }
    if (mode === "report" && !reportId) {
      throw new Error("Missing required field: reportId");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const buyerPhoneHash = await hashPhone(normalizedPhone);

    const buildListQuery = () =>
      supabase
        .from("orders")
        .select(`
          id,
          order_number,
          service_id,
          paid_at,
          amount_krw,
          reports:report_id (
            id,
            service_id,
            service_type,
            is_unlocked,
            preview_payload,
            created_at
          )
        `)
        .ilike("buyer_name", normalizedName)
        .eq("buyer_phone_hash", buyerPhoneHash)
        .eq("status", "paid")
        .order("paid_at", { ascending: false });

    const buildReportQuery = () =>
      supabase
        .from("orders")
        .select(`
          id,
          order_number,
          service_id,
          paid_at,
          amount_krw,
          reports:report_id (
            id,
            service_id,
            service_type,
            is_unlocked,
            input_snapshot,
            preview_payload,
            report_payload,
            created_at
          )
        `)
        .eq("report_id", reportId)
        .ilike("buyer_name", normalizedName)
        .eq("buyer_phone_hash", buyerPhoneHash)
        .eq("status", "paid")
        .order("paid_at", { ascending: false })
        .limit(1);

    const runWithColumnFallback = async (queryBuilder: (includePaidAt: boolean) => any, includeEmail: boolean) => {
      const exec = async (includePaidAt: boolean, includeEmailFilter: boolean) => {
        let q = queryBuilder(includePaidAt);
        if (includeEmailFilter && normalizedEmail) {
          q = q.ilike("buyer_email", normalizedEmail);
        }
        return await q;
      };

      let includePaidAt = true;
      let includeEmailFilter = includeEmail && Boolean(normalizedEmail);
      let { data, error } = await exec(includePaidAt, includeEmailFilter);

      // 1) Fallback for missing paid_at
      if (error && isSchemaColumnMissing(error, "paid_at")) {
        console.warn("paid_at column missing, retrying without it...");
        includePaidAt = false;
        const retry = await exec(includePaidAt, includeEmailFilter);
        data = retry.data;
        error = retry.error;
      }

      // 2) Fallback for missing buyer_email
      if (error && includeEmailFilter && isBuyerEmailColumnMissing(error)) {
        console.warn("buyer_email column missing, retrying without it...");
        includeEmailFilter = false;
        const retryWithNoEmail = await exec(includePaidAt, includeEmailFilter);
        data = retryWithNoEmail.data;
        error = retryWithNoEmail.error;
      }

      // 3) Fallback for missing paid_at that appears after email fallback
      if (error && includePaidAt && isSchemaColumnMissing(error, "paid_at")) {
        console.warn("paid_at column missing after email fallback, retrying without it...");
        includePaidAt = false;
        const finalRetry = await exec(includePaidAt, includeEmailFilter);
        data = finalRetry.data;
        error = finalRetry.error;
      }

      if (error) throw error;
      return data;
    };

    if (mode === "report") {
      const result = await runWithColumnFallback(
        (includePaidAt) => {
          return supabase
            .from("orders")
            .select(`
              id,
              order_number,
              service_id,
              ${includePaidAt ? "paid_at," : ""}
              amount_krw,
              created_at,
              reports:report_id (
                id,
                service_id,
                service_type,
                is_unlocked,
                input_snapshot,
                preview_payload,
                report_payload,
                created_at
              )
            `)
            .eq("report_id", reportId)
            .ilike("buyer_name", normalizedName)
            .eq("buyer_phone_hash", buyerPhoneHash)
            .eq("status", "paid")
            .order(includePaidAt ? "paid_at" : "created_at", { ascending: false })
            .limit(1);
        },
        true
      );

      const order = Array.isArray(result) ? result[0] : null;
      if (!order?.reports) {
        return new Response(
          JSON.stringify({ ok: false, error: "Owner verification failed", code: "NOT_OWNER" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (isLookupExcludedService(order.service_id, order.reports?.service_id)) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "AI 사주상담 구매 내역은 로그인 후 채팅 화면에서 확인할 수 있습니다.",
            code: "EXCLUDED_SERVICE",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (!isWithinReportRetention(order.paid_at, order.created_at)) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: `결제일 기준 ${REPORT_RETENTION_DAYS}일 보관 기간이 만료되어 리포트를 다시 열 수 없습니다.`,
            code: "EXPIRED",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const report = order.reports;
      let resolvedReportPayload = report.report_payload ?? null;

      if (
        report.service_type === "astro" &&
        Boolean(report.is_unlocked) &&
        isEmptyPayload(resolvedReportPayload)
      ) {
        const birthRequest = buildAstrologyBirthRequestFromSnapshot(report.input_snapshot);
        if (!birthRequest) {
          throw new Error("Missing required astrology input snapshot for report generation");
        }

        resolvedReportPayload = await generateAstrologyReportPayload(birthRequest);

        const { error: updateError } = await supabase
          .from("reports")
          .update({
            report_payload: resolvedReportPayload,
            updated_at: new Date().toISOString(),
          })
          .eq("id", report.id);

        if (updateError) {
          console.error("lookup-reports report_payload update error:", updateError.message);
        }
      }

      return new Response(
        JSON.stringify({
          ok: true,
          mode: "report",
          order: {
            orderId: order.id,
            orderNumber: order.order_number,
            paidAt: order.paid_at ?? order.created_at,
            amount_krw: order.amount_krw,
          },
          report: {
            id: report.id,
            service_id: report.service_id,
            service_type: report.service_type,
            is_unlocked: Boolean(report.is_unlocked),
            input_snapshot: report.input_snapshot ?? null,
            preview_payload: report.preview_payload ?? null,
            report_payload: report.is_unlocked ? resolvedReportPayload : null,
            created_at: report.created_at,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = await runWithColumnFallback(
      (includePaidAt) => {
        return supabase
          .from("orders")
          .select(`
            id,
            order_number,
            service_id,
            ${includePaidAt ? "paid_at," : ""}
            amount_krw,
            created_at,
            reports:report_id (
              id,
              service_id,
              service_type,
              is_unlocked,
              preview_payload,
              created_at
            )
          `)
          .ilike("buyer_name", normalizedName)
          .eq("buyer_phone_hash", buyerPhoneHash)
          .eq("status", "paid")
          .order(includePaidAt ? "paid_at" : "created_at", { ascending: false })
          .limit(50);
      },
      true
    );

    const retainedResults = (results || []).filter((o: any) =>
      isWithinReportRetention(o.paid_at, o.created_at)
    );
    const visibleResults = retainedResults.filter((o: any) => {
      const report = Array.isArray(o.reports) ? o.reports[0] : o.reports;
      return !isLookupExcludedService(o.service_id, report?.service_id);
    });

    return new Response(
      JSON.stringify({
        ok: true,
        mode: "list",
        reports: visibleResults.map((o: any) => {
          const report = Array.isArray(o.reports) ? o.reports[0] : o.reports;

          return {
            orderId: o.id,
            orderNumber: o.order_number,
            report,
            paidAt: o.paid_at ?? o.created_at,
            amount_krw: o.amount_krw,
          };
        }),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "lookup failed";
    console.error("lookup-reports error:", message);
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
