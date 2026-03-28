type Element = "Fire" | "Earth" | "Air" | "Water";
type Quality = "Cardinal" | "Fixed" | "Mutable";
type Influence = "positive" | "negative" | "neutral";
type CalendarImpact = "high" | "medium" | "low";

type HoroscopeModule = {
  Origin: new (input: Record<string, unknown>) => unknown;
  Horoscope: new (input: Record<string, unknown>) => unknown;
};

type AnyRecord = Record<string, unknown>;

export type AstrologyRequestInput = {
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
};

export type AstrologySign = {
  id: string;
  ko: string;
  element: Element;
  quality: Quality;
  startMonth: number;
  startDay: number;
  endMonth: number;
  endDay: number;
};

export type NormalizedNatalPlanet = {
  name: string;
  nameKo: string;
  sign: string;
  signKo: string;
  element: Element;
  quality: Quality;
  house: number;
  degree: number;
  absPos: number;
  retrograde: boolean;
  interpretation: string;
};

export type NormalizedNatalHouse = {
  number: number;
  sign: string;
  signKo: string;
  degree: number;
  theme: string;
  themeDescription: string;
};

export type NormalizedNatalAspect = {
  planet1: string;
  planet2: string;
  planet1Ko: string;
  planet2Ko: string;
  aspectType: string;
  aspectTypeKo: string;
  orb: number;
  influence: Influence;
  interpretation: string;
};

export type NormalizedNatalChart = {
  meta: {
    source: "circular" | "fallback";
    name: string;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    birthTimeKnown: boolean;
    lat: number;
    lng: number;
    tz: string;
    generatedAt: string;
  };
  big3: {
    sun: NormalizedNatalPlanet;
    moon: NormalizedNatalPlanet;
    rising: {
      sign: string;
      signKo: string;
      element: Element;
      quality: Quality;
      degree: number;
      interpretation: string;
    };
  };
  planets: NormalizedNatalPlanet[];
  houses: NormalizedNatalHouse[];
  aspects: NormalizedNatalAspect[];
  elementDistribution: { fire: number; earth: number; air: number; water: number };
  qualityDistribution: { cardinal: number; fixed: number; mutable: number };
  chartSvg: string;
};

export type NormalizedTransit = {
  date: string;
  transitPlanet: string;
  transitPlanetKo: string;
  natalPlanet: string;
  natalPlanetKo: string;
  aspectType: string;
  orb: number;
  influence: Influence;
  impact: CalendarImpact;
  meaning: string;
  action: string;
  score: number;
};

export type NormalizedTransitMonth = {
  year: number;
  month: number;
  source: "circular" | "fallback";
  daysAnalyzed: number;
  transitTime: "12:00";
  phaseBuckets: ["1-10", "11-20", "21-end"];
  summarySeed: {
    score: number;
    positive: number;
    negative: number;
    dominantElement: string;
    dominantQuality: string;
  };
  transits: NormalizedTransit[];
  phaseTopTransits: Record<CalendarPhase, NormalizedTransit | null>;
};

type CalendarChoiceGuideId = "career" | "relationship" | "energy" | "money";
type CalendarPhase = "early" | "mid" | "late";

type CalendarSummary = {
  headline: string;
  focus: string;
  caution: string;
};

type CalendarHighlight = {
  title: string;
  score: number;
  note: string;
};

type CalendarChoiceGuide = {
  id: CalendarChoiceGuideId;
  title: string;
  guidance: string;
  recommendedAction: string;
  avoidAction: string;
};

type CalendarPhaseGuide = {
  phase: CalendarPhase;
  title: string;
  meaning: string;
  action: string;
  impact: CalendarImpact;
};

type CalendarExpertNote = {
  label: string;
  plainMeaning: string;
  sourceType: string;
};

type CalendarUserContext = {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dominantElement: string;
  dominantQuality: string;
  birthTimeKnown: boolean;
};

type CalendarGuideResult = {
  success: boolean;
  year: number;
  month: number;
  summary: CalendarSummary;
  highlights: CalendarHighlight[];
  priorityActions: string[];
  choiceGuides: CalendarChoiceGuide[];
  phaseGuides: CalendarPhaseGuide[];
  avoidList: string[];
  expertNotes: CalendarExpertNote[];
  userContext?: CalendarUserContext;
  deepData: {
    sourceNotes: string[];
    transits?: NormalizedTransit[];
    rawReport?: string;
    generationMode: "deterministic";
    calculationBasis: "CircularNatalHoroscopeJS@1.1.0";
    analysisWindow: {
      year: number;
      month: number;
      daysAnalyzed: number;
      transitTime: "12:00";
      phaseBuckets: ["1-10", "11-20", "21-end"];
    };
    birthTimeAccuracy: "known" | "unknown";
  };
};

export type AstrologyInterpretationContext = {
  birthTimeKnown: boolean;
  dominantElement: string;
  dominantQuality: string;
  positiveAspects: number;
  negativeAspects: number;
  big3: {
    sun: string;
    moon: string;
    rising: string;
  };
  topAspects: Array<{
    pair: string;
    type: string;
    influence: Influence;
    orb: number;
  }>;
  keyPlanets: Array<{
    name: string;
    sign: string;
    house: number;
    retrograde: boolean;
  }>;
};

export const SIGNS: AstrologySign[] = [
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
];

export const PLANETS = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;

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

const HOUSE_THEMES = [
  "Identity",
  "Values",
  "Communication",
  "Home",
  "Creativity",
  "Health",
  "Relationships",
  "Transformation",
  "Growth",
  "Career",
  "Community",
  "Inner Life",
] as const;

const ASPECTS = [
  { type: "Conjunction", angle: 0, maxOrb: 8, influence: "neutral" as Influence },
  { type: "Sextile", angle: 60, maxOrb: 6, influence: "positive" as Influence },
  { type: "Square", angle: 90, maxOrb: 6, influence: "negative" as Influence },
  { type: "Trine", angle: 120, maxOrb: 6, influence: "positive" as Influence },
  { type: "Opposition", angle: 180, maxOrb: 8, influence: "negative" as Influence },
];

const TRANSIT_PLANETS = ["Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"] as const;

const HOUSE_SYSTEM = "whole-sign";
const ZODIAC_SYSTEM = "tropical";

const DEFAULT_LAT = 37.5665;
const DEFAULT_LNG = 126.9780;
const DEFAULT_TZ = "Asia/Seoul";

const toNum = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const toInt = (value: unknown, fallback: number) => Math.trunc(toNum(value, fallback));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mod = (value: number, max: number) => ((value % max) + max) % max;
const isRecord = (value: unknown): value is AnyRecord => typeof value === "object" && value !== null;
const hashString = (input: string) => Array.from(input).reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) | 0), 0) >>> 0;
const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");

const toSignId = (value: unknown) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  const lowered = raw.toLowerCase();
  const byId = SIGNS.find((sign) => sign.id.toLowerCase() === lowered);
  if (byId) return byId.id;
  const byKo = SIGNS.find((sign) => sign.ko === raw);
  if (byKo) return byKo.id;
  const byKey = SIGNS.find((sign) => sign.id.toLowerCase() === lowered.replace(/\s+/g, ""));
  return byKey?.id ?? "";
};

const signFromId = (id: string) => SIGNS.find((sign) => sign.id === id) ?? SIGNS[0];
const signFromIndex = (index: number) => SIGNS[mod(index, SIGNS.length)];
const signIndexById = (id: string) => Math.max(0, SIGNS.findIndex((sign) => sign.id === id));

const angleDiff = (a: number, b: number) => {
  const diff = Math.abs(a - b);
  return diff > 180 ? 360 - diff : diff;
};

const majorAspectForAngle = (angle: number) => {
  for (const aspect of ASPECTS) {
    const orb = Math.abs(angle - aspect.angle);
    if (orb <= aspect.maxOrb) return { ...aspect, orb };
  }
  return null;
};

const normalizeSignFromMonthDay = (month: number, day: number) =>
  SIGNS.find((sign) => {
    if (sign.startMonth <= sign.endMonth) {
      return (
        (month > sign.startMonth || (month === sign.startMonth && day >= sign.startDay)) &&
        (month < sign.endMonth || (month === sign.endMonth && day <= sign.endDay))
      );
    }
    return (
      month > sign.startMonth ||
      month < sign.endMonth ||
      (month === sign.startMonth && day >= sign.startDay) ||
      (month === sign.endMonth && day <= sign.endDay)
    );
  }) ?? SIGNS[0];

const extractDecimalDegrees = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value.replace(/[^0-9.+-]/g, ""));
    if (Number.isFinite(numeric)) return numeric;
  }
  if (isRecord(value)) {
    const nested = extractDecimalDegrees(value.DecimalDegrees ?? value.decimalDegrees, Number.NaN);
    if (Number.isFinite(nested)) return nested;
  }
  return fallback;
};

