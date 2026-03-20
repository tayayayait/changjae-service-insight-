import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Palja } from "@/types/result";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { getSajuAnalysis } from "@/lib/geminiClient";

const samplePalja: Palja = {
  year: { gan: "을", ji: "해", ohengGan: "목", ohengJi: "수" },
  month: { gan: "임", ji: "오", ohengGan: "수", ohengJi: "화" },
  day: { gan: "신", ji: "묘", ohengGan: "금", ohengJi: "목" },
  time: { gan: "경", ji: "인", ohengGan: "금", ohengJi: "목" },
};

describe("getSajuAnalysis", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.useRealTimers();
  });

  it("passes serviceType=saju-lifetime-roadmap and parses lifetime response", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
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
      },
      error: null,
    });

    const response = await getSajuAnalysis({
      serviceType: "saju-lifetime-roadmap",
      sajuData: {
        palja: samplePalja,
        oheng: [
          { element: "목", count: 3, percentage: 38 },
          { element: "화", count: 1, percentage: 13 },
          { element: "토", count: 0, percentage: 0 },
          { element: "금", count: 2, percentage: 25 },
          { element: "수", count: 2, percentage: 25 },
        ],
      },
      interests: ["career"],
    });

    expect(invokeMock).toHaveBeenCalledWith(
      "saju-lifetime-api",
      expect.objectContaining({
        body: expect.objectContaining({ serviceType: "saju-lifetime-roadmap" }),
      }),
    );
    expect("lifetimeScore" in response).toBe(true);
    if ("lifetimeScore" in response) {
      expect(response.lifetimeScore).toBe(91);
      expect(response.daeunPeriods[0].startYear).toBe(2029);
      expect(response.goldenPeriods[0].reason).toBe("핵심 상승 구간");
      expect(response.serviceType).toBe("saju-lifetime-roadmap");
      expect(response.reportPayload.longTermFlow).toBe("요약");
      expect(response.reportTemplateVersion).toBe("saju-report-v2");
    }
  });

  it("parses service-specific payload for saju-career-timing", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        summary: "커리어 요약",
        sections: [{ title: "타이밍", interpretation: "상승 구간", advice: "준비하세요" }],
        reportTemplateVersion: "saju-report-v2",
        reportPayload: {
          coreInsights: ["핵심 인사이트"],
          actionNow: ["액션 1"],
          evidence: ["근거 1"],
          careerWindow: "2026-2027 이동 적기",
          decisionTree: ["이직", "역할 확장"],
          executionChecklist: ["포트폴리오 업데이트", "추천인 확보"],
        },
      },
      error: null,
    });

    const response = await getSajuAnalysis({
      serviceType: "saju-career-timing",
      sajuData: {
        palja: samplePalja,
        oheng: [
          { element: "목", count: 3, percentage: 38 },
          { element: "화", count: 1, percentage: 13 },
          { element: "토", count: 0, percentage: 0 },
          { element: "금", count: 2, percentage: 25 },
          { element: "수", count: 2, percentage: 25 },
        ],
      },
      interests: ["career"],
    });

    expect(response.serviceType).toBe("saju-career-timing");
    expect("lifetimeScore" in response).toBe(false);
    if (response.serviceType === "saju-career-timing") {
      expect(response.reportTemplateVersion).toBe("saju-report-v2");
      expect(response.reportPayload.careerWindow).toContain("2026");
      expect(response.reportPayload.executionChecklist[0]).toContain("포트폴리오");
    }
  });

  it("fails fast when analyze-saju invoke never resolves", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementationOnce(() => new Promise(() => {}));

    const promise = getSajuAnalysis({
      serviceType: "saju-lifetime-roadmap",
      sajuData: {
        palja: samplePalja,
        oheng: [
          { element: "목", count: 3, percentage: 38 },
          { element: "화", count: 1, percentage: 13 },
          { element: "토", count: 0, percentage: 0 },
          { element: "금", count: 2, percentage: 25 },
          { element: "수", count: 2, percentage: 25 },
        ],
      },
      interests: ["career"],
    });

    const assertion = expect(promise).rejects.toThrow("요청 시간이 초과되었습니다.");
    await vi.advanceTimersByTimeAsync(45_000);
    await assertion;
  });
});
