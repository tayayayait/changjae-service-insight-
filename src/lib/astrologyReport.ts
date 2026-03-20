import { z } from "zod";
import {
  AstrologyBirthReportResult,
  AstrologyDeepData,
  AstrologyPlanet,
  AstrologyQuarterNode,
  AstrologyRequest,
  AstrologyReportChapter,
  AstrologyReportChapterId,
  AstrologyReportConfidence,
  AstrologyReportSummary,
  AstrologyReportTiming,
  AstrologyResult,
} from "@/types/result";

const elementDistributionSchema = z.object({
  fire: z.number(),
  earth: z.number(),
  air: z.number(),
  water: z.number(),
});

const qualityDistributionSchema = z.object({
  cardinal: z.number(),
  fixed: z.number(),
  mutable: z.number(),
});

const reportSummarySchema = z.object({
  keynote: z.string().min(1),
  strengths: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  actionsNow: z.array(z.string()).min(1),
});

const reportChapterSchema = z.object({
  id: z.enum(["personality", "relationship", "timing", "future-flow"]),
  title: z.string().min(1),
  interpretation: z.string().min(1),
  evidence: z.array(z.string()).min(1),
  actionGuide: z.array(z.string()).min(1),
  aiInsight: z.string().nullable().optional(),
});

const quarterFlowNodeSchema = z.object({
  label: z.string().min(1),
  focus: z.string().min(1),
  caution: z.string().min(1),
  score: z.number().min(0).max(100),
});

const reportTimingSchema = z.object({
  monthFocus: z.string().min(1),
  monthCaution: z.string().min(1),
  quarterFlow: z.array(quarterFlowNodeSchema).min(3),
});

const reportConfidenceSchema = z.object({
  birthTimeKnown: z.boolean(),
  level: z.enum(["high", "medium"]),
  message: z.string().min(1),
});

const deepDataSchema = z.object({
  data: z.any(),
  big3: z.any(),
  planets: z.array(z.any()),
  houses: z.array(z.any()),
  aspects: z.array(z.any()),
  elementDistribution: elementDistributionSchema,
  qualityDistribution: qualityDistributionSchema,
  chartSvg: z.string(),
  chart_svg: z.string().optional(),
});

export const astrologyBirthReportSchema = z.object({
  success: z.boolean(),
  generatedAt: z.string().min(1),
  summary: reportSummarySchema,
  chapters: z.array(reportChapterSchema).min(4),
  timing: reportTimingSchema,
  deepData: deepDataSchema,
  confidence: reportConfidenceSchema,
});

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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const dominantKey = (entries: Array<{ key: string; value: number }>, fallback: string) => {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  return sorted[0]?.key || fallback;
};

const planetByName = (planets: AstrologyPlanet[], name: string) => planets.find((planet) => planet.name === name);

const buildQuarterFlow = (baseScore: number): AstrologyQuarterNode[] =>
  ["이번 달", "다음 달", "3개월 후"].map((label, index) => {
    const score = clamp(baseScore + (index === 0 ? 5 : index === 1 ? 0 : -4), 35, 95);
    return {
      label,
      focus:
        score >= 70
          ? "결정해야 할 과제는 이번 분기 내 실행까지 연결하는 편이 유리합니다."
          : "핵심 1개 과제에만 집중해 리소스 분산을 줄이는 전략이 필요합니다.",
      caution:
        score < 60
          ? "감정 피로가 누적되면 판단 편향이 커질 수 있어 속도보다 검증이 우선입니다."
          : "기회가 보여도 과도한 약속을 만들면 후반부 체력이 급격히 떨어질 수 있습니다.",
      score,
    };
  });

