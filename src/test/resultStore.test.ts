import { beforeEach, describe, expect, it } from "vitest";
import {
  buildSajuRequestFingerprint,
  ensureGuestSessionId,
  getSajuResultByFingerprint,
  getLatestSajuResultByServiceId,
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

  it("gets latest result by service id", async () => {
    const profileData = {
      calendarType: "solar" as const,
      year: 1995,
      month: 6,
      day: 29,
      gender: "male" as const,
    };

    await saveSajuResult({
      dataPrivacyMode: "local-only",
      sourceServiceId: "saju-2026-overview",
      profileData,
      palja: {
        year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
        month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
        day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
        time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
      },
      oheng: [],
      interests: [],
      summary: "First Result",
      sections: [],
      createdAt: new Date("2026-03-20T10:00:00Z").toISOString(),
    });

    const latest = await saveSajuResult({
      dataPrivacyMode: "local-only",
      sourceServiceId: "saju-2026-overview",
      profileData,
      palja: {
        year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
        month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
        day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
        time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
      },
      oheng: [],
      interests: [],
      summary: "Second Result",
      sections: [],
      createdAt: new Date("2026-03-21T10:00:00Z").toISOString(),
    });

    const result = await getLatestSajuResultByServiceId("saju-2026-overview");
    expect(result?.id).toBe(latest.id);
    expect(result?.summary).toBe("Second Result");
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
        year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
        month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
        day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
        time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
      },
      oheng: [
        { element: "목", count: 3, percentage: 38 },
        { element: "화", count: 1, percentage: 13 },
        { element: "토", count: 0, percentage: 0 },
        { element: "금", count: 2, percentage: 25 },
        { element: "수", count: 2, percentage: 25 },
      ],
      interests: ["career"],
      summary: "기본 요약",
      sections: [{ title: "기본", interpretation: "핵심 해석", advice: "실행 조언" }],
      lifetimeScore: 91,
      daeunPeriods: [
        {
          startAge: 35,
          endAge: 44,
          startYear: 2029,
          endYear: 2038,
          gan: "정",
          ji: "유",
          oheng: "화",
          score: 93,
          keyword: "성장 흐름",
          isCurrent: false,
        },
      ],
      goldenPeriods: [{ startAge: 35, endAge: 44, startYear: 2029, endYear: 2038, reason: "핵심 전환 구간" }],
      personalityType: {
        title: "전략형",
        description: "분석적 성향",
        strengths: ["집중력"],
        weaknesses: ["과민함"],
      },
    });

    const raw = localStorage.getItem(`saju:result:${saved.id}`);
    expect(raw).toBeTruthy();
    const latest = raw ? JSON.parse(raw) : null;
    expect(latest?.consultationType).toBe("saju-lifetime-roadmap");
    expect(latest?.lifetimeScore).toBe(91);
    expect(latest?.daeunPeriods?.[0]?.startYear).toBe(2029);
    expect(latest?.goldenPeriods?.[0]?.reason).toBe("핵심 전환 구간");
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
      freeQuestion: "  직업 변화와 재정 흐름  ",
    });

    const fingerprintB = buildSajuRequestFingerprint({
      serviceType: "saju-lifetime-roadmap",
      profileData: { ...profileData },
      interests: ["money", "career"],
      freeQuestion: "직업 변화와 재정 흐름",
    });

    const fingerprintDifferentService = buildSajuRequestFingerprint({
      serviceType: "saju-career-timing",
      profileData: { ...profileData },
      interests: ["money", "career"],
      freeQuestion: "직업 변화와 재정 흐름",
    });

    expect(fingerprintA).toBe(fingerprintB);
    expect(fingerprintA).not.toBe(fingerprintDifferentService);

    const saved = await saveSajuResult({
      dataPrivacyMode: "local-only",
      requestFingerprint: fingerprintA,
      consultationType: "saju-lifetime-roadmap",
      profileData,
      palja: {
        year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
        month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
        day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
        time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
      },
      oheng: [
        { element: "목", count: 3, percentage: 38 },
        { element: "화", count: 1, percentage: 13 },
        { element: "토", count: 0, percentage: 0 },
        { element: "금", count: 2, percentage: 25 },
        { element: "수", count: 2, percentage: 25 },
      ],
      interests: ["career", "money"],
      summary: "기본 요약",
      sections: [{ title: "기본", interpretation: "핵심 해석", advice: "실행 조언" }],
    });

    const cached = await getSajuResultByFingerprint(fingerprintB);
    expect(cached?.id).toBe(saved.id);
    expect(cached?.requestFingerprint).toBe(fingerprintA);
  });
});
