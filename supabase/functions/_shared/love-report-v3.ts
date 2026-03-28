export type LoveV3ServiceType = "future-partner" | "couple-report" | "crush-reunion";
export type LoveReportLayout = "future-partner-v3" | "couple-report-v3" | "crush-reunion-v3";
export const LOVE_V3_REPORT_VERSION = "v3-differentiated";
export const LOVE_V3_TEMPLATE_VERSION = "love-differentiated-v3";

export interface LoveV3SectionDefinition {
  id: string;
  navLabel: string;
  title: string;
  coreQuestion: string;
  lockedBenefit: string;
}

export interface LoveReportStrategy {
  serviceType: LoveV3ServiceType;
  reportVersion: "v3-differentiated";
  templateVersion: "love-differentiated-v3";
  reportLayout: LoveReportLayout;
  tone: string;
  summaryGuardrails: string[];
  systemInstruction: string;
  responseSchema: string;
  sections: LoveV3SectionDefinition[];
}

const partnerInsightsSchema = `{
  "partnerProfile": {
    "matchKeywords": ["키워드 1", "키워드 2"],
    "avoidKeywords": ["키워드 1", "키워드 2"],
    "idealDescription": "요약 2문장"
  },
  "meetingChannels": ["만남 경로 1", "만남 경로 2", "만남 경로 3"],
  "greenFlags": ["초기 그린 플래그 1", "초기 그린 플래그 2", "초기 그린 플래그 3"],
  "redFlags": ["초기 레드 플래그 1", "초기 레드 플래그 2", "초기 레드 플래그 3"],
  "selfCheckCriteria": ["내가 먼저 점검할 기준 1", "기준 2", "기준 3"]
}`;

const coupleInsightsSchema = `{
  "conflictTriggers": ["갈등 트리거 1", "갈등 트리거 2", "갈등 트리거 3"],
  "repairRituals": ["회복 루틴 1", "회복 루틴 2", "회복 루틴 3"],
  "agreementChecklist": ["합의 체크리스트 1", "체크리스트 2", "체크리스트 3"],
  "doNotSay": ["금지 문장 1", "금지 문장 2", "금지 문장 3"],
  "recoverySignals": ["회복 신호 1", "회복 신호 2", "회복 신호 3"]
}`;

const reunionInsightsSchema = `{
  "chanceVerdict": "가능성 있음 | 제한적 | 확실한 정보 없음",
  "positiveSignals": ["긍정 신호 1", "긍정 신호 2", "긍정 신호 3"],
  "blockingSignals": ["막는 신호 1", "막는 신호 2", "막는 신호 3"],
  "contactWindow": "연락 가능 창 설명 2문장",
  "stopLossRules": ["중단 조건 1", "중단 조건 2", "중단 조건 3"],
  "contactScripts": ["보내도 되는 문장 1", "보내도 되는 문장 2", "보내면 안 되는 문장 1"]
}`;

const sharedSchemaPrefix = `{
  "headline": "강한 한 줄 헤드라인",
  "summary": "서비스 요약 2문장",
  "quickCounsel": {
    "diagnosis": "무료 진단 한 문장",
    "temperatureLabel": "서비스별 라벨",
    "temperatureText": "온도 설명 한 문장",
    "immediateAction": "지금 당장 할 행동 한 문장"
  },
  "previewHighlights": ["무료 핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3"],
  "ctaReason": "왜 유료 리포트를 열어야 하는지 한 문장",
  "confidenceSummary": "시간/상대 정보 신뢰도 요약 1문장",
  "sections": [
    {
      "id": "service-specific-id",
      "navLabel": "탭 라벨",
      "title": "섹션 제목",
      "coreQuestion": "핵심 질문",
      "verdict": "핵심 판정 1~2문장",
      "analysisParagraphs": ["해석 문단 1", "해석 문단 2"],
      "interpretationPoints": ["해석 포인트 1", "해석 포인트 2", "해석 포인트 3"],
      "actionTitle": "행동 블록 제목",
      "actionItems": ["행동 1", "행동 2", "행동 3"],
      "warningNote": "짧은 경고 1문장",
      "lockedBenefit": "해제 후 얻게 될 가치 1문장"
    }
  ],
  "scoreNarratives": [
    { "label": "끌림", "score": 70, "interpretation": "점수 해석", "why": "이 점수가 나온 이유" }
  ],
  "actionRoadmap": {
    "now": ["지금 할 행동 1", "지금 할 행동 2"],
    "within7Days": ["7일 행동 1", "7일 행동 2"],
    "within30Days": ["30일 행동 1", "30일 행동 2"]
  },
  "conversationPrompts": ["실제 문장 1", "실제 문장 2", "실제 문장 3"],
  "avoidList": ["하지 말아야 할 행동 1", "행동 2", "행동 3"],
  "confidenceNotes": ["신뢰도 메모 1", "메모 2", "메모 3"],
  "serviceInsights": SERVICE_INSIGHTS
}`;

