import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HeartHandshake, Loader2 } from "lucide-react";
import { AnalysisPageShell } from "@/components/layout/AnalysisPageShell";
import { LoveInputStepper } from "@/components/love/LoveInputStepper";
import { StoryHeroCard } from "@/components/love/StoryHeroCard";
import { MatchScorePanel } from "@/components/love/MatchScorePanel";
import { LockedChapterCard } from "@/components/love/LockedChapterCard";
import { LoveTimingTimeline } from "@/components/love/LoveTimingTimeline";
import { UpgradeDrawer } from "@/components/love/UpgradeDrawer";
import { RepeatUsePromptCard } from "@/components/love/RepeatUsePromptCard";
import { ChanceMeter } from "@/components/love/ChanceMeter";
import { CounselSnapshotCard } from "@/components/love/CounselSnapshotCard";
import { CounselSectionCard } from "@/components/love/CounselSectionCard";
import { CounselListCard } from "@/components/love/CounselListCard";
import { ConfidenceNotesCard } from "@/components/love/ConfidenceNotesCard";
import { ErrorCard } from "@/components/common/ErrorCard";
import { StickyCTA } from "@/components/common/StickyCTA";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LegacyLoveReportFull,
  LegacyLoveReportPreview,
  LoveReportFull,
  LoveReportRecord,
  LoveReportSection,
  LoveServiceType,
  LoveSubjectInput,
} from "@/types/love";
import { calculateSaju } from "@/lib/sajuEngine";
import { calculateLoveScoreSet, extractLoveFeatureSet } from "@/lib/loveFeatureEngine";
import { createLoveReport, getLoveReportPreview, unlockLoveReport } from "@/lib/loveReportStore";
import { getLatestSajuResult } from "@/lib/resultStore";
import {
  inferLoveReportVersion,
  isLegacyLoveFullReport,
  isLegacyLovePreview,
  normalizeLoveScoreSet,
} from "@/lib/loveReportAdapters";
import { useAuthStore } from "@/store/useAuthStore";

const PRICE_BY_SERVICE: Record<LoveServiceType, number> = {
  "future-partner": 4900,
  "couple-report": 6900,
  "crush-reunion": 5900,
};

const PRODUCT_CODE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "LOVE_FUTURE_PARTNER_V2_COUNSEL",
  "couple-report": "LOVE_COUPLE_REPORT_V2_COUNSEL",
  "crush-reunion": "LOVE_CRUSH_REUNION_V2_COUNSEL",
};

const TITLE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "미래 배우자",
  "couple-report": "커플 궁합",
  "crush-reunion": "짝사랑·재회",
};

