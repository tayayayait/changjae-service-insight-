import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type { SajuDaeunShiftPayload, SajuResult } from "@/types/result";

const baseResult: SajuResult = {
  id: "result-daeun-timeline",
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
  summary: "대운 전환 요약",
  sections: [],
};

const buildDaeunPayload = (): SajuDaeunShiftPayload => ({
  coreQuestion: "지금 전환기에서 무엇이 바뀌고 어떻게 대비할까?",
  coreInsights: ["핵심 인사이트 1", "핵심 인사이트 2"],
  actionNow: ["즉시 실행 1", "즉시 실행 2"],
  evidence: ["근거 1", "근거 2"],
  analysisBlocks: [
    {
      windowLabel: "전환 전 준비기",
      timeRange: "2024~2025년",
      coreFlow: "전환 전 준비기 핵심 흐름.",
      evidence: "전환 전 준비기 근거.",
      opportunities: ["준비기 기회 1", "준비기 기회 2"],
      risks: ["준비기 리스크 1", "준비기 리스크 2"],
      actionStrategy: ["준비기 행동 1", "준비기 행동 2"],
    },
    {
      windowLabel: "전환기",
      timeRange: "2026~2027년",
      coreFlow: "전환기 핵심 흐름.",
      evidence: "전환기 근거.",
      opportunities: ["전환기 기회 1", "전환기 기회 2"],
      risks: ["전환기 리스크 1", "전환기 리스크 2"],
      actionStrategy: ["전환기 행동 1", "전환기 행동 2"],
    },
    {
      windowLabel: "전환 후 재배치기",
      timeRange: "2028~2030년",
      coreFlow: "전환 후 재배치기 핵심 흐름.",
      evidence: "전환 후 재배치기 근거.",
      opportunities: ["재배치기 기회 1", "재배치기 기회 2"],
      risks: ["재배치기 리스크 1", "재배치기 리스크 2"],
      actionStrategy: ["재배치기 행동 1", "재배치기 행동 2"],
    },
    {
      windowLabel: "전환 후 정착기",
      timeRange: "2031~2036년",
      coreFlow: "전환 후 정착기 핵심 흐름.",
      evidence: "전환 후 정착기 근거.",
      opportunities: ["정착기 기회 1", "정착기 기회 2"],
      risks: ["정착기 리스크 1", "정착기 리스크 2"],
      actionStrategy: ["정착기 행동 1", "정착기 행동 2"],
    },
  ],
  transitionSignal: "2026년 전환 촉발 연도입니다.",
  ninetyDayActions: ["90일 안정화 1", "90일 안정화 2", "90일 안정화 3"],
  avoidanceScenario: ["회피 시나리오 1", "회피 시나리오 2"],
  transitionSignals: ["전환 신호 1", "전환 신호 2"],
  changePoints: ["변화 포인트 1", "변화 포인트 2"],
  readinessActions: ["준비 행동 1", "준비 행동 2"],
  phaseRoadmap: [
    {
      phaseLabel: "전환 전 준비기",
      ageRange: "34~35세",
      yearRange: "2024~2025년",
      coreFlow: "전환 전 준비기 핵심 흐름.",
      evidence: "전환 전 준비기 근거.",
      opportunities: ["준비기 기회 1", "준비기 기회 2"],
      risks: ["준비기 리스크 1", "준비기 리스크 2"],
      actionStrategy: ["준비기 행동 1", "준비기 행동 2"],
    },
    {
      phaseLabel: "전환기",
      ageRange: "36~37세",
      yearRange: "2026~2027년",
      coreFlow: "전환기 핵심 흐름.",
      evidence: "전환기 근거.",
      opportunities: ["전환기 기회 1", "전환기 기회 2"],
      risks: ["전환기 리스크 1", "전환기 리스크 2"],
      actionStrategy: ["전환기 행동 1", "전환기 행동 2"],
    },
    {
      phaseLabel: "전환 후 재배치기",
      ageRange: "38~40세",
      yearRange: "2028~2030년",
      coreFlow: "전환 후 재배치기 핵심 흐름.",
      evidence: "전환 후 재배치기 근거.",
      opportunities: ["재배치기 기회 1", "재배치기 기회 2"],
      risks: ["재배치기 리스크 1", "재배치기 리스크 2"],
      actionStrategy: ["재배치기 행동 1", "재배치기 행동 2"],
    },
    {
      phaseLabel: "전환 후 정착기",
      ageRange: "41~46세",
      yearRange: "2031~2036년",
      coreFlow: "전환 후 정착기 핵심 흐름.",
      evidence: "전환 후 정착기 근거.",
      opportunities: ["정착기 기회 1", "정착기 기회 2"],
      risks: ["정착기 리스크 1", "정착기 리스크 2"],
      actionStrategy: ["정착기 행동 1", "정착기 행동 2"],
    },
  ],
  longHorizonDirection: [
    "1~2년: 전환 직후 기준 고정.",
    "3~5년: 재배치된 축 반복.",
    "6~10년: 정착 후 선택 확장.",
  ],
  preAtPostDiff: ["전환 전: 관성 유지.", "전환기: 기준 재정렬.", "전환 후: 정착."],
});

describe("SajuCollectionTabs daeun timeline", () => {
  it("renders daeun timeline and long horizon sections before core cards", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: { "saju-daeun-shift": buildDaeunPayload() },
      summaries: { "saju-daeun-shift": "대운 전환 요약" },
      sectionsMap: { "saju-daeun-shift": [] },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-daeun-shift"]} onUnlockRequest={() => {}} />);

    const timelineHeading = screen.getByText("전환 흐름 타임라인(4단계)");
    const longHorizonHeading = screen.getByText("인생 단계별 변화(1~2/3~5/6~10년)");
    const stabilizationHeading = screen.getByText("90일 안정화");
    const coreHeading = screen.getByText("핵심 인사이트");

    expect(timelineHeading.compareDocumentPosition(longHorizonHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(longHorizonHeading.compareDocumentPosition(stabilizationHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(timelineHeading.compareDocumentPosition(coreHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/현재~2년/)).toBeInTheDocument();
    expect(screen.getByText(/3~5년/)).toBeInTheDocument();
    expect(screen.getByText(/6~10년/)).toBeInTheDocument();
    expect(screen.getByText(/2026~2028년/)).toBeInTheDocument();
    expect(screen.getByText(/2029~2031년/)).toBeInTheDocument();
    expect(screen.getByText(/2032~2036년/)).toBeInTheDocument();

    expect(screen.getByText("전환 전 준비기")).toBeInTheDocument();
    expect(screen.getByText("전환기")).toBeInTheDocument();
    expect(screen.getByText("전환 후 재배치기")).toBeInTheDocument();
    expect(screen.getByText("전환 후 정착기")).toBeInTheDocument();
  });

  it("keeps daeun comparison as a compact summary and hides generic analysis block labels", () => {
    const result: SajuResult = {
      ...baseResult,
      reportPayloads: { "saju-daeun-shift": buildDaeunPayload() },
      summaries: { "saju-daeun-shift": "대운 전환 요약" },
      sectionsMap: { "saju-daeun-shift": [] },
    };

    render(<SajuCollectionTabs result={result} serviceIds={["saju-daeun-shift"]} onUnlockRequest={() => {}} />);

    expect(screen.getByText("전환 전/전환기/전환 후 비교 요약")).toBeInTheDocument();
    expect(screen.queryByText("주요 기회")).not.toBeInTheDocument();
  });
});
