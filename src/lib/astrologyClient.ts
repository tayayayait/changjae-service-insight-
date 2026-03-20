import {
  AstrologyAspect,
  AstrologyBirthReportResult,
  AstrologyCalendarChapter,
  AstrologyCalendarEvent,
  AstrologyCalendarHighlight,
  AstrologyCalendarResult,
  AstrologyRequest,
  AstrologyResult,
} from "@/types/result";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { normalizeAstrologyBirthReport } from "@/lib/astrologyReport";
import {
  analyzePalmImageClient,
  PalmClientAnalysisError,
  type PalmClientAnalysis,
} from "@/lib/palmLocalAnalyzer";

const TODAY_HOROSCOPE_ATTEMPT_TIMEOUT_MS = 10_000;
const TODAY_HOROSCOPE_MAX_ATTEMPTS = 2;
const TODAY_HOROSCOPE_RETRY_DELAY_MS = 300;
const PALM_ANALYZE_TIMEOUT_MS = 25_000;
const PALM_QA_TIMEOUT_MS = 20_000;
const BIRTH_REPORT_TIMEOUT_MS = 25_000;
const KNOWN_SIMPLE_TODAY_FALLBACK = "Today is strongest when you keep one priority clear and avoid unnecessary expansion.";

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
  | "palm_analyze";

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

export type TodayHoroscopeMeta = {
  source: TodayHoroscopeMetaSource;
  reason?: TodayHoroscopeMetaReason;
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

const invokeAstrologyApi = async <T>(action: AstrologyAction, payload: unknown): Promise<T> => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  const functionName = ASTROLOGY_FUNCTION_BY_ACTION[action] ?? "astrology-daily-api";

  const { data, error } = await supabase.functions.invoke(functionName, {
    body: {
      action,
      payload,
    },
  });

  if (error) {
    console.error("Astrology API invoke error:", error);
    throw new AstrologyApiError(await parseInvokeError(error, functionName));
  }

  const detail = parseFunctionError(data);
  if (detail) {
    throw new AstrologyApiError(detail);
  }

  return data as T;
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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

const parseTodayMeta = (payload: unknown): TodayHoroscopeMeta | undefined => {
  if (!isRecord(payload)) return undefined;
  const meta = isRecord(payload.meta) ? payload.meta : null;
  if (!meta || !isTodayMetaSource(meta.source)) return undefined;
  return {
    source: meta.source,
    reason: isTodayMetaReason(meta.reason) ? meta.reason : undefined,
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
    Cardinal: "착수 전 완료 기준 1문장을 적고 바로 시작하세요.",
    Fixed: "진행 중인 일 1개를 정해 끝까지 마무리하세요.",
    Mutable: "오늘 할 일을 3개 이하로 줄이고 순서를 고정하세요.",
  };

  const avoidByQuality: Record<SignQuality, string> = {
    Cardinal: "완료 기준 없이 신규 작업을 추가하지 마세요.",
    Fixed: "핵심 작업이 끝나기 전 병렬 작업을 늘리지 마세요.",
    Mutable: "즉흥 요청을 바로 수락하지 말고 우선순위부터 확인하세요.",
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

  return [
    `### ${profile.ko} 오늘의 흐름`,
    `${dateLabel} 기준 요약입니다. ${elementFlow[profile.element]}`,
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
    "### 집중 시간대",
    focusTimeByQuality[profile.quality],
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

  const asciiOnlyLength = normalized.replace(/[^\x00-\x7F]/g, "").length;
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
  const needsClientFallback = shouldReplaceSunSignHoroscope(normalizedHoroscope);
  const horoscope = needsClientFallback ? buildClientFallbackSunSignHoroscope(sign) : normalizedHoroscope;
  const serverMeta = parseTodayMeta(payload);

  return {
    success: payload.success !== false,
    data: {
      sign,
      horoscope,
    },
    meta: needsClientFallback
      ? {
          source: "client_fallback",
          reason: "response_invalid",
        }
      : serverMeta,
  };
};

const toNonEmptyString = (value: unknown, fallback: string) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const toStringList = (value: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(value)) return fallback;
  const mapped = value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
  return mapped.length > 0 ? mapped : fallback;
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

const toImpact = (value: unknown): AstrologyCalendarEvent["impact"] => {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
};

const parseLegacyReportLines = (report: string) =>
  report
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0);

const buildFallbackCalendar = (year: number, month: number, rawReport?: string): AstrologyCalendarResult => {
  const lines = rawReport ? parseLegacyReportLines(rawReport) : [];

  return {
    success: true,
    year,
    month,
    summary: {
      headline: `${year}년 ${month}월은 우선순위 재정렬이 필요한 달입니다.`,
      focus: lines[0] ?? "핵심 목표 1개를 명확히 고정하고 실행 리듬을 유지하세요.",
      caution: lines[1] ?? "과도한 일정 확장보다 검증과 마감 정리를 우선하세요.",
    },
    highlights: [
      { title: "집중 구간", score: 78, note: lines[2] ?? "중순 전후가 실행 성과를 만들기 좋습니다." },
      { title: "주의 구간", score: 46, note: lines[3] ?? "후반부에는 결정 속도보다 검증 품질이 중요합니다." },
      { title: "관계 흐름", score: 70, note: "감정 반응보다 사실 확인 대화가 관계 안정에 유리합니다." },
      { title: "일/재정 흐름", score: 67, note: "수익 확대보다 리스크 축소 전략이 효율적입니다." },
    ],
    events: [
      {
        date: `${year}-${String(month).padStart(2, "0")}-05`,
        title: "실행 드라이브",
        impact: "high",
        meaning: "진행이 멈췄던 과제를 다시 밀어붙이기 좋은 구간입니다.",
        action: "우선순위 1개에 집중해 48시간 내 완료 기준을 설정하세요.",
      },
      {
        date: `${year}-${String(month).padStart(2, "0")}-14`,
        title: "관계 조정",
        impact: "medium",
        meaning: "커뮤니케이션 오해 가능성이 높아집니다.",
        action: "결정 전에 상대 이해 내용을 한 문장으로 재확인하세요.",
      },
      {
        date: `${year}-${String(month).padStart(2, "0")}-23`,
        title: "검증 주간",
        impact: "medium",
        meaning: "확장보다 정리와 보완이 장기 성과에 유리합니다.",
        action: "미완료 목록을 줄이고 다음 달 핵심 1개만 남기세요.",
      },
    ],
    chapters: [
      {
        id: "career",
        title: "일/커리어",
        interpretation: "이번 달은 다중 과제보다 단일 목표 집중 전략의 효율이 높습니다.",
        actionGuide: ["핵심 KPI 1개 고정", "주간 마감 기준 명시"],
      },
      {
        id: "relationship",
        title: "관계",
        interpretation: "속도보다 맥락 확인 대화가 갈등 비용을 줄입니다.",
        actionGuide: ["결정 전 재확인 질문", "감정 표현과 요청을 분리"],
      },
      {
        id: "energy",
        title: "감정/컨디션",
        interpretation: "중반 이후 피로 누적 시 판단 편향이 커질 수 있습니다.",
        actionGuide: ["회의 전 10분 정리", "과부하 일정 1개 제거"],
      },
      {
        id: "money",
        title: "재정/소비",
        interpretation: "지출 통제와 작은 누수 차단이 수익 확대보다 우선입니다.",
        actionGuide: ["고정비 점검", "즉흥 소비 제한 규칙 설정"],
      },
    ],
    checklist: {
      do: ["핵심 목표 1개 고정", "주간 검증 슬롯 확보", "관계 대화 재확인 루틴 적용"],
      dont: ["동시 다중 프로젝트 확장", "검증 없는 즉시 의사결정", "피로 누적 상태 장시간 작업"],
    },
    deepData: rawReport
      ? {
          sourceNotes: ["legacy ai_calendar report string fallback"],
          rawReport,
        }
      : {
          sourceNotes: ["structured fallback generated in client"],
        },
  };
};

const normalizeCalendarHighlights = (value: unknown): AstrologyCalendarHighlight[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      title: toNonEmptyString(item.title, `핵심 지표 ${index + 1}`),
      score: clampScore(item.score, 60),
      note: toNonEmptyString(item.note, "이번 달 흐름을 점검하세요."),
    }))
    .slice(0, 4);
};

