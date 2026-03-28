import { describe, expect, it, vi } from "vitest";
import { buildDeterministicEnergyTrend, buildDeterministicWealthTrend } from "@/lib/sajuTrendEngine";

const sampleOheng = [
  { element: "목" as const, count: 3, percentage: 38 },
  { element: "화" as const, count: 1, percentage: 13 },
  { element: "토" as const, count: 0, percentage: 0 },
  { element: "금" as const, count: 2, percentage: 25 },
  { element: "수" as const, count: 2, percentage: 25 },
];

describe("sajuTrendEngine", () => {
  it("returns deterministic wealth trend for same input", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));

    const input = {
      oheng: sampleOheng,
      yongsin: ["목" as const, "금" as const],
      profileMeta: {
        timezone: "Asia/Seoul",
        currentYear: 2026,
      },
    };

    const first = buildDeterministicWealthTrend(input);
    const second = buildDeterministicWealthTrend(input);
    expect(first).toEqual(second);
    expect(first.series).toHaveLength(5);
    expect(first.pointEvidence).toHaveLength(5);

    vi.useRealTimers();
  });

  it("builds wealth evidence with range, delta, direction, and manseryeok raw basis", () => {
    const result = buildDeterministicWealthTrend({
      oheng: sampleOheng,
      yongsin: ["목" as const],
      profileMeta: { timezone: "Asia/Seoul", currentYear: 2026 },
    });

    expect(result.series).toHaveLength(5);
    expect(result.pointEvidence).toHaveLength(5);
    expect(result.series.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);

    result.pointEvidence.forEach((point, index) => {
      expect(point.rawBasis.source).toBe("manseryeok");
      expect(point.rawBasis.checkpoint.unit).toBe("year");
      expect(point.reasonDetails.length).toBeGreaterThan(0);
      if (index === 0) {
        expect(point.deltaFromPrev).toBe(0);
        expect(point.direction).toBe("flat");
      } else {
        const expectedDelta = point.value - result.pointEvidence[index - 1].value;
        expect(point.deltaFromPrev).toBe(expectedDelta);
        if (expectedDelta > 0) expect(point.direction).toBe("up");
        if (expectedDelta < 0) expect(point.direction).toBe("down");
        if (expectedDelta === 0) expect(point.direction).toBe("flat");
      }
    });
  });

  it("builds energy evidence with range, delta, direction, and manseryeok raw basis", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-25T00:00:00.000Z"));

    const result = buildDeterministicEnergyTrend({
      oheng: sampleOheng,
      yongsin: ["수" as const, "목" as const],
      profileMeta: { timezone: "Asia/Seoul" },
    });

    expect(result.series).toHaveLength(6);
    expect(result.pointEvidence).toHaveLength(6);
    expect(result.series.every((point) => point.value >= 0 && point.value <= 100)).toBe(true);

    result.pointEvidence.forEach((point, index) => {
      expect(point.rawBasis.source).toBe("manseryeok");
      expect(point.rawBasis.checkpoint.unit).toBe("week");
      expect(point.rawBasis.temporalPillars).toBeTruthy();
      if (index === 0) {
        expect(point.deltaFromPrev).toBe(0);
        expect(point.direction).toBe("flat");
      }
    });

    vi.useRealTimers();
  });

  it("clamps wealth seun years to supported range", () => {
    const result = buildDeterministicWealthTrend({
      oheng: sampleOheng,
      yongsin: ["금" as const],
      profileMeta: { timezone: "Asia/Seoul", currentYear: 2099 },
    });

    const targetYears = result.pointEvidence
      .map((point) => point.rawBasis.seun?.year)
      .filter((year): year is number => typeof year === "number");
    expect(targetYears.every((year) => year <= 2050 && year >= 1900)).toBe(true);
  });
});
