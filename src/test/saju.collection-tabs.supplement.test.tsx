import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type { SajuCareerTimingPayload, SajuResult, SajuYearlyActionCalendarPayload } from "@/types/result";

const baseResult: SajuResult = {
  id: "result-supplement",
  profileData: {
    calendarType: "solar",
    year: 1990,
    month: 1,
    day: 1,
    gender: "male",
  },
  palja: {
    year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
    month: { gan: "을", ji: "축", ohengGan: "목", ohengJi: "토" },
    day: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
    time: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
  },
  oheng: [
    { element: "목", count: 2, percentage: 40 },
    { element: "화", count: 1, percentage: 20 },
    { element: "토", count: 1, percentage: 20 },
    { element: "금", count: 0, percentage: 0 },
    { element: "수", count: 1, percentage: 20 },
  ],
  interests: [],
  summary: "요약",
  sections: [],
};

const buildCareerPayload = (withSupplement: boolean): SajuCareerTimingPayload => ({
  coreQuestion: "핵심 질문",
  coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
  actionNow: ["액션 1", "액션 2"],
  evidence: ["근거 1", "근거 2"],
  analysisBlocks: [
    {
      windowLabel: "결정 시점",
      timeRange: "0~2년",
      coreFlow: "핵심 흐름",
      evidence: "해석 근거",
      opportunities: ["기회 1"],
      risks: ["리스크 1"],
      actionStrategy: ["전략 1"],
    },
  ],
  careerWindow: "커리어 타이밍",
  careerArcSummary: "초기 축적기부터 안정화기까지 장기 흐름을 봅니다.",
  transitionSignal: "단계 전환 신호를 기준으로 판단하세요.",
  currentYearFocus: "현재 연도는 보조 점검 포인트입니다.",
  stageFlow: [
    {
      stageId: "build-up",
      label: "초기 축적기",
      timeRange: "0~2년",
      coreFlow: "초기 축적기 핵심 흐름",
      evidence: "초기 축적기 근거",
      opportunities: ["기회 1", "기회 2"],
      risks: ["리스크 1", "리스크 2"],
      actionStrategy: ["전략 1", "전략 2"],
      transitionSignal: "기준 유지율이 높아지면 전환기 신호입니다.",
    },
    {
      stageId: "transition",
      label: "전환기",
      timeRange: "3~5년",
      coreFlow: "전환기 핵심 흐름",
      evidence: "전환기 근거",
      opportunities: ["전환 기회 1", "전환 기회 2"],
      risks: ["전환 리스크 1", "전환 리스크 2"],
      actionStrategy: ["전환 전략 1", "전환 전략 2"],
      transitionSignal: "성과 지표 안정화가 확장기 신호입니다.",
    },
    {
      stageId: "expansion",
      label: "확장기",
      timeRange: "6~10년",
      coreFlow: "확장기 핵심 흐름",
      evidence: "확장기 근거",
      opportunities: ["확장 기회 1", "확장 기회 2"],
      risks: ["확장 리스크 1", "확장 리스크 2"],
      actionStrategy: ["확장 전략 1", "확장 전략 2"],
      transitionSignal: "유지 체계 정착이 안정화기 신호입니다.",
    },
    {
      stageId: "stabilization",
      label: "안정화기",
      timeRange: "10년+",
      coreFlow: "안정화기 핵심 흐름",
      evidence: "안정화기 근거",
      opportunities: ["안정 기회 1", "안정 기회 2"],
      risks: ["안정 리스크 1", "안정 리스크 2"],
      actionStrategy: ["안정 전략 1", "안정 전략 2"],
      transitionSignal: "승계 전략 고도화가 핵심 신호입니다.",
    },
  ],
  decisionTree: ["결정 트리 1"],
  executionChecklist: ["실행 체크 1"],
  workModeFit: "업무 방식",
  decideNow: ["지금 결정 1"],
  deferNow: ["지금 보류 1"],
  gainVsLossPatterns: ["패턴 1"],
  decisionCriteria: ["기준 1"],
  ...(withSupplement
    ? {
        supplement: {
          deepInsightSummary: "보강 인사이트",
          deepDivePoints: ["포인트 1", "포인트 2", "포인트 3"],
          executionProtocol: {
            today: ["오늘 1"],
            thisWeek: ["주간 1", "주간 2"],
            thisMonth: ["월간 1", "월간 2"],
            avoid: ["주의 1"],
          },
          checkpointQuestions: ["질문 1", "질문 2"],
          visualExplainers: [
            {
              type: "decision-matrix",
              title: "결정 매트릭스",
              items: ["즉시 실행", "보류"],
            },
          ],
        },
      }
    : {}),
});

