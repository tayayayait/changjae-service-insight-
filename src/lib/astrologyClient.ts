import {
  AstrologyAspect,
  AstrologyBirthReportResult,
  AstrologyCalendarChoiceGuide,
  AstrologyCalendarExpertNote,
  AstrologyCalendarHighlight,
  AstrologyCalendarPhaseGuide,
  AstrologyCalendarResult,
  AstrologyRequest,
  AstrologyResult,
} from "@/types/result";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { normalizeAstrologyBirthReport } from "@/lib/astrologyReport";

const MAX_IMAGE_SIZE = 1024; // 이미지 최대 가로/세로 길이

const TODAY_HOROSCOPE_ATTEMPT_TIMEOUT_MS = 15_000;
const TODAY_HOROSCOPE_MAX_ATTEMPTS = 3;
const TODAY_HOROSCOPE_RETRY_DELAY_MS = 800;
const PALM_ANALYZE_TIMEOUT_MS = 35_000;
const PALM_QA_TIMEOUT_MS = 20_000;
const BIRTH_REPORT_TIMEOUT_MS = 55_000;
const ASTROLOGY_SDK_WATCHDOG_MS = 15_000;
const ASTROLOGY_DIRECT_TIMEOUT_DEFAULT_MS = 30_000;
const KNOWN_SIMPLE_TODAY_FALLBACK = "Today is strongest when you keep one priority clear and avoid unnecessary expansion.";
const TODAY_REALTIME_UNAVAILABLE_MESSAGE = "실시간 운세를 아직 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const SIGN_KO_LABEL: Record<string, string> = {
  Aries: "양자리",
  Taurus: "황소자리",
  Gemini: "쌍둥이자리",
  Cancer: "게자리",
  Leo: "사자자리",
  Virgo: "처녀자리",
  Libra: "천칭자리",
  Scorpio: "전갈자리",
  Sagittarius: "사수자리",
  Capricorn: "염소자리",
  Aquarius: "물병자리",
  Pisces: "물고기자리",
};

type SignElement = "Fire" | "Earth" | "Air" | "Water";
type SignQuality = "Cardinal" | "Fixed" | "Mutable";

const SIGN_PROFILE: Record<string, { ko: string; element: SignElement; quality: SignQuality }> = {
  Aries: { ko: "양자리", element: "Fire", quality: "Cardinal" },
  Taurus: { ko: "황소자리", element: "Earth", quality: "Fixed" },
  Gemini: { ko: "쌍둥이자리", element: "Air", quality: "Mutable" },
  Cancer: { ko: "게자리", element: "Water", quality: "Cardinal" },
  Leo: { ko: "사자자리", element: "Fire", quality: "Fixed" },
  Virgo: { ko: "처녀자리", element: "Earth", quality: "Mutable" },
  Libra: { ko: "천칭자리", element: "Air", quality: "Cardinal" },
  Scorpio: { ko: "전갈자리", element: "Water", quality: "Fixed" },
  Sagittarius: { ko: "사수자리", element: "Fire", quality: "Mutable" },
  Capricorn: { ko: "염소자리", element: "Earth", quality: "Cardinal" },
  Aquarius: { ko: "물병자리", element: "Air", quality: "Fixed" },
  Pisces: { ko: "물고기자리", element: "Water", quality: "Mutable" },
};

type AstrologyAction =
  | "birth"
  | "birth_report"
  | "synastry"
  | "transit"
  | "ai_birth"
  | "ai_synastry"
  | "ai_transit"
  | "ai_calendar"
  | "ai_palm_qa"
  | "today"
  | "palm_analyze"
  | "palm_analyze_v2"
  | "ai_palm_qa_v2";

const ASTROLOGY_FUNCTION_BY_ACTION: Record<AstrologyAction, string> = {
  birth: "astrology-natal-api",
  birth_report: "astrology-natal-api",
  synastry: "astrology-natal-api",
  transit: "astrology-natal-api",
  ai_birth: "astrology-natal-api",
  ai_synastry: "astrology-natal-api",
  ai_transit: "astrology-natal-api",
  ai_calendar: "astrology-cosmic-api",
  ai_palm_qa: "palmistry-scanner-api",
  today: "astrology-daily-api",
  palm_analyze: "palmistry-scanner-api",
  palm_analyze_v2: "palmistry-scanner-api",
  ai_palm_qa_v2: "palmistry-scanner-api",
};

export type TodayHoroscopeMetaSource = "proxy" | "fallback" | "client_fallback";
export type TodayHoroscopeMetaReason =
  | "upstream_timeout"
  | "proxy_error"
  | "client_timeout"
  | "network_error"
  | "response_invalid"
  | "response_empty"
  | "unknown";
export type TodayHoroscopeMetaBasis = "sign_context" | "circular_natal_chart" | "rule_based";

export type TodayHoroscopeMeta = {
  source: TodayHoroscopeMetaSource;
  reason?: TodayHoroscopeMetaReason;
  basis?: TodayHoroscopeMetaBasis;
  requestDate?: string;
  engine?: string;
};

export type SunSignHoroscopeProfileContext = {
  year?: number;
  month?: number;
  day?: number;
  hour?: number | null;
  minute?: number | null;
  location?: string;
  tz?: string;
  birthTimeKnown?: boolean;
};

export type SunSignHoroscopeContext = {
  requestDate?: string;
  profile?: SunSignHoroscopeProfileContext;
};

export type SunSignHoroscopeResponse = {
  success: boolean;
  data: {
    sign: string;
    horoscope: string;
  };
  meta?: TodayHoroscopeMeta;
};

type PalmErrorCode =
  | "PALM_INPUT_INVALID"
  | "PALM_QUALITY_LOW"
  | "PALM_BACKEND_UNAVAILABLE"
  | "PALM_ANALYSIS_TIMEOUT";

type ParsedFunctionError = {
  message: string;
  code?: PalmErrorCode;
  status?: number;
  quality?: {
    overall?: number;
    reasons?: string[];
    hand_detected?: boolean;
    palm_centered?: boolean;
    blur_score?: number;
    exposure_score?: number;
  };
};

const RUNTIME_ENV = ((import.meta as unknown as { env?: Record<string, unknown> }).env ?? {}) as Record<string, unknown>;
const RUNTIME_SUPABASE_URL =
  typeof RUNTIME_ENV.VITE_SUPABASE_URL === "string" ? RUNTIME_ENV.VITE_SUPABASE_URL.trim() : "";
const RUNTIME_SUPABASE_ANON_KEY =
  typeof RUNTIME_ENV.VITE_SUPABASE_ANON_KEY === "string" ? RUNTIME_ENV.VITE_SUPABASE_ANON_KEY.trim() : "";
const RUNTIME_IS_DEV = Boolean(RUNTIME_ENV.DEV);
const IS_VITEST_RUNTIME = Boolean(RUNTIME_ENV.VITEST);
const IS_JSDOM_RUNTIME =
  typeof navigator !== "undefined" &&
  typeof navigator.userAgent === "string" &&
  navigator.userAgent.toLowerCase().includes("jsdom");
const DISABLE_ASTROLOGY_DIRECT_FETCH = IS_VITEST_RUNTIME || IS_JSDOM_RUNTIME;
const DEV_EDGE_PROXY_PREFIX = "/__supabase/functions/v1";
const IS_LOCALHOST_RUNTIME =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const USE_LOCAL_EDGE_PROXY = RUNTIME_IS_DEV && IS_LOCALHOST_RUNTIME;

