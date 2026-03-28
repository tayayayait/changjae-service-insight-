import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportSectionCardProps {
  title: string;
  summary?: string;
  interpretation: string;
  advice: string;
  luckyTip?: string;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function ReportSectionCard({
  title,
  summary,
  interpretation,
  advice,
  luckyTip,
  icon,
  defaultExpanded = false
}: ReportSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn(
      "w-full rounded-2xl border transition-all duration-300 overflow-hidden",
      isExpanded ? "border-indigo-100 bg-white shadow-md ring-1 ring-indigo-50" : "border-gray-100 bg-gray-50/50 hover:bg-white"
    )}>
      {/* Header (Clickable) */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600">
              {icon}
            </div>
          )}
          <h3 className="text-[18px] font-bold text-gray-900">{title}</h3>
        </div>
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-gray-400">
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Content Body (Animates Open/Close) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5">
              
              {/* Summary if provided */}
              {summary && (
                <div className="text-[15px] font-bold text-gray-800 leading-relaxed pb-3 border-b border-gray-100">
                  {summary}
                </div>
              )}

              {/* Interpretation */}
              <div className="text-[15px] text-gray-600 leading-[1.8]">
                <p className="whitespace-pre-line">{interpretation}</p>
              </div>

              {/* Advice Box */}
              <div className="bg-gray-50 rounded-xl p-4 flex gap-3 border border-gray-100">
                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[14px] text-gray-700 leading-[1.8]">
                  {advice}
                </p>
              </div>

              {/* Lucky Tip Box */}
              {luckyTip && (
                <div className="bg-indigo-50/50 rounded-xl p-4 flex gap-3 border border-indigo-50">
                  <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-[12px] font-bold text-indigo-600 uppercase mb-0.5">Lucky Tip</span>
                    <p className="text-[14px] text-indigo-900 leading-relaxed">
                      {luckyTip}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