const parseArcDegrees30 = (value: unknown, fallback = 0) => {
  if (typeof value === "string") {
    const match = value.match(/([-+]?\d+(?:\.\d+)?)/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
};

const inferImpactFromInfluence = (influence: Influence, orb: number): CalendarImpact => {
  if (influence === "positive") return orb <= 2 ? "high" : "medium";
  if (influence === "negative") return orb <= 2 ? "high" : "medium";
  return orb <= 2 ? "medium" : "low";
};

const mapAspectTypeKo = (type: string) => {
  if (type === "Conjunction") return "합";
  if (type === "Sextile") return "섹스타일";
  if (type === "Square") return "스퀘어";
  if (type === "Trine") return "트라인";
  if (type === "Opposition") return "대립";
  return type;
};

const relationTipByElement: Record<Element, string> = {
  Fire: "대화 전에 핵심 결론 한 문장을 먼저 전달하면 오해를 줄일 수 있습니다.",
  Earth: "사실 확인 질문을 먼저 하고 조언을 제시하면 관계 신뢰가 높아집니다.",
  Air: "긴 설명보다 합의 문장 한 줄을 먼저 만들면 갈등이 줄어듭니다.",
  Water: "감정 반응 직후에는 결론 대신 확인 질문 한 번이 효과적입니다.",
};

const conditionTipByElement: Record<Element, string> = {
  Fire: "시작 신호 1개를 정해두면 실행 지연을 줄일 수 있습니다.",
  Earth: "작업 도구와 자료를 분리 배치하면 집중 유지가 쉬워집니다.",
  Air: "알림 채널을 줄이고 단일 작업 블록을 확보하세요.",
  Water: "피로 신호를 기록해 두고 회복 루틴을 먼저 배치하세요.",
};

const oneLineByQuality: Record<Quality, string> = {
  Cardinal: "시작은 빠르니 마감 기준을 먼저 문장으로 고정하세요.",
  Fixed: "유지력은 강하니 이번 달 핵심 목표 1개에 자원을 집중하세요.",
  Mutable: "변화 대응이 강하니 선택지를 줄이고 우선순위를 고정하세요.",
};

const doNowByQuality: Record<Quality, string> = {
  Cardinal: "지금 10분 안에 완료 기준 1문장을 적고, 오늘 핵심 작업 1개를 시작하세요.",
  Fixed: "이번 달 작업 1개만 선택해 25분 집중 2회로 마무리하고 완료 체크를 기록하세요.",
  Mutable: "할 일을 3개 이하로 제한하고 1순위 작업을 30분 블록으로 먼저 끝내세요.",
};

const avoidByQuality: Record<Quality, string> = {
  Cardinal: "마감 기준 없는 신규 요청을 오늘 일정에 바로 추가하지 마세요.",
  Fixed: "핵심 작업 완료 전에 병렬 작업과 회의를 늘리지 마세요.",
  Mutable: "즉흥 요청은 최소 10분 검토 후 우선순위가 맞을 때만 수락하세요.",
};

const focusTimeByQuality: Record<Quality, string> = {
  Cardinal: "오전 09:00~11:00",
  Fixed: "오후 13:00~15:00",
  Mutable: "오후 16:00~18:00",
};

const luckyColorByElement: Record<Element, string> = {
  Fire: "코랄 레드",
  Earth: "올리브 그린",
  Air: "스카이 블루",
  Water: "네이비",
};

const luckyKeywordByElement: Record<Element, string> = {
  Fire: "마감 기준",
  Earth: "완성도 점검",
  Air: "우선순위 정리",
  Water: "감정-사실 분리",
};

let horoscopeModulePromise: Promise<HoroscopeModule | null> | null = null;

const loadHoroscopeModule = async (): Promise<HoroscopeModule | null> => {
  if (horoscopeModulePromise) {
    return horoscopeModulePromise;
  }

  horoscopeModulePromise = (async () => {
    try {
      const mod = await import("https://esm.sh/circular-natal-horoscope-js@1.1.0");
      const Origin = (mod as Record<string, unknown>).Origin ??
        (isRecord((mod as Record<string, unknown>).default) ? (mod as Record<string, unknown>).default.Origin : undefined);
      const Horoscope = (mod as Record<string, unknown>).Horoscope ??
        (isRecord((mod as Record<string, unknown>).default) ? (mod as Record<string, unknown>).default.Horoscope : undefined);

      if (typeof Origin !== "function" || typeof Horoscope !== "function") {
        return null;
      }

      return {
        Origin: Origin as HoroscopeModule["Origin"],
        Horoscope: Horoscope as HoroscopeModule["Horoscope"],
      };
    } catch (_error) {
      return null;
    }
  })();

  return horoscopeModulePromise;
};

const normalizeRequest = (input: Partial<AstrologyRequestInput>): AstrologyRequestInput => {
  const year = clamp(toInt(input.year, 1995), 1900, 2100);
  const month = clamp(toInt(input.month, 1), 1, 12);
  const day = clamp(toInt(input.day, 1), 1, 31);
  const birthTimeKnown = input.birthTimeKnown !== false;
  const hour = clamp(toInt(input.hour, birthTimeKnown ? 12 : 12), 0, 23);
  const minute = clamp(toInt(input.minute, 0), 0, 59);

  return {
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim() : "User",
    year,
    month,
    day,
    hour,
    minute,
    lat: toNum(input.lat, DEFAULT_LAT),
    lng: toNum(input.lng, DEFAULT_LNG),
    tz_str: typeof input.tz_str === "string" && input.tz_str.trim() ? input.tz_str.trim() : DEFAULT_TZ,
    birthTimeKnown,
  };
};

const safePlanetInterpretation = (planetNameKo: string, signKo: string, house: number) =>
  `${planetNameKo}이(가) ${signKo}에 위치하고 ${house}하우스 주제를 강조합니다.`;

const buildHouseByRising = (risingIdx: number): NormalizedNatalHouse[] =>
  Array.from({ length: 12 }, (_, index) => {
    const sign = signFromIndex(risingIdx + index);
    return {
      number: index + 1,
      sign: sign.id,
      signKo: sign.ko,
      degree: Number((((index * 2.75) + 1.4) % 30).toFixed(2)),
      theme: HOUSE_THEMES[index],
      themeDescription: `${index + 1}하우스는 ${HOUSE_THEMES[index]} 주제를 다룹니다.`,
    };
  });

const buildFallbackNatal = (raw: Partial<AstrologyRequestInput>): NormalizedNatalChart => {
  const req = normalizeRequest(raw);
  const seed = hashString([
    req.name,
    req.year,
    req.month,
    req.day,
    req.hour,
    req.minute,
    req.lat.toFixed(3),
    req.lng.toFixed(3),
    req.tz_str,
  ].join("|"));

  const sunSign = normalizeSignFromMonthDay(req.month, req.day);
  const moonSign = signFromIndex(seed + req.day + req.month * 2);
  const risingSign = signFromIndex(Math.floor((req.hour * 60 + req.minute + req.lng) / 120));
  const risingIdx = signIndexById(risingSign.id);

  const planets: NormalizedNatalPlanet[] = PLANETS.map((planetName, index) => {
    const sign = planetName === "Sun"
      ? sunSign
      : planetName === "Moon"
      ? moonSign
      : signFromIndex(seed + index * 7 + req.day + req.hour);
    const degree = Number((((seed + (index + 1) * 137) % 3000) / 100).toFixed(2));
    const house = mod(signIndexById(sign.id) - risingIdx, 12) + 1;
    const absPos = Number((signIndexById(sign.id) * 30 + degree).toFixed(3));
    return {
      name: planetName,
      nameKo: PLANET_LABELS[planetName],
      sign: sign.id,
      signKo: sign.ko,
      element: sign.element,
      quality: sign.quality,
      house,
      degree,
      absPos,
      retrograde: planetName !== "Sun" && planetName !== "Moon" ? mod(seed + index, 9) === 0 : false,
      interpretation: safePlanetInterpretation(PLANET_LABELS[planetName], sign.ko, house),
    };
  });

  const aspects: NormalizedNatalAspect[] = [];
  for (let i = 0; i < planets.length; i += 1) {
    for (let j = i + 1; j < planets.length; j += 1) {
      const match = majorAspectForAngle(angleDiff(planets[i].absPos, planets[j].absPos));
      if (!match) continue;
      aspects.push({
        planet1: planets[i].name,
        planet2: planets[j].name,
        planet1Ko: planets[i].nameKo,
        planet2Ko: planets[j].nameKo,
        aspectType: match.type,
        aspectTypeKo: mapAspectTypeKo(match.type),
        orb: Number(match.orb.toFixed(2)),
        influence: match.influence,
        interpretation: `${planets[i].nameKo}과 ${planets[j].nameKo} 사이에 ${mapAspectTypeKo(match.type)} 각이 형성됩니다.`,
      });
    }
  }

  const elementDistribution = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityDistribution = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const planet of planets) {
    elementDistribution[planet.element.toLowerCase() as keyof typeof elementDistribution] += 1;
    qualityDistribution[planet.quality.toLowerCase() as keyof typeof qualityDistribution] += 1;
  }

  const houses = buildHouseByRising(risingIdx);
  const sun = planets.find((planet) => planet.name === "Sun") ?? planets[0];
  const moon = planets.find((planet) => planet.name === "Moon") ?? planets[1];

  const big3 = {
    sun,
    moon,
    rising: {
      sign: risingSign.id,
      signKo: risingSign.ko,
      element: risingSign.element,
      quality: risingSign.quality,
      degree: Number((((req.hour * 2.4) + (req.minute / 25)) % 30).toFixed(2)),
      interpretation: `상승점이 ${risingSign.ko}에 있어 첫인상 표현 방식을 보여줍니다.`,
    },
  };

  const safeName = escapeXml(req.name ?? "User");
  const chartSvg = [
    `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="340" height="340" fill="#f8fafc"/>`,
    `<circle cx="170" cy="170" r="130" fill="none" stroke="#334155" stroke-width="2"/>`,
    `<circle cx="170" cy="170" r="92" fill="none" stroke="#94a3b8" stroke-width="1.2"/>`,
    `<text x="170" y="42" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">${safeName}</text>`,
    `<text x="170" y="66" text-anchor="middle" font-size="12" fill="#475569">Fallback Natal Snapshot</text>`,
    `<text x="170" y="150" text-anchor="middle" font-size="12" fill="#334155">태양 ${big3.sun.signKo}</text>`,
    `<text x="170" y="172" text-anchor="middle" font-size="12" fill="#334155">달 ${big3.moon.signKo}</text>`,
    `<text x="170" y="194" text-anchor="middle" font-size="12" fill="#334155">상승점 ${big3.rising.signKo}</text>`,
    `</svg>`,
  ].join("");

  return {
    meta: {
      source: "fallback",
      name: req.name ?? "User",
      year: req.year,
      month: req.month,
      day: req.day,
      hour: req.hour,
      minute: req.minute,
      birthTimeKnown: req.birthTimeKnown !== false,
      lat: req.lat,
      lng: req.lng,
      tz: req.tz_str,
      generatedAt: new Date().toISOString(),
    },
    big3,
    planets,
    houses,
    aspects: aspects.sort((a, b) => a.orb - b.orb).slice(0, 16),
    elementDistribution,
    qualityDistribution,
    chartSvg,
  };
};

const toPlanetKey = (value: unknown) => {
  if (typeof value !== "string") return "";
  const lowered = value.trim().toLowerCase();
  if (!lowered) return "";
  const mapped = PLANETS.find((planet) => planet.toLowerCase() === lowered);
  return mapped ?? "";
};

const extractBody = (source: AnyRecord, key: string) => {
  if (isRecord(source[key])) return source[key] as AnyRecord;
  const all = Array.isArray(source.all) ? source.all : [];
  const found = all.find((item) => isRecord(item) && toPlanetKey(item.Key ?? item.key ?? item.Label ?? item.label) === key);
  return isRecord(found) ? found : null;
};

const buildCircularNatal = async (raw: Partial<AstrologyRequestInput>): Promise<NormalizedNatalChart> => {
  const req = normalizeRequest(raw);
  const module = await loadHoroscopeModule();
  if (!module) {
    throw new Error("circular module unavailable");
  }

  const origin = new module.Origin({
    year: req.year,
    month: req.month - 1,
    date: req.day,
    hour: req.hour,
    minute: req.minute,
    latitude: req.lat,
    longitude: req.lng,
  });

  const horoscope = new module.Horoscope({
    origin,
    houseSystem: HOUSE_SYSTEM,
    zodiac: ZODIAC_SYSTEM,
    aspectPoints: ["bodies", "angles"],
    aspectWithPoints: ["bodies", "angles"],
    aspectTypes: ["major"],
    language: "en",
  }) as unknown as AnyRecord;

  const bodies = isRecord(horoscope.CelestialBodies) ? horoscope.CelestialBodies : null;
  if (!bodies) {
    throw new Error("invalid circular body payload");
  }

  const ascendant = isRecord(horoscope.Ascendant) ? horoscope.Ascendant : null;
  const housesRaw = Array.isArray(horoscope.Houses) ? horoscope.Houses : [];
  const aspectsRaw = isRecord(horoscope.Aspects) && Array.isArray(horoscope.Aspects.all) ? horoscope.Aspects.all : [];

  const risingSignId = toSignId(ascendant?.Sign?.label ?? ascendant?.Sign?.Label ?? ascendant?.Sign?.key ?? ascendant?.Sign?.Key) || "Aries";
  const risingSign = signFromId(risingSignId);
  const risingDegree = Number(
    parseArcDegrees30(
      ascendant?.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 ??
        ascendant?.ChartPosition?.Ecliptic?.ArcDegreesFormatted ??
        ascendant?.ChartPosition?.Ecliptic?.DecimalDegrees ??
        0,
      0,
    ).toFixed(2),
  );

  const planets: NormalizedNatalPlanet[] = PLANETS.map((planetName, index) => {
    const bodyKey = planetName.toLowerCase();
    const body = extractBody(bodies, bodyKey);
    if (!body) {
      throw new Error(`missing body ${planetName}`);
    }

    const signId = toSignId(
      body.Sign?.label ??
        body.Sign?.Label ??
        body.Sign?.key ??
        body.Sign?.Key ??
        body.sign ??
        body.signKey,
    ) || normalizeSignFromMonthDay(req.month, req.day).id;
    const sign = signFromId(signId);
    const absPos = Number(extractDecimalDegrees(body.ChartPosition?.Ecliptic, index * 30).toFixed(4));
    const degree = Number(mod(absPos, 30).toFixed(2));
    const house = clamp(
      toInt(body.House?.id ?? body.House?.ID ?? body.house ?? body.houseId, mod(signIndexById(sign.id) - signIndexById(risingSign.id), 12) + 1),
      1,
      12,
    );
    const retrograde = body.isRetrograde === true || body.retrograde === true;

    return {
      name: planetName,
      nameKo: PLANET_LABELS[planetName],
      sign: sign.id,
      signKo: sign.ko,
      element: sign.element,
      quality: sign.quality,
      house,
      degree,
      absPos,
      retrograde,
      interpretation: safePlanetInterpretation(PLANET_LABELS[planetName], sign.ko, house),
    };
  });

  const houses: NormalizedNatalHouse[] = housesRaw.length >= 12
    ? housesRaw.slice(0, 12).map((house, index) => {
      const signId = toSignId(
        (isRecord(house) ? house.Sign?.label ?? house.Sign?.Label ?? house.Sign?.key ?? house.Sign?.Key : undefined) ??
          signFromIndex(signIndexById(risingSign.id) + index).id,
      ) || signFromIndex(signIndexById(risingSign.id) + index).id;
      const sign = signFromId(signId);
      const degree = Number(
        parseArcDegrees30(
          isRecord(house)
            ? house.ChartPosition?.Ecliptic?.ArcDegreesFormatted30 ??
                house.ChartPosition?.Ecliptic?.ArcDegreesFormatted ??
                house.ChartPosition?.Ecliptic?.DecimalDegrees
            : undefined,
          Number((((index * 2.8) + 1.2) % 30).toFixed(2)),
        ).toFixed(2),
      );
      return {
        number: index + 1,
        sign: sign.id,
        signKo: sign.ko,
        degree,
        theme: HOUSE_THEMES[index],
        themeDescription: `${index + 1}하우스는 ${HOUSE_THEMES[index]} 주제를 다룹니다.`,
      };
    })
    : buildHouseByRising(signIndexById(risingSign.id));

  const planetsByName = new Map(planets.map((planet) => [planet.name.toLowerCase(), planet]));
  const aspects: NormalizedNatalAspect[] = [];
  for (const rawAspect of aspectsRaw) {
    if (!isRecord(rawAspect)) continue;
    const p1 = toPlanetKey(rawAspect.point1Key ?? rawAspect.point_1_key ?? rawAspect.point1?.key ?? rawAspect.point_1?.key);
    const p2 = toPlanetKey(rawAspect.point2Key ?? rawAspect.point_2_key ?? rawAspect.point2?.key ?? rawAspect.point_2?.key);
    if (!p1 || !p2) continue;
    const planet1 = planetsByName.get(p1.toLowerCase());
    const planet2 = planetsByName.get(p2.toLowerCase());
    if (!planet1 || !planet2) continue;

    const aspectTypeRaw = String(rawAspect.aspectKey ?? rawAspect.aspect?.key ?? rawAspect.aspectType ?? "").toLowerCase();
    const aspectType = aspectTypeRaw === "conjunction"
      ? "Conjunction"
      : aspectTypeRaw === "sextile"
      ? "Sextile"
      : aspectTypeRaw === "square"
      ? "Square"
      : aspectTypeRaw === "trine"
      ? "Trine"
      : aspectTypeRaw === "opposition"
      ? "Opposition"
      : "";
    if (!aspectType) continue;

    const influence = ASPECTS.find((item) => item.type === aspectType)?.influence ?? "neutral";
    const orb = Number(extractDecimalDegrees(rawAspect.orb, 0).toFixed(2));
    aspects.push({
      planet1: planet1.name,
      planet2: planet2.name,
      planet1Ko: planet1.nameKo,
      planet2Ko: planet2.nameKo,
      aspectType,
      aspectTypeKo: mapAspectTypeKo(aspectType),
      orb,
      influence,
      interpretation: `${planet1.nameKo}과 ${planet2.nameKo} 사이에 ${mapAspectTypeKo(aspectType)} 각이 형성됩니다.`,
    });
  }

  if (aspects.length === 0) {
    for (let i = 0; i < planets.length; i += 1) {
      for (let j = i + 1; j < planets.length; j += 1) {
        const match = majorAspectForAngle(angleDiff(planets[i].absPos, planets[j].absPos));
        if (!match) continue;
        aspects.push({
          planet1: planets[i].name,
          planet2: planets[j].name,
          planet1Ko: planets[i].nameKo,
          planet2Ko: planets[j].nameKo,
          aspectType: match.type,
          aspectTypeKo: mapAspectTypeKo(match.type),
          orb: Number(match.orb.toFixed(2)),
          influence: match.influence,
          interpretation: `${planets[i].nameKo}과 ${planets[j].nameKo} 사이에 ${mapAspectTypeKo(match.type)} 각이 형성됩니다.`,
        });
      }
    }
  }

  const elementDistribution = { fire: 0, earth: 0, air: 0, water: 0 };
  const qualityDistribution = { cardinal: 0, fixed: 0, mutable: 0 };
  for (const planet of planets) {
    elementDistribution[planet.element.toLowerCase() as keyof typeof elementDistribution] += 1;
    qualityDistribution[planet.quality.toLowerCase() as keyof typeof qualityDistribution] += 1;
  }

  const sun = planets.find((planet) => planet.name === "Sun") ?? planets[0];
  const moon = planets.find((planet) => planet.name === "Moon") ?? planets[1];
  const big3 = {
    sun,
    moon,
    rising: {
      sign: risingSign.id,
      signKo: risingSign.ko,
      element: risingSign.element,
      quality: risingSign.quality,
      degree: risingDegree,
      interpretation: `상승점이 ${risingSign.ko}에 있어 첫인상 표현 방식을 보여줍니다.`,
    },
  };

  const safeName = escapeXml(req.name ?? "User");
  const chartSvg = [
    `<svg viewBox="0 0 340 340" xmlns="http://www.w3.org/2000/svg">`,
    `<rect width="340" height="340" fill="#f8fafc"/>`,
    `<circle cx="170" cy="170" r="130" fill="none" stroke="#1f2937" stroke-width="2"/>`,
    `<circle cx="170" cy="170" r="92" fill="none" stroke="#94a3b8" stroke-width="1.2"/>`,
    `<text x="170" y="42" text-anchor="middle" font-size="18" font-weight="700" fill="#0f172a">${safeName}</text>`,
    `<text x="170" y="66" text-anchor="middle" font-size="12" fill="#475569">CircularNatalHoroscopeJS</text>`,
    `<text x="170" y="150" text-anchor="middle" font-size="12" fill="#334155">태양 ${big3.sun.signKo}</text>`,
    `<text x="170" y="172" text-anchor="middle" font-size="12" fill="#334155">달 ${big3.moon.signKo}</text>`,
    `<text x="170" y="194" text-anchor="middle" font-size="12" fill="#334155">상승점 ${big3.rising.signKo}</text>`,
    `</svg>`,
  ].join("");

  return {
    meta: {
      source: "circular",
      name: req.name ?? "User",
      year: req.year,
      month: req.month,
      day: req.day,
      hour: req.hour,
      minute: req.minute,
      birthTimeKnown: req.birthTimeKnown !== false,
      lat: req.lat,
      lng: req.lng,
      tz: req.tz_str,
      generatedAt: new Date().toISOString(),
    },
    big3,
    planets,
    houses,
    aspects: aspects.sort((a, b) => a.orb - b.orb).slice(0, 18),
    elementDistribution,
    qualityDistribution,
    chartSvg,
  };
};

const buildAsAstrologyResultData = (chart: NormalizedNatalChart) => ({
  sun: {
    sign: chart.big3.sun.sign,
    element: chart.big3.sun.element,
    quality: chart.big3.sun.quality,
  },
  moon: {
    sign: chart.big3.moon.sign,
    element: chart.big3.moon.element,
    quality: chart.big3.moon.quality,
  },
  first_house: {
    sign: chart.big3.rising.sign,
  },
});

export const buildNatalChart = async (raw: Partial<AstrologyRequestInput>): Promise<NormalizedNatalChart> => {
  try {
    return await buildCircularNatal(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    throw new Error(`CircularNatalHoroscopeJS calculation failed: ${detail}`);
  }
};

export const normalizeBirthRequest = (input: Partial<AstrologyRequestInput>) => normalizeRequest(input);

export const toAstrologyResultPayload = (chart: NormalizedNatalChart) => ({
  success: true,
  data: buildAsAstrologyResultData(chart),
  big3: chart.big3,
  planets: chart.planets,
  houses: chart.houses,
  aspects: chart.aspects,
  elementDistribution: chart.elementDistribution,
  qualityDistribution: chart.qualityDistribution,
  chartSvg: chart.chartSvg,
  chart_svg: chart.chartSvg,
});

export const buildInterpretationContext = (chart: NormalizedNatalChart): AstrologyInterpretationContext => {
  const positiveAspects = chart.aspects.filter((aspect) => aspect.influence === "positive").length;
  const negativeAspects = chart.aspects.filter((aspect) => aspect.influence === "negative").length;
  const dominantElement = Object.entries(chart.elementDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fire";
  const dominantQuality = Object.entries(chart.qualityDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cardinal";

  return {
    birthTimeKnown: chart.meta.birthTimeKnown,
    dominantElement,
    dominantQuality,
    positiveAspects,
    negativeAspects,
    big3: {
      sun: chart.big3.sun.signKo,
      moon: chart.big3.moon.signKo,
      rising: chart.big3.rising.signKo,
    },
    topAspects: chart.aspects.slice(0, 8).map((aspect) => ({
      pair: `${aspect.planet1Ko}-${aspect.planet2Ko}`,
      type: aspect.aspectType,
      influence: aspect.influence,
      orb: aspect.orb,
    })),
    keyPlanets: chart.planets.slice(0, 7).map((planet) => ({
      name: planet.nameKo,
      sign: planet.signKo,
      house: planet.house,
      retrograde: planet.retrograde,
    })),
  };
};

const buildQuarterFlow = (baseScore: number) =>
  ["이번 달", "다음 달", "3개월 전망"].map((label, index) => ({
    label,
    focus: index === 0
      ? "핵심 목표 1개를 끝까지 완수하는 실행 구간입니다."
      : index === 1
      ? "확장보다 검증과 정리에 집중하면 성과가 안정됩니다."
      : "리듬 조정과 체력 관리가 성과 변동을 줄입니다.",
    caution: index === 0
      ? "동시 다중 작업으로 집중이 분산되지 않게 주의하세요."
      : index === 1
      ? "속도보다 합의와 검증을 우선해 리스크를 줄이세요."
      : "피로가 누적되면 즉흥 결정을 피하고 휴식을 배치하세요.",
    score: clamp(baseScore + (index === 0 ? 5 : index === 1 ? 0 : -4), 35, 95),
  }));

const normalizeTextItems = (value: unknown, max = 4) =>
  Array.isArray(value)
    ? value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, max)
    : [];

const primaryMoneyPathByElement = (element: string) => {
  const key = element.toLowerCase();
  if (key === "fire") return "짧은 피드백 루프를 가진 고속 실행형 프로젝트";
  if (key === "earth") return "반복 가능한 루틴을 기반으로 한 안정적 수익 구조";
  if (key === "water") return "관계 신뢰와 공감 가치를 기반으로 한 수익화";
  return "리서치·기획·커뮤니케이션 역량 기반 수익화";
};

const secondaryMoneyPathByQuality = (quality: string) => {
  const key = quality.toLowerCase();
  if (key === "cardinal") return "신규 프로젝트 런칭/세팅 지원형";
  if (key === "fixed") return "운영 고도화/최적화 서비스형";
  return "유연한 자문/코칭 서비스형";
};

const buildBirthExclusiveInsightsFallback = (
  context: ReturnType<typeof buildInterpretationContext>,
  chart: NormalizedNatalChart,
  summary: { actionsNow: string[] },
) => ({
  personaPublicImage: {
    title: "\uB0A8\uB4E4\uC774 \uBCF4\uB294 \uB098",
    summary: `${chart.big3.rising.signKo} 상승점의 외적 인상과 ${chart.big3.sun.signKo} 태양의 핵심 정체성이 동시에 강해, 타인에게는 빠르고 명확하지만 내면적으로는 신중한 사람으로 보입니다.`,
    evidence: [
      `상승점 ${chart.big3.rising.signKo}: 첫인상과 반응 속도를 결정합니다.`,
      `태양 ${chart.big3.sun.signKo} / 달 ${chart.big3.moon.signKo}: 판단 동기와 감정 기준을 만듭니다.`,
      `긍정 각 ${context.positiveAspects}개, 긴장 각 ${context.negativeAspects}개: 상황에 따라 표현 강도가 달라집니다.`,
    ],
    action: "대화 시작 시 결론 한 문장을 먼저 말하고, 요청이 있을 때 근거를 1~2개만 추가하세요.",
  },
  stopHabits: {
    title: "\uC6B4\uC744 \uAE4E\uB294 \uC2B5\uAD00 (Stop)",
    habits: [
      "감정 기복이 큰 날 중요한 결정을 바로 확정하는 습관",
      "동시에 너무 많은 목표를 진행해 집중도를 잃는 습관",
      "사실 확인 없이 상대 의도를 단정하는 습관",
    ],
    replacements: [
      "중요 선택에는 24시간 냉각 시간을 두기",
      "활성 목표 1개만 유지하고 나머지는 백로그로 이동하기",
      "해석 전에 확인 질문 1개를 먼저 던지기",
    ],
  },
  moneyPath: {
    title: "\uC7AC\uBB3C \uC720\uC785 \uACBD\uB85C (Money Path)",
    primaryPath: primaryMoneyPathByElement(context.dominantElement),
    secondaryPath: secondaryMoneyPathByQuality(context.dominantQuality),
    blockers: [
      "명확한 기준 없이 즉흥적으로 지출/투자하는 패턴",
      "수익성보다 관계 압박을 우선해 의사결정하는 패턴",
      "실행 후 정산/추적 루틴이 약한 운영 패턴",
    ],
    firstAction:
      summary.actionsNow[0]?.trim() ||
      "고정비와 반복 지출부터 분리한 뒤, 주간 지출 기준선을 먼저 고정하세요.",
  },
});

const mergeBirthExclusiveInsightsWithAi = (
  fallback: ReturnType<typeof buildBirthExclusiveInsightsFallback>,
  raw: unknown,
) => {
  if (!isRecord(raw)) return fallback;

  const persona = isRecord(raw.personaPublicImage) ? raw.personaPublicImage : null;
  const stop = isRecord(raw.stopHabits) ? raw.stopHabits : null;
  const money = isRecord(raw.moneyPath) ? raw.moneyPath : null;

  const personaEvidence = normalizeTextItems(persona?.evidence, 4);
  const stopHabits = normalizeTextItems(stop?.habits, 4);
  const stopReplacements = normalizeTextItems(stop?.replacements, 4);
  const moneyBlockers = normalizeTextItems(money?.blockers, 4);

  return {
    personaPublicImage: {
      title: fallback.personaPublicImage.title,
      summary:
        typeof persona?.summary === "string" && persona.summary.trim()
          ? persona.summary.trim()
          : fallback.personaPublicImage.summary,
      evidence: personaEvidence.length > 0 ? personaEvidence : fallback.personaPublicImage.evidence,
      action:
        typeof persona?.action === "string" && persona.action.trim()
          ? persona.action.trim()
          : fallback.personaPublicImage.action,
    },
    stopHabits: {
      title: fallback.stopHabits.title,
      habits: stopHabits.length > 0 ? stopHabits : fallback.stopHabits.habits,
      replacements: stopReplacements.length > 0 ? stopReplacements : fallback.stopHabits.replacements,
    },
    moneyPath: {
      title: fallback.moneyPath.title,
      primaryPath:
        typeof money?.primaryPath === "string" && money.primaryPath.trim()
          ? money.primaryPath.trim()
          : fallback.moneyPath.primaryPath,
      secondaryPath:
        typeof money?.secondaryPath === "string" && money.secondaryPath.trim()
          ? money.secondaryPath.trim()
          : fallback.moneyPath.secondaryPath,
      blockers: moneyBlockers.length > 0 ? moneyBlockers : fallback.moneyPath.blockers,
      firstAction:
        typeof money?.firstAction === "string" && money.firstAction.trim()
          ? money.firstAction.trim()
          : fallback.moneyPath.firstAction,
    },
  };
};

const elementKeyToKo = (value: string) => {
  const key = value.toLowerCase();
  if (key === "fire") return "불";
  if (key === "earth") return "흙";
  if (key === "air") return "공기";
  if (key === "water") return "물";
  return value;
};

const qualityKeyToKo = (value: string) => {
  const key = value.toLowerCase();
  if (key === "cardinal") return "활동궁";
  if (key === "fixed") return "고정궁";
  if (key === "mutable") return "변통궁";
  return value;
};

const buildBirthCuriosityInsightsFallback = (
  context: ReturnType<typeof buildInterpretationContext>,
  chart: NormalizedNatalChart,
  summary: { actionsNow: string[] },
) => {
  const venusSign = chart.planets.find((planet) => planet.name === "Venus")?.signKo ?? "미확인";
  const marsSign = chart.planets.find((planet) => planet.name === "Mars")?.signKo ?? "미확인";
  const jupiterSign = chart.planets.find((planet) => planet.name === "Jupiter")?.signKo ?? "미확인";
  const saturnSign = chart.planets.find((planet) => planet.name === "Saturn")?.signKo ?? "미확인";
  const houseUncertainty = context.birthTimeKnown ? "" : " 출생 시간 미입력으로 하우스 해석은 추정치입니다.";
  const secondHouseSign = chart.houses.find((house) => house.number === 2)?.signKo ?? "미확인";
  const sixthHouseSign = chart.houses.find((house) => house.number === 6)?.signKo ?? "미확인";
  const tenthHouseSign = chart.houses.find((house) => house.number === 10)?.signKo ?? "미확인";

  const lovePatternAnswer =
    `${chart.big3.moon.signKo} 달과 ${venusSign} 금성 흐름이 관계에서 정서적 안정과 배려 기반 신뢰를 중요하게 만듭니다.` +
    ` 갈등은 ${marsSign} 화성 패턴에서 커질 수 있으므로 의도 확인 질문이 먼저 필요합니다.${houseUncertainty}`;
  const workPersonaAnswer =
    `10하우스 ${tenthHouseSign} 기조와 ${qualityKeyToKo(context.dominantQuality)} 실행 패턴이 커리어 방향을 결정합니다.` +
    ` ${saturnSign} 토성은 책임 구조를, ${jupiterSign} 목성은 확장 포인트를 강화합니다.${houseUncertainty}`;
  const stressRecoveryAnswer =
    `6하우스 ${sixthHouseSign} 리듬과 ${chart.big3.moon.signKo} 달 반응 기준에서는 감정-업무 경계가 흐려질 때 피로가 급증합니다.` +
    ` 회복 루틴을 시간표에 고정하면 변동이 줄어듭니다.${houseUncertainty}`;
  const luckRoutineAnswer =
    `${elementKeyToKo(context.dominantElement)} 원소 우세와 ${qualityKeyToKo(context.dominantQuality)} 패턴에서는` +
    ` 목표 1개 집중과 검증 루틴 고정이 성과 확률을 높입니다. 재정은 2하우스 ${secondHouseSign} 기준으로 누수 차단이 우선입니다.${houseUncertainty}`;

  return {
    lovePattern: {
      title: "연애에서 반복되는 패턴",
      attractionStyle: `${venusSign} 금성 영향으로 배려와 공감 기반 신뢰를 빠르게 형성하는 편입니다.`,
      emotionalNeed: `${chart.big3.moon.signKo} 달 성향이 강해 관계에서 정서적 안정과 예측 가능한 반응을 특히 중요하게 봅니다.`,
      conflictTrigger: `${marsSign} 화성 패턴상 상대 의도 확인 없이 해석을 확정할 때 갈등 비용이 커집니다.`,
      healthierApproach: "결론보다 확인 질문 1개를 먼저 두고, 합의 문장을 짧게 남기세요.",
    },
    workPersona: {
      title: "일할 때 가장 빛나는 방식",
      bestRole: `10하우스 ${tenthHouseSign} 흐름에서 운영/관리/조율 역할에 강점이 드러납니다.`,
      collaborationStyle: "목표, 역할, 마감 기준이 명확할 때 협업 효율이 빠르게 올라갑니다.",
      hiddenAdvantage: `${qualityKeyToKo(context.dominantQuality)} 성향 덕분에 반복 실행과 리듬 유지 능력이 높습니다.`,
      burnoutTrigger: "동시 다중 과제 확장 시 집중력이 분산되며 피로 누적이 빠르게 발생합니다.",
      growthAction: summary.actionsNow[0]?.trim() || "이번 주 핵심 KPI를 1개로 좁히고 완료 기준을 먼저 고정하세요.",
    },
    stressRecovery: {
      title: "무너질 때의 패턴과 회복법",
      trigger: "관계 스트레스와 업무 압박이 동시에 들어올 때 감정 반응이 과부하되기 쉽습니다.",
      warningSignal: "작은 피드백에도 방어 반응이 커지고 할 일 우선순위가 급격히 흔들립니다.",
      resetRoutine: "30분 회복 슬롯(산책/호흡/정리) + 20분 단일 작업 블록을 같은 시간대에 고정하세요.",
      boundaryRule: "피로가 큰 날에는 신규 결정 확정을 미루고 기존 일정 검증만 수행하세요.",
    },
    luckRoutine: {
      title: "운이 붙는 루틴",
      amplifier: `${elementKeyToKo(context.dominantElement)} 에너지 우세일 때 핵심 과제 1개 집중 루틴이 성과를 증폭합니다.`,
      blocker: "감정 반응 직후 결정을 확정하면 오해 비용과 일정 손실이 커집니다.",
      ritual: "아침 계획 고정 -> 중간 검증 -> 종료 전 1줄 회고 기록을 반복하세요.",
      timingTip: "중요 결정은 최소 1회 재검토 후 확정하세요.",
    },
    faq: {
      title: "사람들이 가장 궁금해하는 질문",
      items: [
        {
          question: "왜 같은 문제가 연애에서 반복되나요?",
          answer: lovePatternAnswer,
        },
        {
          question: "나는 어떤 일에서 가장 성과가 잘 나나요?",
          answer: workPersonaAnswer,
        },
        {
          question: "스트레스가 몰릴 때 무엇부터 바로잡아야 하나요?",
          answer: stressRecoveryAnswer,
        },
        {
          question: "운을 올리려면 당장 무엇을 루틴화해야 하나요?",
          answer: luckRoutineAnswer,
        },
      ],
    },
  };
};

const normalizeFaqItems = (
  value: unknown,
  fallback: ReturnType<typeof buildBirthCuriosityInsightsFallback>["faq"]["items"],
) => {
  if (!Array.isArray(value)) return fallback;
  const parsed = value
    .filter((item): item is AnyRecord => isRecord(item))
    .map((item) => ({
      question: typeof item.question === "string" ? item.question.trim() : "",
      answer: typeof item.answer === "string" ? item.answer.trim() : "",
    }))
    .filter((item) => item.question.length > 0 && item.answer.length > 0)
    .slice(0, 4);

  if (parsed.length === 4) return parsed;
  return fallback;
};

const mergeBirthCuriosityInsightsWithAi = (
  fallback: ReturnType<typeof buildBirthCuriosityInsightsFallback>,
  raw: unknown,
) => {
  if (!isRecord(raw)) return fallback;

  const lovePattern = isRecord(raw.lovePattern) ? raw.lovePattern : null;
  const workPersona = isRecord(raw.workPersona) ? raw.workPersona : null;
  const stressRecovery = isRecord(raw.stressRecovery) ? raw.stressRecovery : null;
  const luckRoutine = isRecord(raw.luckRoutine) ? raw.luckRoutine : null;
  const faq = isRecord(raw.faq) ? raw.faq : null;

  return {
    lovePattern: {
      title: fallback.lovePattern.title,
      attractionStyle:
        typeof lovePattern?.attractionStyle === "string" && lovePattern.attractionStyle.trim()
          ? lovePattern.attractionStyle.trim()
          : fallback.lovePattern.attractionStyle,
      emotionalNeed:
        typeof lovePattern?.emotionalNeed === "string" && lovePattern.emotionalNeed.trim()
          ? lovePattern.emotionalNeed.trim()
          : fallback.lovePattern.emotionalNeed,
      conflictTrigger:
        typeof lovePattern?.conflictTrigger === "string" && lovePattern.conflictTrigger.trim()
          ? lovePattern.conflictTrigger.trim()
          : fallback.lovePattern.conflictTrigger,
      healthierApproach:
        typeof lovePattern?.healthierApproach === "string" && lovePattern.healthierApproach.trim()
          ? lovePattern.healthierApproach.trim()
          : fallback.lovePattern.healthierApproach,
    },
    workPersona: {
      title: fallback.workPersona.title,
      bestRole:
        typeof workPersona?.bestRole === "string" && workPersona.bestRole.trim()
          ? workPersona.bestRole.trim()
          : fallback.workPersona.bestRole,
      collaborationStyle:
        typeof workPersona?.collaborationStyle === "string" && workPersona.collaborationStyle.trim()
          ? workPersona.collaborationStyle.trim()
          : fallback.workPersona.collaborationStyle,
      hiddenAdvantage:
        typeof workPersona?.hiddenAdvantage === "string" && workPersona.hiddenAdvantage.trim()
          ? workPersona.hiddenAdvantage.trim()
          : fallback.workPersona.hiddenAdvantage,
      burnoutTrigger:
        typeof workPersona?.burnoutTrigger === "string" && workPersona.burnoutTrigger.trim()
          ? workPersona.burnoutTrigger.trim()
          : fallback.workPersona.burnoutTrigger,
      growthAction:
        typeof workPersona?.growthAction === "string" && workPersona.growthAction.trim()
          ? workPersona.growthAction.trim()
          : fallback.workPersona.growthAction,
    },
    stressRecovery: {
      title: fallback.stressRecovery.title,
      trigger:
        typeof stressRecovery?.trigger === "string" && stressRecovery.trigger.trim()
          ? stressRecovery.trigger.trim()
          : fallback.stressRecovery.trigger,
      warningSignal:
        typeof stressRecovery?.warningSignal === "string" && stressRecovery.warningSignal.trim()
          ? stressRecovery.warningSignal.trim()
          : fallback.stressRecovery.warningSignal,
      resetRoutine:
        typeof stressRecovery?.resetRoutine === "string" && stressRecovery.resetRoutine.trim()
          ? stressRecovery.resetRoutine.trim()
          : fallback.stressRecovery.resetRoutine,
      boundaryRule:
        typeof stressRecovery?.boundaryRule === "string" && stressRecovery.boundaryRule.trim()
          ? stressRecovery.boundaryRule.trim()
          : fallback.stressRecovery.boundaryRule,
    },
    luckRoutine: {
      title: fallback.luckRoutine.title,
      amplifier:
        typeof luckRoutine?.amplifier === "string" && luckRoutine.amplifier.trim()
          ? luckRoutine.amplifier.trim()
          : fallback.luckRoutine.amplifier,
      blocker:
        typeof luckRoutine?.blocker === "string" && luckRoutine.blocker.trim()
          ? luckRoutine.blocker.trim()
          : fallback.luckRoutine.blocker,
      ritual:
        typeof luckRoutine?.ritual === "string" && luckRoutine.ritual.trim()
          ? luckRoutine.ritual.trim()
          : fallback.luckRoutine.ritual,
      timingTip:
        typeof luckRoutine?.timingTip === "string" && luckRoutine.timingTip.trim()
          ? luckRoutine.timingTip.trim()
          : fallback.luckRoutine.timingTip,
    },
    faq: {
      title: fallback.faq.title,
      items: normalizeFaqItems(faq?.items, fallback.faq.items),
    },
  };
};

export const buildBirthReportFallback = (chart: NormalizedNatalChart) => {
  const context = buildInterpretationContext(chart);
  const baseScore = clamp(58 + context.positiveAspects * 5 - context.negativeAspects * 4, 35, 90);
  const quarterFlow = buildQuarterFlow(baseScore);
  const actionsNow = [
    "이번 달은 핵심 목표를 1개만 남기고 나머지는 보류 목록으로 분리하세요.",
    "중요 결정 전에 확인 질문 1개를 먼저 하세요.",
    "실행 시간과 검증 시간을 달력에서 분리해 고정하세요.",
  ];

  const confidence = {
    birthTimeKnown: chart.meta.birthTimeKnown,
    level: chart.meta.birthTimeKnown ? "high" as const : "medium" as const,
    message: chart.meta.birthTimeKnown
      ? "출생 시간이 포함되어 상승점과 하우스 해석 신뢰도가 높습니다."
      : "출생 시간 미입력으로 상승점과 하우스 해석은 중간 신뢰도로 제공합니다.",
  };

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    summary: {
      keynote: `${chart.big3.sun.signKo} 태양, ${chart.big3.moon.signKo} 달, ${chart.big3.rising.signKo} 상승점 조합입니다.`,
      strengths: [
        `${context.dominantElement.toUpperCase()} 요소 비중이 높아 강점 방향성이 분명합니다.`,
        `${context.dominantQuality.toUpperCase()} 성향이 강해 실행 기준을 고정하면 결과가 안정됩니다.`,
        `긍정 각 ${context.positiveAspects}개 / 긴장 각 ${context.negativeAspects}개 구조입니다.`,
      ],
      risks: [
        "동시에 여러 목표를 확장하면 실행 초점이 급격히 약해질 수 있습니다.",
        "감정 반응 직후 즉흥 결정을 내리면 관계 비용이 커질 수 있습니다.",
        "피로가 누적된 상태에서 대외 일정이 겹치면 리듬이 무너질 수 있습니다.",
      ],
      actionsNow,
    },
    exclusiveInsights: buildBirthExclusiveInsightsFallback(context, chart, { actionsNow }),
    curiosityInsights: buildBirthCuriosityInsightsFallback(context, chart, { actionsNow }),
    chapters: [
      {
        id: "temperament",
        title: "성향/기질",
        interpretation: `${chart.big3.sun.signKo} 태양, ${chart.big3.moon.signKo} 달, ${chart.big3.rising.signKo} 상승점 조합이 사고-감정-표현의 균형을 결정합니다.`,
        evidence: [
          `태양: ${chart.big3.sun.signKo}`,
          `달: ${chart.big3.moon.signKo}`,
          `상승점: ${chart.big3.rising.signKo}`,
        ],
        actionGuide: [
          "Do: 중요한 결정 전에 결론 문장 1개를 먼저 적으세요.",
          "Don't: 감정 반응 직후 결론을 확정하지 마세요.",
        ],
      },
      {
        id: "love-relationship",
        title: "연애/관계",
        interpretation: "관계에서는 속도보다 맥락 확인 빈도가 안정성을 높입니다.",
        evidence: [
          `달 위치: ${chart.big3.moon.signKo}`,
          `금성 위치: ${chart.planets.find((planet) => planet.name === "Venus")?.signKo ?? "미확인"}`,
          `화성 위치: ${chart.planets.find((planet) => planet.name === "Mars")?.signKo ?? "미확인"}`,
        ],
        actionGuide: [
          "Do: 결론 전에 상대 의도를 짧게 확인하세요.",
          "Don't: 확인 없이 의도를 단정하지 마세요.",
        ],
      },
      {
        id: "work-career",
        title: "일/커리어",
        interpretation: "이번 흐름은 다중 과제보다 단일 목표 집중 전략이 유리합니다.",
        evidence: [
          `10하우스 사인: ${chart.houses.find((house) => house.number === 10)?.signKo ?? "미확인"}`,
          `주도 성향: ${context.dominantQuality.toUpperCase()}`,
          `목성 위치: ${chart.planets.find((planet) => planet.name === "Jupiter")?.signKo ?? "미확인"}`,
        ],
        actionGuide: [
          "Do: 이번 주 핵심 KPI 1개를 고정하세요.",
          "Don't: 완료 전 신규 병렬 과제를 늘리지 마세요.",
        ],
      },
      {
        id: "money-wealth",
        title: "재정",
        interpretation: "확장보다 누수 차단과 지출 통제에 집중하면 안정성이 빠르게 올라갑니다.",
        evidence: [
          `2하우스 사인: ${chart.houses.find((house) => house.number === 2)?.signKo ?? "미확인"}`,
          `긍정 각 ${context.positiveAspects}개`,
          `긴장 각 ${context.negativeAspects}개`,
        ],
        actionGuide: [
          "Do: 고정비와 반복 지출 1건을 먼저 줄이세요.",
          "Don't: 검증 없는 즉흥 소비를 반복하지 마세요.",
        ],
      },
      {
        id: "health-rhythm",
        title: "건강/리듬",
        interpretation: "과로 신호를 줄이고 회복 루틴을 먼저 배치하면 전체 성과가 좋아집니다.",
        evidence: [
          `6하우스 사인: ${chart.houses.find((house) => house.number === 6)?.signKo ?? "미확인"}`,
          `원소 분포: Fire ${chart.elementDistribution.fire}, Earth ${chart.elementDistribution.earth}, Air ${chart.elementDistribution.air}, Water ${chart.elementDistribution.water}`,
        ],
        actionGuide: [
          "Do: 회복 루틴(산책/스트레칭/정리) 1개를 고정하세요.",
          "Don't: 피로 상태에서 고객 대면 일정을 연속 배치하지 마세요.",
        ],
      },
      {
        id: "near-term-flow",
        title: "이번 달 흐름",
        interpretation: `${quarterFlow[0].focus} 이번 달에는 실행과 검증의 균형이 중요합니다.`,
        evidence: [
          `이번 달 집중: ${quarterFlow[0].focus}`,
          `이번 달 주의: ${quarterFlow[0].caution}`,
          ...quarterFlow.map((node) => `${node.label}: ${node.score}`),
        ],
        actionGuide: [
          "Do: 오전에는 실행, 오후에는 검증 비중으로 루틴을 나누세요.",
          "Don't: 분위기 변화만 보고 계획을 자주 바꾸지 마세요.",
        ],
      },
      {
        id: "action-now",
        title: "지금 당장 할 행동",
        interpretation: "완벽한 타이밍을 기다리기보다 즉시 실행 가능한 한 가지 행동을 고정하는 것이 중요합니다.",
        evidence: [
          "즉시 실행 사인: 핵심 목표 1개 고정",
          "주요 리스크: 동시 다중 확장",
        ],
        actionGuide: [
          "Do: 이번 달 목표를 1개만 남기고 나머지는 보류 목록으로 분리하세요.",
          "Do: 중요한 결정 전에 확인 질문 1개를 먼저 하세요.",
          "Don't: 감정 반응 직후 즉흥 결정을 내리지 마세요.",
        ],
      },
    ],
    timing: {
      monthFocus: quarterFlow[0].focus,
      monthCaution: quarterFlow[0].caution,
      quarterFlow,
    },
    deepData: {
      data: buildAsAstrologyResultData(chart),
      big3: chart.big3,
      planets: chart.planets,
      houses: chart.houses,
      aspects: chart.aspects,
      elementDistribution: chart.elementDistribution,
      qualityDistribution: chart.qualityDistribution,
      chartSvg: chart.chartSvg,
      chart_svg: chart.chartSvg,
    },
    confidence,
  };
};

export const mergeBirthReportWithAi = (
  fallbackReport: ReturnType<typeof buildBirthReportFallback>,
  aiResult: unknown,
) => {
  if (!isRecord(aiResult)) return fallbackReport;
  const summary = isRecord(aiResult.summary) ? aiResult.summary : null;
  const chapters = Array.isArray(aiResult.chapters) ? aiResult.chapters : null;
  const timing = isRecord(aiResult.timing) ? aiResult.timing : null;
  const exclusiveInsights = mergeBirthExclusiveInsightsWithAi(
    fallbackReport.exclusiveInsights,
    aiResult.exclusiveInsights,
  );
  const curiosityInsights = mergeBirthCuriosityInsightsWithAi(
    fallbackReport.curiosityInsights,
    aiResult.curiosityInsights,
  );

  const safeSummary = summary
    ? {
      keynote: typeof summary.keynote === "string" && summary.keynote.trim() ? summary.keynote.trim() : fallbackReport.summary.keynote,
      strengths: Array.isArray(summary.strengths) ? summary.strengths.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 4) : fallbackReport.summary.strengths,
      risks: Array.isArray(summary.risks) ? summary.risks.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 4) : fallbackReport.summary.risks,
      actionsNow: Array.isArray(summary.actionsNow) ? summary.actionsNow.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 4) : fallbackReport.summary.actionsNow,
    }
    : fallbackReport.summary;

  const chapterById = new Map(
    fallbackReport.chapters.map((chapter) => [chapter.id, { ...chapter }]),
  );
  if (chapters) {
    for (const rawChapter of chapters) {
      if (!isRecord(rawChapter)) continue;
      const id = typeof rawChapter.id === "string" ? rawChapter.id : "";
      if (!chapterById.has(id)) continue;
      const fallbackChapter = chapterById.get(id);
      if (!fallbackChapter) continue;
      chapterById.set(id, {
        ...fallbackChapter,
        title: typeof rawChapter.title === "string" && rawChapter.title.trim() ? rawChapter.title.trim() : fallbackChapter.title,
        interpretation: typeof rawChapter.interpretation === "string" && rawChapter.interpretation.trim()
          ? rawChapter.interpretation.trim()
          : fallbackChapter.interpretation,
        evidence: Array.isArray(rawChapter.evidence)
          ? rawChapter.evidence.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 6)
          : fallbackChapter.evidence,
        actionGuide: Array.isArray(rawChapter.actionGuide)
          ? rawChapter.actionGuide.filter((item): item is string => typeof item === "string" && item.trim()).slice(0, 6)
          : fallbackChapter.actionGuide,
      });
    }
  }

  const quarterFlow = Array.isArray(timing?.quarterFlow)
    ? timing.quarterFlow
      .filter(isRecord)
      .map((item, index) => ({
        label: typeof item.label === "string" && item.label.trim() ? item.label.trim() : fallbackReport.timing.quarterFlow[index]?.label ?? `T${index + 1}`,
        focus: typeof item.focus === "string" && item.focus.trim() ? item.focus.trim() : fallbackReport.timing.quarterFlow[index]?.focus ?? fallbackReport.timing.monthFocus,
        caution: typeof item.caution === "string" && item.caution.trim() ? item.caution.trim() : fallbackReport.timing.quarterFlow[index]?.caution ?? fallbackReport.timing.monthCaution,
        score: clamp(toInt(item.score, fallbackReport.timing.quarterFlow[index]?.score ?? 60), 0, 100),
      }))
      .slice(0, 3)
    : fallbackReport.timing.quarterFlow;

  return {
    ...fallbackReport,
    summary: safeSummary,
    chapters: fallbackReport.chapters.map((chapter) => chapterById.get(chapter.id) ?? chapter),
    timing: {
      monthFocus: typeof timing?.monthFocus === "string" && timing.monthFocus.trim() ? timing.monthFocus.trim() : fallbackReport.timing.monthFocus,
      monthCaution: typeof timing?.monthCaution === "string" && timing.monthCaution.trim() ? timing.monthCaution.trim() : fallbackReport.timing.monthCaution,
      quarterFlow: quarterFlow.length >= 3 ? quarterFlow : fallbackReport.timing.quarterFlow,
    },
    exclusiveInsights,
    curiosityInsights,
  };
};

