import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "../store/useChatStore";
import { usePaymentStore } from "../store/usePaymentStore";

const sendChatMessageMock = vi.hoisted(() => vi.fn());

vi.mock("../lib/geminiClient", () => ({
  sendChatMessage: sendChatMessageMock,
}));

const STORAGE_KEY = "saju:chat:sessions:v3";

const MOCK_SAJU_CONTEXT = {
  palja: {
    year: { gan: "a", ji: "b", ohengGan: "wood", ohengJi: "water" },
    month: { gan: "c", ji: "d", ohengGan: "fire", ohengJi: "earth" },
    day: { gan: "e", ji: "f", ohengGan: "metal", ohengJi: "wood" },
    time: { gan: "g", ji: "h", ohengGan: "water", ohengJi: "fire" },
  },
  oheng: [],
  yongsin: [],
  sinsal: [],
  profileMeta: {
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male" as const,
  },
  currentYear: 2026,
} as const;

describe("useChatStore", () => {
  beforeEach(() => {
    sendChatMessageMock.mockClear();
    sendChatMessageMock.mockResolvedValue({
      reply: "AI reply",
      tags: ["tag"],
      followUpSuggestions: ["follow up 1", "follow up 2"],
      quota: {
        remaining: 1,
        total: 2,
        charged: true,
      },
    });

    window.localStorage.removeItem(STORAGE_KEY);
    useChatStore.getState().resetAllSessions();
    useChatStore.getState().setActiveOwnerKey("owner:phone:test");
    usePaymentStore.setState({
      activeOwnerKey: "owner:phone:test",
      activeProfileKey: null,
      remaining: 2,
      total: 2,
      isQuotaReady: true,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: null,
    });
  });

  it("initializes with empty state", () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.sessions).toEqual([]);
    expect(state.currentSessionId).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.sajuContext).toBeNull();
  });

  it("creates a profile-bound session when saju context is set", () => {
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);
    const state = useChatStore.getState();

    expect(state.sajuContext).toEqual(MOCK_SAJU_CONTEXT);
    expect(state.sessions).toHaveLength(1);
    expect(state.currentSessionId).toBe(state.sessions[0].id);
    expect(state.sessions[0].messages).toEqual([]);
    expect(state.sessions[0].ownerKey).toBe("owner:phone:test");
  });

  it("fails to send message when sajuContext is missing", async () => {
    await useChatStore.getState().sendMessage("hello");
    const state = useChatStore.getState();

    expect(state.error).not.toBeNull();
    expect(state.messages).toHaveLength(0);
    expect(state.sessions).toHaveLength(0);
  });

  it("stores user and assistant messages in current session on success", async () => {
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);
    await useChatStore.getState().sendMessage("hello 상담");

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].role).toBe("user");
    expect(state.messages[0].content).toBe("hello 상담");
    expect(state.messages[1].role).toBe("assistant");
    expect(state.messages[1].content).toBe("AI reply");
    expect(state.sessions[0].messages).toHaveLength(2);
    expect(state.sessions[0].title).toContain("hello 상담".slice(0, 5));
    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerKey: "owner:phone:test",
        profileKey: expect.any(String),
        usageId: expect.any(String),
        usageSource: "input",
      }),
    );
  });

  it("sends suggestion clicks with suggestion usage source", async () => {
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);
    await useChatStore.getState().addSuggestionAsMessage("추천 질문");

    expect(sendChatMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        usageSource: "suggestion",
      }),
    );
  });

  it("falls back to local quota decrement when response quota is missing", async () => {
    sendChatMessageMock.mockResolvedValueOnce({
      reply: "AI reply",
      tags: ["tag"],
      followUpSuggestions: ["follow up 1", "follow up 2"],
    });
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);

    await useChatStore.getState().sendMessage("quota fallback test");

    expect(usePaymentStore.getState().getRemainingQuestions()).toBe(1);
  });

  it("keeps user message and clears loading when send fails", async () => {
    sendChatMessageMock.mockRejectedValueOnce(new Error("timeout"));
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);

    await useChatStore.getState().sendMessage("hello");
    const state = useChatStore.getState();

    expect(state.isLoading).toBe(false);
    expect(state.error).toBe("timeout");
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe("user");
  });

  it("supports new session, switch, and delete flow", async () => {
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);
    await useChatStore.getState().sendMessage("first message");
    const firstSessionId = useChatStore.getState().currentSessionId as string;

    useChatStore.getState().startNewSession();
    await useChatStore.getState().sendMessage("second message");
    const stateAfterSecond = useChatStore.getState();

    expect(stateAfterSecond.sessions).toHaveLength(2);
    const secondSessionId = stateAfterSecond.currentSessionId as string;
    expect(secondSessionId).not.toBe(firstSessionId);
    expect(stateAfterSecond.messages[0].content).toBe("second message");

    useChatStore.getState().switchSession(firstSessionId);
    expect(useChatStore.getState().messages[0].content).toBe("first message");

    useChatStore.getState().deleteSession(firstSessionId);
    const afterDelete = useChatStore.getState();
    expect(afterDelete.sessions).toHaveLength(1);
    expect(afterDelete.sessions[0].id).toBe(secondSessionId);
    expect(afterDelete.currentSessionId).toBe(secondSessionId);
  });

  it("persists session metadata to localStorage", async () => {
    useChatStore.getState().setSajuContext(MOCK_SAJU_CONTEXT as never);
    await useChatStore.getState().sendMessage("storage test");

    const raw = window.localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw as string) as {
      sessions: Array<{ id: string; title: string; ownerKey: string; messages: unknown[] }>;
      currentSessionId: string;
    };

    expect(parsed.sessions.length).toBe(1);
    expect(parsed.sessions[0].messages.length).toBe(2);
    expect(parsed.sessions[0].ownerKey).toBe("owner:phone:test");
    expect(parsed.currentSessionId).toBe(parsed.sessions[0].id);
  });
});
