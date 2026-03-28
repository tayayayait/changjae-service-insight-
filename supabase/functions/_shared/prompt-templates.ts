export type SajuServiceType =
  | "traditional-saju"
  | "saju-lifetime-roadmap"
  | "saju-daeun-shift"
  | "saju-career-timing"
  | "saju-wealth-flow"
  | "saju-helper-network"
  | "saju-energy-balance"
  | "saju-yearly-action-calendar"
  | "saju-2026-overview"
  | "saju-2026-study-exam"
  | "saju-2026-yearly-outlook"
  | "saju-love-focus"
  | "saju-2026-wealth-business"
  | "saju-2026-investment-assets"
  | "saju-2026-career-aptitude"
  | "saju-2026-health-balance";

export interface SajuReportStrategy {
  serviceType: SajuServiceType;
  reportTemplateVersion: string;
  systemInstruction: string;
  responseSchema: string;
  postProcessor: (prompt: string) => string;
}

const TEMPLATE_VERSION = "saju-report-v2.9";
const HEALTH_TEMPLATE_VERSION = "saju-report-v2.10-health";
const INVESTMENT_TEMPLATE_VERSION = "saju-report-v2.10-investment";

const SERVICE_TEMPLATE_VERSION_OVERRIDES: Partial<Record<SajuServiceType, string>> = {
  "saju-2026-health-balance": HEALTH_TEMPLATE_VERSION,
  "saju-2026-investment-assets": INVESTMENT_TEMPLATE_VERSION,
};

const SHARED_RULES = [
  "Write every user-facing sentence in Korean.",
  "Return valid JSON only. Do not add markdown, commentary, or code fences.",
  "Fill every required field in the schema.",
  "Prefer concrete, actionable phrasing over vague spiritual filler.",
  "Never use placeholder tokens like '?', 'N/A', 'unknown', 'tbd', or empty strings for required fields.",
  "For saju-wealth-flow and saju-energy-balance, never invent chart numbers. The system computes chart values deterministically from manseryeok data; focus on interpretation text.",
  "각 서비스의 analysisBlocks는 핵심 흐름, 해석 근거, 주요 기회, 리스크, 행동 전략 5요소를 모두 포함하세요.",
  "각 서비스의 coreQuestion에는 해당 서비스가 직접 답해야 하는 질문을 명시하세요.",
  "인생총운 7종은 공통 앵커를 공유하되 서비스 간 동일 문장 반복을 피하고 서비스 고유 가치가 드러나게 작성하세요.",
  "currentAge, currentYear, currentDate를 해석 근거로 사용하고, 사용자마다 동적으로 달라지는 구간을 생성하세요.",
  "고정 패턴(예: 35~44/45~54/55~64, 2029~2038) 반복 서술을 금지하세요.",
  "sections.interpretation과 상세 문단은 최소 3~5문장 이상으로 작성하고 근거 기반 설명을 포함하세요.",
  "summary는 2~3문장으로 간결하게 유지하되 본문은 구조적이고 구체적으로 작성하세요."
].join("\n");

const LIFETIME_DAEUN_OUTPUT_RULES = [
  "For daeunPeriods[*].gan use one of: 갑, 을, 병, 정, 무, 기, 경, 신, 임, 계.",
  "For daeunPeriods[*].ji use one of: 자, 축, 인, 묘, 진, 사, 오, 미, 신, 유, 술, 해.",
  "For daeunPeriods[*].oheng use one of: 목, 화, 토, 금, 수.",
  "Do not use '?' or any placeholder value for daeunPeriods[*].gan, daeunPeriods[*].ji, or daeunPeriods[*].oheng.",
  "daeunPeriods는 직전/현재/다음/다다음 4개 구간으로 채우세요.",
  "각 daeunPeriods 구간은 10년 단위를 기본으로 하고 startAge/endAge를 동적으로 계산하되 endAge는 최대 89로 제한하세요.",
  "isCurrent는 정확히 1개만 true여야 하며 currentAge를 포함하는 구간이어야 합니다.",
  "goldenPeriods는 위 4개 구간 범위 안에서만 선택하세요.",
].join("\n");

const NEW_YEAR_2026_COMMON_RULES = [
  "2026 신년운세 응답은 반드시 reportPayload를 포함한다.",
  "quickSummary.signalTrio는 숫자 점수 없이 등급형으로만 작성한다.",
  "해석 강도와 변화 신호는 약/중/강만 사용한다.",
  "주목 레벨은 낮음/보통/높음만 사용한다.",
  "yearTimeline은 1분기~4분기 4개를 모두 포함하고 각 분기에 quarterSummary를 넣는다.",
  "consistencyMeta.targetYear는 2026, consistencyMeta.ganji는 병오로 고정한다.",
].join("\n");

const NEW_YEAR_2026_OVERVIEW_RULES = [
  "focusCards는 아래 7개를 고정 순서로 모두 포함하세요: 종합, 시험·학업, 연애·결혼, 재물·사업, 주식·부동산 투자, 직업·적성, 건강.",
  "focusCards 최소 기준: dos 2개 이상, donts 1개 이상, evidencePrimary+evidenceExtra 합계 2개 이상.",
].join("\n");

const NEW_YEAR_2026_FOCUSED_RULES = [
  "다른 영역 요약 금지. 선택한 서비스 하나만 깊게 설명한다.",
  "focusCards를 출력하지 말고 선택 서비스 전용 심화 필드만 작성한다.",
  "강점, 주의점, 행동 가이드, 해석 근거를 구체 문장으로 작성한다.",
  "단일 string 필드는 2~4문장의 구체 해석 문단으로 작성한다.",
  "배열 필드는 2~4개의 구체 해석 문장으로 작성하고 각 원소를 문장 단위로 완결한다.",
  "행동 가이드 성격의 문장은 조건 + 행동 + 확인 기준 구조를 포함한다.",
  "짧은 키워드, 태그, 한 줄 요약 문구는 금지한다.",
].join("\n");

const NEW_YEAR_2026_LOVE_RULES = [
  "saju-love-focus는 기존 5개 필드와 함께 marriageDecisionBoard/meetingChannelPriority/greenFlagChecklist/redFlagChecklist/conflictProtocol/consumerFaq를 반드시 포함한다.",
  "consumerFaq는 반드시 8개 문항으로 작성하고 각 문항은 question/answer를 모두 채운다.",
  "marriageDecisionBoard는 진행/보류/중단 신호를 구분해 최소 3문장으로 작성한다.",
  "분기 해석은 기회·리스크·판단 기준·실행 2개·피해야 할 실수 1개가 드러나도록 작성한다.",
].join("\n");

const NEW_YEAR_2026_STUDY_UPGRADE_RULES = [
  "saju-2026-study-exam은 기존 5개 필드와 함께 studyActionReport를 반드시 포함한다.",
  "studyActionReport는 실행전략형 리포트 구조를 따른다: coreDiagnosis, keyQuestion, keyInsights(3개), immediateActions(startNow/stopNow/prepNow), yearFlowSummary(준비기/가속기/승부기/정리기), quarterlyDetailed(1~3월/4~6월/7~9월/10~12월), examTypeGuides, failurePatterns, performanceStrategy(studyMethod/lifeManagement/mentalManagement), plainEvidence, finalSummary.",
  "quarterlyDetailed의 각 구간은 strengths/risks/recommendedStrategies/checkQuestionOrTip을 모두 포함한다.",
  "문장은 '좋다/주의' 수준으로 끝내지 말고 바로 실행 가능한 행동·점검 기준을 포함한다.",
  "명리 용어를 사용하면 반드시 쉬운 설명 문장을 한 번 더 붙인다.",
].join("\n");

const NEW_YEAR_2026_INVESTMENT_UPGRADE_RULES = [
  "saju-2026-investment-assets는 기존 5개 필드와 함께 investmentActionReport를 반드시 포함한다.",
  "investmentActionReport는 전략형 리포트 구조를 따른다: coreDiagnosis(한 줄 진단+설명), keyQuestion, keyInsights(3개), immediateActions, absoluteCautions, quarterlyFlow(1분기/2분기/3분기/4분기), assetClassGuides(stocksEtf/realEstate/cashSavings/cryptoHighVolatility), signalBoard(watchSignals/entrySignals), riskAlerts, practicalChecklist, plainEvidence, flowTo2027, finalConclusion.",
  "quarterlyFlow의 각 분기는 summary/actionFocus/riskFocus를 모두 포함한다.",
  "assetClassGuides는 주식·ETF/부동산/현금·예금/코인·고변동 자산 해석을 모두 포함한다.",
  "명리 용어를 사용하면 반드시 같은 문단에서 쉬운 현실 언어로 번역한다.",
  "종목 추천, 수익 보장, 레버리지 조장 표현은 금지하고 진입/관망/회수 기준을 범주형으로만 제시한다.",
].join("\n");

const NEW_YEAR_2026_HEALTH_RULES = [
  "saju-2026-health-balance는 energyRhythm/bodyPatterns/quarterlyFlowCards/recoveryPriorities/overloadSignals/overloadChecklist/routineChecklist/routineGuide/evidenceNotes를 모두 포함한다.",
  "quarterlyFlowCards는 1분기~4분기 4개를 모두 포함하고, 각 항목에 flowSummary/cautionPoint/recommendedAction을 채운다.",
  "routineGuide는 morning/daytime/evening/weekly 4개 버킷을 모두 채우고, 각 배열은 2~4개 실행 문장으로 작성한다.",
  "건강 관련 문장은 진단·치료 단정형 표현을 금지하고, 경향/주의/권장 형태로 작성한다.",
  "오행/사주 용어를 쓰면 반드시 생활 패턴 언어(수면·피로·예민함·소화·루틴)로 즉시 번역해 같은 문맥에서 설명한다.",
  "Profile Meta.birthPrecision이 unknown 또는 time-block이면 과도한 단정 대신 참고용/보수적 표현을 사용한다.",
].join("\n");

