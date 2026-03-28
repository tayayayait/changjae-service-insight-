import { describe, expect, it } from "vitest";
import {
  dedupeReportCopy,
  enforceBirthTimeDisclaimers,
  enforceLifePatternShape,
  enforceQuestionSet,
  normalizeAstrologyBirthReport,
} from "@/lib/astrologyReport";

describe("astrology v5 normalizer", () => {
  it("normalizes legacy payload into v5 screen fields while preserving v4 template version", () => {
    const legacy = {
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        keynote: "legacy keynote",
        strengths: ["s1", "s2", "s3"],
        risks: ["r1"],
        actionsNow: ["a1"],
      },
      chapters: [
        {
          id: "love-relationship",
          title: "연애",
          interpretation: "관계 패턴 설명",
          evidence: ["문제로 드러나는 방식"],
          actionGuide: ["트리거 문장", "행동 문장"],
        },
      ],
      timing: {
        monthFocus: "월 집중",
        monthCaution: "월 주의",
        quarterFlow: [{ label: "이번 달", focus: "f1", caution: "c1", score: 65 }],
      },
      confidence: {
        birthTimeKnown: false,
        level: "medium",
        message: "출생시간 미입력",
      },
      deepData: {
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
            degree: 10,
            retrograde: false,
            interpretation: "",
          },
          moon: {
            name: "Moon",
            nameKo: "달",
            sign: "Cancer",
            signKo: "게자리",
            element: "Water",
            quality: "Cardinal",
            house: 4,
            degree: 5,
            retrograde: false,
            interpretation: "",
          },
          rising: {
            sign: "Gemini",
            signKo: "쌍둥이자리",
            element: "Air",
            quality: "Mutable",
            degree: 2,
            interpretation: "",
          },
        },
        planets: [],
        houses: [],
        aspects: [],
        elementDistribution: { fire: 4, earth: 2, air: 2, water: 2 },
        qualityDistribution: { cardinal: 4, fixed: 2, mutable: 4 },
        chartSvg: "<svg/>",
      },
    };

    const normalized = normalizeAstrologyBirthReport(legacy, { birthTimeKnown: false });

    expect(normalized.hero.topInsights).toHaveLength(3);
    expect(normalized.popularQuestions).toHaveLength(5);
    expect(Object.keys(normalized.lifePatterns)).toEqual([
      "relationship",
      "work",
      "money",
      "recovery",
    ]);
    expect(normalized.currentWindow.month.cacheKey).toMatch(/^\d{4}-\d{2}@Asia\/Seoul$/);
    expect(normalized.meta.templateVersion).toBe("v4");
  });

  it("preserves explicit v5 template version", () => {
    const normalized = normalizeAstrologyBirthReport({
      meta: { templateVersion: "v5" },
    });
    expect(normalized.meta.templateVersion).toBe("v5");
  });

  it("enforces fixed question set and life pattern shape", () => {
    const questions = enforceQuestionSet([
      { id: "work", answer: "일 답변" },
      { answer: "인덱스 매핑 답변" },
    ]);
    expect(questions.map((item) => item.id)).toEqual(["love", "work", "money", "recovery", "luck"]);

    const patterns = enforceLifePatternShape(
      {
        relationship: { pattern: "관계", trigger: "t", recommendedAction: "a" },
      },
      {
        relationship: {
          pattern: "기본",
          problemManifestation: "기본문제",
          trigger: "기본트리거",
          recommendedAction: "기본행동",
        },
        work: {
          pattern: "기본",
          problemManifestation: "기본문제",
          trigger: "기본트리거",
          recommendedAction: "기본행동",
        },
        money: {
          pattern: "기본",
          problemManifestation: "기본문제",
          trigger: "기본트리거",
          recommendedAction: "기본행동",
        },
        recovery: {
          pattern: "기본",
          problemManifestation: "기본문제",
          trigger: "기본트리거",
          recommendedAction: "기본행동",
        },
      },
    );
    expect(patterns.relationship.problemManifestation.length).toBeGreaterThan(0);
    expect(patterns.work.pattern.length).toBeGreaterThan(0);
  });

  it("injects disclaimer and uncertainty when birthTimeKnown=false", () => {
    const report = normalizeAstrologyBirthReport({}, { birthTimeKnown: false });
    const withDisclaimer = enforceBirthTimeDisclaimers(report);
    expect(withDisclaimer.confidence.uncertainAreas.length).toBeGreaterThan(0);
    expect(withDisclaimer.lifePatterns.relationship.isEstimated).toBe(true);
    expect(withDisclaimer.confidence.summary).toContain("추정");
    expect(withDisclaimer.lifePatterns.relationship.pattern).not.toContain("추정 해석");
  });

  it("suppresses repeated copy across sections", () => {
    const base = normalizeAstrologyBirthReport({}, { birthTimeKnown: true });
    const duplicated = {
      ...base,
      hero: {
        ...base.hero,
        topInsights: ["반복 문장", "반복 문장", "반복 문장"] as [string, string, string],
      },
      popularQuestions: base.popularQuestions.map((item) => ({
        ...item,
        answer: "반복 문장",
      })),
    };

    const deduped = dedupeReportCopy(duplicated);
    const uniqueCount = new Set([
      ...deduped.hero.topInsights,
      ...deduped.popularQuestions.map((item) => item.answer),
    ]).size;
    expect(uniqueCount).toBeGreaterThan(2);
  });
});
