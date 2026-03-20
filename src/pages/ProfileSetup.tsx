import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { StepProgress } from "@/components/saju/StepProgress";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { normalizeTimeBlockId, TIME_BLOCKS } from "@/lib/timeBlocks";

const TOTAL_STEPS = 4;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

export default function ProfileSetup() {
  const navigate = useNavigate();
  const { user, refreshProfile, initialized, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [calendarType, setCalendarType] = useState<"solar" | "lunar" | "lunar-leap">("solar");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [birthPrecision, setBirthPrecision] = useState<"exact" | "time-block" | "unknown">("unknown");
  const [timeBlock, setTimeBlock] = useState<string>(TIME_BLOCKS[0].id);
  const [exactTime, setExactTime] = useState("");
  const [location, setLocation] = useState("서울");

  useEffect(() => {
    if (initialized && !user && !isLoading) {
      navigate("/login");
    }
  }, [user, initialized, isLoading, navigate]);

  const nextStep = () => {
    setStepError(null);
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStepError(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigate("/category/saju");
    }
  };

  const validateAndNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        setStepError("이름을 입력해주세요.");
        return;
      }
      if (name.length > 6) {
        setStepError("이름은 최대 6자까지 가능합니다.");
        return;
      }
      nextStep();
    } else if (step === 2) {
      if (!gender) {
        setStepError("성별을 선택해주세요.");
        return;
      }
      nextStep();
    } else if (step === 3) {
      if (!year || !month || !day) {
        setStepError("생년월일을 모두 선택해주세요.");
        return;
      }
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    let finalHour: number | null = null;
    let finalMinute: number | null = null;
    let finalTimeBlock: string | null = null;

    if (birthPrecision === "exact") {
      if (!exactTime) {
        setStepError("정확한 태어난 시간을 입력해 주세요.");
        return;
      }
      const [hourPart, minutePart] = exactTime.split(":");
      const parsedHour = Number(hourPart);
      const parsedMinute = Number(minutePart);
      const isInvalidTime =
        Number.isNaN(parsedHour) ||
        Number.isNaN(parsedMinute) ||
        parsedHour < 0 ||
        parsedHour > 23 ||
        parsedMinute < 0 ||
        parsedMinute > 59;
      if (isInvalidTime) {
        setStepError("시간 형식이 올바르지 않습니다.");
        return;
      }
      finalHour = parsedHour;
      finalMinute = parsedMinute;
    } else if (birthPrecision === "time-block") {
      const normalizedTimeBlock = normalizeTimeBlockId(timeBlock);
      const block = TIME_BLOCKS.find((b) => b.id === normalizedTimeBlock);
      if (!block) {
        setStepError("시주(시간대)를 선택해 주세요.");
        return;
      }
      finalHour = block.midHour;
      finalMinute = block.midMinute;
      finalTimeBlock = block.id;
    }

    setIsSubmitting(true);

    try {
      const { error } = await withTimeout(
        supabase.from("user_profiles").upsert({
          id: user.id,
          name,
          gender,
          calendar_type: calendarType,
          year,
          month,
          day,
          hour: finalHour,
          minute: finalMinute,
          time_block: finalTimeBlock,
          location,
          updated_at: new Date().toISOString(),
        }),
        15000,
        "프로필 저장 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.",
      );

      if (error) throw error;

      await withTimeout(
        refreshProfile(),
        10000,
        "프로필 동기화가 지연되고 있습니다. 새로고침 후 다시 확인해 주세요.",
      );
      toast({
        title: "프로필 설정 완료",
        description: "이제 사주 서비스를 편리하게 이용하실 수 있습니다.",
      });
      navigate("/");
    } catch (error) {
      console.error("Profile setup failed:", error);
      toast({
        title: "저장 실패",
        description: "프로필 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i), []);

  const renderStep1 = () => (
    <div className="space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground leading-tight">
          어떤 이름으로<br />불러 드릴까요?
        </h2>
        <p className="text-[16px] text-text-secondary">본명이나 애칭도 좋아요.</p>
      </div>
      <div className="relative max-w-sm mx-auto">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름 입력"
          className="w-full border-b-2 border-gray-200 bg-transparent py-4 text-center text-[24px] font-bold focus:border-primary focus:outline-none transition-colors"
          maxLength={6}
          autoFocus
        />
        <p className="mt-2 text-center text-[13px] text-text-muted-val">한글 최대 6자</p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground leading-tight">
          성별과 사용하는<br />달력을 선택해 주세요
        </h2>
      </div>
      
      <div className="space-y-6 max-w-sm mx-auto">
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "male", label: "남성", icon: "👨" },
            { id: "female", label: "여성", icon: "👩" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setGender(item.id as "male" | "female")}
              className={cn(
                "flex flex-col items-center justify-center gap-3 py-8 rounded-[24px] border-2 transition-all shadow-sm active:scale-95",
                gender === item.id 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "border-border bg-white hover:border-primary/30"
              )}
            >
              <span className="text-4xl">{item.icon}</span>
              <span className="text-[17px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex p-1.5 rounded-[20px] bg-gray-100 border border-border">
          {[
            { id: "solar", label: "양력" },
            { id: "lunar", label: "음력" },
            { id: "lunar-leap", label: "윤달" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCalendarType(item.id as "solar" | "lunar" | "lunar-leap")}
              className={cn(
                "flex-1 h-12 rounded-[16px] text-[15px] font-bold transition-all",
                calendarType === item.id ? "bg-white text-foreground shadow-sm" : "text-text-secondary hover:bg-white/50"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground leading-tight">
          태어난 날짜를<br />알려주세요
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        <select 
          value={year || ""} 
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-14 rounded-2xl border-2 border-border bg-white px-4 font-bold focus:border-primary outline-none"
        >
          <option value="" disabled>년</option>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <select 
          value={month || ""} 
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-14 rounded-2xl border-2 border-border bg-white px-4 font-bold focus:border-primary outline-none"
        >
          <option value="" disabled>월</option>
          {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
        <select 
          value={day || ""} 
          onChange={(e) => setDay(Number(e.target.value))}
          className="h-14 rounded-2xl border-2 border-border bg-white px-4 font-bold focus:border-primary outline-none"
        >
          <option value="" disabled>일</option>
          {Array.from({length: 31}, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}일</option>)}
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8 py-4">
      <div className="space-y-3 text-center">
        <h2 className="text-[28px] font-extrabold tracking-tight text-foreground leading-tight">
          태어난 시간을<br />입력해 주세요
        </h2>
        <p className="text-[16px] text-text-secondary">모르시면 '모름'을 선택해 주세요.</p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: "exact", label: "정확히 알아요", icon: "⏰" },
            { id: "time-block", label: "대략 알아요", icon: "🌤️" },
            { id: "unknown", label: "모르겠어요", icon: "❓" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setBirthPrecision(item.id as "exact" | "time-block" | "unknown")}
              className={cn(
                "flex flex-col items-center justify-center gap-2 py-5 rounded-[20px] border-2 transition-all",
                birthPrecision === item.id ? "border-primary bg-primary/5" : "border-border bg-white"
              )}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[15px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        {birthPrecision === "exact" && (
          <input
            type="time"
            value={exactTime}
            onChange={(e) => setExactTime(e.target.value)}
            className="h-16 w-full rounded-2xl border-2 border-border bg-white px-6 text-[24px] font-black text-center focus:border-primary transition-all underline-offset-8"
          />
        )}

        {birthPrecision === "time-block" && (
          <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto p-1">
            {TIME_BLOCKS.map(t => (
              <button
                key={t.id}
                onClick={() => setTimeBlock(t.id)}
                className={cn(
                  "py-3 rounded-xl border-2 font-bold transition-all flex flex-col items-center justify-center",
                  timeBlock === t.id ? "border-primary bg-primary/5" : "border-border bg-white"
                )}
              >
                <span>{t.label}</span>
                <span className="text-[12px] text-text-muted-val mt-1">{t.range}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const stepRenderer: Record<number, () => JSX.Element> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-6 py-8 pb-32">
        <div className="mb-8">
          <button 
            onClick={prevStep} 
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground hover:bg-gray-50 transition-all mb-4 shadow-sm"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[13px] font-bold text-primary uppercase tracking-wider">Step {step}</span>
              <span className="text-[13px] font-medium text-text-muted-val">{step}/{TOTAL_STEPS}</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>

        {stepError && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-red-50 p-4 text-[14px] text-red-600 font-medium border border-red-100">
            {stepError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {stepRenderer[step]?.()}
          </motion.div>
        </AnimatePresence>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
          <div className="mx-auto max-w-lg">
            {step < TOTAL_STEPS ? (
              <Button 
                onClick={validateAndNext} 
                className="h-16 w-full rounded-[24px] text-[18px] font-extrabold bg-[#24303F] text-white hover:bg-black transition-all shadow-xl shadow-black/10"
              >
                다음 단계로
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting}
                className="h-16 w-full rounded-[24px] text-[18px] font-extrabold bg-primary text-foreground hover:bg-primary/90 transition-all shadow-xl shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "프로필 설정 완료"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
