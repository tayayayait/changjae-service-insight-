import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Info, Loader2, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { TIME_BLOCKS } from "@/lib/timeBlocks";
import { useSajuInputForm } from "@/hooks/saju/useSajuInputForm";
import { useSajuAnalysisFlow } from "@/hooks/saju/useSajuAnalysisFlow";
import { useConsultStore } from "@/store/useConsultStore";
import { useResultStore } from "@/store/useResultStore";
import { useBeforeUnload } from "@/hooks/useBeforeUnload";
import { UserInterest } from "@/types/result";
import { MysticalLoading } from "@/components/common/MysticalLoading";
import { AdUnit } from "@/components/common/AdUnit";

type AnalysisPhase = "cache-check" | "ai-analysis" | "result-save";

const ANALYSIS_PHASE_LABELS: Record<AnalysisPhase, string> = {
  "cache-check": "기존 결과 확인 중...",
  "ai-analysis": "AI 분석 진행 중...",
  "result-save": "결과 저장 중...",
};

export default function SajuInputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const updateProfile = useConsultStore((state) => state.updateProfile);
  const serviceId = useConsultStore((state) => state.serviceId);
  const loadResultById = useResultStore((state) => state.loadResultById);

  const initialInterests =
    (location.state as { initialInterests?: UserInterest[] } | null)?.initialInterests ?? [];

  const {
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
  } = useSajuInputForm(initialInterests);

  const { handleSubmit, isFormValid } = useSajuAnalysisFlow({
    navigate,
    searchParams,
    serviceId,
    updateProfile,
    loadResultById,
    setIsSubmitting,
    setAnalysisPhase,
    dataPrivacyMode,
    calendarType,
    year,
    month,
    day,
    birthPrecision,
    timeBlock,
    exactTime,
    place,
    gender,
    name,
    interests,
    freeQuestion,
  });

  // 입력 중 페이지 이탈 방지: 이름이 작성되었거나 분석 진행 중이면 경고 표시
  const isDirty = Boolean(name.trim()) || isSubmitting;
  useBeforeUnload(isDirty);

  if (isSubmitting) {
    return (
      <AppLayout hideBottomNav>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white space-y-8 px-4">
          <MysticalLoading
            categoryId="saju"
            title={ANALYSIS_PHASE_LABELS[analysisPhase as AnalysisPhase] || "사주를 분석하고 있습니다"}
          />
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="mb-2 text-center text-[10px] font-bold tracking-widest text-slate-400">ADVERTISEMENT</p>
            <AdUnit slot="6738850110" format="auto" className="min-h-[250px]" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideBottomNav>
      <div className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-xl font-black text-foreground sm:text-2xl">사주 정보 입력</h1>
            <p className="text-xs font-semibold text-muted-foreground">
              정확한 분석을 위해 출생 정보를 입력해 주세요.
            </p>
          </div>
          <div className="w-10" />
        </header>

        <Card className="rounded-[28px] border-border bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-8">
            <section className="space-y-2.5">
              <Label className="text-sm font-bold">이름</Label>
              <Input
                placeholder="이름을 입력해 주세요"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl"
              />
            </section>

            <section className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label className="text-sm font-bold">성별</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "male", label: "남성" },
                    { id: "female", label: "여성" },
                  ] as const).map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 rounded-xl",
                        gender === item.id ? "border-primary bg-primary/10 text-primary" : "",
                      )}
                      onClick={() => setGender(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Label className="text-sm font-bold">달력 기준</Label>
                <Tabs
                  value={calendarType}
                  onValueChange={(value) =>
                    setCalendarType(value as "solar" | "lunar" | "lunar-leap")
                  }
                >
                  <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl">
                    <TabsTrigger value="solar">양력</TabsTrigger>
                    <TabsTrigger value="lunar">음력</TabsTrigger>
                    <TabsTrigger value="lunar-leap">음력 윤달</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </section>

            <section className="space-y-2.5">
              <Label className="text-sm font-bold">생년월일</Label>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="연도" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {years.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}년
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="월" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}월
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={day} onValueChange={setDay}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="일" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {days.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}일
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">출생 시간</Label>
                <div className="flex gap-1">
                  {([
                    { id: "unknown", label: "모름" },
                    { id: "time-block", label: "시간대" },
                    { id: "exact", label: "정확" },
                  ] as const).map((option) => (
                    <Button
                      key={option.id}
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9 rounded-lg px-3 text-xs",
                        birthPrecision === option.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "",
                      )}
                      onClick={() => setBirthPrecision(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {birthPrecision === "exact" ? (
                <Input
                  value={exactTime}
                  onChange={(event) => setExactTime(event.target.value)}
                  placeholder="예: 14:30"
                  className="h-12 rounded-xl"
                />
              ) : null}

              {birthPrecision === "time-block" ? (
                <Select value={timeBlock} onValueChange={setTimeBlock}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="시간대 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_BLOCKS.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.label} ({block.range})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </section>

            <section className="space-y-2.5">
              <Label className="text-sm font-bold">출생 지역</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 rounded-xl",
                    locationScope === "domestic"
                      ? "border-primary bg-primary/10 text-primary"
                      : "",
                  )}
                  onClick={() => setLocationScope("domestic")}
                >
                  국내
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-10 rounded-xl",
                    locationScope === "overseas"
                      ? "border-primary bg-primary/10 text-primary"
                      : "",
                  )}
                  onClick={() => setLocationScope("overseas")}
                >
                  해외
                </Button>
              </div>

              <Select value={place} onValueChange={setPlace}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="지역 선택" />
                </SelectTrigger>
                <SelectContent>
                  {currentPlaces.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
          </div>
        </Card>

        <div className="mt-6 space-y-3">
          <Button
            className="h-14 w-full rounded-2xl bg-[#24303F] text-base font-bold text-white"
            onClick={() => void handleSubmit()}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {ANALYSIS_PHASE_LABELS[analysisPhase as AnalysisPhase]}
              </span>
            ) : (
              "사주 분석 시작"
            )}
          </Button>

          <div className="flex items-start gap-2 rounded-xl border border-[#BFD0C7]/40 bg-[#FAF7F2] px-4 py-3 text-xs text-[#24303F]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A86A]" />
            <p>입력 정보는 분석 생성 목적에 한해 사용됩니다.</p>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              서비스 모드에 따라 단일 분석 또는 묶음 분석이 자동 선택됩니다.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
