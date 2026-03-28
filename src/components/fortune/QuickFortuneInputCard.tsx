import { Card } from "@/components/ui/card";
import { AnalysisPeriod } from "@/types/result";

interface QuickFortuneInputCardProps {
  title: string;
  description: string;
  period: AnalysisPeriod;
  onPeriodChange: (next: AnalysisPeriod) => void;
  selectLabel: string;
  options: readonly string[];
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  isLoading: boolean;
}

const PERIOD_OPTIONS: Array<{ label: string; value: AnalysisPeriod }> = [
  { label: "오늘", value: "today" },
];

export function QuickFortuneInputCard({
  title,
  description,
  period,
  onPeriodChange,
  selectLabel,
  options,
  value,
  onChange,
  onSubmit,
  submitLabel,
  isLoading,
}: QuickFortuneInputCardProps) {
  return (
    <Card className="space-y-4 rounded-lg border-border p-5">
      <div>
        <h2 className="text-title text-foreground">{title}</h2>
        <p className="mt-1 text-[13px] text-text-secondary">{description}</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PERIOD_OPTIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onPeriodChange(item.value)}
            className={
              period === item.value
                ? "h-10 rounded-md border-2 border-[#24303F] bg-bg-subtle text-[13px] font-semibold text-foreground"
                : "h-10 rounded-md border border-border bg-bg-elevated text-[13px] font-semibold text-text-secondary"
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="space-y-1 text-[13px] font-semibold text-foreground">
        {selectLabel}
        <select
          className="h-11 w-full rounded-md border border-border bg-bg-elevated px-3 text-[14px]"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isLoading}
        className="h-11 w-full rounded-md bg-[#24303F] text-[14px] font-semibold text-white hover:bg-[#1D2733] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "불러오는 중..." : submitLabel}
      </button>
    </Card>
  );
}
