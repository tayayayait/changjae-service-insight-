import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2, MoonStar } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AstrologyPrintButton } from "@/components/astrology/AstrologyPrintButton";
import { supabase } from "@/lib/supabase";
import { getAstrologyBirthReport } from "@/lib/astrologyClient";
import { normalizeAstrologyBirthReport } from "@/lib/astrologyReport";
import { AstrologyBirthReportResult, AstrologyRequest } from "@/types/result";
import { AstrologyReportView } from "@/components/astrology/AstrologyReportView";
import { AstrologyReportRecord } from "@/types/astrology";

const LOOKUP_TIMEOUT_MS = 12_000;
const LOOKUP_RETRY_MAX = 3;
const LOOKUP_RETRY_DELAY_MS = 900;
const LOCAL_REPORT_TIMEOUT_MS = 75_000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

const inferBirthTimeKnown = (
  payload: unknown,
  snapshot?: Record<string, unknown> | null,
) => {
  if (isRecord(payload) && isRecord(payload.confidence) && typeof payload.confidence.birthTimeKnown === "boolean") {
    return payload.confidence.birthTimeKnown;
  }
  if (isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.birthTimeKnown === "boolean") {
    return payload.meta.birthTimeKnown;
  }
  if (snapshot && typeof snapshot.birthTimeKnown === "boolean") {
    return snapshot.birthTimeKnown;
  }
  if (snapshot) {
    return toFiniteNumber(snapshot.hour) !== null && toFiniteNumber(snapshot.minute) !== null;
  }
  return false;
};

const buildBirthRequestFromSnapshot = (snapshot: Record<string, unknown>): AstrologyRequest => {
  const year = toFiniteNumber(snapshot.year);
  const month = toFiniteNumber(snapshot.month);
  const day = toFiniteNumber(snapshot.day);

  if (year === null || month === null || day === null) {
    throw new Error("출생 연/월/일 정보가 누락되었습니다.");
  }

  const birthTimeKnown =
    typeof snapshot.birthTimeKnown === "boolean"
      ? snapshot.birthTimeKnown
      : toFiniteNumber(snapshot.hour) !== null && toFiniteNumber(snapshot.minute) !== null;

  const hour = toFiniteNumber(snapshot.hour) ?? 12;
  const minute = toFiniteNumber(snapshot.minute) ?? 0;
  const lat = toFiniteNumber(snapshot.lat) ?? 37.5665;
  const lng = toFiniteNumber(snapshot.lng) ?? 126.978;
  const tzSource =
    (typeof snapshot.timezone === "string" && snapshot.timezone.trim()) ||
    (typeof snapshot.tz_str === "string" && snapshot.tz_str.trim()) ||
    "Asia/Seoul";
  const name = typeof snapshot.name === "string" && snapshot.name.trim() ? snapshot.name.trim() : undefined;

  return {
    ...(name ? { name } : {}),
    year,
    month,
    day,
    hour,
    minute,
    lat,
    lng,
    tz_str: tzSource,
    birthTimeKnown,
  };
};

type LookupState = {
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  inlineReportPayload?: Record<string, unknown>;
  inputSnapshot?: Record<string, unknown>;
  localPreview?: boolean;
  localReportStorageKey?: string;
};

type PurchasedLookupResponse = {
  ok: boolean;
  report?: {
    id: string;
    service_id: string;
    service_type: string;
    is_unlocked: boolean;
    preview_payload: Record<string, unknown> | null;
    report_payload: Record<string, unknown> | null;
    created_at: string;
  };
  error?: string;
};

