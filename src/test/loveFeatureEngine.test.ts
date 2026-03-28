import { describe, expect, it } from "vitest";
import { calculateSaju } from "@/lib/sajuEngine";
import { calculateLoveScoreSet, extractLoveFeatureSet } from "@/lib/loveFeatureEngine";
import { LoveSubjectInput } from "@/types/love";

describe("loveFeatureEngine", () => {
  it("extracts love feature set with spouse star and timing confidence", () => {
    const subjectA: LoveSubjectInput = {
      calendarType: "solar",
      year: 1993,
      month: 6,
      day: 2,
      timeBlock: "모름",
      birthPrecision: "unknown",
      location: "?쒖슱",
      gender: "female",
    };
    const subjectB: LoveSubjectInput = {
      calendarType: "solar",
      year: 1992,
      month: 11,
      day: 15,
      hour: 14,
      minute: 30,
      birthPrecision: "exact",
      location: "?쒖슱",
      gender: "male",
    };

    const feature = extractLoveFeatureSet({
      subjectA,
      sajuA: calculateSaju(subjectA),
      subjectB,
      sajuB: calculateSaju(subjectB),
    });

    expect(feature.spouseStar.dominantType).toBeDefined();
    expect(feature.spouseStar.score).toBeGreaterThanOrEqual(30);
    expect(feature.timeConfidence).toBe(45);
    expect(feature.ohengBalance.complementarity).toBeGreaterThanOrEqual(0);
    expect(feature.ohengBalance.complementarity).toBeLessThanOrEqual(100);
  });

  it("builds bounded 6-axis score set", () => {
    const subjectA: LoveSubjectInput = {
      calendarType: "solar",
      year: 1990,
      month: 3,
      day: 8,
      hour: 9,
      minute: 0,
      birthPrecision: "exact",
      location: "?쒖슱",
      gender: "male",
    };

    const feature = extractLoveFeatureSet({
      subjectA,
      sajuA: calculateSaju(subjectA),
    });

    const score = calculateLoveScoreSet("future-partner", feature);
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.pull).toBeGreaterThanOrEqual(0);
    expect(score.pace).toBeGreaterThanOrEqual(0);
    expect(score.alignment).toBeGreaterThanOrEqual(0);
    expect(score.repair).toBeGreaterThanOrEqual(0);
    expect(score.timing).toBeGreaterThanOrEqual(20);
  });

  it("applies context bonus correctly for couple-report", () => {
    const subjectA: LoveSubjectInput = {
      calendarType: "solar",
      year: 1990,
      month: 3,
      day: 8,
      birthPrecision: "unknown",
      gender: "male",
    };

    const feature = extractLoveFeatureSet({
      subjectA,
      sajuA: calculateSaju(subjectA),
    });

    const baseScore = calculateLoveScoreSet("couple-report", feature);
    
    // Testing case: trust -> alignment+5, repair+4
    // conflict_relief -> repair+5
    // frequent_clash -> repair+4, pull-3
    const contextScore = calculateLoveScoreSet("couple-report", feature, {
      contextAnswers: [
        { questionKey: "main_concern", answerKey: "trust", questionLabel: "", answerLabel: "" },
        { questionKey: "couple_outcome", answerKey: "conflict_relief", questionLabel: "", answerLabel: "" },
        { questionKey: "relationship_temperature", answerKey: "frequent_clash", questionLabel: "", answerLabel: "" }
      ]
    });

    expect(contextScore.alignment).toBeGreaterThan(baseScore.alignment);
    expect(contextScore.repair).toBeGreaterThan(baseScore.repair);
    expect(contextScore.pull).toBeLessThanOrEqual(baseScore.pull);
  });
});
