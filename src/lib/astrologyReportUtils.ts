import { AstrologyBirthReportResult } from "@/types/result";

export const USER_REPORT_ORDER = [
  "temperament",
  "love-relationship",
  "work-career",
  "money-wealth",
  "health-rhythm",
  "near-term-flow",
  "action-now",
] as const;

export type UserReportChapterId = (typeof USER_REPORT_ORDER)[number];

const LEGACY_TO_USER_CHAPTER_ID: Record<string, UserReportChapterId> = {
  personality: "temperament",
  relationship: "love-relationship",
  timing: "near-term-flow",
  "future-flow": "action-now",
};

export function toUserReportChapterId(id: string): UserReportChapterId {
  if (USER_REPORT_ORDER.includes(id as UserReportChapterId)) {
    return id as UserReportChapterId;
  }
  return LEGACY_TO_USER_CHAPTER_ID[id] ?? "temperament";
}

export function orderReportChapters(reportChapters: AstrologyBirthReportResult["chapters"]) {
  const chapterById = new Map<UserReportChapterId, AstrologyBirthReportResult["chapters"][number]>();

  reportChapters.forEach((chapter) => {
    const mappedId = toUserReportChapterId(chapter.id);
    if (!chapterById.has(mappedId) || USER_REPORT_ORDER.includes(chapter.id as UserReportChapterId)) {
      chapterById.set(mappedId, { ...chapter, id: mappedId });
    }
  });

  return USER_REPORT_ORDER.map((id) => chapterById.get(id)).filter(Boolean) as Array<
    AstrologyBirthReportResult["chapters"][number]
  >;
}

export function stripGuidePrefix(text: string) {
  return text.replace(/^do\s*:/i, "").replace(/^don'?t\s*:/i, "").trim();
}

export function extractHeadline(text: string, maxLength = 90) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "실행 전략을 준비 중입니다.";
  }
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

export function normalizeActionList(actionGuide: string[], maxItems = 3) {
  const normalized = actionGuide
    .map((item) => stripGuidePrefix(item))
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 0);

  if (normalized.length === 0) {
    return ["오늘 목표 하나를 정하고 20분 먼저 실행하세요."];
  }
  return normalized.slice(0, maxItems);
}

export function splitActionGuide(actionGuide: string[]) {
  const doItems = actionGuide.filter((item) => /^do\s*:/i.test(item.trim()));
  const dontItems = actionGuide.filter((item) => /^don'?t\s*:/i.test(item.trim()));

  return {
    doItems: doItems.length > 0 ? doItems : ["Do: 오늘 목표 1개만 고정하세요."],
    dontItems: dontItems.length > 0 ? dontItems : ["Don't: 즉흥 확장으로 리듬을 깨지 마세요."],
  };
}

export function getPrimarySentence(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0];
  return firstSentence || normalized;
}

export function buildInsightLinks(strengths: string[], risks: string[], actions: string[]) {
  const reasonA = extractHeadline(strengths[0] ?? "현재 강점이 실행 집중도를 만들고 있습니다.", 68);
  const reasonB = extractHeadline(risks[0] ?? "동시에 많은 목표를 잡으면 집중력이 분산될 수 있습니다.", 68);
  const actionA = extractHeadline(actions[0] ?? "오늘 한 가지 목표를 고정하세요.", 64);
  const actionB = extractHeadline(
    actions[1] ?? actions[0] ?? "중요 결정 전 확인 질문 하나를 적어 보세요.",
    64,
  );

  return [
    { reason: reasonA, action: actionA },
    { reason: reasonB, action: actionB },
  ];
}

export function buildPersonalitySummary(
  interpretation: string | undefined,
  summary: AstrologyBirthReportResult["summary"],
) {
  const sentences = (interpretation ?? "")
    .split(/[\n.!?]+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => extractHeadline(chunk, 150))
    .slice(0, 3);

  return {
    think: sentences[0] ?? extractHeadline(summary.strengths[0] ?? "기획을 먼저 세우면 판단이 빨라집니다.", 150),
    feel: sentences[1] ?? extractHeadline(summary.risks[0] ?? "감정 반응이 커지면 오해가 생기기 쉽습니다.", 150),
    act: sentences[2] ?? extractHeadline(summary.actionsNow[0] ?? "작은 실행의 반복이 안정적인 흐름을 만듭니다.", 150),
  };
}

