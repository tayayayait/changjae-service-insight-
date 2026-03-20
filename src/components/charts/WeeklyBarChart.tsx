import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface WeeklyScore {
  label: string;
  score: number;
}

interface WeeklyBarChartProps {
  data: WeeklyScore[];
  className?: string;
  height?: number;
}

export function WeeklyBarChart({ data, className, height = 160 }: WeeklyBarChartProps) {
  const maxScore = 100;
  
  return (
    <div className={cn("w-full flex items-end justify-between px-2 gap-2 mt-4", className)} style={{ height }}>
      {data.map((item, index) => {
        const percentage = Math.max(10, (item.score / maxScore) * 100);
        const isHigh = item.score >= 80;

        return (
          <div key={item.label} className="flex flex-col items-center flex-1 group h-full justify-end">
            <span className="text-[12px] font-bold text-indigo-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.score}
            </span>
            <div className="w-full relative flex justify-center h-full items-end pb-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${percentage}%` }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={cn(
                  "w-8 sm:w-10 rounded-t-xl transition-all relative overflow-hidden",
                  isHigh 
                    ? "bg-gradient-to-t from-indigo-500 to-indigo-400 shadow-md shadow-indigo-200"
                    : "bg-indigo-50 hover:bg-indigo-100"
                )}
              >
                {/* Highlight dot for high scores */}
                {isHigh && (
                   <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white/50" />
                )}
              </motion.div>
            </div>
            <span className={cn(
              "text-[13px] mt-2 font-bold",
              isHigh ? "text-indigo-600" : "text-gray-400"
            )}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
