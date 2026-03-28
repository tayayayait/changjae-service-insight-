import { useNavigate } from "react-router-dom";
import { ChevronLeft, Sparkles, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ServicePreviewCard } from "@/components/fortune/ServicePreviewCard";
import { StickyActionBar } from "@/components/common/StickyActionBar";

interface ProductLandingPageProps {
  title: string;
  description: string;
  badge: string;
  provider: string; // e.g. "AI 창재"
  priceText?: string;
  heroImageUrl?: string;
  previewFeatures?: { title: string; description: string }[];
  onStart: () => void;
}

/**
 * 헬로우봇의 "상품 상세페이지" 형태를 모방한 범용 랜딩 레이아웃
 * 카테고리 페이지의 카드를 누르면 나오는 화면으로, 하단에 CTA 버튼이 고정되어 있습니다.
 */
export function ProductLandingPage({
  title,
  description,
  badge,
  provider,
  priceText = "무료",
  heroImageUrl,
  previewFeatures,
  onStart
}: ProductLandingPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white relative pb-24">
      {/* 투명 헤더 (뒤로 가기) */}
      <header className="absolute top-0 w-full z-10 flex h-14 items-center px-4 bg-transparent">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2 -ml-2 text-gray-800 bg-white/50 backdrop-blur-md rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </header>

      {/* 썸네일 / 히어로 섹션 */}
      <div className="w-full h-72 md:h-96 bg-[#F3F4F6] relative overflow-hidden flex items-center justify-center">
        {heroImageUrl ? (
          <img src={heroImageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-indigo-500" />
          </div>
        )}
      </div>

      {/* 상품 정보 영역 */}
      <main className="px-5 py-6 flex-1 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
            {badge}
          </span>
          <span className="text-xs font-medium text-gray-500">{provider}</span>
        </div>

        <h1 className="text-2xl font-bold leading-tight text-gray-900 mb-4">
          {title}
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed">
            {description}
          </p>
          {/* 추가 상세 정보, 샘플 결과 리포트 등이 이곳에 길게 들어갑니다. */}
          {previewFeatures && previewFeatures.length > 0 && (
            <div className="mt-10 mb-8">
              <ServicePreviewCard features={previewFeatures} />
            </div>
          )}
        </div>
      </main>

      {/* 하단 고정 CTA 버튼 영역 */}
      <StickyActionBar
        primaryAction={{ label: `${priceText} · 시작하기`, onClick: onStart }}
      />
    </div>
  );
}
