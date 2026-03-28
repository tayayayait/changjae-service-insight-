import {
  AstrologyBirthReportResult,
  AstrologyCuriosityInsights,
  AstrologyDeepData,
  AstrologyExclusiveInsights,
  AstrologyPlanet,
  AstrologyReportChapter,
  AstrologyReportChapterId,
  AstrologyRequest,
  AstrologyResult,
  AstrologyUserReportChapterId,
} from "@/types/result";

type QuestionId = "love" | "work" | "money" | "recovery" | "luck";
type LifePatternKey = "relationship" | "work" | "money" | "recovery";
type LegacyQuestionId = "love" | "work" | "stress" | "luck";

const USER_REPORT_CHAPTER_ORDER: AstrologyUserReportChapterId[] = [
  "temperament",
  "love-relationship",
  "work-career",
  "money-wealth",
  "health-rhythm",
  "near-term-flow",
  "action-now",
];

const LEGACY_TO_USER_CHAPTER_ID_MAP: Record<
  Extract<AstrologyReportChapterId, "personality" | "relationship" | "timing" | "future-flow">,
  AstrologyUserReportChapterId
> = {
  personality: "temperament",
  relationship: "love-relationship",
  timing: "near-term-flow",
  "future-flow": "action-now",
};

const QUESTION_ORDER: QuestionId[] = ["love", "work", "money", "recovery", "luck"];
const LEGACY_QUESTION_ORDER: LegacyQuestionId[] = ["love", "work", "stress", "luck"];

const FIXED_QUESTION_LABELS: Record<QuestionId, string> = {
  love: "연애에서 반복되는 패턴은 무엇인가요?",
  work: "일에서 성과가 잘 나는 방식은 무엇인가요?",
  money: "재정에서 새는 구간을 줄이려면 무엇부터 점검해야 하나요?",
  recovery: "회복력을 유지하려면 어떤 리듬이 필요할까요?",
  luck: "운을 올리려면 어떤 루틴이 가장 효과적인가요?",
};

const FALLBACK_QUESTION_ANSWERS: Record<QuestionId, string> = {
  love: "기대치를 먼저 합의하고 해석보다 확인 대화를 늘리면 관계 반복 패턴이 줄어듭니다.",
  work: "한 번에 하나의 목표를 끝내는 방식이 성과 효율을 가장 안정적으로 높입니다.",
  money: "고정비와 즉흥 지출을 분리해 기록하면 재정 누수를 빠르게 통제할 수 있습니다.",
  recovery: "일정과 회복 시간을 분리해 고정하면 번아웃 회복 속도가 빨라집니다.",
  luck: "작은 루틴을 같은 시간에 반복할수록 흐름이 흔들리지 않고 유지됩니다.",
};

const LIFE_PATTERN_LABELS: Record<LifePatternKey, string> = {
  relationship: "관계 패턴",
  work: "일 패턴",
  money: "재정 패턴",
  recovery: "회복 패턴",
};