const DIRECT_FETCH_TIMEOUT_BY_ACTION: Partial<Record<AstrologyAction, number>> = {
  birth: 22_000,
  birth_report: 50_000,
  ai_calendar: 25_000,
  today: 12_000,
  palm_analyze: 25_000,
  palm_analyze_v2: 25_000,
  ai_palm_qa: 20_000,
  ai_palm_qa_v2: 20_000,
};

const SDK_WATCHDOG_TIMEOUT_BY_ACTION: Partial<Record<AstrologyAction, number>> = {
  birth: 18_000,
  birth_report: 30_000,
  ai_calendar: 20_000,
  today: 10_000,
};

const resolveDirectFetchTimeoutMs = (action: AstrologyAction) =>
  DIRECT_FETCH_TIMEOUT_BY_ACTION[action] ?? ASTROLOGY_DIRECT_TIMEOUT_DEFAULT_MS;

const resolveSdkWatchdogTimeoutMs = (action: AstrologyAction) =>
  SDK_WATCHDOG_TIMEOUT_BY_ACTION[action] ?? ASTROLOGY_SDK_WATCHDOG_MS;

const DIRECT_FETCH_ONLY_ACTIONS = new Set<AstrologyAction>(["today"]);
const resolveEdgeFunctionEndpoint = (functionName: string) => {
  if (USE_LOCAL_EDGE_PROXY) {
    return `${DEV_EDGE_PROXY_PREFIX}/${functionName}`;
  }
  return `${RUNTIME_SUPABASE_URL.replace(/\/+$/, "")}/functions/v1/${functionName}`;
};

class AstrologyApiError extends Error {
  code?: PalmErrorCode;
  status?: number;
  quality?: ParsedFunctionError["quality"];

