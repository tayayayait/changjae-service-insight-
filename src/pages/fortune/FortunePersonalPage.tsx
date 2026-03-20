import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SegmentedToggle } from "@/components/saju/SegmentedToggle";
import { MonthlyFortuneGraph } from "@/components/charts/MonthlyFortuneGraph";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { AnalysisPeriod, FortuneResult, SajuResult } from "@/types/result";
import { saveFortuneResult } from "@/lib/resultStore";
import { useResultStore } from "@/store/useResultStore";
import { useFortuneStore } from "@/store/useFortuneStore";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { FortuneResultCard } from "@/components/fortune/FortuneResultCard";
import { DAILY_CATEGORIES } from "@/components/fortune/DailyFortuneGrid";
import { FortuneDetailCard } from "@/components/fortune/FortuneDetailCard";
import { WeeklyBarChart } from "@/components/charts/WeeklyBarChart";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

const PERIOD_OPTIONS = [
  { label: "오늘", value: "today" },
  { label: "주간", value: "week" },
  { label: "월간", value: "month" },
];

const toISODate = (date: Date) => date.toISOString().slice(0, 10);

const buildTrendData = (score: number) => {
  const base = Math.max(10, Math.min(95, score));
  const month = new Date().getMonth();
  return Array.from({ length: 12 }, (_, index) => {
    const wave = Math.sin((index + month) / 2) * 10;
    const value = Math.max(0, Math.min(100, Math.round(base + wave)));
    return { month: index + 1, score: value };
  });
};

const buildWeekData = (score: number) => {
  const base = Math.max(10, Math.min(95, score));
  const labels = ["월", "화", "수", "목", "금", "토", "일"];
  return labels.map((label, index) => ({
    label,
    score: Math.max(0, Math.min(100, Math.round(base + Math.cos(index / 1.4) * 8))),
  }));
};

export default function FortunePersonalPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoryId") || "total";

  const { currentResult: baseResult, loadLatestResult, isLoading: isBaseLoading } = useResultStore();
  const { cache, fetchFortune, isLoading: isFortuneLoading, error } = useFortuneStore();

  const [period, setPeriod] = useState<AnalysisPeriod>("today");
  const [isSaving, setIsSaving] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const fortune = cache[period];
  const isLoading = isBaseLoading || isFortuneLoading;

  useEffect(() => {
    if (!baseResult) {
      void loadLatestResult();
    }
  }, [baseResult, loadLatestResult]);

  useEffect(() => {
    if (baseResult) {
      void fetchFortune(baseResult, period, retryToken > 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseResult, period, retryToken]);

  const trendData = useMemo(() => buildTrendData(fortune?.score ?? 0), [fortune?.score]);
  const weekData = useMemo(() => buildWeekData(fortune?.score ?? 0), [fortune?.score]);

  const handleSave = async () => {
    if (!fortune || !baseResult) {
      return;
    }

    setIsSaving(true);
    try {
      await saveFortuneResult({
        ...fortune,
        baseResultId: baseResult.id,
        sourceKind: "personal",
      });
      toast({
        title: "저장 완료",
        description: "개인 운세가 마이페이지에 저장되었습니다.",
      });
    } catch (saveError) {
      toast({
        title: "저장 실패",
        description: saveError instanceof Error ? saveError.message : "운세를 저장하지 못했습니다.",
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
          <h1 className="text-h2 text-foreground">내 사주 운세</h1>
          <p className="text-caption text-text-secondary">저장된 사주를 기준으로 기간별 운세를 조회하고 저장할 수 있습니다.</p>
        </header>

        <FortuneSubNav />

        <SegmentedToggle options={PERIOD_OPTIONS} value={period} onChange={(next) => setPeriod(next as AnalysisPeriod)} />

        {!baseResult ? (
          <EmptyState
            title="기준 사주 데이터가 없습니다"
            description="개인 운세를 사용하려면 먼저 사주 분석을 완료해주세요."
            actionLabel="사주 분석 시작"
            actionTo="/saju"
          />
        ) : null}

        {isLoading ? (
          <>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={5} />
          </>
        ) : null}

        {!isLoading && error ? <ErrorCard message={error} onRetry={() => setRetryToken((prev) => prev + 1)} /> : null}

        {!isLoading && !error && fortune ? (
          <div className="space-y-8">
            <FortuneResultCard
              title={period === "today" ? "오늘 운세" : period === "week" ? "주간 운세" : "월간 운세"}
              fortune={fortune}
              saveAction={() => void handleSave()}
              isSaving={isSaving}
            />

            {period === "today" && (
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">영역별 심층 분석</h3>
                  <p className="text-sm text-gray-500 font-medium">항목을 클릭하여 펼쳐보세요</p>
                </div>
                
                {/* 6 Category Stack */}
                <div className="space-y-4">
                  {DAILY_CATEGORIES.map((cat) => {
                    const categoryData = fortune.categories?.[cat.id as keyof typeof fortune.categories];
                    if (!categoryData) return null;

                    return (
                      <FortuneDetailCard
                        key={cat.id}
                        id={cat.id}
                        title={cat.title}
                        subtitle={cat.subtitle}
                        icon={cat.icon}
                        colorClass={cat.color}
                        bgClass={cat.bgColor}
                        score={categoryData.score}
                        summary={categoryData.summary}
                        detail={categoryData.detail || ""}
                        advice={categoryData.advice || ""}
                        luckyTip={categoryData.luckyTip}
                        cautionPoint={categoryData.cautionPoint}
                        isExpanded={selectedCategory === cat.id}
                        onToggle={(id) => setSelectedCategory(id)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {period === "week" ? (
              <Card className="space-y-4 rounded-[28px] border-indigo-100 p-6 shadow-sm bg-white">
                <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">이번 주 흐름 그래프</h2>
                <WeeklyBarChart data={weekData} />
              </Card>
            ) : null}

            {period === "month" ? (
              <Card className="space-y-3 rounded-lg border-border p-5">
                <h2 className="text-title text-foreground">월별 흐름 그래프</h2>
                <MonthlyFortuneGraph data={trendData} />
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