const INTERNAL_TOKEN_PATTERNS: RegExp[] = [
  /```/g,
  /<\|[^>]+\|>/g,
  /\{\{[^}]+\}\}/g,
  /\b(?:system|assistant|developer)\s*:/gi,
  /BEGIN_[A-Z_]+/g,
  /END_[A-Z_]+/g,
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toText = (value: unknown, fallback = "") => {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned : fallback;
};

const toTextList = (value: unknown, limit = 5) => {
  if (!Array.isArray(value)) return [] as string[];
  const normalized = value
    .map((item) => toText(item))
    .filter((item) => item.length > 0);
  return Array.from(new Set(normalized)).slice(0, limit);
};

const toNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const normalizeTemplateVersion = (value: unknown): "v4" | "v5" =>
  value === "v5" ? "v5" : "v4";

const toKstMonthKey = (date = new Date()) => {
  const ym = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return `${ym}@Asia/Seoul`;
};

const dominantKey = <T extends string>(
  entries: Array<{ key: T; value: number }>,
  fallback: T,
) => [...entries].sort((a, b) => b.value - a.value)[0]?.key ?? fallback;

const elementKoMap: Record<string, string> = {
  fire: "불",
  earth: "흙",
  air: "바람",
  water: "물",
};

const qualityKoMap: Record<string, string> = {
  cardinal: "시작형",
  fixed: "지속형",
  mutable: "변화형",
};

const emptyPlanet = (nameKo: string): AstrologyPlanet => ({
  name: nameKo,
  nameKo,
  sign: "unknown",
  signKo: "미확인",
  element: "Unknown",
  quality: "Unknown",
  house: 0,
  degree: 0,
  retrograde: false,
  interpretation: "",
});

const defaultDeepData = (): AstrologyDeepData => ({
  data: {},
  big3: {
    sun: emptyPlanet("태양"),
    moon: emptyPlanet("달"),
    rising: {
      sign: "unknown",
      signKo: "미확인",
      element: "Unknown",
      quality: "Unknown",
      degree: 0,
      interpretation: "",
    },
  },
  planets: [],
  houses: [],
  aspects: [],
  elementDistribution: { fire: 0, earth: 0, air: 0, water: 0 },
  qualityDistribution: { cardinal: 0, fixed: 0, mutable: 0 },
  chartSvg: "",
});

const normalizeDeepDataCandidate = (candidate: Record<string, unknown>): AstrologyDeepData => {
  const fallback = defaultDeepData();
  return {
    data: isRecord(candidate.data) ? candidate.data : fallback.data,
    big3: isRecord(candidate.big3) ? (candidate.big3 as AstrologyDeepData["big3"]) : fallback.big3,
    planets: Array.isArray(candidate.planets) ? (candidate.planets as AstrologyPlanet[]) : fallback.planets,
    houses: Array.isArray(candidate.houses) ? (candidate.houses as AstrologyDeepData["houses"]) : fallback.houses,
    aspects: Array.isArray(candidate.aspects) ? (candidate.aspects as AstrologyDeepData["aspects"]) : fallback.aspects,
    elementDistribution: isRecord(candidate.elementDistribution)
      ? {
          fire: toNumber(candidate.elementDistribution.fire, 0),
          earth: toNumber(candidate.elementDistribution.earth, 0),
          air: toNumber(candidate.elementDistribution.air, 0),
          water: toNumber(candidate.elementDistribution.water, 0),
        }
      : fallback.elementDistribution,
    qualityDistribution: isRecord(candidate.qualityDistribution)
      ? {
          cardinal: toNumber(candidate.qualityDistribution.cardinal, 0),
          fixed: toNumber(candidate.qualityDistribution.fixed, 0),
          mutable: toNumber(candidate.qualityDistribution.mutable, 0),
        }
      : fallback.qualityDistribution,
    chartSvg: toText(candidate.chartSvg, ""),
    chart_svg: toText(candidate.chart_svg, ""),
  };
};

const similarity = (a: string, b: string) => {
  const na = a.replace(/\s+/g, " ").trim().toLowerCase();
  const nb = b.replace(/\s+/g, " ").trim().toLowerCase();
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const setA = new Set(na.split(" "));
  const setB = new Set(nb.split(" "));
  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

const dedupeText = (text: string, pool: string[], fallback: string) => {
  const normalized = toText(text, fallback);
  if (!normalized) return fallback;
  const duplicated = pool.some((seen) => similarity(seen, normalized) >= 0.9);
  if (duplicated) return fallback;
  pool.push(normalized);
  return normalized;
};

const buildFallbackHero = (
  deepData: AstrologyDeepData,
): AstrologyBirthReportResult["hero"] => {
  const dominantElement = dominantKey(
    [
      { key: "fire", value: deepData.elementDistribution.fire },
      { key: "earth", value: deepData.elementDistribution.earth },
      { key: "air", value: deepData.elementDistribution.air },
      { key: "water", value: deepData.elementDistribution.water },
    ],
    "fire",
  );
  const dominantQuality = dominantKey(
    [
      { key: "cardinal", value: deepData.qualityDistribution.cardinal },
      { key: "fixed", value: deepData.qualityDistribution.fixed },
      { key: "mutable", value: deepData.qualityDistribution.mutable },
    ],
    "cardinal",
  );

  return {
    headline: `${deepData.big3.sun.signKo} 태양과 ${deepData.big3.moon.signKo} 달 조합은 방향을 빠르게 잡을 때 성과가 크게 올라갑니다.`,
    topInsights: [
      `${elementKoMap[dominantElement]} 요소가 강해 실행력 자체는 높습니다.`,
      `${qualityKoMap[dominantQuality]} 성향이라 목표를 좁힐수록 결과가 안정됩니다.`,
      "이번 달은 확장보다 완료율을 먼저 올리는 전략이 유리합니다.",
    ],
  };
};

const buildFallbackLifePatterns = (
  birthTimeKnown: boolean,
): AstrologyBirthReportResult["lifePatterns"] => ({
  relationship: {
    pattern: "상대 반응을 빠르게 해석해 결론 내리는 패턴",
    problemManifestation: "의도와 다르게 단정적으로 들려 관계 오해가 커질 수 있습니다.",
    trigger: "답장이 늦거나 반응이 애매할 때",
    recommendedAction: "해석 전에 사실 확인 질문 1개를 먼저 던지세요.",
    basis: ["달/금성 반응 패턴"],
    isEstimated: !birthTimeKnown,
  },
  work: {
    pattern: "시작 속도는 빠르지만 범위를 넓히는 패턴",
    problemManifestation: "중요 과제가 분산되어 완료율이 떨어집니다.",
    trigger: "새 요청이 들어왔을 때 즉시 수락하는 습관",
    recommendedAction: "이번 주 최우선 과제 1개만 고정하고 나머지는 보류하세요.",
    basis: ["태양/화성 실행 패턴"],
    isEstimated: !birthTimeKnown,
  },
  money: {
    pattern: "필요 지출과 즉흥 지출이 섞이는 패턴",
    problemManifestation: "월말 체감 잔액이 예상보다 빠르게 줄어듭니다.",
    trigger: "피로/스트레스 상황의 보상 소비",
    recommendedAction: "결제 전 10분 지연 규칙을 적용해 충동 결제를 차단하세요.",
    basis: ["2하우스/목성 소비 패턴"],
    isEstimated: !birthTimeKnown,
  },
  recovery: {
    pattern: "몰입 후 회복을 미루는 패턴",
    problemManifestation: "과부하가 누적되면 생산성이 급격히 떨어집니다.",
    trigger: "마감 직전 연속 작업",
    recommendedAction: "일정에 회복 블록을 먼저 배치하고 업무를 그 안에 맞추세요.",
    basis: ["6하우스/토성 회복 패턴"],
    isEstimated: !birthTimeKnown,
  },
});

const buildFallbackCurrentWindow = (): AstrologyBirthReportResult["currentWindow"] => {
  const cacheKey = toKstMonthKey();
  return {
    month: {
      focus: "한 번에 하나의 핵심 과제를 끝까지 마무리하는 데 집중하세요.",
      avoid: "새로운 확장 과제를 동시에 여러 개 시작하지 마세요.",
      routine: "매일 시작 전에 오늘의 1순위 완료 기준을 한 줄로 기록하세요.",
      basis: ["transit.phase=month", "deterministic.window=30d"],
      cacheKey,
    },
    quarter: {
      focus: "완료율과 재현 가능한 루틴을 쌓아 다음 분기 성장을 준비하세요.",
      avoid: "성과 확인 전 전략을 자주 바꾸는 방식은 피하세요.",
      routine: "주 1회 리뷰에서 유지/중단/추가 1개씩만 결정하세요.",
      basis: ["transit.phase=quarter", "deterministic.window=90d"],
      cacheKey,
    },
  };
};

const buildLegacyExclusiveInsights = (
  report: Pick<AstrologyBirthReportResult, "hero" | "lifePatterns" | "currentWindow">,
): AstrologyExclusiveInsights => ({
  personaPublicImage: {
    title: "남들이 보는 나",
    summary: report.hero.headline,
    evidence: [report.hero.topInsights[0], report.hero.topInsights[1]],
    action: report.lifePatterns.relationship.recommendedAction,
  },
  stopHabits: {
    title: "운을 깎는 습관 (Stop)",
    habits: [
      report.lifePatterns.relationship.trigger,
      report.lifePatterns.work.trigger,
      report.lifePatterns.money.trigger,
    ],
    replacements: [
      report.lifePatterns.relationship.recommendedAction,
      report.lifePatterns.work.recommendedAction,
      report.lifePatterns.recovery.recommendedAction,
    ],
  },
  moneyPath: {
    title: "재물 유입 경로 (Money Path)",
    primaryPath: report.lifePatterns.work.pattern,
    secondaryPath: report.lifePatterns.money.pattern,
    blockers: [report.lifePatterns.money.problemManifestation],
    firstAction: report.lifePatterns.money.recommendedAction,
  },
});

const buildLegacyCuriosityInsights = (
  report: Pick<AstrologyBirthReportResult, "popularQuestions" | "lifePatterns">,
): AstrologyCuriosityInsights => {
  const answerById = new Map<string, string>(
    report.popularQuestions.map((item) => [item.id, item.answer]),
  );
  return {
    lovePattern: {
      title: "연애에서 반복되는 패턴",
      attractionStyle: report.lifePatterns.relationship.pattern,
      emotionalNeed: answerById.get("love") ?? FALLBACK_QUESTION_ANSWERS.love,
      conflictTrigger: report.lifePatterns.relationship.trigger,
      healthierApproach: report.lifePatterns.relationship.recommendedAction,
    },
    workPersona: {
      title: "일할 때 가장 빛나는 방식",
      bestRole: report.lifePatterns.work.pattern,
      collaborationStyle: answerById.get("work") ?? FALLBACK_QUESTION_ANSWERS.work,
      hiddenAdvantage: report.lifePatterns.work.problemManifestation,
      burnoutTrigger: report.lifePatterns.work.trigger,
      growthAction: report.lifePatterns.work.recommendedAction,
    },
    stressRecovery: {
      title: "무너질 때의 패턴과 회복법",
      trigger: report.lifePatterns.recovery.trigger,
      warningSignal: report.lifePatterns.recovery.problemManifestation,
      resetRoutine:
        answerById.get("recovery") ??
        answerById.get("stress") ??
        FALLBACK_QUESTION_ANSWERS.recovery,
      boundaryRule: report.lifePatterns.recovery.recommendedAction,
    },
    luckRoutine: {
      title: "운이 붙는 루틴",
      amplifier: report.lifePatterns.work.recommendedAction,
      blocker: report.lifePatterns.money.trigger,
      ritual: answerById.get("luck") ?? FALLBACK_QUESTION_ANSWERS.luck,
      timingTip: report.lifePatterns.recovery.recommendedAction,
    },
    faq: {
      title: "사람들이 가장 궁금해하는 질문",
      items: report.popularQuestions.map((item) => ({
        question: item.question,
        answer: item.answer,
      })),
    },
  };
};

const buildLegacyTiming = (
  currentWindow: AstrologyBirthReportResult["currentWindow"],
) => ({
  monthFocus: currentWindow.month.focus,
  monthCaution: currentWindow.month.avoid,
  quarterFlow: [
    {
      label: "이번 달",
      focus: currentWindow.month.focus,
      caution: currentWindow.month.avoid,
      score: 68,
    },
    {
      label: "다음 달",
      focus: currentWindow.quarter.focus,
      caution: currentWindow.quarter.avoid,
      score: 64,
    },
    {
      label: "이번 분기",
      focus: currentWindow.quarter.focus,
      caution: currentWindow.quarter.avoid,
      score: 66,
    },
  ],
});

const toLifePatternFromChapter = (
  chapter: Record<string, unknown> | undefined,
  fallback: AstrologyBirthReportResult["lifePatterns"][LifePatternKey],
) => ({
  pattern: toText(chapter?.interpretation, fallback.pattern),
  problemManifestation: toText(
    toTextList(chapter?.evidence, 1)[0],
    fallback.problemManifestation,
  ),
  trigger: toText(toTextList(chapter?.actionGuide, 1)[0], fallback.trigger),
  recommendedAction: toText(toTextList(chapter?.actionGuide, 1)[0], fallback.recommendedAction),
  basis: fallback.basis,
  isEstimated: fallback.isEstimated,
});

const chapterIdToUser = (id: string): AstrologyUserReportChapterId | null => {
  if (USER_REPORT_CHAPTER_ORDER.includes(id as AstrologyUserReportChapterId)) {
    return id as AstrologyUserReportChapterId;
  }
  if (id in LEGACY_TO_USER_CHAPTER_ID_MAP) {
    return LEGACY_TO_USER_CHAPTER_ID_MAP[id as keyof typeof LEGACY_TO_USER_CHAPTER_ID_MAP];
  }
  return null;
};

const ensureTopInsights = (value: unknown, fallback: [string, string, string]) => {
  const list = toTextList(value, 3);
  const merged = [...list];
  for (const candidate of fallback) {
    if (merged.length >= 3) break;
    if (!merged.includes(candidate)) {
      merged.push(candidate);
    }
  }
  return [merged[0] ?? fallback[0], merged[1] ?? fallback[1], merged[2] ?? fallback[2]] as [
    string,
    string,
    string,
  ];
};

const buildLegacyChapters = (
  report: Pick<AstrologyBirthReportResult, "hero" | "lifePatterns" | "currentWindow">,
): AstrologyReportChapter[] => {
  const byKey: Record<LifePatternKey, string> = {
    relationship: "love-relationship",
    work: "work-career",
    money: "money-wealth",
    recovery: "health-rhythm",
  };

  const items = (Object.keys(byKey) as LifePatternKey[]).map((key) => {
    const card = report.lifePatterns[key];
    return {
      id: byKey[key] as AstrologyUserReportChapterId,
      title: LIFE_PATTERN_LABELS[key],
      interpretation: card.pattern,
      evidence: [card.problemManifestation],
      actionGuide: [`Do: ${card.recommendedAction}`, `Don't: ${card.trigger}`],
      aiInsight: null,
    };
  });

  return [
    {
      id: "temperament",
      title: "핵심 성향",
      interpretation: report.hero.headline,
      evidence: [...report.hero.topInsights],
      actionGuide: [`Do: ${report.currentWindow.month.routine}`],
      aiInsight: null,
    },
    ...items,
    {
      id: "near-term-flow",
      title: "이번 달/분기 흐름",
      interpretation: report.currentWindow.month.focus,
      evidence: [report.currentWindow.month.avoid, report.currentWindow.quarter.focus],
      actionGuide: [`Do: ${report.currentWindow.month.routine}`],
      aiInsight: null,
    },
    {
      id: "action-now",
      title: "지금 해야 할 행동",
      interpretation: report.currentWindow.quarter.focus,
      evidence: [report.currentWindow.quarter.avoid],
      actionGuide: [`Do: ${report.currentWindow.quarter.routine}`],
      aiInsight: null,
    },
  ];
};

