import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type { SajuCareerTimingPayload, SajuHelperNetworkPayload, SajuResult } from "@/types/result";

const baseResult: SajuResult = {
  id: "result-analysis-blocks",
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

const buildPayload = (): SajuCareerTimingPayload => ({
  coreQuestion: "핵심 질문",
  coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
  actionNow: ["즉시 실행 1", "즉시 실행 2"],
  evidence: ["근거 1", "근거 2"],
  analysisBlocks: [
    {
      windowLabel: "결정 시점",
      timeRange: "0~2년",
      coreFlow: "핵심 흐름 문장.",
      evidence: "해석 근거 문장.",
      opportunities: ["핵심 흐름 문장.", "기회 문장 A."],
      risks: ["리스크 문장 A.", "리스크 문장 B."],
      actionStrategy: ["행동 전략 문장 A.", "행동 전략 문장 B."],
    },
  ],
  careerWindow: "커리어 구간 해석",
  careerArcSummary: "초기 축적기부터 안정화기까지 장기 커리어 흐름을 점검합니다.",
  transitionSignal: "단계 전환 신호를 기준으로 판단하세요.",
  currentYearFocus: "현재 연도는 보조 점검 포인트입니다.",
  stageFlow: [
    {
      stageId: "build-up",
      label: "초기 축적기",
      timeRange: "0~2년",
      coreFlow: "핵심 흐름 문장.",
      evidence: "해석 근거 문장.",
      opportunities: ["핵심 흐름 문장.", "기회 문장 A."],
      risks: ["리스크 문장 A.", "리스크 문장 B."],
      actionStrategy: ["행동 전략 문장 A.", "행동 전략 문장 B."],
      transitionSignal: "기준 유지율이 높아지면 전환기 신호입니다.",
    },
    {
      stageId: "transition",
      label: "전환기",
      timeRange: "3~5년",
      coreFlow: "전환기 핵심 흐름 문장.",
      evidence: "전환기 해석 근거 문장.",
      opportunities: ["전환기 기회 문장 A.", "전환기 기회 문장 B."],
      risks: ["전환기 리스크 문장 A.", "전환기 리스크 문장 B."],
      actionStrategy: ["전환기 행동 전략 문장 A.", "전환기 행동 전략 문장 B."],
      transitionSignal: "성과 지표 안정화가 확장기 신호입니다.",
    },
    {
      stageId: "expansion",
      label: "확장기",
      timeRange: "6~10년",
      coreFlow: "확장기 핵심 흐름 문장.",
      evidence: "확장기 해석 근거 문장.",
      opportunities: ["확장기 기회 문장 A.", "확장기 기회 문장 B."],
      risks: ["확장기 리스크 문장 A.", "확장기 리스크 문장 B."],
      actionStrategy: ["확장기 행동 전략 문장 A.", "확장기 행동 전략 문장 B."],
      transitionSignal: "유지 체계 정착이 안정화기 신호입니다.",
    },
    {
      stageId: "stabilization",
      label: "안정화기",
      timeRange: "10년+",
      coreFlow: "안정화기 핵심 흐름 문장.",
      evidence: "안정화기 해석 근거 문장.",
      opportunities: ["안정화기 기회 문장 A.", "안정화기 기회 문장 B."],
      risks: ["안정화기 리스크 문장 A.", "안정화기 리스크 문장 B."],
      actionStrategy: ["안정화기 행동 전략 문장 A.", "안정화기 행동 전략 문장 B."],
      transitionSignal: "승계 전략 고도화가 핵심 신호입니다.",
    },
  ],
  decisionTree: ["결정 트리 1"],
  executionChecklist: ["체크 1"],
  workModeFit: "적합 환경",
  decideNow: ["결정 1"],
  deferNow: ["보류 1"],
  gainVsLossPatterns: ["패턴 1"],
  decisionCriteria: ["기준 1"],
});

const buildHelperPayload = (): SajuHelperNetworkPayload => ({
  coreQuestion: "관계·귀인 장기축 질문",
  coreInsights: ["관계 레이어를 분리하면 장기 신뢰가 쌓입니다.", "협업 기준을 먼저 합의해야 갈등 비용이 줄어듭니다."],
  actionNow: ["3~5년 협업 기준을 문장으로 고정하세요.", "6~10년 멘토·귀인 채널을 점검하세요."],
  evidence: ["관계 충돌 패턴이 반복될수록 확장 속도가 둔화됩니다."],
  analysisBlocks: [
    {
      windowLabel: "관계 기반 정비기",
      timeRange: "0~2년",
      coreFlow: "관계 확장과 정리 기준을 먼저 분리하는 단계입니다.",
      evidence: "초기 레이어 정리 여부가 이후 협업 안정성을 좌우합니다.",
      opportunities: ["협업 레이어를 분리하면 의사소통 비용이 감소합니다.", "신뢰 기반 연결이 빠르게 누적됩니다."],
      risks: ["기준 없는 확장은 갈등 비용을 누적시킵니다.", "경계 미설정은 감정 소모를 키웁니다."],
      actionStrategy: ["0~2년 기준을 문장으로 고정하세요.", "분기마다 관계 정리 대상을 재평가하세요."],
    },
  ],
  helperMap: "생애 관계 자산 구조를 재정렬하는 지도",
  conflictPatterns: ["합의 없는 확장", "역할 불명확 협업"],
  networkGuide: ["3~5년 협업 역할·권한 기준을 먼저 맞추세요."],
  helperProfiles: ["조율형 귀인", "연결형 귀인"],
  relationExpansionVsEntanglement: ["확장 전 정리 기준을 먼저 고정하세요."],
  conflictLoops: ["반복 갈등 루프를 문장으로 차단하세요."],
  helperEntryWindows: ["6~10년 멘토 연결 신호가 강화됩니다."],
  relationLayers: ["가까운 관계 레이어", "협업 레이어", "사회 레이어"],
  phaseRoadmap: [
    {
      phaseLabel: "관계 기반 정비기",
      timeRange: "0~2년",
      relationshipExpansion: "확장보다 정리 기준을 먼저 고정합니다.",
      collaborationFlow: "협업 역할·권한 기준을 합의합니다.",
      mentorInfluxSignal: "피드백 밀도 상승이 보이면 귀인 유입 신호입니다.",
      guardPattern: "경계 미설정 관계를 방치하지 않습니다.",
      actionStrategy: ["0~2년 핵심 인물군을 분리하세요.", "분기마다 경계 문장을 점검하세요."],
    },
    {
      phaseLabel: "협업 확장기",
      timeRange: "3~5년",
      relationshipExpansion: "협업 채널을 선택적으로 확장합니다.",
      collaborationFlow: "역할 충돌 포인트를 선공개합니다.",
      mentorInfluxSignal: "추천 연결이 늘어나면 유입 신호입니다.",
      guardPattern: "합의 없는 속도전을 피합니다.",
      actionStrategy: ["3~5년 협업 기준을 재고정하세요.", "반기마다 갈등 재발률을 측정하세요."],
    },
    {
      phaseLabel: "귀인 유입기",
      timeRange: "6~10년",
      relationshipExpansion: "장기 협력 가치가 높은 연결을 선별합니다.",
      collaborationFlow: "전략형·실행형 조력자 조합을 고도화합니다.",
      mentorInfluxSignal: "상위 관점 조언과 자원 연결 제안이 동시 발생합니다.",
      guardPattern: "성과 중심 단절 패턴을 경계합니다.",
      actionStrategy: ["6~10년 멘토군을 분리 관리하세요.", "연간 연결 성과를 재평가하세요."],
    },
    {
      phaseLabel: "관계 자산 전수기",
      timeRange: "10년+",
      relationshipExpansion: "관계 운영 원칙을 전수 체계로 전환합니다.",
      collaborationFlow: "체계 의존형 협업 구조를 고정합니다.",
      mentorInfluxSignal: "소개 요청 비중이 증가하면 전수기 신호입니다.",
      guardPattern: "개인 감각 중심 운영을 경계합니다.",
      actionStrategy: ["관계 운영 문서를 고정하세요.", "유지·종료 기준을 분리하세요."],
    },
  ],
  longHorizonDirection: [
    "1~2년: 관계 레이어 정리와 기준 고정에 집중하세요.",
    "3~5년: 협업 확장보다 합의 속도를 우선하세요.",
    "6~10년: 멘토·귀인 채널을 장기 협력 구조로 전환하세요.",
  ],
});

describe("SajuCollectionTabs analysis block rendering", () => {
  it("renders rich analysis block sections with opportunities/risks/action strategy", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": buildPayload(),
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />);

    expect(screen.getByText("커리어 장기축 요약")).toBeInTheDocument();
    expect(screen.getByText("4단계 커리어 흐름")).toBeInTheDocument();
    expect(screen.getAllByText("주요 기회").length).toBeGreaterThan(0);
    expect(screen.getAllByText("리스크").length).toBeGreaterThan(0);
    expect(screen.getAllByText("행동 전략").length).toBeGreaterThan(0);
    expect(screen.getByText("기회 문장 A.")).toBeInTheDocument();
    expect(screen.getByText("리스크 문장 A.")).toBeInTheDocument();
    expect(screen.getByText("행동 전략 문장 A.")).toBeInTheDocument();
  });

  it("does not duplicate coreFlow inside opportunities list", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": buildPayload(),
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />);

    expect(screen.getAllByText("핵심 흐름 문장.")).toHaveLength(1);
  });

  it("renders career sections in long-flow order", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-career-timing": buildPayload(),
      },
      summaries: {
        "saju-career-timing": "커리어 요약",
      },
      sectionsMap: {
        "saju-career-timing": [],
      },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-career-timing"]} onUnlockRequest={() => {}} />);

    const arc = screen.getByText("커리어 장기축 요약");
    const stage = screen.getByText("4단계 커리어 흐름");
    const signal = screen.getByText("단계 전환 신호");
    const matrix = screen.getByText("결정 매트릭스");
    const currentYear = screen.getByText("현재 연도 적용 포인트(보조)");

    expect(arc.compareDocumentPosition(stage) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stage.compareDocumentPosition(signal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(signal.compareDocumentPosition(matrix) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(matrix.compareDocumentPosition(currentYear) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders helper-network long-horizon sections", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: {
        "saju-helper-network": buildHelperPayload(),
      },
      summaries: {
        "saju-helper-network": "관계·귀인 장기축 요약",
      },
      sectionsMap: {
        "saju-helper-network": [],
      },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-helper-network"]} onUnlockRequest={() => {}} />);

    expect(screen.getByText("인생 단계별 관계 확장/정리")).toBeInTheDocument();
    expect(screen.getByText("협업 운 운영 기준")).toBeInTheDocument();
    expect(screen.getByText("멘토·귀인 유입 시그널")).toBeInTheDocument();
    expect(screen.getByText("경계 패턴")).toBeInTheDocument();
    expect(screen.getByText("현재연도 실행 포인트(보조)")).toBeInTheDocument();
  });
});
