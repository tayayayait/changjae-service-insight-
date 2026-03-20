export type CalendarType = "solar" | "lunar" | "lunar-leap";

export type Gender = "male" | "female";

export type AnalysisPeriod = "today" | "week" | "month";

export type QuickFortuneKind = "zodiac" | "starSign";

export type DataPrivacyMode = "local-only" | "cloud-save";

export type BirthPrecision = "exact" | "time-block" | "unknown";

export type ShareCardVariant = "summary" | "love" | "fortune";

export interface UserBirthData {
  calendarType: CalendarType;
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

export type Oheng = "목" | "화" | "토" | "금" | "수";

export interface OhengDistribution {
  element: Oheng;
  count: number;
  percentage: number;
}

export type Sipsin =
  | "비견"
  | "겁재"
  | "식신"
  | "상관"
  | "편재"
  | "정재"
  | "편관"
  | "정관"
  | "편인"
  | "정인";

export type TwelveUnseong =
  | "장생"
  | "목욕"
  | "관대"
  | "건록"
  | "제왕"
  | "쇠"
  | "병"
  | "사"
  | "묘"
  | "절"
  | "태"
  | "양";

export interface PaljaUnit {
  gan: string;
  ji: string;
  ohengGan: Oheng;
  ohengJi: Oheng;
  sipsinGan?: Sipsin;
  sipsinJi?: Sipsin;
  twelveUnseong?: TwelveUnseong;
  jijanggan?: Array<{ gan: string; oheng: Oheng; ratio: number; sipsin: Sipsin }>;
}

export interface Sinsal {
  name: string;
  pillar: "year" | "month" | "day" | "time" | "all";
  description?: string;
}

export interface Palja {
  year: PaljaUnit;
  month: PaljaUnit;
  day: PaljaUnit;
  time: PaljaUnit;
  gongmang?: string[];
}

export type UserInterest =
  | "career"
  | "love"
  | "study"
  | "money"
  | "health"
  | "kids"
  | "path"
  | "rel"
  | "realestate"
  | "travel"
  | "business"
  | "self"
  | "free";

export const SAJU_ANALYSIS_SERVICE_IDS = [
  "saju-lifetime-roadmap",
  "saju-daeun-shift",
  "saju-career-timing",
  "saju-wealth-flow",
  "saju-helper-network",
  "saju-energy-balance",
  "saju-yearly-action-calendar",
] as const;

export type SajuAnalysisServiceId = (typeof SAJU_ANALYSIS_SERVICE_IDS)[number];
export type SajuServiceType = SajuAnalysisServiceId | "traditional-saju";

export interface SajuReportPayloadCommon {
  coreInsights: string[];
  actionNow: string[];
  evidence: string[];
}

export interface SajuLifetimeRoadmapPayload extends SajuReportPayloadCommon {
  longTermFlow: string;
  pivotMoments: string[];
  tenYearStrategy: string[];
}

export interface SajuDaeunShiftPayload extends SajuReportPayloadCommon {
  transitionSignal: string;
  ninetyDayActions: string[];
  avoidanceScenario: string[];
}

export interface SajuCareerTimingPayload extends SajuReportPayloadCommon {
  careerWindow: string;
  decisionTree: string[];
  executionChecklist: string[];
}

export interface SajuWealthFlowPayload extends SajuReportPayloadCommon {
  cashflowMap: string;
  riskZones: string[];
  assetRules: string[];
}

export interface SajuHelperNetworkPayload extends SajuReportPayloadCommon {
  helperMap: string;
  conflictPatterns: string[];
  networkGuide: string[];
}

export interface SajuEnergyBalancePayload extends SajuReportPayloadCommon {
  energyCurve: string;
  routineDesign: string[];
  recoveryProtocol: string[];
}

export interface SajuYearlyActionCalendarPayload extends SajuReportPayloadCommon {
  quarterlyGoals: string[];
  monthlyActions: string[];
  riskCalendar: string[];
}

export interface SajuReportPayloadMap {
  "saju-lifetime-roadmap": SajuLifetimeRoadmapPayload;
  "saju-daeun-shift": SajuDaeunShiftPayload;
  "saju-career-timing": SajuCareerTimingPayload;
  "saju-wealth-flow": SajuWealthFlowPayload;
  "saju-helper-network": SajuHelperNetworkPayload;
  "saju-energy-balance": SajuEnergyBalancePayload;
  "saju-yearly-action-calendar": SajuYearlyActionCalendarPayload;
}

export type SajuReportPayload = SajuReportPayloadMap[SajuAnalysisServiceId];

export interface SectionAnalysis {
  title: string;
  interpretation: string;
  advice: string;
  luckyTip?: string;
}

export interface GeminiAnalysis {
  summary: string;
  sections: SectionAnalysis[];
}

export interface GoldenPeriod {
  startAge: number;
  endAge: number;
  startYear?: number;
  endYear?: number;
  reason: string;
}

export interface SajuResult {
  id?: string;
  userId?: string;
  guestSessionId?: string;
  dataPrivacyMode?: DataPrivacyMode;
  requestFingerprint?: string;
  sourceServiceId?: string;
  promptVersion?: string;
  profileData: UserBirthData;
  palja: Palja;
  oheng: OhengDistribution[];
  yongsin?: Oheng[];
  sinsal?: Sinsal[];
  interests: UserInterest[];
  freeQuestion?: string;
  summary: string;
  sections: SectionAnalysis[];
  consultationType?: string;
  reportTemplateVersion?: string;
  reportPayload?: SajuReportPayload;
  lifetimeScore?: number;
  daeunPeriods?: DaeunPeriod[];
  goldenPeriods?: GoldenPeriod[];
  personalityType?: {
    title: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  };
  createdAt?: string;
}

export interface DaeunPeriod {
  startAge: number;
  endAge: number;
  startYear?: number;
  endYear?: number;
  gan: string;
  ji: string;
  oheng: Oheng;
  score: number;
  keyword?: string;
  isCurrent: boolean;
}

export interface LifetimeGeminiAnalysis extends GeminiAnalysis {
  lifetimeScore: number;
  daeunPeriods: DaeunPeriod[];
  goldenPeriods: GoldenPeriod[];
  personalityType: {
    title: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  };
}

export type SpecializedSajuGeminiAnalysis = {
  [K in Exclude<SajuAnalysisServiceId, "saju-lifetime-roadmap">]: GeminiAnalysis & {
    serviceType: K;
    reportTemplateVersion: string;
    reportPayload: SajuReportPayloadMap[K];
  };
}[Exclude<SajuAnalysisServiceId, "saju-lifetime-roadmap">];

export interface LifetimeRoadmapGeminiAnalysis extends LifetimeGeminiAnalysis {
  serviceType: "saju-lifetime-roadmap";
  reportTemplateVersion: string;
  reportPayload: SajuLifetimeRoadmapPayload;
}

export interface TraditionalSajuGeminiAnalysis extends GeminiAnalysis {
  serviceType: "traditional-saju";
  reportTemplateVersion?: string;
  reportPayload?: undefined;
}

export type SajuAnalysisResponse =
  | TraditionalSajuGeminiAnalysis
  | LifetimeRoadmapGeminiAnalysis
  | SpecializedSajuGeminiAnalysis;

export interface CareerAnalysis {
  gwansung: { type: string; strength: number };
  bestTimingYears: number[];
  promotionPotential: number;
  businessFit: number;
  advice: string;
}

export interface StudyAnalysis {
  insung: { type: string; strength: number };
  focusHours: string[];
  passRate: number;
  advice: string;
}

export interface WealthAnalysis {
  jaesung: { type: string; strength: number };
  wealthTimeline: { year: number; score: number }[];
  retirementStability: number;
  advice: string;
}

export interface RelationshipAnalysis {
  guiinTypes: { type: string; oheng: Oheng; description: string }[];
  cautionTypes: { type: string; description: string }[];
  advice: string;
}

export interface SelfAnalysis {
  personality: { title: string; description: string };
  aptitude: string[];
  healthBalance: { oheng: Oheng; level: number }[];
  energyRhythm: { time: string; level: number }[];
  advice: string;
}

export interface LifetimeAnalysis extends SajuResult {
  daeunPeriods: DaeunPeriod[];
  lifetimeScore: number;
  goldenPeriods: GoldenPeriod[];
  personalityType: {
    title: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  };
  careerAnalysis?: CareerAnalysis;
  studyAnalysis?: StudyAnalysis;
  wealthAnalysis?: WealthAnalysis;
  relationshipAnalysis?: RelationshipAnalysis;
  selfAnalysis?: SelfAnalysis;
}

export interface FortuneCategoryDetail {
  score: number;
  summary: string;
  detail: string;
  advice: string;
  luckyTip?: string;
  cautionPoint?: string;
}

export interface FortuneResult {
  id?: string;
  baseResultId?: string;
  userId?: string;
  guestSessionId?: string;
  period: AnalysisPeriod;
  score: number;
  summary: string;
  details: string;
  luckyColor?: string;
  luckyItem?: string;
  sourceKind?: "personal" | QuickFortuneKind;
  categories?: {
    total?: FortuneCategoryDetail;
    love?: FortuneCategoryDetail;
    wealth?: FortuneCategoryDetail;
    career?: FortuneCategoryDetail;
    study?: FortuneCategoryDetail;
    health?: FortuneCategoryDetail;
  };
  luckyNumber?: number;
  healthTip?: string;
  createdAt?: string;
}

export interface DreamInput {
  symbols: string[];
  freeText?: string;
}

export interface DreamInterpretation {
  summary: string;
  themes: string[];
  cautions: string[];
  advice: string;
  luckyTip?: string;
}

export interface DreamResult {
  id?: string;
  userId?: string;
  guestSessionId?: string;
  input: DreamInput;
  interpretation: DreamInterpretation;
  createdAt?: string;
}

export interface YearlyFortuneMonth {
  month: number;
  score: number;
  summary: string;
}

export interface YearlyFortuneResult {
  year: number;
  overallScore: number;
  summary: string;
  months: YearlyFortuneMonth[];
  focus: string[];
  cautions: string[];
}

export type GoodDayEventType = "move" | "contract" | "confession" | "announcement";

export interface GoodDayItem {
  date: string;
  score: number;
  reason: string;
  caution?: string;
}

export interface CompatibilityResult {
  id?: string;
  userId?: string;
  guestSessionId?: string;
  personA: UserBirthData;
  personB: UserBirthData;
  personAPalja: Palja;
  personBPalja: Palja;
  personAOheng: OhengDistribution[];
  personBOheng: OhengDistribution[];
  score: number;
  summary: string;
  strengths: string[];
  cautions: string[];
  advice: string;
  createdAt?: string;
}

export interface AstrologyPoint {
  name: string;
  quality: string;
  element: string;
  sign: string;
  sign_num: number;
  position: number;
  abs_pos: number;
  emoji: string;
  point_type: string;
  house: string | null;
  retrograde: boolean | null;
}

export interface AstrologyPlanet {
  name: string;
  nameKo: string;
  sign: string;
  signKo: string;
  element: string;
  quality: string;
  house: number;
  degree: number;
  retrograde: boolean;
  interpretation: string;
}

export interface AstrologyHouse {
  number: number;
  sign: string;
  signKo: string;
  degree: number;
  theme: string;
  themeDescription: string;
}

export interface AstrologyAspect {
  planet1: string;
  planet2: string;
  planet1Ko: string;
  planet2Ko: string;
  aspectType: string;
  aspectTypeKo: string;
  orb: number;
  influence: "positive" | "negative" | "neutral";
  interpretation: string;
}

export interface AstrologyResult {
  success: boolean;
  data: any; // Fallback
  big3: {
    sun: AstrologyPlanet;
    moon: AstrologyPlanet;
    rising: {
      sign: string;
      signKo: string;
      element: string;
      quality: string;
      degree: number;
      interpretation: string;
    };
  };
  planets: AstrologyPlanet[];
  houses: AstrologyHouse[];
  aspects: AstrologyAspect[];
  elementDistribution: { fire: number; earth: number; air: number; water: number };
  qualityDistribution: { cardinal: number; fixed: number; mutable: number };
  chartSvg: string;
  chart_svg?: string; // fallback for current pages
}

export interface AstrologyRequest {
  name?: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  lng: number;
  lat: number;
  tz_str: string;
  birthTimeKnown?: boolean;
}

export interface AstrologyReportSummary {
  keynote: string;
  strengths: string[];
  risks: string[];
  actionsNow: string[];
}

export type AstrologyReportChapterId = "personality" | "relationship" | "timing" | "future-flow";

export interface AstrologyReportChapter {
  id: AstrologyReportChapterId;
  title: string;
  interpretation: string;
  evidence: string[];
  actionGuide: string[];
  aiInsight?: string | null;
}

export interface AstrologyQuarterNode {
  label: string;
  focus: string;
  caution: string;
  score: number;
}

export interface AstrologyReportTiming {
  monthFocus: string;
  monthCaution: string;
  quarterFlow: AstrologyQuarterNode[];
}

export interface AstrologyReportConfidence {
  birthTimeKnown: boolean;
  level: "high" | "medium";
  message: string;
}

export interface AstrologyDeepData {
  data: any;
  big3: AstrologyResult["big3"];
  planets: AstrologyPlanet[];
  houses: AstrologyHouse[];
  aspects: AstrologyAspect[];
  elementDistribution: AstrologyResult["elementDistribution"];
  qualityDistribution: AstrologyResult["qualityDistribution"];
  chartSvg: string;
  chart_svg?: string;
}

export interface AstrologyBirthReportResult {
  success: boolean;
  generatedAt: string;
  summary: AstrologyReportSummary;
  chapters: AstrologyReportChapter[];
  timing: AstrologyReportTiming;
  deepData: AstrologyDeepData;
  confidence: AstrologyReportConfidence;
}

export type AstrologyCalendarImpact = "high" | "medium" | "low";

export interface AstrologyCalendarSummary {
  headline: string;
  focus: string;
  caution: string;
}

export interface AstrologyCalendarHighlight {
  title: string;
  score: number;
  note: string;
}

export interface AstrologyCalendarEvent {
  date: string;
  title: string;
  impact: AstrologyCalendarImpact;
  meaning: string;
  action: string;
}

export interface AstrologyCalendarChapter {
  id: "career" | "relationship" | "energy" | "money";
  title: string;
  interpretation: string;
  actionGuide: string[];
}

export interface AstrologyCalendarChecklist {
  do: string[];
  dont: string[];
}

export interface AstrologyCalendarDeepData {
  transits?: unknown[];
  sourceNotes: string[];
  rawReport?: string;
}

export interface AstrologyCalendarResult {
  success: boolean;
  year: number;
  month: number;
  summary: AstrologyCalendarSummary;
  highlights: AstrologyCalendarHighlight[];
  events: AstrologyCalendarEvent[];
  chapters: AstrologyCalendarChapter[];
  checklist: AstrologyCalendarChecklist;
  deepData?: AstrologyCalendarDeepData;
}
