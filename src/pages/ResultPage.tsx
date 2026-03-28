import { useNavigate, useParams } from "react-router-dom";
import { FileText, RefreshCcw, Share2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { OhengDonutChart } from "@/components/charts/OhengDonutChart";
import { PaljaChart } from "@/components/charts/PaljaChart";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { InsightCard } from "@/components/common/InsightCard";
import { PaywallLockIcon } from "@/components/common/PaywallLockIcon";
import { ReportSectionCard } from "@/components/common/ReportSectionCard";
import { MysticalLoading } from "@/components/common/MysticalLoading";
import { StickyActionBar } from "@/components/common/StickyActionBar";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import { LockedSectionOverlay } from "@/components/common/LockedSectionOverlay";
import { PaymentCheckoutSheet } from "@/components/common/PaymentCheckoutSheet";
import { useResultPageFlow } from "@/hooks/saju/useResultPageFlow";

const CALENDAR_LABEL: Record<string, string> = {
  solar: "양력",
  lunar: "음력",
  "lunar-leap": "음력 윤달",
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();
  const {
    result,
    isLoading,
    error,
    loadLatestResult,
    loadResultById,
    legendItems,
    dominantElement,
    interestTags,
    isLifetimeReport,
    isMultiReportMode,
    getTabServiceIds,
    handleUnlockRequest,
    checkoutConfig,
    closeCheckout,
    handleCheckoutSuccess,
    handleShare,
  } = useResultPageFlow(resultId);

  if (isLoading) {
    return (
      <AnalysisPageShell
        categoryId="saju"
        title="사주 리포트"
        subtitle="리포트를 생성하고 있습니다"
        icon={FileText}
        headerBehavior="reading"
      >
        <MysticalLoading categoryId="saju" />
      </AnalysisPageShell>
    );
  }

  if (error) {
    return (
      <AnalysisPageShell
        categoryId="saju"
        title="오류 발생"
        subtitle="결과를 불러오지 못했습니다"
        icon={FileText}
        headerBehavior="reading"
      >
        <ErrorCard
          message={error}
          onRetry={() => (resultId ? void loadResultById(resultId) : void loadLatestResult())}
        />
      </AnalysisPageShell>
    );
  }

  if (!result) {
    return (
      <AnalysisPageShell
        categoryId="saju"
        title="결과 없음"
        subtitle="사주 데이터가 존재하지 않습니다"
        icon={FileText}
        headerBehavior="reading"
      >
        <EmptyState
          title="분석 결과가 없습니다"
          description="사주 입력을 먼저 완료하고 결과를 확인해 주세요."
          actionLabel="사주 시작"
          actionTo="/saju"
        />
      </AnalysisPageShell>
    );
  }

  const hasLifetimeScore = typeof result.lifetimeScore === "number";
  const hasDaeunPeriods = Boolean(result.daeunPeriods?.length);
  const hasGoldenPeriods = Boolean(result.goldenPeriods?.length);
  const showLifetimeBlocks =
    isLifetimeReport && (hasLifetimeScore || hasDaeunPeriods || hasGoldenPeriods);

  const isLocked = result.isLocked;
  const firstSection = result.sections[0];
  const otherSections = result.sections.slice(1);
  const unlockServiceId =
    getTabServiceIds()[0] ?? result.sourceServiceId ?? result.consultationType ?? "traditional-saju";

  return (
    <AnalysisPageShell
      categoryId="saju"
      title={isLifetimeReport ? "인생 총운 리포트" : "오늘의 사주 리포트"}
      subtitle={`${result.profileData.year}년 ${result.profileData.month}월 ${result.profileData.day}일 (${CALENDAR_LABEL[result.profileData.calendarType] ?? result.profileData.calendarType})`}
      icon={FileText}
      themeColor="accent-gold"
      headerBehavior="reading"
      layoutWidth="wide"
    >
      <div className="relative grid grid-cols-1 gap-8 pb-24">
        {isMultiReportMode ? (
          <SajuCollectionTabs
            result={result}
            serviceIds={getTabServiceIds()}
            onUnlockRequest={handleUnlockRequest}
            isLocked={Boolean(isLocked)}
          />
        ) : (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-[#24303F]">상세 해석</h2>
              {interestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#EAF1F7] px-3 py-1 text-[12px] font-bold text-[#24303F]"
                >
                  {tag}
                </span>
              ))}
              </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {firstSection && (
                <ReportSectionCard
                  title={firstSection.title}
                  interpretation={
                    isLocked
                      ? firstSection.interpretation.split(/[.!?]\s/).slice(0, 2).join(". ") + "..."
                      : firstSection.interpretation
                  }
                  advice={isLocked ? undefined : firstSection.advice}
                  luckyTip={isLocked ? undefined : firstSection.luckyTip}
                  defaultExpanded
                />
              )}

              {otherSections.map((section, index) => (
                <LockedSectionOverlay
                  key={`${section.title}-${index + 1}`}
                  locked={Boolean(isLocked)}
                  label={unlockServiceId === "saju-today-briefing" ? "전체 보기" : "결제 후 전체 보기"}
                  onClick={() => handleUnlockRequest(unlockServiceId)}
                >
                  <ReportSectionCard
                    title={section.title}
                    interpretation={section.interpretation}
                    advice={section.advice}
                    luckyTip={section.luckyTip}
                    defaultExpanded
                  />
                </LockedSectionOverlay>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#24303F]">
            {isLifetimeReport ? "인생 단계별 분석" : "오행 구조 분석"}
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InsightCard
              title="사주 원국"
              className="h-full"
              content={
                <LockedSectionOverlay
                  locked={Boolean(isLocked)}
                  label="결제 후 열람"
                  onClick={() => handleUnlockRequest(unlockServiceId)}
                >
                  <div className="mt-2 space-y-3">
                    <PaljaChart palja={result.palja} />
                    {result.profileData.birthPrecision !== "exact" ? (
                      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-700">
                        출생 시간이 정확하지 않아 참고용으로 표시됩니다.
                      </p>
                    ) : null}
                  </div>
                </LockedSectionOverlay>
              }
            />

            <InsightCard
              title="오행 분포"
              className="h-full"
              content={
                <LockedSectionOverlay
                  locked={Boolean(isLocked)}
                  label="결제 후 열람"
                  onClick={() => handleUnlockRequest(unlockServiceId)}
                >
                  <div className="mt-2 space-y-5">
                    <div className="flex justify-center">
                      <OhengDonutChart data={result.oheng} />
                    </div>
                    <ChartLegend items={legendItems} />
                    <p className="text-center text-[13.5px] font-medium text-slate-600">
                      가장 강한 기운은 {dominantElement} 입니다.
                    </p>
                  </div>
                </LockedSectionOverlay>
              }
            />
          </div>
        </section>

        {showLifetimeBlocks ? (
          <section className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-[#24303F]">인생 총점</h2>
            {hasLifetimeScore ? (
              <div className="rounded-3xl border border-[#24303F]/10 bg-white p-6">
                <p className="text-4xl font-black text-[#24303F]">{result.lifetimeScore}점</p>
                <LockedSectionOverlay
                  locked={Boolean(isLocked)}
                  label="결제 후 열람"
                  onClick={() => handleUnlockRequest(unlockServiceId)}
                >
                  <p className="mt-2 text-sm text-slate-600">
                    타고난 흐름과 오행 균형을 종합한 점수입니다.
                  </p>
                </LockedSectionOverlay>
              </div>
            ) : null}

            {hasDaeunPeriods ? (
              <div className="grid gap-3 md:grid-cols-2">
                {result.daeunPeriods?.map((period) => (
                  <article
                    key={`${period.startYear}-${period.endYear}`}
                    className="rounded-2xl border border-[#24303F]/10 bg-[#FAF7F2] p-4"
                  >
                    <p className="text-[13px] font-semibold text-slate-600">
                      {period.startYear}년 ~ {period.endYear}년
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#24303F]">
                      {period.startAge}~{period.endAge}세
                    </p>
                    <LockedSectionOverlay
                      locked={Boolean(isLocked)}
                      label="결제 후 열람"
                      onClick={() => handleUnlockRequest(unlockServiceId)}
                    >
                      <p className="mt-2 text-sm text-slate-700">{period.keyword}</p>
                    </LockedSectionOverlay>
                  </article>
                ))}
              </div>
            ) : null}

            {hasGoldenPeriods ? (
              <div className="rounded-3xl border border-[#24303F]/10 bg-white p-6">
                <h3 className="text-lg font-bold text-[#24303F]">황금 구간</h3>
                <LockedSectionOverlay
                  locked={Boolean(isLocked)}
                  label="결제 후 열람"
                  onClick={() => handleUnlockRequest(unlockServiceId)}
                >
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {result.goldenPeriods?.map((period) => (
                      <li
                        key={`${period.startYear}-${period.endYear}`}
                        className="rounded-xl border border-[#24303F]/10 p-3"
                      >
                        <p>
                          {period.startYear}년 ~ {period.endYear}년 · {period.startAge}~{period.endAge}세
                        </p>
                        <p className="font-semibold text-[#24303F]">{period.reason}</p>
                      </li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <StickyActionBar
        primaryAction={{
          label: isLocked
            ? unlockServiceId === "saju-today-briefing"
              ? "전체 리포트 열기"
              : "전체 리포트 열기 · 2,900원"
            : "저장 및 공유",
          onClick: isLocked
            ? () => void handleUnlockRequest(unlockServiceId)
            : () => void handleShare(),
          icon: isLocked ? <PaywallLockIcon className="h-5 w-5" /> : <Share2 className="h-5 w-5" />,
        }}
        secondaryAction={{
          label: "조건 다시 입력",
          onClick: () => navigate("/saju"),
          icon: <RefreshCcw className="h-5 w-5" />,
        }}
      />

      {checkoutConfig ? (
        <PaymentCheckoutSheet
          isOpen={Boolean(checkoutConfig)}
          onClose={closeCheckout}
          onSuccess={handleCheckoutSuccess}
          serviceId={checkoutConfig.serviceId}
          serviceType={checkoutConfig.serviceType}
          serviceName={checkoutConfig.serviceName}
          amount={checkoutConfig.amount}
          inputSnapshot={checkoutConfig.inputSnapshot}
          reportPayload={checkoutConfig.reportPayload}
          previewPayload={checkoutConfig.previewPayload}
          assumePaid={false}
        />
      ) : null}
    </AnalysisPageShell>
  );
}

