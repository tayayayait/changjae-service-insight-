import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GoldenPeriod } from "@/types/result";

type GoldenPeriodStatus = "past" | "current" | "future" | "age";

interface GoldenPeriodBadgeProps {
  period: GoldenPeriod;
  status: GoldenPeriodStatus;
  className?: string;
}

const getStatusLabel = (status: GoldenPeriodStatus) => {
  if (status === "past") return "이미 지나간 황금기";
  if (status === "current") return "지금 진행 중인 황금기";
  if (status === "future") return "다가오는 황금기";
  return "연령 기준 황금기";
};

const getPeriodLabel = (period: GoldenPeriod) => {
  if (typeof period.startYear === "number" && typeof period.endYear === "number") {
    if (period.startYear === period.endYear) {
      return `${period.startYear}년`;
    }
    return `${period.startYear}년 ~ ${period.endYear}년`;
  }

  return `${period.startAge}세 ~ ${period.endAge}세`;
};

export function GoldenPeriodBadge({ period, status, className }: GoldenPeriodBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "relative overflow-hidden rounded-[24px] p-6 shadow-lg shadow-amber-500/20",
        "bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white",
        className,
      )}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/20 blur-2xl" />

      <div className="relative z-10 flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-100" />
          <span className="text-[13px] font-bold tracking-wider text-amber-100">나의 인생 황금기</span>
        </div>
        <h3 className="text-3xl font-black tracking-tight">{getPeriodLabel(period)}</h3>
        <p className="mt-1 text-[13px] font-semibold text-amber-50/90">{getStatusLabel(status)}</p>
        <p className="mt-3 text-[15px] font-semibold leading-snug text-amber-50/95">{period.reason}</p>
      </div>
    </motion.div>
  );
}
