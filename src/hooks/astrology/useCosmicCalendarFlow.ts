import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAstrologyAICalendar } from "@/lib/astrologyClient";
import { useConsultStore } from "@/store/useConsultStore";
import { AstrologyCalendarResult, AstrologyRequest } from "@/types/result";

const PHASE_ORDER: Record<
  AstrologyCalendarResult["phaseGuides"][number]["phase"],
  number
> = {
  early: 0,
  mid: 1,
  late: 2,
};

const PROFILE_REQUIRED_MESSAGE = "코스믹 이벤트는 이 화면에서 본인 정보를 입력한 뒤에만 실행됩니다.";
const KST_TIME_ZONE = "Asia/Seoul";
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2_147_000_000;

type YearMonth = {
  year: number;
  month: number;
};

type CalendarCacheValue = {
  result: AstrologyCalendarResult;
};

const toInt = (value: number) => (Number.isFinite(value) ? Math.trunc(value) : 0);

const roundTo = (value: number, digits: number) => {
  if (!Number.isFinite(value)) return 0;
  const unit = 10 ** digits;
  return Math.round(value * unit) / unit;
};

const normalizeProfileForCache = (profile: AstrologyRequest) => ({
  name: typeof profile.name === "string" ? profile.name.trim() : "",
  year: toInt(profile.year),
  month: toInt(profile.month),
  day: toInt(profile.day),
  hour: toInt(profile.hour),
  minute: toInt(profile.minute),
  lat: roundTo(profile.lat, 6),
  lng: roundTo(profile.lng, 6),
  tz_str: typeof profile.tz_str === "string" ? profile.tz_str.trim() : "",
  birthTimeKnown: profile.birthTimeKnown === true,
});

const toYearMonthFromDateParts = (date: Date, timeZone: string): YearMonth | null => {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
    });

    const parts = formatter.formatToParts(date);
    const year = Number(parts.find((part) => part.type === "year")?.value ?? NaN);
    const month = Number(parts.find((part) => part.type === "month")?.value ?? NaN);
    if (Number.isFinite(year) && Number.isFinite(month)) {
      return { year, month };
    }
  } catch {
    // ignore and use deterministic fallback
  }

  return null;
};

export const getKstYearMonth = (date: Date): YearMonth => {
  const fromIntl = toYearMonthFromDateParts(date, KST_TIME_ZONE);
  if (fromIntl) {
    return fromIntl;
  }

  const kstDate = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: kstDate.getUTCFullYear(),
    month: kstDate.getUTCMonth() + 1,
  };
};

export const getDelayToNextKstMonth = (now: Date): number => {
  const { year, month } = getKstYearMonth(now);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextKstBoundaryUtcMs =
    Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0, 0) - KST_OFFSET_MS;
  const delay = nextKstBoundaryUtcMs - now.getTime();
  return Math.max(1_000, delay);
};

const createCalendarCacheKey = (
  targetYear: number,
  targetMonth: number,
  profile: AstrologyRequest,
) =>
  JSON.stringify({
    targetYear: toInt(targetYear),
    targetMonth: toInt(targetMonth),
    profile: normalizeProfileForCache(profile),
  });

export function useCosmicCalendarFlow() {
  const [yearMonth, setYearMonth] = useState<YearMonth>(() => getKstYearMonth(new Date()));
  const [calendarData, setCalendarData] = useState<AstrologyCalendarResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submittedProfile, setSubmittedProfile] = useState<AstrologyRequest | null>(null);
  const cacheRef = useRef<Map<string, CalendarCacheValue>>(new Map());
  const prevYearMonthRef = useRef<YearMonth>(yearMonth);

  const setService = useConsultStore((state) => state.setService);

  useEffect(() => {
    setService("astrology", "astro-cosmic-calendar");
  }, [setService]);

  useEffect(() => {
    const prev = prevYearMonthRef.current;
    if (prev.year !== yearMonth.year || prev.month !== yearMonth.month) {
      setCalendarData(null);
      setFetchError(null);
      setSubmittedProfile(null);
    }
    prevYearMonthRef.current = yearMonth;
  }, [yearMonth]);

  const syncKstMonth = useCallback(() => {
    const next = getKstYearMonth(new Date());
    setYearMonth((prev) =>
      prev.year === next.year && prev.month === next.month ? prev : next,
    );
  }, []);

  useEffect(() => {
    let isDisposed = false;
    let timeoutId: number | null = null;

    const scheduleTick = () => {
      if (isDisposed) return;
      const remaining = getDelayToNextKstMonth(new Date());
      const delay = Math.min(remaining, MAX_TIMEOUT_MS);
      timeoutId = window.setTimeout(() => {
        syncKstMonth();
        scheduleTick();
      }, delay);
    };

    const handleVisibilityOrFocus = () => {
      syncKstMonth();
    };

    scheduleTick();
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      isDisposed = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [syncKstMonth]);

  const hasSubmittedProfile = submittedProfile !== null;
  const year = yearMonth.year;
  const month = yearMonth.month;

  const fetchCalendar = useCallback(
    async (
      targetYear: number,
      targetMonth: number,
      profileInput?: AstrologyRequest,
    ): Promise<boolean> => {
      const activeProfile = profileInput ?? submittedProfile;
      if (!activeProfile) {
        setFetchError(PROFILE_REQUIRED_MESSAGE);
        return false;
      }

      const cacheKey = createCalendarCacheKey(targetYear, targetMonth, activeProfile);
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        setCalendarData(cached.result);
        setFetchError(null);
        if (profileInput) {
          setSubmittedProfile(profileInput);
        }
        return true;
      }

      try {
        setIsLoading(true);
        setFetchError(null);

        const result = await getAstrologyAICalendar(
          targetYear,
          targetMonth,
          activeProfile,
        );
        cacheRef.current.set(cacheKey, { result });
        setCalendarData(result);
        if (profileInput) {
          setSubmittedProfile(profileInput);
        }
        return true;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "월간 가이드를 불러오지 못했습니다.";
        setFetchError(message);
        toast({
          title: "월간 가이드 생성 실패",
          description: message,
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [submittedProfile],
  );

  const orderedPhaseGuides = useMemo(() => {
    if (!calendarData) {
      return [];
    }

    return [...calendarData.phaseGuides].sort(
      (a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase],
    );
  }, [calendarData]);

  const profileBannerText = useMemo(() => {
    if (hasSubmittedProfile) {
      return "현재 화면에서 직접 입력한 정보로 코스믹 이벤트를 계산하고 있습니다.";
    }
    return "아직 입력 정보가 없습니다. 이 화면에서 본인 정보를 직접 입력해야 코스믹 이벤트를 실행할 수 있습니다.";
  }, [hasSubmittedProfile]);

  return {
    year,
    month,
    calendarData,
    isLoading,
    fetchError,
    hasSubmittedProfile,
    orderedPhaseGuides,
    profileBannerText,
    fetchCalendar,
  };
}
