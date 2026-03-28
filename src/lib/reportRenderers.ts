import { SajuAnalysisServiceId, SajuReportPayloadMap } from "@/types/result";

type RendererOutput = {
  coreQuestion: string;
  signatureTitle: string;
  signatureBody: string;
  sections: Array<{ title: string; items: string[] }>;
};

export type ServiceRenderer<K extends SajuAnalysisServiceId> = (payload: SajuReportPayloadMap[K]) => RendererOutput;

export type RendererRegistry = {
  [K in SajuAnalysisServiceId]: ServiceRenderer<K>;
};

const compactItems = (items: Array<string | undefined | null>): string[] =>
  items
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

const uniqueItems = (items: Array<string | undefined | null>): string[] => Array.from(new Set(compactItems(items)));

const YEAR_PATTERN = /(19|20|21)\d{2}/u;

const parseYear = (value: unknown): number | null => {
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

const resolveYearlyCalendarYear = (
  payload: SajuReportPayloadMap["saju-yearly-action-calendar"],
): number | null => {
  const payloadWithOptionalYear = payload as SajuReportPayloadMap["saju-yearly-action-calendar"] & {
    targetYear?: number | string;
  };

  const explicitYear = parseYear(payloadWithOptionalYear.targetYear);
  if (explicitYear !== null) {
    return explicitYear;
  }

  const candidates = [
    payload.oneLineTotalReview,
    payload.currentLifeFlow,
    payload.meaningOfThisYear,
    payload.yearToLifeBridge,
    ...payload.quarterlyGoals,
    ...payload.riskCalendar,
    ...payload.quarterThemes,
    ...payload.monthlyActions,
    ...(payload.quarterNarratives ?? []).flatMap((item) => [item.quarter, item.meaning, item.focus, item.caution]),
  ];

  for (const candidate of candidates) {
    const year = parseYear(candidate);
    if (year !== null) {
      return year;
    }
  }

  return null;
};

const toDaeunRoadmapItems = (payload: SajuReportPayloadMap["saju-daeun-shift"]): string[] => {
  const fallbackRoadmap = payload.analysisBlocks.map((block, index) => ({
    phaseLabel: block.windowLabel || `전환 단계 ${index + 1}`,
    ageRange: "연령 정보 기준 자동 보정",
    yearRange: block.timeRange,
    coreFlow: block.coreFlow,
    evidence: block.evidence,
  }));
  const source =
    Array.isArray((payload as { phaseRoadmap?: unknown }).phaseRoadmap) &&
    (payload as {
      phaseRoadmap?: Array<{
        phaseLabel?: string;
        ageRange?: string;
        yearRange?: string;
        coreFlow?: string;
        evidence?: string;
      }>;
    }).phaseRoadmap
      ? (payload as {
          phaseRoadmap: Array<{
            phaseLabel?: string;
            ageRange?: string;
            yearRange?: string;
            coreFlow?: string;
            evidence?: string;
          }>;
        }).phaseRoadmap
      : fallbackRoadmap;

  return source.map((phase, index) => {
    const fallback = fallbackRoadmap[index] ?? fallbackRoadmap[fallbackRoadmap.length - 1];
    const phaseLabel = phase.phaseLabel?.trim() || fallback?.phaseLabel || `전환 단계 ${index + 1}`;
    const yearRange = phase.yearRange?.trim() || fallback?.yearRange || "향후 구간";
    const ageRange = phase.ageRange?.trim() || fallback?.ageRange || "연령 정보 기준 자동 보정";
    const coreFlow = phase.coreFlow?.trim() || fallback?.coreFlow || payload.transitionSignal;
    return `${phaseLabel} (${yearRange} / ${ageRange}): ${coreFlow}`;
  });
};

const CAREER_STAGE_FALLBACKS = [
  { stageId: "build-up", label: "초기 축적기", timeRange: "0~2년" },
  { stageId: "transition", label: "전환기", timeRange: "3~5년" },
  { stageId: "expansion", label: "확장기", timeRange: "6~10년" },
  { stageId: "stabilization", label: "안정화기", timeRange: "10년+" },
] as const;

const toCareerStageFlowItems = (payload: SajuReportPayloadMap["saju-career-timing"]): string[] => {
  const fromStageFlow = Array.isArray(payload.stageFlow) ? payload.stageFlow : [];
  const stageById = new Map(fromStageFlow.map((stage) => [stage.stageId, stage] as const));

  return CAREER_STAGE_FALLBACKS.map((fallbackStage, index) => {
    const block = payload.analysisBlocks[index];
    const source = stageById.get(fallbackStage.stageId) ?? fromStageFlow[index];
    const label = source?.label?.trim() || block?.windowLabel || fallbackStage.label;
    const timeRange = source?.timeRange?.trim() || block?.timeRange || fallbackStage.timeRange;
    const coreFlow = source?.coreFlow?.trim() || block?.coreFlow || payload.careerArcSummary || payload.careerWindow;
    return `${label} (${timeRange}): ${coreFlow}`;
  });
};

const toCareerTransitionSignals = (payload: SajuReportPayloadMap["saju-career-timing"]): string[] => {
  const fromStage = Array.isArray(payload.stageFlow) ? payload.stageFlow.map((stage) => stage.transitionSignal) : [];
  return uniqueItems([...fromStage, payload.transitionSignal, ...payload.decisionCriteria]).slice(0, 5);
};

const toCareerShortTermActions = (payload: SajuReportPayloadMap["saju-career-timing"]): string[] => {
  const protocol = payload.supplement?.executionProtocol;
  if (protocol) {
    return uniqueItems([...protocol.today, ...protocol.thisWeek, ...protocol.thisMonth, ...protocol.avoid]).slice(0, 5);
  }
  return uniqueItems(payload.executionChecklist).slice(0, 5);
};

const WEALTH_PHASE_ORDER = ["accumulation", "expansion", "defense", "volatility"] as const;

const toWealthPhaseLabel = (phaseType: string): string => {
  switch (phaseType) {
    case "accumulation":
      return "축적기";
    case "expansion":
      return "확장기";
    case "defense":
      return "방어기";
    case "volatility":
      return "변동기";
    default:
      return "단계";
  }
};

const toWealthLifecycleItems = (payload: SajuReportPayloadMap["saju-wealth-flow"]): string[] => {
  const fromPayload = Array.isArray(payload.wealthLifecycleStages) ? payload.wealthLifecycleStages : [];
  if (fromPayload.length === 0) {
    return payload.analysisBlocks.map((block, index) => `${index + 1}단계 (${block.timeRange}): ${block.coreFlow}`).slice(0, 4);
  }

  const byPhaseType = new Map(fromPayload.map((stage) => [stage.phaseType, stage] as const));
  return WEALTH_PHASE_ORDER.map((phaseType, index) => {
    const source = byPhaseType.get(phaseType) ?? fromPayload[index];
    if (!source) {
      return `${index + 1}단계: 인생 자산 사이클 해석을 보강하세요.`;
    }
    const label = toWealthPhaseLabel(source.phaseType);
    return `${label} (${source.timeRange} / ${source.yearRange}): ${source.coreObjective}`;
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

const toWealthTrendEvidenceItems = (payload: SajuReportPayloadMap["saju-wealth-flow"]): string[] => {
  const evidence = payload.assetTrendEvidence ?? [];
  if (evidence.length > 0) {
    return evidence.map((point) => `${point.label} (${resolveWealthCheckpointStage(point.label)}): ${point.interpretation}`);
  }
  return payload.assetTrendSeries.map((point) => `${point.label} (${resolveWealthCheckpointStage(point.label)}): 지수 ${point.value}`);
};

const toWealthOperatingRules = (payload: SajuReportPayloadMap["saju-wealth-flow"]): string[] => {
  const fromLifecycle = (payload.wealthLifecycleStages ?? []).flatMap((stage) => stage.operatingRules);
  return uniqueItems([...fromLifecycle, ...payload.assetRules, ...payload.accumulateVsExpand]).slice(0, 8);
};

const HELPER_PHASE_FALLBACKS = [
  { phaseLabel: "관계 기반 정비기", timeRange: "0~2년" },
  { phaseLabel: "협업 확장기", timeRange: "3~5년" },
  { phaseLabel: "귀인 유입기", timeRange: "6~10년" },
  { phaseLabel: "관계 자산 전수기", timeRange: "10년+" },
] as const;

const toHelperPhaseRoadmapItems = (payload: SajuReportPayloadMap["saju-helper-network"]): string[] => {
  const source = Array.isArray(payload.phaseRoadmap) ? payload.phaseRoadmap : [];
  return HELPER_PHASE_FALLBACKS.map((fallbackPhase, index) => {
    const phase = source[index];
    const phaseLabel = phase?.phaseLabel?.trim() || fallbackPhase.phaseLabel;
    const timeRange = phase?.timeRange?.trim() || fallbackPhase.timeRange;
    const expansion =
      phase?.relationshipExpansion?.trim() ||
      payload.relationExpansionVsEntanglement[index] ||
      payload.analysisBlocks[index]?.coreFlow ||
      payload.helperMap;
    return `${phaseLabel} (${timeRange}): ${expansion}`;
  });
};

const toHelperCollaborationRules = (payload: SajuReportPayloadMap["saju-helper-network"]): string[] => {
  const fromPhase = Array.isArray(payload.phaseRoadmap) ? payload.phaseRoadmap.map((phase) => phase.collaborationFlow) : [];
  return uniqueItems([...fromPhase, ...payload.networkGuide, ...payload.relationLayers]).slice(0, 6);
};

const toHelperMentorSignals = (payload: SajuReportPayloadMap["saju-helper-network"]): string[] => {
  const fromPhase = Array.isArray(payload.phaseRoadmap) ? payload.phaseRoadmap.map((phase) => phase.mentorInfluxSignal) : [];
  const horizon = Array.isArray(payload.longHorizonDirection) ? payload.longHorizonDirection : [];
  return uniqueItems([...fromPhase, ...payload.helperEntryWindows, ...horizon]).slice(0, 6);
};

const toHelperGuardPatterns = (payload: SajuReportPayloadMap["saju-helper-network"]): string[] => {
  const fromPhase = Array.isArray(payload.phaseRoadmap) ? payload.phaseRoadmap.map((phase) => phase.guardPattern) : [];
  return uniqueItems([...fromPhase, ...payload.conflictLoops, ...payload.conflictPatterns]).slice(0, 6);
};

const toHelperAuxiliaryActions = (payload: SajuReportPayloadMap["saju-helper-network"]): string[] => {
  const fromPhase = Array.isArray(payload.phaseRoadmap)
    ? payload.phaseRoadmap.flatMap((phase) => phase.actionStrategy ?? [])
    : [];
  const protocol = payload.supplement?.executionProtocol;
  if (protocol) {
    return uniqueItems([...protocol.today, ...protocol.thisWeek, ...fromPhase, ...payload.actionNow]).slice(0, 5);
  }
  return uniqueItems([...payload.actionNow, ...fromPhase]).slice(0, 5);
};

export const REPORT_RENDERER_REGISTRY: RendererRegistry = {
  "saju-lifetime-roadmap": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "장기 흐름",
    signatureBody: payload.longTermFlow,
    sections: [
      { title: "중요 변화", items: payload.pivotMoments },
      { title: "10년 전략", items: payload.tenYearStrategy },
      { title: "인생 단계 변화", items: payload.stageTransitions },
      { title: "성숙·확장·정리", items: payload.maturityExpansionCleanup },
      { title: "지금 액션", items: payload.actionNow },
    ],
  }),
  "saju-daeun-shift": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "전환 감지",
    signatureBody: payload.transitionSignal,
    sections: [
      {
        title: "전환 신호",
        items: uniqueItems([
          payload.transitionSignal,
          ...payload.transitionSignals,
          ...payload.changePoints,
          ...payload.readinessActions,
        ]).slice(0, 5),
      },
      {
        title: "단계별 로드맵",
        items: toDaeunRoadmapItems(payload),
      },
      {
        title: "장기 방향",
        items: uniqueItems(
          payload.longHorizonDirection.length > 0
            ? payload.longHorizonDirection
            : [
                "1~2년 전환 직후 기준 재정렬을 우선하세요.",
                "3~5년 운영 기준 반복으로 안정적 성과 구조를 만드세요.",
                "6~10년 정착 기준 위에서 선택적 확장을 추진하세요.",
              ],
        ).slice(0, 3),
      },
      { title: "90일 일정", items: uniqueItems(payload.ninetyDayActions).slice(0, 4) },
      { title: "전환 전/중/후 비교", items: uniqueItems(payload.preAtPostDiff).slice(0, 3) },
      { title: "회피 시나리오", items: uniqueItems(payload.avoidanceScenario).slice(0, 4) },
    ],
  }),
  "saju-career-timing": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "커리어 장기축",
    signatureBody: payload.careerArcSummary ?? payload.careerWindow,
    sections: [
      { title: "커리어 장기축 요약", items: uniqueItems([payload.careerArcSummary, payload.careerWindow]).slice(0, 2) },
      { title: "4단계 흐름", items: toCareerStageFlowItems(payload) },
      { title: "단계 전환 신호", items: toCareerTransitionSignals(payload) },
      {
        title: "결정 매트릭스",
        items: uniqueItems([
          ...payload.decideNow.map((item) => `지금 결정: ${item}`),
          ...payload.deferNow.map((item) => `지금 보류: ${item}`),
          ...payload.decisionCriteria.map((item) => `판단 기준: ${item}`),
        ]).slice(0, 6),
      },
      {
        title: "현재 연도 적용 포인트",
        items: uniqueItems([
          payload.currentYearFocus,
          `${new Date().getFullYear()}년은 장기 단계 전략을 점검하는 보조 연도입니다.`,
        ]).slice(0, 2),
      },
      { title: "단기 실행", items: toCareerShortTermActions(payload) },
    ],
  }),
  "saju-wealth-flow": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "인생 자산 사이클",
    signatureBody: payload.cashflowMap,
    sections: [
      { title: "인생 자산 사이클 4단계", items: toWealthLifecycleItems(payload) },
      { title: "10년 추세(근거)", items: toWealthTrendEvidenceItems(payload) },
      { title: "구간별 운영 규칙", items: toWealthOperatingRules(payload) },
      { title: "현재 구간 실행", items: payload.actionNow },
      { title: "수입 구조", items: payload.incomeStructure },
      { title: "지출 경향", items: payload.spendingPatterns },
      { title: "금지 판단", items: payload.financialNoGo },
    ],
  }),
  "saju-helper-network": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "생애 관계 자산 구조",
    signatureBody: payload.helperMap,
    sections: [
      { title: "인생 단계별 관계 확장/정리", items: toHelperPhaseRoadmapItems(payload) },
      { title: "협업 운 운영 기준", items: toHelperCollaborationRules(payload) },
      { title: "멘토·귀인 유입 시그널", items: toHelperMentorSignals(payload) },
      { title: "경계 패턴", items: toHelperGuardPatterns(payload) },
      { title: "현재연도 실행 포인트(보조)", items: toHelperAuxiliaryActions(payload) },
    ],
  }),
  "saju-energy-balance": (payload) => ({
    coreQuestion: payload.coreQuestion,
    signatureTitle: "에너지 곡선",
    signatureBody: payload.energyCurve,
    sections: [
      { title: "몰입 방식", items: payload.immersionMode },
      { title: "소진 패턴", items: payload.burnoutSignals },
      { title: "무리 신호", items: payload.overloadAlerts },
      { title: "보완 습관", items: payload.habitTweaks },
      { title: "회복 루틴", items: payload.recoveryRoutines },
    ],
  }),
  "saju-yearly-action-calendar": (payload) => {
    const yearlyCalendarYear = resolveYearlyCalendarYear(payload);
    const yearlyQuarterPrefix = yearlyCalendarYear ? `${yearlyCalendarYear}년 ` : "";
    return {
      coreQuestion: payload.coreQuestion,
      signatureTitle: "한 줄 총평",
      signatureBody: payload.oneLineTotalReview,
      sections: [
        { title: "한 줄 총평", items: uniqueItems([payload.oneLineTotalReview]).slice(0, 1) },
        { title: "지금 인생의 큰 흐름", items: uniqueItems([payload.currentLifeFlow, payload.yearToLifeBridge]).slice(0, 2) },
        { title: "올해의 의미", items: uniqueItems([payload.meaningOfThisYear]).slice(0, 1) },
        {
          title: "올해 이후 10년의 흐름",
          items: (payload.tenYearFlow ?? []).map(
            (item) => `${item.periodLabel} (${item.phaseLabel}): ${item.interpretation}`,
          ),
        },
        {
          title: "장기 패턴 해석",
          items: uniqueItems([
            ...(payload.longPatternInterpretation ?? []),
            ...payload.lifecycleExecutionPattern,
            ...payload.longPracticeStrategy,
          ]).slice(0, 8),
        },
        {
          title: "올해의 핵심 테마 3가지",
          items: (payload.keyThemes ?? []).map((item) => `${item.theme}: ${item.interpretation}`).slice(0, 3),
        },
        {
          title: yearlyCalendarYear
            ? `분기별 실행 캘린더 (${yearlyCalendarYear}년 기준)`
            : "분기별 실행 캘린더",
          items: uniqueItems([
            ...(payload.quarterNarratives ?? []).map(
              (item) => `${yearlyQuarterPrefix}${item.quarter} ${item.role} | 의미: ${item.meaning} | 집중: ${item.focus} | 주의: ${item.caution}`,
            ),
            ...payload.quarterlyGoals,
            ...payload.monthlyActions,
          ]).slice(0, 16),
        },
        { title: "올해가 끝났을 때 남아야 할 것", items: uniqueItems([payload.yearEndResidue]).slice(0, 1) },
        { title: "한 줄 결론", items: uniqueItems([payload.closingLine]).slice(0, 1) },
      ],
    };
  },
};
