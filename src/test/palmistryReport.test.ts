import { describe, expect, it } from "vitest";
import {
  buildPalmQaContext,
  buildPalmSectionReports,
  resolvePalmModeAndSection,
  type PalmistryLikeResult,
} from "@/lib/palmistryReport";

const sampleResult: PalmistryLikeResult = {
  classification: {
    palm_type: "분석형",
    dominant_line: "Head",
    confidence: 0.61,
  },
  interpretation: "기본 해석",
  features: {
    life_length: 140,
    head_length: 180,
    heart_length: 150,
    life_head_intersection: 1,
    life_heart_intersection: 0,
    head_heart_intersection: 2,
  },
};

describe("palmistryReport", () => {
  it("normalizes legacy modes to canonical main+section", () => {
    expect(resolvePalmModeAndSection("billionaire", null)).toEqual({
      mode: "main",
      section: "wealth-career",
    });
    expect(resolvePalmModeAndSection("history", null)).toEqual({
      mode: "main",
      section: "timing",
    });
    expect(resolvePalmModeAndSection("face", "timing")).toEqual({
      mode: "face",
      section: "personality",
    });
  });

  it("builds fixed 4 sections from one analysis result", () => {
    const sections = buildPalmSectionReports(sampleResult);
    expect(sections).toHaveLength(4);
    expect(sections.map((section) => section.id)).toEqual([
      "personality",
      "wealth-career",
      "relationship",
      "timing",
    ]);
  });

  it("limits free QA context to summary scope", () => {
    const sections = buildPalmSectionReports(sampleResult);
    const context = buildPalmQaContext(sampleResult, sections[0], "summary");

    expect(context.interpretation).toBe(sections[0].summary);
    expect(context.classification.palm_type).toBe("분석형");
    expect(context.features.head_length).toBe(180);
  });
});
