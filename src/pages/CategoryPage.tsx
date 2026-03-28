import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Heart, MoonStar, Sparkles, type LucideIcon } from "lucide-react";
import { CategoryHero } from "@/components/fortune/CategoryHero";
import { CategorySideHero } from "@/components/fortune/CategorySideHero";
import { CategoryTabs } from "@/components/common/CategoryTabs";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import {
  getCategoryServiceCards,
  getFallbackServiceCards,
  type CategoryKey as ServiceCategoryKey,
} from "@/lib/serviceCatalog";

const SuggestionModal = lazy(() =>
  import("@/components/suggestion/SuggestionModal").then((module) => ({
    default: module.SuggestionModal,
  })),
);
const DailyFortuneGrid = lazy(() =>
  import("@/components/fortune/DailyFortuneGrid").then((module) => ({
    default: module.DailyFortuneGrid,
  })),
);
const FortuneSpecialGrid = lazy(() =>
  import("@/components/fortune/FortuneSpecialGrid").then((module) => ({
    default: module.FortuneSpecialGrid,
  })),
);
const ProductGrid = lazy(() =>
  import("@/components/fortune/ProductGrid").then((module) => ({
    default: module.ProductGrid,
  })),
);

interface CategoryTab {
  id: string;
  label: string;
}

interface CategoryInfo {
  title: string;
  icon: LucideIcon;
  themeColor: string;
  videoSrc?: string;
  posterSrc?: string;
  videoObjectPosition?: string;
  videoObjectFit?: "cover" | "contain";
  minHeight?: string;
  bannerConfig: {
    label: string;
    title: string;
    description: string;
  };
  tabs: CategoryTab[];
}

const CATEGORY_DATA: Record<ServiceCategoryKey, CategoryInfo> = {
  saju: {
    title: "사주·만세력",
    icon: MoonStar,
    themeColor: "accent-lavender",
    videoSrc: "/videos/%ED%99%A9%EA%B8%88%EC%86%8C%EB%82%98%EB%AC%B4.mp4",
    posterSrc: "/images/%ED%99%A9%EA%B8%88%EC%86%8C%EB%82%98%EB%AC%B4.jpg",
    videoObjectPosition: "50% 25%",
    videoObjectFit: "cover",
    minHeight: "min-h-[440px]",
    bannerConfig: {
      label: "2026 신년 분석",
      title: "사주로 보는 올해의 전환 포인트",
      description: "대운과 연운 흐름을 정리해 지금 필요한 선택 시점을 안내합니다.",
    },
    tabs: [
      { id: "lifetime", label: "인생 총운" },
      { id: "new-year", label: "2026 신년 운세" },
      { id: "today", label: "오늘의 운세" },
    ],
  },
  astrology: {
    title: "점성술·별자리",
    icon: Sparkles,
    themeColor: "accent-sky",
    bannerConfig: {
      label: "Cosmic News",
      title: "이번 주 주요 천체 흐름",
      description: "행성 이동과 위상 변화를 기준으로 지금 필요한 행동 신호를 제공합니다.",
    },
    tabs: [],
  },
  love: {
    title: "연애·궁합",
    icon: Heart,
    themeColor: "accent-pink",
    bannerConfig: {
      label: "Destiny Track",
      title: "상담형 연애 리포트 허브",
      description: "미래 배우자, 커플 궁합, 재회 가능성까지 사주 기반으로 분석합니다.",
    },
    tabs: [
      { id: "solo", label: "미래 배우자" },
      { id: "couple", label: "커플 궁합" },
      { id: "crush", label: "재회 가능성" },
    ],
  },
};

