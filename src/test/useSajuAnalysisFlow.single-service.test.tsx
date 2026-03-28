import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserBirthData } from "@/types/result";

const mockFns = vi.hoisted(() => ({
  calculateSaju: vi.fn(),
  getSajuAnalysis: vi.fn(),
  buildSajuRequestFingerprint: vi.fn(),
  getSajuResultByFingerprint: vi.fn(),
  saveSajuResult: vi.fn(),
  ensureGuestSessionId: vi.fn(),
  fetchFortune: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@/lib/sajuEngine", () => ({
  calculateSaju: mockFns.calculateSaju,
  parseTimeString: vi.fn(),
}));

vi.mock("@/lib/geminiClient", () => ({
  getSajuAnalysis: mockFns.getSajuAnalysis,
}));

vi.mock("@/lib/resultStore", () => ({
  SAJU_ANALYSIS_PROMPT_VERSION: "2026-03-19",
  buildSajuRequestFingerprint: mockFns.buildSajuRequestFingerprint,
  getSajuResultByFingerprint: mockFns.getSajuResultByFingerprint,
  saveSajuResult: mockFns.saveSajuResult,
  ensureGuestSessionId: mockFns.ensureGuestSessionId,
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: mockFns.toast,
}));

vi.mock("@/store/useFortuneStore", () => ({
  useFortuneStore: {
    getState: () => ({
      fetchFortune: mockFns.fetchFortune,
    }),
  },
}));

import { useSajuAnalysisFlow } from "@/hooks/saju/useSajuAnalysisFlow";

const BASE_BIRTH_DATA: UserBirthData = {
  name: "Tester",
  calendarType: "solar",
  year: 1995,
  month: 6,
  day: 29,
  hour: 4,
  minute: 30,
  location: "Seoul",
  gender: "male",
  birthPrecision: "exact",
};

const createParams = (overrides?: {
  serviceId?: string | null;
  mode?: string;
  categoryId?: string;
}) => {
  const navigate = vi.fn();
  const loadResultById = vi.fn(async () => undefined);
  const searchParams = new URLSearchParams();

  if (overrides?.mode) {
    searchParams.set("mode", overrides.mode);
  }

  if (overrides?.categoryId) {
    searchParams.set("categoryId", overrides.categoryId);
  }

  return {
    params: {
      navigate,
      searchParams,
      serviceId: overrides?.serviceId ?? null,
      updateProfile: vi.fn(),
      loadResultById,
      setIsSubmitting: vi.fn(),
      setAnalysisPhase: vi.fn(),
      dataPrivacyMode: "local-only" as const,
      calendarType: "solar" as const,
      year: "1995",
      month: "6",
      day: "29",
      birthPrecision: "exact" as const,
      timeBlock: "",
      exactTime: "04:30",
      place: "Seoul",
      gender: "male" as const,
      name: "Tester",
      interests: [],
      freeQuestion: "test question",
    },
    navigate,
    loadResultById,
  };
};

