export type CalendarType = "solar" | "lunar" | "lunar-leap";

export type Gender = "male" | "female";

export type AnalysisPeriod = "today" | "week" | "month";

export type QuickFortuneKind = "zodiac" | "starSign";

export type DataPrivacyMode = "local-only" | "cloud-save";

export type BirthPrecision = "exact" | "time-block" | "unknown";

export type ShareCardVariant = "summary" | "love" | "fortune";

export interface UserBirthData {
  name?: string;
  calendarType: CalendarType;
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  timeBlock?: string;
  birthPrecision?: BirthPrecision;
  location?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
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

export const SAJU_NEW_YEAR_2026_SERVICE_IDS = [
  "saju-2026-overview",
  "saju-2026-study-exam",
  "saju-love-focus",
  "saju-2026-wealth-business",
  "saju-2026-investment-assets",
  "saju-2026-career-aptitude",
  "saju-2026-health-balance",
  "saju-2026-yearly-outlook",
] as const;

export const SAJU_NEW_YEAR_2026_FOCUS_SERVICE_IDS = [
  "saju-2026-overview",
  "saju-2026-study-exam",
  "saju-love-focus",
  "saju-2026-wealth-business",
  "saju-2026-investment-assets",
  "saju-2026-career-aptitude",
  "saju-2026-health-balance",
] as const;

export type SajuAnalysisServiceId = (typeof SAJU_ANALYSIS_SERVICE_IDS)[number];
export type SajuNewYear2026ServiceId = (typeof SAJU_NEW_YEAR_2026_SERVICE_IDS)[number];
export type SajuServiceType = SajuAnalysisServiceId | SajuNewYear2026ServiceId | "traditional-saju";

export type InterpretationIntensityLevel = "약" | "중" | "강";
export type AttentionLevel = "낮음" | "보통" | "높음";
export type ChangeSignalLevel = "약" | "중" | "강";

export type NewYearFocusId = (typeof SAJU_NEW_YEAR_2026_FOCUS_SERVICE_IDS)[number];

export interface NewYearSignalTrio {
  interpretationIntensityLevel: InterpretationIntensityLevel;
  attentionLevel: AttentionLevel;
  changeSignalLevel: ChangeSignalLevel;
  reason: string;
}

export interface NewYearQuickSummary {
  verdict: string;
  keywords: string[];
  signalTrio: NewYearSignalTrio;
}

export interface NewYearTimelineNode {
  quarter: string;
  quarterSummary: string;
  opportunity: string;
  caution: string;
  action: string;
}

export interface NewYearFocusCard {
  focusId: NewYearFocusId;
  focusLabel: string;
  conclusion: string;
  dos: string[];
  donts: string[];
  evidencePrimary: string;
  evidenceExtra: string[];
}

export interface NewYearConsistencyMeta {
  targetYear: number;
  ganji: string;
  age: number | null;
  generatedAt: string;
}

export interface NewYearActionPlan90 {
  day30: string[];
  day60: string[];
  day90: string[];
}

export interface NewYearConsumerFaqItem {
  question: string;
  answer: string;
}

export interface SajuReportPayloadCommon {
  coreQuestion: string;
  coreInsights: string[];
  actionNow: string[];
  evidence: string[];
  analysisBlocks: SajuAnalysisBlock[];
}

export interface SajuAnalysisBlock {
  windowLabel: string;
  timeRange: string;
  coreFlow: string;
  evidence: string;
  opportunities: string[];
  risks: string[];
  actionStrategy: string[];
}

export interface SajuTrendPoint {
  label: string;
  value: number;
}

export type SajuTrendDirection = "up" | "down" | "flat";

export interface SajuTrendRawBasis {
  source: "manseryeok";
  checkpoint: {
    label: string;
    offset: number;
    unit: "year" | "week";
    targetDate: string;
    targetYear?: number;
  };
  ohengDistribution: Record<Oheng, number>;
  yongsin: Oheng[];
  seun?: {
    year: number;
    pillar: string;
    element: Oheng;
  };
  temporalPillars?: {
    yearPillar: string;
    monthPillar: string;
    dayPillar: string;
    yearElement: Oheng;
    monthElement: Oheng;
    dayElement: Oheng;
  };
  factorScores: Record<string, number>;
}

export interface SajuTrendPointEvidence {
  label: string;
  value: number;
  deltaFromPrev: number;
  direction: SajuTrendDirection;
  reasonSummary: string;
  interpretation: string;
  reasonDetails: string[];
  rawBasis: SajuTrendRawBasis;
}

export type SajuReportSupplementVisualType =
  | "timeline"
  | "before-after"
  | "decision-matrix"
  | "flow-radar"
  | "network-map"
  | "energy-wave"
  | "calendar-map";

export interface SajuReportSupplementExecutionProtocol {
  today: string[];
  thisWeek: string[];
  thisMonth: string[];
  avoid: string[];
}

export interface SajuReportSupplementVisualExplainer {
  type: SajuReportSupplementVisualType;
  title: string;
  items: string[];
}

export interface SajuReportSupplement {
  deepInsightSummary: string;
  deepDivePoints: string[];
  executionProtocol: SajuReportSupplementExecutionProtocol;
  checkpointQuestions: string[];
  visualExplainers: SajuReportSupplementVisualExplainer[];
}

export interface SajuDaeunPhaseRoadmapItem {
  phaseLabel: string;
  ageRange: string;
  yearRange: string;
  coreFlow: string;
  evidence: string;
  opportunities: string[];
  risks: string[];
  actionStrategy: string[];
}

export interface SajuHelperPhaseRoadmapItem {
  phaseLabel: string;
  timeRange: string;
  relationshipExpansion: string;
  collaborationFlow: string;
  mentorInfluxSignal: string;
  guardPattern: string;
  actionStrategy: string[];
}

export type SajuCareerStageId = "build-up" | "transition" | "expansion" | "stabilization";

export interface SajuCareerStageFlowItem {
  stageId: SajuCareerStageId;
  label: string;
  timeRange: string;
  coreFlow: string;
  evidence: string;
  opportunities: string[];
  risks: string[];
  actionStrategy: string[];
  transitionSignal: string;
}

export type SajuWealthLifecyclePhaseType = "accumulation" | "expansion" | "defense" | "volatility";

export interface SajuWealthLifecycleStage {
  phaseType: SajuWealthLifecyclePhaseType;
  timeRange: string;
  ageRange: string;
  yearRange: string;
  coreObjective: string;
  opportunity: string;
  risk: string;
  operatingRules: string[];
  transitionSignal: string;
}

export interface SajuLifetimeRoadmapPayload extends SajuReportPayloadCommon {
  longTermFlow: string;
  pivotMoments: string[];
  tenYearStrategy: string[];
  stageTransitions: string[];
  narrativeDirection: string;
  maturityExpansionCleanup: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuDaeunShiftPayload extends SajuReportPayloadCommon {
  transitionSignal: string;
  ninetyDayActions: string[];
  avoidanceScenario: string[];
  transitionSignals: string[];
  changePoints: string[];
  readinessActions: string[];
  phaseRoadmap: SajuDaeunPhaseRoadmapItem[];
  longHorizonDirection: string[];
  preAtPostDiff: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuCareerTimingPayload extends SajuReportPayloadCommon {
  careerWindow: string;
  careerArcSummary?: string;
  stageFlow?: SajuCareerStageFlowItem[];
  transitionSignal?: string;
  currentYearFocus?: string;
  decisionTree: string[];
  executionChecklist: string[];
  workModeFit: string;
  decideNow: string[];
  deferNow: string[];
  gainVsLossPatterns: string[];
  decisionCriteria: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuWealthFlowPayload extends SajuReportPayloadCommon {
  cashflowMap: string;
  riskZones: string[];
  assetRules: string[];
  wealthLifecycleStages: SajuWealthLifecycleStage[];
  assetTrendSeries: SajuTrendPoint[];
  assetTrendEvidence?: SajuTrendPointEvidence[];
  incomeStructure: string[];
  spendingPatterns: string[];
  accumulateVsExpand: string[];
  financialNoGo: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuHelperNetworkPayload extends SajuReportPayloadCommon {
  helperMap: string;
  conflictPatterns: string[];
  networkGuide: string[];
  helperProfiles: string[];
  relationExpansionVsEntanglement: string[];
  conflictLoops: string[];
  helperEntryWindows: string[];
  relationLayers: string[];
  phaseRoadmap?: SajuHelperPhaseRoadmapItem[];
  longHorizonDirection?: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuEnergyBalancePayload extends SajuReportPayloadCommon {
  energyCurve: string;
  innateProfile: string;
  operatingModel: string[];
  stageShiftMap: string[];
  longRangeStrategy: string[];
  routineDesign: string[];
  recoveryProtocol: string[];
  energyRhythmSeries: SajuTrendPoint[];
  energyRhythmEvidence?: SajuTrendPointEvidence[];
  immersionMode: string[];
  burnoutSignals: string[];
  overloadAlerts: string[];
  habitTweaks: string[];
  recoveryRoutines: string[];
  supplement?: SajuReportSupplement;
}

export interface SajuYearlyPhaseFocusMapItem {
  phaseLabel: string;
  focusPoint: string;
  executionPattern: string;
  checkpoint: string;
}

export interface SajuYearlyAccumulationTransitionFlowItem {
  axis: string;
  guidance: string;
}

export interface SajuYearlyTenYearFlowItem {
  periodLabel: "0~2년" | "3~5년" | "6~10년";
  phaseLabel: string;
  interpretation: string;
}

export interface SajuYearlyKeyThemeItem {
  theme: string;
  interpretation: string;
}

export interface SajuYearlyQuarterNarrativeItem {
  quarter: "1분기" | "2분기" | "3분기" | "4분기";
  role: string;
  meaning: string;
  focus: string;
  caution: string;
}

export interface SajuYearlyActionCalendarPayload extends SajuReportPayloadCommon {
  oneLineTotalReview: string;
  currentLifeFlow: string;
  meaningOfThisYear: string;
  tenYearFlow: SajuYearlyTenYearFlowItem[];
  longPatternInterpretation: string[];
  keyThemes: SajuYearlyKeyThemeItem[];
  quarterNarratives: SajuYearlyQuarterNarrativeItem[];
  yearEndResidue: string;
  closingLine: string;
  lifecycleExecutionPattern: string[];
  phaseFocusMap: SajuYearlyPhaseFocusMapItem[];
  accumulationTransitionFlow: SajuYearlyAccumulationTransitionFlowItem[];
  longPracticeStrategy: string[];
  yearToLifeBridge: string;
  quarterlyGoals: string[];
  monthlyActions: string[];
  riskCalendar: string[];
  quarterThemes: string[];
  monthlyPushCaution: string[];
  actionCheckpoints: string[];
  priorityQueue: string[];
  supplement?: SajuReportSupplement;
}

export interface NewYear2026PayloadBase extends SajuReportPayloadCommon {
  quickSummary: NewYearQuickSummary;
  yearTimeline: NewYearTimelineNode[];
  actionPlan90: NewYearActionPlan90;
  consistencyMeta: NewYearConsistencyMeta;
}

export interface NewYear2026OverviewPayload extends NewYear2026PayloadBase {
  focusCards: NewYearFocusCard[];
}

export interface NewYear2026StudyActionDiagnosis {
  headline: string;
  summary: string;
  confidenceNote: string;
}

export interface NewYear2026StudyImmediateActions {
  startNow: string[];
  stopNow: string[];
  prepNow: string[];
}

export interface NewYear2026StudyYearFlowSummary {
  preparationPhase: string;
  accelerationPhase: string;
  showdownPhase: string;
  wrapUpPhase: string;
}

export interface NewYear2026StudyQuarterlyDetail {
  period: "1~3월" | "4~6월" | "7~9월" | "10~12월";
  strengths: string[];
  risks: string[];
  recommendedStrategies: string[];
  checkQuestionOrTip: string;
}

export interface NewYear2026StudyExamTypeGuides {
  writtenExam: string[];
  interviewOrOral: string[];
  longTermLearning: string[];
}

export interface NewYear2026StudyPerformanceStrategy {
  studyMethod: string[];
  lifeManagement: string[];
  mentalManagement: string[];
}

export interface NewYear2026StudyActionReport {
  coreDiagnosis: NewYear2026StudyActionDiagnosis;
  keyQuestion: string;
  keyInsights: string[];
  immediateActions: NewYear2026StudyImmediateActions;
  yearFlowSummary: NewYear2026StudyYearFlowSummary;
  quarterlyDetailed: NewYear2026StudyQuarterlyDetail[];
  examTypeGuides: NewYear2026StudyExamTypeGuides;
  failurePatterns: string[];
  performanceStrategy: NewYear2026StudyPerformanceStrategy;
  plainEvidence: string[];
  finalSummary: string[];
}

export interface NewYear2026StudyExamPayload extends NewYear2026PayloadBase {
  studyRhythm: string;
  examWindows: string[];
  mistakeTriggers: string[];
  executionGuide: string[];
  evidenceNotes: string[];
  studyActionReport?: NewYear2026StudyActionReport;
}

export interface NewYear2026LovePayload extends NewYear2026PayloadBase {
  relationshipFlow: string;
  approachSignals: string[];
  cautionPatterns: string[];
  relationshipGuide: string[];
  marriageDecisionBoard: string[];
  meetingChannelPriority: string[];
  greenFlagChecklist: string[];
  redFlagChecklist: string[];
  conflictProtocol: string[];
  consumerFaq: NewYearConsumerFaqItem[];
  evidenceNotes: string[];
}

export type NewYear2026QuarterLabel = "1분기" | "2분기" | "3분기" | "4분기";

export interface NewYear2026WealthQuarterlyFlowCard {
  quarter: NewYear2026QuarterLabel;
  flowSummary: string;
  keyPoint: string;
  risk: string;
  actionStrategy: string;
}

export interface NewYear2026WealthBusinessPayload extends NewYear2026PayloadBase {
  cashflowPulse: string;
  growthAxes: string[];
  leakRisks: string[];
  operatingRules: string[];
  evidenceNotes: string[];
  oneLineDiagnosis: string;
  keyPoints: string[];
  easyInterpretationPoints: string[];
  annualFlowSummary: string;
  quarterlyFlowCards: NewYear2026WealthQuarterlyFlowCard[];
  revenueFlowDeepDive: string[];
  businessManagementPoints: string[];
  burnoutPreventionStrategies: string[];
  actionChecklist: string[];
  closingLine: string;
}

export interface NewYear2026InvestmentActionDiagnosis {
  headline: string;
  summary: string;
}

export interface NewYear2026InvestmentQuarterlyFlow {
  quarter: NewYear2026QuarterLabel;
  summary: string;
  actionFocus: string[];
  riskFocus: string[];
}

export interface NewYear2026InvestmentAssetClassGuides {
  stocksEtf: string[];
  realEstate: string[];
  cashSavings: string[];
  cryptoHighVolatility: string[];
}

export interface NewYear2026InvestmentSignalBoard {
  watchSignals: string[];
  entrySignals: string[];
}

export interface NewYear2026InvestmentActionReport {
  coreDiagnosis: NewYear2026InvestmentActionDiagnosis;
  keyQuestion: string;
  keyInsights: string[];
  immediateActions: string[];
  absoluteCautions: string[];
  quarterlyFlow: NewYear2026InvestmentQuarterlyFlow[];
  assetClassGuides: NewYear2026InvestmentAssetClassGuides;
  signalBoard: NewYear2026InvestmentSignalBoard;
  riskAlerts: string[];
  practicalChecklist: string[];
  plainEvidence: string[];
  flowTo2027: string;
  finalConclusion: string[];
}

export interface NewYear2026InvestmentPayload extends NewYear2026PayloadBase {
  entryBias: string;
  watchSignals: string[];
  riskAlerts: string[];
  capitalRules: string[];
  evidenceNotes: string[];
  investmentActionReport?: NewYear2026InvestmentActionReport;
}

export interface NewYear2026CareerPayload extends NewYear2026PayloadBase {
  fitRoleSignal: string;
  strongWorkModes: string[];
  misfitChoices: string[];
  executionChecklist: string[];
  evidenceNotes: string[];
}

export interface NewYear2026HealthQuarterlyFlowCard {
  quarter: NewYear2026QuarterLabel;
  flowSummary: string;
  cautionPoint: string;
  recommendedAction: string;
}

export interface NewYear2026HealthRoutineGuide {
  morning: string[];
  daytime: string[];
  evening: string[];
  weekly: string[];
}

export interface NewYear2026HealthPayload extends NewYear2026PayloadBase {
  energyRhythm: string;
  bodyPatterns: string[];
  quarterlyFlowCards: NewYear2026HealthQuarterlyFlowCard[];
  recoveryPriorities: string[];
  overloadSignals: string[];
  overloadChecklist: string[];
  routineChecklist: string[];
  routineGuide: NewYear2026HealthRoutineGuide;
  evidenceNotes: string[];
}

export type NewYear2026FocusedPayload =
  | NewYear2026StudyExamPayload
  | NewYear2026LovePayload
  | NewYear2026WealthBusinessPayload
  | NewYear2026InvestmentPayload
  | NewYear2026CareerPayload
  | NewYear2026HealthPayload;

export type NewYear2026ReportPayload = NewYear2026OverviewPayload | NewYear2026FocusedPayload;

export interface SajuReportPayloadMap {
  "saju-2026-overview": NewYear2026OverviewPayload;
  "saju-2026-study-exam": NewYear2026StudyExamPayload;
  "saju-2026-yearly-outlook": NewYear2026OverviewPayload;
  "saju-love-focus": NewYear2026LovePayload;
  "saju-2026-wealth-business": NewYear2026WealthBusinessPayload;
  "saju-2026-investment-assets": NewYear2026InvestmentPayload;
  "saju-2026-career-aptitude": NewYear2026CareerPayload;
  "saju-2026-health-balance": NewYear2026HealthPayload;
  "saju-lifetime-roadmap": SajuLifetimeRoadmapPayload;
  "saju-daeun-shift": SajuDaeunShiftPayload;
  "saju-career-timing": SajuCareerTimingPayload;
  "saju-wealth-flow": SajuWealthFlowPayload;
  "saju-helper-network": SajuHelperNetworkPayload;
  "saju-energy-balance": SajuEnergyBalancePayload;
  "saju-yearly-action-calendar": SajuYearlyActionCalendarPayload;
}

export type SajuReportPayload = SajuReportPayloadMap[SajuAnalysisServiceId | SajuNewYear2026ServiceId];

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
  
  // -- V2 고도화 (전체 생성 + 항목별 잠금) --
  reportPayloads?: Partial<Record<SajuServiceType, SajuReportPayload>>;
  summaries?: Partial<Record<SajuServiceType, string>>;
  sectionsMap?: Partial<Record<SajuServiceType, SectionAnalysis[]>>;
  unlockedItems?: SajuServiceType[];
  isLocked?: boolean;
  // ----------------------------------------
  
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

export type NewYear2026SajuGeminiAnalysis = {
  [K in SajuNewYear2026ServiceId]: GeminiAnalysis & {
    serviceType: K;
    reportTemplateVersion: string;
    reportPayload: SajuReportPayloadMap[K];
  };
}[SajuNewYear2026ServiceId];

export type SajuAnalysisResponse =
  | TraditionalSajuGeminiAnalysis
  | NewYear2026SajuGeminiAnalysis
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

export type FortuneCategoryId = "total" | "love" | "wealth" | "career" | "study" | "health";

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
  categories?: Partial<Record<FortuneCategoryId, FortuneCategoryDetail>>;
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
  data: Record<string, unknown>; // Fallback
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

export type AstrologyLegacyReportChapterId =
  | "personality"
  | "relationship"
  | "timing"
  | "future-flow";

export type AstrologyUserReportChapterId =
  | "temperament"
  | "love-relationship"
  | "work-career"
  | "money-wealth"
  | "health-rhythm"
  | "near-term-flow"
  | "action-now";

export type AstrologyReportChapterId =
  | AstrologyLegacyReportChapterId
  | AstrologyUserReportChapterId;

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
  score: number;
  level: "high" | "medium" | "low";
  summary: string;
  reasons: string[];
  uncertainAreas: string[];
  birthTimeKnown: boolean;
  message?: string; // legacy alias
}

export interface AstrologyDeepData {
  data: Record<string, unknown>;
  big3: AstrologyResult["big3"];
  planets: AstrologyPlanet[];
  houses: AstrologyHouse[];
  aspects: AstrologyAspect[];
  elementDistribution: AstrologyResult["elementDistribution"];
  qualityDistribution: AstrologyResult["qualityDistribution"];
  chartSvg: string;
  chart_svg?: string;
}

export interface AstrologyPersonaPublicImageInsight {
  title: string;
  summary: string;
  evidence: string[];
  action: string;
}

export interface AstrologyStopHabitsInsight {
  title: string;
  habits: string[];
  replacements: string[];
}

export interface AstrologyMoneyPathInsight {
  title: string;
  primaryPath: string;
  secondaryPath: string;
  blockers: string[];
  firstAction: string;
}

export interface AstrologyExclusiveInsights {
  personaPublicImage: AstrologyPersonaPublicImageInsight;
  stopHabits: AstrologyStopHabitsInsight;
  moneyPath: AstrologyMoneyPathInsight;
}

export interface AstrologyCuriosityLovePattern {
  title: string;
  attractionStyle: string;
  emotionalNeed: string;
  conflictTrigger: string;
  healthierApproach: string;
}

export interface AstrologyCuriosityWorkPersona {
  title: string;
  bestRole: string;
  collaborationStyle: string;
  hiddenAdvantage: string;
  burnoutTrigger: string;
  growthAction: string;
}

export interface AstrologyCuriosityStressRecovery {
  title: string;
  trigger: string;
  warningSignal: string;
  resetRoutine: string;
  boundaryRule: string;
}

export interface AstrologyCuriosityLuckRoutine {
  title: string;
  amplifier: string;
  blocker: string;
  ritual: string;
  timingTip: string;
}

export interface AstrologyCuriosityFaqItem {
  question: string;
  answer: string;
}

export interface AstrologyCuriosityFaq {
  title: string;
  items: AstrologyCuriosityFaqItem[];
}

export interface AstrologyCuriosityInsights {
  lovePattern: AstrologyCuriosityLovePattern;
  workPersona: AstrologyCuriosityWorkPersona;
  stressRecovery: AstrologyCuriosityStressRecovery;
  luckRoutine: AstrologyCuriosityLuckRoutine;
  faq: AstrologyCuriosityFaq;
}

export type AstrologyPopularQuestionId =
  | "love"
  | "work"
  | "money"
  | "recovery"
  | "luck";

export interface AstrologyBirthReportResult {
  success: boolean;
  generatedAt: string;
  hero: {
    headline: string;
    topInsights: [string, string, string];
  };
  popularQuestions: Array<{
    id: AstrologyPopularQuestionId;
    question: string;
    answer: string;
  }>;
  lifePatterns: Record<
    "relationship" | "work" | "money" | "recovery",
    {
      pattern: string;
      problemManifestation: string;
      trigger: string;
      recommendedAction: string;
      basis?: string[];
      isEstimated?: boolean;
    }
  >;
  currentWindow: {
    month: {
      focus: string;
      avoid: string;
      routine: string;
      basis: string[];
      cacheKey: string;
    };
    quarter: {
      focus: string;
      avoid: string;
      routine: string;
      basis: string[];
      cacheKey: string;
    };
  };
  confidence: AstrologyReportConfidence;
  deepData: AstrologyDeepData;
  meta: {
    templateVersion: "v4" | "v5";
    timezone: string;
    birthTimeKnown: boolean;
    birthPrecision?: "known" | "unknown";
    generatedFrom: "natal+transit";
  };

  // Legacy compatibility fields (v3 readers)
  summary: AstrologyReportSummary;
  chapters: AstrologyReportChapter[];
  timing: AstrologyReportTiming;
  exclusiveInsights: AstrologyExclusiveInsights;
  curiosityInsights: AstrologyCuriosityInsights;
}

export type AstrologyCalendarImpact = "high" | "medium" | "low";
export type AstrologyCalendarChoiceGuideId = "career" | "relationship" | "energy" | "money";
export type AstrologyCalendarPhase = "early" | "mid" | "late";

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

export interface AstrologyCalendarChoiceGuide {
  id: AstrologyCalendarChoiceGuideId;
  title: string;
  guidance: string;
  recommendedAction: string;
  avoidAction: string;
}

export interface AstrologyCalendarPhaseGuide {
  phase: AstrologyCalendarPhase;
  title: string;
  meaning: string;
  action: string;
  impact: AstrologyCalendarImpact;
}

export interface AstrologyCalendarExpertNote {
  label: string;
  plainMeaning: string;
  sourceType: string;
}

export interface AstrologyCalendarDeepData {
  transits?: unknown[];
  sourceNotes: string[];
  rawReport?: string;
  generationMode: "deterministic";
  calculationBasis: "CircularNatalHoroscopeJS@1.1.0";
  analysisWindow: {
    year: number;
    month: number;
    daysAnalyzed: number;
    transitTime: "12:00";
    phaseBuckets: ["1-10", "11-20", "21-end"];
  };
  birthTimeAccuracy: "known" | "unknown";
}

export interface AstrologyCalendarUserContext {
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dominantElement: string;
  dominantQuality: string;
  birthTimeKnown: boolean;
}

export interface AstrologyCalendarResult {
  success: boolean;
  year: number;
  month: number;
  summary: AstrologyCalendarSummary;
  highlights: AstrologyCalendarHighlight[];
  priorityActions: string[];
  choiceGuides: AstrologyCalendarChoiceGuide[];
  phaseGuides: AstrologyCalendarPhaseGuide[];
  avoidList: string[];
  expertNotes: AstrologyCalendarExpertNote[];
  userContext?: AstrologyCalendarUserContext;
  deepData?: AstrologyCalendarDeepData;
}

// ---------------------------------------------------------------------------
// Chat (만세력 상담형 채팅)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  tags?: string[];
  suggestions?: string[];
}

export interface SajuChatContext {
  name?: string;
  palja: Palja;
  oheng: OhengDistribution[];
  yongsin?: Oheng[];
  sinsal?: Sinsal[];
  profileMeta: {
    name?: string;
    calendarType?: CalendarType;
    birthYear: number;
    birthMonth: number;
    birthDay: number;
    gender: Gender;
    birthPrecision?: BirthPrecision;
    timeBlock?: string;
    hour?: number;
    minute?: number;
  };
  currentYear: number;
}

export interface ChatRequest {
  message: string;
  conversationHistory: Pick<ChatMessage, "role" | "content">[];
  sajuContext: SajuChatContext;
  ownerKey: string;
  profileKey: string;
  usageId: string;
  usageSource: "input" | "suggestion";
  requestMeta?: {
    traceId?: string;
  };
}

export interface ChatResponse {
  reply: string;
  tags?: string[];
  followUpSuggestions?: string[];
  quota?: {
    remaining: number;
    total: number;
    charged: boolean;
    nextFreeResetAt?: string | null;
  };
}
