import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { getAstrologyBirthReport } from "@/lib/astrologyClient";
import { AstrologyBirthReportResult } from "@/types/result";

interface AstrologyProfileInput {
  name?: string;
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  lat?: number;
  lng?: number;
  timezone?: string;
}

interface UseAstrologyBirthFlowParams {
  userProfile: AstrologyProfileInput;
  profile: unknown;
}

export function useAstrologyBirthFlow({ userProfile, profile }: UseAstrologyBirthFlowParams) {
  const [showIntro, setShowIntro] = useState(true);
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [report, setReport] = useState<AstrologyBirthReportResult | null>(null);

  useEffect(() => {
    if (!profile) return;
    setStep(0);
    setReport(null);
  }, [profile]);

  const handleAnalyze = useCallback(async () => {
    if (isSubmitting || !userProfile.name) return;

    setIsSubmitting(true);
    try {
      const response = await getAstrologyBirthReport({
        name: userProfile.name,
        year: userProfile.year!,
        month: userProfile.month!,
        day: userProfile.day!,
        hour: userProfile.hour ?? 12,
        minute: userProfile.minute ?? 0,
        lat: userProfile.lat || 37.5665,
        lng: userProfile.lng || 126.978,
        tz_str: userProfile.timezone || "Asia/Seoul",
        birthTimeKnown: userProfile.hour !== undefined,
      });

      setReport(response);
      setStep(3);
    } catch (error) {
      toast({
        title: "점성학 리포트 생성 실패",
        description: error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, userProfile]);

  return {
    showIntro,
    setShowIntro,
    step,
    setStep,
    isSubmitting,
    report,
    handleAnalyze,
  };
}
