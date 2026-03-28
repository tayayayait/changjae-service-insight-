import { beforeEach, describe, expect, it } from "vitest";
import { saveSajuResult, unlockSajuResultLocally } from "@/lib/resultStore";

describe("unlockSajuResultLocally", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("updates local lock state and persists unlocked service id", async () => {
    const saved = await saveSajuResult({
      dataPrivacyMode: "local-only",
      isLocked: true,
      profileData: {
        calendarType: "solar",
        year: 1995,
        month: 6,
        day: 29,
        gender: "male",
      },
      palja: {
        year: { gan: "a", ji: "b", ohengGan: "wood", ohengJi: "fire" },
        month: { gan: "c", ji: "d", ohengGan: "wood", ohengJi: "water" },
        day: { gan: "e", ji: "f", ohengGan: "earth", ohengJi: "metal" },
        time: { gan: "g", ji: "h", ohengGan: "water", ohengJi: "wood" },
      } as any,
      oheng: [{ element: "wood", count: 2, percentage: 40 }] as any,
      interests: [],
      summary: "summary",
      sections: [],
    });

    const updated = unlockSajuResultLocally({
      resultId: saved.id!,
      serviceId: "saju-career-timing",
    });

    expect(updated).not.toBeNull();
    expect(updated?.isLocked).toBe(false);
    expect(updated?.unlockedItems).toContain("saju-career-timing");

    const raw = localStorage.getItem(`saju:result:${saved.id}`);
    expect(raw).toBeTruthy();
    const stored = raw ? JSON.parse(raw) : null;
    expect(stored.isLocked).toBe(false);
    expect(stored.summary).toBe(saved.summary);
  });

  it("does not duplicate unlocked service id when called twice", async () => {
    const saved = await saveSajuResult({
      dataPrivacyMode: "local-only",
      isLocked: true,
      profileData: {
        calendarType: "solar",
        year: 1995,
        month: 6,
        day: 29,
        gender: "male",
      },
      palja: {
        year: { gan: "a", ji: "b", ohengGan: "wood", ohengJi: "fire" },
        month: { gan: "c", ji: "d", ohengGan: "wood", ohengJi: "water" },
        day: { gan: "e", ji: "f", ohengGan: "earth", ohengJi: "metal" },
        time: { gan: "g", ji: "h", ohengGan: "water", ohengJi: "wood" },
      } as any,
      oheng: [{ element: "wood", count: 2, percentage: 40 }] as any,
      interests: [],
      summary: "summary",
      sections: [],
      unlockedItems: [],
    });

    unlockSajuResultLocally({ resultId: saved.id!, serviceId: "saju-career-timing" });
    const updated = unlockSajuResultLocally({ resultId: saved.id!, serviceId: "saju-career-timing" });

    expect(updated?.unlockedItems).toEqual(["saju-career-timing"]);
  });
});
