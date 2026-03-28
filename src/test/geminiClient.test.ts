import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Palja } from "@/types/result";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { getSajuAnalysis } from "@/lib/geminiClient";
import { buildDeterministicEnergyTrend, buildDeterministicWealthTrend } from "@/lib/sajuTrendEngine";

const samplePalja: Palja = {
  year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
  month: { gan: "을", ji: "축", ohengGan: "목", ohengJi: "토" },
  day: { gan: "경", ji: "오", ohengGan: "금", ohengJi: "화" },
  time: { gan: "신", ji: "유", ohengGan: "금", ohengJi: "금" },
};

const sampleOheng = [
  { element: "목" as const, count: 3, percentage: 38 },
  { element: "화" as const, count: 1, percentage: 13 },
  { element: "토" as const, count: 0, percentage: 0 },
  { element: "금" as const, count: 2, percentage: 25 },
  { element: "수" as const, count: 2, percentage: 25 },
];

const countSentences = (value: string) =>
  (value.match(/[^.!?]+[.!?]?/g) ?? []).map((item) => item.trim()).filter(Boolean).length;

const LIFETIME_SUPPLEMENT_CASES = [
  { serviceType: "saju-lifetime-roadmap", visualType: "timeline", key: "longTermFlow", value: "장기 흐름 축" },
  { serviceType: "saju-daeun-shift", visualType: "before-after", key: "transitionSignal", value: "전환 감지 축" },
  { serviceType: "saju-career-timing", visualType: "decision-matrix", key: "careerWindow", value: "커리어 판단 축" },
  { serviceType: "saju-wealth-flow", visualType: "flow-radar", key: "cashflowMap", value: "현금 흐름 축" },
  { serviceType: "saju-helper-network", visualType: "network-map", key: "helperMap", value: "관계 운영 축" },
  { serviceType: "saju-energy-balance", visualType: "energy-wave", key: "energyCurve", value: "에너지 흐름 축" },
  { serviceType: "saju-yearly-action-calendar", visualType: "calendar-map", key: "quarterThemes", value: ["분기 테마"] },
] as const;

const SUPPLEMENT_EXECUTION_MIN_BY_SERVICE: Record<
  (typeof LIFETIME_SUPPLEMENT_CASES)[number]["serviceType"],
  { today: number; thisWeek: number; thisMonth: number; avoid: number }
> = {
  "saju-lifetime-roadmap": { today: 1, thisWeek: 2, thisMonth: 2, avoid: 1 },
  "saju-daeun-shift": { today: 1, thisWeek: 2, thisMonth: 2, avoid: 1 },
  "saju-career-timing": { today: 0, thisWeek: 1, thisMonth: 1, avoid: 1 },
  "saju-wealth-flow": { today: 1, thisWeek: 2, thisMonth: 2, avoid: 1 },
  "saju-helper-network": { today: 1, thisWeek: 2, thisMonth: 2, avoid: 1 },
  "saju-energy-balance": { today: 1, thisWeek: 2, thisMonth: 2, avoid: 1 },
  "saju-yearly-action-calendar": { today: 0, thisWeek: 0, thisMonth: 0, avoid: 0 },
};

const buildSupplementFixture = (
  visualType: (typeof LIFETIME_SUPPLEMENT_CASES)[number]["visualType"],
  lenses?: string[],
) => ({
  deepInsightSummary: "보강 인사이트 요약",
  deepDivePoints: lenses ?? ["확장 인사이트 1", "확장 인사이트 2", "확장 인사이트 3"],
  executionProtocol: {
    today: ["오늘 실행 1"],
    thisWeek: ["주간 실행 1", "주간 실행 2"],
    thisMonth: ["월간 실행 1", "월간 실행 2"],
    avoid: ["주의 행동 1"],
  },
  checkpointQuestions: ["체크 질문 1", "체크 질문 2"],
  visualExplainers: [{ type: visualType, title: "시각 해설", items: ["포인트 1", "포인트 2"] }],
});

const buildLifetimePayloadForCase = (
  serviceType: (typeof LIFETIME_SUPPLEMENT_CASES)[number]["serviceType"],
  visualType: (typeof LIFETIME_SUPPLEMENT_CASES)[number]["visualType"],
  includeSupplement: boolean,
  customLenses?: string[],
) => {
  const common = {
    coreQuestion: "핵심 질문",
    coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
    actionNow: ["즉시 실행 1", "즉시 실행 2"],
    evidence: ["근거 1", "근거 2"],
    analysisBlocks: [
      {
        windowLabel: "기본 구간",
        timeRange: "0~2년",
        coreFlow: "구간 핵심 흐름",
        evidence: "구간 근거",
        opportunities: ["기회 1", "기회 2"],
        risks: ["리스크 1", "리스크 2"],
        actionStrategy: ["전략 1", "전략 2"],
      },
    ],
  };

  const supplement = includeSupplement ? { supplement: buildSupplementFixture(visualType, customLenses) } : {};

  switch (serviceType) {
    case "saju-lifetime-roadmap":
      return {
        ...common,
        longTermFlow: "장기 흐름 축",
        pivotMoments: ["전환 포인트 1"],
        tenYearStrategy: ["장기 전략 1"],
        stageTransitions: ["전환 신호 1"],
        narrativeDirection: "장기 방향성",
        maturityExpansionCleanup: ["정리 기준 1"],
        ...supplement,
      };
    case "saju-daeun-shift":
      return {
        ...common,
        transitionSignal: "전환 감지 축",
        ninetyDayActions: ["90일 실행 1"],
        avoidanceScenario: ["회피 시나리오 1"],
        transitionSignals: ["전환 신호 1"],
        changePoints: ["변화 포인트 1"],
        readinessActions: ["준비 행동 1"],
        phaseRoadmap: [
          {
            phaseLabel: "전환 전 준비기",
            ageRange: "30~31세",
            yearRange: "2024~2025년",
            coreFlow: "전환 전 준비기 핵심 흐름",
            evidence: "전환 전 준비기 근거",
            opportunities: ["준비기 기회 1", "준비기 기회 2"],
            risks: ["준비기 리스크 1", "준비기 리스크 2"],
            actionStrategy: ["준비기 행동 1", "준비기 행동 2"],
          },
          {
            phaseLabel: "전환기",
            ageRange: "32~33세",
            yearRange: "2026~2027년",
            coreFlow: "전환기 핵심 흐름",
            evidence: "전환기 근거",
            opportunities: ["전환기 기회 1", "전환기 기회 2"],
            risks: ["전환기 리스크 1", "전환기 리스크 2"],
            actionStrategy: ["전환기 행동 1", "전환기 행동 2"],
          },
          {
            phaseLabel: "전환 후 적응기",
            ageRange: "34~36세",
            yearRange: "2028~2030년",
            coreFlow: "전환 후 적응기 핵심 흐름",
            evidence: "전환 후 적응기 근거",
            opportunities: ["적응기 기회 1", "적응기 기회 2"],
            risks: ["적응기 리스크 1", "적응기 리스크 2"],
            actionStrategy: ["적응기 행동 1", "적응기 행동 2"],
          },
          {
            phaseLabel: "전환 후 안정기",
            ageRange: "37~42세",
            yearRange: "2031~2036년",
            coreFlow: "전환 후 안정기 핵심 흐름",
            evidence: "전환 후 안정기 근거",
            opportunities: ["안정기 기회 1", "안정기 기회 2"],
            risks: ["안정기 리스크 1", "안정기 리스크 2"],
            actionStrategy: ["안정기 행동 1", "안정기 행동 2"],
          },
        ],
        longHorizonDirection: [
          "1~2년 전환 직후 기준을 다시 세웁니다.",
          "3~5년 적응 구간에서 반복 구조를 고정합니다.",
          "6~10년 안정 구간에서 확장 여부를 점검합니다.",
        ],
        preAtPostDiff: ["전환 전후 차이 1"],
        ...supplement,
      };
    case "saju-career-timing":
      return {
        ...common,
        careerWindow: "커리어 판단 축",
        careerArcSummary: "커리어 장기축 요약",
        transitionSignal: "단계 전환 신호",
        currentYearFocus: "현재 연도 적용 포인트",
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
            transitionSignal: "초기 축적기 전환 신호",
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
            transitionSignal: "전환기 전환 신호",
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
            transitionSignal: "확장기 전환 신호",
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
            transitionSignal: "안정화기 전환 신호",
          },
        ],
        decisionTree: ["결정 트리 1"],
        executionChecklist: ["체크리스트 1"],
        workModeFit: "업무 방식 적합",
        decideNow: ["즉시 결정 1"],
        deferNow: ["보류 1"],
        gainVsLossPatterns: ["성과/손실 패턴 1"],
        decisionCriteria: ["판단 기준 1"],
        ...supplement,
      };
    case "saju-wealth-flow":
      return {
        ...common,
        cashflowMap: "현금 흐름 축",
        riskZones: ["리스크 구간 1"],
        assetRules: ["운영 규칙 1"],
        incomeStructure: ["수입 구조 1"],
        spendingPatterns: ["지출 패턴 1"],
        accumulateVsExpand: ["축적/확장 1"],
        financialNoGo: ["금지 구간 1"],
        ...supplement,
      };
    case "saju-helper-network":
      return {
        ...common,
        helperMap: "관계 운영 축",
        conflictPatterns: ["갈등 패턴 1"],
        networkGuide: ["운영 가이드 1"],
        helperProfiles: ["귀인 유형 1"],
        relationExpansionVsEntanglement: ["확장/얽힘 1"],
        conflictLoops: ["갈등 루프 1"],
        helperEntryWindows: ["유입 시기 1"],
        relationLayers: ["관계 레이어 1"],
        ...supplement,
      };
    case "saju-energy-balance":
      return {
        ...common,
        energyCurve: "에너지 흐름 축",
        innateProfile: "타고난 에너지 구조",
        operatingModel: ["운영 방식 1", "운영 방식 2", "운영 방식 3"],
        stageShiftMap: ["생활 단계 변화 1", "생활 단계 변화 2", "생활 단계 변화 3"],
        longRangeStrategy: ["0~2년 전략", "3~5년 전략", "6~10년 전략"],
        routineDesign: ["루틴 설계 1"],
        recoveryProtocol: ["회복 프로토콜 1"],
        immersionMode: ["몰입 방식 1"],
        burnoutSignals: ["번아웃 신호 1"],
        overloadAlerts: ["과부하 알림 1"],
        habitTweaks: ["습관 보정 1"],
        recoveryRoutines: ["회복 루틴 1"],
        ...supplement,
      };
    case "saju-yearly-action-calendar":
      return {
        ...common,
        oneLineTotalReview: "2026년은 인생 확장 이전의 기준 고정 해입니다.",
        currentLifeFlow: "지금은 성과보다 운영 기준을 정리하는 국면입니다.",
        meaningOfThisYear: "올해는 단기 승부보다 장기 운영 방식 확정의 의미가 큽니다.",
        tenYearFlow: [
          { periodLabel: "0~2년", phaseLabel: "기반 설정기", interpretation: "핵심 축을 정하고 반복 구조를 고정합니다." },
          { periodLabel: "3~5년", phaseLabel: "확장기", interpretation: "정리된 기준 위에서 확장 범위를 선택합니다." },
          { periodLabel: "6~10년", phaseLabel: "성과 정착기", interpretation: "확장보다 유지 가능한 구조를 완성합니다." },
        ],
        longPatternInterpretation: ["성급한 확장보다 기준 고정이 누적 성과를 만듭니다."],
        keyThemes: [
          { theme: "한 축 집중", interpretation: "분산보다 집중이 장기 누적을 만듭니다." },
          { theme: "기준 문장화", interpretation: "판단 기준을 문장으로 고정할수록 흔들림이 줄어듭니다." },
          { theme: "성과 구조화", interpretation: "숫자보다 반복 가능한 운영 구조를 남겨야 합니다." },
        ],
        quarterNarratives: [
          { quarter: "1분기", role: "기반 정비", meaning: "무엇을 남길지 정하는 시기", focus: "우선순위 고정", caution: "과속 시작" },
          { quarter: "2분기", role: "확장 시동", meaning: "기준 유지 범위 안에서 확장 점검", focus: "선택과 집중", caution: "과다 목표" },
          { quarter: "3분기", role: "성과 압축", meaning: "누적 성과를 압축하는 시기", focus: "완성도 점검", caution: "지연 방치" },
          { quarter: "4분기", role: "정리와 전환 준비", meaning: "다음 해 운영 기준 정리", focus: "잔여 과제 정리", caution: "마감 과속" },
        ],
        yearEndResidue: "연말에는 기준 문서, 결과물 기록, 관계 정리 구조가 남아야 합니다.",
        closingLine: "올해의 가치는 속도가 아니라 다음 10년을 버틸 기준을 남기는 데 있습니다.",
        lifecycleExecutionPattern: ["0~2년 실행 패턴 1", "3~5년 실행 패턴 1", "6~10년 실행 패턴 1"],
        phaseFocusMap: [
          { phaseLabel: "축적기", focusPoint: "축적 집중 포인트 1", executionPattern: "축적 실행 패턴 1", checkpoint: "축적 점검 기준 1" },
          { phaseLabel: "확장기", focusPoint: "확장 집중 포인트 1", executionPattern: "확장 실행 패턴 1", checkpoint: "확장 점검 기준 1" },
          { phaseLabel: "전환기", focusPoint: "전환 집중 포인트 1", executionPattern: "전환 실행 패턴 1", checkpoint: "전환 점검 기준 1" },
          { phaseLabel: "안정기", focusPoint: "안정 집중 포인트 1", executionPattern: "안정 실행 패턴 1", checkpoint: "안정 점검 기준 1" },
        ],
        accumulationTransitionFlow: [
          { axis: "쌓을 것", guidance: "축적 항목 1" },
          { axis: "버릴 것", guidance: "정리 항목 1" },
          { axis: "전환 트리거", guidance: "전환 신호 1" },
          { axis: "복구 규칙", guidance: "복구 기준 1" },
        ],
        longPracticeStrategy: ["장기 실천 전략 1", "장기 실천 전략 2", "장기 실천 전략 3"],
        yearToLifeBridge: "현재 위치와 장기 목적을 연결하는 실천 브리지",
        quarterlyGoals: ["분기 목표 1"],
        monthlyActions: ["월간 실행 1"],
        riskCalendar: ["리스크 캘린더 1"],
        quarterThemes: ["분기 테마"],
        monthlyPushCaution: ["월간 주의 1"],
        actionCheckpoints: ["체크포인트 1"],
        priorityQueue: ["우선순위 1"],
        ...supplement,
      };
    default:
      return common;
  }
};