type CategoryKey = keyof typeof CATEGORY_DATA;

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const GridFallback = () => <div className="h-48 animate-pulse rounded-[24px] bg-gray-100" />;

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
  });

  const isValidCategory = categoryId && Object.keys(CATEGORY_DATA).includes(categoryId);
  const curCategoryKey = isValidCategory ? (categoryId as CategoryKey) : "saju";
  const categoryData = CATEGORY_DATA[curCategoryKey];

  const hasTabs = categoryData.tabs.length > 0;
  const defaultTabId = hasTabs ? categoryData.tabs[0].id : "all";
  const requestedTabId = hasTabs ? searchParams.get("tab") : null;
  const isValidTabId =
    hasTabs && requestedTabId
      ? categoryData.tabs.some((tab) => tab.id === requestedTabId)
      : false;
  const activeTabId = hasTabs
    ? isValidTabId && requestedTabId
      ? requestedTabId
      : defaultTabId
    : "all";
  const activeTabLabel = hasTabs
    ? categoryData.tabs.find((tab) => tab.id === activeTabId)?.label ?? activeTabId
    : "추천";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [categoryId, activeTabId]);

  useEffect(() => {
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktopLayout(event.matches);
    };

    setIsDesktopLayout(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hasTabs) {
      return;
    }
    if (requestedTabId === activeTabId) {
      return;
    }
    setSearchParams({ tab: activeTabId }, { replace: true });
  }, [activeTabId, hasTabs, requestedTabId, setSearchParams]);

  const categoryProducts = useMemo(
    () => getCategoryServiceCards(curCategoryKey),
    [curCategoryKey],
  );
  const filteredProducts = useMemo(
    () =>
      hasTabs
        ? categoryProducts.filter((product) => product.tabIds.includes(activeTabId))
        : categoryProducts,
    [activeTabId, categoryProducts, hasTabs],
  );
  const fallbackProducts = useMemo(
    () => getFallbackServiceCards(curCategoryKey, 3),
    [curCategoryKey],
  );

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const handleShowCoreServices = () => {
    if (!hasTabs) {
      return;
    }
    if (curCategoryKey === "saju") {
      handleTabChange("lifetime");
      return;
    }
    handleTabChange(categoryData.tabs[0].id);
  };

  const handleResetFilters = () => {
    if (!hasTabs) {
      return;
    }
    handleTabChange(categoryData.tabs[0].id);
  };

  const handleMoveToNewYear = () => {
    if (!hasTabs || curCategoryKey !== "saju") {
      return;
    }
    const hasNewYearTab = categoryData.tabs.some((tab) => tab.id === "new-year");
    if (!hasNewYearTab) {
      return;
    }
    handleTabChange("new-year");
  };

  return (
    <AnalysisPageShell
      categoryId={curCategoryKey as "saju" | "astrology" | "love"}
      title={categoryData.title}
      icon={categoryData.icon}
      themeColor={categoryData.themeColor}
    >
      <div className="flex items-start gap-8 lg:flex-row">
        <div className="flex w-full flex-1 flex-col gap-6">
          {!isDesktopLayout ? (
            <CategoryHero
              bannerConfig={categoryData.bannerConfig}
              themeColor={categoryData.themeColor}
              videoSrc={categoryData.videoSrc}
              posterSrc={categoryData.posterSrc}
              videoObjectPosition={categoryData.videoObjectPosition}
              videoObjectFit={categoryData.videoObjectFit}
              minHeight={categoryData.minHeight}
            />
          ) : null}

          <div className="flex flex-col gap-4">
            {hasTabs ? (
              <CategoryTabs
                tabs={categoryData.tabs}
                activeTabId={activeTabId}
                onTabChange={handleTabChange}
                className="rounded-2xl border border-gray-100 bg-white px-2"
              />
            ) : null}

            <div className="flex items-center justify-between px-2">
              <h3 className="text-[18px] font-bold text-gray-900">
                {hasTabs ? `${activeTabLabel} 추천 서비스` : "추천 서비스"}
              </h3>
              {curCategoryKey !== "saju" ? (
                <span className="text-[13px] font-medium text-text-muted">
                  총 {filteredProducts.length}개
                </span>
              ) : null}
            </div>

            <div key={`${curCategoryKey}-${activeTabId}`} className="space-y-8">
              {curCategoryKey === "saju" && activeTabId === "new-year" ? (
                <section className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">2026 신년 분석 추천</h4>
                  </div>
                  <Suspense fallback={<GridFallback />}>
                    <FortuneSpecialGrid />
                  </Suspense>
                </section>
              ) : curCategoryKey === "saju" && activeTabId === "today" ? (
                <section className="rounded-[32px] border border-gray-100 bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">오늘의 6가지 운세 분석</h4>
                  </div>
                  <Suspense fallback={<GridFallback />}>
                    <DailyFortuneGrid
                      onCategorySelect={(selectedCategoryId) =>
                        navigate(`/service/saju-today-briefing?categoryId=${selectedCategoryId}`)
                      }
                    />
                  </Suspense>
                  <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 font-medium text-indigo-900">
                    <p className="text-sm">
                      현재 '오늘의 운세' 서비스는 <strong>무료</strong>로 제공되고 있습니다. 항목을 선택해 상세 조언을 확인해 보세요.
                    </p>
                  </div>
                </section>
              ) : (
                <>
                  <Suspense fallback={<GridFallback />}>
                    <ProductGrid
                      products={filteredProducts}
                      activeTabId={activeTabId}
                      activeTabLabel={activeTabLabel}
                      categoryId={curCategoryKey}
                      fallbackProducts={fallbackProducts}
                      onShowCoreServices={handleShowCoreServices}
                      onResetFilters={handleResetFilters}
                      onMoveToNewYear={curCategoryKey === "saju" ? handleMoveToNewYear : undefined}
                    />
                  </Suspense>

                  {curCategoryKey === "saju" && activeTabId === "lifetime" ? (
                    <div
                      onClick={handleMoveToNewYear}
                      className="group mt-6 flex cursor-pointer flex-col items-center justify-between rounded-[24px] border border-indigo-100 bg-indigo-50/50 p-6 transition-all hover:border-indigo-200 hover:shadow-sm sm:flex-row"
                    >
                      <div>
                        <p className="mb-1 text-[14px] font-bold text-gray-900">
                          올해 재물운과 커리어 흐름도 함께 확인해 보셨나요?
                        </p>
                        <p className="text-[13px] font-medium text-gray-600">
                          2026년의 구체적인 실행 시점과 주의 구간을 빠르게 확인할 수 있습니다.
                        </p>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-[14px] font-bold text-indigo-600 transition-colors group-hover:text-indigo-700 sm:mt-0">
                        신년 운세 보러가기
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-gray-100 bg-white p-8 text-center">
            <p className="mb-4 text-sm font-medium text-text-muted">
              찾으시는 서비스가 없나요?
            </p>
            <button
              onClick={() => setSuggestionOpen(true)}
              className="rounded-2xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:translate-y-[-2px]"
            >
              운세 매니저에게 제안하기
            </button>
          </div>

          {suggestionOpen ? (
            <Suspense fallback={null}>
              <SuggestionModal open={suggestionOpen} onOpenChange={setSuggestionOpen} />
            </Suspense>
          ) : null}
        </div>

        {isDesktopLayout ? (
          <div className="hidden lg:block">
            <CategorySideHero
              bannerConfig={categoryData.bannerConfig}
              themeColor={categoryData.themeColor}
              videoSrc={categoryData.videoSrc}
              posterSrc={categoryData.posterSrc}
              videoObjectPosition={categoryData.videoObjectPosition}
              videoObjectFit={categoryData.videoObjectFit}
            />
          </div>
        ) : null}
      </div>

    </AnalysisPageShell>
  );
}
