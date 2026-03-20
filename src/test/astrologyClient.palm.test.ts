import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());
const analyzePalmImageClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock("@/lib/palmLocalAnalyzer", () => ({
  analyzePalmImageClient: analyzePalmImageClientMock,
  PalmClientAnalysisError: class PalmClientAnalysisError extends Error {
    code?: string;
    quality?: unknown;
    constructor(code: string, message: string, quality?: unknown) {
      super(message);
      this.code = code;
      this.quality = quality;
    }
  },
}));

import { askPalmistryQuestion, getPalmistryAnalysis } from "@/lib/astrologyClient";

const clientAnalysisFixture = {
  source: "mediapipe-client-v1" as const,
  handedness: "right" as const,
  quality: {
    overall: 0.82,
    reasons: [],
    hand_detected: true,
    palm_centered: true,
    blur_score: 0.78,
    exposure_score: 0.81,
    palm_ratio: 0.33,
    rotation_score: 0.76,
  },
  features: {
    life_length: 120,
    head_length: 140,
    heart_length: 130,
    life_head_intersection: 1,
    life_heart_intersection: 0,
    head_heart_intersection: 1,
    break_count: 2,
    curvature: 37,
    confidence: 0.8,
  },
  imageMeta: {
    width: 1080,
    height: 1440,
  },
};

describe("astrologyClient palm actions", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    analyzePalmImageClientMock.mockReset();
    analyzePalmImageClientMock.mockResolvedValue(clientAnalysisFixture);
  });

  it("calls palm_analyze action with clientAnalysis payload", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        result: {
          classification: { palm_type: "balanced" },
          interpretation: "summary",
          features: {
            life_length: 120,
            head_length: 140,
            heart_length: 130,
          },
          quality: clientAnalysisFixture.quality,
          handedness: "right",
        },
      },
      error: null,
    });

    const response = await getPalmistryAnalysis("data:image/png;base64,AAA");

    expect(response.success).toBe(true);
    expect(analyzePalmImageClientMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith(
      "palmistry-scanner-api",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "palm_analyze",
          payload: expect.objectContaining({
            imageData: "data:image/png;base64,AAA",
            clientAnalysis: clientAnalysisFixture,
          }),
        }),
      }),
    );
  });

  it("calls ai_palm_qa action with question and result context", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        answer: "질문에 대한 응답",
      },
      error: null,
    });

    const response = await askPalmistryQuestion("커리어 조언 알려줘", {
      classification: { palm_type: "action" },
      interpretation: "해석",
      features: { life_length: 100, head_length: 120, heart_length: 90 },
    });

    expect(response.answer).toContain("응답");
    expect(invokeMock).toHaveBeenCalledWith(
      "palmistry-scanner-api",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "ai_palm_qa",
        }),
      }),
    );
  });

  it("fails palm analyze with timeout message when invoke is pending", async () => {
    vi.useFakeTimers();
    try {
      invokeMock.mockImplementation(() => new Promise(() => {}));

      const pending = expect(
        getPalmistryAnalysis("data:image/png;base64,AAA"),
      ).rejects.toThrow("손금 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      await vi.advanceTimersByTimeAsync(25_000);
      await pending;
    } finally {
      vi.useRealTimers();
    }
  });

  it("maps PALM_QUALITY_LOW code to retake guidance", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        error: "Image quality is too low for stable palm analysis.",
        code: "PALM_QUALITY_LOW",
        quality: {
          overall: 0.31,
          reasons: ["Image is blurred", "Palm is not centered"],
          hand_detected: true,
          palm_centered: false,
          blur_score: 0.12,
          exposure_score: 0.71,
        },
      },
      error: null,
    });

    await expect(getPalmistryAnalysis("data:image/png;base64,AAA")).rejects.toThrow(
      "사진 품질이 낮아 분석할 수 없습니다.",
    );
  });
});
