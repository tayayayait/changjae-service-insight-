import { describe, expect, it } from "vitest";
import { buildPaljaFromPillars, calculateOhengDistribution, determineYongsin, getGanOheng, getJiOheng } from "@/lib/ohengCalculator";

describe("ohengCalculator", () => {
  it("builds palja from hanja pillars", () => {
    const palja = buildPaljaFromPillars({
      yearPillar: "갑자",
      monthPillar: "병인",
      dayPillar: "정묘",
      hourPillar: "계해",
      yearPillarHanja: "ˣ子",
      monthPillarHanja: "ܰ寅",
      dayPillarHanja: "丁卯",
      hourPillarHanja: "ͤ亥",
    });

    expect(palja.year.gan).toBe("ˣ");
    expect(palja.time.ji).toBe("亥");
    expect(palja.month.ohengJi).toBe("목");
  });

  it("supports hangul ganji mapping", () => {
    expect(getGanOheng("갑")).toBe("목");
    expect(getGanOheng("庚")).toBe("금");
    expect(getJiOheng("해")).toBe("수");
    expect(getJiOheng("辰")).toBe("토");
  });

  it("calculates distribution and includes zero percentage entries", () => {
    const palja = buildPaljaFromPillars({
      yearPillar: "갑자",
      monthPillar: "갑자",
      dayPillar: "갑자",
      hourPillar: "갑자",
    });

    const distribution = calculateOhengDistribution(palja);
    expect(distribution).toHaveLength(5);
    expect(distribution.find((item) => item.element === "목")?.count).toBe(4);
    expect(distribution.find((item) => item.element === "수")?.count).toBe(4);
    expect(distribution.find((item) => item.element === "ȭ")?.count).toBe(0);
  });

  it("returns weakest elements as yongsin", () => {
    const palja = buildPaljaFromPillars({
      yearPillar: "갑자",
      monthPillar: "갑자",
      dayPillar: "갑자",
      hourPillar: "갑자",
    });
    const distribution = calculateOhengDistribution(palja);
    const yongsin = determineYongsin(palja, distribution);
    expect(yongsin.includes("ȭ")).toBe(true);
  });
});
