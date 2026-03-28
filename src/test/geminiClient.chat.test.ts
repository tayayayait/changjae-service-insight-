import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatRequest } from "@/types/result";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: true,
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { sendChatMessage } from "@/lib/geminiClient";

const baseRequest: ChatRequest = {
  message: "hello",
  conversationHistory: [],
  sajuContext: {
    palja: {
      year: { gan: "a", ji: "b", ohengGan: "wood", ohengJi: "water" },
      month: { gan: "c", ji: "d", ohengGan: "fire", ohengJi: "earth" },
      day: { gan: "e", ji: "f", ohengGan: "metal", ohengJi: "wood" },
      time: { gan: "g", ji: "h", ohengGan: "water", ohengJi: "fire" },
    },
    oheng: [],
    profileMeta: {
      birthYear: 1995,
      birthMonth: 6,
      birthDay: 29,
      gender: "male",
    },
    currentYear: 2026,
  } as ChatRequest["sajuContext"],
  ownerKey: "owner:phone:test",
  profileKey: "pk3|name:test|birth:1995-6-29|gender:male",
  usageId: "usage-1",
  usageSource: "input",
};

const ensureRandomUUID = () => {
  if (!globalThis.crypto) {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        randomUUID: () => "trace-fallback",
      },
    });
  }
};

describe("sendChatMessage", () => {
  beforeEach(() => {
    ensureRandomUUID();
    invokeMock.mockReset();
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("injects requestMeta.traceId and logs start/completed", async () => {
    const randomUUIDSpy = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("trace-chat-auto");
    const infoSpy = vi.spyOn(console, "info");

    invokeMock.mockResolvedValueOnce({
      data: {
        reply: "hello from ai",
        tags: ["greeting"],
        followUpSuggestions: ["next question"],
        quota: {
          remaining: 2,
          total: 2,
          charged: true,
          nextFreeResetAt: "2026-03-27T12:00:00.000Z",
        },
      },
      error: null,
    });

    const result = await sendChatMessage(baseRequest);

    expect(result.reply).toContain("hello");
    expect(result.quota?.remaining).toBe(2);
    expect(result.quota?.nextFreeResetAt).toBe("2026-03-27T12:00:00.000Z");
    expect(invokeMock).toHaveBeenCalledWith(
      "saju-chat-api",
      expect.objectContaining({
        body: expect.objectContaining({
          ownerKey: "owner:phone:test",
          profileKey: "pk3|name:test|birth:1995-6-29|gender:male",
          usageId: "usage-1",
          usageSource: "input",
          requestMeta: expect.objectContaining({
            traceId: "trace-chat-auto",
          }),
        }),
        timeout: 45_000,
      }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[chat:start]",
      expect.objectContaining({
        traceId: "trace-chat-auto",
      }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      "[chat:completed]",
      expect.objectContaining({
        traceId: "trace-chat-auto",
      }),
    );
    randomUUIDSpy.mockRestore();
  });

  it("maps no-credit structured error code", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("trace-chat-no-credit");

    invokeMock.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Edge Function returned a non-2xx status code",
        context: {
          status: 402,
          message:
            "{\"error\":\"질문 가능 횟수를 모두 사용했습니다.\",\"code\":\"NO_CREDITS\",\"traceId\":\"trace-chat-edge\"}",
        },
      },
    });

    await expect(sendChatMessage(baseRequest)).rejects.toMatchObject({
      message: "질문 가능 횟수를 모두 사용했습니다.",
      code: "NO_CREDITS",
    });
  });

  it("fails when reply is empty", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("trace-chat-empty");

    invokeMock.mockResolvedValueOnce({
      data: {
        reply: "   ",
      },
      error: null,
    });

    await expect(sendChatMessage(baseRequest)).rejects.toThrow("AI 상담 결과 형식이 올바르지 않습니다.");
  });

  it("preserves provided traceId", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        reply: "trace check",
      },
      error: null,
    });

    await sendChatMessage({
      ...baseRequest,
      requestMeta: { traceId: "trace-from-caller" },
    });

    expect(invokeMock).toHaveBeenCalledWith(
      "saju-chat-api",
      expect.objectContaining({
        body: expect.objectContaining({
          requestMeta: { traceId: "trace-from-caller" },
        }),
      }),
    );
  });
});
