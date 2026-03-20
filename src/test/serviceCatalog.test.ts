import { describe, expect, it } from "vitest";
import {
  LIFETIME_SERVICE_ORDER,
  getCategoryServiceCards,
  getFallbackServiceCards,
  getServiceLandingById,
} from "@/lib/serviceCatalog";

describe("serviceCatalog", () => {
  it("returns 7 lifetime services in fixed priority order", () => {
    const lifetimeCards = getCategoryServiceCards("saju").filter((item) => item.tabIds.includes("lifetime"));
    const lifetimeIds = lifetimeCards.map((item) => item.id);

    expect(lifetimeIds).toEqual(LIFETIME_SERVICE_ORDER);
    expect(lifetimeIds).toHaveLength(7);
  });

  it("keeps landing data aligned with lifetime service card IDs", () => {
    const lifetimeCards = getCategoryServiceCards("saju").filter((item) => item.tabIds.includes("lifetime"));

    for (const card of lifetimeCards) {
      expect(card.to).toBe(`/service/${card.id}`);
      const landing = getServiceLandingById(card.id);
      expect(landing).not.toBeNull();
      expect(landing?.id).toBe(card.id);
    }
  });

  it("assigns dedicated analysisServiceId per lifetime service", () => {
    const lifetimeCards = getCategoryServiceCards("saju").filter((item) => item.tabIds.includes("lifetime"));
    const analysisServiceIds = lifetimeCards.map((card) => getServiceLandingById(card.id)?.analysisServiceId);

    expect(analysisServiceIds.every(Boolean)).toBe(true);
    expect(new Set(analysisServiceIds).size).toBe(lifetimeCards.length);
    expect(analysisServiceIds).toEqual(lifetimeCards.map((card) => card.id));
  });

  it("resolves legacy service aliases to canonical IDs", () => {
    const legacyCases: Array<{ legacyId: string; canonicalId: string }> = [
      { legacyId: "saju-career", canonicalId: "saju-career-timing" },
      { legacyId: "saju-wealth-radar", canonicalId: "saju-wealth-flow" },
      { legacyId: "palm-history", canonicalId: "palm-destiny-change" },
      { legacyId: "face-analysis", canonicalId: "face-first-impression" },
    ];

    for (const testCase of legacyCases) {
      const landing = getServiceLandingById(testCase.legacyId);
      expect(landing?.id).toBe(testCase.canonicalId);
    }
  });

  it("returns top 3 fallback services from the same category", () => {
    const fallback = getFallbackServiceCards("saju", 3);
    expect(fallback.map((item) => item.id)).toEqual(LIFETIME_SERVICE_ORDER.slice(0, 3));
  });

  it("keeps astrology service routes for daily/synastry/calendar stable", () => {
    const astrologyCards = getCategoryServiceCards("astrology");
    const routeMap = Object.fromEntries(astrologyCards.map((item) => [item.id, item.to]));

    expect(routeMap["astro-daily"]).toBe("/astrology/daily");
    expect(routeMap["astro-synastry"]).toBe("/astrology/synastry");
    expect(routeMap["astro-cosmic-calendar"]).toBe("/astrology/calendar");
  });

  it("keeps palm service IDs while routing to canonical main sections", () => {
    const mainLanding = getServiceLandingById("palm-billionaire");
    const timingLanding = getServiceLandingById("palm-destiny-change");

    expect(mainLanding?.id).toBe("palm-billionaire");
    expect(mainLanding?.nextPath).toBe("/palmistry?mode=main&section=wealth-career");
    expect(timingLanding?.id).toBe("palm-destiny-change");
    expect(timingLanding?.nextPath).toBe("/palmistry?mode=main&section=timing");
  });
});