export const toAstrologyDeepData = (payload: unknown): AstrologyDeepData => {
  if (isRecord(payload) && isRecord(payload.deepData)) {
    return normalizeDeepDataCandidate(payload.deepData);
  }

  const root = isRecord(payload) ? (payload as Partial<AstrologyResult> & { chart_svg?: string }) : {};
  const fallback = defaultDeepData();
  return {
    data: isRecord(root.data) ? root.data : fallback.data,
    big3: isRecord(root.big3) ? (root.big3 as AstrologyDeepData["big3"]) : fallback.big3,
    planets: Array.isArray(root.planets) ? (root.planets as AstrologyPlanet[]) : fallback.planets,
    houses: Array.isArray(root.houses) ? (root.houses as AstrologyDeepData["houses"]) : fallback.houses,
    aspects: Array.isArray(root.aspects) ? (root.aspects as AstrologyDeepData["aspects"]) : fallback.aspects,
    elementDistribution: isRecord(root.elementDistribution)
      ? {
          fire: toNumber(root.elementDistribution.fire, 0),
          earth: toNumber(root.elementDistribution.earth, 0),
          air: toNumber(root.elementDistribution.air, 0),
          water: toNumber(root.elementDistribution.water, 0),
        }
      : fallback.elementDistribution,
    qualityDistribution: isRecord(root.qualityDistribution)
      ? {
          cardinal: toNumber(root.qualityDistribution.cardinal, 0),
          fixed: toNumber(root.qualityDistribution.fixed, 0),
          mutable: toNumber(root.qualityDistribution.mutable, 0),
        }
      : fallback.qualityDistribution,
    chartSvg: toText(root.chartSvg, toText(root.chart_svg, "")),
    chart_svg: toText(root.chart_svg, ""),
  };
};

