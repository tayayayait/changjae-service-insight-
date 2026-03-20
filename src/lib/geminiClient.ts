import {
  AnalysisPeriod,
  BirthPrecision,
  DaeunPeriod,
  DreamInput,
  DreamInterpretation,
  FortuneResult,
  GeminiAnalysis,
  GoldenPeriod,
  GoodDayEventType,
  GoodDayItem,
  SAJU_ANALYSIS_SERVICE_IDS,
  Oheng,
  OhengDistribution,
  Palja,
  QuickFortuneKind,
  Sinsal,
  SajuAnalysisResponse,
  SajuAnalysisServiceId,
  SajuReportPayloadMap,
  SajuServiceType,
  UserBirthData,
  UserInterest,
  YearlyFortuneResult,
} from "../types/result";
import { isSupabaseConfigured, supabase } from "./supabase";

const EDGE_FUNCTION_TIMEOUT_MS = 45_000;
const EDGE_FUNCTION_TIMEOUT_MESSAGE = "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
const EDGE_INVOKE_TIMEOUT_CODE = "EDGE_FUNCTION_TIMEOUT";

interface SajuProfileMeta {
  solarDate?: {
    year: number;
    month: number;
    day: number;
    wasConvertedFromLunar: boolean;
  };
  profileData?: UserBirthData;
  birthPrecision?: BirthPrecision;
  currentYear?: number;
  timezone?: string;
}

export interface SajuAnalysisRequest {
  serviceType: SajuServiceType;
  sajuData: {
    palja: Palja;
    oheng: OhengDistribution[];
    yongsin?: Oheng[];
    sinsal?: Sinsal[];
    profileMeta?: SajuProfileMeta;
  };
  interests: UserInterest[];
  freeQuestion?: string;
}

export interface FortuneRequest {
  sajuData: {
    palja: Palja;
    oheng: OhengDistribution[];
  };
  dateContext: {
    type: AnalysisPeriod;
    date: string;
  };
}

export interface ZodiacFortuneRequest {
  zodiac: string;
  period: AnalysisPeriod;
  date: string;
}

export interface StarSignFortuneRequest {
  starSign: string;
  period: AnalysisPeriod;
  date: string;
}

export interface DreamInterpretationRequest {
  input: DreamInput;
}

export interface YearlyFortuneRequest {
  sajuData: {
    palja: Palja;
    oheng: OhengDistribution[];
  };
  year: number;
}

export interface GoodDayCalendarRequest {
  eventType: GoodDayEventType;
  year: number;
  month: number;
}

export interface CompatibilityAnalysisRequest {
  mode: "love" | "friend" | "work";
  personA: {
    palja: Palja;
    oheng: OhengDistribution[];
  };
  personB: {
    palja: Palja;
    oheng: OhengDistribution[];
  };
}

export interface CompatibilityAnalysisResponse {
  score: number;
  summary: string;
  strengths: string[];
  cautions: string[];
  advice: string;
}

const parseJsonPayload = <T>(data: unknown): T => {
  if (typeof data === "string") {
    return JSON.parse(data) as T;
  }

  return data as T;
};

const parseErrorPayload = (data: unknown): string | null => {
  try {
    const payload = parseJsonPayload<{ error?: unknown }>(data);
    if (payload && typeof payload === "object" && typeof payload.error === "string") {
      return payload.error;
    }
    return null;
  } catch {
    return null;
  }
};

const ensureConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }
};

const withInvokeTimeout = async <T>(promise: Promise<T>, timeoutMs = EDGE_FUNCTION_TIMEOUT_MS): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        const timeoutError = new Error(EDGE_FUNCTION_TIMEOUT_MESSAGE) as Error & { code?: string };
        timeoutError.code = EDGE_INVOKE_TIMEOUT_CODE;
        reject(timeoutError);
      }, timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const isEdgeFunctionTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const timeoutCode = (error as { code?: unknown }).code;
  if (timeoutCode === EDGE_INVOKE_TIMEOUT_CODE) {
    return true;
  }

  const { name, context } = error as { name?: unknown; context?: unknown };
  if (name === "AbortError") {
    return true;
  }

  if (!context || typeof context !== "object") {
    return false;
  }

  const { name: contextName, message: contextMessage } = context as {
    name?: unknown;
    message?: unknown;
  };

  if (contextName === "AbortError") {
    return true;
  }

  if (typeof contextMessage === "string") {
    return contextMessage.toLowerCase().includes("abort");
  }

  return false;
};