const LIFETIME_SUPPLEMENT_COMMON_RULES = [
  "인생 총운 7종은 reportPayload.supplement를 반드시 채운다.",
  "supplement에는 deepInsightSummary, deepDivePoints, checkpointQuestions, visualExplainers를 포함한다.",
  "executionProtocol(today/thisWeek/thisMonth/avoid)은 yearly 서비스에서는 선택 항목이며, 장기 해석을 덮어쓰지 않는다.",
  "supplement는 기존 구조를 교체하지 말고 기존 구조 뒤에 붙는 보강 정보만 제공한다.",
].join("\n");

const LIFETIME_DEMERIT_COMMON_RULES = [
  "일반 총평형 문장(막연한 길흉 요약)만 반복하지 말고 구체 해석 문장을 작성한다.",
  "서비스 간 동일 문장 재사용을 금지한다.",
  "배열 원소는 키워드가 아니라 완결된 문장으로 작성한다.",
  "행동 문장은 시점 + 대상 + 행동을 동시에 포함한다.",
  "analysisBlocks의 각 구간은 coreFlow/evidence/opportunities/risks/actionStrategy를 모두 구체 문장으로 작성한다.",
  "analysisBlocks의 opportunities/risks/actionStrategy는 각 2개 이상 작성한다.",
].join("\n");

const LIFETIME_DEMERIT_SERVICE_RULES: Partial<Record<SajuServiceType, string>> = {
  "saju-lifetime-roadmap":
    "감점 금지: 커리어/재무 세부 처방으로 흐르지 말고 직전→현재→다음 연결 서사를 반드시 제시한다.",
  "saju-daeun-shift":
    "감점 금지: '변화가 온다' 같은 추상 문장을 피하고 전환 전/중/후 차이를 반드시 제시한다. 전환 후 장기 방향(1~2년/3~5년/6~10년) 문장을 전환기 문장 이상으로 포함한다. 재무/투자 세부 처방은 금지한다.",
  "saju-career-timing":
    "감점 금지: 단년도(2026) 해석 반복을 배제하고 4단계(초기 축적기/전환기/확장기/안정화기) 장기 흐름을 먼저 제시한다. decideNow/deferNow는 결정 매트릭스 보조 영역으로만 사용한다.",
  "saju-wealth-flow":
    "감점 금지: 단순 길흉 표현을 배제하고 4단계(축적기/확장기/방어기/변동기) 장기 자산 사이클을 먼저 제시한다. 단년도(예: 2026) 반복은 현재 앵커 1회로 제한하고 유입/누수/손실 한도를 반드시 명시한다.",
  "saju-helper-network":
    "감점 금지: 단년도(예: 2026) 반복을 배제하고 관계 단계별 확장/협업/귀인 유입/경계 패턴을 구조화해 제시한다.",
  "saju-energy-balance":
    "감점 금지: 올해 컨디션 요약으로 좁히지 말고 타고난 성향/운용 방식/생애 단계 변화/장기 전략을 함께 제시한다.",
  "saju-yearly-action-calendar":
    "감점 금지: 총운 요약 반복을 배제하고 생애 단계(0~2년/3~5년/6~10년/전환)와 올해 분기·월 실행을 반드시 연결한다. 분기 표기는 1분기/2분기/3분기/4분기만 사용하고 Q1/Q2 표기는 금지한다. 분기-월 불일치(예: 2분기 문단에 2월)와 분기 간 동일 문장 반복을 금지한다. Structuring/Acceleration 같은 영어 전문용어 대신 쉬운 한국어로 작성한다. calendar-map 같은 내부 토큰을 사용자 문장에 노출하지 않는다.",
};

const LIFETIME_SUPPLEMENT_RULES: Partial<Record<SajuServiceType, string>> = {
  "saju-lifetime-roadmap":
    "visualExplainers.type은 timeline만 사용한다. 장기 인생 서사만 다루고 직무/재무 세부 처방은 금지한다.",
  "saju-daeun-shift":
    "visualExplainers.type은 before-after만 사용한다. 전환 리스크 대응만 다루고 장기 로드맵 반복은 금지한다.",
  "saju-career-timing":
    "visualExplainers.type은 decision-matrix만 사용한다. 커리어 의사결정만 다루고 재무/관계 운영론은 금지한다.",
  "saju-wealth-flow":
    "visualExplainers.type은 flow-radar만 사용한다. 돈의 운영 규칙만 다루고 커리어/관계 해설은 금지한다.",
  "saju-helper-network":
    "visualExplainers.type은 network-map만 사용한다. 사람/협업 전략만 다루고 재무/에너지 처방은 금지한다.",
  "saju-energy-balance":
    "visualExplainers.type은 energy-wave만 사용한다. 에너지 운영만 다루고 연간 일정 편성은 금지한다.",
  "saju-yearly-action-calendar":
    "visualExplainers.type은 calendar-map만 사용한다. 생애 실행 패턴과 연간 캘린더 연결만 다루고 직무/재무 상세 처방은 금지한다.",
};

const SHARED_SECTION_SCHEMA = `"sections": [
    {
      "title": "섹션 제목",
      "interpretation": "해석 문단",
      "advice": "실행 조언",
      "luckyTip": "보조 팁"
    }
  ]`;

const SHARED_ANALYSIS_BLOCK_SCHEMA = `"analysisBlocks": [
      {
        "windowLabel": "구간 라벨",
        "timeRange": "기간 범위",
        "coreFlow": "핵심 흐름",
        "evidence": "해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"]
      }
    ]`;

const TRADITIONAL_STYLE_SCHEMA = `{
  "summary": "3臾몄옣 ?대궡 珥앺룊",
  ${SHARED_SECTION_SCHEMA}
}`.trim();

const SHARED_PAYLOAD_FIELDS = `"reportTemplateVersion": "${TEMPLATE_VERSION}",
  "reportPayload": {
    "coreQuestion": "서비스 핵심 질문",
    "coreInsights": ["핵심 인사이트 1", "핵심 인사이트 2"],
    "actionNow": ["지금 실행할 행동 1", "지금 실행할 행동 2"],
    "evidence": ["근거 1", "근거 2"],
    ${SHARED_ANALYSIS_BLOCK_SCHEMA},`;

const NEW_YEAR_2026_OVERVIEW_SCHEMA = `{
  "summary": "2026년 종합 총평 2~3문장",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "quickSummary": {
      "verdict": "올해 한 줄 결론",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "signalTrio": {
        "interpretationIntensityLevel": "중",
        "attentionLevel": "보통",
        "changeSignalLevel": "중",
        "reason": "등급 판단 근거 1문장"
      }
    },
    "yearTimeline": [
      {
        "quarter": "1분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "2분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "3분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "4분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      }
    ],
    "focusCards": [
      {
        "focusId": "saju-2026-overview",
        "focusLabel": "종합",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-2026-study-exam",
        "focusLabel": "시험·학업",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-love-focus",
        "focusLabel": "연애·결혼",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-2026-wealth-business",
        "focusLabel": "재물·사업",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-2026-investment-assets",
        "focusLabel": "주식·부동산 투자",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-2026-career-aptitude",
        "focusLabel": "직업·적성",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      },
      {
        "focusId": "saju-2026-health-balance",
        "focusLabel": "건강",
        "conclusion": "영역 결론",
        "dos": ["실행 1", "실행 2"],
        "donts": ["주의 1"],
        "evidencePrimary": "핵심 근거 1줄",
        "evidenceExtra": ["추가 근거 1"]
      }
    ],
    "actionPlan90": {
      "day30": ["30일 실행 1", "30일 실행 2"],
      "day60": ["60일 실행 1", "60일 실행 2"],
      "day90": ["90일 실행 1", "90일 실행 2"]
    },
    "consistencyMeta": {
      "targetYear": 2026,
      "ganji": "병오",
      "age": 32,
      "generatedAt": "2026-03-24T09:00:00.000Z"
    }
  }
}`.trim();

const buildNewYear2026FocusedSchema = (focusedFields: string) => `{
  "summary": "2026년 선택 서비스 총평 2~3문장",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "quickSummary": {
      "verdict": "올해 한 줄 결론",
      "keywords": ["키워드1", "키워드2", "키워드3"],
      "signalTrio": {
        "interpretationIntensityLevel": "중",
        "attentionLevel": "보통",
        "changeSignalLevel": "중",
        "reason": "등급 판단 근거 1문장"
      }
    },
    "yearTimeline": [
      {
        "quarter": "1분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "2분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "3분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      },
      {
        "quarter": "4분기",
        "quarterSummary": "분기 한 줄 요약",
        "opportunity": "기회 신호",
        "caution": "주의 신호",
        "action": "실행 신호"
      }
    ],
${focusedFields}
    "actionPlan90": {
      "day30": ["30일 실행 1", "30일 실행 2"],
      "day60": ["60일 실행 1", "60일 실행 2"],
      "day90": ["90일 실행 1", "90일 실행 2"]
    },
    "consistencyMeta": {
      "targetYear": 2026,
      "ganji": "병오",
      "age": 32,
      "generatedAt": "2026-03-24T09:00:00.000Z"
    }
  }
}`.trim();

