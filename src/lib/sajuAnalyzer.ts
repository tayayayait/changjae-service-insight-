import { Oheng, Palja, PaljaUnit, Sipsin, TwelveUnseong, Sinsal } from "../types/result";
import { getGanOheng, getJiOheng } from "./ohengCalculator";

// Polarity: Yang = 1, Yin = -1
const GAN_POLARITY: Record<string, number> = {
  "甲": 1, "갑": 1,
  "乙": -1, "을": -1,
  "丙": 1, "병": 1,
  "丁": -1, "정": -1,
  "戊": 1, "무": 1,
  "己": -1, "기": -1,
  "庚": 1, "경": 1,
  "辛": -1, "신": -1,
  "壬": 1, "임": 1,
  "癸": -1, "계": -1,
};

const JI_POLARITY: Record<string, number> = {
  "子": 1, "자": 1,
  "丑": -1, "축": -1,
  "寅": 1, "인": 1,
  "卯": -1, "묘": -1,
  "辰": 1, "진": 1,
  "巳": -1, "사": -1,
  "午": 1, "오": 1,
  "未": -1, "미": -1,
  "申": 1, "신": 1,
  "酉": -1, "유": -1,
  "戌": 1, "술": 1,
  "亥": -1, "해": -1,
};

// Relation Mapping for Sipsin
// Key: [Ilgan Oheng, Target Oheng, Same Polarity]
const SIPSIN_MAP: Record<string, Sipsin> = {
  // Wood
  "목-목-true": "비견", "목-목-false": "겁재",
  "목-화-true": "식신", "목-화-false": "상관",
  "목-토-true": "편재", "목-토-false": "정재",
  "목-금-true": "편관", "목-금-false": "정관",
  "목-수-true": "편인", "목-수-false": "정인",
  // Fire
  "화-화-true": "비견", "화-화-false": "겁재",
  "화-토-true": "식신", "화-토-false": "상관",
  "화-금-true": "편재", "화-금-false": "정재",
  "화-수-true": "편관", "화-수-false": "정관",
  "화-목-true": "편인", "화-목-false": "정인",
  // Earth
  "토-토-true": "비견", "토-토-false": "겁재",
  "토-금-true": "식신", "토-금-false": "상관",
  "토-수-true": "편재", "토-수-false": "정재",
  "토-목-true": "편관", "토-목-false": "정관",
  "토-화-true": "편인", "토-화-false": "정인",
  // Metal
  "금-금-true": "비견", "금-금-false": "겁재",
  "금-수-true": "식신", "금-수-false": "상관",
  "금-목-true": "편재", "금-목-false": "정재",
  "금-화-true": "편관", "금-화-false": "정관",
  "금-토-true": "편인", "금-토-false": "정인",
  // Water
  "수-수-true": "비견", "수-수-false": "겁재",
  "수-목-true": "식신", "수-목-false": "상관",
  "수-화-true": "편재", "수-화-false": "정재",
  "수-토-true": "편관", "수-토-false": "정관",
  "수-금-true": "편인", "수-금-false": "정인",
};