const toInvokeErrorMessage = (defaultMessage: string, error: unknown): string => {
  if (isEdgeFunctionTimeoutError(error)) {
    return EDGE_FUNCTION_TIMEOUT_MESSAGE;
  }
  return defaultMessage;
};

const parseFortunePayload = (
  data: unknown,
  period: AnalysisPeriod,
  sourceKind: "personal" | QuickFortuneKind,
): FortuneResult => {
  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<FortuneResult>(data);
  if (typeof parsed.score !== "number" || typeof parsed.summary !== "string" || typeof parsed.details !== "string") {
    throw new Error("invalid-shape");
  }

  return {
    ...parsed,
    period,
    sourceKind,
  };
};

const parseSections = (value: unknown): GeminiAnalysis["sections"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      interpretation: typeof item.interpretation === "string" ? item.interpretation : "",
      advice: typeof item.advice === "string" ? item.advice : "",
      luckyTip: typeof item.luckyTip === "string" ? item.luckyTip : undefined,
    }))
    .filter((item) => item.title.length > 0 && item.interpretation.length > 0);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const toStringArray = (value: unknown, fallback: string[] = [], max = 6): string[] => {
  if (!Array.isArray(value)) {
    return fallback.slice(0, max);
  }
  const normalized = value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  return normalized.slice(0, max);
};

const normalizeOheng = (value: unknown): Oheng => {
  if (value === "목" || value === "木") return "목";
  if (value === "화" || value === "火") return "화";
  if (value === "토" || value === "土") return "토";
  if (value === "금" || value === "金") return "금";
  return "수";
};

const parseDaeunPeriods = (value: unknown): DaeunPeriod[] => {
  const currentYear = new Date().getFullYear();
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const startAge = Number(item.startAge ?? 0);
      const endAge = Number(item.endAge ?? 0);
      const startYear = Number(item.startYear ?? NaN);
      const endYear = Number(item.endYear ?? NaN);
      const isCurrentByYear =
        Number.isFinite(startYear) && Number.isFinite(endYear)
          ? currentYear >= startYear && currentYear <= endYear
          : false;

      return {
        startAge,
        endAge,
        startYear: Number.isFinite(startYear) ? startYear : undefined,
        endYear: Number.isFinite(endYear) ? endYear : undefined,
        gan: typeof item.gan === "string" ? item.gan : "",
        ji: typeof item.ji === "string" ? item.ji : "",
        oheng: normalizeOheng(item.oheng),
        score: Number(item.score ?? 0),
        keyword: typeof item.keyword === "string" ? item.keyword : undefined,
        isCurrent: typeof item.isCurrent === "boolean" ? item.isCurrent : isCurrentByYear,
      };
    })
    .filter((item) => item.startAge >= 0 && item.endAge >= item.startAge && item.gan.length > 0 && item.ji.length > 0);
};

const parseGoldenPeriods = (value: unknown): GoldenPeriod[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => {
      const startYear = Number(item.startYear ?? NaN);
      const endYear = Number(item.endYear ?? NaN);
      return {
        startAge: Number(item.startAge ?? 0),
        endAge: Number(item.endAge ?? 0),
        startYear: Number.isFinite(startYear) ? startYear : undefined,
        endYear: Number.isFinite(endYear) ? endYear : undefined,
        reason: typeof item.reason === "string" ? item.reason : "",
      };
    })
    .filter((item) => item.endAge >= item.startAge && item.reason.length > 0);
};

