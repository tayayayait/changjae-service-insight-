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

export type LoveReportVersion = "v1-story" | "v2-counsel" | "v3-differentiated";
export type LoveMenuVariant = LoveServiceType;
export type LoveReportLayout = "future-partner-v3" | "couple-report-v3" | "crush-reunion-v3";
export type LoveV2SectionType = "opening" | "self-pattern" | "dynamic" | "scenario" | "prescription" | "evidence";

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

export interface PartnerProfile {
  matchKeywords: string[];
  avoidKeywords: string[];
  idealDescription: string;
}

export interface LoveQuickCounsel {
  diagnosis: string;
  temperatureLabel: string;
  temperatureText: string;
  immediateAction: string;
}

export interface LoveScoreNarrative {
  axis: keyof LoveScoreSet;
  label: string;
  score: number;
  interpretation: string;
  why: string;
}

export interface LoveActionRoadmap {
  now: string[];
  within7Days: string[];
  within30Days: string[];
}

export interface LoveReportSection {
  id: string;
  navLabel: string;
  title: string;
  coreQuestion: string;
  summary?: string;
  verdict: string;
  analysisParagraphs: string[];
  interpretationPoints: string[];
  actionTitle: string;
  actionItems: string[];
  warningNote: string;
}

export interface LoveLockedSectionSummary {
  id: string;
  title: string;
  teaser: string;
  benefit: string;
}

export interface FuturePartnerInsights {
  kind: "future-partner";
  partnerProfile: PartnerProfile;
  meetingChannels: string[];
  greenFlags: string[];
  redFlags: string[];
  selfCheckCriteria: string[];
}

export interface CoupleReportInsights {
  kind: "couple-report";
  conflictTriggers: string[];
  repairRituals: string[];
  agreementChecklist: string[];
  doNotSay: string[];
  recoverySignals: string[];
}

export interface CrushReunionInsights {
  kind: "crush-reunion";
  chanceVerdict: "가능성 있음" | "제한적" | "확실한 정보 없음";
  positiveSignals: string[];
  blockingSignals: string[];
  contactWindow: string;
  stopLossRules: string[];
  contactScripts: string[];
}

export type LoveServiceInsights = FuturePartnerInsights | CoupleReportInsights | CrushReunionInsights;

export interface LoveReportPreviewV3 {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  reportLayout: LoveReportLayout;
  scoreSet: LoveScoreSet;
  quickCounsel: LoveQuickCounsel;
  previewHighlights: string[];
  openSection: LoveReportSection;
  lockedSectionSummaries: LoveLockedSectionSummary[];
  ctaReason: string;
  confidenceSummary: string;
  nextRefreshAt: string;
}

export interface LoveReportFullV3 {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  reportLayout: LoveReportLayout;
  scoreSet: LoveScoreSet;
  sections: LoveReportSection[];
  scoreNarratives: LoveScoreNarrative[];
  actionRoadmap: LoveActionRoadmap;
  serviceInsights: LoveServiceInsights;
  conversationPrompts: string[];
  avoidList: string[];
  confidenceNotes: string[];
  nextRefreshAt: string;
}

export interface LoveReportSectionV2 {
  type: LoveV2SectionType;
  title: string;
  question: string;
  summary: string;
  conclusion: string;
  reason: string;
  actionLabel: string;
  actionItems: string[];
  counselorNote: string;
}

export interface LoveLockedSectionSummaryV2 {
  type: LoveV2SectionType;
  title: string;
  teaser: string;
  benefit: string;
}

export interface LoveReportPreviewV2 {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LoveScoreSet;
  relationshipTemperature: string;
  immediateAction: string;
  scenarioHint: string;
  openSection: LoveReportSectionV2;
  lockedSectionSummaries: LoveLockedSectionSummaryV2[];
  ctaReason: string;
  confidenceSummary: string;
  nextRefreshAt: string;
  partnerProfile?: PartnerProfile;
}

export interface LoveReportFullV2 {
  headline: string;
  summary: string;
  serviceType: LoveServiceType;
  scoreSet: LoveScoreSet;
  sections: LoveReportSectionV2[];
  actionPlan: string[];
  avoidList: string[];
  conversationPrompts: string[];
  confidenceNotes: string[];
  nextRefreshAt: string;
  partnerProfile?: PartnerProfile;
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

export type LoveReportPreview = LoveReportPreviewV3 | LoveReportPreviewV2;
export type LoveReportFull = LoveReportFullV3 | LoveReportFullV2;

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
  dataSource?: "real" | "mock";
}

export interface LoveUnlockStatus {
  reportId: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}
