import {
  AttentionLevel,
  AnalysisPeriod,
  BirthPrecision,
  ChangeSignalLevel,
  ChatRequest,
  ChatResponse,
  DaeunPeriod,
  DreamInput,
  DreamInterpretation,
  FortuneResult,
  GeminiAnalysis,
  GoldenPeriod,
  GoodDayEventType,
  GoodDayItem,
  SAJU_ANALYSIS_SERVICE_IDS,
  SAJU_NEW_YEAR_2026_SERVICE_IDS,
  Oheng,
  OhengDistribution,
  Palja,
  QuickFortuneKind,
  Sinsal,
  SajuAnalysisResponse,
  SajuAnalysisServiceId,
  SajuAnalysisBlock,
  SajuCareerStageFlowItem,
  SajuDaeunPhaseRoadmapItem,
  SajuHelperPhaseRoadmapItem,
  InterpretationIntensityLevel,
  NewYear2026CareerPayload,
  NewYear2026HealthPayload,
  NewYear2026InvestmentActionReport,
  NewYear2026InvestmentAssetClassGuides,
  NewYear2026InvestmentQuarterlyFlow,
  NewYear2026InvestmentSignalBoard,
  NewYear2026InvestmentPayload,
  NewYear2026LovePayload,
  NewYear2026OverviewPayload,
  NewYear2026ReportPayload,
  NewYear2026StudyActionReport,
  NewYear2026StudyExamPayload,
  NewYear2026WealthBusinessPayload,
  NewYearConsumerFaqItem,
  NewYearFocusCard,
  NewYearFocusId,
  NewYearTimelineNode,
  FortuneCategoryId,
  SajuNewYear2026ServiceId,
  SajuReportPayloadMap,
  SajuReportSupplement,
  SajuReportSupplementExecutionProtocol,
  SajuReportSupplementVisualExplainer,
  SajuReportSupplementVisualType,
  SajuServiceType,
  SajuWealthLifecyclePhaseType,
  SajuWealthLifecycleStage,
  UserBirthData,
  UserInterest,
  YearlyFortuneResult,
} from "../types/result";
import { isSupabaseConfigured, supabase } from "./supabase";
import { buildDeterministicEnergyTrend, buildDeterministicWealthTrend } from "./sajuTrendEngine";

const EDGE_FUNCTION_TIMEOUT_MS = 45_000;
const EDGE_FUNCTION_TIMEOUT_MESSAGE = "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
const EDGE_INVOKE_TIMEOUT_CODE = "EDGE_FUNCTION_TIMEOUT";
const EDGE_UPSTREAM_TIMEOUT_CODE = "UPSTREAM_TIMEOUT";
const SAJU_ANALYSIS_MAX_ATTEMPTS = 3;
const SAJU_ANALYSIS_RETRY_DELAY_MS = 1_200;

const SAJU_ANALYSIS_TIMEOUT_MS_BY_SOURCE = {
  manual: 60_000,
  "profile-auto": 60_000,
} as const;

const SAJU_ANALYSIS_TIMEOUT_FLOOR_MS_BY_SERVICE: Partial<Record<SajuServiceType, number>> = {
  "saju-daeun-shift": 65_000,
  "saju-lifetime-roadmap": 60_000,
  "saju-yearly-action-calendar": 60_000,
};

const RUNTIME_ENV = ((import.meta as unknown as { env?: Record<string, unknown> }).env ?? {}) as Record<string, unknown>;
const IS_VITEST_RUNTIME = Boolean(RUNTIME_ENV.VITEST);
const IS_JSDOM_RUNTIME =
  typeof navigator !== "undefined" &&
  typeof navigator.userAgent === "string" &&
  navigator.userAgent.toLowerCase().includes("jsdom");
const SAJU_LIFETIME_FUNCTION_NAME = "saju-lifetime-api";
const SAJU_YEARLY_FUNCTION_NAME = "saju-yearly-api";
const SAJU_CHAT_FUNCTION_NAME = "saju-chat-api";
const GUEST_STORAGE_KEY = "saju:guest-session-id";

export type SajuAnalysisSource = keyof typeof SAJU_ANALYSIS_TIMEOUT_MS_BY_SOURCE;

export interface GetSajuAnalysisOptions {
  source?: SajuAnalysisSource;
  traceId?: string;
}

type SajuAnalysisTimeoutClass = "client_watchdog" | "edge_504" | "edge_503" | "transport" | "other";
type ChatTimeoutClass = SajuAnalysisTimeoutClass;

interface SajuAnalysisErrorPayload {
  error?: string;
  code?: string;
  traceId?: string;
  elapsedMs?: number;
  serviceType?: string;
}

interface SajuAnalysisFailure {
  classification: SajuAnalysisTimeoutClass;
  status?: number;
  code?: string;
  traceId?: string;
  payload?: SajuAnalysisErrorPayload | null;
  rawError: unknown;
}

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

interface SajuAnalysisInvokeBody extends SajuAnalysisRequest {
  requestMeta: {
    source: SajuAnalysisSource;
    traceId?: string;
  };
}

export interface FortuneRequest {
  sajuData: {
    palja: Palja;
    oheng: OhengDistribution[];
  };
  categoryId: FortuneCategoryId;
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

const parseStructuredErrorPayload = (data: unknown): SajuAnalysisErrorPayload | null => {
  try {
    const payload = parseJsonPayload<SajuAnalysisErrorPayload>(data);
    if (!payload || typeof payload !== "object") {
      return null;
    }
    return payload;
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

interface EdgeInvokeResponse {
  data: unknown;
  error: unknown;
}

const resolveGuestIdForDirectFetch = () => {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(GUEST_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated = createTraceId();
  window.localStorage.setItem(GUEST_STORAGE_KEY, generated);
  return generated;
};

const invokeFunctionViaDirectFetch = async (
  functionName: string,
  body: unknown,
  timeoutMs: number,
): Promise<EdgeInvokeResponse> => {
  const supabaseUrl = typeof RUNTIME_ENV.VITE_SUPABASE_URL === "string" ? RUNTIME_ENV.VITE_SUPABASE_URL.trim() : "";
  const anonKey = typeof RUNTIME_ENV.VITE_SUPABASE_ANON_KEY === "string" ? RUNTIME_ENV.VITE_SUPABASE_ANON_KEY.trim() : "";
  if (!supabaseUrl || !anonKey || typeof fetch !== "function") {
    throw new Error("direct_fetch_unavailable");
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, "")}/functions/v1/${functionName}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const guestId = resolveGuestIdForDirectFetch();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        ...(guestId ? { "x-guest-id": guestId } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (response.ok) {
      return { data: parsed, error: null };
    }

    return {
      data: parsed,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: {
          status: response.status,
          message: typeof parsed === "string" ? parsed : JSON.stringify(parsed),
        },
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(EDGE_FUNCTION_TIMEOUT_MESSAGE) as Error & { code?: string };
      timeoutError.code = EDGE_INVOKE_TIMEOUT_CODE;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const invokeSajuAnalysisViaDirectFetch = async (
  functionName: string,
  body: SajuAnalysisInvokeBody,
  timeoutMs: number,
): Promise<EdgeInvokeResponse> => invokeFunctionViaDirectFetch(functionName, body, timeoutMs);

const invokeSajuChatViaDirectFetch = async (body: ChatRequest, timeoutMs: number): Promise<EdgeInvokeResponse> =>
  invokeFunctionViaDirectFetch(SAJU_CHAT_FUNCTION_NAME, body, timeoutMs);

const hasErrorCode = (error: unknown, code: string): boolean =>
  Boolean(error) && typeof error === "object" && (error as { code?: unknown }).code === code;

const getInvokeErrorContext = (error: unknown): Record<string, unknown> | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const context = (error as { context?: unknown }).context;
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return null;
  }

  return context as Record<string, unknown>;
};

const getInvokeErrorStatus = (error: unknown): number | null => {
  const context = getInvokeErrorContext(error);
  return typeof context?.status === "number" ? context.status : null;
};

const parseContextErrorPayload = (error: unknown): SajuAnalysisErrorPayload | null => {
  const context = getInvokeErrorContext(error);
  if (!context || typeof context.message !== "string") {
    return null;
  }

  return parseStructuredErrorPayload(context.message);
};

const isEdgeFunctionTimeoutError = (error: unknown): boolean => {
  if (hasErrorCode(error, EDGE_INVOKE_TIMEOUT_CODE)) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
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

const isUpstreamTimeoutError = (error: unknown, data?: unknown): boolean => {
  const payload = parseStructuredErrorPayload(data) ?? parseContextErrorPayload(error);
  return getInvokeErrorStatus(error) === 504 || payload?.code === EDGE_UPSTREAM_TIMEOUT_CODE;
};

const toInvokeErrorMessage = (defaultMessage: string, error: unknown, data?: unknown): string => {
  if (isEdgeFunctionTimeoutError(error)) {
    return EDGE_FUNCTION_TIMEOUT_MESSAGE;
  }
  if (isUpstreamTimeoutError(error, data)) {
    return EDGE_FUNCTION_TIMEOUT_MESSAGE;
  }

  const payload = parseStructuredErrorPayload(data) ?? parseContextErrorPayload(error);
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  return defaultMessage;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const collectErrorMessages = (error: unknown): string[] => {
  if (!error || typeof error !== "object") {
    return [];
  }

  const messages: string[] = [];
  const { message, context } = error as { message?: unknown; context?: unknown };

  if (typeof message === "string" && message.trim()) {
    messages.push(message.toLowerCase());
  }

  if (typeof context === "string" && context.trim()) {
    messages.push(context.toLowerCase());
  }

  if (context && typeof context === "object") {
    const { message: contextMessage, status } = context as { message?: unknown; status?: unknown };
    if (typeof contextMessage === "string" && contextMessage.trim()) {
      messages.push(contextMessage.toLowerCase());
    }
    if (typeof status === "number") {
      messages.push(String(status));
    }
  }

  return messages;
};

const classifySajuAnalysisFailure = (error: unknown, data?: unknown): SajuAnalysisFailure => {
  const payload = parseStructuredErrorPayload(data) ?? parseContextErrorPayload(error);
  const status =
    getInvokeErrorStatus(error) ??
    (typeof payload?.elapsedMs === "number" && payload.code === EDGE_UPSTREAM_TIMEOUT_CODE ? 504 : undefined);

  if (hasErrorCode(error, EDGE_INVOKE_TIMEOUT_CODE)) {
    return {
      classification: "client_watchdog",
      status,
      code: EDGE_INVOKE_TIMEOUT_CODE,
      traceId: payload?.traceId,
      payload,
      rawError: error,
    };
  }

  if (status === 504 || payload?.code === EDGE_UPSTREAM_TIMEOUT_CODE) {
    return {
      classification: "edge_504",
      status: 504,
      code: payload?.code ?? EDGE_UPSTREAM_TIMEOUT_CODE,
      traceId: payload?.traceId,
      payload,
      rawError: error,
    };
  }

  if (status === 503) {
    return {
      classification: "edge_503",
      status: 503,
      code: payload?.code,
      traceId: payload?.traceId,
      payload,
      rawError: error,
    };
  }

  const messages = collectErrorMessages(error);
  if (messages.some((message) => message.includes("network") || message.includes("fetch") || message.includes("failed to send a request"))) {
    return {
      classification: "transport",
      status,
      code: payload?.code,
      traceId: payload?.traceId,
      payload,
      rawError: error,
    };
  }

  return {
    classification: "other",
    status,
    code: payload?.code,
    traceId: payload?.traceId,
    payload,
    rawError: error,
  };
};

const shouldRetrySajuAnalysisFailure = (
  failure: SajuAnalysisFailure,
  source: SajuAnalysisSource,
  serviceType: SajuServiceType,
): boolean => {
  if (failure.classification === "edge_503" || failure.classification === "transport") {
    return true;
  }

  // 대운 전환 서비스의 profile-auto 경로에서 드물게 invoke가 영원 대기 상태로 걸리는 케이스를 1회 재시도한다.
  if (
    failure.classification === "client_watchdog" &&
    source === "profile-auto" &&
    (serviceType === "saju-daeun-shift" || SAJU_NEW_YEAR_2026_SERVICE_IDS.includes(serviceType as SajuNewYear2026ServiceId))
  ) {
    return true;
  }

  return false;
};

const shouldUseDirectFetchFallback = (
  failure: SajuAnalysisFailure,
  source: SajuAnalysisSource,
  serviceType: SajuServiceType,
): boolean => {
  if (IS_VITEST_RUNTIME || IS_JSDOM_RUNTIME) {
    return false;
  }

  return (
    failure.classification === "client_watchdog" &&
    source === "profile-auto" &&
    (serviceType === "saju-daeun-shift" || SAJU_NEW_YEAR_2026_SERVICE_IDS.includes(serviceType as SajuNewYear2026ServiceId))
  );
};

const shouldUseDirectFetchPrimary = (source: SajuAnalysisSource, serviceType: SajuServiceType): boolean => {
  if (IS_VITEST_RUNTIME || IS_JSDOM_RUNTIME) {
    return false;
  }

  return (
    source === "profile-auto" &&
    (serviceType === "saju-daeun-shift" || SAJU_NEW_YEAR_2026_SERVICE_IDS.includes(serviceType as SajuNewYear2026ServiceId))
  );
};

type ChatTransport = "invoke" | "direct-fetch";

const shouldUseDirectFetchPrimaryForChat = (): boolean => {
  if (IS_VITEST_RUNTIME || IS_JSDOM_RUNTIME) {
    return false;
  }

  return true;
};

const shouldUseDirectFetchFallbackForChat = (failure: SajuAnalysisFailure): boolean =>
  failure.classification === "client_watchdog" ||
  failure.classification === "transport" ||
  failure.classification === "edge_503";

const invokeChatByTransport = async (transport: ChatTransport, body: ChatRequest): Promise<EdgeInvokeResponse> => {
  if (transport === "direct-fetch") {
    return invokeSajuChatViaDirectFetch(body, EDGE_FUNCTION_TIMEOUT_MS);
  }

  return withInvokeTimeout(
    supabase.functions.invoke(SAJU_CHAT_FUNCTION_NAME, {
      body,
      timeout: EDGE_FUNCTION_TIMEOUT_MS,
    }),
    EDGE_FUNCTION_TIMEOUT_MS,
  );
};

const resolveSajuAnalysisTimeoutMs = (source: SajuAnalysisSource, serviceType: SajuServiceType): number => {
  const sourceBudget = SAJU_ANALYSIS_TIMEOUT_MS_BY_SOURCE[source];
  const serviceFloor = SAJU_ANALYSIS_TIMEOUT_FLOOR_MS_BY_SERVICE[serviceType] ?? 0;
  return Math.max(sourceBudget, serviceFloor);
};

const toSajuAnalysisError = (
  defaultMessage: string,
  failure: SajuAnalysisFailure,
  source: SajuAnalysisSource,
  traceId?: string,
) => {
  const nextError = new Error(toInvokeErrorMessage(defaultMessage, failure.rawError, failure.payload)) as Error & {
    timeoutClass?: SajuAnalysisTimeoutClass;
    traceId?: string;
    source?: SajuAnalysisSource;
    status?: number;
    code?: string;
  };

  nextError.timeoutClass = failure.classification;
  nextError.traceId = failure.traceId ?? traceId;
  nextError.source = source;
  nextError.status = failure.status;
  nextError.code = failure.code;

  return nextError;
};

const createTraceId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `trace-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toChatInvokeError = (defaultMessage: string, failure: SajuAnalysisFailure, traceId: string) => {
  const nextError = new Error(toInvokeErrorMessage(defaultMessage, failure.rawError, failure.payload)) as Error & {
    timeoutClass?: ChatTimeoutClass;
    traceId?: string;
    status?: number;
    code?: string;
  };

  nextError.timeoutClass = failure.classification;
  nextError.traceId = failure.traceId ?? traceId;
  nextError.status = failure.status;
  nextError.code = failure.code;

  return nextError;
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

const toStringValue = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeOheng = (value: unknown): Oheng => {
  if (value === "목" || value === "木") return "목";
  if (value === "화" || value === "火") return "화";
  if (value === "토" || value === "土") return "토";
  if (value === "금" || value === "金") return "금";
  return "수";
};

const SERVICE_CORE_QUESTIONS: Record<SajuAnalysisServiceId, string> = {
  "saju-lifetime-roadmap": "내 인생 흐름이 어떤 단계로 전개되는가?",
  "saju-daeun-shift": "지금 전환기에서 무엇이 바뀌고 어떻게 대비할까?",
  "saju-career-timing": "내 커리어는 어떤 단계에 있고 다음 전환은 언제 오는가?",
  "saju-wealth-flow": "내 인생 전체 자산 흐름과 재정 운영 패턴은 어떻게 전개되는가?",
  "saju-helper-network": "어떤 관계를 넓히고 어떤 갈등을 끊어야 할까?",
  "saju-energy-balance": "내 에너지를 어떻게 써야 오래 성과를 낼까?",
  "saju-yearly-action-calendar": "올해 실행이 내 인생 단계 전환과 장기 축적에 어떻게 연결되는가?",
};

const SUPPLEMENT_VISUAL_TYPE_BY_SERVICE: Record<SajuAnalysisServiceId, SajuReportSupplementVisualType> = {
  "saju-lifetime-roadmap": "timeline",
  "saju-daeun-shift": "before-after",
  "saju-career-timing": "decision-matrix",
  "saju-wealth-flow": "flow-radar",
  "saju-helper-network": "network-map",
  "saju-energy-balance": "energy-wave",
  "saju-yearly-action-calendar": "calendar-map",
};

const SUPPLEMENT_VISUAL_TITLE_BY_SERVICE: Record<SajuAnalysisServiceId, string> = {
  "saju-lifetime-roadmap": "4구간 서사 타임라인",
  "saju-daeun-shift": "전환 전/중/후 델타 카드",
  "saju-career-timing": "결정 매트릭스",
  "saju-wealth-flow": "인생 자산 사이클 맵",
  "saju-helper-network": "관계 레이어 네트워크 맵",
  "saju-energy-balance": "에너지 파형 설명",
  "saju-yearly-action-calendar": "분기-월 실행 캘린더 맵",
};

const SUPPLEMENT_CHECKPOINT_FALLBACKS: Record<SajuAnalysisServiceId, string[]> = {
  "saju-lifetime-roadmap": [
    "지금 단계에서 다음 단계로 넘어가기 전에 정리해야 할 항목은 무엇인가?",
    "이번 90일 안에 전환 신호를 확인할 수 있는 행동을 실행했는가?",
  ],
  "saju-daeun-shift": [
    "전환 전/중/후 대응 우선순위를 분리했는가?",
    "이번 주에 전환기 오판을 줄이기 위한 점검 루틴을 실행했는가?",
  ],
  "saju-career-timing": [
    "지금 결정할 일과 보류할 일을 문장으로 구분했는가?",
    "2주 결정 스프린트와 4주 실행 체크를 일정에 반영했는가?",
  ],
  "saju-wealth-flow": [
    "월간 누수 지점을 숫자로 기록하고 차단했는가?",
    "축적/확장 자금 배분과 손실 한도 규칙을 고정했는가?",
  ],
  "saju-helper-network": [
    "가까운 관계/협업/사회 레이어를 분리해서 관리하고 있는가?",
    "반복 갈등 루프를 끊기 위한 경계 문장을 실제로 사용했는가?",
  ],
  "saju-energy-balance": [
    "0~2년/3~5년/6~10년 운영 기준을 문장으로 고정해 실제 일정에 반영했는가?",
    "이번 4주/12주 리듬 점검에서 회복 하한을 지키고 소진 경보에 즉시 대응했는가?",
  ],
  "saju-yearly-action-calendar": [
    "분기 목표와 월별 행동이 실제 일정에 연결되어 있는가?",
    "지연이 발생했을 때 복구 시나리오를 즉시 실행했는가?",
  ],
};

const SUPPLEMENT_OWNERSHIP_RULES: Record<
  SajuAnalysisServiceId,
  { focusAxis: string; forbiddenKeywords: string[] }
> = {
  "saju-lifetime-roadmap": {
    focusAxis: "장기 인생 서사",
    forbiddenKeywords: ["이직", "직무", "연봉", "현금흐름", "비상자금", "관계 레이어", "캘린더"],
  },
  "saju-daeun-shift": {
    focusAxis: "전환 리스크 대응",
    forbiddenKeywords: [
      "장기 로드맵",
      "평생",
      "직무 적합",
      "재무 배분",
      "월간 캘린더",
      "주식",
      "비트코인",
      "코인",
      "투자",
      "레버리지",
      "자산",
    ],
  },
  "saju-career-timing": {
    focusAxis: "커리어 의사결정",
    forbiddenKeywords: ["비상자금", "지출 누수", "관계 레이어", "회복 슬롯", "분기 캘린더"],
  },
  "saju-wealth-flow": {
    focusAxis: "재무 운영 규칙",
    forbiddenKeywords: ["직무 적합", "이직 타이밍", "관계 갈등", "에너지 파형", "분기 목표"],
  },
  "saju-helper-network": {
    focusAxis: "관계/협업 운영",
    forbiddenKeywords: ["비상자금", "손실 한도", "회복 슬롯", "분기-월 캘린더", "직무 매트릭스"],
  },
  "saju-energy-balance": {
    focusAxis: "에너지 운영",
    forbiddenKeywords: ["재무 배분", "손실 한도", "분기 목표", "관계 레이어", "투자 레버리지"],
  },
  "saju-yearly-action-calendar": {
    focusAxis: "생애 연결형 연간 실행 운영",
    forbiddenKeywords: ["직무 적합 매트릭스", "손실 한도", "관계 갈등 루프", "소진 조기경보"],
  },
};

const NEW_YEAR_CORE_QUESTIONS: Record<SajuNewYear2026ServiceId, string> = {
  "saju-2026-overview": "2026년 전체 흐름에서 가장 먼저 잡아야 할 핵심은 무엇인가?",
  "saju-2026-study-exam": "2026년 시험·학업 흐름에서 성과를 높이려면 무엇을 우선해야 하는가?",
  "saju-2026-yearly-outlook": "2026년 분기별로 무엇을 밀고 무엇을 조심해야 하는가?",
  "saju-love-focus": "2026년 연애·결혼 흐름에서 관계의 속도와 방향을 어떻게 잡아야 하는가?",
  "saju-2026-wealth-business": "2026년 재물·사업 판단에서 수익과 리스크를 어떻게 균형 잡아야 하는가?",
  "saju-2026-investment-assets": "2026년 주식·부동산 투자 판단에서 언제 진입하고 언제 관망해야 하는가?",
  "saju-2026-career-aptitude": "2026년 직업·적성 관점에서 어떤 선택이 성과로 이어지는가?",
  "saju-2026-health-balance": "2026년 건강 리듬에서 무엇을 줄이고 무엇을 강화해야 하는가?",
};

const NEW_YEAR_FOCUS_ORDER: Array<{ focusId: NewYearFocusId; focusLabel: string }> = [
  { focusId: "saju-2026-overview", focusLabel: "종합" },
  { focusId: "saju-2026-study-exam", focusLabel: "시험·학업" },
  { focusId: "saju-love-focus", focusLabel: "연애·결혼" },
  { focusId: "saju-2026-wealth-business", focusLabel: "재물·사업" },
  { focusId: "saju-2026-investment-assets", focusLabel: "주식·부동산 투자" },
  { focusId: "saju-2026-career-aptitude", focusLabel: "직업·적성" },
  { focusId: "saju-2026-health-balance", focusLabel: "건강" },
];

const NEW_YEAR_FOCUS_CARD_CONCLUSION_DEFAULTS: Record<NewYearFocusId, [string, string]> = {
  "saju-2026-overview": [
    "2026년은 한 번에 크게 벌리기보다 분기별 우선순위를 고정할 때 성과가 선명해지는 해입니다.",
    "기회 신호가 보이면 즉시 실행하고 리스크 신호가 보이면 속도를 낮춰 균형을 유지하세요.",
  ],
  "saju-2026-study-exam": [
    "학업·시험운은 초반 추진력 확보 뒤 중반 조정력을 유지할 때 합격 확률이 올라갑니다.",
    "진도 확장보다 복습 회전과 실전 루틴을 고정해야 점수 변동폭을 줄일 수 있습니다.",
  ],
  "saju-love-focus": [
    "연애·결혼운은 감정 강도보다 관계 운영 리듬의 일관성이 결과를 좌우합니다.",
    "신호가 좋아도 속도를 한 단계 늦추고 약속 이행률을 기준으로 관계를 판단하세요.",
  ],
  "saju-2026-wealth-business": [
    "재물·사업운은 확장 기회와 누수 위험이 동시에 움직여 운영 규율이 성과를 결정합니다.",
    "매출 확대 전에 이익률, 회수 주기, 지출 승인 기준을 먼저 고정하세요.",
  ],
  "saju-2026-investment-assets": [
    "주식·부동산 투자운은 진입 속도보다 손실 통제 규칙을 지킬 때 성과 편차가 줄어듭니다.",
    "신호가 강해도 비중 상한, 손절 기준, 관망 조건을 동일하게 적용하세요.",
  ],
  "saju-2026-career-aptitude": [
    "직업·적성운은 역할 이름보다 실행 방식과 평가 기준 정렬 여부가 핵심 변수입니다.",
    "역할 범위와 목표 기준을 먼저 명시하면 성과 재현성과 성장 속도가 올라갑니다.",
  ],
  "saju-2026-health-balance": [
    "건강운은 고점을 끌어올리는 것보다 저점 방어와 회복 간격 유지가 더 중요합니다.",
    "과부하 신호를 조기에 감지해 일정 강도를 조절하면 장기 컨디션 변동폭이 줄어듭니다.",
  ],
};

const NEW_YEAR_TARGET_YEAR = 2026;
const NEW_YEAR_GANJI = "병오";
const NEW_YEAR_QUARTERS = ["1분기", "2분기", "3분기", "4분기"] as const;
type NewYearOverviewServiceId = "saju-2026-overview" | "saju-2026-yearly-outlook";
type NewYearFocusedServiceId = Exclude<SajuNewYear2026ServiceId, NewYearOverviewServiceId>;

const NEW_YEAR_OVERVIEW_SERVICE_IDS = new Set<NewYearOverviewServiceId>([
  "saju-2026-overview",
  "saju-2026-yearly-outlook",
]);

const sanitizeLevelToken = (value: unknown): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

const normalizeInterpretationIntensityLevel = (
  value: unknown,
  fallback: InterpretationIntensityLevel = "중",
): InterpretationIntensityLevel => {
  const token = sanitizeLevelToken(value);
  if (token === "약" || token === "낮음" || token === "low") return "약";
  if (token === "강" || token === "높음" || token === "high") return "강";
  if (token === "중" || token === "보통" || token === "medium" || token === "mid") return "중";
  return fallback;
};

const normalizeAttentionLevel = (value: unknown, fallback: AttentionLevel = "보통"): AttentionLevel => {
  const token = sanitizeLevelToken(value);
  if (token === "낮음" || token === "약" || token === "low") return "낮음";
  if (token === "높음" || token === "강" || token === "high") return "높음";
  if (token === "보통" || token === "중" || token === "medium" || token === "mid") return "보통";
  return fallback;
};

const normalizeChangeSignalLevel = (
  value: unknown,
  fallback: ChangeSignalLevel = "중",
): ChangeSignalLevel => {
  const token = sanitizeLevelToken(value);
  if (token === "약" || token === "낮음" || token === "low") return "약";
  if (token === "강" || token === "높음" || token === "high") return "강";
  if (token === "중" || token === "보통" || token === "medium" || token === "mid") return "중";
  return fallback;
};

const uniqueItems = (items: readonly (string | null | undefined)[]): string[] => {
  const seen = new Set<string>();
  const normalized: string[] = [];
  items.forEach((item) => {
    if (typeof item !== "string") {
      return;
    }
    const trimmed = item.trim();
    if (!trimmed) return;
    if (seen.has(trimmed)) return;
    seen.add(trimmed);
    normalized.push(trimmed);
  });
  return normalized;
};

const ensureMinItems = (items: string[], fallbackCandidates: string[], min: number, max: number): string[] => {
  const normalized = uniqueItems(items).slice(0, max);
  if (normalized.length >= min) {
    return normalized;
  }

  const fallback = uniqueItems(fallbackCandidates);
  for (const candidate of fallback) {
    if (normalized.length >= min || normalized.length >= max) {
      break;
    }
    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }

  return normalized.slice(0, max);
};

const SUPPLEMENT_VISUAL_TYPES: SajuReportSupplementVisualType[] = [
  "timeline",
  "before-after",
  "decision-matrix",
  "flow-radar",
  "network-map",
  "energy-wave",
  "calendar-map",
];

const isSupplementVisualType = (value: unknown): value is SajuReportSupplementVisualType =>
  typeof value === "string" && SUPPLEMENT_VISUAL_TYPES.includes(value as SajuReportSupplementVisualType);

const normalizeSupplementVisualType = (
  value: unknown,
  fallback: SajuReportSupplementVisualType,
): SajuReportSupplementVisualType => (isSupplementVisualType(value) ? value : fallback);

const containsAnyKeyword = (text: string, keywords: string[]) => {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const LIFETIME_SENTENCE_END_PATTERN = /[.!?。！？]$/u;
const LIFETIME_GENERIC_PATTERNS = [
  "전반적으로",
  "전체적으로",
  "변화가 온다",
  "좋은 흐름",
  "나쁜 흐름",
  "총평",
  "운이 좋다",
  "운이 나쁘다",
  "조심하세요",
];
const LIFETIME_ACTION_VERBS = [
  "기록",
  "분리",
  "고정",
  "실행",
  "관리",
  "점검",
  "설정",
  "검토",
  "추적",
  "정리",
  "확정",
  "조정",
  "차단",
  "연결",
  "배치",
  "복구",
  "적용",
  "측정",
];
const LIFETIME_TARGET_MARKERS = [
  "관계",
  "협업",
  "수입",
  "지출",
  "역할",
  "루틴",
  "구간",
  "우선순위",
  "체크",
  "리스크",
  "목표",
  "지표",
  "자금",
  "회복",
  "의사결정",
  "행동",
  "분기",
  "월별",
  "현금흐름",
  "손실 한도",
  "방어 한도",
  "확장 조건",
  "운영 규칙",
  "변동 신호",
];
const LIFETIME_TIME_MARKERS = [
  "오늘",
  "이번 주",
  "이번달",
  "이번 달",
  "주간",
  "월간",
  "분기",
  "개월",
  "0~2년",
  "3~5년",
  "6~10년",
  "10년",
  "생애",
  "년",
  "4주",
  "12주",
  "90일",
  "30일",
  "60일",
  "기한",
  "일정",
  "즉시",
];

const LIFETIME_TIME_MARKERS_BY_SERVICE: Record<SajuAnalysisServiceId, string[]> = {
  "saju-lifetime-roadmap": ["직전", "현재", "다음", "다다음", "세", "년"],
  "saju-daeun-shift": ["전환 전", "전환 시점", "전환 후", "년"],
  "saju-career-timing": ["0~2년", "3~5년", "6~10년", "10년+", "년"],
  "saju-wealth-flow": ["현재 구간", "0~2년", "3~5년", "6~10년", "10년+", "분기", "년"],
  "saju-helper-network": ["0~2년", "3~5년", "6~10년", "년"],
  "saju-energy-balance": ["생애", "0~2년", "3~5년", "6~10년", "4주", "12주", "주", "년"],
  "saju-yearly-action-calendar": ["현재 위치", "0~2년", "3~5년", "6~10년", "전환", "분기", "월"],
};

const DAEUN_SHORT_TERM_MARKERS = ["오늘", "이번 주", "이번달", "이번 달", "주간", "월간", "90일", "60일", "30일"];
const DAEUN_LONG_TERM_MARKERS = ["1~2년", "3~5년", "6~10년", "중기", "장기", "향후", "정착", "전환 후"];
const HELPER_SHORT_TERM_MARKERS = ["오늘", "이번 주", "이번달", "이번 달", "주간", "월간", "30일", "60일", "90일"];
const HELPER_LONG_TERM_MARKERS = ["0~2년", "1~2년", "3~5년", "6~10년", "10년+", "중기", "장기", "생애", "향후"];
const HELPER_ACTION_TIME_MARKERS = ["0~2년", "3~5년", "6~10년", "10년+", "분기", "반기", "연간", "생애"] as const;
const HELPER_ACTION_TARGET_MARKERS = ["관계", "협업", "멘토", "귀인", "경계", "패턴", "레이어", "네트워크", "운영 기준"];
const HELPER_ACTION_SLOT_REPAIR_TEMPLATES = [
  "{target}의 확장 기준과 정리 기준을 분리해 고정하세요",
  "{target} 충돌 신호를 기록하고 대응 문장을 먼저 준비하세요",
  "{target} 운영 결과를 분기 단위로 측정해 다음 구간 전략에 반영하세요",
] as const;
const CAREER_STAGE_TIME_MARKERS = ["0~2년", "3~5년", "6~10년", "10년+"] as const;
const CAREER_STAGE_TEMPLATES: Array<{
  stageId: SajuCareerStageFlowItem["stageId"];
  label: string;
  timeRange: (typeof CAREER_STAGE_TIME_MARKERS)[number];
  defaultCoreFlow: string;
  defaultTransitionSignal: string;
}> = [
  {
    stageId: "build-up",
    label: "초기 축적기",
    timeRange: "0~2년",
    defaultCoreFlow: "핵심 역량과 실행 기준을 축적해 장기 커리어의 기반을 고정하는 구간입니다.",
    defaultTransitionSignal: "기준 없는 확장 시도가 줄고 역할 적합 기준이 문장으로 정리되면 전환기 진입 신호입니다.",
  },
  {
    stageId: "transition",
    label: "전환기",
    timeRange: "3~5년",
    defaultCoreFlow: "역할 범위와 책임이 바뀌는 국면에서 우선순위를 재배치하는 구간입니다.",
    defaultTransitionSignal: "역할 전환 이후 성과 지표가 안정되면 확장기 진입 신호로 해석할 수 있습니다.",
  },
  {
    stageId: "expansion",
    label: "확장기",
    timeRange: "6~10년",
    defaultCoreFlow: "축적한 기준 위에서 영향력과 성과 범위를 확장하는 구간입니다.",
    defaultTransitionSignal: "확장 속도보다 유지 체계가 먼저 자리 잡으면 안정화기 진입 신호가 나타납니다.",
  },
  {
    stageId: "stabilization",
    label: "안정화기",
    timeRange: "10년+",
    defaultCoreFlow: "장기적으로 재현 가능한 운영 체계를 정착시켜 변동성을 관리하는 구간입니다.",
    defaultTransitionSignal: "안정화기에서는 재배치보다 유지·승계 전략을 우선하는 신호를 점검해야 합니다.",
  },
];

const WEALTH_LIFECYCLE_TEMPLATES: Array<{
  phaseType: SajuWealthLifecyclePhaseType;
  label: string;
  timeRange: string;
  yearStartOffset: number;
  yearEndOffset: number;
  ageStartOffset: number;
  ageEndOffset: number;
  defaultObjective: string;
  defaultOpportunity: string;
  defaultRisk: string;
  defaultOperatingRules: string[];
  defaultTransitionSignal: string;
}> = [
  {
    phaseType: "accumulation",
    label: "축적기",
    timeRange: "0~2년",
    yearStartOffset: 0,
    yearEndOffset: 2,
    ageStartOffset: 0,
    ageEndOffset: 2,
    defaultObjective: "순유입 기반을 고정해 축적 속도를 안정화하는 구간입니다.",
    defaultOpportunity: "수입 채널의 반복성과 누적 효율을 높이면 다음 확장 구간의 초기 손실을 줄일 수 있습니다.",
    defaultRisk: "지출 누수 기준 없이 확장 준비를 시작하면 축적 속도가 예상보다 빠르게 둔화될 수 있습니다.",
    defaultOperatingRules: [
      "비상자금과 확장자금을 분리해 축적 속도와 안정성을 함께 유지하세요.",
      "축적 구간에서는 고정비 상한을 먼저 고정하고 변동비 조정은 월 단위로 관리하세요.",
    ],
    defaultTransitionSignal: "순유입 안정 구간이 3개월 이상 유지되면 확장기 진입 신호입니다.",
  },
  {
    phaseType: "expansion",
    label: "확장기",
    timeRange: "3~5년",
    yearStartOffset: 3,
    yearEndOffset: 5,
    ageStartOffset: 3,
    ageEndOffset: 5,
    defaultObjective: "축적 자본을 선택적으로 확장해 수익 규모를 키우는 구간입니다.",
    defaultOpportunity: "축적기에서 검증된 기준 위에 확장 축을 1~2개로 제한하면 수익 레버리지를 높일 수 있습니다.",
    defaultRisk: "확장 속도가 손실 한도 기준보다 앞서면 현금흐름 변동성이 크게 확대될 수 있습니다.",
    defaultOperatingRules: [
      "확장 전 손실 한도를 먼저 고정하고 한도 초과 시 즉시 축소 규칙을 적용하세요.",
      "확장 구간의 신규 투입은 분기 단위로 나눠 실행하고 복원 속도를 함께 점검하세요.",
    ],
    defaultTransitionSignal: "확장 이후에도 손실 한도 유지율이 안정되면 방어기 진입 신호로 해석할 수 있습니다.",
  },
  {
    phaseType: "defense",
    label: "방어기",
    timeRange: "6~10년",
    yearStartOffset: 6,
    yearEndOffset: 10,
    ageStartOffset: 6,
    ageEndOffset: 10,
    defaultObjective: "확장 이후 자산 하방을 방어해 복원력을 높이는 구간입니다.",
    defaultOpportunity: "방어 규칙을 표준화하면 변동 이벤트가 와도 장기 자산 곡선의 하방을 보호할 수 있습니다.",
    defaultRisk: "방어 비중 하한을 고정하지 않으면 단일 이벤트 손실이 누적되어 회복 시간이 길어질 수 있습니다.",
    defaultOperatingRules: [
      "방어 자산 비중 하한을 유지하고 위기 시 유동성 확보 규칙을 우선 적용하세요.",
      "분기 점검에서 방어 한도 이탈 여부를 먼저 확인하고 확장 재개 시점을 결정하세요.",
    ],
    defaultTransitionSignal: "방어 기준 유지율과 복원 속도가 안정되면 변동기 대응 구간으로 전환할 수 있습니다.",
  },
  {
    phaseType: "volatility",
    label: "변동기",
    timeRange: "10년+",
    yearStartOffset: 11,
    yearEndOffset: 14,
    ageStartOffset: 11,
    ageEndOffset: 14,
    defaultObjective: "변동 신호를 조기에 판독해 축적·확장·방어 사이클을 재배치하는 구간입니다.",
    defaultOpportunity: "변동기에서는 복원 속도 지표를 선행 관리하면 다음 축적 사이클 진입 시점을 앞당길 수 있습니다.",
    defaultRisk: "낙관/비관 반응으로 규칙을 자주 바꾸면 장기 복원력이 약화되고 연쇄 손실이 커질 수 있습니다.",
    defaultOperatingRules: [
      "변동 구간 방어 한도와 재진입 조건을 사전에 문장으로 고정해 반응형 결정을 줄이세요.",
      "변동 신호는 월 단위로 판독하고 기준 미충족 시 확장 결정을 보류하세요.",
    ],
    defaultTransitionSignal: "복원 속도와 손실 통제가 동시에 유지되면 다음 축적기 연결 신호가 확인됩니다.",
  },
];

const includesAnyMarker = (text: string, markers: string[]) => markers.some((marker) => text.includes(marker));

type DaeunHorizonBalanceOptions = {
  min: number;
  max: number;
  minLongTerm: number;
  maxShortTerm: number;
};

const rebalanceDaeunHorizonList = (
  items: string[],
  fallbackCandidates: string[],
  options: DaeunHorizonBalanceOptions,
): string[] => {
  const fallback = uniqueItems(fallbackCandidates.map((item) => toLifetimeSentence(item)).filter(Boolean));
  const seeded = ensureMinItems(uniqueItems(items.map((item) => toLifetimeSentence(item)).filter(Boolean)), fallback, options.min, options.max);

  let shortTermCount = 0;
  let filtered = seeded.filter((item) => {
    if (!includesAnyMarker(item, DAEUN_SHORT_TERM_MARKERS)) {
      return true;
    }
    if (shortTermCount < options.maxShortTerm) {
      shortTermCount += 1;
      return true;
    }
    return false;
  });

  const longTermFallback = fallback.filter((item) => includesAnyMarker(item, DAEUN_LONG_TERM_MARKERS));
  let longTermCount = filtered.filter((item) => includesAnyMarker(item, DAEUN_LONG_TERM_MARKERS)).length;
  for (const candidate of longTermFallback) {
    if (longTermCount >= options.minLongTerm || filtered.length >= options.max) {
      break;
    }
    if (!filtered.includes(candidate)) {
      filtered.push(candidate);
      longTermCount += 1;
    }
  }

  filtered = ensureMinItems(uniqueItems(filtered), fallback, options.min, options.max);
  return filtered.slice(0, options.max);
};

const hasKoreanFinalConsonant = (char: string): boolean => {
  if (!char) {
    return false;
  }
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    return false;
  }
  return (code - 0xac00) % 28 !== 0;
};

const normalizeKoreanObjectParticle = (value: string): string =>
  value.replace(/([가-힣]+)(을|를)/g, (_match, noun: string) => {
    const lastChar = noun[noun.length - 1] ?? "";
    const particle = hasKoreanFinalConsonant(lastChar) ? "을" : "를";
    return `${noun}${particle}`;
  });

const sanitizeHelperSentence = (value: string): string => normalizeKoreanObjectParticle(toLifetimeSentence(value));

const rebalanceHelperHorizonList = (
  items: string[],
  fallbackCandidates: string[],
  options: DaeunHorizonBalanceOptions,
): string[] => {
  const fallback = uniqueItems(fallbackCandidates.map((item) => sanitizeHelperSentence(item)).filter(Boolean));
  const seeded = ensureMinItems(
    uniqueItems(items.map((item) => sanitizeHelperSentence(item)).filter(Boolean)),
    fallback,
    options.min,
    options.max,
  );

  let shortTermCount = 0;
  let filtered = seeded.filter((item) => {
    if (!includesAnyMarker(item, HELPER_SHORT_TERM_MARKERS)) {
      return true;
    }
    if (shortTermCount < options.maxShortTerm) {
      shortTermCount += 1;
      return true;
    }
    return false;
  });

  const longTermFallback = fallback.filter((item) => includesAnyMarker(item, HELPER_LONG_TERM_MARKERS));
  let longTermCount = filtered.filter((item) => includesAnyMarker(item, HELPER_LONG_TERM_MARKERS)).length;
  for (const candidate of longTermFallback) {
    if (longTermCount >= options.minLongTerm || filtered.length >= options.max) {
      break;
    }
    if (!filtered.includes(candidate)) {
      filtered.push(candidate);
      longTermCount += 1;
    }
  }

  filtered = ensureMinItems(uniqueItems(filtered), fallback, options.min, options.max);
  return filtered.slice(0, options.max);
};

const LIFETIME_BLOCK_DEFAULTS: Record<
  SajuAnalysisServiceId,
  { opportunities: string[]; risks: string[]; actionStrategy: string[] }
> = {
  "saju-lifetime-roadmap": {
    opportunities: [
      "현재 구간의 핵심 강점을 다음 구간의 기반 자산으로 이어 붙이세요.",
      "직전 구간의 반복 패턴을 정리하면 다음 10년의 실행 안정성이 높아집니다.",
    ],
    risks: [
      "장기 서사 대신 단기 성과만 따라가면 다음 단계 전환이 늦어질 수 있습니다.",
      "정리 없이 확장만 밀면 단계 간 피로가 누적될 수 있습니다.",
    ],
    actionStrategy: [
      "이번 90일 안에 성숙·확장·정리 항목을 각각 1개씩 일정에 고정하세요.",
      "분기 말마다 직전-현재-다음 연결 문장을 다시 점검해 방향을 보정하세요.",
    ],
  },
  "saju-daeun-shift": {
    opportunities: [
      "전환 전 준비기에서 기준 문장을 고정하면 전환기 판단 흔들림을 줄일 수 있습니다.",
      "전환 후 1~2년 운영 축을 먼저 정하면 3~5년 확장 구간의 시행착오를 줄일 수 있습니다.",
    ],
    risks: [
      "전환기의 감정 변동에만 반응하면 전환 후 재배치기의 운영 기준이 붕괴될 수 있습니다.",
      "단기 대응만 반복하면 전환 후 정착기(6~10년)에서 성장 동력이 약해질 수 있습니다.",
    ],
    actionStrategy: [
      "전환 전 준비기에는 정리 기준을 문장으로 고정하고 전환기에는 의사결정 축을 1~2개로 제한하세요.",
      "전환 후 재배치기(1~2년)와 정착기(3~5년/6~10년)로 운영 지표를 분리해 월 단위로 추적하세요.",
    ],
  },
  "saju-career-timing": {
    opportunities: [
      "역할 적합성과 환경 적합성을 분리 평가하면 결정 정확도가 높아집니다.",
      "초기 축적기-전환기-확장기-안정화기로 기준을 나누면 장기 의사결정 오차가 줄어듭니다.",
    ],
    risks: [
      "단년도 성과 문장에만 집중하면 단계 전환 신호를 놓쳐 장기 확장 타이밍이 늦어질 수 있습니다.",
      "결정과 보류를 현재 연도 이슈로만 처리하면 6~10년 이후 안정화 구간 준비가 약해질 수 있습니다.",
    ],
    actionStrategy: [
      "0~2년/3~5년/6~10년/10년+ 단계별 결정 기준을 문장으로 고정하고 분기마다 갱신하세요.",
      "현재 연도 포인트는 보조 지표로만 사용하고 핵심 판단은 장기 단계 축으로 유지하세요.",
    ],
  },
  "saju-wealth-flow": {
    opportunities: [
      "유입 구조와 누수 구조를 분리 기록하면 수익 개선 지점이 선명해집니다.",
      "축적 구간과 확장 구간을 나누면 자금 운용의 변동성을 줄일 수 있습니다.",
    ],
    risks: [
      "손실 한도 없이 확장하면 현금흐름 복원력이 급격히 약해질 수 있습니다.",
      "지출 누수 패턴을 방치하면 중기 구간의 축적 속도가 둔화될 수 있습니다.",
    ],
    actionStrategy: [
      "이번 달에 비상자금·투입자금을 분리하고 손실 한도 규칙을 문장으로 고정하세요.",
      "주간 점검에서 유입 1개·누수 1개를 숫자로 기록하고 즉시 조정하세요.",
    ],
  },
  "saju-helper-network": {
    opportunities: [
      "가까운 관계·협업·사회 레이어를 나누면 귀인 연결 효율이 높아집니다.",
      "협업 기준 문장을 명확히 하면 갈등 비용을 크게 줄일 수 있습니다.",
    ],
    risks: [
      "레이어 구분 없이 관계를 확장하면 핵심 연결의 신뢰도가 약해질 수 있습니다.",
      "반복 갈등 루프를 방치하면 협업 성과가 중기 구간에서 둔화될 수 있습니다.",
    ],
    actionStrategy: [
      "이번 주에 관계 레이어별 핵심 인물 1명씩 정하고 접점 행동을 예약하세요.",
      "갈등 루프 차단 문장을 준비해 실제 대화에서 즉시 사용하세요.",
    ],
  },
  "saju-energy-balance": {
    opportunities: [
      "타고난 에너지 기복 패턴을 먼저 이해하면 생애 단계별 의사결정 정확도를 높일 수 있습니다.",
      "몰입-회복 운영 규칙을 중장기로 고정하면 단기 변동에도 성과 저점이 낮아지지 않습니다.",
    ],
    risks: [
      "단기 성과만 밀어붙이면 3~5년 구간에서 피로 누적이 구조화될 수 있습니다.",
      "과부하 신호를 무시하면 4주 구간의 회복 손실이 6~10년 생산성까지 번질 수 있습니다.",
    ],
    actionStrategy: [
      "0~2년 구간은 강도 상한과 회복 하한을 함께 숫자로 고정하고 주간 점검 지표를 기록하세요.",
      "3~5년 구간은 소진 경보 대응 루틴을 표준화하고 6~10년 구간은 역할별 에너지 배분 기준을 분기마다 갱신하세요.",
    ],
  },
  "saju-yearly-action-calendar": {
    opportunities: [
      "올해 실행을 0~2년/3~5년/6~10년 축과 연결하면 단기 행동이 장기 자산으로 축적됩니다.",
      "분기 목표를 월별 행동으로 분해하면 실행 누락을 빠르게 줄이고 전환 신호를 조기에 포착할 수 있습니다.",
    ],
    risks: [
      "연간 일정만 반복하고 생애 단계 연결이 없으면 다음 전환 시점에서 방향 오차가 커질 수 있습니다.",
      "지연 복구 규칙이 없으면 분기 후반에 실행 적체가 누적되어 장기 축적 속도가 둔화될 수 있습니다.",
    ],
    actionStrategy: [
      "현재 위치-장기 목적-이번 시기 행동-점검 기준을 한 문장으로 고정한 뒤 월별 실행에 반영하세요.",
      "월말 리뷰에서 지연 항목을 복구 시나리오로 즉시 재배치하고 다음 분기 전환 조건을 함께 점검하세요.",
    ],
  },
};

const toLifetimeSentence = (value: string): string => {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "";
  }
  return LIFETIME_SENTENCE_END_PATTERN.test(trimmed) ? trimmed : `${trimmed}.`;
};

const isGenericLifetimeSentence = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) {
    return true;
  }
  if (normalized.length < 12) {
    return true;
  }
  return LIFETIME_GENERIC_PATTERNS.some((pattern) => normalized.includes(pattern));
};

const hasAnyMarker = (value: string, markers: string[]) => markers.some((marker) => value.includes(marker));

const isSpecificActionSentence = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }
  return (
    hasAnyMarker(normalized, LIFETIME_TIME_MARKERS) &&
    hasAnyMarker(normalized, LIFETIME_TARGET_MARKERS) &&
    hasAnyMarker(normalized, LIFETIME_ACTION_VERBS)
  );
};

const hasSufficientActionSignal = (value: string): boolean => {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }
  return (
    hasAnyMarker(normalized, LIFETIME_TIME_MARKERS) &&
    hasAnyMarker(normalized, LIFETIME_ACTION_VERBS) &&
    normalized.length >= 18
  );
};

const LIFETIME_TERMINAL_PUNCTUATION_PATTERN = /[.!?。！？]+$/u;

const stripTerminalPunctuation = (value: string): string => value.trim().replace(LIFETIME_TERMINAL_PUNCTUATION_PATTERN, "");

const appendSentenceFragment = (base: string, fragment: string): string => {
  const left = stripTerminalPunctuation(base);
  const right = stripTerminalPunctuation(fragment);
  if (!left) {
    return right;
  }
  if (!right) {
    return left;
  }
  return `${left} ${right}`.replace(/\s+/g, " ").trim();
};

const stripForbiddenLifetimeKeywords = (items: string[], forbiddenKeywords: string[]): string[] =>
  items.filter((item) => !containsAnyKeyword(item, forbiddenKeywords));

const normalizeLifetimeParagraph = (
  value: unknown,
  fallbackCandidates: string[],
  forbiddenKeywords: string[] = [],
): string => {
  const direct = toStringValue(value);
  const pool = uniqueItems([direct, ...fallbackCandidates]).filter((item) => !containsAnyKeyword(item, forbiddenKeywords));
  const preferred = pool
    .map((item) => toLifetimeSentence(item))
    .find((item) => item && !isGenericLifetimeSentence(item));
  if (preferred) {
    return preferred;
  }
  const fallback = pool.map((item) => toLifetimeSentence(item)).find(Boolean);
  return fallback ?? "핵심 흐름 기준으로 실행 우선순위를 다시 정렬하세요.";
};

const suppressAnchorYearOverfocus = (value: string, anchorYear?: number): string => {
  const normalized = toLifetimeSentence(value);
  if (!normalized || !Number.isFinite(anchorYear)) {
    return normalized;
  }
  const yearToken = `${anchorYear}년`;
  let seen = 0;
  return normalized.replace(new RegExp(yearToken, "g"), () => {
    seen += 1;
    return seen <= 1 ? yearToken : "현재 구간";
  });
};

const sanitizeWealthActionSentence = (value: string, anchorYear?: number): string =>
  suppressAnchorYearOverfocus(
    toLifetimeSentence(
      value
        .replace(/담당·?기한·?측정 기준/g, "운영 기준")
        .replace(/담당과 기한을 확정/g, "운영 기준을 고정")
        .replace(/측정 기준/g, "점검 기준"),
    ),
    anchorYear,
  );

const ACTION_TARGET_FALLBACKS = [
  "핵심 과제",
  "우선순위",
  "회복 루틴",
  "리스크 항목",
  "실행 지표",
];

const ACTION_SLOT_REPAIR_TEMPLATES = [
  "{target}의 담당·기한·측정 기준을 문장으로 확정하세요",
  "{target}을 일정에 배치하고 주간 점검 지표를 기록하세요",
  "{target} 실행 결과를 측정해 다음 조정안을 바로 적용하세요",
];

const WEALTH_ACTION_TARGET_MARKERS = [
  "현금흐름",
  "수입",
  "지출",
  "자금",
  "방어 한도",
  "손실 한도",
  "확장 조건",
  "운영 규칙",
  "변동 신호",
];

const WEALTH_ACTION_SLOT_REPAIR_TEMPLATES = [
  "{target} 운영 원칙을 먼저 고정하세요",
  "{target}의 상한·하한 기준을 정한 뒤 실행하세요",
  "{target} 변동 신호를 월 단위로 추적하며 조정하세요",
];

const WEALTH_ACTION_TIME_MARKERS = [
  "현재 구간",
  "0~2년",
  "3~5년",
  "6~10년",
  "10년+",
  "분기",
  "반기",
  "연간",
] as const;

const pickDeterministicVariant = (seed: string, candidates: string[], fallback: string): string => {
  if (candidates.length === 0) {
    return fallback;
  }
  const key = seed.trim();
  if (!key) {
    return candidates[0] ?? fallback;
  }
  const hash = Array.from(key).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return candidates[hash % candidates.length] ?? fallback;
};

const inferActionTimeMarker = (
  source: string,
  fallbackSentence: string,
  timeMarkerCandidates: readonly string[] = LIFETIME_TIME_MARKERS,
): string => {
  const candidatePool = timeMarkerCandidates.length > 0 ? [...timeMarkerCandidates] : ["이번 주"];
  const fromSource = candidatePool.find((marker) => source.includes(marker));
  if (fromSource) {
    return fromSource;
  }
  const fromFallback = candidatePool.find((marker) => fallbackSentence.includes(marker));
  if (fromFallback) {
    return fromFallback;
  }
  return pickDeterministicVariant(source, candidatePool, candidatePool[0] ?? "이번 주");
};

const inferActionTargetMarker = (
  source: string,
  fallbackSentence: string,
  targetMarkerCandidates: readonly string[] = LIFETIME_TARGET_MARKERS,
): string => {
  const markerPool = targetMarkerCandidates.length > 0 ? [...targetMarkerCandidates] : [...LIFETIME_TARGET_MARKERS];
  const fromSource = markerPool.find((marker) => source.includes(marker));
  if (fromSource) {
    return fromSource;
  }
  const fromFallback = markerPool.find((marker) => fallbackSentence.includes(marker));
  if (fromFallback) {
    return fromFallback;
  }
  return pickDeterministicVariant(source, ACTION_TARGET_FALLBACKS, ACTION_TARGET_FALLBACKS[0]);
};

const enforceActionSpecificity = (
  value: string,
  fallback: string,
  options?: { timeMarkers?: readonly string[]; targetMarkers?: readonly string[]; repairTemplates?: readonly string[] },
): string => {
  const normalized = toLifetimeSentence(value);
  if (isSpecificActionSentence(normalized) || hasSufficientActionSignal(normalized)) {
    return normalized;
  }

  const fallbackSentence = toLifetimeSentence(fallback);
  if (!normalized) {
    return fallbackSentence;
  }

  const fallbackTimeMarker = inferActionTimeMarker(
    normalized,
    fallbackSentence,
    options?.timeMarkers ?? LIFETIME_TIME_MARKERS,
  );
  const fallbackTarget = inferActionTargetMarker(
    normalized,
    fallbackSentence,
    options?.targetMarkers ?? LIFETIME_TARGET_MARKERS,
  );
  const repairTemplates = options?.repairTemplates?.length
    ? [...options.repairTemplates]
    : ACTION_SLOT_REPAIR_TEMPLATES;
  const repairTemplate = pickDeterministicVariant(
    normalized,
    repairTemplates,
    repairTemplates[0] ?? ACTION_SLOT_REPAIR_TEMPLATES[0],
  );
  let repaired = stripTerminalPunctuation(normalized);

  if (!hasAnyMarker(repaired, LIFETIME_TIME_MARKERS)) {
    repaired = `${fallbackTimeMarker} ${repaired}`.trim();
  }

  if (!hasAnyMarker(repaired, LIFETIME_TARGET_MARKERS) || !hasAnyMarker(repaired, LIFETIME_ACTION_VERBS)) {
    const repairClause = repairTemplate.replaceAll("{target}", fallbackTarget);
    const compactRepaired = repaired.replace(/\s+/g, "");
    const compactClause = repairClause.replace(/\s+/g, "");
    if (!compactRepaired.includes(compactClause) && !compactRepaired.includes(fallbackTarget.replace(/\s+/g, ""))) {
      repaired = appendSentenceFragment(repaired, repairClause);
    }
  }

  const repairedSentence = toLifetimeSentence(repaired);
  if (isSpecificActionSentence(repairedSentence) || hasSufficientActionSignal(repairedSentence)) {
    return repairedSentence;
  }

  return fallbackSentence;
};

const normalizeLifetimeList = (
  value: unknown,
  fallbackCandidates: string[],
  min: number,
  max: number,
  forbiddenKeywords: string[] = [],
  options?: {
    action?: boolean;
    actionFallback?: string;
    timeMarkers?: readonly string[];
    targetMarkers?: readonly string[];
    repairTemplates?: readonly string[];
  },
): string[] => {
  const source = uniqueItems([
    ...toStringArray(value, [], max + 6),
    ...fallbackCandidates,
  ]);
  const filtered = stripForbiddenLifetimeKeywords(source, forbiddenKeywords).map((item) => toLifetimeSentence(item)).filter(Boolean);
  const cleaned = filtered.filter((item) => !isGenericLifetimeSentence(item) || item.length >= 18);
  const normalized = ensureMinItems(cleaned, filtered, min, max);

  if (!options?.action) {
    return normalized;
  }

  const actionFallback = options.actionFallback ?? "이번 주 우선순위 항목의 담당·기한·측정 기준을 확정하고 실행 결과를 기록하세요.";
  return normalized.map((item) =>
    enforceActionSpecificity(item, actionFallback, {
      timeMarkers: options.timeMarkers,
      targetMarkers: options.targetMarkers,
      repairTemplates: options.repairTemplates,
    }),
  );
};

const dedupeLifetimeBuckets = <T extends Record<string, string[]>>(buckets: T): T => {
  const seen = new Set<string>();
  const next = {} as T;
  (Object.keys(buckets) as Array<keyof T>).forEach((key) => {
    next[key] = buckets[key].filter((item) => {
      const normalized = item.trim().toLowerCase();
      if (!normalized || seen.has(normalized)) {
        return false;
      }
      seen.add(normalized);
      return true;
    }) as T[keyof T];
  });
  return next;
};

type SupplementExecutionMinimums = {
  todayMin: number;
  todayMax: number;
  thisWeekMin: number;
  thisWeekMax: number;
  thisMonthMin: number;
  thisMonthMax: number;
  avoidMin: number;
  avoidMax: number;
};

const DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS: SupplementExecutionMinimums = {
  todayMin: 1,
  todayMax: 3,
  thisWeekMin: 2,
  thisWeekMax: 4,
  thisMonthMin: 2,
  thisMonthMax: 4,
  avoidMin: 1,
  avoidMax: 4,
};

const SUPPLEMENT_EXECUTION_MINIMUMS_BY_SERVICE: Record<SajuAnalysisServiceId, SupplementExecutionMinimums> = {
  "saju-lifetime-roadmap": DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS,
  "saju-daeun-shift": DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS,
  "saju-career-timing": {
    todayMin: 0,
    todayMax: 2,
    thisWeekMin: 1,
    thisWeekMax: 3,
    thisMonthMin: 1,
    thisMonthMax: 3,
    avoidMin: 1,
    avoidMax: 3,
  },
  "saju-wealth-flow": DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS,
  "saju-helper-network": {
    todayMin: 0,
    todayMax: 1,
    thisWeekMin: 1,
    thisWeekMax: 3,
    thisMonthMin: 1,
    thisMonthMax: 3,
    avoidMin: 1,
    avoidMax: 3,
  },
  "saju-energy-balance": DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS,
  "saju-yearly-action-calendar": {
    todayMin: 0,
    todayMax: 0,
    thisWeekMin: 0,
    thisWeekMax: 0,
    thisMonthMin: 0,
    thisMonthMax: 0,
    avoidMin: 0,
    avoidMax: 0,
  },
};

const dedupeSupplementExecutionProtocol = (
  execution: SajuReportSupplementExecutionProtocol,
  fallbacks: SajuReportSupplementExecutionProtocol,
  minimums: SupplementExecutionMinimums = DEFAULT_SUPPLEMENT_EXECUTION_MINIMUMS,
): SajuReportSupplementExecutionProtocol => {
  const deduped = dedupeLifetimeBuckets({
    today: execution.today,
    thisWeek: execution.thisWeek,
    thisMonth: execution.thisMonth,
    avoid: execution.avoid,
  });

  return {
    today: ensureMinItems(deduped.today, fallbacks.today, minimums.todayMin, minimums.todayMax),
    thisWeek: ensureMinItems(
      deduped.thisWeek,
      uniqueItems([...fallbacks.thisWeek, ...fallbacks.today]).filter((item) => !deduped.today.includes(item)),
      minimums.thisWeekMin,
      minimums.thisWeekMax,
    ),
    thisMonth: ensureMinItems(
      deduped.thisMonth,
      uniqueItems([...fallbacks.thisMonth, ...fallbacks.thisWeek]).filter(
        (item) => !deduped.today.includes(item) && !deduped.thisWeek.includes(item),
      ),
      minimums.thisMonthMin,
      minimums.thisMonthMax,
    ),
    avoid: ensureMinItems(
      deduped.avoid,
      uniqueItems([...fallbacks.avoid, ...fallbacks.thisMonth]).filter(
        (item) =>
          !deduped.today.includes(item) &&
          !deduped.thisWeek.includes(item) &&
          !deduped.thisMonth.includes(item),
      ),
      minimums.avoidMin,
      minimums.avoidMax,
    ),
  };
};

const ensureDistinctDecisionBuckets = (
  decideNow: string[],
  deferNow: string[],
  decideFallbacks: string[],
  deferFallbacks: string[],
): { decideNow: string[]; deferNow: string[] } => {
  let decide = ensureMinItems(uniqueItems(decideNow), decideFallbacks, 2, 4);
  if (decide.length < 2) {
    decide = ensureMinItems(
      decide,
      [
        "이번 주 결정 항목은 역할 적합 기준을 확인한 뒤 즉시 실행하세요.",
        "이번 달 결정 항목은 실행 책임자와 기한을 확정해 착수하세요.",
        "다음 분기 결정 항목은 성과 기준을 수치로 고정해 실행하세요.",
      ],
      2,
      4,
    );
  }

  const deferFiltered = uniqueItems(deferNow).filter((item) => !decide.includes(item));
  let defer = ensureMinItems(
    deferFiltered,
    deferFallbacks.filter((item) => !decide.includes(item)),
    2,
    4,
  );

  if (defer.length < 2) {
    defer = ensureMinItems(
      defer,
      [
        "이번 주 보류 항목은 검증 기준을 확정한 뒤 다음 점검일에 재평가하세요.",
        "이번 달 보류 항목은 우선순위 충돌이 해소될 때까지 착수하지 마세요.",
        "다음 분기 보류 항목은 핵심 지표가 충족되기 전까지 결정을 미루세요.",
      ].filter((item) => !decide.includes(item)),
      2,
      4,
    );
  }

  return { decideNow: decide, deferNow: defer };
};

const hasServiceTimeMarker = (serviceType: SajuAnalysisServiceId, text: string): boolean =>
  LIFETIME_TIME_MARKERS_BY_SERVICE[serviceType].some((marker) => text.includes(marker));

const enforceTimeAxisLanguage = (
  serviceType: SajuAnalysisServiceId,
  blocks: SajuAnalysisBlock[],
  fallbackBlocks: SajuAnalysisBlock[],
): SajuAnalysisBlock[] =>
  fallbackBlocks.map((fallback, index) => {
    const block = blocks[index] ?? fallback;
    const mergedTime = `${block.windowLabel} ${block.timeRange}`;
    if (hasServiceTimeMarker(serviceType, mergedTime)) {
      return block;
    }
    return {
      ...block,
      windowLabel: fallback.windowLabel,
      timeRange: fallback.timeRange,
    };
  });

const normalizeAnalysisBlocksByService = (
  serviceType: SajuAnalysisServiceId,
  blocks: SajuAnalysisBlock[],
  fallbackBlocks: SajuAnalysisBlock[],
  forbiddenKeywords: string[],
  duplicateReference: string[] = [],
): SajuAnalysisBlock[] => {
  if (fallbackBlocks.length === 0) {
    return blocks;
  }

  const defaults = LIFETIME_BLOCK_DEFAULTS[serviceType];
  const actionTimeMarkers =
    serviceType === "saju-career-timing"
      ? CAREER_STAGE_TIME_MARKERS
      : serviceType === "saju-yearly-action-calendar"
        ? LIFETIME_TIME_MARKERS_BY_SERVICE["saju-yearly-action-calendar"]
        : undefined;
  const normalized = fallbackBlocks.map((fallback, index) => {
    const source = blocks[index] ?? fallback;
    const coreFlow = normalizeLifetimeParagraph(
      source.coreFlow,
      [fallback.coreFlow, ...fallback.opportunities, ...defaults.opportunities],
      forbiddenKeywords,
    );
    const evidence = normalizeLifetimeParagraph(
      source.evidence,
      [fallback.evidence, ...fallback.risks, ...defaults.risks],
      forbiddenKeywords,
    );

    const opportunities = normalizeLifetimeList(
      source.opportunities,
      [...fallback.opportunities, ...defaults.opportunities, coreFlow],
      2,
      4,
      forbiddenKeywords,
    );
    const risks = normalizeLifetimeList(
      source.risks,
      [...fallback.risks, ...defaults.risks, evidence],
      2,
      4,
      forbiddenKeywords,
    );
    const actionStrategy = normalizeLifetimeList(
      source.actionStrategy,
      [...fallback.actionStrategy, ...defaults.actionStrategy, ...fallback.opportunities],
      2,
      4,
      forbiddenKeywords,
      { action: true, actionFallback: defaults.actionStrategy[0], timeMarkers: actionTimeMarkers },
    );

    const blockDuplicateSet = new Set(
      uniqueItems([coreFlow, evidence, ...duplicateReference]).map((item) => item.trim().toLowerCase()),
    );
    const dedupedBuckets = dedupeLifetimeBuckets({
      opportunities: opportunities.filter((item) => !blockDuplicateSet.has(item.trim().toLowerCase())),
      risks: risks.filter((item) => !blockDuplicateSet.has(item.trim().toLowerCase())),
      actionStrategy: actionStrategy.filter((item) => !blockDuplicateSet.has(item.trim().toLowerCase())),
    });

    return {
      windowLabel: toStringValue(source.windowLabel, fallback.windowLabel),
      timeRange: toStringValue(source.timeRange, fallback.timeRange),
      coreFlow,
      evidence,
      opportunities: ensureMinItems(
        dedupedBuckets.opportunities,
        [...fallback.opportunities, ...defaults.opportunities],
        2,
        4,
      ),
      risks: ensureMinItems(
        dedupedBuckets.risks,
        [...fallback.risks, ...defaults.risks],
        2,
        4,
      ),
      actionStrategy: ensureMinItems(
        dedupedBuckets.actionStrategy,
        [...fallback.actionStrategy, ...defaults.actionStrategy],
        2,
        4,
      ).map((item) =>
        enforceActionSpecificity(item, defaults.actionStrategy[0], { timeMarkers: actionTimeMarkers }),
      ),
    } satisfies SajuAnalysisBlock;
  });

  return enforceTimeAxisLanguage(serviceType, normalized, fallbackBlocks);
};

const buildDefaultVisualExplainer = (
  serviceType: SajuAnalysisServiceId,
  candidates: string[],
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
): SajuReportSupplementVisualExplainer => {
  const type = SUPPLEMENT_VISUAL_TYPE_BY_SERVICE[serviceType];
  const title = SUPPLEMENT_VISUAL_TITLE_BY_SERVICE[serviceType];
  const items = ensureMinItems(
    uniqueItems(candidates),
    [...commonPayload.coreInsights, ...commonPayload.actionNow, ...commonPayload.evidence],
    2,
    4,
  );

  return { type, title, items };
};

const parseSupplementByService = (
  serviceType: SajuAnalysisServiceId,
  payload: Record<string, unknown>,
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  serviceCandidates: string[],
): SajuReportSupplement => {
  const ownership = SUPPLEMENT_OWNERSHIP_RULES[serviceType];
  const executionMinimums = SUPPLEMENT_EXECUTION_MINIMUMS_BY_SERVICE[serviceType];
  const rawSupplement = isRecord(payload.supplement) ? payload.supplement : {};
  const rawExecution = isRecord(rawSupplement.executionProtocol) ? rawSupplement.executionProtocol : {};
  const checkpointFallbacks = SUPPLEMENT_CHECKPOINT_FALLBACKS[serviceType];
  const fallbackCandidates = uniqueItems([
    ...serviceCandidates,
    ...commonPayload.coreInsights,
    ...commonPayload.actionNow,
    ...commonPayload.evidence,
  ]);

  const deepInsightSummary = normalizeLifetimeParagraph(
    rawSupplement.deepInsightSummary,
    [...serviceCandidates, ...commonPayload.coreInsights, `${ownership.focusAxis} 중심으로 해석을 재정렬하세요.`],
    ownership.forbiddenKeywords,
  );

  const deepDivePoints = normalizeLifetimeList(
    toStringArray(rawSupplement.deepDivePoints, toStringArray(rawSupplement.interpretationLenses, [], 8), 8),
    [...serviceCandidates, ...commonPayload.coreInsights, `${ownership.focusAxis} 기준 문장을 먼저 고정하세요.`],
    3,
    5,
    ownership.forbiddenKeywords,
  );

  const executionFallbacks: SajuReportSupplementExecutionProtocol = {
    today: [
      "오늘 우선 항목의 담당·기한·측정 기준을 확정하고 바로 실행하세요.",
      "오늘 우선 과제 1개만 선택해 완료 기준을 문장으로 고정하세요.",
    ],
    thisWeek: [
      "이번 주 핵심 과제 2개를 분리하고 각 과제의 책임자와 마감일을 확정해 실행하세요.",
      "이번 주 전환 리스크 점검 루틴을 2회 고정해 판단 오류를 줄이세요.",
    ],
    thisMonth: [
      "이번 달 실행 지표 2개를 정하고 주차별 점검 일정을 캘린더에 고정하세요.",
      "이번 달 우선순위 드리프트를 막기 위해 주간 리뷰 기준을 먼저 확정하세요.",
    ],
    avoid: [
      "기준 없는 과속 결정을 피하고 검증 항목이 없는 확장 판단은 보류하세요.",
      "감정 반응으로 우선순위를 바꾸지 말고 사전 기준표를 먼저 확인하세요.",
    ],
  };

  const executionProtocolSeed: SajuReportSupplementExecutionProtocol = {
    today: normalizeLifetimeList(
      toStringArray(rawExecution.today, [], 6),
      [...commonPayload.actionNow, ...serviceCandidates],
      executionMinimums.todayMin,
      executionMinimums.todayMax,
      ownership.forbiddenKeywords,
      { action: true, actionFallback: executionFallbacks.today[0] },
    ),
    thisWeek: normalizeLifetimeList(
      toStringArray(rawExecution.thisWeek, [], 6),
      [...commonPayload.actionNow, ...serviceCandidates],
      executionMinimums.thisWeekMin,
      executionMinimums.thisWeekMax,
      ownership.forbiddenKeywords,
      { action: true, actionFallback: executionFallbacks.thisWeek[0] },
    ),
    thisMonth: normalizeLifetimeList(
      toStringArray(rawExecution.thisMonth, [], 6),
      [...serviceCandidates, ...commonPayload.coreInsights],
      executionMinimums.thisMonthMin,
      executionMinimums.thisMonthMax,
      ownership.forbiddenKeywords,
      { action: true, actionFallback: executionFallbacks.thisMonth[0] },
    ),
    avoid: normalizeLifetimeList(
      toStringArray(rawExecution.avoid, [], 6),
      [...commonPayload.evidence, "과속 판단을 피하고 기준을 먼저 고정하세요."],
      executionMinimums.avoidMin,
      executionMinimums.avoidMax,
      ownership.forbiddenKeywords,
    ),
  };
  const executionProtocol =
    serviceType === "saju-yearly-action-calendar"
      ? {
          today: [],
          thisWeek: [],
          thisMonth: [],
          avoid: [],
        }
      : dedupeSupplementExecutionProtocol(executionProtocolSeed, executionFallbacks, executionMinimums);

  const checkpointQuestions = normalizeLifetimeList(
    toStringArray(rawSupplement.checkpointQuestions, [], 8),
    [...checkpointFallbacks, ...fallbackCandidates],
    2,
    4,
    ownership.forbiddenKeywords,
  );

  const expectedVisualType = SUPPLEMENT_VISUAL_TYPE_BY_SERVICE[serviceType];
  const visualFallback = buildDefaultVisualExplainer(serviceType, serviceCandidates, commonPayload);
  const parsedVisualExplainers = Array.isArray(rawSupplement.visualExplainers)
    ? rawSupplement.visualExplainers
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map((item) => {
          const type = normalizeSupplementVisualType(item.type, expectedVisualType);
          const title = toStringValue(item.title, SUPPLEMENT_VISUAL_TITLE_BY_SERVICE[serviceType]);
          const items = normalizeLifetimeList(
            toStringArray(item.items, [], 8),
            [...serviceCandidates, ...fallbackCandidates],
            2,
            4,
            ownership.forbiddenKeywords,
          );
          return { type, title, items };
        })
    : [];

  const visualExplainers =
    parsedVisualExplainers.length > 0
      ? parsedVisualExplainers.slice(0, 2)
      : [visualFallback];

  return {
    deepInsightSummary,
    deepDivePoints,
    executionProtocol,
    checkpointQuestions,
    visualExplainers,
  };
};

const resolveQuarterIndex = (value: unknown, fallbackIndex: number): number => {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!raw) {
    return fallbackIndex;
  }
  if (raw === "1분기" || raw === "q1" || raw === "1q" || raw === "1") return 0;
  if (raw === "2분기" || raw === "q2" || raw === "2q" || raw === "2") return 1;
  if (raw === "3분기" || raw === "q3" || raw === "3q" || raw === "3") return 2;
  if (raw === "4분기" || raw === "q4" || raw === "4q" || raw === "4") return 3;
  return fallbackIndex;
};

const buildNewYearFallbackTimeline = (
  summary: string,
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
): NewYearTimelineNode[] =>
  NEW_YEAR_QUARTERS.map((quarter, index) => ({
    quarter,
    quarterSummary: commonPayload.coreInsights[index] ?? summary,
    opportunity: commonPayload.coreInsights[index] ?? summary,
    caution: commonPayload.evidence[index] ?? "과속 판단을 경계하세요.",
    action: commonPayload.actionNow[index] ?? "이번 분기 핵심 우선순위를 1개로 고정하세요.",
  }));

const formatDateInTimeZone = (date: Date, timeZone?: string): { year: number; month: number; day: number } => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year")?.value ?? NaN);
    const month = Number(parts.find((part) => part.type === "month")?.value ?? NaN);
    const day = Number(parts.find((part) => part.type === "day")?.value ?? NaN);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return { year, month, day };
    }
  } catch {
    // ignore
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const calculateManAge = (profileData?: UserBirthData, timeZone?: string): number | null => {
  if (!profileData) {
    return null;
  }

  const birthYear = Number(profileData.year);
  const birthMonth = Number(profileData.month);
  const birthDay = Number(profileData.day);
  if (!Number.isFinite(birthYear) || !Number.isFinite(birthMonth) || !Number.isFinite(birthDay)) {
    return null;
  }

  const now = formatDateInTimeZone(new Date(), timeZone);
  let age = now.year - birthYear;
  const birthdayNotPassed =
    now.month < birthMonth ||
    (now.month === birthMonth && now.day < birthDay);
  if (birthdayNotPassed) {
    age -= 1;
  }

  return clamp(age, 0, 89);
};

const parseDaeunPeriods = (value: unknown, anchorYear: number): DaeunPeriod[] => {
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
          ? anchorYear >= startYear && anchorYear <= endYear
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

const parseAnalysisBlocks = (value: unknown, fallback: SajuAnalysisBlock[]): SajuAnalysisBlock[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      windowLabel: toStringValue(item.windowLabel),
      timeRange: toStringValue(item.timeRange),
      coreFlow: toStringValue(item.coreFlow),
      evidence: toStringValue(item.evidence),
      opportunities: toStringArray(item.opportunities, [], 4),
      risks: toStringArray(item.risks, [], 4),
      actionStrategy: toStringArray(item.actionStrategy, [], 4),
    }))
    .filter((item) => item.windowLabel && item.coreFlow && item.evidence);

  return normalized.length > 0 ? normalized : fallback;
};

const isCareerStageId = (value: unknown): value is SajuCareerStageFlowItem["stageId"] =>
  value === "build-up" || value === "transition" || value === "expansion" || value === "stabilization";

const buildCareerStageFlowFallback = (
  careerWindow: string,
  decisionTree: string[],
  executionChecklist: string[],
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  currentYear: number,
): {
  careerArcSummary: string;
  transitionSignal: string;
  currentYearFocus: string;
  stageFlow: SajuCareerStageFlowItem[];
  analysisBlocks: SajuAnalysisBlock[];
} => {
  const stageFlow = CAREER_STAGE_TEMPLATES.map((stage, index) => {
    const evidenceFallback =
      commonPayload.evidence[index] ??
      commonPayload.evidence[index % Math.max(commonPayload.evidence.length, 1)] ??
      `${stage.label}에서는 역할 적합성과 실행 기준의 정합성을 점검해야 합니다.`;
    const opportunityFallback =
      decisionTree[index] ??
      commonPayload.coreInsights[index] ??
      `${stage.label}에서는 이전 단계에서 축적한 기준을 다음 단계 자산으로 전환할 수 있습니다.`;
    const riskFallback =
      commonPayload.evidence[(index + 1) % Math.max(commonPayload.evidence.length, 1)] ??
      `${stage.label}에서 기준 없이 속도만 높이면 다음 단계 충돌이 커질 수 있습니다.`;
    const actionFallback =
      executionChecklist[index] ??
      commonPayload.actionNow[index] ??
      `${stage.timeRange} 구간의 핵심 과제 2개를 고정하고 담당·기한·측정 기준을 함께 기록하세요.`;

    const coreFlow =
      index === 0
        ? toLifetimeSentence(`${careerWindow} ${stage.defaultCoreFlow}`.replace(/\s+/g, " ").trim())
        : toLifetimeSentence(stage.defaultCoreFlow);

    return {
      stageId: stage.stageId,
      label: stage.label,
      timeRange: stage.timeRange,
      coreFlow,
      evidence: toLifetimeSentence(evidenceFallback),
      opportunities: [toLifetimeSentence(opportunityFallback), toLifetimeSentence(stage.defaultCoreFlow)],
      risks: [toLifetimeSentence(riskFallback), toLifetimeSentence(stage.defaultTransitionSignal)],
      actionStrategy: [toLifetimeSentence(actionFallback), toLifetimeSentence(stage.defaultTransitionSignal)],
      transitionSignal: toLifetimeSentence(stage.defaultTransitionSignal),
    } satisfies SajuCareerStageFlowItem;
  });

  const analysisBlocks = stageFlow.map((stage) => ({
    windowLabel: stage.label,
    timeRange: stage.timeRange,
    coreFlow: stage.coreFlow,
    evidence: stage.evidence,
    opportunities: [...stage.opportunities],
    risks: [...stage.risks],
    actionStrategy: [...stage.actionStrategy],
  }));

  return {
    careerArcSummary: toLifetimeSentence(
      `${careerWindow} 초기 축적기에서 만든 기준을 전환기·확장기·안정화기로 이어 붙여 장기 커리어 축을 설계하세요.`,
    ),
    transitionSignal: toLifetimeSentence(
      "단계마다 역할 적합 기준과 환경 적합 기준이 동시에 충족될 때 다음 단계 전환 신호로 판단하세요.",
    ),
    currentYearFocus: toLifetimeSentence(
      `${currentYear}년은 장기 단계 전략을 점검하는 보조 연도이며, 단년도 성과보다 단계 전환 준비도를 우선 확인해야 합니다.`,
    ),
    stageFlow,
    analysisBlocks,
  };
};

const parseCareerStageFlow = (value: unknown, fallback: SajuCareerStageFlowItem[]): SajuCareerStageFlowItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const fallbackStage = fallback[index] ?? fallback[fallback.length - 1];
      const stageId = isCareerStageId(item.stageId) ? item.stageId : fallbackStage.stageId;
      return {
        stageId,
        label: toStringValue(item.label, fallbackStage.label),
        timeRange: toStringValue(item.timeRange, fallbackStage.timeRange),
        coreFlow: toStringValue(item.coreFlow, fallbackStage.coreFlow),
        evidence: toStringValue(item.evidence, fallbackStage.evidence),
        opportunities: toStringArray(item.opportunities, fallbackStage.opportunities, 4),
        risks: toStringArray(item.risks, fallbackStage.risks, 4),
        actionStrategy: toStringArray(item.actionStrategy, fallbackStage.actionStrategy, 4),
        transitionSignal: toStringValue(item.transitionSignal, fallbackStage.transitionSignal),
      } satisfies SajuCareerStageFlowItem;
    })
    .filter((item) => item.label && item.coreFlow && item.evidence);

  if (normalized.length === 0) {
    return fallback;
  }

  const byStageId = new Map(normalized.map((item) => [item.stageId, item] as const));
  return CAREER_STAGE_TEMPLATES.map((stage, index) => {
    const fallbackStage = fallback[index] ?? fallback[fallback.length - 1];
    const source = byStageId.get(stage.stageId) ?? normalized[index] ?? fallbackStage;
    return {
      stageId: stage.stageId,
      label: toStringValue(source.label, fallbackStage.label),
      timeRange: toStringValue(source.timeRange, fallbackStage.timeRange),
      coreFlow: toStringValue(source.coreFlow, fallbackStage.coreFlow),
      evidence: toStringValue(source.evidence, fallbackStage.evidence),
      opportunities: toStringArray(source.opportunities, fallbackStage.opportunities, 4),
      risks: toStringArray(source.risks, fallbackStage.risks, 4),
      actionStrategy: toStringArray(source.actionStrategy, fallbackStage.actionStrategy, 4),
      transitionSignal: toStringValue(source.transitionSignal, fallbackStage.transitionSignal),
    } satisfies SajuCareerStageFlowItem;
  });
};

const isWealthLifecyclePhaseType = (value: unknown): value is SajuWealthLifecyclePhaseType =>
  value === "accumulation" || value === "expansion" || value === "defense" || value === "volatility";

const normalizeWealthLifecyclePhaseType = (
  value: unknown,
  fallback: SajuWealthLifecyclePhaseType,
): SajuWealthLifecyclePhaseType => {
  if (isWealthLifecyclePhaseType(value)) {
    return value;
  }
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("축적")) {
    return "accumulation";
  }
  if (normalized.includes("확장")) {
    return "expansion";
  }
  if (normalized.includes("방어")) {
    return "defense";
  }
  if (normalized.includes("변동")) {
    return "volatility";
  }
  return fallback;
};

const getWealthLifecycleLabel = (phaseType: SajuWealthLifecyclePhaseType): string =>
  WEALTH_LIFECYCLE_TEMPLATES.find((template) => template.phaseType === phaseType)?.label ?? "단계";

const toWealthLifecycleAnalysisBlock = (
  stage: SajuWealthLifecycleStage,
  evidenceFallback: string,
): SajuAnalysisBlock => ({
  windowLabel: getWealthLifecycleLabel(stage.phaseType),
  timeRange: stage.timeRange,
  coreFlow: stage.coreObjective,
  evidence: evidenceFallback,
  opportunities: [stage.opportunity, stage.transitionSignal].map((item) => toLifetimeSentence(item)).filter(Boolean),
  risks: [stage.risk, stage.transitionSignal].map((item) => toLifetimeSentence(item)).filter(Boolean),
  actionStrategy: ensureMinItems(
    stage.operatingRules.map((item) => toLifetimeSentence(item)).filter(Boolean),
    [
      "현재 구간 운영 원칙을 먼저 고정하고 다음 단계 전환 조건을 함께 기록하세요.",
      "구간별 방어 한도와 확장 조건을 분리해 월 단위로 추적하세요.",
    ],
    2,
    4,
  ),
});

type WealthLifecycleFallbackArtifacts = {
  wealthLifecycleStages: SajuWealthLifecycleStage[];
  analysisBlocks: SajuAnalysisBlock[];
};

const buildWealthLifecycleFallbackArtifacts = (
  context: LifetimeAnchorContext,
  cashflowMap: string,
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  riskZones: string[],
  assetRules: string[],
  assetTrendEvidence: SajuReportPayloadMap["saju-wealth-flow"]["assetTrendEvidence"] = [],
): WealthLifecycleFallbackArtifacts => {
  const trendNarratives = (assetTrendEvidence ?? [])
    .flatMap((point) => [point.interpretation, point.reasonSummary, ...(point.reasonDetails ?? [])])
    .map((item) => toLifetimeSentence(item))
    .filter(Boolean);

  const stages = WEALTH_LIFECYCLE_TEMPLATES.map((template, index) => {
    const currentAge = context.currentAge;
    const ageStart = currentAge === null ? null : clamp(currentAge + template.ageStartOffset, 0, 89);
    const ageEnd = currentAge === null ? null : clamp(currentAge + template.ageEndOffset, 0, 89);
    const yearStart = context.currentYear + template.yearStartOffset;
    const yearEnd = context.currentYear + template.yearEndOffset;

    const coreObjectiveFallback =
      index === 0
        ? `${cashflowMap} ${template.defaultObjective}`.replace(/\s+/g, " ").trim()
        : template.defaultObjective;
    const opportunityFallback =
      commonPayload.coreInsights[index] ??
      commonPayload.coreInsights[index % Math.max(commonPayload.coreInsights.length, 1)] ??
      template.defaultOpportunity;
    const riskFallback =
      riskZones[index] ??
      commonPayload.evidence[index] ??
      commonPayload.evidence[index % Math.max(commonPayload.evidence.length, 1)] ??
      template.defaultRisk;
    const transitionFallback =
      trendNarratives[index] ??
      commonPayload.actionNow[index] ??
      commonPayload.actionNow[index % Math.max(commonPayload.actionNow.length, 1)] ??
      template.defaultTransitionSignal;

    const operatingRules = ensureMinItems(
      uniqueItems([
        assetRules[index] ?? "",
        assetRules[index + 1] ?? "",
        ...template.defaultOperatingRules,
      ])
        .map((item) => toLifetimeSentence(item))
        .filter(Boolean),
      template.defaultOperatingRules.map((item) => toLifetimeSentence(item)),
      2,
      4,
    );

    return {
      phaseType: template.phaseType,
      timeRange: template.timeRange,
      ageRange: toAgeRangeLabel(ageStart, ageEnd),
      yearRange: toYearRangeLabel(yearStart, yearEnd),
      coreObjective: toLifetimeSentence(coreObjectiveFallback),
      opportunity: toLifetimeSentence(opportunityFallback),
      risk: toLifetimeSentence(riskFallback),
      operatingRules,
      transitionSignal: toLifetimeSentence(transitionFallback || template.defaultTransitionSignal),
    } satisfies SajuWealthLifecycleStage;
  });

  const analysisBlocks = stages.map((stage, index) => {
    const evidenceFallback =
      commonPayload.evidence[index] ??
      trendNarratives[index] ??
      commonPayload.evidence[index % Math.max(commonPayload.evidence.length, 1)] ??
      `${getWealthLifecycleLabel(stage.phaseType)} 구간의 해석 근거를 월별 지표로 점검하세요.`;
    return toWealthLifecycleAnalysisBlock(stage, toLifetimeSentence(evidenceFallback));
  });

  return { wealthLifecycleStages: stages, analysisBlocks };
};

const parseWealthLifecycleStages = (
  value: unknown,
  fallback: SajuWealthLifecycleStage[],
): SajuWealthLifecycleStage[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const fallbackStage = fallback[index] ?? fallback[fallback.length - 1];
      const phaseType = normalizeWealthLifecyclePhaseType(item.phaseType, fallbackStage.phaseType);
      return {
        phaseType,
        timeRange: toStringValue(item.timeRange, fallbackStage.timeRange),
        ageRange: toStringValue(item.ageRange, fallbackStage.ageRange),
        yearRange: toStringValue(item.yearRange, fallbackStage.yearRange),
        coreObjective: toStringValue(item.coreObjective, fallbackStage.coreObjective),
        opportunity: toStringValue(item.opportunity, fallbackStage.opportunity),
        risk: toStringValue(item.risk, fallbackStage.risk),
        operatingRules: toStringArray(item.operatingRules, fallbackStage.operatingRules, 4),
        transitionSignal: toStringValue(item.transitionSignal, fallbackStage.transitionSignal),
      } satisfies SajuWealthLifecycleStage;
    })
    .filter((item) => item.coreObjective.length > 0 && item.opportunity.length > 0 && item.risk.length > 0);

  if (normalized.length === 0) {
    return fallback;
  }

  const byPhaseType = new Map(normalized.map((item) => [item.phaseType, item] as const));
  return WEALTH_LIFECYCLE_TEMPLATES.map((template, index) => {
    const fallbackStage = fallback[index] ?? fallback[fallback.length - 1];
    const source = byPhaseType.get(template.phaseType) ?? normalized[index] ?? fallbackStage;
    return {
      phaseType: template.phaseType,
      timeRange: toStringValue(source.timeRange, fallbackStage.timeRange),
      ageRange: toStringValue(source.ageRange, fallbackStage.ageRange),
      yearRange: toStringValue(source.yearRange, fallbackStage.yearRange),
      coreObjective: toStringValue(source.coreObjective, fallbackStage.coreObjective),
      opportunity: toStringValue(source.opportunity, fallbackStage.opportunity),
      risk: toStringValue(source.risk, fallbackStage.risk),
      operatingRules: ensureMinItems(
        toStringArray(source.operatingRules, fallbackStage.operatingRules, 4),
        fallbackStage.operatingRules,
        2,
        4,
      ),
      transitionSignal: toStringValue(source.transitionSignal, fallbackStage.transitionSignal),
    } satisfies SajuWealthLifecycleStage;
  });
};

type LifetimeAnchorContext = {
  currentYear: number;
  currentAge: number | null;
  birthYear?: number;
};

type DaeunShiftFallbackArtifacts = {
  analysisBlocks: SajuAnalysisBlock[];
  phaseRoadmap: SajuDaeunPhaseRoadmapItem[];
  longHorizonDirection: string[];
};

type HelperNetworkFallbackArtifacts = {
  analysisBlocks: SajuAnalysisBlock[];
  phaseRoadmap: SajuHelperPhaseRoadmapItem[];
  longHorizonDirection: string[];
};

const buildLifetimeAnchorContext = (req?: SajuAnalysisRequest): LifetimeAnchorContext => {
  const meta = req?.sajuData?.profileMeta;
  const profileData = meta?.profileData;
  const timeZone = meta?.timezone;
  const calculatedAge = calculateManAge(profileData, timeZone);
  const currentYearCandidate = Number(meta?.currentYear ?? NaN);
  const nowYear = formatDateInTimeZone(new Date(), timeZone).year;
  const currentYear = Number.isFinite(currentYearCandidate) ? currentYearCandidate : nowYear;
  const birthYearCandidate = Number(profileData?.year ?? NaN);

  return {
    currentYear,
    currentAge: calculatedAge,
    birthYear: Number.isFinite(birthYearCandidate) ? birthYearCandidate : undefined,
  };
};

const toAgeRangeLabel = (startAge: number | null, endAge: number | null): string => {
  if (startAge === null || endAge === null) {
    return "연령 정보 기준 자동 보정";
  }
  return `${startAge}~${endAge}세`;
};

const toYearRangeLabel = (startYear: number, endYear: number): string => `${startYear}~${endYear}년`;

const buildDaeunShiftFallbackArtifacts = (
  context: LifetimeAnchorContext,
  transitionSignal: string,
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  ninetyDayActions: string[],
  avoidanceScenario: string[],
): DaeunShiftFallbackArtifacts => {
  const currentYear = context.currentYear;
  const currentAge = context.currentAge;
  const phases = [
    { phaseLabel: "전환 전 준비기", windowLabel: "전환 전 준비기", yearStart: currentYear - 2, yearEnd: currentYear - 1, ageStart: currentAge === null ? null : clamp(currentAge - 2, 0, 89), ageEnd: currentAge === null ? null : clamp(currentAge - 1, 0, 89) },
    { phaseLabel: "전환기", windowLabel: "전환기", yearStart: currentYear, yearEnd: currentYear + 1, ageStart: currentAge === null ? null : clamp(currentAge, 0, 89), ageEnd: currentAge === null ? null : clamp(currentAge + 1, 0, 89) },
    { phaseLabel: "전환 후 재배치기", windowLabel: "전환 후 재배치기", yearStart: currentYear + 2, yearEnd: currentYear + 4, ageStart: currentAge === null ? null : clamp(currentAge + 2, 0, 89), ageEnd: currentAge === null ? null : clamp(currentAge + 4, 0, 89) },
    { phaseLabel: "전환 후 정착기", windowLabel: "전환 후 정착기", yearStart: currentYear + 5, yearEnd: currentYear + 10, ageStart: currentAge === null ? null : clamp(currentAge + 5, 0, 89), ageEnd: currentAge === null ? null : clamp(currentAge + 10, 0, 89) },
  ] as const;

  const coreFlowFallbacks = [
    `${transitionSignal}의 전조를 정리하고 기준을 고정해 전환기 혼선을 줄이는 단계입니다.`,
    `${currentYear}년은 전환 촉발 연도이며, 우선순위를 재정렬해 기준을 재설정하는 단계입니다.`,
    `전환 후 1~2년은 자원 재배치와 운영 모델 재정렬로 손실을 줄이는 단계입니다.`,
    `전환 후 3~5년~6~10년은 정착과 확장을 병행하며 장기 성장 구조를 고정하는 단계입니다.`,
  ];
  const evidenceFallbacks = [
    commonPayload.evidence[0] ?? `${transitionSignal} 전조가 이미 누적되어 전환 준비가 필요한 상태입니다.`,
    commonPayload.evidence[1] ?? `${currentYear}년 전후로 의사결정 압력이 집중되어 전환기 대응이 중요합니다.`,
    commonPayload.evidence[2] ?? "전환 직후에는 확장보다 재배치가 우선이며 기준 고정이 회복 속도를 좌우합니다.",
    commonPayload.evidence[3] ?? "정착기에는 단기 반응보다 운영 규칙의 지속성이 성과 변동을 줄입니다.",
  ];

  const opportunitiesByPhase = [
    [
      commonPayload.coreInsights[0] ?? "전환기 오판을 줄이기 위해 기존 패턴을 문장으로 정리할 수 있습니다.",
      "핵심 관계·역할·자금의 우선순위를 전환 전에 확정하면 충격을 완화할 수 있습니다.",
    ],
    [
      commonPayload.coreInsights[1] ?? "전환기에는 선택 축을 좁히면 판단 품질을 유지할 수 있습니다.",
      "핵심 기준을 고정하면 외부 압력 속에서도 의사결정 일관성을 확보할 수 있습니다.",
    ],
    [
      "전환 후 1~2년은 손실을 줄이는 재배치 규칙을 만들기 좋은 구간입니다.",
      "운영 지표를 월 단위로 재정의하면 다음 확장 구간의 안정성이 높아집니다.",
    ],
    [
      "전환 후 3~5년에는 고정 수익·고정 루틴 축을 강화해 확장 기반을 만들 수 있습니다.",
      "전환 후 6~10년에는 정착된 운영 기준을 기반으로 안정적 성장 구조를 고도화할 수 있습니다.",
    ],
  ];
  const risksByPhase = [
    [
      avoidanceScenario[0] ?? "정리 없이 전환기에 진입하면 기준 없는 대응이 반복될 수 있습니다.",
      "준비기에서 우선순위를 고정하지 않으면 전환기 소모가 급증할 수 있습니다.",
    ],
    [
      avoidanceScenario[1] ?? "전환기의 감정 반응형 의사결정은 중기 운영 안정성을 훼손할 수 있습니다.",
      "단기 성과만 추적하면 전환 후 재배치기를 놓칠 수 있습니다.",
    ],
    [
      avoidanceScenario[2] ?? "전환 후 1~2년에 과속 확장을 선택하면 회복 자원이 급격히 줄어들 수 있습니다.",
      "재배치기 기준 없이 실행하면 정착기 누적 성과가 약해질 수 있습니다.",
    ],
    [
      avoidanceScenario[3] ?? "정착기에 기준 점검을 멈추면 3~5년 이후 성장 탄력이 둔화될 수 있습니다.",
      "단기 변동에 과민 반응하면 6~10년 장기 축이 흔들릴 수 있습니다.",
    ],
  ];
  const actionByPhase = [
    [
      commonPayload.actionNow[0] ?? "전환 전 준비기에는 정리 대상과 유지 대상을 문장으로 분리하세요.",
      "전환 직전 2년의 반복 패턴을 기록해 전환기 금지 행동을 고정하세요.",
    ],
    [
      ninetyDayActions[0] ?? "전환기에는 의사결정 축을 1~2개로 제한하고 검증 기준을 먼저 확정하세요.",
      "전환 촉발 연도에는 주 단위가 아닌 월 단위 지표로 기준 이탈을 관리하세요.",
    ],
    [
      ninetyDayActions[1] ?? "전환 후 1~2년은 역할·자금·관계 재배치 규칙을 분리해 운영하세요.",
      "재배치기의 핵심 지표를 3개 이내로 고정하고 분기마다 보정하세요.",
    ],
    [
      ninetyDayActions[2] ?? "전환 후 3~5년/6~10년은 정착 지표와 확장 지표를 분리해 추적하세요.",
      "정착기에는 단기 이벤트 대응보다 장기 운영 규칙 갱신 주기를 고정하세요.",
    ],
  ];

  const phaseRoadmap = phases.map((phase, index) => ({
    phaseLabel: phase.phaseLabel,
    ageRange: toAgeRangeLabel(phase.ageStart, phase.ageEnd),
    yearRange: toYearRangeLabel(phase.yearStart, phase.yearEnd),
    coreFlow: coreFlowFallbacks[index],
    evidence: evidenceFallbacks[index],
    opportunities: opportunitiesByPhase[index],
    risks: risksByPhase[index],
    actionStrategy: actionByPhase[index],
  }));

  const analysisBlocks: SajuAnalysisBlock[] = phaseRoadmap.map((phase, index) => ({
    windowLabel: phases[index].windowLabel,
    timeRange: phase.yearRange,
    coreFlow: phase.coreFlow,
    evidence: phase.evidence,
    opportunities: phase.opportunities,
    risks: phase.risks,
    actionStrategy: phase.actionStrategy,
  }));

  const longHorizonDirection = [
    "1~2년: 전환 직후에는 확장보다 재배치와 기준 고정을 우선해 손실 변동을 줄이세요.",
    "3~5년: 재배치된 운영 모델을 반복 실행해 안정적인 성과 구조를 구축하세요.",
    "6~10년: 정착된 기준을 기반으로 확장 축을 선택적으로 늘려 장기 성장 탄력을 유지하세요.",
  ];

  return {
    analysisBlocks,
    phaseRoadmap,
    longHorizonDirection,
  };
};

const parseDaeunPhaseRoadmap = (
  value: unknown,
  fallback: SajuDaeunPhaseRoadmapItem[],
): SajuDaeunPhaseRoadmapItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      phaseLabel: toStringValue(item.phaseLabel),
      ageRange: toStringValue(item.ageRange),
      yearRange: toStringValue(item.yearRange),
      coreFlow: toStringValue(item.coreFlow),
      evidence: toStringValue(item.evidence),
      opportunities: toStringArray(item.opportunities, [], 4),
      risks: toStringArray(item.risks, [], 4),
      actionStrategy: toStringArray(item.actionStrategy, [], 4),
    }))
    .filter((item) => item.phaseLabel.length > 0 && item.coreFlow.length > 0 && item.evidence.length > 0);

  if (parsed.length === 0) {
    return fallback;
  }

  return fallback.map((seed, index) => {
    const item = parsed[index] ?? {};
    return {
      phaseLabel: toStringValue((item as { phaseLabel?: unknown }).phaseLabel, seed.phaseLabel),
      ageRange: toStringValue((item as { ageRange?: unknown }).ageRange, seed.ageRange),
      yearRange: toStringValue((item as { yearRange?: unknown }).yearRange, seed.yearRange),
      coreFlow: toStringValue((item as { coreFlow?: unknown }).coreFlow, seed.coreFlow),
      evidence: toStringValue((item as { evidence?: unknown }).evidence, seed.evidence),
      opportunities: toStringArray((item as { opportunities?: unknown }).opportunities, seed.opportunities, 4),
      risks: toStringArray((item as { risks?: unknown }).risks, seed.risks, 4),
      actionStrategy: toStringArray((item as { actionStrategy?: unknown }).actionStrategy, seed.actionStrategy, 4),
    };
  });
};

const HELPER_PHASE_TEMPLATES: Array<{
  phaseLabel: string;
  timeRange: string;
  yearStartOffset: number;
  yearEndOffset: number;
  relationshipExpansion: string;
  collaborationFlow: string;
  mentorInfluxSignal: string;
  guardPattern: string;
  actionStrategy: string[];
}> = [
  {
    phaseLabel: "관계 기반 정비기",
    timeRange: "0~2년",
    yearStartOffset: 0,
    yearEndOffset: 2,
    relationshipExpansion: "가까운 관계와 느슨한 연결을 분리해 관계 자산의 기준을 고정하는 구간입니다.",
    collaborationFlow: "협업 역할·권한·기대치를 문장으로 합의해 초기 충돌 비용을 낮추는 구간입니다.",
    mentorInfluxSignal: "피드백 밀도가 높고 후속 연결 제안이 반복되면 멘토·귀인 유입 신호로 해석합니다.",
    guardPattern: "요청 경계선이 불명확한 관계를 방치하면 에너지 소모가 누적되는 패턴을 경계하세요.",
    actionStrategy: [
      "0~2년에는 관계 레이어별 핵심 인물 1명씩을 지정하고 접점 기준을 문장으로 고정하세요.",
      "분기마다 관계 정리 대상과 유지 대상을 분리해 협업 과밀을 차단하세요.",
    ],
  },
  {
    phaseLabel: "협업 확장기",
    timeRange: "3~5년",
    yearStartOffset: 3,
    yearEndOffset: 5,
    relationshipExpansion: "핵심 신뢰 관계를 중심으로 협업 채널을 선택적으로 확장하는 구간입니다.",
    collaborationFlow: "역할 충돌이 발생하기 쉬운 지점을 먼저 공개해 운영 규칙을 표준화하는 구간입니다.",
    mentorInfluxSignal: "협업 결과가 제3자 추천이나 소개로 연결되면 중기 귀인 유입이 강화되는 신호입니다.",
    guardPattern: "관계 확장 속도가 합의 속도보다 빠르면 협업 오해가 반복되는 패턴을 경계하세요.",
    actionStrategy: [
      "3~5년에는 협업 프로젝트별 권한 범위와 의사결정 기준을 선명하게 분리하세요.",
      "반기마다 협업 성과보다 갈등 재발률을 먼저 점검해 운영 기준을 보정하세요.",
    ],
  },
  {
    phaseLabel: "귀인 유입기",
    timeRange: "6~10년",
    yearStartOffset: 6,
    yearEndOffset: 10,
    relationshipExpansion: "확장된 네트워크에서 장기 협력 가치가 높은 연결을 선별하는 구간입니다.",
    collaborationFlow: "전략형·실행형 조력자를 조합해 협업 구조를 고도화하는 구간입니다.",
    mentorInfluxSignal: "상위 관점 조언과 자원 연결 제안이 동시에 발생하면 장기 멘토 유입 신호입니다.",
    guardPattern: "성과 중심 연결만 추구하면 신뢰 누적이 약화되는 단절 패턴을 경계하세요.",
    actionStrategy: [
      "6~10년에는 멘토군과 실행 파트너군을 분리해 협업 역할 충돌을 줄이세요.",
      "연간 기준으로 귀인 연결 성과를 측정하고 장기 동행 가능성을 재평가하세요.",
    ],
  },
  {
    phaseLabel: "관계 자산 전수기",
    timeRange: "10년+",
    yearStartOffset: 11,
    yearEndOffset: 14,
    relationshipExpansion: "누적된 관계 자산을 전수·승계 구조로 전환해 지속 가능성을 높이는 구간입니다.",
    collaborationFlow: "개인 의존형 협업에서 체계 의존형 협업으로 전환해 재현성을 확보하는 구간입니다.",
    mentorInfluxSignal: "직접 조언보다 관계망 소개 요청이 증가하면 전수기 귀인 구조가 작동하는 신호입니다.",
    guardPattern: "핵심 관계를 개인 감각으로만 운영하면 전수 실패 패턴이 반복될 수 있음을 경계하세요.",
    actionStrategy: [
      "10년+ 구간에서는 관계 운영 원칙을 문서화해 후속 협업에 전수하세요.",
      "장기 신뢰 관계의 유지 기준과 종료 기준을 분리해 관계 자산의 품질을 보호하세요.",
    ],
  },
];

const buildHelperNetworkFallbackArtifacts = (
  context: LifetimeAnchorContext,
  helperMap: string,
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  conflictPatterns: string[],
  networkGuide: string[],
): HelperNetworkFallbackArtifacts => {
  const currentYear = context.currentYear;
  const phaseRoadmap = HELPER_PHASE_TEMPLATES.map((phase, index) => {
    const yearStart = currentYear + phase.yearStartOffset;
    const yearEnd = currentYear + phase.yearEndOffset;
    const baseActionFallback = phase.actionStrategy[index % phase.actionStrategy.length] ?? phase.actionStrategy[0];
    return {
      phaseLabel: phase.phaseLabel,
      timeRange: `${phase.timeRange} (${yearStart}~${yearEnd}년)`,
      relationshipExpansion: sanitizeHelperSentence(
        commonPayload.coreInsights[index] ?? phase.relationshipExpansion,
      ),
      collaborationFlow: sanitizeHelperSentence(
        networkGuide[index] ?? phase.collaborationFlow,
      ),
      mentorInfluxSignal: sanitizeHelperSentence(
        commonPayload.evidence[index] ?? phase.mentorInfluxSignal,
      ),
      guardPattern: sanitizeHelperSentence(
        conflictPatterns[index] ?? phase.guardPattern,
      ),
      actionStrategy: ensureMinItems(
        uniqueItems(
          [
            networkGuide[index],
            commonPayload.actionNow[index],
            baseActionFallback,
          ]
            .filter(Boolean)
            .map((item) => sanitizeHelperSentence(item)),
        ),
        phase.actionStrategy.map((item) => sanitizeHelperSentence(item)),
        2,
        3,
      ),
    } satisfies SajuHelperPhaseRoadmapItem;
  });

  const analysisBlocks: SajuAnalysisBlock[] = phaseRoadmap.slice(0, 3).map((phase, index) => ({
    windowLabel: phase.phaseLabel,
    timeRange: phase.timeRange,
    coreFlow: phase.relationshipExpansion,
    evidence: phase.mentorInfluxSignal,
    opportunities: [phase.collaborationFlow, phase.mentorInfluxSignal],
    risks: [phase.guardPattern, conflictPatterns[index] ?? phase.guardPattern].map((item) => sanitizeHelperSentence(item)),
    actionStrategy: phase.actionStrategy.map((item) => sanitizeHelperSentence(item)),
  }));

  const longHorizonDirection = [
    "1~2년: 관계 레이어 정리와 협업 기준 고정으로 관계 자산의 기반을 먼저 구축하세요.",
    "3~5년: 협업 확장 속도보다 역할 합의 속도를 우선해 갈등 재발률을 낮추세요.",
    "6~10년: 멘토·귀인 유입 채널을 유지하면서 관계 자산을 장기 협력 구조로 전환하세요.",
  ];

  return { analysisBlocks, phaseRoadmap, longHorizonDirection };
};

const parseHelperPhaseRoadmap = (
  value: unknown,
  fallback: SajuHelperPhaseRoadmapItem[],
): SajuHelperPhaseRoadmapItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const parsed = value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item) => ({
      phaseLabel: toStringValue(item.phaseLabel),
      timeRange: toStringValue(item.timeRange),
      relationshipExpansion: toStringValue(item.relationshipExpansion),
      collaborationFlow: toStringValue(item.collaborationFlow),
      mentorInfluxSignal: toStringValue(item.mentorInfluxSignal),
      guardPattern: toStringValue(item.guardPattern),
      actionStrategy: toStringArray(item.actionStrategy, [], 4),
    }))
    .filter((item) => item.phaseLabel.length > 0 && item.timeRange.length > 0);

  if (parsed.length === 0) {
    return fallback;
  }

  return fallback.map((seed, index) => {
    const item = parsed[index] ?? {};
    return {
      phaseLabel: toStringValue((item as { phaseLabel?: unknown }).phaseLabel, seed.phaseLabel),
      timeRange: toStringValue((item as { timeRange?: unknown }).timeRange, seed.timeRange),
      relationshipExpansion: toStringValue(
        (item as { relationshipExpansion?: unknown }).relationshipExpansion,
        seed.relationshipExpansion,
      ),
      collaborationFlow: toStringValue((item as { collaborationFlow?: unknown }).collaborationFlow, seed.collaborationFlow),
      mentorInfluxSignal: toStringValue(
        (item as { mentorInfluxSignal?: unknown }).mentorInfluxSignal,
        seed.mentorInfluxSignal,
      ),
      guardPattern: toStringValue((item as { guardPattern?: unknown }).guardPattern, seed.guardPattern),
      actionStrategy: toStringArray((item as { actionStrategy?: unknown }).actionStrategy, seed.actionStrategy, 4),
    } satisfies SajuHelperPhaseRoadmapItem;
  });
};

const dedupeHelperAnalysisBlocks = (
  blocks: SajuAnalysisBlock[],
  fallbackBlocks: SajuAnalysisBlock[],
): SajuAnalysisBlock[] => {
  const seen = new Set<string>();
  const toKey = (value: string) => value.trim().replace(/\s+/g, " ").replace(/[.!?。！？]+$/u, "").toLowerCase();
  const takeDistinct = (
    values: string[],
    fallbackValues: string[],
    min: number,
    max: number,
  ): string[] => {
    const result: string[] = [];
    for (const candidate of [...values, ...fallbackValues]) {
      const normalized = sanitizeHelperSentence(candidate);
      const key = toKey(normalized);
      if (!key || seen.has(key)) {
        continue;
      }
      seen.add(key);
      result.push(normalized);
      if (result.length >= max) {
        break;
      }
    }
    return ensureMinItems(result, fallbackValues.map((item) => sanitizeHelperSentence(item)), min, max);
  };

  return blocks.map((block, index) => {
    const fallback = fallbackBlocks[index] ?? fallbackBlocks[Math.min(index, fallbackBlocks.length - 1)] ?? block;
    const coreFlow = sanitizeHelperSentence(block.coreFlow || fallback.coreFlow);
    const evidence = sanitizeHelperSentence(block.evidence || fallback.evidence);
    return {
      windowLabel: toStringValue(block.windowLabel, fallback.windowLabel),
      timeRange: toStringValue(block.timeRange, fallback.timeRange),
      coreFlow,
      evidence,
      opportunities: takeDistinct(block.opportunities, fallback.opportunities, 2, 4),
      risks: takeDistinct(block.risks, fallback.risks, 2, 4),
      actionStrategy: takeDistinct(block.actionStrategy, fallback.actionStrategy, 2, 4),
    } satisfies SajuAnalysisBlock;
  });
};

const DAEUN_DEDUP_TRAILING_PUNCT_PATTERN = /[.!?。！？]+$/u;

const toDaeunDedupKey = (value: string): string =>
  value.trim().replace(/\s+/g, " ").replace(DAEUN_DEDUP_TRAILING_PUNCT_PATTERN, "").toLowerCase();

const pickDistinctDaeunParagraph = (
  candidates: Array<string | undefined>,
  seen: Set<string>,
  fallback: string,
): string => {
  for (const candidateRaw of candidates) {
    const candidate = toLifetimeSentence(candidateRaw ?? "");
    const dedupKey = toDaeunDedupKey(candidate);
    if (!dedupKey || seen.has(dedupKey)) {
      continue;
    }
    seen.add(dedupKey);
    return candidate;
  }

  const seeded = toLifetimeSentence(fallback);
  const seededKey = toDaeunDedupKey(seeded);
  if (seededKey) {
    seen.add(seededKey);
  }
  return seeded;
};

const pickDistinctDaeunList = (
  primary: string[],
  fallback: string[],
  seen: Set<string>,
  minItems: number,
  maxItems: number,
  phaseLabel: string,
  defaultPrefix: string,
): string[] => {
  const result: string[] = [];
  const source = uniqueItems([...primary, ...fallback].map((item) => toLifetimeSentence(item)));

  const pushDistinct = (candidateRaw: string): boolean => {
    const candidate = toLifetimeSentence(candidateRaw);
    const dedupKey = toDaeunDedupKey(candidate);
    if (!dedupKey || seen.has(dedupKey)) {
      return false;
    }
    seen.add(dedupKey);
    result.push(candidate);
    return true;
  };

  for (const candidate of source) {
    if (result.length >= maxItems) {
      break;
    }
    pushDistinct(candidate);
  }

  let sequence = 1;
  while (result.length < minItems && result.length < maxItems) {
    const synthetic = `${phaseLabel}: ${defaultPrefix} ${sequence}순위를 고정해 이전 단계 반복을 차단하세요.`;
    pushDistinct(synthetic);
    sequence += 1;
  }

  return result.slice(0, maxItems);
};

const dedupeDaeunPhaseRoadmap = (
  roadmap: SajuDaeunPhaseRoadmapItem[],
  fallback: SajuDaeunPhaseRoadmapItem[],
): SajuDaeunPhaseRoadmapItem[] => {
  const seenCoreFlow = new Set<string>();
  const seenEvidence = new Set<string>();
  const seenOpportunities = new Set<string>();
  const seenRisks = new Set<string>();
  const seenActions = new Set<string>();

  return roadmap.map((phase, index) => {
    const fallbackPhase = fallback[index] ?? phase;
    const phaseLabel = toStringValue(phase.phaseLabel, fallbackPhase.phaseLabel || `전환 단계 ${index + 1}`);
    return {
      phaseLabel,
      ageRange: toStringValue(phase.ageRange, fallbackPhase.ageRange),
      yearRange: toStringValue(phase.yearRange, fallbackPhase.yearRange),
      coreFlow: pickDistinctDaeunParagraph(
        [phase.coreFlow, fallbackPhase.coreFlow],
        seenCoreFlow,
        `${phaseLabel}에서는 이전 단계와 다른 의사결정 축을 확정해 전환 경로를 분리하세요.`,
      ),
      evidence: pickDistinctDaeunParagraph(
        [phase.evidence, fallbackPhase.evidence],
        seenEvidence,
        `${phaseLabel}의 근거는 이전 단계와 다른 변수 변화에서 확인해야 합니다.`,
      ),
      opportunities: pickDistinctDaeunList(
        phase.opportunities,
        fallbackPhase.opportunities,
        seenOpportunities,
        2,
        4,
        phaseLabel,
        "기회 축",
      ),
      risks: pickDistinctDaeunList(
        phase.risks,
        fallbackPhase.risks,
        seenRisks,
        2,
        4,
        phaseLabel,
        "리스크 통제 축",
      ),
      actionStrategy: pickDistinctDaeunList(
        phase.actionStrategy,
        fallbackPhase.actionStrategy,
        seenActions,
        2,
        4,
        phaseLabel,
        "행동 우선순위",
      ),
    };
  });
};

const buildDynamicDaeunPeriods = (context: LifetimeAnchorContext, existing: DaeunPeriod[]): DaeunPeriod[] => {
  const currentAge = context.currentAge;
  if (currentAge === null) {
    return existing.slice(0, 4);
  }

  const decadeStart = Math.floor(currentAge / 10) * 10;
  const keywords = ["전개 준비기", "현재 핵심 구간", "확장 가속기", "결실 정리기"];
  const defaultScores = [68, 80, 76, 72];
  const ganOrder = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const jiOrder = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
  const ohengOrder: Oheng[] = ["목", "화", "토", "금", "수"];

  const generated = [-1, 0, 1, 2]
    .map((offset, index) => {
      const startAgeRaw = decadeStart + offset * 10;
      const endAgeRaw = startAgeRaw + 9;
      const startAge = clamp(startAgeRaw, 0, 89);
      const endAge = clamp(endAgeRaw, 0, 89);
      if (endAge < startAge) {
        return null;
      }

      const existingByOffset = existing[index];
      const startYearBase =
        typeof context.birthYear === "number"
          ? context.birthYear + startAge
          : context.currentYear - currentAge + startAge;
      const endYearBase =
        typeof context.birthYear === "number"
          ? context.birthYear + endAge
          : context.currentYear - currentAge + endAge;

      return {
        startAge,
        endAge,
        startYear: Number.isFinite(startYearBase) ? startYearBase : undefined,
        endYear: Number.isFinite(endYearBase) ? endYearBase : undefined,
        gan: existingByOffset?.gan ?? ganOrder[((Math.floor(startAge / 10) % 10) + 10) % 10],
        ji: existingByOffset?.ji ?? jiOrder[((Math.floor(startAge / 10) % 12) + 12) % 12],
        oheng: existingByOffset?.oheng ?? ohengOrder[((Math.floor(startAge / 10) % 5) + 5) % 5],
        score: Number.isFinite(existingByOffset?.score ?? NaN)
          ? Number(existingByOffset?.score)
          : defaultScores[index] ?? 70,
        keyword: existingByOffset?.keyword ?? keywords[index] ?? "흐름 조정기",
        isCurrent: offset === 0,
      } satisfies DaeunPeriod;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return generated;
};

const isFixedLegacyPattern = (periods: DaeunPeriod[]): boolean => {
  if (periods.length !== 3) {
    return false;
  }
  const pattern = [
    [35, 44],
    [45, 54],
    [55, 64],
  ];
  return periods.every((period, index) => period.startAge === pattern[index][0] && period.endAge === pattern[index][1]);
};

const normalizeLifetimePeriods = (
  periods: DaeunPeriod[],
  goldenPeriods: GoldenPeriod[],
  context: LifetimeAnchorContext,
): { daeunPeriods: DaeunPeriod[]; goldenPeriods: GoldenPeriod[] } => {
  const sorted = [...periods].sort((a, b) => a.startAge - b.startAge);
  const currentAge = context.currentAge;
  const hasCurrentByAge = typeof currentAge === "number"
    ? sorted.some((period) => currentAge >= period.startAge && currentAge <= period.endAge)
    : sorted.some((period) => period.isCurrent);
  const hasAgeOverflow = sorted.some((period) => period.startAge > 89 || period.endAge > 89);
  const shouldRebuild =
    sorted.length < 4 || isFixedLegacyPattern(sorted) || !hasCurrentByAge || hasAgeOverflow;

  const normalizedBase = shouldRebuild ? buildDynamicDaeunPeriods(context, sorted) : sorted.slice(0, 4);
  const normalized = normalizedBase
    .map((period) => ({
      ...period,
      startAge: clamp(period.startAge, 0, 89),
      endAge: clamp(period.endAge, 0, 89),
    }))
    .filter((period) => period.endAge >= period.startAge)
    .sort((a, b) => a.startAge - b.startAge);

  let currentIndex = normalized.findIndex((period) => period.isCurrent);
  if (typeof currentAge === "number") {
    const indexByAge = normalized.findIndex((period) => currentAge >= period.startAge && currentAge <= period.endAge);
    if (indexByAge >= 0) {
      currentIndex = indexByAge;
    }
  }
  if (currentIndex < 0) {
    currentIndex = Math.min(1, normalized.length - 1);
  }

  const normalizedWithCurrent = normalized.map((period, index) => ({
    ...period,
    isCurrent: index === currentIndex,
  }));

  const periodKey = (startAge: number, endAge: number) => `${startAge}-${endAge}`;
  const periodMap = new Map(normalizedWithCurrent.map((period) => [periodKey(period.startAge, period.endAge), period]));
  const matchedGolden = goldenPeriods
    .filter((period) => periodMap.has(periodKey(period.startAge, period.endAge)))
    .map((period) => ({
      ...period,
      startAge: clamp(period.startAge, 0, 89),
      endAge: clamp(period.endAge, 0, 89),
    }));

  if (matchedGolden.length > 0) {
    return {
      daeunPeriods: normalizedWithCurrent,
      goldenPeriods: matchedGolden,
    };
  }

  const topByScore = [...normalizedWithCurrent]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((period) => ({
      startAge: period.startAge,
      endAge: period.endAge,
      startYear: period.startYear,
      endYear: period.endYear,
      reason: `${period.keyword ?? "집중 구간"}의 성과 가능성이 높은 시기`,
    }));

  return {
    daeunPeriods: normalizedWithCurrent,
    goldenPeriods: topByScore,
  };
};

const buildLifetimeFallbackBlocks = (
  periods: DaeunPeriod[],
  commonPayload: { coreInsights: string[]; actionNow: string[]; evidence: string[] },
  longTermFlow: string,
): SajuAnalysisBlock[] =>
  periods.map((period, index) => ({
    windowLabel: index === 0 ? "직전 구간" : index === 1 ? "현재 구간" : index === 2 ? "다음 구간" : "다다음 구간",
    timeRange: `${period.startAge}~${period.endAge}세`,
    coreFlow: period.keyword ?? longTermFlow,
    evidence: commonPayload.evidence[index] ?? commonPayload.evidence[0] ?? longTermFlow,
    opportunities: [commonPayload.coreInsights[index] ?? commonPayload.coreInsights[0] ?? longTermFlow],
    risks: [commonPayload.evidence[(index + 1) % Math.max(commonPayload.evidence.length, 1)] ?? "과속 의사결정 주의"],
    actionStrategy: [commonPayload.actionNow[index] ?? commonPayload.actionNow[0] ?? "핵심 우선순위를 먼저 확정하세요."],
  }));

const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const YEARLY_QUARTER_LABELS = ["1분기", "2분기", "3분기", "4분기"] as const;
const YEARLY_PHASE_FOCUS_LABELS = ["0~2년", "3~5년", "6~10년", "전환"] as const;
const YEARLY_ACCUMULATION_AXES = ["쌓을 것", "버릴 것", "전환 트리거", "복구 규칙"] as const;
const MONTH_TOKEN_PATTERN = /\b(1[0-2]|[1-9])\s*월\b/u;
const LEADING_MONTH_TOKEN_PATTERN = /^\s*(1[0-2]|[1-9])\s*월\s*[:：-]?\s*/u;
const QUARTER_TOKEN_PATTERN = /[1-4]\s*분기/u;

type YearlyPhaseFocusMapItem = SajuReportPayloadMap["saju-yearly-action-calendar"]["phaseFocusMap"][number];
type YearlyAccumulationFlowItem = SajuReportPayloadMap["saju-yearly-action-calendar"]["accumulationTransitionFlow"][number];
type YearlyTenYearFlowItem = SajuReportPayloadMap["saju-yearly-action-calendar"]["tenYearFlow"][number];
type YearlyKeyThemeItem = SajuReportPayloadMap["saju-yearly-action-calendar"]["keyThemes"][number];
type YearlyQuarterNarrativeItem = SajuReportPayloadMap["saju-yearly-action-calendar"]["quarterNarratives"][number];

const YEARLY_TEN_YEAR_PERIOD_LABELS = ["0~2년", "3~5년", "6~10년"] as const;
const YEARLY_SHORT_TERM_STRIP_PATTERN =
  /(오늘|이번 주|이번달|이번 달|3월 말까지|매일\s*\d+\s*분|30분|60일|90일|이번\s*주간|이번\s*월간)/gu;
const YEARLY_IMPERATIVE_TAIL_PATTERN =
  /(담당·기한·측정 기준|실행 결과를 측정|행동을 일정에 배치|실행 결과를 점검하고 지연 항목을 즉시 복구)/gu;

const sanitizeYearlyNarrativeSentence = (value: string): string => {
  const normalized = normalizeCalendarPlainLanguageSentence(stripYearlyInternalTokens(value))
    .replace(YEARLY_SHORT_TERM_STRIP_PATTERN, "")
    .replace(YEARLY_IMPERATIVE_TAIL_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return toLifetimeSentence(normalized);
};

const normalizeYearlyNarrativeParagraph = (
  value: unknown,
  fallbackCandidates: string[],
  forbiddenKeywords: string[],
): string => {
  const normalized = normalizeLifetimeParagraph(value, fallbackCandidates, forbiddenKeywords);
  return sanitizeYearlyNarrativeSentence(normalized);
};

const normalizeYearlyNarrativeList = (
  value: unknown,
  fallbackCandidates: string[],
  min: number,
  max: number,
  forbiddenKeywords: string[],
): string[] =>
  normalizeLifetimeList(value, fallbackCandidates, min, max, forbiddenKeywords).map((item) =>
    sanitizeYearlyNarrativeSentence(item),
  );

const ensureMinObjectItems = <T>(items: T[], fallbackCandidates: T[], min: number, max: number): T[] => {
  const seeded = items.slice(0, max);
  if (seeded.length >= min) {
    return seeded;
  }
  for (const fallback of fallbackCandidates) {
    if (seeded.length >= min || seeded.length >= max) {
      break;
    }
    seeded.push(fallback);
  }
  return seeded.slice(0, max);
};

const normalizeQuarterSentenceByIndex = (value: string, quarterIndex: number): string => {
  const quarterLabel = YEARLY_QUARTER_LABELS[quarterIndex] ?? `${quarterIndex + 1}분기`;
  const normalized = normalizeCalendarPlainLanguageSentence(value);
  const withQuarterToken = QUARTER_TOKEN_PATTERN.test(normalized)
    ? normalized.replace(QUARTER_TOKEN_PATTERN, quarterLabel)
    : `${quarterLabel}: ${normalized}`;
  return toLifetimeSentence(withQuarterToken);
};

const normalizeMonthSentenceByIndex = (value: string, monthIndex: number, fallback: string): string => {
  const monthNumber = monthIndex + 1;
  const monthLabel = `${monthNumber}월`;
  const normalized = normalizeCalendarPlainLanguageSentence(value || fallback)
    .replace(LEADING_MONTH_TOKEN_PATTERN, "")
    .trim();
  const withMonthToken = normalized.replace(MONTH_TOKEN_PATTERN, monthLabel);
  const content = toLifetimeSentence(withMonthToken || fallback)
    .replace(LEADING_MONTH_TOKEN_PATTERN, "")
    .trim();
  return `${monthLabel}: ${content}`;
};

const buildYearlyLifecycleExecutionFallback = (
  coreInsights: string[],
  actionNow: string[],
): string[] => [
  `0~2년: 현재 위치를 정리하고 실행 기준을 고정해 누적 오차를 줄이세요. ${coreInsights[0] ?? actionNow[0] ?? ""}`.trim(),
  `3~5년: 전환 전후에 유지할 기준과 확대할 기준을 분리해 반복 실행하세요. ${coreInsights[1] ?? actionNow[1] ?? ""}`.trim(),
  `6~10년: 장기 축적 항목을 줄이지 말고 분기별 점검으로 지속성을 확보하세요. ${coreInsights[2] ?? actionNow[2] ?? ""}`.trim(),
].map((item) => toLifetimeSentence(item));

const ensureYearlyLifecycleCoverage = (items: string[], fallback: string[]): string[] => {
  const normalized = ensureMinItems(uniqueItems(items.map((item) => toLifetimeSentence(item))), fallback, 3, 6);
  const requiredMarkers = ["0~2년", "3~5년", "6~10년"] as const;
  const covered = [...normalized];
  requiredMarkers.forEach((marker, index) => {
    if (!covered.some((item) => item.includes(marker))) {
      covered.push(fallback[index] ?? `${marker} 운영 기준을 문장으로 고정하세요.`);
    }
  });
  return uniqueItems(covered).slice(0, 6);
};

const buildYearlyPhaseFocusFallback = (
  lifecycleExecutionPattern: string[],
  priorityQueue: string[],
): YearlyPhaseFocusMapItem[] =>
  YEARLY_PHASE_FOCUS_LABELS.map((phaseLabel, index) => ({
    phaseLabel,
    focusPoint:
      phaseLabel === "전환"
        ? "전환 시점에서 유지할 기준과 버릴 기준을 동시에 확정하세요."
        : `${phaseLabel} 구간 핵심 1가지를 고정하고 실행 편차를 관리하세요.`,
    executionPattern:
      lifecycleExecutionPattern[index] ??
      `이번 ${phaseLabel} 구간은 우선순위 1개를 기준으로 반복 실행하고 결과를 기록하세요.`,
    checkpoint:
      priorityQueue[index] ??
      `${phaseLabel} 점검 기준: 현재 위치 -> 장기 목적 -> 이번 시기 행동 -> 점검 기준 문장을 유지하세요.`,
  }));

const buildYearlyAccumulationTransitionFallback = (
  quarterlyGoals: string[],
  riskCalendar: string[],
  actionCheckpoints: string[],
): YearlyAccumulationFlowItem[] =>
  YEARLY_ACCUMULATION_AXES.map((axis, index) => ({
    axis,
    guidance:
      axis === "쌓을 것"
        ? quarterlyGoals[index] ?? "장기적으로 반복할 핵심 실행 1개를 고정하세요."
        : axis === "버릴 것"
          ? riskCalendar[index] ?? "성과와 무관한 과제를 즉시 정리하세요."
          : axis === "전환 트리거"
            ? actionCheckpoints[index] ?? "전환 기준 지표가 충족되면 다음 단계로 이동하세요."
            : "지연 발생 시 복구 기한과 재시작 조건을 함께 고정하세요.",
  }));

const buildYearlyTenYearFlowFallback = (coreInsights: string[]): YearlyTenYearFlowItem[] => [
  {
    periodLabel: "0~2년",
    phaseLabel: "기반 설정기",
    interpretation: coreInsights[0] ?? "핵심 축 하나를 정하고 반복 구조를 고정하는 단계입니다.",
  },
  {
    periodLabel: "3~5년",
    phaseLabel: "확장기",
    interpretation: coreInsights[1] ?? "정리된 기준 위에서 확장 범위를 선택적으로 넓히는 단계입니다.",
  },
  {
    periodLabel: "6~10년",
    phaseLabel: "성과 정착기",
    interpretation: coreInsights[2] ?? "확장보다 유지 가능한 운영 구조를 정착시키는 단계입니다.",
  },
];

const buildYearlyKeyThemesFallback = (coreInsights: string[]): YearlyKeyThemeItem[] => [
  {
    theme: "한 축 집중",
    interpretation: coreInsights[0] ?? "분산보다 집중이 장기 누적 성과를 만듭니다.",
  },
  {
    theme: "기준 문장화",
    interpretation: coreInsights[1] ?? "판단 기준을 문장으로 고정할수록 실행 흔들림이 줄어듭니다.",
  },
  {
    theme: "성과 구조화",
    interpretation: coreInsights[2] ?? "단기 성과보다 반복 가능한 구조를 남기는 것이 핵심입니다.",
  },
];

const buildYearlyQuarterNarrativesFallback = (
  quarterlyGoals: string[],
  riskCalendar: string[],
): YearlyQuarterNarrativeItem[] =>
  YEARLY_QUARTER_LABELS.map((quarter, index) => {
    const roleFallback = ["기반 정비", "확장 시동", "성과 압축", "정리와 전환 준비"][index] ?? "운영 단계";
    return {
      quarter,
      role: roleFallback,
      meaning: quarterlyGoals[index] ?? `${quarter}의 역할을 명확히 고정하는 구간입니다.`,
      focus: quarterlyGoals[index] ?? `${quarter} 핵심 실행 축 1개를 유지하세요.`,
      caution: riskCalendar[index] ?? `${quarter} 과속 판단을 줄이기 위해 점검 기준을 먼저 확인하세요.`,
    };
  });

const parseYearlyTenYearFlow = (
  value: unknown,
  fallback: YearlyTenYearFlowItem[],
): YearlyTenYearFlowItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const periodLabel =
        YEARLY_TEN_YEAR_PERIOD_LABELS.find((label) => label === toStringValue(item.periodLabel, "")) ??
        YEARLY_TEN_YEAR_PERIOD_LABELS[index] ??
        "6~10년";
      return {
        periodLabel,
        phaseLabel: toStringValue(item.phaseLabel, fallback[index]?.phaseLabel ?? "전환기"),
        interpretation: toStringValue(item.interpretation, fallback[index]?.interpretation ?? "장기 흐름 해석을 보강하세요."),
      } satisfies YearlyTenYearFlowItem;
    })
    .slice(0, 3);
  return YEARLY_TEN_YEAR_PERIOD_LABELS.map((label, index) => parsed.find((item) => item.periodLabel === label) ?? fallback[index]);
};

const parseYearlyKeyThemes = (
  value: unknown,
  fallback: YearlyKeyThemeItem[],
): YearlyKeyThemeItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => ({
      theme: toStringValue(item.theme, fallback[index]?.theme ?? `핵심 테마 ${index + 1}`),
      interpretation: toStringValue(
        item.interpretation,
        fallback[index]?.interpretation ?? `핵심 테마 ${index + 1} 해석을 보강하세요.`,
      ),
    }))
    .slice(0, 3);
  return ensureMinObjectItems(parsed, fallback, 3, 3);
};

const parseYearlyQuarterNarratives = (
  value: unknown,
  fallback: YearlyQuarterNarrativeItem[],
): YearlyQuarterNarrativeItem[] => {
  if (!Array.isArray(value)) {
    return fallback;
  }
  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const quarterIndex = resolveQuarterIndex(item.quarter, index);
      const quarter = YEARLY_QUARTER_LABELS[quarterIndex] ?? YEARLY_QUARTER_LABELS[index] ?? "4분기";
      return {
        quarter,
        role: toStringValue(item.role, fallback[quarterIndex]?.role ?? "운영 단계"),
        meaning: toStringValue(item.meaning, fallback[quarterIndex]?.meaning ?? `${quarter} 의미를 보강하세요.`),
        focus: toStringValue(item.focus, fallback[quarterIndex]?.focus ?? `${quarter} 핵심 실행 축을 고정하세요.`),
        caution: toStringValue(item.caution, fallback[quarterIndex]?.caution ?? `${quarter} 리스크를 점검하세요.`),
      } satisfies YearlyQuarterNarrativeItem;
    });
  return YEARLY_QUARTER_LABELS.map((quarter, index) => parsed.find((item) => item.quarter === quarter) ?? fallback[index]);
};

const parseYearlyPhaseFocusMap = (
  value: unknown,
  fallback: YearlyPhaseFocusMapItem[],
): YearlyPhaseFocusMapItem[] => {
  if (!Array.isArray(value)) {
    return fallback.slice(0, 4);
  }
  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const phaseLabel = toStringValue(item.phaseLabel, YEARLY_PHASE_FOCUS_LABELS[index] ?? `단계 ${index + 1}`);
      return {
        phaseLabel,
        focusPoint: toStringValue(item.focusPoint, `${phaseLabel} 핵심 집중 포인트를 먼저 고정하세요.`),
        executionPattern: toStringValue(item.executionPattern, `${phaseLabel} 반복 실행 패턴을 일정에 고정하세요.`),
        checkpoint: toStringValue(item.checkpoint, `${phaseLabel} 점검 기준을 주기적으로 확인하세요.`),
      } satisfies YearlyPhaseFocusMapItem;
    });
  return ensureMinObjectItems(parsed, fallback, 3, 6);
};

const parseYearlyAccumulationTransitionFlow = (
  value: unknown,
  fallback: YearlyAccumulationFlowItem[],
): YearlyAccumulationFlowItem[] => {
  if (!Array.isArray(value)) {
    return fallback.slice(0, 4);
  }
  const parsed = value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item, index) => {
      const axis = toStringValue(item.axis, YEARLY_ACCUMULATION_AXES[index] ?? `축 ${index + 1}`);
      return {
        axis,
        guidance: toStringValue(item.guidance, `${axis} 기준을 문장으로 고정하세요.`),
      } satisfies YearlyAccumulationFlowItem;
    });
  return ensureMinObjectItems(parsed, fallback, 4, 6);
};

const enforceYearlyQuarterMonthConsistency = (
  payload: SajuReportPayloadMap["saju-yearly-action-calendar"],
): SajuReportPayloadMap["saju-yearly-action-calendar"] => {
  const next = { ...payload };
  next.quarterlyGoals = YEARLY_QUARTER_LABELS.map((_, index) =>
    normalizeQuarterSentenceByIndex(
      next.quarterlyGoals[index] ?? `${index + 1}분기 목표를 실행 가능한 행동으로 분해하세요.`,
      index,
    ),
  );
  next.riskCalendar = YEARLY_QUARTER_LABELS.map((_, index) =>
    normalizeQuarterSentenceByIndex(
      next.riskCalendar[index] ?? `${index + 1}분기 리스크를 월별 점검으로 관리하세요.`,
      index,
    ),
  );
  next.quarterThemes = YEARLY_QUARTER_LABELS.map((_, index) =>
    normalizeQuarterSentenceByIndex(
      next.quarterThemes[index] ?? `${index + 1}분기 집중 주제를 1개로 고정하세요.`,
      index,
    ),
  );
  next.monthlyActions = MONTH_LABELS.map((_, index) =>
    normalizeMonthSentenceByIndex(
      next.monthlyActions[index] ?? `${index + 1}월 핵심 실행 항목 1개를 고정하세요.`,
      index,
      `${index + 1}월 핵심 실행 항목 1개를 고정하세요.`,
    ),
  );
  next.monthlyPushCaution = MONTH_LABELS.map((_, index) =>
    normalizeMonthSentenceByIndex(
      next.monthlyPushCaution[index] ?? `${index + 1}월 과속 결정을 피하고 기준 이탈을 점검하세요.`,
      index,
      `${index + 1}월 과속 결정을 피하고 기준 이탈을 점검하세요.`,
    ),
  );
  next.actionCheckpoints = MONTH_LABELS.map((_, index) =>
    normalizeMonthSentenceByIndex(
      next.actionCheckpoints[index] ?? `${index + 1}월 실행 결과를 점검하고 지연 항목을 즉시 복구하세요.`,
      index,
      `${index + 1}월 실행 결과를 점검하고 지연 항목을 즉시 복구하세요.`,
    ),
  );
  next.analysisBlocks = YEARLY_QUARTER_LABELS.map((quarterLabel, index) => {
    const fallbackGoal = next.quarterlyGoals[index] ?? `${quarterLabel} 목표를 점검하세요.`;
    const fallbackRisk = next.riskCalendar[index] ?? `${quarterLabel} 리스크를 점검하세요.`;
    const fallbackAction = next.monthlyActions[index * 3] ?? `${quarterLabel} 첫 달 실행 항목을 고정하세요.`;
    const source = next.analysisBlocks[index] ?? {
      windowLabel: quarterLabel,
      timeRange: quarterLabel,
      coreFlow: fallbackGoal,
      evidence: fallbackRisk,
      opportunities: [fallbackGoal],
      risks: [fallbackRisk],
      actionStrategy: [fallbackAction],
    };
    return {
      ...source,
      windowLabel: quarterLabel,
      timeRange: quarterLabel,
      coreFlow: normalizeQuarterSentenceByIndex(source.coreFlow || fallbackGoal, index),
      evidence: normalizeQuarterSentenceByIndex(source.evidence || fallbackRisk, index),
      opportunities: normalizeCalendarPlainLanguageList(
        (source.opportunities ?? []).map((item) => normalizeQuarterSentenceByIndex(item, index)),
      ),
      risks: normalizeCalendarPlainLanguageList(
        (source.risks ?? []).map((item) => normalizeQuarterSentenceByIndex(item, index)),
      ),
      actionStrategy: normalizeCalendarPlainLanguageList(
        (source.actionStrategy ?? []).map((item) =>
          enforceActionSpecificity(item, fallbackAction, {
            timeMarkers: LIFETIME_TIME_MARKERS_BY_SERVICE["saju-yearly-action-calendar"],
          }),
        ),
      ),
    };
  });
  return next;
};

const normalizeCalendarQuarterTokens = (value: string): string =>
  value
    .replace(/\bq\s*1\b/gi, "1분기")
    .replace(/\bq\s*2\b/gi, "2분기")
    .replace(/\bq\s*3\b/gi, "3분기")
    .replace(/\bq\s*4\b/gi, "4분기")
    .replace(/\b1q\b/gi, "1분기")
    .replace(/\b2q\b/gi, "2분기")
    .replace(/\b3q\b/gi, "3분기")
    .replace(/\b4q\b/gi, "4분기");

const normalizeCalendarPlainLanguageSentence = (value: string): string => {
  const normalized = normalizeCalendarQuarterTokens(value)
    .replace(/\bcalendar-?map\b/gi, "연간 실행 지도")
    .replace(/\(\s*Structuring\s*\)/gi, "")
    .replace(/\(\s*Acceleration\s*\)/gi, "")
    .replace(/\(\s*Stabilizing\s*\)/gi, "")
    .replace(/\(\s*Stabilization\s*\)/gi, "")
    .replace(/\(\s*Consolidation\s*\)/gi, "")
    .replace(/\bStructuring\b/gi, "기반 정비")
    .replace(/\bAcceleration\b/gi, "실행 가속")
    .replace(/\bStabilizing\b/gi, "안정화")
    .replace(/\bStabilization\b/gi, "안정화")
    .replace(/\bConsolidation\b/gi, "마무리 정리")
    .replace(/분기:\s*구조화/g, "분기: 기반 다지기")
    .replace(/분기:\s*가속/g, "분기: 실행 속도 올리기")
    .replace(/\(\s*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return toLifetimeSentence(normalized);
};

const normalizeCalendarPlainLanguageList = (items: string[]): string[] =>
  items.map((item) => normalizeCalendarPlainLanguageSentence(item));

const stripYearlyInternalTokens = (value: string): string =>
  value
    .replace(/\bcalendar-?map\b/gi, "연간 실행 지도")
    .replace(/\bq\s*([1-4])\b/gi, "$1분기")
    .replace(/\b([1-4])q\b/gi, "$1분기")
    .replace(/\bStructuring\b/gi, "기반 정비")
    .replace(/\bAcceleration\b/gi, "실행 가속")
    .replace(/\bStabilization\b/gi, "안정화")
    .replace(/\bStabilizing\b/gi, "안정화");

const buildYearlyDedupKey = (value: string): string =>
  normalizeCalendarPlainLanguageSentence(stripYearlyInternalTokens(value))
    .toLowerCase()
    .replace(/[\s\.,:;!?'"`~@#$%^&*()_\-+=<>{}\[\]\\|/]+/g, "");

const dedupeYearlyQuarterSentences = (
  source: string[],
  fallbackByIndex: (index: number) => string,
): string[] => {
  const seen = new Set<string>();
  return YEARLY_QUARTER_LABELS.map((_, index) => {
    const fallback = normalizeQuarterSentenceByIndex(fallbackByIndex(index), index);
    let candidate = normalizeQuarterSentenceByIndex(source[index] ?? fallback, index);
    candidate = normalizeCalendarPlainLanguageSentence(stripYearlyInternalTokens(candidate));
    let key = buildYearlyDedupKey(candidate);
    if (!key || seen.has(key)) {
      candidate = normalizeCalendarPlainLanguageSentence(stripYearlyInternalTokens(fallback));
      key = buildYearlyDedupKey(candidate);
    }
    if (!key || seen.has(key)) {
      candidate = normalizeQuarterSentenceByIndex(`${fallbackByIndex(index)} (${index + 1})`, index);
      candidate = normalizeCalendarPlainLanguageSentence(stripYearlyInternalTokens(candidate));
      key = buildYearlyDedupKey(candidate);
    }
    if (key) {
      seen.add(key);
    }
    return candidate;
  });
};

type YearlyQualityGateContext = {
  summary: string;
  coreInsights: string[];
  actionNow: string[];
  evidence: string[];
  forbiddenKeywords: string[];
};

const validateAndRepairYearlyPayload = (
  payload: SajuReportPayloadMap["saju-yearly-action-calendar"],
  context: YearlyQualityGateContext,
): SajuReportPayloadMap["saju-yearly-action-calendar"] => {
  const next = {
    ...payload,
    analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, []),
  };
  const lifecycleExecutionFallback = buildYearlyLifecycleExecutionFallback(
    context.coreInsights,
    context.actionNow,
  );
  next.lifecycleExecutionPattern = ensureYearlyLifecycleCoverage(
    normalizeYearlyNarrativeList(
      next.lifecycleExecutionPattern,
      [...lifecycleExecutionFallback, ...context.actionNow, ...context.coreInsights],
      3,
      6,
      context.forbiddenKeywords,
    ),
    lifecycleExecutionFallback,
  );

  next.quarterlyGoals = ensureMinItems(
    normalizeLifetimeList(
      next.quarterlyGoals,
      [...context.coreInsights, ...next.lifecycleExecutionPattern, "분기 목표를 월별 실행 행동과 즉시 연결하세요."],
      4,
      4,
      context.forbiddenKeywords,
      { action: true },
    ),
    [
      "1분기 목표를 실행 가능한 행동으로 분해하세요.",
      "2분기 목표의 우선순위를 재정렬하세요.",
      "3분기 목표의 위험 요인을 사전 차단하세요.",
      "4분기 목표의 마감 완성도를 먼저 점검하세요.",
    ],
    4,
    4,
  );
  next.riskCalendar = ensureMinItems(
    normalizeLifetimeList(
      next.riskCalendar,
      [...context.evidence, ...next.quarterlyGoals, "분기별 주의 구간을 월별 리스크와 함께 기록하세요."],
      4,
      4,
      context.forbiddenKeywords,
    ),
    [
      "1분기: 과속 실행으로 우선순위가 흔들리지 않게 주의하세요.",
      "2분기: 목표 과다 설정으로 일정이 분산되지 않게 관리하세요.",
      "3분기: 누적 지연 항목을 복구 없이 넘기지 마세요.",
      "4분기: 마감 직전 품질 저하를 방지하기 위해 체크포인트를 고정하세요.",
    ],
    4,
    4,
  );
  next.quarterThemes = ensureMinItems(
    normalizeLifetimeList(
      next.quarterThemes,
      [...next.quarterlyGoals, ...context.coreInsights],
      4,
      4,
      context.forbiddenKeywords,
    ),
    ["1분기: 우선순위 정렬", "2분기: 실행 가속", "3분기: 리스크 통제", "4분기: 마감 완성"],
    4,
    4,
  );
  next.monthlyActions = normalizeCalendarMonthList(
    next.monthlyActions,
    [...context.actionNow, ...next.quarterlyGoals],
    context.forbiddenKeywords,
    { action: true },
  );
  next.monthlyPushCaution = normalizeCalendarMonthList(
    next.monthlyPushCaution,
    [...next.riskCalendar, ...context.evidence],
    context.forbiddenKeywords,
    { caution: true },
  );
  next.actionCheckpoints = normalizeCalendarMonthList(
    next.actionCheckpoints,
    [...next.monthlyActions, ...next.quarterlyGoals],
    context.forbiddenKeywords,
    { action: true },
  );
  next.priorityQueue = normalizeLifetimeList(
    next.priorityQueue,
    [...context.actionNow, ...next.quarterlyGoals],
    3,
    6,
    context.forbiddenKeywords,
    { action: true },
  );
  next.yearToLifeBridge = normalizeYearlyNarrativeParagraph(
    next.yearToLifeBridge,
    [
      ...next.lifecycleExecutionPattern,
      ...next.quarterlyGoals,
      ...next.priorityQueue,
      ...context.actionNow,
      context.summary,
    ],
    context.forbiddenKeywords,
  );

  const phaseFocusFallback = buildYearlyPhaseFocusFallback(next.lifecycleExecutionPattern, next.priorityQueue);
  const parsedPhaseFocus = parseYearlyPhaseFocusMap(next.phaseFocusMap, phaseFocusFallback);
  next.phaseFocusMap = ensureMinObjectItems(
    parsedPhaseFocus.map((item, index) => {
      const fallback = phaseFocusFallback[index] ?? phaseFocusFallback[phaseFocusFallback.length - 1];
      const phaseLabel = toStringValue(item.phaseLabel, fallback?.phaseLabel ?? YEARLY_PHASE_FOCUS_LABELS[index] ?? "전환");
      const executionFallback =
        fallback?.executionPattern ?? `${phaseLabel} 구간에서 실행 기준을 고정하고 결과를 점검하세요.`;
      return {
        phaseLabel,
        focusPoint: normalizeYearlyNarrativeParagraph(
          item.focusPoint,
          [fallback?.focusPoint, next.yearToLifeBridge, ...context.coreInsights],
          context.forbiddenKeywords,
        ),
        executionPattern: normalizeYearlyNarrativeParagraph(
          item.executionPattern,
          [executionFallback, ...next.lifecycleExecutionPattern, ...context.actionNow],
          context.forbiddenKeywords,
        ),
        checkpoint: normalizeYearlyNarrativeParagraph(
          item.checkpoint,
          [fallback?.checkpoint, ...next.priorityQueue, ...context.evidence],
          context.forbiddenKeywords,
        ),
      } satisfies YearlyPhaseFocusMapItem;
    }),
    phaseFocusFallback,
    4,
    6,
  );

  const accumulationFlowFallback = buildYearlyAccumulationTransitionFallback(
    next.quarterlyGoals,
    next.riskCalendar,
    next.actionCheckpoints,
  );
  const parsedAccumulationFlow = parseYearlyAccumulationTransitionFlow(
    next.accumulationTransitionFlow,
    accumulationFlowFallback,
  );
  next.accumulationTransitionFlow = ensureMinObjectItems(
    parsedAccumulationFlow.map((item, index) => {
      const fallback = accumulationFlowFallback[index] ?? accumulationFlowFallback[accumulationFlowFallback.length - 1];
      const axis = toStringValue(item.axis, fallback?.axis ?? YEARLY_ACCUMULATION_AXES[index] ?? "축");
      return {
        axis,
        guidance: normalizeYearlyNarrativeParagraph(
          item.guidance,
          [fallback?.guidance, ...next.quarterlyGoals, ...next.riskCalendar],
          context.forbiddenKeywords,
        ),
      } satisfies YearlyAccumulationFlowItem;
    }),
    accumulationFlowFallback,
    4,
    6,
  );

  next.longPracticeStrategy = normalizeYearlyNarrativeList(
    next.longPracticeStrategy,
    [...next.lifecycleExecutionPattern, ...next.priorityQueue, ...context.actionNow],
    3,
    6,
    context.forbiddenKeywords,
  );

  const tenYearFlowFallback = buildYearlyTenYearFlowFallback(context.coreInsights);
  next.oneLineTotalReview = normalizeYearlyNarrativeParagraph(
    next.oneLineTotalReview,
    [context.summary, next.yearToLifeBridge, ...next.lifecycleExecutionPattern],
    context.forbiddenKeywords,
  );
  next.currentLifeFlow = normalizeYearlyNarrativeParagraph(
    next.currentLifeFlow,
    [...next.lifecycleExecutionPattern, ...next.phaseFocusMap.map((item) => item.focusPoint), context.summary],
    context.forbiddenKeywords,
  );
  next.meaningOfThisYear = normalizeYearlyNarrativeParagraph(
    next.meaningOfThisYear,
    [next.yearToLifeBridge, ...next.lifecycleExecutionPattern, context.summary],
    context.forbiddenKeywords,
  );
  next.tenYearFlow = parseYearlyTenYearFlow(next.tenYearFlow, tenYearFlowFallback).map((item, index) => ({
    periodLabel: YEARLY_TEN_YEAR_PERIOD_LABELS[index] ?? item.periodLabel,
    phaseLabel: normalizeYearlyNarrativeParagraph(
      item.phaseLabel,
      [tenYearFlowFallback[index]?.phaseLabel ?? "장기 구간"],
      context.forbiddenKeywords,
    ),
    interpretation: normalizeYearlyNarrativeParagraph(
      item.interpretation,
      [
        tenYearFlowFallback[index]?.interpretation,
        ...next.lifecycleExecutionPattern,
        ...next.longPracticeStrategy,
      ],
      context.forbiddenKeywords,
    ),
  }));
  next.longPatternInterpretation = normalizeYearlyNarrativeList(
    next.longPatternInterpretation,
    [...next.longPracticeStrategy, ...next.lifecycleExecutionPattern, ...context.coreInsights],
    3,
    5,
    context.forbiddenKeywords,
  );

  const keyThemesFallback = buildYearlyKeyThemesFallback(context.coreInsights);
  next.keyThemes = ensureMinObjectItems(
    parseYearlyKeyThemes(next.keyThemes, keyThemesFallback).map((item, index) => ({
      theme: normalizeYearlyNarrativeParagraph(
        item.theme,
        [keyThemesFallback[index]?.theme ?? `핵심 테마 ${index + 1}`],
        context.forbiddenKeywords,
      ),
      interpretation: normalizeYearlyNarrativeParagraph(
        item.interpretation,
        [keyThemesFallback[index]?.interpretation, ...next.longPatternInterpretation],
        context.forbiddenKeywords,
      ),
    })),
    keyThemesFallback,
    3,
    3,
  );

  const quarterNarrativesFallback = buildYearlyQuarterNarrativesFallback(next.quarterlyGoals, next.riskCalendar);
  const parsedQuarterNarratives = parseYearlyQuarterNarratives(next.quarterNarratives, quarterNarrativesFallback);
  const roleSeen = new Set<string>();
  next.quarterNarratives = YEARLY_QUARTER_LABELS.map((quarter, index) => {
    const fallback = quarterNarrativesFallback[index];
    const source = parsedQuarterNarratives[index] ?? fallback;
    const roleCandidate = normalizeYearlyNarrativeParagraph(
      source?.role,
      [fallback?.role ?? "운영 단계"],
      context.forbiddenKeywords,
    );
    const normalizedRoleKey = roleCandidate.replace(/\s+/g, "").toLowerCase();
    const role =
      !normalizedRoleKey || roleSeen.has(normalizedRoleKey)
        ? normalizeYearlyNarrativeParagraph(fallback?.role, [quarter], context.forbiddenKeywords)
        : roleCandidate;
    roleSeen.add(role.replace(/\s+/g, "").toLowerCase());
    return {
      quarter,
      role,
      meaning: normalizeYearlyNarrativeParagraph(
        source?.meaning,
        [fallback?.meaning, next.quarterlyGoals[index], context.summary],
        context.forbiddenKeywords,
      ),
      focus: normalizeYearlyNarrativeParagraph(
        source?.focus,
        [fallback?.focus, next.quarterlyGoals[index], next.lifecycleExecutionPattern[index]],
        context.forbiddenKeywords,
      ),
      caution: normalizeYearlyNarrativeParagraph(
        source?.caution,
        [fallback?.caution, next.riskCalendar[index], context.evidence[index]],
        context.forbiddenKeywords,
      ),
    } satisfies YearlyQuarterNarrativeItem;
  });

  next.yearEndResidue = normalizeYearlyNarrativeParagraph(
    next.yearEndResidue,
    [...next.longPatternInterpretation, ...next.keyThemes.map((item) => item.interpretation), next.yearToLifeBridge],
    context.forbiddenKeywords,
  );
  next.closingLine = normalizeYearlyNarrativeParagraph(
    next.closingLine,
    [next.oneLineTotalReview, next.meaningOfThisYear, next.yearEndResidue],
    context.forbiddenKeywords,
  );

  next.quarterlyGoals = normalizeCalendarPlainLanguageList(next.quarterlyGoals.map((item) => stripYearlyInternalTokens(item)));
  next.riskCalendar = normalizeCalendarPlainLanguageList(next.riskCalendar.map((item) => stripYearlyInternalTokens(item)));
  next.quarterThemes = normalizeCalendarPlainLanguageList(next.quarterThemes.map((item) => stripYearlyInternalTokens(item)));
  next.monthlyActions = normalizeCalendarPlainLanguageList(next.monthlyActions.map((item) => stripYearlyInternalTokens(item)));
  next.monthlyPushCaution = normalizeCalendarPlainLanguageList(next.monthlyPushCaution.map((item) => stripYearlyInternalTokens(item)));
  next.actionCheckpoints = normalizeCalendarPlainLanguageList(next.actionCheckpoints.map((item) => stripYearlyInternalTokens(item)));
  next.priorityQueue = normalizeCalendarPlainLanguageList(next.priorityQueue.map((item) => stripYearlyInternalTokens(item)));
  next.lifecycleExecutionPattern = next.lifecycleExecutionPattern.map((item) =>
    sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item)),
  );
  next.longPracticeStrategy = next.longPracticeStrategy.map((item) =>
    sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item)),
  );
  next.yearToLifeBridge = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.yearToLifeBridge));
  next.phaseFocusMap = next.phaseFocusMap.map((item, index) => ({
    phaseLabel: YEARLY_PHASE_FOCUS_LABELS[index] ?? toStringValue(item.phaseLabel, "전환"),
    focusPoint: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.focusPoint)),
    executionPattern: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.executionPattern)),
    checkpoint: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.checkpoint)),
  }));
  next.accumulationTransitionFlow = next.accumulationTransitionFlow.map((item, index) => ({
    axis: toStringValue(item.axis, YEARLY_ACCUMULATION_AXES[index] ?? "축"),
    guidance: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.guidance)),
  }));
  next.oneLineTotalReview = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.oneLineTotalReview));
  next.currentLifeFlow = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.currentLifeFlow));
  next.meaningOfThisYear = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.meaningOfThisYear));
  next.tenYearFlow = next.tenYearFlow.map((item, index) => ({
    periodLabel: YEARLY_TEN_YEAR_PERIOD_LABELS[index] ?? item.periodLabel,
    phaseLabel: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.phaseLabel)),
    interpretation: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.interpretation)),
  }));
  next.longPatternInterpretation = next.longPatternInterpretation.map((item) =>
    sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item)),
  );
  next.keyThemes = ensureMinObjectItems(
    next.keyThemes.map((item, index) => ({
      theme: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(item.theme || keyThemesFallback[index]?.theme || `핵심 테마 ${index + 1}`)),
      interpretation: sanitizeYearlyNarrativeSentence(
        stripYearlyInternalTokens(item.interpretation || keyThemesFallback[index]?.interpretation || "핵심 테마 해석을 보강하세요."),
      ),
    })),
    keyThemesFallback,
    3,
    3,
  );
  next.quarterNarratives = YEARLY_QUARTER_LABELS.map((quarter, index) => {
    const source = next.quarterNarratives[index] ?? quarterNarrativesFallback[index];
    const fallback = quarterNarrativesFallback[index];
    return {
      quarter,
      role: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(source?.role || fallback?.role || "운영 단계")),
      meaning: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(source?.meaning || fallback?.meaning || `${quarter} 의미를 보강하세요.`)),
      focus: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(source?.focus || fallback?.focus || `${quarter} 집중축을 보강하세요.`)),
      caution: sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(source?.caution || fallback?.caution || `${quarter} 리스크 점검을 보강하세요.`)),
    } satisfies YearlyQuarterNarrativeItem;
  });
  next.yearEndResidue = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.yearEndResidue));
  next.closingLine = sanitizeYearlyNarrativeSentence(stripYearlyInternalTokens(next.closingLine));

  Object.assign(next, enforceYearlyQuarterMonthConsistency(next));

  next.quarterlyGoals = dedupeYearlyQuarterSentences(
    next.quarterlyGoals,
    (index) => [
      "분기 목표를 실행 가능한 행동으로 분해하세요.",
      "분기 목표 우선순위를 재정렬하세요.",
      "분기 목표의 위험 요인을 사전 차단하세요.",
      "분기 목표 마감 완성도를 먼저 점검하세요.",
    ][index] ?? "분기 목표를 점검하세요.",
  );
  next.riskCalendar = dedupeYearlyQuarterSentences(
    next.riskCalendar,
    (index) => [
      "분기 리스크를 월별로 점검하세요.",
      "분기 리스크를 일정 분산으로 완화하세요.",
      "분기 리스크를 복구 기준으로 관리하세요.",
      "분기 리스크를 마감 품질 기준으로 통제하세요.",
    ][index] ?? "분기 리스크를 점검하세요.",
  );
  next.quarterThemes = dedupeYearlyQuarterSentences(
    next.quarterThemes,
    (index) => ["우선순위 정렬", "실행 가속", "리스크 통제", "마감 완성"][index] ?? "집중 주제를 1개로 고정하세요.",
  );

  const coreSeen = new Set<string>();
  const evidenceSeen = new Set<string>();
  next.analysisBlocks = YEARLY_QUARTER_LABELS.map((quarterLabel, index) => {
    const fallbackCore = next.quarterlyGoals[index] ?? `${quarterLabel}: 목표를 점검하세요.`;
    const fallbackEvidence = next.riskCalendar[index] ?? `${quarterLabel}: 리스크를 점검하세요.`;
    const source = next.analysisBlocks[index] ?? {
      windowLabel: quarterLabel,
      timeRange: quarterLabel,
      coreFlow: fallbackCore,
      evidence: fallbackEvidence,
      opportunities: [fallbackCore],
      risks: [fallbackEvidence],
      actionStrategy: [next.monthlyActions[index * 3] ?? `${quarterLabel} 첫 달 실행 항목을 고정하세요.`],
    };
    let coreFlow = normalizeQuarterSentenceByIndex(stripYearlyInternalTokens(source.coreFlow || fallbackCore), index);
    let coreKey = buildYearlyDedupKey(coreFlow);
    if (!coreKey || coreSeen.has(coreKey)) {
      coreFlow = normalizeQuarterSentenceByIndex(fallbackCore, index);
      coreKey = buildYearlyDedupKey(coreFlow);
    }
    if (coreKey) {
      coreSeen.add(coreKey);
    }

    let evidence = normalizeQuarterSentenceByIndex(stripYearlyInternalTokens(source.evidence || fallbackEvidence), index);
    let evidenceKey = buildYearlyDedupKey(evidence);
    if (!evidenceKey || evidenceSeen.has(evidenceKey)) {
      evidence = normalizeQuarterSentenceByIndex(fallbackEvidence, index);
      evidenceKey = buildYearlyDedupKey(evidence);
    }
    if (evidenceKey) {
      evidenceSeen.add(evidenceKey);
    }

    return {
      ...source,
      windowLabel: quarterLabel,
      timeRange: quarterLabel,
      coreFlow,
      evidence,
      opportunities: normalizeCalendarPlainLanguageList(
        (source.opportunities ?? []).map((item) => normalizeQuarterSentenceByIndex(stripYearlyInternalTokens(item), index)),
      ),
      risks: normalizeCalendarPlainLanguageList(
        (source.risks ?? []).map((item) => normalizeQuarterSentenceByIndex(stripYearlyInternalTokens(item), index)),
      ),
      actionStrategy: normalizeCalendarPlainLanguageList(
        (source.actionStrategy ?? []).map((item) =>
          enforceActionSpecificity(stripYearlyInternalTokens(item), next.monthlyActions[index * 3] ?? `${quarterLabel} 첫 달 실행 항목을 고정하세요.`, {
            timeMarkers: LIFETIME_TIME_MARKERS_BY_SERVICE["saju-yearly-action-calendar"],
          }),
        ),
      ),
    };
  });

  return next;
};

const ensureRoadmapMaturityAxes = (items: string[]): string[] => {
  const defaults = [
    "성숙 축: 지금 단계에서 버릴 습관 1개와 유지할 기준 1개를 분리해 고정하세요.",
    "확장 축: 다음 단계 확장을 위해 우선순위 1개만 먼저 증폭하세요.",
    "정리 축: 분기 말마다 누적된 과제 중 중단할 항목을 즉시 정리하세요.",
  ];
  const byAxis = [
    items.find((item) => item.includes("성숙")) ?? defaults[0],
    items.find((item) => item.includes("확장")) ?? defaults[1],
    items.find((item) => item.includes("정리")) ?? defaults[2],
  ];
  return byAxis.map((item) => toLifetimeSentence(item));
};

const ensureRelationLayerTriplet = (items: string[]): string[] => {
  const defaults = [
    "가까운 관계 레이어: 감정 소모가 큰 연결은 빈도를 조정하고 핵심 신뢰 연결을 우선 유지하세요.",
    "협업 레이어: 역할·기한·기대치를 문장으로 맞춰 갈등 비용을 먼저 낮추세요.",
    "사회 레이어: 월 1회 신규 연결 행동을 고정해 귀인 유입 채널을 넓히세요.",
  ];
  return [
    toLifetimeSentence(items.find((item) => item.includes("가까운")) ?? defaults[0]),
    toLifetimeSentence(items.find((item) => item.includes("협업") || item.includes("업무")) ?? defaults[1]),
    toLifetimeSentence(items.find((item) => item.includes("사회") || item.includes("확장")) ?? defaults[2]),
  ];
};

const ensureEnergyStageShiftMap = (items: string[]): string[] => {
  const defaults = [
    "생애 초반 단계: 몰입 강도보다 회복 습관을 먼저 고정하면 이후 확장 비용을 크게 줄일 수 있습니다.",
    "확장 단계(3~5년): 역할과 일정이 늘어날수록 에너지 배분 기준을 문장으로 명확히 유지하세요.",
    "지속 단계(6~10년): 성과보다 회복 임계치를 먼저 관리하면 장기 지속성이 안정됩니다.",
  ];
  return ensureMinItems(
    uniqueItems(items.map((item) => toLifetimeSentence(item)).filter(Boolean)),
    defaults,
    3,
    5,
  );
};

const ensureEnergyLongRangeCoverage = (items: string[]): string[] => {
  const defaults = [
    "0~2년: 하루 집중 상한과 24시간 회복 하한을 함께 기록해 주간 점검하세요.",
    "3~5년: 역할별 에너지 배분표를 운영하고 월간 리셋 루틴으로 누적 피로를 정리하세요.",
    "6~10년: 확장 결정을 내리기 전 회복 여력을 먼저 확인하고 분기별 운영 규칙을 갱신하세요.",
  ];
  const seeded = ensureMinItems(
    uniqueItems(items.map((item) => toLifetimeSentence(item)).filter(Boolean)),
    defaults,
    3,
    6,
  );
  const withCoverage = [...seeded];
  const requiredMarkers = ["0~2년", "3~5년", "6~10년"] as const;
  requiredMarkers.forEach((marker, index) => {
    if (!withCoverage.some((item) => item.includes(marker))) {
      withCoverage.push(defaults[index]);
    }
  });
  return uniqueItems(withCoverage).slice(0, 6);
};

const normalizeCalendarMonthList = (
  value: unknown,
  fallbackCandidates: string[],
  forbiddenKeywords: string[],
  options?: { action?: boolean; caution?: boolean },
): string[] => {
  const base = normalizeLifetimeList(value, fallbackCandidates, 2, 24, forbiddenKeywords, options?.action ? { action: true } : undefined);
  return MONTH_LABELS.map((_, index) => {
    const candidate = base[index] ?? base[index % Math.max(base.length, 1)] ?? "";
    const fallback = options?.caution
      ? `${index + 1}월에는 과속 결정을 피하고 기준 이탈 항목을 바로 수정하세요.`
      : `${index + 1}월 실행 항목을 1개로 좁히고 담당·기한·측정 기준을 함께 기록해 진행하세요.`;
    const sentence = options?.action
      ? enforceActionSpecificity(candidate, fallback, {
          timeMarkers: LIFETIME_TIME_MARKERS_BY_SERVICE["saju-yearly-action-calendar"],
        })
      : toLifetimeSentence(candidate || fallback);
    return normalizeMonthSentenceByIndex(sentence, index, fallback);
  });
};

type NormalizeLifetimePayloadOptions = {
  daeunPhaseRoadmapFallback?: SajuDaeunPhaseRoadmapItem[];
  daeunLongHorizonFallback?: string[];
  helperPhaseRoadmapFallback?: SajuHelperPhaseRoadmapItem[];
  helperLongHorizonFallback?: string[];
  helperAnalysisFallback?: SajuAnalysisBlock[];
  currentYear?: number;
};

const normalizeLifetimePayloadByService = <K extends SajuAnalysisServiceId>(
  serviceType: K,
  payload: SajuReportPayloadMap[K],
  fallbackBlocks: SajuAnalysisBlock[],
  summary: string,
  options: NormalizeLifetimePayloadOptions = {},
): SajuReportPayloadMap[K] => {
  const ownership = SUPPLEMENT_OWNERSHIP_RULES[serviceType];
  const next = { ...payload } as SajuReportPayloadMap[K] & {
    supplement?: SajuReportSupplement;
    coreInsights: string[];
    actionNow: string[];
    evidence: string[];
    analysisBlocks: SajuAnalysisBlock[];
  };

  const normalizedCoreInsights = normalizeLifetimeList(
    next.coreInsights,
    [...next.analysisBlocks.map((block) => block.coreFlow), summary],
    2,
    4,
    ownership.forbiddenKeywords,
  );
  const actionNormalizationOverrides =
    serviceType === "saju-wealth-flow"
      ? {
          actionFallback: "현재 구간의 자산 운영 원칙을 고정하고 다음 단계 전환 조건을 함께 점검하세요.",
          timeMarkers: WEALTH_ACTION_TIME_MARKERS,
          targetMarkers: WEALTH_ACTION_TARGET_MARKERS,
          repairTemplates: WEALTH_ACTION_SLOT_REPAIR_TEMPLATES,
        }
      : serviceType === "saju-helper-network"
        ? {
            actionFallback: "3~5년 협업 기준을 문장으로 고정하고 관계 충돌 지표를 분기마다 점검하세요.",
            timeMarkers: HELPER_ACTION_TIME_MARKERS,
            targetMarkers: HELPER_ACTION_TARGET_MARKERS,
            repairTemplates: HELPER_ACTION_SLOT_REPAIR_TEMPLATES,
          }
      : {};
  const normalizedActionNow = normalizeLifetimeList(
    next.actionNow,
    [...next.analysisBlocks.flatMap((block) => block.actionStrategy), ...normalizedCoreInsights],
    2,
    4,
    ownership.forbiddenKeywords,
    { action: true, ...actionNormalizationOverrides },
  );
  const normalizedEvidence = normalizeLifetimeList(
    next.evidence,
    [...next.analysisBlocks.map((block) => block.evidence), summary],
    2,
    4,
    ownership.forbiddenKeywords,
  );

  const dedupedCommon = dedupeLifetimeBuckets({
    coreInsights: normalizedCoreInsights,
    actionNow: normalizedActionNow,
    evidence: normalizedEvidence,
  });
  next.coreInsights = ensureMinItems(dedupedCommon.coreInsights, normalizedCoreInsights, 2, 4);
  next.actionNow = ensureMinItems(dedupedCommon.actionNow, normalizedActionNow, 2, 4);
  next.evidence = ensureMinItems(dedupedCommon.evidence, normalizedEvidence, 2, 4);

  if (next.supplement) {
    const supplement = { ...next.supplement };
    const executionMinimums = SUPPLEMENT_EXECUTION_MINIMUMS_BY_SERVICE[serviceType];
    supplement.deepInsightSummary = normalizeLifetimeParagraph(
      supplement.deepInsightSummary,
      [...next.coreInsights, ...next.evidence, summary],
      ownership.forbiddenKeywords,
    );
    supplement.deepDivePoints = normalizeLifetimeList(
      supplement.deepDivePoints,
      [...next.coreInsights, ...next.evidence],
      3,
      5,
      ownership.forbiddenKeywords,
    );
    const executionFallbacks: SajuReportSupplementExecutionProtocol =
      serviceType === "saju-wealth-flow"
        ? {
            today: [
              "현재 구간의 현금흐름 운영 기준 1개를 고정하고 즉시 점검하세요.",
              "손실 한도와 확장 조건을 분리해 오늘 기준으로 다시 확인하세요.",
            ],
            thisWeek: [
              "이번 주에는 유입 1개와 누수 1개를 동시에 추적해 자산 흐름 편차를 줄이세요.",
              "주간 점검에서 방어 한도 이탈 여부를 먼저 확인한 뒤 확장 판단을 진행하세요.",
            ],
            thisMonth: [
              "이번 달에는 축적/확장/방어/변동 단계 전환 조건을 월말에 재판독하세요.",
              "월 단위로 자산 배분 비율을 점검하고 변동 구간 방어 한도를 유지하세요.",
            ],
            avoid: [
              "단일 이벤트 수익에 기대한 과속 확장을 피하고 운영 기준 이탈 시 즉시 축소하세요.",
              "변동 신호를 무시한 확장 판단은 보류하고 방어 규칙부터 재확인하세요.",
            ],
          }
        : serviceType === "saju-helper-network"
          ? {
              today: [
                "오늘 즉시 실행은 1개만 선택하고 관계 경계 문장을 먼저 준비하세요.",
                "관계 레이어 충돌 신호를 확인한 뒤 단기 대응 여부를 결정하세요.",
              ],
              thisWeek: [
                "이번 주에는 관계 레이어별 핵심 인물 1명씩을 점검해 협업 과밀을 줄이세요.",
                "협업 갈등 루프가 반복되는 지점을 기록하고 차단 문장을 적용하세요.",
              ],
              thisMonth: [
                "이번 달에는 멘토·귀인 유입 신호와 협업 성과를 함께 점검해 장기 연결을 강화하세요.",
                "월말에 관계 확장 기준과 정리 기준의 이탈 여부를 재확인하세요.",
              ],
              avoid: [
                "단기 감정 반응으로 관계 확장을 서두르지 말고 합의 기준부터 고정하세요.",
                "협업 역할·권한 미정 상태에서 신규 연결을 과도하게 늘리지 마세요.",
              ],
            }
        : {
            today: [
              "오늘 우선 항목의 담당·기한·측정 기준을 확정하고 바로 실행하세요.",
              "오늘 우선 과제 1개만 선택해 완료 기준을 문장으로 고정하세요.",
            ],
            thisWeek: [
              "이번 주 핵심 과제 2개를 분리하고 각 과제의 책임자와 마감일을 확정해 실행하세요.",
              "이번 주 점검 루틴을 2회 고정해 판단 편차를 줄이세요.",
            ],
            thisMonth: [
              "이번 달 실행 지표 2개를 정하고 주차별 점검 일정을 캘린더에 고정하세요.",
              "이번 달 우선순위 드리프트를 막기 위해 월말 리뷰 기준을 먼저 확정하세요.",
            ],
            avoid: [
              "기준 없는 과속 결정을 피하고 검증 없는 확장 판단은 보류하세요.",
              "감정 반응으로 우선순위를 바꾸지 말고 사전 기준표를 먼저 확인하세요.",
            ],
          };
    const executionActionOverrides =
      serviceType === "saju-wealth-flow"
        ? {
            timeMarkers: WEALTH_ACTION_TIME_MARKERS,
            targetMarkers: WEALTH_ACTION_TARGET_MARKERS,
            repairTemplates: WEALTH_ACTION_SLOT_REPAIR_TEMPLATES,
          }
        : serviceType === "saju-helper-network"
          ? {
              timeMarkers: HELPER_ACTION_TIME_MARKERS,
              targetMarkers: HELPER_ACTION_TARGET_MARKERS,
              repairTemplates: HELPER_ACTION_SLOT_REPAIR_TEMPLATES,
            }
          : {};

    if (serviceType === "saju-yearly-action-calendar") {
      supplement.executionProtocol = {
        today: [],
        thisWeek: [],
        thisMonth: [],
        avoid: [],
      };
    } else {
      const executionProtocolSeed: SajuReportSupplementExecutionProtocol = {
        today: normalizeLifetimeList(
          supplement.executionProtocol.today,
          next.actionNow,
          executionMinimums.todayMin,
          executionMinimums.todayMax,
          ownership.forbiddenKeywords,
          { action: true, actionFallback: executionFallbacks.today[0], ...executionActionOverrides },
        ),
        thisWeek: normalizeLifetimeList(
          supplement.executionProtocol.thisWeek,
          [...next.actionNow, ...next.coreInsights],
          executionMinimums.thisWeekMin,
          executionMinimums.thisWeekMax,
          ownership.forbiddenKeywords,
          { action: true, actionFallback: executionFallbacks.thisWeek[0], ...executionActionOverrides },
        ),
        thisMonth: normalizeLifetimeList(
          supplement.executionProtocol.thisMonth,
          [...next.actionNow, ...next.evidence],
          executionMinimums.thisMonthMin,
          executionMinimums.thisMonthMax,
          ownership.forbiddenKeywords,
          { action: true, actionFallback: executionFallbacks.thisMonth[0], ...executionActionOverrides },
        ),
        avoid: normalizeLifetimeList(
          supplement.executionProtocol.avoid,
          [...next.evidence, ...next.coreInsights],
          executionMinimums.avoidMin,
          executionMinimums.avoidMax,
          ownership.forbiddenKeywords,
        ),
      };
      supplement.executionProtocol = dedupeSupplementExecutionProtocol(
        executionProtocolSeed,
        executionFallbacks,
        executionMinimums,
      );
    }
    supplement.checkpointQuestions = normalizeLifetimeList(
      supplement.checkpointQuestions,
      SUPPLEMENT_CHECKPOINT_FALLBACKS[serviceType],
      2,
      4,
      ownership.forbiddenKeywords,
    );
    supplement.visualExplainers = supplement.visualExplainers.map((explainer) => ({
      ...explainer,
      items: normalizeLifetimeList(
        explainer.items,
        [...next.coreInsights, ...next.actionNow],
        2,
        4,
        ownership.forbiddenKeywords,
      ),
    }));
    next.supplement = supplement;
  }

  const duplicateReference = next.supplement
    ? [
        ...next.supplement.deepDivePoints,
        ...next.supplement.executionProtocol.today,
        ...next.supplement.executionProtocol.thisWeek,
        ...next.supplement.executionProtocol.thisMonth,
        ...next.supplement.checkpointQuestions,
      ]
    : [];

  next.analysisBlocks = normalizeAnalysisBlocksByService(
    serviceType,
    next.analysisBlocks,
    fallbackBlocks,
    ownership.forbiddenKeywords,
    duplicateReference,
  );

  switch (serviceType) {
    case "saju-lifetime-roadmap": {
      const roadmapPayload = next as unknown as SajuReportPayloadMap["saju-lifetime-roadmap"];
      roadmapPayload.longTermFlow = normalizeLifetimeParagraph(
        roadmapPayload.longTermFlow,
        [summary, ...roadmapPayload.stageTransitions, ...roadmapPayload.coreInsights],
        ownership.forbiddenKeywords,
      );
      roadmapPayload.stageTransitions = normalizeLifetimeList(
        roadmapPayload.stageTransitions,
        [...roadmapPayload.pivotMoments, ...roadmapPayload.tenYearStrategy, ...roadmapPayload.coreInsights],
        3,
        4,
        ownership.forbiddenKeywords,
      );
      roadmapPayload.tenYearStrategy = normalizeLifetimeList(
        roadmapPayload.tenYearStrategy,
        [...roadmapPayload.actionNow, ...roadmapPayload.stageTransitions],
        3,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      roadmapPayload.maturityExpansionCleanup = ensureRoadmapMaturityAxes(
        normalizeLifetimeList(
          roadmapPayload.maturityExpansionCleanup,
          [...roadmapPayload.tenYearStrategy, ...roadmapPayload.actionNow],
          3,
          5,
          ownership.forbiddenKeywords,
          { action: true },
        ),
      );
      roadmapPayload.narrativeDirection = normalizeLifetimeParagraph(
        roadmapPayload.narrativeDirection,
        [roadmapPayload.longTermFlow, ...roadmapPayload.stageTransitions],
        ownership.forbiddenKeywords,
      );
      break;
    }
    case "saju-daeun-shift": {
      const shiftPayload = next as unknown as SajuReportPayloadMap["saju-daeun-shift"];
      const longHorizonFallback =
        options.daeunLongHorizonFallback ?? [
          "1~2년: 전환 직후에는 기준 고정과 재배치에 집중해 손실 변동을 줄이세요.",
          "3~5년: 재배치된 운영 모델을 반복해 안정적인 성장 축을 구축하세요.",
          "6~10년: 정착된 기준을 기반으로 확장 선택을 관리해 장기 탄력을 유지하세요.",
        ];
      shiftPayload.transitionSignal = normalizeLifetimeParagraph(
        shiftPayload.transitionSignal,
        [summary, ...shiftPayload.transitionSignals, ...shiftPayload.changePoints],
        ownership.forbiddenKeywords,
      );
      shiftPayload.ninetyDayActions = normalizeLifetimeList(
        shiftPayload.ninetyDayActions,
        [...shiftPayload.actionNow, ...shiftPayload.readinessActions],
        3,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      shiftPayload.avoidanceScenario = normalizeLifetimeList(
        shiftPayload.avoidanceScenario,
        [...shiftPayload.evidence, ...shiftPayload.changePoints],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      shiftPayload.transitionSignals = rebalanceDaeunHorizonList(
        normalizeLifetimeList(
          shiftPayload.transitionSignals,
          [...shiftPayload.coreInsights, shiftPayload.transitionSignal, ...shiftPayload.analysisBlocks.map((block) => block.coreFlow)],
          3,
          4,
          ownership.forbiddenKeywords,
        ),
        [...shiftPayload.analysisBlocks.map((block) => block.coreFlow), ...longHorizonFallback],
        { min: 3, max: 4, minLongTerm: 1, maxShortTerm: 1 },
      );
      shiftPayload.changePoints = rebalanceDaeunHorizonList(
        normalizeLifetimeList(
          shiftPayload.changePoints,
          [...shiftPayload.evidence, ...shiftPayload.transitionSignals, ...shiftPayload.analysisBlocks.map((block) => block.evidence)],
          3,
          4,
          ownership.forbiddenKeywords,
        ),
        [...shiftPayload.analysisBlocks.map((block) => block.evidence), ...longHorizonFallback],
        { min: 3, max: 4, minLongTerm: 1, maxShortTerm: 1 },
      );
      shiftPayload.readinessActions = normalizeLifetimeList(
        shiftPayload.readinessActions,
        [...shiftPayload.ninetyDayActions, ...shiftPayload.actionNow],
        3,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      shiftPayload.preAtPostDiff = ensureMinItems(
        normalizeLifetimeList(
          shiftPayload.preAtPostDiff,
          ["전환 전: 기존 기준을 유지하며 변동 징후를 기록하세요.", "전환 시점: 우선순위를 1개로 좁혀 과속 결정을 차단하세요.", "전환 후: 복구 지표를 월 단위로 추적해 안정화를 고정하세요."],
          3,
          3,
          ownership.forbiddenKeywords,
        ),
        ["전환 전: 기존 기준을 유지하며 변동 징후를 기록하세요.", "전환 시점: 우선순위를 1개로 좁혀 과속 결정을 차단하세요.", "전환 후: 복구 지표를 월 단위로 추적해 안정화를 고정하세요."],
        3,
        3,
      );

      const phaseRoadmapFallback =
        options.daeunPhaseRoadmapFallback ??
        shiftPayload.analysisBlocks.map((block, index) => ({
          phaseLabel: block.windowLabel || `전환 단계 ${index + 1}`,
          ageRange: "연령 정보 기준 자동 보정",
          yearRange: block.timeRange,
          coreFlow: block.coreFlow,
          evidence: block.evidence,
          opportunities: block.opportunities,
          risks: block.risks,
          actionStrategy: block.actionStrategy,
        }));
      const parsedPhaseRoadmap = parseDaeunPhaseRoadmap(shiftPayload.phaseRoadmap, phaseRoadmapFallback);
      const normalizedPhaseRoadmap = phaseRoadmapFallback.map((fallbackPhase, index) => {
        const source = parsedPhaseRoadmap[index] ?? fallbackPhase;
        const block = shiftPayload.analysisBlocks[index] ?? {
          windowLabel: fallbackPhase.phaseLabel,
          timeRange: fallbackPhase.yearRange,
          coreFlow: fallbackPhase.coreFlow,
          evidence: fallbackPhase.evidence,
          opportunities: fallbackPhase.opportunities,
          risks: fallbackPhase.risks,
          actionStrategy: fallbackPhase.actionStrategy,
        };
        return {
          phaseLabel: toStringValue(source.phaseLabel, fallbackPhase.phaseLabel),
          ageRange: toStringValue(source.ageRange, fallbackPhase.ageRange),
          yearRange: toStringValue(source.yearRange, fallbackPhase.yearRange),
          coreFlow: normalizeLifetimeParagraph(
            source.coreFlow,
            [block.coreFlow, fallbackPhase.coreFlow, shiftPayload.transitionSignal],
            ownership.forbiddenKeywords,
          ),
          evidence: normalizeLifetimeParagraph(
            source.evidence,
            [block.evidence, fallbackPhase.evidence, ...shiftPayload.evidence],
            ownership.forbiddenKeywords,
          ),
          opportunities: normalizeLifetimeList(
            source.opportunities,
            [...block.opportunities, ...fallbackPhase.opportunities],
            2,
            4,
            ownership.forbiddenKeywords,
          ),
          risks: normalizeLifetimeList(
            source.risks,
            [...block.risks, ...fallbackPhase.risks],
            2,
            4,
            ownership.forbiddenKeywords,
          ),
          actionStrategy: normalizeLifetimeList(
            source.actionStrategy,
            [...block.actionStrategy, ...fallbackPhase.actionStrategy],
            2,
            4,
            ownership.forbiddenKeywords,
            { action: true },
          ),
        };
      });
      shiftPayload.phaseRoadmap = dedupeDaeunPhaseRoadmap(normalizedPhaseRoadmap, phaseRoadmapFallback);
      shiftPayload.analysisBlocks = shiftPayload.phaseRoadmap.map((phase, index) => {
        const block = shiftPayload.analysisBlocks[index];
        const fallbackPhase = phaseRoadmapFallback[index] ?? phase;
        return {
          windowLabel: toStringValue(phase.phaseLabel, block?.windowLabel ?? fallbackPhase.phaseLabel),
          timeRange: toStringValue(phase.yearRange, block?.timeRange ?? fallbackPhase.yearRange),
          coreFlow: phase.coreFlow,
          evidence: phase.evidence,
          opportunities: phase.opportunities,
          risks: phase.risks,
          actionStrategy: phase.actionStrategy,
        };
      });

      shiftPayload.longHorizonDirection = rebalanceDaeunHorizonList(
        normalizeLifetimeList(
          shiftPayload.longHorizonDirection,
          [
            ...longHorizonFallback,
            ...shiftPayload.phaseRoadmap.map((item) => item.coreFlow),
            ...shiftPayload.phaseRoadmap.map((item) => item.actionStrategy[0] ?? ""),
          ],
          3,
          3,
          ownership.forbiddenKeywords,
        ),
        [...longHorizonFallback, ...shiftPayload.phaseRoadmap.map((item) => item.coreFlow)],
        { min: 3, max: 3, minLongTerm: 3, maxShortTerm: 0 },
      );
      break;
    }
    case "saju-career-timing": {
      const careerPayload = next as unknown as SajuReportPayloadMap["saju-career-timing"];
      const currentYear = formatDateInTimeZone(new Date()).year;
      careerPayload.careerWindow = normalizeLifetimeParagraph(
        careerPayload.careerWindow,
        [summary, ...careerPayload.decisionTree, ...careerPayload.executionChecklist],
        ownership.forbiddenKeywords,
      );
      careerPayload.decisionTree = normalizeLifetimeList(
        careerPayload.decisionTree,
        [...careerPayload.coreInsights, ...careerPayload.decisionCriteria],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      const stageFallback = buildCareerStageFlowFallback(
        careerPayload.careerWindow,
        careerPayload.decisionTree,
        careerPayload.executionChecklist,
        {
          coreInsights: careerPayload.coreInsights,
          actionNow: careerPayload.actionNow,
          evidence: careerPayload.evidence,
        },
        currentYear,
      );
      careerPayload.careerArcSummary = normalizeLifetimeParagraph(
        careerPayload.careerArcSummary,
        [careerPayload.careerWindow, stageFallback.careerArcSummary, ...careerPayload.decisionTree],
        ownership.forbiddenKeywords,
      );
      const stageFlowSeed = parseCareerStageFlow(careerPayload.stageFlow, stageFallback.stageFlow);
      careerPayload.stageFlow = stageFlowSeed.map((stage, index) => {
        const fallbackStage = stageFallback.stageFlow[index] ?? stageFallback.stageFlow[stageFallback.stageFlow.length - 1];
        return {
          stageId: fallbackStage.stageId,
          label: toStringValue(stage.label, fallbackStage.label),
          timeRange: toStringValue(stage.timeRange, fallbackStage.timeRange),
          coreFlow: normalizeLifetimeParagraph(
            stage.coreFlow,
            [fallbackStage.coreFlow, careerPayload.careerArcSummary ?? careerPayload.careerWindow, careerPayload.careerWindow],
            ownership.forbiddenKeywords,
          ),
          evidence: normalizeLifetimeParagraph(
            stage.evidence,
            [fallbackStage.evidence, ...careerPayload.evidence],
            ownership.forbiddenKeywords,
          ),
          opportunities: normalizeLifetimeList(
            stage.opportunities,
            [...fallbackStage.opportunities, ...careerPayload.decisionTree, ...careerPayload.coreInsights],
            2,
            4,
            ownership.forbiddenKeywords,
          ),
          risks: normalizeLifetimeList(
            stage.risks,
            [...fallbackStage.risks, ...careerPayload.evidence, ...careerPayload.gainVsLossPatterns],
            2,
            4,
            ownership.forbiddenKeywords,
          ),
          actionStrategy: normalizeLifetimeList(
            stage.actionStrategy,
            [...fallbackStage.actionStrategy, ...careerPayload.executionChecklist, ...careerPayload.actionNow],
            2,
            4,
            ownership.forbiddenKeywords,
            {
              action: true,
              actionFallback: fallbackStage.actionStrategy[0],
              timeMarkers: CAREER_STAGE_TIME_MARKERS,
            },
          ),
          transitionSignal: normalizeLifetimeParagraph(
            stage.transitionSignal,
            [fallbackStage.transitionSignal, ...careerPayload.decisionCriteria],
            ownership.forbiddenKeywords,
          ),
        } satisfies SajuCareerStageFlowItem;
      });
      careerPayload.executionChecklist = normalizeLifetimeList(
        careerPayload.executionChecklist,
        [...careerPayload.actionNow, ...careerPayload.decisionTree],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      const distinct = ensureDistinctDecisionBuckets(
        normalizeLifetimeList(
          careerPayload.decideNow,
          [...careerPayload.executionChecklist, ...careerPayload.actionNow],
          2,
          4,
          ownership.forbiddenKeywords,
          { action: true },
        ),
        normalizeLifetimeList(
          careerPayload.deferNow,
          [...careerPayload.evidence, ...careerPayload.gainVsLossPatterns],
          2,
          4,
          ownership.forbiddenKeywords,
          { action: true },
        ),
        [...careerPayload.executionChecklist, ...careerPayload.actionNow],
        [...careerPayload.evidence, ...careerPayload.decisionCriteria],
      );
      careerPayload.decideNow = distinct.decideNow;
      careerPayload.deferNow = distinct.deferNow;
      careerPayload.gainVsLossPatterns = normalizeLifetimeList(
        careerPayload.gainVsLossPatterns,
        [...careerPayload.decisionTree, ...careerPayload.evidence],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      careerPayload.decisionCriteria = normalizeLifetimeList(
        careerPayload.decisionCriteria,
        [...careerPayload.decisionTree, "역할 적합 기준과 환경 적합 기준을 분리해 판단하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      careerPayload.workModeFit = normalizeLifetimeParagraph(
        careerPayload.workModeFit,
        [careerPayload.careerArcSummary ?? careerPayload.careerWindow, careerPayload.careerWindow, ...careerPayload.decisionCriteria],
        ownership.forbiddenKeywords,
      );
      careerPayload.transitionSignal = normalizeLifetimeParagraph(
        careerPayload.transitionSignal,
        [
          ...careerPayload.stageFlow.map((stage) => stage.transitionSignal),
          stageFallback.transitionSignal,
          ...careerPayload.decisionCriteria,
        ],
        ownership.forbiddenKeywords,
      );
      careerPayload.currentYearFocus = normalizeLifetimeParagraph(
        careerPayload.currentYearFocus,
        [
          stageFallback.currentYearFocus,
          `${currentYear}년은 장기 커리어 단계 점검을 보조하는 연도입니다.`,
          careerPayload.transitionSignal,
        ],
        ownership.forbiddenKeywords,
      );
      careerPayload.analysisBlocks = careerPayload.stageFlow.map((stage) => ({
        windowLabel: stage.label,
        timeRange: stage.timeRange,
        coreFlow: stage.coreFlow,
        evidence: stage.evidence,
        opportunities: [...stage.opportunities],
        risks: [...stage.risks],
        actionStrategy: [...stage.actionStrategy],
      }));
      break;
    }
    case "saju-wealth-flow": {
      const wealthPayload = next as unknown as SajuReportPayloadMap["saju-wealth-flow"];
      const wealthCurrentYear = Number.isFinite(Number(options.currentYear ?? NaN))
        ? Number(options.currentYear)
        : formatDateInTimeZone(new Date(), undefined).year;
      wealthPayload.cashflowMap = normalizeLifetimeParagraph(
        wealthPayload.cashflowMap,
        [summary, ...wealthPayload.incomeStructure, ...wealthPayload.spendingPatterns],
        ownership.forbiddenKeywords,
      );
      wealthPayload.cashflowMap = suppressAnchorYearOverfocus(wealthPayload.cashflowMap, wealthCurrentYear);
      wealthPayload.riskZones = normalizeLifetimeList(
        wealthPayload.riskZones,
        [...wealthPayload.evidence, ...wealthPayload.financialNoGo],
        2,
        4,
        ownership.forbiddenKeywords,
      ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear));
      wealthPayload.assetRules = normalizeLifetimeList(
        wealthPayload.assetRules,
        [...wealthPayload.actionNow, "현재 구간 손실 한도를 먼저 고정하고 확장 조건을 분리하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
        {
          action: true,
          actionFallback: "현재 구간의 자산 운영 원칙을 고정하고 다음 단계 전환 조건을 점검하세요.",
          timeMarkers: WEALTH_ACTION_TIME_MARKERS,
          targetMarkers: WEALTH_ACTION_TARGET_MARKERS,
          repairTemplates: WEALTH_ACTION_SLOT_REPAIR_TEMPLATES,
        },
      ).map((item) => sanitizeWealthActionSentence(item, wealthCurrentYear));
      wealthPayload.incomeStructure = normalizeLifetimeList(
        wealthPayload.incomeStructure,
        [...wealthPayload.coreInsights, wealthPayload.cashflowMap],
        2,
        4,
        ownership.forbiddenKeywords,
      ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear));
      wealthPayload.spendingPatterns = normalizeLifetimeList(
        wealthPayload.spendingPatterns,
        [...wealthPayload.evidence, ...wealthPayload.riskZones],
        2,
        4,
        ownership.forbiddenKeywords,
      ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear));
      wealthPayload.accumulateVsExpand = normalizeLifetimeList(
        wealthPayload.accumulateVsExpand,
        [...wealthPayload.assetRules, ...wealthPayload.actionNow],
        2,
        4,
        ownership.forbiddenKeywords,
      ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear));
      wealthPayload.financialNoGo = normalizeLifetimeList(
        wealthPayload.financialNoGo,
        [...wealthPayload.riskZones, "손실 한도 초과 구간은 즉시 확장 결정을 중단하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
      ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear));

      const wealthFallback = buildWealthLifecycleFallbackArtifacts(
        {
          currentYear: wealthCurrentYear,
          currentAge: null,
        },
        wealthPayload.cashflowMap,
        {
          coreInsights: wealthPayload.coreInsights,
          actionNow: wealthPayload.actionNow,
          evidence: wealthPayload.evidence,
        },
        wealthPayload.riskZones,
        wealthPayload.assetRules,
        wealthPayload.assetTrendEvidence,
      );
      const parsedWealthStages = parseWealthLifecycleStages(
        wealthPayload.wealthLifecycleStages,
        wealthFallback.wealthLifecycleStages,
      );

      wealthPayload.wealthLifecycleStages = WEALTH_LIFECYCLE_TEMPLATES.map((template, index) => {
        const fallbackStage = wealthFallback.wealthLifecycleStages[index] ?? wealthFallback.wealthLifecycleStages[0];
        const source = parsedWealthStages[index] ?? fallbackStage;

        const coreObjective = suppressAnchorYearOverfocus(
          normalizeLifetimeParagraph(
            source.coreObjective,
            [fallbackStage.coreObjective, wealthPayload.cashflowMap, wealthPayload.coreInsights[index]],
            ownership.forbiddenKeywords,
          ),
          wealthCurrentYear,
        );
        const opportunity = suppressAnchorYearOverfocus(
          normalizeLifetimeParagraph(
            source.opportunity,
            [fallbackStage.opportunity, wealthPayload.incomeStructure[index], wealthPayload.coreInsights[index]],
            ownership.forbiddenKeywords,
          ),
          wealthCurrentYear,
        );
        const risk = suppressAnchorYearOverfocus(
          normalizeLifetimeParagraph(
            source.risk,
            [fallbackStage.risk, wealthPayload.riskZones[index], wealthPayload.financialNoGo[index]],
            ownership.forbiddenKeywords,
          ),
          wealthCurrentYear,
        );
        const operatingRules = normalizeLifetimeList(
          source.operatingRules,
          [...fallbackStage.operatingRules, ...wealthPayload.assetRules, ...wealthPayload.actionNow],
          2,
          4,
          ownership.forbiddenKeywords,
          {
            action: true,
            actionFallback: fallbackStage.operatingRules[0],
            timeMarkers: WEALTH_ACTION_TIME_MARKERS,
            targetMarkers: WEALTH_ACTION_TARGET_MARKERS,
            repairTemplates: WEALTH_ACTION_SLOT_REPAIR_TEMPLATES,
          },
        ).map((item) => sanitizeWealthActionSentence(item, wealthCurrentYear));
        const transitionSignal = suppressAnchorYearOverfocus(
          normalizeLifetimeParagraph(
            source.transitionSignal,
            [fallbackStage.transitionSignal, opportunity, risk],
            ownership.forbiddenKeywords,
          ),
          wealthCurrentYear,
        );

        return {
          phaseType: template.phaseType,
          timeRange: toStringValue(source.timeRange, fallbackStage.timeRange),
          ageRange: toStringValue(source.ageRange, fallbackStage.ageRange),
          yearRange: suppressAnchorYearOverfocus(
            toStringValue(source.yearRange, fallbackStage.yearRange),
            wealthCurrentYear,
          ),
          coreObjective,
          opportunity,
          risk,
          operatingRules,
          transitionSignal,
        } satisfies SajuWealthLifecycleStage;
      });

      wealthPayload.actionNow = ensureMinItems(
        uniqueItems(wealthPayload.actionNow.map((item) => sanitizeWealthActionSentence(item, wealthCurrentYear))),
        wealthPayload.wealthLifecycleStages.flatMap((stage) => stage.operatingRules),
        2,
        4,
      );

      wealthPayload.analysisBlocks = wealthPayload.wealthLifecycleStages.map((stage, index) => {
        const blockFallback = wealthFallback.analysisBlocks[index] ?? wealthFallback.analysisBlocks[0];
        const sourceBlock = wealthPayload.analysisBlocks[index] ?? blockFallback;
        const evidenceText = suppressAnchorYearOverfocus(
          normalizeLifetimeParagraph(
            sourceBlock?.evidence,
            [blockFallback.evidence, wealthPayload.evidence[index], stage.transitionSignal, stage.risk],
            ownership.forbiddenKeywords,
          ),
          wealthCurrentYear,
        );
        return {
          windowLabel: getWealthLifecycleLabel(stage.phaseType),
          timeRange: stage.timeRange,
          coreFlow: stage.coreObjective,
          evidence: evidenceText,
          opportunities: ensureMinItems(
            normalizeLifetimeList(
              sourceBlock?.opportunities,
              [stage.opportunity, stage.transitionSignal],
              2,
              4,
              ownership.forbiddenKeywords,
            ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear)),
            [stage.opportunity, stage.transitionSignal].map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear)),
            2,
            4,
          ),
          risks: ensureMinItems(
            normalizeLifetimeList(
              sourceBlock?.risks,
              [stage.risk, stage.transitionSignal],
              2,
              4,
              ownership.forbiddenKeywords,
            ).map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear)),
            [stage.risk, stage.transitionSignal].map((item) => suppressAnchorYearOverfocus(item, wealthCurrentYear)),
            2,
            4,
          ),
          actionStrategy: ensureMinItems(
            normalizeLifetimeList(
              sourceBlock?.actionStrategy,
              [...stage.operatingRules, ...wealthPayload.assetRules, ...wealthPayload.actionNow],
              2,
              4,
              ownership.forbiddenKeywords,
              {
                action: true,
                actionFallback: stage.operatingRules[0],
                timeMarkers: WEALTH_ACTION_TIME_MARKERS,
                targetMarkers: WEALTH_ACTION_TARGET_MARKERS,
                repairTemplates: WEALTH_ACTION_SLOT_REPAIR_TEMPLATES,
              },
            ).map((item) => sanitizeWealthActionSentence(item, wealthCurrentYear)),
            stage.operatingRules,
            2,
            4,
          ),
        } satisfies SajuAnalysisBlock;
      });
      break;
    }
    case "saju-helper-network": {
      const helperPayload = next as unknown as SajuReportPayloadMap["saju-helper-network"];
      const helperCurrentYear = Number.isFinite(Number(options.currentYear ?? NaN))
        ? Number(options.currentYear)
        : formatDateInTimeZone(new Date(), undefined).year;
      const helperLongHorizonFallback =
        options.helperLongHorizonFallback ?? [
          "1~2년: 관계 레이어 정리와 협업 기준 고정으로 관계 자산의 기반을 먼저 구축하세요.",
          "3~5년: 협업 확장 속도보다 역할 합의 속도를 우선해 갈등 재발률을 낮추세요.",
          "6~10년: 멘토·귀인 유입 채널을 유지하면서 관계 자산을 장기 협력 구조로 전환하세요.",
        ];
      helperPayload.helperMap = normalizeLifetimeParagraph(
        helperPayload.helperMap,
        [summary, ...helperPayload.networkGuide, ...helperPayload.relationLayers],
        ownership.forbiddenKeywords,
      );
      helperPayload.conflictPatterns = normalizeLifetimeList(
        helperPayload.conflictPatterns,
        [...helperPayload.evidence, ...helperPayload.conflictLoops],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      helperPayload.networkGuide = normalizeLifetimeList(
        helperPayload.networkGuide,
        [...helperPayload.actionNow, ...helperPayload.relationLayers],
        2,
        4,
        ownership.forbiddenKeywords,
        {
          action: true,
          actionFallback: "3~5년 협업 기준을 문장으로 고정하고 관계 충돌 지표를 분기마다 점검하세요.",
          timeMarkers: HELPER_ACTION_TIME_MARKERS,
          targetMarkers: HELPER_ACTION_TARGET_MARKERS,
          repairTemplates: HELPER_ACTION_SLOT_REPAIR_TEMPLATES,
        },
      );
      helperPayload.networkGuide = rebalanceHelperHorizonList(
        helperPayload.networkGuide.map((item) =>
          suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
        ),
        [...helperLongHorizonFallback, ...helperPayload.actionNow],
        { min: 2, max: 4, minLongTerm: 2, maxShortTerm: 1 },
      );
      helperPayload.helperProfiles = normalizeLifetimeList(
        helperPayload.helperProfiles,
        [...helperPayload.coreInsights, "실행을 연결해 주는 조율형 인물과 정리형 인물을 우선 구분하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      helperPayload.relationExpansionVsEntanglement = normalizeLifetimeList(
        helperPayload.relationExpansionVsEntanglement,
        [...helperPayload.networkGuide, ...helperPayload.conflictPatterns],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      helperPayload.conflictLoops = normalizeLifetimeList(
        helperPayload.conflictLoops,
        [...helperPayload.conflictPatterns, "반복 갈등 루프를 발견하면 경계 문장을 즉시 적용하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
        {
          action: true,
          actionFallback: "3~5년 갈등 루프를 기록하고 경계 문장을 먼저 적용해 협업 손실을 줄이세요.",
          timeMarkers: HELPER_ACTION_TIME_MARKERS,
          targetMarkers: HELPER_ACTION_TARGET_MARKERS,
          repairTemplates: HELPER_ACTION_SLOT_REPAIR_TEMPLATES,
        },
      );
      helperPayload.helperEntryWindows = normalizeLifetimeList(
        helperPayload.helperEntryWindows,
        [...helperPayload.coreInsights, ...helperPayload.actionNow, ...helperLongHorizonFallback],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      helperPayload.relationLayers = ensureRelationLayerTriplet(
        normalizeLifetimeList(
          helperPayload.relationLayers,
          [...helperPayload.networkGuide, ...helperPayload.helperProfiles],
          3,
          5,
          ownership.forbiddenKeywords,
        ),
      );
      helperPayload.actionNow = rebalanceHelperHorizonList(
        helperPayload.actionNow.map((item) =>
          suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
        ),
        [...helperPayload.networkGuide, ...helperPayload.helperEntryWindows],
        { min: 2, max: 4, minLongTerm: 2, maxShortTerm: 1 },
      );
      helperPayload.conflictPatterns = helperPayload.conflictPatterns.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );
      helperPayload.helperProfiles = helperPayload.helperProfiles.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );
      helperPayload.relationExpansionVsEntanglement = helperPayload.relationExpansionVsEntanglement.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );
      helperPayload.conflictLoops = helperPayload.conflictLoops.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );
      helperPayload.helperEntryWindows = helperPayload.helperEntryWindows.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );
      helperPayload.relationLayers = helperPayload.relationLayers.map((item) =>
        suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear),
      );

      const helperFallbackSeed =
        options.helperPhaseRoadmapFallback ??
        buildHelperNetworkFallbackArtifacts(
          { currentYear: helperCurrentYear, currentAge: null },
          helperPayload.helperMap,
          {
            coreInsights: helperPayload.coreInsights,
            actionNow: helperPayload.actionNow,
            evidence: helperPayload.evidence,
          },
          helperPayload.conflictPatterns,
          helperPayload.networkGuide,
        ).phaseRoadmap;
      const parsedPhaseRoadmap = parseHelperPhaseRoadmap(helperPayload.phaseRoadmap, helperFallbackSeed);
      helperPayload.phaseRoadmap = helperFallbackSeed.map((fallbackPhase, index) => {
        const source = parsedPhaseRoadmap[index] ?? fallbackPhase;
        const actionFallback = fallbackPhase.actionStrategy[0] ?? "3~5년 관계 운영 기준을 문장으로 고정하세요.";
        return {
          phaseLabel: toStringValue(source.phaseLabel, fallbackPhase.phaseLabel),
          timeRange: suppressAnchorYearOverfocus(
            toStringValue(source.timeRange, fallbackPhase.timeRange),
            helperCurrentYear,
          ),
          relationshipExpansion: suppressAnchorYearOverfocus(
            sanitizeHelperSentence(
              normalizeLifetimeParagraph(
                source.relationshipExpansion,
                [fallbackPhase.relationshipExpansion, helperPayload.helperMap, ...helperPayload.relationExpansionVsEntanglement],
                ownership.forbiddenKeywords,
              ),
            ),
            helperCurrentYear,
          ),
          collaborationFlow: suppressAnchorYearOverfocus(
            sanitizeHelperSentence(
              normalizeLifetimeParagraph(
                source.collaborationFlow,
                [fallbackPhase.collaborationFlow, ...helperPayload.networkGuide, ...helperPayload.relationLayers],
                ownership.forbiddenKeywords,
              ),
            ),
            helperCurrentYear,
          ),
          mentorInfluxSignal: suppressAnchorYearOverfocus(
            sanitizeHelperSentence(
              normalizeLifetimeParagraph(
                source.mentorInfluxSignal,
                [fallbackPhase.mentorInfluxSignal, ...helperPayload.helperEntryWindows, ...helperPayload.evidence],
                ownership.forbiddenKeywords,
              ),
            ),
            helperCurrentYear,
          ),
          guardPattern: suppressAnchorYearOverfocus(
            sanitizeHelperSentence(
              normalizeLifetimeParagraph(
                source.guardPattern,
                [fallbackPhase.guardPattern, ...helperPayload.conflictPatterns, ...helperPayload.conflictLoops],
                ownership.forbiddenKeywords,
              ),
            ),
            helperCurrentYear,
          ),
          actionStrategy: normalizeLifetimeList(
            source.actionStrategy,
            [...fallbackPhase.actionStrategy, ...helperPayload.networkGuide, ...helperPayload.actionNow],
            2,
            4,
            ownership.forbiddenKeywords,
            {
              action: true,
              actionFallback,
              timeMarkers: HELPER_ACTION_TIME_MARKERS,
              targetMarkers: HELPER_ACTION_TARGET_MARKERS,
              repairTemplates: HELPER_ACTION_SLOT_REPAIR_TEMPLATES,
            },
          ).map((item) => suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear)),
        } satisfies SajuHelperPhaseRoadmapItem;
      });
      helperPayload.longHorizonDirection = rebalanceHelperHorizonList(
        normalizeLifetimeList(
          helperPayload.longHorizonDirection,
          [
            ...helperLongHorizonFallback,
            ...(helperPayload.phaseRoadmap ?? []).map((phase) => phase.relationshipExpansion),
            ...(helperPayload.phaseRoadmap ?? []).map((phase) => phase.collaborationFlow),
            ...(helperPayload.phaseRoadmap ?? []).map((phase) => phase.mentorInfluxSignal),
          ],
          3,
          3,
          ownership.forbiddenKeywords,
        ),
        [...helperLongHorizonFallback, ...(helperPayload.phaseRoadmap ?? []).map((phase) => phase.relationshipExpansion)],
        { min: 3, max: 3, minLongTerm: 3, maxShortTerm: 0 },
      ).map((item) => suppressAnchorYearOverfocus(sanitizeHelperSentence(item), helperCurrentYear));

      const helperAnalysisFallback =
        options.helperAnalysisFallback ??
        (helperPayload.phaseRoadmap ?? []).slice(0, 3).map((phase) => ({
          windowLabel: phase.phaseLabel,
          timeRange: phase.timeRange,
          coreFlow: phase.relationshipExpansion,
          evidence: phase.mentorInfluxSignal,
          opportunities: [phase.collaborationFlow, phase.mentorInfluxSignal],
          risks: [phase.guardPattern, phase.relationshipExpansion],
          actionStrategy: [...phase.actionStrategy],
        }));
      const helperAnalysisSeed = (helperPayload.phaseRoadmap ?? []).slice(0, 3).map((phase) => ({
        windowLabel: phase.phaseLabel,
        timeRange: phase.timeRange,
        coreFlow: phase.relationshipExpansion,
        evidence: phase.mentorInfluxSignal,
        opportunities: [phase.collaborationFlow, phase.mentorInfluxSignal],
        risks: [phase.guardPattern, phase.relationshipExpansion],
        actionStrategy: [...phase.actionStrategy],
      }));
      helperPayload.analysisBlocks = dedupeHelperAnalysisBlocks(helperAnalysisSeed, helperAnalysisFallback);
      break;
    }
    case "saju-energy-balance": {
      const energyPayload = next as unknown as SajuReportPayloadMap["saju-energy-balance"];
      energyPayload.energyCurve = normalizeLifetimeParagraph(
        energyPayload.energyCurve,
        [
          summary,
          energyPayload.innateProfile,
          ...(energyPayload.operatingModel ?? []),
          ...energyPayload.routineDesign,
          ...energyPayload.recoveryProtocol,
        ],
        ownership.forbiddenKeywords,
      );
      energyPayload.innateProfile = normalizeLifetimeParagraph(
        energyPayload.innateProfile,
        [energyPayload.energyCurve, ...energyPayload.coreInsights, ...energyPayload.immersionMode],
        ownership.forbiddenKeywords,
      );
      energyPayload.operatingModel = normalizeLifetimeList(
        energyPayload.operatingModel,
        [...energyPayload.routineDesign, ...energyPayload.immersionMode, ...energyPayload.actionNow],
        3,
        5,
        ownership.forbiddenKeywords,
        { action: true },
      );
      energyPayload.routineDesign = normalizeLifetimeList(
        energyPayload.routineDesign,
        [...energyPayload.actionNow, ...energyPayload.recoveryRoutines, ...(energyPayload.operatingModel ?? [])],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      energyPayload.recoveryProtocol = normalizeLifetimeList(
        energyPayload.recoveryProtocol,
        [...energyPayload.evidence, "24h/72h 회복 프로토콜을 분리해 일정에 고정하세요."],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      energyPayload.immersionMode = normalizeLifetimeList(
        energyPayload.immersionMode,
        [...energyPayload.coreInsights, ...energyPayload.routineDesign],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      energyPayload.burnoutSignals = normalizeLifetimeList(
        energyPayload.burnoutSignals,
        [...energyPayload.evidence, ...energyPayload.overloadAlerts],
        2,
        4,
        ownership.forbiddenKeywords,
      );
      energyPayload.stageShiftMap = ensureEnergyStageShiftMap(
        normalizeLifetimeList(
          energyPayload.stageShiftMap,
          [...energyPayload.coreInsights, ...energyPayload.evidence, ...(energyPayload.operatingModel ?? [])],
          3,
          5,
          ownership.forbiddenKeywords,
        ),
      );
      energyPayload.longRangeStrategy = ensureEnergyLongRangeCoverage(
        normalizeLifetimeList(
          energyPayload.longRangeStrategy,
          [...energyPayload.actionNow, ...energyPayload.recoveryProtocol, ...(energyPayload.stageShiftMap ?? [])],
          3,
          6,
          ownership.forbiddenKeywords,
          { action: true },
        ),
      );
      energyPayload.overloadAlerts = normalizeLifetimeList(
        energyPayload.overloadAlerts,
        [
          ...energyPayload.burnoutSignals,
          "소진 조기경보가 뜨면 즉시 강도를 낮추고 회복 슬롯을 우선 배치하세요.",
          ...(energyPayload.longRangeStrategy ?? []),
        ],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      energyPayload.habitTweaks = normalizeLifetimeList(
        energyPayload.habitTweaks,
        [...energyPayload.routineDesign, ...energyPayload.actionNow],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      energyPayload.recoveryRoutines = normalizeLifetimeList(
        energyPayload.recoveryRoutines,
        [...energyPayload.recoveryProtocol, ...energyPayload.habitTweaks, ...(energyPayload.longRangeStrategy ?? [])],
        2,
        4,
        ownership.forbiddenKeywords,
        { action: true },
      );
      break;
    }
    case "saju-yearly-action-calendar": {
      const calendarPayload = next as unknown as SajuReportPayloadMap["saju-yearly-action-calendar"];
      const lifecycleExecutionFallback = buildYearlyLifecycleExecutionFallback(
        calendarPayload.coreInsights,
        calendarPayload.actionNow,
      );
      calendarPayload.lifecycleExecutionPattern = ensureYearlyLifecycleCoverage(
        normalizeLifetimeList(
          calendarPayload.lifecycleExecutionPattern,
          [...lifecycleExecutionFallback, ...calendarPayload.actionNow, ...calendarPayload.coreInsights],
          3,
          6,
          ownership.forbiddenKeywords,
        ),
        lifecycleExecutionFallback,
      );
      calendarPayload.quarterlyGoals = ensureMinItems(
        normalizeLifetimeList(
          calendarPayload.quarterlyGoals,
          [...calendarPayload.coreInsights, "분기 목표를 월별 실행 행동과 즉시 연결하세요."],
          4,
          4,
          ownership.forbiddenKeywords,
          { action: true },
        ),
        ["1분기 목표를 실행 가능한 행동으로 분해하세요.", "2분기 목표의 우선순위를 재정렬하세요.", "3분기 목표의 위험 요인을 사전 차단하세요.", "4분기 목표의 마감 완성도를 먼저 점검하세요."],
        4,
        4,
      );
      calendarPayload.riskCalendar = ensureMinItems(
        normalizeLifetimeList(
          calendarPayload.riskCalendar,
          [...calendarPayload.evidence, "분기별 주의 구간을 월별 리스크와 함께 기록하세요."],
          4,
          4,
          ownership.forbiddenKeywords,
        ),
        ["1분기: 과속 실행으로 우선순위가 흔들리지 않게 주의하세요.", "2분기: 목표 과다 설정으로 일정이 분산되지 않게 관리하세요.", "3분기: 누적 지연 항목을 복구 없이 넘기지 마세요.", "4분기: 마감 직전 품질 저하를 방지하기 위해 체크포인트를 고정하세요."],
        4,
        4,
      );
      calendarPayload.quarterThemes = ensureMinItems(
        normalizeLifetimeList(
          calendarPayload.quarterThemes,
          [...calendarPayload.quarterlyGoals, ...calendarPayload.coreInsights],
          4,
          4,
          ownership.forbiddenKeywords,
        ),
        ["1분기: 우선순위 정렬", "2분기: 실행 가속", "3분기: 리스크 통제", "4분기: 마감 완성"],
        4,
        4,
      );
      calendarPayload.monthlyActions = normalizeCalendarMonthList(
        calendarPayload.monthlyActions,
        [...calendarPayload.actionNow, ...calendarPayload.quarterlyGoals],
        ownership.forbiddenKeywords,
        { action: true },
      );
      calendarPayload.monthlyPushCaution = normalizeCalendarMonthList(
        calendarPayload.monthlyPushCaution,
        [...calendarPayload.riskCalendar, ...calendarPayload.evidence],
        ownership.forbiddenKeywords,
        { caution: true },
      );
      calendarPayload.actionCheckpoints = normalizeCalendarMonthList(
        calendarPayload.actionCheckpoints,
        [...calendarPayload.monthlyActions, ...calendarPayload.quarterlyGoals],
        ownership.forbiddenKeywords,
        { action: true },
      );
      calendarPayload.priorityQueue = normalizeLifetimeList(
        calendarPayload.priorityQueue,
        [...calendarPayload.actionNow, ...calendarPayload.quarterlyGoals],
        3,
        6,
        ownership.forbiddenKeywords,
        { action: true },
      );
      calendarPayload.yearToLifeBridge = normalizeYearlyNarrativeParagraph(
        calendarPayload.yearToLifeBridge,
        [
          ...calendarPayload.lifecycleExecutionPattern,
          ...calendarPayload.quarterlyGoals,
          ...calendarPayload.priorityQueue,
          ...calendarPayload.actionNow,
        ],
        ownership.forbiddenKeywords,
      );
      const phaseFocusFallback = buildYearlyPhaseFocusFallback(
        calendarPayload.lifecycleExecutionPattern,
        calendarPayload.priorityQueue,
      );
      const parsedPhaseFocus = parseYearlyPhaseFocusMap(calendarPayload.phaseFocusMap, phaseFocusFallback);
      calendarPayload.phaseFocusMap = ensureMinObjectItems(
        parsedPhaseFocus.map((item, index) => {
          const fallback = phaseFocusFallback[index] ?? phaseFocusFallback[phaseFocusFallback.length - 1];
          const phaseLabel = toStringValue(item.phaseLabel, fallback?.phaseLabel ?? YEARLY_PHASE_FOCUS_LABELS[index] ?? "전환");
          const executionFallback =
            fallback?.executionPattern ?? `${phaseLabel} 구간에서 실행 기준을 고정하고 결과를 점검하세요.`;
          return {
            phaseLabel,
            focusPoint: normalizeLifetimeParagraph(
              item.focusPoint,
              [fallback?.focusPoint, calendarPayload.yearToLifeBridge, ...calendarPayload.coreInsights],
              ownership.forbiddenKeywords,
            ),
            executionPattern: normalizeYearlyNarrativeParagraph(
              item.executionPattern,
              [executionFallback, ...calendarPayload.lifecycleExecutionPattern, ...calendarPayload.actionNow],
              ownership.forbiddenKeywords,
            ),
            checkpoint: normalizeLifetimeParagraph(
              item.checkpoint,
              [fallback?.checkpoint, ...calendarPayload.priorityQueue, ...calendarPayload.evidence],
              ownership.forbiddenKeywords,
            ),
          } satisfies YearlyPhaseFocusMapItem;
        }),
        phaseFocusFallback,
        4,
        6,
      );
      const accumulationFlowFallback = buildYearlyAccumulationTransitionFallback(
        calendarPayload.quarterlyGoals,
        calendarPayload.riskCalendar,
        calendarPayload.actionCheckpoints,
      );
      const parsedAccumulationFlow = parseYearlyAccumulationTransitionFlow(
        calendarPayload.accumulationTransitionFlow,
        accumulationFlowFallback,
      );
      calendarPayload.accumulationTransitionFlow = ensureMinObjectItems(
        parsedAccumulationFlow.map((item, index) => {
          const fallback = accumulationFlowFallback[index] ?? accumulationFlowFallback[accumulationFlowFallback.length - 1];
          const axis = toStringValue(item.axis, fallback?.axis ?? YEARLY_ACCUMULATION_AXES[index] ?? "축");
          return {
            axis,
            guidance: normalizeLifetimeParagraph(
              item.guidance,
              [fallback?.guidance, ...calendarPayload.quarterlyGoals, ...calendarPayload.riskCalendar],
              ownership.forbiddenKeywords,
            ),
          } satisfies YearlyAccumulationFlowItem;
        }),
        accumulationFlowFallback,
        4,
        6,
      );
      calendarPayload.longPracticeStrategy = normalizeLifetimeList(
        calendarPayload.longPracticeStrategy,
        [
          ...calendarPayload.lifecycleExecutionPattern,
          ...calendarPayload.priorityQueue,
          ...calendarPayload.actionNow,
        ],
        3,
        6,
        ownership.forbiddenKeywords,
      );

      calendarPayload.quarterlyGoals = normalizeCalendarPlainLanguageList(calendarPayload.quarterlyGoals);
      calendarPayload.riskCalendar = normalizeCalendarPlainLanguageList(calendarPayload.riskCalendar);
      calendarPayload.quarterThemes = normalizeCalendarPlainLanguageList(calendarPayload.quarterThemes);
      calendarPayload.monthlyActions = normalizeCalendarPlainLanguageList(calendarPayload.monthlyActions);
      calendarPayload.monthlyPushCaution = normalizeCalendarPlainLanguageList(calendarPayload.monthlyPushCaution);
      calendarPayload.actionCheckpoints = normalizeCalendarPlainLanguageList(calendarPayload.actionCheckpoints);
      calendarPayload.priorityQueue = normalizeCalendarPlainLanguageList(calendarPayload.priorityQueue);
      calendarPayload.lifecycleExecutionPattern = normalizeCalendarPlainLanguageList(
        calendarPayload.lifecycleExecutionPattern,
      );
      calendarPayload.longPracticeStrategy = normalizeCalendarPlainLanguageList(calendarPayload.longPracticeStrategy);
      calendarPayload.yearToLifeBridge = normalizeCalendarPlainLanguageSentence(calendarPayload.yearToLifeBridge);
      calendarPayload.phaseFocusMap = calendarPayload.phaseFocusMap.map((item, index) => ({
        phaseLabel: YEARLY_PHASE_FOCUS_LABELS[index] ?? toStringValue(item.phaseLabel, "전환"),
        focusPoint: normalizeCalendarPlainLanguageSentence(item.focusPoint),
        executionPattern: normalizeCalendarPlainLanguageSentence(item.executionPattern),
        checkpoint: normalizeCalendarPlainLanguageSentence(item.checkpoint),
      }));
      calendarPayload.accumulationTransitionFlow = calendarPayload.accumulationTransitionFlow.map((item, index) => ({
        axis: toStringValue(item.axis, YEARLY_ACCUMULATION_AXES[index] ?? "축"),
        guidance: normalizeCalendarPlainLanguageSentence(item.guidance),
      }));
      const normalizedCalendarPayload = enforceYearlyQuarterMonthConsistency(calendarPayload);
      Object.assign(calendarPayload, normalizedCalendarPayload);

      next.analysisBlocks = next.analysisBlocks.map((block) => ({
        ...block,
        windowLabel: normalizeCalendarQuarterTokens(block.windowLabel),
        timeRange: normalizeCalendarQuarterTokens(block.timeRange),
        coreFlow: normalizeCalendarPlainLanguageSentence(block.coreFlow),
        evidence: normalizeCalendarPlainLanguageSentence(block.evidence),
        opportunities: normalizeCalendarPlainLanguageList(block.opportunities),
        risks: normalizeCalendarPlainLanguageList(block.risks),
        actionStrategy: normalizeCalendarPlainLanguageList(block.actionStrategy),
      }));

      if (next.supplement) {
        next.supplement = {
          ...next.supplement,
          deepInsightSummary: normalizeCalendarPlainLanguageSentence(next.supplement.deepInsightSummary),
          deepDivePoints: normalizeCalendarPlainLanguageList(next.supplement.deepDivePoints),
          checkpointQuestions: normalizeCalendarPlainLanguageList(next.supplement.checkpointQuestions),
          executionProtocol: {
            today: normalizeCalendarPlainLanguageList(next.supplement.executionProtocol.today),
            thisWeek: normalizeCalendarPlainLanguageList(next.supplement.executionProtocol.thisWeek),
            thisMonth: normalizeCalendarPlainLanguageList(next.supplement.executionProtocol.thisMonth),
            avoid: normalizeCalendarPlainLanguageList(next.supplement.executionProtocol.avoid),
          },
          visualExplainers: next.supplement.visualExplainers.map((explainer) => ({
            ...explainer,
            title: normalizeCalendarQuarterTokens(explainer.title),
            items: normalizeCalendarPlainLanguageList(explainer.items),
          })),
        };
      }
      Object.assign(
        calendarPayload,
        validateAndRepairYearlyPayload(calendarPayload, {
          summary,
          coreInsights: calendarPayload.coreInsights,
          actionNow: calendarPayload.actionNow,
          evidence: calendarPayload.evidence,
          forbiddenKeywords: ownership.forbiddenKeywords,
        }),
      );
      break;
    }
  }

  return next as SajuReportPayloadMap[K];
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
        : "saju-report-v2.9",
    payload,
    commonPayload: {
      coreInsights: toStringArray(payload.coreInsights, coreInsightsFallback, 4),
      actionNow: toStringArray(payload.actionNow, actionNowFallback, 4),
      evidence: toStringArray(payload.evidence, evidenceFallback, 4),
    },
  };
};

const parseLifetimeAnalysisPayload = (data: unknown, req?: SajuAnalysisRequest): SajuAnalysisResponse => {
  const base = parseCommonAnalysis(data);
  const parsed = base.parsed;
  const anchorContext = buildLifetimeAnchorContext(req);
  const payloadRecord = isRecord(parsed.reportPayload) ? parsed.reportPayload : {};

  const lifetimeScoreCandidate = Number(parsed.lifetimeScore ?? payloadRecord.lifetimeScore ?? NaN);
  const rawDaeunPeriods = parseDaeunPeriods(
    parsed.daeunPeriods ?? payloadRecord.daeunPeriods,
    anchorContext.currentYear,
  );
  const rawGoldenPeriods = parseGoldenPeriods(parsed.goldenPeriods ?? payloadRecord.goldenPeriods);
  const lifetimeScore = Number.isFinite(lifetimeScoreCandidate)
    ? clamp(Math.trunc(lifetimeScoreCandidate), 0, 100)
    : rawDaeunPeriods.length > 0
      ? clamp(Math.round(rawDaeunPeriods.reduce((sum, period) => sum + period.score, 0) / rawDaeunPeriods.length), 0, 100)
      : 75;

  const normalizedTimeline = normalizeLifetimePeriods(rawDaeunPeriods, rawGoldenPeriods, anchorContext);
  const personalityRaw = isRecord(parsed.personalityType) ? parsed.personalityType : {};
  const longTermFlow =
    typeof base.payload.longTermFlow === "string" && base.payload.longTermFlow.length > 0
      ? base.payload.longTermFlow
      : base.summary;

  const fallbackBlocks = buildLifetimeFallbackBlocks(normalizedTimeline.daeunPeriods, base.commonPayload, longTermFlow);
  const roadmapPayload: SajuReportPayloadMap["saju-lifetime-roadmap"] = {
    coreQuestion:
      toStringValue(base.payload.coreQuestion, SERVICE_CORE_QUESTIONS["saju-lifetime-roadmap"]),
    ...base.commonPayload,
    analysisBlocks: parseAnalysisBlocks(base.payload.analysisBlocks, fallbackBlocks),
    longTermFlow,
    pivotMoments: toStringArray(
      base.payload.pivotMoments,
      normalizedTimeline.daeunPeriods.map((item) => item.keyword ?? "").filter(Boolean),
      4,
    ),
    tenYearStrategy: toStringArray(base.payload.tenYearStrategy, base.commonPayload.actionNow, 4),
    stageTransitions: toStringArray(base.payload.stageTransitions, base.commonPayload.coreInsights, 4),
    narrativeDirection: toStringValue(base.payload.narrativeDirection, longTermFlow),
    maturityExpansionCleanup: toStringArray(base.payload.maturityExpansionCleanup, base.commonPayload.actionNow, 4),
    supplement: parseSupplementByService(
      "saju-lifetime-roadmap",
      base.payload,
      base.commonPayload,
      [
        longTermFlow,
        ...toStringArray(base.payload.pivotMoments, [], 4),
        ...toStringArray(base.payload.stageTransitions, [], 4),
        ...toStringArray(base.payload.tenYearStrategy, [], 4),
      ],
    ),
  };
  const normalizedRoadmapPayload = normalizeLifetimePayloadByService(
    "saju-lifetime-roadmap",
    roadmapPayload,
    fallbackBlocks,
    base.summary,
  );

  return {
    serviceType: "saju-lifetime-roadmap",
    summary: base.summary,
    sections: base.sections,
    reportTemplateVersion: base.reportTemplateVersion,
    reportPayload: normalizedRoadmapPayload,
    lifetimeScore: Math.max(0, Math.min(100, Math.round(lifetimeScore))),
    daeunPeriods: normalizedTimeline.daeunPeriods,
    goldenPeriods: normalizedTimeline.goldenPeriods,
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
  req?: SajuAnalysisRequest,
): SajuAnalysisResponse => {
  const base = parseCommonAnalysis(data);
  const payload = base.payload;
  let reportPayload: SajuReportPayloadMap[K];
  let fallbackBlocksForService: SajuAnalysisBlock[] = [];
  let normalizeOptionsForService: NormalizeLifetimePayloadOptions | undefined;

  switch (serviceType) {
    case "saju-daeun-shift": {
      const transitionSignal =
        typeof payload.transitionSignal === "string" && payload.transitionSignal.length > 0
          ? payload.transitionSignal
          : base.summary;
      const ninetyDayActions = toStringArray(payload.ninetyDayActions, base.commonPayload.actionNow, 4);
      const avoidanceScenario = toStringArray(payload.avoidanceScenario, base.commonPayload.evidence, 4);
      const anchorContext = buildLifetimeAnchorContext(req);
      const daeunFallback = buildDaeunShiftFallbackArtifacts(
        anchorContext,
        transitionSignal,
        base.commonPayload,
        ninetyDayActions,
        avoidanceScenario,
      );
      const fallbackBlocks = daeunFallback.analysisBlocks;
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        transitionSignal,
        ninetyDayActions,
        avoidanceScenario,
        transitionSignals: toStringArray(payload.transitionSignals, base.commonPayload.coreInsights, 4),
        changePoints: toStringArray(payload.changePoints, base.commonPayload.evidence, 4),
        readinessActions: toStringArray(payload.readinessActions, ninetyDayActions, 4),
        phaseRoadmap: parseDaeunPhaseRoadmap(payload.phaseRoadmap, daeunFallback.phaseRoadmap),
        longHorizonDirection: toStringArray(payload.longHorizonDirection, daeunFallback.longHorizonDirection, 3),
        preAtPostDiff: toStringArray(payload.preAtPostDiff, base.commonPayload.actionNow, 4),
        supplement: parseSupplementByService(
          serviceType,
          payload,
          base.commonPayload,
          [
            transitionSignal,
            ...toStringArray(payload.transitionSignals, [], 4),
            ...toStringArray(payload.changePoints, [], 4),
            ...ninetyDayActions,
            ...avoidanceScenario,
          ],
        ),
      } as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      normalizeOptionsForService = {
        daeunPhaseRoadmapFallback: daeunFallback.phaseRoadmap,
        daeunLongHorizonFallback: daeunFallback.longHorizonDirection,
      };
      break;
    }
    case "saju-career-timing": {
      const careerWindow =
        typeof payload.careerWindow === "string" && payload.careerWindow.length > 0
          ? payload.careerWindow
          : base.summary;
      const decisionTree = toStringArray(payload.decisionTree, base.commonPayload.coreInsights, 4);
      const executionChecklist = toStringArray(payload.executionChecklist, base.commonPayload.actionNow, 4);
      const currentYearCandidate = Number(req?.sajuData?.profileMeta?.currentYear ?? NaN);
      const currentYear = Number.isFinite(currentYearCandidate)
        ? currentYearCandidate
        : formatDateInTimeZone(new Date(), req?.sajuData?.profileMeta?.timezone).year;
      const careerFallback = buildCareerStageFlowFallback(
        careerWindow,
        decisionTree,
        executionChecklist,
        base.commonPayload,
        currentYear,
      );
      const stageFlow = parseCareerStageFlow(payload.stageFlow, careerFallback.stageFlow);
      const fallbackBlocks: SajuAnalysisBlock[] = stageFlow.map((stage) => ({
        windowLabel: stage.label,
        timeRange: stage.timeRange,
        coreFlow: stage.coreFlow,
        evidence: stage.evidence,
        opportunities: [...stage.opportunities],
        risks: [...stage.risks],
        actionStrategy: [...stage.actionStrategy],
      }));
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        careerWindow,
        careerArcSummary: toStringValue(payload.careerArcSummary, careerFallback.careerArcSummary),
        stageFlow,
        transitionSignal: toStringValue(payload.transitionSignal, careerFallback.transitionSignal),
        currentYearFocus: toStringValue(payload.currentYearFocus, careerFallback.currentYearFocus),
        decisionTree,
        executionChecklist,
        workModeFit: toStringValue(payload.workModeFit, careerWindow),
        decideNow: toStringArray(payload.decideNow, executionChecklist, 4),
        deferNow: toStringArray(payload.deferNow, base.commonPayload.evidence, 4),
        gainVsLossPatterns: toStringArray(payload.gainVsLossPatterns, decisionTree, 4),
        decisionCriteria: toStringArray(payload.decisionCriteria, base.commonPayload.actionNow, 4),
        supplement: parseSupplementByService(
          serviceType,
          payload,
          base.commonPayload,
          [
            careerWindow,
            ...stageFlow.map((stage) => stage.coreFlow),
            ...stageFlow.map((stage) => stage.transitionSignal),
            toStringValue(payload.careerArcSummary, careerFallback.careerArcSummary),
            toStringValue(payload.currentYearFocus, careerFallback.currentYearFocus),
            ...decisionTree,
            ...executionChecklist,
            ...toStringArray(payload.decideNow, [], 4),
            ...toStringArray(payload.deferNow, [], 4),
          ],
        ),
      } as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      break;
    }
    case "saju-wealth-flow": {
      const cashflowMap =
        typeof payload.cashflowMap === "string" && payload.cashflowMap.length > 0
          ? payload.cashflowMap
          : base.summary;
      const riskZones = toStringArray(payload.riskZones, base.commonPayload.evidence, 4);
      const assetRules = toStringArray(payload.assetRules, base.commonPayload.actionNow, 4);
      const anchorContext = buildLifetimeAnchorContext(req);
      const deterministicWealthTrend = buildDeterministicWealthTrend({
        oheng: req?.sajuData?.oheng,
        yongsin: req?.sajuData?.yongsin,
        profileMeta: req?.sajuData?.profileMeta,
      });
      const wealthLifecycleFallback = buildWealthLifecycleFallbackArtifacts(
        anchorContext,
        cashflowMap,
        base.commonPayload,
        riskZones,
        assetRules,
        deterministicWealthTrend.pointEvidence,
      );
      const wealthLifecycleStages = parseWealthLifecycleStages(
        payload.wealthLifecycleStages,
        wealthLifecycleFallback.wealthLifecycleStages,
      );
      const fallbackBlocks: SajuAnalysisBlock[] = wealthLifecycleStages.map((stage, index) => {
        const fallbackEvidence =
          wealthLifecycleFallback.analysisBlocks[index]?.evidence ??
          `${getWealthLifecycleLabel(stage.phaseType)} 구간의 근거를 점검하세요.`;
        return toWealthLifecycleAnalysisBlock(stage, fallbackEvidence);
      });
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        cashflowMap,
        riskZones,
        assetRules,
        wealthLifecycleStages,
        assetTrendSeries: deterministicWealthTrend.series,
        assetTrendEvidence: deterministicWealthTrend.pointEvidence,
        incomeStructure: toStringArray(payload.incomeStructure, base.commonPayload.coreInsights, 4),
        spendingPatterns: toStringArray(payload.spendingPatterns, base.commonPayload.evidence, 4),
        accumulateVsExpand: toStringArray(payload.accumulateVsExpand, assetRules, 4),
        financialNoGo: toStringArray(payload.financialNoGo, riskZones, 4),
        supplement: parseSupplementByService(
          serviceType,
          payload,
          base.commonPayload,
          [
            cashflowMap,
            ...toStringArray(payload.incomeStructure, [], 4),
            ...toStringArray(payload.spendingPatterns, [], 4),
            ...wealthLifecycleStages.map((stage) => stage.coreObjective),
            ...wealthLifecycleStages.flatMap((stage) => stage.operatingRules),
            ...assetRules,
            ...riskZones,
          ],
        ),
      } as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      normalizeOptionsForService = {
        currentYear: anchorContext.currentYear,
      };
      break;
    }
    case "saju-helper-network": {
      const helperMap = typeof payload.helperMap === "string" && payload.helperMap.length > 0 ? payload.helperMap : base.summary;
      const conflictPatterns = toStringArray(payload.conflictPatterns, base.commonPayload.evidence, 4);
      const networkGuide = toStringArray(payload.networkGuide, base.commonPayload.actionNow, 4);
      const anchorContext = buildLifetimeAnchorContext(req);
      const helperFallback = buildHelperNetworkFallbackArtifacts(
        anchorContext,
        helperMap,
        base.commonPayload,
        conflictPatterns,
        networkGuide,
      );
      const fallbackBlocks = helperFallback.analysisBlocks;
      const phaseRoadmap = parseHelperPhaseRoadmap(payload.phaseRoadmap, helperFallback.phaseRoadmap);
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        helperMap,
        conflictPatterns,
        networkGuide,
        helperProfiles: toStringArray(payload.helperProfiles, base.commonPayload.coreInsights, 4),
        relationExpansionVsEntanglement: toStringArray(payload.relationExpansionVsEntanglement, networkGuide, 4),
        conflictLoops: toStringArray(payload.conflictLoops, conflictPatterns, 4),
        helperEntryWindows: toStringArray(payload.helperEntryWindows, base.commonPayload.evidence, 4),
        relationLayers: toStringArray(payload.relationLayers, networkGuide, 4),
        phaseRoadmap,
        longHorizonDirection: toStringArray(payload.longHorizonDirection, helperFallback.longHorizonDirection, 3),
        supplement: parseSupplementByService(
          serviceType,
          payload,
          base.commonPayload,
          [
            helperMap,
            ...toStringArray(payload.helperProfiles, [], 4),
            ...networkGuide,
            ...conflictPatterns,
            ...toStringArray(payload.relationLayers, [], 4),
            ...phaseRoadmap.map((phase) => phase.relationshipExpansion),
            ...phaseRoadmap.map((phase) => phase.collaborationFlow),
            ...phaseRoadmap.map((phase) => phase.mentorInfluxSignal),
            ...phaseRoadmap.map((phase) => phase.guardPattern),
          ],
        ),
      } as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      normalizeOptionsForService = {
        helperPhaseRoadmapFallback: helperFallback.phaseRoadmap,
        helperLongHorizonFallback: helperFallback.longHorizonDirection,
        helperAnalysisFallback: helperFallback.analysisBlocks,
        currentYear: anchorContext.currentYear,
      };
      break;
    }
    case "saju-energy-balance": {
      const energyCurve = typeof payload.energyCurve === "string" && payload.energyCurve.length > 0 ? payload.energyCurve : base.summary;
      const routineDesign = toStringArray(payload.routineDesign, base.commonPayload.actionNow, 4);
      const recoveryProtocol = toStringArray(payload.recoveryProtocol, base.commonPayload.evidence, 4);
      const innateProfile = toStringValue(payload.innateProfile, energyCurve);
      const operatingModel = toStringArray(payload.operatingModel, [...routineDesign, ...base.commonPayload.actionNow], 5);
      const stageShiftMap = toStringArray(
        payload.stageShiftMap,
        [
          "초기 단계: 몰입 강도를 낮춰도 유지되는 기본 루틴을 먼저 고정하세요.",
          "확장 단계: 역할 증가에 맞춰 에너지 배분 우선순위를 분리하세요.",
          "지속 단계: 회복 임계치를 먼저 관리해 장기 피로 누적을 막으세요.",
        ],
        5,
      );
      const longRangeStrategy = toStringArray(
        payload.longRangeStrategy,
        [
          "0~2년: 집중 상한과 회복 하한을 함께 설정하고 주간 점검하세요.",
          "3~5년: 역할별 에너지 배분표를 운영하고 월간 리셋 루틴을 고정하세요.",
          "6~10년: 확장 결정 전에 회복 여력부터 점검하고 분기별 기준을 갱신하세요.",
        ],
        6,
      );
      const currentYearCandidate = Number(req?.sajuData?.profileMeta?.currentYear ?? NaN);
      const currentYear = Number.isFinite(currentYearCandidate)
        ? currentYearCandidate
        : formatDateInTimeZone(new Date(), req?.sajuData?.profileMeta?.timezone).year;
      const deterministicEnergyTrend = buildDeterministicEnergyTrend({
        oheng: req?.sajuData?.oheng,
        yongsin: req?.sajuData?.yongsin,
        profileMeta: req?.sajuData?.profileMeta,
      });
      const fallbackBlocks: SajuAnalysisBlock[] = [
        {
          windowLabel: "타고난 에너지 구조",
          timeRange: "생애 전반",
          coreFlow: innateProfile,
          evidence: base.commonPayload.evidence[0] ?? energyCurve,
          opportunities: [base.commonPayload.coreInsights[0] ?? operatingModel[0] ?? energyCurve],
          risks: [recoveryProtocol[0] ?? "기본 회복 루틴이 없으면 에너지 소진이 반복될 수 있습니다."],
          actionStrategy: [operatingModel[0] ?? "생애 전반에 반복할 에너지 운영 규칙을 1문장으로 고정하세요."],
        },
        {
          windowLabel: "운영 규칙 정착",
          timeRange: "0~2년",
          coreFlow: operatingModel[0] ?? energyCurve,
          evidence: base.commonPayload.evidence[1] ?? energyCurve,
          opportunities: [stageShiftMap[0] ?? base.commonPayload.coreInsights[1] ?? energyCurve],
          risks: [recoveryProtocol[1] ?? "강도만 높이면 초기 구간에서 회복 비용이 급증할 수 있습니다."],
          actionStrategy: [longRangeStrategy[0] ?? "0~2년 운영 기준을 주간 점검표로 관리하세요."],
        },
        {
          windowLabel: "에너지 확장 재배치",
          timeRange: "3~5년",
          coreFlow: stageShiftMap[1] ?? energyCurve,
          evidence: base.commonPayload.evidence[2] ?? energyCurve,
          opportunities: [operatingModel[1] ?? base.commonPayload.coreInsights[2] ?? energyCurve],
          risks: [recoveryProtocol[2] ?? "역할이 늘어나는 시기에 에너지 배분 기준이 흔들릴 수 있습니다."],
          actionStrategy: [longRangeStrategy[1] ?? "3~5년 구간은 역할별 에너지 배분 기준을 문장으로 고정하세요."],
        },
        {
          windowLabel: "지속가능성 최적화",
          timeRange: "6~10년",
          coreFlow: stageShiftMap[2] ?? energyCurve,
          evidence: base.commonPayload.evidence[3] ?? energyCurve,
          opportunities: [operatingModel[2] ?? base.commonPayload.coreInsights[3] ?? energyCurve],
          risks: [recoveryProtocol[3] ?? "회복 임계치 관리가 느슨하면 장기 생산성이 급격히 흔들릴 수 있습니다."],
          actionStrategy: [longRangeStrategy[2] ?? "6~10년 구간은 확장 전 회복 여력을 먼저 점검하세요."],
        },
        {
          windowLabel: "단기 리듬 운영",
          timeRange: "4주/12주",
          coreFlow: energyCurve,
          evidence: recoveryProtocol[0] ?? base.commonPayload.evidence[0] ?? energyCurve,
          opportunities: [routineDesign[0] ?? base.commonPayload.coreInsights[0] ?? energyCurve],
          risks: [recoveryProtocol[1] ?? "4주/12주 리듬에서 소진 경보를 놓치면 회복 비용이 커집니다."],
          actionStrategy: [routineDesign[1] ?? "4주 실행과 12주 회복 루틴을 동시에 추적하세요."],
        },
        {
          windowLabel: `${currentYear} 적용 포인트`,
          timeRange: `${currentYear}년`,
          coreFlow: base.commonPayload.coreInsights[0] ?? energyCurve,
          evidence: base.commonPayload.evidence[0] ?? energyCurve,
          opportunities: [longRangeStrategy[0] ?? operatingModel[0] ?? energyCurve],
          risks: [recoveryProtocol[0] ?? "올해 과부하 신호를 누적하면 내년 운영 여력이 줄어들 수 있습니다."],
          actionStrategy: [base.commonPayload.actionNow[0] ?? routineDesign[0] ?? "올해 적용할 에너지 운영 기준 1개를 고정하세요."],
        },
      ];
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        energyCurve,
        innateProfile,
        operatingModel,
        stageShiftMap,
        longRangeStrategy,
        routineDesign,
        recoveryProtocol,
        energyRhythmSeries: deterministicEnergyTrend.series,
        energyRhythmEvidence: deterministicEnergyTrend.pointEvidence,
        immersionMode: toStringArray(payload.immersionMode, base.commonPayload.coreInsights, 4),
        burnoutSignals: toStringArray(payload.burnoutSignals, base.commonPayload.evidence, 4),
        overloadAlerts: toStringArray(payload.overloadAlerts, recoveryProtocol, 4),
        habitTweaks: toStringArray(payload.habitTweaks, routineDesign, 4),
        recoveryRoutines: toStringArray(payload.recoveryRoutines, recoveryProtocol, 4),
        supplement: parseSupplementByService(
          serviceType,
          payload,
          base.commonPayload,
          [
            energyCurve,
            innateProfile,
            ...operatingModel,
            ...stageShiftMap,
            ...longRangeStrategy,
            ...toStringArray(payload.immersionMode, [], 4),
            ...toStringArray(payload.burnoutSignals, [], 4),
            ...routineDesign,
            ...recoveryProtocol,
          ],
        ),
      } as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      break;
    }
    case "saju-yearly-action-calendar": {
      const quarterlyGoals = toStringArray(payload.quarterlyGoals, base.commonPayload.coreInsights, 4);
      const monthlyActions = toStringArray(payload.monthlyActions, base.commonPayload.actionNow, 12);
      const riskCalendar = toStringArray(payload.riskCalendar, base.commonPayload.evidence, 4);
      const quarterThemes = toStringArray(payload.quarterThemes, quarterlyGoals, 4);
      const monthlyPushCaution = toStringArray(payload.monthlyPushCaution, riskCalendar, 12);
      const actionCheckpoints = toStringArray(payload.actionCheckpoints, monthlyActions, 12);
      const priorityQueue = toStringArray(payload.priorityQueue, base.commonPayload.actionNow, 6);
      const lifecycleExecutionFallback = buildYearlyLifecycleExecutionFallback(
        base.commonPayload.coreInsights,
        base.commonPayload.actionNow,
      );
      const lifecycleExecutionPattern = toStringArray(payload.lifecycleExecutionPattern, lifecycleExecutionFallback, 6);
      const phaseFocusFallback = buildYearlyPhaseFocusFallback(lifecycleExecutionPattern, priorityQueue);
      const phaseFocusMap = parseYearlyPhaseFocusMap(payload.phaseFocusMap, phaseFocusFallback);
      const accumulationTransitionFallback = buildYearlyAccumulationTransitionFallback(
        quarterlyGoals,
        riskCalendar,
        actionCheckpoints,
      );
      const accumulationTransitionFlow = parseYearlyAccumulationTransitionFlow(
        payload.accumulationTransitionFlow,
        accumulationTransitionFallback,
      );
      const longPracticeStrategy = toStringArray(
        payload.longPracticeStrategy,
        [...lifecycleExecutionPattern, ...priorityQueue],
        6,
      );
      const yearToLifeBridge = toStringValue(
        payload.yearToLifeBridge,
        `현재 위치 -> 장기 목적 -> 이번 시기 행동 -> 점검 기준을 연결해 올해 실행을 생애 전환 축에 맞추세요. ${quarterlyGoals[0] ?? base.summary}`.trim(),
      );
      const tenYearFlowFallback = buildYearlyTenYearFlowFallback(base.commonPayload.coreInsights);
      const tenYearFlow = parseYearlyTenYearFlow(payload.tenYearFlow, tenYearFlowFallback);
      const keyThemesFallback = buildYearlyKeyThemesFallback(base.commonPayload.coreInsights);
      const keyThemes = parseYearlyKeyThemes(payload.keyThemes, keyThemesFallback);
      const quarterNarrativesFallback = buildYearlyQuarterNarrativesFallback(quarterlyGoals, riskCalendar);
      const quarterNarratives = parseYearlyQuarterNarratives(payload.quarterNarratives, quarterNarrativesFallback);
      const oneLineTotalReview = toStringValue(payload.oneLineTotalReview, base.summary);
      const currentLifeFlow = toStringValue(
        payload.currentLifeFlow,
        base.commonPayload.coreInsights[0] ?? `${base.summary} 현재 흐름을 먼저 정렬하세요.`,
      );
      const meaningOfThisYear = toStringValue(
        payload.meaningOfThisYear,
        `${new Date().getFullYear()}년은 장기 흐름 연결 기준을 고정하는 해입니다.`,
      );
      const longPatternInterpretation = toStringArray(
        payload.longPatternInterpretation,
        [...lifecycleExecutionPattern, ...longPracticeStrategy, ...base.commonPayload.coreInsights],
        6,
      );
      const yearEndResidue = toStringValue(
        payload.yearEndResidue,
        "올해가 끝나면 반복 가능한 기준, 결과물 기록, 관계 정리 기준이 남아야 합니다.",
      );
      const closingLine = toStringValue(
        payload.closingLine,
        "올해의 가치는 단기 속도보다 다음 10년을 버틸 기준을 남기는 데 있습니다.",
      );
      const fallbackBlocks: SajuAnalysisBlock[] = quarterlyGoals.slice(0, 4).map((goal, index) => ({
        windowLabel: `${index + 1}분기`,
        timeRange: `${index + 1}분기`,
        coreFlow: goal,
        evidence: riskCalendar[index] ?? base.commonPayload.evidence[index] ?? goal,
        opportunities: [base.commonPayload.coreInsights[index] ?? goal],
        risks: [riskCalendar[index] ?? "분기 목표 과부하를 경계하세요."],
        actionStrategy: [monthlyActions[index] ?? base.commonPayload.actionNow[index] ?? "월별 체크포인트를 확정하세요."],
      }));
      reportPayload = {
        coreQuestion: toStringValue(payload.coreQuestion, SERVICE_CORE_QUESTIONS[serviceType]),
        ...base.commonPayload,
        analysisBlocks: parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks),
        lifecycleExecutionPattern,
        phaseFocusMap,
        accumulationTransitionFlow,
        longPracticeStrategy,
        yearToLifeBridge,
        oneLineTotalReview,
        currentLifeFlow,
        meaningOfThisYear,
        tenYearFlow,
        longPatternInterpretation,
        keyThemes,
        quarterNarratives,
        yearEndResidue,
        closingLine,
        quarterlyGoals,
        monthlyActions,
        riskCalendar,
        quarterThemes,
        monthlyPushCaution,
        actionCheckpoints,
        priorityQueue,
      } as SajuReportPayloadMap[K];
      const yearlyPayloadWithGate = validateAndRepairYearlyPayload(
        reportPayload as unknown as SajuReportPayloadMap["saju-yearly-action-calendar"],
        {
          summary: base.summary,
          coreInsights: base.commonPayload.coreInsights,
          actionNow: base.commonPayload.actionNow,
          evidence: base.commonPayload.evidence,
          forbiddenKeywords: SUPPLEMENT_OWNERSHIP_RULES["saju-yearly-action-calendar"].forbiddenKeywords,
        },
      );
      yearlyPayloadWithGate.supplement = parseSupplementByService(
        serviceType,
        payload,
        base.commonPayload,
        [
          yearlyPayloadWithGate.yearToLifeBridge,
          ...yearlyPayloadWithGate.lifecycleExecutionPattern,
          ...yearlyPayloadWithGate.phaseFocusMap.map((item) => `${item.phaseLabel}: ${item.focusPoint}`),
          ...yearlyPayloadWithGate.accumulationTransitionFlow.map((item) => `${item.axis}: ${item.guidance}`),
          ...yearlyPayloadWithGate.longPracticeStrategy,
          ...yearlyPayloadWithGate.quarterThemes,
          ...yearlyPayloadWithGate.quarterlyGoals,
          ...yearlyPayloadWithGate.actionCheckpoints,
          ...yearlyPayloadWithGate.monthlyPushCaution,
        ],
      );
      reportPayload = yearlyPayloadWithGate as unknown as SajuReportPayloadMap[K];
      fallbackBlocksForService = fallbackBlocks;
      break;
    }
    default:
      throw new Error(`unsupported service type: ${serviceType}`);
  }

  return {
    serviceType,
    summary: base.summary,
    sections: base.sections,
    reportTemplateVersion: base.reportTemplateVersion,
    reportPayload: normalizeLifetimePayloadByService(
      serviceType,
      reportPayload,
      fallbackBlocksForService,
      base.summary,
      normalizeOptionsForService,
    ),
  } as SajuAnalysisResponse;
};

const compactStrings = (items: Array<string | undefined | null>): string[] =>
  uniqueItems(items.filter((item): item is string => typeof item === "string" && item.trim().length > 0));

const FOCUSED_SENTENCE_CHUNK_PATTERN = /[^.!?。！？]+[.!?。！？]?/gu;
const FOCUSED_SENTENCE_END_PATTERN = /[.!?。！？]$/u;

const toFocusedSentence = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return FOCUSED_SENTENCE_END_PATTERN.test(trimmed) ? trimmed : `${trimmed}.`;
};

const splitFocusedSentences = (value: string): string[] => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }
  const chunks = normalized.match(FOCUSED_SENTENCE_CHUNK_PATTERN) ?? [normalized];
  return uniqueItems(chunks.map((chunk) => toFocusedSentence(chunk)));
};

const ensureFocusedSentenceRange = (
  items: string[],
  fallbackCandidates: string[],
  min: number,
  max: number,
): string[] => {
  const normalized = uniqueItems(items.map((item) => toFocusedSentence(item))).slice(0, max);
  if (normalized.length >= min) {
    return normalized;
  }

  const fallback = uniqueItems(fallbackCandidates.map((item) => toFocusedSentence(item)));
  for (const candidate of fallback) {
    if (normalized.length >= min || normalized.length >= max) {
      break;
    }
    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }

  return normalized.slice(0, max);
};

const buildFocusedParagraph = (
  value: unknown,
  fallbacks: Array<string | undefined | null>,
  defaultSentences: string[],
): string => {
  const direct = toStringValue(value);
  const sentencePool = [
    ...splitFocusedSentences(direct),
    ...compactStrings(fallbacks).flatMap((item) => splitFocusedSentences(item)),
  ];
  const normalized = ensureFocusedSentenceRange(sentencePool, defaultSentences, 2, 4);
  if (normalized.length > 0) {
    return normalized.join(" ");
  }
  return toFocusedSentence(defaultSentences[0] ?? "해석 근거를 다시 확인하세요.");
};

const buildFocusedList = (
  value: unknown,
  fallbacks: Array<string | undefined | null>,
  min: number,
  max: number,
  defaultSentences: string[],
): string[] =>
  ensureFocusedSentenceRange(
    toStringArray(value, [], max + 4).flatMap((item) => splitFocusedSentences(item)),
    [
      ...compactStrings(fallbacks).flatMap((item) => splitFocusedSentences(item)),
      ...defaultSentences.flatMap((item) => splitFocusedSentences(item)),
    ],
    min,
    max,
  );

const buildFocusedOneLiner = (
  value: unknown,
  fallbacks: Array<string | undefined | null>,
  defaultSentence: string,
): string => {
  const sentencePool = [
    ...splitFocusedSentences(toStringValue(value)),
    ...compactStrings(fallbacks).flatMap((item) => splitFocusedSentences(item)),
  ];
  return sentencePool[0] ?? toFocusedSentence(defaultSentence);
};

interface StudyLegacyFocusedFields {
  studyRhythm: string;
  examWindows: string[];
  mistakeTriggers: string[];
  executionGuide: string[];
  evidenceNotes: string[];
}

interface InvestmentLegacyFocusedFields {
  entryBias: string;
  watchSignals: string[];
  riskAlerts: string[];
  capitalRules: string[];
  evidenceNotes: string[];
}

const STUDY_ACTION_PERIODS = ["1~3월", "4~6월", "7~9월", "10~12월"] as const;
const INVESTMENT_ACTION_QUARTERS = ["1분기", "2분기", "3분기", "4분기"] as const;

const buildStudyActionReport = (
  payload: Record<string, unknown>,
  commonPayload: Omit<NewYear2026OverviewPayload, "focusCards">,
  studyLegacyFields: StudyLegacyFocusedFields,
): NewYear2026StudyActionReport => {
  const rawReport = isRecord(payload.studyActionReport) ? payload.studyActionReport : {};
  const rawDiagnosis = isRecord(rawReport.coreDiagnosis) ? rawReport.coreDiagnosis : {};
  const rawImmediateActions = isRecord(rawReport.immediateActions) ? rawReport.immediateActions : {};
  const rawYearFlowSummary = isRecord(rawReport.yearFlowSummary) ? rawReport.yearFlowSummary : {};
  const rawExamTypeGuides = isRecord(rawReport.examTypeGuides) ? rawReport.examTypeGuides : {};
  const rawPerformanceStrategy = isRecord(rawReport.performanceStrategy) ? rawReport.performanceStrategy : {};
  const quarterlyRaw = Array.isArray(rawReport.quarterlyDetailed)
    ? rawReport.quarterlyDetailed.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
  const analysisBlocks = commonPayload.analysisBlocks;
  const yearTimeline = commonPayload.yearTimeline;

  const coreDiagnosis = {
    headline: toStringValue(
      rawDiagnosis.headline,
      "한눈에 보면, 올해 합격 가능성은 루틴 일관성과 실전 복기 강도에서 갈립니다.",
    ),
    summary: buildFocusedParagraph(
      rawDiagnosis.summary,
      [studyLegacyFields.studyRhythm, analysisBlocks[0]?.coreFlow, yearTimeline[0]?.quarterSummary],
      [
        "초반 추진력이 높을수록 과목 수를 늘리기보다 핵심 과목 반복 주기를 고정해야 점수 변동폭이 줄어듭니다.",
        "중반 이후에는 진도보다 오답 구조 정리와 실전 시간 관리가 결과 차이를 만듭니다.",
      ],
    ),
    confidenceNote: buildFocusedParagraph(
      rawDiagnosis.confidenceNote,
      [studyLegacyFields.evidenceNotes[0], commonPayload.evidence[0], yearTimeline[1]?.caution],
      [
        "실행 기준을 지키면 상승 흐름이 유지되지만, 일정이 무너지면 성과 편차가 빠르게 커질 수 있습니다.",
        "주간 점검 지표를 고정해 리듬 이탈을 조기에 복구하는 것이 핵심입니다.",
      ],
    ),
  };

  const keyQuestion = toStringValue(rawReport.keyQuestion, commonPayload.coreQuestion);
  const keyInsights = buildFocusedList(
    rawReport.keyInsights,
    [...commonPayload.coreInsights, ...studyLegacyFields.examWindows, ...studyLegacyFields.evidenceNotes],
    3,
    3,
    [
      "합격운은 공부량이 아니라 반복 가능한 루틴 설계에서 결정됩니다.",
      "강점 구간에서 범위를 넓히기보다 오답 구조를 정리해야 실전 점수로 연결됩니다.",
      "하반기에는 신규 확장보다 취약 파트 정리와 시간 배분 교정이 성과를 지킵니다.",
    ],
  );

  const immediateActions = {
    startNow: buildFocusedList(
      rawImmediateActions.startNow,
      [...studyLegacyFields.executionGuide, ...commonPayload.actionNow, ...yearTimeline.map((node) => node.action)],
      2,
      4,
      [
        "핵심 과목 1개를 매일 같은 시간대에 배치하고, 시작 전 5분 복습 체크리스트를 고정하세요.",
        "주 2회 오답 분류 시간을 캘린더에 먼저 고정해 진도와 복기를 분리 운영하세요.",
      ],
    ),
    stopNow: buildFocusedList(
      rawImmediateActions.stopNow,
      [
        ...studyLegacyFields.mistakeTriggers,
        ...analysisBlocks.flatMap((block) => block.risks),
        ...yearTimeline.map((node) => node.caution),
      ],
      2,
      4,
      [
        "모의고사 직후 계획 없이 과목 수를 늘리는 행동을 중단하고, 오답 원인 분류부터 완료하세요.",
        "피로 누적 구간에서 공부 시간만 늘리는 방식을 멈추고 회복 슬롯을 먼저 확보하세요.",
      ],
    ),
    prepNow: buildFocusedList(
      rawImmediateActions.prepNow,
      [...studyLegacyFields.examWindows, ...commonPayload.evidence, ...studyLegacyFields.evidenceNotes],
      2,
      4,
      [
        "지원·응시 일정, 과목별 진도율, 오답 유형 비중을 한 장의 추적표로 묶어 매주 업데이트하세요.",
        "시험 8주 전부터 실전 시간 배분표를 만들어 주 1회 리허설을 실행하세요.",
      ],
    ),
  };

  const yearFlowSummary = {
    preparationPhase: buildFocusedParagraph(
      rawYearFlowSummary.preparationPhase,
      [
        yearTimeline[0]?.quarterSummary,
        yearTimeline[0]?.action,
        analysisBlocks[0]?.coreFlow,
        studyLegacyFields.studyRhythm,
      ],
      [
        "준비기에는 과목별 목표를 줄이고 기본 개념과 오답 분류 체계를 먼저 고정해야 이후 가속이 가능합니다.",
        "이 시기 기준이 흔들리면 중반 이후 진도 확장이 오히려 점수 하락으로 이어질 수 있습니다.",
      ],
    ),
    accelerationPhase: buildFocusedParagraph(
      rawYearFlowSummary.accelerationPhase,
      [yearTimeline[1]?.quarterSummary, yearTimeline[1]?.action, analysisBlocks[1]?.coreFlow, studyLegacyFields.examWindows[0]],
      [
        "가속기에는 진도 확장과 실전 적용을 함께 운영하되, 주간 복기 시간을 먼저 고정해 누수를 막아야 합니다.",
        "성과가 나와도 범위를 무작정 넓히지 말고 점수 기여도가 높은 파트 중심으로 확장하세요.",
      ],
    ),
    showdownPhase: buildFocusedParagraph(
      rawYearFlowSummary.showdownPhase,
      [yearTimeline[2]?.quarterSummary, yearTimeline[2]?.action, analysisBlocks[2]?.coreFlow, studyLegacyFields.executionGuide[0]],
      [
        "승부기에는 실전 모드 전환이 핵심이므로 시간 배분, 문제 선택, 멘탈 복구 루틴을 동시에 점검해야 합니다.",
        "취약 파트 보완은 신규 학습보다 오답 재현 방지 전략으로 좁혀 운영하는 편이 유리합니다.",
      ],
    ),
    wrapUpPhase: buildFocusedParagraph(
      rawYearFlowSummary.wrapUpPhase,
      [yearTimeline[3]?.quarterSummary, yearTimeline[3]?.action, analysisBlocks[3]?.coreFlow, studyLegacyFields.evidenceNotes[0]],
      [
        "정리기에는 범위를 줄이고 정답률이 흔들리는 파트만 집중 보완해 실전 안정성을 높여야 합니다.",
        "마감 시기에는 새로운 자료 탐색을 줄이고 누적 데이터 기반으로 최종 루틴을 고정하세요.",
      ],
    ),
  };

  const quarterlyDetailed = STUDY_ACTION_PERIODS.map((period, index) => {
    const rawQuarter = quarterlyRaw[index] ?? {};
    const block = analysisBlocks[index] ?? analysisBlocks[analysisBlocks.length - 1] ?? null;
    const timelineNode = yearTimeline[index] ?? yearTimeline[yearTimeline.length - 1] ?? null;

    return {
      period,
      strengths: buildFocusedList(
        rawQuarter.strengths,
        [
          ...(block?.opportunities ?? []),
          timelineNode?.opportunity,
          studyLegacyFields.examWindows[index],
          keyInsights[index],
        ],
        2,
        3,
        [
          `${period}에는 핵심 과목 반복 주기를 고정하면 집중 지속력이 높아집니다.`,
          `${period}에는 오답 복기 루틴을 유지할수록 실전 점수 안정성이 커집니다.`,
        ],
      ),
      risks: buildFocusedList(
        rawQuarter.risks,
        [
          ...(block?.risks ?? []),
          timelineNode?.caution,
          studyLegacyFields.mistakeTriggers[index],
          commonPayload.evidence[index],
        ],
        2,
        3,
        [
          `${period}에 범위를 과도하게 확장하면 복습 회전이 무너져 누적 효율이 떨어질 수 있습니다.`,
          `${period}에 실전 점검 없이 진도만 밀면 시험 직전 불안정성이 커질 수 있습니다.`,
        ],
      ),
      recommendedStrategies: buildFocusedList(
        rawQuarter.recommendedStrategies,
        [
          ...(block?.actionStrategy ?? []),
          timelineNode?.action,
          studyLegacyFields.executionGuide[index],
          immediateActions.startNow[index],
        ],
        2,
        4,
        [
          `${period}에는 주간 목표를 2개로 제한하고 완료 기준을 숫자로 기록해 실행 오차를 줄이세요.`,
          `${period}에는 모의고사 결과를 유형별로 분리해 다음 주 계획에 즉시 반영하세요.`,
        ],
      ),
      checkQuestionOrTip: buildFocusedParagraph(
        rawQuarter.checkQuestionOrTip,
        [keyQuestion, timelineNode?.action, commonPayload.actionNow[index]],
        [
          `${period} 점검 질문: 이번 주 학습 시간이 아니라 정답률 개선 근거를 기록했는가?`,
          `${period} 실전 팁: 하루 종료 전 10분은 오답 원인 1개를 문장으로 남겨 다음 학습에 바로 연결하세요.`,
        ],
      ),
    };
  });

  const examTypeGuides = {
    writtenExam: buildFocusedList(
      rawExamTypeGuides.writtenExam,
      [...studyLegacyFields.executionGuide, ...studyLegacyFields.examWindows, ...commonPayload.actionNow],
      2,
      4,
      [
        "필기시험형은 개념-문제-오답 복기를 1세트로 묶어 같은 순서로 반복해야 점수 상승이 안정됩니다.",
        "시간 제한 훈련을 주 1회 고정해 실전 속도와 정확도 균형을 같이 점검하세요.",
      ],
    ),
    interviewOrOral: buildFocusedList(
      rawExamTypeGuides.interviewOrOral,
      [...commonPayload.coreInsights, ...studyLegacyFields.evidenceNotes, ...commonPayload.actionNow],
      2,
      4,
      [
        "면접/구술형은 예상 질문 답변을 1분·3분 버전으로 분리해 말하기 루틴을 먼저 고정하세요.",
        "실전 직전에는 내용 추가보다 전달 구조와 속도 조절을 반복 점검하는 편이 합격 확률을 높입니다.",
      ],
    ),
    longTermLearning: buildFocusedList(
      rawExamTypeGuides.longTermLearning,
      [studyLegacyFields.studyRhythm, ...studyLegacyFields.executionGuide, ...commonPayload.coreInsights],
      2,
      4,
      [
        "장기 학습형은 월간 목표보다 주간 반복 지표를 고정해 꾸준한 누적 구조를 먼저 만드세요.",
        "슬럼프 구간에는 진도 확장 대신 기본 루틴 복구를 우선해 학습 리듬 이탈을 줄이세요.",
      ],
    ),
  };

  const failurePatterns = buildFocusedList(
    rawReport.failurePatterns,
    [...studyLegacyFields.mistakeTriggers, ...analysisBlocks.flatMap((block) => block.risks), ...commonPayload.evidence],
    2,
    5,
    [
      "점수 반등 직후 계획 없이 과목을 늘리면 복습 시간이 깨져 성과가 급격히 흔들리는 패턴이 반복됩니다.",
      "오답 원인 기록 없이 문제 수만 늘리면 실전에서 같은 실수가 재발하는 패턴이 나타납니다.",
    ],
  );

  const performanceStrategy = {
    studyMethod: buildFocusedList(
      rawPerformanceStrategy.studyMethod,
      [...studyLegacyFields.executionGuide, ...studyLegacyFields.examWindows, ...commonPayload.actionNow],
      2,
      4,
      [
        "공부 방식은 과목별 목표를 줄이고 반복 주기를 고정해 누적 효율을 높이는 방향으로 설계하세요.",
        "학습 후 바로 복기 기록을 남겨 다음 학습 시작 시간을 단축하는 구조를 만드세요.",
      ],
    ),
    lifeManagement: buildFocusedList(
      rawPerformanceStrategy.lifeManagement,
      [...commonPayload.actionNow, ...yearTimeline.map((node) => node.action), ...commonPayload.evidence],
      2,
      4,
      [
        "생활 관리는 수면·식사·이동 시간을 고정해 공부 시작 지연을 줄이는 데 초점을 두세요.",
        "주간 일정에는 최소 반나절 회복 블록을 넣어 과부하 누적을 사전에 차단하세요.",
      ],
    ),
    mentalManagement: buildFocusedList(
      rawPerformanceStrategy.mentalManagement,
      [...studyLegacyFields.evidenceNotes, ...commonPayload.evidence, ...studyLegacyFields.mistakeTriggers],
      2,
      4,
      [
        "멘탈 관리는 감정 해석보다 데이터 점검 중심으로 전환해 불안 과잉 반응을 줄이세요.",
        "실전 직전에는 결과 예측보다 수행 루틴 체크리스트를 반복해 긴장 편차를 낮추세요.",
      ],
    ),
  };

  const plainEvidence = buildFocusedList(
    rawReport.plainEvidence,
    [...studyLegacyFields.evidenceNotes, ...commonPayload.evidence, ...commonPayload.coreInsights],
    2,
    4,
    [
      "쉽게 말해, 올해는 많이 하는 사람보다 같은 방식으로 끝까지 반복한 사람이 유리한 흐름입니다.",
      "시험 시기별로 강점과 리스크가 분명해, 시점마다 전략을 바꿔야 성과로 이어집니다.",
    ],
  );

  const finalSummary = buildFocusedList(
    rawReport.finalSummary,
    [...keyInsights, ...immediateActions.startNow, ...performanceStrategy.studyMethod, ...commonPayload.actionNow],
    2,
    4,
    [
      "2026 합격 가이드 핵심은 루틴 고정, 오답 구조화, 실전 시간 관리의 3축을 동시에 지키는 것입니다.",
      "지금 해야 할 행동을 일정에 고정하고 분기별 점검 질문으로 보정하면 합격운을 실제 결과로 연결할 수 있습니다.",
    ],
  );

  return {
    coreDiagnosis,
    keyQuestion,
    keyInsights,
    immediateActions,
    yearFlowSummary,
    quarterlyDetailed,
    examTypeGuides,
    failurePatterns,
    performanceStrategy,
    plainEvidence,
    finalSummary,
  } satisfies NewYear2026StudyActionReport;
};

const buildInvestmentActionReport = (
  payload: Record<string, unknown>,
  commonPayload: Omit<NewYear2026OverviewPayload, "focusCards">,
  investmentLegacyFields: InvestmentLegacyFocusedFields,
): NewYear2026InvestmentActionReport => {
  const rawReport = isRecord(payload.investmentActionReport) ? payload.investmentActionReport : {};
  const rawDiagnosis = isRecord(rawReport.coreDiagnosis) ? rawReport.coreDiagnosis : {};
  const rawAssetClassGuides = isRecord(rawReport.assetClassGuides) ? rawReport.assetClassGuides : {};
  const rawSignalBoard = isRecord(rawReport.signalBoard) ? rawReport.signalBoard : {};
  const quarterlyRaw = Array.isArray(rawReport.quarterlyFlow)
    ? rawReport.quarterlyFlow.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
  const analysisBlocks = commonPayload.analysisBlocks;
  const yearTimeline = commonPayload.yearTimeline;
  const signalReason = commonPayload.quickSummary.signalTrio.reason;

  const opportunityFallbacks = [
    ...yearTimeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
    ...commonPayload.coreInsights,
  ];
  const cautionFallbacks = [
    ...yearTimeline.map((node) => node.caution),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
    ...investmentLegacyFields.riskAlerts,
    ...commonPayload.evidence,
  ];
  const actionFallbacks = [
    ...yearTimeline.map((node) => node.action),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
    ...investmentLegacyFields.capitalRules,
    ...commonPayload.actionNow,
  ];

  const coreDiagnosis = {
    headline: toStringValue(
      rawDiagnosis.headline,
      "한 줄 핵심 진단: 올해 투자 판단은 진입 속도보다 손실 통제 기준을 먼저 고정하는 방식이 유리합니다.",
    ),
    summary: buildFocusedParagraph(
      rawDiagnosis.summary,
      [investmentLegacyFields.entryBias, analysisBlocks[0]?.coreFlow, yearTimeline[0]?.quarterSummary, signalReason],
      [
        "올해는 수익 기대를 키우기보다 손실 구간을 먼저 통제할 때 성과 편차를 줄일 수 있습니다.",
        "시장 신호가 빠르게 바뀌는 구간이 반복되어도 진입·관망·회수 기준을 고정하면 오판 비용을 줄일 수 있습니다.",
      ],
    ),
  };

  const keyQuestion = toStringValue(
    rawReport.keyQuestion,
    commonPayload.coreQuestion || "지금은 진입을 늘릴 시기인지, 기준을 다시 고정할 시기인지 어떻게 판단해야 하는가?",
  );
  const keyInsights = buildFocusedList(
    rawReport.keyInsights,
    [...commonPayload.coreInsights, ...investmentLegacyFields.watchSignals, ...investmentLegacyFields.evidenceNotes],
    3,
    3,
    [
      "진입 신호가 보여도 손실 기준이 비어 있으면 성과 변동폭이 커질 수 있습니다.",
      "분기별 성과 차이는 종목 선정보다 비중 규칙과 회수 기준 일관성에서 크게 나타납니다.",
      "하반기로 갈수록 공격적 확대보다 현금·비중 관리가 누적 성과를 지키는 축이 됩니다.",
    ],
  );
  const immediateActions = buildFocusedList(
    rawReport.immediateActions,
    [...investmentLegacyFields.capitalRules, ...actionFallbacks, ...commonPayload.actionNow],
    2,
    4,
    [
      "매수 전 체크리스트를 먼저 작성하고 한 항목이라도 비면 진입을 미루는 규칙을 고정하세요.",
      "단일 자산 비중 상한과 손절·회수 조건을 같은 문서에 기록해 예외 없이 적용하세요.",
    ],
  );
  const absoluteCautions = buildFocusedList(
    rawReport.absoluteCautions,
    [...investmentLegacyFields.riskAlerts, ...cautionFallbacks, ...commonPayload.evidence],
    2,
    4,
    [
      "손절 기준 없이 평단만 낮추는 행동은 손실 구조를 악화시키기 쉬우므로 절대 반복하지 마세요.",
      "손실 만회를 위해 레버리지 비중을 계획 이상으로 늘리는 행동은 회복 탄력을 크게 훼손할 수 있습니다.",
    ],
  );

  const quarterlyFlow: NewYear2026InvestmentQuarterlyFlow[] = INVESTMENT_ACTION_QUARTERS.map((quarter, index) => {
    const rawQuarter = quarterlyRaw[index] ?? {};
    const timelineNode = yearTimeline[index] ?? yearTimeline[yearTimeline.length - 1];
    const block = analysisBlocks[index] ?? analysisBlocks[analysisBlocks.length - 1];

    return {
      quarter,
      summary: buildFocusedParagraph(
        rawQuarter.summary,
        [timelineNode?.quarterSummary, block?.coreFlow, investmentLegacyFields.entryBias],
        [
          `${quarter}에는 시장 반응보다 기준 유지력을 먼저 점검해야 투자 실수를 줄일 수 있습니다.`,
          `${quarter}에는 신호 강도보다 진입·관망 규칙 준수율이 결과 안정성을 좌우합니다.`,
        ],
      ),
      actionFocus: buildFocusedList(
        rawQuarter.actionFocus,
        [timelineNode?.action, ...(block?.actionStrategy ?? []), ...immediateActions, ...investmentLegacyFields.capitalRules],
        2,
        3,
        [
          `${quarter} 행동 포인트: 진입 전 손절·회수 조건을 먼저 기록하세요.`,
          `${quarter} 행동 포인트: 비중 상한을 지키며 분할 실행 여부를 점검하세요.`,
        ],
      ),
      riskFocus: buildFocusedList(
        rawQuarter.riskFocus,
        [timelineNode?.caution, ...(block?.risks ?? []), ...absoluteCautions, ...investmentLegacyFields.riskAlerts],
        2,
        3,
        [
          `${quarter} 리스크 포인트: 기준 없이 추격 진입하면 손실 구간이 길어질 수 있습니다.`,
          `${quarter} 리스크 포인트: 변동성 확대 구간에서 레버리지 과다 비중은 회복 시간을 키울 수 있습니다.`,
        ],
      ),
    } satisfies NewYear2026InvestmentQuarterlyFlow;
  });

  const assetClassGuides: NewYear2026InvestmentAssetClassGuides = {
    stocksEtf: buildFocusedList(
      rawAssetClassGuides.stocksEtf,
      [...investmentLegacyFields.capitalRules, ...opportunityFallbacks, ...commonPayload.actionNow],
      2,
      4,
      [
        "주식·ETF는 단일 종목 집중보다 분할 진입과 회수 기준 고정이 성과 편차를 줄이는 데 유리합니다.",
        "거래량 급증 구간에서는 진입 속도보다 손실 기준 충족 여부를 먼저 확인하세요.",
      ],
    ),
    realEstate: buildFocusedList(
      rawAssetClassGuides.realEstate,
      [...investmentLegacyFields.capitalRules, ...cautionFallbacks, ...commonPayload.evidence],
      2,
      4,
      [
        "부동산은 매수 타이밍보다 보유 기간·현금 여력·대출 상환 계획을 먼저 점검해야 안정성이 높아집니다.",
        "성급한 갈아타기보다 유지·매도 조건을 사전에 문장으로 고정해 판단 오류를 줄이세요.",
      ],
    ),
    cashSavings: buildFocusedList(
      rawAssetClassGuides.cashSavings,
      [...investmentLegacyFields.watchSignals, ...cautionFallbacks, ...commonPayload.actionNow],
      2,
      4,
      [
        "현금·예금은 관망 구간에서 기회 대기 자금 역할을 하므로 최소 비중을 먼저 고정하세요.",
        "진입 신호가 약한 분기에는 수익 기대보다 유동성 확보를 우선하는 편이 유리합니다.",
      ],
    ),
    cryptoHighVolatility: buildFocusedList(
      rawAssetClassGuides.cryptoHighVolatility,
      [...investmentLegacyFields.riskAlerts, ...cautionFallbacks, ...commonPayload.evidence],
      2,
      4,
      [
        "코인·고변동 자산은 실험 비중 한도를 먼저 정하고 손절 기준을 지키는 운영이 필수입니다.",
        "단기 급등 구간 추격보다 변동성 진정 확인 후 분할 접근하는 방식이 손실 통제에 유리합니다.",
      ],
    ),
  };

  const signalBoard: NewYear2026InvestmentSignalBoard = {
    watchSignals: buildFocusedList(
      rawSignalBoard.watchSignals,
      [...investmentLegacyFields.watchSignals, ...cautionFallbacks, ...commonPayload.evidence],
      2,
      4,
      [
        "방향성이 불명확하고 변동성만 커질 때는 관망을 유지하며 기준 위반 여부를 먼저 점검하세요.",
        "손실 기준이 정리되지 않은 상태에서 진입 충동이 커지면 관망 신호로 분류하세요.",
      ],
    ),
    entrySignals: buildFocusedList(
      rawSignalBoard.entrySignals,
      [...opportunityFallbacks, ...actionFallbacks, ...commonPayload.actionNow],
      2,
      4,
      [
        "진입 전에 비중·손절·회수 기준이 동시에 충족될 때만 제한적으로 진입하세요.",
        "시장 신호가 유리해도 계획된 비중 상한을 지킬 수 있을 때만 진입 신호로 해석하세요.",
      ],
    ),
  };

  const riskAlerts = buildFocusedList(
    rawReport.riskAlerts,
    [...investmentLegacyFields.riskAlerts, ...cautionFallbacks, ...commonPayload.evidence],
    2,
    4,
    [
      "레버리지 비중이 계획을 넘는 순간 계좌 복원력이 급격히 떨어질 수 있으므로 즉시 조정하세요.",
      "손실 발생 직후 규칙을 바꾸면 다음 분기까지 변동 리스크가 확대될 수 있습니다.",
    ],
  );
  const practicalChecklist = buildFocusedList(
    rawReport.practicalChecklist,
    [
      ...investmentLegacyFields.capitalRules,
      ...commonPayload.actionNow,
      ...commonPayload.actionPlan90.day30,
      ...commonPayload.actionPlan90.day60,
      ...commonPayload.actionPlan90.day90,
    ],
    4,
    6,
    [
      "진입 이유를 한 줄로 기록했는지 확인하세요.",
      "손절 기준과 회수 기준을 함께 기록했는지 확인하세요.",
      "단일 자산 비중 상한을 초과하지 않는지 확인하세요.",
      "관망 기준을 위반한 진입이 아닌지 확인하세요.",
    ],
  );
  const plainEvidence = buildFocusedList(
    rawReport.plainEvidence,
    [...investmentLegacyFields.evidenceNotes, ...commonPayload.evidence, signalReason],
    2,
    4,
    [
      "쉽게 말해, 올해는 빨리 맞히는 전략보다 크게 잃지 않는 운영이 누적 성과를 만듭니다.",
      "진입 자체보다 기준을 끝까지 지키는 사람이 결과 변동폭을 줄일 가능성이 큽니다.",
    ],
  );
  const flowTo2027 = buildFocusedParagraph(
    rawReport.flowTo2027,
    [yearTimeline[3]?.quarterSummary, signalReason, ...plainEvidence],
    [
      "2026년에 고정한 비중·회수·손실 기준이 2027년의 확장 여력과 리스크 대응 속도를 결정할 가능성이 큽니다.",
      "연말까지 기준 위반 빈도를 줄여 두면 다음 해에는 기회 대응 범위를 더 안정적으로 넓힐 수 있습니다.",
    ],
  );
  const finalConclusion = buildFocusedList(
    rawReport.finalConclusion,
    [...keyInsights, ...immediateActions, ...practicalChecklist],
    2,
    3,
    [
      "올해 투자/자산운의 핵심은 종목 선택보다 규칙 유지력입니다.",
      "진입 속도보다 손실 통제 체계를 먼저 고정하면 결과 안정성을 높일 수 있습니다.",
    ],
  );

  return {
    coreDiagnosis,
    keyQuestion,
    keyInsights,
    immediateActions,
    absoluteCautions,
    quarterlyFlow,
    assetClassGuides,
    signalBoard,
    riskAlerts,
    practicalChecklist,
    plainEvidence,
    flowTo2027,
    finalConclusion,
  } satisfies NewYear2026InvestmentActionReport;
};

const LOVE_DECISION_CONDITION_PATTERN = /(경우|이면|라면|때|if|when)/iu;
const LOVE_DECISION_CHECK_PATTERN = /(확인|점검|기준|지표|체크|check|verify|measure|record)/iu;
const LOVE_DECISION_ACTION_PATTERN = /(하세요|하십시오|해보세요|정하세요|고정하세요|기록하세요|분리하세요|중단하세요|보류하세요|진행하세요|실행하세요|apply|set|record|stop|hold|proceed|do)/iu;

const toLoveDecisionSentence = (value: string, fallbackCondition: string, fallbackCheck: string): string => {
  const base = toFocusedSentence(value);
  if (!base) {
    return "";
  }

  let normalized = base;
  if (!LOVE_DECISION_CONDITION_PATTERN.test(normalized)) {
    normalized = `조건이 불명확한 경우 ${normalized}`;
  }
  if (!LOVE_DECISION_ACTION_PATTERN.test(normalized)) {
    normalized = `${normalized.replace(/[.!?。！？]+$/u, "")} 실행하세요.`;
  }
  if (!LOVE_DECISION_CHECK_PATTERN.test(normalized)) {
    normalized = `${normalized.replace(/[.!?。！？]+$/u, "")} 확인 기준은 ${fallbackCheck}.`;
  }
  if (!normalized.includes(fallbackCondition)) {
    normalized = normalized.replace(/^조건이 불명확한 경우/u, `조건이 불명확한 경우(${fallbackCondition})`);
  }
  return toFocusedSentence(normalized);
};

const normalizeLoveDecisionList = (
  items: string[],
  fallbackCondition: string,
  fallbackCheck: string,
  min: number,
  max: number,
): string[] =>
  ensureFocusedSentenceRange(
    items.map((item) => toLoveDecisionSentence(item, fallbackCondition, fallbackCheck)),
    [toLoveDecisionSentence(`${fallbackCondition}이면 우선순위를 분리해 실행하세요.`, fallbackCondition, fallbackCheck)],
    min,
    max,
  );

const LOVE_CONSUMER_FAQ_TEMPLATES: Array<{
  question: string;
  defaultAnswer: string;
  matchTokens: string[];
}> = [
  {
    question: "지금 고백하거나 관계를 정의해도 되나요?",
    defaultAnswer:
      "관계 리듬이 2주 이상 안정되고 후속 약속 이행률이 70% 이상이면 고백 또는 관계 정의를 진행하고, 2주 뒤 대화 온도 재확인으로 판단을 확정하세요.",
    matchTokens: ["고백", "관계", "정의"],
  },
  {
    question: "상견례나 부모님 소개는 언제가 적절한가요?",
    defaultAnswer:
      "갈등 상황에서 회복 대화가 최소 2회 이상 성공한 경우 소개 일정을 잡고, 소개 전 핵심 합의 3개(거주·재정·역할) 체크로 진행 여부를 확정하세요.",
    matchTokens: ["상견례", "부모", "소개"],
  },
  {
    question: "결혼 이야기는 어느 시점에 꺼내야 하나요?",
    defaultAnswer:
      "미래 계획 대화가 자연스럽게 이어지고 책임 분담 합의가 가능한 경우 결혼 의제를 꺼내고, 1개월 내 합의 이행 여부로 다음 단계를 판단하세요.",
    matchTokens: ["결혼", "이야기", "시점"],
  },
  {
    question: "상대 연락이 줄어들면 바로 불안해해도 되나요?",
    defaultAnswer:
      "연락량 감소가 2주 이상 지속되면 감정 추측 대신 일정·우선순위를 확인하는 대화를 먼저 진행하고, 약속 이행 변화로 관계 온도를 점검하세요.",
    matchTokens: ["연락", "줄어", "불안"],
  },
  {
    question: "상대가 결혼을 계속 미루면 어떻게 해야 하나요?",
    defaultAnswer:
      "결혼 논의가 2회 이상 미뤄지면 일정 기반 질문으로 결론 시점을 명확히 요청하고, 기한 내 합의 부재 시 보류 또는 중단 기준을 실행하세요.",
    matchTokens: ["미루", "결혼", "보류"],
  },
  {
    question: "조건은 좋지만 마음이 불안한 관계는 유지해도 되나요?",
    defaultAnswer:
      "조건과 감정이 충돌하면 생활 리듬·갈등 회복력·신뢰 이행률을 우선 지표로 재평가하고, 3가지 중 2가지 미달 시 속도를 늦추세요.",
    matchTokens: ["조건", "불안", "유지"],
  },
  {
    question: "장거리·바쁜 일정에서도 결혼까지 갈 수 있나요?",
    defaultAnswer:
      "장거리나 바쁜 일정이라도 주간 대화 루틴과 월간 오프라인 약속이 유지되면 진행 가능성이 높아지고, 루틴 붕괴 시 즉시 복구 계획을 합의하세요.",
    matchTokens: ["장거리", "바쁜", "일정"],
  },
  {
    question: "관계를 계속할지 정리할지 결정이 안 됩니다.",
    defaultAnswer:
      "핵심 갈등이 반복되고 복구 시도가 무효화되는 경우 중단 기준을 먼저 실행하고, 개선 신호가 확인되면 기간을 정한 재평가로 전환하세요.",
    matchTokens: ["정리", "결정", "계속"],
  },
];

const parseNewYearConsumerFaq = (value: unknown): NewYearConsumerFaqItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => isRecord(item))
    .map((item) => ({
      question: toStringValue(item.question),
      answer: toStringValue(item.answer),
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
};

const buildLoveConsumerFaq = (
  value: unknown,
  fallbackAnswers: Array<string | undefined | null>,
): NewYearConsumerFaqItem[] => {
  const parsed = parseNewYearConsumerFaq(value);
  const fallbackPool = [
    ...compactStrings(fallbackAnswers).flatMap((item) => splitFocusedSentences(item)),
    ...LOVE_CONSUMER_FAQ_TEMPLATES.flatMap((item) => splitFocusedSentences(item.defaultAnswer)),
  ];

  return LOVE_CONSUMER_FAQ_TEMPLATES.map((template, index) => {
    const tokenMatched =
      parsed.find((item) =>
        template.matchTokens.some((token) => item.question.toLowerCase().includes(token.toLowerCase())),
      ) ?? null;
    const indexMatched = parsed[index] ?? null;
    const answerCandidates = [
      tokenMatched?.answer ?? "",
      indexMatched?.answer ?? "",
      fallbackPool[index] ?? "",
      template.defaultAnswer,
    ].flatMap((item) => splitFocusedSentences(item));
    const answer = ensureFocusedSentenceRange(answerCandidates, [template.defaultAnswer], 1, 2).join(" ");

    return {
      question: template.question,
      answer,
    } satisfies NewYearConsumerFaqItem;
  });
};

const isNewYearOverviewService = (
  serviceType: SajuNewYear2026ServiceId,
): serviceType is NewYearOverviewServiceId =>
  NEW_YEAR_OVERVIEW_SERVICE_IDS.has(serviceType as NewYearOverviewServiceId);

const buildFocusedNewYearPayload = (
  serviceType: NewYearFocusedServiceId,
  payload: Record<string, unknown>,
  commonPayload: Omit<NewYear2026OverviewPayload, "focusCards">,
  baseSummary: string,
  legacyCard: NewYearFocusCard | null,
) => {
  const analysisBlocks = commonPayload.analysisBlocks;
  const yearTimeline = commonPayload.yearTimeline;
  const sectionSummary = analysisBlocks[0]?.coreFlow ?? yearTimeline[0]?.quarterSummary ?? baseSummary;
  const evidenceFallbacks = [
    legacyCard?.evidencePrimary,
    ...(legacyCard?.evidenceExtra ?? []),
    ...analysisBlocks.map((block) => block.evidence),
    ...commonPayload.evidence,
  ];
  const actionFallbacks = [
    ...(legacyCard?.dos ?? []),
    ...analysisBlocks.flatMap((block) => block.actionStrategy),
    ...commonPayload.actionNow,
    ...yearTimeline.map((node) => node.action),
  ];
  const cautionFallbacks = [
    ...(legacyCard?.donts ?? []),
    ...analysisBlocks.flatMap((block) => block.risks),
    ...yearTimeline.map((node) => node.caution),
  ];
  const opportunityFallbacks = [
    ...yearTimeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities),
    ...commonPayload.coreInsights,
  ];

  switch (serviceType) {
    case "saju-2026-study-exam": {
      const studyRhythm = buildFocusedParagraph(payload.studyRhythm, [legacyCard?.conclusion, sectionSummary], [
        "상반기에는 학습 엔진을 빠르게 올리고 하반기에는 정리 완성도를 높여야 성과가 안정됩니다.",
        "공부량보다 과목별 반복 주기를 일정하게 유지해야 점수 변동폭을 줄일 수 있습니다.",
      ]);
      const examWindows = buildFocusedList(payload.examWindows, opportunityFallbacks, 2, 4, [
        "2분기에는 지원·응시 일정 확보와 진도 선점을 동시에 진행해야 실전 부담이 줄어듭니다.",
        "4분기에는 실전 루틴을 유지한 채 정리 범위를 좁혀 마무리 집중도를 높여야 합니다.",
      ]);
      const mistakeTriggers = buildFocusedList(payload.mistakeTriggers, cautionFallbacks, 2, 4, [
        "초반 성과 직후 과목 수를 급격히 늘리면 복습 회전이 깨져 누적 효율이 떨어집니다.",
        "오답 구조 분석 없이 문제 수만 늘리면 체감 노력 대비 성과 상승 폭이 작아집니다.",
      ]);
      const executionGuide = buildFocusedList(payload.executionGuide, actionFallbacks, 2, 4, [
        "핵심 과목은 매일 같은 시간에 배치해 집중 시작 시간을 자동화하세요.",
        "주 2회 오답 복기와 주 1회 실전 시간 측정을 고정해 합격 확률을 높이세요.",
      ]);
      const evidenceNotes = buildFocusedList(payload.evidenceNotes, evidenceFallbacks, 2, 4, [
        "올해 학업운은 초반 추진력과 중반 조정력이 함께 나타나 루틴 유지가 핵심 변수입니다.",
        "분기 흐름상 진도 선점 이후 정리 완성도에서 최종 성과 차이가 발생하는 패턴이 반복됩니다.",
      ]);
      const studyActionReport = buildStudyActionReport(payload, commonPayload, {
        studyRhythm,
        examWindows,
        mistakeTriggers,
        executionGuide,
        evidenceNotes,
      });

      return {
        ...commonPayload,
        studyRhythm,
        examWindows,
        mistakeTriggers,
        executionGuide,
        evidenceNotes,
        studyActionReport,
      } satisfies NewYear2026StudyExamPayload;
    }
    case "saju-love-focus": {
      const relationshipFlow = buildFocusedParagraph(payload.relationshipFlow, [legacyCard?.conclusion, sectionSummary], [
        "관계는 초반의 강한 표현보다 중반 이후의 신뢰 축적에서 속도가 붙는 흐름입니다.",
        "감정 강도보다 대화 일관성을 유지할 때 관계 안정도가 높아집니다.",
      ]);
      const approachSignals = buildFocusedList(payload.approachSignals, opportunityFallbacks, 2, 4, [
        "상대가 일정 공유와 후속 약속을 먼저 제안하면 관계 진입 신호로 해석할 수 있습니다.",
        "짧은 대화가 길어지고 개인 주제가 늘어나면 신뢰 구간이 열리는 신호로 볼 수 있습니다.",
      ]);
      const cautionPatterns = buildFocusedList(payload.cautionPatterns, cautionFallbacks, 2, 4, [
        "초반 호감이 높을 때 관계 정의를 서두르면 기대치 불일치가 빠르게 커질 수 있습니다.",
        "확인 없는 추측형 대화가 누적되면 작은 오해가 장기 갈등으로 번질 위험이 높습니다.",
      ]);
      const relationshipGuide = buildFocusedList(payload.relationshipGuide, actionFallbacks, 2, 4, [
        "관계 속도는 주 단위로 점검하고 중요한 결정은 최소 한 번 더 대화 후 확정하세요.",
        "연락 빈도보다 약속 이행률을 관리 지표로 두면 신뢰를 안정적으로 키울 수 있습니다.",
      ]);
      const evidenceNotes = buildFocusedList(payload.evidenceNotes, evidenceFallbacks, 2, 4, [
        "올해 연애·결혼운은 접근 신호와 경계 신호가 동시에 나타나 속도 조절이 핵심입니다.",
        "분기 흐름에서 관계 안정 신호는 반복 확인 후 강화되는 패턴으로 관찰됩니다.",
      ]);
      const marriageDecisionBoard = normalizeLoveDecisionList(
        buildFocusedList(payload.marriageDecisionBoard, [...actionFallbacks, ...cautionFallbacks], 3, 3, [
          "결혼 의제 논의가 2회 연속 합의로 끝나는 경우 다음 단계 일정을 확정하고, 확인 기준은 합의 이행률 70% 이상으로 두세요.",
          "연락 빈도는 높지만 책임 분담 합의가 비어 있는 경우 결혼 논의를 보류하고, 확인 기준은 30일 내 생활·재정 합의 3개 확정으로 두세요.",
          "핵심 갈등이 반복되고 복구 시도가 무효화되는 경우 논의를 중단하고, 확인 기준은 2주 내 갈등 복구 시간 단축 여부로 두세요.",
        ]),
        "관계 속도와 약속 이행률이 함께 흔들리는 경우",
        "2주 단위 약속 이행률·갈등 복구 시간",
        3,
        3,
      );
      const meetingChannelPriority = normalizeLoveDecisionList(
        buildFocusedList(payload.meetingChannelPriority, [...approachSignals, ...opportunityFallbacks], 3, 4, [
          "지인 기반 소개에서 후속 약속 성사율이 높은 경우 주 1회 소개 요청을 실행하고, 확인 기준은 월 2회 이상 유의미한 만남 성사로 두세요.",
          "업무·학습 커뮤니티에서 가치관 대화가 자연스럽게 이어지는 경우 주간 참여를 고정하고, 확인 기준은 2주 내 재대화 여부로 두세요.",
          "취미 모임에서 대화 깊이가 유지되는 경우 연락 빈도보다 약속 이행률 관리에 집중하고, 확인 기준은 3회 만남 이후 신뢰 지표로 두세요.",
        ]),
        "만남 빈도는 높지만 깊이 대화가 적은 경우",
        "주간 참여 횟수·후속 약속 성사율",
        3,
        4,
      );
      const greenFlagChecklist = buildFocusedList(payload.greenFlagChecklist, [...approachSignals, ...opportunityFallbacks], 3, 4, [
        "일정 변경 시 대안을 먼저 제시하고 실제로 이행하면 신뢰 확장 신호로 분류하세요.",
        "감정 표현보다 책임 행동이 먼저 반복되면 장기 관계 적합 신호로 분류하세요.",
        "갈등 후 24시간 안에 대화 재개 의지가 확인되면 회복 탄력 신호로 분류하세요.",
      ]);
      const redFlagChecklist = buildFocusedList(payload.redFlagChecklist, [...cautionPatterns, ...cautionFallbacks], 3, 4, [
        "합의가 끝난 사안을 반복 번복하면 결혼 논의 보류 신호로 분류하세요.",
        "관계 갈등 시 책임 전가가 지속되면 중단 기준 후보로 분류하세요.",
        "미래 계획 질문을 장기간 회피하면 속도 조절 또는 보류 신호로 분류하세요.",
      ]);
      const conflictProtocol = normalizeLoveDecisionList(
        buildFocusedList(payload.conflictProtocol, [...relationshipGuide, ...actionFallbacks], 2, 4, [
          "다툼 직후 감정 강도가 높은 경우 24시간은 사실 확인만 진행하고, 확인 기준은 쟁점 1개 문장화 여부로 두세요.",
          "24시간 이후에도 합의가 안 되면 72시간 내 역할·기한을 재정의하고, 확인 기준은 다음 갈등에서 동일 쟁점 재발 여부로 두세요.",
        ]),
        "감정 온도가 높아 바로 결론을 내리기 어려운 경우",
        "24시간/72시간 복구 지표",
        2,
        4,
      );
      const consumerFaq = buildLoveConsumerFaq(payload.consumerFaq, [
        ...relationshipGuide,
        ...marriageDecisionBoard,
        ...conflictProtocol,
        ...evidenceNotes,
        ...cautionPatterns,
      ]);

      const loveAnalysisBlocks = commonPayload.analysisBlocks.map((block, index) => {
        const timelineNode = yearTimeline[index];
        const quarterLabel = timelineNode?.quarter ?? block.windowLabel;
        const opportunities = ensureFocusedSentenceRange(
          [
            ...block.opportunities.flatMap((item) => splitFocusedSentences(item)),
            ...splitFocusedSentences(timelineNode?.opportunity ?? ""),
            ...splitFocusedSentences(approachSignals[index % Math.max(approachSignals.length, 1)] ?? ""),
          ],
          [approachSignals[0] ?? "관계 진입 신호가 보일 때는 후속 약속 이행률을 확인하세요."],
          1,
          4,
        );
        const risks = ensureFocusedSentenceRange(
          [
            ...block.risks.flatMap((item) => splitFocusedSentences(item)),
            ...splitFocusedSentences(timelineNode?.caution ?? ""),
            ...splitFocusedSentences(redFlagChecklist[index % Math.max(redFlagChecklist.length, 1)] ?? ""),
          ],
          [cautionPatterns[0] ?? "기대치 불일치가 커지면 속도를 늦추고 기준을 재정렬하세요."],
          1,
          3,
        );
        const actionStrategy = ensureFocusedSentenceRange(
          [
            ...block.actionStrategy.flatMap((item) => splitFocusedSentences(item)),
            ...splitFocusedSentences(timelineNode?.action ?? ""),
            ...splitFocusedSentences(marriageDecisionBoard[index % Math.max(marriageDecisionBoard.length, 1)] ?? ""),
            ...splitFocusedSentences(conflictProtocol[index % Math.max(conflictProtocol.length, 1)] ?? ""),
          ],
          [
            marriageDecisionBoard[0] ?? "조건이 확인되면 관계 단계 결정을 문장으로 고정하세요.",
            conflictProtocol[0] ?? "갈등이 생기면 24시간/72시간 복구 순서로 대응하세요.",
          ],
          2,
          4,
        );
        const evidence = buildFocusedParagraph(
          block.evidence,
          [timelineNode?.quarterSummary, evidenceNotes[index], evidenceNotes[0]],
          [
            `${quarterLabel}에는 접근 신호와 경계 신호를 함께 확인해 관계 속도를 조정해야 합니다.`,
            "분기별로 약속 이행률과 갈등 복구 시간을 같이 점검하면 결혼 전환 판단 정확도가 올라갑니다.",
          ],
        );

        return {
          ...block,
          evidence,
          opportunities,
          risks,
          actionStrategy,
        };
      });

      return {
        ...commonPayload,
        analysisBlocks: loveAnalysisBlocks,
        relationshipFlow,
        approachSignals,
        cautionPatterns,
        relationshipGuide,
        marriageDecisionBoard,
        meetingChannelPriority,
        greenFlagChecklist,
        redFlagChecklist,
        conflictProtocol,
        consumerFaq,
        evidenceNotes,
      } satisfies NewYear2026LovePayload;
    }
    case "saju-2026-wealth-business": {
      const cashflowPulse = buildFocusedParagraph(payload.cashflowPulse, [legacyCard?.conclusion, sectionSummary], [
        "매출 확대보다 고정 수익 비중을 먼저 안정시키는 전략이 올해 변동성을 줄입니다.",
        "지출 통제는 빈도보다 큰 항목 구조 조정이 성과에 더 직접적으로 연결됩니다.",
      ]);
      const growthAxes = buildFocusedList(payload.growthAxes, opportunityFallbacks, 2, 4, [
        "반복 구매가 가능한 핵심 상품 축을 먼저 강화해야 수익 예측 가능성이 높아집니다.",
        "신규 확장은 운영 여력 확인 후 순차적으로 열어야 손익 불안정을 줄일 수 있습니다.",
      ]);
      const leakRisks = buildFocusedList(payload.leakRisks, cautionFallbacks, 2, 4, [
        "단기 매출을 이유로 할인·판촉을 과다 집행하면 이익률이 빠르게 약해집니다.",
        "검증 없는 외주·광고 확장은 현금 흐름 누수를 반복적으로 만들 수 있습니다.",
      ]);
      const operatingRules = buildFocusedList(payload.operatingRules, actionFallbacks, 2, 4, [
        "지출 승인 기준을 금액 구간별로 분리해 즉시 결정 항목과 검토 항목을 구분하세요.",
        "월간 손익 점검은 매출보다 이익률과 회수 주기를 우선 지표로 관리하세요.",
      ]);
      const evidenceNotes = buildFocusedList(payload.evidenceNotes, evidenceFallbacks, 2, 4, [
        "올해 재물·사업운은 확장 기회와 누수 위험이 동시 출현해 운영 규율이 핵심입니다.",
        "분기 신호를 보면 수익 확대보다 비용 구조 안정화에서 체감 성과가 먼저 나타납니다.",
      ]);

      const quickSummaryRaw = isRecord(payload.quickSummary) ? payload.quickSummary : {};
      const quickSummaryVerdict = toStringValue(quickSummaryRaw.verdict, "");
      const rawQuarterlyFlowCards = Array.isArray(payload.quarterlyFlowCards)
        ? payload.quarterlyFlowCards.filter((item): item is Record<string, unknown> => isRecord(item))
        : [];

      const oneLineDiagnosis = buildFocusedOneLiner(
        payload.oneLineDiagnosis,
        [quickSummaryVerdict, legacyCard?.conclusion, sectionSummary, cashflowPulse],
        "수익 확대보다 현금흐름 구조를 먼저 고정할수록 2026년 재물·사업 변동성을 줄일 수 있습니다.",
      );

      const keyPoints = ensureFocusedSentenceRange(
        toStringArray(payload.keyPoints, [], 8).flatMap((item) => splitFocusedSentences(item)),
        [...growthAxes, ...leakRisks, ...operatingRules, ...commonPayload.coreInsights],
        3,
        3,
      );

      const easyInterpretationPoints = ensureFocusedSentenceRange(
        toStringArray(payload.easyInterpretationPoints, [], 8).flatMap((item) => splitFocusedSentences(item)),
        [cashflowPulse, ...evidenceNotes, ...commonPayload.evidence],
        2,
        4,
      );

      const annualFlowSummary = buildFocusedParagraph(
        payload.annualFlowSummary,
        [cashflowPulse, quickSummaryVerdict, sectionSummary, evidenceNotes[0]],
        [
          "상반기에는 수익 축을 선명하게 고정하고 하반기에는 누수 구간을 줄이는 운영이 실질 성과를 만듭니다.",
          "과속 확장보다 분기별 손익 점검과 회수 주기 관리가 사업 안정성을 높입니다.",
        ],
      );

      const quarterlyFlowCards = NEW_YEAR_QUARTERS.map((quarter, index) => {
        const source =
          rawQuarterlyFlowCards.find((item, itemIndex) => resolveQuarterIndex(item.quarter, itemIndex) === index) ??
          rawQuarterlyFlowCards[index];
        const timelineNode = yearTimeline[index];
        const block = analysisBlocks[index];

        return {
          quarter,
          flowSummary: buildFocusedParagraph(
            source?.flowSummary,
            [timelineNode?.quarterSummary, block?.coreFlow, annualFlowSummary],
            [
              `${quarter}에는 매출 규모보다 수익 구조 안정화 신호를 먼저 확인해야 합니다.`,
              `${quarter} 운영 판단은 기회 확대와 누수 통제를 동시에 점검하는 방식으로 진행하세요.`,
            ],
          ),
          keyPoint: buildFocusedOneLiner(
            source?.keyPoint,
            [growthAxes[index], timelineNode?.opportunity, block?.opportunities?.[0], keyPoints[index]],
            `${quarter} 핵심 포인트는 확장 축을 1~2개로 제한하고 반복 가능한 수익 채널을 강화하는 것입니다.`,
          ),
          risk: buildFocusedOneLiner(
            source?.risk,
            [leakRisks[index], timelineNode?.caution, block?.risks?.[0]],
            `${quarter} 리스크는 검증 없는 판촉 확대와 고정비 과집행으로 인한 현금흐름 누수입니다.`,
          ),
          actionStrategy: buildFocusedOneLiner(
            source?.actionStrategy,
            [operatingRules[index], timelineNode?.action, block?.actionStrategy?.[0], commonPayload.actionNow[index]],
            `${quarter} 행동 전략은 지출 승인 기준과 회수 주기 점검 일정을 먼저 고정하는 것입니다.`,
          ),
        };
      });

      const revenueFlowDeepDive = ensureFocusedSentenceRange(
        toStringArray(payload.revenueFlowDeepDive, [], 8).flatMap((item) => splitFocusedSentences(item)),
        [cashflowPulse, ...evidenceNotes, ...keyPoints],
        2,
        4,
      );

      const businessManagementPoints = ensureFocusedSentenceRange(
        toStringArray(payload.businessManagementPoints, [], 8).flatMap((item) => splitFocusedSentences(item)),
        [...operatingRules, ...growthAxes, ...commonPayload.actionNow],
        2,
        4,
      );

      const burnoutPreventionStrategies = ensureFocusedSentenceRange(
        toStringArray(payload.burnoutPreventionStrategies, [], 8).flatMap((item) => splitFocusedSentences(item)),
        [...leakRisks, ...commonPayload.actionPlan90.day30, ...commonPayload.actionPlan90.day60, ...commonPayload.actionPlan90.day90],
        2,
        4,
      );

      const actionChecklist = ensureFocusedSentenceRange(
        toStringArray(payload.actionChecklist, [], 12).flatMap((item) => splitFocusedSentences(item)),
        [
          ...operatingRules,
          ...commonPayload.actionNow,
          ...commonPayload.actionPlan90.day30,
          ...commonPayload.actionPlan90.day60,
          ...commonPayload.actionPlan90.day90,
          ...quarterlyFlowCards.map((item) => item.actionStrategy),
        ],
        3,
        8,
      );

      const closingLine = buildFocusedOneLiner(
        payload.closingLine,
        [oneLineDiagnosis, annualFlowSummary, ...keyPoints],
        "확장 속도보다 운영 기준을 먼저 고정하면 2026년 재물·사업 성과를 안정적으로 축적할 수 있습니다.",
      );

      return {
        ...commonPayload,
        cashflowPulse,
        growthAxes,
        leakRisks,
        operatingRules,
        evidenceNotes,
        oneLineDiagnosis,
        keyPoints,
        easyInterpretationPoints,
        annualFlowSummary,
        quarterlyFlowCards,
        revenueFlowDeepDive,
        businessManagementPoints,
        burnoutPreventionStrategies,
        actionChecklist,
        closingLine,
      } satisfies NewYear2026WealthBusinessPayload;
    }
    case "saju-2026-investment-assets":
      {
        const entryBias = buildFocusedParagraph(payload.entryBias, [legacyCard?.conclusion, sectionSummary], [
          "투자 판단은 수익 기대보다 손실 통제 기준을 먼저 세울 때 성과 편차가 줄어듭니다.",
          "진입 타이밍은 감정 반응보다 사전에 정한 가격·비중 규칙을 지킬수록 안정적입니다.",
        ]);
        const watchSignals = buildFocusedList(payload.watchSignals, opportunityFallbacks, 2, 4, [
          "거래량과 변동성이 동시에 확대될 때는 추격 진입보다 신호 확인 구간을 먼저 두세요.",
          "시장 방향이 불명확한 구간에서는 수익 기대치보다 현금 비중 유지가 우선입니다.",
        ]);
        const riskAlerts = buildFocusedList(payload.riskAlerts, cautionFallbacks, 2, 4, [
          "손절 기준 없이 평단만 낮추는 행동은 손실을 구조적으로 키우는 대표 경보 신호입니다.",
          "레버리지 비중이 계획을 넘는 순간 계좌 복원력이 급격히 떨어질 수 있습니다.",
        ]);
        const capitalRules = buildFocusedList(payload.capitalRules, actionFallbacks, 2, 4, [
          "단일 자산 비중 상한을 먼저 고정하고 예외 규칙 없이 동일하게 적용하세요.",
          "진입 전 회수 조건을 함께 기록해 목표가·손절가·보유 기간을 동시에 관리하세요.",
        ]);
        const evidenceNotes = buildFocusedList(payload.evidenceNotes, evidenceFallbacks, 2, 4, [
          "올해 투자운은 신호 강도가 빠르게 바뀌기 때문에 진입 규칙의 일관성이 핵심입니다.",
          "분기 흐름을 보면 공격적 진입보다 보수적 비중 관리에서 누적 성과가 유리합니다.",
        ]);

        const investmentActionReport = buildInvestmentActionReport(
          payload,
          commonPayload,
          {
            entryBias,
            watchSignals,
            riskAlerts,
            capitalRules,
            evidenceNotes,
          },
        );

        return {
          ...commonPayload,
          entryBias,
          watchSignals,
          riskAlerts,
          capitalRules,
          evidenceNotes,
          investmentActionReport,
        } satisfies NewYear2026InvestmentPayload;
      }
    case "saju-2026-career-aptitude":
      return {
        ...commonPayload,
        fitRoleSignal: buildFocusedParagraph(payload.fitRoleSignal, [legacyCard?.conclusion, sectionSummary], [
          "성과가 나는 역할은 문제 정의와 실행 우선순위를 함께 다루는 포지션에 가깝습니다.",
          "의사결정과 조율 비중이 높은 업무에서 강점이 더 선명하게 드러납니다.",
        ]),
        strongWorkModes: buildFocusedList(payload.strongWorkModes, opportunityFallbacks, 2, 4, [
          "업무 목표를 주 단위로 쪼개고 완료 기준을 먼저 합의하면 실행 속도가 올라갑니다.",
          "피드백 주기가 짧은 환경에서 강점 누적이 빨라져 성과 재현성이 높아집니다.",
        ]),
        misfitChoices: buildFocusedList(payload.misfitChoices, cautionFallbacks, 2, 4, [
          "역할 범위가 불명확한 제안을 감으로 수락하면 책임 과부하가 커질 수 있습니다.",
          "성과 기준이 없는 프로젝트에 장기 투입되면 성장 대비 피로가 먼저 누적됩니다.",
        ]),
        executionChecklist: buildFocusedList(payload.executionChecklist, actionFallbacks, 2, 4, [
          "이번 분기 핵심 역량 1개를 정하고 관련 결과물을 월 단위로 남기세요.",
          "의사결정 참여 범위를 명시해 역할 기대치와 평가 기준을 동시에 정렬하세요.",
        ]),
        evidenceNotes: buildFocusedList(payload.evidenceNotes, evidenceFallbacks, 2, 4, [
          "올해 직업·적성운은 역할 적합성보다 실행 방식 정렬 여부에서 성과 차이가 커집니다.",
          "성과 상승 구간은 목표 명확성·피드백 속도·집중 범위가 동시에 맞을 때 나타납니다.",
        ]),
      } satisfies NewYear2026CareerPayload;
    case "saju-2026-health-balance": {
      const quickSummaryRaw = isRecord(payload.quickSummary) ? payload.quickSummary : {};
      const quickSummaryVerdict = toStringValue(quickSummaryRaw.verdict, "");
      const rawQuarterlyFlowCards = Array.isArray(payload.quarterlyFlowCards)
        ? payload.quarterlyFlowCards.filter((item): item is Record<string, unknown> => isRecord(item))
        : [];
      const actionPlanDay30 = commonPayload.actionPlan90.day30 ?? [];
      const actionPlanDay60 = commonPayload.actionPlan90.day60 ?? [];
      const actionPlanDay90 = commonPayload.actionPlan90.day90 ?? [];

      const energyRhythm = buildFocusedParagraph(payload.energyRhythm, [legacyCard?.conclusion, sectionSummary], [
        "올해 건강 흐름은 단기 고강도보다 회복 간격을 일정하게 유지할 때 체감 안정성이 높아지는 패턴입니다.",
        "집중 시간과 휴식 시간을 함께 관리하면 피로 누적 구간을 짧게 만들 가능성이 커집니다.",
      ]);

      const bodyPatterns = buildFocusedList(payload.bodyPatterns, [...cautionFallbacks, ...opportunityFallbacks], 3, 5, [
        "수면 시작이 늦어지거나 중간 각성이 잦아지면 다음 날 집중력 저하가 동반될 수 있습니다.",
        "식사 간격이 흔들리는 주에는 소화 부담과 오후 피로 누적이 함께 나타날 가능성이 있습니다.",
        "일정 과밀 구간에서는 예민함 증가와 회복 지연이 동시에 나타날 수 있어 속도 조절이 필요합니다.",
      ]);

      const recoveryPriorities = buildFocusedList(payload.recoveryPriorities, [...actionFallbacks, ...opportunityFallbacks], 4, 4, [
        "수면 안정: 취침·기상 시간을 평일/주말 모두 비슷하게 맞춰 수면 리듬 흔들림을 줄이세요.",
        "소화기 관리: 식사 간격을 일정하게 유지하고 자극적인 야식을 줄여 위장 부담을 낮추세요.",
        "과열 진정: 긴장도가 높은 날에는 카페인 추가보다 수분 보충과 호흡 루틴으로 과열을 진정시키세요.",
        "체력 분배: 하루 최대 집중 블록 수를 제한해 회복 없이 밀어붙이는 패턴을 줄이세요.",
      ]);

      const overloadSignals = buildFocusedList(payload.overloadSignals, [...cautionFallbacks, ...bodyPatterns], 3, 4, [
        "잠드는 시간이 계속 밀리거나 자주 깨는 날이 반복되면 과부하 신호로 보고 일정 강도를 조절하세요.",
        "두근거림·예민함·안구 피로가 같은 주에 겹치면 속도보다 회복 루틴을 우선해 리듬을 재정렬하세요.",
        "쉬어도 피로가 잘 풀리지 않는 구간이 이어지면 업무·학습 블록을 줄여 회복 구간을 먼저 확보하세요.",
      ]);

      const quarterlyFlowCards = NEW_YEAR_QUARTERS.map((quarter, index) => {
        const source =
          rawQuarterlyFlowCards.find((item, itemIndex) => resolveQuarterIndex(item.quarter, itemIndex) === index) ??
          rawQuarterlyFlowCards[index];
        const timelineNode = yearTimeline[index];
        const block = analysisBlocks[index];

        return {
          quarter,
          flowSummary: buildFocusedParagraph(
            source?.flowSummary,
            [timelineNode?.quarterSummary, block?.coreFlow, energyRhythm, quickSummaryVerdict],
            [
              `${quarter}에는 몸 상태가 빠르게 좋아지는 구간과 쉽게 지치는 구간이 교차할 수 있어 강도 조절이 중요합니다.`,
              `${quarter}에는 성과 확대보다 회복 루틴 유지 여부가 컨디션 안정 폭을 좌우하는 경향이 큽니다.`,
            ],
          ),
          cautionPoint: buildFocusedOneLiner(
            source?.cautionPoint,
            [overloadSignals[index], timelineNode?.caution, block?.risks?.[0], bodyPatterns[index]],
            `${quarter} 주의 포인트는 수면 지연과 피로 누적 신호를 놓치지 않고 일정 강도를 조정하는 것입니다.`,
          ),
          recommendedAction: buildFocusedOneLiner(
            source?.recommendedAction,
            [
              recoveryPriorities[index],
              timelineNode?.action,
              block?.actionStrategy?.[0],
              commonPayload.actionNow[index],
              actionPlanDay30[index],
            ],
            `${quarter} 추천 행동은 수면·식사·회복 블록을 먼저 고정하고 그 안에서 업무 강도를 배분하는 것입니다.`,
          ),
        };
      });

      const overloadChecklist = ensureFocusedSentenceRange(
        toStringArray(payload.overloadChecklist, [], 12).flatMap((item) => splitFocusedSentences(item)),
        [
          ...overloadSignals,
          ...cautionFallbacks,
          "잠들기 어려운 날이 일주일에 여러 번 반복되면 일정 강도 조절이 필요할 수 있습니다.",
          "자주 깨는 수면이 이어지면 다음 날 중요한 일정의 밀도를 줄이는 편이 안전합니다.",
          "두근거림이나 예민함이 반복되면 카페인·야간 자극 노출을 줄여 리듬을 진정시키세요.",
          "입병 또는 피부 트러블이 반복되면 과열 신호로 보고 수면·수분 루틴을 먼저 정리하세요.",
          "안구 피로가 하루 종일 이어지면 화면 집중 시간을 끊어 주는 휴식 간격을 고정하세요.",
          "속이 더부룩한 상태가 자주 생기면 식사 간격과 섭취 속도를 점검해 부담을 낮추세요.",
          "쉬어도 피로가 잘 풀리지 않으면 무리한 만회보다 회복 우선 일정을 먼저 확보하세요.",
        ],
        6,
        8,
      );

      const routineChecklist = buildFocusedList(payload.routineChecklist, [...actionFallbacks, ...recoveryPriorities], 3, 5, [
        "아침·낮·저녁 중 최소 한 구간은 고정 루틴으로 유지해 컨디션 기준점을 만드세요.",
        "회복 블록은 일이 끝난 뒤가 아니라 일정표 선행 항목으로 먼저 배치하세요.",
        "주간 점검 시 수면·피로·소화 신호를 같은 체크표로 기록해 변화 흐름을 확인하세요.",
      ]);

      const routineGuideRaw = isRecord(payload.routineGuide) ? payload.routineGuide : {};
      const routineGuide = {
        morning: buildFocusedList(routineGuideRaw.morning, [...routineChecklist, ...actionFallbacks, ...actionPlanDay30], 2, 4, [
          "기상 후 30분 안에 물과 가벼운 스트레칭으로 몸의 긴장을 낮춰 하루 리듬을 안정시키세요.",
          "아침 식사를 거르기 쉬운 날일수록 간단한 단백질·탄수화물 조합으로 공복 시간을 줄이세요.",
        ]),
        daytime: buildFocusedList(routineGuideRaw.daytime, [...routineChecklist, ...actionFallbacks, ...actionPlanDay60], 2, 4, [
          "점심 이후 5~10분 눈 휴식과 가벼운 걷기를 넣어 오후 안구 피로 누적을 줄이세요.",
          "카페인 추가 섭취 전 수분 보충과 호흡 정리부터 실행해 예민함 신호를 완화하세요.",
        ]),
        evening: buildFocusedList(routineGuideRaw.evening, [...routineChecklist, ...actionFallbacks, ...actionPlanDay90], 2, 4, [
          "취침 90분 전에는 과한 업무·학습 자극을 줄이고 조명을 낮춰 수면 진입 지연을 줄이세요.",
          "저녁 식사는 과식보다 소화 부담이 적은 구성으로 조정해 밤사이 회복 흐름을 돕세요.",
        ]),
        weekly: buildFocusedList(routineGuideRaw.weekly, [...routineChecklist, ...recoveryPriorities, ...commonPayload.actionNow], 2, 4, [
          "주 1회 일정표에서 회복 전용 시간을 먼저 고정하고 나머지 업무를 재배치하세요.",
          "주말 점검에서 과부하 신호 체크리스트를 확인하고 다음 주 강도를 선제 조정하세요.",
        ]),
      };

      const evidenceNotes = buildFocusedList(payload.evidenceNotes, [...evidenceFallbacks, ...bodyPatterns, ...overloadSignals], 2, 4, [
        "올해 건강운은 절대 강도보다 회복 간격 관리에서 체감 차이가 크게 나타나는 흐름입니다.",
        "분기별 신호를 보면 과부하 대응 속도가 다음 구간의 컨디션 안정 폭을 좌우하는 경향이 있습니다.",
      ]);

      return {
        ...commonPayload,
        energyRhythm,
        bodyPatterns,
        quarterlyFlowCards,
        recoveryPriorities,
        overloadSignals,
        overloadChecklist,
        routineChecklist,
        routineGuide,
        evidenceNotes,
      } satisfies NewYear2026HealthPayload;
    }
  }
};

const parseNewYear2026AnalysisPayload = (
  data: unknown,
  serviceType: SajuNewYear2026ServiceId,
  req?: SajuAnalysisRequest,
): SajuAnalysisResponse => {
  const base = parseCommonAnalysis(data);
  const payload = base.payload;
  const fallbackTimeline = buildNewYearFallbackTimeline(base.summary, base.commonPayload);

  const timelineMap = new Map<number, NewYearTimelineNode>();
  if (Array.isArray(payload.yearTimeline)) {
    payload.yearTimeline
      .filter((item): item is Record<string, unknown> => isRecord(item))
      .forEach((item, index) => {
        const quarterIndex = resolveQuarterIndex(item.quarter, index);
        const fallback = fallbackTimeline[quarterIndex] ?? fallbackTimeline[index] ?? fallbackTimeline[0];
        timelineMap.set(quarterIndex, {
          quarter: NEW_YEAR_QUARTERS[quarterIndex] ?? fallback.quarter,
          quarterSummary: toStringValue(item.quarterSummary, fallback.quarterSummary),
          opportunity: toStringValue(item.opportunity, fallback.opportunity),
          caution: toStringValue(item.caution, fallback.caution),
          action: toStringValue(item.action, fallback.action),
        });
      });
  }

  const yearTimeline = NEW_YEAR_QUARTERS.map((quarter, index) => {
    const fallback = fallbackTimeline[index];
    const node = timelineMap.get(index) ?? fallback;
    return {
      quarter,
      quarterSummary: toStringValue(node.quarterSummary, fallback.quarterSummary),
      opportunity: toStringValue(node.opportunity, fallback.opportunity),
      caution: toStringValue(node.caution, fallback.caution),
      action: toStringValue(node.action, fallback.action),
    };
  });

  const fallbackBlocks: SajuAnalysisBlock[] = yearTimeline.map((node) => ({
    windowLabel: node.quarter,
    timeRange: node.quarter,
    coreFlow: node.quarterSummary,
    evidence: node.caution,
    opportunities: [node.opportunity],
    risks: [node.caution],
    actionStrategy: [node.action],
  }));

  const analysisBlocks = parseAnalysisBlocks(payload.analysisBlocks, fallbackBlocks);
  const quickSummaryRaw = isRecord(payload.quickSummary) ? payload.quickSummary : {};
  const signalTrioRaw = isRecord(quickSummaryRaw.signalTrio) ? quickSummaryRaw.signalTrio : {};
  const quickSummary = {
    verdict: toStringValue(quickSummaryRaw.verdict, base.summary),
    keywords: ensureMinItems(
      toStringArray(quickSummaryRaw.keywords, [], 5),
      [...base.commonPayload.coreInsights, "기회", "균형", "실행"],
      3,
      3,
    ),
    signalTrio: {
      interpretationIntensityLevel: normalizeInterpretationIntensityLevel(signalTrioRaw.interpretationIntensityLevel, "중"),
      attentionLevel: normalizeAttentionLevel(signalTrioRaw.attentionLevel, "보통"),
      changeSignalLevel: normalizeChangeSignalLevel(signalTrioRaw.changeSignalLevel, "중"),
      reason: toStringValue(
        signalTrioRaw.reason,
        base.commonPayload.evidence[0] ?? "현재 흐름의 핵심 근거를 먼저 확인하세요.",
      ),
    },
  };

  const actionPlanRaw = isRecord(payload.actionPlan90) ? payload.actionPlan90 : {};
  const actionPlan90 = {
    day30: ensureMinItems(
      toStringArray(actionPlanRaw.day30, [], 5),
      [base.commonPayload.actionNow[0] ?? "", yearTimeline[0]?.action ?? "", "핵심 루틴 1개를 먼저 고정하세요."],
      1,
      3,
    ),
    day60: ensureMinItems(
      toStringArray(actionPlanRaw.day60, [], 5),
      [base.commonPayload.actionNow[1] ?? base.commonPayload.actionNow[0] ?? "", yearTimeline[1]?.action ?? "", "중간 점검 기준을 문장으로 확정하세요."],
      1,
      3,
    ),
    day90: ensureMinItems(
      toStringArray(actionPlanRaw.day90, [], 5),
      [base.commonPayload.actionNow[2] ?? base.commonPayload.actionNow[0] ?? "", yearTimeline[2]?.action ?? "", "성과 기준과 다음 분기 준비 항목을 분리하세요."],
      1,
      3,
    ),
  };

  const rawFocusCards = Array.isArray(payload.focusCards)
    ? payload.focusCards.filter((item): item is Record<string, unknown> => isRecord(item))
    : [];
  const focusCards: NewYearFocusCard[] = NEW_YEAR_FOCUS_ORDER.map((definition, index) => {
    const matchedRawCard =
      rawFocusCards.find((card) => toStringValue(card.focusId) === definition.focusId) ??
      rawFocusCards.find((card) => toStringValue(card.focusLabel) === definition.focusLabel) ??
      rawFocusCards[index];

    const sectionFallback = base.sections[index] ?? base.sections[0];
    const conclusionFallback =
      sectionFallback?.interpretation ?? base.commonPayload.coreInsights[index] ?? yearTimeline[index]?.quarterSummary ?? base.summary;
    const rawDos = toStringArray(matchedRawCard?.dos, toStringArray(matchedRawCard?.doItems, [], 6), 6);
    const rawDonts = toStringArray(matchedRawCard?.donts, toStringArray(matchedRawCard?.dontItems, [], 6), 6);

    const dos = ensureMinItems(
      rawDos,
      [
        base.commonPayload.actionNow[index] ?? "",
        yearTimeline[index]?.action ?? "",
        base.commonPayload.actionNow[(index + 1) % Math.max(base.commonPayload.actionNow.length, 1)] ?? "",
        "당장 할 행동을 1개로 좁혀 실행하세요.",
      ],
      2,
      4,
    );
    const donts = ensureMinItems(
      rawDonts,
      [
        yearTimeline[index]?.caution ?? "",
        base.commonPayload.evidence[index] ?? "",
        "과속 결정을 피하고 확인 단계를 거치세요.",
      ],
      1,
      3,
    );

    const rawEvidencePrimary = toStringValue(
      matchedRawCard?.evidencePrimary,
      toStringValue(matchedRawCard?.evidence, ""),
    );
    const rawEvidenceExtra = toStringArray(
      matchedRawCard?.evidenceExtra,
      toStringArray(matchedRawCard?.evidenceList, [], 6),
      6,
    );
    const evidencePool = uniqueItems([
      rawEvidencePrimary,
      ...rawEvidenceExtra,
      base.commonPayload.evidence[index] ?? "",
      yearTimeline[index]?.caution ?? "",
      sectionFallback?.title ?? "",
    ]);
    const evidencePrimary = evidencePool[0] ?? "핵심 근거를 먼저 확인하세요.";
    const evidenceExtra = ensureMinItems(
      evidencePool.slice(1),
      [
        base.commonPayload.evidence[(index + 1) % Math.max(base.commonPayload.evidence.length, 1)] ?? "",
        yearTimeline[index]?.opportunity ?? "",
      ],
      1,
      3,
    );
    const conclusion = buildFocusedParagraph(
      matchedRawCard?.conclusion,
      [
        conclusionFallback,
        sectionFallback?.advice,
        yearTimeline[index]?.quarterSummary,
        yearTimeline[index]?.opportunity,
        yearTimeline[index]?.caution,
        dos[0],
        donts[0],
        evidencePrimary,
      ],
      NEW_YEAR_FOCUS_CARD_CONCLUSION_DEFAULTS[definition.focusId],
    );

    return {
      focusId: definition.focusId,
      focusLabel: definition.focusLabel,
      conclusion,
      dos,
      donts,
      evidencePrimary,
      evidenceExtra,
    };
  });

  const consistencyMetaRaw = isRecord(payload.consistencyMeta) ? payload.consistencyMeta : {};
  const targetYearCandidate = Number(consistencyMetaRaw.targetYear ?? NEW_YEAR_TARGET_YEAR);
  const targetYear = Number.isFinite(targetYearCandidate) ? Math.trunc(targetYearCandidate) : NEW_YEAR_TARGET_YEAR;
  const generatedAt = toStringValue(consistencyMetaRaw.generatedAt, new Date().toISOString());
  const profileMeta = req?.sajuData?.profileMeta;
  const calculatedAge = calculateManAge(profileMeta?.profileData, profileMeta?.timezone);
  const ageCandidate = Number(consistencyMetaRaw.age ?? NaN);
  const age = Number.isFinite(ageCandidate)
    ? clamp(Math.trunc(ageCandidate), 0, 89)
    : calculatedAge;

  const commonReportPayload = {
    coreQuestion: toStringValue(payload.coreQuestion, NEW_YEAR_CORE_QUESTIONS[serviceType]),
    ...base.commonPayload,
    analysisBlocks,
    quickSummary,
    yearTimeline,
    actionPlan90,
    consistencyMeta: {
      targetYear,
      ganji: toStringValue(
        consistencyMetaRaw.ganji,
        targetYear === NEW_YEAR_TARGET_YEAR ? NEW_YEAR_GANJI : "",
      ),
      age,
      generatedAt,
    },
  };

  const legacyCard = focusCards.find((card) => card.focusId === serviceType) ?? null;
  const reportPayload: NewYear2026ReportPayload = isNewYearOverviewService(serviceType)
    ? ({
        ...commonReportPayload,
        focusCards,
      } satisfies NewYear2026OverviewPayload)
    : buildFocusedNewYearPayload(serviceType, payload, commonReportPayload, base.summary, legacyCard);

  return {
    serviceType,
    summary: base.summary,
    sections: base.sections,
    reportTemplateVersion: base.reportTemplateVersion,
    reportPayload: reportPayload as SajuReportPayloadMap[typeof serviceType],
  };
};

const parseTraditionalAnalysisPayload = (
  data: unknown,
  serviceType: "traditional-saju" = "traditional-saju",
): SajuAnalysisResponse => {
  const parsed = parseJsonPayload<Record<string, unknown>>(data);
  const sections = parseSections(parsed.sections);
  if (typeof parsed.summary !== "string" || sections.length === 0) {
    throw new Error("invalid-shape");
  }

  return {
    serviceType,
    summary: parsed.summary,
    sections,
  };
};

const isSpecializedSajuService = (serviceType: SajuServiceType): serviceType is SajuAnalysisServiceId => {
  return SAJU_ANALYSIS_SERVICE_IDS.includes(serviceType as SajuAnalysisServiceId);
};

const isNewYear2026SajuService = (serviceType: SajuServiceType): serviceType is SajuNewYear2026ServiceId => {
  return SAJU_NEW_YEAR_2026_SERVICE_IDS.includes(serviceType as SajuNewYear2026ServiceId);
};

export const getSajuAnalysis = async (
  req: SajuAnalysisRequest,
  options?: GetSajuAnalysisOptions,
): Promise<SajuAnalysisResponse> => {
  ensureConfigured();

  const source = options?.source ?? "manual";
  const traceId = options?.traceId;
  const timeoutMs = resolveSajuAnalysisTimeoutMs(source, req.serviceType);
  const analysisFunctionName = isNewYear2026SajuService(req.serviceType)
    ? SAJU_YEARLY_FUNCTION_NAME
    : SAJU_LIFETIME_FUNCTION_NAME;
  const invokeBody: SajuAnalysisInvokeBody = {
    ...req,
    requestMeta: {
      source,
      ...(traceId ? { traceId } : {}),
    },
  };

  let data: unknown = null;
  let lastFailure: SajuAnalysisFailure | null = null;

  for (let attempt = 1; attempt <= SAJU_ANALYSIS_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = shouldUseDirectFetchPrimary(source, req.serviceType)
        ? await invokeSajuAnalysisViaDirectFetch(analysisFunctionName, invokeBody, timeoutMs)
        : await withInvokeTimeout(
            supabase.functions.invoke(analysisFunctionName, {
              body: invokeBody,
              timeout: timeoutMs,
            }),
            timeoutMs,
          );

      if (!response?.error) {
        data = response.data;
        lastFailure = null;
        break;
      }

      const failure = classifySajuAnalysisFailure(response.error, response.data);
      lastFailure = failure;
      console.error(`Edge Function Error (${analysisFunctionName}):`, {
        attempt,
        traceId: failure.traceId ?? traceId,
        source,
        timeoutMs,
        timeoutClass: failure.classification,
        status: failure.status,
        code: failure.code,
        error: response.error,
        data: response.data,
      });

      if (shouldUseDirectFetchFallback(failure, source, req.serviceType)) {
        try {
          console.warn(`Direct fetch fallback started (${analysisFunctionName}):`, {
            attempt,
            traceId: failure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
          });
          const fallbackResponse = await invokeSajuAnalysisViaDirectFetch(analysisFunctionName, invokeBody, timeoutMs);
          if (!fallbackResponse.error) {
            data = fallbackResponse.data;
            lastFailure = null;
            break;
          }

          const fallbackFailure = classifySajuAnalysisFailure(fallbackResponse.error, fallbackResponse.data);
          lastFailure = fallbackFailure;
          console.error(`Direct fetch fallback failed (${analysisFunctionName}):`, {
            attempt,
            traceId: fallbackFailure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
            timeoutClass: fallbackFailure.classification,
            status: fallbackFailure.status,
            code: fallbackFailure.code,
            error: fallbackResponse.error,
            data: fallbackResponse.data,
          });

          if (
            attempt < SAJU_ANALYSIS_MAX_ATTEMPTS &&
            shouldRetrySajuAnalysisFailure(fallbackFailure, source, req.serviceType)
          ) {
            await wait(SAJU_ANALYSIS_RETRY_DELAY_MS);
            continue;
          }

          break;
        } catch (fallbackError) {
          console.error(`Direct fetch fallback threw (${analysisFunctionName}):`, {
            attempt,
            traceId: failure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
            error: fallbackError,
          });
        }
      }

      if (attempt < SAJU_ANALYSIS_MAX_ATTEMPTS && shouldRetrySajuAnalysisFailure(failure, source, req.serviceType)) {
        await wait(SAJU_ANALYSIS_RETRY_DELAY_MS);
        continue;
      }

      break;
    } catch (error) {
      const failure = classifySajuAnalysisFailure(error);
      lastFailure = failure;
      console.error(`Edge Function Error (${analysisFunctionName}):`, {
        attempt,
        traceId: failure.traceId ?? traceId,
        source,
        timeoutMs,
        timeoutClass: failure.classification,
        status: failure.status,
        code: failure.code,
        error,
      });

      if (shouldUseDirectFetchFallback(failure, source, req.serviceType)) {
        try {
          console.warn(`Direct fetch fallback started (${analysisFunctionName}):`, {
            attempt,
            traceId: failure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
          });
          const fallbackResponse = await invokeSajuAnalysisViaDirectFetch(analysisFunctionName, invokeBody, timeoutMs);
          if (!fallbackResponse.error) {
            data = fallbackResponse.data;
            lastFailure = null;
            break;
          }

          const fallbackFailure = classifySajuAnalysisFailure(fallbackResponse.error, fallbackResponse.data);
          lastFailure = fallbackFailure;
          console.error(`Direct fetch fallback failed (${analysisFunctionName}):`, {
            attempt,
            traceId: fallbackFailure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
            timeoutClass: fallbackFailure.classification,
            status: fallbackFailure.status,
            code: fallbackFailure.code,
            error: fallbackResponse.error,
            data: fallbackResponse.data,
          });

          if (
            attempt < SAJU_ANALYSIS_MAX_ATTEMPTS &&
            shouldRetrySajuAnalysisFailure(fallbackFailure, source, req.serviceType)
          ) {
            await wait(SAJU_ANALYSIS_RETRY_DELAY_MS);
            continue;
          }

          break;
        } catch (fallbackError) {
          console.error(`Direct fetch fallback threw (${analysisFunctionName}):`, {
            attempt,
            traceId: failure.traceId ?? traceId,
            source,
            serviceType: req.serviceType,
            timeoutMs,
            error: fallbackError,
          });
        }
      }

      if (attempt < SAJU_ANALYSIS_MAX_ATTEMPTS && shouldRetrySajuAnalysisFailure(failure, source, req.serviceType)) {
        await wait(SAJU_ANALYSIS_RETRY_DELAY_MS);
        continue;
      }

      break;
    }
  }

  if (lastFailure) {
    throw toSajuAnalysisError("사주 분석 데이터를 불러오는 데 실패했습니다.", lastFailure, source, traceId);
  }

  try {
    if (req.serviceType === "traditional-saju") {
      return parseTraditionalAnalysisPayload(data, req.serviceType);
    }
    if (isNewYear2026SajuService(req.serviceType)) {
      return parseNewYear2026AnalysisPayload(data, req.serviceType, req);
    }
    if (!isSpecializedSajuService(req.serviceType)) {
      throw new Error(`unsupported service type: ${req.serviceType}`);
    }
    if (req.serviceType === "saju-lifetime-roadmap") {
      return parseLifetimeAnalysisPayload(data, req);
    }
    return parseSajuPayloadByService(data, req.serviceType, req);
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

// ---------------------------------------------------------------------------
// Chat (만세력 상담형 채팅)
// ---------------------------------------------------------------------------

export const sendChatMessage = async (req: ChatRequest): Promise<ChatResponse> => {
  ensureConfigured();

  const traceId = req.requestMeta?.traceId?.trim() || createTraceId();
  const invokeBody: ChatRequest = {
    ...req,
    requestMeta: {
      ...req.requestMeta,
      traceId,
    },
  };
  const startedAt = Date.now();

  console.info("[chat:start]", {
    traceId,
    messageLength: req.message.length,
    historyCount: req.conversationHistory.length,
  });

  let data: unknown = null;
  let selectedTransport: ChatTransport | null = null;
  const transportOrder: ChatTransport[] = shouldUseDirectFetchPrimaryForChat()
    ? ["direct-fetch"]
    : ["invoke", "direct-fetch"];

  for (let index = 0; index < transportOrder.length; index += 1) {
    const transport = transportOrder[index];
    const isFinalTransport = index === transportOrder.length - 1;

    try {
      const response = await invokeChatByTransport(transport, invokeBody);
      if (!response.error) {
        data = response.data;
        selectedTransport = transport;
        break;
      }

      const failure = classifySajuAnalysisFailure(response.error, response.data);
      if (transport === "invoke" && !isFinalTransport && shouldUseDirectFetchFallbackForChat(failure)) {
        console.warn("[chat:fallback]", {
          traceId: failure.traceId ?? traceId,
          elapsedMs: Date.now() - startedAt,
          from: "invoke",
          to: "direct-fetch",
          timeoutClass: failure.classification,
          status: failure.status,
          code: failure.code,
        });
        continue;
      }

      const nextError = toChatInvokeError("AI 상담 응답을 불러오는 데 실패했습니다.", failure, traceId);
      console.error("[chat:failed]", {
        traceId: nextError.traceId,
        elapsedMs: Date.now() - startedAt,
        transport,
        timeoutClass: nextError.timeoutClass,
        status: nextError.status,
        code: nextError.code,
        error: response.error,
        data: response.data,
      });
      throw nextError;
    } catch (error) {
      if (error instanceof Error && typeof (error as { timeoutClass?: unknown }).timeoutClass === "string") {
        throw error;
      }

      const failure = classifySajuAnalysisFailure(error);
      if (transport === "invoke" && !isFinalTransport && shouldUseDirectFetchFallbackForChat(failure)) {
        console.warn("[chat:fallback]", {
          traceId: failure.traceId ?? traceId,
          elapsedMs: Date.now() - startedAt,
          from: "invoke",
          to: "direct-fetch",
          timeoutClass: failure.classification,
          status: failure.status,
          code: failure.code,
        });
        continue;
      }

      const nextError = toChatInvokeError("AI 상담 응답을 불러오는 데 실패했습니다.", failure, traceId);
      console.error("[chat:failed]", {
        traceId: nextError.traceId,
        elapsedMs: Date.now() - startedAt,
        transport,
        timeoutClass: nextError.timeoutClass,
        status: nextError.status,
        code: nextError.code,
        error,
      });
      throw nextError;
    }
  }

  if (selectedTransport === null) {
    const nextError = new Error("AI 상담 응답을 불러오는 데 실패했습니다.");
    console.error("[chat:failed]", {
      traceId,
      elapsedMs: Date.now() - startedAt,
      timeoutClass: "other" as ChatTimeoutClass,
      error: "missing-transport-result",
    });
    throw nextError;
  }

  const errorMessage = parseErrorPayload(data);
  if (errorMessage) {
    const payload = parseStructuredErrorPayload(data);
    console.error("[chat:failed]", {
      traceId: payload?.traceId ?? traceId,
      elapsedMs: Date.now() - startedAt,
      timeoutClass: "other" as ChatTimeoutClass,
      status: payload?.code === EDGE_UPSTREAM_TIMEOUT_CODE ? 504 : undefined,
      code: payload?.code,
      errorMessage,
      data,
    });
    throw new Error(errorMessage);
  }

  const parsed = parseJsonPayload<ChatResponse>(data);
  if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
    console.error("[chat:failed]", {
      traceId,
      elapsedMs: Date.now() - startedAt,
      timeoutClass: "other" as ChatTimeoutClass,
      error: "invalid-chat-shape",
      data,
    });
    throw new Error("AI 상담 결과 형식이 올바르지 않습니다.");
  }

  console.info("[chat:completed]", {
    traceId,
    elapsedMs: Date.now() - startedAt,
    transport: selectedTransport,
    replyLength: parsed.reply.length,
  });

  return {
    reply: parsed.reply,
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    followUpSuggestions: Array.isArray(parsed.followUpSuggestions) ? parsed.followUpSuggestions : [],
    quota:
      parsed.quota &&
      typeof parsed.quota === "object" &&
      typeof parsed.quota.remaining === "number" &&
      typeof parsed.quota.total === "number" &&
      typeof parsed.quota.charged === "boolean"
        ? {
            remaining: parsed.quota.remaining,
            total: parsed.quota.total,
            charged: parsed.quota.charged,
            nextFreeResetAt:
              typeof parsed.quota.nextFreeResetAt === "string"
                ? parsed.quota.nextFreeResetAt
                : parsed.quota.nextFreeResetAt === null
                  ? null
                  : undefined,
          }
        : undefined,
  };
};

