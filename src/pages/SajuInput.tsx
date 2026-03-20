import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, Loader2, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StepProgress } from "@/components/saju/StepProgress";
import {
  BirthPrecision,
  DataPrivacyMode,
  LifetimeGeminiAnalysis,
  SAJU_ANALYSIS_SERVICE_IDS,
  SajuAnalysisResponse,
  SajuAnalysisServiceId,
  SajuServiceType,
  UserBirthData,
  UserInterest,
} from "@/types/result";
import { calculateSaju, parseTimeString } from "@/lib/sajuEngine";
import { getSajuAnalysis } from "@/lib/geminiClient";
import {
  SAJU_ANALYSIS_PROMPT_VERSION,
  buildSajuRequestFingerprint,
  ensureGuestSessionId,
  getSajuResultByFingerprint,
  saveSajuResult,
} from "@/lib/resultStore";
import { trackEvent } from "@/lib/analytics";
import { useConsultStore } from "@/store/useConsultStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getTimeBlockLabel, normalizeTimeBlockId, TIME_BLOCKS } from "@/lib/timeBlocks";

const TOTAL_STEPS = 8;

type AnalysisPhase = "cache-check" | "ai-analysis" | "result-save";

const ANALYSIS_PHASE_ORDER: AnalysisPhase[] = ["cache-check", "ai-analysis", "result-save"];

const ANALYSIS_PHASE_LABELS: Record<AnalysisPhase, string> = {
  "cache-check": "캐시 결과 조회",
  "ai-analysis": "AI 분석 진행",
  "result-save": "결과 저장 및 열기",
};