const NEW_YEAR_2026_STUDY_SCHEMA = buildNewYear2026FocusedSchema(`    "studyRhythm": "집중 흐름을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "examWindows": ["승부 시점 구체 해석 문장 1", "승부 시점 구체 해석 문장 2"],
    "mistakeTriggers": ["실수 패턴 구체 해석 문장 1", "실수 패턴 구체 해석 문장 2"],
    "executionGuide": ["합격 행동 구체 해석 문장 1", "합격 행동 구체 해석 문장 2"],
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
    "studyActionReport": {
      "coreDiagnosis": {
        "headline": "한눈에 보는 핵심 진단 헤드라인",
        "summary": "핵심 진단 요약",
        "confidenceNote": "확신도/유의사항"
      },
      "keyQuestion": "핵심 질문",
      "keyInsights": ["올해 핵심 인사이트 1", "올해 핵심 인사이트 2", "올해 핵심 인사이트 3"],
      "immediateActions": {
        "startNow": ["지금 시작해야 할 행동 1", "지금 시작해야 할 행동 2"],
        "stopNow": ["지금 멈춰야 할 행동 1", "지금 멈춰야 할 행동 2"],
        "prepNow": ["지금 챙겨야 할 것 1", "지금 챙겨야 할 것 2"]
      },
      "yearFlowSummary": {
        "preparationPhase": "준비기 해석",
        "accelerationPhase": "가속기 해석",
        "showdownPhase": "승부기 해석",
        "wrapUpPhase": "정리기 해석"
      },
      "quarterlyDetailed": [
        {
          "period": "1~3월",
          "strengths": ["이 시기의 강점 1", "이 시기의 강점 2"],
          "risks": ["이 시기의 리스크 1", "이 시기의 리스크 2"],
          "recommendedStrategies": ["추천 전략 1", "추천 전략 2"],
          "checkQuestionOrTip": "체크 질문 또는 실전 팁"
        },
        {
          "period": "4~6월",
          "strengths": ["이 시기의 강점 1", "이 시기의 강점 2"],
          "risks": ["이 시기의 리스크 1", "이 시기의 리스크 2"],
          "recommendedStrategies": ["추천 전략 1", "추천 전략 2"],
          "checkQuestionOrTip": "체크 질문 또는 실전 팁"
        },
        {
          "period": "7~9월",
          "strengths": ["이 시기의 강점 1", "이 시기의 강점 2"],
          "risks": ["이 시기의 리스크 1", "이 시기의 리스크 2"],
          "recommendedStrategies": ["추천 전략 1", "추천 전략 2"],
          "checkQuestionOrTip": "체크 질문 또는 실전 팁"
        },
        {
          "period": "10~12월",
          "strengths": ["이 시기의 강점 1", "이 시기의 강점 2"],
          "risks": ["이 시기의 리스크 1", "이 시기의 리스크 2"],
          "recommendedStrategies": ["추천 전략 1", "추천 전략 2"],
          "checkQuestionOrTip": "체크 질문 또는 실전 팁"
        }
      ],
      "examTypeGuides": {
        "writtenExam": ["필기시험형 전략 1", "필기시험형 전략 2"],
        "interviewOrOral": ["면접/구술형 전략 1", "면접/구술형 전략 2"],
        "longTermLearning": ["장기 학습형 전략 1", "장기 학습형 전략 2"]
      },
      "failurePatterns": ["2026 실패 패턴 1", "2026 실패 패턴 2"],
      "performanceStrategy": {
        "studyMethod": ["공부 방식 전략 1", "공부 방식 전략 2"],
        "lifeManagement": ["생활 관리 전략 1", "생활 관리 전략 2"],
        "mentalManagement": ["멘탈 관리 전략 1", "멘탈 관리 전략 2"]
      },
      "plainEvidence": ["해석 근거 쉬운 설명 1", "해석 근거 쉬운 설명 2"],
      "finalSummary": ["2026 합격 가이드 요약 1", "2026 합격 가이드 요약 2"]
    },
`);

const NEW_YEAR_2026_LOVE_SCHEMA = buildNewYear2026FocusedSchema(`    "relationshipFlow": "관계 흐름을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "approachSignals": ["가까워지는 신호 구체 해석 문장 1", "가까워지는 신호 구체 해석 문장 2"],
    "cautionPatterns": ["주의 패턴 구체 해석 문장 1", "주의 패턴 구체 해석 문장 2"],
    "relationshipGuide": ["관계 운영 가이드 구체 해석 문장 1", "관계 운영 가이드 구체 해석 문장 2"],
    "marriageDecisionBoard": ["결혼 전환 판단 구체 문장 1", "결혼 전환 판단 구체 문장 2", "결혼 전환 판단 구체 문장 3"],
    "meetingChannelPriority": ["만남 채널 우선순위 구체 문장 1", "만남 채널 우선순위 구체 문장 2"],
    "greenFlagChecklist": ["그린 플래그 구체 문장 1", "그린 플래그 구체 문장 2"],
    "redFlagChecklist": ["레드 플래그 구체 문장 1", "레드 플래그 구체 문장 2"],
    "conflictProtocol": ["갈등 응급 프로토콜 구체 문장 1", "갈등 응급 프로토콜 구체 문장 2"],
    "consumerFaq": [
      { "question": "질문 1", "answer": "답변 1" },
      { "question": "질문 2", "answer": "답변 2" },
      { "question": "질문 3", "answer": "답변 3" },
      { "question": "질문 4", "answer": "답변 4" },
      { "question": "질문 5", "answer": "답변 5" },
      { "question": "질문 6", "answer": "답변 6" },
      { "question": "질문 7", "answer": "답변 7" },
      { "question": "질문 8", "answer": "답변 8" }
    ],
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
`);

const NEW_YEAR_2026_WEALTH_SCHEMA = buildNewYear2026FocusedSchema(`    "cashflowPulse": "수익 흐름을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "growthAxes": ["밀어야 할 축 구체 해석 문장 1", "밀어야 할 축 구체 해석 문장 2"],
    "leakRisks": ["새는 지점 구체 해석 문장 1", "새는 지점 구체 해석 문장 2"],
    "operatingRules": ["운영 원칙 구체 해석 문장 1", "운영 원칙 구체 해석 문장 2"],
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
    "oneLineDiagnosis": "한 줄 핵심 진단",
    "keyPoints": ["올해 핵심 포인트 1", "올해 핵심 포인트 2", "올해 핵심 포인트 3"],
    "easyInterpretationPoints": ["쉬운 해석 포인트 1", "쉬운 해석 포인트 2"],
    "annualFlowSummary": "2026년 전체 흐름 요약",
    "quarterlyFlowCards": [
      { "quarter": "1분기", "flowSummary": "분기 핵심 흐름", "keyPoint": "분기 핵심 포인트", "risk": "분기 리스크", "actionStrategy": "분기 행동 전략" },
      { "quarter": "2분기", "flowSummary": "분기 핵심 흐름", "keyPoint": "분기 핵심 포인트", "risk": "분기 리스크", "actionStrategy": "분기 행동 전략" },
      { "quarter": "3분기", "flowSummary": "분기 핵심 흐름", "keyPoint": "분기 핵심 포인트", "risk": "분기 리스크", "actionStrategy": "분기 행동 전략" },
      { "quarter": "4분기", "flowSummary": "분기 핵심 흐름", "keyPoint": "분기 핵심 포인트", "risk": "분기 리스크", "actionStrategy": "분기 행동 전략" }
    ],
    "revenueFlowDeepDive": ["수익 흐름 심화 해석 1", "수익 흐름 심화 해석 2"],
    "businessManagementPoints": ["사업 관리 포인트 1", "사업 관리 포인트 2"],
    "burnoutPreventionStrategies": ["번아웃 방지 전략 1", "번아웃 방지 전략 2"],
    "actionChecklist": ["바로 실행할 체크리스트 1", "바로 실행할 체크리스트 2", "바로 실행할 체크리스트 3"],
    "closingLine": "한 줄 결론",
`);

const NEW_YEAR_2026_INVESTMENT_SCHEMA = buildNewYear2026FocusedSchema(`    "entryBias": "진입 판단을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "watchSignals": ["관망 신호 구체 해석 문장 1", "관망 신호 구체 해석 문장 2"],
    "riskAlerts": ["리스크 경보 구체 해석 문장 1", "리스크 경보 구체 해석 문장 2"],
    "capitalRules": ["자금 운용 원칙 구체 해석 문장 1", "자금 운용 원칙 구체 해석 문장 2"],
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
    "investmentActionReport": {
      "coreDiagnosis": {
        "headline": "한 줄 핵심 진단",
        "summary": "핵심 진단 설명"
      },
      "keyQuestion": "핵심 질문",
      "keyInsights": ["핵심 인사이트 1", "핵심 인사이트 2", "핵심 인사이트 3"],
      "immediateActions": ["지금 액션 1", "지금 액션 2"],
      "absoluteCautions": ["올해 절대 조심할 행동 1", "올해 절대 조심할 행동 2"],
      "quarterlyFlow": [
        {
          "quarter": "1분기",
          "summary": "분기 흐름 요약",
          "actionFocus": ["분기 행동 포인트 1", "분기 행동 포인트 2"],
          "riskFocus": ["분기 리스크 포인트 1", "분기 리스크 포인트 2"]
        },
        {
          "quarter": "2분기",
          "summary": "분기 흐름 요약",
          "actionFocus": ["분기 행동 포인트 1", "분기 행동 포인트 2"],
          "riskFocus": ["분기 리스크 포인트 1", "분기 리스크 포인트 2"]
        },
        {
          "quarter": "3분기",
          "summary": "분기 흐름 요약",
          "actionFocus": ["분기 행동 포인트 1", "분기 행동 포인트 2"],
          "riskFocus": ["분기 리스크 포인트 1", "분기 리스크 포인트 2"]
        },
        {
          "quarter": "4분기",
          "summary": "분기 흐름 요약",
          "actionFocus": ["분기 행동 포인트 1", "분기 행동 포인트 2"],
          "riskFocus": ["분기 리스크 포인트 1", "분기 리스크 포인트 2"]
        }
      ],
      "assetClassGuides": {
        "stocksEtf": ["주식/ETF 해석 1", "주식/ETF 해석 2"],
        "realEstate": ["부동산 해석 1", "부동산 해석 2"],
        "cashSavings": ["현금/예금 해석 1", "현금/예금 해석 2"],
        "cryptoHighVolatility": ["코인/고변동 자산 해석 1", "코인/고변동 자산 해석 2"]
      },
      "signalBoard": {
        "watchSignals": ["관망 신호 1", "관망 신호 2"],
        "entrySignals": ["진입 신호 1", "진입 신호 2"]
      },
      "riskAlerts": ["리스크 경보 1", "리스크 경보 2"],
      "practicalChecklist": ["실전 체크리스트 1", "실전 체크리스트 2", "실전 체크리스트 3", "실전 체크리스트 4"],
      "plainEvidence": ["해석 근거 쉬운 설명 1", "해석 근거 쉬운 설명 2"],
      "flowTo2027": "2027로 이어지는 흐름",
      "finalConclusion": ["최종 결론 1", "최종 결론 2"]
    },
`);

