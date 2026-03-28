import { describe, expect, it } from "vitest";
import { inferLoveReportVersion, normalizeLegacyScoreSet } from "@/lib/loveReportAdapters";

describe("loveReportAdapters", () => {
  it("normalizes legacy score fields into counseling axes", () => {
    const normalized = normalizeLegacyScoreSet({
      overall: 81,
      emotion: 76,
      communication: 70,
      stability: 64,
      longTerm: 88,
      timingConfidence: 52,
    });

    expect(normalized).toEqual({
      overall: 81,
      pull: 76,
      pace: 64,
      alignment: 67,
      repair: 79,
      timing: 52,
    });
  });

  it("treats missing version metadata as a legacy v1 report", () => {
    expect(
      inferLoveReportVersion({
        preview: {
          headline: "기존 리포트",
          summary: "무료 미리보기",
          serviceType: "couple-report",
          scoreSet: {
            overall: 70,
            emotion: 68,
            communication: 66,
            stability: 64,
            longTerm: 72,
            timingConfidence: 50,
          },
          openChapter: {
            key: "hook",
            title: "핵심 결론",
            preview: "무료 미리보기",
            content: "기존 리포트 상세",
            actionTip: "텍스트를 보지 마세요",
          },
          lockedChapters: [],
          upsellCopy: "전체 흐름을 이어보세요",
          nextRefreshAt: "2026-04-18T00:00:00.000Z",
        },
      }),
    ).toBe("v1-story");
  });
});