const parseCommonAnalysis = (data: unknown) => {
  const parsed = parseJsonPayload<Record<string, unknown>>(data);
  const sections = parseSections(parsed.sections);
  const summary = typeof parsed.summary === "string" ? parsed.summary : "";
  if (!summary || sections.length === 0) {
    throw new Error("invalid-shape");
  }

  const payload = isRecord(parsed.reportPayload) ? parsed.reportPayload : {};
  const coreInsightsFallback = sections.map((item) => item.interpretation).filter(Boolean).slice(0, 3);
  const actionNowFallback = sections.map((item) => item.advice).filter(Boolean).slice(0, 3);
  const evidenceFallback = sections.map((item) => item.title).filter(Boolean).slice(0, 3);

  return {
    parsed,
    summary,
    sections,
    reportTemplateVersion:
      typeof parsed.reportTemplateVersion === "string" && parsed.reportTemplateVersion.length > 0
        ? parsed.reportTemplateVersion
        : "saju-report-v2",
    payload,
    commonPayload: {
      coreInsights: toStringArray(payload.coreInsights, coreInsightsFallback, 4),
      actionNow: toStringArray(payload.actionNow, actionNowFallback, 4),
      evidence: toStringArray(payload.evidence, evidenceFallback, 4),
    },
  };
};

const parseLifetimeAnalysisPayload = (data: unknown): SajuAnalysisResponse => {
  const base = parseCommonAnalysis(data);
  const parsed = base.parsed;

  const lifetimeScore = Number(parsed.lifetimeScore ?? NaN);
  const daeunPeriods = parseDaeunPeriods(parsed.daeunPeriods);
  const goldenPeriods = parseGoldenPeriods(parsed.goldenPeriods);
  if (!Number.isFinite(lifetimeScore)) {
    throw new Error("invalid-shape");
  }

  const personalityRaw = isRecord(parsed.personalityType) ? parsed.personalityType : {};
  return {
    serviceType: "saju-lifetime-roadmap",
    summary: base.summary,
    sections: base.sections,
    reportTemplateVersion: base.reportTemplateVersion,
    reportPayload: {
      ...base.commonPayload,
      longTermFlow:
        typeof base.payload.longTermFlow === "string" && base.payload.longTermFlow.length > 0
          ? base.payload.longTermFlow
          : base.summary,
      pivotMoments: toStringArray(base.payload.pivotMoments, daeunPeriods.map((item) => item.keyword ?? "").filter(Boolean), 4),
      tenYearStrategy: toStringArray(base.payload.tenYearStrategy, base.commonPayload.actionNow, 4),
    },
    lifetimeScore: Math.max(0, Math.min(100, Math.round(lifetimeScore))),
    daeunPeriods,
    goldenPeriods,
    personalityType: {
      title: typeof personalityRaw.title === "string" ? personalityRaw.title : "",
      description: typeof personalityRaw.description === "string" ? personalityRaw.description : "",
      strengths: toStringArray(personalityRaw.strengths, [], 4),
      weaknesses: toStringArray(personalityRaw.weaknesses, [], 4),
    },
  };
};

