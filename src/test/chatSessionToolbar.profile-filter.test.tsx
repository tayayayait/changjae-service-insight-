import React from "react";
import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ChatSessionToolbar } from "@/components/chat/ChatSessionToolbar";
import { useChatStore } from "@/store/useChatStore";
import { buildChatProfileKeyFromContext } from "@/lib/chatProfileKey";
import { usePaymentStore } from "@/store/usePaymentStore";

const STORAGE_KEY = "saju:chat:sessions:v3";

const buildContext = (calendarType: "solar" | "lunar") => ({
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
    name: "tester",
    calendarType,
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male" as const,
    birthPrecision: "time-block" as const,
    timeBlock: "midnight",
  },
  currentYear: 2026,
});

describe("ChatSessionToolbar profile filtering", () => {
  beforeEach(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    useChatStore.getState().resetAllSessions();
    usePaymentStore.setState({
      activeOwnerKey: "owner:user:test",
      activeProfileKey: null,
      remaining: 2,
      total: 2,
      isQuotaReady: true,
      isRefreshing: false,
      lastSyncedAt: null,
      nextFreeResetAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only sessions for the active owner+profile", () => {
    const solarContext = buildContext("solar");
    const lunarContext = buildContext("lunar");
    const solarProfileKey = buildChatProfileKeyFromContext(solarContext);
    const lunarProfileKey = buildChatProfileKeyFromContext(lunarContext);

    useChatStore.setState({
      activeOwnerKey: "owner:phone:b",
      sessions: [
        {
          id: "session-a",
          title: "session-a",
          ownerKey: "owner:phone:a",
          profileKey: solarProfileKey,
          createdAt: 1000,
          updatedAt: 1000,
          messages: [],
        },
        {
          id: "session-b",
          title: "session-b",
          ownerKey: "owner:phone:b",
          profileKey: lunarProfileKey,
          createdAt: 2000,
          updatedAt: 2000,
          messages: [],
        },
      ],
      currentSessionId: "session-b",
      messages: [],
      sajuContext: lunarContext,
      isLoading: false,
      error: null,
    });

    render(<ChatSessionToolbar />);

    expect(screen.getByRole("option", { name: /session-b/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /session-a/i })).toBeNull();
  });

  it("hides session options when no active profile is set", () => {
    const solarContext = buildContext("solar");
    const solarProfileKey = buildChatProfileKeyFromContext(solarContext);

    useChatStore.setState({
      activeOwnerKey: "owner:phone:a",
      sessions: [
        {
          id: "session-a",
          title: "session-a",
          ownerKey: "owner:phone:a",
          profileKey: solarProfileKey,
          createdAt: 1000,
          updatedAt: 1000,
          messages: [],
        },
      ],
      currentSessionId: "session-a",
      messages: [],
      sajuContext: null,
      isLoading: false,
      error: null,
    });

    render(<ChatSessionToolbar />);

    expect(screen.queryByRole("option", { name: /session-a/i })).toBeNull();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("shows free reset timer when next free reset timestamp exists", () => {
    const nextResetAt = new Date(Date.now() + 60_000).toISOString();
    usePaymentStore.setState({ nextFreeResetAt: nextResetAt });

    render(<ChatSessionToolbar />);

    expect(screen.getByText(/다음 무료 복구/i)).toBeInTheDocument();
  });

  it("refreshes quota once when timer reaches zero", () => {
    vi.useFakeTimers();
    const now = new Date("2026-03-27T00:00:00.000Z");
    vi.setSystemTime(now);

    const refreshQuotaMock = vi.fn(async () => {});
    usePaymentStore.setState({
      nextFreeResetAt: new Date(now.getTime() + 5_000).toISOString(),
      refreshQuota: refreshQuotaMock,
    });

    render(<ChatSessionToolbar />);

    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(refreshQuotaMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(refreshQuotaMock).toHaveBeenCalledTimes(1);
  });

  it("shows logout button in chat toolbar when enabled and triggers callback", () => {
    const onLogout = vi.fn();

    render(<ChatSessionToolbar showLogout onLogout={onLogout} />);

    fireEvent.click(screen.getByRole("button", { name: /chat-logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
