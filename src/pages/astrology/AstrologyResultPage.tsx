import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CircleDot, RefreshCcw } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { useAstrologyResultFlow } from "@/hooks/astrology/useAstrologyResultFlow";
import { AstrologyReportView } from "@/components/astrology/AstrologyReportView";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";
import { StickyActionBar } from "@/components/common/StickyActionBar";
import { PaywallLockIcon } from "@/components/common/PaywallLockIcon";
import { getPaidReport } from "@/lib/paidReportCatalog";
import { Button } from "@/components/ui/button";
import { MysticalLoading } from "@/components/common/MysticalLoading";

export default function AstrologyResultPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const { record, isLoading, error } = useAstrologyResultFlow(resultId);
  const paidConfig = getPaidReport("astro-natal");

  if (isLoading) {
    return (
      <AnalysisPageShell
        categoryId="astrology"
        title="인생 설계도 리포트"
        subtitle="별자리 지도를 불러오는 중입니다..."
        icon={CircleDot}
        headerBehavior="reading"
      >
        <MysticalLoading categoryId="astrology" title="인생 설계도를 그려가고 있습니다" />
      </AnalysisPageShell>
    );
  }

  if (error || !record) {
    return (
      <AnalysisPageShell
        categoryId="astrology"
        title="오류 발생"
        subtitle="결과를 불러오지 못했습니다."
        icon={CircleDot}
        headerBehavior="reading"
      >
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-6">
          <p className="max-w-xs text-center text-sm font-medium text-slate-500">
            {error || "리포트 데이터를 찾을 수 없습니다."}
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/astrology")} className="bg-[#24303F] text-white">
              다시 시도하기
            </Button>
            <Button variant="outline" asChild>
              <Link to="/my-reports">내 리포트 찾기</Link>
            </Button>
          </div>
        </div>
      </AnalysisPageShell>
    );
  }

  const isLocked = !record.isUnlocked;
  const amount = paidConfig?.price ?? 2900;

  const openCheckout = () => {
    if (!paidConfig) {
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <AnalysisPageShell
      categoryId="astrology"
      title="인생 설계도 리포트"
      subtitle={
        (record.inputSnapshot as { name?: string } | undefined)?.name
          ? `${(record.inputSnapshot as { name?: string }).name}님의 별자리 지도`
          : "당신의 인생 차트 해석"
      }
      icon={CircleDot}
      themeColor="accent-sky"
      headerBehavior="reading"
    >
      <div className="mx-auto w-full max-w-4xl">
        <AstrologyReportView
          record={record}
          isLocked={isLocked}
          onUnlockRequest={openCheckout}
          onReset={() => navigate("/astrology")}
        />

        <PaymentCheckoutSheet
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={async ({ reportId, buyerInfo }) => {
            navigate(`/astrology/purchased/${reportId}`, {
              state: {
                buyerName: buyerInfo.name,
                buyerPhone: buyerInfo.phone,
                buyerEmail: buyerInfo.email,
                inputSnapshot: record.inputSnapshot as Record<string, unknown>,
              },
            });
          }}
          serviceId="astro-natal"
          serviceType="astro"
          serviceName={paidConfig?.title ?? "인생 설계도"}
          amount={amount}
          inputSnapshot={record.inputSnapshot as Record<string, unknown>}
          previewPayload={record.reportPayload as unknown as Record<string, unknown>}
          reportPayload={record.reportPayload as unknown as Record<string, unknown>}
          assumePaid={false}
        />
      </div>

      {isLocked ? (
        <StickyActionBar
          primaryAction={{
            label: `전체 리포트 열기 · ${amount.toLocaleString()}원`,
            onClick: openCheckout,
            icon: <PaywallLockIcon className="h-5 w-5" />,
          }}
          secondaryAction={{
            label: "조건 다시 입력",
            onClick: () => navigate("/astrology"),
            icon: <RefreshCcw className="h-5 w-5" />,
          }}
        />
      ) : null}
    </AnalysisPageShell>
  );
}