export default function AstrologyPurchasedReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { state } = useLocation();
  const lookupState = (state ?? {}) as LookupState;
  const inlineReportPayload = lookupState.inlineReportPayload;
  const localReportStorageKey =
    lookupState.localReportStorageKey ||
    (reportId?.startsWith("local-") ? `astrology-local-report:${reportId}` : "");
  const localSnapshotStorageKey = reportId?.startsWith("local-")
    ? `astrology-local-snapshot:${reportId}`
    : "";

  const [report, setReport] = useState<AstrologyBirthReportResult | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLocalReport = Boolean(reportId?.startsWith("local-"));

  const normalizedIdentity = useMemo(
    () => ({
      buyerName: (lookupState.buyerName ?? "").trim().replace(/\s+/g, " "),
      buyerPhone: (lookupState.buyerPhone ?? "").replace(/[^0-9]/g, ""),
      buyerEmail: (lookupState.buyerEmail ?? "").trim().toLowerCase(),
    }),
    [lookupState.buyerEmail, lookupState.buyerName, lookupState.buyerPhone],
  );

  const localPreviewPayload = useMemo(() => {
    if (!localReportStorageKey) {
      return null;
    }
    try {
      const raw = sessionStorage.getItem(localReportStorageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }, [localReportStorageKey]);

  const localInputSnapshot = useMemo(() => {
    if (isRecord(lookupState.inputSnapshot)) {
      return lookupState.inputSnapshot;
    }
    if (!localSnapshotStorageKey) {
      return null;
    }

    try {
      const raw = sessionStorage.getItem(localSnapshotStorageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [localSnapshotStorageKey, lookupState.inputSnapshot]);

  useEffect(() => {
    if (!localSnapshotStorageKey || !isRecord(lookupState.inputSnapshot)) {
      return;
    }
    sessionStorage.setItem(localSnapshotStorageKey, JSON.stringify(lookupState.inputSnapshot));
  }, [localSnapshotStorageKey, lookupState.inputSnapshot]);

  useEffect(() => {
    let mounted = true;

    const payload = inlineReportPayload ?? localPreviewPayload;
    if (payload) {
      try {
        const normalized = normalizeAstrologyBirthReport(payload, {
          birthTimeKnown: inferBirthTimeKnown(payload, localInputSnapshot),
        });
        if (!mounted) return;
        setReport(normalized);
        setIsUnlocked(true);
        setIsLoading(false);
        return;
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "미리보기 리포트를 불러오지 못했습니다.");
        setIsLoading(false);
        return;
      }
    }

    if (!reportId) {
      if (!mounted) return;
      setError("리포트 ID가 없습니다.");
      setIsLoading(false);
      return;
    }

    if (isLocalReport) {
      if (!localInputSnapshot) {
        if (!mounted) return;
        setError("입력 정보가 없어 리포트를 생성할 수 없습니다. 점성 메인에서 다시 진행해 주세요.");
        setIsLoading(false);
        return;
      }

      void (async () => {
        setIsLoading(true);
        setError(null);
        try {
          const birthRequest = buildBirthRequestFromSnapshot(localInputSnapshot);
          const generatedReport = await withTimeout(
            getAstrologyBirthReport(birthRequest),
            LOCAL_REPORT_TIMEOUT_MS,
            "리포트 생성",
          );
          if (!mounted) return;
          if (localReportStorageKey) {
            sessionStorage.setItem(localReportStorageKey, JSON.stringify(generatedReport));
          }
          setReport(generatedReport);
          setIsUnlocked(true);
        } catch (err) {
          if (!mounted) return;
          setError(err instanceof Error ? err.message : "리포트를 생성하지 못했습니다.");
        } finally {
          if (!mounted) return;
          setIsLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }

    if (!normalizedIdentity.buyerName || !normalizedIdentity.buyerPhone) {
      if (!mounted) return;
      setError("본인 확인 정보가 없어 리포트를 열 수 없습니다. 내 리포트 찾기에서 다시 접근해 주세요.");
      setIsLoading(false);
      return;
    }

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        let fetched = false;
        for (let attempt = 1; attempt <= LOOKUP_RETRY_MAX; attempt += 1) {
          const { data, error: invokeError } = await withTimeout(
            supabase.functions.invoke("lookup-reports", {
              body: {
                mode: "report",
                reportId,
                buyerName: normalizedIdentity.buyerName,
                buyerPhone: normalizedIdentity.buyerPhone,
                buyerEmail: normalizedIdentity.buyerEmail || undefined,
              },
            }),
            LOOKUP_TIMEOUT_MS,
            "리포트 조회",
          );

          if (invokeError) {
            throw invokeError;
          }

          const response = (data ?? {}) as PurchasedLookupResponse;
          if (!response.ok || !response.report) {
            throw new Error(response.error || "리포트를 찾을 수 없습니다.");
          }
          if (response.report.service_type !== "astro") {
            throw new Error("점성 리포트가 아닙니다.");
          }

          if (!mounted) return;
          setIsUnlocked(Boolean(response.report.is_unlocked));

          if (response.report.is_unlocked && response.report.report_payload) {
            const normalized = normalizeAstrologyBirthReport(response.report.report_payload, {
              birthTimeKnown: inferBirthTimeKnown(
                response.report.report_payload,
                isRecord(response.report.input_snapshot) ? response.report.input_snapshot : null,
              ),
            });
            if (!mounted) return;
            setReport(normalized);
            fetched = true;
            break;
          }

          if (attempt < LOOKUP_RETRY_MAX) {
            await wait(LOOKUP_RETRY_DELAY_MS);
          }
        }

        if (!mounted) return;
        if (!fetched) {
          setReport(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "리포트를 불러오지 못했습니다.");
      } finally {
        if (!mounted) return;
        setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    inlineReportPayload,
    localPreviewPayload,
    normalizedIdentity.buyerEmail,
    normalizedIdentity.buyerName,
    normalizedIdentity.buyerPhone,
    isLocalReport,
    localInputSnapshot,
    localReportStorageKey,
    reportId,
  ]);

  if (isLoading) {
    return (
      <AnalysisPageShell
        categoryId="astrology"
        title="결제 리포트 확인"
        subtitle="결제 상태와 리포트를 확인하는 중입니다."
        icon={MoonStar}
        themeColor="accent-sky"
      >
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AnalysisPageShell>
    );
  }

  if (error) {
    return (
      <AnalysisPageShell
        categoryId="astrology"
        title="리포트 조회 실패"
        subtitle="본인 확인 또는 결제 상태를 확인해 주세요."
        icon={MoonStar}
        themeColor="accent-sky"
      >
        <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
          <p className="text-[15px] font-semibold text-foreground">{error}</p>
          <div className="mt-5 flex flex-col gap-2">
            <Button asChild className="bg-[#24303F] text-white">
              <Link to="/my-reports">내 리포트 찾기</Link>
            </Button>
            <Button variant="outline" onClick={() => navigate("/astrology")}>
              점성 메인으로 이동
            </Button>
          </div>
        </Card>
      </AnalysisPageShell>
    );
  }

  if (!report) {
    return (
      <AnalysisPageShell
        categoryId="astrology"
        title="결제 확인 대기"
        subtitle="결제 완료 처리 중일 수 있습니다."
        icon={MoonStar}
        themeColor="accent-sky"
      >
        <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
          <p className="text-[15px] font-semibold text-foreground">
            결제는 확인되었지만 리포트 잠금 해제가 아직 반영되지 않았습니다. 잠시 후 다시 시도해 주세요.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()}>다시 확인</Button>
            <Button variant="outline" asChild>
              <Link to="/my-reports">내 리포트 찾기</Link>
            </Button>
          </div>
        </Card>
      </AnalysisPageShell>
    );
  }

  // 새 AstrologyReportView에 record 객체를 구성하여 넘김
  const pseudoRecord: AstrologyReportRecord = {
    id: reportId ?? "",
    userId: "",
    guestId: "",
    serviceType: "astro-natal",
    inputSnapshot: localInputSnapshot ?? {},
    inputFingerprint: "",
    reportPayload: report,
    templateVersion: report.meta.templateVersion,
    isUnlocked,
    createdAt: new Date().toISOString(),
  };

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title={isUnlocked ? "결제 완료 리포트" : "인생 설계도 미리보기"}
      subtitle={isUnlocked ? "독점 섹션이 해제된 점성 리포트입니다." : "결제 후 전체 리포트를 확인하세요."}
      icon={MoonStar}
      themeColor="accent-sky"
    >
      <div className="mx-auto w-full max-w-4xl">
        <section className="space-y-4 md:space-y-5">
          {isUnlocked && (
            <div className="no-print flex justify-end">
              <AstrologyPrintButton />
            </div>
          )}
          <AstrologyReportView
            record={pseudoRecord}
            isLocked={!isUnlocked}
            onReset={() => navigate("/astrology")}
          />
        </section>
      </div>
    </AnalysisPageShell>
  );
}
