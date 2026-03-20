import { Oheng, OhengDistribution, Palja } from "../types/result";

const GAN_OHENG_MAP: Record<string, Oheng> = {
  갑: "목",
  을: "목",
  甲: "목",
  乙: "목",
  병: "화",
  정: "화",
  丙: "화",
  丁: "화",
  무: "토",
  기: "토",
  戊: "토",
  己: "토",
  경: "금",
  신: "금",
  庚: "금",
  辛: "금",
  임: "수",
  계: "수",
  壬: "수",
  癸: "수",
};

const JI_OHENG_MAP: Record<string, Oheng> = {
  인: "목",
  묘: "목",
  寅: "목",
  卯: "목",
  사: "화",
  오: "화",
  巳: "화",
  午: "화",
  진: "토",
  술: "토",
  축: "토",
  미: "토",
  辰: "토",
  戌: "토",
  丑: "토",
  未: "토",
  신: "금",
  유: "금",
  申: "금",
  酉: "금",
  해: "수",
  자: "수",
  亥: "수",
  子: "수",
};

const GAN_HANGUL_TO_HANJA: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};

const JI_HANGUL_TO_HANJA: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

const EMPTY_COUNTS = {
  목: 0,
  화: 0,
  토: 0,
  금: 0,
  수: 0,
} satisfies Record<Oheng, number>;

const OHENG_ORDER: Oheng[] = ["목", "화", "토", "금", "수"];

const normalizeSyllable = (value: string) => value.trim().charAt(0);

const toHanjaIfPossible = (value: string) => {
  if (GAN_HANGUL_TO_HANJA[value]) {
    return GAN_HANGUL_TO_HANJA[value];
  }
  if (JI_HANGUL_TO_HANJA[value]) {
    return JI_HANGUL_TO_HANJA[value];
  }
  return value;
};

const splitPillar = (pillar: string) => {
  const cleaned = pillar.replace(/\s+/g, "").trim();
  if (cleaned.length < 2) {
    throw new Error(`유효하지 않은 간지 값입니다: ${pillar}`);
  }
  const chars = [...cleaned];
  return {
    gan: toHanjaIfPossible(normalizeSyllable(chars[0])),
    ji: toHanjaIfPossible(normalizeSyllable(chars[1])),
  };
};

const resolveGanOheng = (gan: string): Oheng => {
  const element = GAN_OHENG_MAP[gan];
  if (!element) {
    throw new Error(`지원하지 않는 천간입니다: ${gan}`);
  }
  return element;
};

const resolveJiOheng = (ji: string): Oheng => {
  const element = JI_OHENG_MAP[ji];
  if (!element) {
    throw new Error(`지원하지 않는 지지입니다: ${ji}`);
  }
  return element;
};

export interface SajuPillarSource {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  yearPillarHanja?: string;
  monthPillarHanja?: string;
  dayPillarHanja?: string;
  hourPillarHanja?: string;
}

const parseUnit = (hangul: string, hanja?: string) => {
  const source = hanja && hanja.length >= 2 ? hanja : hangul;
  const { gan, ji } = splitPillar(source);

  return {
    gan,
    ji,
    ohengGan: resolveGanOheng(gan),
    ohengJi: resolveJiOheng(ji),
  };
};

export const buildPaljaFromPillars = (source: SajuPillarSource): Palja => ({
  year: parseUnit(source.yearPillar, source.yearPillarHanja),
  month: parseUnit(source.monthPillar, source.monthPillarHanja),
  day: parseUnit(source.dayPillar, source.dayPillarHanja),
  time: parseUnit(source.hourPillar, source.hourPillarHanja),
});

export const calculateOhengDistribution = (palja: Palja): OhengDistribution[] => {
  const counts: Record<Oheng, number> = { ...EMPTY_COUNTS };

  const append = (gan: string, ji: string) => {
    counts[resolveGanOheng(gan)] += 1;
    counts[resolveJiOheng(ji)] += 1;
  };

  append(palja.year.gan, palja.year.ji);
  append(palja.month.gan, palja.month.ji);
  append(palja.day.gan, palja.day.ji);
  append(palja.time.gan, palja.time.ji);

  return OHENG_ORDER.map((element) => ({
    element,
    count: counts[element],
    percentage: Math.round((counts[element] / 8) * 100),
  }));
};

export const determineYongsin = (palja: Palja, oheng: OhengDistribution[]): Oheng[] => {
  const minCount = Math.min(...oheng.map((item) => item.count));
  const weakest = oheng.filter((item) => item.count === minCount).map((item) => item.element);

  if (weakest.length < 5) {
    return weakest;
  }

  return [resolveGanOheng(palja.day.gan)];
};

export const getGanOheng = (gan: string) => resolveGanOheng(toHanjaIfPossible(gan));

export const getJiOheng = (ji: string) => resolveJiOheng(toHanjaIfPossible(ji));
