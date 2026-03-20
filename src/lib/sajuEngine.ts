import {
  calculateSaju as calculateSajuWithLibrary,
  lunarToSolar,
  type SajuResult as ManseryeokSajuResult,
} from "@fullstackfamily/manseryeok";
import { buildPaljaFromPillars, calculateOhengDistribution, determineYongsin } from "./ohengCalculator";
import { enrichPalja, calculateSinsal } from "./sajuAnalyzer";
import { getTimeBlock } from "./timeBlocks";
import { Oheng, OhengDistribution, Palja, UserBirthData, Sinsal } from "../types/result";

const DEFAULT_LONGITUDE = 127;

const LOCATION_LONGITUDES: Record<string, number> = {
  "서울": 126.978,
  "경기/인천": 126.9,
  "강원": 128.3,
  "충북/세종": 127.5,
  "충남/대전": 127.3,
  "경북/대구": 128.6,
  "경남/부산/울산": 129.1,
  "전북": 127.1,
  "전남/광주": 126.9,
  "제주": 126.5,
  "해외": 127,
  "모름": 127,
};

const LOCATION_PREFIX_LONGITUDES: Record<string, number> = {
  "서울특별시": 126.978,
  "부산광역시": 129.0756,
  "대구광역시": 128.6014,
  "인천광역시": 126.7052,
  "광주광역시": 126.8526,
  "대전광역시": 127.3845,
  "울산광역시": 129.3114,
  "세종특별자치시": 127.289,
  "경기도": 126.9,
  "강원특별자치도": 128.3,
  "충청북도": 127.5,
  "충청남도": 127.3,
  "전북특별자치도": 127.1,
  "전라남도": 126.9,
  "경상북도": 128.6,
  "경상남도": 129.1,
  "제주특별자치도": 126.5,
  "해외": 127,
};

export interface SolarBirthDate {
  year: number;
  month: number;
  day: number;
  wasConvertedFromLunar: boolean;
}

export interface CalculatedSajuPayload {
  palja: Palja;
  oheng: OhengDistribution[];
  yongsin: Oheng[];
  sinsal: Sinsal[];
  solarDate: SolarBirthDate;
  raw: ManseryeokSajuResult;
}

export const resolveLongitude = (location?: string) => {
  if (!location) {
    return DEFAULT_LONGITUDE;
  }

  const normalizedLocation = location.trim();
  const exactLongitude = LOCATION_LONGITUDES[normalizedLocation];
  if (typeof exactLongitude === "number") {
    return exactLongitude;
  }

  const matchedPrefix = Object.entries(LOCATION_PREFIX_LONGITUDES).find(([prefix]) =>
    normalizedLocation.startsWith(prefix),
  );
  if (matchedPrefix) {
    return matchedPrefix[1];
  }

  return DEFAULT_LONGITUDE;
};

export const resolveSolarBirthDate = (data: UserBirthData): SolarBirthDate => {
  if (data.calendarType === "solar") {
    return {
      year: data.year,
      month: data.month,
      day: data.day,
      wasConvertedFromLunar: false,
    };
  }

  const lunar = lunarToSolar(data.year, data.month, data.day, data.calendarType === "lunar-leap");
  return {
    year: lunar.solar.year,
    month: lunar.solar.month,
    day: lunar.solar.day,
    wasConvertedFromLunar: true,
  };
};

export const resolveBirthTime = (data: Pick<UserBirthData, "hour" | "minute" | "timeBlock">) => {
  if (typeof data.hour === "number") {
    return {
      hour: data.hour,
      minute: data.minute ?? 0,
    };
  }

  const matchedBlock = getTimeBlock(data.timeBlock);
  if (matchedBlock) {
    return {
      hour: matchedBlock.midHour,
      minute: matchedBlock.midMinute,
    };
  }

  return {
    hour: 12,
    minute: 0,
  };
};

export const parseTimeString = (value?: string) => {
  if (!value) {
    return null;
  }

  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  return { hour, minute };
};

export const calculateSaju = (data: UserBirthData): CalculatedSajuPayload => {
  const solarDate = resolveSolarBirthDate(data);
  const birthTime = resolveBirthTime(data);

  const raw = calculateSajuWithLibrary(
    solarDate.year,
    solarDate.month,
    solarDate.day,
    birthTime.hour,
    birthTime.minute,
    {
      longitude: resolveLongitude(data.location),
      applyTimeCorrection: true,
    },
  );

  const palja = buildPaljaFromPillars({
    yearPillar: raw.yearPillar,
    monthPillar: raw.monthPillar,
    dayPillar: raw.dayPillar,
    hourPillar: raw.hourPillar,
    yearPillarHanja: raw.yearPillarHanja,
    monthPillarHanja: raw.monthPillarHanja,
    dayPillarHanja: raw.dayPillarHanja,
    hourPillarHanja: raw.hourPillarHanja,
  });

  const enrichedPalja = enrichPalja(palja);
  const oheng = calculateOhengDistribution(enrichedPalja);
  const sinsal = calculateSinsal(enrichedPalja);

  return {
    palja: enrichedPalja,
    oheng,
    yongsin: determineYongsin(enrichedPalja, oheng),
    sinsal,
    solarDate,
    raw,
  };
};
