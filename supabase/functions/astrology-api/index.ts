import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.14.0";
import { corsHeaders } from "../_shared/cors.ts";

type Action =
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
type TodayMetaReason = "upstream_timeout" | "proxy_error";
type Influence = "positive" | "negative" | "neutral";
type Quality = "Cardinal" | "Fixed" | "Mutable";
type Element = "Fire" | "Earth" | "Air" | "Water";
type CalendarImpact = "high" | "medium" | "low";
type AnyRecord = Record<string, unknown>;
type PalmErrorCode =
  | "PALM_INPUT_INVALID"
  | "PALM_QUALITY_LOW"
  | "PALM_BACKEND_UNAVAILABLE"
  | "PALM_ANALYSIS_TIMEOUT";

interface BirthDataRequest {
  name?: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lng: number;
  lat: number;
  tz_str: string;
  birthTimeKnown?: boolean;
}

interface CalendarRequest {
  year: number;
  month: number;
}

interface PalmAnalyzeRequest {
  imageData?: string;
  clientAnalysis?: {
    source?: string;
    handedness?: "left" | "right" | "unknown";
    quality?: {
      overall?: number;
      reasons?: string[];
      hand_detected?: boolean;
      palm_centered?: boolean;
      blur_score?: number;
      exposure_score?: number;
      palm_ratio?: number;
      rotation_score?: number;
    };
    features?: Record<string, number>;
    imageMeta?: {
      width?: number;
      height?: number;
    };
  };
}

interface PalmQaRequest {
  question: string;
  scope?: "summary" | "detailed";
  palmResult: {
    classification?: { palm_type?: string; dominant_line?: string; confidence?: number };
    interpretation?: string;
    features?: Record<string, number>;
    quality?: {
      overall?: number;
      reasons?: string[];
      hand_detected?: boolean;
      palm_centered?: boolean;
      blur_score?: number;
      exposure_score?: number;
    };
  };
}

interface Planet {
  name: string;
  nameKo: string;
  sign: string;
  signKo: string;
  element: Element;
  quality: Quality;
  house: number;
  degree: number;
  retrograde: boolean;
  interpretation: string;
  absPos: number;
}

interface BirthChartResponse {
  success: boolean;
  data: unknown;
  big3: {
    sun: Planet;
    moon: Planet;
    rising: { sign: string; signKo: string; element: Element; quality: Quality; degree: number; interpretation: string };
  };
  planets: Planet[];
  houses: Array<{ number: number; sign: string; signKo: string; degree: number; theme: string; themeDescription: string }>;
  aspects: Array<{ planet1: string; planet2: string; planet1Ko: string; planet2Ko: string; aspectType: string; aspectTypeKo: string; orb: number; influence: Influence; interpretation: string }>;
  elementDistribution: { fire: number; earth: number; air: number; water: number };
  qualityDistribution: { cardinal: number; fixed: number; mutable: number };
  chartSvg: string;
  chart_svg?: string;
}

const KERYKEION_API_URL = (Deno.env.get("KERYKEION_API_URL") ?? "").replace(/\/+$/, "");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const PROXY_TIMEOUT_MS = 20_000;
const TODAY_PROXY_TIMEOUT_MS = 8_000;