const NEW_YEAR_2026_CAREER_SCHEMA = buildNewYear2026FocusedSchema(`    "fitRoleSignal": "맞는 역할을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "strongWorkModes": ["성과 나는 방식 구체 해석 문장 1", "성과 나는 방식 구체 해석 문장 2"],
    "misfitChoices": ["엇나가는 선택 구체 해석 문장 1", "엇나가는 선택 구체 해석 문장 2"],
    "executionChecklist": ["실행 체크리스트 구체 해석 문장 1", "실행 체크리스트 구체 해석 문장 2"],
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
`);

const NEW_YEAR_2026_HEALTH_SCHEMA = buildNewYear2026FocusedSchema(`    "energyRhythm": "컨디션 리듬을 2~4문장으로 풀어 쓴 구체 해석 문단",
    "bodyPatterns": ["올해 몸에 나타나기 쉬운 패턴 문장 1", "올해 몸에 나타나기 쉬운 패턴 문장 2"],
    "quarterlyFlowCards": [
      {
        "quarter": "1분기",
        "flowSummary": "분기 흐름 요약",
        "cautionPoint": "분기 주의 포인트",
        "recommendedAction": "분기 추천 행동"
      },
      {
        "quarter": "2분기",
        "flowSummary": "분기 흐름 요약",
        "cautionPoint": "분기 주의 포인트",
        "recommendedAction": "분기 추천 행동"
      },
      {
        "quarter": "3분기",
        "flowSummary": "분기 흐름 요약",
        "cautionPoint": "분기 주의 포인트",
        "recommendedAction": "분기 추천 행동"
      },
      {
        "quarter": "4분기",
        "flowSummary": "분기 흐름 요약",
        "cautionPoint": "분기 주의 포인트",
        "recommendedAction": "분기 추천 행동"
      }
    ],
    "recoveryPriorities": ["회복 우선순위 구체 해석 문장 1", "회복 우선순위 구체 해석 문장 2"],
    "overloadSignals": ["과부하 신호 구체 해석 문장 1", "과부하 신호 구체 해석 문장 2"],
    "overloadChecklist": ["체크형 과부하 신호 문장 1", "체크형 과부하 신호 문장 2"],
    "routineChecklist": ["생활 루틴 구체 해석 문장 1", "생활 루틴 구체 해석 문장 2"],
    "routineGuide": {
      "morning": ["아침 루틴 1", "아침 루틴 2"],
      "daytime": ["낮 루틴 1", "낮 루틴 2"],
      "evening": ["저녁 루틴 1", "저녁 루틴 2"],
      "weekly": ["주간 루틴 1", "주간 루틴 2"]
    },
    "evidenceNotes": ["해석 근거 구체 문장 1", "해석 근거 구체 문장 2"],
`);

