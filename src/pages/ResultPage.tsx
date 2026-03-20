import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Copy, Download, FileText, RefreshCcw, Share2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { Button } from "@/components/ui/button";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { DaeunTimeline } from "@/components/charts/DaeunTimeline";
import { GoldenPeriodBadge } from "@/components/charts/GoldenPeriodBadge";
import { OhengDonutChart } from "@/components/charts/OhengDonutChart";
import { PaljaChart } from "@/components/charts/PaljaChart";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorCard } from "@/components/common/ErrorCard";
import { InsightCard } from "@/components/common/InsightCard";
import { ReportSectionCard } from "@/components/common/ReportSectionCard";
import { SkeletonCard } from "@/components/common/SkeletonCard";
import { StickyActionBar } from "@/components/common/StickyActionBar";
import { toast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { copyResultUrl, downloadShareCard, tryNativeShare } from "@/lib/share";
import { cn } from "@/lib/utils";
import { useResultStore } from "@/store/useResultStore";
import { SajuAnalysisServiceId, SajuReportPayloadMap, ShareCardVariant, UserInterest } from "@/types/result";

const CALENDAR_LABEL: Record<string, string> = {
  solar: "양력",
  lunar: "음력",
  "lunar-leap": "음력 윤달",
};

const INTEREST_LABELS: Record<UserInterest, string> = {
  career: "직장/커리어",
  love: "연애/결혼",
  study: "학업",
  money: "재물",
  health: "건강",
  kids: "자녀/가족",
  path: "진로/적성",
  rel: "대인관계",
  realestate: "부동산",
  travel: "이사/여행",
  business: "사업",
  self: "자기계발",
  free: "자유질문",
};

const shorten = (value: string, limit = 72) => (value.length <= limit ? value : `${value.slice(0, limit)}...`);

type RendererOutput = {
  signatureTitle: string;
  signatureBody: string;
  sections: Array<{ title: string; items: string[] }>;
};

type ServiceRenderer<K extends SajuAnalysisServiceId> = (payload: SajuReportPayloadMap[K]) => RendererOutput;

type RendererRegistry = {
  [K in SajuAnalysisServiceId]: ServiceRenderer<K>;
};

const REPORT_RENDERER_REGISTRY: RendererRegistry = {
  "saju-lifetime-roadmap": (payload) => ({
    signatureTitle: "장기 흐름",
    signatureBody: payload.longTermFlow,
    sections: [
      { title: "중요 변곡", items: payload.pivotMoments },
      { title: "10년 전략", items: payload.tenYearStrategy },
      { title: "지금 액션", items: payload.actionNow },
    ],
  }),
  "saju-daeun-shift": (payload) => ({
    signatureTitle: "전환 감지",
    signatureBody: payload.transitionSignal,
    sections: [
      { title: "90일 액션", items: payload.ninetyDayActions },
      { title: "회피 시나리오", items: payload.avoidanceScenario },
      { title: "근거", items: payload.evidence },
    ],
  }),
  "saju-career-timing": (payload) => ({
    signatureTitle: "커리어 타이밍",
    signatureBody: payload.careerWindow,
    sections: [
      { title: "의사결정 트리", items: payload.decisionTree },
      { title: "실행 체크리스트", items: payload.executionChecklist },
      { title: "중요 인사이트", items: payload.coreInsights },
    ],
  }),
  "saju-wealth-flow": (payload) => ({
    signatureTitle: "재물 흐름 맵",
    signatureBody: payload.cashflowMap,
    sections: [
      { title: "리스크 구간", items: payload.riskZones },
      { title: "자산 운영 규칙", items: payload.assetRules },
      { title: "즉시 액션", items: payload.actionNow },
    ],
  }),
  "saju-helper-network": (payload) => ({
    signatureTitle: "귀인 지도",
    signatureBody: payload.helperMap,
    sections: [
      { title: "갈등 패턴", items: payload.conflictPatterns },
      { title: "관계 운영 가이드", items: payload.networkGuide },
      { title: "증거 사인", items: payload.evidence },
    ],
  }),
  "saju-energy-balance": (payload) => ({
    signatureTitle: "에너지 곡선",
    signatureBody: payload.energyCurve,
    sections: [
      { title: "루틴 설계", items: payload.routineDesign },
      { title: "회복 프로토콜", items: payload.recoveryProtocol },
      { title: "중요 인사이트", items: payload.coreInsights },
    ],
  }),
  "saju-yearly-action-calendar": (payload) => ({
    signatureTitle: "분기 목표",
    signatureBody: payload.quarterlyGoals.join(" · "),
    sections: [
      { title: "월별 실행", items: payload.monthlyActions },
      { title: "리스크 캘린더", items: payload.riskCalendar },
      { title: "즉시 액션", items: payload.actionNow },
    ],
  }),
};

const isSupportedServiceType = (serviceType: string | undefined): serviceType is SajuAnalysisServiceId => {
  return Boolean(serviceType) && serviceType in REPORT_RENDERER_REGISTRY;
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { resultId } = useParams<{ resultId: string }>();
  const { currentResult: result, loadLatestResult, loadResultById, isLoading, error } = useResultStore();
  const [shareVariant, setShareVariant] = useState<ShareCardVariant>("summary");

  useEffect(() => {
    if (resultId) {
      void loadResultById(resultId);
      return;
    }
    void loadLatestResult();
  }, [resultId, loadLatestResult, loadResultById]);

  const legendItems = useMemo(() => {
    if (!result) {
      return [];
    }
    return result.oheng.map((item) => ({
      label: item.element,
      element: item.element,
      value: `${item.percentage}%`,
    }));
  }, [result]);

  const currentYear = new Date().getFullYear();
  const daeunData = useMemo(() => {
    if (!result?.daeunPeriods || result.daeunPeriods.length === 0) {
      return [];
    }
    return [...result.daeunPeriods]
      .sort((a, b) => a.startAge - b.startAge)
      .map((period) => ({
        ...period,
        isCurrent:
          typeof period.startYear === "number" && typeof period.endYear === "number"
            ? currentYear >= period.startYear && currentYear <= period.endYear
            : period.isCurrent,
      }));
  }, [currentYear, result]);

  const goldenPeriod = useMemo(() => {
    if (!result?.goldenPeriods?.length) {
      return null;
    }
    const byCurrentYear = result.goldenPeriods.find(
      (period) =>
        typeof period.startYear === "number" &&
        typeof period.endYear === "number" &&
        currentYear >= period.startYear &&
        currentYear <= period.endYear,
    );
    return byCurrentYear ?? result.goldenPeriods[0];
  }, [currentYear, result]);

  const goldenPeriodStatus = useMemo<"past" | "current" | "future" | "age">(() => {
    if (!goldenPeriod || typeof goldenPeriod.startYear !== "number" || typeof goldenPeriod.endYear !== "number") {
      return "age";
    }
    if (currentYear < goldenPeriod.startYear) {
      return "future";
    }
    if (currentYear > goldenPeriod.endYear) {
      return "past";
    }
    return "current";
  }, [currentYear, goldenPeriod]);

  const dominantElement = useMemo(() => {
    if (!result) {
      return "-";
    }
    const sorted = [...result.oheng].sort((a, b) => b.percentage - a.percentage);
    return sorted[0]?.element ?? "-";
  }, [result]);

  const topSection = result?.sections[0];
  const secondSection = result?.sections[1];
  const thirdSection = result?.sections[2];

  const relationshipHint = shorten(secondSection?.interpretation ?? topSection?.interpretation ?? "관계는 속도보다 리듬 조정이 중요합니다.", 60);
  const workMoneyHint = shorten(thirdSection?.interpretation ?? topSection?.interpretation ?? "재물은 기초 기반 실행이 안정적입니다.", 60);
  const cautionHint = shorten(topSection?.advice ?? "확장보다 균형을 먼저 맞추세요.", 60);

  const interestTags = useMemo(() => {
    if (!result?.interests.length) {
      return [];
    }
    return result.interests.map((interest) => INTEREST_LABELS[interest] ?? interest);
  }, [result]);

  const serviceType = isSupportedServiceType(result?.consultationType) ? result.consultationType : null;
  const specializedReport = useMemo(() => {
    if (!result?.reportPayload || !serviceType) {
      return null;
    }
    const renderer = REPORT_RENDERER_REGISTRY[serviceType];
    return renderer(result.reportPayload as never);
  }, [result?.reportPayload, serviceType]);

  const isLifetimeReport = result?.consultationType === "saju-lifetime-roadmap";
  const lifetimeScore =
    isLifetimeReport && typeof result?.lifetimeScore === "number" ? Math.round(result.lifetimeScore) : null;

  const handleShare = async () => {
    if (!result) {
      return;
    }
    try {
      trackEvent("share_clicked", { variant: shareVariant, resultId: result.id });
      const nativeShared = await tryNativeShare(result, shareVariant);
      if (!nativeShared) {
        const url = await copyResultUrl(result.id);
        toast({ title: "링크 복사 완료", description: url });
      }
    } catch (shareError) {
      const message = shareError instanceof Error ? shareError.message : "공유에 실패했습니다.";
      toast({ title: "공유 실패", description: message, variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    if (!result) {
      return;
    }
    try {
      const url = await copyResultUrl(result.id);
      toast({ title: "링크 복사 완료", description: url });
    } catch {
      toast({ title: "복사 실패", description: "링크를 복사할 수 없습니다.", variant: "destructive" });
    }
  };

  const handleDownload = async () => {
    if (!result) {
      return;
    }
    try {
      trackEvent("save_clicked", { variant: shareVariant, resultId: result.id });
      await downloadShareCard(result, shareVariant);
      toast({ title: "저장 완료", description: "공유 카드가 이미지로 저장되었습니다." });
    } catch (downloadError) {
      const message = downloadError instanceof Error ? downloadError.message : "저장에 실패했습니다.";
      toast({ title: "저장 실패", description: message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AnalysisPageShell categoryId="saju" title="사주 리포트" subtitle="데이터를 불러오는 중입니다..." icon={FileText} headerBehavior="reading">
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={5} />
          <SkeletonCard lines={6} />
        </div>
      </AnalysisPageShell>
    );
  }

  if (error) {
    return (
      <AnalysisPageShell categoryId="saju" title="오류 발생" subtitle="결과를 불러오지 못했습니다" icon={FileText} headerBehavior="reading">
        <ErrorCard message={error} onRetry={() => (resultId ? void loadResultById(resultId) : void loadLatestResult())} />
      </AnalysisPageShell>
    );
  }

  if (!result) {
    return (
      <AnalysisPageShell categoryId="saju" title="결과 없음" subtitle="사주 데이터가 존재하지 않습니다" icon={FileText} headerBehavior="reading">
        <EmptyState
          title="분석 결과가 없습니다"
          description="사주 입력을 먼저 완료한 뒤 결과를 확인해 주세요."
          actionLabel="사주 시작"
          actionTo="/saju"
        />
      </AnalysisPageShell>
    );
  }

  return (
    <AnalysisPageShell
      categoryId="saju"
      title={isLifetimeReport ? "인생 총운 리포트" : "내 사주 리포트"}
      subtitle={`${result.profileData.year}년 ${result.profileData.month}월 ${result.profileData.day}일 (${CALENDAR_LABEL[result.profileData.calendarType] ?? result.profileData.calendarType})`}
      icon={FileText}
      themeColor="accent-gold"
      headerBehavior="reading"
      layoutWidth="wide"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative pb-24">
        <div className="space-y-6 xl:col-span-9">
          {specializedReport ? (
            <>
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="analysis-card-highlight xl:col-span-6">
                  <p className="analysis-header mb-2">리포트 요약</p>
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{result.summary}</h1>
                  <div className="mt-4 rounded-xl border border-blue-100 bg-white/80 px-4 py-3">
                    <p className="text-[12px] font-bold text-blue-700 mb-1">{specializedReport.signatureTitle}</p>
                    <p className="text-[14px] font-medium text-gray-800 leading-relaxed">{specializedReport.signatureBody}</p>
                  </div>
                </div>
                <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InsightCard
                    label="중요 인사이트"
                    content={shorten((result.reportPayload?.coreInsights ?? []).slice(0, 3).join(" · "), 160)}
                    variant="highlight"
                    className="h-full"
                  />
                  <InsightCard
                    label="지금 액션"
                    content={shorten((result.reportPayload?.actionNow ?? []).slice(0, 3).join(" · "), 160)}
                    className="h-full"
                  />
                  <InsightCard
                    label="근거"
                    content={shorten((result.reportPayload?.evidence ?? []).slice(0, 3).join(" · "), 180)}
                    className="h-full md:col-span-2"
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-gray-900">중요 실행 보드</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {specializedReport.sections.map((block) => (
                    <div key={block.title} className="analysis-card bg-gray-50 h-full">
                      <p className="text-[12px] font-bold text-gray-500 mb-2">{block.title}</p>
                      <div className="space-y-2">
                        {block.items.slice(0, 4).map((item, index) => (
                          <p key={`${block.title}-${index}`} className="text-[13px] font-medium text-gray-800 leading-snug">
                            {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <div className="analysis-card-highlight xl:col-span-6">
                  <p className="analysis-header mb-2">리포트 요약</p>
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{result.summary}</h1>
                  <p className="mt-3 text-[14px] font-medium text-gray-700 leading-relaxed">
                    {shorten(topSection?.interpretation ?? "오늘은 확장보다 균형 유지가 우선입니다.", 160)}
                  </p>
                </div>
                <div className="xl:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InsightCard
                    label="지금의 총운 흐름"
                    content={shorten(topSection?.interpretation ?? "오늘은 확장보다 균형 유지가 우선입니다.", 120)}
                    variant="highlight"
                    className="h-full"
                  />
                  <InsightCard
                    label="바로 실행할 조언"
                    content={topSection?.advice ?? "하나의 우선순위를 정하고 오늘 안에 실행해 보세요."}
                    className="h-full"
                  />
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="analysis-card bg-gray-50 flex flex-col justify-center h-full">
                  <p className="text-[12px] font-bold text-gray-500 mb-1">나의 기본 성향</p>
                  <p className="text-[14px] font-semibold text-gray-900 leading-snug">
                    당신은 {result.palja.day.gan} 일간 기반으로 균형을 확인하는 타입입니다.
                  </p>
                </div>
                <div className="analysis-card bg-gray-50 flex flex-col justify-center h-full">
                  <p className="text-[12px] font-bold text-gray-500 mb-1">관계 스타일</p>
                  <p className="text-[14px] font-semibold text-gray-900 leading-snug">{relationshipHint}</p>
                </div>
                <div className="analysis-card bg-gray-50 flex flex-col justify-center h-full">
                  <p className="text-[12px] font-bold text-gray-500 mb-1">업무·재물 흐름</p>
                  <p className="text-[14px] font-semibold text-gray-900 leading-snug">{workMoneyHint}</p>
                </div>
                <div className="analysis-card bg-gray-50 flex flex-col justify-center h-full">
                  <p className="text-[12px] font-bold text-gray-500 mb-1">지금 조정 포인트</p>
                  <p className="text-[14px] font-semibold text-gray-900 leading-snug">{cautionHint}</p>
                </div>
              </section>
            </>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-2">
            <section className="space-y-4 xl:col-span-8">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h2 className="text-xl font-bold text-gray-900 mr-2">상세 해석</h2>
                {interestTags.map((tag) => (
                  <span key={tag} className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-[12px] font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.sections.map((section, index) => (
                  <ReportSectionCard
                    key={`${section.title}-${index}`}
                    title={section.title}
                    interpretation={section.interpretation}
                    advice={section.advice}
                    luckyTip={section.luckyTip}
                    defaultExpanded={index === 0}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-4 xl:col-span-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{isLifetimeReport ? "인생 단계별 (정밀 분석)" : "전통 해석 자세히 보기"}</h2>

              <div className="grid grid-cols-1 gap-4">
                <InsightCard
                  title="인생 기둥 (사주 원국)"
                  className="h-full"
                  content={
                    <div className="mt-2 space-y-3">
                      <PaljaChart palja={result.palja} />
                      {result.profileData.birthPrecision !== "exact" && (
                        <p className="text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                          출생 시각이 정확하지 않아 사주는 참고용으로 제시됩니다.
                        </p>
                      )}
                    </div>
                  }
                />

                <InsightCard
                  title="오행 에너지 균형"
                  className="h-full"
                  content={
                    <div className="space-y-5 mt-2">
                      <div className="flex justify-center">
                        <OhengDonutChart data={result.oheng} />
                      </div>
                      <ChartLegend items={legendItems} />
                      <p className="text-[13.5px] text-gray-600 text-center font-medium mt-2">
                        당신은 {dominantElement} 기운 비중이 높으며 {result.palja.day.gan} 일간 특성이 강하게 드러납니다.
                      </p>
                    </div>
                  }
                />

                <InsightCard
                  title="대운 타임라인 (10년 인생 주기)"
                  className="h-full"
                  content={
                    <div className="mt-2 space-y-6">
                      {lifetimeScore !== null && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <p className="text-[12px] font-bold text-emerald-700">인생 총점</p>
                          <p className="mt-1 text-[22px] font-black text-emerald-900">{lifetimeScore}점</p>
                        </div>
                      )}
                      {isLifetimeReport && goldenPeriod && <GoldenPeriodBadge period={goldenPeriod} status={goldenPeriodStatus} />}
                      {daeunData.length > 0 ? (
                        <div className="pt-2">
                          <DaeunTimeline data={daeunData} height={180} />
                        </div>
                      ) : (
                        <p className="text-[13px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                          대운 데이터가 아직 생성되지 않았습니다. 인생 총운 리포트를 다시 생성해 주세요.
                        </p>
                      )}
                    </div>
                  }
                />
              </div>
            </section>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-3">
          <div className="analysis-card xl:sticky xl:top-6">
            <h3 className="analysis-header mb-4">공유 카드 변형</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: "summary", label: "요약" },
                { value: "love", label: "연애" },
                { value: "fortune", label: "운세" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setShareVariant(item.value as ShareCardVariant)}
                  className={cn(
                    "h-10 rounded-xl border-2 transition-all font-bold text-[13px]",
                    shareVariant === item.value ? "border-[#24303F] bg-gray-50 text-gray-900" : "border-border bg-white text-gray-500 hover:bg-gray-50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Button onClick={() => void handleShare()} className="h-12 w-full bg-[#24303F] text-white rounded-xl hover:bg-[#1D2733]">
                <Share2 className="mr-2 h-4 w-4" /> 공유하기
              </Button>
              <Button onClick={() => void handleCopy()} variant="outline" className="h-12 w-full rounded-xl">
                <Copy className="mr-2 h-4 w-4" /> 링크 복사
              </Button>
              <Button onClick={() => void handleDownload()} variant="outline" className="h-12 w-full rounded-xl">
                <Download className="mr-2 h-4 w-4" /> 이미지로 저장
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 text-[12px] text-gray-400 leading-relaxed text-center">
              * 본 결과는 참고용 종합 해석입니다. 법률/의료/투자 판단은 전문가 조언을 우선해 주세요.
            </div>
          </div>
        </div>
      </div>

      <StickyActionBar
        primaryAction={{ label: "저장 및 공유하기", onClick: () => void handleShare(), icon: <Share2 className="w-5 h-5" /> }}
        secondaryAction={{ label: "조건 다시 입력", onClick: () => navigate("/saju"), icon: <RefreshCcw className="w-5 h-5" /> }}
      />
    </AnalysisPageShell>
  );
}

