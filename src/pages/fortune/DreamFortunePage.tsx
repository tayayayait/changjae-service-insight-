import { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { DREAM_SYMBOLS } from "@/lib/dreamSymbols";
import { getDreamInterpretation } from "@/lib/geminiClient";
import { saveDreamResult } from "@/lib/resultStore";
import { DreamInterpretation } from "@/types/result";
import { toast } from "@/hooks/use-toast";

const MAX_SYMBOL_COUNT = 3;

export default function DreamFortunePage() {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DreamInterpretation | null>(null);

  const canSubmit = useMemo(() => selectedSymbols.length > 0 || freeText.trim().length > 0, [selectedSymbols, freeText]);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((previous) => {
      if (previous.includes(symbol)) {
        return previous.filter((item) => item !== symbol);
      }

      if (previous.length >= MAX_SYMBOL_COUNT) {
        return previous;
      }

      return [...previous, symbol];
    });
  };

  const handleAnalyze = async () => {
    if (!canSubmit) {
      setError("심볼을 선택하거나 꿈 내용을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const interpretation = await getDreamInterpretation({
        input: {
          symbols: selectedSymbols,
          freeText: freeText.trim() || undefined,
        },
      });
      setResult(interpretation);
    } catch (loadError) {
      setResult(null);
      setError(loadError instanceof Error ? loadError.message : "꿈해몽 결과를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) {
      return;
    }

    setIsSaving(true);
    try {
      await saveDreamResult({
        input: {
          symbols: selectedSymbols,
          freeText: freeText.trim() || undefined,
        },
        interpretation: result,
      });
      toast({
        title: "저장 완료",
        description: "꿈해몽 결과가 저장되었습니다.",
      });
    } catch (saveError) {
      toast({
        title: "저장 실패",
        description: saveError instanceof Error ? saveError.message : "꿈해몽 결과를 저장하지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground">꿈해몽</h1>
          <p className="text-caption text-text-secondary">심볼 선택과 자유 서술을 함께 입력하면 구조화된 해석과 조언을 제공합니다.</p>
        </header>

        <FortuneSubNav />

        <Card className="space-y-4 rounded-lg border-border p-5">
          <div>
            <h2 className="text-title text-foreground">꿈 심볼 선택</h2>
            <p className="mt-1 text-[13px] text-text-secondary">최대 3개 선택 가능</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DREAM_SYMBOLS.map((symbol) => (
              <button
                key={symbol.id}
                type="button"
                onClick={() => toggleSymbol(symbol.label)}
                className={
                  selectedSymbols.includes(symbol.label)
                    ? "rounded-md border-2 border-[#24303F] bg-bg-subtle p-3 text-left"
                    : "rounded-md border border-border bg-bg-elevated p-3 text-left"
                }
              >
                <p className="text-[14px] font-semibold text-foreground">{symbol.label}</p>
                <p className="mt-1 text-[12px] text-text-secondary">{symbol.hint}</p>
              </button>
            ))}
          </div>

          <label className="space-y-1 text-[13px] font-semibold text-foreground">
            꿈 내용 (선택)
            <textarea
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              rows={4}
              placeholder="예: 숲길에서 문을 열었는데 밝은 빛이 보였어요."
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[14px] leading-6"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={isLoading}
            className="h-11 w-full rounded-md bg-[#24303F] text-[14px] font-semibold text-white hover:bg-[#1D2733] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "해석 중..." : "꿈해몽 시작"}
          </button>
        </Card>

        {isLoading ? <SkeletonCard lines={6} /> : null}
        {!isLoading && error ? <ErrorCard message={error} onRetry={() => void handleAnalyze()} /> : null}

        {!isLoading && !error && result ? (
          <Card className="space-y-4 rounded-lg border-border p-5">
            <h2 className="text-title text-foreground">{result.summary}</h2>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-bg-subtle p-4">
                <p className="text-[12px] font-semibold text-text-secondary">핵심 테마</p>
                <ul className="mt-2 space-y-1 text-[14px] text-foreground">
                  {result.themes.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-bg-subtle p-4">
                <p className="text-[12px] font-semibold text-text-secondary">주의 포인트</p>
                <ul className="mt-2 space-y-1 text-[14px] text-foreground">
                  {result.cautions.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-md border border-border p-4">
              <p className="text-[12px] font-semibold text-text-secondary">행동 조언</p>
              <p className="mt-1 text-[14px] leading-6 text-foreground">{result.advice}</p>
              {result.luckyTip ? <p className="mt-2 text-[13px] font-semibold text-[#B24C6A]">행운 팁: {result.luckyTip}</p> : null}
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="h-10 rounded-md border border-border px-4 text-[13px] font-semibold text-foreground hover:bg-bg-subtle disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "저장 중..." : "내 기록에 저장"}
            </button>
          </Card>
        ) : null}
      </div>
    </AppLayout>
  );
}
