import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatStore } from "@/store/useChatStore";

const sendChatMessageMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/geminiClient", () => ({
  sendChatMessage: sendChatMessageMock,
}));

const STORAGE_KEY = "saju:chat:sessions:v3";

const buildContext = (
  overrides?: Partial<{
    calendarType: "solar" | "lunar" | "lunar-leap";
    timeBlock: string;
    hour: number;
    minute: number;
  }>,
) => ({
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
    calendarType: overrides?.calendarType ?? "solar",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male" as const,
    birthPrecision: "time-block" as const,
    timeBlock: overrides?.timeBlock ?? "midnight",
    hour: overrides?.hour,
    minute: overrides?.minute,
  },
  currentYear: 2026,
});

describe("useChatStore profileKey v3", () => {
  beforeEach(() => {
    sendChatMessageMock.mockReset();
    window.localStorage.removeItem(STORAGE_KEY);
    useChatStore.getState().resetAllSessions();
  });

  it("separates sessions by owner key even with same profile", () => {
    useChatStore.getState().setActiveOwnerKey("owner:phone:a");
    useChatStore.getState().setSajuContext(buildContext({ calendarType: "solar" }));
    const firstSessionId = useChatStore.getState().currentSessionId;

    useChatStore.getState().setActiveOwnerKey("owner:phone:b");
    useChatStore.getState().setSajuContext(buildContext({ calendarType: "solar" }));
    const secondSessionId = useChatStore.getState().currentSessionId;

    expect(useChatStore.getState().sessions).toHaveLength(2);
    expect(firstSessionId).not.toBe(secondSessionId);
  });

  it("does not separate sessions by calendarType", () => {
    useChatStore.getState().setSajuContext(buildContext({ calendarType: "solar" }));
    const firstSessionId = useChatStore.getState().currentSessionId;

    useChatStore.getState().setSajuContext(buildContext({ calendarType: "lunar" }));
    const secondSessionId = useChatStore.getState().currentSessionId;

    expect(useChatStore.getState().sessions).toHaveLength(1);
    expect(firstSessionId).toBe(secondSessionId);
  });

  it("does not separate sessions when time info changes", () => {
    useChatStore.getState().setSajuContext(buildContext({ timeBlock: "midnight" }));
    const firstSessionId = useChatStore.getState().currentSessionId;

    useChatStore.getState().setSajuContext(buildContext({ timeBlock: "morning" }));
    const secondSessionId = useChatStore.getState().currentSessionId;

    expect(useChatStore.getState().sessions).toHaveLength(1);
    expect(firstSessionId).toBe(secondSessionId);
  });

  it("blocks switching to a session from another active profile", () => {
    useChatStore.getState().setSajuContext(buildContext({ calendarType: "solar" }));
    const solarSessionId = useChatStore.getState().currentSessionId as string;

    useChatStore.getState().setSajuContext({
      ...buildContext({ calendarType: "lunar" }),
      profileMeta: {
        ...buildContext({ calendarType: "lunar" }).profileMeta,
        name: "other-user",
      },
    });
    const otherSessionId = useChatStore.getState().currentSessionId as string;

    useChatStore.getState().switchSession(solarSessionId);
    expect(useChatStore.getState().currentSessionId).toBe(otherSessionId);
  });

  it("blocks deleting a session from another active profile", () => {
    useChatStore.getState().setSajuContext(buildContext({ calendarType: "solar" }));
    const solarSessionId = useChatStore.getState().currentSessionId as string;

    useChatStore.getState().setSajuContext({
      ...buildContext({ calendarType: "lunar" }),
      profileMeta: {
        ...buildContext({ calendarType: "lunar" }).profileMeta,
        name: "other-user",
      },
    });
    const otherSessionId = useChatStore.getState().currentSessionId as string;

    useChatStore.getState().deleteSession(solarSessionId);
    const state = useChatStore.getState();

    expect(state.sessions.some((session) => session.id === solarSessionId)).toBe(true);
    expect(state.currentSessionId).toBe(otherSessionId);
  });
});
