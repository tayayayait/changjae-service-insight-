import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import { supabase } from "@/lib/supabase";
import { getPaidReport } from "@/lib/paidReportCatalog";
import {
  SAJU_ANALYSIS_SERVICE_IDS,
  SAJU_NEW_YEAR_2026_SERVICE_IDS,
  SajuResult,
  SajuServiceType,
  SectionAnalysis,
  UserBirthData,
} from "@/types/result";

type LookupState = {
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
};

type PurchasedLookupResponse = {
  ok: boolean;
  report?: {
    id: string;
    service_id: string;
    service_type: string;
    is_unlocked: boolean;
    input_snapshot: Record<string, unknown> | null;
    preview_payload: Record<string, unknown> | null;
    report_payload: Record<string, unknown> | null;
    created_at: string;
  };
  error?: string;
};

const SAJU_ANALYSIS_SERVICE_ID_SET = new Set<string>(SAJU_ANALYSIS_SERVICE_IDS as readonly string[]);
const SAJU_NEW_YEAR_SERVICE_ID_SET = new Set<string>(SAJU_NEW_YEAR_2026_SERVICE_IDS as readonly string[]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toFiniteNumber = (value: unknown, fallback: number) => {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toSections = (value: unknown): SectionAnalysis[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      title: typeof item.title === "string" && item.title.trim() ? item.title.trim() : "해석",
      interpretation:
        typeof item.interpretation === "string" && item.interpretation.trim()
          ? item.interpretation.trim()
          : "해석 데이터가 비어 있습니다.",
      advice:
        typeof item.advice === "string" && item.advice.trim()
          ? item.advice.trim()
          : "실행 가이드 데이터가 비어 있습니다.",
      luckyTip:
        typeof item.luckyTip === "string" && item.luckyTip.trim()
          ? item.luckyTip.trim()
          : undefined,
    }));
};

const toProfileData = (snapshot: Record<string, unknown> | null): UserBirthData => {
  const calendarRaw =
    typeof snapshot?.calendarType === "string"
      ? snapshot.calendarType
      : typeof snapshot?.calendar_type === "string"
        ? snapshot.calendar_type
        : "solar";
  const calendarType =
    calendarRaw === "solar" || calendarRaw === "lunar" || calendarRaw === "lunar-leap"
      ? calendarRaw
      : "solar";

  const genderRaw = typeof snapshot?.gender === "string" ? snapshot.gender : "female";
  const gender = genderRaw === "male" || genderRaw === "female" ? genderRaw : "female";

  return {
    name: typeof snapshot?.name === "string" ? snapshot.name : undefined,
    calendarType,
    year: Math.trunc(toFiniteNumber(snapshot?.year, 1990)),
    month: Math.trunc(toFiniteNumber(snapshot?.month, 1)),
    day: Math.trunc(toFiniteNumber(snapshot?.day, 1)),
    hour: Math.trunc(toFiniteNumber(snapshot?.hour, 12)),
    minute: Math.trunc(toFiniteNumber(snapshot?.minute, 0)),
    birthPrecision:
      typeof snapshot?.birthPrecision === "string"
        ? (snapshot.birthPrecision as UserBirthData["birthPrecision"])
        : "exact",
    location: typeof snapshot?.location === "string" ? snapshot.location : undefined,
    gender,
  };
};

const toConsultationType = (serviceId: string) => {
  if (SAJU_ANALYSIS_SERVICE_ID_SET.has(serviceId)) {
    return "lifetime";
  }
  if (SAJU_NEW_YEAR_SERVICE_ID_SET.has(serviceId)) {
    return "new-year-2026";
  }
  return "traditional-saju";
};

const buildPurchasedResult = (report: PurchasedLookupResponse["report"]): SajuResult => {
  if (!report) {
    throw new Error("리포트 데이터가 없습니다.");
  }

  const serviceId = report.service_id || "traditional-saju";
  const preview = isRecord(report.preview_payload) ? report.preview_payload : {};
  const payload = isRecord(report.report_payload) ? report.report_payload : {};
  const inputSnapshot = isRecord(report.input_snapshot) ? report.input_snapshot : null;

  const sections = toSections(preview.sections);
  const summary =
    typeof preview.summary === "string" && preview.summary.trim()
      ? preview.summary.trim()
      : typeof payload.coreQuestion === "string" && payload.coreQuestion.trim()
        ? payload.coreQuestion.trim()
        : "구매한 리포트입니다.";

  const reportPayloads: Record<string, unknown> = {
    [serviceId]: payload,
  };
  const summaries: Record<string, string> = {
    [serviceId]: summary,
  };
  const sectionsMap: Record<string, SectionAnalysis[]> = {
    [serviceId]: sections,
  };

  return {
    id: report.id,
    sourceServiceId: serviceId,
    consultationType: toConsultationType(serviceId),
    profileData: toProfileData(inputSnapshot),
    palja: {} as SajuResult["palja"],
    oheng: [],
    interests: [],
    summary,
    sections,
    reportPayload: payload as SajuResult["reportPayload"],
    reportPayloads: reportPayloads as SajuResult["reportPayloads"],
    summaries: summaries as SajuResult["summaries"],
    sectionsMap: sectionsMap as SajuResult["sectionsMap"],
    unlockedItems: [serviceId as SajuServiceType],
    isLocked: false,
    createdAt: report.created_at,
  };
};

