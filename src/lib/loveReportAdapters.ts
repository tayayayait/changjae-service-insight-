import {
  AnyLoveScoreSet,
  CoupleReportInsights,
  CrushReunionInsights,
  FuturePartnerInsights,
  LegacyLoveReportFull,
  LegacyLoveReportPreview,
  LegacyLoveScoreSet,
  LoveActionRoadmap,
  LoveLockedSectionSummaryV2,
  LoveQuickCounsel,
  LoveReportFullV2,
  LoveReportFullV3,
  LoveReportLayout,
  LoveReportRecord,
  LoveReportSection,
  LoveReportSectionV2,
  LoveReportVersion,
  LoveReportPreviewV2,
  LoveReportPreviewV3,
  LoveScoreNarrative,
  LoveScoreSet,
} from "@/types/love";

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, Math.round(value)));

const EMPTY_SCORE_SET: LoveScoreSet = {
  overall: 0,
  pull: 0,
  pace: 0,
  alignment: 0,
  repair: 0,
  timing: 0,
};

const SCORE_AXIS_LABEL: Record<keyof LoveScoreSet, string> = {
  overall: "전체 흐름",
  pull: "끌림",
  pace: "속도",
  alignment: "합의력",
  repair: "회복력",
  timing: "타이밍",
};

const SECTION_NAV_LABEL_V2: Record<LoveReportSectionV2["type"], string> = {
  opening: "핵심 진단",
  "self-pattern": "내 패턴",
  dynamic: "관계 동학",
  scenario: "상황 흐름",
  prescription: "행동 처방",
  evidence: "근거 노트",
};

const SECTION_ID_V2: Record<LoveReportSectionV2["type"], string> = {
  opening: "opening",
  "self-pattern": "self-pattern",
  dynamic: "dynamic",
  scenario: "scenario",
  prescription: "prescription",
  evidence: "evidence-note",
};

const layoutByService: Record<LoveReportRecord["serviceType"], LoveReportLayout> = {
  "future-partner": "future-partner-v3",
  "couple-report": "couple-report-v3",
  "crush-reunion": "crush-reunion-v3",
};

const quickCounselLabelByService: Record<LoveReportRecord["serviceType"], string> = {
  "future-partner": "인연 준비도",
  "couple-report": "관계 온도",
  "crush-reunion": "재접촉 위험도",
};

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?다요])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

const ensureMinItems = (items: string[], minCount: number, fallback: string): string[] => {
  const next = items.filter(Boolean);
  while (next.length < minCount) {
    next.push(fallback);
  }
  return next;
};

export const isLegacyScoreSet = (
  scoreSet?: AnyLoveScoreSet | null,
): scoreSet is LegacyLoveScoreSet => {
  return Boolean(scoreSet && "emotion" in scoreSet);
};

export const normalizeLegacyScoreSet = (scoreSet: LegacyLoveScoreSet): LoveScoreSet => {
  return {
    overall: clamp(scoreSet.overall),
    pull: clamp(scoreSet.emotion),
    pace: clamp((scoreSet.emotion + scoreSet.timingConfidence) / 2),
    alignment: clamp((scoreSet.communication + scoreSet.stability) / 2),
    repair: clamp((scoreSet.communication + scoreSet.longTerm) / 2),
    timing: clamp(scoreSet.timingConfidence, 20, 100),
  };
};

export const normalizeLoveScoreSet = (scoreSet?: AnyLoveScoreSet | null): LoveScoreSet => {
  if (!scoreSet) {
    return EMPTY_SCORE_SET;
  }

  if (isLegacyScoreSet(scoreSet)) {
    return normalizeLegacyScoreSet(scoreSet);
  }

  return {
    overall: clamp(scoreSet.overall),
    pull: clamp(scoreSet.pull),
    pace: clamp(scoreSet.pace),
    alignment: clamp(scoreSet.alignment),
    repair: clamp(scoreSet.repair),
    timing: clamp(scoreSet.timing, 20, 100),
  };
};

export const isLegacyLovePreview = (
  preview: LoveReportRecord["preview"] | undefined,
): preview is LegacyLoveReportPreview => {
  return Boolean(preview && "openChapter" in preview);
};

export const isLoveReportPreviewV3 = (
  preview: LoveReportRecord["preview"] | undefined,
): preview is LoveReportPreviewV3 => {
  return Boolean(preview && "quickCounsel" in preview && "reportLayout" in preview);
};

export const isLoveReportPreviewV2 = (
  preview: LoveReportRecord["preview"] | undefined,
): preview is LoveReportPreviewV2 => {
  return Boolean(
    preview &&
      "relationshipTemperature" in preview &&
      "immediateAction" in preview &&
      !("quickCounsel" in preview),
  );
};

