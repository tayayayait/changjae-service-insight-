import { Card } from "@/components/ui/card";
import {
  CoupleReportInsights,
  CrushReunionInsights,
  FuturePartnerInsights,
  LoveReportFullV3,
  LoveReportPreviewV3,
} from "@/types/love";
import { StoryHeroCard } from "./StoryHeroCard";
import { CounselSnapshotCard } from "./CounselSnapshotCard";
import { PreviewHighlightsCard } from "./PreviewHighlightsCard";
import { CounselSectionCard } from "./CounselSectionCard";
import { LockedChapterCard } from "./LockedChapterCard";
import { MatchScorePanel } from "./MatchScorePanel";
import { PartnerProfileCard } from "./PartnerProfileCard";
import { CounselListCard } from "./CounselListCard";
import { ConfidenceNotesCard } from "./ConfidenceNotesCard";
import { ActionRoadmapCard } from "./ActionRoadmapCard";
import { ChanceMeter } from "./ChanceMeter";

interface LoveReportViewProps {
  preview: LoveReportPreviewV3;
  fullReport?: LoveReportFullV3;
  isUnlocked: boolean;
}

const SectionGate = ({ copy }: { copy: string }) => (
  <div className="rounded-[22px] border border-[#24303F]/10 bg-[#F8FAFC] px-4 py-3">
    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-text-secondary">전체 리포트에서 제공</p>
    <p className="mt-1 text-[14px] leading-relaxed text-foreground">{copy}</p>
  </div>
);

const extractEvidence = (fullReport?: LoveReportFullV3) =>
  fullReport?.sections.find((section) => section.id === "evidence-note");

const extractBodySections = (fullReport?: LoveReportFullV3) =>
  fullReport?.sections.filter((section) => section.id !== "evidence-note") ?? [];

const LockedSectionGrid = ({ preview, masked = false }: { preview: LoveReportPreviewV3; masked?: boolean }) => (
  <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {preview.lockedSectionSummaries.map((section) => (
      <LockedChapterCard key={`${section.id}-${section.title}`} chapter={section} masked={masked} />
    ))}
  </section>
);

const InfoStrip = ({ title, description }: { title: string; description: string }) => (
  <Card className="rounded-[24px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A4757]">{title}</p>
    <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{description}</p>
  </Card>
);

