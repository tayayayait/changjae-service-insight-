import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionItem {
  label: string;
  description: string;
  icon: LucideIcon;
  to?: string;
  tone?: "sky" | "pink" | "mint" | "lavender" | "coral";
  disabled?: boolean;
}

interface QuickActionStripProps {
  items: QuickActionItem[];
}

const toneClasses: Record<NonNullable<QuickActionItem["tone"]>, string> = {
  sky: "bg-accent-sky/30 border-accent-sky",
  pink: "bg-accent-pink/30 border-accent-pink",
  mint: "bg-accent-mint/30 border-accent-mint",
  lavender: "bg-accent-lavender/30 border-accent-lavender",
  coral: "bg-accent-coral/30 border-accent-coral",
};

export function QuickActionStrip({ items }: QuickActionStripProps) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => {
        const Icon = item.icon;
        const body = (
          <>
            <span
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border bg-bg-elevated text-foreground shadow-sm",
                toneClasses[item.tone ?? "sky"],
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[14px] font-semibold text-foreground">{item.label}</span>
              <span className="block text-[12px] leading-5 text-text-secondary">{item.description}</span>
            </span>
            {item.disabled ? (
              <span className="ml-auto shrink-0 rounded-full bg-bg-subtle px-2 py-1 text-[11px] font-semibold text-text-secondary">
                준비 중
              </span>
            ) : null}
          </>
        );

        const sharedClassName = cn(
          "flex min-w-[220px] items-center gap-3 rounded-[20px] border border-border bg-bg-elevated px-4 py-3 text-left shadow-sm transition-normal",
          item.disabled ? "cursor-default opacity-85" : "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-md",
        );

        if (item.disabled || !item.to) {
          return (
            <div key={item.label} className={sharedClassName}>
              {body}
            </div>
          );
        }

        return (
          <Link key={item.label} to={item.to} className={sharedClassName}>
            {body}
          </Link>
        );
      })}
    </div>
  );
}
