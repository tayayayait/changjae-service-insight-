import { describe, expect, it } from "vitest";
import { buildChatProfileKeyFromContext } from "@/lib/chatProfileKey";
import { SajuChatContext } from "@/types/result";

const BASE_CONTEXT: SajuChatContext = {
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
    calendarType: "solar",
    birthYear: 1990,
    birthMonth: 1,
    birthDay: 1,
    gender: "male",
    birthPrecision: "time-block",
    timeBlock: "midnight",
  },
  currentYear: 2026,
};

describe("chatProfileKey (v3)", () => {
  it("does not split the same profile by currentYear", () => {
    const key2026 = buildChatProfileKeyFromContext(BASE_CONTEXT);
    const key2027 = buildChatProfileKeyFromContext({
      ...BASE_CONTEXT,
      currentYear: 2027,
    });

    expect(key2026).toBe(key2027);
  });

  it("does not split the same profile by calendar type", () => {
    const solar = buildChatProfileKeyFromContext(BASE_CONTEXT);
    const lunar = buildChatProfileKeyFromContext({
      ...BASE_CONTEXT,
      profileMeta: {
        ...BASE_CONTEXT.profileMeta,
        calendarType: "lunar",
      },
    });

    expect(solar).toBe(lunar);
  });

  it("does not split the same profile by time precision or time block", () => {
    const withMorning = buildChatProfileKeyFromContext({
      ...BASE_CONTEXT,
      profileMeta: {
        ...BASE_CONTEXT.profileMeta,
        birthPrecision: "exact",
        hour: 9,
        minute: 30,
      },
    });

    const withNight = buildChatProfileKeyFromContext({
      ...BASE_CONTEXT,
      profileMeta: {
        ...BASE_CONTEXT.profileMeta,
        birthPrecision: "time-block",
        timeBlock: "night",
      },
    });

    expect(withMorning).toBe(withNight);
  });

  it("splits when name differs", () => {
    const base = buildChatProfileKeyFromContext(BASE_CONTEXT);
    const changed = buildChatProfileKeyFromContext({
      ...BASE_CONTEXT,
      profileMeta: {
        ...BASE_CONTEXT.profileMeta,
        name: "another",
      },
    });

    expect(base).not.toBe(changed);
  });
});
