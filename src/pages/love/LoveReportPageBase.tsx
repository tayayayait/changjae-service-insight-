import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Loader2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { LoveInputStepper } from "@/components/love/LoveInputStepper";
import { StoryHeroCard } from "@/components/love/StoryHeroCard";
import { LockedChapterCard } from "@/components/love/LockedChapterCard";
import { UpgradeDrawer } from "@/components/love/UpgradeDrawer";
import { RepeatUsePromptCard } from "@/components/love/RepeatUsePromptCard";
import { ReportDataSourceAlert } from "@/components/love/ReportDataSourceAlert";
import {
  CoupleReportView,
  FuturePartnerReportView,
  ReunionReportView,
} from "@/components/love/LoveReportViews";
import { ServiceIntroScreen } from "@/components/common/ServiceIntroScreen";
import { ErrorCard } from "@/components/common/ErrorCard";
import { StickyCTA } from "@/components/common/StickyCTA";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ServiceId, getServiceLandingById } from "@/lib/serviceCatalog";
import { PAID_REPORT_PRICE_KRW } from "@/lib/paidReportCatalog";
import {
  getV3FullFromRecord,
  getV3PreviewFromRecord,
  inferLoveReportVersion,
  isLegacyLovePreview,
} from "@/lib/loveReportAdapters";
import { LoveServiceType } from "@/types/love";
import { useAuthStore } from "@/store/useAuthStore";
import { useLoveReportFlow } from "@/hooks/love/useLoveReportFlow";
import { useLoveReportActions } from "@/hooks/love/useLoveReportActions";
import { MysticalLoading } from "@/components/common/MysticalLoading";

const PRICE_BY_SERVICE: Record<LoveServiceType, number> = {
  "future-partner": PAID_REPORT_PRICE_KRW,
  "couple-report": PAID_REPORT_PRICE_KRW,
  "crush-reunion": PAID_REPORT_PRICE_KRW,
};

const PRODUCT_CODE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "LOVE_FUTURE_PARTNER_V3",
  "couple-report": "LOVE_COUPLE_REPORT_V3",
  "crush-reunion": "LOVE_CRUSH_REUNION_V3",
};

const PAYMENT_SERVICE_ID_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "love-future-partner",
  "couple-report": "love-couple-report",
  "crush-reunion": "love-crush-reunion",
};

const TITLE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "미래 배우자 리포트",
  "couple-report": "커플 궁합 리포트",
  "crush-reunion": "재회 가능성 리포트",
};

const SUBTITLE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "미래 인연 유입 경로와 배우자 필터링 기준을 실행형으로 제시합니다.",
  "couple-report": "관계 갈등 트리거와 회복 프로토콜을 운영형으로 제시합니다.",
  "crush-reunion": "재접촉 가능 창과 중단 기준을 손실 최소화 관점에서 제시합니다.",
};

const PATH_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "/love/future-partner",
  "couple-report": "/love/couple-report",
  "crush-reunion": "/love/crush-reunion",
};

const toWon = (value: number) => `${value.toLocaleString()}원`;

interface LoveReportPageBaseProps {
  serviceType?: LoveServiceType;
  reportId?: string;
}

