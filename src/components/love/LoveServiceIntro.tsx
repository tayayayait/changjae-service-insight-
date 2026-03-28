import React from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, MoonStar, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LoveServiceType } from "@/types/love";

interface LoveIntroData {
  title: string;
  description: string;
  purpose: string;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}

const INTRO_DATA: Record<LoveServiceType, LoveIntroData> = {
  "future-partner": {
    title: "미래 배우자 리포트",
    description: "당신의 타고난 기질과 인연의 조각을 맞춰, 미래의 동반자를 구체적으로 그려냅니다.",
    purpose: "'어떤 사람을 만나야 행복할까?'라는 질문에 대한 사주 공학적 해답",
    features: [
      "배우자의 외모와 성격 특징 분석",
      "결정적 만남의 시기 및 환경",
      "관계를 지키는 핵심 가이드라인",
    ],
    icon: <Heart className="w-8 h-8" />,
    gradient: "from-[#F3B6C7] to-[#EC94AD]",
  },
  "couple-report": {
    title: "커플 궁합 리포트",
    description: "단순한 좋고 나쁨을 넘어, 두 사람의 에너지 흐름이 만드는 시너지를 정밀 진단합니다.",
    purpose: "서로의 다름을 이해하고, 더 깊은 결속으로 나아가기 위한 관계 운영 가이드",
    features: [
      "현재 관계 온도 및 밀당 밸런스",
      "두 사람의 핵심 궁합 점수",
      "갈등을 예방하는 맞춤 소통법",
    ],
    icon: <Sparkles className="w-8 h-8" />,
    gradient: "from-[#CBB7F6] to-[#A88DF0]",
  },
  "crush-reunion": {
    title: "재회/짝사랑 리포트",
    description: "마음에 남은 인연과의 가능성을 냉정하게 분석하고, 다시 연결될 수 있는 분기점을 짚어냅니다.",
    purpose: "미련과 희망 사이에서 가장 현명한 선택을 내릴 수 있도록 돕는 리얼리티 진단",
    features: [
      "상대방의 속마음 시그널 분석",
      "다시 닿을 수 있는 최적의 타이밍",
      "재접촉 vs 정리 가이드라인",
    ],
    icon: <MoonStar className="w-8 h-8" />,
    gradient: "from-[#94A3B8] to-[#475569]",
  },
};

interface LoveServiceIntroProps {
  serviceType: LoveServiceType;
  onStart: () => void;
}

export const LoveServiceIntro: React.FC<LoveServiceIntroProps> = ({ serviceType, onStart }) => {
  const data = INTRO_DATA[serviceType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <Card className="overflow-hidden border-none shadow-2xl rounded-[32px] bg-white/80 backdrop-blur-xl">
        {/* 상단 헤더 영역 */}
        <div className={cn("p-10 text-white relative overflow-hidden bg-gradient-to-br", data.gradient)}>
          {/* 장식용 패턴 */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <filter id="noise-intro">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              </filter>
              <rect width="100%" height="100%" filter="url(#noise-intro)" />
            </svg>
          </div>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20"
          >
            {data.icon}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black mb-3 italic tracking-tight"
          >
            {data.title}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/90 text-[17px] font-medium leading-relaxed max-w-md"
          >
            {data.description}
          </motion.p>
        </div>

        {/* 상세 안내 영역 */}
        <div className="p-8 md:p-10 space-y-8">
          <div>
            <h4 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-3">Service Focus</h4>
            <p className="text-[16px] md:text-[18px] font-bold text-gray-900 leading-snug">
              {data.purpose}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-3">Included in Report</h4>
            <div className="grid gap-3">
              {data.features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-md transition-all"
                >
                  <div className={cn("p-1.5 rounded-full bg-white shadow-sm", idx === 0 ? "text-pink-500" : "text-indigo-500")}>
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-[15px] font-semibold text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="pt-4"
          >
            <Button
              onClick={onStart}
              className={cn(
                "h-16 w-full rounded-2xl text-[17px] font-black shadow-lg hover:translate-y-[-2px] active:scale-[0.98] transition-all gap-2 text-white",
                serviceType === "future-partner" ? "bg-[#EC94AD] hover:bg-[#E27D9A]" : 
                serviceType === "couple-report" ? "bg-[#A88DF0] hover:bg-[#9677E0]" : 
                "bg-[#475569] hover:bg-[#334155]"
              )}
            >
              분석 시작하기
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-center mt-4 text-[13px] text-gray-400 font-medium">
              약 1분 내외의 데이터 입력 과정이 필요합니다.
            </p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