type LocationScope = "domestic" | "overseas";
const DOMESTIC_PLACES = [
  "서울",
  "경기/인천",
  "강원",
  "충북/세종",
  "충남/대전",
  "경북/대구",
  "경남/부산/울산",
  "전북",
  "전남/광주",
  "제주",
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

const isLifetimeAnalysis = (analysis: SajuAnalysisResponse): analysis is LifetimeGeminiAnalysis => {
  return (
    typeof (analysis as LifetimeGeminiAnalysis).lifetimeScore === "number" &&
    Array.isArray((analysis as LifetimeGeminiAnalysis).daeunPeriods) &&
    Array.isArray((analysis as LifetimeGeminiAnalysis).goldenPeriods)
  );
};

const isCalendarType = (value: unknown): value is UserBirthData["calendarType"] => {
  return value === "solar" || value === "lunar" || value === "lunar-leap";
};

const isGender = (value: unknown): value is UserBirthData["gender"] => {
  return value === "male" || value === "female";
};

const isSajuServiceType = (value: string): value is SajuServiceType => {
  return value === "traditional-saju" || SAJU_ANALYSIS_SERVICE_IDS.includes(value as SajuAnalysisServiceId);
};

export default function SajuInputPage() {
  const navigate = useNavigate();
  const { userProfile, updateProfile, serviceId } = useConsultStore();
  const { user, profile, initialized, isLoading: isAuthLoading } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>("cache-check");
  const [autoSubmitError, setAutoSubmitError] = useState<string | null>(null);
  const [allowManualInput, setAllowManualInput] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const autoSubmitAttemptedRef = useRef(false);

  const [dataPrivacyMode] = useState<DataPrivacyMode>("local-only");
  
  // 프로필 정보 우선 적용 (회원인 경우)
  const initialCalendarType = profile?.calendar_type || userProfile.calendarType || "solar";
  const initialYear = profile?.year || userProfile.year || null;
  const initialMonth = profile?.month || userProfile.month || null;
  const initialDay = profile?.day || userProfile.day || null;
  const initialGender = profile?.gender || userProfile.gender || null;
  const initialLocation = profile?.location || userProfile.location || "서울";
  
  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "lunar-leap">(initialCalendarType as any);
  const [selectedDecade, setSelectedDecade] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(initialYear);
  const [month, setMonth] = useState<number | null>(initialMonth);
  const [day, setDay] = useState<number | null>(initialDay);

  // 시간 정보 처리 (이전 입력값 호환)
  const initialBirthPrecision: BirthPrecision = (profile && profile.hour !== null) 
    ? "exact" 
    : (profile && profile.time_block) 
      ? "time-block" 
      : userProfile.birthPrecision || "unknown";

  const initialTimeBlock =
    normalizeTimeBlockId((profile && profile.time_block) || userProfile.timeBlock) || TIME_BLOCKS[0].id;

  const initialExactTime = (profile && profile.hour !== null)
    ? `${String(profile.hour).padStart(2, '0')}:${String(profile.minute || 0).padStart(2, '0')}`
    : userProfile.hour !== undefined 
      ? `${String(userProfile.hour).padStart(2, '0')}:${String(userProfile.minute || 0).padStart(2, '0')}`
      : "";

  const [birthPrecision, setBirthPrecision] = useState<BirthPrecision>(initialBirthPrecision);
  const [timeBlock, setTimeBlock] = useState<string>(initialTimeBlock);
  const [exactTime, setExactTime] = useState(initialExactTime);

  const [locationScope, setLocationScope] = useState<LocationScope>(
    initialLocation === "해외" || OVERSEAS_PLACES.includes(initialLocation) ? "overseas" : "domestic"
  );
  const [place, setPlace] = useState<string>(initialLocation);
  const [gender, setGender] = useState<"male" | "female" | null>(initialGender as any);

  const location = useLocation();
  const initialInterests = (location.state as { initialInterests?: UserInterest[] })?.initialInterests || [];
  const requestedMode = new URLSearchParams(location.search).get("mode");

  const [interests, setInterests] = useState<UserInterest[]>(initialInterests);
  const [freeQuestion, setFreeQuestion] = useState("");

  const autoProfileBirthData = useMemo<UserBirthData | null>(() => {
    if (!profile) {
      return null;
    }

    if (
      !isCalendarType(profile.calendar_type) ||
      !isGender(profile.gender) ||
      typeof profile.year !== "number" ||
      typeof profile.month !== "number" ||
      typeof profile.day !== "number"
    ) {
      return null;
    }

    const normalizedTimeBlock = normalizeTimeBlockId(profile.time_block);
    const hasExactTime = typeof profile.hour === "number";
    const resolvedBirthPrecision: BirthPrecision = hasExactTime
      ? "exact"
      : normalizedTimeBlock
        ? "time-block"
        : "unknown";

    return {
      calendarType: profile.calendar_type,
      year: profile.year,
      month: profile.month,
      day: profile.day,
      hour: hasExactTime ? profile.hour : undefined,
      minute: hasExactTime ? profile.minute ?? 0 : undefined,
      timeBlock: resolvedBirthPrecision === "time-block" ? normalizedTimeBlock ?? undefined : undefined,
      birthPrecision: resolvedBirthPrecision,
      location: profile.location || "서울",
      gender: profile.gender,
    };
  }, [profile]);

  useEffect(() => {
    trackEvent("input_started");
  }, []);

  const pageVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => currentYear - i), [currentYear]);
  const decades = useMemo(() => {
    const maxDecade = Math.floor(currentYear / 10) * 10;
    const minDecade = Math.floor((currentYear - 99) / 10) * 10;
    const arr = [];
    for (let d = maxDecade; d >= minDecade; d -= 10) {
      arr.push(d);
    }
    return arr;
  }, [currentYear]);

  const currentPlaces = locationScope === "domestic" ? DOMESTIC_PLACES : OVERSEAS_PLACES;

  const nextStep = () => {
    setStepError(null);
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStepError(null);
    if (step === 2 && selectedDecade !== null) {
      setSelectedDecade(null);
      return;
    }
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigate("/category/saju");
    }
  };

  const analyzeWithBirthData = async (birthData: UserBirthData, source: "manual" | "profile-auto") => {
    let resolvedServiceType: SajuServiceType;
    if (serviceId) {
      if (!isSajuServiceType(serviceId)) {
        const message = `지원하지 않는 사주 서비스 ID입니다: ${serviceId}`;
        if (source === "profile-auto") {
          setAutoSubmitError(message);
        }
        toast({
          title: "분석 실패",
          description: message,
          variant: "destructive",
        });
        return false;
      }
      resolvedServiceType = serviceId;
    } else if (requestedMode === "lifetime") {
      const message = "인생 총운 리포트는 서비스 선택 후 다시 시도해주세요.";
      if (source === "profile-auto") {
        setAutoSubmitError(message);
      }
      toast({
        title: "분석 실패",
        description: message,
        variant: "destructive",
      });
      return false;
    } else {
      resolvedServiceType = "traditional-saju";
    }
    const resolvedBirthPrecision = birthData.birthPrecision ?? "unknown";
    const trimmedFreeQuestion = freeQuestion.trim() || undefined;
    const requestFingerprint = buildSajuRequestFingerprint({
      serviceType: resolvedServiceType,
      profileData: birthData,
      interests,
      freeQuestion: trimmedFreeQuestion,
      promptVersion: SAJU_ANALYSIS_PROMPT_VERSION,
    });

    if (source === "manual") {
      setIsSubmitting(true);
    } else {
      setIsAutoSubmitting(true);
      setAutoSubmitError(null);
    }

    try {
      setAnalysisPhase("cache-check");
      const cachedResult = await getSajuResultByFingerprint(requestFingerprint);
      if (cachedResult?.id) {
        trackEvent("analysis_cache_hit", {
          source,
          serviceType: resolvedServiceType,
          resultId: cachedResult.id,
        });
        toast({
          title: "저장된 분석 결과를 불러왔습니다.",
          description: "동일한 요청 이력이 있어 새 분석 없이 바로 결과를 보여드립니다.",
        });
        navigate(`/result/${cachedResult.id}`);
        return true;
      }

      const calculated = calculateSaju(birthData);
      setAnalysisPhase("ai-analysis");
      const analysis = await getSajuAnalysis({
        serviceType: resolvedServiceType,
        sajuData: {
          palja: calculated.palja,
          oheng: calculated.oheng,
          yongsin: calculated.yongsin,
          sinsal: calculated.sinsal,
          profileMeta: {
            solarDate: calculated.solarDate,
            profileData: birthData,
            birthPrecision: resolvedBirthPrecision,
            currentYear: new Date().getFullYear(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
        interests,
        freeQuestion: trimmedFreeQuestion,
      });
      const lifetimeAnalysis = isLifetimeAnalysis(analysis) ? analysis : null;

      setAnalysisPhase("result-save");
      const saved = await saveSajuResult({
        guestSessionId: ensureGuestSessionId(),
        dataPrivacyMode,
        requestFingerprint,
        sourceServiceId: resolvedServiceType,
        promptVersion: SAJU_ANALYSIS_PROMPT_VERSION,
        profileData: birthData,
        palja: calculated.palja,
        oheng: calculated.oheng,
        yongsin: calculated.yongsin,
        sinsal: calculated.sinsal,
        interests,
        freeQuestion: trimmedFreeQuestion,
        summary: analysis.summary,
        sections: analysis.sections,
        consultationType: resolvedServiceType,
        reportTemplateVersion: analysis.reportTemplateVersion,
        reportPayload: analysis.reportPayload,
        lifetimeScore: lifetimeAnalysis?.lifetimeScore,
        daeunPeriods: lifetimeAnalysis?.daeunPeriods,
        goldenPeriods: lifetimeAnalysis?.goldenPeriods,
        personalityType: lifetimeAnalysis?.personalityType,
      });

      trackEvent("analysis_completed", {
        dataPrivacyMode,
        birthPrecision: resolvedBirthPrecision,
        resultId: saved.id,
        requestFingerprint,
        source,
      });

      toast({
        title: source === "profile-auto" ? "회원 정보로 자동 분석 완료" : "분석 완료",
        description: "결과 페이지로 이동합니다.",
      });

      navigate(`/result/${saved.id}`);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "알 수 없는 오류";
      if (source === "profile-auto") {
        setAutoSubmitError(message);
      }
      toast({
        title: "분석 실패",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      if (source === "manual") {
        setIsSubmitting(false);
      } else {
        setIsAutoSubmitting(false);
      }
    }
  };

  const startAutoAnalysis = async () => {
    if (!autoProfileBirthData) {
      return;
    }
    updateProfile({ ...autoProfileBirthData, name: profile?.name || userProfile.name });
    await analyzeWithBirthData(autoProfileBirthData, "profile-auto");
  };

  useEffect(() => {
    if (allowManualInput) {
      return;
    }
    if (autoSubmitAttemptedRef.current) {
      return;
    }
    if (!initialized || isAuthLoading) {
      return;
    }
    if (!user || !autoProfileBirthData) {
      return;
    }

    autoSubmitAttemptedRef.current = true;
    void startAutoAnalysis();
  }, [
    allowManualInput,
    initialized,
    isAuthLoading,
    user,
    autoProfileBirthData,
    startAutoAnalysis,
  ]);

  const submit = async () => {
    if (!year || !month || !day || !gender) {
      setStepError("생년월일과 성별은 필수 입력입니다.");
      return;
    }

    const parsedTime = parseTimeString(exactTime);
    const birthData: UserBirthData = {
      calendarType,
      year,
      month,
      day,
      hour: birthPrecision === "exact" ? parsedTime?.hour : undefined,
      minute: birthPrecision === "exact" ? parsedTime?.minute : undefined,
      timeBlock: birthPrecision === "time-block" ? timeBlock : undefined,
      birthPrecision,
      location: place,
      gender,
    };

    updateProfile({ ...birthData, name: userProfile.name });
    await analyzeWithBirthData(birthData, "manual");
  };

  const validateAndNext = () => {
    if (step === 1) {
      nextStep();
      return;
    }
    if (step === 2 && !year) {
      setStepError("출생 연도를 선택해주세요.");
      return;
    }
    if (step === 3 && !month) {
      setStepError("출생 월을 선택해주세요.");
      return;
    }
    if (step === 4 && !day) {
      setStepError("출생 일을 선택해주세요.");
      return;
    }
    if (step === 5) {
      if (birthPrecision === "exact" && !exactTime) {
        setStepError("정확한 시간을 입력해주세요.");
        return;
      }
      if (birthPrecision === "time-block" && !timeBlock) {
        setStepError("시간대를 선택해주세요.");
        return;
      }
    }
    if (step === 6 && !place) {
      setStepError("출생지를 선택해주세요.");
      return;
    }
    if (step === 7 && !gender) {
      setStepError("성별을 선택해주세요.");
      return;
    }

    nextStep();
  };

  const renderStep1 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">달력 유형을 선택해주세요</h2>
        <p className="text-[15px] text-text-secondary">기록된 생일 기준을 알려주세요</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { value: "solar", label: "양력 (Solar)", desc: "일반적으로 사용하는 달력 기준", icon: "🌞" },
          { value: "lunar", label: "음력 평달 (Lunar)", desc: "전통 방식의 음력 생일", icon: "🌙" },
          { value: "lunar-leap", label: "음력 윤달 (Leap Month)", desc: "윤달 포함 음력 생일", icon: "✨" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setCalendarType(item.value as typeof calendarType);
              nextStep();
            }}
            className={cn(
              "flex items-center gap-5 w-full p-5 rounded-[24px] border-2 text-left transition-all duration-200",
              calendarType === item.value 
                ? "border-[#24303F] bg-[#FFF8EE] shadow-sm" 
                : "border-border bg-white hover:border-[#D6C8B9] hover:bg-[#F6EFE6]/50"
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-2xl">
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-[17px] font-bold text-foreground">{item.label}</p>
              <p className="text-[13px] text-text-secondary mt-0.5">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => {
    if (selectedDecade === null) {
      return (
        <div className="space-y-7">
          <div className="space-y-2 text-center">
            <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">출생 연대를 선택해주세요</h2>
            <p className="text-[15px] text-text-secondary">태어난 시대의 흐름을 먼저 정합니다</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {decades.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDecade(d)}
                className="rounded-[18px] border-2 py-5 text-[17px] font-bold transition-all border-border bg-white text-text-secondary hover:border-[#24303F] hover:bg-[#FFF8EE] hover:text-foreground shadow-sm active:scale-95"
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      );
    }

    const availableYearsInDecade = years.filter((y) => Math.floor(y / 10) * 10 === selectedDecade);

    return (
      <div className="space-y-7">
        <div className="space-y-2 text-center">
          <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">출생 연도를 선택해주세요</h2>
          <div className="flex items-center justify-center gap-2 text-[15px] text-text-secondary">
            <span>{selectedDecade}년대</span>
            <button 
              type="button"
              onClick={() => setSelectedDecade(null)}
              className="text-primary font-bold underline underline-offset-4 hover:text-[#BFA8F0]"
            >
              다시 선택
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {availableYearsInDecade.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setYear(value);
                nextStep();
              }}
              className={cn(
                "rounded-[18px] border-2 py-4 text-[17px] font-bold transition-all shadow-sm active:scale-95",
                year === value 
                  ? "border-[#24303F] bg-[#FFF8EE] text-foreground" 
                  : "border-border bg-white text-text-secondary hover:border-[#24303F] hover:bg-[#FFF8EE]"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">출생 월을 선택해주세요</h2>
        <p className="text-[15px] text-text-secondary">계절의 기운을 판단하는 기준입니다.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMonth(value);
              nextStep();
            }}
            className={cn(
              "rounded-[18px] border-2 py-5 text-[17px] font-bold transition-all shadow-sm active:scale-95",
              month === value 
                ? "border-[#24303F] bg-[#FFF8EE] text-foreground" 
                : "border-border bg-white text-text-secondary hover:border-[#24303F] hover:bg-[#FFF8EE]"
            )}
          >
            {value}월
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">출생 일을 선택해주세요</h2>
        <p className="text-[15px] text-text-secondary">일주의 세부 기운을 계산하는 기준입니다.</p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 31 }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setDay(value);
              nextStep();
            }}
            className={cn(
              "aspect-square rounded-[14px] border-2 flex items-center justify-center text-[16px] font-bold transition-all shadow-sm active:scale-90",
              day === value 
                ? "border-[#24303F] bg-[#FFF8EE] text-foreground" 
                : "border-border bg-white text-text-secondary hover:border-[#24303F] hover:bg-[#FFF8EE]"
            )}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">출생 시간을 알려주세요</h2>
        <p className="text-[15px] text-text-secondary">정확한 시간일수록 분석 정확도가 올라갑니다.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "exact", title: "정확한 시각", icon: "🕒" },
          { value: "time-block", title: "시간대만 앎", icon: "⏱️" },
          { value: "unknown", title: "모름", icon: "❔" },
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setBirthPrecision(item.value as BirthPrecision)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 py-5 rounded-[20px] border-2 transition-all shadow-sm",
              birthPrecision === item.value 
                ? "border-[#24303F] bg-[#FFF8EE]" 
                : "border-border bg-white hover:border-[#D6C8B9]"
            )}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-[15px] font-bold text-foreground">{item.title}</span>
          </button>
        ))}
      </div>

      {birthPrecision === "exact" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="p-6 rounded-[24px] bg-[#F6EFE6]/50 border-2 border-dashed border-[#D6C8B9]">
            <p className="text-center font-bold text-[18px] mb-4">정확한 시간 입력</p>
            <input
              type="time"
              value={exactTime}
              onChange={(event) => setExactTime(event.target.value)}
              className="h-16 w-full rounded-2xl border-2 border-border bg-white px-6 text-[24px] font-black text-center focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all"
            />
          </div>
        </motion.div>
      )}

      {birthPrecision === "time-block" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-2">
          {TIME_BLOCKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTimeBlock(item.id)}
              className={cn(
                "rounded-[16px] border-2 px-3 py-4 text-[14px] font-bold transition-all shadow-sm",
                timeBlock === item.id 
                  ? "border-[#24303F] bg-[#FFF8EE] text-foreground" 
                  : "border-border bg-white text-text-secondary hover:border-[#24303F]"
              )}
            >
              {item.label} ({item.range})
            </button>
          ))}
        </motion.div>
      )}

      {birthPrecision === "unknown" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-[20px] bg-state-info-soft text-[14px] text-state-info font-medium leading-relaxed text-center">
          "모름" 선택 시 기본 시간(낮 12시)을 기준으로 분석합니다.<br/>시주를 제외해도 나머지 데이터로 충분히 의미 있는 분석이 가능합니다.
        </motion.div>
      )}
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">어디에서 태어나셨나요?</h2>
        <p className="text-[15px] text-text-secondary">출생지 좌표는 사주의 시간 보정에 사용됩니다.</p>
      </div>

      <div className="flex p-1.5 rounded-[20px] bg-bg-subtle/50 border border-border">
        <button
          type="button"
          onClick={() => { setLocationScope("domestic"); setPlace("서울"); }}
          className={cn(
            "flex-1 h-12 rounded-[16px] text-[15px] font-bold transition-all",
            locationScope === "domestic" ? "bg-[#24303F] text-white shadow-md" : "text-text-secondary hover:bg-white/50"
          )}
        >
          국내 출생
        </button>
        <button
          type="button"
          onClick={() => { setLocationScope("overseas"); setPlace("일본"); }}
          className={cn(
            "flex-1 h-12 rounded-[16px] text-[15px] font-bold transition-all",
            locationScope === "overseas" ? "bg-[#24303F] text-white shadow-md" : "text-text-secondary hover:bg-white/50"
          )}
        >
          해외 출생
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {currentPlaces.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setPlace(item)}
            className={cn(
              "rounded-[18px] border-2 py-4 text-[15px] font-bold transition-all shadow-sm active:scale-95",
              place === item 
                ? "border-[#24303F] bg-[#FFF8EE] text-foreground" 
                : "border-border bg-white text-text-secondary hover:border-[#D6C8B9]"
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">성별을 선택해주세요</h2>
        <p className="text-[15px] text-text-secondary">음양의 조화를 분석하기 위한 필수 정보입니다.</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[
          { id: "male", label: "남성", icon: "👨" },
          { id: "female", label: "여성", icon: "👩" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setGender(item.id as "male" | "female");
              nextStep();
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-4 py-10 rounded-[32px] border-2 transition-all shadow-sm active:scale-95",
              gender === item.id 
                ? "border-[#24303F] bg-[#FFF8EE] shadow-md" 
                : "border-border bg-white hover:border-[#D6C8B9]"
            )}
          >
            <span className="text-5xl">{item.icon}</span>
            <span className="text-[18px] font-black text-foreground">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );


  const renderStep8_Confirmation = () => (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h2 className="text-[24px] font-extrabold tracking-tight text-foreground">입력 정보를 확인해주세요</h2>
        <p className="text-[15px] text-text-secondary">분석 시작 전 마지막 확인 단계입니다.</p>
      </div>

      <div className="p-1 rounded-[28px] bg-[#F6EFE6]/50 border border-border overflow-hidden">
        <div className="space-y-2 p-2">
          {[
            { label: "달력 유형", val: calendarType === "solar" ? "양력" : calendarType === "lunar" ? "음력 평달" : "음력 윤달", step: 1 },
            { label: "생년월일", val: `${year}년 ${month}월 ${day}일`, step: 2 },
            {
              label: "출생 시간",
              val:
                birthPrecision === "exact"
                  ? exactTime
                  : birthPrecision === "time-block"
                    ? getTimeBlockLabel(timeBlock)
                    : "모름",
              step: 5,
            },
            { label: "출생지", val: `${locationScope === "domestic" ? "국내" : "해외"} / ${place}`, step: 6 },
            { label: "성별", val: gender === "male" ? "남성" : "여성", step: 7 },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setStep(item.step)}
              className="flex items-center justify-between w-full p-4 rounded-[18px] bg-white border border-border/50 shadow-sm active:bg-bg-subtle transition-colors"
            >
              <span className="text-[14px] font-bold text-text-secondary">{item.label}</span>
              <span className="text-[15px] font-black text-foreground underline underline-offset-4 decoration-primary/50">
                {item.val}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 p-5 rounded-[24px] bg-bg-inverse text-white">
        <ShieldCheck className="w-6 h-6 text-accent-mint" />
        <div className="flex-1">
          <p className="text-[14px] font-bold">안전한 데이터 관리</p>
          <p className="text-[12px] text-white/70">입력하신 정보는 기기에서만 처리되며 분석 후 즉시 보호됩니다.</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={prevStep}
          disabled={isSubmitting}
          variant="outline"
          className="h-16 w-[35%] rounded-[20px] text-[17px] font-bold border-border bg-white"
        >
          이전
        </Button>
        <Button 
          onClick={submit} 
          disabled={isSubmitting} 
          className="h-16 flex-1 rounded-[20px] text-[17px] font-extrabold bg-primary text-foreground hover:bg-[#BFA8F0] shadow-md shadow-primary/20"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" /> 결과 생성 중...
            </span>
          ) : (
            "지금 바로 결과 보기"
          )}
        </Button>
      </div>
    </div>
  );

  const stepRenderer: Record<number, () => JSX.Element> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8_Confirmation,
  };

  if (!allowManualInput && user && autoProfileBirthData) {
    if (isAutoSubmitting) {
      const activeStepIndex = Math.max(ANALYSIS_PHASE_ORDER.indexOf(analysisPhase), 0);
      return (
        <AppLayout hideBottomNav>
          <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-center text-[15px] font-semibold text-foreground">회원 정보로 자동 분석 중입니다.</p>
            <p className="text-center text-[13px] text-text-secondary">사주 정보를 다시 입력할 필요 없이 바로 결과를 생성합니다.</p>
            <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-4">
              <div className="space-y-3">
                {ANALYSIS_PHASE_ORDER.map((phase, index) => {
                  const isDone = index < activeStepIndex;
                  const isActive = phase === analysisPhase;

                  return (
                    <div key={phase} className="flex items-center gap-3 text-sm">
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-gray-300" />
                      )}
                      <span className={cn("font-medium", isActive ? "text-foreground" : "text-text-secondary")}>
                        {ANALYSIS_PHASE_LABELS[phase]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </AppLayout>
      );
    }
    if (autoSubmitError) {
      return (
        <AppLayout hideBottomNav>
          <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-8">
            <Card className="w-full rounded-2xl border-state-error-soft bg-state-error-soft p-5 text-center">
              <p className="text-[15px] font-bold text-state-error">회원 정보 자동 분석에 실패했습니다.</p>
              <p className="mt-2 text-[13px] text-state-error">{autoSubmitError}</p>
            </Card>
            <Button className="h-12 w-full rounded-xl bg-[#24303F] text-white" onClick={() => void startAutoAnalysis()}>
              같은 정보로 다시 시도
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full rounded-xl"
              onClick={() => setAllowManualInput(true)}
            >
              수동 입력으로 진행
            </Button>
          </div>
        </AppLayout>
      );
    }
  }

  return (
    <AppLayout hideBottomNav>
      <div className="mx-auto min-h-screen w-full max-w-lg px-6 py-8 pb-32">
        <div className="mb-8">
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-elevated text-foreground transition-all hover:bg-bg-subtle mb-4"
            aria-label="go-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <StepProgress current={step} total={TOTAL_STEPS} />
        </div>

        {stepError ? (
          <Card className="mb-4 rounded-md border-state-error-soft bg-state-error-soft p-3 text-[13px] text-state-error">
            {stepError}
          </Card>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {stepRenderer[step]?.()}
          </motion.div>
        </AnimatePresence>

        {step < TOTAL_STEPS ? (
          <div className="mt-10">
            <Button 
              onClick={validateAndNext} 
              className="h-16 w-full rounded-[20px] text-[17px] font-extrabold bg-[#24303F] text-white hover:bg-black shadow-lg shadow-black/5 transition-all active:scale-[0.98]"
            >
              다음 단계로
            </Button>
            <p className="mt-4 text-center text-[13px] text-text-muted-val">
              {step} / {TOTAL_STEPS} 단계 - 정확한 정보를 입력할수록 결과가 더 정교해집니다.
            </p>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}

