export type SajuServiceType =
  | "traditional-saju"
  | "saju-lifetime-roadmap"
  | "saju-daeun-shift"
  | "saju-career-timing"
  | "saju-wealth-flow"
  | "saju-helper-network"
  | "saju-energy-balance"
  | "saju-yearly-action-calendar";

export interface SajuReportStrategy {
  serviceType: SajuServiceType;
  reportTemplateVersion: string;
  systemInstruction: string;
  responseSchema: string;
  postProcessor: (prompt: string) => string;
}

const TEMPLATE_VERSION = "saju-report-v2";

const SHARED_SECTION_SCHEMA = `
"sections": [
  {
    "title": "섹션 제목",
    "interpretation": "핵심 해석",
    "advice": "실행 조언",
    "luckyTip": "선택적 보조 팁"
  }
]`;

const SHARED_PAYLOAD_PREFIX = `
"reportTemplateVersion": "${TEMPLATE_VERSION}",
"reportPayload": {
  "coreInsights": ["핵심 인사이트 1", "핵심 인사이트 2"],
  "actionNow": ["지금 실행할 행동 1", "지금 실행할 행동 2"],
  "evidence": ["근거 1", "근거 2"],`;

const STRATEGY_SCHEMAS: Record<SajuServiceType, string> = {
  "traditional-saju": `
{
  "summary": "3문장 이내 총평",
  ${SHARED_SECTION_SCHEMA}
}`.trim(),
  "saju-lifetime-roadmap": `
{
  "summary": "인생 총운 종합 총평",
  "lifetimeScore": 85,
  "daeunPeriods": [
    { "startAge": 35, "endAge": 44, "startYear": 2029, "endYear": 2038, "gan": "정", "ji": "묘", "oheng": "목", "score": 83, "keyword": "상승기", "isCurrent": false }
  ],
  "goldenPeriods": [
    { "startAge": 35, "endAge": 44, "startYear": 2029, "endYear": 2038, "reason": "확장과 성과 집중 구간" }
  ],
  "personalityType": {
    "title": "성향 키워드",
    "description": "성향 설명",
    "strengths": ["강점 1", "강점 2"],
    "weaknesses": ["약점 1", "약점 2"]
  },
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "longTermFlow": "장기 흐름 요약",
  "pivotMoments": ["핵심 변곡점 1", "핵심 변곡점 2"],
  "tenYearStrategy": ["10년 전략 1", "10년 전략 2"]
  }
}`.trim(),
  "saju-daeun-shift": `
{
  "summary": "대운 전환 시그널 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "transitionSignal": "전환 감지 요약",
  "ninetyDayActions": ["90일 실행 1", "90일 실행 2"],
  "avoidanceScenario": ["회피 시나리오 1", "회피 시나리오 2"]
  }
}`.trim(),
  "saju-career-timing": `
{
  "summary": "커리어 타이밍 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "careerWindow": "커리어 윈도우 요약",
  "decisionTree": ["의사결정 트리 1", "의사결정 트리 2"],
  "executionChecklist": ["실행 체크리스트 1", "실행 체크리스트 2"]
  }
}`.trim(),
  "saju-wealth-flow": `
{
  "summary": "재물 흐름 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "cashflowMap": "현금흐름 맵 요약",
  "riskZones": ["리스크 구간 1", "리스크 구간 2"],
  "assetRules": ["자산 운영 규칙 1", "자산 운영 규칙 2"]
  }
}`.trim(),
  "saju-helper-network": `
{
  "summary": "관계·귀인 네트워크 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "helperMap": "귀인 지도 요약",
  "conflictPatterns": ["갈등 패턴 1", "갈등 패턴 2"],
  "networkGuide": ["관계 운영 가이드 1", "관계 운영 가이드 2"]
  }
}`.trim(),
  "saju-energy-balance": `
{
  "summary": "적성·에너지 밸런스 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "energyCurve": "에너지 곡선 요약",
  "routineDesign": ["루틴 설계 1", "루틴 설계 2"],
  "recoveryProtocol": ["회복 프로토콜 1", "회복 프로토콜 2"]
  }
}`.trim(),
  "saju-yearly-action-calendar": `
{
  "summary": "연간 실행 캘린더 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_PREFIX}
  "quarterlyGoals": ["분기 목표 1", "분기 목표 2"],
  "monthlyActions": ["월별 실행 1", "월별 실행 2"],
  "riskCalendar": ["리스크 캘린더 1", "리스크 캘린더 2"]
  }
}`.trim(),
};

