import type { PalmistryResult } from "@/lib/astrologyClient";

type PalmMode = "main" | "face";
type PalmSectionId = "personality" | "wealth-career" | "relationship" | "timing";

export interface PalmistryLikeResult
  extends Pick<PalmistryResult, "classification" | "interpretation" | "features" | "sections"> {}

export interface PalmSectionReport {
  id: PalmSectionId;
  title: string;
  summary: string;
  details: string[];
}

const SECTION_ORDER: PalmSectionId[] = ["personality", "wealth-career", "relationship", "timing"];

const SECTION_TITLE_MAP: Record<PalmSectionId, string> = {
  personality: "성향",
  "wealth-career": "재물/커리어",
  relationship: "관계",
  timing: "타이밍",
};

const MAIN_MODE_LEGACY_MAP: Record<string, PalmSectionId> = {
  billionaire: "wealth-career",
  history: "timing",
};

const isPalmSectionId = (value: string | null | undefined): value is PalmSectionId => {
  return value === "personality" || value === "wealth-career" || value === "relationship" || value === "timing";
};

export const resolvePalmModeAndSection = (modeParam: string | null, sectionParam: string | null) => {
  if (modeParam === "face") {
    return {
      mode: "face" as PalmMode,
      section: "personality" as PalmSectionId,
    };
  }

  if (modeParam && MAIN_MODE_LEGACY_MAP[modeParam]) {
    return {
      mode: "main" as PalmMode,
      section: MAIN_MODE_LEGACY_MAP[modeParam],
    };
  }

  return {
    mode: "main" as PalmMode,
    section: isPalmSectionId(sectionParam) ? sectionParam : "personality",
  };
};

const getSectionData = (result: PalmistryLikeResult, sectionId: PalmSectionId) => {
  if (!result.sections) {
    return null;
  }

  switch (sectionId) {
    case "personality":
      return result.sections.personality;
    case "wealth-career":
      return result.sections.wealth_career;
    case "relationship":
      return result.sections.relationship;
    case "timing":
      return result.sections.timing;
  }
};

export const buildPalmSectionReports = (result: PalmistryLikeResult): PalmSectionReport[] => {
  return SECTION_ORDER.map((id) => {
    const sectionData = getSectionData(result, id);
    return {
      id,
      title: SECTION_TITLE_MAP[id],
      summary: sectionData?.summary ?? result.interpretation,
      details: sectionData?.details ?? [],
    };
  });
};

export const buildPalmQaContext = (
  result: PalmistryLikeResult,
  section: PalmSectionReport,
  scope: "summary" | "detailed",
) => {
  return {
    classification: result.classification,
    features: result.features ?? {},
    interpretation: scope === "summary" ? section.summary : result.interpretation,
    scope,
    sectionId: section.id,
  };
};
