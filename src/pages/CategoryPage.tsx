import { useEffect } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MoonStar, Hand, Heart, type LucideIcon } from "lucide-react";
import { CategoryHero } from "@/components/fortune/CategoryHero";
import { CategorySidebar } from "@/components/fortune/CategorySidebar";
import { ProductGrid } from "@/components/fortune/ProductGrid";
import { FortuneSpecialGrid } from "@/components/fortune/FortuneSpecialGrid";
import { DailyFortuneGrid } from "@/components/fortune/DailyFortuneGrid";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import {
  getCategoryServiceCards,
  getFallbackServiceCards,
  type CategoryKey as ServiceCategoryKey,
} from "@/lib/serviceCatalog";

interface CategoryTab {
  id: string;
  label: string;
}

interface CategoryInfo {
  title: string;
  icon: LucideIcon;
  themeColor: string;
  widgetType: string;
  bannerConfig: {
    label: string;
    title: string;
    description: string;
  };
  tabs: CategoryTab[];
}

const CATEGORY_DATA = {
  saju: {
    title: "사주·만세력",
    icon: MoonStar,
    themeColor: "accent-lavender",
    widgetType: "score",
    bannerConfig: {
      label: "2026 정밀 분석",
      title: "내 사주로 보는 올해의 전환점",
      description: "대운과 세운의 흐름을 해석해 중요한 선택 시점을 명확히 안내합니다.",
    },
    tabs: [
      { id: "lifetime", label: "인생 총운" },
      { id: "new-year", label: "2026 신년 운세" },
      { id: "today", label: "오늘의 운세" },
    ],
  },
  astrology: {
    title: "점성학·별자리",
    icon: Sparkles,
    themeColor: "accent-sky",
    widgetType: "moon",
    bannerConfig: {
      label: "Cosmic News",
      title: "이번 주 주요 천체 흐름",
      description: "행성 이동과 위상 변화를 바탕으로 지금 필요한 행동 포인트를 제공합니다.",
    },
    tabs: [],
  },
  palmistry: {
    title: "관상·손금",
    icon: Hand,
    themeColor: "accent-mint",
    widgetType: "scanner",
    bannerConfig: {
      label: "AI 비전 분석",
      title: "한 번의 스캔, 손금 핵심 4섹션",
      description: "성향·재물/커리어·관계·변화시기를 지표 기반 리포트로 정리합니다.",
    },
    tabs: [
      { id: "palm", label: "손금 분석" },
      { id: "face", label: "AI 관상" },
    ],
  },
  love: {
    title: "연애·궁합",
    icon: Heart,
    themeColor: "accent-pink",
    widgetType: "match",
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
} satisfies Record<ServiceCategoryKey, CategoryInfo>;

type CategoryKey = keyof typeof CATEGORY_DATA;

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isValidCategory = categoryId && Object.keys(CATEGORY_DATA).includes(categoryId);
  const curCategoryKey = isValidCategory ? (categoryId as CategoryKey) : "saju";
  const categoryData = CATEGORY_DATA[curCategoryKey];

  const hasTabs = categoryData.tabs.length > 0;
  const activeTabId = hasTabs ? searchParams.get("tab") || categoryData.tabs[0].id : "all";
  const activeTabLabel = hasTabs
    ? categoryData.tabs.find((tab) => tab.id === activeTabId)?.label ?? activeTabId
    : "추천";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [categoryId, activeTabId]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const categoryProducts = getCategoryServiceCards(curCategoryKey);
  const filteredProductsRaw = hasTabs
    ? categoryProducts.filter((product) => product.tabIds.includes(activeTabId))
    : categoryProducts;
  const filteredProducts =
    curCategoryKey === "palmistry" && activeTabId === "palm"
      ? filteredProductsRaw.filter((product) => product.id === "palm-billionaire")
      : filteredProductsRaw;
  const fallbackProducts = getFallbackServiceCards(curCategoryKey, 3);

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
      categoryId={curCategoryKey as "saju" | "astrology" | "love" | "palmistry"}
      title={categoryData.title}
      icon={categoryData.icon}
      themeColor={categoryData.themeColor}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <CategoryHero
            bannerConfig={categoryData.bannerConfig}
            themeColor={categoryData.themeColor}
            widgetType={categoryData.widgetType}
          />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[18px] font-bold text-gray-900">
                {hasTabs ? `${activeTabLabel} 추천 서비스` : "추천 서비스"}
              </h3>
              <span className="text-[13px] text-text-muted font-medium">총 {filteredProducts.length}개</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${curCategoryKey}-${activeTabId}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {curCategoryKey === "saju" && activeTabId === "new-year" ? (
                  <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <h4 className="text-lg font-bold text-gray-900">2026 정밀 분석 추천</h4>
                    </div>
                    <FortuneSpecialGrid />
                  </section>
                ) : curCategoryKey === "saju" && activeTabId === "today" ? (
                  <section className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                      <MoonStar className="w-5 h-5 text-amber-600" />
                      <h4 className="text-lg font-bold text-gray-900">오늘의 6가지 운세 분석</h4>
                    </div>
                    <DailyFortuneGrid
                      onCategorySelect={(selectedCategoryId) =>
                        navigate(`/fortune/personal?categoryId=${selectedCategoryId}`)
                      }
                    />
                    <div className="mt-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                      <p className="text-sm text-indigo-900 font-medium">
                        항목을 클릭하면 사주 기반 상세 조언을 바로 확인할 수 있습니다.
                      </p>
                    </div>
                  </section>
                ) : (
                  <>
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
                    {curCategoryKey === "palmistry" && activeTabId === "palm" && (
                      <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50/30 p-5">
                        <p className="text-[14px] font-bold text-gray-900">변화시기 심화 분석이 필요하신가요?</p>
                        <p className="mt-1 text-[13px] text-gray-600">
                          메인 리포트 내 변화시기 섹션으로 바로 이동해 추세 변화를 확인할 수 있습니다.
                        </p>
                        <Link
                          to="/service/palm-destiny-change"
                          className="mt-3 inline-flex rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          변화시기 심화 리포트 보기
                        </Link>
                      </div>
                    )}
                    {curCategoryKey === "saju" && activeTabId === "lifetime" && (
                      <div
                        onClick={handleMoveToNewYear}
                        className="mt-6 flex flex-col sm:flex-row items-center justify-between p-6 rounded-[24px] bg-indigo-50/50 border border-indigo-100 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all group"
                      >
                        <div>
                          <p className="text-[14px] font-bold text-gray-900 mb-1">
                            올해 재물운과 커리어 흐름도 확인해 보셨나요?
                          </p>
                          <p className="text-[13px] text-gray-600 font-medium">
                            2026년의 구체적인 실행 시점과 주의 구간을 빠르게 점검할 수 있습니다.
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center gap-2 text-[14px] font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors">
                          신년 운세 보러가기
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 p-8 rounded-[32px] bg-white border border-gray-100 text-center">
            <p className="text-sm text-text-muted mb-4 font-medium">찾으시는 서비스가 없나요?</p>
            <button className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-bold shadow-sm hover:translate-y-[-2px] transition-all">
              운세 매니저에게 제안하기
            </button>
          </div>
        </div>

        <CategorySidebar />
      </div>
    </AnalysisPageShell>
  );
}
