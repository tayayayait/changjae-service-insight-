import { describe, expect, it } from "vitest";
import { calculateSaju, parseTimeString, resolveBirthTime, resolveLongitude, resolveSolarBirthDate } from "@/lib/sajuEngine";
import { UserBirthData } from "@/types/result";

describe("sajuEngine", () => {
  it("parses HH:mm string", () => {
    expect(parseTimeString("14:35")).toEqual({ hour: 14, minute: 35 });
    expect(parseTimeString("")).toBeNull();
  });

  it("converts lunar date to solar date", () => {
    const converted = resolveSolarBirthDate({
      calendarType: "lunar",
      year: 2024,
      month: 1,
      day: 1,
      gender: "male",
    });

    expect(converted.wasConvertedFromLunar).toBe(true);
    expect(converted.year).toBe(2024);
    expect(converted.month).toBe(2);
    expect(converted.day).toBe(10);
  });

  it("resolves time from block when exact time is missing", () => {
    expect(resolveBirthTime({ timeBlock: "자시" })).toEqual({ hour: 0, minute: 30 });
    expect(resolveBirthTime({ timeBlock: "모름" })).toEqual({ hour: 12, minute: 0 });
  });

  it("resolves longitude for standardized region format", () => {
    expect(resolveLongitude("서울Ư별시 강남구")).toBe(126.978);
    expect(resolveLongitude("경상남도 â원시")).toBe(129.1);
  });

  it("calculates saju payload using real library API", () => {
    const input: UserBirthData = {
      calendarType: "solar",
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      location: "서울",
      gender: "female",
    };

    const result = calculateSaju(input);
    expect(result.palja.year.gan.length).toBe(1);
    expect(result.oheng).toHaveLength(5);
    expect(result.yongsin.length).toBeGreaterThan(0);
  });

  it("keeps expected pillars for 1995-06-29 04:30 in Seoul", () => {
    const input: UserBirthData = {
      calendarType: "solar",
      year: 1995,
      month: 6,
      day: 29,
      hour: 4,
      minute: 30,
      location: "서울",
      gender: "male",
    };

    const result = calculateSaju(input);
    expect(`${result.palja.year.gan}${result.palja.year.ji}`).toBe("乙亥");
    expect(`${result.palja.month.gan}${result.palja.month.ji}`).toBe("壬午");
    expect(`${result.palja.day.gan}${result.palja.day.ji}`).toBe("辛卯");
    expect(`${result.palja.time.gan}${result.palja.time.ji}`).toBe("庚寅");
  });
});
