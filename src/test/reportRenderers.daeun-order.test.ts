import { describe, expect, it } from "vitest";
import { REPORT_RENDERER_REGISTRY } from "@/lib/reportRenderers";
import type { SajuReportPayloadMap } from "@/types/result";

const daeunPayload: SajuReportPayloadMap["saju-daeun-shift"] = {
  coreQuestion: "질문",
  coreInsights: ["핵심 인사이트"],
  actionNow: ["실행 1"],
  evidence: ["근거 1"],
  analysisBlocks: [
    {
      windowLabel: "전환 전 준비기",
      timeRange: "2024~2025년",
      coreFlow: "전환 전 준비기 흐름",
      evidence: "전환 전 준비기 근거",
      opportunities: ["기회 1"],
      risks: ["리스크 1"],
      actionStrategy: ["행동 1"],
    },
    {
      windowLabel: "전환기",
      timeRange: "2026~2027년",
      coreFlow: "전환기 흐름",
      evidence: "전환기 근거",
      opportunities: ["기회 2"],
      risks: ["리스크 2"],
      actionStrategy: ["행동 2"],
    },
  ],
  transitionSignal: "2026년 전환 촉발",
  ninetyDayActions: ["90일 일정 1", "90일 일정 2"],
  avoidanceScenario: ["회피 1", "회피 2"],
  transitionSignals: ["전환 신호 1"],
  changePoints: ["변화 포인트 1"],
  readinessActions: ["준비 행동 1"],
  phaseRoadmap: [
    {
      phaseLabel: "전환 전 준비기",
      ageRange: "34~35세",
      yearRange: "2024~2025년",
      coreFlow: "전환 전 준비기 흐름",
      evidence: "전환 전 준비기 근거",
      opportunities: ["기회 1"],
      risks: ["리스크 1"],
      actionStrategy: ["행동 1"],
    },
    {
      phaseLabel: "전환기",
      ageRange: "36~37세",
      yearRange: "2026~2027년",
      coreFlow: "전환기 흐름",
      evidence: "전환기 근거",
      opportunities: ["기회 2"],
      risks: ["리스크 2"],
      actionStrategy: ["행동 2"],
    },
    {
      phaseLabel: "전환 후 재배치기",
      ageRange: "38~40세",
      yearRange: "2028~2030년",
      coreFlow: "전환 후 재배치기 흐름",
      evidence: "전환 후 재배치기 근거",
      opportunities: ["기회 3"],
      risks: ["리스크 3"],
      actionStrategy: ["행동 3"],
    },
    {
      phaseLabel: "전환 후 정착기",
      ageRange: "41~46세",
      yearRange: "2031~2036년",
      coreFlow: "전환 후 정착기 흐름",
      evidence: "전환 후 정착기 근거",
      opportunities: ["기회 4"],
      risks: ["리스크 4"],
      actionStrategy: ["행동 4"],
    },
  ],
  longHorizonDirection: [
    "1~2년 재배치 우선",
    "3~5년 운영 기준 반복",
    "6~10년 정착 기반 확장",
  ],
  preAtPostDiff: ["전환 전 관성", "전환기 재정렬", "전환 후 정착"],
};

