import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type { SajuResult, SajuWealthFlowPayload } from "@/types/result";

const baseResult: SajuResult = {
  id: "result-wealth-priority",
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
  summary: "기본 요약",
  sections: [],
};

const buildWealthPayload = (): SajuWealthFlowPayload => ({
  coreQuestion: "내 인생 전체 자산 흐름과 재정 운영 패턴은 어떻게 전개되는가?",
  coreInsights: ["축적-확장-방어-변동 순환 구조를 먼저 고정해야 합니다."],
  actionNow: ["현재 구간의 손실 한도와 확장 조건을 분리해 점검하세요."],
  evidence: ["유입-누수 편차가 분기 단위로 반복되는 흐름이 확인됩니다."],
  analysisBlocks: [],
  cashflowMap: "장기 현금흐름 구조를 기준으로 자산 운영 규칙을 고정해야 합니다.",
  riskZones: ["확장 과속 구간", "누수 방치 구간"],
  assetRules: ["손실 한도를 먼저 고정하세요.", "확장 대상은 1~2개로 제한하세요."],
  wealthLifecycleStages: [
    {
      phaseType: "accumulation",
      timeRange: "0~2년",
      ageRange: "36~38세",
      yearRange: "2026~2028년",
      coreObjective: "순유입 기반을 고정해 축적 속도를 높이는 구간입니다.",
      opportunity: "수입 채널 반복성을 강화하면 축적 효율이 높아집니다.",
      risk: "지출 누수 방치 시 축적 속도가 둔화될 수 있습니다.",
      operatingRules: ["고정비 상한을 먼저 고정하세요.", "비상자금과 확장자금을 분리하세요."],
      transitionSignal: "순유입 안정 구간이 유지되면 확장기 진입 신호입니다.",
    },
    {
      phaseType: "expansion",
      timeRange: "3~5년",
      ageRange: "39~41세",
      yearRange: "2029~2031년",
      coreObjective: "축적 자본을 선택적으로 확장해 수익 규모를 키우는 구간입니다.",
      opportunity: "확장 채널을 제한하면 레버리지 효율이 좋아집니다.",
      risk: "손실 한도 기준 미준수 시 변동성이 커질 수 있습니다.",
      operatingRules: ["확장 전 손실 한도를 고정하세요.", "확장 대상은 1~2개로 제한하세요."],
      transitionSignal: "손실 한도 유지율이 높으면 방어기 진입 신호입니다.",
    },
    {
      phaseType: "defense",
      timeRange: "6~10년",
      ageRange: "42~46세",
      yearRange: "2032~2036년",
      coreObjective: "확장 이후 자산 하방을 방어해 복원력을 높이는 구간입니다.",
      opportunity: "방어 규칙 표준화로 하방 리스크를 줄일 수 있습니다.",
      risk: "방어 비중 하한 미고정 시 단일 이벤트 손실이 커질 수 있습니다.",
      operatingRules: ["방어 자산 비중 하한을 유지하세요.", "분기별 방어 한도 점검을 고정하세요."],
      transitionSignal: "복원 속도가 안정되면 변동기 대응 신호입니다.",
    },
    {
      phaseType: "volatility",
      timeRange: "10년+",
      ageRange: "47세+",
      yearRange: "2037년+",
      coreObjective: "변동 신호를 조기 판독해 사이클을 재배치하는 구간입니다.",
      opportunity: "변동기 조기 대응으로 다음 축적기 진입을 앞당길 수 있습니다.",
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
      reasonSummary: "유입과 누수 격차가 작습니다.",
      interpretation: "축적기 기준 고정이 필요한 시점입니다.",
      reasonDetails: ["현금흐름 바닥을 먼저 고정해야 합니다."],
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
        factorScores: {},
      },
    },
  ],
  incomeStructure: ["수입 구조 1", "수입 구조 2"],
  spendingPatterns: ["지출 패턴 1", "지출 패턴 2"],
  accumulateVsExpand: ["축적 우선 판단", "확장 우선 판단"],
  financialNoGo: ["손실 한도 초과 시 확장 금지"],
});

describe("SajuCollectionTabs wealth lifecycle priority", () => {
  it("renders wealth lifecycle + trend sections before current action card", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: { "saju-wealth-flow": buildWealthPayload() },
      summaries: { "saju-wealth-flow": "재물 요약" },
      sectionsMap: { "saju-wealth-flow": [] },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-wealth-flow"]} onUnlockRequest={() => {}} />);

    const lifecycleHeading = screen.getByText("인생 자산 사이클 4단계");
    const trendHeading = screen.getByText("10년 추세(근거)");
    const rulesHeading = screen.getByText("구간별 운영 규칙");
    const currentActionHeading = screen.getByText("현재 구간 실행");

    expect(lifecycleHeading.compareDocumentPosition(trendHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(trendHeading.compareDocumentPosition(rulesHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rulesHeading.compareDocumentPosition(currentActionHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.queryByText("핵심 인사이트")).not.toBeInTheDocument();
    expect(screen.getByText("자산 흐름 추세")).toBeInTheDocument();
  });
});