const normalizeCalendarEvents = (value: unknown): AstrologyCalendarEvent[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item, index) => ({
      date: toNonEmptyString(item.date, `event-${index + 1}`),
      title: toNonEmptyString(item.title, `이벤트 ${index + 1}`),
      impact: toImpact(item.impact),
      meaning: toNonEmptyString(item.meaning, "이번 시기의 변화를 관찰하세요."),
      action: toNonEmptyString(item.action, "우선순위 기준으로 행동을 줄이세요."),
    }))
    .slice(0, 8);
};

const normalizeCalendarChapters = (value: unknown): AstrologyCalendarChapter[] => {
  if (!Array.isArray(value)) return [];
  const defaultIds: AstrologyCalendarChapter["id"][] = ["career", "relationship", "energy", "money"];
  return value
    .filter(isRecord)
    .map((item, index) => {
      const id = item.id;
      const safeId = id === "career" || id === "relationship" || id === "energy" || id === "money" ? id : defaultIds[index] ?? "career";
      return {
        id: safeId,
        title: toNonEmptyString(item.title, "영역 분석"),
        interpretation: toNonEmptyString(item.interpretation, "이번 달 흐름을 점검하세요."),
        actionGuide: toStringList(item.actionGuide, ["핵심 행동 1개를 실행하세요."]),
      };
    })
    .slice(0, 4);
};