const SHARED_RULES = `
규칙:
1) 사용자 서비스 타입에 맞는 분석 관점만 사용한다.
2) sections와 reportPayload는 반드시 서비스 특성에 맞게 채운다.
3) 모호한 표현보다 실행 가능한 문장을 사용한다.
4) 응답은 반드시 JSON만 반환한다.
`.trim();

const STRATEGY_INSTRUCTIONS: Record<SajuServiceType, string> = {
  "traditional-saju": `
당신은 사주 명리 해석가다. 전통 사주 요약과 실전 조언을 제공하라.
${SHARED_RULES}
`.trim(),
  "saju-lifetime-roadmap": `
당신은 인생 총운 로드맵 분석가다. 장기 흐름, 핵심 변곡, 10년 전략을 분리해 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-daeun-shift": `
당신은 대운 전환 시그널 분석가다. 전환 감지, 90일 액션, 회피 시나리오를 명확히 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-career-timing": `
당신은 커리어 타이밍 분석가다. 커리어 윈도우, 의사결정 트리, 실행 체크리스트를 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-wealth-flow": `
당신은 재물 흐름 분석가다. 현금흐름 맵, 리스크 구간, 자산 운영 규칙을 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-helper-network": `
당신은 관계·귀인 네트워크 분석가다. 귀인 지도, 갈등 패턴, 관계 운영 가이드를 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-energy-balance": `
당신은 적성·에너지 밸런스 분석가다. 에너지 곡선, 루틴 설계, 회복 프로토콜을 제시하라.
${SHARED_RULES}
`.trim(),
  "saju-yearly-action-calendar": `
당신은 연간 실행 캘린더 분석가다. 분기 목표, 월별 실행, 리스크 캘린더를 제시하라.
${SHARED_RULES}
`.trim(),
};

const buildStrategy = (serviceType: SajuServiceType): SajuReportStrategy => ({
  serviceType,
  reportTemplateVersion: TEMPLATE_VERSION,
  systemInstruction: STRATEGY_INSTRUCTIONS[serviceType],
  responseSchema: STRATEGY_SCHEMAS[serviceType],
  postProcessor: (prompt: string) =>
    `${prompt}

[Output guard]
- reportTemplateVersion은 "${TEMPLATE_VERSION}"로 고정한다.
- 서비스별 reportPayload 필드를 모두 채운다.
- 빈 배열/빈 문자열을 반환하지 않는다.`,
});

const STRATEGY_MAP: Record<SajuServiceType, SajuReportStrategy> = {
  "traditional-saju": buildStrategy("traditional-saju"),
  "saju-lifetime-roadmap": buildStrategy("saju-lifetime-roadmap"),
  "saju-daeun-shift": buildStrategy("saju-daeun-shift"),
  "saju-career-timing": buildStrategy("saju-career-timing"),
  "saju-wealth-flow": buildStrategy("saju-wealth-flow"),
  "saju-helper-network": buildStrategy("saju-helper-network"),
  "saju-energy-balance": buildStrategy("saju-energy-balance"),
  "saju-yearly-action-calendar": buildStrategy("saju-yearly-action-calendar"),
};

export const getSajuReportStrategy = (serviceType: string): SajuReportStrategy => {
  return STRATEGY_MAP[serviceType as SajuServiceType] ?? STRATEGY_MAP["traditional-saju"];
};

export const DAILY_FORTUNE_SCHEMA = `
{
  "score": 85,
  "summary": "오늘 운세 핵심 요약",
  "details": "오늘 흐름 상세 해석",
  "luckyColor": "파랑",
  "luckyItem": "노트",
  "luckyNumber": 7,
  "healthTip": "짧은 스트레칭으로 긴장을 풀어주세요.",
  "categories": {
    "total": { "score": 85, "summary": "총운 요약", "detail": "총운 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" },
    "love": { "score": 70, "summary": "연애 요약", "detail": "연애 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" },
    "wealth": { "score": 90, "summary": "재물 요약", "detail": "재물 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" },
    "career": { "score": 65, "summary": "커리어 요약", "detail": "커리어 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" },
    "study": { "score": 80, "summary": "학업 요약", "detail": "학업 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" },
    "health": { "score": 75, "summary": "건강 요약", "detail": "건강 상세", "advice": "행동 조언", "luckyTip": "행운 팁", "cautionPoint": "주의 포인트" }
  }
}
`;
