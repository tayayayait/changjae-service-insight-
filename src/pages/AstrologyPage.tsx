import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Loader2, MoonStar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AstrologyInput } from "@/components/astrology/AstrologyInput";
import { ServiceIntroScreen } from "@/components/common/ServiceIntroScreen";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { useAuthStore } from "@/store/useAuthStore";
import { UserBirthData } from "@/types/result";
import { getAstrologyBirthReport } from "@/lib/astrologyClient";
import { saveAstrologyReport } from "@/lib/astrologyStore";
import { toast } from "@/hooks/use-toast";
import { MysticalLoading } from "@/components/common/MysticalLoading";

const REPORT_CONTAINER_CLASS = "mx-auto w-full max-w-4xl";
export default function AstrologyPage() {
  const navigate = useNavigate();
  const { initialized } = useAuthStore();
  const [showIntro, setShowIntro] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleInputComplete = async (snapshot: Partial<UserBirthData> & { name?: string }) => {
    setIsAnalyzing(true);
    try {
      const response = await getAstrologyBirthReport({
        name: snapshot.name || "사용자",
        year: snapshot.year!,
        month: snapshot.month!,
        day: snapshot.day!,
        hour: snapshot.hour ?? 12,
        minute: snapshot.minute ?? 0,
        lat: snapshot.lat || 37.5665,
        lng: snapshot.lng || 126.978,
        tz_str: snapshot.timezone || "Asia/Seoul",
        birthTimeKnown: snapshot.hour !== undefined,
      });

      // Save report with isLocked: true
      const session = await saveAstrologyReport({
        serviceType: "astro-natal",
        inputSnapshot: snapshot as Record<string, unknown>,
        reportPayload: response,
        isUnlocked: false,
      });

      navigate(`/astrology/result/${session.id}`);
    } catch (error) {
      toast({
        title: "점성학 리포트 생성 실패",
        description: error instanceof Error ? error.message : "리포트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title="인생 설계도 리포트"
      subtitle="Big3, 행성, 하우스 분석을 기반으로 성향과 기질을 심층 분석합니다."
      themeColor="accent-sky"
      icon={MoonStar}
      unicornProjectId="xDa5VQkyT5mbLJGFBYE1"
    >
      <div className={REPORT_CONTAINER_CLASS}>
        <AnimatePresence mode="wait">
          {isAnalyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[400px] items-center justify-center py-12"
            >
              <MysticalLoading categoryId="astrology" title="인생 설계도를 작성하고 있습니다" />
            </motion.div>
          ) : showIntro ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <ServiceIntroScreen serviceId="astro-natal" onStart={() => setShowIntro(false)} />
            </motion.div>
          ) : (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              <AstrologyInput onComplete={handleInputComplete} isAnalyzing={isAnalyzing} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>


    </AnalysisPageShell>
  );
}