const LIFETIME_SUPPLEMENT_TIMELINE_SCHEMA = `    "supplement": {
      "deepInsightSummary": "장기 인생 흐름 보강 요약 1문단",
      "deepDivePoints": ["단계 전환 포인트", "서사 방향성 포인트", "성숙/확장/정리 포인트"],
      "executionProtocol": {
        "today": ["오늘 확인할 전환 신호 1"],
        "thisWeek": ["이번 주 단계 전환 준비 1", "이번 주 단계 전환 준비 2"],
        "thisMonth": ["이번 달 선행 과제 1", "이번 달 선행 과제 2"],
        "avoid": ["장기 서사와 무관한 단기 과속 판단"]
      },
      "checkpointQuestions": ["지금 단계에서 다음 단계로 넘어가기 전 정리할 항목은?", "90일 선행 과제를 일정에 반영했는가?"],
      "visualExplainers": [
        { "type": "timeline", "title": "4구간 서사 타임라인", "items": ["직전→현재", "현재→다음", "다음→다다음"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_BEFORE_AFTER_SCHEMA = `    "supplement": {
      "deepInsightSummary": "전환기 보강 요약 1문단",
      "deepDivePoints": ["변화 강도 포인트", "속도 포인트", "영향 범위 포인트"],
      "executionProtocol": {
        "today": ["오늘 전환 리스크 체크 1"],
        "thisWeek": ["이번 주 전환 대응 루틴 1", "이번 주 전환 대응 루틴 2"],
        "thisMonth": ["이번 달 안정화 과제 1", "이번 달 안정화 과제 2"],
        "avoid": ["장기 로드맵 반복 설명"]
      },
      "checkpointQuestions": ["전환 전/중/후 대응을 분리했는가?", "오판 방지 기준을 주간 루틴으로 점검했는가?"],
      "visualExplainers": [
        { "type": "before-after", "title": "전환 전/중/후 델타 카드", "items": ["전환 전 기준", "전환 시점 변화", "전환 후 안정화"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_DECISION_SCHEMA = `    "supplement": {
      "deepInsightSummary": "커리어 결정 보강 요약 1문단",
      "deepDivePoints": ["역할-환경 적합 포인트", "기회비용 포인트", "결정/보류 기준 포인트"],
      "executionProtocol": {
        "today": ["오늘 Go/Wait 기준 확정 1"],
        "thisWeek": ["2주 결정 스프린트 실행 1", "2주 결정 스프린트 실행 2"],
        "thisMonth": ["4주 실행 체크리스트 점검 1", "4주 실행 체크리스트 점검 2"],
        "avoid": ["재무/관계 운영론 확장"]
      },
      "checkpointQuestions": ["결정할 일과 보류할 일을 분리했는가?", "결정 기준이 실제 일정과 연결됐는가?"],
      "visualExplainers": [
        { "type": "decision-matrix", "title": "결정 매트릭스", "items": ["즉시 실행", "조건부 실행", "보류"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_FLOW_SCHEMA = `    "supplement": {
      "deepInsightSummary": "재무 운영 보강 요약 1문단",
      "deepDivePoints": ["유입 구조 포인트", "누수 구조 포인트", "방어/확장 포인트"],
      "executionProtocol": {
        "today": ["오늘 누수 차단 액션 1"],
        "thisWeek": ["이번 주 유입-누수 점검 1", "이번 주 유입-누수 점검 2"],
        "thisMonth": ["월간 재무 루틴 1", "월간 재무 루틴 2"],
        "avoid": ["커리어/관계 해설 확장"]
      },
      "checkpointQuestions": ["누수 지점을 수치로 점검했는가?", "축적/확장 배분과 손실 한도 규칙을 고정했는가?"],
      "visualExplainers": [
        { "type": "flow-radar", "title": "유입-누수 플로우 맵", "items": ["유입 채널", "누수 채널", "방어 구간", "확장 구간"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_NETWORK_SCHEMA = `    "supplement": {
      "deepInsightSummary": "관계/귀인 운영 보강 요약 1문단",
      "deepDivePoints": ["가까운 관계 포인트", "협업 관계 포인트", "사회적 인연 포인트"],
      "executionProtocol": {
        "today": ["오늘 관계 경계 문장 점검 1"],
        "thisWeek": ["주간 관계 운영 액션 1", "주간 관계 운영 액션 2"],
        "thisMonth": ["월간 연결/정리 과제 1", "월간 연결/정리 과제 2"],
        "avoid": ["재무/에너지 처방 확장"]
      },
      "checkpointQuestions": ["레이어별 관계 운영 기준을 분리했는가?", "갈등 루프 차단 행동을 실행했는가?"],
      "visualExplainers": [
        { "type": "network-map", "title": "관계 레이어 네트워크 맵", "items": ["가까운 관계", "협업 관계", "사회적 인연"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_ENERGY_SCHEMA = `    "supplement": {
      "deepInsightSummary": "에너지 운영 보강 요약 1문단",
      "deepDivePoints": ["몰입 트리거 포인트", "소진 조기경보 포인트", "회복 리듬 포인트"],
      "executionProtocol": {
        "today": ["오늘 강도 상한 설정 1"],
        "thisWeek": ["주간 리듬 리셋 1", "주간 리듬 리셋 2"],
        "thisMonth": ["24h/72h 회복 프로토콜 점검 1", "24h/72h 회복 프로토콜 점검 2"],
        "avoid": ["연간 일정 편성 확장"]
      },
      "checkpointQuestions": ["소진 조기경보를 감지하면 즉시 감속했는가?", "회복 슬롯을 일정에 고정했는가?"],
      "visualExplainers": [
        { "type": "energy-wave", "title": "에너지 파형 설명", "items": ["집중 파형", "과부하 신호", "회복 파형"] }
      ]
    }`;

const LIFETIME_SUPPLEMENT_CALENDAR_SCHEMA = `    "supplement": {
      "deepInsightSummary": "연간 실행 보강 요약 1문단",
      "deepDivePoints": ["분기-월 정합 포인트", "우선순위 드리프트 포인트", "복구 시나리오 포인트"],
      "checkpointQuestions": ["분기 목표와 월 행동이 연결되어 있는가?", "지연 발생 시 복구 시나리오를 실행했는가?"],
      "visualExplainers": [
        { "type": "calendar-map", "title": "분기-월 실행 캘린더 맵", "items": ["분기 목표", "월별 푸시/주의", "체크포인트"] }
      ]
    }`;

const STRATEGY_SCHEMAS: Record<SajuServiceType, string> = {
  "traditional-saju": TRADITIONAL_STYLE_SCHEMA,
  "saju-2026-overview": NEW_YEAR_2026_OVERVIEW_SCHEMA,
  "saju-2026-study-exam": NEW_YEAR_2026_STUDY_SCHEMA,
  "saju-2026-yearly-outlook": NEW_YEAR_2026_OVERVIEW_SCHEMA,
  "saju-love-focus": NEW_YEAR_2026_LOVE_SCHEMA,
  "saju-2026-wealth-business": NEW_YEAR_2026_WEALTH_SCHEMA,
  "saju-2026-investment-assets": NEW_YEAR_2026_INVESTMENT_SCHEMA,
  "saju-2026-career-aptitude": NEW_YEAR_2026_CAREER_SCHEMA,
  "saju-2026-health-balance": NEW_YEAR_2026_HEALTH_SCHEMA,
  "saju-lifetime-roadmap": `{
  "summary": "인생 총운 종합 총평",
  "lifetimeScore": 85,
  "daeunPeriods": [
    {
      "startAge": 20,
      "endAge": 29,
      "startYear": 2014,
      "endYear": 2023,
      "gan": "갑",
      "ji": "자",
      "oheng": "목",
      "score": 83,
      "keyword": "기반 축적기",
      "isCurrent": false
    },
    {
      "startAge": 30,
      "endAge": 39,
      "startYear": 2024,
      "endYear": 2033,
      "gan": "을",
      "ji": "축",
      "oheng": "토",
      "score": 79,
      "keyword": "현재 전개 구간",
      "isCurrent": true
    },
    {
      "startAge": 40,
      "endAge": 49,
      "startYear": 2034,
      "endYear": 2043,
      "gan": "병",
      "ji": "인",
      "oheng": "화",
      "score": 82,
      "keyword": "확장 가속기",
      "isCurrent": false
    },
    {
      "startAge": 50,
      "endAge": 59,
      "startYear": 2044,
      "endYear": 2053,
      "gan": "정",
      "ji": "묘",
      "oheng": "목",
      "score": 76,
      "keyword": "정리 안정기",
      "isCurrent": false
    }
  ],
  "goldenPeriods": [
    {
      "startAge": 40,
      "endAge": 49,
      "startYear": 2034,
      "endYear": 2043,
      "reason": "확장과 정착 성과가 동시에 누적되는 시기"
    }
  ],
  "personalityType": {
    "title": "전략형",
    "description": "장기 구조를 먼저 세우고 실행 우선순위를 조정하는 성향",
    "strengths": ["집중력", "판단력"],
    "weaknesses": ["과속 확장", "결정 지연"]
  },
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "longTermFlow": "장기 흐름 요약",
    "pivotMoments": ["변곡점 1", "변곡점 2"],
    "tenYearStrategy": ["10년 전략 1", "10년 전략 2"],
    "stageTransitions": ["단계 전환 신호 1", "단계 전환 신호 2"],
    "narrativeDirection": "직전-현재-다음으로 이어지는 장기 전개 방향",
    "maturityExpansionCleanup": ["성숙 축", "확장 축", "정리 축"],
${LIFETIME_SUPPLEMENT_TIMELINE_SCHEMA}
  }
}`.trim(),
  "saju-daeun-shift": `{
  "summary": "대운 전환 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "transitionSignal": "전환 신호 요약",
    "ninetyDayActions": ["90일 실행 1", "90일 실행 2"],
    "avoidanceScenario": ["회피 시나리오 1", "회피 시나리오 2"],
    "transitionSignals": ["전환 징후 1", "전환 징후 2"],
    "changePoints": ["변화 포인트 1", "변화 포인트 2"],
    "readinessActions": ["준비 행동 1", "준비 행동 2"],
    "phaseRoadmap": [
      {
        "phaseLabel": "전환 전 준비기",
        "ageRange": "예: 28~29세",
        "yearRange": "예: 2024~2025년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"]
      },
      {
        "phaseLabel": "전환기",
        "ageRange": "예: 30~31세",
        "yearRange": "예: 2026~2027년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"]
      },
      {
        "phaseLabel": "전환 후 재배치기",
        "ageRange": "예: 32~34세",
        "yearRange": "예: 2028~2030년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"]
      },
      {
        "phaseLabel": "전환 후 정착기",
        "ageRange": "예: 35~40세",
        "yearRange": "예: 2031~2036년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"]
      }
    ],
    "longHorizonDirection": [
      "1~2년 방향성 문장",
      "3~5년 방향성 문장",
      "6~10년 방향성 문장"
    ],
    "preAtPostDiff": ["전환 전 관성", "전환기 재정렬 포인트", "전환 후 정착 차이"],
${LIFETIME_SUPPLEMENT_BEFORE_AFTER_SCHEMA}
  }
}`.trim(),
  "saju-career-timing": `{
  "summary": "커리어 장기 흐름 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "careerWindow": "기존 커리어 판단 축 요약(레거시 호환)",
    "careerArcSummary": "내 커리어 장기축 요약",
    "transitionSignal": "단계 전환을 감지하는 핵심 신호 요약",
    "currentYearFocus": "현재 연도 적용 포인트(보조 섹션)",
    "stageFlow": [
      {
        "stageId": "build-up",
        "label": "초기 축적기",
        "timeRange": "0~2년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"],
        "transitionSignal": "다음 단계 전환 신호"
      },
      {
        "stageId": "transition",
        "label": "전환기",
        "timeRange": "3~5년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"],
        "transitionSignal": "다음 단계 전환 신호"
      },
      {
        "stageId": "expansion",
        "label": "확장기",
        "timeRange": "6~10년",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"],
        "transitionSignal": "다음 단계 전환 신호"
      },
      {
        "stageId": "stabilization",
        "label": "안정화기",
        "timeRange": "10년+",
        "coreFlow": "해당 단계 핵심 흐름",
        "evidence": "해당 단계 해석 근거",
        "opportunities": ["주요 기회 1", "주요 기회 2"],
        "risks": ["리스크 1", "리스크 2"],
        "actionStrategy": ["행동 전략 1", "행동 전략 2"],
        "transitionSignal": "다음 단계 전환 신호"
      }
    ],
    "decisionTree": ["선택지 1", "선택지 2"],
    "executionChecklist": ["실행 체크리스트 1", "실행 체크리스트 2"],
    "workModeFit": "현재 단계에 맞는 일의 방식",
    "decideNow": ["지금 결정할 항목 1", "지금 결정할 항목 2"],
    "deferNow": ["지금 보류할 항목 1", "지금 보류할 항목 2"],
    "gainVsLossPatterns": ["성과 방식 1", "손실 방식 1"],
    "decisionCriteria": ["판단 기준 1", "판단 기준 2"],
  ${LIFETIME_SUPPLEMENT_DECISION_SCHEMA}
  }
}`.trim(),
  "saju-wealth-flow": `{
  "summary": "인생 자산 사이클 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "cashflowMap": "현금흐름 장기 구조 요약",
    "riskZones": ["리스크 구간 1", "리스크 구간 2"],
    "assetRules": ["자산 운영 규칙 1", "자산 운영 규칙 2"],
    "wealthLifecycleStages": [
      {
        "phaseType": "accumulation",
        "timeRange": "0~2년",
        "ageRange": "예: 31~33세",
        "yearRange": "예: 2026~2028년",
        "coreObjective": "순유입 기반을 고정해 축적 속도를 높이는 구간",
        "opportunity": "수입 채널의 반복성을 높이면 축적 효율이 올라간다",
        "risk": "지출 누수 방치 시 축적 속도가 둔화될 수 있다",
        "operatingRules": ["고정비 상한을 먼저 정한다", "비상자금과 확장 자금을 분리한다"],
        "transitionSignal": "순유입 안정 구간이 3개월 이상 유지되면 확장기 진입 신호"
      },
      {
        "phaseType": "expansion",
        "timeRange": "3~5년",
        "ageRange": "예: 34~36세",
        "yearRange": "예: 2029~2031년",
        "coreObjective": "축적 자본을 선택적으로 확장해 수익 규모를 키우는 구간",
        "opportunity": "축적한 기준 위에서 확장 채널을 늘리면 레버리지 효율이 좋아진다",
        "risk": "확장 속도가 기준보다 앞서면 손실 변동이 커질 수 있다",
        "operatingRules": ["확장 전 손실 한도를 고정한다", "확장 대상은 1~2개로 제한한다"],
        "transitionSignal": "확장 이후에도 손실 한도 유지율이 높으면 방어기 진입 신호"
      },
      {
        "phaseType": "defense",
        "timeRange": "6~10년",
        "ageRange": "예: 37~41세",
        "yearRange": "예: 2032~2036년",
        "coreObjective": "변동 구간에 대비해 자산 방어력을 높이는 구간",
        "opportunity": "방어 규칙을 표준화하면 확장 이후 수익의 하방을 보호할 수 있다",
        "risk": "방어 기준 미고정 시 단일 이벤트 손실이 누적될 수 있다",
        "operatingRules": ["방어 비중 하한을 유지한다", "현금흐름 점검 주기를 분기 고정한다"],
        "transitionSignal": "방어 기준 유지율이 안정되면 변동기 대응으로 전환할 수 있다"
      },
      {
        "phaseType": "volatility",
        "timeRange": "10년+",
        "ageRange": "예: 42세+",
        "yearRange": "예: 2037년+",
        "coreObjective": "변동기에서 손실 복원력을 유지하며 재배치 타이밍을 읽는 구간",
        "opportunity": "변동 신호를 조기 감지하면 방어와 재확장을 유연하게 전환할 수 있다",
        "risk": "과도한 낙관/비관 반응은 장기 복원력을 약화시킬 수 있다",
        "operatingRules": ["변동 구간 방어 한도를 선고정한다", "재배치 트리거를 사전에 정의한다"],
        "transitionSignal": "복원 속도와 손실 통제가 동시에 유지되면 다음 축적 사이클로 연결된다"
      }
    ],
    "assetTrendSeries": [
      { "label": "현재", "value": 52 },
      { "label": "1년 후", "value": 58 },
      { "label": "3년 후", "value": 67 },
      { "label": "5년 후", "value": 63 },
      { "label": "10년 후", "value": 72 }
    ],
    "incomeStructure": ["수입 구조 1", "수입 구조 2"],
    "spendingPatterns": ["지출 패턴 1", "지출 패턴 2"],
    "accumulateVsExpand": ["축적 판단 1", "확장 판단 1"],
    "financialNoGo": ["금지 판단 1", "금지 판단 2"],
${LIFETIME_SUPPLEMENT_FLOW_SCHEMA}
  }
}`.trim(),
  "saju-helper-network": `{
  "summary": "관계·귀인 네트워크 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "helperMap": "관계 운영 구조 요약",
    "conflictPatterns": ["갈등 패턴 1", "갈등 패턴 2"],
    "networkGuide": ["관계 운영 가이드 1", "관계 운영 가이드 2"],
    "helperProfiles": ["귀인 유형 1", "귀인 유형 2"],
    "relationExpansionVsEntanglement": ["확장 방식 1", "얽힘 방식 1"],
    "conflictLoops": ["반복 갈등 루프 1", "반복 갈등 루프 2"],
    "helperEntryWindows": ["귀인 유입 시기 1", "귀인 유입 시기 2"],
    "relationLayers": ["가까운 관계 해석", "협업 관계 해석", "사회적 인연 해석"],
    "phaseRoadmap": [
      {
        "phaseLabel": "관계 기반 정비기",
        "timeRange": "0~2년",
        "relationshipExpansion": "관계 확장/정리 기준",
        "collaborationFlow": "협업 운 운영 기준",
        "mentorInfluxSignal": "멘토·귀인 유입 시그널",
        "guardPattern": "경계해야 할 관계 패턴",
        "actionStrategy": ["실행 전략 1", "실행 전략 2"]
      },
      {
        "phaseLabel": "협업 확장기",
        "timeRange": "3~5년",
        "relationshipExpansion": "관계 확장/정리 기준",
        "collaborationFlow": "협업 운 운영 기준",
        "mentorInfluxSignal": "멘토·귀인 유입 시그널",
        "guardPattern": "경계해야 할 관계 패턴",
        "actionStrategy": ["실행 전략 1", "실행 전략 2"]
      },
      {
        "phaseLabel": "귀인 유입기",
        "timeRange": "6~10년",
        "relationshipExpansion": "관계 확장/정리 기준",
        "collaborationFlow": "협업 운 운영 기준",
        "mentorInfluxSignal": "멘토·귀인 유입 시그널",
        "guardPattern": "경계해야 할 관계 패턴",
        "actionStrategy": ["실행 전략 1", "실행 전략 2"]
      },
      {
        "phaseLabel": "관계 자산 전수기",
        "timeRange": "10년+",
        "relationshipExpansion": "관계 확장/정리 기준",
        "collaborationFlow": "협업 운 운영 기준",
        "mentorInfluxSignal": "멘토·귀인 유입 시그널",
        "guardPattern": "경계해야 할 관계 패턴",
        "actionStrategy": ["실행 전략 1", "실행 전략 2"]
      }
    ],
    "longHorizonDirection": [
      "1~2년 장기 방향 문장",
      "3~5년 장기 방향 문장",
      "6~10년 장기 방향 문장"
    ],
${LIFETIME_SUPPLEMENT_NETWORK_SCHEMA}
  }
}`.trim(),
  "saju-energy-balance": `{
  "summary": "에너지 밸런스 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "energyCurve": "에너지 곡선 요약",
    "innateProfile": "타고난 에너지 성향 해석",
    "operatingModel": ["운용 방식 1", "운용 방식 2", "운용 방식 3"],
    "stageShiftMap": ["생애 단계 변화 1", "생애 단계 변화 2", "생애 단계 변화 3"],
    "longRangeStrategy": ["0~2년 운영 전략", "3~5년 운영 전략", "6~10년 운영 전략"],
    "routineDesign": ["루틴 설계 1", "루틴 설계 2"],
    "recoveryProtocol": ["회복 프로토콜 1", "회복 프로토콜 2"],
    "energyRhythmSeries": [
      { "label": "1주", "value": 58 },
      { "label": "2주", "value": 72 },
      { "label": "3주", "value": 84 },
      { "label": "4주", "value": 76 },
      { "label": "8주", "value": 62 },
      { "label": "12주", "value": 70 }
    ],
    "immersionMode": ["몰입 방식 1", "몰입 방식 2"],
    "burnoutSignals": ["소진 신호 1", "소진 신호 2"],
    "overloadAlerts": ["과부하 경보 1", "과부하 경보 2"],
    "habitTweaks": ["습관 보정 1", "습관 보정 2"],
    "recoveryRoutines": ["회복 루틴 1", "회복 루틴 2"],
${LIFETIME_SUPPLEMENT_ENERGY_SCHEMA}
  }
}`.trim(),
  "saju-yearly-action-calendar": `{
  "summary": "연간 실행 캘린더 총평",
  ${SHARED_SECTION_SCHEMA},
  ${SHARED_PAYLOAD_FIELDS}
    "oneLineTotalReview": "한 줄 총평",
    "currentLifeFlow": "지금 인생의 큰 흐름",
    "meaningOfThisYear": "올해가 인생 전체 흐름에서 가지는 의미",
    "tenYearFlow": [
      { "periodLabel": "0~2년", "phaseLabel": "기반 설정기", "interpretation": "0~2년 구간 해석" },
      { "periodLabel": "3~5년", "phaseLabel": "확장기", "interpretation": "3~5년 구간 해석" },
      { "periodLabel": "6~10년", "phaseLabel": "성과 정착기", "interpretation": "6~10년 구간 해석" }
    ],
    "longPatternInterpretation": ["장기 패턴 해석 1", "장기 패턴 해석 2", "장기 패턴 해석 3"],
    "keyThemes": [
      { "theme": "핵심 테마 1", "interpretation": "테마 1 해석" },
      { "theme": "핵심 테마 2", "interpretation": "테마 2 해석" },
      { "theme": "핵심 테마 3", "interpretation": "테마 3 해석" }
    ],
    "quarterNarratives": [
      { "quarter": "1분기", "role": "기반 정비", "meaning": "분기 의미 1", "focus": "집중 포인트 1", "caution": "주의 포인트 1" },
      { "quarter": "2분기", "role": "확장 시동", "meaning": "분기 의미 2", "focus": "집중 포인트 2", "caution": "주의 포인트 2" },
      { "quarter": "3분기", "role": "성과 압축", "meaning": "분기 의미 3", "focus": "집중 포인트 3", "caution": "주의 포인트 3" },
      { "quarter": "4분기", "role": "정리와 전환 준비", "meaning": "분기 의미 4", "focus": "집중 포인트 4", "caution": "주의 포인트 4" }
    ],
    "yearEndResidue": "올해가 끝났을 때 남아야 할 것",
    "closingLine": "한 줄 결론",
    "lifecycleExecutionPattern": ["생애 실행 패턴 1", "생애 실행 패턴 2"],
    "phaseFocusMap": [
      { "phaseLabel": "0~2년", "focusPoint": "초기 집중 포인트", "executionPattern": "초기 실행 패턴", "checkpoint": "초기 점검 기준" },
      { "phaseLabel": "3~5년", "focusPoint": "전환 집중 포인트", "executionPattern": "중기 실행 패턴", "checkpoint": "중기 점검 기준" },
      { "phaseLabel": "6~10년", "focusPoint": "확장 집중 포인트", "executionPattern": "장기 실행 패턴", "checkpoint": "장기 점검 기준" }
    ],
    "accumulationTransitionFlow": [
      { "axis": "쌓을 것", "guidance": "장기 축적 항목과 기준" },
      { "axis": "버릴 것", "guidance": "중단할 습관과 정리 기준" },
      { "axis": "전환 트리거", "guidance": "다음 단계 전환 신호" },
      { "axis": "복구 규칙", "guidance": "지연 복구 규칙과 재시작 조건" }
    ],
    "longPracticeStrategy": ["장기 실천 전략 1", "장기 실천 전략 2"],
    "yearToLifeBridge": "올해 실행이 생애 단계 전환과 어떻게 연결되는지 요약",
    "quarterlyGoals": ["분기 목표 1", "분기 목표 2"],
    "monthlyActions": ["월별 실행 1", "월별 실행 2"],
    "riskCalendar": ["리스크 캘린더 1", "리스크 캘린더 2"],
    "quarterThemes": ["분기 집중 주제 1", "분기 집중 주제 2"],
    "monthlyPushCaution": ["월별 추진/주의 1", "월별 추진/주의 2"],
    "actionCheckpoints": ["실행 체크포인트 1", "실행 체크포인트 2"],
    "priorityQueue": ["우선순위 1", "우선순위 2"],
${LIFETIME_SUPPLEMENT_CALENDAR_SCHEMA}
  }
}`.trim(),
};

const STRATEGY_INSTRUCTIONS: Record<SajuServiceType, string> = {
  "traditional-saju": `당신은 전통 사주 해석가입니다. 핵심 기조, 주의점, 실행 조언을 균형 있게 제시하세요.