function makeLifeAreaCard({
  id,
  title,
  chapter,
  fallbackInterpretation,
  fallbackEvidence,
  fallbackDo,
  fallbackDont,
}: {
  id: any;
  title: string;
  chapter: any;
  fallbackInterpretation: string;
  fallbackEvidence: string[];
  fallbackDo: string;
  fallbackDont: string;
}) {
  const { doItems, dontItems } = splitActionGuide(chapter?.actionGuide ?? []);
  const normalizedDo = normalizeActionList(doItems, 2);
  const normalizedDont = normalizeActionList(dontItems, 2);
  const evidence = (chapter?.evidence ?? [])
    .map((item: string) => item.replace(/\s+/g, " ").trim())
    .filter((item: string) => item.length > 0)
    .slice(0, 3);

  return {
    id,
    title,
    coreInterpretation: getPrimarySentence(chapter?.interpretation ?? fallbackInterpretation),
    evidence: evidence.length > 0 ? evidence : fallbackEvidence,
    doList: normalizedDo.length > 0 ? normalizedDo : [fallbackDo],
    dontList: normalizedDont.length > 0 ? normalizedDont : [fallbackDont],
  };
}

export function buildLifeAreaDeepDiveCards({
  relationshipChapter,
  workChapter,
  moneyChapter,
  healthChapter,
  timingChapter,
  fallbackActions,
}: {
  relationshipChapter?: any;
  workChapter?: any;
  moneyChapter?: any;
  healthChapter?: any;
  timingChapter?: any;
  fallbackActions: string[];
}) {
  return [
    makeLifeAreaCard({
      id: "relationship",
      title: "관계",
      chapter: relationshipChapter,
      fallbackInterpretation: "기대치를 먼저 공유하면 감정 소모를 크게 줄일 수 있습니다.",
      fallbackEvidence: ["바라는 점을 명확히 언어화하면 오해를 방지할 수 있습니다."],
      fallbackDo: fallbackActions[0] ?? "오늘 내가 바라는 점을 짧은 문장으로 먼저 전달해 보세요.",
      fallbackDont: "감정이 크게 동요할 때는 성급하게 결론을 내리지 않는 것이 좋습니다.",
    }),
    makeLifeAreaCard({
      id: "work",
      title: "일",
      chapter: workChapter,
      fallbackInterpretation: "이번 주 핵심 목표 하나에만 집중하면 성과가 더욱 선명해질 것입니다.",
      fallbackEvidence: ["핵심 목표 한 가지에 몰입할 때 업무 완료율이 크게 상승합니다."],
      fallbackDo: fallbackActions[1] ?? fallbackActions[0] ?? "어디까지 할지 완료 기준부터 뚜렷하게 정하고 시작해 보세요.",
      fallbackDont: "현재 하고 있는 일을 마치기 전까지는 새로운 일을 늘리지 않는 편이 유리합니다.",
    }),
    makeLifeAreaCard({
      id: "money",
      title: "재정",
      chapter: moneyChapter,
      fallbackInterpretation: "고정 지출을 가볍게 정리하는 것만으로도 현금 흐름이 매우 안정됩니다.",
      fallbackEvidence: ["정기적인 고정비 점검은 재정의 불확실성을 낮춰줍니다."],
      fallbackDo: fallbackActions[2] ?? fallbackActions[0] ?? "고정비와 반복되는 지출 항목을 먼저 분류해 보세요.",
      fallbackDont: "충분한 검토 없이 즉흥적으로 결제하는 것은 잠시 미루는 것이 좋습니다.",
    }),
    makeLifeAreaCard({
      id: "health",
      title: "건강/리듬",
      chapter: healthChapter,
      fallbackInterpretation: "충분한 회복 시간을 먼저 확보해 두면 집중력과 실행력이 오래 유지됩니다.",
      fallbackEvidence: ["피로가 누적되면 중요한 순간에 의사결정의 질이 떨어질 수 있습니다."],
      fallbackDo: "하루 중 온전히 쉴 수 있는 30분의 회복 시간을 먼저 차단해 두세요.",
      fallbackDont: "피로도가 높은 날에는 에너지가 많이 쓰이는 일정을 연달아 잡지 마시길 권장합니다.",
    }),
    makeLifeAreaCard({
      id: "timing",
      title: "타이밍/흐름",
      chapter: timingChapter,
      fallbackInterpretation: "실행하는 시간과 점검하는 시간을 분리하면 마음의 여유가 생깁니다.",
      fallbackEvidence: ["실행과 검증의 리듬을 분리하는 것이 안정감을 줍니다."],
      fallbackDo: "이번 달 가장 귀중한 일정의 마무리 점검 시점을 캘린더에 미리 표시해 두세요.",
      fallbackDont: "단순한 분위기 변화 때문에 세워둔 계획을 너무 자주 바꾸지 않는 것이 좋습니다.",
    }),
  ];
}
