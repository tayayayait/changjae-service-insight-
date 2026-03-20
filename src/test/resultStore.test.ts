import { beforeEach, describe, expect, it } from "vitest";
import {
  buildSajuRequestFingerprint,
  ensureGuestSessionId,
  getSajuResultByFingerprint,
  saveSajuResult,
} from "@/lib/resultStore";

describe("resultStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates and reuses guest session id", () => {
    const first = ensureGuestSessionId();
    const second = ensureGuestSessionId();

    expect(first).toBeTruthy();
    expect(first).toBe(second);
  });

  it("persists lifetime fields in local storage and loads them back", async () => {
    const saved = await saveSajuResult({
      dataPrivacyMode: "local-only",
      consultationType: "saju-lifetime-roadmap",
      profileData: {
        calendarType: "solar",
        year: 1995,
        month: 6,
        day: 29,
        hour: 4,
        minute: 30,
        location: "서울",
        gender: "male",
      },
      palja: {
        year: { gan: "을", ji: "해", ohengGan: "목", ohengJi: "수" },
        month: { gan: "임", ji: "오", ohengGan: "수", ohengJi: "화" },
        day: { gan: "신", ji: "묘", ohengGan: "금", ohengJi: "목" },
        time: { gan: "경", ji: "인", ohengGan: "금", ohengJi: "목" },
      },
      oheng: [
        { element: "목", count: 3, percentage: 38 },
        { element: "화", count: 1, percentage: 13 },
        { element: "토", count: 0, percentage: 0 },
        { element: "금", count: 2, percentage: 25 },
        { element: "수", count: 2, percentage: 25 },
      ],
      interests: ["career"],
      summary: "요약",
      sections: [{ title: "기본", interpretation: "해석", advice: "조언" }],
      lifetimeScore: 91,
      daeunPeriods: [
        {
          startAge: 35,
          endAge: 44,
          startYear: 2029,
          endYear: 2038,
          gan: "정",
          ji: "묘",
          oheng: "목",
          score: 93,
          keyword: "풍요로운 수확",
          isCurrent: false,
        },
      ],
      goldenPeriods: [{ startAge: 35, endAge: 44, startYear: 2029, endYear: 2038, reason: "핵심 상승 구간" }],
      personalityType: {
        title: "전략형",
        description: "설명",
        strengths: ["집중력"],
        weaknesses: ["완고함"],
      },
    });

    const raw = localStorage.getItem(`saju:result:${saved.id}`);
    expect(raw).toBeTruthy();
    const latest = raw ? JSON.parse(raw) : null;
    expect(latest?.consultationType).toBe("saju-lifetime-roadmap");
    expect(latest?.lifetimeScore).toBe(91);
    expect(latest?.daeunPeriods?.[0]?.startYear).toBe(2029);
    expect(latest?.goldenPeriods?.[0]?.reason).toBe("핵심 상승 구간");
  });

  it("builds deterministic fingerprint and reuses cached result", async () => {
    const profileData = {
      calendarType: "solar" as const,
      year: 1995,
      month: 6,
      day: 29,
      hour: 4,
      minute: 30,
      location: "서울",
      gender: "male" as const,
      birthPrecision: "exact" as const,
    };

    const fingerprintA = buildSajuRequestFingerprint({
      serviceType: "saju-lifetime-roadmap",
      profileData,
      interests: ["career", "money"],
      freeQuestion: "  올해 이직 타이밍은?  ",
    });

    const fingerprintB = buildSajuRequestFingerprint({
      serviceType: "saju-lifetime-roadmap",
      profileData: { ...profileData },
      interests: ["money", "career"],
      freeQuestion: "올해 이직 타이밍은?",
    });

    const fingerprintDifferentService = buildSajuRequestFingerprint({
      serviceType: "saju-career-timing",
      profileData: { ...profileData },
      interests: ["money", "career"],
      freeQuestion: "올해 이직 타이밍은?",
    });

    expect(fingerprintA).toBe(fingerprintB);
    expect(fingerprintA).not.toBe(fingerprintDifferentService);

    const saved = await saveSajuResult({
      dataPrivacyMode: "local-only",
      requestFingerprint: fingerprintA,
      consultationType: "saju-lifetime-roadmap",
      profileData,
      palja: {
        year: { gan: "을", ji: "해", ohengGan: "목", ohengJi: "수" },
        month: { gan: "임", ji: "오", ohengGan: "수", ohengJi: "화" },
        day: { gan: "신", ji: "묘", ohengGan: "금", ohengJi: "목" },
        time: { gan: "경", ji: "인", ohengGan: "금", ohengJi: "목" },
      },
      oheng: [
        { element: "목", count: 3, percentage: 38 },
        { element: "화", count: 1, percentage: 13 },
        { element: "토", count: 0, percentage: 0 },
        { element: "금", count: 2, percentage: 25 },
        { element: "수", count: 2, percentage: 25 },
      ],
      interests: ["career", "money"],
      summary: "요약",
      sections: [{ title: "기본", interpretation: "해석", advice: "조언" }],
    });

    const cached = await getSajuResultByFingerprint(fingerprintB);
    expect(cached?.id).toBe(saved.id);
    expect(cached?.requestFingerprint).toBe(fingerprintA);
  });
});
