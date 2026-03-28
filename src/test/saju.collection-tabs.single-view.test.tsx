import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SajuCollectionTabs } from "@/components/saju/SajuCollectionTabs";
import type {
  NewYear2026HealthPayload,
  NewYear2026InvestmentPayload,
  NewYear2026LovePayload,
  NewYear2026OverviewPayload,
  NewYear2026StudyExamPayload,
  NewYear2026WealthBusinessPayload,
  SajuResult,
} from "@/types/result";

const sampleResult: SajuResult = {
  id: "result-single",
  profileData: {
    calendarType: "solar",
    year: 1995,
    month: 6,
    day: 29,
    gender: "male",
  },
  palja: {
    year: { gan: "갑", ji: "자", ohengGan: "목", ohengJi: "수" },
    month: { gan: "병", ji: "인", ohengGan: "화", ohengJi: "목" },
    day: { gan: "정", ji: "묘", ohengGan: "화", ohengJi: "목" },
    time: { gan: "계", ji: "해", ohengGan: "수", ohengJi: "수" },
  },
  oheng: [
    { element: "목", count: 2, percentage: 40 },
    { element: "화", count: 1, percentage: 20 },
    { element: "토", count: 0, percentage: 0 },
    { element: "금", count: 1, percentage: 20 },
    { element: "수", count: 1, percentage: 20 },
  ],
  interests: [],
  summary: "단일 서비스 기본 요약",
  sections: [],
};

const buildNewYearBaseResult = (): SajuResult => ({
  ...sampleResult,
  summary: "2026 종합 흐름",
  consultationType: "new-year-2026",
});