const withLifetimeTopLevel = (
  serviceType: (typeof LIFETIME_SUPPLEMENT_CASES)[number]["serviceType"],
  payload: Record<string, unknown>,
) => {
  if (serviceType !== "saju-lifetime-roadmap") {
    return payload;
  }

  return {
    ...payload,
    lifetimeScore: 82,
    daeunPeriods: [
      {
        startAge: 20,
        endAge: 29,
        startYear: 2014,
        endYear: 2023,
        gan: "병",
        ji: "진",
        oheng: "화",
        score: 74,
        keyword: "기초 구간",
        isCurrent: false,
      },
      {
        startAge: 30,
        endAge: 39,
        startYear: 2024,
        endYear: 2033,
        gan: "갑",
        ji: "자",
        oheng: "목",
        score: 80,
        keyword: "현재 구간",
        isCurrent: true,
      },
      {
        startAge: 40,
        endAge: 49,
        startYear: 2034,
        endYear: 2043,
        gan: "을",
        ji: "축",
        oheng: "토",
        score: 78,
        keyword: "다음 구간",
        isCurrent: false,
      },
      {
        startAge: 50,
        endAge: 59,
        startYear: 2044,
        endYear: 2053,
        gan: "경",
        ji: "오",
        oheng: "금",
        score: 76,
        keyword: "확장 구간",
        isCurrent: false,
      },
    ],
    goldenPeriods: [
      {
        startAge: 40,
        endAge: 49,
        startYear: 2034,
        endYear: 2043,
        reason: "상승 구간",
      },
    ],
    personalityType: {
      title: "전략형",
      description: "설명",
      strengths: ["집중력"],
      weaknesses: ["과속"],
    },
  };
};


const assertPayloadKeyNormalized = (
  reportPayload: Record<string, unknown>,
  key: string,
  sourceValue: unknown,
) => {
  const value = reportPayload[key];
  if (Array.isArray(sourceValue)) {
    expect(Array.isArray(value)).toBe(true);
    expect((value as unknown[]).length).toBeGreaterThan(0);
    return;
  }

  expect(typeof value).toBe("string");
  expect((value as string).trim().length).toBeGreaterThan(0);
};