  constructor(parsed: ParsedFunctionError) {
    super(parsed.message);
    this.name = "AstrologyApiError";
    this.code = parsed.code;
    this.status = parsed.status;
    this.quality = parsed.quality;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const toPalmErrorCode = (value: unknown): PalmErrorCode | undefined => {
  if (
    value === "PALM_INPUT_INVALID" ||
    value === "PALM_QUALITY_LOW" ||
    value === "PALM_BACKEND_UNAVAILABLE" ||
    value === "PALM_ANALYSIS_TIMEOUT"
  ) {
    return value;
  }
  return undefined;
};

const parseFunctionError = (data: unknown): ParsedFunctionError | null => {
  if (!isRecord(data)) {
    return null;
  }

  const detail = isRecord(data.detail) ? data.detail : null;
  const quality = isRecord(data.quality)
    ? {
      overall: typeof data.quality.overall === "number" ? data.quality.overall : undefined,
      reasons: Array.isArray(data.quality.reasons) ? data.quality.reasons.filter((item): item is string => typeof item === "string") : undefined,
      hand_detected: typeof data.quality.hand_detected === "boolean" ? data.quality.hand_detected : undefined,
      palm_centered: typeof data.quality.palm_centered === "boolean" ? data.quality.palm_centered : undefined,
      blur_score: typeof data.quality.blur_score === "number" ? data.quality.blur_score : undefined,
      exposure_score: typeof data.quality.exposure_score === "number" ? data.quality.exposure_score : undefined,
    }
    : isRecord(detail?.quality)
      ? {
        overall: typeof detail.quality.overall === "number" ? detail.quality.overall : undefined,
        reasons: Array.isArray(detail.quality.reasons) ? detail.quality.reasons.filter((item): item is string => typeof item === "string") : undefined,
        hand_detected: typeof detail.quality.hand_detected === "boolean" ? detail.quality.hand_detected : undefined,
        palm_centered: typeof detail.quality.palm_centered === "boolean" ? detail.quality.palm_centered : undefined,
        blur_score: typeof detail.quality.blur_score === "number" ? detail.quality.blur_score : undefined,
        exposure_score: typeof detail.quality.exposure_score === "number" ? detail.quality.exposure_score : undefined,
      }
      : undefined;

  const message =
    (typeof data.error === "string" && data.error) ||
    (typeof data.message === "string" && data.message) ||
    (typeof data.detail === "string" && data.detail) ||
    (typeof detail?.message === "string" && detail.message) ||
    (typeof detail?.error === "string" && detail.error) ||
    "";

  if (!message) {
    return null;
  }

  const code =
    toPalmErrorCode(data.code) ??
    toPalmErrorCode(detail?.code);

  const status = typeof data.status === "number" ? data.status : undefined;

  return {
    message,
    code,
    status,
    quality,
  };
};

const parseInvokeError = async (error: unknown, functionName: string): Promise<ParsedFunctionError> => {
  const message =
    typeof error === "object" && error && "message" in error && typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  const context =
    typeof error === "object" && error && "context" in error
      ? (error as { context?: unknown }).context
      : undefined;

  if (context instanceof Response) {
    const status = context.status;
    const payload = await context.clone().json().catch(() => null);
    const parsed = parseFunctionError(payload);
    if (parsed) {
      return {
        ...parsed,
        status,
      };
    }

    if (status === 404) {
      return { message: `Supabase Edge Function ${functionName}가 배포되지 않았습니다.`, status };
    }
  }

  if (message.includes("404") || message.includes("Function not found")) {
    return { message: `Supabase Edge Function ${functionName}가 배포되지 않았습니다.` };
  }

  if (message.includes("timed out")) {
    return { message: "요청한 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요." };
  }

  return { message: message || "요청 처리에 실패했습니다." };
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, action: string): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`astrology ${action} timed out after ${Math.ceil(timeoutMs / 1000)}s`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const invokeAstrologyApiDirectFetch = async <T>(
  functionName: string,
  action: AstrologyAction,
  payload: unknown,
  timeoutMs: number,
): Promise<T> => {
  if (!RUNTIME_SUPABASE_URL || !RUNTIME_SUPABASE_ANON_KEY || typeof fetch !== "function") {
    throw new Error("direct_fetch_unavailable");
  }

  const endpoint = resolveEdgeFunctionEndpoint(functionName);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: RUNTIME_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${RUNTIME_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        payload,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!response.ok) {
      const detail = parseFunctionError(parsed);
      if (detail) {
        throw new AstrologyApiError({
          ...detail,
          status: detail.status ?? response.status,
        });
      }
      throw new AstrologyApiError({
        message: `Supabase Edge Function ${functionName} 호출 실패 (${response.status})`,
        status: response.status,
      });
    }

    const detail = parseFunctionError(parsed);
    if (detail) {
      throw new AstrologyApiError(detail);
    }

    return parsed as T;
  } catch (error) {
    if (error instanceof AstrologyApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`astrology ${action} timed out after ${Math.ceil(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

const invokeAstrologyApi = async <T>(action: AstrologyAction, payload: unknown): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  const functionName = ASTROLOGY_FUNCTION_BY_ACTION[action] ?? "astrology-daily-api";
  const endpoint = resolveEdgeFunctionEndpoint(functionName);
  const sdkWatchdogMs = resolveSdkWatchdogTimeoutMs(action);
  const directFetchTimeoutMs = resolveDirectFetchTimeoutMs(action);
  const shouldUseDirectFetchOnly = !DISABLE_ASTROLOGY_DIRECT_FETCH &&
    (DIRECT_FETCH_ONLY_ACTIONS.has(action) || USE_LOCAL_EDGE_PROXY);

  if (shouldUseDirectFetchOnly) {
    try {
      return await invokeAstrologyApiDirectFetch<T>(
        functionName,
        action,
        payload,
        directFetchTimeoutMs,
      );
    } catch (directError) {
      if (directError instanceof AstrologyApiError) {
        throw directError;
      }
      throw new AstrologyApiError(await parseInvokeError(directError, functionName));
    }
  }

  try {
    const invokePromise = supabase.functions.invoke(functionName, {
      body: {
        action,
        payload,
      },
    });
    const { data, error } = DISABLE_ASTROLOGY_DIRECT_FETCH
      ? await invokePromise
      : await withTimeout(
        invokePromise,
        sdkWatchdogMs,
        `${action}:sdk`,
      );

    if (error) {
      throw new AstrologyApiError(await parseInvokeError(error, functionName));
    }

    const detail = parseFunctionError(data);
    if (detail) {
      throw new AstrologyApiError(detail);
    }

    return data as T;
  } catch (sdkError) {
    if (DISABLE_ASTROLOGY_DIRECT_FETCH) {
      if (sdkError instanceof AstrologyApiError) {
        throw sdkError;
      }
      throw new AstrologyApiError(await parseInvokeError(sdkError, functionName));
    }

    if (sdkError instanceof AstrologyApiError && (sdkError.code || sdkError.status)) {
      throw sdkError;
    }

    console.warn("[Astrology API] SDK invoke failed. Retrying direct fetch.", {
      action,
      functionName,
      endpoint,
      error: sdkError instanceof Error ? sdkError.message : String(sdkError),
    });

    try {
      return await invokeAstrologyApiDirectFetch<T>(
        functionName,
        action,
        payload,
        directFetchTimeoutMs,
      );
    } catch (directError) {
      if (directError instanceof AstrologyApiError) {
        throw directError;
      }
      throw new AstrologyApiError(await parseInvokeError(directError, functionName));
    }
  }
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const toKstISODate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(date);

const DAILY_CITY_COORDS: Record<string, { lat: number; lng: number; tz: string }> = {
  서울: { lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
  부산: { lat: 35.1796, lng: 129.0756, tz: "Asia/Seoul" },
  대구: { lat: 35.8714, lng: 128.6014, tz: "Asia/Seoul" },
  인천: { lat: 37.4563, lng: 126.7052, tz: "Asia/Seoul" },
  광주: { lat: 35.1595, lng: 126.8526, tz: "Asia/Seoul" },
  대전: { lat: 36.3504, lng: 127.3845, tz: "Asia/Seoul" },
  울산: { lat: 35.5384, lng: 129.3114, tz: "Asia/Seoul" },
  제주: { lat: 33.4996, lng: 126.5312, tz: "Asia/Seoul" },
  Seoul: { lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
};

const resolveCoordinatesFromProfileLocation = (location?: string) => {
  const normalized = typeof location === "string" ? location.trim() : "";
  if (!normalized) {
    return { lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" };
  }
  return DAILY_CITY_COORDS[normalized] ?? { lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" };
};

const isTodayMetaSource = (value: unknown): value is TodayHoroscopeMetaSource =>
  value === "proxy" || value === "fallback" || value === "client_fallback";

const isTodayMetaReason = (value: unknown): value is TodayHoroscopeMetaReason =>
  value === "upstream_timeout" ||
  value === "proxy_error" ||
  value === "client_timeout" ||
  value === "network_error" ||
  value === "response_invalid" ||
  value === "response_empty" ||
  value === "unknown";

const isTodayMetaBasis = (value: unknown): value is TodayHoroscopeMetaBasis =>
  value === "sign_context" || value === "circular_natal_chart" || value === "rule_based";

const toOptionalMetaString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

const parseTodayMeta = (payload: unknown): TodayHoroscopeMeta | undefined => {
  if (!isRecord(payload)) return undefined;
  const meta = isRecord(payload.meta) ? payload.meta : null;
  if (!meta || !isTodayMetaSource(meta.source)) return undefined;
  return {
    source: meta.source,
    reason: isTodayMetaReason(meta.reason) ? meta.reason : undefined,
    basis: isTodayMetaBasis(meta.basis) ? meta.basis : undefined,
    requestDate: toOptionalMetaString(meta.requestDate),
    engine: toOptionalMetaString(meta.engine),
  };
};

const buildClientFallbackSunSignHoroscope = (signId: string): string => {
  const profile = SIGN_PROFILE[signId] ?? {
    ko: SIGN_KO_LABEL[signId] ?? "선택한 별자리",
    element: "Air" as const,
    quality: "Mutable" as const,
  };
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const elementFlow: Record<SignElement, string> = {
    Fire: "추진력은 강하지만 속도보다 기준이 먼저입니다. 시작 전에 완료 기준을 짧게 고정하면 성과가 선명해집니다.",
    Earth: "완성도와 안정적 실행이 강점입니다. 한 번에 많이 벌리기보다 현재 과제 마감 품질을 높일수록 흐름이 좋아집니다.",
    Air: "판단 속도와 정보 연결이 강합니다. 생각 분산을 막기 위해 오늘 질문 1개를 고정하면 집중 효율이 올라갑니다.",
    Water: "감정과 직관이 빠르게 작동합니다. 반응보다 기준을 먼저 문장으로 정리하면 흔들림 없이 진행할 수 있습니다.",
  };

  const oneLineConclusionByQuality: Record<SignQuality, string> = {
    Cardinal: "먼저 시작하되, 완료 기준을 분명히 적을수록 결과가 안정됩니다.",
    Fixed: "새로 벌리기보다 진행 중인 핵심 1개를 끝까지 밀어붙이는 날입니다.",
    Mutable: "선택지를 줄이고 우선순위를 명확히 할수록 실행력이 살아납니다.",
  };

  const doNowByQuality: Record<SignQuality, string> = {
    Cardinal: "지금 10분 안에 완료 기준 1문장을 적고, 핵심 작업 1개를 즉시 착수하세요.",
    Fixed: "핵심 작업 1개만 선택해 25분 집중 2회로 마무리하고 완료 체크를 남기세요.",
    Mutable: "할 일을 3개 이하로 제한한 뒤 1순위 작업을 30분 블록으로 먼저 끝내세요.",
  };

  const avoidByQuality: Record<SignQuality, string> = {
    Cardinal: "완료 기준이 없는 신규 요청을 오늘 일정에 바로 추가하지 마세요.",
    Fixed: "핵심 작업 완료 전에는 병렬 작업과 회의 추가를 금지하세요.",
    Mutable: "즉흥 요청은 최소 10분 검토 후 우선순위가 맞을 때만 수락하세요.",
  };

  const focusTimeByQuality: Record<SignQuality, string> = {
    Cardinal: "오전 09:00~11:00",
    Fixed: "오후 13:00~15:00",
    Mutable: "오후 16:00~18:00",
  };

  const relationTipByElement: Record<SignElement, string> = {
    Fire: "결론 전에 상대의 핵심 의도를 한 번 요약 확인하세요.",
    Earth: "조언보다 공감 문장 1개를 먼저 두면 대화가 부드러워집니다.",
    Air: "대화량은 충분합니다. 합의 문장을 남겨 오해를 줄이세요.",
    Water: "감정 반응이 올라오면 사실 확인 질문 1개를 먼저 던지세요.",
  };

  const conditionTipByElement: Record<SignElement, string> = {
    Fire: "휴식 슬롯 1개를 미리 확보하면 집중 유지가 쉽습니다.",
    Earth: "장시간 고정 자세를 피하고 짧은 스트레칭을 넣으세요.",
    Air: "알림 채널을 줄이고 단일 작업 블록을 확보하세요.",
    Water: "소모성 대화를 줄이고 회복 루틴을 먼저 배치하세요.",
  };

  const luckyColorByElement: Record<SignElement, string> = {
    Fire: "코랄 레드",
    Earth: "올리브 그린",
    Air: "스카이 블루",
    Water: "네이비",
  };

  const luckyKeywordByElement: Record<SignElement, string> = {
    Fire: "마감 기준",
    Earth: "완성도 점검",
    Air: "우선순위 정리",
    Water: "감정-사실 분리",
  };
  const focusTime = focusTimeByQuality[profile.quality];
  const executionChecklistByQuality: Record<SignQuality, string[]> = {
    Cardinal: [
      "지금 10분: 완료 기준 문장을 작성하고 첫 작업 파일을 열어 착수하세요.",
      `${focusTime}: 알림을 끄고 핵심 작업 1개만 처리하세요.`,
      "종료 점검: 완료 기준 충족 여부를 한 줄로 기록하세요.",
    ],
    Fixed: [
      "지금 10분: 핵심 작업 1개를 선택하고 불필요한 탭을 닫으세요.",
      `${focusTime}: 25분 집중 2회(총 50분)로 마무리하세요.`,
      "종료 점검: 결과물 링크 또는 산출물 1개를 남기세요.",
    ],
    Mutable: [
      "지금 10분: 오늘 할 일을 3개 이하로 줄이고 1순위를 고정하세요.",
      `${focusTime}: 30분 단일 집중 블록으로 1순위만 진행하세요.`,
      "종료 점검: 즉흥 요청 수락 여부를 우선순위 기준으로 재확인하세요.",
    ],
  };

  return [
    `### ${profile.ko} 오늘의 흐름`,
    `기준일: ${dateLabel} (KST)`,
    `${dateLabel} 운세 요약입니다. ${elementFlow[profile.element]}`,
    "",
    "### 오늘 한 줄 결론",
    oneLineConclusionByQuality[profile.quality],
    "",
    "### 지금 할 일 1개",
    doNowByQuality[profile.quality],
    "",
    "### 오늘 피할 일 1개",
    avoidByQuality[profile.quality],
    "",
    "### 오늘 즉시 실행 체크리스트",
    ...executionChecklistByQuality[profile.quality].map((item) => `- ${item}`),
    "",
    "### 집중 시간대",
    focusTime,
    "",
    "### 관계 한 문장",
    relationTipByElement[profile.element],
    "",
    "### 컨디션 한 문장",
    conditionTipByElement[profile.element],
    "",
    "### 럭키 포인트",
    `- 행운 컬러: ${luckyColorByElement[profile.element]}`,
    `- 행운 키워드: ${luckyKeywordByElement[profile.element]}`,
    "",
    "_안내: 서버 응답이 단순 형식으로 들어와 기본 리포트로 보정했습니다._",
  ].join("\n");
};

const toBirthRequestFromContext = (
  context?: SunSignHoroscopeContext,
): AstrologyRequest | null => {
  const profile = context?.profile;
  if (!profile) return null;
  if (
    typeof profile.year !== "number" ||
    typeof profile.month !== "number" ||
    typeof profile.day !== "number"
  ) {
    return null;
  }

  const hour = typeof profile.hour === "number" ? profile.hour : 12;
  const minute = typeof profile.minute === "number" ? profile.minute : 0;
  const hasExactTime = typeof profile.hour === "number" && typeof profile.minute === "number";
  const resolvedCoords = resolveCoordinatesFromProfileLocation(profile.location);

  return {
    year: profile.year,
    month: profile.month,
    day: profile.day,
    hour,
    minute,
    lat: resolvedCoords.lat,
    lng: resolvedCoords.lng,
    tz_str:
      typeof profile.tz === "string" && profile.tz.trim().length > 0
        ? profile.tz.trim()
        : resolvedCoords.tz,
    birthTimeKnown:
      profile.birthTimeKnown === true || hasExactTime,
  };
};

const resolveDominantElementFromChart = (chart: AstrologyResult): SignElement => {
  const winner = Object.entries(chart.elementDistribution ?? {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
  if (winner === "fire") return "Fire";
  if (winner === "earth") return "Earth";
  if (winner === "water") return "Water";
  return "Air";
};

const resolveDominantQualityFromChart = (chart: AstrologyResult): SignQuality => {
  const winner = Object.entries(chart.qualityDistribution ?? {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
  if (winner === "cardinal") return "Cardinal";
  if (winner === "fixed") return "Fixed";
  return "Mutable";
};

const buildCircularClientFallbackSunSignHoroscope = (
  signId: string,
  chart: AstrologyResult,
  requestDate?: string,
): string => {
  const profile = SIGN_PROFILE[signId] ?? {
    ko: SIGN_KO_LABEL[signId] ?? "선택한 별자리",
    element: "Air" as const,
    quality: "Mutable" as const,
  };
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const dominantElement = resolveDominantElementFromChart(chart);
  const dominantQuality = resolveDominantQualityFromChart(chart);
  const topAspect = Array.isArray(chart.aspects) && chart.aspects.length > 0
    ? [...chart.aspects].sort((a, b) => a.orb - b.orb)[0]
    : null;

  const elementFlow: Record<SignElement, string> = {
    Fire: "추진력이 강합니다. 속도보다 완료 기준을 먼저 고정할 때 실수가 줄어듭니다.",
    Earth: "안정적 실행이 강점입니다. 품질 기준을 명확히 하면 결과가 단단해집니다.",
    Air: "판단 속도가 빠릅니다. 선택지를 줄이고 단일 목표에 집중할수록 효율이 높아집니다.",
    Water: "직관이 빠릅니다. 감정 반응 전에 사실 확인 질문을 두면 흐름이 안정됩니다.",
  };

  const oneLineByQuality: Record<SignQuality, string> = {
    Cardinal: "빠르게 시작하되 완료 기준을 먼저 고정하면 결과가 안정됩니다.",
    Fixed: "핵심 과제 1개를 끝까지 밀어붙이는 전략이 유효합니다.",
    Mutable: "우선순위를 줄이고 순서를 고정할수록 실행력이 올라갑니다.",
  };

  const doNowByQuality: Record<SignQuality, string> = {
    Cardinal: "지금 10분 안에 완료 기준 1문장을 적고 핵심 작업 1개를 즉시 착수하세요.",
    Fixed: "핵심 작업 1개를 25분 집중 2회로 마무리하고 완료 로그를 남기세요.",
    Mutable: "오늘 할 일을 3개 이하로 줄인 뒤 1순위를 30분 블록으로 먼저 끝내세요.",
  };

  const avoidByQuality: Record<SignQuality, string> = {
    Cardinal: "완료 기준 없는 신규 요청을 일정에 즉시 추가하지 마세요.",
    Fixed: "핵심 작업 완료 전 병렬 작업과 회의 추가를 금지하세요.",
    Mutable: "즉흥 요청은 10분 검토 후 우선순위가 맞을 때만 수락하세요.",
  };

  const focusTimeByQuality: Record<SignQuality, string> = {
    Cardinal: "오전 09:00~11:00",
    Fixed: "오후 13:00~15:00",
    Mutable: "오후 16:00~18:00",
  };

  const relationTipByElement: Record<SignElement, string> = {
    Fire: "결론 전에 상대 의도를 한 줄로 요약 확인하세요.",
    Earth: "조언보다 공감 문장을 먼저 두면 갈등 비용이 줄어듭니다.",
    Air: "대화 후 합의 문장 1개를 남겨 오해를 줄이세요.",
    Water: "감정 반응 직후보다 사실 확인 질문을 먼저 던지세요.",
  };

  const conditionTipByElement: Record<SignElement, string> = {
    Fire: "집중 블록 사이 10분 회복 슬롯을 고정하세요.",
    Earth: "장시간 고정 자세를 피하고 짧은 스트레칭을 넣으세요.",
    Air: "알림 채널을 줄이고 단일 작업 블록을 확보하세요.",
    Water: "소모성 대화를 줄이고 회복 루틴을 먼저 배치하세요.",
  };

  const luckyColorByElement: Record<SignElement, string> = {
    Fire: "코랄 레드",
    Earth: "올리브 그린",
    Air: "스카이 블루",
    Water: "네이비",
  };

  const luckyKeywordByElement: Record<SignElement, string> = {
    Fire: "마감 기준",
    Earth: "완성도 점검",
    Air: "우선순위 정리",
    Water: "감정-사실 분리",
  };

  const focusTime = focusTimeByQuality[dominantQuality];
  const requestDateLine = requestDate ?? toKstISODate(new Date());
  const big3Line = `태양 ${chart.big3?.sun?.signKo ?? "-"} · 달 ${chart.big3?.moon?.signKo ?? "-"} · 상승궁 ${chart.big3?.rising?.signKo ?? "-"}`;
  const aspectLine = topAspect
    ? `${topAspect.planet1Ko}-${topAspect.planet2Ko} ${topAspect.aspectTypeKo}(${topAspect.orb.toFixed(1)}°)`
    : "주요 각도 데이터 없음";

  return [
    `### ${profile.ko} 오늘의 흐름`,
    `기준일: ${dateLabel} (KST)`,
    `기준 차트: ${big3Line}`,
    `핵심 각도: ${aspectLine}`,
    `${dateLabel}(${requestDateLine}) 기준 요약입니다. ${elementFlow[dominantElement]}`,
    "",
    "### 오늘 한 줄 결론",
    oneLineByQuality[dominantQuality],
    "",
    "### 지금 할 일 1개",
    doNowByQuality[dominantQuality],
    "",
    "### 오늘 피할 일 1개",
    avoidByQuality[dominantQuality],
    "",
    "### 오늘 즉시 실행 체크리스트",
    `- 지금 10분: ${doNowByQuality[dominantQuality]}`,
    `- ${focusTime}: 알림을 끄고 핵심 작업 1개만 처리하세요.`,
    `- 종료 점검: ${avoidByQuality[dominantQuality]}`,
    "",
    "### 집중 시간대",
    focusTime,
    "",
    "### 관계 한 문장",
    relationTipByElement[dominantElement],
    "",
    "### 컨디션 한 문장",
    conditionTipByElement[dominantElement],
    "",
    "### 럭키 포인트",
    `- 행운 컬러: ${luckyColorByElement[dominantElement]}`,
    `- 행운 키워드: ${luckyKeywordByElement[dominantElement]}`,
    "",
    "_안내: 실시간 응답 지연으로 CircularNatalHoroscopeJS 기반 보정 리포트를 제공했습니다._",
  ].join("\n");
};

const buildCircularClientFallbackSunSignHoroscopeResponse = async (
  signId: string,
  reason: TodayHoroscopeMetaReason,
  context?: SunSignHoroscopeContext,
): Promise<SunSignHoroscopeResponse | null> => {
  const birthRequest = toBirthRequestFromContext(context);
  if (!birthRequest) return null;

  try {
    const birthPayload = await withTimeout(
      invokeAstrologyApi<AstrologyResult>("birth", birthRequest),
      TODAY_HOROSCOPE_ATTEMPT_TIMEOUT_MS,
      "birth",
    );

    if (!birthPayload?.big3 || !birthPayload?.elementDistribution || !birthPayload?.qualityDistribution) {
      return null;
    }

    const requestDate = context?.requestDate ?? toKstISODate(new Date());
    return {
      success: true,
      data: {
        sign: signId,
        horoscope: buildCircularClientFallbackSunSignHoroscope(signId, birthPayload, requestDate),
      },
      meta: {
        source: "client_fallback",
        reason,
        basis: "circular_natal_chart",
        requestDate,
        engine: "CircularNatalHoroscopeJS@1.1.0+client_rules_v1",
      },
    };
  } catch (_error) {
    return null;
  }
};

const buildBestEffortSunSignFallback = async (
  signId: string,
  reason: TodayHoroscopeMetaReason,
  context?: SunSignHoroscopeContext,
): Promise<SunSignHoroscopeResponse> => {
  const circularFallback = await buildCircularClientFallbackSunSignHoroscopeResponse(signId, reason, context);
  if (circularFallback) return circularFallback;
  return buildClientFallbackSunSignHoroscopeResponse(signId, reason);
};

const buildClientFallbackSunSignHoroscopeResponse = (
  signId: string,
  reason: TodayHoroscopeMetaReason,
): SunSignHoroscopeResponse => ({
  success: true,
  data: {
    sign: signId,
    horoscope: buildClientFallbackSunSignHoroscope(signId),
  },
  meta: {
    source: "client_fallback",
    reason,
    basis: "rule_based",
    requestDate: toKstISODate(new Date()),
    engine: "client_rules_v1",
  },
});

const isRetryableTodayError = (error: unknown): boolean => {
  if (error instanceof AstrologyApiError && typeof error.status === "number") {
    return error.status >= 500;
  }

  const message =
    error instanceof Error ? error.message.toLowerCase() : "";

  return (
    message.includes("timed out") ||
    message.includes("지연") ||
    message.includes("실시간") ||
    message.includes("준비되지") ||
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("fetch")
  );
};

const resolveTodayFallbackReason = (error: unknown): TodayHoroscopeMetaReason => {
  const message =
    error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("timed out") || message.includes("지연")) return "client_timeout";
  if (
    message.includes("network") ||
    message.includes("failed to fetch") ||
    message.includes("network request failed") ||
    message.includes("fetch")
  ) {
    return "network_error";
  }
  if (message.includes("비어")) return "response_empty";
  if (message.includes("형식")) return "response_invalid";
  return "unknown";
};

const shouldReplaceSunSignHoroscope = (text: string): boolean => {
  const normalized = text.trim();
  if (!normalized) return true;
  if (normalized === KNOWN_SIMPLE_TODAY_FALLBACK) return true;

  const asciiOnlyLength = normalized.replace(/[^\p{ASCII}]/gu, "").length;
  const asciiRatio = asciiOnlyLength / normalized.length;
  return normalized.length < 90 && asciiRatio > 0.92;
};

const normalizeSunSignHoroscope = (
  payload: unknown,
  requestedSign: string,
): SunSignHoroscopeResponse => {
  if (!isRecord(payload)) {
    throw new Error("별자리 운세 응답 형식이 올바르지 않습니다.");
  }

  const data = isRecord(payload.data) ? payload.data : null;
  const rawHoroscope = data?.horoscope;
  if (typeof rawHoroscope !== "string" || rawHoroscope.trim().length === 0) {
    throw new Error("별자리 운세 결과가 비어 있습니다. 잠시 후 다시 시도해 주세요.");
  }

  const sign = typeof data?.sign === "string" && data.sign.trim().length > 0 ? data.sign.trim() : requestedSign;
  const normalizedHoroscope = rawHoroscope.trim();
  if (shouldReplaceSunSignHoroscope(normalizedHoroscope)) {
    throw new Error(TODAY_REALTIME_UNAVAILABLE_MESSAGE);
  }
  const serverMeta = parseTodayMeta(payload);
  if (serverMeta?.source && serverMeta.source !== "proxy") {
    throw new Error(TODAY_REALTIME_UNAVAILABLE_MESSAGE);
  }

  return {
    success: payload.success !== false,
    data: {
      sign,
      horoscope: normalizedHoroscope,
    },
    meta: serverMeta,
  };
};

const toNonEmptyString = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const clampScore = (value: unknown, fallback: number) => {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.min(100, Math.max(0, Math.round(score)));
};

const toIntValue = (value: unknown, fallback: number, min: number, max: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
};

const toImpact = (value: unknown): AstrologyCalendarPhaseGuide["impact"] => {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
};

const CALENDAR_CHOICE_IDS: AstrologyCalendarChoiceGuide["id"][] = ["career", "relationship", "energy", "money"];
const CALENDAR_PHASES: AstrologyCalendarPhaseGuide["phase"][] = ["early", "mid", "late"];

const toTrimmedStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
};

const requireRecord = (value: unknown, message: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(message);
  }
  return value;
};

const requireText = (value: unknown, message: string) => {
  if (typeof value !== "string") {
    throw new Error(message);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(message);
  }
  return trimmed;
};

const parseCalendarHighlights = (value: unknown): AstrologyCalendarHighlight[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("코스믹 이벤트 하이라이트가 누락되었습니다.");
  }
  const normalized = value
    .filter(isRecord)
    .map((item, index) => ({
      title: requireText(item.title, `코스믹 이벤트 하이라이트 제목(${index + 1})이 누락되었습니다.`),
      score: clampScore(item.score, 60),
      note: requireText(item.note, `코스믹 이벤트 하이라이트 설명(${index + 1})이 누락되었습니다.`),
    }))
    .slice(0, 4);
  if (normalized.length === 0) {
    throw new Error("코스믹 이벤트 하이라이트를 해석할 수 없습니다.");
  }
  return normalized;
};

const parseChoiceGuides = (value: unknown): AstrologyCalendarChoiceGuide[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("코스믹 이벤트 선택 가이드가 누락되었습니다.");
  }

  const byId = new Map<AstrologyCalendarChoiceGuide["id"], AstrologyCalendarChoiceGuide>();
  value.filter(isRecord).forEach((item) => {
    const id = item.id;
    if (id !== "career" && id !== "relationship" && id !== "energy" && id !== "money") return;
    byId.set(id, {
      id,
      title: requireText(item.title, `선택 가이드(${id}) 제목이 누락되었습니다.`),
      guidance: requireText(item.guidance, `선택 가이드(${id}) 설명이 누락되었습니다.`),
      recommendedAction: requireText(item.recommendedAction, `선택 가이드(${id}) 추천 행동이 누락되었습니다.`),
      avoidAction: requireText(item.avoidAction, `선택 가이드(${id}) 피할 선택이 누락되었습니다.`),
    });
  });

  const ordered = CALENDAR_CHOICE_IDS
    .map((id) => byId.get(id))
    .filter((guide): guide is AstrologyCalendarChoiceGuide => Boolean(guide));

  if (ordered.length !== CALENDAR_CHOICE_IDS.length) {
    throw new Error("코스믹 이벤트 선택 가이드 형식이 올바르지 않습니다.");
  }

  return ordered;
};

const parsePhaseGuides = (value: unknown): AstrologyCalendarPhaseGuide[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("코스믹 이벤트 시기별 가이드가 누락되었습니다.");
  }