const buildTransitFromPlanetPositions = (
  date: string,
  transitPlanet: NormalizedNatalPlanet,
  natalPlanet: NormalizedNatalPlanet,
): NormalizedTransit | null => {
  const aspect = majorAspectForAngle(angleDiff(transitPlanet.absPos, natalPlanet.absPos));
  if (!aspect) return null;
  const impact = inferImpactFromInfluence(aspect.influence, aspect.orb);
  const scoreBase = aspect.influence === "positive" ? 74 : aspect.influence === "negative" ? 46 : 62;
  const score = clamp(Math.round(scoreBase - aspect.orb * 2), 20, 96);
  return {
    date,
    transitPlanet: transitPlanet.name,
    transitPlanetKo: transitPlanet.nameKo,
    natalPlanet: natalPlanet.name,
    natalPlanetKo: natalPlanet.nameKo,
    aspectType: aspect.type,
    orb: Number(aspect.orb.toFixed(2)),
    influence: aspect.influence,
    impact,
    meaning: `${transitPlanet.nameKo}-${natalPlanet.nameKo} ${mapAspectTypeKo(aspect.type)} 흐름이 형성됩니다.`,
    action: aspect.influence === "negative"
      ? "중요한 결정은 바로 확정하지 말고 확인 질문을 한 번 더 하세요."
      : "핵심 목표 1개를 정하고 실행 시간을 미리 확보하세요.",
    score,
  };
};

