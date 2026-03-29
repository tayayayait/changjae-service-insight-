import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar as CalendarIcon, Loader2, MoonStar, RefreshCw } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCosmicCalendarFlow } from "@/hooks/astrology/useCosmicCalendarFlow";
import { AdGate } from "@/components/common/AdGate";
import { AstrologyRequest } from "@/types/result";

type LocationOption = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  tz: string;
};

const impactLabelMap = {
  high: "강함",
  medium: "보통",
  low: "약함",
} as const;

const phaseLabelMap = {
  early: "초반",
  mid: "중반",
  late: "후반",
} as const;

const LOCATION_OPTIONS: LocationOption[] = [
  { id: "seoul", label: "서울", lat: 37.5665, lng: 126.978, tz: "Asia/Seoul" },
  { id: "busan", label: "부산", lat: 35.1796, lng: 129.0756, tz: "Asia/Seoul" },
  { id: "daegu", label: "대구", lat: 35.8714, lng: 128.6014, tz: "Asia/Seoul" },
  { id: "incheon", label: "인천", lat: 37.4563, lng: 126.7052, tz: "Asia/Seoul" },
  { id: "gwangju", label: "광주", lat: 35.1595, lng: 126.8526, tz: "Asia/Seoul" },
  { id: "daejeon", label: "대전", lat: 36.3504, lng: 127.3845, tz: "Asia/Seoul" },
  { id: "ulsan", label: "울산", lat: 35.5384, lng: 129.3114, tz: "Asia/Seoul" },
  { id: "jeju", label: "제주", lat: 33.4996, lng: 126.5312, tz: "Asia/Seoul" },
];

const formatMonthHeading = (year: number, month: number) =>
  `${year}년 ${month}월 운세 예측 가이드`;

const parseBirthDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
};

const parseBirthTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
};