  const byPhase = new Map<AstrologyCalendarPhaseGuide["phase"], AstrologyCalendarPhaseGuide>();
  value.filter(isRecord).forEach((item) => {
    const phase = item.phase;
    if (phase !== "early" && phase !== "mid" && phase !== "late") return;
    byPhase.set(phase, {
      phase,
      title: requireText(item.title, `시기 가이드(${phase}) 제목이 누락되었습니다.`),
      meaning: requireText(item.meaning, `시기 가이드(${phase}) 의미가 누락되었습니다.`),
      action: requireText(item.action, `시기 가이드(${phase}) 실행 문장이 누락되었습니다.`),
      impact: toImpact(item.impact),
    });
  });

  const ordered = CALENDAR_PHASES
    .map((phase) => byPhase.get(phase))
    .filter((guide): guide is AstrologyCalendarPhaseGuide => Boolean(guide));

  if (ordered.length !== CALENDAR_PHASES.length) {
    throw new Error("코스믹 이벤트 시기별 가이드 형식이 올바르지 않습니다.");
  }

  return ordered;
};

const parseExpertNotes = (value: unknown): AstrologyCalendarExpertNote[] => {
  if (!Array.isArray(value)) {
    throw new Error("코스믹 이벤트 전문가 해석 필드가 누락되었습니다.");
  }
  return value
    .filter(isRecord)
    .map((item) => ({
      label: requireText(item.label, "전문가 해석 label이 누락되었습니다."),
      plainMeaning: requireText(item.plainMeaning, "전문가 해석 plainMeaning이 누락되었습니다."),
      sourceType: requireText(item.sourceType, "전문가 해석 sourceType이 누락되었습니다."),
    }))
    .slice(0, 12);
};