// Twelve Unseong Table
// Key: [Ilgan, Ji]
const TWELVE_UNSEONG_MAP: Record<string, TwelveUnseong> = {
  "甲-亥": "장생", "甲-子": "목욕", "甲-丑": "관대", "甲-寅": "건록", "甲-卯": "제왕", "甲-辰": "쇠", "甲-巳": "병", "甲-午": "사", "甲-未": "묘", "甲-申": "절", "甲-酉": "태", "甲-戌": "양",
  "乙-午": "장생", "乙-巳": "목욕", "乙-辰": "관대", "乙-卯": "건록", "乙-寅": "제왕", "乙-丑": "쇠", "乙-子": "병", "乙-亥": "사", "乙-戌": "묘", "乙-酉": "절", "乙-申": "태", "乙-未": "양",
  "丙-寅": "장생", "丙-卯": "목욕", "丙-辰": "관대", "丙-巳": "건록", "丙-午": "제왕", "丙-未": "쇠", "丙-申": "병", "丙-酉": "사", "丙-戌": "묘", "丙-亥": "절", "丙-子": "태", "丙-丑": "양",
  "丁-酉": "장생", "丁-申": "목욕", "丁-미": "관대", "丁-오": "건록", "丁-사": "제왕", "丁-진": "쇠", "丁-묘": "병", "丁-인": "사", "丁-축": "묘", "丁-자": "절", "丁-해": "태", "丁-술": "양",
  "戊-寅": "장생", "戊-卯": "목욕", "戊-辰": "관대", "戊-巳": "건록", "戊-午": "제왕", "戊-未": "쇠", "戊-申": "병", "戊-酉": "사", "戊-戌": "묘", "戊-亥": "절", "戊-子": "태", "戊-丑": "양",
  "己-酉": "장생", "己-申": "목욕", "己-미": "관대", "己-오": "건록", "己-사": "제왕", "己-진": "쇠", "己-묘": "병", "己-인": "사", "己-축": "묘", "己-자": "절", "己-해": "태", "己-술": "양",
  "庚-巳": "장생", "庚-午": "목욕", "庚-未": "관대", "庚-申": "건록", "庚-酉": "제왕", "庚-戌": "쇠", "庚-亥": "병", "庚-子": "사", "庚-丑": "묘", "庚-寅": "절", "庚-卯": "태", "庚-辰": "양",
  "辛-子": "장생", "辛-亥": "목욕", "辛-戌": "관대", "辛-酉": "건록", "辛-申": "제왕", "辛-未": "쇠", "辛-午": "병", "辛-巳": "사", "辛-辰": "묘", "辛-卯": "절", "辛-寅": "태", "辛-丑": "양",
  "壬-申": "장생", "壬-酉": "목욕", "壬-戌": "관대", "壬-亥": "건록", "壬-子": "제왕", "壬-丑": "쇠", "壬-寅": "병", "壬-卯": "사", "壬-辰": "묘", "壬-巳": "절", "壬-午": "태", "壬-未": "양",
  "癸-卯": "장생", "癸-寅": "목욕", "癸-축": "관대", "癸-자": "건록", "癸-해": "제왕", "癸-술": "쇠", "癸-유": "병", "癸-신": "사", "癸-미": "묘", "癸-오": "절", "癸-사": "태", "癸-진": "양",
};

export const calculateSipsin = (ilgan: string, targetGanJi: string, isGan: boolean): Sipsin => {
  const ilganOheng = getGanOheng(ilgan);
  const targetOheng = isGan ? getGanOheng(targetGanJi) : getJiOheng(targetGanJi);
  const ilganPol = GAN_POLARITY[ilgan];
  const targetPol = isGan ? GAN_POLARITY[targetGanJi] : JI_POLARITY[targetGanJi];
  
  const key = `${ilganOheng}-${targetOheng}-${ilganPol === targetPol}`;
  return SIPSIN_MAP[key];
};

export const calculateTwelveUnseong = (ilgan: string, ji: string): TwelveUnseong => {
  return TWELVE_UNSEONG_MAP[`${ilgan}-${ji}`] || TWELVE_UNSEONG_MAP[`${ilgan}-${ji.charAt(0)}`];
};

// Simplified Gongmang Calculation based on Sun (Group of 10)
const GANTS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const JITS = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const GAN_TO_HANJA: Record<string, string> = { "갑": "甲", "을": "乙", "병": "丙", "정": "丁", "무": "戊", "기": "己", "경": "庚", "신": "辛", "임": "壬", "계": "癸" };
const JI_TO_HANJA: Record<string, string> = { "자": "子", "축": "丑", "인": "寅", "묘": "卯", "진": "辰", "사": "巳", "오": "午", "미": "未", "신": "申", "유": "酉", "술": "戌", "해": "亥" };

export const calculateGongmang = (dayGan: string, dayJi: string): string[] => {
  const dGan = GAN_TO_HANJA[dayGan] || dayGan;
  const dJi = JI_TO_HANJA[dayJi] || dayJi;
  const ganIdx = GANTS.indexOf(dGan);
  const jiIdx = JITS.indexOf(dJi);
  if (ganIdx === -1 || jiIdx === -1) return [];

  const headJiIdx = (jiIdx - ganIdx + 12) % 12;
  const gong1Idx = (headJiIdx + 10) % 12;
  const gong2Idx = (headJiIdx + 11) % 12;

  return [JITS[gong1Idx], JITS[gong2Idx]];
};