${SHARED_RULES}`.trim(),
  "saju-2026-overview": `당신은 2026 신년 종합 사주 분석가입니다. 2026년 전체 판세, 핵심 기회, 핵심 리스크, 우선 행동을 중심으로 제시하고 장기 인생 해석은 제외하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_OVERVIEW_RULES}`.trim(),
  "saju-2026-study-exam": `당신은 2026 시험/학업운 분석가입니다. 2026년 기준으로 공부 집중 리듬, 시험/면접/지원 타이밍, 준비 우선순위를 실행 중심으로 제시하고 장기 인생 해석은 제외하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}
${NEW_YEAR_2026_STUDY_UPGRADE_RULES}`.trim(),
  "saju-2026-yearly-outlook": `당신은 2026 연간 운세 분석가입니다. 2026년의 분기/월별 실행 신호를 중심으로 제시하고, 장기 인생 해석은 제외하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_OVERVIEW_RULES}`.trim(),
  "saju-love-focus": `당신은 2026 연애/결혼운 분석가입니다. 상대 정보가 없는 개인 사주 기준으로 2026년의 관계 흐름과 결혼 방향성만 제시하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}
${NEW_YEAR_2026_LOVE_RULES}`.trim(),
  "saju-2026-wealth-business": `당신은 2026 사업자 재물/사업운 분석가입니다. 이 서비스는 현재 사업 중이거나 자영업·프리랜서처럼 직접 매출과 비용을 운영하는 사용자를 전제로 합니다. 현금흐름, 수익/지출 구조, 사업 운영 판단, 보수/확장 타이밍을 중심으로 제시하고 투자 자산 해석은 제외하세요.
