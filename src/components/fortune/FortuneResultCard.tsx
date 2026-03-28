import { Card } from "@/components/ui/card";
import { LuckScoreRing } from "@/components/charts/LuckScoreRing";
import { FortuneResult } from "@/types/result";

interface FortuneResultCardProps {
  title: string;
  fortune: FortuneResult;
  saveAction?: () => void;
  isSaving?: boolean;
}

export function FortuneResultCard({ title, fortune, saveAction, isSaving = false }: FortuneResultCardProps) {
  return (
    <Card className="space-y-4 rounded-lg border-border p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] font-semibold text-text-secondary">{title}</p>
          <h3 className="mt-1 text-title text-foreground">{fortune.summary}</h3>
        </div>
        <LuckScoreRing score={fortune.score} />
      </div>

      <p className="text-[14px] leading-7 text-foreground">{fortune.details}</p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-bg-subtle p-3">
          <p className="font-semibold text-text-secondary">행운 색상</p>
          <p className="mt-1 font-semibold text-foreground">{fortune.luckyColor ?? "정보 없음"}</p>
        </div>
        <div className="rounded-md bg-bg-subtle p-3">
          <p className="font-semibold text-text-secondary">행운 아이템</p>
          <p className="mt-1 font-semibold text-foreground">{fortune.luckyItem ?? "정보 없음"}</p>
        </div>
      </div>

      {saveAction ? (
        <button
          type="button"
          onClick={saveAction}
          disabled={isSaving}
          className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "저장 중..." : "내 기록에 저장"}
        </button>
      ) : null}
    </Card>
  );
}
