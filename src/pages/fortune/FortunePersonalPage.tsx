import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ServiceIntroScreen } from "@/components/common/ServiceIntroScreen";
import { ErrorCard } from "@/components/common/ErrorCard";
import { FortuneSubNav } from "@/components/fortune/FortuneSubNav";
import { FortuneResultCard } from "@/components/fortune/FortuneResultCard";
import { DAILY_CATEGORIES } from "@/components/fortune/DailyFortuneGrid";
import { FortuneDetailCard } from "@/components/fortune/FortuneDetailCard";
import { useFortunePersonalFlow } from "@/hooks/fortune/useFortunePersonalFlow";
import { useFortuneStore } from "@/store/useFortuneStore";
import { useResultStore } from "@/store/useResultStore";
import { MysticalLoading } from "@/components/common/MysticalLoading";
import { AdGate } from "@/components/common/AdGate";
import { AdUnit } from "@/components/common/AdUnit";

export default function FortunePersonalPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCategory = searchParams.get("categoryId");

  const baseResult = useResultStore((state) => state.currentResult);
  const isBaseLoading = useResultStore((state) => state.isLoading);
  const cache = useFortuneStore((state) => state.cache);
  const fetchFortune = useFortuneStore((state) => state.fetchFortune);
  const isFortuneLoading = useFortuneStore((state) => state.isLoading);
  const error = useFortuneStore((state) => state.error);

  const {
    fortune,
    isSaving,
    setRetryToken,
    selectedCategory,
    filteredCategories,
    handleSave,
  } = useFortunePersonalFlow({
    baseResult,
    cache,
    fetchFortune,
    initialCategory,
  });

  const isLoading = isBaseLoading || isFortuneLoading;
  const selectedCategoryTitle =
    DAILY_CATEGORIES.find((category) => category.id === selectedCategory)?.title ?? "영역별 상세";

  const personalNavItems = useMemo(
    () => [
      {
        label: "오늘의 운세",
        path: `/fortune/personal?categoryId=${selectedCategory}`,
      },
    ],
    [selectedCategory],
  );

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-5 px-6 py-8">
        <header className="space-y-2">
          <h1 className="text-h2 text-foreground">내 사주 운세</h1>
          <p className="text-caption text-text-secondary">
            저장된 사주를 기준으로 오늘의 운세를 조회하고 저장할 수 있습니다.
          </p>
        </header>

        <FortuneSubNav items={personalNavItems} />

        {!baseResult ? (
          <div className="py-6">
            <p className="mb-3 text-sm font-semibold text-text-secondary">기준 사주 데이터가 없습니다</p>
            <ServiceIntroScreen
              serviceId="saju-today-briefing"
              onStart={() => navigate("/service/saju-today-briefing")}
              ctaText="오늘의 운세 바로보기"
            />
          </div>
        ) : null}

        {isLoading ? (
          <div className="py-12 space-y-6">
            <MysticalLoading categoryId="saju" title="오늘의 운세를 분석하고 있습니다" />
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="mb-2 text-center text-[10px] font-bold tracking-widest text-slate-400">ADVERTISEMENT</p>
              <AdUnit slot="6738850110" format="auto" className="min-h-[250px]" />
            </div>
          </div>
        ) : null}

        {!isLoading && error ? (
          <ErrorCard message={error} onRetry={() => setRetryToken((prev) => prev + 1)} />
        ) : null}

        {!isLoading && !error && fortune ? (
          <AdGate enabled={true} countdownSec={5}>
          <div className="space-y-8">
            <FortuneResultCard
              title="오늘 운세"
              fortune={fortune}
              saveAction={() => void handleSave()}
              isSaving={isSaving}
            />

            <section className="space-y-4">
              <div className="mb-2 flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-foreground">{selectedCategoryTitle} 분석</h3>
                <p className="text-sm font-medium text-text-secondary">선택한 서비스만 표시됩니다.</p>
              </div>

              <div className="space-y-4">
                {filteredCategories.map((cat) => {
                  const categoryData = fortune.categories?.[cat.id];
                  if (!categoryData) {
                    return null;
                  }

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
                      isExpanded
                      onToggle={() => undefined}
                    />
                  );
                })}
              </div>
            </section>
          </div>
          </AdGate>
        ) : null}
      </div>
    </AppLayout>
  );
}