const normalizeConfidence = (
  source: unknown,
  fallback: AstrologyBirthReportResult["confidence"],
): AstrologyBirthReportResult["confidence"] => {
  if (!isRecord(source)) return fallback;
  const legacyLevel = toText(source.level, fallback.level);
  const normalizedLevel: AstrologyBirthReportResult["confidence"]["level"] =
    legacyLevel === "high" || legacyLevel === "medium" || legacyLevel === "low"
      ? legacyLevel
      : fallback.level;

  const scoreFromLevel =
    normalizedLevel === "high" ? 84 : normalizedLevel === "medium" ? 68 : 52;
  const score = clamp(toNumber(source.score, scoreFromLevel), 0, 100);
  const summary = toText(source.summary, toText(source.message, fallback.summary));
  const reasons = toTextList(source.reasons, 6);
  const uncertainAreas = toTextList(source.uncertainAreas, 6);
  const birthTimeKnown =
    typeof source.birthTimeKnown === "boolean"
      ? source.birthTimeKnown
      : fallback.birthTimeKnown;

  return {
    score,
    level: normalizedLevel,
    summary,
    reasons: reasons.length > 0 ? reasons : fallback.reasons,
    uncertainAreas: uncertainAreas.length > 0 ? uncertainAreas : fallback.uncertainAreas,
    birthTimeKnown,
    message: summary,
  };
};

export const enforceQuestionSet = (
  source: unknown,
  fallbackAnswers?: Partial<Record<QuestionId, string>>,
): AstrologyBirthReportResult["popularQuestions"] => {
  const answerById = new Map<QuestionId, string>();
  const normalizeQuestionId = (idRaw: string, index: number): QuestionId | undefined => {
    if (idRaw === "stress") {
      return "recovery";
    }
    if (QUESTION_ORDER.includes(idRaw as QuestionId)) {
      return idRaw as QuestionId;
    }
    return QUESTION_ORDER[index];
  };

  if (Array.isArray(source)) {
    source.forEach((item, index) => {
      if (!isRecord(item)) return;
      const idRaw = toText(item.id).toLowerCase();
      const inferredId = normalizeQuestionId(idRaw, index);
      if (!inferredId) return;
      const answer = toText(item.answer);
      if (answer) answerById.set(inferredId, answer);
    });
  } else if (isRecord(source)) {
    const legacyItems = isRecord(source.faq) ? source.faq.items : source.items;
    if (Array.isArray(legacyItems)) {
      legacyItems.forEach((item, index) => {
        if (!isRecord(item)) return;
        const answer = toText(item.answer);
        const legacyId = LEGACY_QUESTION_ORDER[index];
        const id = legacyId === "stress" ? "recovery" : legacyId;
        if (id && answer) {
          answerById.set(id, answer);
        }
      });
    }
  }

  return QUESTION_ORDER.map((id) => ({
    id,
    question: FIXED_QUESTION_LABELS[id],
    answer:
      answerById.get(id) ??
      toText(fallbackAnswers?.[id], FALLBACK_QUESTION_ANSWERS[id]),
  }));
};