describe("useSajuAnalysisFlow single service mode", () => {
  beforeEach(() => {
    mockFns.calculateSaju.mockReset();
    mockFns.getSajuAnalysis.mockReset();
    mockFns.buildSajuRequestFingerprint.mockReset();
    mockFns.getSajuResultByFingerprint.mockReset();
    mockFns.saveSajuResult.mockReset();
    mockFns.ensureGuestSessionId.mockReset();
    mockFns.fetchFortune.mockReset();
    mockFns.toast.mockReset();

    mockFns.calculateSaju.mockReturnValue({
      palja: {
        year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
        month: { gan: "을", ji: "축", ohengGan: "목", ohengJi: "토" },
        day: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
        time: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
      },
      oheng: [],
      yongsin: [],
      sinsal: [],
      solarDate: "1995-06-29",
    } as const);

    mockFns.getSajuResultByFingerprint.mockResolvedValue(null);
    mockFns.buildSajuRequestFingerprint.mockReturnValue("fp-single-service");
    mockFns.getSajuAnalysis.mockImplementation(async (request: { serviceType: string }) => ({
      serviceType: request.serviceType,
      reportTemplateVersion: "saju-report-v2",
      reportPayload: {
        coreQuestion: "core question",
        coreInsights: [],
        actionNow: [],
        evidence: [],
        analysisBlocks: [],
      },
      summary: `${request.serviceType} summary`,
      sections: [],
    }));
    mockFns.ensureGuestSessionId.mockReturnValue("guest-session-1");
    mockFns.saveSajuResult.mockImplementation(async (payload: Record<string, unknown>) => ({
      id: "result-1",
      ...payload,
    }));
    mockFns.fetchFortune.mockResolvedValue(undefined);
  });

  it("prioritizes serviceId over mode=lifetime and saves identifiers as the selected service", async () => {
    const { params } = createParams({
      serviceId: "saju-career-timing",
      mode: "lifetime",
    });
    const { result } = renderHook(() => useSajuAnalysisFlow(params));

    await act(async () => {
      await result.current.analyzeWithBirthData(BASE_BIRTH_DATA);
    });

    expect(mockFns.getSajuAnalysis).toHaveBeenCalledTimes(1);
    expect(mockFns.getSajuAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ serviceType: "saju-career-timing" }),
      expect.any(Object),
    );

    expect(mockFns.buildSajuRequestFingerprint).toHaveBeenCalledWith(
      expect.objectContaining({ serviceType: "saju-career-timing" }),
    );

    expect(mockFns.saveSajuResult).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceServiceId: "saju-career-timing",
        consultationType: "saju-career-timing",
        unlockedItems: ["saju-career-timing"],
      }),
    );
  });

  it("prioritizes serviceId over mode=new-year-2026", async () => {
    const { params } = createParams({
      serviceId: "saju-2026-health-balance",
      mode: "new-year-2026",
    });
    const { result } = renderHook(() => useSajuAnalysisFlow(params));

    await act(async () => {
      await result.current.analyzeWithBirthData(BASE_BIRTH_DATA);
    });

    expect(mockFns.getSajuAnalysis).toHaveBeenCalledTimes(1);
    expect(mockFns.getSajuAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({ serviceType: "saju-2026-health-balance" }),
      expect.any(Object),
    );
    expect(mockFns.buildSajuRequestFingerprint).toHaveBeenCalledWith(
      expect.objectContaining({ serviceType: "saju-2026-health-balance" }),
    );
  });

  it("navigates to personal fortune page without awaiting preload tasks in today mode", async () => {
    const { params, navigate, loadResultById } = createParams({
      mode: "today",
      categoryId: "career",
    });

    let resolveLoad: (() => void) | undefined;
    params.loadResultById = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    let resolveFortune: (() => void) | undefined;
    mockFns.fetchFortune.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFortune = resolve;
        }),
    );

    const { result } = renderHook(() => useSajuAnalysisFlow(params));

    await act(async () => {
      await result.current.analyzeWithBirthData(BASE_BIRTH_DATA);
    });

    expect(loadResultById).not.toHaveBeenCalled();
    expect(params.loadResultById).toHaveBeenCalledWith("result-1");
    expect(mockFns.fetchFortune).toHaveBeenCalledWith(
      expect.objectContaining({ id: "result-1" }),
      "today",
      "career",
    );
    expect(navigate).toHaveBeenCalledWith("/fortune/personal?categoryId=career");

    resolveFortune?.();
    resolveLoad?.();
  });

  it("navigates to result page without awaiting result prefetch", async () => {
    const { params, navigate, loadResultById } = createParams({
      serviceId: "saju-career-timing",
    });

    let resolveLoad: (() => void) | undefined;
    params.loadResultById = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    );

    const { result } = renderHook(() => useSajuAnalysisFlow(params));

    await act(async () => {
      await result.current.analyzeWithBirthData(BASE_BIRTH_DATA);
    });

    expect(loadResultById).not.toHaveBeenCalled();
    expect(params.loadResultById).toHaveBeenCalledWith("result-1");
    expect(navigate).toHaveBeenCalledWith("/result/result-1");

    resolveLoad?.();
  });

  it("preloads total category when today mode categoryId is missing", async () => {
    const { params, navigate } = createParams({ mode: "today" });
    const { result } = renderHook(() => useSajuAnalysisFlow(params));

    await act(async () => {
      await result.current.analyzeWithBirthData(BASE_BIRTH_DATA);
    });

    expect(mockFns.fetchFortune).toHaveBeenCalledWith(
      expect.objectContaining({ id: "result-1" }),
      "today",
      "total",
    );
    expect(navigate).toHaveBeenCalledWith("/fortune/personal");
  });
});
