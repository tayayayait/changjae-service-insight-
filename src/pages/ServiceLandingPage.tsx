import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ServiceIntroScreen } from "@/components/common/ServiceIntroScreen";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";
import { getServiceLandingById, ServiceId } from "@/lib/serviceCatalog";
import { isPaidReport, getPaidReport } from "@/lib/paidReportCatalog";
import { useConsultStore } from "@/store/useConsultStore";

/**
 * /service/:serviceId 진입 시 표시되는 서비스 상세 랜딩 컨테이너
 * Category 페이지와 동일 카탈로그를 참조해 ID 불일치를 방지한다.
 *
 * 유료 리포트인 경우 "분석 시작하기" → 결제 모달 → 결제 완료 → 리포트 열람 흐름을 지원한다.
 */
export default function ServiceLandingPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setService = useConsultStore((state) => state.setService);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const selectedCategoryId = searchParams.get("categoryId");

  const data = serviceId ? getServiceLandingById(serviceId) : null;
  const paidReport = serviceId ? getPaidReport(serviceId) : null;
  const isPaid = serviceId ? isPaidReport(serviceId) : false;

  const launchState = useMemo(
    () =>
      data?.initialInterests?.length
        ? {
          initialInterests: data.initialInterests,
        }
        : undefined,
    [data?.initialInterests],
  );

  const launchService = useCallback(
    (options?: { replace?: boolean }) => {
      if (!data) {
        return;
      }

      const analysisServiceId = data.analysisServiceId ?? data.id;
      const nextPath =
        data.id === "saju-today-briefing" && selectedCategoryId
          ? `${data.nextPath}${data.nextPath.includes("?") ? "&" : "?"}categoryId=${encodeURIComponent(
              selectedCategoryId,
            )}`
          : data.nextPath;
      setService(data.serviceType, analysisServiceId);
      navigate(nextPath, {
        ...(options?.replace ? { replace: true } : {}),
        ...(launchState ? { state: launchState } : {}),
      });
    },
    [data, launchState, navigate, selectedCategoryId, setService],
  );

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.nextPath.startsWith("/palmistry?mode=main")) {
      launchService({ replace: true });
    }
  }, [data, launchService]);

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

  const handleStart = () => {
    // 모든 유료 서비스(사주, 신년운세, 점성학)도 선결제 없이 바로 분석 시작(입력 폼)으로 이동합니다.
    // 결제는 결과 페이지에서 잠금 해제 방식으로 진행됩니다.
    launchService();
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-[#F8F9FA]">
      <header className="absolute top-0 w-full z-10 flex h-16 items-center px-4 bg-transparent">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center p-2.5 text-gray-800 bg-white/50 backdrop-blur-md rounded-full shadow-sm transition-colors hover:bg-white"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 px-4 py-20 flex items-center justify-center">
        <ServiceIntroScreen
          serviceId={data.id as ServiceId}
          onStart={handleStart}
          ctaText="분석 시작하기"
        />
      </div>
    </div>
  );
}
