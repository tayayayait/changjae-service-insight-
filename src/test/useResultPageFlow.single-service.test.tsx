import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SajuResult } from "@/types/result";

const mockFns = vi.hoisted(() => ({
  useResultStore: vi.fn(),
  toast: vi.fn(),
  trackEvent: vi.fn(),
}));

vi.mock("@/store/useResultStore", () => ({
  useResultStore: mockFns.useResultStore,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockFns.toast,
}));

vi.mock("@/lib/share", () => ({
  copyResultUrl: vi.fn(async () => "https://example.com/result/1"),
  downloadShareCard: vi.fn(async () => undefined),
  tryNativeShare: vi.fn(async () => true),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: mockFns.trackEvent,
}));

import { useResultPageFlow } from "@/hooks/saju/useResultPageFlow";

const createBaseResult = (): SajuResult => ({
  id: "result-1",
  profileData: {
    calendarType: "solar",
    year: 1995,
    month: 6,
    day: 29,
    gender: "male",
  },
  palja: {
    year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
    month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
    day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
    time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
  },
  oheng: [{ element: "목", count: 2, percentage: 50 }],
  interests: [],
  summary: "기본 요약",
  sections: [],
});

describe("useResultPageFlow single-service selection", () => {
  beforeEach(() => {
    mockFns.useResultStore.mockReset();
    mockFns.toast.mockReset();
    mockFns.trackEvent.mockReset();
  });

  it("uses unlockedItems first when multiple payloads exist", () => {
    const result = createBaseResult();
    result.reportPayloads = {
      "saju-lifetime-roadmap": {} as never,
      "saju-career-timing": {} as never,
    };
    result.unlockedItems = ["saju-career-timing"];
    result.consultationType = "lifetime";

    mockFns.useResultStore.mockReturnValue({
      currentResult: result,
      loadLatestResult: vi.fn(),
      loadResultById: vi.fn(),
      isLoading: false,
      error: null,
    });

    const { result: hookResult } = renderHook(() => useResultPageFlow());
    expect(hookResult.current.getTabServiceIds()).toEqual(["saju-career-timing"]);
  });

  it("forces one legacy lifetime service by default mode order", () => {
    const result = createBaseResult();
    result.reportPayloads = {
      "saju-lifetime-roadmap": {} as never,
      "saju-career-timing": {} as never,
    };
    result.consultationType = "lifetime";

    mockFns.useResultStore.mockReturnValue({
      currentResult: result,
      loadLatestResult: vi.fn(),
      loadResultById: vi.fn(),
      isLoading: false,
      error: null,
    });

    const { result: hookResult } = renderHook(() => useResultPageFlow());
    expect(hookResult.current.getTabServiceIds()).toEqual(["saju-lifetime-roadmap"]);
  });

  it("forces one legacy new-year service by default mode order", () => {
    const result = createBaseResult();
    result.reportPayloads = {
      "saju-2026-health-balance": {} as never,
      "saju-2026-overview": {} as never,
    };
    result.consultationType = "new-year-2026";

    mockFns.useResultStore.mockReturnValue({
      currentResult: result,
      loadLatestResult: vi.fn(),
      loadResultById: vi.fn(),
      isLoading: false,
      error: null,
    });

    const { result: hookResult } = renderHook(() => useResultPageFlow());
    expect(hookResult.current.getTabServiceIds()).toEqual(["saju-2026-overview"]);
  });
});
