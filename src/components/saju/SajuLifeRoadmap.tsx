import React from "react";
import { DaeunPeriod, Oheng } from "@/types/result";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Star, Milestone } from "lucide-react";

interface SajuLifeRoadmapProps {
  periods: DaeunPeriod[];
  className?: string;
}

const OHENG_THEME: Record<Oheng, { color: string; bg: string; border: string }> = {
  '목': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  '화': { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  '토': { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  '금': { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
  '수': { color: 'text-slate-900', bg: 'bg-stone-100', border: 'border-stone-300' },
};

export const SajuLifeRoadmap: React.FC<SajuLifeRoadmapProps> = ({ periods, className }) => {
  if (!periods || periods.length === 0) return null;

  return (
    <div className={cn("w-full py-6 overflow-hidden", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
          <Milestone className="w-5 h-5 text-indigo-500" />
        </div>
        <div>
          <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">인생 총운 로드맵</h3>
          <p className="text-xs text-stone-500 font-medium">10년 주기로 변화하는 대운의 흐름</p>
        </div>
      </div>

      <div className="relative">
        {/* Track Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-stone-100 dark:bg-stone-800 -translate-y-1/2 rounded-full" />
        
        <div className="flex overflow-x-auto pb-8 pt-4 gap-6 no-scrollbar snap-x">
          {periods.map((period, index) => {
            const theme = OHENG_THEME[period.oheng];
            const isCurrent = period.isCurrent;

            return (
              <div 
                key={`${period.startAge}-${index}`} 
                className={cn(
                  "flex-shrink-0 w-40 snap-center transition-all duration-500",
                  isCurrent ? "scale-105 opacity-100" : "opacity-60 grayscale-[0.3]"
                )}
              >
                {/* Score / Trend */}
                <div className="flex justify-center mb-3">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm",
                    period.score >= 70 ? "bg-emerald-500 text-white" : 
                    period.score >= 40 ? "bg-amber-500 text-white" : "bg-rose-500 text-white"
                  )}>
                    {period.score >= 70 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {period.score}점
                  </div>
                </div>

                {/* Main Card */}
                <div className={cn(
                  "relative p-4 rounded-3xl border-2 bg-white dark:bg-stone-900 shadow-lg transition-all",
                  isCurrent ? "border-indigo-500 shadow-indigo-100 dark:shadow-none" : "border-stone-100 dark:border-stone-800"
                )}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      Current
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-stone-400">
                      {period.startAge}세 - {period.endAge}세
                    </span>
                    <div className={cn(
                      "w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-serif",
                      theme.bg, theme.border
                    )}>
                      <span className={cn("text-xl font-bold", theme.color)}>{period.gan}{period.ji}</span>
                    </div>
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-50 dark:bg-stone-800", theme.color)}>
                      {period.oheng}기운
                    </span>
                  </div>
                </div>

                {/* Keyword */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-black line-clamp-1 h-4",
                    isCurrent ? "text-indigo-600" : "text-stone-500"
                  )}>
                    {period.keyword || (period.score >= 70 ? "상승 기류" : period.score >= 40 ? "평온한 흐름" : "자숙과 대비")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend / Info */}
      <div className="mt-4 flex flex-wrap gap-4 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-stone-500 font-medium">호운 (Expansion)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[10px] text-stone-500 font-medium">평운 (Balance)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-[10px] text-stone-500 font-medium">쇠운 (Internalize)</span>
        </div>
      </div>
    </div>
  );
};
