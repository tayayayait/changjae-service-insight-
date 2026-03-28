import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SajuResult } from "@/types/result";

const mockFns = vi.hoisted(() => ({
  useResultStore: vi.fn(),
  toast: vi.fn(),
  trackEvent: vi.fn(),
  unlockSajuResultLocally: vi.fn(),
}));

vi.mock("@/store/useResultStore", () => ({
  useResultStore: mockFns.useResultStore,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockFns.toast,
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: mockFns.trackEvent,
}));

vi.mock("@/lib/share", () => ({
  copyResultUrl: vi.fn(async () => "https://example.com/result/1"),
  downloadShareCard: vi.fn(async () => undefined),
  tryNativeShare: vi.fn(async () => true),
}));

vi.mock("@/lib/resultStore", () => ({
  unlockSajuResultLocally: mockFns.unlockSajuResultLocally,
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
    year: { gan: "a", ji: "b", ohengGan: "wood", ohengJi: "fire" },
    month: { gan: "c", ji: "d", ohengGan: "wood", ohengJi: "water" },
    day: { gan: "e", ji: "f", ohengGan: "earth", ohengJi: "metal" },
    time: { gan: "g", ji: "h", ohengGan: "water", ohengJi: "wood" },
  } as any,
  oheng: [{ element: "wood", count: 2, percentage: 50 }] as any,
  interests: [],
  summary: "summary",
  sections: [],
});

describe("useResultPageFlow checkout success", () => {
  beforeEach(() => {
    mockFns.useResultStore.mockReset();
    mockFns.toast.mockReset();
    mockFns.trackEvent.mockReset();
    mockFns.unlockSajuResultLocally.mockReset();
  });

  it("unlocks local result and reloads current result after payment success", async () => {
    const loadResultById = vi.fn(async () => undefined);
    const loadLatestResult = vi.fn(async () => undefined);
    const result = createBaseResult();
    result.isLocked = true;

    mockFns.useResultStore.mockReturnValue({
      currentResult: result,
      loadLatestResult,
      loadResultById,
      isLoading: false,
      error: null,
    });

    const { result: hookResult } = renderHook(() => useResultPageFlow("result-1"));

    act(() => {
      hookResult.current.handleUnlockRequest("saju-career-timing");
    });

    await act(async () => {
      await hookResult.current.handleCheckoutSuccess({
        orderNumber: "order-1",
        reportId: "report-1",
        paymentResult: { success: true } as any,
        buyerInfo: { name: "buyer", phone: "01012345678", email: "buyer@example.com" },
        ownerKey: "owner-key",
      });
    });

    expect(mockFns.unlockSajuResultLocally).toHaveBeenCalledWith({
      resultId: "result-1",
      serviceId: "saju-career-timing",
    });
    expect(loadResultById).toHaveBeenCalledWith("result-1");
    expect(loadLatestResult).not.toHaveBeenCalled();
  });
});
