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

  it("keeps only 3 visible astrology services and preserves stable routes", () => {
    const astrologyCards = getCategoryServiceCards("astrology");
    const routeMap = Object.fromEntries(astrologyCards.map((item) => [item.id, item.to]));

    expect(astrologyCards.map((item) => item.id)).toEqual([
      "astro-natal",
      "astro-daily",
      "astro-cosmic-calendar",
    ]);
    expect(routeMap["astro-daily"]).toBe("/astrology/daily");
    expect(routeMap["astro-cosmic-calendar"]).toBe("/astrology/calendar");
    expect(routeMap["astro-synastry"]).toBeUndefined();
  });

  it("routes 3 core love services through /service intro and keeps love detail handoff", () => {
    const loveCards = getCategoryServiceCards("love").filter((item) =>
      ["love-future-partner", "love-couple-report", "love-crush-reunion"].includes(item.id),
    );

    expect(loveCards.map((item) => item.id)).toEqual([
      "love-future-partner",
      "love-couple-report",
      "love-crush-reunion",
    ]);

    for (const card of loveCards) {
      expect(card.to).toBe(`/service/${card.id}`);
      const landing = getServiceLandingById(card.id);
      expect(landing).not.toBeNull();
      expect(landing?.nextPath.startsWith("/love/")).toBe(true);
      expect(landing?.previewFeatures?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("keeps palm service IDs while routing to canonical main sections", () => {
    const mainLanding = getServiceLandingById("palm-billionaire");
    const timingLanding = getServiceLandingById("palm-destiny-change");

    expect(mainLanding?.id).toBe("palm-billionaire");
    expect(mainLanding?.nextPath).toBe("/palmistry?mode=main&section=wealth-career");
    expect(timingLanding?.id).toBe("palm-destiny-change");
    expect(timingLanding?.nextPath).toBe("/palmistry?mode=main&section=timing");
  });

  it("keeps 2026 tile analysis services disjoint from lifetime services", () => {
    const dedicated2026ServiceIds = [
      "saju-2026-overview",
      "saju-2026-study-exam",
      "saju-love-focus",
      "saju-2026-wealth-business",
      "saju-2026-investment-assets",
      "saju-2026-career-aptitude",
      "saju-2026-health-balance",
    ] as const;

    const analysisServiceIds = dedicated2026ServiceIds.map((serviceId) => getServiceLandingById(serviceId)?.analysisServiceId);
    const nextPaths = dedicated2026ServiceIds.map((serviceId) => getServiceLandingById(serviceId)?.nextPath);

    expect(analysisServiceIds.every(Boolean)).toBe(true);
    expect(new Set(analysisServiceIds).size).toBe(dedicated2026ServiceIds.length);
    expect(analysisServiceIds).toEqual(dedicated2026ServiceIds);
    expect(nextPaths.every((nextPath) => nextPath?.startsWith("/saju?mode=new-year-2026"))).toBe(true);

    for (const analysisServiceId of analysisServiceIds) {
      expect(LIFETIME_SERVICE_ORDER).not.toContain(analysisServiceId as (typeof LIFETIME_SERVICE_ORDER)[number]);
    }
  });

  it("marks the wealth-business service as business-owner only before entry", () => {
    const wealthCard = getCategoryServiceCards("saju").find((item) => item.id === "saju-2026-wealth-business");
    const wealthLanding = getServiceLandingById("saju-2026-wealth-business");

    expect(wealthCard?.title).toBe("2026 사업자 재물/사업운");
    expect(wealthCard?.description).toContain("사업 운영자 기준");
    expect(wealthLanding?.audienceBadge).toBe("사업자 전용");
    expect(wealthLanding?.audienceNotice).toContain("직접 매출, 비용, 운영 책임");
  });

  it("keeps yearly-outlook landing resolvable for legacy links", () => {
    const legacyLanding = getServiceLandingById("saju-2026-yearly-outlook");
    expect(legacyLanding?.id).toBe("saju-2026-yearly-outlook");
    expect(legacyLanding?.nextPath).toBe("/saju?mode=new-year-2026&focus=yearly-outlook");
  });
});

describe("serviceCatalog filtering", () => {
  it("filters out items with hideFromGrid: true from category cards", () => {
    const sajuCards = getCategoryServiceCards("saju");
    const sajuIds = sajuCards.map((card) => card.id);

    expect(sajuIds).not.toContain("saju-ai-chat");
    expect(sajuIds).toContain("saju-lifetime-roadmap");
  });

  it("still allows resolving hidden services by ID for landing data", () => {
    const landing = getServiceLandingById("saju-ai-chat");
    expect(landing).not.toBeNull();
    expect(landing?.id).toBe("saju-ai-chat");
  });
});