export default function CosmicCalendarPage() {
  const {
    year,
    month,
    calendarData,
    isLoading,
    fetchError,
    hasSubmittedProfile,
    orderedPhaseGuides,
    profileBannerText,
    fetchCalendar,
  } = useCosmicCalendarFlow();

  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTimeKnown, setBirthTimeKnown] = useState(false);
  const [birthTime, setBirthTime] = useState("");
  const [locationId, setLocationId] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const monthKey = `${year}-${month}`;
  const prevMonthKeyRef = useRef(monthKey);

  useEffect(() => {
    if (prevMonthKeyRef.current === monthKey) {
      return;
    }

    prevMonthKeyRef.current = monthKey;
    setName("");
    setBirthDate("");
    setBirthTimeKnown(false);
    setBirthTime("");
    setLocationId("");
    setInputError(null);
  }, [monthKey]);

  const isFormValid = useMemo(() => {
    if (!name.trim() || !birthDate || !locationId) {
      return false;
    }
    if (birthTimeKnown && !birthTime) {
      return false;
    }
    return true;
  }, [birthDate, birthTime, birthTimeKnown, locationId, name]);

  const handleRunCalendar = async () => {
    setInputError(null);

    const selectedLocation = LOCATION_OPTIONS.find((item) => item.id === locationId);
    if (!selectedLocation) {
      setInputError("출생지를 선택해 주세요.");
      return;
    }

    const parsedDate = parseBirthDate(birthDate);
    if (!parsedDate) {
      setInputError("생년월일 형식이 올바르지 않습니다.");
      return;
    }

    const parsedTime = birthTimeKnown ? parseBirthTime(birthTime) : { hour: 12, minute: 0 };
    if (!parsedTime) {
      setInputError("출생 시간 형식이 올바르지 않습니다.");
      return;
    }

    const profileRequest: AstrologyRequest = {
      name: name.trim(),
      year: parsedDate.year,
      month: parsedDate.month,
      day: parsedDate.day,
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      tz_str: selectedLocation.tz,
      birthTimeKnown,
    };

    await fetchCalendar(year, month, profileRequest);
  };

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title="운세 예보"
      subtitle="이번 달의 행성 에너지 흐름과 행동 우선순위를 정리합니다."
      themeColor="accent-sky"
      icon={MoonStar}
    >
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        <Card className="rounded-3xl border-[#24303F]/10 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-[#24303F]">
              <CalendarIcon className="h-5 w-5 text-[#C9A86A]" />
              {formatMonthHeading(year, month)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-700">
              운세 예보는 이 화면에서 직접 입력한 정보로만 실행됩니다. 다른 서비스의 생년월일/개인정보는 자동 연동되지 않습니다.
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="cosmic-name" className="text-xs font-semibold text-slate-600">이름</label>
                <input
                  id="cosmic-name"
                  aria-label="cosmic-name-input"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/40"
                  placeholder="본인 이름"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cosmic-birth-date" className="text-xs font-semibold text-slate-600">생년월일</label>
                <input
                  id="cosmic-birth-date"
                  aria-label="cosmic-birth-date-input"
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cosmic-location" className="text-xs font-semibold text-slate-600">출생지</label>
                <select
                  id="cosmic-location"
                  aria-label="cosmic-location-select"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/40"
                >
                  <option value="">출생지 선택</option>
                  {LOCATION_OPTIONS.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="cosmic-birth-time" className="text-xs font-semibold text-slate-600">출생 시간</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      aria-label="cosmic-birth-time-known-toggle"
                      type="checkbox"
                      checked={birthTimeKnown}
                      onChange={(event) => {
                        setBirthTimeKnown(event.target.checked);
                        if (!event.target.checked) {
                          setBirthTime("");
                        }
                      }}
                    />
                    시간 알고 있음
                  </label>
                </div>
                <input
                  id="cosmic-birth-time"
                  aria-label="cosmic-birth-time-input"
                  type="time"
                  value={birthTime}
                  onChange={(event) => setBirthTime(event.target.value)}
                  disabled={!birthTimeKnown}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C9A86A]/40"
                />
              </div>
            </div>

            {inputError ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {inputError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {hasSubmittedProfile ? "직접 입력 프로필 적용" : "입력 대기"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => void fetchCalendar(year, month)}
                disabled={isLoading || !hasSubmittedProfile}
              >
                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                다시 조회
              </Button>
              <Button
                aria-label="cosmic-run-button"
                size="sm"
                className="h-9"
                onClick={() => void handleRunCalendar()}
                disabled={isLoading || !isFormValid}
              >
                코스믹 운세 예보 실행
              </Button>
            </div>

            <p className="text-xs text-slate-500">{profileBannerText}</p>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="rounded-3xl border-[#24303F]/10 bg-white">
            <CardContent className="flex min-h-[180px] items-center justify-center">
              <div className="inline-flex items-center gap-2 text-slate-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                월간 가이드를 계산하고 있습니다.
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && fetchError ? (
          <Card className="rounded-3xl border-rose-200 bg-rose-50">
            <CardContent className="p-6 text-sm font-semibold text-rose-700">
              {fetchError}
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !fetchError && !calendarData ? (
          <Card className="rounded-3xl border-[#24303F]/10 bg-white">
            <CardContent className="p-6 text-sm text-slate-600">
              입력 후 실행 버튼을 눌러 이번 달 운세 예보 가이드를 생성하세요.
            </CardContent>
          </Card>
        ) : null}

        {!isLoading && !fetchError && calendarData ? (
          <AdGate enabled={true} countdownSec={5}>
          <div className="space-y-5">
            <Card className="rounded-3xl border-[#24303F]/10 bg-white">
              <CardHeader>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#C9A86A]">
                  Monthly Brief
                </p>
                <CardTitle className="text-2xl text-[#24303F]">
                  {calendarData.summary.headline}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-700">{calendarData.summary.focus}</p>
                <p className="text-sm font-semibold text-rose-700">
                  {calendarData.summary.caution}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#24303F]/10 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#24303F]">우선 행동</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-700">
                  {calendarData.priorityActions.map((action) => (
                    <li key={action}>- {action}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#24303F]/10 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#24303F]">선택 가이드</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {calendarData.choiceGuides.map((guide) => (
                  <article
                    key={guide.id}
                    className="rounded-2xl border border-[#24303F]/10 bg-[#FAF7F2] p-4"
                  >
                    <p className="font-bold text-[#24303F]">{guide.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{guide.guidance}</p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      추천: {guide.recommendedAction}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-rose-700">
                      피해야 할 선택: {guide.avoidAction}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#24303F]/10 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#24303F]">단계별 실행</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderedPhaseGuides.map((guide) => (
                  <article
                    key={`${guide.phase}-${guide.title}`}
                    className="rounded-2xl border border-[#24303F]/10 bg-[#FAF7F2] p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#24303F]">
                        {phaseLabelMap[guide.phase]}
                      </p>
                      <Badge variant="outline">{impactLabelMap[guide.impact]}</Badge>
                    </div>
                    <p className="font-semibold text-[#24303F]">{guide.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{guide.meaning}</p>
                    <p className="mt-2 text-sm font-semibold text-[#24303F]">
                      실행: {guide.action}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-[#24303F]/10 bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#24303F]">회피 리스트</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-rose-700">
                  {calendarData.avoidList.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          </AdGate>
        ) : null}
      </div>
    </AnalysisPageShell>
  );
}
