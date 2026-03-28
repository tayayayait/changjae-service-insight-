import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  SajuTrendChart,
  buildBeginnerTrendExplanation,
  getIndexBandLabel,
} from "@/components/saju/SajuTrendChart";
import type { SajuTrendPointEvidence } from "@/types/result";

const baseEvidence: SajuTrendPointEvidence = {
  label: "현재",
  value: 57,
  deltaFromPrev: 0,
  direction: "flat",
  reasonSummary: "현재 흐름 근거",
  interpretation: "현재 흐름 해석",
  reasonDetails: ["현재 흐름 설명"],
  rawBasis: {
    source: "manseryeok",
    checkpoint: {
      label: "현재",
      offset: 0,
      unit: "year",
      targetDate: "2026-06-15",
      targetYear: 2026,
    },
    ohengDistribution: { 목: 38, 화: 13, 토: 0, 금: 25, 수: 25 },
    yongsin: ["목"],
    seun: { year: 2026, pillar: "병오", element: "화" },
    factorScores: {
      inflowPower: 29,
      leakagePower: 7,
      stabilityBase: 61,
      slope: 10,
      seunAdjustment: 0,
      yongsinBoost: 6,
    },
  },
};

describe("SajuTrendChart", () => {
  it("renders beginner-first fields and expandable evidence area", () => {
    render(
      <SajuTrendChart
        title="재물 흐름 추세"
        description="앞으로 10년 동안 자산 흐름의 확장과 방어 움직임을 보여주는 차트"
        data={[
          { label: "현재", value: 57 },
          { label: "1년 후", value: 66 },
          { label: "3년 후", value: 76 },
          { label: "5년 후", value: 68 },
          { label: "10년 후", value: 73 },
        ]}
        domain={[
          { label: "현재", position: 0 },
          { label: "1년 후", position: 1 },
          { label: "3년 후", position: 3 },
          { label: "5년 후", position: 5 },
          { label: "10년 후", position: 10 },
        ]}
        evidence={[baseEvidence]}
      />,
    );

    expect(screen.getByText("재물 흐름 추세")).toBeInTheDocument();
    expect(screen.getByText("지수 구간 의미")).toBeInTheDocument();
    expect(screen.getByText("현재 지수")).toBeInTheDocument();
    expect(screen.getByText("시점별 지수")).toBeInTheDocument();
    expect(screen.getByText("지수 57")).toBeInTheDocument();
    expect(screen.getByText("근거 보기")).toBeInTheDocument();
    expect(screen.getByText(/왜 변했는지:/)).toBeInTheDocument();
    expect(screen.getByText(/피할 일:/)).toBeInTheDocument();
    expect(screen.queryByText(/Source:/)).not.toBeInTheDocument();
  });

  it("maps index band boundaries deterministically", () => {
    expect(getIndexBandLabel(39)).toBe("주의");
    expect(getIndexBandLabel(40)).toBe("보통·관리 필요");
    expect(getIndexBandLabel(59)).toBe("보통·관리 필요");
    expect(getIndexBandLabel(60)).toBe("양호·확장 가능");
    expect(getIndexBandLabel(74)).toBe("양호·확장 가능");
    expect(getIndexBandLabel(75)).toBe("강한 흐름·과속 주의");
  });

  it("creates non-repetitive explanations from delta, direction, and rawBasis", () => {
    const wealthUp: SajuTrendPointEvidence = {
      ...baseEvidence,
      label: "3년 후",
      value: 76,
      deltaFromPrev: 10,
      direction: "up",
      rawBasis: {
        ...baseEvidence.rawBasis,
        checkpoint: {
          ...baseEvidence.rawBasis.checkpoint,
          label: "3년 후",
          offset: 3,
          targetDate: "2029-06-15",
          targetYear: 2029,
        },
        seun: { year: 2029, pillar: "기유", element: "금" },
        factorScores: {
          ...baseEvidence.rawBasis.factorScores,
          seunAdjustment: 5,
        },
      },
    };

    const energyDown: SajuTrendPointEvidence = {
      ...baseEvidence,
      label: "8주",
      value: 44,
      deltaFromPrev: -16,
      direction: "down",
      rawBasis: {
        source: "manseryeok",
        checkpoint: {
          label: "8주",
          offset: 8,
          unit: "week",
          targetDate: "2026-05-13",
          targetYear: 2026,
        },
        ohengDistribution: { 목: 38, 화: 13, 토: 0, 금: 25, 수: 25 },
        yongsin: ["수"],
        temporalPillars: {
          yearPillar: "병오",
          monthPillar: "계사",
          dayPillar: "을묘",
          yearElement: "화",
          monthElement: "화",
          dayElement: "목",
        },
        factorScores: {
          focusPower: 24,
          recoveryPower: 19,
          fatiguePressure: 26,
          baseRhythm: 55,
          temporalAdjustment: -3,
          yongsinBoost: 0,
        },
      },
    };

    const wealthExplanation = buildBeginnerTrendExplanation(wealthUp);
    const energyExplanation = buildBeginnerTrendExplanation(energyDown);

    expect(wealthExplanation.statusLabel).toBe("변동 주의");
    expect(energyExplanation.statusLabel).toBe("변동 주의");
    expect(wealthExplanation.whyChanged).not.toEqual(energyExplanation.whyChanged);
    expect(wealthExplanation.doNow).not.toEqual(energyExplanation.doNow);
    expect(energyExplanation.avoidNow).toContain("일정");
  });
});