const parseCalendarDeepData = (
  deepDataInput: unknown,
  year: number,
  month: number,
): AstrologyCalendarDeepData => {
  const deepData = requireRecord(deepDataInput, "코스믹 이벤트 deepData가 누락되었습니다.");
  const sourceNotes = toTrimmedStringList(deepData.sourceNotes);
  if (sourceNotes.length === 0) {
    throw new Error("코스믹 이벤트 sourceNotes가 누락되었습니다.");
  }

  const generationMode = deepData.generationMode;
  if (generationMode !== "deterministic") {
    throw new Error("코스믹 이벤트 generationMode가 deterministic이 아닙니다.");
  }

  const calculationBasis = requireText(deepData.calculationBasis, "코스믹 이벤트 calculationBasis가 누락되었습니다.");
  if (calculationBasis !== "CircularNatalHoroscopeJS@1.1.0") {
    throw new Error("코스믹 이벤트 calculationBasis 값이 올바르지 않습니다.");
  }
  const analysisWindowRaw = requireRecord(deepData.analysisWindow, "코스믹 이벤트 analysisWindow가 누락되었습니다.");
  const birthTimeAccuracy = deepData.birthTimeAccuracy;
  if (birthTimeAccuracy !== "known" && birthTimeAccuracy !== "unknown") {
    throw new Error("코스믹 이벤트 birthTimeAccuracy 값이 올바르지 않습니다.");
  }

  const phaseBucketsRaw = analysisWindowRaw.phaseBuckets;
  if (!Array.isArray(phaseBucketsRaw) || phaseBucketsRaw.length !== 3) {
    throw new Error("코스믹 이벤트 analysisWindow.phaseBuckets 형식이 올바르지 않습니다.");
  }
  const phaseBuckets = phaseBucketsRaw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  if (
    phaseBuckets.length !== 3 ||
    phaseBuckets[0] !== "1-10" ||
    phaseBuckets[1] !== "11-20" ||
    phaseBuckets[2] !== "21-end"
  ) {
    throw new Error("코스믹 이벤트 analysisWindow.phaseBuckets 값이 올바르지 않습니다.");
  }

  return {
    sourceNotes,
    rawReport: typeof deepData.rawReport === "string" ? deepData.rawReport : undefined,
    transits: Array.isArray(deepData.transits) ? deepData.transits : undefined,
    generationMode,
    calculationBasis,
    analysisWindow: {
      year: toIntValue(analysisWindowRaw.year, year, 2000, 2100),
      month: toIntValue(analysisWindowRaw.month, month, 1, 12),
      daysAnalyzed: toIntValue(analysisWindowRaw.daysAnalyzed, 0, 28, 31),
      transitTime: (() => {
        if (analysisWindowRaw.transitTime !== "12:00") {
          throw new Error("코스믹 이벤트 analysisWindow.transitTime 값이 올바르지 않습니다.");
        }
        return "12:00";
      })(),
      phaseBuckets: ["1-10", "11-20", "21-end"],
    },
    birthTimeAccuracy,
  };
};

