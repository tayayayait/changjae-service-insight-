export interface SajuInput {
  calendarType: "solar" | "lunar";
  year: string;
  month: string;
  day: string;
  gender: "male" | "female" | "";
  birthTime: string;
  birthTimeUnknown: boolean;
  birthPlace: string;
}

export const DEFAULT_SAJU_INPUT: SajuInput = {
  calendarType: "solar",
  year: "",
  month: "",
  day: "",
  gender: "",
  birthTime: "",
  birthTimeUnknown: false,
  birthPlace: "",
};

export function generateYears(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear; y >= 1920; y--) {
    years.push(`${y}년`);
  }
  return years;
}

export function generateMonths(): string[] {
  return Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
}

export function generateDays(): string[] {
  return Array.from({ length: 31 }, (_, i) => `${i + 1}일`);
}

export const BIRTH_TIMES = [
  "자시 (23:00~01:00)",
  "축시 (01:00~03:00)",
  "인시 (03:00~05:00)",
  "묘시 (05:00~07:00)",
  "진시 (07:00~09:00)",
  "사시 (09:00~11:00)",
  "오시 (11:00~13:00)",
  "미시 (13:00~15:00)",
  "신시 (15:00~17:00)",
  "유시 (17:00~19:00)",
  "술시 (19:00~21:00)",
  "해시 (21:00~23:00)",
];

export const BIRTH_PLACES = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  "해외",
];
