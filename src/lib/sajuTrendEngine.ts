import { getGapja } from "@fullstackfamily/manseryeok";
import { getGanOheng } from "./ohengCalculator";
import {
  Oheng,
  OhengDistribution,
  SajuTrendPoint,
  SajuTrendPointEvidence,
  UserBirthData,
} from "../types/result";

const SUPPORTED_SEUN_YEAR_MIN = 1900;
const SUPPORTED_SEUN_YEAR_MAX = 2050;

const WEALTH_CHECKPOINTS = [
  { label: "현재", offset: 0 },
  { label: "1년 후", offset: 1 },
  { label: "3년 후", offset: 3 },
  { label: "5년 후", offset: 5 },
  { label: "10년 후", offset: 10 },
] as const;

const ENERGY_CHECKPOINTS = [
  { label: "1주", offset: 1 },
  { label: "2주", offset: 2 },
  { label: "3주", offset: 3 },
  { label: "4주", offset: 4 },
  { label: "8주", offset: 8 },
  { label: "12주", offset: 12 },
] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number) => Math.round(value);
const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

const normalizeOheng = (value: unknown): Oheng => {
  if (value === "목" || value === "木") return "목";
  if (value === "화" || value === "火") return "화";
  if (value === "토" || value === "土") return "토";
  if (value === "금" || value === "金") return "금";
  return "수";
};

const formatDateInTimeZone = (date: Date, timeZone?: string): { year: number; month: number; day: number } => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone || "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? date.getUTCFullYear());
  const month = Number(parts.find((part) => part.type === "month")?.value ?? date.getUTCMonth() + 1);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? date.getUTCDate());

  return { year, month, day };
};

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

const splitPillar = (pillar: string): { gan: string; ji: string } => {
  const compact = pillar.replace(/\s+/g, "").trim();
  const chars = [...compact];
  return {
    gan: chars[0] ?? "갑",
    ji: chars[1] ?? "자",
  };
};

const toGanElement = (pillar: string): Oheng => {
  try {
    const { gan } = splitPillar(pillar);
    return getGanOheng(gan);
  } catch {
    return "토";
  }
};

const buildOhengPercentageMap = (oheng?: OhengDistribution[]): Record<Oheng, number> => {
  const defaults: Record<Oheng, number> = { 목: 20, 화: 20, 토: 20, 금: 20, 수: 20 };
  if (!Array.isArray(oheng) || oheng.length === 0) {
    return defaults;
  }

  const normalized = oheng
    .map((item) => ({
      element: normalizeOheng(item.element),
      percentage: Number(item.percentage),
      count: Number(item.count),
    }))
    .filter((item) => Number.isFinite(item.percentage) || Number.isFinite(item.count));

  if (normalized.length === 0) {
    return defaults;
  }

  const percentageTotal = normalized.reduce((sum, item) => sum + (Number.isFinite(item.percentage) ? item.percentage : 0), 0);
  if (percentageTotal > 0) {
    const result: Record<Oheng, number> = { ...defaults };
    normalized.forEach((item) => {
      if (Number.isFinite(item.percentage)) {
        result[item.element] = clamp(round(item.percentage), 0, 100);
      }
    });
    return result;
  }

  const countTotal = normalized.reduce((sum, item) => sum + (Number.isFinite(item.count) ? item.count : 0), 0);
  if (countTotal <= 0) {
    return defaults;
  }

  const result: Record<Oheng, number> = { ...defaults };
  normalized.forEach((item) => {
    if (Number.isFinite(item.count)) {
      result[item.element] = clamp(round((item.count / countTotal) * 100), 0, 100);
    }
  });
  return result;
};

const resolveTimeZone = (profileMeta?: SajuTrendEngineProfileMeta) =>
  profileMeta?.timezone || profileMeta?.profileData?.timezone || "Asia/Seoul";

const normalizeYongsin = (yongsin?: Oheng[]): Oheng[] => {
  if (!Array.isArray(yongsin)) {
    return [];
  }
  return Array.from(new Set(yongsin.map((item) => normalizeOheng(item))));
};

const toDirection = (delta: number): "up" | "down" | "flat" => {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
};

const resolveYearInRange = (year: number) => clamp(year, SUPPORTED_SEUN_YEAR_MIN, SUPPORTED_SEUN_YEAR_MAX);

const resolveGapja = (year: number, month: number, day: number) => {
  const yearInRange = resolveYearInRange(year);
  return getGapja(yearInRange, month, day);
};

const baseInterpretationByDirection = (direction: "up" | "down" | "flat", domain: "wealth" | "energy"): string => {
  if (domain === "wealth") {
    if (direction === "up") return "수입 채널을 확장하되 고정비 상한을 먼저 고정하세요.";
    if (direction === "down") return "지출 누수 요인을 먼저 차단하고 신규 투자 결정을 늦추세요.";
    return "현재 구조를 유지하면서 월별 현금흐름 점검 빈도를 높이세요.";
  }
  if (direction === "up") return "몰입형 작업을 배치하고 회복 블록을 같이 예약하세요.";
  if (direction === "down") return "강도 높은 일정은 줄이고 수면·회복 루틴을 우선 복구하세요.";
  return "현재 리듬을 유지하면서 주간 과부하 신호를 점검하세요.";
};