export const buildFallbackAstrologyBirthReport = (
  deepData: AstrologyDeepData,
  req?: Pick<AstrologyRequest, "birthTimeKnown">,
  aiInsight?: string | null,
): AstrologyBirthReportResult => {
  const safeDeep = deepData ?? defaultDeepData();
  const planets = safeDeep.planets ?? [];
  const aspects = safeDeep.aspects ?? [];

  const dominantElement = dominantKey(
    [
      { key: "fire", value: safeDeep.elementDistribution.fire },
      { key: "earth", value: safeDeep.elementDistribution.earth },
      { key: "air", value: safeDeep.elementDistribution.air },
      { key: "water", value: safeDeep.elementDistribution.water },
    ],
    "fire",
  );
  const dominantQuality = dominantKey(
    [
      { key: "cardinal", value: safeDeep.qualityDistribution.cardinal },
      { key: "fixed", value: safeDeep.qualityDistribution.fixed },
      { key: "mutable", value: safeDeep.qualityDistribution.mutable },
    ],
    "cardinal",
  );

  const positiveAspectCount = aspects.filter((aspect) => aspect.influence === "positive").length;
  const negativeAspectCount = aspects.filter((aspect) => aspect.influence === "negative").length;
  const baseScore = clamp(58 + positiveAspectCount * 5 - negativeAspectCount * 4, 35, 90);
  const quarterFlow = buildQuarterFlow(baseScore);

  const sun = safeDeep.big3.sun;
  const moon = safeDeep.big3.moon;
  const rising = safeDeep.big3.rising;
  const venus = planetByName(planets, "Venus");
  const mars = planetByName(planets, "Mars");

  const summary: AstrologyReportSummary = {
    keynote: `${sun.signKo} 태양, ${moon.signKo} 달, ${rising.signKo} 상승궁 조합은 "내적 감정과 외부 표현의 간격"을 관리할 때 강점이 커지는 구조입니다.`,
    strengths: [
      `${dominantElement.toUpperCase()} 원소 비중이 높아 핵심 의사결정 속도가 빠른 편입니다.`,
      `${dominantQuality.toUpperCase()} 성향이 우세해 일정 운영의 기준을 세우면 성과가 안정됩니다.`,
      `긍정 각(${positiveAspectCount}개)이 부정 각(${negativeAspectCount}개) 대비 ${
        positiveAspectCount >= negativeAspectCount ? "우위" : "열위"
      }입니다.`,
    ],
    risks: [
      "관계·업무·휴식 경계가 무너지면 감정 소모가 빠르게 누적될 수 있습니다.",
      "한 번에 너무 많은 과제를 시작하면 후반 집중도가 급격히 떨어질 수 있습니다.",
      "감정 반응 직후 결정하면 장기 흐름보다 단기 완화에 치우칠 수 있습니다.",
    ],
    actionsNow: [
      "이번 주 핵심 목표 1개만 확정하고 나머지는 보류 목록으로 분리하세요.",
      "중요 대화는 결론 전에 확인 질문 1회로 해석 오류를 줄이세요.",
      "월간 캘린더에 집중 구간/완충 구간을 분리해 실행 강도를 조절하세요.",
    ],
  };

  const chapters: AstrologyReportChapter[] = [
    {
      id: "personality",
      title: "성향 분석",
      interpretation: `${sun.signKo} 태양은 의식적 목표를, ${moon.signKo} 달은 감정 반응을, ${rising.signKo} 상승궁은 대외 표현을 담당합니다. 세 축의 간격을 의식적으로 조절할수록 성과 편차가 줄어듭니다.`,
      evidence: [
        `태양: ${sun.signKo} (${sun.element}/${sun.quality})`,
        `달: ${moon.signKo} (${moon.element}/${moon.quality})`,
        `상승궁: ${rising.signKo} (${rising.element}/${rising.quality})`,
      ],
      actionGuide: [
        "결정 직전 10분 점검 루틴(목표/감정/표현)을 고정하세요.",
        "강점 영역은 선제 실행, 취약 영역은 체크리스트 기반으로 운영하세요.",
      ],
      aiInsight: aiInsight ?? null,
    },
    {
      id: "relationship",
      title: "관계 분석",
      interpretation: `관계 패턴은 달·금성·화성 배치의 조합에서 주로 나타납니다. ${
        venus && mars
          ? `${venus.signKo} 금성과 ${mars.signKo} 화성의 조합은 매력 표현과 경계 설정의 균형이 핵심입니다.`
          : "현재 데이터에서는 달 중심으로 정서 반응과 소통 속도 조절이 우선 과제입니다."
      }`,
      evidence: [
        `달: ${moon.signKo}`,
        `금성: ${venus?.signKo ?? "미확인"}`,
        `화성: ${mars?.signKo ?? "미확인"}`,
      ],
      actionGuide: [
        "중요 관계는 기대치와 역할 범위를 문장으로 명시하세요.",
        "감정 반응이 큰 날은 결론보다 정보 수집을 우선하세요.",
      ],
      aiInsight: null,
    },
    {
      id: "timing",
      title: "시기 해석",
      interpretation: `당월 흐름은 각의 밀도와 품질 분포에 크게 영향을 받습니다. 긍정 각 ${positiveAspectCount}개, 부정 각 ${negativeAspectCount}개의 비율을 기준으로 실행 강도를 조절하는 편이 유리합니다.`,
      evidence: [
        `긍정 각: ${positiveAspectCount}개`,
        `부정 각: ${negativeAspectCount}개`,
        `우세 성질: ${dominantQuality}`,
      ],
      actionGuide: [
        "월 초에는 실행, 월 중반에는 검증, 월 말에는 정리로 리듬을 고정하세요.",
        "강한 갈등 신호가 보이면 일정 압축 대신 범위 축소를 선택하세요.",
      ],
      aiInsight: null,
    },
    {
      id: "future-flow",
      title: "미래 흐름",
      interpretation: "미래 흐름은 단일 운세 점수보다 분기 내 반복 패턴을 기준으로 읽는 것이 안정적입니다. 이번 분기는 집중 구간과 완충 구간을 분리해 운영할 때 성과 편차를 줄일 수 있습니다.",
      evidence: quarterFlow.map((node) => `${node.label}: ${node.score}점`),
      actionGuide: [
        "분기 목표를 월 단위로 쪼개고, 각 월 핵심 지표 1개만 추적하세요.",
        "기회 구간에는 실행 비중을, 주의 구간에는 검증 비중을 높이세요.",
      ],
      aiInsight: null,
    },
  ];

  const timing: AstrologyReportTiming = {
    monthFocus: quarterFlow[0].focus,
    monthCaution: quarterFlow[0].caution,
    quarterFlow,
  };

  const birthTimeKnown = req?.birthTimeKnown ?? true;
  const confidence: AstrologyReportConfidence = {
    birthTimeKnown,
    level: birthTimeKnown ? "high" : "medium",
    message: birthTimeKnown
      ? "출생시간이 포함되어 하우스/상승궁 기반 해석 신뢰도가 높습니다."
      : "출생시간 미확정으로 상승궁/하우스 해석은 중간 신뢰도로 표시됩니다.",
  };

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    summary,
    chapters,
    timing,
    deepData: safeDeep,
    confidence,
  };
};