const normalizeAstrologyCalendar = (payload: unknown, year: number, month: number): AstrologyCalendarResult => {
  if (!isRecord(payload)) {
    return buildFallbackCalendar(year, month);
  }

  const legacyReport = typeof payload.report === "string" ? payload.report : undefined;
  const summary = isRecord(payload.summary) ? payload.summary : null;
  const highlights = normalizeCalendarHighlights(payload.highlights);
  const events = normalizeCalendarEvents(payload.events);
  const chapters = normalizeCalendarChapters(payload.chapters);
  const checklist = isRecord(payload.checklist) ? payload.checklist : null;

  const hasStructuredBlocks = summary && highlights.length > 0 && events.length > 0 && chapters.length > 0 && checklist;
  if (!hasStructuredBlocks) {
    return buildFallbackCalendar(year, month, legacyReport);
  }

  return {
    success: payload.success !== false,
    year: toIntValue(payload.year, year, 2000, 2100),
    month: toIntValue(payload.month, month, 1, 12),
    summary: {
      headline: toNonEmptyString(summary.headline, `${year}년 ${month}월 흐름`),
      focus: toNonEmptyString(summary.focus, "핵심 목표를 고정하세요."),
      caution: toNonEmptyString(summary.caution, "검증 없이 확장하지 마세요."),
    },
    highlights,
    events,
    chapters,
    checklist: {
      do: toStringList(checklist.do, ["핵심 목표 1개를 실행하세요."]),
      dont: toStringList(checklist.dont, ["과도한 일정 확장을 피하세요."]),
    },
    deepData: {
      sourceNotes: toStringList(isRecord(payload.deepData) ? payload.deepData.sourceNotes : null, [
        "normalized ai_calendar payload",
      ]),
      rawReport: legacyReport,
      transits: isRecord(payload.deepData) && Array.isArray(payload.deepData.transits) ? payload.deepData.transits : undefined,
    },
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

export interface PalmistryResult {
  classification: {
    palm_type: string;
    dominant_line?: string;
    confidence?: number;
  };
  interpretation: string;
  features: Record<string, number>;
  quality?: {
    overall: number;
    reasons: string[];
    hand_detected: boolean;
    palm_centered: boolean;
    blur_score: number;
    exposure_score: number;
  };
  handedness?: "left" | "right" | "unknown";
  elapsed_ms?: number;
}

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
): Promise<AstrologyCalendarResult> => {
  const payload = await invokeAstrologyApi<unknown>("ai_calendar", { year, month });
  return normalizeAstrologyCalendar(payload, year, month);
};

export const getSunSignHoroscope = async (
  sign: string,
): Promise<SunSignHoroscopeResponse> => {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= TODAY_HOROSCOPE_MAX_ATTEMPTS; attempt += 1) {
    try {
      const payload = await withTimeout(
        invokeAstrologyApi<unknown>("today", { sign }),
        TODAY_HOROSCOPE_ATTEMPT_TIMEOUT_MS,
        "today",
      );
      return normalizeSunSignHoroscope(payload, sign);
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

  return buildClientFallbackSunSignHoroscopeResponse(sign, resolveTodayFallbackReason(lastError));
};

export const getPalmistryAnalysis = async (
  imageData: string,
  options?: {
    clientAnalysis?: PalmClientAnalysis;
  },
): Promise<{ success: boolean; result: PalmistryResult }> => {
  try {
    const clientAnalysis =
      options?.clientAnalysis ??
      (await withTimeout(
        analyzePalmImageClient(imageData),
        PALM_ANALYZE_TIMEOUT_MS,
        "client_palm_analyze",
      ));

    return await withTimeout(
      invokeAstrologyApi("palm_analyze", { imageData, clientAnalysis }),
      PALM_ANALYZE_TIMEOUT_MS,
      "palm_analyze",
    );
  } catch (error) {
    if (error instanceof PalmClientAnalysisError) {
      if (error.code === "PALM_INPUT_INVALID") {
        throw new Error("손바닥이 명확히 보이도록 다시 촬영해 주세요.");
      }
      if (error.code === "PALM_QUALITY_LOW") {
        const reasons = error.quality?.reasons?.length ? ` (${error.quality.reasons.join(", ")})` : "";
        throw new Error(`사진 품질이 낮아 분석할 수 없습니다. 밝은 조명에서 손바닥 전체를 중앙에 맞춰 다시 촬영해 주세요.${reasons}`);
      }
      if (error.code === "PALM_BACKEND_UNAVAILABLE") {
        throw new Error("브라우저 손금 분석 엔진(MediaPipe)을 초기화하지 못했습니다. 네트워크 상태를 확인 후 다시 시도해 주세요.");
      }
      if (error.code === "PALM_ANALYSIS_TIMEOUT") {
        throw new Error("손금 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      }
      throw new Error(error.message);
    }

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
      invokeAstrologyApi("ai_palm_qa", { question, palmResult, scope }),
      PALM_QA_TIMEOUT_MS,
      "ai_palm_qa",
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