export interface SajuTrendEngineProfileMeta {
  timezone?: string;
  currentYear?: number;
  profileData?: Pick<UserBirthData, "timezone">;
}

export interface SajuTrendEngineInput {
  oheng?: OhengDistribution[];
  yongsin?: Oheng[];
  profileMeta?: SajuTrendEngineProfileMeta;
}

export interface DeterministicTrendResult {
  series: SajuTrendPoint[];
  pointEvidence: SajuTrendPointEvidence[];
}

export const buildDeterministicWealthTrend = (input?: SajuTrendEngineInput): DeterministicTrendResult => {
  const ohengMap = buildOhengPercentageMap(input?.oheng);
  const yongsin = normalizeYongsin(input?.yongsin);
  const yongsinSet = new Set(yongsin);
  const timeZone = resolveTimeZone(input?.profileMeta);
  const now = formatDateInTimeZone(new Date(), timeZone);
  const anchorYear = Number.isFinite(Number(input?.profileMeta?.currentYear))
    ? Number(input?.profileMeta?.currentYear)
    : now.year;

  const yongsinBoost = yongsin.some((item) => item === "토" || item === "금") ? 6 : 0;
  const inflowPower = ohengMap.수 * 0.45 + ohengMap.목 * 0.3 + ohengMap.금 * 0.25;
  const leakagePower = ohengMap.화 * 0.35 + ohengMap.토 * 0.3 + Math.max(0, 30 - ohengMap.금) * 0.5;
  const stabilityBase = clamp(round(48 + (inflowPower - leakagePower) / 3 + yongsinBoost), 28, 86);
  const slope = clamp(round((ohengMap.수 + ohengMap.목 - ohengMap.화) / 5), -12, 14);
  const driftByIndex = [-4, round(slope * 0.45), round(slope * 0.95), round(slope * 0.7) - 2, round(slope * 1.2)];

  const series: SajuTrendPoint[] = [];
  const pointEvidence: SajuTrendPointEvidence[] = [];

  WEALTH_CHECKPOINTS.forEach((checkpoint, index) => {
    const targetYear = resolveYearInRange(anchorYear + checkpoint.offset);
    const yearGapja = resolveGapja(targetYear, 6, 15);
    const seunElement = toGanElement(yearGapja.yearPillar);

    let seunAdjustment = 0;
    if (yongsinSet.has(seunElement)) {
      seunAdjustment += 5;
    }
    if (seunElement === "수" || seunElement === "금") {
      seunAdjustment += 2;
    }
    if ((seunElement === "화" || seunElement === "토") && ohengMap.화 + ohengMap.토 >= 48) {
      seunAdjustment -= 4;
    }
    if (seunElement === "목" && ohengMap.목 < 18) {
      seunAdjustment += 2;
    }
    seunAdjustment = clamp(seunAdjustment, -8, 8);

    const value = clamp(stabilityBase + driftByIndex[index] + seunAdjustment, 0, 100);
    const deltaFromPrev = index === 0 ? 0 : value - series[index - 1].value;
    const direction = toDirection(deltaFromPrev);

    series.push({
      label: checkpoint.label,
      value,
    });

    pointEvidence.push({
      label: checkpoint.label,
      value,
      deltaFromPrev,
      direction,
      reasonSummary: `${targetYear}년 세운(${yearGapja.yearPillar}/${seunElement}) 보정 ${signed(
        seunAdjustment,
      )}이 반영되어 재물 지수가 ${direction === "flat" ? "유지" : direction === "up" ? "상승" : "하락"}했습니다.`,
      interpretation: baseInterpretationByDirection(direction, "wealth"),
      reasonDetails: [
        `원국 오행 분포: 목 ${ohengMap.목}% / 화 ${ohengMap.화}% / 토 ${ohengMap.토}% / 금 ${ohengMap.금}% / 수 ${ohengMap.수}%`,
        `용신: ${yongsin.length > 0 ? yongsin.join(", ") : "없음"}`,
        `세운 기준: ${targetYear}년 ${yearGapja.yearPillar} (${seunElement})`,
        `요인 점수: 유입 ${round(inflowPower)}, 누수 ${round(leakagePower)}, 기저 ${stabilityBase}, 기울기 ${slope}`,
      ],
      rawBasis: {
        source: "manseryeok",
        checkpoint: {
          label: checkpoint.label,
          offset: checkpoint.offset,
          unit: "year",
          targetDate: `${targetYear}-06-15`,
          targetYear,
        },
        ohengDistribution: ohengMap,
        yongsin,
        seun: {
          year: targetYear,
          pillar: yearGapja.yearPillar,
          element: seunElement,
        },
        factorScores: {
          inflowPower: round(inflowPower),
          leakagePower: round(leakagePower),
          stabilityBase,
          slope,
          seunAdjustment,
          yongsinBoost,
        },
      },
    });
  });

  return {
    series,
    pointEvidence,
  };
};

