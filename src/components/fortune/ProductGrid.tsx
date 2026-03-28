import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { SajuServiceCard } from "@/components/common/SajuServiceCard";
import { trackEvent } from "@/lib/analytics";
import type { CategoryKey } from "@/lib/serviceCatalog";
import type { LucideIcon } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  to: string;
  badge: string;
  icon: LucideIcon;
  accentClassName: string;
  imageUrl?: string;
}

interface ProductGridProps {
  products: Product[];
  activeTabId: string;
  activeTabLabel: string;
  categoryId: CategoryKey;
  fallbackProducts?: Product[];
  onShowCoreServices?: () => void;
  onResetFilters?: () => void;
  onMoveToNewYear?: () => void;
}

const buttonClassName =
  "rounded-xl border px-3 py-2 text-xs font-bold transition-colors hover:bg-gray-50 border-gray-200 text-gray-700";

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  activeTabId,
  activeTabLabel,
  categoryId,
  fallbackProducts = [],
  onShowCoreServices,
  onResetFilters,
  onMoveToNewYear,
}) => {
  useEffect(() => {
    if (products.length > 0) {
      return;
    }
    void trackEvent("empty_state_view", {
      categoryId,
      tabId: activeTabId,
      tabLabel: activeTabLabel,
    });
  }, [products.length, categoryId, activeTabId, activeTabLabel]);

  const handleCtaClick = (ctaId: string, action?: () => void) => {
    void trackEvent("empty_cta_click", {
      categoryId,
      tabId: activeTabId,
      ctaId,
    });
    action?.();
  };

  const handleFallbackClick = (serviceId: string) => {
    void trackEvent("fallback_card_click", {
      categoryId,
      tabId: activeTabId,
      serviceId,
    });
  };

  if (products.length === 0) {
    return (
      <section className="space-y-6">
        <div className="rounded-[24px] border border-indigo-100 bg-indigo-50/40 p-6 sm:p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-[15px] font-bold text-gray-900">현재 {activeTabLabel} 필터에서는 표시할 서비스가 없습니다.</p>
          <p className="mt-2 text-[13px] font-medium text-gray-600">
            바로 볼 수 있는 핵심 서비스로 이동하거나 필터를 초기화해 추천을 다시 확인하세요.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              className={buttonClassName}
              onClick={() => handleCtaClick("show_core_services", onShowCoreServices)}
            >
              핵심 서비스 보기
            </button>
            <button
              type="button"
              className={buttonClassName}
              onClick={() => handleCtaClick("reset_filters", onResetFilters)}
            >
              필터 초기화
            </button>
            {onMoveToNewYear && (
              <button
                type="button"
                className={buttonClassName}
                onClick={() => handleCtaClick("move_to_new_year", onMoveToNewYear)}
              >
                신년 탭 이동
              </button>
            )}
          </div>
        </div>

        {fallbackProducts.length > 0 && (
          <div className="space-y-3">
            <p className="px-1 text-[14px] font-bold text-gray-900">대체 추천 서비스</p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {fallbackProducts.map((product) => (
                <SajuServiceCard
                  key={`fallback-${product.id}`}
                  title={product.title}
                  description={product.description}
                  to={product.to}
                  badge={product.badge}
                  icon={product.icon}
                  accentClassName={product.accentClassName}
                  imageUrl={product.imageUrl}
                  onClick={() => handleFallbackClick(product.id)}
                />
              ))}
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <div
      key={activeTabId}
      className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {products.map((product) => (
        <div key={product.id} className="h-full">
          <SajuServiceCard
            title={product.title}
            description={product.description}
            to={product.to}
            badge={product.badge}
            icon={product.icon}
            accentClassName={product.accentClassName}
            imageUrl={product.imageUrl}
          />
        </div>
      ))}
    </div>
  );
};
