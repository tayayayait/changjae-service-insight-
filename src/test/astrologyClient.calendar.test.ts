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

import { getAstrologyAICalendar } from "@/lib/astrologyClient";

const buildCompletePayload = () => ({
  success: true,
  year: 2026,
  month: 3,
  summary: {
    headline: "headline",
    focus: "focus",
    caution: "caution",
  },
  highlights: [
    { title: "h1", score: 70, note: "n1" },
    { title: "h2", score: 60, note: "n2" },
    { title: "h3", score: 50, note: "n3" },
    { title: "h4", score: 40, note: "n4" },
  ],
  priorityActions: ["a1", "a2", "a3"],
  choiceGuides: [
    { id: "career", title: "c1", guidance: "g1", recommendedAction: "r1", avoidAction: "x1" },
    { id: "relationship", title: "c2", guidance: "g2", recommendedAction: "r2", avoidAction: "x2" },
    { id: "energy", title: "c3", guidance: "g3", recommendedAction: "r3", avoidAction: "x3" },
    { id: "money", title: "c4", guidance: "g4", recommendedAction: "r4", avoidAction: "x4" },
  ],
  phaseGuides: [
    { phase: "early", title: "p1", meaning: "m1", action: "ac1", impact: "medium" },
    { phase: "mid", title: "p2", meaning: "m2", action: "ac2", impact: "high" },
    { phase: "late", title: "p3", meaning: "m3", action: "ac3", impact: "low" },
  ],
  avoidList: ["d1", "d2", "d3"],
  expertNotes: [{ label: "Mercury Rx", plainMeaning: "verify schedule", sourceType: "transit" }],
  userContext: {
    sunSign: "?묒옄由?,
    moonSign: "물병?먮━",
    risingSign: "?ъ옄?먮━",
    dominantElement: "遺?Fire)",
    dominantQuality: "?쒕룞(Cardinal)",
    birthTimeKnown: true,
  },
  deepData: {
    sourceNotes: ["source-1"],
    transits: [],
    generationMode: "deterministic",
    calculationBasis: "CircularNatalHoroscopeJS@1.1.0",
    analysisWindow: {
      year: 2026,
      month: 3,
      daysAnalyzed: 31,
      transitTime: "12:00",
      phaseBuckets: ["1-10", "11-20", "21-end"],
    },
    birthTimeAccuracy: "known",
  },
});

describe("astrologyClient ai_calendar normalization", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("accepts deterministic monthly guide payload", async () => {
    invokeMock.mockResolvedValueOnce({
      data: buildCompletePayload(),
      error: null,
    });

    const result = await getAstrologyAICalendar(2026, 3);

    expect(result.priorityActions).toEqual(["a1", "a2", "a3"]);
    expect(result.choiceGuides.map((guide) => guide.id)).toEqual(["career", "relationship", "energy", "money"]);
    expect(result.phaseGuides.map((guide) => guide.phase)).toEqual(["early", "mid", "late"]);
    expect(result.deepData?.generationMode).toBe("deterministic");
    expect(result.deepData?.analysisWindow.daysAnalyzed).toBe(31);
  });

  it("throws when required contract fields are missing", async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        success: true,
        summary: { headline: "partial" },
      },
      error: null,
    });

    await expect(getAstrologyAICalendar(2026, 3)).rejects.toThrow();
  });

  it("allows expertNotes to be empty array", async () => {
    const payload = buildCompletePayload();
    payload.expertNotes = [];

    invokeMock.mockResolvedValueOnce({
      data: payload,
      error: null,
    });

    const result = await getAstrologyAICalendar(2026, 3);
    expect(result.expertNotes).toEqual([]);
  });

  it("passes userContext through when present", async () => {
    invokeMock.mockResolvedValueOnce({
      data: buildCompletePayload(),
      error: null,
    });

    const result = await getAstrologyAICalendar(2026, 3);

    expect(result.userContext).toBeDefined();
    expect(result.userContext?.sunSign).toBe("?묒옄由?);
    expect(result.userContext?.moonSign).toBe("물병?먮━");
    expect(result.userContext?.risingSign).toBe("?ъ옄?먮━");
    expect(result.userContext?.dominantElement).toBe("遺?Fire)");
    expect(result.userContext?.dominantQuality).toBe("?쒕룞(Cardinal)");
    expect(result.userContext?.birthTimeKnown).toBe(true);
  });

  it("returns undefined userContext when not present in payload", async () => {
    const payload = buildCompletePayload();
    delete (payload as Record<string, unknown>).userContext;

    invokeMock.mockResolvedValueOnce({
      data: payload,
      error: null,
    });

    const result = await getAstrologyAICalendar(2026, 3);
    expect(result.userContext).toBeUndefined();
  });
});

