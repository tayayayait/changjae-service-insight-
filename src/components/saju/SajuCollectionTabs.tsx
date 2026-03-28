import React, { useEffect, useMemo, useState } from "react";
import { LockedSectionOverlay } from "@/components/common/LockedSectionOverlay";
import { PaywallLockIcon } from "@/components/common/PaywallLockIcon";
import { SajuTrendChart, type SajuTrendDomainPoint } from "@/components/saju/SajuTrendChart";
import { getServiceTitleById } from "@/lib/serviceCatalog";
import { cn } from "@/lib/utils";
import type {
  BirthPrecision,
  NewYearConsumerFaqItem,
  NewYear2026InvestmentActionReport,
  NewYear2026InvestmentPayload,
  NewYear2026QuarterLabel,
  NewYear2026HealthPayload,
  NewYear2026ReportPayload,
  NewYear2026OverviewPayload,
  NewYear2026StudyActionReport,
  NewYear2026StudyExamPayload,
  NewYear2026WealthBusinessPayload,
  NewYearFocusCard,
  SajuAnalysisBlock,
  SajuCareerStageFlowItem,
  SajuCareerTimingPayload,
  SajuDaeunPhaseRoadmapItem,
  SajuDaeunShiftPayload,
  SajuHelperNetworkPayload,
  SajuHelperPhaseRoadmapItem,
  SajuReportSupplement,
  SajuEnergyBalancePayload,
  SajuReportPayload,
  SajuResult,
  SajuServiceType,
  SajuWealthLifecycleStage,
  SajuWealthFlowPayload,
  SajuYearlyActionCalendarPayload,
  SectionAnalysis,
} from "@/types/result";

interface SajuCollectionTabsProps {
  result: SajuResult;
  serviceIds: string[];
  onUnlockRequest: (serviceId: string, isBulk?: boolean) => void;
  isLocked?: boolean;
  className?: string;
}

interface FocusedDetailCard {
  title: string;
  text?: string;
  items?: string[];
  faqItems?: NewYearConsumerFaqItem[];
  fullWidth?: boolean;
}

interface NewYearWealthActionableQuarterCard {
  quarter: NewYear2026QuarterLabel;
  flowSummary: string;
  keyPoint: string;
  risk: string;
  actionStrategy: string;
}

interface NewYearWealthActionableView {
  oneLineDiagnosis: string;
  keyPoints: string[];
  easyInterpretationPoints: string[];
  annualFlowSummary: string;
  quarterlyFlowCards: NewYearWealthActionableQuarterCard[];
  revenueFlowDeepDive: string[];
  businessManagementPoints: string[];
  burnoutPreventionStrategies: string[];
  actionChecklist: string[];
  closingLine: string;
}

interface NewYearHealthActionableQuarterCard {
  quarter: NewYear2026QuarterLabel;
  flowSummary: string;
  cautionPoint: string;
  recommendedAction: string;
}

interface NewYearHealthActionableView {
  oneLineDiagnosis: string;
  keyPoints: string[];
  confidenceLabel: string;
  confidenceDescription: string;
  birthTimeReferenceNote: string | null;
  bodyPatterns: string[];
  quarterlyFlowCards: NewYearHealthActionableQuarterCard[];
  overloadChecklist: string[];
  recoveryPriorities: string[];
  routineGuide: {
    morning: string[];
    daytime: string[];
    evening: string[];
    weekly: string[];
  };
  closingNotices: string[];
}

interface NewYearInvestmentActionableView extends NewYear2026InvestmentActionReport {}

const NEW_YEAR_WEALTH_QUARTER_ORDER: NewYear2026QuarterLabel[] = ["1분기", "2분기", "3분기", "4분기"];
const NEW_YEAR_HEALTH_QUARTER_ORDER: NewYear2026QuarterLabel[] = ["1분기", "2분기", "3분기", "4분기"];
const NEW_YEAR_INVESTMENT_QUARTER_ORDER: NewYear2026QuarterLabel[] = ["1분기", "2분기", "3분기", "4분기"];

const NEW_YEAR_FOCUSED_SECTION_TITLES: Partial<Record<SajuServiceType, string>> = {
  "saju-2026-study-exam": "시험·학업운 심화 해석",
  "saju-love-focus": "연애·결혼운 심화 해석",
  "saju-2026-wealth-business": "재물·사업운 심화 해석",
  "saju-2026-investment-assets": "주식·부동산 투자운 심화 해석",
  "saju-2026-career-aptitude": "직업·적성 심화 해석",
  "saju-2026-health-balance": "건강운 심화 해석",
};

const WEALTH_DOMAIN: SajuTrendDomainPoint[] = [
  { label: "현재", position: 0 },
  { label: "1년 후", position: 1 },
  { label: "3년 후", position: 3 },
  { label: "5년 후", position: 5 },
  { label: "10년 후", position: 10 },
];

const ENERGY_DOMAIN: SajuTrendDomainPoint[] = [
  { label: "1주", position: 1 },
  { label: "2주", position: 2 },
  { label: "3주", position: 3 },
  { label: "4주", position: 4 },
  { label: "8주", position: 8 },
  { label: "12주", position: 12 },
];

const WEALTH_DESCRIPTION = "앞으로 10년 동안 자산 흐름의 확장과 방어 시점을 보여주는 추세 차트";
const ENERGY_DESCRIPTION = "앞으로 12주 동안 집중과 회복의 리듬 변화를 보여주는 추세 차트";

const WEALTH_LIFECYCLE_DEFAULTS: Array<{
  phaseType: SajuWealthLifecycleStage["phaseType"];
  label: string;
  timeRange: string;
}> = [
  { phaseType: "accumulation", label: "축적기", timeRange: "0~2년" },
  { phaseType: "expansion", label: "확장기", timeRange: "3~5년" },
  { phaseType: "defense", label: "방어기", timeRange: "6~10년" },
  { phaseType: "volatility", label: "변동기", timeRange: "10년+" },
];

const isOverviewPayload = (
  payload: SajuReportPayload | undefined,
): payload is NewYear2026OverviewPayload => Boolean(payload && "focusCards" in payload);

const isWealthPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuWealthFlowPayload => Boolean(payload && "assetTrendSeries" in payload);

const isEnergyPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuEnergyBalancePayload => Boolean(payload && "energyRhythmSeries" in payload);

const isDaeunShiftPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuDaeunShiftPayload =>
  Boolean(
    payload &&
      "transitionSignal" in payload &&
      "transitionSignals" in payload &&
      "ninetyDayActions" in payload &&
      "preAtPostDiff" in payload,
  );

const isCareerTimingPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuCareerTimingPayload =>
  Boolean(
    payload &&
      "careerWindow" in payload &&
      "decisionTree" in payload &&
      "executionChecklist" in payload &&
      "decideNow" in payload &&
      "deferNow" in payload,
  );

const isHelperNetworkPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuHelperNetworkPayload =>
  Boolean(
    payload &&
      "helperMap" in payload &&
      "networkGuide" in payload &&
      "conflictPatterns" in payload &&
      "relationLayers" in payload,
  );

const isYearlyCalendarPayload = (
  payload: SajuReportPayload | undefined,
): payload is SajuYearlyActionCalendarPayload =>
  Boolean(
    payload &&
      "quarterlyGoals" in payload &&
      "monthlyActions" in payload &&
      "riskCalendar" in payload,
  );

const CAREER_STAGE_DEFAULTS: Array<{
  stageId: SajuCareerStageFlowItem["stageId"];
  label: string;
  timeRange: string;
}> = [
  { stageId: "build-up", label: "초기 축적기", timeRange: "0~2년" },
  { stageId: "transition", label: "전환기", timeRange: "3~5년" },
  { stageId: "expansion", label: "확장기", timeRange: "6~10년" },
  { stageId: "stabilization", label: "안정화기", timeRange: "10년+" },
];
const YEARLY_PHASE_FOCUS_DEFAULT_LABELS = ["0~2년", "3~5년", "6~10년", "전환"] as const;

const DAEUN_PHASE_LABELS = [
  "전환 전 준비기",
  "전환기",
  "전환 후 재배치기",
  "전환 후 정착기",
] as const;

const DAEUN_PHASE_YEAR_RANGE_FALLBACKS = [
  "전환 전 2년",
  "전환 연도~다음 해",
  "전환 후 1~3년",
  "전환 후 4~10년",
] as const;

const DAEUN_LONG_HORIZON_LABELS = ["현재~2년", "3~5년", "6~10년"] as const;
const DAEUN_LONG_HORIZON_OFFSETS = [
  { start: 0, end: 2 },
  { start: 3, end: 5 },
  { start: 6, end: 10 },
] as const;

const toEnergyBlockToken = (block: SajuAnalysisBlock) => `${block.windowLabel} ${block.timeRange}`.toLowerCase();

const isEnergyShortTermBlock = (block: SajuAnalysisBlock) => {
  const token = toEnergyBlockToken(block);
  return token.includes("4주") || token.includes("12주");
};

const isEnergyCurrentYearBlock = (block: SajuAnalysisBlock) => {
  const token = toEnergyBlockToken(block);
  return token.includes("적용 포인트") || token.includes("2026") || token.includes("현재 연도");
};

const toSupplementStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      )
    : [];

const getSupplement = (
  payload: SajuReportPayload | undefined,
  serviceId?: string,
): SajuReportSupplement | null => {
  if (!payload || !("supplement" in payload)) {
    return null;
  }

  const rawSupplement = (payload as { supplement?: unknown }).supplement;
  if (!rawSupplement || typeof rawSupplement !== "object") {
    return null;
  }

  const supplement = rawSupplement as Record<string, unknown>;
  const execution = (supplement.executionProtocol ?? {}) as Record<string, unknown>;
  const visualExplainers = Array.isArray(supplement.visualExplainers)
    ? supplement.visualExplainers
    : [];

  const deepDivePoints = toSupplementStringArray(supplement.deepDivePoints);
  const legacyLenses = toSupplementStringArray(
    (supplement as { interpretationLenses?: unknown }).interpretationLenses,
  );

  const normalized: SajuReportSupplement = {
    deepInsightSummary:
      typeof supplement.deepInsightSummary === "string" && supplement.deepInsightSummary.trim().length > 0
        ? supplement.deepInsightSummary.trim()
        : "핵심 흐름을 기준으로 실행 우선순위를 다시 정렬하세요.",
    deepDivePoints:
      deepDivePoints.length > 0
        ? deepDivePoints
        : legacyLenses.length > 0
          ? legacyLenses
          : ["핵심 해석 포인트를 기준으로 우선순위를 다시 점검하세요."],
    executionProtocol: {
      today: toSupplementStringArray(execution.today),
      thisWeek: toSupplementStringArray(execution.thisWeek),
      thisMonth: toSupplementStringArray(execution.thisMonth),
      avoid: toSupplementStringArray(execution.avoid),
    },
    checkpointQuestions: toSupplementStringArray(supplement.checkpointQuestions),
    visualExplainers: visualExplainers
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const visual = item as Record<string, unknown>;
        const type =
          typeof visual.type === "string"
            ? (visual.type as SajuReportSupplement["visualExplainers"][number]["type"])
            : "timeline";
        const title =
          typeof visual.title === "string" && visual.title.trim().length > 0
            ? visual.title.trim()
            : "시각 설명";
        return {
          type,
          title,
          items: toSupplementStringArray(visual.items),
        };
      })
      .filter(
        (
          item,
        ): item is SajuReportSupplement["visualExplainers"][number] =>
          Boolean(item),
      ),
  };

  const isCareerTimingService = serviceId === "saju-career-timing";
  const isYearlyCalendarService = serviceId === "saju-yearly-action-calendar";

  if (normalized.executionProtocol.today.length === 0 && !isCareerTimingService && !isYearlyCalendarService) {
    normalized.executionProtocol.today = ["오늘 우선순위 1개를 고정하고 바로 실행하세요."];
  }
  if (normalized.executionProtocol.thisWeek.length === 0 && !isCareerTimingService && !isYearlyCalendarService) {
    normalized.executionProtocol.thisWeek = ["이번 주 핵심 과제를 2개로 제한해 실행하세요."];
  }
  if (normalized.executionProtocol.thisMonth.length === 0 && !isCareerTimingService && !isYearlyCalendarService) {
    normalized.executionProtocol.thisMonth = ["이번 달 점검 지표를 정해 실행 추적을 고정하세요."];
  }
  if (normalized.executionProtocol.avoid.length === 0 && !isYearlyCalendarService) {
    normalized.executionProtocol.avoid = ["기준 없는 과속 결정을 피하세요."];
  }
  if (normalized.checkpointQuestions.length === 0) {
    normalized.checkpointQuestions = ["지금 실행이 핵심 질문에 직접 연결되는가?"];
  }
  if (normalized.visualExplainers.length === 0) {
    normalized.visualExplainers = [{ type: "timeline", title: "시각 설명", items: ["핵심 흐름 요약"] }];
  }

  return normalized;
};

const isNewYearOverviewServiceId = (serviceId: string) =>
  serviceId === "saju-2026-overview" || serviceId === "saju-2026-yearly-outlook";

const compactStrings = (items: Array<string | undefined | null>) =>
  items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

const uniqueItems = (items: Array<string | undefined | null>) => Array.from(new Set(compactStrings(items)));

const toStringList = (value: unknown) =>
  Array.isArray(value) ? uniqueItems(value.map((item) => (typeof item === "string" ? item : null))) : [];

const SENTENCE_CHUNK_PATTERN = /[^.!?。！？]+[.!?。！？]?/gu;
const SENTENCE_END_PATTERN = /[.!?。！？]$/u;

const ensureSentenceEnding = (value: unknown) => {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (!trimmed) {
    return "";
  }
  return SENTENCE_END_PATTERN.test(trimmed) ? trimmed : `${trimmed}.`;
};

const splitIntoSentences = (value: unknown) => {
  const normalized = (typeof value === "string" ? value : "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [] as string[];
  }
  const matched = normalized.match(SENTENCE_CHUNK_PATTERN) ?? [normalized];
  return uniqueItems(matched.map((chunk) => ensureSentenceEnding(chunk)));
};

const ensureSentenceRange = (
  values: Array<string | undefined | null>,
  fallbackValues: Array<string | undefined | null>,
  minItems: number,
  maxItems: number,
) => {
  const normalized = uniqueItems(values.map((value) => ensureSentenceEnding(value))).slice(0, maxItems);
  if (normalized.length >= minItems) {
    return normalized;
  }

  const fallback = uniqueItems(fallbackValues.map((value) => ensureSentenceEnding(value)));
  for (const candidate of fallback) {
    if (normalized.length >= minItems || normalized.length >= maxItems) {
      break;
    }
    if (!normalized.includes(candidate)) {
      normalized.push(candidate);
    }
  }

  return normalized.slice(0, maxItems);
};

const normalizeParagraph = (
  value: unknown,
  fallbacks: Array<string | undefined | null>,
  defaultSentences: string[],
) => {
  const direct = typeof value === "string" ? value.trim() : "";
  const sentencePool = [
    ...splitIntoSentences(direct),
    ...fallbacks.flatMap((item) => splitIntoSentences(typeof item === "string" ? item : "")),
  ];
  const normalized = ensureSentenceRange(sentencePool, defaultSentences, 2, 4);
  if (normalized.length > 0) {
    return normalized.join(" ");
  }

  return ensureSentenceEnding(defaultSentences[0] ?? "해석 근거를 다시 확인하세요.");
};

const normalizeList = (
  value: unknown,
  fallbacks: Array<string | undefined | null>,
  defaultSentences: string[],
) => {
  const direct = toStringList(value).flatMap((item) => splitIntoSentences(item));
  const fallbackSentences = [
    ...fallbacks.flatMap((item) => splitIntoSentences(typeof item === "string" ? item : "")),
    ...defaultSentences.flatMap((item) => splitIntoSentences(item)),
  ];
  return ensureSentenceRange(direct, fallbackSentences, 2, 4);
};

const LOVE_FAQ_QUESTION_TEMPLATES = [
  "지금 고백하거나 관계를 정의해도 되나요?",
  "상견례나 부모님 소개는 언제가 적절한가요?",
  "결혼 이야기는 어느 시점에 꺼내야 하나요?",
  "상대 연락이 줄어들면 바로 불안해해도 되나요?",
  "상대가 결혼을 계속 미루면 어떻게 해야 하나요?",
  "조건은 좋지만 마음이 불안한 관계는 유지해도 되나요?",
  "장거리·바쁜 일정에서도 결혼까지 갈 수 있나요?",
  "관계를 계속할지 정리할지 결정이 안 됩니다.",
] as const;

