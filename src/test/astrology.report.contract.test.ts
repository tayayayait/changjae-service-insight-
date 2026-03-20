import { describe, expect, it } from "vitest";
import {
  astrologyBirthReportSchema,
  buildFallbackAstrologyBirthReport,
  toAstrologyDeepData,
} from "@/lib/astrologyReport";

const baseBirthPayload = {
  success: true,
  data: {},
  big3: {
    sun: {
      name: "Sun",
      nameKo: "태양",
      sign: "Aries",
      signKo: "양자리",
      element: "Fire",
      quality: "Cardinal",
      house: 1,
      degree: 10.2,
      retrograde: false,
      interpretation: "sun",
    },
    moon: {
      name: "Moon",
      nameKo: "달",
      sign: "Cancer",
      signKo: "게자리",
      element: "Water",
      quality: "Cardinal",
      house: 4,
      degree: 3.4,
      retrograde: false,
      interpretation: "moon",
    },
    rising: {
      sign: "Libra",
      signKo: "천칭자리",
      element: "Air",
      quality: "Cardinal",
      degree: 5.2,
      interpretation: "rising",
    },
  },
  planets: [
    {
      name: "Sun",
      nameKo: "태양",
      sign: "Aries",
      signKo: "양자리",
      element: "Fire",
      quality: "Cardinal",
      house: 1,
      degree: 10.2,
      retrograde: false,
      interpretation: "sun",
    },
    {
      name: "Moon",
      nameKo: "달",
      sign: "Cancer",
      signKo: "게자리",
      element: "Water",
      quality: "Cardinal",
      house: 4,
      degree: 3.4,
      retrograde: false,
      interpretation: "moon",
    },
    {
      name: "Venus",
      nameKo: "금성",
      sign: "Gemini",
      signKo: "쌍둥이자리",
      element: "Air",
      quality: "Mutable",
      house: 3,
      degree: 17.2,
      retrograde: false,
      interpretation: "venus",
    },
  ],
  houses: [],
  aspects: [
    {
      planet1: "Sun",
      planet2: "Moon",
      planet1Ko: "태양",
      planet2Ko: "달",
      aspectType: "Trine",
      aspectTypeKo: "트라인",
      orb: 1.2,
      influence: "positive",
      interpretation: "good",
    },
  ],
  elementDistribution: { fire: 4, earth: 1, air: 3, water: 2 },
  qualityDistribution: { cardinal: 5, fixed: 2, mutable: 3 },
  chartSvg: "<svg></svg>",
};

describe("astrology birth report contract", () => {
  it("passes schema validation for fallback report", () => {
    const report = buildFallbackAstrologyBirthReport(
      toAstrologyDeepData(baseBirthPayload),
      { birthTimeKnown: true },
      null,
    );
    const parsed = astrologyBirthReportSchema.safeParse(report);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid report payload", () => {
    const report = buildFallbackAstrologyBirthReport(
      toAstrologyDeepData(baseBirthPayload),
      { birthTimeKnown: true },
      null,
    );
    const invalid = {
      ...report,
      summary: { ...report.summary, keynote: "" },
    };
    const parsed = astrologyBirthReportSchema.safeParse(invalid);
    expect(parsed.success).toBe(false);
  });

  it("builds rule-based report with required chapters and monthly+quarter timing", () => {
    const report = buildFallbackAstrologyBirthReport(
      toAstrologyDeepData(baseBirthPayload),
      { birthTimeKnown: false },
      null,
    );

    expect(report.chapters.map((chapter) => chapter.id)).toEqual([
      "personality",
      "relationship",
      "timing",
      "future-flow",
    ]);
    expect(report.timing.quarterFlow).toHaveLength(3);
    expect(report.confidence.level).toBe("medium");
  });

  it("keeps rule summary when ai insight is absent", () => {
    const report = buildFallbackAstrologyBirthReport(
      toAstrologyDeepData(baseBirthPayload),
      { birthTimeKnown: true },
      null,
    );
    expect(report.summary.actionsNow.length).toBeGreaterThan(0);
    expect(report.chapters[0].aiInsight).toBeNull();
  });
});
