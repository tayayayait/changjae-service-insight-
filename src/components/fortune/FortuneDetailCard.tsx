import { ScoreBadge } from "@/components/common/ScoreBadge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon, Sparkles, AlertTriangle } from "lucide-react";

interface FortuneDetailCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  score: number;
  summary: string;
  detail: string;
  advice: string;
  luckyTip?: string;
  cautionPoint?: string;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

export function FortuneDetailCard({
  id,
  title,
  subtitle,
  icon: Icon,
  colorClass,
  bgClass,
  score,
  summary,
  detail,
  advice,
  luckyTip,
  cautionPoint,
  isExpanded,
  onToggle
}: FortuneDetailCardProps) {
  const SafeIcon = Icon ?? Sparkles;

  return (
    <motion.div
      layout
      onClick={() => !isExpanded && onToggle(id)}
      className={cn(
        "w-full rounded-[24px] border overflow-hidden transition-all duration-300",
        isExpanded 
          ? "bg-white border-indigo-100 shadow-md ring-1 ring-indigo-50" 
          : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm cursor-pointer active:scale-[0.98]"
      )}
    >
      {/* Header (Always Visible) */}
      <div className="p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("flex items-center justify-center w-12 h-12 rounded-[18px]", bgClass, colorClass)}>
            <SafeIcon className="w-6 h-6" />
          </div>
          <div>
            <span className={cn("text-[12px] font-bold uppercase tracking-wider", colorClass)}>{subtitle}</span>
            <h3 className="text-[16px] font-black text-gray-900 tracking-tight">{title}</h3>
          </div>
        </div>
        <ScoreBadge score={score} size="md" />
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 space-y-5">
              
              {/* Summary */}
              <p className="text-[15px] font-bold text-gray-800 leading-relaxed border-b border-gray-100 pb-3">
                {summary}
              </p>

              {/* Detail */}
              <p className="text-[14px] text-gray-600 leading-[1.8]">
                {detail}
              </p>

              {/* Actions & Tips Grid */}
              <div className="grid gap-3 pt-2">
                {/* Advice Area */}
                <div className="bg-gray-50 rounded-[16px] p-4 border border-gray-100">
                  <span className="block text-[12px] font-bold text-gray-500 mb-1">💡 실용 조언</span>
                  <p className="text-[13px] text-gray-700 leading-[1.8]">{advice}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {luckyTip && (
                    <div className="bg-indigo-50/50 rounded-[16px] p-3.5 border border-indigo-50">
                      <div className="flex items-center gap-1.5 mb-1 text-indigo-600">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Lucky Tip</span>
                      </div>
                      <p className="text-[12px] text-indigo-900 font-medium leading-relaxed">{luckyTip}</p>
                    </div>
                  )}

                  {cautionPoint && (
                    <div className="bg-rose-50/50 rounded-[16px] p-3.5 border border-rose-50">
                      <div className="flex items-center gap-1.5 mb-1 text-rose-600">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">주의할 점</span>
                      </div>
                      <p className="text-[12px] text-rose-900 font-medium leading-relaxed">{cautionPoint}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Collapse action hint */}
            <div 
              className="w-full py-3 bg-gray-50 text-center text-xs font-semibold text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-600 transition-colors"
              onClick={(e) => { e.stopPropagation(); onToggle(""); }}
            >
              닫기
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
