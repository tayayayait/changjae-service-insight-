import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFns = vi.hoisted(() => ({
  calculateSaju: vi.fn(),
  extractLoveFeatureSet: vi.fn(),
  createLoveReport: vi.fn(),
  unlockLoveReport: vi.fn(),
}));

vi.mock("@/lib/sajuEngine", () => ({
  calculateSaju: mockFns.calculateSaju,
}));

vi.mock("@/lib/loveFeatureEngine", () => ({
  extractLoveFeatureSet: mockFns.extractLoveFeatureSet,
}));

vi.mock("@/lib/loveReportStore", () => ({
  createLoveReport: mockFns.createLoveReport,
  unlockLoveReport: mockFns.unlockLoveReport,
}));

import { useLoveReportActions } from "@/hooks/love/useLoveReportActions";

describe("useLoveReportActions", () => {
  beforeEach(() => {
    mockFns.calculateSaju.mockReset();
    mockFns.extractLoveFeatureSet.mockReset();
    mockFns.createLoveReport.mockReset();
    mockFns.unlockLoveReport.mockReset();
  });

  it("preserves locked state returned by createLoveReport", async () => {
    const setRecord = vi.fn();
    const setError = vi.fn();

    mockFns.calculateSaju.mockReturnValue({ palja: {} });
    mockFns.extractLoveFeatureSet.mockReturnValue({ timeConfidence: 45 });
    mockFns.createLoveReport.mockResolvedValue({
      id: "love-report-1",
      serviceType: "future-partner",
      inputSnapshot: {
        subjectA: {
          calendarType: "solar",
          year: 1995,
          month: 6,
          day: 29,
          gender: "female",
        },
        context: {},
      },
      featureSet: { timeConfidence: 45 },
      scoreSet: {
        overall: 70,
        pull: 66,
        pace: 62,
        alignment: 68,
        repair: 64,
        timing: 58,
      },
      preview: {},
      isUnlocked: false,
      nextRefreshAt: "2026-04-23T00:00:00.000Z",
    });

    const { result } = renderHook(() =>
      useLoveReportActions({
        serviceType: "future-partner",
        resolvedServiceType: "future-partner",
        record: null,
        setRecord,
        setError,
        price: 2900,
        productCode: "LOVE_FUTURE_PARTNER_V3",
      }),
    );

    await act(async () => {
      await result.current.runAnalysis({
        subjectA: {
          calendarType: "solar",
          year: 1995,
          month: 6,
          day: 29,
          gender: "female",
        },
        context: {},
        relationMode: "solo",
      });
    });

    expect(setRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "love-report-1",
        isUnlocked: false,
      }),
    );
  });
});