const overviewPayload: NewYear2026OverviewPayload = {
  coreQuestion: "2026년 전체 흐름에서 가장 먼저 잡아야 할 핵심은 무엇인가?",
  coreInsights: ["분산보다 방향을 먼저 정하면 흐름이 안정됩니다."],
  actionNow: ["이번 달 우선순위 1개를 고정하세요."],
  evidence: ["초반 추진과 중반 조정이 함께 보입니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "초반에는 속도를 올리고 중반에는 조정하는 흐름입니다.",
      evidence: "출발 추진력이 뚜렷합니다.",
      opportunities: ["실행력 상승"],
      risks: ["과속"],
      actionStrategy: ["우선순위 1개 고정"],
    },
  ],
  quickSummary: {
    verdict: "초반 추진, 하반기 조정",
    keywords: ["추진", "조정", "우선순위"],
    signalTrio: {
      interpretationIntensityLevel: "높음",
      attentionLevel: "보통",
      changeSignalLevel: "높음",
      reason: "초반 추진력이 강하고 하반기에는 정리 강도가 커집니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "출발", opportunity: "실행력", caution: "과속", action: "우선순위 1개 고정" },
    { quarter: "2분기", quarterSummary: "확장", opportunity: "성과", caution: "과욕", action: "루틴 고정" },
    { quarter: "3분기", quarterSummary: "조정", opportunity: "개선", caution: "과열", action: "일정 재정렬" },
    { quarter: "4분기", quarterSummary: "정리", opportunity: "안정", caution: "지연", action: "마무리 점검" },
  ],
  focusCards: [
    { focusId: "saju-2026-overview", focusLabel: "종합", conclusion: "종합 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-2026-study-exam", focusLabel: "시험·학업", conclusion: "시험·학업 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-love-focus", focusLabel: "연애·결혼", conclusion: "연애·결혼 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-2026-wealth-business", focusLabel: "재물·사업", conclusion: "재물·사업 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-2026-investment-assets", focusLabel: "주식·부동산 투자", conclusion: "주식·부동산 투자 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-2026-career-aptitude", focusLabel: "직업·적성", conclusion: "직업·적성 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
    { focusId: "saju-2026-health-balance", focusLabel: "건강", conclusion: "건강 결론", dos: ["do1", "do2"], donts: ["dont1"], evidencePrimary: "근거1", evidenceExtra: ["추가 근거 1"] },
  ],
  actionPlan90: {
    day30: ["30일 계획"],
    day60: ["60일 점검"],
    day90: ["90일 마무리"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

const studyPayload: NewYear2026StudyExamPayload = {
  coreQuestion: "2026년 시험·학업 흐름에서 성과를 높이려면 무엇을 우선해야 하는가?",
  coreInsights: ["루틴 유지가 점수 안정으로 이어집니다."],
  actionNow: ["실전 과목 1개를 먼저 고정하세요."],
  evidence: ["초반 집중 신호가 강합니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "기초를 빠르게 다지고 실전 감각을 정리하는 구간입니다.",
      evidence: "초반 집중력이 강합니다.",
      opportunities: ["기초 과목 선점"],
      risks: ["과목 병행 과다"],
      actionStrategy: ["오답 루틴 고정"],
    },
  ],
  quickSummary: {
    verdict: "상반기 집중, 하반기 정리",
    keywords: ["집중", "루틴", "정리"],
    signalTrio: {
      interpretationIntensityLevel: "높음",
      attentionLevel: "보통",
      changeSignalLevel: "높음",
      reason: "초반 추진력이 강하고 중반 이후에는 정리 강도가 커집니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "출발", opportunity: "진도 선점", caution: "과속", action: "실전 과목 고정" },
    { quarter: "2분기", quarterSummary: "확장", opportunity: "성적 반등", caution: "일정 과밀", action: "오답 루틴 정착" },
    { quarter: "3분기", quarterSummary: "조정", opportunity: "약점 보완", caution: "집중 분산", action: "모의고사 복기" },
    { quarter: "4분기", quarterSummary: "수확", opportunity: "실전 안정", caution: "막판 흔들림", action: "최종 정리" },
  ],
  studyRhythm:
    "상반기에는 몰입 속도가 빠르고 하반기에는 정리 강도가 높아집니다. 핵심 과목의 반복 주기를 고정하면 점수 변동폭을 줄일 수 있습니다.",
  examWindows: [
    "2분기에는 지표 변동폭이 줄어들며 진도 선점이 성적 상승으로 이어질 가능성이 큽니다.",
    "4분기에는 실전 루틴을 줄이지 말고 최종 정리 범위를 좁혀 마무리 집중도를 올리세요.",
  ],
  mistakeTriggers: [
    "초반 성과 직후 과목 수를 급격히 늘리면 복습 시간이 무너져 전체 효율이 떨어집니다.",
    "오답 구조 분석 없이 문제 수만 늘리면 체감 노력 대비 성과가 작아집니다.",
  ],
  executionGuide: [
    "핵심 과목은 매일 같은 시간에 배치해 집중 시작 시간을 자동화하세요.",
    "주 2회 오답 복기와 주 1회 실전 시간 측정을 고정하면 시험 적응력을 높일 수 있습니다.",
  ],
  evidenceNotes: [
    "시험·학업운은 초반 추진과 중반 조정이 반복돼 루틴 유지가 실전 변동폭을 줄입니다.",
    "분기별 진도 선점과 오답 정리 강도를 나누면 최종 성과 차이가 발생합니다.",
  ],
  studyActionReport: {
    coreDiagnosis: {
      headline: "루틴 고정과 실전 복기 강도가 합격 전환의 핵심입니다.",
      summary: "올해는 진도 속도보다 반복 가능성이 높은 구조를 먼저 만드는 쪽이 유리합니다.",
      confidenceNote: "주간 점검이 빠지면 성과 편차가 커질 수 있어 체크 루틴이 필수입니다.",
    },
    keyQuestion: "2026년 합격 확률을 높이기 위해 지금 무엇을 먼저 고정해야 하는가?",
    keyInsights: [
      "초반에는 과목 확장보다 핵심 과목 반복 주기 고정이 우선입니다.",
      "중반에는 모의고사 오답 원인 분류가 점수 변동폭을 줄입니다.",
      "후반에는 신규 학습보다 취약 파트 압축 보완이 실전 안정에 유리합니다.",
    ],
    immediateActions: {
      startNow: ["핵심 과목 1개를 매일 같은 시간에 배치하세요.", "주 2회 오답 복기 시간을 캘린더에 먼저 고정하세요."],
      stopNow: ["점수 반등 직후 과목 수를 급격히 늘리는 행동을 멈추세요.", "피로 누적 상태에서 공부 시간만 늘리는 방식을 멈추세요."],
      prepNow: ["지원·응시 일정과 진도율을 한 장의 추적표로 관리하세요.", "시험 8주 전부터 주 1회 시간 배분 리허설을 시작하세요."],
    },
    yearFlowSummary: {
      preparationPhase: "준비기에는 기본 개념과 오답 분류 체계를 먼저 고정해야 이후 가속이 가능합니다.",
      accelerationPhase: "가속기에는 진도 확장과 실전 적용을 병행하되 복기 시간을 선점해야 합니다.",
      showdownPhase: "승부기에는 시간 배분·문제 선택·멘탈 복구 루틴을 동시에 점검하세요.",
      wrapUpPhase: "정리기에는 범위를 줄이고 흔들리는 파트만 압축 보완해야 실전 안정성이 높아집니다.",
    },
    quarterlyDetailed: [
      {
        period: "1~3월",
        strengths: ["집중 시작 속도가 빠릅니다.", "기본기 정착 효율이 높은 구간입니다."],
        risks: ["과목 과확장으로 복습 회전이 깨질 수 있습니다.", "초반 성과에 과신하면 점검이 느슨해질 수 있습니다."],
        recommendedStrategies: ["핵심 과목 반복 주기를 먼저 고정하세요.", "주간 체크리스트로 실행 누락을 막으세요."],
        checkQuestionOrTip: "이번 주 학습 시간이 아니라 정답률 개선 근거를 기록했는가?",
      },
      {
        period: "4~6월",
        strengths: ["모의고사 데이터가 누적되며 개선 포인트가 선명해집니다.", "진도와 복기를 병행하기 좋은 구간입니다."],
        risks: ["일정 과밀로 피로가 누적될 수 있습니다.", "속도만 올리면 오답 재발률이 높아질 수 있습니다."],
        recommendedStrategies: ["오답 원인 분류를 유형별로 관리하세요.", "주간 목표를 2개로 제한해 완성도를 높이세요."],
        checkQuestionOrTip: "오답 원인 분류가 다음 주 학습 계획에 반영됐는가?",
      },
      {
        period: "7~9월",
        strengths: ["취약 파트 보완 효과가 빠르게 나타납니다.", "실전 적응력 개선 여지가 큽니다."],
        risks: ["집중 분산으로 루틴 이탈이 생길 수 있습니다.", "불안감으로 계획 변경이 잦아질 수 있습니다."],
        recommendedStrategies: ["실전 시간 배분 루틴을 고정하세요.", "신규 학습보다 재발 실수 차단에 집중하세요."],
        checkQuestionOrTip: "실전 루틴 점검표를 시험 형식별로 분리해 사용하고 있는가?",
      },
      {
        period: "10~12월",
        strengths: ["최종 정리 집중도가 올라갑니다.", "실전 완성도를 끌어올리기 좋은 구간입니다."],
        risks: ["막판 흔들림으로 범위를 다시 넓힐 위험이 있습니다.", "과도한 불안으로 루틴이 깨질 수 있습니다."],
        recommendedStrategies: ["최종 정리 범위를 명확히 줄이세요.", "실전 체크리스트를 하루 단위로 유지하세요."],
        checkQuestionOrTip: "오늘 학습이 내일 실전에 바로 연결되는 구조인가?",
      },
    ],
    examTypeGuides: {
      writtenExam: ["개념-문제-오답 복기를 한 세트로 반복하세요.", "주 1회 시간 제한 훈련으로 속도와 정확도를 함께 점검하세요."],
      interviewOrOral: ["답변을 1분/3분 버전으로 나눠 말하기 루틴을 고정하세요.", "실전 직전에는 내용 추가보다 전달 구조 점검에 집중하세요."],
      longTermLearning: ["월간 목표보다 주간 반복 지표를 고정하세요.", "슬럼프 구간에는 진도 확장 대신 루틴 복구를 우선하세요."],
    },
    failurePatterns: ["점수 반등 직후 과목을 무작정 늘려 복습이 붕괴되는 패턴", "오답 원인 기록 없이 문제 수만 늘려 같은 실수가 재발하는 패턴"],
    performanceStrategy: {
      studyMethod: ["과목별 목표를 줄이고 반복 주기를 고정하세요.", "학습 직후 복기 기록을 남겨 시작 지연을 줄이세요."],
      lifeManagement: ["수면·식사·이동 시간을 고정해 공부 시작 지연을 줄이세요.", "주간 회복 블록을 먼저 배치해 과부하를 차단하세요."],
      mentalManagement: ["감정 추측보다 데이터 점검 중심으로 멘탈을 관리하세요.", "실전 직전에는 수행 체크리스트 반복으로 긴장 편차를 낮추세요."],
    },
    plainEvidence: [
      "쉽게 말해, 올해는 많이 하는 사람보다 같은 방식으로 끝까지 반복한 사람이 유리합니다.",
      "시기별 강점과 리스크가 달라서 분기별 전략 조정이 필수입니다.",
    ],
    finalSummary: [
      "루틴 고정, 오답 구조화, 실전 시간 관리 3축을 끝까지 유지하세요.",
      "지금 해야 할 행동을 일정에 고정하면 합격운을 실제 점수로 바꿀 수 있습니다.",
    ],
  },
  actionPlan90: {
    day30: ["30일: 과목 루틴 확정"],
    day60: ["60일: 오답 패턴 정리"],
    day90: ["90일: 실전 점검 마무리"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

const lovePayload: NewYear2026LovePayload = {
  coreQuestion: "2026년 연애·결혼 흐름에서 관계의 속도와 방향을 어떻게 잡아야 하는가?",
  coreInsights: ["관계 속도보다 신뢰 이행률을 우선 지표로 둬야 합니다."],
  actionNow: ["핵심 관계 기준 3개를 먼저 문장으로 고정하세요."],
  evidence: ["접근 신호와 경계 신호가 동시에 나타나는 흐름입니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "관계 탐색과 기준 정렬이 동시에 필요한 구간입니다.",
      evidence: "초반 호감 상승과 기대치 불일치 신호가 함께 나타납니다.",
      opportunities: ["신뢰 대화 진입 신호"],
      risks: ["속도 과속"],
      actionStrategy: ["관계 기준 문장화"],
    },
  ],
  quickSummary: {
    verdict: "속도 조절과 기준 정렬",
    keywords: ["신뢰", "속도", "기준"],
    signalTrio: {
      interpretationIntensityLevel: "높음",
      attentionLevel: "보통",
      changeSignalLevel: "높음",
      reason: "관계 신호의 변화폭이 커서 판단 기준 고정이 필요합니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "탐색", opportunity: "신뢰 대화", caution: "과속", action: "기준 정렬" },
    { quarter: "2분기", quarterSummary: "확장", opportunity: "약속 강화", caution: "기대치 충돌", action: "합의 점검" },
    { quarter: "3분기", quarterSummary: "검증", opportunity: "결혼 논의", caution: "감정 과열", action: "속도 조절" },
    { quarter: "4분기", quarterSummary: "정리", opportunity: "관계 공인", caution: "피로 누적", action: "역할 분담" },
  ],
  relationshipFlow:
    "상반기에는 관계 신호가 빠르게 붙고 하반기에는 책임 이행 여부에서 관계의 방향이 갈립니다. 감정 강도보다 신뢰 이행률을 기준으로 판단해야 안정성이 높아집니다.",
  approachSignals: [
    "일정 공유와 후속 약속 제안이 반복되는 경우 관계 진입 신호로 판단하고, 확인 기준은 2주 내 약속 이행률로 두세요.",
    "대화 주제가 일상에서 미래 계획으로 이동하는 경우 속도를 한 단계 올리고, 확인 기준은 갈등 시 대화 복구 시간으로 두세요.",
  ],
  cautionPatterns: [
    "호감이 높은 초반에 관계 정의를 서두르는 경우 속도를 늦추고, 확인 기준은 합의 항목 3개 충족 여부로 두세요.",
    "추측형 대화가 누적되는 경우 즉시 사실 확인 대화로 전환하고, 확인 기준은 오해 재발 횟수로 두세요.",
  ],
  relationshipGuide: [
    "갈등이 없는 구간에서도 주 1회 관계 점검 대화를 실행하고, 확인 기준은 일정·재정·역할 합의 유지로 두세요.",
    "중요 결정은 최소 하루 간격으로 재확인하고, 확인 기준은 다음 대화에서 동일 결론 유지 여부로 두세요.",
  ],
  marriageDecisionBoard: [
    "결혼 논의가 2회 연속 합의로 마무리되는 경우 다음 단계 일정을 확정하고, 확인 기준은 합의 이행률 70% 이상으로 두세요.",
    "핵심 합의가 비어 있는 경우 결혼 논의를 보류하고, 확인 기준은 30일 내 생활·재정·역할 합의 3개 확정 여부로 두세요.",
    "갈등 복구가 반복 실패하는 경우 결혼 논의를 중단하고, 확인 기준은 2주 내 갈등 복구 시간 단축 여부로 두세요.",
  ],
  meetingChannelPriority: [
    "지인 소개 채널에서 후속 약속 성사율이 높은 경우 주 1회 소개 요청을 실행하고, 확인 기준은 월 2회 이상 만남 성사로 두세요.",
    "커뮤니티 채널에서 대화 깊이가 유지되는 경우 참여를 고정하고, 확인 기준은 2주 내 재대화 여부로 두세요.",
  ],
  greenFlagChecklist: [
    "일정 변경 시 대안을 먼저 제시하고 이행하면 신뢰 확장 신호로 체크하세요.",
    "갈등 후 24시간 안에 대화 재개 의지가 확인되면 회복 탄력 신호로 체크하세요.",
  ],
  redFlagChecklist: [
    "합의 사안을 반복 번복하면 결혼 논의 보류 신호로 체크하세요.",
    "미래 계획 질문을 장기간 회피하면 속도 조절 신호로 체크하세요.",
  ],
  conflictProtocol: [
    "갈등 직후 감정 강도가 높은 경우 24시간은 사실 확인만 진행하고, 확인 기준은 쟁점 1개 문장화 여부로 두세요.",
    "24시간 이후에도 합의가 없으면 72시간 내 역할·기한을 재정의하고, 확인 기준은 동일 쟁점 재발 여부로 두세요.",
  ],
  consumerFaq: [
    { question: "지금 고백하거나 관계를 정의해도 되나요?", answer: "약속 이행률이 2주 이상 안정되면 진행하고, 확인 기준은 후속 약속 성사율로 두세요." },
    { question: "상견례나 부모님 소개는 언제가 적절한가요?", answer: "갈등 복구 대화가 2회 이상 성공하면 일정을 잡고, 확인 기준은 핵심 합의 3개 확정 여부로 두세요." },
    { question: "결혼 이야기는 어느 시점에 꺼내야 하나요?", answer: "미래 계획 대화가 반복되는 경우 결혼 의제를 꺼내고, 확인 기준은 1개월 내 합의 이행 여부로 두세요." },
    { question: "상대 연락이 줄어들면 바로 불안해해도 되나요?", answer: "연락 감소가 2주 지속되면 사실 확인 대화를 먼저 하고, 확인 기준은 약속 이행 변화로 두세요." },
    { question: "상대가 결혼을 계속 미루면 어떻게 해야 하나요?", answer: "결혼 논의가 2회 이상 지연되면 기한을 요청하고, 확인 기준은 기한 내 합의 도출 여부로 두세요." },
    { question: "조건은 좋지만 마음이 불안한 관계는 유지해도 되나요?", answer: "생활 리듬·회복력·이행률 3지표를 점검하고, 확인 기준은 3개 중 2개 충족 여부로 두세요." },
    { question: "장거리·바쁜 일정에서도 결혼까지 갈 수 있나요?", answer: "주간 대화 루틴과 월간 만남이 유지되면 진행하고, 확인 기준은 루틴 붕괴 시 복구 계획 합의 여부로 두세요." },
    { question: "관계를 계속할지 정리할지 결정이 안 됩니다.", answer: "핵심 갈등 반복 시 중단 기준을 먼저 실행하고, 확인 기준은 개선 신호 재발 여부로 두세요." },
  ],
  evidenceNotes: [
    "연애·결혼운은 접근 신호와 경계 신호가 동시에 나타나 속도 조절이 중요합니다.",
    "분기별로 약속 이행률과 갈등 복구 시간을 함께 점검하면 판단 정확도가 올라갑니다.",
  ],
  actionPlan90: {
    day30: ["30일: 관계 기준 3개 고정"],
    day60: ["60일: 결혼 논의 보류/진행 기준 점검"],
    day90: ["90일: 관계 단계 최종 판단"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

const wealthPayload: NewYear2026WealthBusinessPayload = {
  coreQuestion: "2026년 재물·사업 흐름에서 수익과 리스크 균형을 어떻게 잡아야 하는가?",
  coreInsights: ["확장 속도보다 운영 기준 고정이 먼저입니다."],
  actionNow: ["지출 승인 기준과 회수 점검 일정을 먼저 고정하세요."],
  evidence: ["확장 기회와 누수 리스크가 동시에 나타나는 흐름입니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "기준 정렬과 누수 차단을 먼저 고정해야 하는 구간입니다.",
      evidence: "초반에는 기회와 리스크가 함께 커집니다.",
      opportunities: ["핵심 수익 축 고정"],
      risks: ["판촉 과집행"],
      actionStrategy: ["승인 기준 문장화"],
    },
    {
      windowLabel: "2분기",
      timeRange: "2분기",
      coreFlow: "확장 신호를 선택적으로 반영해야 하는 구간입니다.",
      evidence: "채널 확장 압력이 커지는 시기입니다.",
      opportunities: ["재구매 채널 강화"],
      risks: ["고정비 급증"],
      actionStrategy: ["확장 축 1~2개 제한"],
    },
    {
      windowLabel: "3분기",
      timeRange: "3분기",
      coreFlow: "수익률 안정화와 운영 효율 보정이 필요한 구간입니다.",
      evidence: "중반 이후엔 비용 구조 영향이 커집니다.",
      opportunities: ["이익률 개선"],
      risks: ["회수 지연"],
      actionStrategy: ["회수 주기 점검"],
    },
    {
      windowLabel: "4분기",
      timeRange: "4분기",
      coreFlow: "연말 정리와 다음 연도 준비를 연결해야 하는 구간입니다.",
      evidence: "성과 정리와 재투자 판단이 겹칩니다.",
      opportunities: ["핵심 지표 재정렬"],
      risks: ["과로 누적"],
      actionStrategy: ["정리/준비 분리 계획"],
    },
  ],
  quickSummary: {
    verdict: "기준 우선, 확장은 선택적으로",
    keywords: ["현금흐름", "운영기준", "분기점검"],
    signalTrio: {
      interpretationIntensityLevel: "높음",
      attentionLevel: "높음",
      changeSignalLevel: "높음",
      reason: "분기별로 확장 압력과 누수 리스크가 동시에 나타납니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "기준 정렬", opportunity: "핵심 채널 고정", caution: "과속 집행", action: "승인 기준 고정" },
    { quarter: "2분기", quarterSummary: "선별 확장", opportunity: "재구매 강화", caution: "고정비 증가", action: "확장 범위 제한" },
    { quarter: "3분기", quarterSummary: "수익률 보정", opportunity: "이익률 개선", caution: "회수 지연", action: "회수 주기 점검" },
    { quarter: "4분기", quarterSummary: "정리/준비", opportunity: "핵심 지표 정리", caution: "운영 피로", action: "정리 계획 고정" },
  ],
  cashflowPulse:
    "상반기에는 수익 축을 고정하고 하반기에는 누수 구간을 줄이는 운영이 성과로 이어집니다. 확장보다 운영 기준을 먼저 고정할 때 변동성을 줄일 수 있습니다.",
  growthAxes: [
    "반복 구매가 가능한 핵심 축을 먼저 강화하고 확장 채널은 순차적으로 열어야 합니다.",
    "고정 수익 비중을 높이는 고객군을 우선 관리하면 예측 가능성이 커집니다.",
  ],
  leakRisks: [
    "검증 없는 판촉 집행은 현금흐름 누수로 이어질 수 있습니다.",
    "단기 매출을 이유로 할인 폭을 키우면 이익률 회복이 늦어질 수 있습니다.",
  ],
  operatingRules: [
    "지출 승인 기준을 금액 구간별로 분리해 즉시 결정 항목과 검토 항목을 구분하세요.",
    "월간 손익 점검은 매출보다 이익률과 회수 주기를 우선 지표로 관리하세요.",
  ],
  evidenceNotes: [
    "올해 재물·사업 흐름은 확장 기회와 누수 리스크가 동시에 나타나는 구조입니다.",
    "분기 신호를 보면 비용 구조 안정화가 수익 확대보다 먼저 체감될 수 있습니다.",
  ],
  oneLineDiagnosis: "확장 속도보다 운영 기준을 먼저 고정할수록 2026년 재물·사업 변동성을 줄일 수 있습니다.",
  keyPoints: [
    "핵심 수익 축을 1~2개로 제한해 반복 가능성을 먼저 확보하세요.",
    "지출 승인 기준을 고정해 누수 항목을 빠르게 차단하세요.",
    "분기별 점검 지표를 유지해 확장 타이밍을 선별하세요.",
  ],
  easyInterpretationPoints: [
    "쉽게 말해, 많이 파는 것보다 남는 구조를 먼저 만드는 해입니다.",
    "확장을 하더라도 기준표를 먼저 만들면 시행착오 비용이 줄어듭니다.",
  ],
  annualFlowSummary:
    "상반기에는 기준 정렬, 하반기에는 누수 통제가 핵심입니다. 분기마다 같은 점검 틀을 유지하면 수익 구조가 안정됩니다.",
  quarterlyFlowCards: [
    { quarter: "1분기", flowSummary: "기준 정렬과 누수 차단이 우선인 구간입니다.", keyPoint: "핵심 채널 기준 고정", risk: "판촉 과집행", actionStrategy: "승인 기준 문장화" },
    { quarter: "2분기", flowSummary: "선택적 확장으로 효율을 지켜야 하는 구간입니다.", keyPoint: "확장 축 제한", risk: "고정비 급증", actionStrategy: "확장 체크리스트 운영" },
    { quarter: "3분기", flowSummary: "수익률 안정화가 성과를 좌우하는 구간입니다.", keyPoint: "회수 주기 관리", risk: "회수 지연", actionStrategy: "주간 회수 점검" },
    { quarter: "4분기", flowSummary: "정리와 다음 해 준비를 연결하는 구간입니다.", keyPoint: "성과/재투자 분리", risk: "운영 피로", actionStrategy: "정리 계획 고정" },
  ],
  revenueFlowDeepDive: [
    "수익 변동이 커질수록 채널 수를 늘리기보다 핵심 채널 단위당 이익을 먼저 점검해야 합니다.",
    "매출과 이익률이 동시에 오르는 구간을 분리해 다음 분기 확장 기준으로 사용하세요.",
  ],
  businessManagementPoints: [
    "의사결정 항목을 즉시 결정/검토 필요 항목으로 분리해 회의 시간을 줄이세요.",
    "운영 지표는 매출·이익률·회수주기 3개로 고정해 판단 속도를 유지하세요.",
  ],
  burnoutPreventionStrategies: [
    "주간 운영회의 안건 수를 제한해 의사결정 피로를 줄이세요.",
    "확장 업무와 유지 업무 담당자를 분리해 과부하를 분산하세요.",
  ],
  actionChecklist: [
    "이번 주 지출 승인 기준표를 팀과 공유한다.",
    "핵심 수익 채널 1개를 선정해 이익률을 측정한다.",
    "분기 점검 회의를 캘린더에 고정한다.",
  ],
  closingLine: "기준을 먼저 고정하고 확장을 선별하면 2026년 재물·사업 성과를 안정적으로 누적할 수 있습니다.",
  actionPlan90: {
    day30: ["30일: 승인 기준표 확정"],
    day60: ["60일: 누수 항목 제거"],
    day90: ["90일: 분기 지표 재정렬"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

const investmentPayload: NewYear2026InvestmentPayload = {
  coreQuestion: "2026년 투자/자산운에서 진입과 관망을 어떤 기준으로 나눠야 하는가?",
  coreInsights: ["진입 속도보다 손실 통제 규칙 고정이 우선입니다."],
  actionNow: ["진입 전 손절·회수 기준부터 문장으로 고정하세요."],
  evidence: ["분기별 신호가 빠르게 바뀌는 흐름입니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "초반에는 기준 없는 추격 진입을 줄여야 하는 구간입니다.",
      evidence: "변동성이 먼저 커지고 방향 확인이 늦어질 수 있습니다.",
      opportunities: ["기준 기반 분할 진입"],
      risks: ["충동 진입"],
      actionStrategy: ["진입 체크리스트 선고정"],
    },
    {
      windowLabel: "2분기",
      timeRange: "2분기",
      coreFlow: "선별 진입과 비중 통제가 동시에 필요한 구간입니다.",
      evidence: "기회 신호와 과열 신호가 교차할 수 있습니다.",
      opportunities: ["선별 진입"],
      risks: ["비중 과다"],
      actionStrategy: ["자산별 상한 유지"],
    },
    {
      windowLabel: "3분기",
      timeRange: "3분기",
      coreFlow: "관망과 회수 규칙 점검 비중이 커지는 구간입니다.",
      evidence: "중반 이후엔 손익 편차가 확대될 수 있습니다.",
      opportunities: ["현금 유연성 확보"],
      risks: ["손실 만회 과매매"],
      actionStrategy: ["거래 회전율 감속"],
    },
    {
      windowLabel: "4분기",
      timeRange: "4분기",
      coreFlow: "연말에는 규칙 재정렬과 다음 해 준비가 필요한 구간입니다.",
      evidence: "누적 성과보다 기준 위반 빈도 점검이 중요합니다.",
      opportunities: ["운용 기준 재정렬"],
      risks: ["연말 과매매"],
      actionStrategy: ["로그 기반 규칙 점검"],
    },
  ],
  quickSummary: {
    verdict: "진입보다 기준, 확장보다 통제",
    keywords: ["관망", "진입", "리스크"],
    signalTrio: {
      interpretationIntensityLevel: "높음",
      attentionLevel: "보통",
      changeSignalLevel: "높음",
      reason: "분기별 신호가 빠르게 바뀌어 기준 유지력이 성과 안정성을 좌우합니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "기준 고정", opportunity: "체크리스트 정착", caution: "충동 진입", action: "손절·회수 기준 고정" },
    { quarter: "2분기", quarterSummary: "선별 진입", opportunity: "기회 포착", caution: "비중 과다", action: "자산별 상한 준수" },
    { quarter: "3분기", quarterSummary: "방어 강화", opportunity: "현금 유연성", caution: "손실 만회 과매매", action: "거래 감속" },
    { quarter: "4분기", quarterSummary: "정리/준비", opportunity: "규칙 재정렬", caution: "연말 과매매", action: "운용 로그 점검" },
  ],
  entryBias:
    "올해는 빨리 들어가기보다 손실 통제 기준을 먼저 고정하는 쪽이 유리합니다. 진입 신호가 보여도 비중 상한과 회수 기준을 동시에 지킬 때만 실행해야 합니다.",
  watchSignals: [
    "방향성이 불명확하고 변동성만 커질 때는 관망 신호로 분류하세요.",
    "손실 기준이 비어 있는데 진입 충동이 커지면 관망을 우선하세요.",
  ],
  riskAlerts: [
    "손절 기준 없이 평단만 낮추는 행동은 손실 구조를 악화시킬 수 있습니다.",
    "손실 직후 레버리지 비중을 늘리면 회복 탄력이 크게 떨어질 수 있습니다.",
  ],
  capitalRules: [
    "단일 자산 비중 상한을 먼저 고정하고 예외 없이 적용하세요.",
    "진입 전 목표가·손절가·보유 기간을 함께 기록하세요.",
  ],
  evidenceNotes: [
    "투자/자산운은 신호 강도보다 기준 준수율이 결과 안정성에 더 크게 작용합니다.",
    "분기별 리스크 대응 속도가 누적 성과 편차를 줄이는 핵심 변수입니다.",
  ],
  investmentActionReport: {
    coreDiagnosis: {
      headline: "기준 유지력이 올해 투자 성과의 핵심 변수입니다.",
      summary: "진입·관망·회수 기준을 먼저 고정하면 변동 구간에서도 오판 비용을 줄일 수 있습니다.",
    },
    keyQuestion: "지금은 진입을 늘릴 때인가, 관망하며 기준을 재정렬할 때인가?",
    keyInsights: [
      "진입 신호가 있어도 손실 기준이 비어 있으면 성과 편차가 커질 수 있습니다.",
      "분기별 성과 차이는 종목 선정보다 비중·회수 규칙 일관성에서 크게 나타납니다.",
      "하반기로 갈수록 공격적 확대보다 현금/비중 관리가 누적 성과를 지키는 축이 됩니다.",
    ],
    immediateActions: [
      "매수 전 체크리스트를 먼저 채우고 항목 누락 시 진입을 보류하세요.",
      "자산별 비중 상한과 손절/회수 조건을 같은 문서에서 관리하세요.",
    ],
    absoluteCautions: [
      "손실 만회를 이유로 계획 밖 레버리지 확대를 절대 반복하지 마세요.",
      "근거 없는 추격 진입으로 규칙을 무너뜨리는 행동을 피하세요.",
    ],
    quarterlyFlow: [
      {
        quarter: "1분기",
        summary: "기준 고정과 충동 진입 차단이 우선인 구간입니다.",
        actionFocus: ["손절·회수 기준부터 문장화하세요.", "진입 전 체크리스트를 강제하세요."],
        riskFocus: ["신호 확인 전 추격 진입을 피하세요.", "단일 자산 비중 과다를 경계하세요."],
      },
      {
        quarter: "2분기",
        summary: "선별 진입과 비중 통제가 동시에 필요한 구간입니다.",
        actionFocus: ["자산별 상한을 지키며 분할 진입하세요.", "진입 근거를 로그로 남기세요."],
        riskFocus: ["수익 구간 과신으로 비중을 늘리지 마세요.", "손절 기준 변경을 반복하지 마세요."],
      },
      {
        quarter: "3분기",
        summary: "관망/회수 기준 점검 비중이 커지는 구간입니다.",
        actionFocus: ["거래 회전율을 낮추고 기준 위반을 점검하세요.", "현금 비중을 전략적으로 확보하세요."],
        riskFocus: ["손실 만회 과매매를 피하세요.", "감정 반응 매매를 차단하세요."],
      },
      {
        quarter: "4분기",
        summary: "연말 정리와 다음 해 준비를 연결하는 구간입니다.",
        actionFocus: ["운용 로그를 기반으로 규칙을 재정렬하세요.", "다음 해 진입 기준을 미리 정리하세요."],
        riskFocus: ["연말 성과 집착으로 과매매하지 마세요.", "규칙 위반을 정상화하지 마세요."],
      },
    ],
    assetClassGuides: {
      stocksEtf: [
        "주식/ETF는 단일 종목 집중보다 분할 진입과 회수 기준 고정이 유리합니다.",
        "거래량 급증 구간에서는 진입 속도보다 손실 기준 충족 여부를 먼저 확인하세요.",
      ],
      realEstate: [
        "부동산은 매수 타이밍보다 보유 기간·현금 여력·상환 계획 점검이 우선입니다.",
        "성급한 갈아타기보다 유지/매도 조건을 사전에 문장으로 고정하세요.",
      ],
      cashSavings: [
        "현금/예금은 관망 구간의 기회 대기 자금 역할이므로 최소 비중을 먼저 고정하세요.",
        "신호가 약한 분기에는 수익 기대보다 유동성 확보를 우선하세요.",
      ],
      cryptoHighVolatility: [
        "코인/고변동 자산은 실험 비중 한도와 손절 기준을 먼저 정해 운영하세요.",
        "단기 급등 추격보다 변동성 진정 확인 후 분할 접근하세요.",
      ],
    },
    signalBoard: {
      watchSignals: [
        "방향성이 없고 변동성만 커질 때는 관망 신호로 분류하세요.",
        "기준 위반 진입 충동이 커지면 관망 모드로 전환하세요.",
      ],
      entrySignals: [
        "비중·손절·회수 기준이 동시에 충족될 때만 제한적으로 진입하세요.",
        "계획된 상한을 지킬 수 있을 때만 진입 신호로 해석하세요.",
      ],
    },
    riskAlerts: [
      "레버리지 비중이 계획을 넘는 순간 복원력이 크게 떨어질 수 있습니다.",
      "손실 직후 규칙 변경은 다음 분기 변동 리스크를 키울 수 있습니다.",
    ],
    practicalChecklist: [
      "진입 이유를 한 줄로 기록했는지 확인한다.",
      "손절 기준과 회수 기준을 함께 기록했는지 확인한다.",
      "단일 자산 비중 상한을 초과하지 않는지 확인한다.",
      "관망 기준을 위반한 진입이 아닌지 확인한다.",
    ],
    plainEvidence: [
      "쉽게 말해, 올해는 빨리 맞히는 전략보다 크게 잃지 않는 운영이 중요합니다.",
      "진입 자체보다 기준을 끝까지 지키는 사람이 결과 변동폭을 줄일 가능성이 큽니다.",
    ],
    flowTo2027:
      "2026년에 고정한 비중·회수·손실 기준이 2027년의 확장 여력과 리스크 대응 속도를 좌우할 가능성이 큽니다.",
    finalConclusion: [
      "올해 투자/자산운의 핵심은 종목 선택보다 규칙 유지력입니다.",
      "진입 속도보다 손실 통제 체계를 먼저 고정하면 결과 안정성을 높일 수 있습니다.",
    ],
  },
  actionPlan90: {
    day30: ["30일: 진입 체크리스트 고정"],
    day60: ["60일: 규칙 위반 로그 점검"],
    day90: ["90일: 비중 상한 재정렬"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

const healthPayload: NewYear2026HealthPayload = {
  coreQuestion: "2026년 건강 흐름에서 무엇을 줄이고 무엇을 먼저 회복해야 하는가?",
  coreInsights: ["수면 리듬을 먼저 고정하면 피로 누적을 줄이는 데 도움이 됩니다."],
  actionNow: ["이번 주 회복 블록 2개를 캘린더에 먼저 고정하세요."],
  evidence: ["과부하 신호와 회복 신호가 같은 분기에 교차할 수 있습니다."],
  analysisBlocks: [
    {
      windowLabel: "1분기",
      timeRange: "1분기",
      coreFlow: "초반에는 집중력이 올라가지만 회복 간격이 무너지기 쉬운 구간입니다.",
      evidence: "수면 지연과 피로 누적 신호가 함께 나타날 수 있습니다.",
      opportunities: ["루틴 정착"],
      risks: ["수면 지연"],
      actionStrategy: ["취침 루틴 고정"],
    },
    {
      windowLabel: "2분기",
      timeRange: "2분기",
      coreFlow: "활동량이 늘어나는 만큼 소화·수분 관리가 중요한 구간입니다.",
      evidence: "식사 리듬이 흔들리면 오후 피로가 커질 수 있습니다.",
      opportunities: ["회복 탄력 상승"],
      risks: ["식사 불규칙"],
      actionStrategy: ["식사 간격 고정"],
    },
    {
      windowLabel: "3분기",
      timeRange: "3분기",
      coreFlow: "과열 신호를 빨리 감지해야 리듬을 유지할 수 있는 구간입니다.",
      evidence: "예민함·안구 피로가 겹치기 쉬운 시기입니다.",
      opportunities: ["페이스 조절"],
      risks: ["예민함 누적"],
      actionStrategy: ["카페인 감속"],
    },
    {
      windowLabel: "4분기",
      timeRange: "4분기",
      coreFlow: "정리 구간에서는 무리한 만회보다 회복 기반 점검이 중요한 구간입니다.",
      evidence: "휴식 후에도 피로가 남는 신호를 점검할 필요가 있습니다.",
      opportunities: ["회복 기반 정리"],
      risks: ["과부하 만회"],
      actionStrategy: ["주간 점검 고정"],
    },
  ],
  quickSummary: {
    verdict: "과열 신호를 빨리 감지하고 회복 루틴을 먼저 고정하는 해",
    keywords: ["수면 안정", "과부하 감속", "회복 루틴"],
    signalTrio: {
      interpretationIntensityLevel: "중",
      attentionLevel: "보통",
      changeSignalLevel: "중",
      reason: "활동량이 늘어나는 구간과 회복이 필요한 구간이 교차합니다.",
    },
  },
  yearTimeline: [
    { quarter: "1분기", quarterSummary: "리듬 정착", opportunity: "루틴 고정", caution: "수면 지연", action: "취침 루틴 고정" },
    { quarter: "2분기", quarterSummary: "활동 증가", opportunity: "체력 상승", caution: "소화 부담", action: "식사 간격 점검" },
    { quarter: "3분기", quarterSummary: "과열 경계", opportunity: "페이스 조절", caution: "예민함 증가", action: "자극량 감속" },
    { quarter: "4분기", quarterSummary: "회복 정리", opportunity: "리듬 안정", caution: "피로 잔여", action: "주간 점검 고정" },
  ],
  energyRhythm:
    "올해는 활동량이 늘어나는 시기와 회복이 필요한 시기가 번갈아 나타날 수 있습니다. 속도를 유지하는 것보다 회복 간격을 일정하게 유지하는 편이 컨디션 안정에 유리합니다.",
  bodyPatterns: [
    "잠드는 시간이 늦어지거나 중간 각성이 늘어날 수 있어 수면 리듬 관리가 중요합니다.",
    "식사 간격이 흔들리면 오후 피로와 속 더부룩함이 함께 나타날 수 있습니다.",
    "과한 일정이 이어지면 예민함과 안구 피로가 동시에 커질 가능성이 있습니다.",
  ],
  quarterlyFlowCards: [
    { quarter: "1분기", flowSummary: "수면·회복 루틴을 먼저 정착해야 하는 구간입니다.", cautionPoint: "잠드는 시간 지연", recommendedAction: "취침 루틴 고정" },
    { quarter: "2분기", flowSummary: "활동량 증가에 맞춰 소화 부담을 줄여야 하는 구간입니다.", cautionPoint: "식사 불규칙", recommendedAction: "식사 간격 점검" },
    { quarter: "3분기", flowSummary: "과열 신호를 조기에 감지해야 안정성이 유지되는 구간입니다.", cautionPoint: "예민함·안구 피로", recommendedAction: "카페인·야간 자극 감속" },
    { quarter: "4분기", flowSummary: "정리기에는 회복 기반 점검이 다음 해 컨디션을 좌우하는 구간입니다.", cautionPoint: "쉬어도 남는 피로", recommendedAction: "주간 점검표 고정" },
  ],
  recoveryPriorities: [
    "수면 안정: 취침·기상 시간을 일정하게 유지하세요.",
    "소화기 관리: 식사 간격을 고정해 위장 부담을 줄이세요.",
    "과열 진정: 긴장도가 높은 날에는 자극량을 먼저 줄이세요.",
    "체력 분배: 하루 집중 블록 수를 제한해 과부하를 줄이세요.",
  ],
  overloadSignals: [
    "잠들기 어려움과 자주 깨는 수면이 같이 나타나면 일정 강도 조절이 필요할 수 있습니다.",
    "두근거림·예민함·안구 피로가 한 주에 겹치면 회복 구간을 늘리세요.",
    "쉬어도 피로가 풀리지 않으면 무리한 만회보다 감속을 우선하세요.",
  ],
  overloadChecklist: [
    "잠들기 어려운 날이 반복되면 일정 강도 조절이 필요할 수 있습니다.",
    "자주 깨는 수면이 이어지면 다음 날 일정 밀도를 줄이세요.",
    "두근거림이나 예민함이 반복되면 자극 노출을 낮추세요.",
    "입병 또는 피부 트러블이 반복되면 과열 신호로 점검하세요.",
    "안구 피로가 하루 종일 이어지면 화면 집중 시간을 끊어 주세요.",
    "속 더부룩함이 자주 생기면 식사 간격과 속도를 점검하세요.",
    "쉬어도 피로가 안 풀리면 회복 우선 일정으로 재배치하세요.",
  ],
  routineChecklist: [
    "아침·낮·저녁 중 최소 한 구간은 고정 루틴으로 유지하세요.",
    "회복 블록을 일정표 선행 항목으로 먼저 배치하세요.",
    "주간 점검에서 수면·피로·소화 신호를 같은 체크표로 기록하세요.",
  ],
  routineGuide: {
    morning: ["기상 후 물과 스트레칭으로 몸의 긴장을 낮추세요.", "아침 식사를 단순하고 규칙적으로 유지하세요."],
    daytime: ["점심 이후 5~10분 눈 휴식과 걷기를 고정하세요.", "카페인 추가 전 수분 보충과 호흡 정리를 먼저 하세요."],
    evening: ["취침 90분 전 조명을 낮추고 자극 정보를 줄이세요.", "저녁 식사는 과식보다 소화 부담이 적은 구성으로 조정하세요."],
    weekly: ["주 1회 회복 전용 시간을 먼저 고정하세요.", "주말에 과부하 신호 체크리스트를 점검하세요."],
  },
  evidenceNotes: [
    "건강운은 강도 자체보다 회복 간격 관리에서 체감 차이가 크게 나타날 수 있습니다.",
    "분기별 과부하 대응 속도가 다음 구간 컨디션 안정 폭에 영향을 줄 수 있습니다.",
  ],
  actionPlan90: {
    day30: ["30일: 수면 루틴 고정"],
    day60: ["60일: 과부하 신호 점검"],
    day90: ["90일: 회복 우선순위 재정렬"],
  },
  consistencyMeta: {
    targetYear: 2026,
    ganji: "병오",
    age: 31,
    generatedAt: "2026-03-24T09:00:00.000Z",
  },
};

describe("SajuCollectionTabs single service view", () => {
  it("does not render tab list when only one service id is provided", () => {
    render(
      <SajuCollectionTabs
        result={sampleResult}
        serviceIds={["saju-lifetime-roadmap"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.getByText("단일 서비스 기본 요약")).toBeInTheDocument();
  });

  it("keeps overview focus cards for 2026 overview service", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      reportPayloads: { "saju-2026-overview": overviewPayload },
      summaries: { "saju-2026-overview": "2026 종합" },
      sectionsMap: { "saju-2026-overview": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-2026-overview"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.getByText("7개 핵심 영역 카드")).toBeInTheDocument();
    expect(screen.getByText("시험·학업")).toBeInTheDocument();
  });

  it("renders action-oriented study report sections and hides legacy focused cards", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      reportPayloads: { "saju-2026-study-exam": studyPayload },
      summaries: { "saju-2026-study-exam": "2026 시험·학업운" },
      sectionsMap: { "saju-2026-study-exam": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-2026-study-exam"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.queryByText("7개 핵심 영역 카드")).not.toBeInTheDocument();
    expect(screen.getByText("한눈에 보는 핵심 진단")).toBeInTheDocument();
    expect(screen.getByText("핵심 질문")).toBeInTheDocument();
    expect(screen.getByText("올해의 핵심 인사이트 3가지")).toBeInTheDocument();
    expect(screen.getByText("지금 바로 해야 할 것")).toBeInTheDocument();
    expect(screen.getByText("2026년 전체 흐름 요약")).toBeInTheDocument();
    expect(screen.getByText("시기별 상세 해석")).toBeInTheDocument();
    expect(screen.getByText("시험 유형별 맞춤 해석")).toBeInTheDocument();
    expect(screen.getByText("2026년에 특히 조심해야 할 실패 패턴")).toBeInTheDocument();
    expect(screen.getByText("합격운을 실제 성과로 바꾸는 행동 전략")).toBeInTheDocument();
    expect(screen.getByText("해석 근거를 쉽게 풀어보면")).toBeInTheDocument();
    expect(screen.getByText("2026 합격 가이드 요약")).toBeInTheDocument();

    expect(screen.queryByText("시험·학업운 심화 해석")).not.toBeInTheDocument();
    expect(screen.queryByText("집중 흐름")).not.toBeInTheDocument();
    expect(screen.queryByText("승부 시점")).not.toBeInTheDocument();
    expect(screen.queryByText("실수 패턴")).not.toBeInTheDocument();
    expect(screen.queryByText("합격 행동")).not.toBeInTheDocument();
    expect(screen.queryByText("핵심 인사이트")).not.toBeInTheDocument();
    expect(screen.queryByText("지금 액션")).not.toBeInTheDocument();
    expect(screen.queryByText("연애·결혼")).not.toBeInTheDocument();
  });

  it("renders love focused decision tools and faq cards", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      reportPayloads: { "saju-love-focus": lovePayload },
      summaries: { "saju-love-focus": "2026 연애·결혼운" },
      sectionsMap: { "saju-love-focus": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-love-focus"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.queryByText("7개 핵심 영역 카드")).not.toBeInTheDocument();
    expect(screen.getByText("연애·결혼운 심화 해석")).toBeInTheDocument();
    expect(screen.getByText("결혼 전환 판단 보드")).toBeInTheDocument();
    expect(screen.getByText("만남 채널 우선순위")).toBeInTheDocument();
    expect(screen.getByText("그린 플래그 체크리스트")).toBeInTheDocument();
    expect(screen.getByText("레드 플래그 체크리스트")).toBeInTheDocument();
    expect(screen.getByText("갈등 응급 프로토콜")).toBeInTheDocument();
    expect(screen.getByText("소비자 FAQ")).toBeInTheDocument();
    expect(screen.getByText("지금 고백하거나 관계를 정의해도 되나요?")).toBeInTheDocument();
    expect(screen.getByText("약속 이행률이 2주 이상 안정되면 진행하고, 확인 기준은 후속 약속 성사율로 두세요.")).toBeInTheDocument();
  });

  it("renders investment actionable report sections and hides legacy focused cards", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      reportPayloads: { "saju-2026-investment-assets": investmentPayload },
      summaries: { "saju-2026-investment-assets": "2026 투자/자산운" },
      sectionsMap: { "saju-2026-investment-assets": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-2026-investment-assets"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.getByText("투자/자산운 전략 리포트 (2026)")).toBeInTheDocument();
    expect(screen.getByText("1. 한 줄 핵심 진단")).toBeInTheDocument();
    expect(screen.getByText("2. 핵심 질문")).toBeInTheDocument();
    expect(screen.getByText("3. 핵심 인사이트 3개")).toBeInTheDocument();
    expect(screen.getByText("4. 지금 액션")).toBeInTheDocument();
    expect(screen.getByText("5. 올해 절대 조심할 행동")).toBeInTheDocument();
    expect(screen.getByText("6. 분기별 흐름 (1분기/2분기/3분기/4분기)")).toBeInTheDocument();
    expect(screen.getByText("7. 자산군별 해석")).toBeInTheDocument();
    expect(screen.getByText("8. 관망 신호 / 진입 신호")).toBeInTheDocument();
    expect(screen.getByText("9. 리스크 경보")).toBeInTheDocument();
    expect(screen.getByText("10. 실전 체크리스트")).toBeInTheDocument();
    expect(screen.getByText("11. 해석 근거를 쉽게 풀어쓴 설명")).toBeInTheDocument();
    expect(screen.getByText("12. 2027로 이어지는 흐름")).toBeInTheDocument();
    expect(screen.getByText("13. 최종 결론")).toBeInTheDocument();

    expect(screen.getByText("주식/ETF")).toBeInTheDocument();
    expect(screen.getByText("부동산")).toBeInTheDocument();
    expect(screen.getByText("현금/예금")).toBeInTheDocument();
    expect(screen.getByText("코인/고변동 자산")).toBeInTheDocument();
    expect(screen.getByText("관망 신호")).toBeInTheDocument();
    expect(screen.getByText("진입 신호")).toBeInTheDocument();

    expect(screen.getByText("1분기")).toBeInTheDocument();
    expect(screen.getByText("2분기")).toBeInTheDocument();
    expect(screen.getByText("3분기")).toBeInTheDocument();
    expect(screen.getByText("4분기")).toBeInTheDocument();

    expect(screen.queryByText("주식·부동산 투자 심화 해석")).not.toBeInTheDocument();
    expect(screen.queryByText("진입 판단")).not.toBeInTheDocument();
    expect(screen.queryByText("자금 운용 원칙")).not.toBeInTheDocument();
    expect(screen.queryByText("핵심 인사이트")).not.toBeInTheDocument();
    expect(screen.queryByText("지금 액션")).not.toBeInTheDocument();
  });

  it("renders health actionable report sections and hides legacy focused cards", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      profileData: {
        ...sampleResult.profileData,
        birthPrecision: "unknown",
      },
      reportPayloads: { "saju-2026-health-balance": healthPayload },
      summaries: { "saju-2026-health-balance": "2026 건강운" },
      sectionsMap: { "saju-2026-health-balance": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-2026-health-balance"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.getByText("건강운 생활관리 리포트 (2026)")).toBeInTheDocument();
    expect(screen.getByText("상단 요약")).toBeInTheDocument();
    expect(screen.getByText("올해 몸에 나타나기 쉬운 패턴")).toBeInTheDocument();
    expect(screen.getByText("분기별 건강 흐름")).toBeInTheDocument();
    expect(screen.getByText("과부하 신호 체크리스트")).toBeInTheDocument();
    expect(screen.getByText("회복 우선순위")).toBeInTheDocument();
    expect(screen.getByText("추천 생활 루틴")).toBeInTheDocument();
    expect(screen.getByText("안내")).toBeInTheDocument();
    expect(screen.getByText("해석 신뢰도 · 참고용")).toBeInTheDocument();
    expect(screen.getByText("출생 시간을 추가하면 건강 흐름 해석의 세부 정확도를 더 높일 수 있습니다.")).toBeInTheDocument();

    expect(screen.getByText("1분기")).toBeInTheDocument();
    expect(screen.getByText("2분기")).toBeInTheDocument();
    expect(screen.getByText("3분기")).toBeInTheDocument();
    expect(screen.getByText("4분기")).toBeInTheDocument();

    expect(screen.queryByText("건강운 심화 해석")).not.toBeInTheDocument();
    expect(screen.queryByText("컨디션 리듬")).not.toBeInTheDocument();
  });

  it("keeps legacy focused cards and appends wealth actionable sections", () => {
    const result: SajuResult = {
      ...buildNewYearBaseResult(),
      reportPayloads: { "saju-2026-wealth-business": wealthPayload },
      summaries: { "saju-2026-wealth-business": "2026 재물·사업운" },
      sectionsMap: { "saju-2026-wealth-business": [] },
    };

    render(
      <SajuCollectionTabs
        result={result}
        serviceIds={["saju-2026-wealth-business"]}
        onUnlockRequest={() => {}}
      />,
    );

    expect(screen.getByText("재물·사업운 심화 해석")).toBeInTheDocument();
    expect(screen.getByText("수익 흐름")).toBeInTheDocument();

    expect(screen.getByText("재물/사업 실행 리포트 (2026)")).toBeInTheDocument();
    expect(screen.getByText("한 줄 핵심 진단")).toBeInTheDocument();
    expect(screen.getByText("올해의 핵심 포인트 3가지")).toBeInTheDocument();
    expect(screen.getByText("쉬운 해석 포인트")).toBeInTheDocument();
    expect(screen.getByText("2026년 전체 흐름 요약")).toBeInTheDocument();
    expect(screen.getByText("분기별 흐름")).toBeInTheDocument();
    expect(screen.getByText("수익 흐름 심화 해석")).toBeInTheDocument();
    expect(screen.getByText("사업 관리 포인트")).toBeInTheDocument();
    expect(screen.getByText("번아웃 방지 전략")).toBeInTheDocument();
    expect(screen.getByText("체크리스트")).toBeInTheDocument();
    expect(screen.getByText("한 줄 결론")).toBeInTheDocument();

    expect(screen.getByText("1분기")).toBeInTheDocument();
    expect(screen.getByText("2분기")).toBeInTheDocument();
    expect(screen.getByText("3분기")).toBeInTheDocument();
    expect(screen.getByText("4분기")).toBeInTheDocument();
  });
});