export const enforceLifePatternShape = (
  source: unknown,
  fallback: AstrologyBirthReportResult["lifePatterns"],
): AstrologyBirthReportResult["lifePatterns"] => {
  const parsed: Partial<Record<LifePatternKey, AstrologyBirthReportResult["lifePatterns"][LifePatternKey]>> = {};

  if (isRecord(source)) {
    (Object.keys(fallback) as LifePatternKey[]).forEach((key) => {
      const candidate = isRecord(source[key]) ? source[key] : null;
      parsed[key] = {
        pattern: toText(candidate?.pattern, fallback[key].pattern),
        problemManifestation: toText(
          candidate?.problemManifestation,
          fallback[key].problemManifestation,
        ),
        trigger: toText(candidate?.trigger, fallback[key].trigger),
        recommendedAction: toText(
          candidate?.recommendedAction,
          fallback[key].recommendedAction,
        ),
        basis: toTextList(candidate?.basis, 5).length
          ? toTextList(candidate?.basis, 5)
          : fallback[key].basis,
        isEstimated:
          typeof candidate?.isEstimated === "boolean"
            ? candidate.isEstimated
            : fallback[key].isEstimated,
      };
    });
  }

  return {
    relationship: parsed.relationship ?? fallback.relationship,
    work: parsed.work ?? fallback.work,
    money: parsed.money ?? fallback.money,
    recovery: parsed.recovery ?? fallback.recovery,
  };
};

const normalizeCurrentWindow = (
  source: unknown,
  fallback: AstrologyBirthReportResult["currentWindow"],
): AstrologyBirthReportResult["currentWindow"] => {
  const cacheKey = toKstMonthKey();
  if (!isRecord(source)) {
    return {
      month: { ...fallback.month, cacheKey },
      quarter: { ...fallback.quarter, cacheKey },
    };
  }

  const month = isRecord(source.month) ? source.month : null;
  const quarter = isRecord(source.quarter) ? source.quarter : null;

  return {
    month: {
      focus: toText(month?.focus, fallback.month.focus),
      avoid: toText(month?.avoid, fallback.month.avoid),
      routine: toText(month?.routine, fallback.month.routine),
      basis: toTextList(month?.basis, 6).length
        ? toTextList(month?.basis, 6)
        : fallback.month.basis,
      cacheKey: toText(month?.cacheKey, cacheKey),
    },
    quarter: {
      focus: toText(quarter?.focus, fallback.quarter.focus),
      avoid: toText(quarter?.avoid, fallback.quarter.avoid),
      routine: toText(quarter?.routine, fallback.quarter.routine),
      basis: toTextList(quarter?.basis, 6).length
        ? toTextList(quarter?.basis, 6)
        : fallback.quarter.basis,
      cacheKey: toText(quarter?.cacheKey, cacheKey),
    },
  };
};

const legacyToLifePatterns = (
  payload: Record<string, unknown>,
  fallback: AstrologyBirthReportResult["lifePatterns"],
) => {
  const chapterById = new Map<AstrologyUserReportChapterId, Record<string, unknown>>();
  if (Array.isArray(payload.chapters)) {
    payload.chapters.forEach((chapter) => {
      if (!isRecord(chapter)) return;
      const id = chapterIdToUser(toText(chapter.id));
      if (!id) return;
      chapterById.set(id, chapter);
    });
  }

  const relationship = toLifePatternFromChapter(
    chapterById.get("love-relationship"),
    fallback.relationship,
  );
  const work = toLifePatternFromChapter(
    chapterById.get("work-career"),
    fallback.work,
  );
  const money = toLifePatternFromChapter(
    chapterById.get("money-wealth"),
    fallback.money,
  );
  const recovery = toLifePatternFromChapter(
    chapterById.get("health-rhythm"),
    fallback.recovery,
  );

  return { relationship, work, money, recovery };
};

const legacyToCurrentWindow = (
  payload: Record<string, unknown>,
  fallback: AstrologyBirthReportResult["currentWindow"],
) => {
  const timing = isRecord(payload.timing) ? payload.timing : null;
  if (!timing) return fallback;

  const quarterFlow = Array.isArray(timing.quarterFlow)
    ? timing.quarterFlow.filter(isRecord)
    : [];
  const firstQuarterNode = quarterFlow[0];
  const cacheKey = toKstMonthKey();

  return {
    month: {
      focus: toText(timing.monthFocus, toText(firstQuarterNode?.focus, fallback.month.focus)),
      avoid: toText(timing.monthCaution, toText(firstQuarterNode?.caution, fallback.month.avoid)),
      routine: fallback.month.routine,
      basis: ["legacy.timing.monthFocus", "legacy.timing.monthCaution"],
      cacheKey,
    },
    quarter: {
      focus: toText(quarterFlow[1]?.focus, fallback.quarter.focus),
      avoid: toText(quarterFlow[1]?.caution, fallback.quarter.avoid),
      routine: fallback.quarter.routine,
      basis: ["legacy.timing.quarterFlow"],
      cacheKey,
    },
  };
};