export const buildDeterministicEnergyTrend = (input?: SajuTrendEngineInput): DeterministicTrendResult => {
  const ohengMap = buildOhengPercentageMap(input?.oheng);
  const yongsin = normalizeYongsin(input?.yongsin);
  const yongsinSet = new Set(yongsin);
  const timeZone = resolveTimeZone(input?.profileMeta);
  const now = new Date();

  const yongsinBoost = yongsin.some((item) => item === "수" || item === "목") ? 6 : 0;
  const focusPower = ohengMap.목 * 0.4 + ohengMap.화 * 0.35 + ohengMap.금 * 0.15;
  const recoveryPower = ohengMap.수 * 0.45 + ohengMap.금 * 0.3 + ohengMap.토 * 0.15;
  const fatiguePressure = ohengMap.화 * 0.25 + ohengMap.토 * 0.35;
  const base = clamp(round(42 + (focusPower + recoveryPower - fatiguePressure) / 3 + yongsinBoost), 30, 82);
  const peak = clamp(round(base + 16 + (focusPower - recoveryPower) / 10), 45, 96);
  const dip = clamp(round(base - 10 + (recoveryPower - focusPower) / 8), 22, 78);
  const week12 = clamp(round(base + (recoveryPower >= focusPower ? 5 : 1)), 28, 90);
  const baselineByIndex = [clamp(base - 3, 0, 100), clamp(base + 8, 0, 100), peak, clamp(base + 2, 0, 100), dip, week12];

  const series: SajuTrendPoint[] = [];
  const pointEvidence: SajuTrendPointEvidence[] = [];

  ENERGY_CHECKPOINTS.forEach((checkpoint, index) => {
    const date = addDays(now, (checkpoint.offset - 1) * 7);
    const parts = formatDateInTimeZone(date, timeZone);
    const gapja = resolveGapja(parts.year, parts.month, parts.day);
    const yearElement = toGanElement(gapja.yearPillar);
    const monthElement = toGanElement(gapja.monthPillar);
    const dayElement = toGanElement(gapja.dayPillar);

    let temporalAdjustment = 0;
    if (yongsinSet.has(dayElement)) temporalAdjustment += 3;
    if (yongsinSet.has(monthElement)) temporalAdjustment += 2;
    if (yongsinSet.has(yearElement)) temporalAdjustment += 1;
    if ((dayElement === "화" && ohengMap.화 >= 25) || (dayElement === "토" && ohengMap.토 >= 25)) temporalAdjustment -= 3;
    if (dayElement === "수" && ohengMap.수 < 18) temporalAdjustment -= 2;
    temporalAdjustment = clamp(temporalAdjustment, -8, 8);

    const value = clamp(baselineByIndex[index] + temporalAdjustment, 0, 100);
    const deltaFromPrev = index === 0 ? 0 : value - series[index - 1].value;
    const direction = toDirection(deltaFromPrev);
    const dateLabel = `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;

    series.push({
      label: checkpoint.label,
      value,
    });

    pointEvidence.push({
      label: checkpoint.label,
      value,
      deltaFromPrev,
      direction,
      reasonSummary: `${dateLabel} 일진(${gapja.dayPillar}/${dayElement}) 중심 보정 ${signed(
        temporalAdjustment,
      )}이 반영되어 에너지 지수가 ${direction === "flat" ? "유지" : direction === "up" ? "상승" : "하락"}했습니다.`,
      interpretation: baseInterpretationByDirection(direction, "energy"),
      reasonDetails: [
        `원국 오행 분포: 목 ${ohengMap.목}% / 화 ${ohengMap.화}% / 토 ${ohengMap.토}% / 금 ${ohengMap.금}% / 수 ${ohengMap.수}%`,
        `용신: ${yongsin.length > 0 ? yongsin.join(", ") : "없음"}`,
        `세운/월운/일진: ${gapja.yearPillar}(${yearElement}) / ${gapja.monthPillar}(${monthElement}) / ${gapja.dayPillar}(${dayElement})`,
        `요인 점수: 집중 ${round(focusPower)}, 회복 ${round(recoveryPower)}, 피로 ${round(fatiguePressure)}, 기저 ${base}`,
      ],
      rawBasis: {
        source: "manseryeok",
        checkpoint: {
          label: checkpoint.label,
          offset: checkpoint.offset,
          unit: "week",
          targetDate: dateLabel,
          targetYear: parts.year,
        },
        ohengDistribution: ohengMap,
        yongsin,
        temporalPillars: {
          yearPillar: gapja.yearPillar,
          monthPillar: gapja.monthPillar,
          dayPillar: gapja.dayPillar,
          yearElement,
          monthElement,
          dayElement,
        },
        factorScores: {
          focusPower: round(focusPower),
          recoveryPower: round(recoveryPower),
          fatiguePressure: round(fatiguePressure),
          baseRhythm: base,
          temporalAdjustment,
          yongsinBoost,
        },
      },
    });
  });

  return {
    series,
    pointEvidence,
  };
};