const normalizeFaqItems = (
  value: unknown,
  fallbackAnswers: Array<string | undefined | null>,
): NewYearConsumerFaqItem[] => {
  const directFaqItems = Array.isArray(value)
    ? value
        .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
        .map((item) => ({
          question: typeof item.question === "string" ? item.question.trim() : "",
          answer: typeof item.answer === "string" ? ensureSentenceEnding(item.answer) : "",
        }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0)
        .slice(0, LOVE_FAQ_QUESTION_TEMPLATES.length)
    : [];

  if (directFaqItems.length === LOVE_FAQ_QUESTION_TEMPLATES.length) {
    return directFaqItems;
  }

  const fallbackPool = ensureSentenceRange(
    compactStrings(fallbackAnswers).flatMap((item) => splitIntoSentences(item)),
    [
      "조건이 확인되면 다음 관계 단계를 진행하고, 확인 기준을 반드시 기록하세요.",
      "갈등이 발생하면 24시간/72시간 회복 순서로 대응하고, 복구 지표를 확인하세요.",
    ],
    4,
    LOVE_FAQ_QUESTION_TEMPLATES.length,
  );

  return LOVE_FAQ_QUESTION_TEMPLATES.map((question, index) => ({
    question,
    answer: directFaqItems[index]?.answer ?? fallbackPool[index % Math.max(fallbackPool.length, 1)],
  }));
};

const STUDY_ACTION_PERIODS = ["1~3월", "4~6월", "7~9월", "10~12월"] as const;

const isStudyExamPayload = (
  payload: SajuReportPayload | undefined,
): payload is NewYear2026StudyExamPayload =>
  Boolean(payload && "studyRhythm" in payload && "examWindows" in payload && "mistakeTriggers" in payload);

const isInvestmentPayload = (
  payload: SajuReportPayload | undefined,
): payload is NewYear2026InvestmentPayload =>
  Boolean(payload && "entryBias" in payload && "watchSignals" in payload && "riskAlerts" in payload && "capitalRules" in payload);

const resolveHealthConfidence = (birthPrecision?: BirthPrecision) => {
  if (birthPrecision === "exact") {
    return {
      confidenceLabel: "높음",
      confidenceDescription: "출생 시간이 정확해 연간 건강 흐름의 해석 정밀도가 비교적 안정적입니다.",
      birthTimeReferenceNote: null,
    };
  }

  if (birthPrecision === "time-block") {
    return {
      confidenceLabel: "보통",
      confidenceDescription: "출생 시간이 시간대 단위라 세부 강도 해석은 변동될 수 있습니다.",
      birthTimeReferenceNote: "출생 시간이 시간대 입력이라 세부 시점 해석은 참고용으로 활용하세요.",
    };
  }

  return {
    confidenceLabel: "참고용",
    confidenceDescription: "출생 시간이 없어 해석 강도는 보수적으로 읽는 편이 안전합니다.",
    birthTimeReferenceNote: "출생 시간을 추가하면 건강 흐름 해석의 세부 정확도를 더 높일 수 있습니다.",
  };
};

const buildStudyActionReportView = (
  payload: SajuReportPayload | undefined,
  sections: SectionAnalysis[],
): NewYear2026StudyActionReport | null => {
  if (!isStudyExamPayload(payload)) {
    return null;
  }

  const analysisBlocks = payload.analysisBlocks ?? [];
  const timeline = payload.yearTimeline ?? [];
  const sectionFallback = sections[0]?.interpretation ?? analysisBlocks[0]?.coreFlow ?? payload.studyRhythm;
  const opportunityFallbacks = [
    ...timeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
    ...(payload.coreInsights ?? []),
  ];
  const cautionFallbacks = [
    ...timeline.map((node) => node.caution),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
    ...(payload.mistakeTriggers ?? []),
  ];
  const actionFallbacks = [
    ...timeline.map((node) => node.action),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
    ...(payload.executionGuide ?? []),
    ...(payload.actionNow ?? []),
  ];
  const evidenceFallbacks = [
    ...(payload.evidenceNotes ?? []),
    ...(payload.evidence ?? []),
    ...analysisBlocks.map((block) => block.evidence),
  ];
  const rawReport = payload.studyActionReport ?? ({} as Partial<NewYear2026StudyActionReport>);
  const quarterlyRaw = Array.isArray(rawReport.quarterlyDetailed) ? rawReport.quarterlyDetailed : [];

  const keyInsights = ensureSentenceRange(
    toStringList(rawReport.keyInsights).flatMap((item) => splitIntoSentences(item)),
    [...(payload.coreInsights ?? []), ...payload.examWindows, ...payload.executionGuide],
    3,
    3,
  );

  const immediateActions = {
    startNow: normalizeList(rawReport.immediateActions?.startNow, actionFallbacks, [
      "핵심 과목 1개를 매일 같은 시간에 배치해 시작 지연을 줄이세요.",
      "주 2회 오답 복기 시간을 고정해 실수 재발률을 낮추세요.",
    ]),
    stopNow: normalizeList(rawReport.immediateActions?.stopNow, cautionFallbacks, [
      "계획 없이 과목 수를 늘리는 행동을 중단하고 기존 루틴 유지율부터 점검하세요.",
      "피로 누적 상태에서 공부 시간만 늘리는 방식을 멈추고 회복 슬롯을 먼저 확보하세요.",
    ]),
    prepNow: normalizeList(rawReport.immediateActions?.prepNow, [...opportunityFallbacks, ...evidenceFallbacks], [
      "지원·응시 일정, 진도율, 오답 유형을 한 장의 점검표로 묶어 주간 업데이트하세요.",
      "시험 8주 전부터 시간 배분 리허설을 주 1회 고정하세요.",
    ]),
  };

  const quarterlyDetailed = STUDY_ACTION_PERIODS.map((period, index) => {
    const quarterSource = (quarterlyRaw[index] ?? {}) as Record<string, unknown>;
    const block = analysisBlocks[index];
    const node = timeline[index];

    return {
      period,
      strengths: normalizeList(
        quarterSource.strengths,
        [node?.opportunity, ...(block?.opportunities ?? []), payload.examWindows[index], keyInsights[index]],
        [
          `${period}에는 반복 루틴을 고정하면 집중력 유지가 수월해집니다.`,
          `${period}에는 오답 복기 누적이 실전 점수 안정에 직접 연결됩니다.`,
        ],
      ),
      risks: normalizeList(
        quarterSource.risks,
        [node?.caution, ...(block?.risks ?? []), payload.mistakeTriggers[index], evidenceFallbacks[index]],
        [
          `${period}에는 범위 과확장이 복습 붕괴로 이어지기 쉬우니 관리가 필요합니다.`,
          `${period}에는 실전 점검 없이 진도만 밀면 시험 직전 흔들림이 커질 수 있습니다.`,
        ],
      ),
      recommendedStrategies: normalizeList(
        quarterSource.recommendedStrategies,
        [node?.action, ...(block?.actionStrategy ?? []), payload.executionGuide[index], immediateActions.startNow[index]],
        [
          `${period}에는 주간 목표를 2개로 제한하고 완료 기준을 수치로 기록하세요.`,
          `${period}에는 모의고사 결과를 유형별로 분리해 다음 주 계획에 즉시 반영하세요.`,
        ],
      ),
      checkQuestionOrTip: normalizeParagraph(
        quarterSource.checkQuestionOrTip,
        [payload.coreQuestion, node?.action, payload.actionNow[index], sectionFallback],
        [
          `${period} 체크 질문: 공부 시간보다 정답률 개선 근거를 기록했는가?`,
          `${period} 실전 팁: 하루 종료 전 10분은 오답 원인 1개를 문장으로 남기세요.`,
        ],
      ),
    };
  });

  return {
    coreDiagnosis: {
      headline:
        rawReport.coreDiagnosis?.headline?.trim() ||
        "한눈에 보면, 2026년 합격운은 루틴 일관성과 실전 복기 강도에서 갈립니다.",
      summary: normalizeParagraph(
        rawReport.coreDiagnosis?.summary,
        [payload.studyRhythm, sectionFallback, analysisBlocks[0]?.coreFlow],
        [
          "초반 추진력이 높아도 범위를 과도하게 넓히면 중반 이후 점수 안정성이 무너질 수 있습니다.",
          "올해는 진도 속도보다 반복 주기와 오답 복기 고정이 성과를 만듭니다.",
        ],
      ),
      confidenceNote: normalizeParagraph(
        rawReport.coreDiagnosis?.confidenceNote,
        [payload.evidenceNotes[0], payload.evidence[0], timeline[0]?.caution],
        [
          "실행 기준을 지키면 상승 흐름을 유지하기 쉽지만, 리듬이 깨지면 성과 편차가 커질 수 있습니다.",
          "주간 점검 지표를 고정해 이탈 신호를 빠르게 복구하세요.",
        ],
      ),
    },
    keyQuestion: rawReport.keyQuestion?.trim() || payload.coreQuestion,
    keyInsights,
    immediateActions,
    yearFlowSummary: {
      preparationPhase: normalizeParagraph(
        rawReport.yearFlowSummary?.preparationPhase,
        [timeline[0]?.quarterSummary, timeline[0]?.action, analysisBlocks[0]?.coreFlow, payload.studyRhythm],
        [
          "준비기에는 과목별 기준을 줄이고 기본 개념과 오답 분류 체계를 먼저 고정해야 합니다.",
          "이 시기 기준이 흔들리면 이후 가속 구간에서 누수가 커집니다.",
        ],
      ),
      accelerationPhase: normalizeParagraph(
        rawReport.yearFlowSummary?.accelerationPhase,
        [timeline[1]?.quarterSummary, timeline[1]?.action, analysisBlocks[1]?.coreFlow, payload.examWindows[0]],
        [
          "가속기에는 진도 확장과 실전 적용을 병행하되 복기 시간을 먼저 확보하세요.",
          "성과가 보여도 범위는 점수 기여도가 높은 파트 중심으로만 확장하세요.",
        ],
      ),
      showdownPhase: normalizeParagraph(
        rawReport.yearFlowSummary?.showdownPhase,
        [timeline[2]?.quarterSummary, timeline[2]?.action, analysisBlocks[2]?.coreFlow, payload.executionGuide[0]],
        [
          "승부기에는 시간 배분, 문제 선택, 멘탈 복구 루틴을 동시에 점검해야 합니다.",
          "신규 학습보다 오답 재발 방지 전략에 집중하는 편이 실전에 유리합니다.",
        ],
      ),
      wrapUpPhase: normalizeParagraph(
        rawReport.yearFlowSummary?.wrapUpPhase,
        [timeline[3]?.quarterSummary, timeline[3]?.action, analysisBlocks[3]?.coreFlow, payload.evidenceNotes[0]],
        [
          "정리기에는 범위를 줄이고 흔들리는 파트만 압축 보완해 실전 안정성을 높이세요.",
          "마감 시기에는 새 자료 탐색보다 누적 데이터 기반 최종 루틴 고정이 우선입니다.",
        ],
      ),
    },
    quarterlyDetailed,
    examTypeGuides: {
      writtenExam: normalizeList(rawReport.examTypeGuides?.writtenExam, [...actionFallbacks, ...opportunityFallbacks], [
        "필기시험형은 개념-문제-오답 복기를 1세트로 반복해 정답 재현성을 높이세요.",
        "주 1회 시간 제한 훈련으로 속도와 정확도 균형을 점검하세요.",
      ]),
      interviewOrOral: normalizeList(
        rawReport.examTypeGuides?.interviewOrOral,
        [...payload.executionGuide, ...payload.actionNow, ...evidenceFallbacks],
        [
          "면접/구술형은 답변을 1분·3분 버전으로 분리해 말하기 루틴을 고정하세요.",
          "실전 직전에는 내용 추가보다 전달 구조와 속도 조절을 반복 점검하세요.",
        ],
      ),
      longTermLearning: normalizeList(
        rawReport.examTypeGuides?.longTermLearning,
        [payload.studyRhythm, ...payload.executionGuide, ...(payload.coreInsights ?? [])],
        [
          "장기 학습형은 월간 목표보다 주간 반복 지표 고정이 성과 누적에 유리합니다.",
          "슬럼프 구간에는 진도 확장보다 기본 루틴 복구를 우선하세요.",
        ],
      ),
    },
    failurePatterns: normalizeList(rawReport.failurePatterns, [...payload.mistakeTriggers, ...cautionFallbacks], [
      "점수 반등 직후 계획 없이 과목을 늘리면 복습 붕괴로 성과가 급격히 흔들리는 패턴이 반복됩니다.",
      "오답 원인 기록 없이 문제 수만 늘리면 실전에서 같은 실수가 재발합니다.",
    ]),
    performanceStrategy: {
      studyMethod: normalizeList(rawReport.performanceStrategy?.studyMethod, [...actionFallbacks, ...opportunityFallbacks], [
        "공부 방식은 과목별 목표를 줄이고 반복 주기를 고정해 누적 효율을 높이세요.",
        "학습 직후 복기 기록을 남겨 다음 학습 시작 지연을 줄이세요.",
      ]),
      lifeManagement: normalizeList(rawReport.performanceStrategy?.lifeManagement, [...payload.actionNow, ...actionFallbacks], [
        "생활 관리는 수면·식사·이동 시간을 고정해 공부 시작 지연을 줄이는 데 집중하세요.",
        "주간 일정에 회복 블록을 먼저 넣어 과부하 누적을 막으세요.",
      ]),
      mentalManagement: normalizeList(
        rawReport.performanceStrategy?.mentalManagement,
        [...evidenceFallbacks, ...payload.mistakeTriggers],
        [
          "멘탈 관리는 감정 추측보다 데이터 점검 중심으로 전환해 불안 반응을 줄이세요.",
          "실전 직전에는 결과 예측보다 수행 체크리스트 반복으로 긴장 편차를 낮추세요.",
        ],
      ),
    },
    plainEvidence: normalizeList(rawReport.plainEvidence, [...payload.evidenceNotes, ...payload.evidence], [
      "쉽게 말해, 올해는 많이 하는 사람보다 같은 방식으로 끝까지 반복한 사람이 유리합니다.",
      "시기별 강점과 리스크가 달라서 분기마다 전략을 조정해야 실제 성과로 이어집니다.",
    ]),
    finalSummary: normalizeList(rawReport.finalSummary, [...keyInsights, ...immediateActions.startNow, ...payload.actionNow], [
      "2026 합격 가이드는 루틴 고정, 오답 구조화, 실전 시간 관리의 3축을 함께 지키는 것입니다.",
      "지금 해야 할 행동을 일정에 고정하고 분기별 점검 질문으로 보정하면 합격운을 성과로 바꿀 수 있습니다.",
    ]),
  };
};

const YEARLY_QUARTERS = ["1분기", "2분기", "3분기", "4분기"] as const;
const QUARTER_GUIDANCE_PATTERN = /([1-4]\s*분기)\s*(?:[:：]|(?=\s))/gu;

const splitQuarterGuidance = (value: string) => {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [] as Array<{ quarter: string; text: string }>;
  }

  const matches = Array.from(normalized.matchAll(QUARTER_GUIDANCE_PATTERN));
  if (matches.length === 0) {
    return [] as Array<{ quarter: string; text: string }>;
  }

  return matches
    .map((match, index) => {
      const start = (match.index ?? 0) + match[0].length;
      const end = index + 1 < matches.length ? (matches[index + 1]?.index ?? normalized.length) : normalized.length;
      const rawText = normalized.slice(start, end).trim().replace(/^[·,:\-\s]+/u, "");
      const text = ensureSentenceEnding(rawText);
      if (!text) {
        return null;
      }
      return {
        quarter: (match[1] ?? `${index + 1}분기`).replace(/\s+/g, ""),
        text,
      };
    })
    .filter((item): item is { quarter: string; text: string } => Boolean(item));
};

const stripLeadingQuarterMarker = (value: string, quarter: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const quarterPrefixPattern = new RegExp(
    `^(?:(?:19|20|21)\\d{2}\\s*년\\s*)?${quarter}\\s*[:：\\-·]?\\s*`,
    "u",
  );
  return trimmed.replace(quarterPrefixPattern, "").trim();
};

const buildQuarterGuidanceItems = (
  guidance: string,
  axis: string,
  quarterNarratives: Array<{ role?: string; focus?: string }>,
  quarterlyGoals: string[],
): Array<{ quarter: string; text: string }> => {
  const parsed = splitQuarterGuidance(guidance);
  const parsedByQuarter = new Map<string, string>();
  for (const item of parsed) {
    const quarterKey = item.quarter.replace(/\s+/g, "");
    if (!parsedByQuarter.has(quarterKey) && item.text.trim()) {
      parsedByQuarter.set(quarterKey, item.text.trim());
    }
  }

  return YEARLY_QUARTERS.map((quarter, index) => {
    const parsedText = parsedByQuarter.get(quarter);
    if (parsedText) {
      return {
        quarter,
        text: ensureSentenceEnding(stripLeadingQuarterMarker(parsedText, quarter)),
      };
    }

    const role = quarterNarratives[index]?.role?.trim() ?? "";
    const focus = quarterNarratives[index]?.focus?.trim() ?? "";
    const goal = stripLeadingQuarterMarker(quarterlyGoals[index] ?? "", quarter);
    const base = role ? `${role} 구간에서 ${axis} 기준을 유지하세요.` : `${axis} 기준을 ${quarter} 운영에 맞게 유지하세요.`;
    const withFocus = focus ? `${base} 핵심은 ${focus}` : base;
    const withGoal = goal ? `${withFocus} ${goal}` : withFocus;
    return {
      quarter,
      text: ensureSentenceEnding(withGoal),
    };
  });
};

const YEAR_PATTERN = /(19|20|21)\d{2}/u;

const parseYearCandidate = (value: unknown): number | null => {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    const year = Math.trunc(numeric);
    if (year >= 1900 && year <= 2100) {
      return year;
    }
  }

  if (typeof value !== "string") {
    return null;
  }
  const match = value.match(YEAR_PATTERN);
  if (!match) {
    return null;
  }
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) && parsed >= 1900 && parsed <= 2100 ? parsed : null;
};

const getYearFromDate = (value: string | undefined, timeZone?: string): number | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    if (timeZone) {
      const yearText = new Intl.DateTimeFormat("ko-KR", { year: "numeric", timeZone }).format(date);
      const parsed = parseYearCandidate(yearText);
      if (parsed !== null) {
        return parsed;
      }
    }
  } catch {
    // Ignore invalid timezone and fallback to local year.
  }

  return date.getFullYear();
};

const stripLeadingMonthMarker = (
  value: string,
  monthIndex: number,
): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const month = monthIndex + 1;
  const monthPrefixPattern = new RegExp(
    `^(?:(?:19|20|21)\\d{2}\\s*년\\s*)?${month}\\s*월\\s*[:：\\-·]?\\s*`,
    "u",
  );
  return trimmed.replace(monthPrefixPattern, "").trim();
};

const buildDaeunPhaseRoadmap = (payload: SajuDaeunShiftPayload): SajuDaeunPhaseRoadmapItem[] => {
  const rawPhaseRoadmap = Array.isArray((payload as { phaseRoadmap?: unknown }).phaseRoadmap)
    ? ((payload as { phaseRoadmap?: SajuDaeunPhaseRoadmapItem[] }).phaseRoadmap ?? [])
    : [];
  const rawLongHorizonDirection = toStringList((payload as { longHorizonDirection?: unknown }).longHorizonDirection);
  const phaseRoadmapSeed =
    rawPhaseRoadmap.length > 0
      ? rawPhaseRoadmap
      : payload.analysisBlocks.map((block) => ({
          phaseLabel: block.windowLabel,
          ageRange: "연령 정보 기준 자동 보정",
          yearRange: block.timeRange,
          coreFlow: block.coreFlow,
          evidence: block.evidence,
          opportunities: block.opportunities ?? [],
          risks: block.risks ?? [],
          actionStrategy: block.actionStrategy ?? [],
        }));

  return DAEUN_PHASE_LABELS.map((defaultLabel, index) => {
    const seed = phaseRoadmapSeed[index] ?? {
      phaseLabel: defaultLabel,
      ageRange: "연령 정보 기준 자동 보정",
      yearRange: DAEUN_PHASE_YEAR_RANGE_FALLBACKS[index],
      coreFlow: "",
      evidence: "",
      opportunities: [] as string[],
      risks: [] as string[],
      actionStrategy: [] as string[],
    };
    const block = payload.analysisBlocks[index];
    const phaseLabel = seed.phaseLabel?.trim() || block?.windowLabel?.trim() || defaultLabel;

    return {
      phaseLabel,
      ageRange: seed.ageRange?.trim() || "연령 정보 기준 자동 보정",
      yearRange:
        seed.yearRange?.trim() || block?.timeRange?.trim() || DAEUN_PHASE_YEAR_RANGE_FALLBACKS[index],
      coreFlow: normalizeParagraph(
        seed.coreFlow,
        [block?.coreFlow, payload.transitionSignal, payload.transitionSignals[index], rawLongHorizonDirection[index]],
        [
          `${phaseLabel}에서는 이전 단계와 다른 운영 기준을 고정해 전환의 방향을 분명히 해야 합니다.`,
          `${phaseLabel}의 핵심은 단기 반응보다 장기 운영 축을 재배치하는 데 있습니다.`,
        ],
      ),
      evidence: normalizeParagraph(
        seed.evidence,
        [block?.evidence, payload.evidence[index], payload.changePoints[index]],
        [
          `${phaseLabel}는 기존 패턴이 유지되지 않는 신호가 누적되는 구간입니다.`,
          `${phaseLabel}에서 기준 재설정 여부가 다음 단계의 안정성을 좌우합니다.`,
        ],
      ),
      opportunities: normalizeList(
        seed.opportunities,
        [...(block?.opportunities ?? []), ...payload.transitionSignals, ...rawLongHorizonDirection],
        [
          `${phaseLabel}에서만 활용 가능한 기회 축을 1개 이상 확정하세요.`,
          `${phaseLabel}에 맞는 운영 기준을 문장으로 고정하면 다음 단계 전환 손실을 줄일 수 있습니다.`,
        ],
      ),
      risks: normalizeList(
        seed.risks,
        [...(block?.risks ?? []), ...payload.changePoints, ...payload.avoidanceScenario],
        [
          `${phaseLabel}에서 이전 단계의 성공 공식을 그대로 반복하면 오판 확률이 높아집니다.`,
          `${phaseLabel}는 단기 성과 추격보다 기준 이탈을 통제하지 않으면 변동성이 커질 수 있습니다.`,
        ],
      ),
      actionStrategy: normalizeList(
        seed.actionStrategy,
        [...(block?.actionStrategy ?? []), ...payload.readinessActions, ...payload.ninetyDayActions],
        [
          `${phaseLabel} 행동 우선순위를 2개 이내로 제한해 실행력 분산을 막으세요.`,
          `${phaseLabel} 체크 지표를 월 단위로 고정해 전환 리듬의 흔들림을 즉시 보정하세요.`,
        ],
      ),
    };
  });
};

const YEAR_RANGE_PATTERN = /(\d{4})\D+(\d{4})/u;

const parseYearRange = (value: string): { startYear: number; endYear: number } | null => {
  const matched = value.match(YEAR_RANGE_PATTERN);
  if (!matched) {
    return null;
  }
  const startYear = Number(matched[1]);
  const endYear = Number(matched[2]);
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return null;
  }
  return { startYear, endYear };
};

type DaeunLongHorizonItem = {
  label: (typeof DAEUN_LONG_HORIZON_LABELS)[number];
  yearRangeLabel: string;
  text: string;
};

const buildDaeunLongHorizonItems = (
  values: string[],
  phaseRoadmap: SajuDaeunPhaseRoadmapItem[],
): DaeunLongHorizonItem[] => {
  const transitionPhase = phaseRoadmap.find((phase) => phase.phaseLabel.includes("전환기"));
  const parsedTransitionRange = parseYearRange(transitionPhase?.yearRange ?? "");
  const anchorYear = parsedTransitionRange?.startYear ?? null;

  return DAEUN_LONG_HORIZON_LABELS.map((label, index) => {
    const offsets = DAEUN_LONG_HORIZON_OFFSETS[index];
    const yearRangeLabel =
      anchorYear !== null
        ? `${anchorYear + offsets.start}~${anchorYear + offsets.end}년`
        : "";
    return {
      label,
      yearRangeLabel,
      text: values[index] ?? "",
    };
  });
};

const buildCareerStageFlow = (payload: SajuCareerTimingPayload): SajuCareerStageFlowItem[] => {
  const rawStageFlow = Array.isArray(payload.stageFlow) ? payload.stageFlow : [];
  const fromStageId = new Map(rawStageFlow.map((item) => [item.stageId, item] as const));

  return CAREER_STAGE_DEFAULTS.map((fallbackStage, index) => {
    const block = payload.analysisBlocks[index];
    const source = fromStageId.get(fallbackStage.stageId) ?? rawStageFlow[index];
    const stageLabel = source?.label?.trim() || block?.windowLabel?.trim() || fallbackStage.label;
    const stageRange = source?.timeRange?.trim() || block?.timeRange?.trim() || fallbackStage.timeRange;

    return {
      stageId: fallbackStage.stageId,
      label: stageLabel,
      timeRange: stageRange,
      coreFlow: normalizeParagraph(
        source?.coreFlow,
        [block?.coreFlow, payload.careerArcSummary, payload.careerWindow],
        [
          `${stageLabel}에서는 핵심 역량과 실행 기준을 고정해 다음 단계 전환 오차를 줄여야 합니다.`,
          `${stageRange} 구간의 선택 축을 먼저 고정하면 장기 커리어 변동성을 낮출 수 있습니다.`,
        ],
      ),
      evidence: normalizeParagraph(
        source?.evidence,
        [block?.evidence, ...payload.evidence],
        [
          `${stageLabel}에서는 성과보다 기준 일관성이 다음 단계 안정성을 좌우합니다.`,
          `${stageRange} 구간의 해석 근거를 문장으로 정리하면 전환기 판단 품질이 높아집니다.`,
        ],
      ),
      opportunities: normalizeList(
        source?.opportunities,
        [...(block?.opportunities ?? []), ...payload.decisionTree, ...payload.coreInsights],
        [
          `${stageLabel}의 기회 축을 1~2개로 제한하면 실행 집중도가 높아집니다.`,
          `${stageRange} 구간에서 축적한 기준은 다음 단계 자산으로 전환할 수 있습니다.`,
        ],
      ),
      risks: normalizeList(
        source?.risks,
        [...(block?.risks ?? []), ...payload.gainVsLossPatterns, ...payload.evidence],
        [
          `${stageLabel}에서 기준 없는 속도 경쟁은 장기 손실 패턴을 키울 수 있습니다.`,
          `${stageRange} 구간의 우선순위 충돌을 방치하면 다음 단계 진입 타이밍이 늦어질 수 있습니다.`,
        ],
      ),
      actionStrategy: normalizeList(
        source?.actionStrategy,
        [...(block?.actionStrategy ?? []), ...payload.executionChecklist, ...payload.decideNow],
        [
          `${stageRange} 구간의 핵심 과제 2개를 고정하고 담당·기한·측정 기준을 함께 기록하세요.`,
          `${stageLabel}의 점검 주기를 분기 단위로 고정해 단계 전환 신호를 추적하세요.`,
        ],
      ),
      transitionSignal: normalizeParagraph(
        source?.transitionSignal,
        [payload.transitionSignal, ...payload.decisionCriteria],
        [
          `${stageLabel}에서 역할 적합성과 환경 적합성이 동시에 충족되면 다음 단계 전환 신호입니다.`,
          `${stageRange} 구간에서 기준 유지율이 높아지면 다음 단계 준비도가 충분하다는 신호입니다.`,
        ],
      ),
    };
  });
};

