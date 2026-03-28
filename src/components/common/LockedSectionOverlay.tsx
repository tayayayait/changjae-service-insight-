import React from "react";
import { cn } from "@/lib/utils";
import { PaywallLockIcon } from "@/components/common/PaywallLockIcon";

const DEFAULT_LOCK_LABEL = "\uACB0\uC81C \uD6C4 \uC5F4\uB78C";

interface LockedSectionOverlayProps {
  locked: boolean;
  label?: string;
  blurAmount?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function LockedSectionOverlay({
  locked,
  label = DEFAULT_LOCK_LABEL,
  blurAmount = "blur-md",
  children,
  onClick,
  className,
}: LockedSectionOverlayProps) {
  if (!locked) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative isolate cursor-pointer group overflow-hidden",
        locked ? "min-h-[112px] sm:min-h-[124px]" : "",
        className,
      )}
      onClick={onClick}
    >
      <div className={cn("select-none transition-all duration-300", blurAmount, "opacity-40")}>
        {children}
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/10 px-3 py-3 backdrop-blur-[2px] sm:px-4 sm:py-4">
        <div className="flex w-full max-w-[220px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-white/70 bg-white/20 px-3 py-3 text-center shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-xl sm:h-11 sm:w-11">
            <PaywallLockIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <p className="rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-black text-white shadow-lg uppercase tracking-wider sm:px-4">
            {label}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
