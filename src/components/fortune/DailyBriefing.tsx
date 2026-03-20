import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Bot, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyBriefingProps {
  category: string;
  themeColor: string;
}

const MOCK_BRIEFINGS: Record<string, string[]> = {
  saju: [
    "오늘은 '수(水)'의 기운이 강하게 들어옵니다. 차가운 음료보다는 따뜻한 차 한 잔이 행운을 불러옵니다.",
    "오전 11시에서 오후 1시 사이, 북동쪽 방향에서 귀인의 소식이 들려올 수 있습니다.",
    "문서 운이 좋은 날입니다. 미뤄두었던 계약이나 서류 정리를 하기에 최적의 타이밍입니다."
  ],
  astrology: [
    "목성이 당신의 감정 하우스에 머물며 창의적인 영감을 줍니다. 새로운 취미를 시작해보세요.",
    "금성의 영향으로 대인관계에서 매력이 빛나는 날입니다. 중요한 미팅은 오늘로 잡으세요.",
    "수성과 해왕성이 조화를 이뤄 직관력이 평소보다 날카로워집니다. 마음의 소리에 집중하세요."
  ],
  palmistry: [
    "손바닥 중심의 화성구가 붉게 빛납니다. 추진력이 필요한 일을 오늘 처리하세요.",
    "생명선 끝자락의 에너지가 보충되는 기운입니다. 가벼운 산책으로 활력을 얻으세요.",
    "두뇌선이 명확해지는 날입니다. 복잡한 계산이나 계획 수립에 행운이 따릅니다."
  ],
  love: [
    "상대방의 사소한 배려가 큰 감동으로 이어지는 날입니다. '고마워'라는 말을 아끼지 마세요.",
    "새로운 인연을 찾고 있다면, 핑크색 계열의 아이템을 착용하는 것이 도움이 됩니다.",
    "함께 맛있는 음식을 먹으며 대화하는 시간을 가져보세요. 관계가 한층 깊어집니다."
  ]
};

export const DailyBriefing: React.FC<DailyBriefingProps> = ({ category, themeColor }) => {
  const [isGenerating, setIsGenerating] = useState(true);
  const [content, setContent] = useState("");
  const briefings = MOCK_BRIEFINGS[category] || MOCK_BRIEFINGS["saju"];
  
  useEffect(() => {
    // 시계 모사 (AI 생성 느낌)
    setIsGenerating(true);
    const timer = setTimeout(() => {
      setContent(briefings[Math.floor(Math.random() * briefings.length)]);
      setIsGenerating(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [category]);

  const handleRefresh = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const otherBriefings = briefings.filter(b => b !== content);
      setContent(otherBriefings[Math.floor(Math.random() * otherBriefings.length)]);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="relative group">
      {/* AI 글로잉 배경 효과 */}
      <div className={cn(
        "absolute -inset-0.5 rounded-[24px] opacity-20 blur-sm group-hover:opacity-40 transition-opacity",
        themeColor === "accent-lavender" && "bg-purple-400",
        themeColor === "accent-sky" && "bg-blue-400",
        themeColor === "accent-mint" && "bg-teal-400",
        themeColor === "accent-pink" && "bg-rose-400"
      )} />
      
      <div className="relative bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm overflow-hidden min-h-[140px] flex flex-col justify-center">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-lg flex items-center justify-center",
              themeColor === "accent-lavender" && "bg-purple-50 text-purple-600",
              themeColor === "accent-sky" && "bg-blue-50 text-blue-600",
              themeColor === "accent-mint" && "bg-teal-50 text-teal-600",
              themeColor === "accent-pink" && "bg-rose-50 text-rose-600"
            )}>
              <Bot className="w-4 h-4" />
            </div>
            <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-1.5">
              Gemini AI 데일리 브리핑
              <motion.span 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-1 rounded-full bg-green-400" 
              />
            </h4>
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isGenerating}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors disabled:opacity-30"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isGenerating && "animate-spin")} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="h-4 bg-gray-100 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-50 rounded-full w-1/2 animate-pulse" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[14px] font-medium text-gray-700 leading-relaxed break-keep">
                {content}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400">Powered by Gemini Pro</span>
                <span className="text-gray-200">|</span>
                <button className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
                  상세 분석 보기 <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Sparkles className="w-24 h-24" />
        </div>
      </div>
    </div>
  );
};
