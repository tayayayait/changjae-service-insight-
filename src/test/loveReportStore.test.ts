import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateLoveReportRequest } from "@/lib/loveReportStore";

const invokeMock = vi.hoisted(() => vi.fn());
const ensureGuestSessionIdMock = vi.hoisted(() => vi.fn(() => "guest-session-test"));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock("@/lib/resultStore", () => ({
  ensureGuestSessionId: ensureGuestSessionIdMock,
}));

import { createLoveReport } from "@/lib/loveReportStore";

const buildRequest = (): CreateLoveReportRequest =>
  ({
    serviceType: "future-partner",
    relationMode: "solo",
    inputSnapshot: {
      subjectA: {
        calendarType: "solar",
        year: 1995,
        month: 6,
        day: 29,
        gender: "female",
        birthPrecision: "unknown",
        location: "서울",
      },
      context: {},
    },
    featureSet: {},
  }) as CreateLoveReportRequest;

describe("loveReportStore", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    ensureGuestSessionIdMock.mockClear();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("creates report and persists local cache/index", async () => {
    const req = buildRequest();
    const report = {
      id: "love-report-1",
      serviceType: req.serviceType,
      inputSnapshot: req.inputSnapshot,
      featureSet: req.featureSet,
      scoreSet: {
        overall: 70,
        pull: 68,
        pace: 64,
        alignment: 72,
        repair: 66,
        timing: 74,
      },
      preview: {},
      isUnlocked: false,
      nextRefreshAt: "2026-04-01T00:00:00.000Z",
    };

    invokeMock.mockResolvedValueOnce({
      data: { ok: true, data: report },
      error: null,
    });

    const created = await createLoveReport(req);

    expect(created).toEqual(report);
    expect(invokeMock).toHaveBeenCalledWith(
      "love-future-partner-api",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "create",
        }),
      }),
    );
    expect(ensureGuestSessionIdMock).toHaveBeenCalledTimes(1);

    const cached = localStorage.getItem("saju:love-report:love-report-1");
    const index = localStorage.getItem("saju:love-report-index");
    expect(cached).toBeTruthy();
    expect(index).toContain("love-report-1");
  });

  it("fails fast when create request does not resolve", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementationOnce(() => new Promise(() => {}));

    const promise = createLoveReport(buildRequest());
    const assertion = expect(promise).rejects.toThrow("timed out");

    await vi.advanceTimersByTimeAsync(45_000);
    await assertion;
  });
});