const buildResponseSchema = (serviceInsightsSchema: string) =>
  sharedSchemaPrefix.replace("SERVICE_INSIGHTS", serviceInsightsSchema);

const STRATEGY_MAP: Record<LoveV3ServiceType, LoveReportStrategy> = {
  "future-partner": {
    serviceType: "future-partner",
    reportVersion: LOVE_V3_REPORT_VERSION,
    templateVersion: LOVE_V3_TEMPLATE_VERSION,
    reportLayout: "future-partner-v3",
    tone: "탐색형 상담. 미래 배우자상과 만남 환경, 결혼 준비도를 구체적으로 보여준다.",
    summaryGuardrails: [
      "현재 상대를 전제하지 않는다.",
      "상대 정보 부족이라는 변명 문장을 쓰지 않는다.",
      "만남 채널과 필터링 기준을 반드시 제시한다.",
    ],
    systemInstruction: [
      "현재 상대를 전제하지 않는다.",
      "사용자의 반복 연애 패턴과 배우자 기준을 구체화한다.",
      "meetingChannels, greenFlags, redFlags, selfCheckCriteria를 반드시 채운다.",
      "결혼 조건과 준비도는 추상 명사 대신 생활 조건과 행동 기준으로 적는다.",
    ].join(" "),
    responseSchema: buildResponseSchema(partnerInsightsSchema),
    sections: [
      { id: "partner-profile", navLabel: "배우자상", title: "누굴 만나야 하는가", coreQuestion: "내게 맞는 배우자상은 어떤 결을 가지는가", lockedBenefit: "나와 맞는 사람과 피해야 할 사람의 기준을 바로 구분할 수 있습니다." },
      { id: "my-pattern", navLabel: "내 패턴", title: "왜 같은 연애가 반복되는가", coreQuestion: "내가 끌림과 불안을 만드는 패턴은 무엇인가", lockedBenefit: "연애가 꼬이는 반복 습관과 수정 포인트를 확인할 수 있습니다." },
      { id: "meeting-flow", navLabel: "유입 환경", title: "어디서 인연이 들어오는가", coreQuestion: "가까운 시기에 인연이 유입될 가능성이 높은 환경은 어디인가", lockedBenefit: "만남 채널과 접근 방식을 현실적으로 정리할 수 있습니다." },
      { id: "marriage-timing", navLabel: "결혼 조건", title: "결혼으로 이어지려면 무엇이 필요하나", coreQuestion: "결혼 가능성을 높이는 조건과 시점은 무엇인가", lockedBenefit: "결혼 준비도와 타이밍을 구체적으로 읽을 수 있습니다." },
      { id: "screening-rules", navLabel: "필터링", title: "무엇을 기준으로 걸러야 하나", coreQuestion: "초기에 확인해야 할 레드 플래그와 필터 기준은 무엇인가", lockedBenefit: "관계 초반에 시간을 낭비하지 않을 필터링 규칙을 얻습니다." },
      { id: "evidence-note", navLabel: "근거", title: "이 판단은 무엇을 근거로 했나", coreQuestion: "오행, 배우자성, 시간 신뢰도를 어떻게 읽었는가", lockedBenefit: "왜 이런 배우자상과 시점 판단이 나왔는지 근거를 확인합니다." },
    ],
  },
  "couple-report": {
    serviceType: "couple-report",
    reportVersion: LOVE_V3_REPORT_VERSION,
    templateVersion: LOVE_V3_TEMPLATE_VERSION,
    reportLayout: "couple-report-v3",
    tone: "관계 운영형 상담. 싸움의 원인과 합의 구조, 회복 프로토콜을 다룬다.",
    summaryGuardrails: [
      "단순 잘 맞음/안 맞음 판정을 금지한다.",
      "갈등 원인과 합의 구조를 분리해서 설명한다.",
      "회복 행동은 말투와 순서까지 제시한다.",
    ],
    systemInstruction: [
      "단순 잘 맞음/안 맞음 판정 금지.",
      "갈등 트리거, 감정 속도 차이, 생활/돈/결혼 합의도, 회복 프로토콜을 분리해서 분석한다.",
      "agreementChecklist, doNotSay, repairRituals를 반드시 채운다.",
      "행동 가이드는 7일 이내 적용 가능한 대화 순서 중심으로 적는다.",
    ].join(" "),
    responseSchema: buildResponseSchema(coupleInsightsSchema),
    sections: [
      { id: "relationship-state", navLabel: "관계 현황", title: "지금 이 관계의 중심축은 무엇인가", coreQuestion: "지금 가장 먼저 봐야 할 관계 온도와 균형은 무엇인가", lockedBenefit: "현재 관계의 핵심 문제와 유지 가능성을 빠르게 파악할 수 있습니다." },
      { id: "conflict-trigger-map", navLabel: "갈등 트리거", title: "왜 반복해서 부딪히는가", coreQuestion: "두 사람이 자주 터지는 갈등의 트리거는 무엇인가", lockedBenefit: "싸움이 커지는 원인과 반복 패턴을 정확히 짚을 수 있습니다." },
      { id: "communication-speed", navLabel: "감정 속도", title: "소통과 감정 속도는 어떻게 어긋나는가", coreQuestion: "각자 어떤 속도로 반응하고 해석하는가", lockedBenefit: "오해를 줄이기 위한 대화 리듬과 감정 속도를 확인할 수 있습니다." },
      { id: "agreement-structure", navLabel: "합의 구조", title: "무엇을 합의하지 못하고 있나", coreQuestion: "생활, 돈, 결혼, 책임 배분에서 어느 부분이 비어 있는가", lockedBenefit: "관계를 오래 끌고 가기 위해 필요한 합의 체크리스트를 얻습니다." },
      { id: "repair-protocol", navLabel: "회복 프로토콜", title: "어떻게 회복해야 하나", coreQuestion: "싸운 뒤 무엇부터 복구해야 관계 손실이 적은가", lockedBenefit: "실제로 써먹을 수 있는 회복 루틴과 금지 문장을 확인할 수 있습니다." },
      { id: "evidence-note", navLabel: "근거", title: "이 판단은 무엇을 근거로 했나", coreQuestion: "오행, 합충, 시간 신뢰도를 관계 운영 관점에서 어떻게 읽었는가", lockedBenefit: "왜 특정 합의와 회복 루틴이 필요한지 근거를 확인합니다." },
    ],
  },
  "crush-reunion": {
    serviceType: "crush-reunion",
    reportVersion: LOVE_V3_REPORT_VERSION,
    templateVersion: LOVE_V3_TEMPLATE_VERSION,
    reportLayout: "crush-reunion-v3",
    tone: "판정형 상담. 재회 가능성과 손절 기준, 연락 가능 창을 냉정하게 분리한다.",
    summaryGuardrails: [
      "가능성 있음 / 제한적 / 확실한 정보 없음 중 하나를 반드시 사용한다.",
      "희망고문성 문장을 금지한다.",
      "연락 시도와 중단 조건을 함께 제시한다.",
    ],
    systemInstruction: [
      "반드시 가능성 있음 / 제한적 / 확실한 정보 없음 중 하나를 사용한다.",
      "희망고문성 문장 금지.",
      "chanceVerdict, contactWindow, stopLossRules, contactScripts를 반드시 채운다.",
      "연락 가능 창과 멈춰야 하는 조건을 함께 제시한다.",
    ].join(" "),
    responseSchema: buildResponseSchema(reunionInsightsSchema),
    sections: [
      { id: "chance-verdict", navLabel: "가능성 판정", title: "지금 가능성이 있는가", coreQuestion: "이 관계가 실제로 다시 움직일 여지가 있는가", lockedBenefit: "재회 가능성에 대한 냉정한 초기 판정을 확인할 수 있습니다." },
      { id: "break-cause", navLabel: "단절 원인", title: "왜 막혔는가", coreQuestion: "관계가 끊긴 진짜 원인과 부담 지점은 무엇인가", lockedBenefit: "재회가 막히는 핵심 원인을 오해 없이 파악할 수 있습니다." },
      { id: "signal-reading", navLabel: "신호 해석", title: "현재 신호는 어떻게 읽어야 하나", coreQuestion: "보이는 반응과 침묵이 각각 무엇을 뜻하는가", lockedBenefit: "기대와 현실을 구분하는 신호 해석 기준을 얻습니다." },
      { id: "contact-window", navLabel: "연락 가능 창", title: "언제 시도하고 언제 멈춰야 하나", coreQuestion: "접촉이 통할 시기와 오히려 손해인 시점은 언제인가", lockedBenefit: "시도 가능한 타이밍과 위험 창을 함께 확인할 수 있습니다." },
      { id: "attempt-or-stop", navLabel: "시도/중단", title: "지금의 최선은 무엇인가", coreQuestion: "연락, 거리두기, 정리 중 무엇이 현재 손실이 가장 적은가", lockedBenefit: "보내도 되는 문장과 멈춰야 하는 조건을 바로 얻을 수 있습니다." },
      { id: "evidence-note", navLabel: "근거", title: "이 판단은 무엇을 근거로 했나", coreQuestion: "합충, 오행, 시간 신뢰도를 현재 재접촉 관점에서 어떻게 읽었는가", lockedBenefit: "판정과 행동 가이드의 근거를 끝까지 검증할 수 있습니다." },
    ],
  },
};

export const getLoveReportStrategyMap = () => STRATEGY_MAP;

export const getLoveReportStrategy = (serviceType: LoveV3ServiceType): LoveReportStrategy =>
  STRATEGY_MAP[serviceType];