const normalizeForInternalTokens = (value: string) => {
  let result = value;
  INTERNAL_TOKEN_PATTERNS.forEach((pattern) => {
    result = result.replace(pattern, " ");
  });
  return result.replace(/\s+/g, " ").trim();
};

export const rejectInternalTokens = <T>(payload: T): T => {
  if (typeof payload === "string") {
    return normalizeForInternalTokens(payload) as T;
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => rejectInternalTokens(item)) as T;
  }
  if (isRecord(payload)) {
    const next: Record<string, unknown> = {};
    Object.entries(payload).forEach(([key, value]) => {
      next[key] = rejectInternalTokens(value);
    });
    return next as T;
  }
  return payload;
};

export const dedupeReportCopy = (
  report: AstrologyBirthReportResult,
): AstrologyBirthReportResult => {
  const pool: string[] = [];
  const heroTopInsights = report.hero.topInsights.map((item, index) =>
    dedupeText(
      item,
      pool,
      index === 0
        ? "핵심 과제를 줄일수록 해석 정확도가 높아집니다."
        : index === 1
        ? "이번 흐름은 실행보다 정렬 순서가 더 중요합니다."
        : "반복 가능한 루틴이 결과 변동폭을 줄입니다.",
    ),
  ) as [string, string, string];

  const popularQuestions = report.popularQuestions.map((item) => ({
    ...item,
    answer: dedupeText(item.answer, pool, FALLBACK_QUESTION_ANSWERS[item.id]),
  }));

  const lifePatterns = (Object.keys(report.lifePatterns) as LifePatternKey[]).reduce(
    (acc, key) => {
      const card = report.lifePatterns[key];
      acc[key] = {
        ...card,
        pattern: dedupeText(card.pattern, pool, LIFE_PATTERN_LABELS[key]),
        problemManifestation: dedupeText(
          card.problemManifestation,
          pool,
          "문제가 반복되기 전에 인식 가능한 신호가 있습니다.",
        ),
        trigger: dedupeText(card.trigger, pool, "우선순위가 흔들릴 때"),
        recommendedAction: dedupeText(
          card.recommendedAction,
          pool,
          "한 번에 하나의 행동만 실행하세요.",
        ),
      };
      return acc;
    },
    {} as AstrologyBirthReportResult["lifePatterns"],
  );

  return {
    ...report,
    hero: {
      ...report.hero,
      topInsights: heroTopInsights,
    },
    popularQuestions,
    lifePatterns,
    currentWindow: {
      month: {
        ...report.currentWindow.month,
        focus: dedupeText(report.currentWindow.month.focus, pool, "이번 달은 완료율을 먼저 확보하세요."),
        avoid: dedupeText(report.currentWindow.month.avoid, pool, "동시에 여러 확장 과제를 시작하지 마세요."),
        routine: dedupeText(report.currentWindow.month.routine, pool, "아침에 핵심 과제 1개를 기록하세요."),
      },
      quarter: {
        ...report.currentWindow.quarter,
        focus: dedupeText(report.currentWindow.quarter.focus, pool, "분기 전체는 루틴 안정화에 집중하세요."),
        avoid: dedupeText(report.currentWindow.quarter.avoid, pool, "근거 없는 전략 변경은 피하세요."),
        routine: dedupeText(report.currentWindow.quarter.routine, pool, "주간 리뷰 기준을 고정하세요."),
      },
    },
  };
};

export const enforceBirthTimeDisclaimers = (
  report: AstrologyBirthReportResult,
): AstrologyBirthReportResult => {
  if (report.confidence.birthTimeKnown) return report;

  const uncertainAreas = Array.from(
    new Set([
      ...report.confidence.uncertainAreas,
      "상승궁/하우스 해석",
      "월간·분기 개인화 정밀도",
    ]),
  );

  const lifePatterns = (Object.keys(report.lifePatterns) as LifePatternKey[]).reduce(
    (acc, key) => {
      const card = report.lifePatterns[key];
      acc[key] = {
        ...card,
        isEstimated: true,
      };
      return acc;
    },
    {} as AstrologyBirthReportResult["lifePatterns"],
  );

  const disclaimer = "출생시간 미입력으로 일부 구간은 추정 해석입니다.";
  return {
    ...report,
    lifePatterns,
    confidence: {
      ...report.confidence,
      summary: report.confidence.summary.includes("추정")
        ? report.confidence.summary
        : `${report.confidence.summary} ${disclaimer}`,
      message: report.confidence.summary.includes("추정")
        ? report.confidence.summary
        : `${report.confidence.summary} ${disclaimer}`,
      reasons: Array.from(
        new Set([
          ...report.confidence.reasons,
          "출생시간 미입력",
        ]),
      ),
      uncertainAreas,
    },
    currentWindow: {
      month: {
        ...report.currentWindow.month,
        basis: Array.from(new Set([...report.currentWindow.month.basis, "birth-time=unknown"])),
      },
      quarter: {
        ...report.currentWindow.quarter,
        basis: Array.from(new Set([...report.currentWindow.quarter.basis, "birth-time=unknown"])),
      },
    },
  };
};