export function FuturePartnerReportView({ preview, fullReport, isUnlocked }: LoveReportViewProps) {
  const insights = fullReport?.serviceInsights.kind === "future-partner"
    ? (fullReport.serviceInsights as FuturePartnerInsights)
    : undefined;
  const evidence = extractEvidence(fullReport);
  const bodySections = extractBodySections(fullReport);

  return (
    <div className="space-y-5">
      <StoryHeroCard serviceType="future-partner" headline={preview.headline} summary={preview.summary} />
      <CounselSnapshotCard quickCounsel={preview.quickCounsel} />

      {isUnlocked && fullReport && insights ? (
        <>
          <SectionGate copy="배우자상, 만남 채널, 필터링 기준, 결혼 조건까지 서비스 전용 결과물을 확인할 수 있습니다." />
          <MatchScorePanel scoreSet={fullReport.scoreSet} />
          <PartnerProfileCard profile={insights.partnerProfile} />
          <section className="space-y-4">
            {bodySections.map((section) => (
              <CounselSectionCard key={section.id} section={section} />
            ))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="인연이 들어오는 채널" label="Service Insights" items={insights.meetingChannels} tone="highlight" />
            <CounselListCard title="내가 먼저 볼 기준" label="Self Check" items={insights.selfCheckCriteria} />
            <CounselListCard title="초기 그린 플래그" label="Green Flags" items={insights.greenFlags} tone="highlight" />
            <CounselListCard title="초기 레드 플래그" label="Red Flags" items={insights.redFlags} tone="warning" />
          </section>
          <ActionRoadmapCard roadmap={fullReport.actionRoadmap} />
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="대화 시작 문장" label="Prompts" items={fullReport.conversationPrompts} />
            <CounselListCard title="하지 말아야 할 행동" label="Avoid" items={fullReport.avoidList} tone="warning" />
          </section>
          <ConfidenceNotesCard
            summary={preview.confidenceSummary}
            evidenceSummary={evidence?.analysisParagraphs.join(" ")}
            notes={fullReport.confidenceNotes}
          />
        </>
      ) : (
        <>
          <PreviewHighlightsCard
            title="무료 진단: 인연이 들어오는 채널 힌트"
            highlights={preview.previewHighlights}
          />
          <InfoStrip title="배우자상 한 줄" description={preview.openSection.verdict} />
          <CounselSectionCard section={preview.openSection} masked />
          <LockedSectionGrid preview={preview} masked />
        </>
      )}
    </div>
  );
}

export function CoupleReportView({ preview, fullReport, isUnlocked }: LoveReportViewProps) {
  const insights = fullReport?.serviceInsights.kind === "couple-report"
    ? (fullReport.serviceInsights as CoupleReportInsights)
    : undefined;
  const evidence = extractEvidence(fullReport);
  const bodySections = extractBodySections(fullReport);

  return (
    <div className="space-y-5">
      <StoryHeroCard serviceType="couple-report" headline={preview.headline} summary={preview.summary} />
      <CounselSnapshotCard quickCounsel={preview.quickCounsel} />

      {isUnlocked && fullReport && insights ? (
        <>
          <SectionGate copy="갈등 구조, 합의 체크리스트, 회복 루틴, 금지 문장까지 관계 운영형 결과물을 제공합니다." />
          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <MatchScorePanel scoreSet={fullReport.scoreSet} />
            <Card className="rounded-[28px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A4757]">핵심 리스크</p>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-text-secondary">
                {insights.conflictTriggers.map((item, index) => (
                  <li key={`trigger-${index}`} className="flex gap-2">
                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-[#8A4757]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
          <section className="space-y-4">
            {bodySections.map((section) => (
              <CounselSectionCard key={section.id} section={section} />
            ))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="합의 체크리스트" label="Agreement" items={insights.agreementChecklist} tone="highlight" />
            <CounselListCard title="회복 루틴" label="Repair" items={insights.repairRituals} />
            <CounselListCard title="절대 하지 말 말" label="Do Not Say" items={insights.doNotSay} tone="warning" />
            <CounselListCard title="회복 신호" label="Recovery Signals" items={insights.recoverySignals} />
          </section>
          <ActionRoadmapCard roadmap={fullReport.actionRoadmap} />
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="대화 시작 문장" label="Prompts" items={fullReport.conversationPrompts} />
            <CounselListCard title="하지 말아야 할 행동" label="Avoid" items={fullReport.avoidList} tone="warning" />
          </section>
          <ConfidenceNotesCard
            summary={preview.confidenceSummary}
            evidenceSummary={evidence?.analysisParagraphs.join(" ")}
            notes={fullReport.confidenceNotes}
          />
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <PreviewHighlightsCard
              title="무료 진단: 갈등 핵심 축"
              highlights={preview.previewHighlights}
            />
            <InfoStrip title="당장 피해야 할 말" description={preview.openSection.warningNote} />
          </div>
          <CounselSectionCard section={preview.openSection} masked />
          <LockedSectionGrid preview={preview} masked />
        </>
      )}
    </div>
  );
}

export function ReunionReportView({ preview, fullReport, isUnlocked }: LoveReportViewProps) {
  const insights = fullReport?.serviceInsights.kind === "crush-reunion"
    ? (fullReport.serviceInsights as CrushReunionInsights)
    : undefined;
  const evidence = extractEvidence(fullReport);
  const bodySections = extractBodySections(fullReport);

  return (
    <div className="space-y-5">
      <StoryHeroCard serviceType="crush-reunion" headline={preview.headline} summary={preview.summary} />
      <CounselSnapshotCard quickCounsel={preview.quickCounsel} />

      {isUnlocked && fullReport && insights ? (
        <>
          <SectionGate copy="가능성 판정, 연락 가능 창, 중단 조건, 실제 문장 예시까지 재접촉 전용 결과물을 제공합니다." />
          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <ChanceMeter value={Math.round(fullReport.scoreSet.overall)} label="재접촉 현실성" />
            <Card className="rounded-[28px] border border-[#24303F]/10 bg-gradient-to-br from-[#FFF9F5] to-white p-5 shadow-sm">
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A4757]">판정</p>
              <h3 className="mt-2 text-[20px] font-bold text-foreground">{insights.chanceVerdict}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">{insights.contactWindow}</p>
            </Card>
          </div>
          <section className="space-y-4">
            {bodySections.map((section) => (
              <CounselSectionCard key={section.id} section={section} />
            ))}
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="긍정 신호" label="Positive Signals" items={insights.positiveSignals} tone="highlight" />
            <CounselListCard title="막는 신호" label="Blocking Signals" items={insights.blockingSignals} tone="warning" />
            <CounselListCard title="중단 조건" label="Stop Loss" items={insights.stopLossRules} tone="warning" />
            <CounselListCard title="재접촉 문장" label="Contact Scripts" items={insights.contactScripts} />
          </section>
          <ActionRoadmapCard roadmap={fullReport.actionRoadmap} />
          <section className="grid gap-4 md:grid-cols-2">
            <CounselListCard title="정리용 대화 문장" label="Prompts" items={fullReport.conversationPrompts} />
            <CounselListCard title="하지 말아야 할 행동" label="Avoid" items={fullReport.avoidList} tone="warning" />
          </section>
          <ConfidenceNotesCard
            summary={preview.confidenceSummary}
            evidenceSummary={evidence?.analysisParagraphs.join(" ")}
            notes={fullReport.confidenceNotes}
          />
        </>
      ) : (
        <>
          <PreviewHighlightsCard
            title="무료 진단: 재접촉 위험 신호"
            highlights={preview.previewHighlights}
          />
          <ChanceMeter value={Math.round(preview.scoreSet.overall)} label="재접촉 현실성" />
          <InfoStrip
            title="지금 움직이면 안 되는 이유"
            description={preview.openSection.warningNote}
          />
          <CounselSectionCard section={preview.openSection} masked />
          <LockedSectionGrid preview={preview} masked />
        </>
      )}
    </div>
  );
}
