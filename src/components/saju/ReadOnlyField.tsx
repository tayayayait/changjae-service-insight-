import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReadOnlyFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  onClick: () => void;
  error?: string;
  helper?: string;
}

export function ReadOnlyField({ label, value, placeholder, onClick, error, helper }: ReadOnlyFieldProps) {
  return (
    <div className="space-y-sp-2">
      <label className="text-label text-foreground">{label}</label>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex h-[52px] w-full items-center justify-between rounded-md border bg-bg-elevated px-sp-4 transition-normal",
          error
            ? "border-destructive ring-2 ring-destructive"
            : "border-border hover:border-line-strong hover:bg-bg-surface"
        )}
      >
        <span className={cn("text-body-strong", !value && "text-text-muted")}>
          {value || placeholder || "선택하세요"}
        </span>
        <ChevronDown size={20} className="text-text-muted" />
      </button>
      {error && (
        <p className="text-caption text-destructive">{error}</p>
      )}
      {helper && !error && (
        <p className="text-caption text-text-secondary">{helper}</p>
      )}
    </div>
  );
}