describe("getSajuAnalysis", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("calls saju-lifetime-api with manual timeout budget", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "summary",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Advice" }],
        lifetimeScore: 81,
        daeunPeriods: [],
        goldenPeriods: [],
        personalityType: { title: "strategist", description: "desc", strengths: ["focus"], weaknesses: ["rigidity"] },
      },
      error: null,
    });

    await getSajuAnalysis(
      {
        serviceType: "saju-lifetime-roadmap",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-manual-1" },
    );

    expect(invokeMock).toHaveBeenCalledWith(
      "saju-lifetime-api",
      expect.objectContaining({
        body: expect.objectContaining({
          serviceType: "saju-lifetime-roadmap",
          requestMeta: { source: "manual", traceId: "trace-manual-1" },
        }),
        timeout: 60_000,
      }),
    );
  });

  it("normalizes fixed lifetime windows into dynamic 4 blocks capped at 89", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T09:00:00.000Z"));

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "lifetime normalization",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        lifetimeScore: 87,
        daeunPeriods: [
          { startAge: 35, endAge: 44, startYear: 2029, endYear: 2038, gan: "jia", ji: "zi", oheng: "wood", score: 70, isCurrent: false },
          { startAge: 45, endAge: 54, startYear: 2039, endYear: 2048, gan: "yi", ji: "chou", oheng: "earth", score: 75, isCurrent: false },
          { startAge: 55, endAge: 64, startYear: 2049, endYear: 2058, gan: "geng", ji: "wu", oheng: "metal", score: 80, isCurrent: false },
        ],
        goldenPeriods: [{ startAge: 35, endAge: 44, startYear: 2029, endYear: 2038, reason: "growth window" }],
        personalityType: { title: "strategist", description: "desc", strengths: ["focus"], weaknesses: ["rigidity"] },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-lifetime-roadmap",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          profileMeta: {
            profileData: {
              calendarType: "solar",
              year: 1980,
              month: 6,
              day: 29,
              gender: "male",
            },
            timezone: "Asia/Seoul",
            currentYear: 2026,
          },
        },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-lifetime-dynamic" },
    );

    if ("lifetimeScore" in response) {
      expect(response.daeunPeriods).toHaveLength(4);
      expect(response.daeunPeriods.filter((item) => item.isCurrent)).toHaveLength(1);
      expect(response.daeunPeriods.every((item) => item.endAge <= 89)).toBe(true);
      expect(response.reportPayload.analysisBlocks).toHaveLength(4);
    }
  });


  it("parses 2026 overview payload fields", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 overview",
        sections: [{ title: "2026 quarter", interpretation: "Push in the first half and rebalance in the second half.", advice: "Adjust priorities by quarter." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "What should be checked first in 2026?",
          coreInsights: ["Momentum rises first in the first half."],
          actionNow: ["Lock one top priority for this month."],
          evidence: ["Push and adjustment signals appear together."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Early acceleration window.",
              evidence: "Focus signal is strong.",
              opportunities: ["New attempt"],
              risks: ["Overspeed"],
              actionStrategy: ["Lock the top priority first."],
            },
          ],
          quickSummary: {
            verdict: "Execute early, consolidate late",
            keywords: ["push", "order", "priority"],
            signalTrio: {
              interpretationIntensityLevel: "high",
              attentionLevel: "medium",
              changeSignalLevel: "medium",
              reason: "Momentum and adjustment signals coexist.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "launch", opportunity: "new attempt", caution: "overspeed", action: "lock one priority" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "results", caution: "dense schedule", action: "keep weekly rhythm" },
            { quarter: "Q3", quarterSummary: "adjust", opportunity: "improvement", caution: "overheat", action: "reset criteria" },
            { quarter: "Q4", quarterSummary: "wrap", opportunity: "stability", caution: "delay", action: "prepare next step" },
          ],
          focusCards: [
            { focusId: "saju-2026-overview", focusLabel: "overview", conclusion: "Key conclusion", dos: ["fix criteria", "review schedule"], donts: ["overspeed"], evidencePrimary: "base evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-2026-study-exam", focusLabel: "study", conclusion: "Keep a stable study routine.", dos: ["fix study hours"], donts: ["too many subjects"], evidencePrimary: "study evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-love-focus", focusLabel: "relationship", conclusion: "Control emotional speed.", dos: ["slow the pace"], donts: ["rush feelings"], evidencePrimary: "relationship evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-2026-wealth-business", focusLabel: "wealth", conclusion: "Set cashflow criteria first.", dos: ["set spending limit"], donts: ["reckless expansion"], evidencePrimary: "wealth evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-2026-investment-assets", focusLabel: "investment", conclusion: "Rules matter more than entry speed.", dos: ["write rules"], donts: ["impulse entry"], evidencePrimary: "investment evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-2026-career-aptitude", focusLabel: "career", conclusion: "Clarify the career axis first.", dos: ["define work criteria"], donts: ["impulse switch"], evidencePrimary: "career evidence", evidenceExtra: ["extra evidence"] },
            { focusId: "saju-2026-health-balance", focusLabel: "health", conclusion: "Protect the recovery routine.", dos: ["secure sleep"], donts: ["overload"], evidencePrimary: "health evidence", evidenceExtra: ["extra evidence"] },
          ],
          actionPlan90: {
            day30: ["30-day review"],
            day60: ["60-day adjust"],
            day90: ["90-day close"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-overview",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-2026-overview" },
    );

    expect(response.serviceType).toBe("saju-2026-overview");
    if (response.serviceType === "saju-2026-overview") {
      expect(response.reportPayload.quickSummary.signalTrio.attentionLevel.length).toBeGreaterThan(0);
      expect(response.reportPayload.yearTimeline).toHaveLength(4);
      expect(response.reportPayload.focusCards).toHaveLength(7);
      response.reportPayload.focusCards.forEach((card) => {
        expect(countSentences(card.conclusion)).toBeGreaterThanOrEqual(2);
        expect(countSentences(card.conclusion)).toBeLessThanOrEqual(4);
      });
    }
  });

  it("parses focused 2026 study payload fields", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 study",
        sections: [{ title: "focus flow", interpretation: "Study momentum rises in the first half.", advice: "Lock the routine first." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "What should be prioritized for study in 2026?",
          coreInsights: ["The first-half focus trend is stronger."],
          actionNow: ["Fix the weekly study routine first."],
          evidence: ["Wood energy supports continuity."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "This is the window to build study speed.",
              evidence: "Early momentum appears first.",
              opportunities: ["Focus on core subjects"],
              risks: ["Too many parallel subjects"],
              actionStrategy: ["Use the same time block every day for the main subject."],
            },
          ],
          quickSummary: {
            verdict: "Focus early, consolidate late",
            keywords: ["focus", "routine", "review"],
            signalTrio: {
              interpretationIntensityLevel: "high",
              attentionLevel: "medium",
              changeSignalLevel: "medium",
              reason: "Focus comes early and review pressure rises later.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "launch", opportunity: "claim pace", caution: "overspeed", action: "fix one main subject" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "score rebound", caution: "dense schedule", action: "stabilize answer routine" },
            { quarter: "Q3", quarterSummary: "adjust", opportunity: "patch weaknesses", caution: "drop in focus", action: "analyze mock tests" },
            { quarter: "Q4", quarterSummary: "harvest", opportunity: "stable performance", caution: "late delay", action: "check final review notes" },
          ],
          studyRhythm: "In the first half, pace builds quickly. In the second half, review quality creates results.",
          examWindows: ["Q2 focus window", "Q4 final window"],
          mistakeTriggers: ["Adding too many subjects at once", "Changing the routine too often"],
          executionGuide: ["Fix the answer routine twice a week.", "Log the time used for practice sets."],
          evidenceNotes: ["Wood energy supports sustained concentration.", "Later review rhythm matters more than early speed."],
          studyActionReport: {
            coreDiagnosis: {
              headline: "Study execution quality decides conversion in 2026.",
              summary: "Keep routine and review cadence stable to protect score volatility.",
              confidenceNote: "If weekly checks are skipped, outcomes swing quickly.",
            },
            keyQuestion: "Which execution pattern should be fixed first in 2026?",
            keyInsights: ["Fix weekly cadence first", "Convert mock errors into checklist", "Narrow final range late"],
            immediateActions: {
              startNow: ["Start one fixed core-subject block daily", "Start weekly mock review loop"],
              stopNow: ["Stop adding too many subjects at once", "Stop changing routine after one bad day"],
              prepNow: ["Prepare one scoreboard for schedule + error type", "Prepare interview/written scenario split"],
            },
            yearFlowSummary: {
              preparationPhase: "Preparation phase narrative.",
              accelerationPhase: "Acceleration phase narrative.",
              showdownPhase: "Showdown phase narrative.",
              wrapUpPhase: "Wrap-up phase narrative.",
            },
            quarterlyDetailed: [
              {
                period: "1~3월",
                strengths: ["Early focus strength 1", "Early focus strength 2"],
                risks: ["Early risk 1", "Early risk 2"],
                recommendedStrategies: ["Early strategy 1", "Early strategy 2"],
                checkQuestionOrTip: "Q1 check question.",
              },
              {
                period: "4~6월",
                strengths: ["Mid strength 1", "Mid strength 2"],
                risks: ["Mid risk 1", "Mid risk 2"],
                recommendedStrategies: ["Mid strategy 1", "Mid strategy 2"],
                checkQuestionOrTip: "Q2 check question.",
              },
              {
                period: "7~9월",
                strengths: ["Late strength 1", "Late strength 2"],
                risks: ["Late risk 1", "Late risk 2"],
                recommendedStrategies: ["Late strategy 1", "Late strategy 2"],
                checkQuestionOrTip: "Q3 check question.",
              },
              {
                period: "10~12월",
                strengths: ["Final strength 1", "Final strength 2"],
                risks: ["Final risk 1", "Final risk 2"],
                recommendedStrategies: ["Final strategy 1", "Final strategy 2"],
                checkQuestionOrTip: "Q4 check question.",
              },
            ],
            examTypeGuides: {
              writtenExam: ["Written strategy 1", "Written strategy 2"],
              interviewOrOral: ["Interview strategy 1", "Interview strategy 2"],
              longTermLearning: ["Long strategy 1", "Long strategy 2"],
            },
            failurePatterns: ["Failure pattern 1", "Failure pattern 2"],
            performanceStrategy: {
              studyMethod: ["Method strategy 1", "Method strategy 2"],
              lifeManagement: ["Life strategy 1", "Life strategy 2"],
              mentalManagement: ["Mental strategy 1", "Mental strategy 2"],
            },
            plainEvidence: ["Plain evidence 1", "Plain evidence 2"],
            finalSummary: ["Final guide 1", "Final guide 2"],
          },
          actionPlan90: {
            day30: ["fix study time block"],
            day60: ["organize answer pattern"],
            day90: ["close the real-test routine"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-study-exam",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["study"],
      },
      { source: "manual", traceId: "trace-2026-study" },
    );

    expect(response.serviceType).toBe("saju-2026-study-exam");
    if (response.serviceType === "saju-2026-study-exam") {
      expect(response.reportPayload.studyRhythm.toLowerCase()).toContain("first half");
      expect(countSentences(response.reportPayload.studyRhythm)).toBeGreaterThanOrEqual(2);
      expect(countSentences(response.reportPayload.studyRhythm)).toBeLessThanOrEqual(24);
      expect(response.reportPayload.examWindows).toHaveLength(2);
      expect(response.reportPayload.examWindows[0]).toContain("Q2");
      expect(response.reportPayload.mistakeTriggers).toHaveLength(2);
      expect(response.reportPayload.executionGuide.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.evidenceNotes).toHaveLength(2);
      expect(response.reportPayload.studyActionReport).toBeDefined();
      expect(response.reportPayload.studyActionReport?.keyInsights).toHaveLength(3);
      expect(response.reportPayload.studyActionReport?.quarterlyDetailed).toHaveLength(4);
      expect(response.reportPayload.studyActionReport?.quarterlyDetailed[0]?.period).toBe("1~3월");
      expect(response.reportPayload.studyActionReport?.examTypeGuides.writtenExam.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.performanceStrategy.studyMethod.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds focused study payload from legacy focus card fallback", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 study",
        sections: [
          { title: "study", interpretation: "In exam prep, priority matters more than speed.", advice: "Do not fragment the routine." },
        ],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "What should be locked first to improve study outcomes in 2026?",
          coreInsights: ["Fast early accumulation is advantageous."],
          actionNow: ["Lock the core subject first."],
          evidence: ["Early concentration signals are strong."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "This is the window to build basic stamina.",
              evidence: "Early concentration is visible.",
              opportunities: ["Claim the core subject early"],
              risks: ["Overspeed in subject expansion"],
              actionStrategy: ["Fix the practical routine first."],
            },
          ],
          quickSummary: {
            verdict: "Early lead matters.",
            keywords: ["lead", "focus", "routine"],
            signalTrio: {
              interpretationIntensityLevel: "medium",
              attentionLevel: "medium",
              changeSignalLevel: "medium",
              reason: "Early focus and mid-cycle adjustment appear together.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "launch", opportunity: "claim pace", caution: "overspeed", action: "fix the core subject" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "score rebound", caution: "dense schedule", action: "keep weekly rhythm" },
            { quarter: "Q3", quarterSummary: "adjust", opportunity: "patch weaknesses", caution: "drop in focus", action: "review mock tests" },
            { quarter: "Q4", quarterSummary: "harvest", opportunity: "stable performance", caution: "late shake", action: "final review" },
          ],
          focusCards: [
            {
              focusId: "saju-2026-study-exam",
              focusLabel: "study",
              conclusion: "Take the early lead and then convert that into stable review quality.",
              dos: ["Keep one core subject practical", "Maintain the answer routine weekly"],
              donts: ["Do not spread across too many subjects at once"],
              evidencePrimary: "Early drive is strong, while mid-cycle correction remains necessary.",
              evidenceExtra: ["Breaking the focus rhythm increases recovery cost."],
            },
          ],
          actionPlan90: {
            day30: ["fix the time block"],
            day60: ["organize answers"],
            day90: ["finish the real-test routine"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-study-exam",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["study"],
      },
      { source: "manual", traceId: "trace-2026-study-fallback" },
    );

    expect(response.serviceType).toBe("saju-2026-study-exam");
    if (response.serviceType === "saju-2026-study-exam") {
      expect(response.reportPayload.studyRhythm.length).toBeGreaterThan(0);
      expect(countSentences(response.reportPayload.studyRhythm)).toBeGreaterThanOrEqual(2);
      expect(countSentences(response.reportPayload.studyRhythm)).toBeLessThanOrEqual(24);
      expect(response.reportPayload.examWindows.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.examWindows.length).toBeLessThanOrEqual(4);
      expect(response.reportPayload.examWindows.join(" ").length).toBeGreaterThan(0);
      expect(response.reportPayload.mistakeTriggers.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.mistakeTriggers.join(" ").length).toBeGreaterThan(0);
      expect(response.reportPayload.evidenceNotes[0].length).toBeGreaterThan(0);
      expect(response.reportPayload.evidenceNotes.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.evidenceNotes.length).toBeLessThanOrEqual(4);
      expect(response.reportPayload.studyActionReport).toBeDefined();
      expect(response.reportPayload.studyActionReport?.keyQuestion.length).toBeGreaterThan(0);
      expect(response.reportPayload.studyActionReport?.keyInsights).toHaveLength(3);
      expect(response.reportPayload.studyActionReport?.immediateActions.startNow.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.immediateActions.stopNow.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.immediateActions.prepNow.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.quarterlyDetailed).toHaveLength(4);
      expect(response.reportPayload.studyActionReport?.quarterlyDetailed[3]?.period).toBe("10~12월");
      expect(response.reportPayload.studyActionReport?.failurePatterns.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.plainEvidence.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.studyActionReport?.finalSummary.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds wealth-business actionable fields from legacy focused payload", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 wealth",
        sections: [{ title: "wealth", interpretation: "Stabilize operating criteria before expansion.", advice: "Control leakage first." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "How should cashflow and business decisions be balanced in 2026?",
          coreInsights: ["Operational discipline matters more than speed."],
          actionNow: ["Fix spend approval criteria first."],
          evidence: ["Expansion pressure and leakage risk appear together."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Set operating criteria first.",
              evidence: "Signals shift quickly in early quarter.",
              opportunities: ["Lock one revenue axis"],
              risks: ["Over-spending"],
              actionStrategy: ["Split immediate vs review spending"],
            },
          ],
          quickSummary: {
            verdict: "Criteria first, expansion selective",
            keywords: ["criteria", "leakage", "cashflow"],
            signalTrio: {
              interpretationIntensityLevel: "high",
              attentionLevel: "high",
              changeSignalLevel: "high",
              reason: "Quarterly expansion and leakage signals overlap.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "stabilize", opportunity: "lock core axis", caution: "overspending", action: "fix approval rule" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "repeat buyers", caution: "fixed-cost jump", action: "limit expansion scope" },
            { quarter: "Q3", quarterSummary: "optimize", opportunity: "margin improvement", caution: "recovery delay", action: "check recovery cycle" },
            { quarter: "Q4", quarterSummary: "close", opportunity: "year-end reset", caution: "operator fatigue", action: "split close vs prep" },
          ],
          cashflowPulse: "Stabilize recurring revenue first, then expand selectively.",
          growthAxes: ["Strengthen recurring channel first.", "Expand only one to two channels at a time."],
          leakRisks: ["Unchecked discounting can reduce margin quickly.", "Unverified outsourcing can leak cashflow."],
          operatingRules: ["Separate instant decisions from review-required spending.", "Track margin and recovery cycle monthly."],
          evidenceNotes: ["This year shows overlapping expansion and leakage signals.", "Cost structure stability appears before growth acceleration."],
          actionPlan90: {
            day30: ["Fix spend approval board"],
            day60: ["Remove top leakage items"],
            day90: ["Review quarterly operating metrics"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-wealth-business",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["money", "business"],
      },
      { source: "manual", traceId: "trace-2026-wealth-fallback" },
    );

    expect(response.serviceType).toBe("saju-2026-wealth-business");
    if (response.serviceType === "saju-2026-wealth-business") {
      expect(response.reportPayload.oneLineDiagnosis.length).toBeGreaterThan(0);
      expect(response.reportPayload.keyPoints).toHaveLength(3);
      expect(response.reportPayload.easyInterpretationPoints.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.annualFlowSummary.length).toBeGreaterThan(0);
      expect(response.reportPayload.quarterlyFlowCards).toHaveLength(4);
      expect(response.reportPayload.quarterlyFlowCards[0]?.quarter).toBe("1분기");
      expect(response.reportPayload.quarterlyFlowCards[3]?.quarter).toBe("4분기");
      expect(response.reportPayload.revenueFlowDeepDive.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.businessManagementPoints.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.burnoutPreventionStrategies.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.actionChecklist.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.closingLine.length).toBeGreaterThan(0);
    }
  });

  it("builds investment action report from focused payload and fallback sources", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 investment",
        sections: [{ title: "investment", interpretation: "Hold criteria first.", advice: "Avoid impulse entry." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "How should investment timing be judged in 2026?",
          coreInsights: ["Rules matter more than speed."],
          actionNow: ["Fix your risk rule before entry."],
          evidence: ["Volatility can expand before direction is confirmed."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Set risk and exit criteria first.",
              evidence: "Fast signal change can trigger impulse entries.",
              opportunities: ["Criteria-based entries"],
              risks: ["Impulse entry"],
              actionStrategy: ["Write entry/exit criteria first"],
            },
          ],
          quickSummary: {
            verdict: "Rules first, selective entry",
            keywords: ["rules", "timing", "risk"],
            signalTrio: {
              interpretationIntensityLevel: "high",
              attentionLevel: "medium",
              changeSignalLevel: "high",
              reason: "Quarterly signals can flip quickly, so criteria discipline is critical.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "stabilize", opportunity: "criteria lock", caution: "impulse entry", action: "fix checklist" },
            { quarter: "Q2", quarterSummary: "selective", opportunity: "entry setup", caution: "leverage jump", action: "limit position size" },
            { quarter: "Q3", quarterSummary: "defensive", opportunity: "cash flexibility", caution: "revenge trading", action: "reduce turnover" },
            { quarter: "Q4", quarterSummary: "reset", opportunity: "rule reset", caution: "year-end overtrade", action: "review logs" },
          ],
          entryBias: "Preserve downside first, then scale only when criteria are met.",
          watchSignals: ["No clear trend with high volatility means wait mode."],
          riskAlerts: ["Adding leverage after loss can break account recovery."],
          capitalRules: ["Fix single-asset cap and stop-loss before any new entry."],
          evidenceNotes: ["Criteria consistency matters more than rapid entry this year."],
          investmentActionReport: {
            coreDiagnosis: {
              headline: "Rule discipline is the core edge this year.",
              summary: "Entry speed should come after risk-control readiness.",
            },
            keyQuestion: "Should I enter now or stay in wait mode?",
            keyInsights: ["Only one insight to force fallback expansion."],
            immediateActions: ["Write one immediate action to force fallback expansion."],
            quarterlyFlow: [{ quarter: "Q1", summary: "Q1 summary.", actionFocus: ["Q1 action"], riskFocus: ["Q1 risk"] }],
            assetClassGuides: {
              stocksEtf: ["Stock/ETF one line only."],
            },
            signalBoard: {
              watchSignals: ["Single watch signal."],
            },
            finalConclusion: ["Single conclusion line."],
          },
          actionPlan90: {
            day30: ["30d: lock risk checklist"],
            day60: ["60d: review rule violations"],
            day90: ["90d: rebalance position limits"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-investment-assets",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["money"],
      },
      { source: "manual", traceId: "trace-2026-investment-fallback" },
    );

    expect(response.serviceType).toBe("saju-2026-investment-assets");
    if (response.serviceType === "saju-2026-investment-assets") {
      expect(response.reportPayload.entryBias.length).toBeGreaterThan(0);
      expect(response.reportPayload.watchSignals.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.riskAlerts.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.capitalRules.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.evidenceNotes.length).toBeGreaterThanOrEqual(2);

      const actionable = response.reportPayload.investmentActionReport;
      expect(actionable).toBeDefined();
      if (!actionable) {
        return;
      }

      expect(actionable.coreDiagnosis.headline.length).toBeGreaterThan(0);
      expect(actionable.coreDiagnosis.summary.length).toBeGreaterThan(0);
      expect(actionable.keyQuestion.length).toBeGreaterThan(0);
      expect(actionable.keyInsights).toHaveLength(3);
      expect(actionable.immediateActions.length).toBeGreaterThanOrEqual(2);
      expect(actionable.absoluteCautions.length).toBeGreaterThanOrEqual(2);
      expect(actionable.quarterlyFlow).toHaveLength(4);
      expect(actionable.quarterlyFlow[0]?.quarter).toBe("1분기");
      expect(actionable.quarterlyFlow[3]?.quarter).toBe("4분기");
      expect(actionable.quarterlyFlow[0]?.actionFocus.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(actionable.quarterlyFlow[0]?.riskFocus.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(actionable.assetClassGuides.stocksEtf.length).toBeGreaterThanOrEqual(2);
      expect(actionable.assetClassGuides.realEstate.length).toBeGreaterThanOrEqual(2);
      expect(actionable.assetClassGuides.cashSavings.length).toBeGreaterThanOrEqual(2);
      expect(actionable.assetClassGuides.cryptoHighVolatility.length).toBeGreaterThanOrEqual(2);
      expect(actionable.signalBoard.watchSignals.length).toBeGreaterThanOrEqual(2);
      expect(actionable.signalBoard.entrySignals.length).toBeGreaterThanOrEqual(2);
      expect(actionable.riskAlerts.length).toBeGreaterThanOrEqual(2);
      expect(actionable.practicalChecklist.length).toBeGreaterThanOrEqual(4);
      expect(actionable.plainEvidence.length).toBeGreaterThanOrEqual(2);
      expect(actionable.flowTo2027.length).toBeGreaterThan(0);
      expect(actionable.finalConclusion.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds health actionable fields from legacy focused payload and fallback sources", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 health",
        sections: [{ title: "health", interpretation: "Recovery rhythm needs to be fixed first.", advice: "Lower overload quickly." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "How should health rhythm be managed in 2026?",
          coreInsights: ["Sleep rhythm and recovery spacing are key."],
          actionNow: ["Fix two recovery blocks in your weekly schedule."],
          evidence: ["Overload and recovery signals overlap by quarter."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Start with sleep and recovery baseline.",
              evidence: "Sleep delay and daytime fatigue can appear together.",
              opportunities: ["Routine reset"],
              risks: ["Overload carryover"],
              actionStrategy: ["Fix bedtime routine first"],
            },
          ],
          quickSummary: {
            verdict: "Detect overload early and secure recovery rhythm first.",
            keywords: ["sleep", "recovery", "overload"],
            signalTrio: {
              interpretationIntensityLevel: "medium",
              attentionLevel: "medium",
              changeSignalLevel: "medium",
              reason: "Activity and recovery windows overlap across quarters.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "reset", opportunity: "routine", caution: "sleep delay", action: "fix bedtime" },
            { quarter: "Q2", quarterSummary: "increase", opportunity: "energy", caution: "digestive load", action: "fix meal spacing" },
            { quarter: "Q3", quarterSummary: "guard", opportunity: "pace control", caution: "irritability", action: "reduce stimulation" },
            { quarter: "Q4", quarterSummary: "stabilize", opportunity: "recovery quality", caution: "fatigue residue", action: "weekly review" },
          ],
          energyRhythm: "Stabilize recovery spacing first.",
          recoveryPriorities: [
            "Prioritize fixed sleep timing first.",
            "Keep meal rhythm stable to reduce digestive burden.",
          ],
          overloadSignals: [
            "If sleep onset is delayed and wake-ups increase, reduce schedule intensity.",
            "If fatigue remains even after rest, prioritize recovery blocks first.",
          ],
          routineChecklist: [
            "Fix one recovery habit in morning/daytime/evening blocks.",
            "Reserve weekly recovery slots before adding work blocks.",
          ],
          evidenceNotes: ["Low-point management matters more than peak intensity in this flow."],
          focusCards: [
            {
              focusId: "saju-2026-health-balance",
              focusLabel: "health",
              conclusion: "Stabilize recovery rhythm before intensity expansion.",
              dos: ["Fix bedtime", "Reserve weekly recovery blocks"],
              donts: ["Ignore repeated overload signs"],
              evidencePrimary: "Sleep and overload indicators move together.",
              evidenceExtra: ["Quarterly response speed affects next-quarter recovery width."],
            },
          ],
          actionPlan90: {
            day30: ["Fix bedtime and wake-up schedule"],
            day60: ["Track overload checklist weekly"],
            day90: ["Rebalance recovery priorities"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-2026-health-balance",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["health"],
      },
      { source: "manual", traceId: "trace-2026-health-fallback" },
    );

    expect(response.serviceType).toBe("saju-2026-health-balance");
    if (response.serviceType === "saju-2026-health-balance") {
      expect(response.reportPayload.energyRhythm.length).toBeGreaterThan(0);
      expect(response.reportPayload.bodyPatterns.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.quarterlyFlowCards).toHaveLength(4);
      expect(response.reportPayload.quarterlyFlowCards[0]?.quarter).toBe("1분기");
      expect(response.reportPayload.quarterlyFlowCards[3]?.quarter).toBe("4분기");
      expect(response.reportPayload.overloadChecklist.length).toBeGreaterThanOrEqual(6);
      expect(response.reportPayload.recoveryPriorities).toHaveLength(4);
      expect(response.reportPayload.routineGuide.morning.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.routineGuide.daytime.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.routineGuide.evening.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.routineGuide.weekly.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.evidenceNotes.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("parses focused 2026 love payload with decision tools and faq", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 love",
        sections: [{ title: "love flow", interpretation: "Relationship pace needs calibration.", advice: "Track promise consistency." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "How should relationship speed and direction be managed in 2026?",
          coreInsights: ["Signals for approach and caution appear together."],
          actionNow: ["Fix three relationship criteria first."],
          evidence: ["Emotional intensity changes quickly by quarter."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Build trust criteria first.",
              evidence: "Approach signals appear quickly.",
              opportunities: ["Start deeper conversation"],
              risks: ["Rush commitment"],
              actionStrategy: ["Fix one weekly check-in routine."],
            },
          ],
          quickSummary: {
            verdict: "Calibrate speed with criteria",
            keywords: ["speed", "trust", "criteria"],
            signalTrio: {
              interpretationIntensityLevel: "high",
              attentionLevel: "medium",
              changeSignalLevel: "high",
              reason: "Approach and caution signals overlap.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "start", opportunity: "deeper talk", caution: "overspeed", action: "fix relationship criteria" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "promise quality", caution: "expectation clash", action: "review weekly rhythm" },
            { quarter: "Q3", quarterSummary: "verify", opportunity: "future planning", caution: "emotional overheat", action: "slow one step" },
            { quarter: "Q4", quarterSummary: "stabilize", opportunity: "public commitment", caution: "fatigue", action: "split roles" },
          ],
          relationshipFlow: "The first half moves fast. The second half separates stable ties from unstable ties.",
          approachSignals: [
            "If the other person proposes follow-up plans first, increase depth slowly and check promise completion rate.",
            "If conversation topics move toward future plans, proceed one step and check conflict recovery speed.",
          ],
          cautionPatterns: [
            "If commitment is rushed in the early phase, hold pace and check expectation alignment.",
            "If assumption-based talk accumulates, pause and verify facts first.",
          ],
          relationshipGuide: [
            "If key decisions arise, wait one day and reconfirm the same conclusion before proceeding.",
            "If contact volume rises but execution drops, prioritize promise completion checks.",
          ],
          marriageDecisionBoard: [
            "If two marriage conversations end with concrete agreement, proceed to next-step scheduling and check execution rate.",
            "If life-role-finance agreements are missing, hold discussion and check 30-day agreement completion.",
            "If conflict recovery repeatedly fails, stop progression and check 2-week recovery trend.",
          ],
          meetingChannelPriority: [
            "If introductions from trusted contacts convert to follow-up meetings, keep weekly outreach and check monthly conversion count.",
            "If community conversations sustain depth, keep attendance and check two-week reconnection rate.",
          ],
          greenFlagChecklist: [
            "If alternatives are proposed and executed after schedule changes, mark as trust expansion signal.",
            "If post-conflict dialogue restarts within 24 hours, mark as repair resilience signal.",
          ],
          redFlagChecklist: [
            "If agreed decisions are repeatedly reversed, mark as hold signal.",
            "If future planning is repeatedly avoided, mark as caution signal.",
          ],
          conflictProtocol: [
            "If emotional intensity is high, spend 24 hours on fact confirmation and check whether one core issue is sentence-defined.",
            "If agreement is still absent after 24 hours, reset role and deadline within 72 hours and check recurrence.",
          ],
          consumerFaq: [
            { question: "Can I define the relationship now?", answer: "Proceed only after two weeks of stable promise completion and check follow-up conversion." },
            { question: "When should I introduce parents?", answer: "Proceed after two successful conflict recoveries and check three core agreements." },
            { question: "When should marriage be discussed?", answer: "Raise the topic after repeated future-planning talks and check one-month agreement execution." },
            { question: "What if contact drops?", answer: "Verify schedule reality first and check promise fulfillment changes." },
            { question: "What if marriage is postponed?", answer: "Request a concrete date and check deadline compliance." },
            { question: "Good conditions but anxiety?", answer: "Re-evaluate rhythm, repair, and execution; check two-of-three pass." },
            { question: "Can long-distance work?", answer: "Fix weekly communication and monthly visits; check recovery when routine breaks." },
            { question: "Continue or stop?", answer: "Apply stop-loss rule first and check whether repair signals recur." },
          ],
          evidenceNotes: ["Joint signal pattern requires pacing control.", "Quarterly checks improve decision precision."],
          actionPlan90: {
            day30: ["fix criteria"],
            day60: ["review hold/proceed rules"],
            day90: ["final relationship stage decision"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-love-focus",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["love"],
      },
      { source: "manual", traceId: "trace-2026-love" },
    );

    expect(response.serviceType).toBe("saju-love-focus");
    if (response.serviceType === "saju-love-focus") {
      expect(response.reportPayload.marriageDecisionBoard.length).toBe(3);
      expect(response.reportPayload.meetingChannelPriority.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.greenFlagChecklist.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.redFlagChecklist.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.conflictProtocol.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.consumerFaq).toHaveLength(8);
      expect(response.reportPayload.consumerFaq[0]?.question).toBe("지금 고백하거나 관계를 정의해도 되나요?");
      expect(response.reportPayload.analysisBlocks[0]?.actionStrategy.length ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it("builds focused 2026 love decision tools from fallback fields", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026 love fallback",
        sections: [{ title: "love", interpretation: "Balance speed and trust.", advice: "Avoid assumptions." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "How do I navigate love in 2026?",
          coreInsights: ["Signals rise quickly in Q2."],
          actionNow: ["Fix one relationship rule."],
          evidence: ["Mixed approach/caution signals."],
          analysisBlocks: [
            {
              windowLabel: "Q1",
              timeRange: "Q1",
              coreFlow: "Build trust baseline.",
              evidence: "The first half is volatile.",
              opportunities: ["Start honest dialogue"],
              risks: ["Rush into labels"],
              actionStrategy: ["Track weekly promise completion."],
            },
          ],
          quickSummary: {
            verdict: "Pace matters more than intensity.",
            keywords: ["pace", "trust", "checks"],
            signalTrio: {
              interpretationIntensityLevel: "medium",
              attentionLevel: "medium",
              changeSignalLevel: "medium",
              reason: "Entry and caution signals coexist.",
            },
          },
          yearTimeline: [
            { quarter: "Q1", quarterSummary: "start", opportunity: "deeper talk", caution: "overspeed", action: "set one rule" },
            { quarter: "Q2", quarterSummary: "expand", opportunity: "future talk", caution: "clash", action: "check agreement" },
            { quarter: "Q3", quarterSummary: "verify", opportunity: "stability", caution: "fatigue", action: "rebalance speed" },
            { quarter: "Q4", quarterSummary: "settle", opportunity: "public step", caution: "noise", action: "split roles" },
          ],
          focusCards: [
            {
              focusId: "saju-love-focus",
              focusLabel: "love",
              conclusion: "If signals hold, move one step; if repair fails, hold or stop.",
              dos: ["Define one relationship rule", "Check promise completion weekly"],
              donts: ["Do not force commitment in the first phase"],
              evidencePrimary: "Approach and caution indicators coexist.",
              evidenceExtra: ["Decision quality improves with cadence checks."],
            },
          ],
          actionPlan90: {
            day30: ["define rule"],
            day60: ["review cadence"],
            day90: ["decide stage"],
          },
          consistencyMeta: {
            targetYear: 2026,
            ganji: "byeong-o",
            age: 31,
            generatedAt: "2026-03-24T09:00:00.000Z",
          },
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-love-focus",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["love"],
      },
      { source: "manual", traceId: "trace-2026-love-fallback" },
    );

    expect(response.serviceType).toBe("saju-love-focus");
    if (response.serviceType === "saju-love-focus") {
      expect(response.reportPayload.marriageDecisionBoard.length).toBe(3);
      expect(response.reportPayload.meetingChannelPriority.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.greenFlagChecklist.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.redFlagChecklist.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.conflictProtocol.length).toBeGreaterThanOrEqual(2);
      expect(response.reportPayload.consumerFaq).toHaveLength(8);
      expect(response.reportPayload.consumerFaq.every((item) => item.question.length > 0 && item.answer.length > 0)).toBe(true);
    }
  });


  it("parses service-specific payload for saju-career-timing", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "career summary",
        sections: [{ title: "career", interpretation: "A transition is in progress.", advice: "Prepare the next step." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["career insight"],
          actionNow: ["act now"],
          evidence: ["base evidence"],
          careerWindow: "2026-2027 decision window",
          decisionTree: ["stay", "expand"],
          executionChecklist: ["update portfolio", "clean the recommendation loop"],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-career-timing",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-career-1" },
    );

    expect(response.serviceType).toBe("saju-career-timing");
    if (response.serviceType === "saju-career-timing") {
      expect(response.reportPayload.careerArcSummary?.length ?? 0).toBeGreaterThan(0);
      expect(response.reportPayload.stageFlow).toHaveLength(4);
      expect(response.reportPayload.stageFlow?.map((stage) => stage.stageId)).toEqual([
        "build-up",
        "transition",
        "expansion",
        "stabilization",
      ]);
      expect(response.reportPayload.transitionSignal?.length ?? 0).toBeGreaterThan(0);
      expect(response.reportPayload.currentYearFocus?.length ?? 0).toBeGreaterThan(0);
      expect(response.reportPayload.executionChecklist[0].length).toBeGreaterThan(0);
      expect(response.reportPayload.analysisBlocks).toHaveLength(4);
    }
  });

  it("builds 4-stage career flow fallback and keeps current-year point as auxiliary", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "career long-flow summary",
        sections: [{ title: "career", interpretation: "The long axis needs to be separated clearly.", advice: "Fix the current criteria first." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["core insight 1", "core insight 2"],
          actionNow: ["priority action 1", "priority action 2"],
          evidence: ["evidence 1", "evidence 2"],
          careerWindow: "Separate role fit from environment fit and align them over the long term.",
          decisionTree: ["decision axis 1", "decision axis 2"],
          executionChecklist: ["execution check 1", "execution check 2"],
          decideNow: ["decide now 1"],
          deferNow: ["defer later 1"],
          gainVsLossPatterns: ["pattern 1"],
          decisionCriteria: ["criterion 1"],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-career-timing",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-career-fallback" },
    );

    expect(response.serviceType).toBe("saju-career-timing");
    if (response.serviceType === "saju-career-timing") {
      const stageFlow = response.reportPayload.stageFlow ?? [];
      expect(stageFlow).toHaveLength(4);
      expect(stageFlow.map((stage) => stage.stageId)).toEqual([
        "build-up",
        "transition",
        "expansion",
        "stabilization",
      ]);
      expect(response.reportPayload.analysisBlocks).toHaveLength(4);
      expect(new Set(stageFlow.map((stage) => stage.coreFlow)).size).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.currentYearFocus?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("builds daeun phase roadmap and long horizon fallbacks when model omits new fields", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "daeun shift summary",
        sections: [{ title: "transition", interpretation: "A change phase is active.", advice: "Lower the number of active priorities." }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreQuestion: "What should be released and what should be prepared in the current transition phase?",
          coreInsights: ["Criteria reset is required."],
          actionNow: ["Reduce the number of current priorities."],
          evidence: ["Transition signals are visible."],
          transitionSignal: "2026 opening transition signal",
          ninetyDayActions: ["Shrink one decision today.", "Clear one overloaded schedule this week."],
          avoidanceScenario: ["Do not repeat reactive decisions this week."],
          transitionSignals: ["Change signals are getting stronger.", "Shaking is still present.", "Priority noise remains."],
          changePoints: ["Repeated overspeed is visible."],
          readinessActions: ["Fix one priority today."],
          preAtPostDiff: ["Before transition vs after transition 1.", "Before transition vs after transition 2.", "Before transition vs after transition 3."],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-daeun-shift",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          profileMeta: {
            profileData: {
              calendarType: "solar",
              year: 1995,
              month: 6,
              day: 29,
              gender: "male",
            },
            timezone: "Asia/Seoul",
            currentYear: 2026,
          },
        },
        interests: ["path"],
      },
      { source: "manual", traceId: "trace-daeun-phase-fallback" },
    );

    expect(response.serviceType).toBe("saju-daeun-shift");
    if (response.serviceType === "saju-daeun-shift") {
      expect(response.reportPayload.phaseRoadmap).toHaveLength(4);
      expect(response.reportPayload.longHorizonDirection).toHaveLength(3);
      expect(response.reportPayload.longHorizonDirection[0]).toContain("1~2");
      expect(response.reportPayload.longHorizonDirection[1]).toContain("3~5");
      expect(response.reportPayload.longHorizonDirection[2]).toContain("6~10");

      const phaseLabels = response.reportPayload.phaseRoadmap.map((phase) => phase.phaseLabel);
      expect(new Set(phaseLabels).size).toBeGreaterThanOrEqual(4);
      const transitionPhase = response.reportPayload.phaseRoadmap[1]?.coreFlow ?? "";
      const postTransitionSentenceCount = response.reportPayload.phaseRoadmap
        .slice(2)
        .reduce((acc, phase) => acc + countSentences(phase.coreFlow), 0);
      expect(transitionPhase.length).toBeGreaterThan(0);
      expect(postTransitionSentenceCount).toBeGreaterThanOrEqual(countSentences(transitionPhase));
    }
  });


  it("overrides model wealth series with deterministic manseryeok series and evidence", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "wealth flow",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["core insight"],
          actionNow: ["action 1"],
          evidence: ["evidence 1"],
          cashflowMap: "Model cashflow summary",
          riskZones: ["risk 1"],
          assetRules: ["rule 1"],
          assetTrendSeries: [
            { label: "now", value: 44 },
            { label: "1y", value: 52 },
            { label: "3y", value: 61 },
            { label: "5y", value: 57 },
            { label: "10y", value: 69 },
          ],
        },
      },
      error: null,
    });

    const yongsin = [sampleOheng[0].element];
    const response = await getSajuAnalysis(
      {
        serviceType: "saju-wealth-flow",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          yongsin,
          profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
        },
        interests: ["money"],
      },
      { source: "manual", traceId: "trace-wealth-series" },
    );

    expect(response.serviceType).toBe("saju-wealth-flow");
    if (response.serviceType === "saju-wealth-flow") {
      const deterministic = buildDeterministicWealthTrend({
        oheng: sampleOheng,
        yongsin,
        profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
      });
      expect(response.reportPayload.assetTrendSeries).toHaveLength(5);
      expect(response.reportPayload.assetTrendSeries).toEqual(deterministic.series);
      expect(response.reportPayload.assetTrendEvidence).toEqual(deterministic.pointEvidence);
      expect(response.reportPayload.assetTrendSeries.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);
    }

    vi.useRealTimers();
  });

  it("generates deterministic energy series and evidence even without model series", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "energy balance",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["core insight"],
          actionNow: ["action 1"],
          evidence: ["evidence 1"],
          energyCurve: "Model energy summary",
          routineDesign: ["routine 1"],
          recoveryProtocol: ["recovery 1"],
        },
      },
      error: null,
    });

    const yongsin = [sampleOheng[0].element];
    const response = await getSajuAnalysis(
      {
        serviceType: "saju-energy-balance",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
        interests: ["self"],
      },
      { source: "manual", traceId: "trace-energy-fallback" },
    );

    expect(response.serviceType).toBe("saju-energy-balance");
    if (response.serviceType === "saju-energy-balance") {
      const deterministic = buildDeterministicEnergyTrend({
        oheng: sampleOheng,
        yongsin,
        profileMeta: { timezone: "Asia/Seoul" },
      });
      expect(response.reportPayload.innateProfile.length).toBeGreaterThan(0);
      expect(response.reportPayload.operatingModel.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.stageShiftMap.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.longRangeStrategy.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.longRangeStrategy.some((item) => item.includes("0~2"))).toBe(true);
      expect(response.reportPayload.longRangeStrategy.some((item) => item.includes("3~5"))).toBe(true);
      expect(response.reportPayload.longRangeStrategy.some((item) => item.includes("6~10"))).toBe(true);
      expect(response.reportPayload.analysisBlocks.length).toBeGreaterThanOrEqual(4);
      expect(response.reportPayload.energyRhythmSeries).toHaveLength(6);
      expect(response.reportPayload.energyRhythmSeries).toEqual(deterministic.series);
      expect(response.reportPayload.energyRhythmEvidence).toEqual(deterministic.pointEvidence);
      expect(response.reportPayload.energyRhythmSeries.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);
    }

    vi.useRealTimers();
  });

  it.each(LIFETIME_SUPPLEMENT_CASES)(
    "parses supplement for %s while preserving existing payload fields",
    async ({ serviceType, visualType, key, value }) => {
      invokeMock.mockResolvedValueOnce({
        data: {
          summary: "supplement test",
          sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
          reportTemplateVersion: "saju-report-v2",
          ...withLifetimeTopLevel(
            serviceType,
            { reportPayload: buildLifetimePayloadForCase(serviceType, visualType, true) },
          ),
        },
        error: null,
      });

      const yongsin = [sampleOheng[0].element];
      const response = await getSajuAnalysis(
        {
          serviceType,
          sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
          interests: ["career"],
        },
        { source: "manual", traceId: `trace-supplement-${serviceType}` },
      );

      expect(response.serviceType).toBe(serviceType);
      const reportPayload = (response as { reportPayload: Record<string, unknown> }).reportPayload;
      const supplement = reportPayload.supplement as {
        visualExplainers: Array<{ type: string }>;
      };
      expect(supplement).toBeTruthy();
      expect(supplement.visualExplainers[0]?.type).toBe(visualType);
      assertPayloadKeyNormalized(reportPayload, key, value);
    },
  );

  it.each(LIFETIME_SUPPLEMENT_CASES)(
    "builds supplement fallback when model omits supplement: %s",
    async ({ serviceType, visualType, key, value }) => {
      invokeMock.mockResolvedValueOnce({
        data: {
          summary: "supplement fallback test",
          sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
          reportTemplateVersion: "saju-report-v2",
          ...withLifetimeTopLevel(
            serviceType,
            { reportPayload: buildLifetimePayloadForCase(serviceType, visualType, false) },
          ),
        },
        error: null,
      });

      const yongsin = [sampleOheng[0].element];
      const response = await getSajuAnalysis(
        {
          serviceType,
          sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
          interests: ["career"],
        },
        { source: "manual", traceId: `trace-supplement-fallback-${serviceType}` },
      );

      const reportPayload = (response as { reportPayload: Record<string, unknown> }).reportPayload;
      const supplement = reportPayload.supplement as {
        deepInsightSummary: string;
        deepDivePoints: string[];
        executionProtocol: { today: string[]; thisWeek: string[]; thisMonth: string[]; avoid: string[] };
        checkpointQuestions: string[];
        visualExplainers: Array<{ type: string; items: string[] }>;
      };

      expect(supplement.deepInsightSummary.length).toBeGreaterThan(0);
      expect(supplement.deepDivePoints.length).toBeGreaterThanOrEqual(3);
      const expectedExecutionMin = SUPPLEMENT_EXECUTION_MIN_BY_SERVICE[serviceType];
      expect(supplement.executionProtocol.today.length).toBeGreaterThanOrEqual(expectedExecutionMin.today);
      expect(supplement.executionProtocol.thisWeek.length).toBeGreaterThanOrEqual(expectedExecutionMin.thisWeek);
      expect(supplement.executionProtocol.thisMonth.length).toBeGreaterThanOrEqual(expectedExecutionMin.thisMonth);
      expect(supplement.executionProtocol.avoid.length).toBeGreaterThanOrEqual(expectedExecutionMin.avoid);
      expect(supplement.checkpointQuestions.length).toBeGreaterThanOrEqual(2);
      expect(supplement.visualExplainers[0]?.type).toBe(visualType);
      expect(supplement.visualExplainers[0]?.items.length).toBeGreaterThanOrEqual(2);
      assertPayloadKeyNormalized(reportPayload, key, value);
    },
  );

  it("filters ownership-violating supplement text for career timing", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "ownership filter test",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: buildLifetimePayloadForCase(
          "saju-career-timing",
          "decision-matrix",
          true,
          ["job-fit verdict", "emergency-fund allocation rule", "relationship-layer expansion strategy"],
        ),
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-career-timing",
        sajuData: { palja: samplePalja, oheng: sampleOheng },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-supplement-ownership" },
    );

    if (response.serviceType === "saju-career-timing") {
      const deepDivePoints = response.reportPayload.supplement?.deepDivePoints ?? [];
      expect(deepDivePoints.length).toBeGreaterThanOrEqual(3);
      expect(deepDivePoints.every((item) => item.length > 0)).toBe(true);
    }
  });

  it("normalizes lifetime analysisBlocks to rich cards with at least 2 opportunities/risks/actions", async () => {
    const payload = buildLifetimePayloadForCase("saju-wealth-flow", "flow-radar", true) as Record<string, unknown>;
    payload.coreInsights = ["single phrase"];
    payload.actionNow = ["do this now"];
    payload.evidence = ["note"];
    payload.analysisBlocks = [
      {
        windowLabel: "phase",
        timeRange: "",
        coreFlow: "A change is visible.",
        evidence: "single phrase",
        opportunities: ["short opportunity"],
        risks: ["short risk"],
        actionStrategy: ["short action"],
      },
    ];

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "rich card test",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const yongsin = [sampleOheng[0].element];
    const response = await getSajuAnalysis(
      {
        serviceType: "saju-wealth-flow",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
        interests: ["money"],
      },
      { source: "manual", traceId: "trace-lifetime-analysisblocks-rich" },
    );

    if (response.serviceType === "saju-wealth-flow") {
      expect(response.reportPayload.analysisBlocks).toHaveLength(4);
      expect(response.reportPayload.wealthLifecycleStages).toHaveLength(4);
      response.reportPayload.analysisBlocks.forEach((block) => {
        expect(block.opportunities.length).toBeGreaterThanOrEqual(2);
        expect(block.risks.length).toBeGreaterThanOrEqual(2);
        expect(block.actionStrategy.length).toBeGreaterThanOrEqual(2);
      });
      const firstAction = response.reportPayload.analysisBlocks[0]?.actionStrategy[0] ?? "";
      expect(firstAction.length).toBeGreaterThan(8);
      expect(/[.!?]$/.test(firstAction)).toBe(true);
    }
  });

  it("separates career decideNow and deferNow buckets after normalization", async () => {
    const payload = buildLifetimePayloadForCase("saju-career-timing", "decision-matrix", true) as Record<string, unknown>;
    payload.decideNow = ["fix one priority now.", "rewrite the current plan."];
    payload.deferNow = ["fix one priority now.", "archive low-value options."];
    payload.decisionCriteria = ["criterion"];

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "career split test",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const yongsin = [sampleOheng[0].element];
    const response = await getSajuAnalysis(
      {
        serviceType: "saju-career-timing",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
        interests: ["career"],
      },
      { source: "manual", traceId: "trace-career-distinct-buckets" },
    );

    if (response.serviceType === "saju-career-timing") {
      const decideNow = response.reportPayload.decideNow;
      const deferNow = response.reportPayload.deferNow;
      const overlap = deferNow.filter((item) => decideNow.includes(item));
      expect(overlap.length).toBe(0);
      expect(decideNow.length).toBeGreaterThanOrEqual(2);
      expect(deferNow.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("expands yearly calendar arrays to fixed 4/12 lengths", async () => {
    const payload = buildLifetimePayloadForCase("saju-yearly-action-calendar", "calendar-map", true) as Record<string, unknown>;
    payload.quarterlyGoals = ["Q1 calendar-map Structuring target"];
    payload.riskCalendar = ["Q1 Acceleration risk"];
    payload.quarterThemes = ["Q1 Structuring"];
    payload.monthlyActions = ["2m action 1", "3m action 2"];
    payload.monthlyPushCaution = ["2m caution 1"];
    payload.actionCheckpoints = ["2m checkpoint 1"];
    payload.lifecycleExecutionPattern = ["0~2 execution pattern 1"];
    payload.phaseFocusMap = [{ phaseLabel: "0~2", focusPoint: "focus", executionPattern: "pattern", checkpoint: "criterion" }];
    payload.accumulationTransitionFlow = [{ axis: "build", guidance: "item" }];
    payload.longPracticeStrategy = ["long strategy 1"];
    payload.yearToLifeBridge = "bridge";

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "calendar expansion test",
        sections: [{ title: "base", interpretation: "Interpretation", advice: "Action" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const yongsin = [sampleOheng[0].element];
    const response = await getSajuAnalysis(
      {
        serviceType: "saju-yearly-action-calendar",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin },
        interests: ["path"],
      },
      { source: "manual", traceId: "trace-calendar-fixed-length" },
    );

    if (response.serviceType === "saju-yearly-action-calendar") {
      expect(response.reportPayload.oneLineTotalReview.length).toBeGreaterThan(0);
      expect(response.reportPayload.currentLifeFlow.length).toBeGreaterThan(0);
      expect(response.reportPayload.meaningOfThisYear.length).toBeGreaterThan(0);
      expect(response.reportPayload.tenYearFlow).toHaveLength(3);
      expect(response.reportPayload.keyThemes).toHaveLength(3);
      expect(response.reportPayload.quarterNarratives).toHaveLength(4);
      expect(response.reportPayload.yearEndResidue.length).toBeGreaterThan(0);
      expect(response.reportPayload.closingLine.length).toBeGreaterThan(0);
      expect(response.reportPayload.lifecycleExecutionPattern.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.phaseFocusMap.length).toBeGreaterThanOrEqual(4);
      expect(response.reportPayload.accumulationTransitionFlow.length).toBeGreaterThanOrEqual(4);
      expect(response.reportPayload.longPracticeStrategy.length).toBeGreaterThanOrEqual(3);
      expect(response.reportPayload.yearToLifeBridge.length).toBeGreaterThan(0);
      expect(response.reportPayload.quarterlyGoals).toHaveLength(4);
      expect(response.reportPayload.riskCalendar).toHaveLength(4);
      expect(response.reportPayload.quarterThemes).toHaveLength(4);
      expect(response.reportPayload.monthlyActions).toHaveLength(12);
      expect(response.reportPayload.monthlyPushCaution).toHaveLength(12);
      expect(response.reportPayload.actionCheckpoints).toHaveLength(12);
      expect(response.reportPayload.monthlyActions[0]?.startsWith("1")).toBe(true);
      expect(response.reportPayload.monthlyActions[3]?.startsWith("4")).toBe(true);
      expect(response.reportPayload.monthlyPushCaution[6]?.startsWith("7")).toBe(true);
      expect(response.reportPayload.quarterThemes.join(" ")).not.toContain("Q1");
      expect(response.reportPayload.quarterThemes.join(" ")).not.toContain("Structuring");
      expect(response.reportPayload.supplement?.executionProtocol.today ?? []).toHaveLength(0);
      expect(response.reportPayload.supplement?.executionProtocol.thisWeek ?? []).toHaveLength(0);
      expect(response.reportPayload.supplement?.executionProtocol.thisMonth ?? []).toHaveLength(0);
      expect(response.reportPayload.supplement?.executionProtocol.avoid ?? []).toHaveLength(0);
    }
  });

  it("uses lifecycle-linked core question for yearly calendar", async () => {
    const payload = buildLifetimePayloadForCase("saju-yearly-action-calendar", "calendar-map", true) as Record<string, unknown>;
    delete payload.coreQuestion;

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "연간 캘린더 코어 질문 테스트",
        sections: [{ title: "기본", interpretation: "해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-yearly-action-calendar",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin: ["목"] },
        interests: ["path"],
      },
      { source: "manual", traceId: "trace-calendar-core-question" },
    );

    expect(response.serviceType).toBe("saju-yearly-action-calendar");
    if (response.serviceType === "saju-yearly-action-calendar") {
      expect(response.reportPayload.coreQuestion).toContain("인생 단계 전환");
    }
  });

  it("keeps yearly payload repair stable when indexed evidence fallbacks are missing", async () => {
    const payload = buildLifetimePayloadForCase("saju-yearly-action-calendar", "calendar-map", true) as Record<string, unknown>;
    payload.evidence = ["중복 근거 A", "중복 근거 B"];
    payload.analysisBlocks = [
      {
        windowLabel: "Q1",
        timeRange: "Q1",
        coreFlow: "Q1 운영 축 정리",
        evidence: "중복 근거 A",
        opportunities: ["Q1 기회 1"],
        risks: ["Q1 리스크 1"],
        actionStrategy: ["Q1 실행 1"],
      },
      {
        windowLabel: "Q2",
        timeRange: "Q2",
        coreFlow: "Q2 운영 축 정리",
        evidence: "중복 근거 B",
        opportunities: ["Q2 기회 1"],
        risks: ["Q2 리스크 1"],
        actionStrategy: ["Q2 실행 1"],
      },
      {
        windowLabel: "Q3",
        timeRange: "Q3",
        coreFlow: "Q3 운영 축 정리",
        evidence: "중복 근거 A",
        opportunities: ["Q3 기회 1"],
        risks: ["Q3 리스크 1"],
        actionStrategy: ["Q3 실행 1"],
      },
      {
        windowLabel: "Q4",
        timeRange: "Q4",
        coreFlow: "Q4 운영 축 정리",
        evidence: "중복 근거 B",
        opportunities: ["Q4 기회 1"],
        risks: ["Q4 리스크 1"],
        actionStrategy: ["Q4 실행 1"],
      },
    ];

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "중복 근거 A",
        sections: [{ title: "기본", interpretation: "해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-yearly-action-calendar",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin: ["목"] },
        interests: ["path"],
      },
      { source: "manual", traceId: "trace-calendar-missing-evidence-fallback" },
    );

    expect(response.serviceType).toBe("saju-yearly-action-calendar");
    if (response.serviceType === "saju-yearly-action-calendar") {
      expect(response.reportPayload.quarterNarratives).toHaveLength(4);
      expect(response.reportPayload.quarterNarratives.every((item) => item.caution.trim().length > 0)).toBe(true);
    }
  });

  it("suppresses yearly duplicate quarter texts and hides internal tokens", async () => {
    const payload = buildLifetimePayloadForCase("saju-yearly-action-calendar", "calendar-map", true) as Record<string, unknown>;
    payload.quarterlyGoals = [
      "Q1 calendar-map Structuring 목표를 고정하세요.",
      "Q1 calendar-map Structuring 목표를 고정하세요.",
      "Q1 calendar-map Structuring 목표를 고정하세요.",
      "Q1 calendar-map Structuring 목표를 고정하세요.",
    ];
    payload.riskCalendar = [
      "Q1 Acceleration 리스크를 통제하세요.",
      "Q1 Acceleration 리스크를 통제하세요.",
      "Q1 Acceleration 리스크를 통제하세요.",
      "Q1 Acceleration 리스크를 통제하세요.",
    ];
    payload.quarterThemes = ["Q1 Structuring", "Q1 Structuring", "Q1 Structuring", "Q1 Structuring"];
    payload.analysisBlocks = [
      {
        windowLabel: "Q1",
        timeRange: "Q1",
        coreFlow: "Q1 calendar-map Structuring 중복 코어",
        evidence: "Q1 Acceleration 중복 근거",
        opportunities: ["Q1 Structuring 기회 1"],
        risks: ["Q1 Acceleration 리스크 1"],
        actionStrategy: ["calendar-map 실행 1"],
      },
      {
        windowLabel: "Q2",
        timeRange: "Q2",
        coreFlow: "Q1 calendar-map Structuring 중복 코어",
        evidence: "Q1 Acceleration 중복 근거",
        opportunities: ["Q1 Structuring 기회 2"],
        risks: ["Q1 Acceleration 리스크 2"],
        actionStrategy: ["calendar-map 실행 2"],
      },
      {
        windowLabel: "Q3",
        timeRange: "Q3",
        coreFlow: "Q1 calendar-map Structuring 중복 코어",
        evidence: "Q1 Acceleration 중복 근거",
        opportunities: ["Q1 Structuring 기회 3"],
        risks: ["Q1 Acceleration 리스크 3"],
        actionStrategy: ["calendar-map 실행 3"],
      },
      {
        windowLabel: "Q4",
        timeRange: "Q4",
        coreFlow: "Q1 calendar-map Structuring 중복 코어",
        evidence: "Q1 Acceleration 중복 근거",
        opportunities: ["Q1 Structuring 기회 4"],
        risks: ["Q1 Acceleration 리스크 4"],
        actionStrategy: ["calendar-map 실행 4"],
      },
    ];
    payload.oneLineTotalReview = "오늘 바로 결정을 내려야 하는 해입니다.";
    payload.currentLifeFlow = "이번 주 실행이 인생 전환의 전부입니다.";
    payload.meaningOfThisYear = "이번 달 안에 끝내야 의미가 생깁니다.";
    payload.longPatternInterpretation = ["3월 말까지 완료해야 성공 패턴이 유지됩니다."];
    payload.keyThemes = [
      { theme: "속도 우선", interpretation: "매일 30분씩만 하면 됩니다." },
      { theme: "당장 실행", interpretation: "이번 주 2개 과제만 처리하세요." },
      { theme: "월말 마감", interpretation: "이번 달 안에 반드시 마감하세요." },
    ];

    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "연간 품질 게이트 테스트",
        sections: [{ title: "기본", interpretation: "해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: payload,
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-yearly-action-calendar",
        sajuData: { palja: samplePalja, oheng: sampleOheng, yongsin: ["목"] },
        interests: ["path"],
      },
      { source: "manual", traceId: "trace-calendar-quality-gate" },
    );

    expect(response.serviceType).toBe("saju-yearly-action-calendar");
    if (response.serviceType === "saju-yearly-action-calendar") {
      const quarterlyTexts = [
        ...response.reportPayload.quarterlyGoals,
        ...response.reportPayload.riskCalendar,
        ...response.reportPayload.quarterThemes,
        ...response.reportPayload.analysisBlocks.map((block) => block.coreFlow),
        ...response.reportPayload.analysisBlocks.map((block) => block.evidence),
      ].join(" ");
      expect(quarterlyTexts).not.toContain("calendar-map");
      expect(quarterlyTexts).not.toContain("Structuring");
      expect(quarterlyTexts).not.toContain("Acceleration");
      expect(quarterlyTexts).not.toMatch(/\bQ[1-4]\b/);

      const normalizeKey = (value: string) =>
        value.toLowerCase().replace(/[\s\.,:;!?'"`~@#$%^&*()_\-+=<>{}\[\]\\|/]+/g, "");
      const quarterGoalKeys = response.reportPayload.quarterlyGoals.map((item) => normalizeKey(item));
      const riskKeys = response.reportPayload.riskCalendar.map((item) => normalizeKey(item));
      const themeKeys = response.reportPayload.quarterThemes.map((item) => normalizeKey(item));
      expect(new Set(quarterGoalKeys).size).toBe(4);
      expect(new Set(riskKeys).size).toBe(4);
      expect(new Set(themeKeys).size).toBe(4);

      const coreKeys = response.reportPayload.analysisBlocks.map((block) => normalizeKey(block.coreFlow));
      const evidenceKeys = response.reportPayload.analysisBlocks.map((block) => normalizeKey(block.evidence));
      expect(new Set(coreKeys).size).toBe(4);
      expect(new Set(evidenceKeys).size).toBe(4);

      const narrativeLayerText = [
        response.reportPayload.oneLineTotalReview,
        response.reportPayload.currentLifeFlow,
        response.reportPayload.meaningOfThisYear,
        ...response.reportPayload.tenYearFlow.map((item) => item.interpretation),
        ...response.reportPayload.longPatternInterpretation,
        ...response.reportPayload.keyThemes.map((item) => item.interpretation),
        response.reportPayload.yearEndResidue,
        response.reportPayload.closingLine,
      ].join(" ");
      expect(narrativeLayerText).not.toContain("오늘");
      expect(narrativeLayerText).not.toContain("이번 주");
      expect(narrativeLayerText).not.toContain("이번 달");
      expect(narrativeLayerText).not.toContain("3월 말까지");
      expect(narrativeLayerText).not.toContain("매일 30분");

      const quarterRoles = response.reportPayload.quarterNarratives.map((item) => normalizeKey(item.role));
      const quarterMeanings = response.reportPayload.quarterNarratives.map((item) => normalizeKey(item.meaning));
      expect(new Set(quarterRoles).size).toBe(4);
      expect(new Set(quarterMeanings).size).toBe(4);
    }
  });

  it("always builds 4-stage wealth lifecycle payload and aligns analysis blocks", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "재물 장기 흐름 요약",
        sections: [{ title: "기본", interpretation: "해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["축적 기준을 먼저 고정하세요."],
          actionNow: ["현재 구간의 자산 운영 원칙을 고정하세요."],
          evidence: ["유입-누수 편차가 반복됩니다."],
          cashflowMap: "장기 현금흐름 구조를 먼저 고정해야 합니다.",
          riskZones: ["지출 누수 리스크"],
          assetRules: ["손실 한도 규칙을 고정하세요."],
          incomeStructure: ["수입 채널 반복성을 높이세요."],
          spendingPatterns: ["누수 항목을 월 단위로 점검하세요."],
          accumulateVsExpand: ["축적 구간 기준을 고정하세요."],
          financialNoGo: ["손실 한도 초과 시 확장을 중단하세요."],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-wealth-flow",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          yongsin: ["목"],
          profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
        },
        interests: ["money"],
      },
      { source: "manual", traceId: "trace-wealth-lifecycle-fallback" },
    );

    expect(response.serviceType).toBe("saju-wealth-flow");
    if (response.serviceType === "saju-wealth-flow") {
      const stageFlow = response.reportPayload.wealthLifecycleStages;
      expect(stageFlow).toHaveLength(4);
      expect(stageFlow.map((stage) => stage.phaseType)).toEqual([
        "accumulation",
        "expansion",
        "defense",
        "volatility",
      ]);
      expect(response.reportPayload.analysisBlocks).toHaveLength(4);
      expect(new Set(stageFlow.map((stage) => stage.coreObjective)).size).toBeGreaterThanOrEqual(3);
    }
  });

  it("suppresses repeated 2026 wording and removes wealth action suffix repetition", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "2026년에는 2026년 흐름을 2026년에 맞춰 보세요.",
        sections: [{ title: "기본", interpretation: "해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["2026년 기준으로 2026년 반복을 줄이세요."],
          actionNow: ["2026년 자금 우선순위의 담당·기한·측정 기준을 문장으로 확정하세요."],
          evidence: ["2026년과 2026년 신호가 중첩됩니다."],
          cashflowMap: "2026년에는 2026년 변화가 크므로 2026년 방어를 우선하세요.",
          riskZones: ["2026년 과속 확장 리스크"],
          assetRules: ["자금 항목의 담당·기한·측정 기준을 문장으로 확정하세요."],
          wealthLifecycleStages: [
            {
              phaseType: "accumulation",
              timeRange: "0~2년",
              ageRange: "36~38세",
              yearRange: "2026~2028년",
              coreObjective: "2026년에는 2026년 축적 기준을 먼저 고정합니다.",
              opportunity: "2026년 수입 규칙 정리가 기회입니다.",
              risk: "2026년 누수 방치가 리스크입니다.",
              operatingRules: ["현금흐름의 담당·기한·측정 기준을 문장으로 확정하세요."],
              transitionSignal: "2026년 기준 유지율이 높아지면 전환 신호입니다.",
            },
          ],
          incomeStructure: ["2026년 수입 채널 정비"],
          spendingPatterns: ["2026년 지출 누수 점검"],
          accumulateVsExpand: ["2026년에는 축적 우선"],
          financialNoGo: ["2026년 손실 한도 초과 시 확장 금지"],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-wealth-flow",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          yongsin: ["목"],
          profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
        },
        interests: ["money"],
      },
      { source: "manual", traceId: "trace-wealth-year-suppression" },
    );

    expect(response.serviceType).toBe("saju-wealth-flow");
    if (response.serviceType === "saju-wealth-flow") {
      const allTexts = [
        response.reportPayload.cashflowMap,
        ...response.reportPayload.coreInsights,
        ...response.reportPayload.actionNow,
        ...response.reportPayload.assetRules,
        ...response.reportPayload.wealthLifecycleStages.flatMap((stage) => [
          stage.coreObjective,
          stage.opportunity,
          stage.risk,
          stage.transitionSignal,
          ...stage.operatingRules,
        ]),
      ];

      allTexts.forEach((text) => {
        const yearMentionCount = (text.match(/2026년/g) ?? []).length;
        expect(yearMentionCount).toBeLessThanOrEqual(1);
      });

      const hasLegacySuffix = allTexts.some((text) => /담당.?기한.?측정 기준/.test(text));
      expect(hasLegacySuffix).toBe(false);
    }
  });

  it("builds helper phase roadmap/long horizon and normalizes helper wording", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "관계·귀인 구조를 장기 기준으로 재정렬하세요.",
        sections: [{ title: "기본", interpretation: "관계 해석", advice: "행동" }],
        reportTemplateVersion: "saju-report-v2.6",
        reportPayload: {
          coreInsights: ["관계을 빠르게 확장하면 기준이 흔들릴 수 있습니다."],
          actionNow: ["오늘 관계을 정리하세요."],
          evidence: ["협업 갈등 신호가 반복됩니다."],
          helperMap: "관계 운영 기준을 장기축으로 고정해야 합니다.",
          conflictPatterns: ["관계을 과속 확장하면 충돌이 반복됩니다."],
          networkGuide: ["오늘 관계을 넓히세요."],
          helperProfiles: ["조율형 인물"],
          relationExpansionVsEntanglement: ["관계을 넓히기 전에 기준을 고정하세요."],
          conflictLoops: ["관계을 반복 설명만 하며 합의를 미룹니다."],
          helperEntryWindows: ["올해 인연 기회가 늘어납니다."],
          relationLayers: ["가까운 관계 레이어 정리"],
          analysisBlocks: [
            {
              windowLabel: "관계 확장 구간",
              timeRange: "0~2년",
              coreFlow: "중복 문장.",
              evidence: "중복 근거.",
              opportunities: ["중복 문장.", "중복 문장."],
              risks: ["중복 리스크."],
              actionStrategy: ["오늘 관계을 점검하세요."],
            },
            {
              windowLabel: "갈등 정리 구간",
              timeRange: "3~5년",
              coreFlow: "중복 문장.",
              evidence: "중복 근거.",
              opportunities: ["중복 문장."],
              risks: ["중복 리스크."],
              actionStrategy: ["오늘 관계을 점검하세요."],
            },
            {
              windowLabel: "귀인 활용 구간",
              timeRange: "6~10년",
              coreFlow: "중복 문장.",
              evidence: "중복 근거.",
              opportunities: ["중복 문장."],
              risks: ["중복 리스크."],
              actionStrategy: ["오늘 관계을 점검하세요."],
            },
          ],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis(
      {
        serviceType: "saju-helper-network",
        sajuData: {
          palja: samplePalja,
          oheng: sampleOheng,
          profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
        },
        interests: ["network"],
      },
      { source: "manual", traceId: "trace-helper-network-v26" },
    );

    expect(response.serviceType).toBe("saju-helper-network");
    if (response.serviceType === "saju-helper-network") {
      expect(response.reportPayload.phaseRoadmap?.length ?? 0).toBeGreaterThanOrEqual(4);
      expect(response.reportPayload.longHorizonDirection?.length ?? 0).toBe(3);
      expect(response.reportPayload.longHorizonDirection?.[0]).toContain("1~2년");
      expect(response.reportPayload.longHorizonDirection?.[1]).toContain("3~5년");
      expect(response.reportPayload.longHorizonDirection?.[2]).toContain("6~10년");

      const allTexts = [
        ...response.reportPayload.actionNow,
        ...response.reportPayload.networkGuide,
        ...response.reportPayload.conflictPatterns,
        ...response.reportPayload.relationExpansionVsEntanglement,
        ...response.reportPayload.conflictLoops,
        ...response.reportPayload.analysisBlocks.flatMap((block) => [
          ...block.opportunities,
          ...block.risks,
          ...block.actionStrategy,
        ]),
      ];
      allTexts.forEach((text) => {
        expect(text.includes("관계을")).toBe(false);
      });

      const duplicatedOpportunityCount = response.reportPayload.analysisBlocks
        .flatMap((block) => block.opportunities)
        .filter((item) => item === "중복 문장.").length;
      expect(duplicatedOpportunityCount).toBeLessThanOrEqual(1);
    }
  });


});
