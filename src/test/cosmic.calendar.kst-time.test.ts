import { describe, expect, it } from "vitest";
import {
  getDelayToNextKstMonth,
  getKstYearMonth,
} from "@/hooks/astrology/useCosmicCalendarFlow";

describe("cosmic calendar KST month helpers", () => {
  it("returns March for 2026-03-31T14:59:59Z", () => {
    const result = getKstYearMonth(new Date("2026-03-31T14:59:59.000Z"));
    expect(result).toEqual({ year: 2026, month: 3 });
  });

  it("returns April for 2026-03-31T15:00:00Z", () => {
    const result = getKstYearMonth(new Date("2026-03-31T15:00:00.000Z"));
    expect(result).toEqual({ year: 2026, month: 4 });
  });

  it("calculates delay to next KST month boundary", () => {
    const delay = getDelayToNextKstMonth(new Date("2026-03-31T14:59:59.000Z"));
    expect(delay).toBe(1_000);
  });
});
