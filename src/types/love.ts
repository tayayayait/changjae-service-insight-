import { BirthPrecision, Gender, Oheng, UserBirthData } from "./result";

export type LoveServiceType = "future-partner" | "couple-report" | "crush-reunion";

export type LoveRelationMode =
  | "solo"
  | "dating"
  | "talking"
  | "married"
  | "crush"
  | "breakup"
  | "no-contact";

export type LoveReportVersion = "v1-story" | "v2-counsel";
export type LoveMenuVariant = LoveServiceType;
export type LoveReportSectionType = "opening" | "self-pattern" | "dynamic" | "scenario" | "prescription" | "evidence";

export interface LoveContextAnswer {
  questionKey: string;
  questionLabel: string;
  answerKey: string;
  answerLabel: string;
}

export interface LoveSubjectInput {
  name?: string;
  calendarType: UserBirthData["calendarType"];
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  timeBlock?: string;
  birthPrecision?: BirthPrecision;
  location?: string;
  gender: Gender;
}

export interface LoveContext {
  relationMode?: LoveRelationMode;
  scenarioKey?: string;
  contextAnswers?: LoveContextAnswer[];
  contextSummary?: string;
  additionalNote?: string;
  currentStatus?: string;
  desiredOutcome?: string;
  preferredRelationshipStyle?: string;
  marriageIntent?: "none" | "open" | "strong";
  concerns?: string[];
  lastContactAt?: string;
}

export interface LoveSpouseStar {
  targetElement: Oheng;
  dominantType: "정관" | "편관" | "정재" | "편재" | "mixed";
  score: number;
  reason: string;
}

export interface LoveBranchRelation {
  relation: "합" | "충" | "형" | "파" | "해" | "중립";
  description: string;
}

export interface LoveFeatureSet {
  spouseStar: LoveSpouseStar;
  spousePalace: {
    dayBranch: string;
    relationWithPartner: LoveBranchRelation;
    hasCollisionRisk: boolean;
  };
  relationStars: {
    hasDohwa: boolean;
    hasCheoneul: boolean;
    names: string[];
  };
  ohengBalance: {
    missing: Oheng[];
    dominant: Oheng[];
    complementarity: number;
  };
  stemRelation: "same" | "generating" | "controlled" | "neutral";
  branchRelation: LoveBranchRelation;
  timeConfidence: number;
}

export interface LoveScoreSet {
  overall: number;
  pull: number;
  pace: number;
  alignment: number;
  repair: number;
  timing: number;
}

export interface LegacyLoveScoreSet {
  overall: number;
  emotion: number;
  communication: number;
  stability: number;
  longTerm: number;
  timingConfidence: number;
}

export type AnyLoveScoreSet = LoveScoreSet | LegacyLoveScoreSet;

export interface LoveReportSection {
  type: LoveReportSectionType;
  title: string;
  question: string;
  summary: string;
  conclusion: string;
  reason: string;
  actionLabel: string;
  actionItems: string[];
  counselorNote: string;
}

export interface LoveLockedSectionSummary {
  type: LoveReportSectionType;
  title: string;
  teaser: string;
  benefit: string;
}

export interface LoveReportPreview {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LoveScoreSet;
  relationshipTemperature: string;
  immediateAction: string;
  scenarioHint: string;
  openSection: LoveReportSection;
  lockedSectionSummaries: LoveLockedSectionSummary[];
  ctaReason: string;
  confidenceSummary: string;
  nextRefreshAt: string;
}

export interface LoveReportFull {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LoveScoreSet;
  sections: LoveReportSection[];
  actionPlan: string[];
  avoidList: string[];
  conversationPrompts: string[];
  confidenceNotes: string[];
  nextRefreshAt: string;
}

export interface LegacyLoveStoryChapter {
  key: "hook" | "core-style" | "risk" | "timing" | "action";
  title: string;
  preview: string;
  content: string;
  actionTip: string;
}

export interface LegacyLoveLockedChapter {
  key: LegacyLoveStoryChapter["key"];
  title: string;
  teaser: string;
}

export interface LegacyLoveReportPreview {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LegacyLoveScoreSet;
  openChapter: LegacyLoveStoryChapter;
  lockedChapters: LegacyLoveLockedChapter[];
  upsellCopy: string;
  nextRefreshAt: string;
}

export interface LegacyLoveReportFull {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LegacyLoveScoreSet;
  chapters: LegacyLoveStoryChapter[];
  actionGuide: string[];
  cautionGuide: string[];
  nextRefreshAt: string;
}

export interface LoveReportRecord {
  id?: string;
  userId?: string;
  guestSessionId?: string;
  serviceType: LoveServiceType;
  relationMode?: LoveRelationMode;
  baseSajuResultId?: string;
  reportVersion?: LoveReportVersion;
  menuVariant?: LoveMenuVariant;
  inputSnapshot: {
    subjectA: LoveSubjectInput;
    subjectB?: LoveSubjectInput;
    context: LoveContext;
  };
  featureSet: LoveFeatureSet;
  scoreSet: AnyLoveScoreSet;
  preview: LoveReportPreview | LegacyLoveReportPreview;
  fullReport?: LoveReportFull | LegacyLoveReportFull;
  isUnlocked: boolean;
  unlockedAt?: string;
  nextRefreshAt: string;
  createdAt?: string;
}

export interface LoveUnlockStatus {
  reportId: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}
