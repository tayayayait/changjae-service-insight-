import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { BirthPrecision, DataPrivacyMode, UserInterest } from "@/types/result";
import { getTimeBlockLabel, TIME_BLOCKS } from "@/lib/timeBlocks";

type AnalysisPhase = "cache-check" | "ai-analysis" | "result-save";
type LocationScope = "domestic" | "overseas";

const DOMESTIC_PLACES = [
  "서울특별시",
  "인천광역시",
  "대전광역시",
  "대구광역시",
  "부산광역시",
  "울산광역시",
  "광주광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "경상북도",
  "경상남도",
  "전북특별자치도",
  "전라남도",
  "제주특별자치도",
  "모름",
];

const OVERSEAS_PLACES = [
  "일본",
  "중국",
  "동남아",
  "미국/캐나다",
  "유럽",
  "중동",
  "남미",
  "오세아니아",
  "아프리카",
  "기타",
  "모름",
];

export function useSajuInputForm(initialInterests: UserInterest[]) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>("cache-check");
  const [dataPrivacyMode] = useState<DataPrivacyMode>("local-only");

  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "lunar-leap">("solar");
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [day, setDay] = useState<string>("");

  const [birthPrecision, setBirthPrecision] = useState<BirthPrecision>("unknown");
  const [timeBlock, setTimeBlock] = useState<string>(TIME_BLOCKS[0].id);
  const [exactTime, setExactTime] = useState("");

  const [locationScope, setLocationScope] = useState<LocationScope>("domestic");
  const [place, setPlace] = useState<string>("서울특별시");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [name, setName] = useState<string>("");

  const [interests] = useState<UserInterest[]>(initialInterests);
  const [freeQuestion] = useState("");

  useEffect(() => {
    trackEvent("input_started");
  }, []);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => String(currentYear - i)), [currentYear]);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);

  const currentPlaces = locationScope === "domestic" ? DOMESTIC_PLACES : OVERSEAS_PLACES;

  return {
    isSubmitting,
    setIsSubmitting,
    analysisPhase,
    setAnalysisPhase,
    dataPrivacyMode,
    calendarType,
    setCalendarType,
    year,
    setYear,
    month,
    setMonth,
    day,
    setDay,
    birthPrecision,
    setBirthPrecision,
    timeBlock,
    setTimeBlock,
    exactTime,
    setExactTime,
    locationScope,
    setLocationScope,
    place,
    setPlace,
    gender,
    setGender,
    name,
    setName,
    interests,
    freeQuestion,
    years,
    months,
    days,
    currentPlaces,
    getTimeBlockLabel,
  };
}