const SUBTITLE_BY_SERVICE: Record<LoveServiceType, string> = {
  "future-partner": "미래의 인연과 연애 습관을 상담형으로 해석합니다.",
  "couple-report": "관계를 어떻게 운영해야 하는지 상담 리포트로 정리합니다.",
  "crush-reunion": "재접촉과 정리의 분기점을 냉정하게 짚어드립니다.",
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

const buildCounselTimeline = (record: LoveReportRecord) => {
  if (inferLoveReportVersion(record) === "v1-story") {
    return [];
  }

  const preview = record.preview;
  if (isLegacyLovePreview(preview)) {
    return [];
  }

  if (record.isUnlocked && record.fullReport && !isLegacyLoveFullReport(record.fullReport)) {
    const sections = record.fullReport.sections.filter((section) => section.type !== "evidence").slice(0, 4);
    return sections.map((section, index) => ({
      label: index === 0 ? "지금의 핵심" : `상담 ${index + 1}`,
      description: section.actionItems[0] ?? section.summary,
    }));
  }

  return [
    { label: "지금", description: preview.immediateAction },
    { label: "30일 분기점", description: preview.scenarioHint },
    { label: "신뢰도 체크", description: preview.confidenceSummary },
  ];
};

function LegacyReportView({
  record,
  serviceType,
  onReset,
  detailMode,
  reportPath,
}: {
  record: LoveReportRecord;
  serviceType: LoveServiceType;
  onReset: () => void;
  detailMode: boolean;
  reportPath: string;
}) {
  const preview = record.preview as LegacyLoveReportPreview;
  const fullReport = isLegacyLoveFullReport(record.fullReport) ? (record.fullReport as LegacyLoveReportFull) : undefined;
  const timelinePoints = fullReport?.chapters?.length
    ? fullReport.chapters.map((chapter, index) => ({
        label: `챕터 ${index + 1} · ${chapter.title}`,
        description: chapter.actionTip,
      }))
    : [
        { label: "지금", description: preview.openChapter.preview },
        ...preview.lockedChapters.slice(0, 2).map((chapter, index) => ({
          label: `${index + 1}차 흐름`,
          description: chapter.teaser,
        })),
      ];

  return (
    <div className="space-y-5 pb-28">
      <StoryHeroCard serviceType={serviceType} headline={preview.headline} summary={preview.summary} />

      {serviceType === "crush-reunion" ? (
        <ChanceMeter value={normalizeLoveScoreSet(preview.scoreSet).overall} />
      ) : (
        <MatchScorePanel scoreSet={preview.scoreSet} />
      )}

      <Card className="rounded-2xl border border-border bg-white p-5">
        <h3 className="text-[16px] font-bold text-foreground">{preview.openChapter.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{preview.openChapter.content}</p>
        <p className="mt-3 rounded-xl bg-gray-50 p-3 text-[13px] font-semibold text-foreground">
          행동 제안: {preview.openChapter.actionTip}
        </p>
      </Card>

      {!record.isUnlocked ? (
        <section className="grid gap-3 md:grid-cols-2">
          {preview.lockedChapters.map((chapter) => (
            <LockedChapterCard key={chapter.key} chapter={chapter} />
          ))}
        </section>
      ) : null}

      {record.isUnlocked && fullReport?.chapters ? (
        <section className="space-y-3">
          {fullReport.chapters.map((chapter) => (
            <Card key={chapter.key} className="rounded-2xl border border-border bg-white p-5">
              <h3 className="text-[16px] font-bold text-foreground">{chapter.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{chapter.content}</p>
              <p className="mt-3 rounded-xl bg-gray-50 p-3 text-[13px] font-semibold text-foreground">
                행동 제안: {chapter.actionTip}
              </p>
            </Card>
          ))}
        </section>
      ) : null}

      <LoveTimingTimeline points={timelinePoints} />

      <RepeatUsePromptCard nextRefreshAt={record.nextRefreshAt} onReanalyze={detailMode ? undefined : onReset} />

      {detailMode ? (
        <Button asChild variant="outline" className="h-12 w-full">
          <Link to={reportPath}>새 상담 다시 시작</Link>
        </Button>
      ) : (
        <Button variant="outline" className="h-12 w-full" onClick={onReset}>
          다른 조건으로 다시 분석
        </Button>
      )}
    </div>
  );
}

function CounselReportView({
  record,
  serviceType,
  reportPath,
  onReset,
  detailMode,
}: {
  record: LoveReportRecord;
  serviceType: LoveServiceType;
  reportPath: string;
  onReset: () => void;
  detailMode: boolean;
}) {
  const preview = record.preview;
  const fullReport = record.fullReport && !isLegacyLoveFullReport(record.fullReport) ? (record.fullReport as LoveReportFull) : undefined;
  const timelinePoints = buildCounselTimeline(record);
  const evidenceSection = fullReport?.sections.find((section) => section.type === "evidence");
  const mainSections = fullReport?.sections.filter((section) => section.type !== "evidence" && section.type !== "opening") ?? [];
  const scoreSet = normalizeLoveScoreSet(preview.scoreSet);

  if (isLegacyLovePreview(preview)) {
    return null;
  }

  return (
    <div className="space-y-5 pb-28">
      <StoryHeroCard serviceType={serviceType} headline={preview.headline} summary={preview.summary} />
      <CounselSnapshotCard
        diagnosis={preview.openSection.conclusion}
        relationshipTemperature={preview.relationshipTemperature}
        immediateAction={preview.immediateAction}
      />

      {serviceType === "crush-reunion" ? <ChanceMeter value={scoreSet.overall} /> : <MatchScorePanel scoreSet={preview.scoreSet} />}

      <CounselSectionCard section={preview.openSection} />

      <Card className="rounded-[24px] border border-[#24303F]/10 bg-[#F8FAFC] p-5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-secondary">30일 분기점</p>
        <h3 className="mt-2 text-[18px] font-bold text-foreground">다음 흐름에서 무엇을 먼저 확인해야 하나</h3>
        <p className="mt-3 text-[14px] leading-7 text-text-secondary">{preview.scenarioHint}</p>
      </Card>

      {!record.isUnlocked ? (
        <>
          <section className="grid gap-3 md:grid-cols-2">
            {preview.lockedSectionSummaries.map((section) => (
              <LockedChapterCard key={`${section.type}-${section.title}`} chapter={section} />
            ))}
          </section>

          <ConfidenceNotesCard summary={preview.confidenceSummary} notes={[preview.ctaReason]} />
        </>
      ) : null}

      {record.isUnlocked && fullReport ? (
        <>
          <section className="space-y-4">
            {mainSections.map((section) => (
              <CounselSectionCard key={`${section.type}-${section.title}`} section={section} />
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <CounselListCard title="1주 실행 플랜" label="action plan" items={fullReport.actionPlan} tone="highlight" />
            <CounselListCard title="지금 멈춰야 할 행동" label="avoid" items={fullReport.avoidList} tone="warning" />
            <CounselListCard title="이럴 때 이렇게 말하기" label="prompt" items={fullReport.conversationPrompts} />
          </section>

          <ConfidenceNotesCard
            summary={preview.confidenceSummary}
            evidenceSummary={evidenceSection?.reason}
            notes={fullReport.confidenceNotes}
          />
        </>
      ) : null}

      <LoveTimingTimeline title="상담 흐름 한눈에 보기" points={timelinePoints} />

      <RepeatUsePromptCard nextRefreshAt={record.nextRefreshAt} onReanalyze={detailMode ? undefined : onReset} />

      {detailMode ? (
        <Button asChild variant="outline" className="h-12 w-full">
          <Link to={reportPath}>새 상담 다시 시작</Link>
        </Button>
      ) : (
        <Button variant="outline" className="h-12 w-full" onClick={onReset}>
          다른 조건으로 다시 분석
        </Button>
      )}
    </div>
  );
}

export function LoveReportPageBase({ serviceType, reportId }: LoveReportPageBaseProps) {
  const profile = useAuthStore((state) => state.profile);
  const [record, setRecord] = useState<LoveReportRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(Boolean(reportId));
  const [error, setError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [prefilled, setPrefilled] = useState<Partial<LoveSubjectInput> | undefined>(undefined);

  const detailMode = Boolean(reportId);
  const resolvedServiceType = serviceType ?? record?.serviceType;
  const shellTitle = resolvedServiceType ? TITLE_BY_SERVICE[resolvedServiceType] : "연애 리포트";
  const shellSubtitle = resolvedServiceType
    ? SUBTITLE_BY_SERVICE[resolvedServiceType]
    : "저장된 상담형 연애 리포트를 불러오는 중입니다.";
  const reportPath = resolvedServiceType ? PATH_BY_SERVICE[resolvedServiceType] : "/category/love";
  const price = resolvedServiceType ? PRICE_BY_SERVICE[resolvedServiceType] : 0;
  const productCode = resolvedServiceType ? PRODUCT_CODE_BY_SERVICE[resolvedServiceType] : "";

  useEffect(() => {
    void (async () => {
      if (profile) {
        setPrefilled({
          name: profile.name ?? "나",
          gender: profile.gender ?? "female",
          calendarType: profile.calendar_type ?? "solar",
          year: profile.year ?? 1990,
          month: profile.month ?? 1,
          day: profile.day ?? 1,
          hour: typeof profile.hour === "number" ? profile.hour : undefined,
          minute: typeof profile.minute === "number" ? profile.minute : undefined,
          timeBlock: profile.time_block ?? undefined,
          birthPrecision: profile.time_block ? "time-block" : typeof profile.hour === "number" ? "exact" : "unknown",
          location: profile.location ?? "서울",
        });
        return;
      }

      const base = await getLatestSajuResult();
      if (!base?.profileData) {
        return;
      }
      setPrefilled({
        ...base.profileData,
        name: "나",
      });
    })();
  }, [profile]);

  useEffect(() => {
    if (!reportId) {
      setIsLoadingSaved(false);
      return;
    }

    void (async () => {
      setIsLoadingSaved(true);
      setError(null);
      try {
        const existing = await getLoveReportPreview(reportId);
        if (!existing) {
          throw new Error("저장된 연애 리포트를 찾을 수 없습니다.");
        }
        setRecord(existing);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "리포트 불러오기 실패");
      } finally {
        setIsLoadingSaved(false);
      }
    })();
  }, [reportId]);

  const runAnalysis = async (payload: {
    subjectA: LoveSubjectInput;
    subjectB?: LoveSubjectInput;
    context: Record<string, unknown>;
    relationMode?: string;
  }) => {
    if (!serviceType) {
      setError("서비스 타입을 확인할 수 없습니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const sajuA = calculateSaju(payload.subjectA);
      const sajuB = payload.subjectB ? calculateSaju(payload.subjectB) : undefined;
      const featureSet = extractLoveFeatureSet({
        subjectA: payload.subjectA,
        sajuA,
        subjectB: payload.subjectB,
        sajuB,
      });
      const scoreSet = calculateLoveScoreSet(serviceType, featureSet);

      const created = await createLoveReport({
        serviceType,
        relationMode: payload.relationMode,
        inputSnapshot: {
          subjectA: payload.subjectA,
          subjectB: payload.subjectB,
          context: payload.context,
        },
        featureSet: {
          ...featureSet,
          timeConfidence: scoreSet.timing,
        },
      });

      setRecord(created);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "연애 리포트 생성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unlock = async () => {
    if (!record?.id || !resolvedServiceType) {
      return;
    }

    setIsUnlocking(true);
    setError(null);
    try {
      const unlocked = await unlockLoveReport({
        id: record.id,
        productCode,
        amountKrw: price,
      });
      setRecord(unlocked);
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : "리포트 해제 실패");
    } finally {
      setIsUnlocking(false);
    }
  };

  const version = record ? inferLoveReportVersion(record) : "v2-counsel";
  const ctaCopy = resolvedServiceType
    ? `이 관계를 어떻게 다뤄야 하는지 이어서 보기 · ${toWon(price)}`
    : "전체 상담 리포트 이어서 보기";

  const canRenderRecord = Boolean(record && resolvedServiceType);

  const content = useMemo(() => {
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
            <p className="text-[15px] font-semibold text-foreground">저장된 연애 리포트를 아직 불러오지 못했습니다.</p>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
              리포트가 삭제되었거나 현재 계정에서 접근할 수 없는 상태일 수 있습니다.
            </p>
            <Button asChild className="mt-5 bg-[#24303F] text-white">
              <Link to="/mypage">보관함으로 돌아가기</Link>
            </Button>
          </Card>
        );
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

    if (version === "v1-story") {
      return (
        <LegacyReportView
          record={record}
          serviceType={resolvedServiceType}
          detailMode={detailMode}
          reportPath={reportPath}
          onReset={() => {
            if (!detailMode) {
              setRecord(null);
            }
          }}
        />
      );
    }

    return (
      <CounselReportView
        record={record}
        serviceType={resolvedServiceType}
        reportPath={reportPath}
        detailMode={detailMode}
        onReset={() => {
          setRecord(null);
          setError(null);
        }}
      />
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

      {error ? <ErrorCard message={error} onRetry={() => setError(null)} /> : null}

      {record && !record.isUnlocked && resolvedServiceType ? (
        <>
          <StickyCTA>
            <Button className="h-14 w-full bg-[#24303F] text-white" onClick={() => setUpgradeOpen(true)}>
              {ctaCopy}
            </Button>
          </StickyCTA>
          <UpgradeDrawer
            open={upgradeOpen}
            onOpenChange={setUpgradeOpen}
            title={`${TITLE_BY_SERVICE[resolvedServiceType]} 상담 리포트 전체 해제`}
            priceText={toWon(price)}
            loading={isUnlocking}
            onUnlock={unlock}
          />
        </>
      ) : null}
    </AnalysisPageShell>
  );
}
