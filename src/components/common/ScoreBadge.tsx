import { cn } from "@/lib/utils";
import React from "react";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreBadge({ score, size = "md", className }: ScoreBadgeProps) {
  let colorClass = "bg-gray-100 text-gray-700";
  
  if (score >= 80) {
    colorClass = "bg-blue-100 text-blue-700 border border-blue-200";
  } else if (score >= 60) {
    colorClass = "bg-emerald-100 text-emerald-700 border border-emerald-200";
  } else if (score >= 40) {
    colorClass = "bg-amber-100 text-amber-700 border border-amber-200";
  } else {
    colorClass = "bg-rose-100 text-rose-700 border border-rose-200";
  }

  const sizeClass = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-full",
    md: "px-2.5 py-1 text-sm font-bold rounded-full",
    lg: "px-3 py-1.5 text-base font-black rounded-full"
  }[size];

  return (
    <span className={cn("inline-flex items-center justify-center", sizeClass, colorClass, className)}>
      {score}점
    </span>
  );
}