export default function SajuPurchasedReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { state } = useLocation();
  const lookupState = (state ?? {}) as LookupState;

  const normalizedIdentity = useMemo(
    () => ({
      buyerName: (lookupState.buyerName ?? "").trim().replace(/\s+/g, " "),
      buyerPhone: (lookupState.buyerPhone ?? "").replace(/[^0-9]/g, ""),
      buyerEmail: (lookupState.buyerEmail ?? "").trim().toLowerCase(),
    }),
    [lookupState.buyerEmail, lookupState.buyerName, lookupState.buyerPhone],
  );

  const [result, setResult] = useState<SajuResult | null>(null);
  const [serviceId, setServiceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!reportId) {
      setError("리포트 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    if (!normalizedIdentity.buyerName || !normalizedIdentity.buyerPhone) {
      setError("본인 확인 정보가 없어 결제 리포트를 조회할 수 없습니다. 내 리포트 찾기에서 다시 조회해 주세요.");
      setIsLoading(false);
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: invokeError } = await supabase.functions.invoke("lookup-reports", {
          body: {
            mode: "report",
            reportId,
            buyerName: normalizedIdentity.buyerName,
            buyerPhone: normalizedIdentity.buyerPhone,
            buyerEmail: normalizedIdentity.buyerEmail || undefined,
          },
        });

        if (invokeError) {
          throw invokeError;
        }

        const response = (data ?? {}) as PurchasedLookupResponse;
        if (!response.ok || !response.report) {
          throw new Error(response.error || "리포트를 찾을 수 없습니다.");
        }
        if (response.report.service_type !== "saju") {
          throw new Error("사주 결제 리포트가 아닙니다.");
        }
        if (!response.report.is_unlocked) {
          throw new Error("결제 확인이 완료되지 않아 리포트를 열 수 없습니다.");
        }
        if (!response.report.report_payload) {
          throw new Error("결제 리포트 원문이 비어 있습니다.");
        }

        const purchasedResult = buildPurchasedResult(response.report);
        if (!mounted) {
          return;
        }
        setServiceId(response.report.service_id);
        setResult(purchasedResult);
      } catch (loadError) {
        if (!mounted) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "결제 리포트를 불러오지 못했습니다.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    normalizedIdentity.buyerEmail,
    normalizedIdentity.buyerName,
    normalizedIdentity.buyerPhone,
    reportId,
  ]);

  if (isLoading) {
    return (
      <AnalysisPageShell
        categoryId="saju"
        title="결제 리포트 확인"
        subtitle="결제한 리포트를 확인하는 중입니다."
        icon={FileText}
        headerBehavior="reading"
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AnalysisPageShell>
    );
  }

  if (error || !result) {
    return (
      <AnalysisPageShell
        categoryId="saju"
        title="리포트 조회 실패"
        subtitle="결제 정보 또는 본인 확인 정보를 다시 확인해 주세요."
        icon={FileText}
        headerBehavior="reading"
      >
        <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
          <p className="text-[15px] font-semibold text-foreground">{error ?? "리포트 데이터가 없습니다."}</p>
          <div className="mt-5">
            <Button asChild className="bg-[#24303F] text-white">
              <Link to="/my-reports">내 리포트 찾기</Link>
            </Button>
          </div>
        </Card>
      </AnalysisPageShell>
    );
  }

  const paidItem = serviceId ? getPaidReport(serviceId) : null;

  return (
    <AnalysisPageShell
      categoryId="saju"
      title={paidItem?.title ?? "결제 리포트"}
      subtitle={paidItem?.categoryLabel ?? "구매한 사주 리포트"}
      icon={FileText}
      headerBehavior="reading"
      layoutWidth="wide"
    >
      <SajuCollectionTabs
        result={result}
        serviceIds={[serviceId || "traditional-saju"]}
        isLocked={false}
        onUnlockRequest={() => undefined}
      />
    </AnalysisPageShell>
  );
}