const buildWealthLifecycleStages = (payload: SajuWealthFlowPayload): SajuWealthLifecycleStage[] => {
  const rawStages = Array.isArray(payload.wealthLifecycleStages) ? payload.wealthLifecycleStages : [];
  const byPhaseType = new Map(rawStages.map((item) => [item.phaseType, item] as const));

  return WEALTH_LIFECYCLE_DEFAULTS.map((fallbackStage, index) => {
    const block = payload.analysisBlocks[index];
    const source = byPhaseType.get(fallbackStage.phaseType) ?? rawStages[index];
    const fallbackRules = [
      `${fallbackStage.label} 운영 원칙 1개를 먼저 고정하세요.`,
      `${fallbackStage.timeRange} 구간의 전환 조건을 월 단위로 점검하세요.`,
    ];
    return {
      phaseType: fallbackStage.phaseType,
      timeRange: source?.timeRange?.trim() || block?.timeRange?.trim() || fallbackStage.timeRange,
      ageRange: source?.ageRange?.trim() || "연령 정보 기준 자동 보정",
      yearRange: source?.yearRange?.trim() || "연도 정보 기준 자동 보정",
      coreObjective: normalizeParagraph(
        source?.coreObjective,
        [block?.coreFlow, payload.cashflowMap, payload.coreInsights[index]],
        [
          `${fallbackStage.label}에서는 자산 운영 기준을 고정해 다음 단계 변동성을 낮춰야 합니다.`,
          `${fallbackStage.timeRange} 구간의 핵심 목적을 문장으로 고정하면 축적과 확장의 충돌을 줄일 수 있습니다.`,
        ],
      ),
      opportunity: normalizeParagraph(
        source?.opportunity,
        [block?.opportunities?.[0], payload.incomeStructure[index], payload.coreInsights[index]],
        [
          `${fallbackStage.label}에서는 수입·지출 기준을 분리하면 운영 효율이 높아집니다.`,
          `${fallbackStage.timeRange} 구간의 기회 축을 1~2개로 제한하면 실행 집중도가 올라갑니다.`,
        ],
      ),
      risk: normalizeParagraph(
        source?.risk,
        [block?.risks?.[0], payload.riskZones[index], payload.financialNoGo[index]],
        [
          `${fallbackStage.label}에서 기준 없는 확장 판단은 손실 변동을 키울 수 있습니다.`,
          `${fallbackStage.timeRange} 구간의 리스크를 방치하면 다음 단계 전환 속도가 둔화될 수 있습니다.`,
        ],
      ),
      operatingRules: normalizeList(
        source?.operatingRules,
        [...(block?.actionStrategy ?? []), ...payload.assetRules, ...payload.actionNow],
        fallbackRules,
      ),
      transitionSignal: normalizeParagraph(
        source?.transitionSignal,
        [block?.evidence, payload.accumulateVsExpand[index], payload.actionNow[index]],
        [
          `${fallbackStage.label}의 기준 유지율이 높아지면 다음 단계 전환 신호가 확인됩니다.`,
          `${fallbackStage.timeRange} 구간의 핵심 지표가 안정되면 단계 전환 준비도가 충분하다는 신호입니다.`,
        ],
      ),
    } satisfies SajuWealthLifecycleStage;
  });
};

const HELPER_PHASE_DEFAULTS: Array<{
  phaseLabel: string;
  timeRange: string;
}> = [
  { phaseLabel: "관계 기반 정비기", timeRange: "0~2년" },
  { phaseLabel: "협업 확장기", timeRange: "3~5년" },
  { phaseLabel: "귀인 유입기", timeRange: "6~10년" },
  { phaseLabel: "관계 자산 전수기", timeRange: "10년+" },
];

const buildHelperPhaseRoadmap = (payload: SajuHelperNetworkPayload): SajuHelperPhaseRoadmapItem[] => {
  const source = Array.isArray(payload.phaseRoadmap) ? payload.phaseRoadmap : [];
  const fallbackFromBlocks = payload.analysisBlocks.map((block) => ({
    phaseLabel: block.windowLabel,
    timeRange: block.timeRange,
    relationshipExpansion: block.coreFlow,
    collaborationFlow: block.opportunities[0] ?? payload.networkGuide[0] ?? payload.helperMap,
    mentorInfluxSignal: block.evidence,
    guardPattern: block.risks[0] ?? payload.conflictPatterns[0] ?? "관계 경계 기준을 먼저 고정하세요.",
    actionStrategy: block.actionStrategy,
  }));

  return HELPER_PHASE_DEFAULTS.map((fallbackPhase, index) => {
    const phase = source[index] ?? fallbackFromBlocks[index];
    const relationshipExpansion =
      phase?.relationshipExpansion?.trim() ||
      payload.relationExpansionVsEntanglement[index] ||
      payload.analysisBlocks[index]?.coreFlow ||
      payload.helperMap;
    const collaborationFlow =
      phase?.collaborationFlow?.trim() ||
      payload.networkGuide[index] ||
      payload.relationLayers[index] ||
      payload.helperMap;
    const mentorInfluxSignal =
      phase?.mentorInfluxSignal?.trim() ||
      payload.helperEntryWindows[index] ||
      payload.evidence[index] ||
      payload.helperMap;
    const guardPattern =
      phase?.guardPattern?.trim() ||
      payload.conflictLoops[index] ||
      payload.conflictPatterns[index] ||
      "관계 경계 기준을 먼저 고정하세요.";
    const actionStrategy = ensureSentenceRange(
      [
        ...(phase?.actionStrategy ?? []),
        payload.networkGuide[index] ?? "",
        payload.actionNow[index] ?? "",
      ].flatMap((item) => splitIntoSentences(item)),
      [payload.networkGuide[index], payload.actionNow[index], payload.helperMap],
      2,
      3,
    );

    return {
      phaseLabel: phase?.phaseLabel?.trim() || fallbackPhase.phaseLabel,
      timeRange: phase?.timeRange?.trim() || fallbackPhase.timeRange,
      relationshipExpansion: normalizeParagraph(
        relationshipExpansion,
        [payload.helperMap, payload.relationExpansionVsEntanglement[index]],
        [`${fallbackPhase.phaseLabel}에는 관계 확장과 정리 기준을 먼저 분리하세요.`],
      ),
      collaborationFlow: normalizeParagraph(
        collaborationFlow,
        [payload.networkGuide[index], payload.relationLayers[index]],
        [`${fallbackPhase.timeRange} 협업 운영 기준을 문장으로 고정하세요.`],
      ),
      mentorInfluxSignal: normalizeParagraph(
        mentorInfluxSignal,
        [payload.helperEntryWindows[index], payload.evidence[index]],
        [`${fallbackPhase.timeRange} 멘토·귀인 유입 신호를 주기적으로 점검하세요.`],
      ),
      guardPattern: normalizeParagraph(
        guardPattern,
        [payload.conflictLoops[index], payload.conflictPatterns[index]],
        [`${fallbackPhase.phaseLabel}에서 반복되는 갈등 패턴을 즉시 차단하세요.`],
      ),
      actionStrategy,
    };
  });
};

const resolveWealthCheckpointStage = (label: string): string => {
  if (label.includes("현재") || label.includes("1년")) {
    return "축적기";
  }
  if (label.includes("3년")) {
    return "확장기";
  }
  if (label.includes("5년")) {
    return "방어기";
  }
  if (label.includes("10년")) {
    return "변동기";
  }
  return "단계 판독";
};

const buildWealthCheckpointStageReads = (
  payload: SajuWealthFlowPayload,
  lifecycleStages: SajuWealthLifecycleStage[],
): string[] => {
  const lifecycleByLabel = new Map(
    lifecycleStages.map((stage) => [WEALTH_LIFECYCLE_DEFAULTS.find((meta) => meta.phaseType === stage.phaseType)?.label, stage] as const),
  );

  if ((payload.assetTrendEvidence ?? []).length > 0) {
    return payload.assetTrendEvidence!.map((point) => {
      const phaseLabel = resolveWealthCheckpointStage(point.label);
      const phase = lifecycleByLabel.get(phaseLabel);
      const phaseRule = phase?.operatingRules[0] ?? `${phaseLabel} 운영 원칙을 먼저 고정하세요.`;
      return `${point.label} (${phaseLabel}): ${point.interpretation} · 운영 기준: ${phaseRule}`;
    });
  }

  return payload.assetTrendSeries.map((point) => {
    const phaseLabel = resolveWealthCheckpointStage(point.label);
    return `${point.label} (${phaseLabel}): 지수 ${point.value} 흐름을 기반으로 운영 규칙을 점검하세요.`;
  });
};

const toSemanticDedupKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/20\d{2}년/g, "")
    .replace(/오늘|이번 주|이번 달|현재 구간|지금/g, "")
    .replace(/담당·?기한·?측정 기준/g, "운영 기준")
    .replace(/[\s·,.;:!?()\[\]{}'"`~\-_/]/g, "");

const buildSupplementReferenceSet = (supplement: SajuReportSupplement | null): Set<string> => {
  if (!supplement) {
    return new Set<string>();
  }

  const items = uniqueItems([
    ...supplement.deepDivePoints,
    ...supplement.checkpointQuestions,
    ...supplement.executionProtocol.today,
    ...supplement.executionProtocol.thisWeek,
    ...supplement.executionProtocol.thisMonth,
    ...supplement.executionProtocol.avoid,
    ...supplement.visualExplainers.flatMap((item) => item.items),
  ]);

  return new Set(
    items.flatMap((item) => {
      const normalized = item.trim().toLowerCase();
      const semantic = toSemanticDedupKey(item);
      return [normalized, semantic].filter(Boolean);
    }),
  );
};

const dedupeAnalysisItems = (
  items: string[],
  block: Pick<SajuAnalysisBlock, "coreFlow" | "evidence">,
  supplementReferenceSet: Set<string>,
) =>
  uniqueItems(items)
    .filter((item) => {
      const normalized = item.trim().toLowerCase();
      const semantic = toSemanticDedupKey(item);
      if (!normalized) {
        return false;
      }
      if (normalized === block.coreFlow.trim().toLowerCase()) {
        return false;
      }
      if (normalized === block.evidence.trim().toLowerCase()) {
        return false;
      }
      if (semantic === toSemanticDedupKey(block.coreFlow) || semantic === toSemanticDedupKey(block.evidence)) {
        return false;
      }
      if (supplementReferenceSet.has(normalized) || (semantic.length > 0 && supplementReferenceSet.has(semantic))) {
        return false;
      }
      return true;
    })
    .slice(0, 4);

const getLegacyFocusCard = (
  payload: SajuReportPayload | undefined,
  serviceId: string,
): NewYearFocusCard | null => {
  if (!isOverviewPayload(payload)) {
    return null;
  }

  return payload.focusCards.find((card) => card.focusId === serviceId) ?? null;
};

const buildFocusedNewYearCards = (
  serviceId: string,
  payload: SajuReportPayload | undefined,
  sections: SectionAnalysis[],
): FocusedDetailCard[] => {
  if (!payload || isNewYearOverviewServiceId(serviceId)) {
    return [];
  }

  const raw = payload as NewYear2026ReportPayload & Record<string, unknown>;
  const legacyCard = getLegacyFocusCard(payload, serviceId);
  const analysisBlocks = payload.analysisBlocks ?? [];
  const timeline = Array.isArray(raw.yearTimeline) ? raw.yearTimeline : [];
  const flowFallback = sections[0]?.interpretation ?? analysisBlocks[0]?.coreFlow ?? "";
  const opportunityFallbacks = [
    ...timeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
  ];
  const cautionFallbacks = [
    ...(legacyCard?.donts ?? []),
    ...timeline.map((node) => node.caution),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
  ];
  const actionFallbacks = [
    ...(legacyCard?.dos ?? []),
    ...timeline.map((node) => node.action),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
  ];
  const evidenceFallbacks = [
    legacyCard?.evidencePrimary,
    ...(legacyCard?.evidenceExtra ?? []),
    ...(payload.evidence ?? []),
    ...analysisBlocks.map((block) => block.evidence),
  ];

  switch (serviceId) {
    case "saju-2026-study-exam":
      return [
        {
          title: "집중 흐름",
          text: normalizeParagraph(
            raw.studyRhythm,
            [legacyCard?.conclusion, flowFallback],
            [
              "상반기에는 학습 엔진을 빠르게 올리고 하반기에는 정리 완성도를 높여야 성과가 안정됩니다.",
              "하루 공부량보다 과목별 반복 주기를 고정해야 점수 변동폭이 줄어듭니다.",
            ],
          ),
        },
        {
          title: "승부 시점",
          items: normalizeList(raw.examWindows, opportunityFallbacks, [
            "2분기에는 지원·응시 일정을 앞당겨 확보하고 준비 리듬을 끊기지 않게 유지하세요.",
            "4분기에는 실전 루틴을 줄이지 말고 최종 정리 범위를 좁혀 마무리 집중도를 올리세요.",
          ]),
        },
        {
          title: "실수 패턴",
          items: normalizeList(raw.mistakeTriggers, cautionFallbacks, [
            "초반 성과가 나온 직후 과목 수를 급격히 늘리면 복습 회전이 무너져 전체 효율이 떨어집니다.",
            "오답 분류 없이 문제 수만 늘리면 체감 노력 대비 점수 상승 폭이 작아집니다.",
          ]),
        },
        {
          title: "합격 행동",
          items: normalizeList(raw.executionGuide, actionFallbacks, [
            "핵심 과목은 매일 같은 시간에 배치해 집중 시작 시간을 자동화하세요.",
            "주 2회 오답 복기와 주 1회 실전 시간 측정을 고정해 시험 적응력을 높이세요.",
          ]),
        },
        {
          title: "해석 근거",
          items: normalizeList(raw.evidenceNotes, evidenceFallbacks, [
            "올해 학업운은 초반 추진력과 중반 조정력이 함께 나타나 루틴 유지 여부가 성과를 좌우합니다.",
            "분기별 흐름을 보면 진도 선점 이후 정리 완성도에서 최종 결과가 갈리는 구조가 반복됩니다.",
          ]),
          fullWidth: true,
        },
      ];
    case "saju-love-focus": {
      const relationshipFlow = normalizeParagraph(
        raw.relationshipFlow,
        [legacyCard?.conclusion, flowFallback],
        [
          "관계는 초반 탐색보다 중반 이후 신뢰 축적에서 속도가 붙는 흐름입니다.",
          "감정 표현의 강도보다 대화의 일관성이 관계 안정도를 더 크게 결정합니다.",
        ],
      );
      const approachSignals = normalizeList(raw.approachSignals, opportunityFallbacks, [
        "상대가 일정 공유와 후속 약속을 먼저 제안하면 관계 진입 신호로 해석할 수 있습니다.",
        "짧은 대화가 반복적으로 길어지고 개인 주제가 늘어나면 신뢰 구간이 열리고 있다는 신호입니다.",
      ]);
      const cautionPatterns = normalizeList(raw.cautionPatterns, cautionFallbacks, [
        "초반 호감이 높을 때 관계 정의를 서두르면 기대치 불일치가 빠르게 커질 수 있습니다.",
        "감정 확인 없는 추측형 대화가 누적되면 작은 오해가 장기 갈등으로 전환되기 쉽습니다.",
      ]);
      const relationshipGuide = normalizeList(raw.relationshipGuide, actionFallbacks, [
        "관계 속도는 주 단위로 점검하고 중요한 결정은 최소 한 번 더 대화 후 확정하세요.",
        "연락 빈도보다 약속 이행률을 관리 지표로 두면 신뢰를 안정적으로 키울 수 있습니다.",
      ]);
      const evidenceNotes = normalizeList(raw.evidenceNotes, evidenceFallbacks, [
        "올해 연애운은 접근 신호와 경계 신호가 동시에 나타나서 속도 조절이 핵심 변수로 작동합니다.",
        "분기 흐름에서 관계 안정 신호는 반복 확인 후 강화되는 패턴으로 관찰됩니다.",
      ]);
      const marriageDecisionBoard = normalizeList(raw.marriageDecisionBoard, [...relationshipGuide, ...cautionPatterns], [
        "결혼 논의가 2회 연속 합의로 끝나는 경우 일정을 확정하고, 확인 기준은 합의 이행률 70% 이상으로 두세요.",
        "핵심 갈등이 반복되고 복구 시도가 실패하는 경우 논의를 보류하고, 확인 기준은 2주 내 갈등 복구 시간 단축 여부로 두세요.",
      ]);
      const meetingChannelPriority = normalizeList(raw.meetingChannelPriority, [...approachSignals, ...relationshipGuide], [
        "지인 소개 채널에서 후속 약속 성사율이 높다면 주 1회 소개 요청을 유지하고, 확인 기준은 월 2회 이상 만남 성사로 두세요.",
        "커뮤니티 채널에서 대화 깊이가 유지된다면 주간 참여를 고정하고, 확인 기준은 2주 내 재대화 여부로 점검하세요.",
      ]);
      const greenFlagChecklist = normalizeList(raw.greenFlagChecklist, approachSignals, [
        "일정 변경 시 대안을 먼저 제시하고 실제로 이행하면 신뢰 확장 신호로 분류하세요.",
        "갈등 후 24시간 안에 대화 재개 의지가 확인되면 회복 탄력 신호로 분류하세요.",
      ]);
      const redFlagChecklist = normalizeList(raw.redFlagChecklist, cautionPatterns, [
        "합의한 사안을 반복 번복하면 결혼 논의 보류 신호로 분류하세요.",
        "미래 계획 질문을 장기간 회피하면 속도 조절 신호로 분류하세요.",
      ]);
      const conflictProtocol = normalizeList(raw.conflictProtocol, [...relationshipGuide, ...actionFallbacks], [
        "갈등 직후 감정 강도가 높다면 24시간은 사실 확인 중심으로 대응하고, 확인 기준은 쟁점 1개 문장화 여부로 두세요.",
        "24시간 이후에도 합의가 없으면 72시간 내 역할·기한을 재정의하고, 확인 기준은 동일 쟁점 재발 여부로 점검하세요.",
      ]);
      const consumerFaq = normalizeFaqItems(raw.consumerFaq, [
        ...marriageDecisionBoard,
        ...meetingChannelPriority,
        ...conflictProtocol,
        ...evidenceNotes,
      ]);

      return [
        {
          title: "관계 흐름",
          text: relationshipFlow,
        },
        {
          title: "가까워지는 신호",
          items: approachSignals,
        },
        {
          title: "주의 패턴",
          items: cautionPatterns,
        },
        {
          title: "관계 운영 가이드",
          items: relationshipGuide,
        },
        {
          title: "결혼 전환 판단 보드",
          items: marriageDecisionBoard,
        },
        {
          title: "만남 채널 우선순위",
          items: meetingChannelPriority,
        },
        {
          title: "그린 플래그 체크리스트",
          items: greenFlagChecklist,
        },
        {
          title: "레드 플래그 체크리스트",
          items: redFlagChecklist,
        },
        {
          title: "갈등 응급 프로토콜",
          items: conflictProtocol,
        },
        {
          title: "소비자 FAQ",
          faqItems: consumerFaq,
          fullWidth: true,
        },
        {
          title: "해석 근거",
          items: evidenceNotes,
          fullWidth: true,
        },
      ];
    }
    case "saju-2026-wealth-business":
      return [
        {
          title: "수익 흐름",
          text: normalizeParagraph(
            raw.cashflowPulse,
            [legacyCard?.conclusion, flowFallback],
            [
              "매출 확대보다 고정 수익 비중을 먼저 안정시키는 전략이 올해 변동성을 줄입니다.",
              "지출 통제는 빈도보다 큰 항목의 구조 조정이 성과에 더 직접적으로 연결됩니다.",
            ],
          ),
        },
        {
          title: "밀어야 할 축",
          items: normalizeList(raw.growthAxes, opportunityFallbacks, [
            "반복 구매가 가능한 핵심 상품 축을 먼저 강화해야 수익 예측 가능성이 높아집니다.",
            "신규 확장은 운영 여력이 확보된 뒤 순차적으로 열어야 손익 불안정을 피할 수 있습니다.",
          ]),
        },
        {
          title: "새는 지점",
          items: normalizeList(raw.leakRisks, cautionFallbacks, [
            "단기 매출을 이유로 할인과 판촉을 과다 집행하면 이익률이 빠르게 약해집니다.",
            "검증 없는 외주·광고 확장은 현금 흐름을 누수시키는 대표 패턴으로 반복됩니다.",
          ]),
        },
        {
          title: "운영 원칙",
          items: normalizeList(raw.operatingRules, actionFallbacks, [
            "지출 승인 기준을 금액 구간별로 분리해 즉시 결정 항목과 검토 항목을 구분하세요.",
            "월간 손익 점검에서 매출보다 이익률과 회수 주기를 우선 지표로 관리하세요.",
          ]),
        },
        {
          title: "해석 근거",
          items: normalizeList(raw.evidenceNotes, evidenceFallbacks, [
            "올해 재물·사업운은 확장 기회와 누수 위험이 동시 출현해 운영 규율이 핵심입니다.",
            "분기별 신호를 보면 수익 확대보다 비용 구조 안정화에서 체감 성과가 먼저 나타납니다.",
          ]),
          fullWidth: true,
        },
      ];
    case "saju-2026-investment-assets":
      return [
        {
          title: "진입 판단",
          text: normalizeParagraph(
            raw.entryBias,
            [legacyCard?.conclusion, flowFallback],
            [
              "올해 투자 판단은 수익 기대보다 손실 통제 기준을 먼저 세울 때 성과 편차가 줄어듭니다.",
              "진입 타이밍은 뉴스 반응보다 사전에 정한 가격·비중 규칙을 따를수록 안정적입니다.",
            ],
          ),
        },
        {
          title: "관망 신호",
          items: normalizeList(raw.watchSignals, opportunityFallbacks, [
            "거래량과 변동성이 동시에 확대될 때는 추격 매수보다 신호 확인 구간을 먼저 두세요.",
            "시장 방향이 불명확한 구간에서는 수익 기대치보다 현금 비중 유지가 우선입니다.",
          ]),
        },
        {
          title: "리스크 경보",
          items: normalizeList(raw.riskAlerts, cautionFallbacks, [
            "손절 기준 없이 평단만 낮추는 행동은 손실을 구조적으로 키우는 경보 신호입니다.",
            "레버리지 비중이 계획을 넘는 순간 변동성 확대 구간에서 계좌 복원력이 급격히 떨어집니다.",
          ]),
        },
        {
          title: "자금 운용 원칙",
          items: normalizeList(raw.capitalRules, actionFallbacks, [
            "단일 자산 비중 상한을 먼저 고정하고 예외 규칙 없이 동일하게 적용하세요.",
            "진입 전 회수 조건을 함께 기록해 목표가·손절가·보유 기간을 동시에 관리하세요.",
          ]),
        },
        {
          title: "해석 근거",
          items: normalizeList(raw.evidenceNotes, evidenceFallbacks, [
            "올해 투자운은 신호 강도가 빠르게 바뀌기 때문에 진입 규칙의 일관성이 핵심입니다.",
            "분기 흐름을 보면 공격적 진입보다 보수적 비중 관리에서 누적 성과가 유리합니다.",
          ]),
          fullWidth: true,
        },
      ];
    case "saju-2026-career-aptitude":
      return [
        {
          title: "맞는 역할",
          text: normalizeParagraph(
            raw.fitRoleSignal,
            [legacyCard?.conclusion, flowFallback],
            [
              "성과가 나는 역할은 문제 정의와 실행 우선순위를 동시에 다루는 포지션에 가깝습니다.",
              "단순 반복보다 의사결정과 조율 비중이 높은 업무에서 강점이 더 선명하게 드러납니다.",
            ],
          ),
        },
        {
          title: "성과 나는 방식",
          items: normalizeList(raw.strongWorkModes, opportunityFallbacks, [
            "업무 목표를 주 단위로 쪼개고 완료 기준을 먼저 합의하면 실행 속도가 크게 올라갑니다.",
            "피드백 주기가 짧은 환경에서 강점이 빠르게 누적되어 성과 재현성이 높아집니다.",
          ]),
        },
        {
          title: "엇나가는 선택",
          items: normalizeList(raw.misfitChoices, cautionFallbacks, [
            "역할 범위가 불명확한 제안을 감으로 수락하면 책임 과부하가 빠르게 커질 수 있습니다.",
            "성과 기준이 없는 프로젝트에 장기 투입되면 성장 대비 피로가 먼저 누적됩니다.",
          ]),
        },
        {
          title: "실행 체크리스트",
          items: normalizeList(raw.executionChecklist, actionFallbacks, [
            "이번 분기 핵심 역량 1개를 정하고 관련 결과물을 월 단위로 남기세요.",
            "의사결정 참여 범위를 명시해 역할 기대치와 평가 기준을 동시에 정렬하세요.",
          ]),
        },
        {
          title: "해석 근거",
          items: normalizeList(raw.evidenceNotes, evidenceFallbacks, [
            "올해 직업·적성운은 역할 적합성보다 실행 방식 정렬 여부에서 성과 차이가 커집니다.",
            "분기 데이터상 성과 상승 구간은 목표 명확성·피드백 속도·집중 범위가 동시에 맞을 때 나타납니다.",
          ]),
          fullWidth: true,
        },
      ];
    case "saju-2026-health-balance":
      return [
        {
          title: "컨디션 리듬",
          text: normalizeParagraph(
            raw.energyRhythm,
            [legacyCard?.conclusion, flowFallback],
            [
              "체력은 단기 고강도보다 일정한 회복 간격을 유지할 때 장기 안정성이 높아집니다.",
              "집중 시간과 휴식 시간을 같은 비중으로 관리해야 컨디션 저하 구간을 짧게 만들 수 있습니다.",
            ],
          ),
        },
        {
          title: "회복 우선순위",
          items: normalizeList(raw.recoveryPriorities, opportunityFallbacks, [
            "수면 시간 고정과 수분·식사 리듬 정렬을 먼저 맞춰야 에너지 회복 속도가 안정됩니다.",
            "회복일에는 운동 강도보다 스트레칭과 호흡 루틴을 우선해 누적 피로를 낮추세요.",
          ]),
        },
        {
          title: "과부하 신호",
          items: normalizeList(raw.overloadSignals, cautionFallbacks, [
            "집중력 급락과 수면 질 저하가 동시에 나타나면 일정 강도를 즉시 낮춰야 합니다.",
            "가벼운 통증을 무시한 채 고강도를 반복하면 회복 주기가 길어질 가능성이 큽니다.",
          ]),
        },
        {
          title: "생활 루틴",
          items: normalizeList(raw.routineChecklist, actionFallbacks, [
            "아침·점심·저녁 루틴에서 최소 한 가지 회복 습관을 고정해 컨디션 기준점을 만드세요.",
            "주간 일정에는 무조건 비워 둔 회복 블록을 넣어 과부하 누적을 사전에 차단하세요.",
          ]),
        },
        {
          title: "해석 근거",
          items: normalizeList(raw.evidenceNotes, evidenceFallbacks, [
            "올해 건강운은 고점 유지보다 저점 관리에서 체감 차이가 크게 나타나는 흐름입니다.",
            "분기별 신호를 보면 과부하 대응 속도가 다음 구간의 컨디션 회복 폭을 결정합니다.",
          ]),
          fullWidth: true,
        },
      ];
    default:
      return [];
  }
};

const isRecordLike = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const resolveNewYearWealthQuarterIndex = (value: unknown, fallbackIndex: number) => {
  const fallback = fallbackIndex < 0 ? 0 : fallbackIndex > 3 ? 3 : fallbackIndex;
  if (typeof value !== "string") {
    return fallback;
  }
  const normalized = value.trim().replace(/\s+/g, "");
  if (normalized.includes("1분기")) return 0;
  if (normalized.includes("2분기")) return 1;
  if (normalized.includes("3분기")) return 2;
  if (normalized.includes("4분기")) return 3;
  return fallback;
};

const buildNewYearWealthActionableView = (
  payload: SajuReportPayload | undefined,
  sections: SectionAnalysis[],
  summary: string,
): NewYearWealthActionableView | null => {
  if (!payload) {
    return null;
  }

  const raw = payload as Partial<NewYear2026WealthBusinessPayload> & Record<string, unknown>;
  const analysisBlocks = payload.analysisBlocks ?? [];
  const timeline = Array.isArray(raw.yearTimeline)
    ? (raw.yearTimeline.filter((item) => isRecordLike(item)) as Array<Record<string, unknown>>)
    : [];
  const actionPlan: Record<string, unknown> = isRecordLike(raw.actionPlan90) ? raw.actionPlan90 : {};
  const quickSummary: Record<string, unknown> = isRecordLike(raw.quickSummary) ? raw.quickSummary : {};
  const signalTrio: Record<string, unknown> = isRecordLike(quickSummary["signalTrio"])
    ? (quickSummary["signalTrio"] as Record<string, unknown>)
    : {};

  const quickVerdict = typeof quickSummary["verdict"] === "string" ? (quickSummary["verdict"] as string) : "";
  const quickReason = typeof signalTrio["reason"] === "string" ? (signalTrio["reason"] as string) : "";
  const flowFallback = sections[0]?.interpretation ?? analysisBlocks[0]?.coreFlow ?? summary;
  const coreInsights = payload.coreInsights ?? [];
  const actionNow = payload.actionNow ?? [];
  const evidence = payload.evidence ?? [];

  const opportunityFallbacks = [
    ...timeline.map((node) => (typeof node.opportunity === "string" ? node.opportunity : "")),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
    ...coreInsights,
  ];
  const cautionFallbacks = [
    ...timeline.map((node) => (typeof node.caution === "string" ? node.caution : "")),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
    ...evidence,
  ];
  const actionFallbacks = [
    ...timeline.map((node) => (typeof node.action === "string" ? node.action : "")),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
    ...actionNow,
  ];

  const cashflowPulse = normalizeParagraph(
    raw.cashflowPulse,
    [flowFallback, quickVerdict, quickReason],
    [
      "매출 숫자보다 반복 가능한 수익 구조를 먼저 고정하면 연간 변동폭을 줄일 수 있습니다.",
      "지출 통제는 항목별 승인 기준을 고정할 때 실제 이익률 개선으로 연결됩니다.",
    ],
  );
  const growthAxes = normalizeList(raw.growthAxes, opportunityFallbacks, [
    "반복 구매가 가능한 핵심 축을 먼저 키우고 확장 채널은 순차적으로 열어야 합니다.",
    "고정 수익 비중을 높이는 상품·고객 조합을 먼저 확정해 예측 가능성을 높이세요.",
  ]);
  const leakRisks = normalizeList(raw.leakRisks, cautionFallbacks, [
    "검증되지 않은 판촉·외주 집행은 현금흐름 누수로 이어질 수 있습니다.",
    "단기 매출을 이유로 할인 폭을 키우면 이익률 회복이 늦어질 수 있습니다.",
  ]);
  const operatingRules = normalizeList(raw.operatingRules, actionFallbacks, [
    "지출 승인 기준을 금액 구간별로 분리해 즉시 결정 항목과 검토 항목을 구분하세요.",
    "월간 손익 점검은 매출보다 이익률과 회수 주기를 우선 지표로 관리하세요.",
  ]);
  const evidenceNotes = normalizeList(raw.evidenceNotes, evidence, [
    "올해 재물·사업 흐름은 확장 기회와 누수 리스크가 동시에 나타나는 구조입니다.",
    "분기 신호를 보면 비용 구조 안정화가 수익 확대보다 먼저 체감될 수 있습니다.",
  ]);

  const pickOneSentence = (
    value: unknown,
    fallbacks: Array<string | undefined | null>,
    defaultSentence: string,
  ) =>
    ensureSentenceRange(
      splitIntoSentences(typeof value === "string" ? value : ""),
      [...fallbacks, defaultSentence],
      1,
      1,
    )[0] ?? ensureSentenceEnding(defaultSentence);

  const oneLineDiagnosis = pickOneSentence(
    raw.oneLineDiagnosis,
    [quickVerdict, flowFallback, cashflowPulse],
    "수익 확장보다 운영 기준을 먼저 고정할수록 2026년 재물·사업 변동성을 줄일 수 있습니다.",
  );

  const keyPoints = ensureSentenceRange(
    toStringList(raw.keyPoints).flatMap((item) => splitIntoSentences(item)),
    [...growthAxes, ...leakRisks, ...operatingRules, ...coreInsights],
    3,
    3,
  );

  const easyInterpretationPoints = ensureSentenceRange(
    toStringList(raw.easyInterpretationPoints).flatMap((item) => splitIntoSentences(item)),
    [cashflowPulse, ...evidenceNotes, ...evidence],
    2,
    4,
  );

  const annualFlowSummary = normalizeParagraph(
    raw.annualFlowSummary,
    [cashflowPulse, quickReason, summary],
    [
      "상반기에는 수익 축을 고정하고 하반기에는 누수 구간을 줄이는 운영이 성과로 이어집니다.",
      "확장 속도보다 분기별 점검 규칙을 지킬 때 사업 안정성이 높아집니다.",
    ],
  );

  const rawQuarterlyFlowCards = Array.isArray(raw.quarterlyFlowCards)
    ? (raw.quarterlyFlowCards.filter((item) => isRecordLike(item)) as Array<Record<string, unknown>>)
    : [];

  const quarterlyFlowCards = NEW_YEAR_WEALTH_QUARTER_ORDER.map((quarter, index) => {
    const source =
      rawQuarterlyFlowCards.find(
        (item, itemIndex) => resolveNewYearWealthQuarterIndex(item["quarter"], itemIndex) === index,
      ) ?? rawQuarterlyFlowCards[index];
    const timelineNode = timeline[index];
    const block = analysisBlocks[index];

    return {
      quarter,
      flowSummary: normalizeParagraph(
        source?.flowSummary,
        [
          typeof timelineNode?.quarterSummary === "string" ? timelineNode.quarterSummary : "",
          block?.coreFlow,
          annualFlowSummary,
        ],
        [
          `${quarter}에는 확대 판단보다 손익 구조 점검을 먼저 진행해야 운영 안정성이 유지됩니다.`,
          `${quarter}에는 기회·리스크·행동 전략을 같은 기준표로 관리하는 방식이 유효합니다.`,
        ],
      ),
      keyPoint: pickOneSentence(
        source?.keyPoint,
        [growthAxes[index], typeof timelineNode?.opportunity === "string" ? timelineNode.opportunity : "", block?.opportunities?.[0], keyPoints[index]],
        `${quarter} 핵심 포인트는 반복 가능한 수익 축을 먼저 고정하는 것입니다.`,
      ),
      risk: pickOneSentence(
        source?.risk,
        [leakRisks[index], typeof timelineNode?.caution === "string" ? timelineNode.caution : "", block?.risks?.[0]],
        `${quarter} 주요 리스크는 검증 없는 확장 집행으로 인한 현금흐름 누수입니다.`,
      ),
      actionStrategy: pickOneSentence(
        source?.actionStrategy,
        [operatingRules[index], typeof timelineNode?.action === "string" ? timelineNode.action : "", block?.actionStrategy?.[0], actionNow[index]],
        `${quarter} 행동 전략은 지출 승인 기준과 회수 점검 일정을 먼저 고정하는 것입니다.`,
      ),
    } satisfies NewYearWealthActionableQuarterCard;
  });

  const actionPlanList = [
    ...toStringList(actionPlan["day30"]),
    ...toStringList(actionPlan["day60"]),
    ...toStringList(actionPlan["day90"]),
  ];

  const revenueFlowDeepDive = ensureSentenceRange(
    toStringList(raw.revenueFlowDeepDive).flatMap((item) => splitIntoSentences(item)),
    [cashflowPulse, ...evidenceNotes, ...keyPoints],
    2,
    4,
  );

  const businessManagementPoints = ensureSentenceRange(
    toStringList(raw.businessManagementPoints).flatMap((item) => splitIntoSentences(item)),
    [...operatingRules, ...growthAxes, ...actionNow],
    2,
    4,
  );

  const burnoutPreventionStrategies = ensureSentenceRange(
    toStringList(raw.burnoutPreventionStrategies).flatMap((item) => splitIntoSentences(item)),
    [...leakRisks, ...actionPlanList, ...evidenceNotes],
    2,
    4,
  );

  const actionChecklist = ensureSentenceRange(
    toStringList(raw.actionChecklist).flatMap((item) => splitIntoSentences(item)),
    [...operatingRules, ...actionNow, ...actionPlanList, ...quarterlyFlowCards.map((item) => item.actionStrategy)],
    3,
    8,
  );

  const closingLine = pickOneSentence(
    raw.closingLine,
    [oneLineDiagnosis, annualFlowSummary, ...keyPoints],
    "확장 속도보다 운영 기준을 먼저 고정하면 2026년 재물·사업 성과를 안정적으로 누적할 수 있습니다.",
  );

  return {
    oneLineDiagnosis,
    keyPoints,
    easyInterpretationPoints,
    annualFlowSummary,
    quarterlyFlowCards,
    revenueFlowDeepDive,
    businessManagementPoints,
    burnoutPreventionStrategies,
    actionChecklist,
    closingLine,
  };
};

const buildNewYearHealthActionableView = (
  payload: SajuReportPayload | undefined,
  sections: SectionAnalysis[],
  summary: string,
  birthPrecision?: BirthPrecision,
): NewYearHealthActionableView | null => {
  if (!payload) {
    return null;
  }

  const raw = payload as Partial<NewYear2026HealthPayload> & Record<string, unknown>;
  const analysisBlocks = payload.analysisBlocks ?? [];
  const timeline = payload.yearTimeline ?? [];
  const quickSummary: Record<string, unknown> = isRecordLike(raw.quickSummary) ? raw.quickSummary : {};
  const actionPlan: Record<string, unknown> = isRecordLike(raw.actionPlan90) ? raw.actionPlan90 : {};
  const quickVerdict = typeof quickSummary["verdict"] === "string" ? (quickSummary["verdict"] as string) : "";
  const sectionFallback = sections[0]?.interpretation ?? analysisBlocks[0]?.coreFlow ?? summary;
  const actionNow = payload.actionNow ?? [];
  const coreInsights = payload.coreInsights ?? [];
  const evidence = payload.evidence ?? [];

  const opportunityFallbacks = [
    ...timeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
    ...coreInsights,
  ];
  const cautionFallbacks = [
    ...timeline.map((node) => node.caution),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
    ...toStringList(raw.overloadSignals),
    ...evidence,
  ];
  const actionFallbacks = [
    ...timeline.map((node) => node.action),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
    ...actionNow,
  ];

  const pickOneSentence = (
    value: unknown,
    fallbacks: Array<string | undefined | null>,
    defaultSentence: string,
  ) =>
    ensureSentenceRange(
      splitIntoSentences(typeof value === "string" ? value : ""),
      [...fallbacks, defaultSentence],
      1,
      1,
    )[0] ?? ensureSentenceEnding(defaultSentence);

  const energyRhythm = normalizeParagraph(
    raw.energyRhythm,
    [sectionFallback, quickVerdict],
    [
      "올해 건강 흐름은 고강도 유지보다 회복 간격을 안정적으로 유지할 때 체감 차이가 커지는 패턴입니다.",
      "집중과 휴식 비중을 함께 관리하면 피로 누적 구간을 줄이는 데 도움이 됩니다.",
    ],
  );

  const oneLineDiagnosis = pickOneSentence(
    raw["oneLineDiagnosis"],
    [quickVerdict, energyRhythm, sectionFallback],
    "올해는 몸이 보내는 과부하 신호를 빨리 감지하고 회복 루틴을 먼저 고정할수록 컨디션이 안정될 수 있습니다.",
  );

  const keyPoints = Array.from(
    new Set([
      ...toStringList(quickSummary["keywords"]).map((item) => item.replace(/[.?!]+$/g, "").trim()),
      "수면 안정",
      "과부하 감속",
      "회복 루틴",
    ]),
  )
    .filter(Boolean)
    .slice(0, 3);

  const bodyPatterns = ensureSentenceRange(
    toStringList(raw.bodyPatterns).flatMap((item) => splitIntoSentences(item)),
    [
      ...cautionFallbacks,
      ...toStringList(raw.overloadSignals),
      "수면 시작이 늦어지거나 중간 각성이 잦아지는 구간이 반복될 수 있습니다.",
      "식사 리듬이 흔들릴 때 소화 부담과 오후 피로 누적이 함께 나타날 수 있습니다.",
      "일정 과밀 주간에는 예민함 증가와 회복 지연이 동시에 나타날 가능성이 있습니다.",
    ],
    3,
    5,
  );

  const recoveryPriorities = ensureSentenceRange(
    toStringList(raw.recoveryPriorities).flatMap((item) => splitIntoSentences(item)),
    [
      ...actionFallbacks,
      ...opportunityFallbacks,
      "수면 안정: 취침·기상 시간을 일정하게 맞춰 수면 리듬 흔들림을 줄이세요.",
      "소화기 관리: 식사 간격과 속도를 일정하게 유지해 위장 부담을 낮추세요.",
      "과열 진정: 긴장도가 높은 날에는 카페인 추가보다 수분·호흡 루틴을 먼저 적용하세요.",
      "체력 분배: 하루 집중 블록 수를 제한해 회복 없이 밀어붙이는 패턴을 줄이세요.",
    ],
    4,
    4,
  );

  const overloadSignals = ensureSentenceRange(
    toStringList(raw.overloadSignals).flatMap((item) => splitIntoSentences(item)),
    [
      ...cautionFallbacks,
      ...bodyPatterns,
      "잠들기 어려움과 자주 깨는 수면이 동시에 이어지면 일정 강도 조절이 필요할 수 있습니다.",
      "두근거림·예민함·안구 피로가 한 주에 겹치면 과부하 신호로 보고 회복 구간을 늘리세요.",
      "쉬어도 피로가 잘 풀리지 않으면 당일 성과보다 다음 날 회복 여력을 우선하세요.",
    ],
    3,
    4,
  );

  const rawQuarterlyFlowCards = Array.isArray(raw.quarterlyFlowCards)
    ? (raw.quarterlyFlowCards.filter((item) => isRecordLike(item)) as Array<Record<string, unknown>>)
    : [];

  const quarterlyFlowCards = NEW_YEAR_HEALTH_QUARTER_ORDER.map((quarter, index) => {
    const source =
      rawQuarterlyFlowCards.find(
        (item, itemIndex) => resolveNewYearWealthQuarterIndex(item["quarter"], itemIndex) === index,
      ) ?? rawQuarterlyFlowCards[index];
    const timelineNode = timeline[index];
    const block = analysisBlocks[index];

    return {
      quarter,
      flowSummary: normalizeParagraph(
        source?.flowSummary,
        [timelineNode?.quarterSummary, block?.coreFlow, energyRhythm],
        [
          `${quarter}에는 몸 상태가 빠르게 좋아졌다가 쉽게 지칠 수 있어 강도 조절이 중요합니다.`,
          `${quarter}에는 무리한 확장보다 회복 리듬 유지가 컨디션 안정에 더 직접적으로 연결될 수 있습니다.`,
        ],
      ),
      cautionPoint: pickOneSentence(
        source?.cautionPoint,
        [
          overloadSignals[index],
          timelineNode?.caution,
          block?.risks?.[0],
          bodyPatterns[index],
        ],
        `${quarter} 주의 포인트는 수면 지연·예민함·피로 누적 신호를 놓치지 않고 속도를 낮추는 것입니다.`,
      ),
      recommendedAction: pickOneSentence(
        source?.recommendedAction,
        [
          recoveryPriorities[index],
          timelineNode?.action,
          block?.actionStrategy?.[0],
          actionNow[index],
        ],
        `${quarter} 추천 행동은 수면·식사·회복 블록을 먼저 캘린더에 고정하고 그 안에서 일정 강도를 배분하는 것입니다.`,
      ),
    } satisfies NewYearHealthActionableQuarterCard;
  });

  const overloadChecklist = ensureSentenceRange(
    toStringList(raw.overloadChecklist).flatMap((item) => splitIntoSentences(item)),
    [
      ...overloadSignals,
      ...cautionFallbacks,
      "잠들기 어려운 날이 일주일에 여러 번 반복되면 일정 강도 조절이 필요할 수 있습니다.",
      "자주 깨는 수면이 이어지면 다음 날 중요한 일정의 밀도를 줄이는 편이 안전합니다.",
      "두근거림이나 예민함이 반복되면 카페인·야간 자극 노출을 줄여 리듬을 진정시키세요.",
      "입병 또는 피부 트러블이 반복되면 과열 신호로 보고 수면·수분 루틴을 먼저 정리하세요.",
      "안구 피로가 하루 종일 이어지면 화면 집중 시간을 끊어 주는 휴식 간격을 고정하세요.",
      "속 더부룩함이 자주 생기면 식사 간격과 섭취 속도를 점검해 소화 부담을 낮추세요.",
      "쉬어도 피로가 잘 풀리지 않으면 무리한 만회보다 회복 우선 일정을 먼저 확보하세요.",
    ],
    6,
    8,
  );

  const routineChecklist = ensureSentenceRange(
    toStringList(raw.routineChecklist).flatMap((item) => splitIntoSentences(item)),
    [
      ...actionFallbacks,
      ...recoveryPriorities,
      "아침·낮·저녁 중 최소 한 구간은 고정 루틴으로 유지해 컨디션 기준점을 만드세요.",
      "회복 블록을 일이 끝난 뒤가 아니라 일정표 선행 항목으로 먼저 배치하세요.",
      "주간 점검에서 수면·피로·소화 신호를 같은 체크표로 기록해 변화 흐름을 확인하세요.",
    ],
    3,
    5,
  );

  const routineGuideRaw: Record<string, unknown> = isRecordLike(raw.routineGuide) ? raw.routineGuide : {};
  const routineGuide = {
    morning: ensureSentenceRange(
      toStringList(routineGuideRaw.morning).flatMap((item) => splitIntoSentences(item)),
      [
        ...routineChecklist,
        ...actionFallbacks,
        ...toStringList(actionPlan["day30"]),
        "기상 후 30분 안에 물 한 컵과 가벼운 스트레칭으로 몸의 긴장을 낮추세요.",
        "아침 식사를 거르기 쉬운 날일수록 간단한 단백질·탄수화물 조합으로 공복 시간을 줄이세요.",
      ],
      2,
      4,
    ),
    daytime: ensureSentenceRange(
      toStringList(routineGuideRaw.daytime).flatMap((item) => splitIntoSentences(item)),
      [
        ...routineChecklist,
        ...actionFallbacks,
        ...toStringList(actionPlan["day60"]),
        "점심 이후 5~10분 눈 휴식과 가벼운 걷기를 넣어 오후 피로 누적을 줄이세요.",
        "카페인 추가 섭취 전 수분 보충과 호흡 정리부터 실행해 예민함 신호를 완화하세요.",
      ],
      2,
      4,
    ),
    evening: ensureSentenceRange(
      toStringList(routineGuideRaw.evening).flatMap((item) => splitIntoSentences(item)),
      [
        ...routineChecklist,
        ...actionFallbacks,
        ...toStringList(actionPlan["day90"]),
        "취침 90분 전에는 강한 업무·학습 자극을 줄이고 조명을 낮춰 수면 진입 지연을 줄이세요.",
        "저녁 식사는 과식보다 소화 부담이 적은 구성으로 조정해 밤사이 회복 흐름을 지키세요.",
      ],
      2,
      4,
    ),
    weekly: ensureSentenceRange(
      toStringList(routineGuideRaw.weekly).flatMap((item) => splitIntoSentences(item)),
      [
        ...routineChecklist,
        ...recoveryPriorities,
        ...actionNow,
        "주 1회 일정표에서 회복 전용 시간을 먼저 고정하고 나머지 업무를 재배치하세요.",
        "주말 점검에서 과부하 신호 체크리스트를 확인하고 다음 주 강도를 선제 조정하세요.",
      ],
      2,
      4,
    ),
  };

  const confidence = resolveHealthConfidence(birthPrecision);
  const closingNotices = ensureSentenceRange(
    toStringList(raw["closingNotices"]).flatMap((item) => splitIntoSentences(item)),
    [
      "본 해석은 사주 흐름 기반의 생활관리 참고용이며 의료적 진단을 대체하지 않습니다.",
      "불편 신호가 반복되거나 일상 기능에 영향을 주면 검진 또는 전문 상담을 권장합니다.",
      "단정적 판단보다 주간 변화를 기록하면서 본인 리듬에 맞게 조정해 활용하세요.",
    ],
    3,
    3,
  );

  return {
    oneLineDiagnosis,
    keyPoints,
    confidenceLabel: confidence.confidenceLabel,
    confidenceDescription: confidence.confidenceDescription,
    birthTimeReferenceNote: confidence.birthTimeReferenceNote,
    bodyPatterns,
    quarterlyFlowCards,
    overloadChecklist,
    recoveryPriorities,
    routineGuide,
    closingNotices,
  };
};

const buildNewYearInvestmentActionableView = (
  payload: SajuReportPayload | undefined,
  sections: SectionAnalysis[],
  summary: string,
): NewYearInvestmentActionableView | null => {
  if (!isInvestmentPayload(payload)) {
    return null;
  }

  const raw = payload as Partial<NewYear2026InvestmentPayload> & Record<string, unknown>;
  const rawReport: Record<string, unknown> = isRecordLike(raw.investmentActionReport)
    ? (raw.investmentActionReport as Record<string, unknown>)
    : {};
  const rawDiagnosis: Record<string, unknown> = isRecordLike(rawReport.coreDiagnosis)
    ? (rawReport.coreDiagnosis as Record<string, unknown>)
    : {};
  const rawAssetClassGuides: Record<string, unknown> = isRecordLike(rawReport.assetClassGuides)
    ? (rawReport.assetClassGuides as Record<string, unknown>)
    : {};
  const rawSignalBoard: Record<string, unknown> = isRecordLike(rawReport.signalBoard)
    ? (rawReport.signalBoard as Record<string, unknown>)
    : {};
  const rawQuarterlyFlow = Array.isArray(rawReport.quarterlyFlow)
    ? (rawReport.quarterlyFlow.filter((item) => isRecordLike(item)) as Array<Record<string, unknown>>)
    : [];
  const analysisBlocks = payload.analysisBlocks ?? [];
  const timeline = payload.yearTimeline ?? [];
  const quickSummary: Record<string, unknown> = isRecordLike(raw.quickSummary) ? raw.quickSummary : {};
  const signalTrio: Record<string, unknown> = isRecordLike(quickSummary["signalTrio"])
    ? (quickSummary["signalTrio"] as Record<string, unknown>)
    : {};
  const actionPlan: Record<string, unknown> = isRecordLike(raw.actionPlan90) ? raw.actionPlan90 : {};
  const quickVerdict = typeof quickSummary["verdict"] === "string" ? (quickSummary["verdict"] as string) : "";
  const quickReason = typeof signalTrio["reason"] === "string" ? (signalTrio["reason"] as string) : "";
  const sectionFallback = sections[0]?.interpretation ?? analysisBlocks[0]?.coreFlow ?? summary;
  const coreInsights = payload.coreInsights ?? [];
  const actionNow = payload.actionNow ?? [];
  const evidence = payload.evidence ?? [];

  const opportunityFallbacks = [
    ...timeline.map((node) => node.opportunity),
    ...analysisBlocks.flatMap((block) => block.opportunities ?? []),
    ...coreInsights,
    ...(payload.watchSignals ?? []),
  ];
  const cautionFallbacks = [
    ...timeline.map((node) => node.caution),
    ...analysisBlocks.flatMap((block) => block.risks ?? []),
    ...(payload.riskAlerts ?? []),
    ...evidence,
  ];
  const actionFallbacks = [
    ...timeline.map((node) => node.action),
    ...analysisBlocks.flatMap((block) => block.actionStrategy ?? []),
    ...(payload.capitalRules ?? []),
    ...actionNow,
  ];
  const evidenceFallbacks = [
    ...(payload.evidenceNotes ?? []),
    ...evidence,
    ...analysisBlocks.map((block) => block.evidence),
    quickReason,
  ];
  const actionPlanList = [
    ...toStringList(actionPlan["day30"]),
    ...toStringList(actionPlan["day60"]),
    ...toStringList(actionPlan["day90"]),
  ];

  const pickOneSentence = (
    value: unknown,
    fallbacks: Array<string | undefined | null>,
    defaultSentence: string,
  ) =>
    ensureSentenceRange(
      splitIntoSentences(typeof value === "string" ? value : ""),
      [...fallbacks, defaultSentence],
      1,
      1,
    )[0] ?? ensureSentenceEnding(defaultSentence);

  const coreDiagnosis = {
    headline: pickOneSentence(
      rawDiagnosis.headline,
      [raw.entryBias as string, quickVerdict, sectionFallback],
      "진입 속도보다 손실 통제 기준을 먼저 고정하는 운영이 올해 투자 안정성을 높입니다.",
    ),
    summary: normalizeParagraph(
      rawDiagnosis.summary,
      [raw.entryBias as string, sectionFallback, quickReason],
      [
        "올해는 수익 기대를 앞세우기보다 손실 구간을 먼저 통제할 때 성과 변동폭을 줄일 수 있습니다.",
        "분기별 신호가 빨리 바뀌더라도 진입·관망·회수 기준을 유지하면 오판 비용을 줄일 수 있습니다.",
      ],
    ),
  };

  const keyQuestion = pickOneSentence(
    rawReport.keyQuestion,
    [raw.coreQuestion as string, payload.coreQuestion, quickVerdict],
    "지금은 진입을 늘릴 시기인지, 관망하며 기준을 재정렬할 시기인지 어떻게 판단해야 하는가?",
  );

  const keyInsights = ensureSentenceRange(
    toStringList(rawReport.keyInsights).flatMap((item) => splitIntoSentences(item)),
    [...coreInsights, ...toStringList(raw.watchSignals), ...evidenceFallbacks],
    3,
    3,
  );

  const immediateActions = ensureSentenceRange(
    toStringList(rawReport.immediateActions).flatMap((item) => splitIntoSentences(item)),
    [...toStringList(raw.capitalRules), ...actionFallbacks, ...actionNow],
    2,
    4,
  );

  const absoluteCautions = ensureSentenceRange(
    toStringList(rawReport.absoluteCautions).flatMap((item) => splitIntoSentences(item)),
    [...toStringList(raw.riskAlerts), ...cautionFallbacks, ...evidenceFallbacks],
    2,
    4,
  );

  const quarterlyFlow = NEW_YEAR_INVESTMENT_QUARTER_ORDER.map((quarter, index) => {
    const source =
      rawQuarterlyFlow.find(
        (item, itemIndex) => resolveNewYearWealthQuarterIndex(item["quarter"], itemIndex) === index,
      ) ?? rawQuarterlyFlow[index];
    const timelineNode = timeline[index];
    const block = analysisBlocks[index];

    return {
      quarter,
      summary: normalizeParagraph(
        source?.summary,
        [timelineNode?.quarterSummary, block?.coreFlow, raw.entryBias as string, quickReason],
        [
          `${quarter}에는 시장 반응보다 기준 준수율을 먼저 점검해야 손실 확률을 낮출 수 있습니다.`,
          `${quarter}에는 신호 강도보다 비중·회수 규칙 일관성이 누적 성과를 좌우합니다.`,
        ],
      ),
      actionFocus: ensureSentenceRange(
        toStringList(source?.actionFocus).flatMap((item) => splitIntoSentences(item)),
        [timelineNode?.action, ...(block?.actionStrategy ?? []), ...immediateActions, ...toStringList(raw.capitalRules)],
        2,
        3,
      ),
      riskFocus: ensureSentenceRange(
        toStringList(source?.riskFocus).flatMap((item) => splitIntoSentences(item)),
        [timelineNode?.caution, ...(block?.risks ?? []), ...absoluteCautions, ...toStringList(raw.riskAlerts)],
        2,
        3,
      ),
    };
  });

  const assetClassGuides = {
    stocksEtf: ensureSentenceRange(
      toStringList(rawAssetClassGuides.stocksEtf).flatMap((item) => splitIntoSentences(item)),
      [...toStringList(raw.capitalRules), ...opportunityFallbacks, ...actionNow],
      2,
      4,
    ),
    realEstate: ensureSentenceRange(
      toStringList(rawAssetClassGuides.realEstate).flatMap((item) => splitIntoSentences(item)),
      [...toStringList(raw.capitalRules), ...cautionFallbacks, ...evidenceFallbacks],
      2,
      4,
    ),
    cashSavings: ensureSentenceRange(
      toStringList(rawAssetClassGuides.cashSavings).flatMap((item) => splitIntoSentences(item)),
      [...toStringList(raw.watchSignals), ...cautionFallbacks, ...actionNow],
      2,
      4,
    ),
    cryptoHighVolatility: ensureSentenceRange(
      toStringList(rawAssetClassGuides.cryptoHighVolatility).flatMap((item) => splitIntoSentences(item)),
      [...toStringList(raw.riskAlerts), ...cautionFallbacks, ...evidenceFallbacks],
      2,
      4,
    ),
  };

  const signalBoard = {
    watchSignals: ensureSentenceRange(
      toStringList(rawSignalBoard.watchSignals).flatMap((item) => splitIntoSentences(item)),
      [...toStringList(raw.watchSignals), ...cautionFallbacks, ...evidenceFallbacks],
      2,
      4,
    ),
    entrySignals: ensureSentenceRange(
      toStringList(rawSignalBoard.entrySignals).flatMap((item) => splitIntoSentences(item)),
      [...opportunityFallbacks, ...actionFallbacks, ...actionNow],
      2,
      4,
    ),
  };

  const riskAlerts = ensureSentenceRange(
    toStringList(rawReport.riskAlerts).flatMap((item) => splitIntoSentences(item)),
    [...toStringList(raw.riskAlerts), ...cautionFallbacks, ...evidenceFallbacks],
    2,
    4,
  );

  const practicalChecklist = ensureSentenceRange(
    toStringList(rawReport.practicalChecklist).flatMap((item) => splitIntoSentences(item)),
    [...toStringList(raw.capitalRules), ...actionNow, ...actionPlanList, ...immediateActions],
    4,
    6,
  );

  const plainEvidence = ensureSentenceRange(
    toStringList(rawReport.plainEvidence).flatMap((item) => splitIntoSentences(item)),
    [...toStringList(raw.evidenceNotes), ...evidenceFallbacks, quickReason],
    2,
    4,
  );

  const flowTo2027 = normalizeParagraph(
    rawReport.flowTo2027,
    [timeline[3]?.quarterSummary, quickReason, ...plainEvidence],
    [
      "2026년에 고정한 비중·회수·손실 기준이 2027년의 확장 여력과 리스크 대응 속도를 결정할 가능성이 큽니다.",
      "연말까지 기준 위반 빈도를 줄이면 다음 해에는 기회 대응 범위를 더 안정적으로 넓힐 수 있습니다.",
    ],
  );

  const finalConclusion = ensureSentenceRange(
    toStringList(rawReport.finalConclusion).flatMap((item) => splitIntoSentences(item)),
    [...keyInsights, ...immediateActions, ...practicalChecklist],
    2,
    3,
  );

  return {
    coreDiagnosis,
    keyQuestion,
    keyInsights,
    immediateActions,
    absoluteCautions,
    quarterlyFlow,
    assetClassGuides,
    signalBoard,
    riskAlerts,
    practicalChecklist,
    plainEvidence,
    flowTo2027,
    finalConclusion,
  };
};

const resolvePayload = (result: SajuResult, serviceId: string): SajuReportPayload | undefined => {
  const fromPayloadMap = result.reportPayloads?.[serviceId as SajuServiceType];
  if (fromPayloadMap) {
    return fromPayloadMap;
  }

  if (!result.reportPayloads && result.reportPayload) {
    return result.reportPayload;
  }

  return undefined;
};

export const SajuCollectionTabs: React.FC<SajuCollectionTabsProps> = ({
  result,
  serviceIds,
  onUnlockRequest,
  isLocked = false,
  className,
}) => {
  const [activeServiceId, setActiveServiceId] = useState(serviceIds[0] ?? "");

  useEffect(() => {
    if (serviceIds.length === 0) {
      setActiveServiceId("");
      return;
    }

    if (!serviceIds.includes(activeServiceId)) {
      setActiveServiceId(serviceIds[0]);
    }
  }, [activeServiceId, serviceIds]);

  const hasTabs = serviceIds.length > 1;
  const currentServiceId = hasTabs ? activeServiceId : serviceIds[0];

  const payload = useMemo(
    () => (currentServiceId ? resolvePayload(result, currentServiceId) : undefined),
    [currentServiceId, result],
  );

  const summary =
    (currentServiceId && result.summaries?.[currentServiceId as SajuServiceType]) || result.summary;
  const sections =
    (currentServiceId && result.sectionsMap?.[currentServiceId as SajuServiceType]) || result.sections;
  const focusedNewYearCards = buildFocusedNewYearCards(currentServiceId, payload, sections);
  const focusedSectionTitle =
    NEW_YEAR_FOCUSED_SECTION_TITLES[currentServiceId as SajuServiceType] ?? null;
  const wealthBusinessActionableView =
    currentServiceId === "saju-2026-wealth-business"
      ? buildNewYearWealthActionableView(payload, sections, summary)
      : null;
  const isStudyActionService = currentServiceId === "saju-2026-study-exam";
  const isHealthActionService = currentServiceId === "saju-2026-health-balance";
  const isInvestmentActionService = currentServiceId === "saju-2026-investment-assets";
  const studyActionReport = useMemo(
    () => (isStudyActionService ? buildStudyActionReportView(payload, sections) : null),
    [isStudyActionService, payload, sections],
  );
  const investmentActionableView = useMemo(
    () =>
      isInvestmentActionService
        ? buildNewYearInvestmentActionableView(payload, sections, summary)
        : null,
    [isInvestmentActionService, payload, sections, summary],
  );
  const healthActionableView = useMemo(
    () =>
      isHealthActionService
        ? buildNewYearHealthActionableView(payload, sections, summary, result.profileData?.birthPrecision)
        : null,
    [isHealthActionService, payload, result.profileData?.birthPrecision, sections, summary],
  );

  if (!currentServiceId) {
    return null;
  }

  const actionNow = payload?.actionNow ?? [];
  const coreInsights = payload?.coreInsights ?? [];
  const evidence = payload?.evidence ?? [];
  const analysisBlocks = payload?.analysisBlocks ?? [];
  const daeunPayload = isDaeunShiftPayload(payload) ? payload : null;
  const isDaeunShiftService = currentServiceId === "saju-daeun-shift" && Boolean(daeunPayload);
  const careerPayload = isCareerTimingPayload(payload) ? payload : null;
  const isCareerTimingService = currentServiceId === "saju-career-timing" && Boolean(careerPayload);
  const careerStageFlow = careerPayload ? buildCareerStageFlow(careerPayload) : [];
  const careerArcSummary = careerPayload
    ? normalizeParagraph(
        careerPayload.careerArcSummary ?? careerPayload.careerWindow,
        [careerPayload.careerWindow, ...careerPayload.decisionTree, ...careerPayload.executionChecklist],
        [
          "현재 단계의 커리어 판단 기준을 고정해 다음 전환 구간까지 일관된 의사결정 축을 유지하세요.",
          "단년도 이벤트보다 0~2년/3~5년/6~10년/10년+ 단계 흐름으로 판단하면 장기 오차를 줄일 수 있습니다.",
        ],
      )
    : "";
  const careerTransitionSignals = careerPayload
    ? ensureSentenceRange(
        [
          ...careerStageFlow.flatMap((stage) => splitIntoSentences(stage.transitionSignal)),
          ...splitIntoSentences(careerPayload.transitionSignal ?? ""),
        ],
        [...careerPayload.decisionCriteria, ...careerPayload.evidence],
        3,
        5,
      )
    : [];
  const careerDecisionCriteria = careerPayload
    ? ensureSentenceRange(
        toStringList(careerPayload.decisionCriteria).flatMap((item) => splitIntoSentences(item)),
        [...careerPayload.executionChecklist, ...careerPayload.decisionTree],
        2,
        4,
      )
    : [];
  const careerDecideNow = careerPayload
    ? ensureSentenceRange(
        toStringList(careerPayload.decideNow).flatMap((item) => splitIntoSentences(item)),
        [...careerPayload.executionChecklist, ...careerPayload.actionNow],
        2,
        4,
      )
    : [];
  const careerDeferNow = careerPayload
    ? ensureSentenceRange(
        toStringList(careerPayload.deferNow).flatMap((item) => splitIntoSentences(item)),
        [...careerPayload.evidence, ...careerPayload.gainVsLossPatterns],
        2,
        4,
      )
    : [];
  const careerCurrentYearFocus = careerPayload
    ? ensureSentenceRange(
        splitIntoSentences(careerPayload.currentYearFocus ?? ""),
        [careerPayload.careerWindow, ...careerPayload.decisionCriteria],
        2,
        4,
      )
    : [];
  const daeunPhaseRoadmap = daeunPayload ? buildDaeunPhaseRoadmap(daeunPayload) : [];
  const daeunPhaseTextSet = new Set(
    daeunPhaseRoadmap
      .flatMap((phase) => [phase.coreFlow, phase.evidence, ...phase.opportunities, ...phase.risks, ...phase.actionStrategy])
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
  const daeunTransitionSignals = daeunPayload
    ? ensureSentenceRange(
        [
          ...splitIntoSentences(daeunPayload.transitionSignal),
          ...toStringList(daeunPayload.transitionSignals).flatMap((item) => splitIntoSentences(item)),
          ...toStringList(daeunPayload.changePoints).flatMap((item) => splitIntoSentences(item)),
          ...toStringList(daeunPayload.readinessActions).flatMap((item) => splitIntoSentences(item)),
        ],
        [...coreInsights, ...evidence],
        3,
        5,
      )
    : [];
  const daeunLongHorizonDirection = daeunPayload
    ? ensureSentenceRange(
        toStringList(daeunPayload.longHorizonDirection).flatMap((item) => splitIntoSentences(item)),
        [
          ...daeunPhaseRoadmap.map((phase) => phase.coreFlow),
          "1~2년: 전환 직후에는 확장보다 재배치와 기준 고정을 우선하세요.",
          "3~5년: 재배치된 기준을 반복 실행해 안정적인 성과 구조를 구축하세요.",
          "6~10년: 정착된 기준 위에서 선택적 확장으로 장기 탄력을 유지하세요.",
        ],
        3,
        3,
      )
    : [];
  const daeunLongHorizonItems = daeunPayload
    ? buildDaeunLongHorizonItems(daeunLongHorizonDirection, daeunPhaseRoadmap)
    : [];
  const daeunNinetyDayActions = daeunPayload
    ? ensureSentenceRange(
        toStringList(daeunPayload.ninetyDayActions).flatMap((item) => splitIntoSentences(item)),
        [...toStringList(daeunPayload.readinessActions), ...actionNow],
        3,
        4,
      )
    : [];
  const daeunPreAtPostSummary = daeunPayload
    ? ensureSentenceRange(
        toStringList(daeunPayload.preAtPostDiff)
          .flatMap((item) => splitIntoSentences(item))
          .filter((item) => !daeunPhaseTextSet.has(item.trim().toLowerCase())),
        [
          "전환 전: 기존 기준을 정리해 전환기에 반응형 결정을 줄이세요.",
          "전환기: 우선순위를 1~2개로 제한해 방향 이탈을 차단하세요.",
          "전환 후: 재배치 규칙을 월 단위로 점검해 정착 속도를 높이세요.",
        ],
        3,
        3,
      )
    : [];
  const wealthPayload = isWealthPayload(payload) ? payload : null;
  const isWealthFlowService = currentServiceId === "saju-wealth-flow" && Boolean(wealthPayload);
  const wealthLifecycleStages = wealthPayload ? buildWealthLifecycleStages(wealthPayload) : [];
  const wealthCheckpointStageReads = wealthPayload
    ? buildWealthCheckpointStageReads(wealthPayload, wealthLifecycleStages)
    : [];
  const wealthOperatingRules = wealthPayload
    ? uniqueItems([
        ...wealthLifecycleStages.flatMap((stage) => stage.operatingRules),
        ...wealthPayload.assetRules,
        ...wealthPayload.accumulateVsExpand,
      ]).slice(0, 8)
    : [];
  const helperPayload = isHelperNetworkPayload(payload) ? payload : null;
  const isHelperNetworkService = currentServiceId === "saju-helper-network" && Boolean(helperPayload);
  const helperPhaseRoadmap = helperPayload ? buildHelperPhaseRoadmap(helperPayload) : [];
  const helperCollaborationRules = helperPayload
    ? uniqueItems([
        ...helperPhaseRoadmap.map((phase) => phase.collaborationFlow),
        ...helperPayload.networkGuide,
        ...helperPayload.relationLayers,
      ]).slice(0, 6)
    : [];
  const helperMentorSignals = helperPayload
    ? uniqueItems([
        ...helperPhaseRoadmap.map((phase) => phase.mentorInfluxSignal),
        ...toStringList(helperPayload.longHorizonDirection),
        ...helperPayload.helperEntryWindows,
      ]).slice(0, 6)
    : [];
  const helperGuardPatterns = helperPayload
    ? uniqueItems([
        ...helperPhaseRoadmap.map((phase) => phase.guardPattern),
        ...helperPayload.conflictLoops,
        ...helperPayload.conflictPatterns,
      ]).slice(0, 6)
    : [];
  const helperAuxiliaryActions = helperPayload
    ? uniqueItems([
        ...helperPayload.actionNow,
        ...helperPhaseRoadmap.flatMap((phase) => phase.actionStrategy),
      ]).slice(0, 5)
    : [];
  const yearlyPayload = isYearlyCalendarPayload(payload) ? payload : null;
  const isYearlyCalendarService = currentServiceId === "saju-yearly-action-calendar" && Boolean(yearlyPayload);
  const yearlyCalendarYear = useMemo(() => {
    if (!yearlyPayload) {
      return null;
    }

    const payloadWithTargetYear = yearlyPayload as SajuYearlyActionCalendarPayload & {
      targetYear?: number | string;
    };
    const directYear = parseYearCandidate(payloadWithTargetYear.targetYear);
    if (directYear !== null) {
      return directYear;
    }

    const yearCandidateTexts = [
      yearlyPayload.oneLineTotalReview,
      yearlyPayload.currentLifeFlow,
      yearlyPayload.meaningOfThisYear,
      yearlyPayload.yearToLifeBridge,
      ...yearlyPayload.quarterlyGoals,
      ...yearlyPayload.riskCalendar,
      ...yearlyPayload.quarterThemes,
      ...yearlyPayload.monthlyActions,
      ...yearlyPayload.quarterNarratives.flatMap((item) => [item.quarter, item.meaning, item.focus, item.caution]),
    ];

    for (const text of yearCandidateTexts) {
      const parsed = parseYearCandidate(text);
      if (parsed !== null) {
        return parsed;
      }
    }

    const createdYear = getYearFromDate(result.createdAt, result.profileData?.timezone);
    if (createdYear !== null) {
      return createdYear;
    }

    return getYearFromDate(new Date().toISOString(), result.profileData?.timezone) ?? new Date().getFullYear();
  }, [result.createdAt, result.profileData?.timezone, yearlyPayload]);
  const yearlyOneLineTotalReview = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.oneLineTotalReview,
        [summary, ...coreInsights],
        ["올해는 인생 전체 흐름을 다음 단계로 연결하는 기준년입니다."],
      )
    : "";
  const yearlyCurrentLifeFlow = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.currentLifeFlow,
        [...coreInsights, yearlyOneLineTotalReview],
        ["지금은 속도보다 기준 정렬이 우선되는 구간입니다."],
      )
    : "";
  const yearlyMeaningOfThisYear = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.meaningOfThisYear,
        [yearlyCurrentLifeFlow, yearlyOneLineTotalReview, ...coreInsights],
        ["올해는 단기 성과보다 다음 10년 운영 기준을 고정하는 의미가 큽니다."],
      )
    : "";
  const yearlyTenYearFlow = yearlyPayload
    ? (Array.isArray(yearlyPayload.tenYearFlow) ? yearlyPayload.tenYearFlow : [])
        .slice(0, 3)
        .map((item, index) => {
          const periodFallback = (["0~2년", "3~5년", "6~10년"] as const)[index] ?? "6~10년";
          const phaseFallback = (["기반 설정기", "확장기", "성과 정착기"] as const)[index] ?? "전환기";
          return {
            periodLabel: item.periodLabel?.trim() || periodFallback,
            phaseLabel: normalizeParagraph(
              item.phaseLabel,
              [phaseFallback, ...coreInsights],
              [phaseFallback],
            ),
            interpretation: normalizeParagraph(
              item.interpretation,
              [yearlyMeaningOfThisYear, ...yearlyPayload.lifecycleExecutionPattern, ...coreInsights],
              [`${periodFallback} 구간의 운영 기준을 먼저 고정하세요.`],
            ),
          };
        })
    : [];
  const yearlyLongPatternInterpretation = yearlyPayload
    ? ensureSentenceRange(
        toStringList(yearlyPayload.longPatternInterpretation).flatMap((item) => splitIntoSentences(item)),
        [...yearlyPayload.lifecycleExecutionPattern, ...yearlyPayload.longPracticeStrategy, ...coreInsights],
        3,
        5,
      )
    : [];
  const yearlyKeyThemes = yearlyPayload
    ? (Array.isArray(yearlyPayload.keyThemes) ? yearlyPayload.keyThemes : [])
        .slice(0, 3)
        .map((item, index) => ({
          theme: item.theme?.trim() || `핵심 테마 ${index + 1}`,
          interpretation: normalizeParagraph(
            item.interpretation,
            [...yearlyLongPatternInterpretation, ...coreInsights],
            ["올해 테마는 단기 성과보다 반복 가능한 구조를 남기도록 설계하세요."],
          ),
        }))
    : [];
  const yearlyQuarterNarratives = yearlyPayload
    ? (Array.isArray(yearlyPayload.quarterNarratives) ? yearlyPayload.quarterNarratives : [])
        .slice(0, 4)
        .map((item, index) => {
          const quarter = item.quarter?.trim() || `${index + 1}분기`;
          const roleFallbacks = ["기반 정비", "확장 시동", "성과 압축", "정리와 전환 준비"] as const;
          return {
            quarter,
            role: item.role?.trim() || roleFallbacks[index] || "운영 단계",
            meaning: normalizeParagraph(
              item.meaning,
              [yearlyPayload.quarterlyGoals[index], yearlyMeaningOfThisYear, yearlyCurrentLifeFlow],
              [`${quarter}의 의미를 장기 흐름과 연결하세요.`],
            ),
            focus: normalizeParagraph(
              item.focus,
              [yearlyPayload.quarterlyGoals[index], yearlyPayload.lifecycleExecutionPattern[index], ...actionNow],
              [`${quarter} 핵심 집중축 1개를 고정하세요.`],
            ),
            caution: normalizeParagraph(
              item.caution,
              [yearlyPayload.riskCalendar[index], ...evidence],
              [`${quarter} 리스크 점검 기준을 유지하세요.`],
            ),
          };
        })
    : [];
  const yearlyYearEndResidue = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.yearEndResidue,
        [...yearlyLongPatternInterpretation, ...yearlyKeyThemes.map((item) => item.interpretation), yearlyMeaningOfThisYear],
        ["연말에는 성과 숫자보다 반복 가능한 기준, 결과물 정리, 관계 구조가 남아야 합니다."],
      )
    : "";
  const yearlyClosingLine = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.closingLine,
        [yearlyOneLineTotalReview, yearlyMeaningOfThisYear, yearlyYearEndResidue],
        ["올해의 가치는 단기 속도보다 다음 10년을 버틸 운영 기준을 남기는 데 있습니다."],
      )
    : "";
  const yearlyLifecycleExecutionPattern = yearlyPayload
    ? ensureSentenceRange(
        toStringList(yearlyPayload.lifecycleExecutionPattern).flatMap((item) => splitIntoSentences(item)),
        [...actionNow, ...coreInsights],
        3,
        6,
      )
    : [];
  const yearlyLongPracticeStrategy = yearlyPayload
    ? ensureSentenceRange(
        toStringList(yearlyPayload.longPracticeStrategy).flatMap((item) => splitIntoSentences(item)),
        [...yearlyLifecycleExecutionPattern, ...actionNow],
        3,
        6,
      )
    : [];
  const yearlyBridgeSummary = yearlyPayload
    ? normalizeParagraph(
        yearlyPayload.yearToLifeBridge,
        [...yearlyLifecycleExecutionPattern, ...yearlyLongPracticeStrategy, ...coreInsights],
        [
          "현재 위치와 장기 목적을 연결해 올해 실행을 생애 전환 축으로 운영하세요.",
          "이번 시기 행동과 점검 기준을 한 문장으로 고정해 분기·월 실행을 장기 축적으로 전환하세요.",
        ],
      )
    : "";
  const yearlyPhaseFocusMap = yearlyPayload
    ? (Array.isArray(yearlyPayload.phaseFocusMap) ? yearlyPayload.phaseFocusMap : [])
        .slice(0, 6)
        .map((item, index) => {
          const phaseLabel = item.phaseLabel?.trim() || YEARLY_PHASE_FOCUS_DEFAULT_LABELS[index] || `단계 ${index + 1}`;
          return {
            phaseLabel,
            focusPoint: normalizeParagraph(
              item.focusPoint,
              [...coreInsights, yearlyBridgeSummary],
              [`${phaseLabel} 구간의 집중 포인트를 먼저 고정하세요.`],
            ),
            executionPattern: normalizeParagraph(
              item.executionPattern,
              [...yearlyLifecycleExecutionPattern, ...actionNow],
              [`${phaseLabel} 구간의 실행 패턴을 일정에 고정하세요.`],
            ),
            checkpoint: normalizeParagraph(
              item.checkpoint,
              [...yearlyLongPracticeStrategy, ...evidence],
              [`${phaseLabel} 점검 기준을 주기적으로 확인하세요.`],
            ),
          };
        })
    : [];
  const yearlyAccumulationFlow = yearlyPayload
    ? (Array.isArray(yearlyPayload.accumulationTransitionFlow) ? yearlyPayload.accumulationTransitionFlow : [])
        .slice(0, 6)
        .map((item, index) => {
          const axisFallbacks = ["쌓을 것", "버릴 것", "전환 트리거", "복구 규칙"] as const;
          const axis = item.axis?.trim() || axisFallbacks[index] || `축 ${index + 1}`;
          return {
            axis,
            guidance: normalizeParagraph(
              item.guidance,
              [...yearlyPayload.quarterlyGoals, ...yearlyPayload.riskCalendar, ...yearlyLongPracticeStrategy],
              [`${axis} 기준을 문장으로 고정해 장기 실행 흐름을 유지하세요.`],
            ),
          };
        })
    : [];
  const energyPayload = isEnergyPayload(payload) ? payload : null;
  const isEnergyGuideService = currentServiceId === "saju-energy-balance" && Boolean(energyPayload);
  const energyLongRangeBlocks = isEnergyGuideService
    ? analysisBlocks.filter((block) => !isEnergyShortTermBlock(block) && !isEnergyCurrentYearBlock(block))
    : [];
  const energyShortRangeBlocks = isEnergyGuideService ? analysisBlocks.filter((block) => isEnergyShortTermBlock(block)) : [];
  const energyCurrentYearBlocks = isEnergyGuideService
    ? analysisBlocks.filter((block) => isEnergyCurrentYearBlock(block))
    : [];
  const primaryAnalysisBlocks = isEnergyGuideService
    ? energyLongRangeBlocks
    : isDaeunShiftService
      ? []
      : isCareerTimingService
        ? []
        : isWealthFlowService
          ? []
          : isHelperNetworkService
            ? []
          : isYearlyCalendarService
            ? []
          : analysisBlocks;
  const shouldInlineShortRangeBlock =
    isEnergyGuideService && primaryAnalysisBlocks.length % 2 === 1 && energyShortRangeBlocks.length > 0;
  const inlineShortRangeBlocks = shouldInlineShortRangeBlock ? energyShortRangeBlocks.slice(0, 1) : [];
  const deferredShortRangeBlocks = shouldInlineShortRangeBlock ? energyShortRangeBlocks.slice(1) : energyShortRangeBlocks;
  const energyInnateProfileSentences = energyPayload
    ? ensureSentenceRange(
        splitIntoSentences(energyPayload.innateProfile),
        [
          ...splitIntoSentences(energyPayload.energyCurve),
          ...coreInsights.flatMap((item) => splitIntoSentences(item)),
          ...(energyPayload.stageShiftMap ?? []).flatMap((item) => splitIntoSentences(item)),
        ],
        2,
        4,
      )
    : [];
  const energyInnateStrengthFactors = energyPayload
    ? normalizeList(
        energyPayload.immersionMode,
        [...(energyPayload.operatingModel ?? []), ...coreInsights],
        [
          "집중이 필요한 핵심 과업은 주변 요청을 차단한 몰입 블록 안에서 처리할 때 성과 대비 소모가 가장 낮아집니다.",
          "성과 기준이 명확할수록 실행 속도와 심리적 안정이 함께 올라가는 패턴이 반복됩니다.",
        ],
      )
    : [];
  const energyInnateRiskSignals = energyPayload
    ? normalizeList(
        energyPayload.burnoutSignals,
        [...(energyPayload.overloadAlerts ?? []), ...evidence],
        [
          "동시에 여러 목표를 붙잡고 있으면 판단 피로가 빠르게 누적되어 후반 집중력이 급격히 떨어집니다.",
          "회복 없이 일정만 늘어날 때 작은 지연이 연쇄적으로 커지는 구조가 반복됩니다.",
        ],
      )
    : [];
  const energyInnateRecoveryAnchors = energyPayload
    ? normalizeList(
        energyPayload.recoveryRoutines,
        [
          ...(energyPayload.recoveryProtocol ?? []),
          ...(energyPayload.habitTweaks ?? []),
          ...(energyPayload.longRangeStrategy ?? []),
        ],
        [
          "회복 루틴을 일이 끝난 뒤 보상처럼 다루지 말고 일정의 선행 조건으로 먼저 배치해야 장기 지속력이 유지됩니다.",
          "에너지 하락 구간마다 같은 기준으로 재정렬할 수 있게 주간 점검 문장을 고정해 두는 편이 유리합니다.",
        ],
      )
    : [];
  const supplement = getSupplement(payload, currentServiceId);
  const supplementReferenceSet = buildSupplementReferenceSet(supplement);
  const supplementDeepDivePoints = supplement ? uniqueItems(supplement.deepDivePoints) : [];
  const supplementCheckpointQuestions = supplement ? uniqueItems(supplement.checkpointQuestions) : [];
  const supplementTodayWeekActions = supplement
    ? uniqueItems([...supplement.executionProtocol.today, ...supplement.executionProtocol.thisWeek])
    : [];
  const supplementMonthAvoidItems = supplement
    ? uniqueItems([...supplement.executionProtocol.thisMonth, ...supplement.executionProtocol.avoid]).filter(
        (item) => !supplementTodayWeekActions.includes(item),
      )
    : [];

  return (
    <section className={cn("space-y-5 md:space-y-6", className)}>
      {hasTabs ? (
        <div role="tablist" aria-label="사주 리포트 탭" className="flex flex-wrap gap-2">
          {serviceIds.map((serviceId) => {
            const selected = serviceId === currentServiceId;
            return (
              <button
                key={serviceId}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveServiceId(serviceId)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                  selected
                    ? "border-[#24303F] bg-[#24303F] text-white"
                    : "border-[#24303F]/15 bg-white text-[#24303F]",
                )}
              >
                {getServiceTitleById(serviceId)}
              </button>
            );
          })}
        </div>
      ) : null}

      <article className="rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
        <p className="text-[11px] font-bold tracking-wide text-slate-500">리포트 요약</p>
        <h3 className="mt-2 text-lg font-black text-[#24303F]">{getServiceTitleById(currentServiceId)}</h3>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-[1.8] text-[#24303F]">{summary}</p>

        {payload?.coreQuestion && !isStudyActionService && !investmentActionableView ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
            <p className="text-[11px] font-black text-amber-700">핵심 질문</p>
            <p className="mt-1 text-sm font-semibold text-amber-900">{payload.coreQuestion}</p>
          </div>
        ) : null}
      </article>

      {isStudyActionService && studyActionReport ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">한눈에 보는 핵심 진단</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">{studyActionReport.coreDiagnosis.headline}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-700">
                  {studyActionReport.coreDiagnosis.summary}
                </p>
                <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-600">
                  {studyActionReport.coreDiagnosis.confidenceNote}
                </p>
              </article>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/70 p-5 md:p-6">
            <h4 className="text-base font-black text-amber-900">핵심 질문</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="break-words text-sm font-semibold leading-[1.75] text-amber-900">{studyActionReport.keyQuestion}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">올해의 핵심 인사이트 3가지</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-[1.75] text-slate-700">
                {studyActionReport.keyInsights.map((item) => (
                  <li key={`study-insight-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">지금 바로 해야 할 것</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 md:p-5">
                <p className="text-sm font-black text-emerald-900">지금 시작해야 할 행동</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-emerald-900/90">
                    {studyActionReport.immediateActions.startNow.map((item) => (
                      <li key={`study-start-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 md:p-5">
                <p className="text-sm font-black text-rose-900">지금 멈춰야 할 행동</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-rose-900/90">
                    {studyActionReport.immediateActions.stopNow.map((item) => (
                      <li key={`study-stop-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 md:p-5">
                <p className="text-sm font-black text-sky-900">지금 챙겨야 할 것</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-sky-900/90">
                    {studyActionReport.immediateActions.prepNow.map((item) => (
                      <li key={`study-prep-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">2026년 전체 흐름 요약</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">준비기</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.yearFlowSummary.preparationPhase}
                  </p>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">가속기</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.yearFlowSummary.accelerationPhase}
                  </p>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">승부기</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.yearFlowSummary.showdownPhase}
                  </p>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">정리기</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 whitespace-pre-line break-words text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.yearFlowSummary.wrapUpPhase}
                  </p>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">시기별 상세 해석</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {studyActionReport.quarterlyDetailed.map((quarter) => (
                <article key={`study-quarter-${quarter.period}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                  <p className="text-sm font-black text-[#24303F]">{quarter.period}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <section className="mt-3 rounded-xl border border-[#24303F]/10 bg-white/80 p-3">
                      <p className="text-[12px] font-black text-[#24303F]">이 시기의 강점</p>
                      <ul className="mt-1.5 space-y-1.5 text-sm leading-[1.7] text-slate-700">
                        {quarter.strengths.map((item) => (
                          <li key={`study-quarter-strength-${quarter.period}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mt-3 rounded-xl border border-[#24303F]/10 bg-white/80 p-3">
                      <p className="text-[12px] font-black text-[#24303F]">이 시기의 리스크</p>
                      <ul className="mt-1.5 space-y-1.5 text-sm leading-[1.7] text-slate-700">
                        {quarter.risks.map((item) => (
                          <li key={`study-quarter-risk-${quarter.period}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mt-3 rounded-xl border border-[#24303F]/10 bg-white/80 p-3">
                      <p className="text-[12px] font-black text-[#24303F]">추천 전략</p>
                      <ul className="mt-1.5 space-y-1.5 text-sm leading-[1.7] text-slate-700">
                        {quarter.recommendedStrategies.map((item) => (
                          <li key={`study-quarter-strategy-${quarter.period}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                    <section className="mt-3 rounded-xl border border-[#24303F]/10 bg-amber-50/80 p-3">
                      <p className="text-[12px] font-black text-amber-900">체크 질문 또는 실전 팁</p>
                      <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-[1.7] text-amber-900/90">
                        {quarter.checkQuestionOrTip}
                      </p>
                    </section>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">시험 유형별 맞춤 해석</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">필기시험형</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.examTypeGuides.writtenExam.map((item) => (
                      <li key={`study-written-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">면접/구술형</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.examTypeGuides.interviewOrOral.map((item) => (
                      <li key={`study-interview-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">장기 학습형</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.examTypeGuides.longTermLearning.map((item) => (
                      <li key={`study-longterm-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-rose-200 bg-rose-50/70 p-5 md:p-6">
            <h4 className="text-base font-black text-rose-900">2026년에 특히 조심해야 할 실패 패턴</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-[1.75] text-rose-900/90">
                {studyActionReport.failurePatterns.map((item) => (
                  <li key={`study-failure-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">합격운을 실제 성과로 바꾸는 행동 전략</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">공부 방식</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.performanceStrategy.studyMethod.map((item) => (
                      <li key={`study-method-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">생활 관리</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.performanceStrategy.lifeManagement.map((item) => (
                      <li key={`study-life-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4 md:p-5">
                <p className="text-sm font-black text-[#24303F]">멘탈 관리</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-[1.75] text-slate-700">
                    {studyActionReport.performanceStrategy.mentalManagement.map((item) => (
                      <li key={`study-mental-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">해석 근거를 쉽게 풀어보면</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-[1.75] text-slate-700">
                {studyActionReport.plainEvidence.map((item) => (
                  <li key={`study-plain-evidence-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-5 md:p-6">
            <h4 className="text-base font-black text-[#24303F]">2026 합격 가이드 요약</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-[1.75] text-slate-700">
                {studyActionReport.finalSummary.map((item) => (
                  <li key={`study-final-summary-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>
        </>
      ) : null}

      {investmentActionableView ? (
        <section className="space-y-5 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">투자/자산운 전략 리포트 (2026)</h4>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-xs font-black text-slate-500">1. 한 줄 핵심 진단</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">
                {investmentActionableView.coreDiagnosis.headline}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{investmentActionableView.coreDiagnosis.summary}</p>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-xs font-black text-amber-700">2. 핵심 질문</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">{investmentActionableView.keyQuestion}</p>
            </LockedSectionOverlay>
          </article>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">3. 핵심 인사이트 3개</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {investmentActionableView.keyInsights.map((item, index) => (
                <article key={`investment-insight-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4">
                  <p className="text-xs font-black text-slate-500">인사이트 {index + 1}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{item}</p>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-sm font-black text-[#24303F]">4. 지금 액션</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                {investmentActionableView.immediateActions.map((item) => (
                  <li key={`investment-action-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
            <p className="text-sm font-black text-rose-900">5. 올해 절대 조심할 행동</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-rose-900/90">
                {investmentActionableView.absoluteCautions.map((item) => (
                  <li key={`investment-caution-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">6. 분기별 흐름 (1분기/2분기/3분기/4분기)</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {investmentActionableView.quarterlyFlow.map((item) => (
                <article key={`investment-quarter-${item.quarter}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-xs font-black text-slate-500">{item.quarter}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.summary}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <section className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                        <p className="text-[11px] font-black text-emerald-900">행동 초점</p>
                        <ul className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-emerald-900/90">
                          {item.actionFocus.map((line) => (
                            <li key={`investment-quarter-action-${item.quarter}-${line}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                        <p className="text-[11px] font-black text-rose-900">리스크 초점</p>
                        <ul className="mt-1.5 space-y-1.5 text-xs leading-relaxed text-rose-900/90">
                          {item.riskFocus.map((line) => (
                            <li key={`investment-quarter-risk-${item.quarter}-${line}`}>{line}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">7. 자산군별 해석</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">주식/ETF</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {investmentActionableView.assetClassGuides.stocksEtf.map((item) => (
                      <li key={`investment-asset-stocks-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">부동산</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {investmentActionableView.assetClassGuides.realEstate.map((item) => (
                      <li key={`investment-asset-realestate-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">현금/예금</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {investmentActionableView.assetClassGuides.cashSavings.map((item) => (
                      <li key={`investment-asset-cash-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">코인/고변동 자산</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {investmentActionableView.assetClassGuides.cryptoHighVolatility.map((item) => (
                      <li key={`investment-asset-crypto-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">8. 관망 신호 / 진입 신호</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                <p className="text-sm font-black text-amber-900">관망 신호</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-amber-900/90">
                    {investmentActionableView.signalBoard.watchSignals.map((item) => (
                      <li key={`investment-watch-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <p className="text-sm font-black text-emerald-900">진입 신호</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-emerald-900/90">
                    {investmentActionableView.signalBoard.entrySignals.map((item) => (
                      <li key={`investment-entry-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <article className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
            <p className="text-sm font-black text-rose-900">9. 리스크 경보</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-rose-900/90">
                {investmentActionableView.riskAlerts.map((item) => (
                  <li key={`investment-risk-alert-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-sm font-black text-amber-900">10. 실전 체크리스트</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ol className="mt-2 space-y-2.5 text-sm leading-relaxed text-amber-900/90">
                {investmentActionableView.practicalChecklist.map((item, index) => (
                  <li key={`investment-checklist-${item}`}>
                    <span className="font-black">{index + 1}. </span>
                    {item}
                  </li>
                ))}
              </ol>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-sm font-black text-[#24303F]">11. 해석 근거를 쉽게 풀어쓴 설명</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                {investmentActionableView.plainEvidence.map((item) => (
                  <li key={`investment-plain-evidence-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-sm font-black text-[#24303F]">12. 2027로 이어지는 흐름</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{investmentActionableView.flowTo2027}</p>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-sm font-black text-[#24303F]">13. 최종 결론</p>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                {investmentActionableView.finalConclusion.map((item) => (
                  <li key={`investment-conclusion-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>
        </section>
      ) : null}

      {isDaeunShiftService ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">전환 신호</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {daeunTransitionSignals.map((item) => (
                  <li key={`daeun-signal-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">전환 흐름 타임라인(4단계)</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {daeunPhaseRoadmap.map((phase, index) => (
                <article key={`daeun-phase-${phase.phaseLabel}-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-xs font-black text-slate-500">{index + 1}단계</p>
                  <p className="mt-1 text-sm font-black text-[#24303F]">{phase.phaseLabel}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{phase.yearRange}</p>
                  <p className="text-xs text-slate-500">{phase.ageRange}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{phase.coreFlow}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{phase.evidence}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <section className="rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                        <p className="text-[11px] font-black text-[#24303F]">기회 축</p>
                        <ul className="mt-1 space-y-1.5 text-xs leading-relaxed text-slate-700">
                          {phase.opportunities.map((item) => (
                            <li key={`daeun-phase-op-${phase.phaseLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                        <p className="text-[11px] font-black text-[#24303F]">리스크 축</p>
                        <ul className="mt-1 space-y-1.5 text-xs leading-relaxed text-slate-700">
                          {phase.risks.map((item) => (
                            <li key={`daeun-phase-risk-${phase.phaseLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                        <p className="text-[11px] font-black text-[#24303F]">행동 축</p>
                        <ul className="mt-1 space-y-1.5 text-xs leading-relaxed text-slate-700">
                          {phase.actionStrategy.map((item) => (
                            <li key={`daeun-phase-action-${phase.phaseLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">인생 단계별 변화(1~2/3~5/6~10년)</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="divide-y divide-[#24303F]/10 rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF]">
                {daeunLongHorizonItems.map((item) => (
                  <li key={`daeun-long-horizon-${item.label}-${item.text}`} className="space-y-2 px-4 py-3">
                    <p className="text-xs font-black text-[#24303F]">
                      [{item.label}]{" "}
                      {item.yearRangeLabel ? <span className="text-slate-500">{item.yearRangeLabel}</span> : null}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">{item.text}</p>
                  </li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">90일 안정화</h4>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {daeunNinetyDayActions.map((item) => (
                  <li key={`daeun-90day-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          {daeunPreAtPostSummary.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">전환 전/전환기/전환 후 비교 요약</h4>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {daeunPreAtPostSummary.map((item) => (
                    <li key={`daeun-prepost-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>
          ) : null}
        </>
      ) : null}

      {/* ── 핵심 인사이트 / 지금 액션 / 근거 (카드별 부분 블러) ── */}
      {isCareerTimingService && careerPayload ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">커리어 장기축 요약</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{careerArcSummary}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">4단계 커리어 흐름</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {careerStageFlow.map((stage, index) => {
                const stageBlockBase = { coreFlow: stage.coreFlow, evidence: stage.evidence };
                const opportunities = dedupeAnalysisItems(stage.opportunities, stageBlockBase, supplementReferenceSet);
                const risks = dedupeAnalysisItems(stage.risks, stageBlockBase, supplementReferenceSet);
                const actionStrategy = dedupeAnalysisItems(stage.actionStrategy, stageBlockBase, supplementReferenceSet);
                return (
                  <article
                    key={`career-stage-${stage.stageId}-${index}`}
                    className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5"
                  >
                    <p className="text-xs font-black text-slate-500">{index + 1}단계</p>
                    <p className="mt-1 text-sm font-black text-[#24303F]">{stage.label}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{stage.timeRange}</p>
                    <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{stage.coreFlow}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{stage.evidence}</p>
                      <div className="mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
                        <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                          <p className="text-[11px] font-black text-[#24303F]">주요 기회</p>
                          <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                            {opportunities.map((item) => (
                              <li key={`career-stage-op-${stage.stageId}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </section>
                        <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                          <p className="text-[11px] font-black text-[#24303F]">리스크</p>
                          <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                            {risks.map((item) => (
                              <li key={`career-stage-risk-${stage.stageId}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </section>
                        <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                          <p className="text-[11px] font-black text-[#24303F]">행동 전략</p>
                          <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                            {actionStrategy.map((item) => (
                              <li key={`career-stage-action-${stage.stageId}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </LockedSectionOverlay>
                  </article>
                );
              })}
            </div>
          </section>

          {careerTransitionSignals.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
              <h4 className="text-base font-black text-[#24303F]">단계 전환 신호</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {careerTransitionSignals.map((item) => (
                    <li key={`career-transition-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>
          ) : null}

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">결정 매트릭스</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">지금 결정</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {careerDecideNow.map((item) => (
                      <li key={`career-decide-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">지금 보류</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {careerDeferNow.map((item) => (
                      <li key={`career-defer-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">판단 기준</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {careerDecisionCriteria.map((item) => (
                      <li key={`career-criteria-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          {careerCurrentYearFocus.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">현재 연도 적용 포인트(보조)</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {careerCurrentYearFocus.map((item) => (
                    <li key={`career-current-year-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>
          ) : null}
        </>
      ) : null}

      {isEnergyGuideService ? (
        <section className="space-y-5 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">인생 전반 에너지 운영 가이드</h4>

          {/* ── 좌우 비대칭: 왼쪽 타고난 성향 + 오른쪽 3카드 세로 스택 ── */}
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
            {/* 왼쪽: 타고난 성향 (자연 높이) */}
            <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
              <p className="text-sm font-black text-[#24303F]">타고난 성향</p>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <div className="mt-2 space-y-3">
                  <div className="space-y-2">
                    {energyInnateProfileSentences.map((sentence, index) => (
                      <p key={`innate-profile-${index}-${sentence}`} className="text-sm leading-relaxed text-slate-700">
                        {sentence}
                      </p>
                    ))}
                  </div>

                  <section className="rounded-xl border border-[#24303F]/10 bg-white/70 p-3">
                    <p className="text-[11px] font-black tracking-wide text-[#24303F]">강점 발현 조건</p>
                    <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
                      {energyInnateStrengthFactors.map((item) => (
                        <li key={`innate-strength-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-[#24303F]/10 bg-white/70 p-3">
                    <p className="text-[11px] font-black tracking-wide text-[#24303F]">소진 전조 신호</p>
                    <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
                      {energyInnateRiskSignals.map((item) => (
                        <li key={`innate-risk-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-xl border border-[#24303F]/10 bg-white/70 p-3">
                    <p className="text-[11px] font-black tracking-wide text-[#24303F]">회복 기본축</p>
                    <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-slate-700">
                      {energyInnateRecoveryAnchors.map((item) => (
                        <li key={`innate-recovery-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </div>
              </LockedSectionOverlay>
            </article>

            {/* 오른쪽: 3개 카드 세로 스택 */}
            <div className="flex flex-col gap-5">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">에너지 운용 방식</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {(energyPayload?.operatingModel ?? []).map((item) => (
                      <li key={`operating-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>

              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">시기별 변화(생애 단계)</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {(energyPayload?.stageShiftMap ?? []).map((item) => (
                      <li key={`stage-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>

              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">중장기 관리 전략(0~2/3~5/6~10년)</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {(energyPayload?.longRangeStrategy ?? []).map((item) => (
                      <li key={`long-range-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </div>
        </section>
      ) : null}

      {isWealthFlowService && wealthPayload ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">인생 자산 사이클 4단계</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {wealthLifecycleStages.map((stage, index) => {
                const phaseLabel = WEALTH_LIFECYCLE_DEFAULTS.find((item) => item.phaseType === stage.phaseType)?.label ?? "단계";
                return (
                  <article
                    key={`wealth-stage-${stage.phaseType}-${index}`}
                    className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5"
                  >
                    <p className="text-xs font-black text-slate-500">{index + 1}단계</p>
                    <p className="mt-1 text-sm font-black text-[#24303F]">{phaseLabel}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {stage.timeRange} · {stage.yearRange} · {stage.ageRange}
                    </p>
                    <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{stage.coreObjective}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">기회: {stage.opportunity}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">리스크: {stage.risk}</p>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <section className="rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                          <p className="text-[11px] font-black text-[#24303F]">운영 규칙</p>
                          <ul className="mt-1 space-y-1.5 text-xs leading-relaxed text-slate-700">
                            {stage.operatingRules.map((item) => (
                              <li key={`wealth-stage-rule-${stage.phaseType}-${item}`}>{item}</li>
                            ))}
                          </ul>
                        </section>
                        <section className="rounded-xl border border-[#24303F]/10 bg-white/90 p-3">
                          <p className="text-[11px] font-black text-[#24303F]">전환 신호</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700">{stage.transitionSignal}</p>
                        </section>
                      </div>
                    </LockedSectionOverlay>
                  </article>
                );
              })}
            </div>
          </section>

          <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
            <SajuTrendChart
              title="자산 흐름 추세"
              data={wealthPayload.assetTrendSeries}
              evidence={wealthPayload.assetTrendEvidence}
              color="#0f9f7a"
              domain={WEALTH_DOMAIN}
              periodSummary="현재~10년"
              pointSummary="현재 / 1년 후 / 3년 후 / 5년 후 / 10년 후"
              description={WEALTH_DESCRIPTION}
            />
          </LockedSectionOverlay>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">10년 추세(근거)</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {wealthCheckpointStageReads.map((item) => (
                  <li key={`wealth-evidence-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">구간별 운영 규칙</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {wealthOperatingRules.map((item) => (
                  <li key={`wealth-rule-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
            <h4 className="text-base font-black text-[#24303F]">현재 구간 실행</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {actionNow.map((item) => (
                  <li key={`wealth-action-now-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>
        </>
      ) : null}

      {isHelperNetworkService && helperPayload ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">인생 단계별 관계 확장/정리</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {helperPhaseRoadmap.map((phase, index) => (
                <article
                  key={`helper-phase-${phase.phaseLabel}-${index}`}
                  className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5"
                >
                  <p className="text-xs font-black text-slate-500">{index + 1}단계</p>
                  <p className="mt-1 text-sm font-black text-[#24303F]">{phase.phaseLabel}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{phase.timeRange}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{phase.relationshipExpansion}</p>
                    <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-700">
                      {phase.actionStrategy.map((item) => (
                        <li key={`helper-phase-action-${phase.phaseLabel}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
              <h4 className="text-base font-black text-[#24303F]">협업 운 운영 기준</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {helperCollaborationRules.map((item) => (
                    <li key={`helper-collaboration-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>

            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
              <h4 className="text-base font-black text-[#24303F]">멘토·귀인 유입 시그널</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {helperMentorSignals.map((item) => (
                    <li key={`helper-mentor-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>

            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">경계 패턴</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {helperGuardPatterns.map((item) => (
                    <li key={`helper-guard-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>

            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">현재연도 실행 포인트(보조)</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {helperAuxiliaryActions.map((item) => (
                    <li key={`helper-aux-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>
          </div>
        </>
      ) : null}

      {isYearlyCalendarService && yearlyPayload ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">한 줄 총평</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyOneLineTotalReview}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">지금 인생의 큰 흐름</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyCurrentLifeFlow}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{yearlyBridgeSummary}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">올해의 의미</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyMeaningOfThisYear}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">올해 이후 10년의 흐름</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="divide-y divide-[#24303F]/10 rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF]">
                {yearlyTenYearFlow.map((item) => (
                  <li key={`yearly-ten-year-${item.periodLabel}-${item.phaseLabel}`} className="space-y-2 px-4 py-3">
                    <p className="text-xs font-black text-[#24303F]">
                      {item.periodLabel} <span className="text-slate-500">({item.phaseLabel})</span>
                    </p>
                    <p className="text-sm leading-relaxed text-slate-700">{item.interpretation}</p>
                  </li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">장기 패턴 해석</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                {yearlyLongPatternInterpretation.map((item) => (
                  <li key={`yearly-pattern-interpretation-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">생애 단계별 실행 패턴</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {yearlyLifecycleExecutionPattern.map((item) => (
                      <li key={`yearly-lifecycle-pattern-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">장기 실천 전략</p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {yearlyLongPracticeStrategy.map((item) => (
                      <li key={`yearly-long-practice-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
            {yearlyPhaseFocusMap.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {yearlyPhaseFocusMap.map((item) => (
                  <article key={`yearly-phase-${item.phaseLabel}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                    <p className="text-xs font-black text-slate-500">{item.phaseLabel}</p>
                    <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{item.focusPoint}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">실행 패턴: {item.executionPattern}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">점검 기준: {item.checkpoint}</p>
                    </LockedSectionOverlay>
                  </article>
                ))}
              </div>
            ) : null}
            {yearlyAccumulationFlow.length > 0 ? (
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">축적·전환 흐름</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {yearlyCalendarYear
                    ? `${yearlyCalendarYear}년 기준 연간 분기 행동 가이드입니다.`
                    : "인생 전체 흐름 기준 연간 분기 행동 가이드입니다."}
                </p>
                <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-3 text-sm leading-relaxed text-slate-700">
                    {yearlyAccumulationFlow.map((item) => {
                      const quarterItems = buildQuarterGuidanceItems(
                        item.guidance,
                        item.axis,
                        yearlyQuarterNarratives,
                        yearlyPayload.quarterlyGoals,
                      );
                      return (
                        <li key={`yearly-acc-flow-${item.axis}`} className="space-y-1.5">
                          <p className="font-semibold text-[#24303F]">{item.axis}</p>
                          <ul className="space-y-1.5">
                            {quarterItems.map((quarterItem) => (
                              <li key={`${item.axis}-${quarterItem.quarter}`}>
                                <span className="font-semibold text-[#24303F]">{quarterItem.quarter}:</span>{" "}
                                {quarterItem.text}
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </LockedSectionOverlay>
              </article>
            ) : null}
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">올해의 핵심 테마 3가지</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {yearlyKeyThemes.map((item, index) => (
                <article key={`yearly-theme-${item.theme}-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-sm font-black text-[#24303F]">{item.theme}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.interpretation}</p>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">
              분기별 실행 캘린더{yearlyCalendarYear ? ` (${yearlyCalendarYear}년 기준)` : ""}
            </h4>
            <p className="text-xs leading-relaxed text-slate-500">
              {yearlyCalendarYear ? `${yearlyCalendarYear}년 기준으로 작성된 분기별 실행 캘린더입니다.` : "해당 연도 기준 분기별 실행 캘린더입니다."}
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {yearlyQuarterNarratives.map((item, index) => (
                <article key={`yearly-quarter-narrative-${item.quarter}-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-xs font-black text-slate-500">
                    {yearlyCalendarYear ? `${yearlyCalendarYear}년 ${item.quarter}` : item.quarter}
                  </p>
                  <p className="mt-1 text-sm font-black text-[#24303F]">{item.role}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold text-[#24303F]">의미:</span> {item.meaning}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold text-[#24303F]">집중:</span> {item.focus}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">
                      <span className="font-semibold text-[#24303F]">주의:</span> {item.caution}
                    </p>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>

            <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
              <p className="text-sm font-black text-[#24303F]">
                분기 목표{yearlyCalendarYear ? ` (${yearlyCalendarYear}년)` : ""}
              </p>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {yearlyPayload.quarterlyGoals.map((item, index) => (
                    <li key={`yearly-quarter-goal-${index}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>

            <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
              <p className="text-sm font-black text-[#24303F]">
                월별 실행·주의·점검{yearlyCalendarYear ? ` (${yearlyCalendarYear}년)` : ""}
              </p>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {yearlyPayload.monthlyActions.map((actionItem, monthIndex) => {
                    const monthlyAction = stripLeadingMonthMarker(actionItem, monthIndex) || actionItem;
                    const monthlyCautionRaw = yearlyPayload.monthlyPushCaution[monthIndex] ?? "";
                    const monthlyCaution = stripLeadingMonthMarker(monthlyCautionRaw, monthIndex) || monthlyCautionRaw;
                    const monthlyCheckpointRaw = yearlyPayload.actionCheckpoints[monthIndex] ?? "";
                    const monthlyCheckpoint = stripLeadingMonthMarker(monthlyCheckpointRaw, monthIndex) || monthlyCheckpointRaw;
                    return (
                      <article key={`yearly-month-card-${monthIndex}`} className="rounded-xl border border-[#24303F]/10 bg-white p-3">
                        <p className="text-xs font-black text-slate-500">
                          {yearlyCalendarYear ? `${yearlyCalendarYear}년 ${monthIndex + 1}월` : `${monthIndex + 1}월`}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-700">{monthlyAction}</p>
                        <p className="mt-2 text-xs leading-relaxed text-slate-600">
                          주의: {monthlyCaution}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-600">
                          점검: {monthlyCheckpoint}
                        </p>
                      </article>
                    );
                  })}
                </div>
              </LockedSectionOverlay>
            </article>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">올해가 끝났을 때 남아야 할 것</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyYearEndResidue}</p>
            </LockedSectionOverlay>
          </section>

          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">한 줄 결론</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyClosingLine}</p>
            </LockedSectionOverlay>
          </section>
        </>
      ) : null}

      {false && isYearlyCalendarService && yearlyPayload ? (
        <>
          <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
            <h4 className="text-base font-black text-[#24303F]">생애 실행 브리지</h4>
            <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="text-sm leading-relaxed text-slate-700">{yearlyBridgeSummary}</p>
            </LockedSectionOverlay>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
              <h4 className="text-base font-black text-[#24303F]">생애 단계별 실행 패턴</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {yearlyLifecycleExecutionPattern.map((item) => (
                    <li key={`yearly-pattern-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>

            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">장기 실천 전략</h4>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {yearlyLongPracticeStrategy.map((item) => (
                    <li key={`yearly-long-strategy-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </section>
          </div>

          {yearlyPhaseFocusMap.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
              <h4 className="text-base font-black text-[#24303F]">시기별 집중 포인트</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {yearlyPhaseFocusMap.map((item) => (
                  <article key={`yearly-phase-${item.phaseLabel}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                    <p className="text-xs font-black text-slate-500">{item.phaseLabel}</p>
                    <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{item.focusPoint}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">실행 패턴: {item.executionPattern}</p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">점검 기준: {item.checkpoint}</p>
                    </LockedSectionOverlay>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {yearlyAccumulationFlow.length > 0 ? (
            <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
              <h4 className="text-base font-black text-[#24303F]">축적·전환 흐름</h4>
              <p className="text-xs leading-relaxed text-slate-500">
                {yearlyCalendarYear
                  ? `${yearlyCalendarYear}년 기준 연간 분기 행동 가이드입니다.`
                  : "인생 전체 흐름 기준 연간 분기 행동 가이드입니다."}
              </p>
              <LockedSectionOverlay locked={isLocked} label="결제 영역" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
                  {yearlyAccumulationFlow.map((item) => {
                    const quarterItems = buildQuarterGuidanceItems(
                      item.guidance,
                      item.axis,
                      yearlyQuarterNarratives,
                      yearlyPayload.quarterlyGoals,
                    );
                    return (
                      <li key={`yearly-flow-${item.axis}`} className="space-y-1.5">
                        <p className="font-semibold text-[#24303F]">{item.axis}</p>
                        <ul className="space-y-1.5">
                          {quarterItems.map((quarterItem) => (
                            <li key={`${item.axis}-${quarterItem.quarter}`}>
                              <span className="font-semibold text-[#24303F]">{quarterItem.quarter}:</span>{" "}
                              {quarterItem.text}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </LockedSectionOverlay>
            </section>
          ) : null}
        </>
      ) : null}

      {!isEnergyGuideService &&
      !isCareerTimingService &&
      !isWealthFlowService &&
      !isHelperNetworkService &&
      !isStudyActionService &&
      !isHealthActionService &&
      !investmentActionableView &&
      !isYearlyCalendarService &&
      (coreInsights.length > 0 || actionNow.length > 0 || evidence.length > 0) ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {coreInsights.length > 0 ? (
            <article className="rounded-3xl border border-[#24303F]/10 bg-white p-5">
              <h4 className="text-sm font-black text-[#24303F]">핵심 인사이트</h4>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {coreInsights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          ) : null}

          {actionNow.length > 0 ? (
            <article className="rounded-3xl border border-[#24303F]/10 bg-white p-5">
              <h4 className="text-sm font-black text-[#24303F]">지금 액션</h4>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {actionNow.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          ) : null}

          {evidence.length > 0 ? (
            <article className="rounded-3xl border border-[#24303F]/10 bg-white p-5">
              <h4 className="text-sm font-black text-[#24303F]">근거</h4>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          ) : null}
        </div>
      ) : null}

      {/* ── 분석 블록 (기간 라벨 공개, 본문 블러) ── */}
      {!isStudyActionService && !isHealthActionService && !investmentActionableView && primaryAnalysisBlocks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {primaryAnalysisBlocks.map((block) => {
            const opportunities = dedupeAnalysisItems(block.opportunities, block, supplementReferenceSet);
            const risks = dedupeAnalysisItems(block.risks, block, supplementReferenceSet);
            const actionStrategy = dedupeAnalysisItems(block.actionStrategy, block, supplementReferenceSet);

            return (
              <article
                key={`${block.windowLabel}-${block.timeRange}`}
                className="rounded-2xl border border-[#24303F]/10 bg-white p-5"
              >
                <p className="text-xs font-black text-slate-500">
                  {block.windowLabel} · {block.timeRange}
                </p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{block.coreFlow}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.evidence}</p>

                  <div className="mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">주요 기회</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {opportunities.map((item) => (
                          <li key={`op-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">리스크</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {risks.map((item) => (
                          <li key={`risk-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">행동 전략</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {actionStrategy.map((item) => (
                          <li key={`action-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </LockedSectionOverlay>
              </article>
            );
          })}

          {inlineShortRangeBlocks.map((block) => {
            const opportunities = dedupeAnalysisItems(block.opportunities, block, supplementReferenceSet);
            const risks = dedupeAnalysisItems(block.risks, block, supplementReferenceSet);
            const actionStrategy = dedupeAnalysisItems(block.actionStrategy, block, supplementReferenceSet);

            return (
              <article
                key={`inline-short-${block.windowLabel}-${block.timeRange}`}
                className="rounded-2xl border border-[#24303F]/10 bg-white p-5"
              >
                <p className="text-xs font-black text-slate-500">단기 운영(4주/12주)</p>
                <p className="mt-1 text-xs font-black text-slate-500">
                  {block.windowLabel} 쨌 {block.timeRange}
                </p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{block.coreFlow}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.evidence}</p>

                  <div className="mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">주요 기회</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {opportunities.map((item) => (
                          <li key={`inline-short-op-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">리스크</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {risks.map((item) => (
                          <li key={`inline-short-risk-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                      <p className="text-[11px] font-black text-[#24303F]">행동 전략</p>
                      <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                        {actionStrategy.map((item) => (
                          <li key={`inline-short-action-${block.windowLabel}-${item}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </LockedSectionOverlay>
              </article>
            );
          })}
        </div>
      ) : null}

      {isEnergyGuideService && deferredShortRangeBlocks.length > 0 ? (
        <section className="space-y-4">
          <h4 className="text-sm font-black text-[#24303F]">단기 운영(4주/12주)</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {deferredShortRangeBlocks.map((block) => {
              const opportunities = dedupeAnalysisItems(block.opportunities, block, supplementReferenceSet);
              const risks = dedupeAnalysisItems(block.risks, block, supplementReferenceSet);
              const actionStrategy = dedupeAnalysisItems(block.actionStrategy, block, supplementReferenceSet);
              return (
                <article
                  key={`short-${block.windowLabel}-${block.timeRange}`}
                  className="rounded-2xl border border-[#24303F]/10 bg-white p-5"
                >
                  <p className="text-xs font-black text-slate-500">
                    {block.windowLabel} 쨌 {block.timeRange}
                  </p>
                  <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{block.coreFlow}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.evidence}</p>
                    <div className="mt-4 grid grid-cols-1 items-start gap-3 md:grid-cols-3">
                      <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                        <p className="text-[11px] font-black text-[#24303F]">주요 기회</p>
                        <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                          {opportunities.map((item) => (
                            <li key={`short-op-${block.windowLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                        <p className="text-[11px] font-black text-[#24303F]">리스크</p>
                        <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                          {risks.map((item) => (
                            <li key={`short-risk-${block.windowLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                      <section className="h-fit self-start rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                        <p className="text-[11px] font-black text-[#24303F]">행동 전략</p>
                        <ul className="mt-1 space-y-2 text-xs leading-relaxed text-slate-700">
                          {actionStrategy.map((item) => (
                            <li key={`short-action-${block.windowLabel}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </LockedSectionOverlay>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* ── 심화 보강 섹션 (섹션 제목 공개, 내부 카드별 블러) ── */}
      {supplement && !isYearlyCalendarService ? (
        <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">심화 보강 섹션</h4>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-sm font-black text-[#24303F]">심화 인사이트</p>
            <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{supplement.deepInsightSummary}</p>
            </LockedSectionOverlay>
          </article>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">심화 해석 포인트</p>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {supplementDeepDivePoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>

            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">체크 질문</p>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {supplementCheckpointQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">오늘/이번 주 실행</p>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {(isHelperNetworkService ? helperAuxiliaryActions : supplementTodayWeekActions).map((item) => (
                    <li key={`today-week-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>

            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">이번 달/주의 항목</p>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                  {supplementMonthAvoidItems.map((item) => (
                    <li key={`month-avoid-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          </div>

          {supplement.visualExplainers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {supplement.visualExplainers.map((explainer) => (
                <article
                  key={`${explainer.type}-${explainer.title}`}
                  className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">{explainer.type}</p>
                  <p className="mt-1 text-sm font-black text-[#24303F]">{explainer.title}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                      {explainer.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── 신년 종합 카드 (제목 공개, 본문 블러) ── */}
      {isNewYearOverviewServiceId(currentServiceId) && isOverviewPayload(payload) ? (
        <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">7개 핵심 영역 카드</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {payload.focusCards.map((card) => (
              <article key={card.focusId} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">{card.focusLabel}</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{card.conclusion}</p>
                </LockedSectionOverlay>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── 신년 포커스 카드 (제목 공개, 본문 블러) ── */}
      {!isStudyActionService &&
      !isHealthActionService &&
      !investmentActionableView &&
      focusedNewYearCards.length > 0 &&
      focusedSectionTitle ? (
        <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
          <h4 className="text-base font-black text-[#24303F]">{focusedSectionTitle}</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {focusedNewYearCards.map((card) => (
              <article
                key={card.title}
                className={cn(
                  "rounded-2xl border border-[#24303F]/10 bg-white p-5",
                  card.fullWidth ? "md:col-span-2" : "",
                )}
              >
                <h4 className="text-sm font-black text-[#24303F]">{card.title}</h4>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  {card.text ? (
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{card.text}</p>
                  ) : null}
                  {card.items?.length ? (
                    <div className="mt-2 space-y-2">
                      {card.items.map((item, index) => (
                        <p key={`${card.title}-${index}`} className="break-words text-sm leading-relaxed text-slate-700">
                          {item}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {card.faqItems?.length ? (
                    <div className="mt-2 space-y-3">
                      {card.faqItems.map((item, index) => (
                        <div key={`${card.title}-faq-${index}`} className="rounded-xl border border-[#24303F]/10 bg-[#F8FBFF] p-3">
                          <p className="text-[13px] font-black leading-relaxed text-[#24303F]">{item.question}</p>
                          <p className="mt-1 break-words text-sm leading-relaxed text-slate-700">{item.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </LockedSectionOverlay>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {healthActionableView ? (
        <section className="space-y-5 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">건강운 생활관리 리포트 (2026)</h4>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-xs font-black text-slate-500">상단 요약</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{healthActionableView.oneLineDiagnosis}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {healthActionableView.keyPoints.map((keyword, index) => (
                  <span
                    key={`health-keyword-${keyword}-${index}`}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-black text-sky-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <p className="text-[11px] font-black text-amber-700">해석 신뢰도 · {healthActionableView.confidenceLabel}</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-900">{healthActionableView.confidenceDescription}</p>
                {healthActionableView.birthTimeReferenceNote ? (
                  <p className="mt-2 text-xs leading-relaxed text-amber-800">{healthActionableView.birthTimeReferenceNote}</p>
                ) : null}
              </div>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-sm font-black text-[#24303F]">올해 몸에 나타나기 쉬운 패턴</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-700">
                {healthActionableView.bodyPatterns.map((item) => (
                  <li key={`health-pattern-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">분기별 건강 흐름</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {healthActionableView.quarterlyFlowCards.map((item) => (
                <article key={`health-quarter-${item.quarter}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-xs font-black text-slate-500">{item.quarter}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.flowSummary}</p>
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <article className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-[11px] font-black text-rose-900">주의 포인트</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.cautionPoint}</p>
                      </article>
                      <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-[11px] font-black text-emerald-900">추천 행동</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.recommendedAction}</p>
                      </article>
                    </div>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-sm font-black text-amber-900">과부하 신호 체크리스트</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-amber-900">
                {healthActionableView.overloadChecklist.map((item) => (
                  <li key={`health-check-${item}`}>□ {item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-sm font-black text-[#24303F]">회복 우선순위</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ol className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                {healthActionableView.recoveryPriorities.map((item, index) => (
                  <li key={`health-priority-${item}`}>
                    <span className="font-black text-[#24303F]">{index + 1}. </span>
                    {item}
                  </li>
                ))}
              </ol>
            </LockedSectionOverlay>
          </article>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">추천 생활 루틴</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">아침</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {healthActionableView.routineGuide.morning.map((item) => (
                      <li key={`health-morning-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>

              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">낮</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {healthActionableView.routineGuide.daytime.map((item) => (
                      <li key={`health-daytime-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>

              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">저녁</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {healthActionableView.routineGuide.evening.map((item) => (
                      <li key={`health-evening-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>

              <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                <p className="text-sm font-black text-[#24303F]">주간 루틴</p>
                <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                    {healthActionableView.routineGuide.weekly.map((item) => (
                      <li key={`health-weekly-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            </div>
          </section>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-xs font-black text-slate-500">안내</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                {healthActionableView.closingNotices.map((item) => (
                  <li key={`health-notice-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>
        </section>
      ) : null}

      {/* ── 차트 (전체 블러) ── */}
      {wealthBusinessActionableView ? (
        <section className="space-y-5 rounded-3xl border border-[#24303F]/10 bg-white p-6">
          <h4 className="text-base font-black text-[#24303F]">재물/사업 실행 리포트 (2026)</h4>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-xs font-black text-slate-500">한 줄 핵심 진단</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{wealthBusinessActionableView.oneLineDiagnosis}</p>
            </LockedSectionOverlay>
          </article>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">올해의 핵심 포인트 3가지</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {wealthBusinessActionableView.keyPoints.map((item, index) => (
                <article key={`wealth-new-key-point-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-4">
                  <p className="text-xs font-black text-slate-500">핵심 포인트 {index + 1}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{item}</p>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
              <p className="text-sm font-black text-[#24303F]">쉬운 해석 포인트</p>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-700">
                  {wealthBusinessActionableView.easyInterpretationPoints.map((item) => (
                    <li key={`wealth-new-easy-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>

            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">2026년 전체 흐름 요약</p>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{wealthBusinessActionableView.annualFlowSummary}</p>
              </LockedSectionOverlay>
            </article>
          </div>

          <section className="space-y-3">
            <p className="text-sm font-black text-[#24303F]">분기별 흐름</p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {wealthBusinessActionableView.quarterlyFlowCards.map((item) => (
                <article key={`wealth-new-quarter-${item.quarter}`} className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
                  <p className="text-xs font-black text-slate-500">{item.quarter}</p>
                  <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.flowSummary}</p>

                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                      <article className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                        <p className="text-[11px] font-black text-sky-900">핵심 포인트</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.keyPoint}</p>
                      </article>
                      <article className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-[11px] font-black text-rose-900">리스크</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.risk}</p>
                      </article>
                      <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-[11px] font-black text-emerald-900">행동 전략</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-700">{item.actionStrategy}</p>
                      </article>
                    </div>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">수익 흐름 심화 해석</p>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-700">
                  {wealthBusinessActionableView.revenueFlowDeepDive.map((item) => (
                    <li key={`wealth-new-deep-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>

            <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <p className="text-sm font-black text-[#24303F]">사업 관리 포인트</p>
              <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-700">
                  {wealthBusinessActionableView.businessManagementPoints.map((item) => (
                    <li key={`wealth-new-manage-${item}`}>{item}</li>
                  ))}
                </ul>
              </LockedSectionOverlay>
            </article>
          </div>

          <article className="rounded-2xl border border-[#24303F]/10 bg-[#F8FBFF] p-5">
            <p className="text-sm font-black text-[#24303F]">번아웃 방지 전략</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-slate-700">
                {wealthBusinessActionableView.burnoutPreventionStrategies.map((item) => (
                  <li key={`wealth-new-burnout-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <p className="text-sm font-black text-amber-900">체크리스트</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <ul className="mt-2 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-amber-900">
                {wealthBusinessActionableView.actionChecklist.map((item) => (
                  <li key={`wealth-new-check-${item}`}>{item}</li>
                ))}
              </ul>
            </LockedSectionOverlay>
          </article>

          <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
            <p className="text-xs font-black text-slate-500">한 줄 결론</p>
            <LockedSectionOverlay locked={isLocked} label="결제 후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{wealthBusinessActionableView.closingLine}</p>
            </LockedSectionOverlay>
          </article>
        </section>
      ) : null}

      {isWealthPayload(payload) && !isWealthFlowService ? (
        <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
          <SajuTrendChart
            title="자산 흐름 추세"
            data={payload.assetTrendSeries}
            evidence={payload.assetTrendEvidence}
            color="#0f9f7a"
            domain={WEALTH_DOMAIN}
            periodSummary="현재~10년"
            pointSummary="현재 / 1년 후 / 3년 후 / 5년 후 / 10년 후"
            description={WEALTH_DESCRIPTION}
          />
        </LockedSectionOverlay>
      ) : null}

      {isEnergyPayload(payload) ? (
        <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
          <SajuTrendChart
            title="에너지 리듬"
            data={payload.energyRhythmSeries}
            evidence={payload.energyRhythmEvidence}
            color="#6d3ef0"
            domain={ENERGY_DOMAIN}
            periodSummary="1주~12주"
            pointSummary="1주 / 2주 / 3주 / 4주 / 8주 / 12주"
            description={ENERGY_DESCRIPTION}
          />
        </LockedSectionOverlay>
      ) : null}

      {isEnergyGuideService && (actionNow.length > 0 || evidence.length > 0 || energyCurrentYearBlocks.length > 0) ? (
        <section className="space-y-4 rounded-3xl border border-[#24303F]/10 bg-[#F8FBFF] p-6">
          <h4 className="text-base font-black text-[#24303F]">2026 적용 포인트</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {actionNow.length > 0 ? (
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">올해 실행 우선순위</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {actionNow.map((item) => (
                      <li key={`energy-2026-action-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            ) : null}

            {evidence.length > 0 ? (
              <article className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                <p className="text-sm font-black text-[#24303F]">올해 점검 근거</p>
                <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                  <ul className="mt-2 space-y-2.5 text-sm leading-relaxed text-slate-700">
                    {evidence.map((item) => (
                      <li key={`energy-2026-evidence-${item}`}>{item}</li>
                    ))}
                  </ul>
                </LockedSectionOverlay>
              </article>
            ) : null}
          </div>

          {energyCurrentYearBlocks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {energyCurrentYearBlocks.map((block) => (
                <article key={`energy-current-${block.windowLabel}`} className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
                  <p className="text-xs font-black text-slate-500">
                    {block.windowLabel} · {block.timeRange}
                  </p>
                  <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#24303F]">{block.coreFlow}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{block.evidence}</p>
                  </LockedSectionOverlay>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ── fallback sections (제목 공개, 본문 블러) ── */}
      {!payload && sections.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map((section, index) => (
            <article key={`${section.title}-${index}`} className="rounded-2xl border border-[#24303F]/10 bg-white p-5">
              <h4 className="text-sm font-black text-[#24303F]">{section.title}</h4>
              <LockedSectionOverlay locked={isLocked} label="결제후 열람" onClick={() => onUnlockRequest(currentServiceId)}>
                <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-slate-700">{section.interpretation}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{section.advice}</p>
                {section.luckyTip ? <p className="mt-1 text-xs text-slate-500">{section.luckyTip}</p> : null}
              </LockedSectionOverlay>
            </article>
          ))}
        </div>
      ) : null}

      {/* ── 해금 버튼 (payload가 없을 때) ── */}
      {!payload && onUnlockRequest ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-[#24303F]/10 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#24303F]/5 text-[#24303F]">
            <PaywallLockIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-black text-[#24303F]">심층 분석 리포트가 잠겨 있습니다</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
            전문가가 분석한 {getServiceTitleById(currentServiceId)}의 <br /> 모든 내용을 확인하시려면 해금이 필요합니다.
          </p>
          <button
            onClick={() => onUnlockRequest(currentServiceId)}
            className="mt-6 flex items-center gap-2 rounded-full bg-[#24303F] px-10 py-4 text-base font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            지금 바로 리포트 해금하기
          </button>
        </div>
      ) : null}
    </section>
  );
};