// Sinsal (Symbolic Stars) Logic
export const calculateSinsal = (palja: Palja): Sinsal[] => {
  const sinsals: Sinsal[] = [];
  const { year, day } = palja;
  const pillars: Array<{ unit: PaljaUnit; key: "year" | "month" | "day" | "time" }> = [
    { unit: palja.year, key: "year" },
    { unit: palja.month, key: "month" },
    { unit: palja.day, key: "day" },
    { unit: palja.time, key: "time" },
  ];

  const cheonEulMap: Record<string, string[]> = {
    "甲": ["丑", "未"], "갑": ["축", "미"],
    "乙": ["子", "申"], "을": ["자", "신"],
    "丙": ["亥", "酉"], "병": ["해", "유"],
    "丁": ["亥", "酉"], "정": ["해", "유"],
    "戊": ["丑", "未"], "무": ["축", "미"],
    "己": ["子", "申"], "기": ["자", "신"],
    "庚": ["寅", "午"], "경": ["인", "오"],
    "辛": ["寅", "午"], "신": ["인", "오"],
    "壬": ["卯", "巳"], "임": ["묘", "사"],
    "癸": ["卯", "巳"], "계": ["묘", "사"],
  };

  const dayGanTargets = cheonEulMap[day.gan] || [];
  pillars.forEach(p => {
    if (dayGanTargets.includes(p.unit.ji)) {
      sinsals.push({ name: "천을귀인", pillar: p.key, description: "최고의 길신, 어려움에서 벗어나게 도와줌" });
    }
  });

  const yeokMaMap: Record<string, string> = {
    "申": "寅", "신": "인", "子": "寅", "자": "인", "辰": "寅", "진": "인",
    "寅": "申", "인": "신", "午": "申", "오": "신", "戌": "申", "술": "신",
    "巳": "亥", "사": "해", "酉": "亥", "유": "해", "丑": "亥", "축": "해",
    "亥": "巳", "해": "사", "卯": "巳", "묘": "사", "未": "巳", "미": "사",
  };
  const standardJiYM = yeokMaMap[year.ji] || yeokMaMap[day.ji];
  pillars.forEach(p => {
    if (p.unit.ji === standardJiYM) {
      sinsals.push({ name: "역마살", pillar: p.key, description: "이동, 변화, 해외와 인연" });
    }
  });

  const doHwaMap: Record<string, string> = {
    "申": "酉", "신": "유", "子": "酉", "자": "유", "辰": "酉", "진": "유",
    "寅": "卯", "인": "묘", "午": "卯", "오": "묘", "戌": "卯", "술": "묘",
    "巳": "午", "사": "오", "酉": "午", "유": "오", "丑": "午", "축": "오",
    "亥": "子", "해": "자", "卯": "子", "묘": "자", "未": "子", "미": "자",
  };
  const doHwaTarget = doHwaMap[year.ji] || doHwaMap[day.ji];
  pillars.forEach(p => {
    if (p.unit.ji === doHwaTarget) {
      sinsals.push({ name: "도화살", pillar: p.key, description: "대중의 인기, 매력, 감성적 에너지" });
    }
  });

  return sinsals;
};

export const enrichPalja = (palja: Palja): Palja => {
  const ilgan = palja.day.gan;

  const enrichUnit = (unit: PaljaUnit, pillar: keyof Palja): PaljaUnit => {
    if (pillar === "day") {
      return {
        ...unit,
        sipsinJi: calculateSipsin(ilgan, unit.ji, false),
        twelveUnseong: calculateTwelveUnseong(ilgan, unit.ji),
      };
    }
    return {
      ...unit,
      sipsinGan: calculateSipsin(ilgan, unit.gan, true),
      sipsinJi: calculateSipsin(ilgan, unit.ji, false),
      twelveUnseong: calculateTwelveUnseong(ilgan, unit.ji),
    };
  };

  return {
    year: enrichUnit(palja.year, "year"),
    month: enrichUnit(palja.month, "month"),
    day: enrichUnit(palja.day, "day"),
    time: enrichUnit(palja.time, "time"),
    gongmang: calculateGongmang(palja.day.gan, palja.day.ji),
  };
};
