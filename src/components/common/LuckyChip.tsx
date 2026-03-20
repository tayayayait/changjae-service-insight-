import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface LuckyChipProps {
  icon: LucideIcon;
  label: string;
  value: string;
  colorClass?: string;
  className?: string;
}

export function LuckyChip({ icon: Icon, label, value, colorClass = "bg-indigo-50 text-indigo-700", className }: LuckyChipProps) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/5 bg-white shadow-sm", className)}>
      <div className={cn("flex items-center justify-center h-6 w-6 rounded-full", colorClass)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider leading-none">
          {label}
        </span>
        <span className="text-sm font-bold text-gray-900 leading-tight">
          {value}
        </span>
      </div>
    </div>
  );
}