export const isLegacyLoveFullReport = (
  fullReport: LoveReportRecord["fullReport"] | undefined,
): fullReport is LegacyLoveReportFull => {
  return Boolean(fullReport && "chapters" in fullReport);
};

export const isLoveReportFullV3 = (
  fullReport: LoveReportRecord["fullReport"] | undefined,
): fullReport is LoveReportFullV3 => {
  return Boolean(fullReport && "serviceInsights" in fullReport && "actionRoadmap" in fullReport);
};

export const isLoveReportFullV2 = (
  fullReport: LoveReportRecord["fullReport"] | undefined,
): fullReport is LoveReportFullV2 => {
  return Boolean(
    fullReport &&
      "sections" in fullReport &&
      "actionPlan" in fullReport &&
      !("serviceInsights" in fullReport),
  );
};

export const inferLoveReportVersion = (record: Partial<LoveReportRecord>): LoveReportVersion => {
  if (record.reportVersion) {
    return record.reportVersion;
  }

  if (isLegacyLovePreview(record.preview) || isLegacyLoveFullReport(record.fullReport)) {
    return "v1-story";
  }

  if (isLoveReportPreviewV3(record.preview) || isLoveReportFullV3(record.fullReport)) {
    return "v3-differentiated";
  }

  return "v2-counsel";
};

const buildScoreNarrativeFallback = (scoreSet: LoveScoreSet): LoveScoreNarrative[] => {
  const axes: Array<keyof LoveScoreSet> = [
    "overall",
    "pull",
    "pace",
    "alignment",
    "repair",
    "timing",
  ];

  return axes.map((axis) => ({
    axis,
    label: SCORE_AXIS_LABEL[axis],
    score: clamp(scoreSet[axis]),
    interpretation: `${SCORE_AXIS_LABEL[axis]} 축은 현재 관계에서 우선 조정할 영역을 보여줍니다.`,
    why: `입력된 맥락과 사주 지표를 기준으로 ${SCORE_AXIS_LABEL[axis]} 점수를 계산했습니다.`,
  }));
};

const toV3Section = (section: LoveReportSectionV2, index: number): LoveReportSection => {
  const analysisParagraphs = ensureMinItems(
    splitSentences(section.reason).slice(0, 3),
    2,
    "기존 리포트는 단일 사유 중심으로 저장되어 있어 보수적으로 해석했습니다.",
  ).slice(0, 3);

  const interpretationPoints = ensureMinItems(
    [section.summary, section.conclusion, ...splitSentences(section.reason)]
      .map((item) => item.trim())
      .filter(Boolean),
    3,
    "해석 정확도를 높이려면 최신 맥락 답변을 추가해 재분석하세요.",
  ).slice(0, 4);

  const actionItems = ensureMinItems(
    section.actionItems.filter(Boolean),
    3,
    "지금 상황을 사실과 감정으로 분리해 기록하세요.",
  );

  return {
    id: SECTION_ID_V2[section.type] ?? `legacy-${index}`,
    navLabel: SECTION_NAV_LABEL_V2[section.type] ?? `legacy-${index}`,
    title: section.title,
    coreQuestion: section.question,
    verdict: section.conclusion,
    analysisParagraphs,
    interpretationPoints,
    actionTitle: section.actionLabel || "지금 실행할 행동",
    actionItems,
    warningNote: section.counselorNote || "한 번의 반응을 전체 결론으로 확대하지 마세요.",
  };
};

const adaptQuickCounsel = (preview: LoveReportPreviewV2): LoveQuickCounsel => ({
  diagnosis: preview.openSection.conclusion,
  temperatureLabel: quickCounselLabelByService[preview.serviceType],
  temperatureText: preview.relationshipTemperature,
  immediateAction: preview.immediateAction,
});

const mapLockedV2ToV3 = (
  sections: LoveLockedSectionSummaryV2[],
): LoveReportPreviewV3["lockedSectionSummaries"] => {
  return sections.map((section, index) => ({
    id: SECTION_ID_V2[section.type] ?? `locked-${index}`,
    title: section.title,
    teaser: section.teaser,
    benefit: section.benefit,
  }));
};