export const buildTransitMonth = async (
  natalInput: Partial<AstrologyRequestInput>,
  year: number,
  month: number,
): Promise<NormalizedTransitMonth> => {
  const safeYear = clamp(toInt(year, new Date().getFullYear()), 1900, 2100);
  const safeMonth = clamp(toInt(month, new Date().getMonth() + 1), 1, 12);
  const natal = await buildNatalChart(natalInput);
  const normalizedInput = normalizeRequest(natalInput);
  const daysInMonth = new Date(safeYear, safeMonth, 0).getDate();
  const rawTransits: NormalizedTransit[] = [];
  const source = "circular" as const;
  const impactOrder: Record<CalendarImpact, number> = { high: 3, medium: 2, low: 1 };
  const phaseBuckets: ["1-10", "11-20", "21-end"] = ["1-10", "11-20", "21-end"];

  const transitSort = (a: NormalizedTransit, b: NormalizedTransit) => {
    if (a.impact !== b.impact) return impactOrder[b.impact] - impactOrder[a.impact];
    if (a.orb !== b.orb) return a.orb - b.orb;
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const aKey = `${a.transitPlanet}|${a.natalPlanet}|${a.aspectType}`;
    const bKey = `${b.transitPlanet}|${b.natalPlanet}|${b.aspectType}`;
    return aKey.localeCompare(bKey);
  };

  const pickBestTransit = (candidate: NormalizedTransit, current: NormalizedTransit) =>
    transitSort(candidate, current) < 0 ? candidate : current;

  const dedupeByPairAspect = (items: NormalizedTransit[]) => {
    const deduped = new Map<string, NormalizedTransit>();
    for (const item of items) {
      const key = `${item.transitPlanet}|${item.natalPlanet}|${item.aspectType}`;
      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, item);
        continue;
      }
      deduped.set(key, pickBestTransit(item, existing));
    }
    return [...deduped.values()].sort(transitSort);
  };

  const dayFromIso = (isoDate: string) => {
    const value = Number(isoDate.slice(-2));
    return Number.isFinite(value) ? value : 0;
  };

  const phaseTopTransit = (startDay: number, endDay: number) => {
    const scoped = rawTransits.filter((item) => {
      const day = dayFromIso(item.date);
      return day >= startDay && day <= endDay;
    });
    const ranked = dedupeByPairAspect(scoped);
    return ranked[0] ?? null;
  };

  for (let day = 1; day <= daysInMonth; day += 1) {
    const transitChart = await buildNatalChart({
      ...natalInput,
      year: safeYear,
      month: safeMonth,
      day,
      hour: 12,
      minute: 0,
      birthTimeKnown: normalizedInput.birthTimeKnown,
    });

    const transitPlanets = transitChart.planets.filter((planet) =>
      TRANSIT_PLANETS.includes(planet.name as (typeof TRANSIT_PLANETS)[number])
    );

    for (const transitPlanet of transitPlanets) {
      for (const natalPlanet of natal.planets) {
        if (transitPlanet.name === natalPlanet.name) continue;
        const transit = buildTransitFromPlanetPositions(
          `${safeYear}-${String(safeMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          transitPlanet,
          natalPlanet,
        );
        if (!transit) continue;
        rawTransits.push(transit);
      }
    }
  }

  const ranked = dedupeByPairAspect(rawTransits).slice(0, 16);
  const phaseTopTransits: Record<CalendarPhase, NormalizedTransit | null> = {
    early: phaseTopTransit(1, 10),
    mid: phaseTopTransit(11, 20),
    late: phaseTopTransit(21, daysInMonth),
  };

  const positive = ranked.filter((item) => item.influence === "positive").length;
  const negative = ranked.filter((item) => item.influence === "negative").length;
  const dominantElement = Object.entries(natal.elementDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fire";
  const dominantQuality = Object.entries(natal.qualityDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "cardinal";

  return {
    year: safeYear,
    month: safeMonth,
    source,
    daysAnalyzed: daysInMonth,
    transitTime: "12:00",
    phaseBuckets,
    summarySeed: {
      score: clamp(Math.round(64 + positive * 3 - negative * 4), 25, 92),
      positive,
      negative,
      dominantElement,
      dominantQuality,
    },
    transits: ranked,
    phaseTopTransits,
  };
};

const CALENDAR_PHASES: CalendarPhase[] = ["early", "mid", "late"];

const calendarPlainMeaningByInfluence = (influence: Influence) => {
  if (influence === "negative") {
    return "오해와 일정 착오가 늘 수 있어 확인 단계를 먼저 두는 것이 좋습니다.";
  }
  if (influence === "positive") {
    return "협업과 실행 호흡이 맞기 쉬워 핵심 과제를 밀어붙이기 좋은 흐름입니다.";
  }
  return "흐름이 완만하므로 무리한 확장보다 정리와 점검이 유리합니다.";
};

const calendarPlainActionByInfluence = (influence: Influence) => {
  if (influence === "negative") {
    return "중요 결정은 즉시 확정하지 말고 재확인 질문을 한 번 더 넣으세요.";
  }
  if (influence === "positive") {
    return "우선순위 1개를 정해 집중 블록을 확보하고 마감까지 연결하세요.";
  }
  return "기존 계획을 유지하면서 누락된 체크리스트를 정리하세요.";
};

const toPhaseFallbackTitle = (phase: CalendarPhase) => {
  if (phase === "early") return "초반 정리 구간";
  if (phase === "mid") return "중반 실행 가속 구간";
  return "후반 검증 구간";
};

const toPhaseFallbackMeaning = (phase: CalendarPhase) => {
  if (phase === "early") return "방향을 넓히기보다 기준을 먼저 고정하면 한 달 전체 효율이 높아집니다.";
  if (phase === "mid") return "실행 집중력이 올라가므로 핵심 과제 진도를 크게 낼 수 있습니다.";
  return "마무리 단계에서는 속도보다 품질 점검이 결과를 지키는 핵심입니다.";
};

const toPhaseFallbackAction = (phase: CalendarPhase) => {
  if (phase === "early") return "이번 달 목표와 하지 않을 일을 먼저 확정하세요.";
  if (phase === "mid") return "핵심 과제 1개에 시간을 연속 배치하고 마감까지 밀어붙이세요.";
  return "완료 직전 검증 절차를 다시 점검해 실수를 줄이세요.";
};

// ---------------------------------------------------------------------------
// 개인화 텍스트 생성 헬퍼 (natal chart 기반)
// ---------------------------------------------------------------------------

const ELEMENT_KO: Record<string, string> = {
  fire: "불(Fire)", earth: "흙(Earth)", air: "공기(Air)", water: "물(Water)",
  Fire: "불(Fire)", Earth: "흙(Earth)", Air: "공기(Air)", Water: "물(Water)",
};

const QUALITY_KO: Record<string, string> = {
  cardinal: "활동(Cardinal)", fixed: "고정(Fixed)", mutable: "변통(Mutable)",
  Cardinal: "활동(Cardinal)", Fixed: "고정(Fixed)", Mutable: "변통(Mutable)",
};

const personalizedHeadline = (
  sunSignKo: string,
  moonSignKo: string,
  year: number,
  month: number,
  score: number,
) => {
  const prefix = `☀️ ${sunSignKo} · 🌙 ${moonSignKo} | ${year}년 ${month}월`;
  return score >= 70
    ? `${prefix}은 핵심 과제를 밀어붙이기 좋은 달입니다.`
    : `${prefix}은 정리와 확인 중심으로 운영할 때 안정적입니다.`;
};

const personalizedFocus = (dominantElement: string, positive: number, negative: number) => {
  const el = dominantElement.toLowerCase();
  if (positive >= negative) {
    if (el === "fire") return "추진력이 강한 달입니다. 핵심 목표 1개를 정해 끝까지 밀어붙이세요. 단, 완료 기준 없이 시작하면 에너지가 분산됩니다.";
    if (el === "earth") return "안정적 실행이 유리한 달입니다. 기존 과제의 완성도를 높이는 데 집중하면 결과가 단단해집니다.";
    if (el === "water") return "직관이 예민해지는 달입니다. 중요한 결정 전 감정과 사실을 분리하면 판단 정확도가 올라갑니다.";
    return "정보 분석과 판단 속도가 빨라지는 달입니다. 선택지를 줄이고 단일 목표에 집중하면 실행력이 배가됩니다.";
  }
  if (el === "fire") return "열정은 높지만 변수가 많은 달이므로 속도보다 방향을 먼저 점검하세요.";
  if (el === "earth") return "변수가 있는 달이므로 새로운 확장보다 현재 진행 중인 일의 리스크를 먼저 점검하세요.";
  if (el === "water") return "감정 변동이 큰 달이므로 중요한 결정은 하루 뒤에 확정하는 습관이 효과적입니다.";
  return "정보 과잉으로 판단이 흔들릴 수 있습니다. 확인 절차를 앞단에 배치하면 실수가 줄어듭니다.";
};

const personalizedCaution = (dominantElement: string, negative: number) => {
  const el = dominantElement.toLowerCase();
  if (negative > 0) {
    if (el === "fire") return "충동적 착수와 동시다발 확장은 에너지를 분산시킵니다. 완료 기준을 먼저 고정하세요.";
    if (el === "earth") return "고집으로 방향 수정이 늦어질 수 있습니다. 중간 점검 체크포인트를 미리 넣으세요.";
    if (el === "water") return "감정 반응이 판단을 왜곡할 수 있습니다. 사실 확인 질문을 먼저 던진 뒤 결정하세요.";
    return "정보 수집에만 머물러 실행이 늦어질 수 있습니다. 판단 기한을 명시하세요.";
  }
  if (el === "fire") return "흐름이 좋더라도 과신으로 일정을 과도하게 잡지 마세요.";
  if (el === "earth") return "안정적이지만 새로운 기회를 놓치지 않도록 열린 시야를 유지하세요.";
  if (el === "water") return "평온한 흐름이지만 중요한 결정은 감정이 가라앉은 뒤에 확정하세요.";
  return "흐름이 좋아도 지출과 일정 확장의 페이스를 의식적으로 조절하세요.";
};

const personalizedHighlightNotes = (dominantElement: string, dominantQuality: string, highImpactCount: number) => {
  const el = dominantElement.toLowerCase();
  const q = dominantQuality.toLowerCase();
  return {
    execution: highImpactCount >= 2
      ? (el === "fire" ? "추진력이 강한 구간이 있습니다. 핵심 과제를 일찍 시작하세요." :
         el === "earth" ? "끈기가 빛나는 구간입니다. 품질 기준을 높여 마무리하세요." :
         el === "water" ? "직관이 살아나는 구간입니다. 아이디어를 즉시 메모하세요." :
         "분석력이 빛나는 구간입니다. 핵심 데이터를 먼저 정리하세요.")
      : (q === "cardinal" ? "기준 정리 후 첫 실행을 빨리 시작하면 안정성이 올라갑니다." :
         q === "fixed" ? "한 과제에 집중 몰입하면 성과가 안정됩니다." :
         "유연하게 대응하되 우선순위를 고정하면 실행력이 올라갑니다."),
    collaboration: el === "fire" ? "결론 전 상대 의도를 한 줄로 요약 확인하면 오해가 줄어듭니다." :
                   el === "earth" ? "조언보다 공감 문장을 먼저 꺼내면 대화가 부드러워집니다." :
                   el === "water" ? "감정이 올라오면 사실 확인 질문을 먼저 던지세요." :
                   "대화 후 합의 문장 1개를 남겨 오해 비용을 줄이세요.",
    risk: el === "fire" ? "속도 때문에 기준 없이 결정하면 사후 비용이 큽니다. 확인 단계를 넣으세요." :
          el === "earth" ? "너무 신중해서 타이밍을 놓칠 수 있습니다. 판단 기한을 설정하세요." :
          el === "water" ? "감정 상태에서 내린 결정은 다음 날 재확인하세요." :
          "정보가 많을수록 결정이 늦어집니다. 핵심 기준 3개로 좁히세요.",
    finance: el === "fire" ? "충동 지출 위험이 있습니다. 결제 전 10분 냉각기를 두세요." :
             el === "earth" ? "안정적 운용이 강점입니다. 고정비 누수만 점검하세요." :
             el === "water" ? "감정 소비가 늘 수 있습니다. 월 예산 상한을 먼저 확인하세요." :
             "비교 분석은 충분합니다. 결정 후 추가 검색을 멈추세요.",
  };
};

const personalizedPriorityActions = (
  dominantElement: string,
  dominantQuality: string,
  topTransit: NormalizedTransit | undefined,
) => {
  const el = dominantElement.toLowerCase();
  const q = dominantQuality.toLowerCase();
  const actions: string[] = [];

  // 1. element 기반 핵심 행동
  if (el === "fire") actions.push("추진력이 강하므로, 핵심 목표 1개를 정해 완료 기준 문장부터 작성한 뒤 실행하세요.");
  else if (el === "earth") actions.push("현재 진행 중인 과제의 품질을 한 단계 높이는 데 시간을 투자하세요.");
  else if (el === "water") actions.push("중요한 판단 전에 감정과 사실을 분리하는 질문 1개를 먼저 적으세요.");
  else actions.push("정보를 줄이고 핵심 기준 3개로 좁힌 뒤 판단 기한을 정하세요.");

  // 2. quality 기반 실행 패턴
  if (q === "cardinal") actions.push("시작은 빠르게 하되, 마감 기준을 먼저 확정하면 결과 안정성이 올라갑니다.");
  else if (q === "fixed") actions.push("핵심 과제 1개를 선택해 25분 집중 블록 2회로 마무리하세요.");
  else actions.push("오늘 할 일을 3개 이하로 줄인 뒤 1순위를 30분 블록으로 먼저 끝내세요.");

  // 3. transit 기반 (있을 경우)
  if (topTransit) {
    actions.push(
      topTransit.influence === "positive"
        ? `${topTransit.transitPlanetKo}-${topTransit.natalPlanetKo} 조화 흐름이 형성됩니다. 핵심 과제 추진에 유리한 시기이니 실행 시간을 미리 확보하세요.`
        : `${topTransit.transitPlanetKo}-${topTransit.natalPlanetKo} 긴장 흐름이 감지됩니다. 중요 결정은 하루 검토 후 확정하세요.`
    );
  } else {
    actions.push("중요한 일정은 시작 전에 10분만 다시 확인해 착오를 줄이세요.");
  }

  // 4. 공통 실행 원칙
  actions.push("관계·협업 대화는 구두 합의로 끝내지 말고 기록으로 남기세요.");

  return actions;
};

const personalizedChoiceGuides = (
  dominantElement: string,
  transitSeed: NormalizedTransitMonth["summarySeed"],
): CalendarChoiceGuide[] => {
  const el = dominantElement.toLowerCase();
  const positive = transitSeed.positive >= transitSeed.negative;

  return [
    {
      id: "career",
      title: "일/커리어",
      guidance: el === "fire"
        ? (positive ? "추진력이 빛나는 달입니다. 핵심 과제 완성도를 올리면 눈에 띄는 성과가 나옵니다." : "열정은 높지만 방향 점검이 먼저입니다. 기준 없이 시작하면 에너지가 분산됩니다.")
        : el === "earth"
        ? (positive ? "꾸준한 실행이 보상받는 달입니다. 기존 과제를 한 단계 업그레이드하세요." : "변수가 있으니 새 프로젝트보다 현재 진행 중인 일의 리스크를 먼저 점검하세요.")
        : el === "water"
        ? (positive ? "직관이 살아나 창의적 해결이 돋보이는 시기입니다." : "감정이 업무 판단에 섞이기 쉽습니다. 사실 기반으로 결정하세요.")
        : (positive ? "분석력이 빛나는 달입니다. 데이터 기반 의사결정에 집중하세요." : "정보 과잉으로 결정이 늦어질 수 있습니다. 판단 기한을 명시하세요."),
      recommendedAction: el === "fire" ? "핵심 과제 1개를 선택하고 이번 주 마감 기준을 먼저 확정하세요."
        : el === "earth" ? "진행 중인 과제의 품질 체크리스트를 작성하고 마감까지 연결하세요."
        : el === "water" ? "아이디어를 먼저 메모한 뒤, 실행 가능성을 1시간 내 검토하세요."
        : "핵심 데이터 3개를 먼저 정리한 뒤 의사결정을 진행하세요.",
      avoidAction: el === "fire" ? "완료 기준 없이 새 프로젝트를 동시에 시작하지 마세요."
        : el === "earth" ? "완벽주의로 마감을 계속 미루지 마세요."
        : el === "water" ? "기분에 따라 업무 우선순위를 바꾸지 마세요."
        : "추가 정보 수집에만 매몰되어 결정 시점을 놓치지 마세요.",
    },
    {
      id: "relationship",
      title: "관계/협업",
      guidance: el === "fire" ? "에너지가 강해 대화 속도가 빨라집니다. 결론 전 상대 의도를 확인하세요."
        : el === "earth" ? "신뢰 기반 관계가 강점입니다. 조언보다 공감 문장을 먼저 꺼내세요."
        : el === "water" ? "감정 민감도가 높아지는 시기입니다. 반응 전 사실 확인 질문을 먼저 하세요."
        : "대화량은 충분합니다. 합의 내용을 문장으로 남겨 오해를 줄이세요.",
      recommendedAction: el === "fire" ? "중요 대화 후 핵심 합의를 한 문장으로 요약 확인하세요."
        : el === "earth" ? "상대의 감정을 먼저 인정하는 문장으로 대화를 시작하세요."
        : el === "water" ? "감정이 올라왔을 때는 1시간 뒤에 답장하세요."
        : "대화 후 합의 문장 1개를 메모로 남기세요.",
      avoidAction: el === "fire" ? "감정이 올라온 상태에서 결론을 즉시 내리지 마세요."
        : el === "earth" ? "자신의 방식만 고집하며 상대 의견을 차단하지 마세요."
        : el === "water" ? "감정적 반응을 그대로 메시지로 보내지 마세요."
        : "논리로만 밀어붙이며 상대 감정을 무시하지 마세요.",
    },
    {
      id: "energy",
      title: "에너지/컨디션",
      guidance: el === "fire" ? "에너지 소모가 빠릅니다. 집중 블록 사이에 반드시 회복 슬롯을 넣으세요."
        : el === "earth" ? "장시간 고정 자세가 약점입니다. 1시간마다 짧은 스트레칭을 넣으세요."
        : el === "water" ? "감정 소모가 컨디션을 좌우합니다. 소모성 대화를 줄이세요."
        : "멀티태스킹이 집중력을 분산시킵니다. 알림 채널을 줄이세요.",
      recommendedAction: el === "fire" ? "집중 블록 50분 후 10분 회복 시간을 고정하세요."
        : el === "earth" ? "1시간마다 5분 스트레칭 + 시선 전환을 실행하세요."
        : el === "water" ? "하루 1회 30분 회복 루틴(산책/명상)을 먼저 배치하세요."
        : "작업 중 알림을 끄고 단일 작업 블록 60분을 확보하세요.",
      avoidAction: el === "fire" ? "수면이 무너진 상태에서 고강도 일정을 밀어붙이지 마세요."
        : el === "earth" ? "3시간 이상 연속 고정 자세를 유지하지 마세요."
        : el === "water" ? "감정이 격앙된 상태에서 중요 결정을 내리지 마세요."
        : "동시에 3개 이상의 작업을 병렬로 진행하지 마세요.",
    },
    {
      id: "money",
      title: "돈/지출",
      guidance: el === "fire" ? "충동 지출 위험이 높습니다. 결제 전 10분 냉각기를 두세요."
        : el === "earth" ? "안정적 자산 관리가 강점입니다. 고정비 누수만 점검하면 충분합니다."
        : el === "water" ? "감정 소비가 늘 수 있습니다. 월 예산 상한을 먼저 확인하세요."
        : "비교 분석은 충분합니다. 결정 후 추가 검색을 멈추세요.",
      recommendedAction: el === "fire" ? "이번 달 지출 상한을 정하고 주 단위 잔여 예산을 확인하세요."
        : el === "earth" ? "고정비·구독 서비스 누수를 점검하고 불필요한 항목을 정리하세요."
        : el === "water" ? "감정에 지출하기 전 꼭 필요한지 24시간 후 재확인하세요."
        : "3일 이상 고민한 항목만 구매 리스트에 넣으세요.",
      avoidAction: el === "fire" ? "할인 유혹에 즉흥 결제하지 마세요."
        : el === "earth" ? "절약에 집착해 필요한 투자까지 미루지 마세요."
        : el === "water" ? "스트레스 해소용 소비를 습관화하지 마세요."
        : "검토 없는 충동 계약과 자동결제 방치를 피하세요.",
    },
  ];
};

const personalizedAvoidList = (
  dominantElement: string,
  dominantQuality: string,
  topNegativeTransit: NormalizedTransit | undefined,
) => {
  const el = dominantElement.toLowerCase();
  const q = dominantQuality.toLowerCase();
  const list: string[] = [];

  // element 기반
  if (el === "fire") list.push("완료 기준 없이 새 프로젝트를 충동적으로 시작하는 패턴");
  else if (el === "earth") list.push("완벽주의로 마감을 반복 연기하며 타이밍을 놓치는 패턴");
  else if (el === "water") list.push("감정이 격앙된 상태에서 중요 메시지를 즉시 발송하는 패턴");
  else list.push("정보 수집에만 매몰되어 결정 시점을 계속 미루는 패턴");

  // quality 기반
  if (q === "cardinal") list.push("핵심 과제 완료 전 신규 요청을 일정에 즉시 추가하는 방식");
  else if (q === "fixed") list.push("한 가지 방법에 고집하며 대안 검토를 거부하는 태도");
  else list.push("즉흥 요청을 검토 없이 수락해 우선순위가 흔들리는 습관");

  // transit 기반
  if (topNegativeTransit) {
    list.push(`${topNegativeTransit.transitPlanetKo}-${topNegativeTransit.natalPlanetKo} 긴장 흐름 시기에 중요 결정을 당일 확정하는 선택`);
  } else {
    list.push("중요 결정을 검증 없이 당일 확정하는 선택");
  }

  list.push("지출 기준 없이 할인/충동 구매를 반복하는 패턴");

  return list;
};

// ---------------------------------------------------------------------------
// buildCalendarFallback (개인화 적용)
// ---------------------------------------------------------------------------

export const buildCalendarFallback = (
  transitMonth: NormalizedTransitMonth,
  natal: NormalizedNatalChart,
): CalendarGuideResult => {
  const topTransits = transitMonth.transits.slice(0, 6);
  const highImpactCount = topTransits.filter((item) => item.impact === "high").length;
  const dominantElement = transitMonth.summarySeed.dominantElement;
  const dominantQuality = transitMonth.summarySeed.dominantQuality;
  const sunSignKo = natal.big3.sun.signKo;
  const moonSignKo = natal.big3.moon.signKo;
  const risingSignKo = natal.big3.rising.signKo;

  const headline = personalizedHeadline(
    sunSignKo,
    moonSignKo,
    transitMonth.year,
    transitMonth.month,
    transitMonth.summarySeed.score,
  );

  const focus = personalizedFocus(
    dominantElement,
    transitMonth.summarySeed.positive,
    transitMonth.summarySeed.negative,
  );

  const caution = personalizedCaution(dominantElement, transitMonth.summarySeed.negative);

  const highlightNotes = personalizedHighlightNotes(dominantElement, dominantQuality, highImpactCount);

  const highlights: CalendarHighlight[] = [
    {
      title: "집중 실행 점수",
      score: clamp(transitMonth.summarySeed.score, 0, 100),
      note: highlightNotes.execution,
    },
    {
      title: "협업 안정성",
      score: clamp(52 + transitMonth.summarySeed.positive * 7 - transitMonth.summarySeed.negative * 4, 0, 100),
      note: highlightNotes.collaboration,
    },
    {
      title: "판단 리스크",
      score: clamp(30 + transitMonth.summarySeed.negative * 10, 0, 100),
      note: highlightNotes.risk,
    },
    {
      title: "재정 운영",
      score: clamp(66 - transitMonth.summarySeed.negative * 4 + transitMonth.summarySeed.positive * 2, 0, 100),
      note: highlightNotes.finance,
    },
  ];

  const topTransit = topTransits[0];
  const topNegativeTransit = topTransits.find((t) => t.influence === "negative");

  const priorityActions = personalizedPriorityActions(dominantElement, dominantQuality, topTransit);
  const choiceGuides = personalizedChoiceGuides(dominantElement, transitMonth.summarySeed);

  const phaseGuides: CalendarPhaseGuide[] = CALENDAR_PHASES.map((phase) => {
    const transit = transitMonth.phaseTopTransits[phase];
    return {
      phase,
      title: toPhaseFallbackTitle(phase),
      meaning: transit ? calendarPlainMeaningByInfluence(transit.influence) : toPhaseFallbackMeaning(phase),
      action: transit ? calendarPlainActionByInfluence(transit.influence) : toPhaseFallbackAction(phase),
      impact: transit?.impact ?? (phase === "mid" ? "high" : "medium"),
    };
  });

  const avoidList = personalizedAvoidList(dominantElement, dominantQuality, topNegativeTransit);

  const expertNotes: CalendarExpertNote[] = topTransits.slice(0, 4).map((transit) => ({
    label: `${transit.transitPlanetKo}-${transit.natalPlanetKo} ${mapAspectTypeKo(transit.aspectType)}`,
    plainMeaning: calendarPlainMeaningByInfluence(transit.influence),
    sourceType: "transit",
  }));

  if (expertNotes.length === 0) {
    expertNotes.push({
      label: "수성 역행",
      plainMeaning: "오해와 일정 착오가 생기기 쉬우니 확인 절차를 늘리세요.",
      sourceType: "fallback",
    });
  }

  const userContext: CalendarUserContext = {
    sunSign: sunSignKo,
    moonSign: moonSignKo,
    risingSign: risingSignKo,
    dominantElement: ELEMENT_KO[dominantElement] ?? dominantElement,
    dominantQuality: QUALITY_KO[dominantQuality] ?? dominantQuality,
    birthTimeKnown: natal.meta.birthTimeKnown,
  };

  return {
    success: true,
    year: transitMonth.year,
    month: transitMonth.month,
    summary: {
      headline,
      focus,
      caution,
    },
    highlights,
    priorityActions,
    choiceGuides,
    phaseGuides,
    avoidList,
    expertNotes,
    userContext,
    deepData: {
      sourceNotes: [
        `natalSource=${natal.meta.source}`,
        `transitSource=${transitMonth.source}`,
        `transitCount=${transitMonth.transits.length}`,
        `sunSign=${sunSignKo}`,
        `moonSign=${moonSignKo}`,
        `risingSign=${risingSignKo}`,
        `dominantElement=${dominantElement}`,
        `dominantQuality=${dominantQuality}`,
        "generationMode=deterministic",
        "calculationBasis=CircularNatalHoroscopeJS@1.1.0",
      ],
      transits: transitMonth.transits,
      generationMode: "deterministic",
      calculationBasis: "CircularNatalHoroscopeJS@1.1.0",
      analysisWindow: {
        year: transitMonth.year,
        month: transitMonth.month,
        daysAnalyzed: transitMonth.daysAnalyzed,
        transitTime: transitMonth.transitTime,
        phaseBuckets: transitMonth.phaseBuckets,
      },
      birthTimeAccuracy: natal.meta.birthTimeKnown ? "known" : "unknown",
    },
  };
};
export const resolveSignByInput = (input: unknown) => {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return SIGNS[0];
  const lowered = raw.toLowerCase();
  return (
    SIGNS.find((sign) => sign.id.toLowerCase() === lowered || sign.ko === raw) ??
    SIGNS[0]
  );
};

export const resolveSignByBirthday = (month: number, day: number) => normalizeSignFromMonthDay(month, day);

const getKstIsoDate = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
  }).format(date);

export const buildDailyHoroscopeFallback = (
  signInput: unknown,
  reason: "upstream_timeout" | "proxy_error" = "proxy_error",
) => {
  const sign = resolveSignByInput(signInput);
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(now);
  const focusTime = focusTimeByQuality[sign.quality];

  const report = [
    `### ${sign.ko} 오늘의 흐름`,
    `기준일: ${dateLabel} (KST)`,
    `${dateLabel} 기준 규칙 리포트입니다.`,
    "",
    "### 오늘 한 줄 결론",
    oneLineByQuality[sign.quality],
    "",
    "### 지금 해야 할 일 1가지",
    doNowByQuality[sign.quality],
    "",
    "### 오늘 피할 일 1가지",
    avoidByQuality[sign.quality],
    "",
    "### 오늘 즉시 실행 체크리스트",
    `- 지금 10분: ${doNowByQuality[sign.quality]}`,
    `- ${focusTime}: 알림을 끄고 핵심 작업 1개만 처리하세요.`,
    `- 종료 기준: ${avoidByQuality[sign.quality]}`,
    "",
    "### 집중 시간대",
    focusTime,
    "",
    "### 관계 한 문장",
    relationTipByElement[sign.element],
    "",
    "### 컨디션 한 문장",
    conditionTipByElement[sign.element],
    "",
    "### 오늘의 포인트",
    `- 행운 컬러: ${luckyColorByElement[sign.element]}`,
    `- 행운 키워드: ${luckyKeywordByElement[sign.element]}`,
    "",
    "_안내: AI 응답이 지연되면 규칙 기반 리포트로 제공합니다._",
  ].join("\n");

  return {
    success: true,
    data: {
      sign: sign.id,
      horoscope: report,
    },
    meta: {
      source: "fallback",
      reason,
      basis: "rule_based",
      requestDate: getKstIsoDate(now),
      engine: "daily_fallback_rules_v1",
    },
  };
};

export const buildDailyPromptContext = (signInput: unknown) => {
  const sign = resolveSignByInput(signInput);
  const now = new Date();
  const dateISO = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(now);
  const weekday = new Intl.DateTimeFormat("ko-KR", { weekday: "long", timeZone: "Asia/Seoul" }).format(now);
  return {
    signId: sign.id,
    signKo: sign.ko,
    element: sign.element,
    quality: sign.quality,
    date: dateISO,
    weekday,
    relationTip: relationTipByElement[sign.element],
    conditionTip: conditionTipByElement[sign.element],
    oneLine: oneLineByQuality[sign.quality],
  };
};

export const resolveCoordinatesFromLocation = (location?: unknown) => {
  const raw = typeof location === "string" ? location.trim() : "";
  if (!raw) return { lat: DEFAULT_LAT, lng: DEFAULT_LNG, tz: DEFAULT_TZ };
  const mapped = CITY_COORDS[raw];
  return mapped ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG, tz: DEFAULT_TZ };
};

const CITY_COORDS: Record<string, { lat: number; lng: number; tz: string }> = {
  서울: { lat: 37.5665, lng: 126.9780, tz: "Asia/Seoul" },
  부산: { lat: 35.1796, lng: 129.0756, tz: "Asia/Seoul" },
  대구: { lat: 35.8714, lng: 128.6014, tz: "Asia/Seoul" },
  인천: { lat: 37.4563, lng: 126.7052, tz: "Asia/Seoul" },
  광주: { lat: 35.1595, lng: 126.8526, tz: "Asia/Seoul" },
  대전: { lat: 36.3504, lng: 127.3845, tz: "Asia/Seoul" },
  울산: { lat: 35.5384, lng: 129.3114, tz: "Asia/Seoul" },
  제주: { lat: 33.4996, lng: 126.5312, tz: "Asia/Seoul" },
  Seoul: { lat: 37.5665, lng: 126.9780, tz: "Asia/Seoul" },
};

export const buildMinimalLegacyBirthResponse = async (input: Partial<AstrologyRequestInput>) => {
  const chart = await buildNatalChart(input);
  return toAstrologyResultPayload(chart);
};