반드시 oneLineDiagnosis/keyPoints(3)/easyInterpretationPoints/annualFlowSummary/quarterlyFlowCards(1분기~4분기)/revenueFlowDeepDive/businessManagementPoints/burnoutPreventionStrategies/actionChecklist/closingLine을 모두 채우세요.
분기별 카드는 같은 템플릿(flowSummary/keyPoint/risk/actionStrategy)으로 작성하고, 문장은 실행 가능한 사업 운영 언어를 사용하세요.
사주 용어를 유지하되 각 문장에서 쉬운 설명을 함께 제공하고, 단정형 표현 대신 조언형 표현을 사용하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}`.trim(),
  "saju-2026-investment-assets": `당신은 2026 주식/부동산 투자운 분석가입니다. 종목 추천이나 수익 보장을 하지 말고, 진입/관망/회수 타이밍과 유동성·레버리지 리스크를 범주형 판단으로 제시하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}
${NEW_YEAR_2026_INVESTMENT_UPGRADE_RULES}`.trim(),
  "saju-2026-career-aptitude": `당신은 2026 직업/적성 운세 분석가입니다. 2026년 기준의 직무 선택, 역할 적합성, 실행 신호만 제시하고 장기 커리어 로드맵은 제외하세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}`.trim(),
  "saju-2026-health-balance": `당신은 2026 건강운 분석가입니다. 2026년 컨디션 리듬과 회복 우선순위를 중심으로 구체적으로 제시하고 장기 질환 예측으로 과도하게 확장하지 마세요.
${SHARED_RULES}
${NEW_YEAR_2026_COMMON_RULES}
${NEW_YEAR_2026_FOCUSED_RULES}
${NEW_YEAR_2026_HEALTH_RULES}`.trim(),
  "saju-lifetime-roadmap": `당신은 인생총운 로드맵 분석가입니다.
핵심 질문: "내 인생 흐름은 어떤 단계로 전개되는가?"
반드시 인생 단계 변화 시기, 전개 방향, 성숙/확장/정리 축의 연결 서사를 제시하세요.
시간축은 직전/현재/다음/다다음 4개 10년 구간으로 작성하세요.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-lifetime-roadmap"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-lifetime-roadmap"]}
${LIFETIME_DAEUN_OUTPUT_RULES}`.trim(),
  "saju-daeun-shift": `당신은 대운 전환 인생총운 분석가입니다.
핵심 질문: "지금 전환기에서 무엇이 바뀌고 어떻게 대비할까?"
반드시 전환 신호, 변화 포인트, 준비 행동, 전환 전/중/후 차이를 제시하세요.
시간축은 4단계(전환 전 준비기 / 전환기 / 전환 후 재배치기 / 전환 후 정착기)로 작성하세요.
2026년은 전환 촉발 연도로만 사용하고, 본문은 전환 후 1~2년/3~5년/6~10년 방향을 중심으로 작성하세요.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-daeun-shift"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-daeun-shift"]}`.trim(),
  "saju-career-timing": `당신은 인생총운 커리어 타이밍 분석가입니다.
핵심 질문: "내 커리어는 어떤 단계에 있고 다음 전환은 언제 오는가?"
반드시 4단계(초기 축적기/전환기/확장기/안정화기) 장기 흐름을 먼저 제시하고, 단계별 전환 신호를 명확히 작성하세요.
시간축은 0~2년/3~5년/6~10년/10년+를 모두 포함하세요.
2026 같은 단일 연도는 currentYearFocus 보조 포인트로만 제한하고 본문 반복은 금지합니다.
decideNow/deferNow는 결정 매트릭스 보조 섹션으로 유지하되, 장기 단계 서사를 대체하면 안 됩니다.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-career-timing"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-career-timing"]}`.trim(),
  "saju-wealth-flow": `당신은 인생총운 재물 흐름 레이더 분석가입니다.
핵심 질문: "내 인생 전체 자산 흐름과 재정 운영 패턴은 어떻게 전개되는가?"
반드시 재무 생애 4단계(축적기/확장기/방어기/변동기)를 본문 중심 구조로 제시하세요.
각 단계는 phaseType/timeRange/ageRange/yearRange/coreObjective/opportunity/risk/operatingRules/transitionSignal을 모두 포함하세요.
현금흐름 해석은 "핵심 질문 → 4단계 사이클 → 10년 추세 근거 → 구간별 운영 규칙 → 현재 구간 실행" 순서를 유지하세요.
2026 같은 단년도는 현재 앵커로 1회만 사용하고, 본문 반복은 금지합니다.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-wealth-flow"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-wealth-flow"]}`.trim(),
  "saju-helper-network": `당신은 관계·귀인 네트워크 분석가입니다.
핵심 질문: "어떤 관계를 넓히고 어떤 갈등을 줄여야 하는가?"
반드시 관계 단계별 확장/정리, 협업 운 운영 기준, 멘토·귀인 유입 시그널, 경계 패턴을 구조화해 제시하세요.
phaseRoadmap은 최소 4단계를 유지하고 각 단계에 relationshipExpansion/collaborationFlow/mentorInfluxSignal/guardPattern/actionStrategy를 포함하세요.
시간축은 0~2년/3~5년/6~10년/10년+를 기본으로 작성하고 단년도(예: 2026)는 보조 적용 포인트에서만 제한적으로 언급하세요.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-helper-network"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-helper-network"]}`.trim(),
  "saju-energy-balance": `당신은 적성·에너지 밸런스 인생총운 분석가입니다.
핵심 질문: "내 에너지를 어떻게 써야 오래 성과를 낼까?"
반드시 타고난 에너지 성향, 에너지 운용 방식, 생애 단계 변화, 중장기 운영 전략을 제시하고 4주/12주 리듬은 단기 운영으로만 다루세요.
시간축은 생애 전반 + 0~2년/3~5년/6~10년 + 4주/12주 + 현재 연도 적용 포인트를 모두 포함하세요.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-energy-balance"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-energy-balance"]}`.trim(),
  "saju-yearly-action-calendar": `당신은 연간 실행 캘린더 분석가입니다.
핵심 질문: "올해 실행이 내 인생 단계 전환과 장기 축적에 어떻게 연결되는가?"
반드시 9개 섹션(한 줄 총평, 지금 인생의 큰 흐름, 올해의 의미, 올해 이후 10년의 흐름, 장기 패턴 해석, 올해의 핵심 테마 3가지, 분기별 실행 캘린더, 올해가 끝났을 때 남아야 할 것, 한 줄 결론)을 제시하세요.
반드시 생애 실행 축 요약(yearToLifeBridge), 생애 단계별 실행 패턴(0~2년/3~5년/6~10년/전환), 축적·전환 흐름, 분기 목표, 월별 집중 신호, 실행 우선순위, 체크포인트를 제시하세요.
시간축은 생애 단계(0~2년/3~5년/6~10년/전환) + 분기 4블록 + 월별 12행동으로 작성하세요.
필수 품질 규칙: 장기 필드(총운/올해 의미/10년 흐름/장기 패턴/핵심 테마/연말 잔여물/결론)를 모두 채우고, 분기-월 정합성을 지키며, 분기 단위 문장 중복(coreFlow/evidence 포함)을 금지하고, 내부 토큰(calendar-map/Q1/Structuring/Acceleration)을 노출하지 마세요.
장기 필드(oneLineTotalReview/currentLifeFlow/meaningOfThisYear/tenYearFlow/longPatternInterpretation/keyThemes/yearEndResidue/closingLine)에는 오늘/이번 주/이번 달/3월 말까지 같은 단기 표현을 금지하세요.
${SHARED_RULES}
${LIFETIME_DEMERIT_COMMON_RULES}
${LIFETIME_DEMERIT_SERVICE_RULES["saju-yearly-action-calendar"]}
${LIFETIME_SUPPLEMENT_COMMON_RULES}
${LIFETIME_SUPPLEMENT_RULES["saju-yearly-action-calendar"]}`.trim(),
};

const buildStrategy = (serviceType: SajuServiceType): SajuReportStrategy => {
  const reportTemplateVersion = SERVICE_TEMPLATE_VERSION_OVERRIDES[serviceType] ?? TEMPLATE_VERSION;
  const responseSchema = STRATEGY_SCHEMAS[serviceType].replace(
    `"reportTemplateVersion": "${TEMPLATE_VERSION}"`,
    `"reportTemplateVersion": "${reportTemplateVersion}"`,
  );
  return {
    serviceType,
    reportTemplateVersion,
    systemInstruction: STRATEGY_INSTRUCTIONS[serviceType],
    responseSchema,
    postProcessor: (prompt: string) =>
      `${prompt}