const buildYearlyPayload = (): SajuYearlyActionCalendarPayload => ({
  coreQuestion: "핵심 질문",
  coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
  actionNow: ["액션 1", "액션 2"],
  evidence: ["근거 1", "근거 2"],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "기반 정비 흐름",
      evidence: "우선순위 정렬 근거",
      opportunities: ["기회 1", "기회 2"],
      risks: ["리스크 1", "리스크 2"],
      actionStrategy: ["행동 1", "행동 2"],
    },
  ],
  oneLineTotalReview: "2026년은 방향을 고정하는 기준년입니다.",
  currentLifeFlow: "지금은 확장보다 기준 정렬이 필요한 구간입니다.",
  meaningOfThisYear: "올해는 장기 운영 방식 확정의 의미가 큽니다.",
  tenYearFlow: [
    { periodLabel: "0~2년", phaseLabel: "기반 설정기", interpretation: "핵심 축을 정하고 반복 구조를 고정합니다." },
    { periodLabel: "3~5년", phaseLabel: "확장기", interpretation: "정리된 기준 위에서 확장 범위를 선택합니다." },
    { periodLabel: "6~10년", phaseLabel: "성과 정착기", interpretation: "유지 가능한 구조를 완성합니다." },
  ],
  longPatternInterpretation: ["성급한 확장보다 기준 고정이 누적 성과를 만듭니다."],
  keyThemes: [
    { theme: "한 축 집중", interpretation: "분산보다 집중이 장기 누적을 만듭니다." },
    { theme: "기준 문장화", interpretation: "판단 기준 문장화로 흔들림을 줄입니다." },
    { theme: "성과 구조화", interpretation: "숫자보다 반복 가능한 구조를 남겨야 합니다." },
  ],
  quarterNarratives: [
    { quarter: "1분기", role: "기반 정비", meaning: "무엇을 남길지 정하는 시기", focus: "우선순위 고정", caution: "과속 시작" },
    { quarter: "2분기", role: "확장 시동", meaning: "기준 유지 범위 안에서 확장 점검", focus: "선택과 집중", caution: "과다 목표" },
    { quarter: "3분기", role: "성과 압축", meaning: "누적 성과를 압축", focus: "완성도 점검", caution: "지연 방치" },
    { quarter: "4분기", role: "정리와 전환 준비", meaning: "다음 해 운영 기준 정리", focus: "잔여 과제 정리", caution: "마감 과속" },
  ],
  yearEndResidue: "연말에는 기준 문서와 결과물 기록이 남아야 합니다.",
  closingLine: "올해의 가치는 다음 10년 기준을 남기는 데 있습니다.",
  lifecycleExecutionPattern: ["0~2년 기반 정렬", "3~5년 확장 점검", "6~10년 구조 정착"],
  phaseFocusMap: [
    { phaseLabel: "0~2년", focusPoint: "기준 정렬", executionPattern: "반복 구조 고정", checkpoint: "분기 점검" },
    { phaseLabel: "3~5년", focusPoint: "확장 선택", executionPattern: "확장 범위 제한", checkpoint: "월간 점검" },
    { phaseLabel: "6~10년", focusPoint: "정착", executionPattern: "지속 가능성 점검", checkpoint: "분기 점검" },
    { phaseLabel: "전환", focusPoint: "전환 준비", executionPattern: "전환 조건 문서화", checkpoint: "연말 점검" },
  ],
  accumulationTransitionFlow: [
    { axis: "쌓을 것", guidance: "반복 가능한 운영 규칙을 축적합니다." },
    { axis: "버릴 것", guidance: "성과와 무관한 과제는 정리합니다." },
    { axis: "전환 트리거", guidance: "전환 기준 지표를 명확히 합니다." },
    { axis: "복구 규칙", guidance: "지연 복구 기준을 먼저 고정합니다." },
  ],
  longPracticeStrategy: ["분기 리뷰 기준을 유지합니다.", "우선순위 드리프트를 점검합니다.", "전환 신호를 기록합니다."],
  yearToLifeBridge: "현재 위치와 장기 목적을 연결하는 기준 문장을 유지합니다.",
  quarterlyGoals: ["1분기 기반 정비", "2분기 확장 시동", "3분기 성과 압축", "4분기 정리와 전환 준비"],
  monthlyActions: Array.from({ length: 12 }, (_, index) => `${index + 1}월 실행 항목`),
  riskCalendar: ["1분기 과속 주의", "2분기 과다 목표 주의", "3분기 지연 누적 주의", "4분기 마감 과속 주의"],
  quarterThemes: ["1분기 기반", "2분기 확장", "3분기 압축", "4분기 정리"],
  monthlyPushCaution: Array.from({ length: 12 }, (_, index) => `${index + 1}월 주의 항목`),
  actionCheckpoints: Array.from({ length: 12 }, (_, index) => `${index + 1}월 점검 항목`),
  priorityQueue: ["우선순위 1", "우선순위 2", "우선순위 3"],
  supplement: {
    deepInsightSummary: "보강 인사이트",
    deepDivePoints: ["포인트 1", "포인트 2", "포인트 3"],
    executionProtocol: {
      today: ["오늘 실행"],
      thisWeek: ["이번 주 실행"],
      thisMonth: ["이번 달 실행"],
      avoid: ["주의 항목"],
    },
    checkpointQuestions: ["질문 1", "질문 2"],
    visualExplainers: [{ type: "calendar-map", title: "캘린더 맵", items: ["포인트 1", "포인트 2"] }],
  },
});

