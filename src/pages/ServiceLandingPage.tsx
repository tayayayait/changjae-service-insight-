import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductLandingPage } from "@/components/layout/ProductLandingPage";
import { getServiceLandingById } from "@/lib/serviceCatalog";
import { useConsultStore } from "@/store/useConsultStore";

/**
 * /service/:serviceId 진입 시 표시되는 서비스 상세 랜딩 컨테이너
 * Category 페이지와 동일 카탈로그를 참조해 ID 불일치를 방지한다.
 */
export default function ServiceLandingPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const setService = useConsultStore((state) => state.setService);

  const data = serviceId ? getServiceLandingById(serviceId) : null;

  useEffect(() => {
    if (!data || data.id !== "palm-destiny-change") {
      return;
    }
    const analysisServiceId = data.analysisServiceId ?? data.id;
    setService(data.serviceType, analysisServiceId);
    navigate(data.nextPath, { replace: true });
  }, [data, navigate, setService]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6] px-5">
        <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-[18px] font-bold text-gray-900">해당 서비스를 찾을 수 없습니다.</p>
          <p className="mt-2 text-sm font-medium text-gray-600">
            최신 추천 서비스 목록에서 다시 선택해 주세요.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              to="/category/saju?tab=lifetime"
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white"
            >
              인생 총운 추천 서비스 보기
            </Link>
            <Link to="/category/saju" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">
              카테고리 홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (data.id === "palm-destiny-change") {
    return null;
  }

  const handleStart = () => {
    const analysisServiceId = data.analysisServiceId ?? data.id;
    setService(data.serviceType, analysisServiceId);
    navigate(data.nextPath);
  };

  return (
    <ProductLandingPage
      title={data.title}
      description={data.description}
      badge={data.badge}
      provider={data.provider}
      rating={data.rating}
      reviewCount={data.reviewCount}
      priceText={data.priceText}
      previewFeatures={data.previewFeatures}
      onStart={handleStart}
    />
  );
}
