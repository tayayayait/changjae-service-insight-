import { NavigateFunction } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { calculateSaju, parseTimeString } from "@/lib/sajuEngine";
import { getSajuAnalysis } from "@/lib/geminiClient";
import {
  SAJU_ANALYSIS_PROMPT_VERSION,
  buildSajuRequestFingerprint,
  ensureGuestSessionId,
  getSajuResultByFingerprint,
  saveSajuResult,
} from "@/lib/resultStore";
import { isPaidReport } from "@/lib/paidReportCatalog";
import { useFortuneStore } from "@/store/useFortuneStore";
import {
  BirthPrecision,
  CalendarType,
  DataPrivacyMode,
  FortuneCategoryId,
  Gender,
  SAJU_ANALYSIS_SERVICE_IDS,
  SAJU_NEW_YEAR_2026_SERVICE_IDS,
  SajuAnalysisResponse,
  SajuReportPayload,
  SajuServiceType,
  SectionAnalysis,
  UserBirthData,
  UserInterest,
} from "@/types/result";

type AnalysisPhase = "cache-check" | "ai-analysis" | "result-save";

const SERVICE_DEDUP_HINT: Partial<Record<SajuServiceType, string>> = {
  "saju-lifetime-roadmap": "인생 구간 변화를 관점 전사 중심으로 종합하여 작성해주세요.",
  "saju-daeun-shift": "전환 직후의 변동 원인과 비교 변동을 전환 시점/방향으로 분리해주세요.",
  "saju-career-timing": "결정의 결과와 보조 일정을 분리하고 실행 단계 기준을 명확히 해주세요.",
  "saju-wealth-flow": "수입 구조와 지출 축적 방향을 중심으로 재정 방향을 시사해주세요.",
  "saju-helper-network": "관계 레이어(가까운/직업/사회)를 구분하여 귀인 유입 시기를 명확히 해주세요.",
  "saju-energy-balance": "몰입 방식과 소진 유형 등의 균형 리듬 가이드로 작성해주세요.",
  "saju-yearly-action-calendar": "분기별 목표와 구체적 실행 체크리스트를 행동 계획의 형태로 작성해주세요.",
};

const normalizeDedupText = (value: string): string =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const TODAY_CATEGORY_IDS: ReadonlySet<FortuneCategoryId> = new Set([
  "total",
  "love",
  "wealth",
  "career",
  "study",
  "health",
]);

const isTodayCategoryId = (value: string | null): value is FortuneCategoryId =>
  value !== null && TODAY_CATEGORY_IDS.has(value as FortuneCategoryId);

const resolveTodayCategoryId = (value: string | null): FortuneCategoryId =>
  isTodayCategoryId(value) ? value : "total";

const extractPayloadSignature = (payload: SajuReportPayload): string => {
  const blockKey = (payload.analysisBlocks ?? [])
    .map((block) => [block.coreFlow, block.evidence, block.opportunities[0], block.risks[0], block.actionStrategy[0]].filter(Boolean).join("|"))
    .join("|");

  let serviceSpecific = "";
  if ("transitionSignal" in payload) serviceSpecific = payload.transitionSignal;
  if ("careerWindow" in payload) serviceSpecific = payload.careerWindow;
  if ("cashflowMap" in payload) serviceSpecific = payload.cashflowMap;
  if ("helperMap" in payload) serviceSpecific = payload.helperMap;
  if ("energyCurve" in payload) serviceSpecific = payload.energyCurve;
  if ("quarterThemes" in payload) serviceSpecific = payload.quarterThemes.join("|");
  if ("longTermFlow" in payload) serviceSpecific = payload.longTermFlow;

  return normalizeDedupText([
    payload.coreInsights.join("|"),
    payload.actionNow.join("|"),
    payload.evidence.join("|"),
    blockKey,
    serviceSpecific,
  ].join("|"));
};

const findDuplicateServices = (
  payloads: Partial<Record<SajuServiceType, SajuReportPayload>>,
  services: readonly SajuServiceType[],
): SajuServiceType[] => {
  const grouped = new Map<string, SajuServiceType[]>();

  services.forEach((service) => {
    const payload = payloads[service];
    if (!payload) {
      return;
    }
    const signature = extractPayloadSignature(payload);
    if (!signature) {
      return;
    }
    const current = grouped.get(signature) ?? [];
    current.push(service);
    grouped.set(signature, current);
  });

  const duplicates: SajuServiceType[] = [];
  grouped.forEach((servicesBySignature) => {
    if (servicesBySignature.length <= 1) {
      return;
    }
    duplicates.push(...servicesBySignature.slice(1));
  });

  return duplicates;
};

