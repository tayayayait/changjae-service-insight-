export type PalmMode = "main" | "face";

export const PALM_SECTION_IDS = [
  "personality",
  "wealth-career",
  "relationship",
  "timing",
] as const;

export type PalmSectionId = (typeof PALM_SECTION_IDS)[number];
export type PalmQaScope = "summary" | "detailed";

export interface PalmistryLikeResult {
  classification?: {
    palm_type?: string;
    dominant_line?: string;
    confidence?: number;
  };
  interpretation?: string;
  features?: Record<string, number>;
  quality?: {
    overall?: number;
    reasons?: string[];
    hand_detected?: boolean;
    palm_centered?: boolean;
    blur_score?: number;
    exposure_score?: number;
  };
}

export interface PalmSectionReport {
  id: PalmSectionId;
  label: string;
  summary: string;
  details: string[];
}

const LEGACY_MODE_TO_SECTION: Record<string, PalmSectionId> = {
  billionaire: "wealth-career",
  history: "timing",
};

const isPalmSectionId = (value: string | null): value is PalmSectionId =>
  Boolean(value) && (PALM_SECTION_IDS as readonly string[]).includes(value);

const toSafeMetric = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
};

const dominantLineLabel = (result: PalmistryLikeResult) => {
  const explicit = result.classification?.dominant_line;
  if (explicit === "Life") return "생명선";
  if (explicit === "Head") return "두뇌선";
  if (explicit === "Heart") return "감정선";

  const life = toSafeMetric(result.features?.life_length);
  const head = toSafeMetric(result.features?.head_length);
  const heart = toSafeMetric(result.features?.heart_length);
  const maxValue = Math.max(life, head, heart);

  if (maxValue === life) return "생명선";
  if (maxValue === head) return "두뇌선";
  return "감정선";
};

export const resolvePalmModeAndSection = (
  modeRaw: string | null,
  sectionRaw: string | null,
): { mode: PalmMode; section: PalmSectionId } => {
  if (modeRaw === "face") {
    return { mode: "face", section: "personality" };
  }

  if (modeRaw && modeRaw in LEGACY_MODE_TO_SECTION) {
    return { mode: "main", section: LEGACY_MODE_TO_SECTION[modeRaw] };
  }

  if (modeRaw === "main") {
    return {
      mode: "main",
      section: isPalmSectionId(sectionRaw) ? sectionRaw : "personality",
    };
  }

  if (isPalmSectionId(sectionRaw)) {
    return { mode: "main", section: sectionRaw };
  }

  return { mode: "main", section: "personality" };
};

export const buildPalmSectionReports = (result: PalmistryLikeResult): PalmSectionReport[] => {
  const life = toSafeMetric(result.features?.life_length);
  const head = toSafeMetric(result.features?.head_length);
  const heart = toSafeMetric(result.features?.heart_length);

  const intersections =
    toSafeMetric(result.features?.life_head_intersection) +
    toSafeMetric(result.features?.life_heart_intersection) +
    toSafeMetric(result.features?.head_heart_intersection);
  const spread = Math.max(life, head, heart) - Math.min(life, head, heart);
  const palmType = result.classification?.palm_type ?? "미분류";
  const dominant = dominantLineLabel(result);

  return [
    {
      id: "personality",
      label: "성향",
      summary: `${dominant} 중심 패턴이 상대적으로 강하며, 현재 분류는 ${palmType}입니다.`,
      details: [
        `주요 선 길이 분포는 생명선 ${life}px / 두뇌선 ${head}px / 감정선 ${heart}px입니다.`,
        "길이 균형과 선 중심축을 기준으로 사고/감정/실행 비중을 해석합니다.",
        "핵심 선택은 빠른 결론보다 1회 검증 루프를 추가할 때 안정성이 높습니다.",
      ],
    },
    {
      id: "wealth-career",
      label: "재물/커리어",
      summary: `두뇌선(${head}px)과 생명선(${life}px) 기반으로 보면 실행-판단 균형 점검이 핵심입니다.`,
      details: [
        "커리어 해석은 선 길이 비율과 교차 패턴을 결합해 변동성/집중도를 추정합니다.",
        `현재 길이 편차는 ${spread}px로, 전략 전환 시 사전 점검 체크리스트가 필요합니다.`,
        "재무 의사결정은 단기 실행과 리스크 분산 기준을 분리해서 관리하는 것이 유리합니다.",
      ],
    },
    {
      id: "relationship",
      label: "관계",
      summary: `감정선(${heart}px) 기준으로 관계 에너지 표현 강도를 점검할 수 있습니다.`,
      details: [
        "관계 해석은 감정선 길이와 교차 신호를 우선 반영합니다.",
        `총 교차 신호는 ${intersections}회로 계산되며, 높을수록 대화 규칙 명확화가 필요합니다.`,
        "감정 표현은 즉흥 반응보다 합의된 리듬을 유지할 때 관계 마찰이 줄어듭니다.",
      ],
    },
    {
      id: "timing",
      label: "변화시기",
      summary: `현재 손금 길이 편차(${spread}px)와 교차 신호(${intersections}회)를 기준으로 변화 구간을 추적합니다.`,
      details: [
        "변화시기 평가는 절대 예측이 아니라 이전 기록 대비 상대 변화량 기준입니다.",
        "동일 조명/각도 조건으로 주기적으로 촬영하면 추세 신뢰도가 높아집니다.",
        "변화 신호가 누적될수록 실행 계획을 짧은 주기로 재검토하는 것이 안전합니다.",
      ],
    },
  ];
};

export const buildPalmQaContext = (
  result: PalmistryLikeResult,
  section: PalmSectionReport,
  scope: PalmQaScope,
): {
  classification: { palm_type: string; dominant_line?: string; confidence?: number };
  interpretation: string;
  features: Record<string, number>;
  quality?: {
    overall?: number;
    reasons?: string[];
    hand_detected?: boolean;
    palm_centered?: boolean;
    blur_score?: number;
    exposure_score?: number;
  };
} => {
  const normalizedResult = {
    classification: {
      palm_type: result.classification?.palm_type ?? "미분류",
      dominant_line: result.classification?.dominant_line,
      confidence: result.classification?.confidence,
    },
    interpretation: result.interpretation ?? "",
    features: {
      life_length: toSafeMetric(result.features?.life_length),
      head_length: toSafeMetric(result.features?.head_length),
      heart_length: toSafeMetric(result.features?.heart_length),
      break_count: toSafeMetric(result.features?.break_count),
      curvature: toSafeMetric(result.features?.curvature),
    },
    quality: result.quality,
  };

  if (scope === "detailed") {
    return normalizedResult;
  }

  return {
    classification: {
      palm_type: normalizedResult.classification.palm_type,
    },
    interpretation: section.summary,
    features: normalizedResult.features,
    quality: normalizedResult.quality,
  };
};