export const toAstrologyDeepData = (payload: unknown): AstrologyDeepData => {
  if (payload && typeof payload === "object" && "deepData" in payload) {
    const deepCandidate = (payload as { deepData?: unknown }).deepData;
    const parsed = deepDataSchema.safeParse(deepCandidate);
    if (parsed.success) {
      return parsed.data as AstrologyDeepData;
    }
  }

  const root = (payload ?? {}) as Partial<AstrologyResult> & { chart_svg?: string };
  const fallback = defaultDeepData();
  return {
    data: root.data ?? fallback.data,
    big3: (root.big3 ?? fallback.big3) as AstrologyDeepData["big3"],
    planets: (root.planets ?? fallback.planets) as AstrologyPlanet[],
    houses: (root.houses ?? fallback.houses) as AstrologyDeepData["houses"],
    aspects: (root.aspects ?? fallback.aspects) as AstrologyDeepData["aspects"],
    elementDistribution: root.elementDistribution ?? fallback.elementDistribution,
    qualityDistribution: root.qualityDistribution ?? fallback.qualityDistribution,
    chartSvg: root.chartSvg ?? root.chart_svg ?? "",
    chart_svg: root.chart_svg,
  };
};

export const normalizeAstrologyBirthReport = (
  payload: unknown,
  req?: Pick<AstrologyRequest, "birthTimeKnown">,
): AstrologyBirthReportResult => {
  const parsed = astrologyBirthReportSchema.safeParse(payload);
  if (parsed.success) {
    return parsed.data as AstrologyBirthReportResult;
  }
  return buildFallbackAstrologyBirthReport(toAstrologyDeepData(payload), req, null);
};

export const chapterLabelMap: Record<AstrologyReportChapterId, string> = {
  personality: "성향 분석",
  relationship: "관계 분석",
  timing: "시기 해석",
  "future-flow": "미래 흐름",
};
