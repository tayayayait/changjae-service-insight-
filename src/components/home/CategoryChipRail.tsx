import { cn } from "@/lib/utils";

export interface CategoryChipOption {
  label: string;
  value: string;
}

interface CategoryChipRailProps {
  options: CategoryChipOption[];
  value: string;
  onChange?: (value: string) => void;
  dense?: boolean;
  className?: string;
}

export function CategoryChipRail({ options, value, onChange, dense = false, className }: CategoryChipRailProps) {
  return (
    <div className={cn("no-scrollbar flex gap-2 overflow-x-auto pb-1", className)} role="tablist" aria-label="관심 카테고리">
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange?.(option.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 font-semibold transition-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              dense ? "h-9 text-[13px]" : "h-10 text-[14px]",
              isActive
                ? "border-[#24303F] bg-bg-subtle text-foreground shadow-sm"
                : "border-border bg-bg-elevated text-text-secondary hover:bg-bg-subtle hover:text-foreground",
            )}
            role="tab"
            aria-selected={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