export function LoveReportPageBase({ serviceType, reportId }: LoveReportPageBaseProps) {
  const profile = useAuthStore((state) => state.profile);
  const { record, setRecord, isLoadingSaved, error, setError, prefilled } = useLoveReportFlow({
    profile,
    reportId,
    serviceType,
  });

  const resolvedServiceType = serviceType ?? record?.serviceType;
  const detailMode = Boolean(reportId);
  const reportPath = resolvedServiceType ? PATH_BY_SERVICE[resolvedServiceType] : "/love/future-partner";
  const price = resolvedServiceType ? PRICE_BY_SERVICE[resolvedServiceType] : PAID_REPORT_PRICE_KRW;
  const productCode = resolvedServiceType ? PRODUCT_CODE_BY_SERVICE[resolvedServiceType] : "";
  const shellTitle = resolvedServiceType ? TITLE_BY_SERVICE[resolvedServiceType] : "연애 상담 리포트";
  const shellSubtitle = resolvedServiceType
    ? SUBTITLE_BY_SERVICE[resolvedServiceType]
    : "관계 흐름을 분석하고 실행 가능한 상담 가이드라인을 제시합니다.";

  const {
    isSubmitting,
    isUnlocking,
    upgradeOpen,
    showIntro,
    setUpgradeOpen,
    setShowIntro,
    runAnalysis,
    unlock,
  } = useLoveReportActions({
    serviceType,
    resolvedServiceType,
    record,
    setRecord,
    setError,
    price,
    productCode,
  });

  const version = record ? inferLoveReportVersion(record) : "v3-differentiated";
  const canRenderRecord = Boolean(record && resolvedServiceType);
  const ctaCopy = resolvedServiceType
    ? `전체 리포트 열기 · ${toWon(price)}`
    : "전체 리포트 열기";

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const paymentServiceId = resolvedServiceType
    ? PAYMENT_SERVICE_ID_BY_SERVICE[resolvedServiceType]
    : null;

  const handleOpenCheckout = async () => {
    if (!record || !resolvedServiceType || !paymentServiceId) {
      return;
    }
    setIsCheckoutOpen(true);
  };
  const content = useMemo(() => {
    if (isSubmitting) {
      return (
        <div className="flex min-h-[500px] flex-col items-center justify-center py-12">
          <MysticalLoading categoryId="love" title="두 분의 우주적 궁합을 분석하고 있습니다" />
        </div>
      );
    }

    if (isLoadingSaved) {
      return (
        <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-text-secondary" />
          <p className="mt-3 text-[14px] text-text-secondary">저장된 연애 리포트를 불러오는 중입니다.</p>
        </Card>
      );
    }

    if (!canRenderRecord) {
      if (detailMode) {
        return (
          <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
            <p className="text-[15px] font-semibold text-foreground">저장된 연애 리포트를 찾을 수 없습니다.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              삭제되었거나 현재 세션에서 접근할 수 없는 상태입니다.
            </p>
            <Button asChild className="mt-5 bg-[#24303F] text-white">
              <Link to="/mypage">리포트 다시보기</Link>
            </Button>
          </Card>
        );
      }

      if (showIntro && resolvedServiceType) {
        const serviceId = `love-${resolvedServiceType}` as ServiceId;
        const landingData = getServiceLandingById(serviceId);
        if (landingData) {
          return <ServiceIntroScreen serviceId={serviceId} onStart={() => setShowIntro(false)} />;
        }
      }

      return (
        <LoveInputStepper
          serviceType={serviceType ?? "couple-report"}
          initialSubjectA={prefilled}
          isSubmitting={isSubmitting}
          onSubmit={(payload) =>
            runAnalysis({
              ...payload,
              context: payload.context as Record<string, unknown>,
            })
          }
        />
      );
    }

    if (version === "v1-story" || isLegacyLovePreview(record.preview)) {
      const legacyPreview = record.preview;
      const openSummary =
        "openChapter" in legacyPreview ? legacyPreview.openChapter.content : legacyPreview.summary;

      return (
        <div className="space-y-5 pb-28">
          <StoryHeroCard
            serviceType={resolvedServiceType}
            headline={legacyPreview.headline}
            summary={legacyPreview.summary}
          />
          <ReportDataSourceAlert dataSource={record.dataSource ?? "real"} />
          <Card className="rounded-2xl border border-border bg-white p-5">
            <p className="text-[14px] leading-relaxed text-text-secondary">{openSummary}</p>
          </Card>
          {"lockedChapters" in legacyPreview ? (
            <section className="grid gap-3 md:grid-cols-2">
              {legacyPreview.lockedChapters.map((chapter) => (
                <LockedChapterCard key={chapter.key} chapter={chapter} masked />
              ))}
            </section>
          ) : null}
          <RepeatUsePromptCard
            nextRefreshAt={record.nextRefreshAt}
            onReanalyze={detailMode ? undefined : () => setRecord(null)}
          />
        </div>
      );
    }

    const previewV3 = getV3PreviewFromRecord(record);
    if (!previewV3) {
      return (
        <Card className="rounded-[28px] border border-border bg-white p-8 text-center">
          <p className="text-[15px] font-semibold text-foreground">리포트 형식을 해석할 수 없습니다.</p>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
            이전 버전 데이터일 수 있습니다. 같은 조건으로 다시 분석해 주세요.
          </p>
          {!detailMode ? (
            <Button className="mt-5 bg-[#24303F] text-white" onClick={() => setRecord(null)}>
              다시 분석하기
            </Button>
          ) : null}
        </Card>
      );
    }

    const fullV3 = record.isUnlocked ? getV3FullFromRecord(record, previewV3) : undefined;
    const commonTail = (
      <>
        <RepeatUsePromptCard
          nextRefreshAt={record.nextRefreshAt}
          onReanalyze={detailMode ? undefined : () => setRecord(null)}
        />
        {detailMode ? (
          <Button asChild variant="outline" className="h-12 w-full">
            <Link to={reportPath}>같은 상담 다시 시작</Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="h-12 w-full"
            onClick={() => {
              setRecord(null);
              setError(null);
            }}
          >
            다른 조건으로 다시 분석
          </Button>
        )}
      </>
    );

    let reportView: JSX.Element;
    if (previewV3.serviceType === "future-partner") {
      reportView = (
        <FuturePartnerReportView
          preview={previewV3}
          fullReport={fullV3?.serviceType === "future-partner" ? fullV3 : undefined}
          isUnlocked={record.isUnlocked}
        />
      );
    } else if (previewV3.serviceType === "couple-report") {
      reportView = (
        <CoupleReportView
          preview={previewV3}
          fullReport={fullV3?.serviceType === "couple-report" ? fullV3 : undefined}
          isUnlocked={record.isUnlocked}
        />
      );
    } else {
      reportView = (
        <ReunionReportView
          preview={previewV3}
          fullReport={fullV3?.serviceType === "crush-reunion" ? fullV3 : undefined}
          isUnlocked={record.isUnlocked}
        />
      );
    }

    return (
      <div className="space-y-5 pb-28">
        <ReportDataSourceAlert dataSource={record.dataSource ?? "real"} />
        {reportView}
        {commonTail}
      </div>
    );
  }, [
    canRenderRecord,
    detailMode,
    isLoadingSaved,
    isSubmitting,
    prefilled,
    record,
    reportPath,
    resolvedServiceType,
    serviceType,
    setError,
    setRecord,
    showIntro,
    runAnalysis,
    setShowIntro,
    version,
  ]);

  return (
    <AnalysisPageShell
      categoryId="love"
      title={shellTitle}
      subtitle={shellSubtitle}
      icon={HeartHandshake}
      themeColor="accent-pink"
    >
      {content}

      {canRenderRecord && !record?.isUnlocked ? (
        <StickyCTA>
          <Button
            className="h-12 w-full bg-[#24303F] text-white"
            onClick={() => setUpgradeOpen(true)}
            disabled={isUnlocking}
          >
            {isUnlocking ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                잠금 해제 중...
              </span>
            ) : (
              ctaCopy
            )}
          </Button>
        </StickyCTA>
      ) : null}

      <UpgradeDrawer
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="상담 전체 리포트 잠금해제"
        priceText={toWon(price)}
        loading={isUnlocking}
        onUnlock={handleOpenCheckout}
      />

      {record && resolvedServiceType && paymentServiceId ? (
        <PaymentCheckoutSheet
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onSuccess={async ({ orderNumber }) => {
            await unlock({
              provider: "portone",
              providerOrderId: orderNumber,
            });
          }}
          serviceId={paymentServiceId}
          serviceType="love"
          serviceName={TITLE_BY_SERVICE[resolvedServiceType]}
          amount={price}
          inputSnapshot={record.inputSnapshot as unknown as Record<string, unknown>}
          previewPayload={record.preview as unknown as Record<string, unknown>}
          reportPayload={record.fullReport as unknown as Record<string, unknown>}
          assumePaid={false}
        />
      ) : null}

      {error ? <ErrorCard message={error} onRetry={() => setError(null)} /> : null}
    </AnalysisPageShell>
  );
}
