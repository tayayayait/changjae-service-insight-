import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { getYearlyFortune } from "@/lib/geminiClient";
import { getLatestSajuResultOrProfile } from "@/lib/resultStore";
import { SajuResult, YearlyFortuneResult } from "@/types/result";

export default function YearlyFortunePage() {
  const [baseResult, setBaseResult] = useState<SajuResult | null>(null);
  const [yearly, setYearly] = useState<YearlyFortuneResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const latest = await getLatestSajuResultOrProfile();
        setBaseResult(latest);
        if (!latest) {
          setYearly(null);
          return;
        }

        const currentYear = new Date().getFullYear();
        const response = await getYearlyFortune({
          sajuData: {
            palja: latest.palja,
            oheng: latest.oheng,
          },
          year: currentYear,
        });
        setYearly(response);
      } catch (loadError) {
        setYearly(null);
        setError(loadError instanceof Error ? loadError.message : "연간 운세를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [retryToken]);

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-5 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground">연간 운세</h1>
          <p className="text-caption text-text-secondary">개인 사주 기준으로 올해 흐름과 월별 핵심 포인트를 확인합니다.</p>
        </header>

        <FortuneSubNav />

        {isLoading ? <SkeletonCard lines={8} /> : null}

        {!isLoading && !baseResult ? (
          <EmptyState
            title="기준 사주 데이터가 없습니다"
            description="연간 운세를 보려면 먼저 사주 분석을 완료해주세요."
            actionLabel="사주 분석 시작"
            actionTo="/saju"
          />
        ) : null}

        {!isLoading && error ? <ErrorCard message={error} onRetry={() => setRetryToken((prev) => prev + 1)} /> : null}

        {!isLoading && !error && yearly ? (
          <>
            <Card className="space-y-4 rounded-lg border-border p-5">
              <p className="text-[12px] font-semibold text-text-secondary">{yearly.year}년 종합 점수</p>
              <h2 className="text-h2 text-foreground">{yearly.overallScore}점</h2>
              <p className="text-[14px] leading-7 text-foreground">{yearly.summary}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-bg-subtle p-4">
                  <p className="text-[12px] font-semibold text-text-secondary">집중 포인트</p>
                  <ul className="mt-2 space-y-1 text-[14px] text-foreground">
                    {yearly.focus.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md bg-bg-subtle p-4">
                  <p className="text-[12px] font-semibold text-text-secondary">주의 포인트</p>
                  <ul className="mt-2 space-y-1 text-[14px] text-foreground">
                    {yearly.cautions.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <div className="grid gap-3 md:grid-cols-2">
              {yearly.months.map((item) => (
                <Card key={item.month} className="rounded-lg border-border p-4">
                  <p className="text-[12px] font-semibold text-text-secondary">{item.month}월</p>
                  <p className="mt-1 text-[17px] font-bold text-foreground">{item.score}점</p>
                  <p className="mt-2 text-[13px] leading-6 text-text-secondary">{item.summary}</p>
                </Card>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