export const sanitizeAstrologyReportV4 = (
  report: AstrologyBirthReportResult,
): AstrologyBirthReportResult => {
  const tokenSanitized = rejectInternalTokens(report);
  const withQuestions = {
    ...tokenSanitized,
    popularQuestions: enforceQuestionSet(
      tokenSanitized.popularQuestions,
      Object.fromEntries(tokenSanitized.popularQuestions.map((item) => [item.id, item.answer])),
    ),
  };
  const withPatterns = {
    ...withQuestions,
    lifePatterns: enforceLifePatternShape(withQuestions.lifePatterns, withQuestions.lifePatterns),
  };
  const deduped = dedupeReportCopy(withPatterns);
  const withDisclaimers = enforceBirthTimeDisclaimers(deduped);

  return {
    ...withDisclaimers,
    hero: {
      headline: toText(withDisclaimers.hero.headline, "현재 흐름은 우선순위 정렬이 핵심입니다."),
      topInsights: ensureTopInsights(withDisclaimers.hero.topInsights, [
        "핵심 과제를 좁히면 성과가 빨라집니다.",
        "검증 루틴을 고정하면 시행착오가 줄어듭니다.",
        "이번 흐름은 확장보다 안정화가 유리합니다.",
      ]),
    },
    confidence: {
      ...withDisclaimers.confidence,
      score: clamp(toNumber(withDisclaimers.confidence.score, 65), 0, 100),
      message: toText(withDisclaimers.confidence.message, withDisclaimers.confidence.summary),
      summary: toText(withDisclaimers.confidence.summary, "해석 신뢰도를 확인하세요."),
      reasons: withDisclaimers.confidence.reasons.length
        ? withDisclaimers.confidence.reasons
        : ["데이터 점검 필요"],
    },
    meta: {
      ...withDisclaimers.meta,
      templateVersion: normalizeTemplateVersion(withDisclaimers.meta.templateVersion),
      timezone: toText(withDisclaimers.meta.timezone, "Asia/Seoul"),
      generatedFrom: "natal+transit",
    },
  };
};

export const buildFallbackAstrologyBirthReport = (
  deepData: AstrologyDeepData,
  req?: Pick<AstrologyRequest, "birthTimeKnown">,
  _aiInsight?: string | null,
): AstrologyBirthReportResult => {
  const safeDeepData = deepData ?? defaultDeepData();
  const birthTimeKnown = req?.birthTimeKnown !== false;
  const hero = buildFallbackHero(safeDeepData);
  const currentWindow = buildFallbackCurrentWindow();
  const lifePatterns = buildFallbackLifePatterns(birthTimeKnown);
  const popularQuestions = enforceQuestionSet(undefined);

  const score = birthTimeKnown ? 84 : 62;
  const confidence: AstrologyBirthReportResult["confidence"] = {
    score,
    level: birthTimeKnown ? "high" : "medium",
    summary: birthTimeKnown
      ? "출생시간이 포함되어 하우스/상승궁 해석 신뢰도가 높습니다."
      : "출생시간 미입력으로 하우스/상승궁 해석은 추정치가 포함됩니다.",
    reasons: birthTimeKnown
      ? ["출생시간 입력", "하우스 계산 가능"]
      : ["출생시간 미입력", "하우스 계산 제한"],
    uncertainAreas: birthTimeKnown ? [] : ["상승궁/하우스 해석"],
    birthTimeKnown,
    message: birthTimeKnown
      ? "출생시간이 포함되어 하우스/상승궁 해석 신뢰도가 높습니다."
      : "출생시간 미입력으로 하우스/상승궁 해석은 추정치가 포함됩니다.",
  };

  const draft: AstrologyBirthReportResult = {
    success: true,
    generatedAt: new Date().toISOString(),
    hero,
    popularQuestions,
    lifePatterns,
    currentWindow,
    confidence,
    deepData: safeDeepData,
    meta: {
      templateVersion: "v5",
      timezone: "Asia/Seoul",
      birthTimeKnown,
      birthPrecision: birthTimeKnown ? "known" : "unknown",
      generatedFrom: "natal+transit",
    },
    summary: {
      keynote: hero.headline,
      strengths: [...hero.topInsights],
      risks: [currentWindow.month.avoid, currentWindow.quarter.avoid],
      actionsNow: [currentWindow.month.routine, currentWindow.quarter.routine],
    },
    chapters: buildLegacyChapters({ hero, lifePatterns, currentWindow }),
    timing: buildLegacyTiming(currentWindow),
    exclusiveInsights: buildLegacyExclusiveInsights({ hero, lifePatterns, currentWindow }),
    curiosityInsights: buildLegacyCuriosityInsights({ popularQuestions, lifePatterns }),
  };

  return sanitizeAstrologyReportV4(draft);
};

const mergeHero = (
  source: Record<string, unknown>,
  fallback: AstrologyBirthReportResult["hero"],
) => {
  const heroInput = isRecord(source.hero) ? source.hero : null;
  const summaryInput = isRecord(source.summary) ? source.summary : null;
  return {
    headline: toText(
      heroInput?.headline,
      toText(summaryInput?.keynote, fallback.headline),
    ),
    topInsights: ensureTopInsights(
      heroInput?.topInsights ?? summaryInput?.strengths,
      fallback.topInsights,
    ),
  };
};

const deriveLegacySummary = (
  hero: AstrologyBirthReportResult["hero"],
  currentWindow: AstrologyBirthReportResult["currentWindow"],
) => ({
  keynote: hero.headline,
  strengths: [...hero.topInsights],
  risks: [currentWindow.month.avoid, currentWindow.quarter.avoid],
  actionsNow: [currentWindow.month.routine, currentWindow.quarter.routine],
});