const normalizeAstrologyCalendar = (payload: unknown, year: number, month: number): AstrologyCalendarResult => {
  if (!isRecord(payload)) {
    throw new Error("코스믹 이벤트 응답이 비어 있습니다.");
  }
  if (payload.success === false) {
    throw new Error(toNonEmptyString(payload.error, "코스믹 이벤트 생성에 실패했습니다."));
  }

  const summary = requireRecord(payload.summary, "코스믹 이벤트 summary가 누락되었습니다.");
  const priorityActions = toTrimmedStringList(payload.priorityActions);
  if (priorityActions.length === 0) {
    throw new Error("코스믹 이벤트 행동 가이드가 누락되었습니다.");
  }
  const avoidList = toTrimmedStringList(payload.avoidList);
  if (avoidList.length === 0) {
    throw new Error("코스믹 이벤트 피해야 할 선택이 누락되었습니다.");
  }

  return {
    success: payload.success !== false,
    year: toIntValue(payload.year, year, 2000, 2100),
    month: toIntValue(payload.month, month, 1, 12),
    summary: {
      headline: requireText(summary.headline, "코스믹 이벤트 headline이 누락되었습니다."),
      focus: requireText(summary.focus, "코스믹 이벤트 focus가 누락되었습니다."),
      caution: requireText(summary.caution, "코스믹 이벤트 caution이 누락되었습니다."),
    },
    highlights: parseCalendarHighlights(payload.highlights),
    priorityActions,
    choiceGuides: parseChoiceGuides(payload.choiceGuides),
    phaseGuides: parsePhaseGuides(payload.phaseGuides),
    avoidList,
    expertNotes: parseExpertNotes(payload.expertNotes),
    ...(isRecord(payload.userContext) ? { userContext: payload.userContext as unknown as AstrologyCalendarResult["userContext"] } : {}),
    deepData: parseCalendarDeepData(payload.deepData, year, month),
  };
};

