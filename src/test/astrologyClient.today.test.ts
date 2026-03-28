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
          horoscope: "실시간 정상 응답",
        },
      },
      error: null,
    });

    const promise = getSunSignHoroscope("Cancer");

    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(800);

    const response = await promise;
    expect(response.data.horoscope).toBe("실시간 정상 응답");
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("throws when all attempts time out", async () => {
    vi.useFakeTimers();
    invokeMock.mockImplementation(() => new Promise(() => {}));

    const promise = getSunSignHoroscope("Cancer");
    const assertion = expect(promise).rejects.toThrow("실시간 운세");

    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(800);
    await vi.advanceTimersByTimeAsync(15_000);
    await vi.advanceTimersByTimeAsync(800);
    await vi.advanceTimersByTimeAsync(15_000);

    await assertion;
    expect(invokeMock).toHaveBeenCalledTimes(3);
  });

  it("throws when server payload is empty", async () => {
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

    await expect(getSunSignHoroscope("Cancer")).rejects.toThrow("실시간 운세");
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it("rejects fallback source payload and retries", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "첫 시도 보정 응답",
        },
        meta: {
          source: "fallback",
          reason: "upstream_timeout",
        },
      },
      error: null,
    });

    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "두 번째 시도 실시간 응답",
        },
        meta: {
          source: "proxy",
          basis: "sign_context",
          requestDate: "2026-03-21",
        },
      },
      error: null,
    });

    const response = await getSunSignHoroscope("Cancer");

    expect(response).toEqual({
      success: true,
      data: {
        sign: "Cancer",
        horoscope: "두 번째 시도 실시간 응답",
      },
      meta: {
        source: "proxy",
        basis: "sign_context",
        requestDate: "2026-03-21",
      },
    });
    expect(invokeMock).toHaveBeenCalledTimes(2);
  });

  it("allows sign_context basis even when profile context exists", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "실시간 응답(별자리 컨텍스트)",
        },
        meta: {
          source: "proxy",
          basis: "sign_context",
          requestDate: "2026-03-21",
        },
      },
      error: null,
    });

    const response = await getSunSignHoroscope("Cancer", {
      requestDate: "2026-03-21",
      profile: {
        year: 1991,
        month: 7,
        day: 10,
        hour: 9,
        minute: 30,
        location: "서울",
        tz: "Asia/Seoul",
        birthTimeKnown: true,
      },
    });

    expect(response.meta).toEqual(
      expect.objectContaining({
        source: "proxy",
        basis: "sign_context",
      }),
    );
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });

  it("sends only requestDate in today payload even when profile context is provided", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          sign: "Cancer",
          horoscope: "실시간 응답(별자리 컨텍스트)",
        },
        meta: {
          source: "proxy",
          basis: "sign_context",
          requestDate: "2026-03-21",
        },
      },
      error: null,
    });

    await getSunSignHoroscope("Cancer", {
      requestDate: "2026-03-21",
      profile: {
        year: 1991,
        month: 7,
        day: 10,
        hour: 9,
        minute: 30,
        location: "서울",
        tz: "Asia/Seoul",
        birthTimeKnown: true,
      },
    });

    expect(invokeMock).toHaveBeenCalledWith(
      "astrology-daily-api",
      expect.objectContaining({
        body: expect.objectContaining({
          action: "today",
          payload: {
            sign: "Cancer",
            context: {
              requestDate: "2026-03-21",
            },
          },
        }),
      }),
    );
  });
});