const SIGNS = [
  { id: "Aries", ko: "양자리", element: "Fire", quality: "Cardinal", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { id: "Taurus", ko: "황소자리", element: "Earth", quality: "Fixed", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { id: "Gemini", ko: "쌍둥이자리", element: "Air", quality: "Mutable", startMonth: 5, startDay: 21, endMonth: 6, endDay: 21 },
  { id: "Cancer", ko: "게자리", element: "Water", quality: "Cardinal", startMonth: 6, startDay: 22, endMonth: 7, endDay: 22 },
  { id: "Leo", ko: "사자자리", element: "Fire", quality: "Fixed", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { id: "Virgo", ko: "처녀자리", element: "Earth", quality: "Mutable", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { id: "Libra", ko: "천칭자리", element: "Air", quality: "Cardinal", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { id: "Scorpio", ko: "전갈자리", element: "Water", quality: "Fixed", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { id: "Sagittarius", ko: "사수자리", element: "Fire", quality: "Mutable", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  { id: "Capricorn", ko: "염소자리", element: "Earth", quality: "Cardinal", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { id: "Aquarius", ko: "물병자리", element: "Air", quality: "Fixed", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { id: "Pisces", ko: "물고기자리", element: "Water", quality: "Mutable", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
] as const;

const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
const PLANET_LABELS: Record<(typeof PLANETS)[number], string> = {
  Sun: "태양",
  Moon: "달",
  Mercury: "수성",
  Venus: "금성",
  Mars: "화성",
  Jupiter: "목성",
  Saturn: "토성",
  Uranus: "천왕성",
  Neptune: "해왕성",
  Pluto: "명왕성",
};
const HOUSE_THEMES = ["Identity", "Values", "Communication", "Home", "Creativity", "Health", "Relationships", "Transformation", "Growth", "Career", "Community", "Inner Life"] as const;
const ASPECTS = [
  { type: "Conjunction", angle: 0, maxOrb: 8, influence: "neutral" as Influence },
  { type: "Sextile", angle: 60, maxOrb: 6, influence: "positive" as Influence },
  { type: "Square", angle: 90, maxOrb: 6, influence: "negative" as Influence },
  { type: "Trine", angle: 120, maxOrb: 6, influence: "positive" as Influence },
  { type: "Opposition", angle: 180, maxOrb: 8, influence: "negative" as Influence },
];

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const toNum = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toInt = (value: unknown, fallback: number) => Math.trunc(toNum(value, fallback));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mod = (value: number, max: number) => ((value % max) + max) % max;
const isRecord = (value: unknown): value is AnyRecord => typeof value === "object" && value !== null;
const toText = (value: unknown, fallback: string) => typeof value === "string" && value.trim() ? value.trim() : fallback;
const toList = (value: unknown, fallback: string[]) => Array.isArray(value) ? value.map((v) => typeof v === "string" ? v.trim() : "").filter(Boolean) || fallback : fallback;
const toImpact = (value: unknown): CalendarImpact => value === "high" || value === "medium" || value === "low" ? value : "medium";
const hashString = (input: string) => Array.from(input).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) | 0), 0) >>> 0;
const angleDiff = (a: number, b: number) => { const d = Math.abs(a - b); return d > 180 ? 360 - d : d; };
const signIndexById = (id: string) => Math.max(0, SIGNS.findIndex((sign) => sign.id === id));
const signFromIndex = (index: number) => SIGNS[mod(index, SIGNS.length)];

const palmErrorResponse = (
  code: PalmErrorCode,
  message: string,
  status: number,
  extras?: Record<string, unknown>,
) => jsonResponse({ error: message, code, ...extras }, status);

const resolveSignByDate = (month: number, day: number) =>
  SIGNS.find((sign) => {
    if (sign.startMonth <= sign.endMonth) return (month > sign.startMonth || (month === sign.startMonth && day >= sign.startDay)) && (month < sign.endMonth || (month === sign.endMonth && day <= sign.endDay));
    return month > sign.startMonth || month < sign.endMonth || (month === sign.startMonth && day >= sign.startDay) || (month === sign.endMonth && day <= sign.endDay);
  }) ?? SIGNS[0];

const resolveSignByInput = (input: unknown) => {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return SIGNS[0];
  const lowered = raw.toLowerCase();
  return (
    SIGNS.find((sign) => sign.id.toLowerCase() === lowered || sign.ko === raw) ??
    SIGNS[0]
  );
};

const withTodayMeta = (payload: unknown, source: "proxy" | "fallback", reason?: TodayMetaReason) => {
  if (!isRecord(payload)) return payload;
  const meta = isRecord(payload.meta) ? payload.meta : {};
  return {
    ...payload,
    meta: {
      ...meta,
      source,
      ...(reason ? { reason } : {}),
    },
  };
};

const buildTodayHoroscopeFallback = (payload: { sign?: unknown }, reason: TodayMetaReason = "proxy_error") => {
  const sign = resolveSignByInput(payload?.sign);
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(new Date());

  const elementTheme: Record<Element, string> = {
    Fire: "추진력은 강하지만 속도가 빨라지면 실수가 늘어납니다. 먼저 기준을 정한 뒤 움직이면 성과가 선명해집니다.",
    Earth: "안정적 실행력이 강점입니다. 완성도를 지키되, 변화 신호를 놓치지 않도록 중간 점검을 끼워 넣는 것이 유리합니다.",
    Air: "정보 연결과 판단 속도가 강점입니다. 생각이 분산되지 않게 오늘의 핵심 질문 1개를 고정하면 효율이 올라갑니다.",
    Water: "감정과 직관이 예민하게 작동합니다. 상대 반응보다 먼저 내 기준을 문장으로 정리하면 흔들림이 줄어듭니다.",
  };

  const qualityAction: Record<Quality, string> = {
    Cardinal: "시작 에너지가 높은 날입니다. 착수는 빠르게, 마감 기준은 더 구체적으로 잡으세요.",
    Fixed: "지속력과 집중력이 강한 날입니다. 기존 루틴을 유지하되 우선순위 1개만 남겨 밀도를 높이세요.",
    Mutable: "전환 대응력이 좋은 날입니다. 즉흥 대응을 줄이고 체크리스트로 선택지를 줄이면 결과가 안정됩니다.",
  };

  const relationTipByElement: Record<Element, string> = {
    Fire: "의견을 강하게 밀어붙이기보다 결론 전에 상대 요약을 한 번 확인하세요.",
    Earth: "실용적 조언은 강점이지만, 오늘은 공감 문장 1개를 먼저 두는 편이 관계 비용을 줄입니다.",
    Air: "대화량은 충분하니 결론을 빠르게 내리기보다 핵심 합의 문장을 남기세요.",
    Water: "정서 반응이 빠를수록 사실 확인 질문 1개를 먼저 던지는 것이 좋습니다.",
  };

  const bodyTipByElement: Record<Element, string> = {
    Fire: "카페인이나 과한 일정 확장보다 휴식 슬롯 1개 확보가 컨디션 유지에 유리합니다.",
    Earth: "장시간 고정 자세를 피하고, 짧은 스트레칭을 분산 배치하면 집중력이 오래갑니다.",
    Air: "정보 과부하를 줄이기 위해 알림 채널을 줄이고 단일 작업 블록을 확보하세요.",
    Water: "감정 피로 누적이 쉬우니 소모성 대화 시간을 제한하고 회복 루틴을 먼저 배치하세요.",
  };

  const luckyColorByElement: Record<Element, string> = {
    Fire: "코랄 레드",
    Earth: "올리브 그린",
    Air: "스카이 블루",
    Water: "네이비",
  };

  const focusTimeByQuality: Record<Quality, string> = {
    Cardinal: "오전 09:00~11:00",
    Fixed: "오후 13:00~15:00",
    Mutable: "오후 16:00~18:00",
  };

  const oneLineActionByQuality: Record<Quality, string> = {
    Cardinal: "오늘 시작한 일은 '완료 기준 1문장'을 같이 적으세요.",
    Fixed: "진행 중인 일 하나를 끝까지 마무리하고 신규 착수는 최소화하세요.",
    Mutable: "결정 항목을 3개 이하로 줄여 실행 우선순위를 명확히 하세요.",
  };

  const avoidByQuality: Record<Quality, string> = {
    Cardinal: "완료 기준이 없는 신규 작업 시작은 피하세요.",
    Fixed: "핵심 작업이 끝나기 전 병렬 작업을 늘리지 마세요.",
    Mutable: "즉흥 요청을 바로 수락하지 말고 우선순위를 먼저 확인하세요.",
  };

  const luckyKeywordByElement: Record<Element, string> = {
    Fire: "마감 기준 설정",
    Earth: "완성도 점검",
    Air: "우선순위 정리",
    Water: "감정-사실 분리",
  };

  const markdown = [
    `### ${sign.ko} 오늘의 흐름`,
    `${dateLabel} 기준 운세입니다. ${elementTheme[sign.element as Element]}`,
    "",
    "### 오늘 한 줄 결론",
    `${qualityAction[sign.quality as Quality]}`,
    "",
    "### 지금 할 일 1개",
    `${oneLineActionByQuality[sign.quality as Quality]}`,
    "",
    "### 오늘 피할 일 1개",
    `${avoidByQuality[sign.quality as Quality]}`,
    "",
    "### 집중 시간대",
    `${focusTimeByQuality[sign.quality as Quality]}`,
    "",
    "### 관계 한 문장",
    `${relationTipByElement[sign.element as Element]}`,
    "",
    "### 컨디션 한 문장",
    `${bodyTipByElement[sign.element as Element]}`,
    "",
    "### 럭키 포인트",
    `- 행운 컬러: ${luckyColorByElement[sign.element as Element]}`,
    `- 행운 키워드: ${luckyKeywordByElement[sign.element as Element]}`,
    "",
    "_안내: 실시간 점성 데이터 연결이 불안정해 규칙 기반 리포트로 제공됩니다._",
  ].join("\n");

  return {
    success: true,
    data: {
      sign: sign.id,
      horoscope: markdown,
    },
    meta: {
      source: "fallback",
      reason,
    },
  };
};

const majorAspectForAngle = (angle: number) => {
  for (const aspect of ASPECTS) {
    const orb = Math.abs(angle - aspect.angle);
    if (orb <= aspect.maxOrb) return { ...aspect, orb };
  }
  return null;
};

const invokeKerykeion = async <T>(path: string, payload: unknown, timeoutMs = PROXY_TIMEOUT_MS): Promise<T> => {
  if (!KERYKEION_API_URL) throw new Error("KERYKEION_API_URL is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${KERYKEION_API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof data?.detail === "string" ? data.detail : typeof data?.error === "string" ? data.error : `HTTP ${response.status}`);
    return data as T;
  } finally {
    clearTimeout(timeout);
  }
};

const buildLocalBirthChart = (req: BirthDataRequest): BirthChartResponse => {
  const safe = { name: req.name?.trim() || "User", year: clamp(toInt(req.year, 2000), 1900, 2100), month: clamp(toInt(req.month, 1), 1, 12), day: clamp(toInt(req.day, 1), 1, 31), hour: clamp(toInt(req.hour, 12), 0, 23), minute: clamp(toInt(req.minute, 0), 0, 59), lat: toNum(req.lat, 37.5665), lng: toNum(req.lng, 126.978), tz_str: req.tz_str || "Asia/Seoul" };
  const seed = hashString(`${safe.name}|${safe.year}|${safe.month}|${safe.day}|${safe.hour}|${safe.minute}|${safe.lat}|${safe.lng}|${safe.tz_str}`);
  const sunSign = resolveSignByDate(safe.month, safe.day);
  const moonSign = signFromIndex(seed + safe.day + safe.month * 2);
  const risingSign = signFromIndex(Math.floor((safe.hour * 60 + safe.minute + safe.lng) / 120));
  const risingIdx = signIndexById(risingSign.id);
  const planets: Planet[] = PLANETS.map((name, index) => {
    const sign = name === "Sun" ? sunSign : name === "Moon" ? moonSign : signFromIndex(seed + index * 7 + safe.day + safe.hour);
    const degree = Number((((seed + (index + 1) * 137) % 3000) / 100).toFixed(2));
    const house = mod(signIndexById(sign.id) - risingIdx, 12) + 1;
    return { name, nameKo: PLANET_LABELS[name], sign: sign.id, signKo: sign.ko, element: sign.element, quality: sign.quality, house, degree, retrograde: name !== "Sun" && name !== "Moon" ? mod(seed + index, 9) === 0 : false, interpretation: `${PLANET_LABELS[name]}이 ${sign.ko}에 위치해 ${sign.element.toLowerCase()} 원소와 ${sign.quality.toLowerCase()} 성향을 강조합니다.`, absPos: Number((signIndexById(sign.id) * 30 + degree).toFixed(2)) };
  });
  const aspects: BirthChartResponse["aspects"] = [];
  for (let i = 0; i < planets.length; i += 1) for (let j = i + 1; j < planets.length; j += 1) {
    const aspect = majorAspectForAngle(angleDiff(planets[i].absPos, planets[j].absPos));
    if (!aspect) continue;
    aspects.push({ planet1: planets[i].name, planet2: planets[j].name, planet1Ko: planets[i].nameKo, planet2Ko: planets[j].nameKo, aspectType: aspect.type, aspectTypeKo: aspect.type, orb: Number(aspect.orb.toFixed(2)), influence: aspect.influence, interpretation: `${planets[i].nameKo}과 ${planets[j].nameKo}이 ${aspect.type} 각을 형성합니다.` });
  }
  aspects.sort((a, b) => a.orb - b.orb);
  const elementDistribution = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityDistribution = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const planet of planets) { elementDistribution[planet.element.toLowerCase() as keyof typeof elementDistribution] += 1; qualityDistribution[planet.quality.toLowerCase() as keyof typeof qualityDistribution] += 1; }
  const houses = Array.from({ length: 12 }, (_, index) => { const sign = signFromIndex(risingIdx + index); return { number: index + 1, sign: sign.id, signKo: sign.ko, degree: Number(((index * 2.7 + 1.4) % 30).toFixed(2)), theme: HOUSE_THEMES[index], themeDescription: `${index + 1}하우스는 ${HOUSE_THEMES[index].toLowerCase()} 주제를 강조합니다.` }; });
  const sun = planets.find((planet) => planet.name === "Sun") ?? planets[0];
  const moon = planets.find((planet) => planet.name === "Moon") ?? planets[1];
  const big3 = { sun, moon, rising: { sign: risingSign.id, signKo: risingSign.ko, element: risingSign.element, quality: risingSign.quality, degree: Number(((safe.hour * 2.4 + safe.minute / 25) % 30).toFixed(2)), interpretation: `상승궁은 ${risingSign.ko} 방식으로 드러납니다.` } };
  const chartSvg = `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg"><rect width="340" height="340" fill="#f8fafc"/><circle cx="170" cy="170" r="130" fill="none" stroke="#334155" stroke-width="2"/><circle cx="170" cy="170" r="90" fill="none" stroke="#94a3b8" stroke-width="1.2"/><text x="170" y="42" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">${safe.name}</text><text x="170" y="66" text-anchor="middle" font-size="12" fill="#475569">Fallback Natal Snapshot</text><text x="170" y="150" text-anchor="middle" font-size="12" fill="#334155">태양 ${big3.sun.signKo}</text><text x="170" y="170" text-anchor="middle" font-size="12" fill="#334155">달 ${big3.moon.signKo}</text><text x="170" y="190" text-anchor="middle" font-size="12" fill="#334155">상승궁 ${big3.rising.signKo}</text></svg>`;
  return { success: true, data: { sun: { sign: sun.sign, element: sun.element, quality: sun.quality }, moon: { sign: moon.sign, element: moon.element, quality: moon.quality }, first_house: { sign: big3.rising.sign } }, big3, planets, houses, aspects: aspects.slice(0, 14), elementDistribution, qualityDistribution, chartSvg };
};

const buildBirthReport = (birth: BirthChartResponse, birthTimeKnown: boolean, aiNarrative: string | null) => {
  const positives = birth.aspects.filter((aspect) => aspect.influence === "positive").length;
  const negatives = birth.aspects.filter((aspect) => aspect.influence === "negative").length;
  const dominantElement = Object.entries(birth.elementDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fire";
  const dominantQuality = Object.entries(birth.qualityDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cardinal";
  const baseScore = clamp(58 + positives * 5 - negatives * 4, 35, 90);
  const quarterFlow = ["이번 달", "다음 달", "3개월 후"].map((label, index) => ({ label, focus: baseScore + (index === 0 ? 5 : index === 1 ? 0 : -4) >= 70 ? "핵심 우선순위 1개를 끝까지 밀어붙이는 편이 유리합니다." : "병렬 과제를 줄이고 한 방향으로 집중하는 편이 좋습니다.", caution: baseScore + (index === 0 ? 5 : index === 1 ? 0 : -4) < 60 ? "속도를 높이기보다 먼저 검증을 거치세요." : "흐름이 좋을수록 과도한 확장은 피하세요.", score: clamp(baseScore + (index === 0 ? 5 : index === 1 ? 0 : -4), 35, 95) }));
  return {
    success: true,
    generatedAt: new Date().toISOString(),
    summary: { keynote: `${birth.big3.sun.signKo} 태양, ${birth.big3.moon.signKo} 달, ${birth.big3.rising.signKo} 상승궁 조합은 의도와 감정, 실행의 속도 차이를 잘 관리할 때 가장 강하게 작동합니다.`, strengths: [`${dominantElement.toUpperCase()} 원소 비중이 높아 방향이 분명할 때 추진력이 살아납니다.`, `${dominantQuality.toUpperCase()} 성향이 강해 한 번 정한 계획을 밀고 가는 힘이 있습니다.`, `우호 각 ${positives}개와 긴장 각 ${negatives}개의 비율상, 집중만 유지되면 흐름은 충분히 관리 가능합니다.`], risks: ["동시에 너무 많은 목표를 벌리면 실행 품질이 빠르게 떨어집니다.", "감정 반응이 증거 확인보다 앞서면 해석 오류가 커질 수 있습니다.", "일과 관계의 경계가 흐려지면 피로가 누적되기 쉽습니다."], actionsNow: ["이번 달 핵심 목표는 1개만 남기세요.", "중요 결정 전 확인 질문 1개를 습관화하세요.", "실행 시간과 검토 시간을 분리해 운영하세요."] },
    chapters: [
      { id: "personality", title: "성향 분석", interpretation: "이 차트는 정체성, 감정 반응, 외부 표현의 간격을 의식적으로 조절할 때 가장 안정적으로 힘을 냅니다.", evidence: [`태양: ${birth.big3.sun.signKo}`, `달: ${birth.big3.moon.signKo}`, `상승궁: ${birth.big3.rising.signKo}`], actionGuide: ["중요 결정 전 의도-감정-행동 순서로 짧게 점검하세요.", "강점은 밀고 약점은 체크리스트로 보완하세요."], aiInsight: aiNarrative },
      { id: "relationship", title: "관계 분석", interpretation: "관계 성향은 달, 금성, 화성의 배치와 경계 설정 방식에서 뚜렷하게 드러납니다.", evidence: [`달: ${birth.big3.moon.signKo}`, `금성: ${birth.planets.find((planet) => planet.name === "Venus")?.signKo ?? "미확인"}`, `화성: ${birth.planets.find((planet) => planet.name === "Mars")?.signKo ?? "미확인"}`], actionGuide: ["관계의 기준과 경계를 직접 언어화하세요.", "감정적 결론보다 먼저 맥락을 수집하세요."] },
      { id: "timing", title: "시기 해석", interpretation: "이번 달의 리듬은 우호 각과 긴장 각의 비율, 그리고 차트의 주된 성질에 따라 달라집니다.", evidence: [`우호 각: ${positives}`, `긴장 각: ${negatives}`, `주도 성질: ${dominantQuality}`], actionGuide: ["실행 시간과 검토 시간을 분리하세요.", "마찰이 커질수록 먼저 범위를 줄이세요."] },
      { id: "future-flow", title: "미래 흐름", interpretation: "하루 단위 운보다 분기 단위 리듬을 읽는 편이 실제 행동 전략에 더 유효합니다.", evidence: quarterFlow.map((node) => `${node.label}: ${node.score}`), actionGuide: ["분기 목표를 월 단위로 쪼개세요.", "주의 구간에서는 실행보다 검증 비중을 높이세요."] },
    ],
    timing: { monthFocus: quarterFlow[0].focus, monthCaution: quarterFlow[0].caution, quarterFlow },
    deepData: { data: birth.data, big3: birth.big3, planets: birth.planets, houses: birth.houses, aspects: birth.aspects, elementDistribution: birth.elementDistribution, qualityDistribution: birth.qualityDistribution, chartSvg: birth.chartSvg, chart_svg: birth.chart_svg },
    confidence: { birthTimeKnown, level: birthTimeKnown ? "high" : "medium", message: birthTimeKnown ? "출생 시간이 포함되어 상승궁과 하우스 해석의 신뢰도가 높습니다." : "출생 시간이 없거나 대략값이라 상승궁과 하우스 해석은 중간 신뢰도로 처리됩니다." },
  };
};

const toFinite = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizePalmHandedness = (value: unknown): "left" | "right" | "unknown" =>
  value === "left" || value === "right" ? value : "unknown";

const normalizePalmFeatures = (input: unknown) => {
  if (!isRecord(input)) return {};
  return Object.fromEntries(
    Object.entries(input)
      .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
      .map(([key, value]) => [key, Number(value)]),
  );
};

const normalizePalmQuality = (input: unknown) => {
  const quality = isRecord(input) ? input : {};
  const reasons = Array.isArray(quality.reasons)
    ? quality.reasons
        .filter((reason): reason is string => typeof reason === "string")
        .map((reason) => reason.trim())
        .filter(Boolean)
    : [];

  return {
    overall: clamp(toFinite(quality.overall, 0), 0, 1),
    reasons,
    hand_detected: quality.hand_detected !== false,
    palm_centered: quality.palm_centered !== false,
    blur_score: clamp(toFinite(quality.blur_score, 0), 0, 1),
    exposure_score: clamp(toFinite(quality.exposure_score, 0), 0, 1),
    palm_ratio: clamp(toFinite(quality.palm_ratio, 0), 0, 1),
    rotation_score: clamp(toFinite(quality.rotation_score, 0), 0, 1),
  };
};

const dominantPalmLine = (features: Record<string, number>): "Life" | "Head" | "Heart" => {
  const life = toFinite(features.life_length, 0);
  const head = toFinite(features.head_length, 0);
  const heart = toFinite(features.heart_length, 0);

  const pairs: Array<{ key: "Life" | "Head" | "Heart"; value: number }> = [
    { key: "Life", value: life },
    { key: "Head", value: head },
    { key: "Heart", value: heart },
  ];
  pairs.sort((a, b) => b.value - a.value);
  return pairs[0].key;
};

const classifyPalmType = (
  features: Record<string, number>,
  dominantLine: "Life" | "Head" | "Heart",
) => {
  const life = toFinite(features.life_length, 0);
  const head = toFinite(features.head_length, 0);
  const heart = toFinite(features.heart_length, 0);
  const maxLine = Math.max(life, head, heart, 1);
  const minLine = Math.min(life, head, heart);
  const spreadRatio = (maxLine - minLine) / maxLine;

  if (spreadRatio <= 0.17) return "균형형";
  if (dominantLine === "Head") return "분석형";
  if (dominantLine === "Heart") return "관계형";
  return "실행형";
};

const buildPalmInterpretation = (
  palmType: string,
  dominantLine: "Life" | "Head" | "Heart",
  features: Record<string, number>,
  quality: ReturnType<typeof normalizePalmQuality>,
) => {
  const dominanceText =
    dominantLine === "Life"
      ? "생명선 지표가 상대적으로 길어 실행 지속성과 회복 탄력성이 강조됩니다."
      : dominantLine === "Head"
      ? "지능선 지표가 상대적으로 길어 판단 구조와 계획성이 강조됩니다."
      : "감정선 지표가 상대적으로 길어 관계 반응성과 공감 민감도가 강조됩니다.";
  const breakCount = Math.max(0, Math.round(toFinite(features.break_count, 0)));
  const curvature = Math.round(toFinite(features.curvature, 0));
  const qualityHint =
    quality.overall >= 0.7
      ? "사진 품질이 안정적이라 해석 신뢰도가 높은 편입니다."
      : "품질 점수가 중간 이하라 동일 조건 재촬영 후 비교 확인을 권장합니다.";

  return `${palmType} 유형으로 분류되었습니다. ${dominanceText} 분절 지표 ${breakCount}회, 곡률 지표 ${curvature} 기준으로 볼 때 단기 변화보다 반복 패턴 관찰이 유효합니다. ${qualityHint}`;
};

const buildPalmAnalyzeResponse = (payload: PalmAnalyzeRequest) => {
  if (!isRecord(payload?.clientAnalysis)) {
    return palmErrorResponse(
      "PALM_INPUT_INVALID",
      "clientAnalysis payload is required.",
      400,
    );
  }

  const clientAnalysis = payload.clientAnalysis;
  const quality = normalizePalmQuality(clientAnalysis.quality);
  const features = normalizePalmFeatures(clientAnalysis.features);

  if (!quality.hand_detected) {
    return palmErrorResponse(
      "PALM_INPUT_INVALID",
      "Hand not detected from uploaded image.",
      400,
      { quality },
    );
  }

  const hasCoreFeatures =
    Number.isFinite(features.life_length) &&
    Number.isFinite(features.head_length) &&
    Number.isFinite(features.heart_length);
  if (!hasCoreFeatures) {
    return palmErrorResponse(
      "PALM_INPUT_INVALID",
      "Palm feature extraction result is incomplete.",
      400,
      { quality },
    );
  }

  const qualityTooLow =
    quality.overall < 0.42 ||
    quality.blur_score < 0.25 ||
    quality.exposure_score < 0.2 ||
    !quality.palm_centered;
  if (qualityTooLow) {
    const reasons = [...quality.reasons];
    if (!quality.palm_centered) reasons.push("손바닥 중심 정렬이 맞지 않습니다.");
    if (quality.blur_score < 0.25) reasons.push("선명도가 낮습니다.");
    if (quality.exposure_score < 0.2) reasons.push("조명이 불안정합니다.");
    return palmErrorResponse(
      "PALM_QUALITY_LOW",
      "Image quality is too low for stable palm analysis.",
      422,
      {
        quality: {
          ...quality,
          reasons: Array.from(new Set(reasons)),
        },
      },
    );
  }

  const dominantLine = dominantPalmLine(features);
  const palmType = classifyPalmType(features, dominantLine);
  const featureConfidence = clamp(toFinite(features.confidence, quality.overall), 0, 1);
  const confidence = clamp(quality.overall * 0.7 + featureConfidence * 0.3, 0, 1);
  const interpretation = buildPalmInterpretation(palmType, dominantLine, features, quality);
  const handedness = normalizePalmHandedness(clientAnalysis.handedness);

  return jsonResponse({
    success: true,
    result: {
      classification: {
        palm_type: palmType,
        dominant_line: dominantLine,
        confidence: Number(confidence.toFixed(4)),
      },
      interpretation,
      features,
      quality,
      handedness,
    },
  });
};

const normalizePalmQaScope = (scope: unknown): "summary" | "detailed" | null =>
  scope === "summary" || scope === "detailed" ? scope : null;

const normalizePalmQaContext = (
  input: PalmQaRequest["palmResult"],
  scope: "summary" | "detailed",
) => {
  const features = isRecord(input?.features)
    ? Object.fromEntries(
        Object.entries(input.features)
          .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
          .map(([key, value]) => [key, Number(value)]),
      )
    : {};

  const baseContext = {
    classification: {
      palm_type: toText(input?.classification?.palm_type, "unclassified"),
      dominant_line:
        typeof input?.classification?.dominant_line === "string"
          ? input.classification.dominant_line
          : undefined,
      confidence:
        typeof input?.classification?.confidence === "number"
          ? Number(input.classification.confidence)
          : undefined,
    },
    interpretation: toText(input?.interpretation, ""),
    features,
    quality: {
      overall:
        typeof input?.quality?.overall === "number"
          ? Number(input.quality.overall)
          : undefined,
    },
  };

  if (scope === "detailed") {
    return baseContext;
  }

  return {
    classification: {
      palm_type: baseContext.classification.palm_type,
    },
    interpretation: baseContext.interpretation,
    features: {
      life_length: typeof features.life_length === "number" ? features.life_length : 0,
      head_length: typeof features.head_length === "number" ? features.head_length : 0,
      heart_length: typeof features.heart_length === "number" ? features.heart_length : 0,
    },
    quality: baseContext.quality,
  };
};

const buildPalmQaResponse = async (payload: PalmQaRequest) => {
  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  if (!question) throw new Error("Question is required.");
  if (question.length > 500) throw new Error("Question must be 500 characters or fewer.");

  const scope = normalizePalmQaScope(payload?.scope);
  if (!scope) throw new Error("Scope must be summary or detailed.");
  if (!isRecord(payload?.palmResult)) throw new Error("Palm result context is required.");
  const palmContext = normalizePalmQaContext(payload.palmResult, scope);

  if (!geminiClient) {
    return {
      success: true,
      answer: `현재 제공된 손금 지표 기준으로 질문에 답변합니다. 핵심 유형은 ${palmContext.classification.palm_type}이며, 분석 범위는 ${scope}입니다. 질문: "${question}"`,
    };
  }

  const model = geminiClient.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });
  const prompt = `You are a palm reading assistant.
Rules:
1) Answer only from provided context.
2) Do not fabricate details.
3) Keep answer concise in Korean (3 to 5 sentences).
4) End with one practical action item.
Return JSON only.

Palm context: ${JSON.stringify(palmContext)}
Scope: ${scope}
Question: ${question}
Schema: {"answer":"grounded answer"}`;
  const response = await model.generateContent(prompt);
  const rawText = response.response.text().trim();
  try {
    const parsed = JSON.parse(rawText) as { answer?: unknown };
    if (typeof parsed.answer === "string" && parsed.answer.trim()) return { success: true, answer: parsed.answer.trim() };
  } catch {}
  if (!rawText) throw new Error("AI answer generation failed.");
  return { success: true, answer: rawText };
};

const buildCalendarFallback = (request: CalendarRequest, rawReport?: string) => {
  const year = clamp(toInt(request?.year, new Date().getFullYear()), 2000, 2100);
  const month = clamp(toInt(request?.month, new Date().getMonth() + 1), 1, 12);
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const lines = typeof rawReport === "string" ? rawReport.split(/\r?\n/).map((line) => line.replace(/^[-*]\s*/, "").trim()).filter(Boolean) : [];
  return { success: true, year, month, summary: { headline: `${year}년 ${month}월은 확장보다 우선순위 재정렬이 필요한 달입니다.`, focus: lines[0] ?? "핵심 목표 1개를 정하고 주간 단위로 실행 흔적을 남기세요.", caution: lines[1] ?? "바빠 보이는 것과 실제 진전은 다를 수 있습니다." }, highlights: [{ title: "집중 구간", score: 78, note: lines[2] ?? "중순 전후가 실행과 마감에 유리합니다." }, { title: "주의 구간", score: 45, note: lines[3] ?? "후반부는 가속보다 검토가 더 중요합니다." }, { title: "관계 흐름", score: 69, note: "감정 반응보다 의도 확인이 더 효과적입니다." }, { title: "일과 재정", score: 66, note: "무리한 확장보다 리스크 통제가 유리합니다." }], events: [{ date: `${monthKey}-05`, title: "실행 드라이브", impact: "high", meaning: "멈춰 있던 과제를 다시 밀어붙이기 좋은 구간입니다.", action: "과제 1개를 정하고 48시간 안에 끝낼 기준을 만드세요." }, { date: `${monthKey}-14`, title: "관계 조정", impact: "medium", meaning: "소통이 급해질수록 오해 가능성이 높아집니다.", action: "결정 전 상대의 뜻을 한 번 더 확인하세요." }, { date: `${monthKey}-23`, title: "검토 주간", impact: "medium", meaning: "새 일을 늘리기보다 정리와 보완이 더 큰 가치를 만듭니다.", action: "미완료 작업을 줄이고 다음 달 핵심 1개만 남기세요." }], chapters: [{ id: "career", title: "일/커리어", interpretation: "이번 달은 여러 과제를 동시에 벌리는 것보다 단일 목표 집중이 더 효율적입니다.", actionGuide: ["핵심 지표 1개 고정", "주간 마감 기준 명시"] }, { id: "relationship", title: "관계", interpretation: "빠른 반응보다 맥락 확인 대화가 갈등 비용을 줄입니다.", actionGuide: ["확인 질문 1개 던지기", "감정과 요청을 분리하기"] }, { id: "energy", title: "감정/컨디션", interpretation: "후반부로 갈수록 피로 누적이 판단 왜곡으로 이어질 수 있습니다.", actionGuide: ["중요 일정 전 완충 시간 확보", "과부하 일정 1개 제거"] }, { id: "money", title: "재정/소비", interpretation: "지금은 공격적 확대보다 지출 통제와 누수 관리가 우선입니다.", actionGuide: ["고정비 점검", "즉흥 지출 규칙 세우기"] }], checklist: { do: ["핵심 목표 1개 유지", "주간 검토 시간 확보", "상대 의도 확인 후 반응하기"], dont: ["프로젝트 과도 확장", "검증 없는 즉시 결정", "과부하 상태 장시간 작업"] }, deepData: { sourceNotes: rawReport ? ["legacy ai_calendar report converted to structured payload"] : ["edge fallback structured payload"], rawReport } };
};

const normalizeCalendarPayload = (payload: unknown, request: CalendarRequest) => {
  if (!isRecord(payload)) return buildCalendarFallback(request);
  if (!(isRecord(payload.summary) && Array.isArray(payload.highlights) && Array.isArray(payload.events) && Array.isArray(payload.chapters) && isRecord(payload.checklist))) return buildCalendarFallback(request, typeof payload.report === "string" ? payload.report : undefined);
  const year = clamp(toInt(payload.year, request.year), 2000, 2100);
  const month = clamp(toInt(payload.month, request.month), 1, 12);
  return { success: payload.success !== false, year, month, summary: { headline: toText(payload.summary.headline, `${year}년 ${month}월 월간 흐름`), focus: toText(payload.summary.focus, "이번 달 핵심 우선순위를 분명히 유지하세요."), caution: toText(payload.summary.caution, "확장 전에 검증을 먼저 거치세요.") }, highlights: (payload.highlights as unknown[]).filter(isRecord).map((item, index) => ({ title: toText(item.title, `핵심 지표 ${index + 1}`), score: clamp(toInt(item.score, 60), 0, 100), note: toText(item.note, "이번 달 흐름을 다시 점검하세요.") })).slice(0, 4), events: (payload.events as unknown[]).filter(isRecord).map((item, index) => ({ date: toText(item.date, `event-${index + 1}`), title: toText(item.title, `이벤트 ${index + 1}`), impact: toImpact(item.impact), meaning: toText(item.meaning, "시기 변화의 의미를 관찰하세요."), action: toText(item.action, "실행할 행동 1개를 정하세요.") })).slice(0, 8), chapters: (payload.chapters as unknown[]).filter(isRecord).map((item) => ({ id: item.id === "career" || item.id === "relationship" || item.id === "energy" || item.id === "money" ? item.id : "career", title: toText(item.title, "영역 분석"), interpretation: toText(item.interpretation, "이번 달 해석 포인트를 점검하세요."), actionGuide: toList(item.actionGuide, ["핵심 행동 1개를 실행하세요."]) })).slice(0, 4), checklist: { do: toList(payload.checklist.do, ["핵심 목표 1개를 유지하세요."]), dont: toList(payload.checklist.dont, ["검증 없는 확장은 피하세요."]) }, deepData: { sourceNotes: isRecord(payload.deepData) ? toList(payload.deepData.sourceNotes, ["normalized ai_calendar payload"]) : ["normalized ai_calendar payload"], rawReport: typeof payload.report === "string" ? payload.report : undefined, transits: isRecord(payload.deepData) && Array.isArray(payload.deepData.transits) ? payload.deepData.transits : undefined } };
};

const proxyPathByAction: Partial<Record<Action, string>> = { birth: "/api/chart/birth", synastry: "/api/chart/synastry", transit: "/api/chart/transit", ai_birth: "/api/chart/ai/birth", ai_synastry: "/api/chart/ai/synastry", ai_transit: "/api/chart/ai/transit", today: "/api/chart/today" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);
  try {
    const body = await req.json();
    const action = body?.action as Action | undefined;
    const payload = body?.payload;
    if (!action) return jsonResponse({ error: "action is required" }, 400);

    if (action === "birth_report") {
      const birthPayload = payload as BirthDataRequest;
      let birth: BirthChartResponse;
      try { birth = await invokeKerykeion<BirthChartResponse>("/api/chart/birth", birthPayload); } catch { birth = buildLocalBirthChart(birthPayload); }
      let aiNarrative: string | null = null;
      try {
        const aiBirth = await invokeKerykeion<{ success: boolean; report?: string }>("/api/chart/ai/birth", { name: birthPayload?.name?.trim() || "User", big3: birth.big3 });
        aiNarrative = typeof aiBirth.report === "string" && aiBirth.report.trim() ? aiBirth.report : null;
      } catch {}
      return jsonResponse(buildBirthReport(birth, birthPayload?.birthTimeKnown ?? true, aiNarrative));
    }

    if (action === "palm_analyze") {
      const startedAt = Date.now();
      const response = buildPalmAnalyzeResponse(payload as PalmAnalyzeRequest);
      if (!response.ok) {
        return response;
      }

      const parsed = await response.clone().json().catch(() => null);
      if (!isRecord(parsed) || !isRecord(parsed.result)) {
        return palmErrorResponse(
          "PALM_BACKEND_UNAVAILABLE",
          "Palm analysis response serialization failed.",
          503,
        );
      }

      return jsonResponse({
        ...parsed,
        result: {
          ...parsed.result,
          elapsed_ms: Date.now() - startedAt,
        },
      });
    }

    if (action === "ai_palm_qa") {
      try {
        return jsonResponse(await buildPalmQaResponse(payload as PalmQaRequest));
      } catch (error) {
        return palmErrorResponse(
          "PALM_INPUT_INVALID",
          error instanceof Error ? error.message : "Palm QA request is invalid.",
          400,
        );
      }
    }

    if (action === "ai_calendar") {
      const calendarPayload = payload as CalendarRequest;
      try {
        const proxied = await invokeKerykeion<unknown>("/api/chart/ai/calendar", calendarPayload);
        return jsonResponse(normalizeCalendarPayload(proxied, calendarPayload));
      } catch {
        return jsonResponse(buildCalendarFallback(calendarPayload));
      }
    }

    const proxyPath = proxyPathByAction[action];
    if (!proxyPath) return jsonResponse({ error: `unsupported action: ${action}` }, 400);

    if (action === "today") {
      try {
        const proxied = await invokeKerykeion<unknown>(proxyPath, payload, TODAY_PROXY_TIMEOUT_MS);
        if (!isRecord(proxied)) {
          return jsonResponse(buildTodayHoroscopeFallback(payload as { sign?: unknown }, "proxy_error"));
        }
        return jsonResponse(withTodayMeta(proxied, "proxy"));
      } catch (error) {
        const reason: TodayMetaReason =
          error instanceof DOMException && error.name === "AbortError" ? "upstream_timeout" : "proxy_error";
        return jsonResponse(buildTodayHoroscopeFallback(payload as { sign?: unknown }, reason));
      }
    }

    try {
      return jsonResponse(await invokeKerykeion<unknown>(proxyPath, payload));
    } catch {
      if (action === "birth") return jsonResponse(buildLocalBirthChart(payload as BirthDataRequest));
      return jsonResponse({ error: "kerykeion proxy failed" }, 502);
    }
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "unknown error" }, 500);
  }
});