export interface SynastryRequest {
  p1: AstrologyRequest;
  p2: AstrologyRequest;
}

export interface SynastryResult {
  success: boolean;
  data: {
    score: number;
    summary: string;
    positiveCount: number;
    negativeCount: number;
  };
  aspects: AstrologyAspect[];
  chartSvg: string;
}

export interface TransitResult {
  success: boolean;
  data: {
    summary: string;
    date: string;
  };
  transits: {
    natalPlanet: string;
    transitPlanet: string;
    natalKo: string;
    transitKo: string;
    aspectType: string;
    aspectTypeKo: string;
    influence: "positive" | "negative" | "neutral";
    interpretation: string;
  }[];
  chartSvg: string;
}

export interface PalmLineDetail {
  visible: boolean;
  length: "short" | "medium" | "long";
  depth: "shallow" | "medium" | "deep";
  curvature: "straight" | "slight" | "curved";
  breaks: number;
  branches: number;
  description: string;
}

export type PalmThickness = "thin" | "normal" | "thick";
export type PalmNailShape = "round" | "pointed" | "square" | "rectangular";

export interface PalmAnalyzeAuxiliaryInput {
  palmThickness: PalmThickness;
  nailShape: PalmNailShape;
}

export interface PalmOverlayPoint {
  x: number;
  y: number;
}

export interface PalmOverlayLine {
  points: PalmOverlayPoint[];
}

export interface PalmOverlayData {
  lines: Partial<Record<"heart" | "head" | "life" | "fate", PalmOverlayLine>>;
  labels: Partial<Record<"heart" | "head" | "life" | "fate", PalmOverlayPoint>>;
}

export interface PalmistryResult {
  classification: {
    palm_type: string;
    dominant_line?: string;
    confidence?: number;
  };
  interpretation: string;
  features?: Record<string, number>;
  lines?: {
    life: PalmLineDetail;
    heart: PalmLineDetail;
    head: PalmLineDetail;
    fate: PalmLineDetail;
  };
  sections?: {
    personality: { summary: string; details: string[] };
    wealth_career: { summary: string; details: string[] };
    relationship: { summary: string; details: string[] };
    timing: { summary: string; details: string[] };
  };
  overall_type?: string;
  dominant_line?: "Life" | "Heart" | "Head" | "Fate";
  confidence?: number;
  quality?: {
    overall: number;
    reasons: string[];
    hand_detected: boolean;
    palm_centered: boolean;
    blur_score: number;
    exposure_score: number;
  };
  overlay?: PalmOverlayData;
  handedness?: "left" | "right" | "unknown";
  elapsed_ms?: number;
}

const isPalmOverlayKey = (value: string): value is "heart" | "head" | "life" | "fate" =>
  value === "heart" || value === "head" || value === "life" || value === "fate";

const sanitizeOverlayPoint = (value: unknown): PalmOverlayPoint | null => {
  if (!isRecord(value)) return null;
  const x = typeof value.x === "number" ? value.x : Number(value.x);
  const y = typeof value.y === "number" ? value.y : Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
};

const sanitizeOverlayLines = (value: unknown): PalmOverlayData["lines"] => {
  if (!isRecord(value)) return {};
  const sanitized: PalmOverlayData["lines"] = {};

  for (const [key, lineValue] of Object.entries(value)) {
    if (!isPalmOverlayKey(key) || !isRecord(lineValue) || !Array.isArray(lineValue.points)) {
      continue;
    }

    const points = lineValue.points
      .map(sanitizeOverlayPoint)
      .filter((item): item is PalmOverlayPoint => item !== null);

    if (points.length < 2) {
      continue;
    }

    sanitized[key] = { points };
  }

  return sanitized;
};