export const normalizeAstrologyBirthReport = (
  payload: unknown,
  req?: Pick<AstrologyRequest, "birthTimeKnown">,
): AstrologyBirthReportResult => {
  const deepData = toAstrologyDeepData(payload);
  const fallback = buildFallbackAstrologyBirthReport(deepData, req, null);

  if (!isRecord(payload)) {
    return fallback;
  }

  const hero = mergeHero(payload, fallback.hero);
  const legacyCuriositySource = isRecord(payload.curiosityInsights)
    ? payload.curiosityInsights
    : undefined;

  const popularQuestions = enforceQuestionSet(
    payload.popularQuestions ?? legacyCuriositySource,
    Object.fromEntries(fallback.popularQuestions.map((item) => [item.id, item.answer])),
  );

  const rawLifePatterns = isRecord(payload.lifePatterns)
    ? payload.lifePatterns
    : legacyToLifePatterns(payload, fallback.lifePatterns);
  const lifePatterns = enforceLifePatternShape(rawLifePatterns, fallback.lifePatterns);

  const currentWindow = normalizeCurrentWindow(
    payload.currentWindow ?? legacyToCurrentWindow(payload, fallback.currentWindow),
    fallback.currentWindow,
  );

  const confidence = normalizeConfidence(payload.confidence, {
    ...fallback.confidence,
    birthTimeKnown:
      req?.birthTimeKnown ??
      fallback.confidence.birthTimeKnown,
  });

  const metaInput = isRecord(payload.meta) ? payload.meta : {};
  const meta = {
    templateVersion: normalizeTemplateVersion(metaInput.templateVersion),
    timezone: toText(metaInput.timezone, "Asia/Seoul"),
    birthTimeKnown:
      typeof metaInput.birthTimeKnown === "boolean"
        ? metaInput.birthTimeKnown
        : confidence.birthTimeKnown,
    birthPrecision:
      toText(metaInput.birthPrecision) === "known" ? "known" : "unknown",
    generatedFrom: "natal+transit" as const,
  };

  const summaryFromPayload = isRecord(payload.summary)
    ? {
        keynote: toText(payload.summary.keynote, hero.headline),
        strengths: toTextList(payload.summary.strengths, 4).length
          ? toTextList(payload.summary.strengths, 4)
          : [...hero.topInsights],
        risks: toTextList(payload.summary.risks, 4).length
          ? toTextList(payload.summary.risks, 4)
          : [currentWindow.month.avoid, currentWindow.quarter.avoid],
        actionsNow: toTextList(payload.summary.actionsNow, 4).length
          ? toTextList(payload.summary.actionsNow, 4)
          : [currentWindow.month.routine, currentWindow.quarter.routine],
      }
    : deriveLegacySummary(hero, currentWindow);

  const chapters = Array.isArray(payload.chapters)
    ? (payload.chapters
        .filter(isRecord)
        .map((chapter) => {
          const userId = chapterIdToUser(toText(chapter.id));
          return {
            id: userId ?? "temperament",
            title: toText(chapter.title, "해석"),
            interpretation: toText(chapter.interpretation, ""),
            evidence: toTextList(chapter.evidence, 5),
            actionGuide: toTextList(chapter.actionGuide, 5),
            aiInsight: toText(chapter.aiInsight, "") || null,
          } as AstrologyReportChapter;
        })
        .slice(0, 12) as AstrologyReportChapter[])
    : buildLegacyChapters({ hero, lifePatterns, currentWindow });

  const timing = isRecord(payload.timing)
    ? {
        monthFocus: toText(payload.timing.monthFocus, currentWindow.month.focus),
        monthCaution: toText(payload.timing.monthCaution, currentWindow.month.avoid),
        quarterFlow: Array.isArray(payload.timing.quarterFlow)
          ? payload.timing.quarterFlow
              .filter(isRecord)
              .slice(0, 3)
              .map((item, index) => ({
                label: toText(item.label, index === 0 ? "이번 달" : index === 1 ? "다음 달" : "이번 분기"),
                focus: toText(item.focus, currentWindow.quarter.focus),
                caution: toText(item.caution, currentWindow.quarter.avoid),
                score: clamp(toNumber(item.score, 65), 0, 100),
              }))
          : buildLegacyTiming(currentWindow).quarterFlow,
      }
    : buildLegacyTiming(currentWindow);

  const draft: AstrologyBirthReportResult = {
    success: payload.success !== false,
    generatedAt: toText(payload.generatedAt, fallback.generatedAt),
    hero,
    popularQuestions,
    lifePatterns,
    currentWindow,
    confidence,
    deepData,
    meta,
    summary: summaryFromPayload,
    chapters: chapters.length > 0 ? chapters : buildLegacyChapters({ hero, lifePatterns, currentWindow }),
    timing,
    exclusiveInsights: isRecord(payload.exclusiveInsights)
      ? (payload.exclusiveInsights as AstrologyExclusiveInsights)
      : buildLegacyExclusiveInsights({ hero, lifePatterns, currentWindow }),
    curiosityInsights: isRecord(payload.curiosityInsights)
      ? (payload.curiosityInsights as AstrologyCuriosityInsights)
      : buildLegacyCuriosityInsights({ popularQuestions, lifePatterns }),
  };

  const sanitized = sanitizeAstrologyReportV4(draft);

  return {
    ...sanitized,
    summary: sanitized.summary ?? deriveLegacySummary(sanitized.hero, sanitized.currentWindow),
    chapters: sanitized.chapters?.length
      ? sanitized.chapters
      : buildLegacyChapters({
          hero: sanitized.hero,
          lifePatterns: sanitized.lifePatterns,
          currentWindow: sanitized.currentWindow,
        }),
    timing: sanitized.timing ?? buildLegacyTiming(sanitized.currentWindow),
    exclusiveInsights:
      sanitized.exclusiveInsights ??
      buildLegacyExclusiveInsights({
        hero: sanitized.hero,
        lifePatterns: sanitized.lifePatterns,
        currentWindow: sanitized.currentWindow,
      }),
    curiosityInsights:
      sanitized.curiosityInsights ??
      buildLegacyCuriosityInsights({
        popularQuestions: sanitized.popularQuestions,
        lifePatterns: sanitized.lifePatterns,
      }),
  };
};

export const chapterLabelMap: Record<AstrologyReportChapterId, string> = {
  personality: "핵심 성향",
  relationship: "관계 패턴",
  timing: "이번 달/분기 흐름",
  "future-flow": "지금 해야 할 행동",
  temperament: "핵심 성향",
  "love-relationship": "관계 패턴",
  "work-career": "일 패턴",
  "money-wealth": "재정 패턴",
  "health-rhythm": "회복 패턴",
  "near-term-flow": "이번 달/분기 흐름",
  "action-now": "지금 해야 할 행동",
};
