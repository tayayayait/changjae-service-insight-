import React from "react";
import { Oheng, Palja } from "@/types/result";
import { cn } from "@/lib/utils";

interface PaljaChartProps {
  palja: Palja;
  className?: string;
}

const OHENG_TEXT_COLORS: Record<string, string> = {
  '목': 'text-blue-500',
  '화': 'text-red-500',
  '토': 'text-yellow-600',
  '금': 'text-slate-500',
  '수': 'text-slate-800',
};

const OHENG_BG_COLORS: Record<string, string> = {
  '목': 'bg-blue-50',
  '화': 'bg-red-50',
  '토': 'bg-yellow-50',
  '금': 'bg-slate-100',
  '수': 'bg-slate-200',
};

// 시간/일/월/년 역순 렌더링을 위해 배열화
const COLUMNS = [
  { key: 'time', label: '시주' },
  { key: 'day', label: '일주' },
  { key: 'month', label: '월주' },
  { key: 'year', label: '년주' },
];

export function PaljaChart({ palja, className }: PaljaChartProps) {
  return (
    <div className={cn("w-full overflow-hidden rounded-2xl border border-slate-200 bg-white", className)}>
      <div className="grid grid-cols-4 divide-x divide-slate-100">
        {COLUMNS.map((col) => {
          const part = palja[col.key as keyof Palja];
          
          return (
            <div key={col.key} className="flex flex-col text-center">
              {/* 기둥 타이틀 */}
              <div className="py-2 bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-100">
                {col.label}
              </div>
              
              {/* 천간 (위) */}
              <div className={cn("py-4 flex flex-col items-center justify-center border-b border-slate-50/50", OHENG_BG_COLORS[part.ohengGan as string])}>
                <span className={cn("text-3xl font-extrabold font-serif mb-1", OHENG_TEXT_COLORS[part.ohengGan as string])}>
                  {part.gan}
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/60", OHENG_TEXT_COLORS[part.ohengGan as string])}>
                  {part.ohengGan}
                </span>
              </div>
              
              {/* 지지 (아래) */}
              <div className={cn("py-4 flex flex-col items-center justify-center", OHENG_BG_COLORS[part.ohengJi as string])}>
                <span className={cn("text-3xl font-extrabold font-serif mb-1", OHENG_TEXT_COLORS[part.ohengJi as string])}>
                  {part.ji}
                </span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-white/60", OHENG_TEXT_COLORS[part.ohengJi as string])}>
                  {part.ohengJi}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
