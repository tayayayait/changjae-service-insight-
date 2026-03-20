import { cn } from "@/lib/utils";

interface RelationshipStatusSelectorProps<T extends string = string> {
  value?: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}

export function RelationshipStatusSelector<T extends string = string>({
  value,
  options,
  onChange,
}: RelationshipStatusSelectorProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
      {options.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={value === item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            "h-11 rounded-xl border text-[13px] font-semibold transition-all",
            value === item.value
              ? "border-[#24303F] bg-[#24303F] text-white"
              : "border-border bg-white text-foreground hover:bg-gray-50",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