const careerPayload: SajuReportPayloadMap["saju-career-timing"] = {
  coreQuestion: "커리어 질문",
  coreInsights: ["핵심 인사이트 1"],
  actionNow: ["즉시 실행 1"],
  evidence: ["근거 1"],
  analysisBlocks: [
    {
      windowLabel: "초기 축적기",
      timeRange: "0~2년",
      coreFlow: "기준 축적 흐름",
      evidence: "초기 근거",
      opportunities: ["기회 1"],
      risks: ["리스크 1"],
      actionStrategy: ["행동 1"],
    },
  ],
  careerWindow: "장기 커리어 판단 축",
  careerArcSummary: "초기 축적기에서 안정화기까지 장기 흐름을 설계합니다.",
  transitionSignal: "단계 전환 신호를 기준으로 의사결정을 갱신하세요.",
  currentYearFocus: "현재 연도는 장기 단계 점검을 위한 보조 포인트입니다.",
  stageFlow: [
    {
      stageId: "build-up",
      label: "초기 축적기",
      timeRange: "0~2년",
      coreFlow: "초기 기준을 축적하는 구간입니다.",
      evidence: "기준 명확성이 성과 변동을 줄입니다.",
      opportunities: ["기회 1", "기회 2"],
      risks: ["리스크 1", "리스크 2"],
      actionStrategy: ["행동 1", "행동 2"],
      transitionSignal: "기준 유지율이 높아지면 전환기 신호입니다.",
    },
    {
      stageId: "transition",
      label: "전환기",
      timeRange: "3~5년",
      coreFlow: "역할 전환과 우선순위 재배치 구간입니다.",
      evidence: "역할-환경 적합도 동시 점검이 필요합니다.",
      opportunities: ["기회 3", "기회 4"],
      risks: ["리스크 3", "리스크 4"],
      actionStrategy: ["행동 3", "행동 4"],
      transitionSignal: "성과 지표 안정화가 확장기 신호입니다.",
    },
    {
      stageId: "expansion",
      label: "확장기",
      timeRange: "6~10년",
      coreFlow: "영향력과 성과 범위 확장 구간입니다.",
      evidence: "확장 속도보다 운영 유지율이 중요합니다.",
      opportunities: ["기회 5", "기회 6"],
      risks: ["리스크 5", "리스크 6"],
      actionStrategy: ["행동 5", "행동 6"],
      transitionSignal: "유지 체계 정착이 안정화기 신호입니다.",
    },
    {
      stageId: "stabilization",
      label: "안정화기",
      timeRange: "10년+",
      coreFlow: "재현 가능한 운영 체계 정착 구간입니다.",
      evidence: "변동성 관리 규칙이 핵심입니다.",
      opportunities: ["기회 7", "기회 8"],
      risks: ["리스크 7", "리스크 8"],
      actionStrategy: ["행동 7", "행동 8"],
      transitionSignal: "승계 전략 고도화가 핵심 신호입니다.",
    },
  ],
  decisionTree: ["선택지 1", "선택지 2"],
  executionChecklist: ["체크 1", "체크 2"],
  workModeFit: "업무 방식",
  decideNow: ["지금 결정 1", "지금 결정 2"],
  deferNow: ["지금 보류 1", "지금 보류 2"],
  gainVsLossPatterns: ["패턴 1"],
  decisionCriteria: ["판단 기준 1", "판단 기준 2"],
  supplement: {
    deepInsightSummary: "보강 요약",
    deepDivePoints: ["포인트 1", "포인트 2", "포인트 3"],
    executionProtocol: {
      today: [],
      thisWeek: ["이번 주 실행 1"],
      thisMonth: ["이번 달 실행 1"],
      avoid: ["주의 1"],
    },
    checkpointQuestions: ["질문 1", "질문 2"],
    visualExplainers: [{ type: "decision-matrix", title: "결정 매트릭스", items: ["항목 1", "항목 2"] }],
  },
};

