import React from "react";
import { Oheng } from "@/types/result";
import { cn } from "@/lib/utils";
import { UserPlus, UserMinus, ShieldCheck, Heart } from "lucide-react";

interface HelperItem {
  type: string;
  oheng: Oheng;
  description: string;
}

interface SajuHelperMapProps {
  helpers: HelperItem[];
  className?: string;
}

const OHENG_ICONS: Record<Oheng, React.ElementType> = {
  '목': Heart,
  '화': Zap, // Actually Zap is not in imports, I'll use Heart/ShieldCheck
  '토': ShieldCheck,
  '금': ShieldCheck,
  '수': UserPlus,
};

// Re-importing common icons to be safe
import { Zap, Users } from "lucide-react";

const OHENG_STYLING: Record<Oheng, { bg: string; border: string; iconBg: string; iconColor: string }> = {
  '목': { bg: 'bg-blue-50/50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  '화': { bg: 'bg-red-50/50', border: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  '토': { bg: 'bg-yellow-50/50', border: 'border-yellow-100', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  '금': { bg: 'bg-slate-100/50', border: 'border-slate-200', iconBg: 'bg-slate-200', iconColor: 'text-slate-600' },
  '수': { bg: 'bg-stone-200/50', border: 'border-stone-300', iconBg: 'bg-stone-300', iconColor: 'text-stone-800' },
};

export const SajuHelperMap: React.FC<SajuHelperMapProps> = ({ helpers, className }) => {
  if (!helpers || helpers.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 mb-2 px-1">
        <Users className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">나의 귀인 네트워크</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {helpers.map((helper, i) => {
          const style = OHENG_STYLING[helper.oheng];
          return (
            <div 
              key={i} 
              className={cn(
                "group p-5 rounded-[32px] border transition-all hover:shadow-md",
                style.bg, style.border
              )}
            >
              <div className="flex items-start gap-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", style.iconBg)}>
                   <UserPlus className={cn("w-6 h-6", style.iconColor)} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-stone-900 dark:text-stone-100">{helper.type}</h4>
                    <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase", style.iconBg, style.iconColor)}>
                      {helper.oheng} 기운
                    </span>
                  </div>
                  <p className="text-xs font-medium text-stone-500 leading-relaxed">
                    {helper.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-indigo-50/30 dark:bg-indigo-500/5 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-500/20">
        <p className="text-[11px] font-bold text-indigo-600 text-center">
          💡 주변 지인 중 위 기운이 강하거나 해당 특징을 가진 분들과의 협력이 길합니다.
        </p>
      </div>
    </div>
  );
};