[Output guard]
- reportTemplateVersion must be "${reportTemplateVersion}".
- Return strict JSON only, and fill required fields for the selected service.
- Required arrays must stay non-empty unless schema explicitly allows empty.
- Never use placeholder values ("?", "N/A", "unknown", empty string) in required fields.
- For saju-wealth-flow / saju-energy-balance: interpretation text only (chart numbers are deterministic).
- analysisBlocks count by service time scale: 로드맵 4, 대운전환 4, 커리어 4, 재물 4, 관계 3, 에너지 4+, 연간캘린더 4+.
- For saju-energy-balance: include innateProfile/operatingModel/stageShiftMap/longRangeStrategy and cover 생애 전반 + 0~2년/3~5년/6~10년 + 4주/12주 + 현재 연도 적용 포인트.
- Lifetime 7 services: each analysis block must include opportunities/risks/actionStrategy with 2+ complete sentences each.
- For saju-daeun-shift: analysisBlocks must use 4 fixed phases (전환 전 준비기, 전환기, 전환 후 재배치기, 전환 후 정착기).
- For saju-daeun-shift: include phaseRoadmap(4 items) and longHorizonDirection(1~2년, 3~5년, 6~10년).
- For saju-daeun-shift: treat 2026 as a transition trigger year only; prioritize multi-year direction after transition.
- For saju-career-timing: include stageFlow(4 items: build-up/transition/expansion/stabilization) and keep analysisBlocks aligned with the same 4 phases.
- For saju-career-timing: mention single-year references only in currentYearFocus; keep main narrative in multi-year stage flow.
- For saju-wealth-flow: include wealthLifecycleStages(4 items: accumulation/expansion/defense/volatility) and keep analysisBlocks aligned with the same 4 phases.
- For saju-wealth-flow: each wealthLifecycleStages item must include phaseType/timeRange/ageRange/yearRange/coreObjective/opportunity/risk/operatingRules/transitionSignal.
- For saju-wealth-flow: single-year references (e.g. 2026) must appear once as a current anchor; prioritize multi-year lifecycle narrative.
- For saju-helper-network: include phaseRoadmap(4+ items) and longHorizonDirection(1~2년, 3~5년, 6~10년).
- For saju-helper-network: each phaseRoadmap item must include relationshipExpansion/collaborationFlow/mentorInfluxSignal/guardPattern/actionStrategy.
- For saju-helper-network: direct single-year mentions (e.g. 2026) must remain auxiliary only and must not dominate main narrative.
- For saju-yearly-action-calendar: include oneLineTotalReview/currentLifeFlow/meaningOfThisYear/tenYearFlow/longPatternInterpretation/keyThemes/yearEndResidue/closingLine.
- For saju-yearly-action-calendar: keyThemes must contain exactly 3 items and quarterNarratives must contain 4 items with distinct role/meaning/focus/caution.
- For saju-yearly-action-calendar: include yearToLifeBridge/lifecycleExecutionPattern/phaseFocusMap/accumulationTransitionFlow/longPracticeStrategy and place this long-horizon layer before quarterly/monthly details.
- For saju-yearly-action-calendar: keep quarterlyGoals/riskCalendar/quarterThemes at 4 items, monthlyActions/monthlyPushCaution/actionCheckpoints at 12 items, and ensure quarter-month consistency.
- For saju-yearly-action-calendar: prohibit duplicate quarter sentences across quarterlyGoals/riskCalendar/quarterThemes and analysisBlocks coreFlow/evidence.
- For saju-yearly-action-calendar: never expose internal tokens like calendar-map/Q1/Structuring/Acceleration in user-facing text.
- For saju-yearly-action-calendar: do not use short-term markers (오늘/이번 주/이번 달/3월 말까지/매일 30분) in narrative layer fields.
- 2026 signalTrio: no numeric score, use only 등급(약/중/강, 낮음/보통/높음).
- 2026 overview/yearly-outlook only: output focusCards in fixed 7-card order.
- 2026 focused 6 services: do not output focusCards; output only service-specific deep fields (string 2~4문장, array item 2~4개 완결문장).
- For saju-2026-study-exam: include studyActionReport with coreDiagnosis/keyQuestion/keyInsights(3)/immediateActions(startNow/stopNow/prepNow)/yearFlowSummary(preparationPhase/accelerationPhase/showdownPhase/wrapUpPhase)/quarterlyDetailed(1~3월,4~6월,7~9월,10~12월)/examTypeGuides/failurePatterns/performanceStrategy(studyMethod/lifeManagement/mentalManagement)/plainEvidence/finalSummary.
- For saju-2026-investment-assets: include investmentActionReport with coreDiagnosis/keyQuestion/keyInsights(3)/immediateActions/absoluteCautions/quarterlyFlow(1분기,2분기,3분기,4분기)/assetClassGuides(stocksEtf/realEstate/cashSavings/cryptoHighVolatility)/signalBoard(watchSignals/entrySignals)/riskAlerts/practicalChecklist/plainEvidence/flowTo2027/finalConclusion.
- For saju-love-focus: include marriageDecisionBoard/meetingChannelPriority/greenFlagChecklist/redFlagChecklist/conflictProtocol and consumerFaq(8 question-answer items).
- Keep at most one common anchor sentence; avoid sentence-level duplication across services.
- daeunPeriods enums must be valid only: gan(갑을병정무기경신임계), ji(자축인묘진사오미신유술해), oheng(목화토금수).`,
  };
};

const STRATEGY_MAP: Record<SajuServiceType, SajuReportStrategy> = {
  "traditional-saju": buildStrategy("traditional-saju"),
  "saju-2026-overview": buildStrategy("saju-2026-overview"),
  "saju-2026-study-exam": buildStrategy("saju-2026-study-exam"),
  "saju-2026-yearly-outlook": buildStrategy("saju-2026-yearly-outlook"),
  "saju-love-focus": buildStrategy("saju-love-focus"),
  "saju-2026-wealth-business": buildStrategy("saju-2026-wealth-business"),
  "saju-2026-investment-assets": buildStrategy("saju-2026-investment-assets"),
  "saju-2026-career-aptitude": buildStrategy("saju-2026-career-aptitude"),
  "saju-2026-health-balance": buildStrategy("saju-2026-health-balance"),
  "saju-lifetime-roadmap": buildStrategy("saju-lifetime-roadmap"),
  "saju-daeun-shift": buildStrategy("saju-daeun-shift"),
  "saju-career-timing": buildStrategy("saju-career-timing"),
  "saju-wealth-flow": buildStrategy("saju-wealth-flow"),
  "saju-helper-network": buildStrategy("saju-helper-network"),
  "saju-energy-balance": buildStrategy("saju-energy-balance"),
  "saju-yearly-action-calendar": buildStrategy("saju-yearly-action-calendar"),
};

export const getSajuReportStrategy = (serviceType: string): SajuReportStrategy =>
  STRATEGY_MAP[serviceType as SajuServiceType] ?? STRATEGY_MAP["traditional-saju"];

export const DAILY_FORTUNE_SCHEMA = `{
  "score": 85,
  "summary": "?ㅻ뒛 ?댁꽭 珥앺룊",
  "details": "?ㅻ뒛 ?먮쫫??????곸꽭 ?댁꽍",
  "luckyColor": "?⑥깋",
  "luckyItem": "?명듃",
  "luckyNumber": 7,
  "healthTip": "吏㏃? ?ㅽ듃?덉묶?쇰줈 湲댁옣????댁＜?몄슂.",
  "categories": {
    "total": {
      "score": 85,
      "summary": "珥앹슫 ?붿빟",
      "detail": "珥앹슫 ?곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    },
    "love": {
      "score": 70,
      "summary": "?곗븷 ?붿빟",
      "detail": "?곗븷 ?곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    },
    "wealth": {
      "score": 90,
      "summary": "?щЪ ?붿빟",
      "detail": "?щЪ ?곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    },
    "career": {
      "score": 65,
      "summary": "而ㅻ━???붿빟",
      "detail": "而ㅻ━???곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    },
    "study": {
      "score": 80,
      "summary": "?숈뾽 ?붿빟",
      "detail": "?숈뾽 ?곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    },
    "health": {
      "score": 75,
      "summary": "嫄닿컯 ?붿빟",
      "detail": "嫄닿컯 ?곸꽭",
      "advice": "?됰룞 議곗뼵",
      "luckyTip": "?꾩????섎뒗 ?좏깮",
      "cautionPoint": "二쇱쓽 ?ъ씤??
    }
  }
}`;

