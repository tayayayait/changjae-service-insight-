import { cn } from "@/lib/utils";
import React from "react";
import { StickyCTA } from "./StickyCTA";

interface ActionConfig {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface StickyActionBarProps {
  primaryAction: ActionConfig;
  secondaryAction?: ActionConfig;
}

export function StickyActionBar({ primaryAction, secondaryAction }: StickyActionBarProps) {
  return (
    <StickyCTA>
      <div className="flex items-center gap-3">
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="flex-1 flex items-center justify-center gap-2 h-[56px] rounded-2xl bg-gray-50 text-gray-700 font-bold border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all active:scale-[0.98]"
          >
            {secondaryAction.icon}
            <span className="text-[15px]">{secondaryAction.label}</span>
          </button>
        )}
        <button
          onClick={primaryAction.onClick}
          className={cn(
             "flex items-center justify-center gap-2 h-[56px] rounded-2xl text-white font-bold transition-transform active:scale-[0.98]",
             secondaryAction ? "flex-[2]" : "w-full",
             "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20"
          )}
        >
          {primaryAction.icon}
          <span className="text-[16px]">{primaryAction.label}</span>
        </button>
      </div>
    </StickyCTA>
  );
}