interface UseSajuAnalysisFlowParams {
  navigate: NavigateFunction;
  searchParams: URLSearchParams;
  serviceId: string | null;
  updateProfile: (data: Partial<UserBirthData> & { name?: string }) => void;
  loadResultById: (id: string) => Promise<unknown>;
  setIsSubmitting: (value: boolean) => void;
  setAnalysisPhase: (phase: AnalysisPhase) => void;
  dataPrivacyMode: DataPrivacyMode;
  calendarType: CalendarType;
  year: string;
  month: string;
  day: string;
  birthPrecision: BirthPrecision;
  timeBlock: string;
  exactTime: string;
  place: string;
  gender: Gender | null;
  name: string;
  interests: UserInterest[];
  freeQuestion: string;
}

const isSajuServiceType = (value: string): value is SajuServiceType => {
  const isAnalysisService = (SAJU_ANALYSIS_SERVICE_IDS as readonly string[]).includes(value);
  const isNewYearService = (SAJU_NEW_YEAR_2026_SERVICE_IDS as readonly string[]).includes(value);
  return value === "traditional-saju" || isAnalysisService || isNewYearService;
};

export function useSajuAnalysisFlow({
  navigate,
  searchParams,
  serviceId,
  updateProfile,
  loadResultById,
  setIsSubmitting,
  setAnalysisPhase,
  dataPrivacyMode,
  calendarType,
  year,
  month,
  day,
  birthPrecision,
  timeBlock,
  exactTime,
  place,
  gender,
  name,
  interests,
  freeQuestion,
}: UseSajuAnalysisFlowParams) {
  const analyzeWithBirthData = async (birthData: UserBirthData) => {
    const requestedMode = searchParams.get("mode");
    let targetServices: SajuServiceType[];
    let baseServiceType: SajuServiceType;

    // 서비스 선택값이 있으면 mode보다 우선 적용한다.
    if (serviceId && isSajuServiceType(serviceId)) {
      targetServices = [serviceId];
      baseServiceType = serviceId;
    } else if (requestedMode === "lifetime") {
      targetServices = ["saju-lifetime-roadmap"];
      baseServiceType = "saju-lifetime-roadmap";
    } else if (requestedMode === "new-year-2026") {
      targetServices = ["saju-2026-overview"];
      baseServiceType = "saju-2026-overview";
    } else {
      targetServices = ["traditional-saju"];
      baseServiceType = "traditional-saju";
    }

    const trimmedFreeQuestion = freeQuestion.trim() || undefined;
    const requestFingerprint = buildSajuRequestFingerprint({
      serviceType: baseServiceType,
      profileData: birthData,
      interests,
      freeQuestion: trimmedFreeQuestion,
      promptVersion: SAJU_ANALYSIS_PROMPT_VERSION,
    });

    setIsSubmitting(true);
    try {
      setAnalysisPhase("cache-check");
      const cachedResult = await getSajuResultByFingerprint(requestFingerprint);
      if (cachedResult?.id) {
        toast({
          title: "기존 분석 결과를 불러옵니다.",
          description: "동일한 요청 데이터가 있어 기존 결과를 보여드립니다.",
        });
        navigate(`/result/${cachedResult.id}`);
        return true;
      }

      const calculated = calculateSaju(birthData);
      setAnalysisPhase("ai-analysis");

      const payloadBase = {
        sajuData: {
          palja: calculated.palja,
          oheng: calculated.oheng,
          yongsin: calculated.yongsin,
          sinsal: calculated.sinsal,
          profileMeta: {
            solarDate: calculated.solarDate,
            profileData: birthData,
            birthPrecision: birthData.birthPrecision ?? "unknown",
            currentYear: new Date().getFullYear(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
        interests,
        freeQuestion: trimmedFreeQuestion,
      };

      const results = await Promise.allSettled(
        targetServices.map((service) =>
          getSajuAnalysis(
            { ...payloadBase, serviceType: service },
            { source: "manual", traceId: crypto.randomUUID() },
          ),
        ),
      );

      const reportPayloads: Partial<Record<SajuServiceType, SajuReportPayload>> = {};
      const summaries: Partial<Record<SajuServiceType, string>> = {};
      const sectionsMap: Partial<Record<SajuServiceType, SectionAnalysis[]>> = {};
      let baseAnalysis: SajuAnalysisResponse | undefined;

      results.forEach((resultItem, index) => {
        const service = targetServices[index];
        if (resultItem.status !== "fulfilled") {
          return;
        }

        const analysis = resultItem.value;
        summaries[service] = analysis.summary;
        sectionsMap[service] = analysis.sections;

        if ("reportPayload" in analysis && analysis.reportPayload) {
          reportPayloads[service] = analysis.reportPayload;
        }

        if (service === baseServiceType) {
          baseAnalysis = analysis;
        }
      });

      if (requestedMode === "lifetime") {
        const duplicateTargets = findDuplicateServices(reportPayloads, targetServices);
        if (duplicateTargets.length > 0) {
          const retryResults = await Promise.allSettled(
            duplicateTargets.map((service) =>
              getSajuAnalysis(
                {
                  ...payloadBase,
                  serviceType: service,
                  freeQuestion: [
                    trimmedFreeQuestion,
                    "[중복 제거 지시]",
                    "공통 현재 시점 설명은 1문장만 사용하세요.",
                    "특히 운세/근거/기회/리스크의 행동 방향 문장은 다른 서비스와 동일하게 반복하지 마세요.",
                    SERVICE_DEDUP_HINT[service] ?? "서비스 고유 가치를 중심으로 작성해주세요.",
                  ]
                    .filter(Boolean)
                    .join("\n"),
                },
                { source: "manual", traceId: crypto.randomUUID() },
              ),
            ),
          );

          retryResults.forEach((retryItem, retryIndex) => {
            if (retryItem.status !== "fulfilled") {
              return;
            }
            const service = duplicateTargets[retryIndex];
            const nextAnalysis = retryItem.value;
            summaries[service] = nextAnalysis.summary;
            sectionsMap[service] = nextAnalysis.sections;
            if ("reportPayload" in nextAnalysis && nextAnalysis.reportPayload) {
              reportPayloads[service] = nextAnalysis.reportPayload;
            }
            if (service === baseServiceType) {
              baseAnalysis = nextAnalysis;
            }
          });
        }
      }

      if (!baseAnalysis) {
        const firstSuccess = results.find(
          (
            resultItem,
          ): resultItem is PromiseFulfilledResult<SajuAnalysisResponse> =>
            resultItem.status === "fulfilled",
        );

        if (!firstSuccess) {
          throw new Error("모든 AI 분석이 실패했습니다.");
        }

        baseAnalysis = firstSuccess.value;
      }

      setAnalysisPhase("result-save");
      const lifetimeFields =
        "lifetimeScore" in baseAnalysis
          ? {
              lifetimeScore: baseAnalysis.lifetimeScore,
              daeunPeriods: baseAnalysis.daeunPeriods,
              goldenPeriods: baseAnalysis.goldenPeriods,
              personalityType: baseAnalysis.personalityType,
            }
          : {};

      const isPaid = isPaidReport(baseServiceType);

      const saved = await saveSajuResult({
        guestSessionId: ensureGuestSessionId(),
        dataPrivacyMode,
        requestFingerprint,
        sourceServiceId: baseServiceType,
        promptVersion: SAJU_ANALYSIS_PROMPT_VERSION,
        profileData: birthData,
        palja: calculated.palja,
        oheng: calculated.oheng,
        yongsin: calculated.yongsin,
        sinsal: calculated.sinsal,
        interests,
        freeQuestion: trimmedFreeQuestion,
        summary: baseAnalysis.summary,
        sections: baseAnalysis.sections,
        consultationType: baseServiceType,
        isLocked: isPaid,
        ...("reportTemplateVersion" in baseAnalysis
          ? { reportTemplateVersion: baseAnalysis.reportTemplateVersion }
          : {}),
        ...("reportPayload" in baseAnalysis
          ? { reportPayload: baseAnalysis.reportPayload }
          : {}),
        reportPayloads,
        summaries,
        sectionsMap,
        unlockedItems: isPaid ? [] : [baseServiceType], // 유료면 미해제, 무료면 즉시 해제 목록에 추가
        ...lifetimeFields,
      });

      const warmResultDetails = () => {
        void loadResultById(saved.id).catch(() => undefined);
      };

      if (requestedMode === "today") {
        const requestedCategoryId = searchParams.get("categoryId");
        const categoryId = resolveTodayCategoryId(requestedCategoryId);

        // 네비게이션 전에 데이터를 미리 로드하여 재분석 방지
        await loadResultById(saved.id).catch(() => undefined);
        const { fetchFortune } = useFortuneStore.getState();
        await fetchFortune(saved, "today", categoryId).catch(() => undefined);

        toast({
          title: "분석 완료",
          description: "결과 페이지로 이동합니다.",
        });

        navigate(
          `/fortune/personal${isTodayCategoryId(requestedCategoryId) ? `?categoryId=${requestedCategoryId}` : ""}`,
        );
      } else {
        toast({
          title: "분석 완료",
          description: "결과 페이지로 이동합니다.",
        });

        navigate(`/result/${saved.id}`);
        warmResultDetails();
      }

      return true;
    } catch (error) {
      toast({
        title: "분석 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !year || !month || !day || !gender) {
      toast({
        title: "입력 오류",
        description: "이름, 생년월일은 필수입니다.",
        variant: "destructive",
      });
      return;
    }

    const parsedTime = parseTimeString(exactTime);
    const birthData: UserBirthData = {
      name: name.trim(),
      calendarType,
      year: Number(year),
      month: Number(month),
      day: Number(day),
      hour: birthPrecision === "exact" ? parsedTime?.hour : undefined,
      minute: birthPrecision === "exact" ? parsedTime?.minute : undefined,
      timeBlock: birthPrecision === "time-block" ? timeBlock : undefined,
      birthPrecision,
      location: place,
      gender,
    };

    updateProfile(birthData);
    await analyzeWithBirthData(birthData);
  };

  return {
    isFormValid: Boolean(name.trim() && year && month && day && gender),
    analyzeWithBirthData,
    handleSubmit,
  };
}
