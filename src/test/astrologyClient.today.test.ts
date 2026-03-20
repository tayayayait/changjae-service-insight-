import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { getSunSignHoroscope } from "@/lib/astrologyClient";

describe("astrologyClient today action", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    vi.useRealTimers();
  });

  it("retries once on timeout and returns second attempt response", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementationOnce(() => new Promise(() => {}));
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "재시도 후 정상 응답",
        },
      },
      error: null,
    });

    const promise = getSunSignHoroscope("Cancer");

    await vi.advanceTimersByTimeAsync(10_000);
    await vi.advanceTimersByTimeAsync(300);

    const response = await promise;
    expect(response.data.horoscope).toBe("재시도 후 정상 응답");
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("returns client fallback when both attempts time out", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementation(() => new Promise(() => {}));

    const promise = getSunSignHoroscope("Cancer");

    await vi.advanceTimersByTimeAsync(10_000);
    await vi.advanceTimersByTimeAsync(300);
    await vi.advanceTimersByTimeAsync(10_000);

    const response = await promise;

    expect(response.success).toBe(true);
    expect(response.meta).toEqual({
      source: "client_fallback",
      reason: "client_timeout",
    });
    expect(response.data.horoscope).toContain("게자리 오늘의 흐름");
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("returns client fallback when server payload is empty", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "   ",
        },
      },
      error: null,
    });

    const response = await getSunSignHoroscope("Cancer");

    expect(response.meta).toEqual({
      source: "client_fallback",
      reason: "response_empty",
    });
    expect(response.data.horoscope).toContain("게자리 오늘의 흐름");
  });

  it("returns normalized horoscope payload and keeps server meta", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "  오늘은 집중이 필요합니다.  ",
        },
        meta: {
          source: "fallback",
          reason: "upstream_timeout",
        },
      },
      error: null,
    });

    const response = await getSunSignHoroscope("Cancer");

    expect(response).toEqual({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: "오늘은 집중이 필요합니다.",
      },
      meta: {
        source: "fallback",
        reason: "upstream_timeout",
      },
    });
    expect(invokeMock).toHaveBeenCalledWith(
      "astrology-daily-api",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "today",
          payload: { sign: "Cancer" },
        }),
      }),
    );
  });

  it("replaces known low-quality fallback sentence with localized report", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "Today is strongest when you keep one priority clear and avoid unnecessary expansion.",
        },
      },
      error: null,
    });

    const response = await getSunSignHoroscope("Cancer");

    expect(response.data.horoscope).toContain("게자리 오늘의 흐름");
    expect(response.data.horoscope).toContain("### 오늘 한 줄 결론");
    expect(response.data.horoscope).toContain("기본 리포트로 보정");
    expect(response.data.horoscope).not.toContain("### 실행 포인트");
    expect(response.meta).toEqual({
      source: "client_fallback",
      reason: "response_invalid",
    });
    expect(response.data.horoscope).not.toBe(
      "Today is strongest when you keep one priority clear and avoid unnecessary expansion.",
    );
  });
});