const buildFallbackInsights = (
  serviceType: LoveReportRecord["serviceType"],
  preview: LoveReportPreviewV2,
  fullReport?: LoveReportFullV2,
) => {
  if (serviceType === "future-partner") {
    const partnerProfile = preview.partnerProfile ?? fullReport?.partnerProfile ?? {
      matchKeywords: ["안정감", "생활 합의력"],
      avoidKeywords: ["기준 불명확", "일관성 부족"],
      idealDescription: "가치관과 생활 감각이 맞는 상대를 우선적으로 보세요.",
    };
    const insights: FuturePartnerInsights = {
      kind: "future-partner",
      partnerProfile,
      meetingChannels: [preview.scenarioHint, "지인 기반 연결", "일상 동선 안의 반복 접점"].filter(Boolean),
      greenFlags: ensureMinItems(
        partnerProfile.matchKeywords,
        3,
        "초반부터 생활 리듬과 기준을 숨기지 않습니다.",
      ),
      redFlags: ensureMinItems(
        partnerProfile.avoidKeywords,
        3,
        "말과 행동의 일관성이 낮다면 초기 호감과 분리해 보세요.",
      ),
      selfCheckCriteria: ensureMinItems(
        fullReport?.actionPlan ?? [],
        3,
        "호감보다 기준이 먼저인지 스스로 점검하세요.",
      ),
    };
    return insights;
  }

  if (serviceType === "couple-report") {
    const insights: CoupleReportInsights = {
      kind: "couple-report",
      conflictTriggers: ensureMinItems(
        preview.lockedSectionSummaries.map((item) => item.teaser),
        3,
        "반복 충돌 주제를 한 번에 하나씩만 다루세요.",
      ),
      repairRituals: ensureMinItems(
        fullReport?.actionPlan ?? [],
        3,
        "대화 전 감정 정리 시간을 먼저 확보하세요.",
      ),
      agreementChecklist: ensureMinItems(
        fullReport?.actionPlan ?? [],
        3,
        "연락 빈도와 생활 리듬 기준부터 합의하세요.",
      ),
      doNotSay: ensureMinItems(
        fullReport?.avoidList ?? [],
        3,
        "상대를 단정하는 문장은 금지하세요.",
      ),
      recoverySignals: ensureMinItems(
        fullReport?.confidenceNotes ?? [],
        3,
        "재충돌 없이 다음 대화로 넘어가면 회복 신호입니다.",
      ),
    };
    return insights;
  }

  const scoreSet = normalizeLoveScoreSet(preview.scoreSet);
  const chanceVerdict: CrushReunionInsights["chanceVerdict"] =
    scoreSet.overall >= 70 ? "가능성 있음" : scoreSet.overall >= 45 ? "제한적" : "확실한 정보 없음";

  const insights: CrushReunionInsights = {
    kind: "crush-reunion",
    chanceVerdict,
    positiveSignals: ensureMinItems(
      preview.lockedSectionSummaries.map((item) => item.teaser),
      3,
      "응답이 완전히 끊기지 않았다면 제한적 창은 남아 있습니다.",
    ),
    blockingSignals: ensureMinItems(
      fullReport?.avoidList ?? [],
      3,
      "무응답 상태에서 반복 연락은 손실을 키웁니다.",
    ),
    contactWindow: preview.scenarioHint,
    stopLossRules: ensureMinItems(
      fullReport?.avoidList ?? [],
      3,
      "두 번 이상 일방향 연락은 중단하세요.",
    ),
    contactScripts: ensureMinItems(
      fullReport?.conversationPrompts ?? [],
      3,
      "답을 강요하려는 의도는 없고 안부만 묻고 싶어.",
    ),
  };
  return insights;
};

export const adaptV2PreviewToV3 = (preview: LoveReportPreviewV2): LoveReportPreviewV3 => {
  const openSection = toV3Section(preview.openSection, 0);
  return {
    headline: preview.headline,
    summary: preview.summary,
    serviceType: preview.serviceType,
    reportLayout: layoutByService[preview.serviceType],
    scoreSet: normalizeLoveScoreSet(preview.scoreSet),
    quickCounsel: adaptQuickCounsel(preview),
    previewHighlights: [preview.scenarioHint, ...preview.lockedSectionSummaries.map((item) => item.benefit)]
      .filter(Boolean)
      .slice(0, 3),
    openSection,
    lockedSectionSummaries: mapLockedV2ToV3(preview.lockedSectionSummaries),
    ctaReason: preview.ctaReason,
    confidenceSummary: preview.confidenceSummary,
    nextRefreshAt: preview.nextRefreshAt,
  };
};

