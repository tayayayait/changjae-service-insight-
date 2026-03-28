import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type { SajuEnergyBalancePayload, SajuResult } from "@/types/result";

const baseResult: SajuResult = {
  id: "result-energy-priority",
  profileData: {
    calendarType: "solar",
    year: 1992,
    month: 9,
    day: 3,
    gender: "female",
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

const buildEnergyPayload = (): SajuEnergyBalancePayload => ({
  coreQuestion: "내 에너지를 어떻게 써야 오래 성과를 낼까?",
  coreInsights: ["장기 기준을 먼저 고정해야 변동성이 줄어듭니다."],
  actionNow: ["이번 주 회복 하한을 고정하고 점검 지표를 기록하세요."],
  evidence: ["최근 피로 회복 시간이 길어지는 신호가 반복됩니다."],
  analysisBlocks: [
    {
      windowLabel: "타고난 에너지 구조",
      timeRange: "생애 전반",
      coreFlow: "기본 에너지 파형은 몰입-회복의 간격이 넓을수록 안정됩니다.",
      evidence: "강도를 올릴수록 회복 지연이 커지는 패턴이 나타납니다.",
      opportunities: ["기준 루틴을 먼저 고정하면 생산성 저점을 줄일 수 있습니다."],
      risks: ["회복 슬롯 없이 확장을 반복하면 피로가 구조화될 수 있습니다."],
      actionStrategy: ["생애 전반 공통 운영 규칙 1개를 문장으로 고정하세요."],
    },
    {
      windowLabel: "운영 규칙 정착",
      timeRange: "0~2년",
      coreFlow: "초기 구간은 과속보다 유지 가능한 리듬 구축이 우선입니다.",
      evidence: "짧은 성과 추격 시 회복 비용이 빠르게 누적됩니다.",
      opportunities: ["집중 상한·회복 하한을 동시에 정의하면 변동성이 낮아집니다."],
      risks: ["주간 점검이 없으면 과부하 누적을 인지하기 어렵습니다."],
      actionStrategy: ["0~2년 운영 지표를 주간 루틴으로 고정하세요."],
    },
    {
      windowLabel: "단기 리듬 운영",
      timeRange: "4주/12주",
      coreFlow: "4주 실행과 12주 회복 리듬을 분리 추적해야 안정됩니다.",
      evidence: "집중 강도 변동이 큰 구간에서 회복 지연이 반복됩니다.",
      opportunities: ["단기 파형을 분리 추적하면 과열 시점을 빠르게 식별할 수 있습니다."],
      risks: ["단기 지표 미추적 시 회복 지연이 누적될 수 있습니다."],
      actionStrategy: ["4주 실행과 12주 회복 체크포인트를 같은 캘린더에 기록하세요."],
    },
    {
      windowLabel: "2026 적용 포인트",
      timeRange: "2026년",
      coreFlow: "2026년에는 회복 하한 관리가 성과 변동 폭을 좌우합니다.",
      evidence: "상반기 과부하 신호가 반복될 가능성이 높습니다.",
      opportunities: ["하반기 이전에 회복 루틴을 표준화하면 반등 폭이 커집니다."],
      risks: ["상한 없는 확장은 연말 피로 누적으로 이어질 수 있습니다."],
      actionStrategy: ["2026년 적용 규칙 1개를 월간 점검표에 고정하세요."],
    },
  ],
  energyCurve: "중장기 기준이 없는 단기 몰입 반복은 소진을 누적시킵니다.",
  innateProfile: "기본적으로 몰입 강도는 높지만 회복 지연이 생기기 쉬운 타입입니다.",
  operatingModel: [
    "집중 시작 신호와 종료 신호를 함께 정의해 강도 오버슈팅을 막으세요.",
    "회복 슬롯을 일정의 고정 블록으로 먼저 배치하고 나머지를 채우세요.",
    "주간 회복 지표를 기준으로 다음 주 강도를 조정하세요.",
  ],
  stageShiftMap: [
    "초기 단계: 루틴 정착이 성과보다 우선입니다.",
    "확장 단계: 역할별 에너지 배분 기준이 필요합니다.",
    "지속 단계: 회복 임계치 관리가 핵심입니다.",
  ],
  longRangeStrategy: [
    "0~2년: 집중 상한과 회복 하한을 함께 설정하세요.",
    "3~5년: 역할별 에너지 배분표를 운영하세요.",
    "6~10년: 확장 판단 전에 회복 여력을 먼저 점검하세요.",
  ],
  routineDesign: ["주간 루틴 1", "주간 루틴 2"],
  recoveryProtocol: ["24h 회복 규칙", "72h 회복 규칙"],
  energyRhythmSeries: [
    { label: "1주", value: 58 },
    { label: "2주", value: 64 },
    { label: "3주", value: 69 },
    { label: "4주", value: 72 },
    { label: "8주", value: 66 },
    { label: "12주", value: 61 },
  ],
  immersionMode: ["몰입 방식 1", "몰입 방식 2"],
  burnoutSignals: ["소진 신호 1", "소진 신호 2"],
  overloadAlerts: ["과부하 경보 1", "과부하 경보 2"],
  habitTweaks: ["습관 보정 1", "습관 보정 2"],
  recoveryRoutines: ["회복 루틴 1", "회복 루틴 2"],
});

describe("SajuCollectionTabs energy guide priority", () => {
  it("renders long-range guide before short-term section and 2026 points at the bottom", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: { "saju-energy-balance": buildEnergyPayload() },
      summaries: { "saju-energy-balance": "에너지 밸런스 요약" },
      sectionsMap: { "saju-energy-balance": [] },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-energy-balance"]} onUnlockRequest={() => {}} />);

    const guideHeading = screen.getByText("인생 전반 에너지 운영 가이드");
    const shortTermHeading = screen.getByText("단기 운영(4주/12주)");
    const yearlyHeading = screen.getByText("2026 적용 포인트");

    expect(guideHeading.compareDocumentPosition(shortTermHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(shortTermHeading.compareDocumentPosition(yearlyHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByText("타고난 성향")).toBeInTheDocument();
    expect(screen.getByText("중장기 관리 전략(0~2/3~5/6~10년)")).toBeInTheDocument();
    expect(screen.getByText("올해 실행 우선순위")).toBeInTheDocument();
    expect(screen.getByText("이번 주 회복 하한을 고정하고 점검 지표를 기록하세요.")).toBeInTheDocument();
  });
});

