import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Lightbulb, Zap, ArrowRightCircle } from "lucide-react";

interface SajuActionCardsProps {
  doItems?: string[];
  dontItems?: string[];
  tips?: string[];
  className?: string;
}

export const SajuActionCards: React.FC<SajuActionCardsProps> = ({
  doItems = [],
  dontItems = [],
  tips = [],
  className
}) => {
  const hasItems = doItems.length > 0 || dontItems.length > 0 || tips.length > 0;
  if (!hasItems) return null;

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4 py-4", className)}>
      {/* DO List */}
      {doItems.length > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-emerald-900 dark:text-emerald-400">적극 권장 (DO)</h3>
          </div>
          <ul className="space-y-3">
            {doItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200/80 leading-relaxed">
                <ArrowRightCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DON'T List */}
      {dontItems.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-lg font-black text-rose-900 dark:text-rose-400">주의 사항 (DON'T)</h3>
          </div>
          <ul className="space-y-3">
            {dontItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-bold text-rose-800 dark:text-rose-200/80 leading-relaxed">
                <ArrowRightCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Tips (Full width) */}
      {tips.length > 0 && (
        <div className="md:col-span-2 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-indigo-900 dark:text-indigo-400">지금 바로 실천할 것</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/50 dark:bg-stone-900/50 p-4 rounded-2xl border border-indigo-50/50 dark:border-indigo-500/10">
                <Lightbulb className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm font-bold text-stone-700 dark:text-stone-300 leading-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