describe("SajuCollectionTabs supplement rendering", () => {
  it("appends supplement section when payload has supplement", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": buildCareerPayload(true),
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(
      <SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />,
    );

    expect(screen.getByText("심화 보강 섹션")).toBeInTheDocument();
    expect(screen.getByText("심화 해석 포인트")).toBeInTheDocument();
    expect(screen.getAllByText("결정 매트릭스").length).toBeGreaterThan(0);
  });

  it("keeps existing view when supplement is absent", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": buildCareerPayload(false),
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(
      <SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />,
    );

    expect(screen.queryByText("심화 보강 섹션")).not.toBeInTheDocument();
    expect(screen.getByText("커리어 요약")).toBeInTheDocument();
  });

  it("handles legacy supplement shape without deepDivePoints", () => {
    const payload = buildCareerPayload(true) as SajuCareerTimingPayload & { supplement?: Record<string, unknown> };
    payload.supplement = {
      deepInsightSummary: "레거시 보강",
      interpretationLenses: ["레거시 렌즈 1", "레거시 렌즈 2"],
      executionProtocol: {
        today: ["오늘 실행"],
      },
      visualExplainers: [],
    };

    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": payload,
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(
      <SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />,
    );

    expect(screen.getByText("심화 보강 섹션")).toBeInTheDocument();
    expect(screen.getByText("레거시 렌즈 1")).toBeInTheDocument();
  });

  it("deduplicates repeated today/thisWeek action lines in supplement render", () => {
    const payload = buildCareerPayload(true);
    payload.supplement = {
      ...payload.supplement!,
      executionProtocol: {
        today: ["이번 주 우선순위를 1개로 고정하고 담당·기한·체크 기준을 함께 기록해 실행하세요."],
        thisWeek: ["이번 주 우선순위를 1개로 고정하고 담당·기한·체크 기준을 함께 기록해 실행하세요."],
        thisMonth: ["이번 달 실행 지표를 정해 점검하세요."],
        avoid: ["기준 없는 과속 결정을 피하세요."],
      },
    };

    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": payload,
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(
      <SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />,
    );

    expect(
      screen.getAllByText("이번 주 우선순위를 1개로 고정하고 담당·기한·체크 기준을 함께 기록해 실행하세요.").length,
    ).toBe(1);
  });

  it("renders yearly calendar in fixed 9 sections and hides short-term supplement cards", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-yearly-action-calendar": buildYearlyPayload(),
      },
      summaries: {
        "saju-yearly-action-calendar": "연간 요약",
      },
      sectionsMap: {
        "saju-yearly-action-calendar": [],
      },
    };

    render(
      <SajuCollectionTabs result={result} serviceIds={["saju-yearly-action-calendar"]} onUnlockRequest={() => {}} />,
    );

    const orderedHeadings = [
      "한 줄 총평",
      "지금 인생의 큰 흐름",
      "올해의 의미",
      "올해 이후 10년의 흐름",
      "장기 패턴 해석",
      "올해의 핵심 테마 3가지",
      "분기별 실행 캘린더",
      "올해가 끝났을 때 남아야 할 것",
      "한 줄 결론",
    ].map((title) => screen.getByText(title));

    for (let index = 0; index < orderedHeadings.length - 1; index += 1) {
      expect(
        orderedHeadings[index]?.compareDocumentPosition(orderedHeadings[index + 1] as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }

    expect(screen.queryByText("오늘/이번 주 실행")).not.toBeInTheDocument();
    expect(screen.queryByText("이번 달/주의 항목")).not.toBeInTheDocument();
    expect(screen.queryByText("심화 보강 섹션")).not.toBeInTheDocument();
  });
});