const parseSajuPayloadByService = <K extends Exclude<SajuAnalysisServiceId, "saju-lifetime-roadmap">>(
  data: unknown,
  serviceType: K,
): SajuAnalysisResponse => {
  const base = parseCommonAnalysis(data);
  const payload = base.payload;
  let reportPayload: SajuReportPayloadMap[K];

  switch (serviceType) {
    case "saju-daeun-shift":
      reportPayload = {
        ...base.commonPayload,
        transitionSignal:
          typeof payload.transitionSignal === "string" && payload.transitionSignal.length > 0
            ? payload.transitionSignal
            : base.summary,
        ninetyDayActions: toStringArray(payload.ninetyDayActions, base.commonPayload.actionNow, 4),
        avoidanceScenario: toStringArray(payload.avoidanceScenario, base.commonPayload.evidence, 4),
      } as SajuReportPayloadMap[K];
      break;
    case "saju-career-timing":
      reportPayload = {
        ...base.commonPayload,
        careerWindow:
          typeof payload.careerWindow === "string" && payload.careerWindow.length > 0
            ? payload.careerWindow
            : base.summary,
        decisionTree: toStringArray(payload.decisionTree, base.commonPayload.coreInsights, 4),
        executionChecklist: toStringArray(payload.executionChecklist, base.commonPayload.actionNow, 4),
      } as SajuReportPayloadMap[K];
      break;
    case "saju-wealth-flow":
      reportPayload = {
        ...base.commonPayload,
        cashflowMap:
          typeof payload.cashflowMap === "string" && payload.cashflowMap.length > 0
            ? payload.cashflowMap
            : base.summary,
        riskZones: toStringArray(payload.riskZones, base.commonPayload.evidence, 4),
        assetRules: toStringArray(payload.assetRules, base.commonPayload.actionNow, 4),
      } as SajuReportPayloadMap[K];
      break;
    case "saju-helper-network":
      reportPayload = {
        ...base.commonPayload,
        helperMap: typeof payload.helperMap === "string" && payload.helperMap.length > 0 ? payload.helperMap : base.summary,
        conflictPatterns: toStringArray(payload.conflictPatterns, base.commonPayload.evidence, 4),
        networkGuide: toStringArray(payload.networkGuide, base.commonPayload.actionNow, 4),
      } as SajuReportPayloadMap[K];
      break;
    case "saju-energy-balance":
      reportPayload = {
        ...base.commonPayload,
        energyCurve: typeof payload.energyCurve === "string" && payload.energyCurve.length > 0 ? payload.energyCurve : base.summary,
        routineDesign: toStringArray(payload.routineDesign, base.commonPayload.actionNow, 4),
        recoveryProtocol: toStringArray(payload.recoveryProtocol, base.commonPayload.evidence, 4),
      } as SajuReportPayloadMap[K];
      break;
    case "saju-yearly-action-calendar":
      reportPayload = {
        ...base.commonPayload,
        quarterlyGoals: toStringArray(payload.quarterlyGoals, base.commonPayload.coreInsights, 4),
        monthlyActions: toStringArray(payload.monthlyActions, base.commonPayload.actionNow, 4),
        riskCalendar: toStringArray(payload.riskCalendar, base.commonPayload.evidence, 4),
      } as SajuReportPayloadMap[K];
      break;
    default:
      throw new Error(`unsupported service type: ${serviceType}`);
  }

  return {
    serviceType,
    summary: base.summary,
    sections: base.sections,
    reportTemplateVersion: base.reportTemplateVersion,
    reportPayload,
  };
};

const parseTraditionalAnalysisPayload = (data: unknown): SajuAnalysisResponse => {
  const parsed = parseJsonPayload<Record<string, unknown>>(data);
  const sections = parseSections(parsed.sections);
  if (typeof parsed.summary !== "string" || sections.length === 0) {
    throw new Error("invalid-shape");
  }

  return {
    serviceType: "traditional-saju",
    summary: parsed.summary,
    sections,
  };
};

const isSpecializedSajuService = (serviceType: SajuServiceType): serviceType is SajuAnalysisServiceId => {
  return SAJU_ANALYSIS_SERVICE_IDS.includes(serviceType as SajuAnalysisServiceId);
};

export const getSajuAnalysis = async (req: SajuAnalysisRequest): Promise<SajuAnalysisResponse> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("saju-lifetime-api", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (saju-lifetime-api):", error);
    throw new Error(toInvokeErrorMessage("사주 분석 데이터를 불러오는 데 실패했습니다.", error));
  }

  try {
    if (req.serviceType === "traditional-saju") {
      return parseTraditionalAnalysisPayload(data);
    }
    if (!isSpecializedSajuService(req.serviceType)) {
      throw new Error(`unsupported service type: ${req.serviceType}`);
    }
    if (req.serviceType === "saju-lifetime-roadmap") {
      return parseLifetimeAnalysisPayload(data);
    }
    return parseSajuPayloadByService(data, req.serviceType);
  } catch (parseError) {
    console.error("Failed to parse Gemini analysis response:", parseError);
    throw new Error("AI 분석 결과 형식이 올바르지 않습니다.");
  }
};

export const getDailyFortune = async (req: FortuneRequest): Promise<FortuneResult> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("saju-daily-api", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (saju-daily-api):", error);
    throw new Error(toInvokeErrorMessage("운세 데이터를 불러오는 데 실패했습니다.", error));
  }

  try {
    return parseFortunePayload(data, req.dateContext.type, "personal");
  } catch (parseError) {
    console.error("Failed to parse Gemini fortune response:", parseError);
    throw new Error("AI 운세 결과 형식이 올바르지 않습니다.");
  }
};

