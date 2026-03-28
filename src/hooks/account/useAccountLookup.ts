import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useOwnerStore } from "@/store/useOwnerStore";

export interface LookupResult {
  orderId: string;
  orderNumber: string;
  paidAt: string;
  amount_krw: number;
  report: {
    id: string;
    service_id: string;
    service_type: string;
    preview_payload: Record<string, unknown> | null;
    created_at: string;
  };
}

type FallbackLookupOrder = {
  id: string;
  order_number: string;
  paid_at: string | null;
  amount_krw: number;
  created_at: string;
  report: LookupResult["report"] | LookupResult["report"][] | null;
};

const isMissingColumnError = (error: unknown, columnName: string) => {
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

const REPORT_RETENTION_DAYS = 30;
const REPORT_RETENTION_MS = REPORT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
const LOOKUP_EXCLUDED_SERVICE_IDS = new Set(["saju-ai-chat"]);

const toDateMs = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) {
    return Number.NaN;
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

const isLookupExcludedService = (serviceId: unknown) =>
  typeof serviceId === "string" && LOOKUP_EXCLUDED_SERVICE_IDS.has(serviceId);

const filterLookupResults = (items: LookupResult[]) =>
  items.filter((item) => {
    if (!item?.report || typeof item.report.service_id !== "string") {
      return false;
    }
    return !isLookupExcludedService(item.report.service_id);
  });

export function useAccountLookup() {
  const setOwnerFromVerifiedContact = useOwnerStore((state) => state.setOwnerFromVerifiedContact);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LookupResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();

    const normalizedName = buyerName.trim().replace(/\s+/g, " ");
    const normalizedPhone = buyerPhone.replace(/[^0-9]/g, "");
    const normalizedEmail = buyerEmail.trim().toLowerCase();

    if (!normalizedName || normalizedName.length < 2) {
      setErrorMessage("주문자 성함을 2자 이상 입력해주세요.");
      return;
    }
    if (!normalizedPhone || normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      setErrorMessage("휴대전화 번호를 정확히 입력해주세요. (10~11자리)");
      return;
    }
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setErrorMessage("결제 시 입력한 이메일을 정확히 입력해주세요.");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke("lookup-reports", {
        body: {
          buyerName: normalizedName,
          buyerPhone: normalizedPhone,
          buyerEmail: normalizedEmail || undefined,
        },
      });

      if (error) throw error;
      if (!data.ok) throw new Error(data.error || "조회 중 오류가 발생했습니다.");

      await setOwnerFromVerifiedContact({
        phone: normalizedPhone,
        email: normalizedEmail || undefined,
      });
      const reports = Array.isArray(data.reports) ? (data.reports as LookupResult[]) : [];
      setResults(filterLookupResults(reports));
    } catch (err: unknown) {
      console.warn("Lookup edge function failed, attempting direct DB fallback:", err);
      
      try {
        // Direct DB Fallback (Works only for the same device due to RLS, or if RLS is bypassed by Admin)
        const buildFallbackQuery = (includePaidAt: boolean) => {
          const selectStr = `
            id,
            order_number,
            ${includePaidAt ? "paid_at," : ""}
            amount_krw,
            created_at,
            report:report_id (
              id,
              service_id,
              service_type,
              preview_payload,
              created_at
            )
          `;
          return supabase
            .from("orders")
            .select(selectStr)
            .ilike("buyer_name", normalizedName)
            .eq("status", "paid")
            .order(includePaidAt ? "paid_at" : "created_at", { ascending: false });
        };

        let { data: dbOrders, error: dbError } = await buildFallbackQuery(true);

        // Fallback if paid_at column is missing
        if (dbError && isMissingColumnError(dbError, "paid_at")) {
          const retry = await buildFallbackQuery(false);
          dbOrders = retry.data;
          dbError = retry.error;
        }

        if (dbError) throw dbError;
        if (!dbOrders || dbOrders.length === 0) {
          throw new Error("조회된 구매 내역이 없습니다. (동일한 브라우저 세션에서만 조회가 가능할 수 있습니다)");
        }

        const retainedOrders = (dbOrders as FallbackLookupOrder[]).filter((order) =>
          isWithinReportRetention(order.paid_at, order.created_at),
        );

        if (retainedOrders.length === 0) {
          throw new Error(
            `결제일 기준 ${REPORT_RETENTION_DAYS}일 보관 기간이 만료되어 리포트를 다시 볼 수 없습니다.`,
          );
        }

        const mapped: LookupResult[] = retainedOrders
          .map((order) => {
            const report = Array.isArray(order.report) ? order.report[0] : order.report;
            if (!report) {
              return null;
            }

            return {
              orderId: order.id,
              orderNumber: order.order_number,
              paidAt: order.paid_at ?? order.created_at,
              amount_krw: order.amount_krw,
              report,
            };
          })
          .filter((item): item is LookupResult => item !== null);

        await setOwnerFromVerifiedContact({
          phone: normalizedPhone,
          email: normalizedEmail || undefined,
        });
        setResults(filterLookupResults(mapped));
      } catch (fallbackErr: unknown) {
        const fallbackMessage =
          fallbackErr instanceof Error ? fallbackErr.message : "리포트를 찾는 중 오류가 발생했습니다.";
        setErrorMessage(fallbackMessage);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    buyerName,
    setBuyerName,
    buyerPhone,
    setBuyerPhone,
    buyerEmail,
    setBuyerEmail,
    loading,
    results,
    hasSearched,
    errorMessage,
    setErrorMessage,
    handleLookup,
  };
}