const wealthPayload: SajuReportPayloadMap["saju-wealth-flow"] = {
  coreQuestion: "자산 흐름 질문",
  coreInsights: ["장기 자산 운영 기준을 먼저 고정하세요."],
  actionNow: ["현재 구간 손실 한도와 확장 조건을 분리해 점검하세요."],
  evidence: ["유입-누수 편차가 분기별로 반복되고 있습니다."],
  analysisBlocks: [
    {
      windowLabel: "축적기",
      timeRange: "0~2년",
      coreFlow: "순유입 기반을 고정하는 구간입니다.",
      evidence: "고정비 상한 미설정 시 누수 폭이 커집니다.",
      opportunities: ["수입 채널 반복성을 강화할 수 있습니다.", "축적 속도 안정화가 가능합니다."],
      risks: ["지출 누수 방치 시 축적 둔화가 발생합니다.", "확장 준비 과속 위험이 있습니다."],
      actionStrategy: ["고정비 상한을 먼저 고정하세요.", "비상자금과 확장자금을 분리하세요."],
    },
  ],
  cashflowMap: "장기 현금흐름 구조를 기준으로 축적-확장-방어를 순환 운영해야 합니다.",
  riskZones: ["축적기 누수 위험", "확장기 과속 위험"],
  assetRules: ["손실 한도를 먼저 고정하세요.", "확장 대상은 1~2개로 제한하세요."],
  wealthLifecycleStages: [
    {
      phaseType: "accumulation",
      timeRange: "0~2년",
      ageRange: "31~33세",
      yearRange: "2026~2028년",
      coreObjective: "순유입 기반을 고정하는 구간입니다.",
      opportunity: "수입 채널 반복성 강화를 통해 축적 효율을 높일 수 있습니다.",
      risk: "지출 누수 방치 시 축적 속도가 둔화될 수 있습니다.",
      operatingRules: ["고정비 상한을 먼저 고정하세요.", "비상자금과 확장자금을 분리하세요."],
      transitionSignal: "순유입 안정 구간이 유지되면 확장기 전환 신호입니다.",
    },
    {
      phaseType: "expansion",
      timeRange: "3~5년",
      ageRange: "34~36세",
      yearRange: "2029~2031년",
      coreObjective: "축적 자본을 선택적으로 확장하는 구간입니다.",
      opportunity: "확장 채널 제한으로 레버리지 효율을 높일 수 있습니다.",
      risk: "손실 한도 기준 미준수 시 변동성이 커질 수 있습니다.",
      operatingRules: ["확장 전 손실 한도를 고정하세요.", "확장 대상은 1~2개로 제한하세요."],
      transitionSignal: "확장 후 손실 한도 유지율이 높으면 방어기 진입 신호입니다.",
    },
    {
      phaseType: "defense",
      timeRange: "6~10년",
      ageRange: "37~41세",
      yearRange: "2032~2036년",
      coreObjective: "자산 하방을 방어해 복원력을 높이는 구간입니다.",
      opportunity: "방어 규칙 표준화로 하방 리스크를 줄일 수 있습니다.",
      risk: "방어 비중 하한 미고정 시 단일 이벤트 손실이 커질 수 있습니다.",
      operatingRules: ["방어 자산 비중 하한을 유지하세요.", "분기별 방어 한도 점검을 고정하세요."],
      transitionSignal: "복원 속도와 방어 유지율이 안정되면 변동기 대응 신호입니다.",
    },
    {
      phaseType: "volatility",
      timeRange: "10년+",
      ageRange: "42세+",
      yearRange: "2037년+",
      coreObjective: "변동 신호를 조기 판독해 사이클을 재배치하는 구간입니다.",
      opportunity: "변동 구간 조기 대응으로 다음 축적 사이클 진입을 앞당길 수 있습니다.",
      risk: "낙관/비관 반응 과다 시 복원력이 약화될 수 있습니다.",
      operatingRules: ["변동 구간 방어 한도를 선고정하세요.", "재배치 트리거를 사전에 정의하세요."],
      transitionSignal: "복원 속도와 손실 통제가 유지되면 다음 축적기 연결 신호입니다.",
    },
  ],
  assetTrendSeries: [
    { label: "현재", value: 52 },
    { label: "1년 후", value: 58 },
    { label: "3년 후", value: 67 },
    { label: "5년 후", value: 63 },
    { label: "10년 후", value: 72 },
  ],
  assetTrendEvidence: [
    {
      label: "현재",
      value: 52,
      deltaFromPrev: 0,
      direction: "flat",
      reasonSummary: "현금흐름이 유지 구간입니다.",
      interpretation: "축적기 기준 고정이 필요한 시점입니다.",
      reasonDetails: ["유입과 누수의 격차가 작습니다."],
      rawBasis: {
        source: "manseryeok",
        checkpoint: {
          label: "현재",
          offset: 0,
          unit: "year",
          targetDate: "2026-03-28",
          targetYear: 2026,
        },
        ohengDistribution: { 목: 2, 화: 1, 토: 1, 금: 1, 수: 1 },
        yongsin: ["목"],
        seun: undefined,
        temporalPillars: undefined,
        factorScores: {},
      },
    },
  ],
  incomeStructure: ["수입 구조 1", "수입 구조 2"],
  spendingPatterns: ["지출 패턴 1", "지출 패턴 2"],
  accumulateVsExpand: ["축적 우선 판단", "확장 우선 판단"],
  financialNoGo: ["손실 한도 초과 시 확장 금지"],
};

