import { Button } from "@/components/ui/button";
import { DetailAccordion } from "@/components/astrology/ActionableReport";
import { LockedSectionOverlay } from "@/components/common/LockedSectionOverlay";
import { normalizeAstrologyBirthReport } from "@/lib/astrologyReport";
import { AstrologyReportRecord } from "@/types/astrology";

const LOCKED_LABEL = "결제 후 열람";
const sectionSurface =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6";

const QUESTION_ORDER = ["love", "work", "money", "recovery", "luck"] as const;
const QUESTION_TITLE: Record<(typeof QUESTION_ORDER)[number], string> = {
  love: "연애: 관계에서 반복되는 패턴은 무엇인가요?",
  work: "일: 성과를 높이는 운영 방식은 무엇인가요?",
  money: "재정: 누수를 줄이려면 무엇부터 바꿔야 하나요?",
  recovery: "회복: 무너질 때 빠르게 복구하는 방법은 무엇인가요?",
  luck: "운: 흐름을 올리는 실전 루틴은 무엇인가요?",
};

interface AstrologyReportViewProps {
  record: AstrologyReportRecord;
  isLocked: boolean;
  onUnlockRequest?: () => void;
  onReset?: () => void;
}

export function AstrologyReportView({
  record,
  isLocked,
  onUnlockRequest,
  onReset,
}: AstrologyReportViewProps) {
  const report = normalizeAstrologyBirthReport(
    record.reportPayload,
    { birthTimeKnown: record.inputSnapshot?.birthTimeKnown as boolean | undefined },
  );

  const confidenceLabel =
    report.confidence.level === "high"
      ? "높음"
      : report.confidence.level === "medium"
      ? "중간"
      : "낮음";
  const questionAnswerMap = new Map(report.popularQuestions.map((item) => [item.id, item.answer]));
  const questionCards = QUESTION_ORDER.map((id) => ({
    id,
    question: QUESTION_TITLE[id],
    answer:
      questionAnswerMap.get(id) ??
      (id === "money"
        ? report.lifePatterns.money.recommendedAction
        : id === "recovery"
        ? report.lifePatterns.recovery.recommendedAction
        : "핵심 패턴을 기준으로 루틴을 고정하세요."),
  }));
  const operationManualCards = [
    { id: "relationship", title: "관계 운영 매뉴얼", data: report.lifePatterns.relationship },
    { id: "work", title: "일 운영 매뉴얼", data: report.lifePatterns.work },
    { id: "money", title: "재정 운영 매뉴얼", data: report.lifePatterns.money },
    { id: "recovery", title: "회복 운영 매뉴얼", data: report.lifePatterns.recovery },
  ] as const;
  const nowActions = Array.from(
    new Set([
      report.lifePatterns.relationship.recommendedAction,
      report.lifePatterns.work.recommendedAction,
      report.lifePatterns.money.recommendedAction,
      report.lifePatterns.recovery.recommendedAction,
    ]),
  ).slice(0, 3);
  const summaryCards = [
    `핵심 진단: ${report.hero.headline}`,
    `이번 달 집중: ${report.currentWindow.month.focus}`,
    `우선 행동: ${nowActions[0] ?? report.currentWindow.month.routine}`,
  ];

  return (
    <section className="space-y-4 md:space-y-5">
      <section data-testid="diagnosis-section" className={sectionSurface}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            신뢰도 {confidenceLabel} ({report.confidence.score}점)
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            출생시간 {report.confidence.birthTimeKnown ? "입력됨" : "미입력(추정 해석 포함)"}
          </span>
        </div>
        {!report.confidence.birthTimeKnown ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            출생시간 미입력 상태이므로 하우스/상승궁 기반 해석 일부는 추정치입니다.
          </p>
        ) : null}
        <h2 className="mt-3 text-lg font-bold text-slate-900 md:text-xl">
          1) 한 줄 핵심 진단
        </h2>
        <p className="mt-2 text-xl font-bold text-slate-900 md:text-2xl">
          {report.hero.headline}
        </p>
        <p className="mt-3 text-sm text-slate-600">{report.confidence.summary}</p>
      </section>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="core-insights-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">2) 핵심 인사이트 3개</h3>
          <div className="mt-3 grid gap-3">
            {report.hero.topInsights.map((item, index) => (
              <article
                key={`core-insight-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-sm font-semibold text-slate-900">인사이트 {index + 1}</p>
                <p className="mt-2 text-sm text-slate-700">{item}</p>
              </article>
            ))}
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="identity-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">3) 나는 어떤 사람인가</h3>
          <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <strong>핵심 기질:</strong> 태양 {report.deepData.big3.sun.signKo} · 달 {report.deepData.big3.moon.signKo} · 상승궁 {report.deepData.big3.rising.signKo}
            </p>
            <p>
              <strong>관계 방식:</strong> {report.lifePatterns.relationship.pattern}
            </p>
            <p>
              <strong>일하는 방식:</strong> {report.lifePatterns.work.pattern}
            </p>
            <p>
              <strong>회복 리듬:</strong> {report.lifePatterns.recovery.pattern}
            </p>
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="question-interpretation-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">4) 연애 / 일 / 재정 / 회복 / 운 질문형 해석</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {questionCards.map((item) => (
              <article key={`question-card-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{item.question}</p>
                <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="operation-manual-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">5) 관계 / 일 / 재정 / 회복 운영 매뉴얼</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {operationManualCards.map((item) => (
              <article key={`manual-${item.id}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-2 text-sm text-slate-700">
                  <strong>문제 양상:</strong> {item.data.problemManifestation}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>트리거:</strong> {item.data.trigger}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  <strong>실행 규칙:</strong> {item.data.recommendedAction}
                </p>
              </article>
            ))}
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="long-term-growth-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">6) 장기 성장 방향</h3>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <strong>분기 집중:</strong> {report.currentWindow.quarter.focus}
            </p>
            <p className="mt-1">
              <strong>분기 주의:</strong> {report.currentWindow.quarter.avoid}
            </p>
            <p className="mt-1">
              <strong>분기 루틴:</strong> {report.currentWindow.quarter.routine}
            </p>
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="action-routine-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">7) 지금 해야 할 행동 + 30일 루틴</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">지금 해야 할 행동</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {nowActions.map((item, index) => (
                  <li key={`now-action-${index}`}>{index + 1}. {item}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">30일 루틴</p>
              <p className="mt-2 text-sm text-slate-700">
                <strong>집중:</strong> {report.currentWindow.month.focus}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>피할 것:</strong> {report.currentWindow.month.avoid}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>고정 루틴:</strong> {report.currentWindow.month.routine}
              </p>
            </article>
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <section data-testid="summary-card-section" className={sectionSurface}>
          <h3 className="text-lg font-bold text-slate-900">8) 요약 카드</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">핵심 실행 카드</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {summaryCards.map((item, index) => (
                  <li key={`summary-${index}`}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">9) 상세 천문 데이터는 아래 부록에서 확인하세요.</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">근거 축</p>
              <p className="mt-2 text-sm text-slate-700">
                <strong>월간 근거:</strong> {report.currentWindow.month.basis.join(" · ")}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                <strong>분기 근거:</strong> {report.currentWindow.quarter.basis.join(" · ")}
              </p>
            </article>
          </div>
        </section>
      </LockedSectionOverlay>

      <LockedSectionOverlay locked={isLocked} label={LOCKED_LABEL} onClick={onUnlockRequest}>
        <DetailAccordion report={report} />
      </LockedSectionOverlay>

      {onReset && !isLocked ? (
        <Button variant="outline" className="h-12 w-full rounded-xl" onClick={onReset}>
          정보 다시 입력
        </Button>
      ) : null}
    </section>
  );
}
