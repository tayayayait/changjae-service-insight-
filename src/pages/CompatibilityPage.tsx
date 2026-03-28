import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { LuckScoreRing } from "@/components/charts/LuckScoreRing";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { CompatibilityResult, OhengDistribution, Palja, SajuResult, UserBirthData } from "@/types/result";
import { analyzeCompatibility } from "@/lib/geminiClient";
import { calculateSaju, parseTimeString } from "@/lib/sajuEngine";
import { ensureGuestSessionId, getLatestSajuResultOrProfile, saveCompatibilityResult } from "@/lib/resultStore";
import { REGION_SIDO_OPTIONS } from "@/lib/koreanRegions";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { InteractionCard } from "@/components/common/InteractionCard";
import { InsightCard } from "@/components/common/InsightCard";
import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

type CompatibilityMode = "love" | "friend" | "work";

const toDateParts = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return { year, month, day };
};

const toSafePersonAProfile = (profile: UserBirthData): UserBirthData => {
  if (typeof profile.year === "number" && typeof profile.month === "number" && typeof profile.day === "number") {
    return profile;
  }

  return {
    calendarType: "solar",
    year: 1900,
    month: 1,
    day: 1,
    timeBlock: "모름",
    location: "모름",
    gender: "female",
  };
};

export default function CompatibilityPage() {
  const [baseResult, setBaseResult] = useState<SajuResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compatibility, setCompatibility] = useState<CompatibilityResult | null>(null);

  const [mode, setMode] = useState<CompatibilityMode>("love");
  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "lunar-leap">("solar");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("서울");
  const [gender, setGender] = useState<"male" | "female">("female");

  useEffect(() => {
    // 본인의 사주 데이터가 필요할 경우 명시적으로 분석 페이지로 유도합니다.
    setIsLoading(false);
  }, []);

  const canSubmit = useMemo(() => Boolean(date), [date]);

  const runAnalysis = async () => {
    if (!baseResult || !date) {
      return;
    }

    setError(null);
    setCompatibility(null);

    try {
      const parsedTime = parseTimeString(time);
      const { year, month, day } = toDateParts(date);

      const partnerData: UserBirthData = {
        calendarType,
        year,
        month,
        day,
        hour: parsedTime?.hour,
        minute: parsedTime?.minute,
        timeBlock: parsedTime ? undefined : "모름",
        location,
        gender,
      };

      const personB = calculateSaju(partnerData);
      const personA = {
        palja: baseResult.palja,
        oheng: baseResult.oheng,
      } as { palja: Palja; oheng: OhengDistribution[] };

      const ai = await analyzeCompatibility({
        mode,
        personA,
        personB: {
          palja: personB.palja,
          oheng: personB.oheng,
        },
      });

      const saved = await saveCompatibilityResult({
        guestSessionId: ensureGuestSessionId(),
        personA: toSafePersonAProfile(baseResult.profileData),
        personB: partnerData,
        personAPalja: personA.palja,
        personBPalja: personB.palja,
        personAOheng: personA.oheng,
        personBOheng: personB.oheng,
        score: ai.score,
        summary: ai.summary,
        strengths: ai.strengths,
        cautions: ai.cautions,
        advice: ai.advice,
      });

      setCompatibility(saved);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "궁합 계산 실패");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await runAnalysis();
  };

  const relationDiffs = useMemo(() => {
    if (!compatibility) {
      return [] as Array<{ element: string; diff: number }>;
    }

    return compatibility.personAOheng.map((item, index) => ({
      element: item.element,
      diff: Math.abs(item.percentage - (compatibility.personBOheng[index]?.percentage ?? 0)),
    }));
  }, [compatibility]);

  return (
    <AnalysisPageShell
      categoryId="love"
      title="사주 궁합"
      subtitle="연애, 친구, 협업 목적별로 궁합 점수와 행동 조언을 확인하세요."
      icon={HeartHandshake}
      themeColor="accent-pink"
    >
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: "love", label: "연애" },
          { value: "friend", label: "친구" },
          { value: "work", label: "협업" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setMode(item.value as CompatibilityMode)}
            className={cn(
               "h-12 rounded-xl border-2 transition-all font-bold text-[14px]",
               mode === item.value
                 ? "border-[#24303F] bg-gray-50 text-gray-900"
                 : "border-border bg-white text-text-secondary hover:bg-gray-50"
             )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? <SkeletonCard lines={4} /> : null}

      {!isLoading && !baseResult ? (
        <EmptyState
          title="기준 사주가 없습니다"
          description="궁합 계산을 위해 먼저 본인 사주 분석을 완료해주세요."
          actionLabel="내 사주 추가하기"
          actionTo="/saju"
        />
      ) : null}

      {baseResult && !compatibility && (
        <form onSubmit={handleSubmit}>
          <InteractionCard 
            title="상대방 정보 입력" 
            description="사주팔자 분석을 기준으로 내 사주와 비교합니다."
            step={1}
            totalSteps={1}
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 mt-4">
              <select
                className="h-12 rounded-xl border border-border px-3 text-[14px] bg-white focus:ring-2 focus:ring-ring focus:outline-none"
                value={calendarType}
                onChange={(event) => setCalendarType(event.target.value as typeof calendarType)}
              >
                <option value="solar">양력</option>
                <option value="lunar">음력 평달</option>
                <option value="lunar-leap">음력 윤달</option>
              </select>
              <input className="h-12 rounded-xl border border-border px-3 text-[14px] bg-white focus:ring-2 focus:ring-ring focus:outline-none" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              <input className="h-12 rounded-xl border border-border px-3 text-[14px] bg-white focus:ring-2 focus:ring-ring focus:outline-none" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              <select className="h-12 rounded-xl border border-border px-3 text-[14px] bg-white focus:ring-2 focus:ring-ring focus:outline-none" value={gender} onChange={(event) => setGender(event.target.value as "male" | "female")}>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
              <select
                className="h-12 rounded-xl border border-border px-3 text-[14px] bg-white md:col-span-2 focus:ring-2 focus:ring-ring focus:outline-none"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                {REGION_SIDO_OPTIONS.map((sido) => (
                  <option key={sido} value={sido}>
                    {sido}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="h-14 w-full bg-[#24303F] text-white rounded-xl mt-6" disabled={!canSubmit}>
              궁합 점수 확인하기
            </Button>
          </InteractionCard>
        </form>
      )}

      {error ? <ErrorCard message={error} onRetry={() => void runAnalysis()} /> : null}

      {compatibility ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="analysis-card flex flex-col items-center justify-center p-8 bg-white overflow-hidden text-center relative">
            <h2 className="text-[14px] font-bold text-text-secondary uppercase tracking-wider mb-2">총 궁합 점수</h2>
            <div className="my-6">
              <LuckScoreRing score={compatibility.score} />
            </div>
            <p className="text-[15px] leading-relaxed text-gray-800 font-medium">
               {compatibility.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <InsightCard 
                label="긍정적인 부분"
                title="우리의 강점 🌟"
                content={
                   <ul className="space-y-2 mt-2">
                     {compatibility.strengths.map((item, idx) => (
                       <li key={idx} className="flex gap-2 text-[14px] text-gray-700 leading-normal">
                         <span className="text-emerald-500 font-bold shrink-0">•</span>
                         <span>{item}</span>
                       </li>
                     ))}
                   </ul>
                }
                variant="highlight"
             />

             <InsightCard 
                label="조심해야 할 부분"
                title="주의 포인트 ⚠️"
                content={
                   <ul className="space-y-2 mt-2">
                     {compatibility.cautions.map((item, idx) => (
                       <li key={idx} className="flex gap-2 text-[14px] text-gray-700 leading-normal">
                         <span className="text-amber-500 font-bold shrink-0">•</span>
                         <span>{item}</span>
                       </li>
                     ))}
                   </ul>
                }
                variant="warning"
             />
          </div>

          <InsightCard 
             label="관계 가이드"
             title="서로를 위한 행동 조언 💬"
             content={compatibility.advice}
          />

          <div className="analysis-card mt-6">
             <h3 className="analysis-header mb-4">상생·상극 오행 지표</h3>
             <div className="space-y-3">
               {relationDiffs.map((item) => (
                 <div key={item.element} className="grid grid-cols-[40px_1fr_48px] items-center gap-3">
                   <span className="text-[13px] font-bold text-foreground">{item.element}</span>
                   <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                     <div className="h-full rounded-full bg-[#24303F]" style={{ width: `${Math.min(100, item.diff * 2)}%` }} />
                   </div>
                   <span className="text-[12px] text-text-secondary text-right font-medium">{item.diff.toFixed(1)} 차이</span>
                 </div>
               ))}
             </div>
          </div>
          
          <Button onClick={() => setCompatibility(null)} variant="outline" className="w-full h-14 rounded-xl mt-4">
            다른 사람과 궁합 보기
          </Button>
        </div>
      ) : null}
    </AnalysisPageShell>
  );
}