describe("REPORT_RENDERER_REGISTRY order", () => {
  it("renders daeun sections in long-horizon order", () => {
    const rendered = REPORT_RENDERER_REGISTRY["saju-daeun-shift"](daeunPayload);

    expect(rendered.sections.map((section) => section.title).slice(0, 4)).toEqual([
      "전환 신호",
      "단계별 로드맵",
      "장기 방향",
      "90일 일정",
    ]);
    expect(rendered.sections[1]?.items.some((item) => item.includes("전환 후 정착기"))).toBe(true);
    expect(rendered.sections[2]?.items[0]).toContain("1~2년");
  });

  it("renders career sections in long-arc first order", () => {
    const rendered = REPORT_RENDERER_REGISTRY["saju-career-timing"](careerPayload);

    expect(rendered.signatureTitle).toBe("커리어 장기축");
    expect(rendered.signatureBody).toContain("장기 흐름");
    expect(rendered.sections.map((section) => section.title)).toEqual([
      "커리어 장기축 요약",
      "4단계 흐름",
      "단계 전환 신호",
      "결정 매트릭스",
      "현재 연도 적용 포인트",
      "단기 실행",
    ]);
    expect(rendered.sections[1]?.items[0]).toContain("초기 축적기");
    expect(rendered.sections[4]?.items[0]).toContain("보조");
  });

  it("renders wealth sections in lifecycle-first order", () => {
    const rendered = REPORT_RENDERER_REGISTRY["saju-wealth-flow"](wealthPayload);

    expect(rendered.signatureTitle).toBe("인생 자산 사이클");
    expect(rendered.sections.map((section) => section.title).slice(0, 4)).toEqual([
      "인생 자산 사이클 4단계",
      "10년 추세(근거)",
      "구간별 운영 규칙",
      "현재 구간 실행",
    ]);
    expect(rendered.sections[0]?.items[0]).toContain("축적기");
    expect(rendered.sections[1]?.items[0]).toContain("현재");
  });

  it("renders yearly calendar sections in fixed 9-section order", () => {
    const yearlyPayload: SajuReportPayloadMap["saju-yearly-action-calendar"] = {
      coreQuestion: "연간 질문",
      coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
      actionNow: ["액션 1", "액션 2"],
      evidence: ["근거 1", "근거 2"],
      analysisBlocks: [],
      oneLineTotalReview: "2026년은 기준 고정의 해입니다.",
      currentLifeFlow: "지금은 확장보다 기준 정렬이 우선입니다.",
      meaningOfThisYear: "올해는 장기 운영 방식 확정의 의미가 큽니다.",
      tenYearFlow: [
        { periodLabel: "0~2년", phaseLabel: "기반 설정기", interpretation: "핵심 축을 정합니다." },
        { periodLabel: "3~5년", phaseLabel: "확장기", interpretation: "확장 범위를 선택합니다." },
        { periodLabel: "6~10년", phaseLabel: "성과 정착기", interpretation: "유지 가능한 구조를 완성합니다." },
      ],
      longPatternInterpretation: ["기준 정렬이 누적 성과를 만듭니다."],
      keyThemes: [
        { theme: "한 축 집중", interpretation: "분산보다 집중이 중요합니다." },
        { theme: "기준 문장화", interpretation: "판단 기준을 문장으로 고정합니다." },
        { theme: "성과 구조화", interpretation: "반복 가능한 구조를 남깁니다." },
      ],
      quarterNarratives: [
        { quarter: "1분기", role: "기반 정비", meaning: "기준 확정", focus: "우선순위 고정", caution: "과속 시작" },
        { quarter: "2분기", role: "확장 시동", meaning: "확장 점검", focus: "선택과 집중", caution: "과다 목표" },
        { quarter: "3분기", role: "성과 압축", meaning: "완성도 확보", focus: "성과 압축", caution: "지연 방치" },
        { quarter: "4분기", role: "정리와 전환 준비", meaning: "다음 해 기준 정리", focus: "잔여 정리", caution: "마감 과속" },
      ],
      yearEndResidue: "연말에는 기준 문서와 결과물 기록이 남아야 합니다.",
      closingLine: "올해의 가치는 다음 10년 기준을 남기는 데 있습니다.",
      lifecycleExecutionPattern: ["0~2년 기준 정렬", "3~5년 확장 점검", "6~10년 구조 정착"],
      phaseFocusMap: [
        { phaseLabel: "0~2년", focusPoint: "기준 정렬", executionPattern: "반복 구조 고정", checkpoint: "분기 점검" },
        { phaseLabel: "3~5년", focusPoint: "확장 선택", executionPattern: "확장 범위 제한", checkpoint: "월간 점검" },
        { phaseLabel: "6~10년", focusPoint: "정착", executionPattern: "지속 가능성 점검", checkpoint: "분기 점검" },
        { phaseLabel: "전환", focusPoint: "전환 준비", executionPattern: "전환 조건 문서화", checkpoint: "연말 점검" },
      ],
      accumulationTransitionFlow: [
        { axis: "쌓을 것", guidance: "기준 축적" },
        { axis: "버릴 것", guidance: "비핵심 정리" },
        { axis: "전환 트리거", guidance: "전환 신호 확인" },
        { axis: "복구 규칙", guidance: "지연 복구 기준" },
      ],
      longPracticeStrategy: ["분기 리뷰 기준 유지", "우선순위 점검", "전환 신호 기록"],
      yearToLifeBridge: "현재 위치와 장기 목적을 연결하는 기준 문장",
      quarterlyGoals: ["1분기 목표", "2분기 목표", "3분기 목표", "4분기 목표"],
      monthlyActions: Array.from({ length: 12 }, (_, index) => `${index + 1}월 실행`),
      riskCalendar: ["1분기 리스크", "2분기 리스크", "3분기 리스크", "4분기 리스크"],
      quarterThemes: ["1분기 테마", "2분기 테마", "3분기 테마", "4분기 테마"],
      monthlyPushCaution: Array.from({ length: 12 }, (_, index) => `${index + 1}월 주의`),
      actionCheckpoints: Array.from({ length: 12 }, (_, index) => `${index + 1}월 점검`),
      priorityQueue: ["우선순위 1", "우선순위 2", "우선순위 3"],
    };

    const rendered = REPORT_RENDERER_REGISTRY["saju-yearly-action-calendar"](yearlyPayload);
    expect(rendered.signatureTitle).toBe("한 줄 총평");
    expect(rendered.sections.map((section) => section.title)).toEqual([
      "한 줄 총평",
      "지금 인생의 큰 흐름",
      "올해의 의미",
      "올해 이후 10년의 흐름",
      "장기 패턴 해석",
      "올해의 핵심 테마 3가지",
      "분기별 실행 캘린더",
      "올해가 끝났을 때 남아야 할 것",
      "한 줄 결론",
    ]);
  });
});