export const adaptV2FullToV3 = (
  preview: LoveReportPreviewV2,
  fullReport: LoveReportFullV2,
): LoveReportFullV3 => {
  const scoreSet = normalizeLoveScoreSet(fullReport.scoreSet);
  const actionRoadmap: LoveActionRoadmap = {
    now: ensureMinItems(fullReport.actionPlan.slice(0, 2), 2, preview.immediateAction),
    within7Days: ensureMinItems(fullReport.actionPlan.slice(0, 3), 3, "같은 주제를 반복 기록하고 반응 변화를 확인하세요."),
    within30Days: ensureMinItems(
      [preview.scenarioHint, ...fullReport.actionPlan.slice(0, 2)].filter(Boolean),
      3,
      "한 달 단위로 행동 기준을 재점검하세요.",
    ),
  };

  return {
    headline: fullReport.headline,
    summary: fullReport.summary,
    serviceType: fullReport.serviceType,
    reportLayout: layoutByService[fullReport.serviceType],
    scoreSet,
    sections: fullReport.sections.map((section, index) => toV3Section(section, index)),
    scoreNarratives: buildScoreNarrativeFallback(scoreSet),
    actionRoadmap,
    serviceInsights: buildFallbackInsights(fullReport.serviceType, preview, fullReport),
    conversationPrompts: ensureMinItems(
      fullReport.conversationPrompts,
      3,
      "지금은 내 감정보다 상황을 먼저 정리해보고 싶어.",
    ),
    avoidList: ensureMinItems(fullReport.avoidList, 3, "한 번의 반응으로 결론을 고정하지 마세요."),
    confidenceNotes: ensureMinItems(
      fullReport.confidenceNotes,
      3,
      "입력 맥락이 바뀌면 해석 우선순위도 달라집니다.",
    ),
    nextRefreshAt: fullReport.nextRefreshAt,
  };
};

export const getV3PreviewFromRecord = (
  record: LoveReportRecord,
): LoveReportPreviewV3 | null => {
  if (isLoveReportPreviewV3(record.preview)) {
    return record.preview;
  }

  if (isLoveReportPreviewV2(record.preview)) {
    return adaptV2PreviewToV3(record.preview);
  }

  return null;
};

export const getV3FullFromRecord = (
  record: LoveReportRecord,
  previewV3: LoveReportPreviewV3,
): LoveReportFullV3 | undefined => {
  if (!record.fullReport) {
    return undefined;
  }

  if (isLoveReportFullV3(record.fullReport)) {
    return record.fullReport;
  }

  if (isLoveReportFullV2(record.fullReport) && isLoveReportPreviewV2(record.preview)) {
    return adaptV2FullToV3(record.preview, record.fullReport);
  }

  const scoreSet = normalizeLoveScoreSet(previewV3.scoreSet);
  return {
    headline: previewV3.headline,
    summary: previewV3.summary,
    serviceType: previewV3.serviceType,
    reportLayout: previewV3.reportLayout,
    scoreSet,
    sections: [previewV3.openSection],
    scoreNarratives: buildScoreNarrativeFallback(scoreSet),
    actionRoadmap: {
      now: [previewV3.quickCounsel.immediateAction],
      within7Days: ensureMinItems(previewV3.previewHighlights.slice(0, 2), 2, "핵심 신호를 기록하세요."),
      within30Days: ensureMinItems(
        [previewV3.quickCounsel.immediateAction, ...previewV3.previewHighlights.slice(0, 2)],
        3,
        "한 달 단위로 행동 조정을 반복하세요.",
      ),
    },
    serviceInsights: buildFallbackInsights(
      record.serviceType,
      {
        headline: previewV3.headline,
        summary: previewV3.summary,
        serviceType: previewV3.serviceType,
        scoreSet,
        relationshipTemperature: previewV3.quickCounsel.temperatureText,
        immediateAction: previewV3.quickCounsel.immediateAction,
        scenarioHint: previewV3.previewHighlights[0] ?? "핵심 신호를 관찰하며 속도를 조절하세요.",
        openSection: {
          type: "opening",
          title: previewV3.openSection.title,
          question: previewV3.openSection.coreQuestion,
          summary: previewV3.openSection.verdict,
          conclusion: previewV3.openSection.verdict,
          reason: previewV3.openSection.analysisParagraphs.join(" "),
          actionLabel: previewV3.openSection.actionTitle,
          actionItems: previewV3.openSection.actionItems,
          counselorNote: previewV3.openSection.warningNote,
        },
        lockedSectionSummaries: previewV3.lockedSectionSummaries.map((item) => ({
          type: "scenario",
          title: item.title,
          teaser: item.teaser,
          benefit: item.benefit,
        })),
        ctaReason: previewV3.ctaReason,
        confidenceSummary: previewV3.confidenceSummary,
        nextRefreshAt: previewV3.nextRefreshAt,
      },
      undefined,
    ),
    conversationPrompts: [],
    avoidList: [],
    confidenceNotes: [previewV3.confidenceSummary],
    nextRefreshAt: previewV3.nextRefreshAt,
  };
};