const sanitizeOverlayLabels = (value: unknown): PalmOverlayData["labels"] => {
  if (!isRecord(value)) return {};
  const sanitized: PalmOverlayData["labels"] = {};

  for (const [key, labelValue] of Object.entries(value)) {
    if (!isPalmOverlayKey(key)) continue;
    const point = sanitizeOverlayPoint(labelValue);
    if (!point) continue;
    sanitized[key] = point;
  }

  return sanitized;
};

const normalizePalmistryResult = (result: PalmistryResult): PalmistryResult => {
  if (!isRecord(result)) {
    return result;
  }

  const overlayRaw = isRecord(result.overlay) ? result.overlay : null;
  if (!overlayRaw) {
    return result;
  }

  const lines = sanitizeOverlayLines(overlayRaw.lines);
  const labels = sanitizeOverlayLabels(overlayRaw.labels);
  const hasLines = Object.keys(lines).length > 0;
  const hasLabels = Object.keys(labels).length > 0;

  if (!hasLines && !hasLabels) {
    const nextResult = { ...result };
    delete nextResult.overlay;
    return nextResult;
  }

  return {
    ...result,
    overlay: {
      lines,
      labels,
    },
  };
};

export const getAstrologyChart = async (req: AstrologyRequest): Promise<AstrologyResult> => {
  try {
    return await invokeAstrologyApi<AstrologyResult>("birth", req);
  } catch (error) {
    console.error("Astrology API Error:", error);
    throw error;
  }
};

export const getAstrologyBirthReport = async (req: AstrologyRequest): Promise<AstrologyBirthReportResult> => {
  try {
    const payload = await withTimeout(
      invokeAstrologyApi<unknown>("birth_report", req),
      BIRTH_REPORT_TIMEOUT_MS,
      "birth_report",
    );
    return normalizeAstrologyBirthReport(payload, { birthTimeKnown: req.birthTimeKnown });
  } catch (error) {
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error("리포트 생성이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
    }
    console.error("Astrology Birth Report API Error:", error);
    throw error;
  }
};

export const getAstrologySynastry = async (req: SynastryRequest): Promise<SynastryResult> => {
  try {
    return await invokeAstrologyApi<SynastryResult>("synastry", req);
  } catch (error) {
    console.error("Synastry API Error:", error);
    throw error;
  }
};

export const getAstrologyTransit = async (req: AstrologyRequest): Promise<TransitResult> => {
  try {
    return await invokeAstrologyApi<TransitResult>("transit", req);
  } catch (error) {
    console.error("Transit API Error:", error);
    throw error;
  }
};

export const getAstrologyAIBirth = async (
  name: string,
  big3: unknown,
): Promise<{ success: boolean; report: string }> => invokeAstrologyApi("ai_birth", { name, big3 });

export const getAstrologyAISynastry = async (req: unknown): Promise<{ success: boolean; report: string }> =>
  invokeAstrologyApi("ai_synastry", req);

export const getAstrologyAITransit = async (
  name: string,
  transits: unknown[],
): Promise<{ success: boolean; report: string }> => invokeAstrologyApi("ai_transit", { name, transits });

export const getAstrologyAICalendar = async (
  year: number,
  month: number,
  profile?: AstrologyRequest,
): Promise<AstrologyCalendarResult> => {
  const payload = await invokeAstrologyApi<unknown>("ai_calendar", { year, month, profile });
  return normalizeAstrologyCalendar(payload, year, month);
};

export const getSunSignHoroscope = async (
  sign: string,
  context?: SunSignHoroscopeContext,
): Promise<SunSignHoroscopeResponse> => {
  let lastError: unknown = null;
  const requestPayload = context?.requestDate ? { sign, context: { requestDate: context.requestDate } } : { sign };

  for (let attempt = 1; attempt <= TODAY_HOROSCOPE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const responsePayload = await withTimeout(
        invokeAstrologyApi<unknown>("today", requestPayload),
        TODAY_HOROSCOPE_ATTEMPT_TIMEOUT_MS,
        "today",
      );
      const normalized = normalizeSunSignHoroscope(responsePayload, sign);
      return normalized;
    } catch (error) {
      lastError = error;

      const shouldRetry = attempt < TODAY_HOROSCOPE_MAX_ATTEMPTS && isRetryableTodayError(error);
      if (shouldRetry) {
        await wait(TODAY_HOROSCOPE_RETRY_DELAY_MS);
        continue;
      }
      break;
    }
  }

  if (lastError instanceof Error) {
    if (lastError.message === TODAY_REALTIME_UNAVAILABLE_MESSAGE) {
      throw lastError;
    }
  }

  throw new Error(TODAY_REALTIME_UNAVAILABLE_MESSAGE);
};

const resizeImageForUpload = (dataUrl: string, maxSize: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context not available"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
};

export const getPalmistryAnalysis = async (
  imageData: string,
  auxiliary?: PalmAnalyzeAuxiliaryInput,
): Promise<{ success: boolean; result: PalmistryResult }> => {
  try {
    const resizedImage = await resizeImageForUpload(imageData, MAX_IMAGE_SIZE);

    const response = await withTimeout(
      invokeAstrologyApi<{ success: boolean; result: PalmistryResult }>("palm_analyze_v2", {
        imageData: resizedImage,
        ...(auxiliary ? { auxiliary } : {}),
      }),
      PALM_ANALYZE_TIMEOUT_MS,
      "palm_analyze_v2",
    );

    if (!response?.result) {
      return response;
    }

    return {
      ...response,
      result: normalizePalmistryResult(response.result),
    };
  } catch (error) {
    if (error instanceof AstrologyApiError) {
      if (error.code === "PALM_INPUT_INVALID") {
        throw new Error("손바닥이 명확히 보이도록 다시 촬영해 주세요.");
      }
      if (error.code === "PALM_QUALITY_LOW") {
        const reasons = error.quality?.reasons?.length ? ` (${error.quality.reasons.join(", ")})` : "";
        throw new Error(`사진 품질이 낮아 분석할 수 없습니다. 밝은 조명에서 손바닥 전체를 중앙에 맞춰 다시 촬영해 주세요.${reasons}`);
      }
      if (error.code === "PALM_ANALYSIS_TIMEOUT") {
        throw new Error("손금 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      }
      if (error.code === "PALM_BACKEND_UNAVAILABLE") {
        throw new Error("손금 분석 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.");
      }
      throw new Error(error.message);
    }
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error("손금 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  }
};

export const askPalmistryQuestion = async (
  question: string,
  palmResult: PalmistryResult,
  scope: "summary" | "detailed" = "detailed",
): Promise<{ success: boolean; answer: string }> => {
  try {
    return await withTimeout(
      invokeAstrologyApi("ai_palm_qa_v2", { question, palmResult, scope }),
      PALM_QA_TIMEOUT_MS,
      "ai_palm_qa_v2",
    );
  } catch (error) {
    if (error instanceof AstrologyApiError) {
      throw new Error(error.message);
    }
    if (error instanceof Error && error.message.includes("timed out")) {
      throw new Error("AI 손금 답변 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw error;
  }
};
