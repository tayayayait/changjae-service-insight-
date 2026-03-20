import { cn } from "@/lib/utils";

interface SegmentedToggleProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedToggle({ options, value, onChange, className }: SegmentedToggleProps) {
  return (
    <div className={cn("relative flex rounded-full border border-border bg-bg-elevated p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 min-h-[40px] flex-1 rounded-full px-sp-4 text-button transition-normal",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-text-secondary hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