export const getZodiacFortune = async (req: ZodiacFortuneRequest): Promise<FortuneResult> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("zodiac-fortune", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (zodiac-fortune):", error);
    throw new Error(toInvokeErrorMessage("띠 운세 데이터를 불러오는 데 실패했습니다.", error));
  }

  try {
    return parseFortunePayload(data, req.period, "zodiac");
  } catch (parseError) {
    console.error("Failed to parse zodiac fortune response:", parseError);
    throw new Error("띠 운세 결과 형식이 올바르지 않습니다.");
  }
};

export const getStarSignFortune = async (req: StarSignFortuneRequest): Promise<FortuneResult> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("star-sign-fortune", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (star-sign-fortune):", error);
    throw new Error(toInvokeErrorMessage("별자리 운세 데이터를 불러오는 데 실패했습니다.", error));
  }

  try {
    return parseFortunePayload(data, req.period, "starSign");
  } catch (parseError) {
    console.error("Failed to parse star-sign fortune response:", parseError);
    throw new Error("별자리 운세 결과 형식이 올바르지 않습니다.");
  }
};

export const getDreamInterpretation = async (req: DreamInterpretationRequest): Promise<DreamInterpretation> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("dream-interpretation", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (dream-interpretation):", error);
    throw new Error(toInvokeErrorMessage("꿈해몽 데이터를 불러오는 데 실패했습니다.", error));
  }

  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<DreamInterpretation>(data);
  if (typeof parsed.summary !== "string" || typeof parsed.advice !== "string") {
    throw new Error("AI 꿈해몽 결과 형식이 올바르지 않습니다.");
  }

  return {
    ...parsed,
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
  };
};

export const getYearlyFortune = async (req: YearlyFortuneRequest): Promise<YearlyFortuneResult> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("saju-yearly-api", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (saju-yearly-api):", error);
    throw new Error(toInvokeErrorMessage("연간 운세 데이터를 불러오는 데 실패했습니다.", error));
  }

  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<YearlyFortuneResult>(data);
  if (!Array.isArray(parsed.months) || typeof parsed.summary !== "string" || typeof parsed.year !== "number") {
    throw new Error("AI 연간 운세 결과 형식이 올바르지 않습니다.");
  }

  return {
    ...parsed,
    focus: Array.isArray(parsed.focus) ? parsed.focus : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
    months: parsed.months
      .map((month, index) => ({
        month: Math.min(12, Math.max(1, Number(month.month ?? index + 1))),
        score: Number(month.score ?? 0),
        summary: typeof month.summary === "string" ? month.summary : "",
      }))
      .sort((left, right) => left.month - right.month),
  };
};

export const getGoodDayCalendar = async (req: GoodDayCalendarRequest): Promise<GoodDayItem[]> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("good-day-calendar", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (good-day-calendar):", error);
    throw new Error(toInvokeErrorMessage("길일 캘린더 데이터를 불러오는 데 실패했습니다.", error));
  }

  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<{ items?: GoodDayItem[] } | GoodDayItem[]>(data);
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];

  return items
    .filter((item) => typeof item.date === "string" && typeof item.reason === "string")
    .map((item) => ({
      date: item.date,
      score: Number(item.score ?? 0),
      reason: item.reason,
      caution: typeof item.caution === "string" ? item.caution : undefined,
    }));
};

export const analyzeCompatibility = async (
  req: CompatibilityAnalysisRequest,
): Promise<CompatibilityAnalysisResponse> => {
  ensureConfigured();

  const { data, error } = await withInvokeTimeout(
    supabase.functions.invoke("analyze-compatibility", {
      body: req,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
  );

  if (error) {
    console.error("Edge Function Error (analyze-compatibility):", error);
    throw new Error(toInvokeErrorMessage("궁합 분석 데이터를 불러오는 데 실패했습니다.", error));
  }

  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<CompatibilityAnalysisResponse>(data);
  if (typeof parsed.score !== "number" || typeof parsed.summary !== "string") {
    throw new Error("AI 궁합 결과 형식이 올바르지 않습니다.");
  }

  return {
    ...parsed,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    cautions: Array.isArray(parsed.cautions) ? parsed.cautions : [],
  };
};
