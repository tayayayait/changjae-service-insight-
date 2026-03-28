# 사주 7종 리포트 계약서 (v2.1)

## 공통 계약
- 대상 서비스: `saju-lifetime-roadmap`, `saju-daeun-shift`, `saju-career-timing`, `saju-wealth-flow`, `saju-helper-network`, `saju-energy-balance`, `saju-yearly-action-calendar`
- 응답 공통 필드:
  - `summary: string`
  - `sections: { title, interpretation, advice, luckyTip? }[]`
  - `reportTemplateVersion: "saju-report-v2.9"`
  - `reportPayload.coreQuestion: string`
  - `reportPayload.coreInsights: string[]`
  - `reportPayload.actionNow: string[]`
  - `reportPayload.evidence: string[]`
  - `reportPayload.analysisBlocks: Array<{ windowLabel, timeRange, coreFlow, evidence, opportunities[], risks[], actionStrategy[] }>`
- `analysisBlocks`는 공통 5요소를 반드시 포함한다:
  - 핵심 흐름(`coreFlow`)
  - 해석 근거(`evidence`)
  - 주요 기회(`opportunities[]`)
  - 리스크(`risks[]`)
  - 행동 전략(`actionStrategy[]`)
- 저장 공통 필드:
  - `saju_results.report_payload (JSONB)`
  - `saju_results.report_template_version (TEXT)`

## 동적 시간축 정책
- 공통 앵커: `currentDate`, `currentYear`, `currentAge(만 나이)`를 기준으로 해석한다.
- 나이 상한: `89세`.
- `saju-lifetime-roadmap`의 `daeunPeriods`는 직전/현재/다음/다다음 4개 10년 구간을 기본값으로 사용한다.
- 리포트별 시간 해상도:
  - 로드맵: 직전/현재/다음/다다음 10년
  - 대운 전환(v2.5): 전환 전 준비기/전환기/전환 후 재배치기/전환 후 정착기
  - 커리어: 0~2년/3~5년/6~10년/10년+
  - 재물(v2.7): 축적기/확장기/방어기/변동기
  - 관계: 0~2년/3~5년/6~10년
  - 에너지: 생애 전반 + 0~2년/3~5년/6~10년 + 4주/12주 + 현재 연도 적용 포인트
  - 연간 캘린더(v2.9): 생애 단계(0~2년/3~5년/6~10년/전환) + 분기 4블록 + 월별 12행동

## 서비스별 확장 payload
| 서비스 ID | 필수 확장 필드 |
|---|---|
| `saju-lifetime-roadmap` | `longTermFlow`, `pivotMoments[]`, `tenYearStrategy[]`, `stageTransitions[]`, `narrativeDirection`, `maturityExpansionCleanup[]` |
| `saju-daeun-shift` | `transitionSignal`, `ninetyDayActions[]`, `avoidanceScenario[]`, `transitionSignals[]`, `changePoints[]`, `readinessActions[]`, `phaseRoadmap[]`, `longHorizonDirection[]`, `preAtPostDiff[]` |
| `saju-career-timing` | `careerWindow`, `decisionTree[]`, `executionChecklist[]`, `workModeFit`, `decideNow[]`, `deferNow[]`, `gainVsLossPatterns[]`, `decisionCriteria[]` |
| `saju-wealth-flow` | `cashflowMap`, `riskZones[]`, `assetRules[]`, `wealthLifecycleStages[]`, `incomeStructure[]`, `spendingPatterns[]`, `accumulateVsExpand[]`, `financialNoGo[]` |
| `saju-helper-network` | `helperMap`, `conflictPatterns[]`, `networkGuide[]`, `helperProfiles[]`, `relationExpansionVsEntanglement[]`, `conflictLoops[]`, `helperEntryWindows[]`, `relationLayers[]`, `phaseRoadmap[]`, `longHorizonDirection[]` |
| `saju-energy-balance` | `energyCurve`, `innateProfile`, `operatingModel[]`, `stageShiftMap[]`, `longRangeStrategy[]`, `routineDesign[]`, `recoveryProtocol[]`, `immersionMode[]`, `burnoutSignals[]`, `overloadAlerts[]`, `habitTweaks[]`, `recoveryRoutines[]` |
| `saju-yearly-action-calendar` | `lifecycleExecutionPattern[]`, `phaseFocusMap[]`, `accumulationTransitionFlow[]`, `longPracticeStrategy[]`, `yearToLifeBridge`, `quarterlyGoals[]`, `monthlyActions[]`, `riskCalendar[]`, `quarterThemes[]`, `monthlyPushCaution[]`, `actionCheckpoints[]`, `priorityQueue[]` |

## v2.2 Supplement 확장 계약 (lifetime 7종 전용)
- 적용 대상: `saju-lifetime-roadmap`, `saju-daeun-shift`, `saju-career-timing`, `saju-wealth-flow`, `saju-helper-network`, `saju-energy-balance`, `saju-yearly-action-calendar`
- 기존 필드는 유지하고 `reportPayload.supplement`를 optional로 확장한다.
- 스키마:
  - `deepInsightSummary: string`
  - `deepDivePoints: string[]`
  - `executionProtocol: { today[]; thisWeek[]; thisMonth[]; avoid[] }`
  - `checkpointQuestions: string[]`
  - `visualExplainers: Array<{ type, title, items[] }>`
- `visualExplainers.type` 허용값:
  - `timeline`, `before-after`, `decision-matrix`, `flow-radar`, `network-map`, `energy-wave`, `calendar-map`
- 서비스별 고정 type:
  - `saju-lifetime-roadmap` -> `timeline`
  - `saju-daeun-shift` -> `before-after`
  - `saju-career-timing` -> `decision-matrix`
  - `saju-wealth-flow` -> `flow-radar`
  - `saju-helper-network` -> `network-map`
  - `saju-energy-balance` -> `energy-wave`
  - `saju-yearly-action-calendar` -> `calendar-map`
- 소유축/금지축:
  - 로드맵: 장기 인생 서사 전용. 직무/재무 세부 처방 금지.
  - 대운 전환: 전환 리스크 대응 전용. 장기 로드맵 반복 금지.
  - 커리어: 커리어 의사결정 전용. 재무/관계 운영론 금지.
  - 재물: 재무 운영 규칙 전용. 커리어/관계 해설 금지.
  - 관계: 사람/협업 전략 전용. 재무/에너지 처방 금지.
  - 에너지: 에너지 운영 전용. 연간 일정 편성 금지.
  - 연간 캘린더: 생애 실행 패턴 + 연간 일정 운영 연결 전용. 직무/재무 상세 처방 금지.
- 렌더 정책:
  - 기존 섹션 순서/타이틀은 유지한다.
  - `supplement`가 있을 때만 기존 하단에 보강 섹션을 append한다.
  - `supplement`가 없으면 파서가 서비스별 fallback 보강 데이터를 합성한다.

## v2.2.1 Lifetime 감점 제거/구간 카드 확장 (2026-03-25)
- 대상: lifetime 7종(`saju-lifetime-roadmap`, `saju-daeun-shift`, `saju-career-timing`, `saju-wealth-flow`, `saju-helper-network`, `saju-energy-balance`, `saju-yearly-action-calendar`)
- 생성 규칙:
  - 일반 총평형 문장 반복 금지.
  - 배열 원소는 키워드가 아닌 완결 문장으로 작성.
  - 행동 문장은 `시점 + 대상 + 행동 + 측정 기준`을 포함.
  - 서비스 간 핵심 문장 재사용 금지.
- 파서 보정 규칙:
  - `coreInsights/actionNow/evidence/analysisBlocks/supplement`를 서비스별 금지축 기준으로 정규화.
  - `analysisBlocks`는 서비스 시간축 길이를 유지하고 구간별 `opportunities/risks/actionStrategy`를 최소 2개 이상으로 강제.
  - 커리어 `decideNow/deferNow`는 중복 없이 분리.
  - 연간 캘린더는 `lifecycleExecutionPattern/phaseFocusMap/accumulationTransitionFlow/longPracticeStrategy/yearToLifeBridge`를 필수로 유지하고, `quarterlyGoals/riskCalendar/quarterThemes` 4개, `monthlyActions/monthlyPushCaution/actionCheckpoints` 12개를 강제한다.
  - 연간 캘린더는 분기-월 정합성(1분기=1~3월, 2분기=4~6월, 3분기=7~9월, 4분기=10~12월)을 파서에서 자동 보정한다.
- UI 렌더 정책:
  - `analysisBlocks` 카드에서 `핵심 흐름 + 해석 근거 + 주요 기회 + 리스크 + 행동 전략`을 모두 노출.
  - 기존 섹션 위치/순서는 유지하고, 접힘 UI는 도입하지 않는다.
  - `coreFlow/evidence/supplement`와 완전 중복되는 하위 리스트 문장은 렌더 직전 제거한다.

## v2.2.2 Action 문장 보정 정책 (2026-03-26)
- 목적: action 문구가 단일 fallback 문장으로 반복 치환되는 현상을 줄이고, AI 원문 맥락을 최대한 보존한다.
- 보정 규칙:
  - action 문장이 `시점 + 대상 + 행동` 조건을 만족하면 원문 유지.
  - 조건 미충족 시 원문을 우선 유지하고 누락 슬롯(시점/대상/행동)만 후행 보강.
  - 보강 후에도 조건 미충족일 때만 서비스 fallback 문장으로 최종 치환.
- 품질 기준:
  - 파서는 단일 고정 fallback 문장을 무조건 재사용하지 않는다.
  - 동일 의미라도 서비스/문맥 기반 원문 표현을 우선 반영한다.

## v2.2.3 에너지 가이드 확장 (2026-03-27)
- 목적:
  - `saju-energy-balance`를 `2026 단기 컨디션`이 아닌 `인생 전반 에너지 운영 가이드`로 전환한다.
- 필수 구조:
  - `타고난 성향(innateProfile)` -> `운용 방식(operatingModel[])` -> `시기별 변화(stageShiftMap[])` -> `중장기 전략(longRangeStrategy[])` -> `단기 운영(4주/12주)` -> `현재 연도 적용 포인트`
- analysisBlocks 정책:
  - 에너지 서비스는 최소 4블록 이상을 유지한다.
  - 장기/중기/단기/현재연도 블록이 모두 포함되어야 한다.
- UI 정책:
  - 에너지 서비스는 상단에서 `지금 액션` 카드보다 `타고난 성향/운용 방식/시기별 변화/중장기 전략`을 먼저 노출한다.
  - `2026 적용 포인트`는 하단 보조 섹션으로 분리한다.

## v2.9 인생총운형 연간 실행 캘린더 계약 (2026-03-28)
- 대상: `saju-yearly-action-calendar`
- 핵심 질문:
  - `올해 실행이 내 인생 단계 전환과 장기 축적에 어떻게 연결되는가?`
- 필수 장기 레이어:
  - `yearToLifeBridge`: `현재 위치 -> 장기 목적 -> 이번 시기 행동 -> 점검 기준`을 포함하는 연결 문장
  - `lifecycleExecutionPattern[]`: 0~2년/3~5년/6~10년 실행 패턴
  - `phaseFocusMap[]`: 단계별 `phaseLabel/focusPoint/executionPattern/checkpoint`
  - `accumulationTransitionFlow[]`: `쌓을 것/버릴 것/전환 트리거/복구 규칙`
  - `longPracticeStrategy[]`: 장기 반복 실천 전략
- 연간 레이어(기존 유지):
  - `quarterlyGoals/riskCalendar/quarterThemes`는 4개 고정
  - `monthlyActions/monthlyPushCaution/actionCheckpoints`는 12개 고정
- 정합성 규칙:
  - 분기 표기는 `1분기/2분기/3분기/4분기`만 허용(`Q1/Q2` 금지)
  - 분기-월 불일치는 파서에서 자동 교정
  - 분기 간 동일 문장 반복, 기계적 꼬리문장 덧붙임 금지
  - yearly 전용 `validator+fallback` 단일 패스를 필수 적용하고, 분기 텍스트(`quarterlyGoals/riskCalendar/quarterThemes`)와 `analysisBlocks.coreFlow/evidence` 완전 중복을 금지한다.
  - 내부 토큰(`calendar-map`, `Q1~Q4`, `Structuring`, `Acceleration`)은 사용자 노출 문장에서 제거/치환한다.
- 저장 정책:
  - `saju_results.report_payload (JSONB)` 확장만 사용
  - DB 마이그레이션은 필수 아님
  - 템플릿/캐시 무효화는 `reportTemplateVersion(v2.9)` + `cacheVersion` + `yearlyQualityGateVersion`을 함께 올려 관리한다.

## 중복 방지 정책
- v2.9 연간 실행 캘린더 총운형 계약 (2026-03-28)
  - `reportTemplateVersion` 기본값: `saju-report-v2.9`
  - 신규 필수 narrative 필드:
    - `oneLineTotalReview`
    - `currentLifeFlow`
    - `meaningOfThisYear`
    - `tenYearFlow[]` (`0~2년/3~5년/6~10년`)
    - `longPatternInterpretation[]`
    - `keyThemes[]` (정확히 3개)
    - `quarterNarratives[]` (정확히 4개, `1분기~4분기`)
    - `yearEndResidue`
    - `closingLine`
  - 기존 yearly 필드(`yearToLifeBridge`, `lifecycleExecutionPattern`, `phaseFocusMap`, `quarterlyGoals`, `monthlyActions` 등)는 유지한다.
  - narrative layer 금지 규칙:
    - `오늘/이번 주/이번 달/3월 말까지/매일 30분` 같은 단기 표현 금지
    - 내부 토큰(`calendar-map`, `Q1~Q4`, `Structuring`, `Acceleration`) 노출 금지
  - supplement 정책(yearly):
    - yearly에서는 `executionProtocol.today/thisWeek/thisMonth/avoid`를 강제하지 않는다.
    - UI에서 yearly 공통 단기 supplement 카드(`오늘/이번 주 실행`, `이번 달/주의 항목`)를 렌더하지 않는다.
  - UI 고정 섹션 순서(9개):
    - 한 줄 총평
    - 지금 인생의 큰 흐름
    - 올해의 의미
    - 올해 이후 10년의 흐름
    - 장기 패턴 해석
    - 올해의 핵심 테마 3가지
    - 분기별 실행 캘린더
    - 올해가 끝났을 때 남아야 할 것
    - 한 줄 결론
  - 캐시 버전 규칙:
    - yearly 서비스는 `cacheVersion`과 `yearlyQualityGateVersion`을 별도 포함해 캐시 키를 분리한다.

- 7개 리포트는 공통 앵커 문장 1개를 제외하고 핵심 문장 재사용을 금지한다.
- 중복 탐지 시 해당 서비스만 1회 재생성한다(무한 재시도 금지).

## 레거시 호환
- `reportPayload.analysisBlocks`가 없으면 파서에서 fallback 블록을 생성한다.
- `saju-lifetime-roadmap`의 기존 필드(`lifetimeScore`, `daeunPeriods`, `goldenPeriods`, `personalityType`)는 계속 저장/조회한다.
- 기존 데이터 백필은 하지 않는다. 신규 생성분부터 v2.1 계약을 적용한다.

---

## 2026 신년운세 7종 계약 (v2.4)
- 대상 서비스:
  - `saju-2026-overview`
  - `saju-2026-study-exam`
  - `saju-love-focus`
  - `saju-2026-wealth-business`
  - `saju-2026-investment-assets`
  - `saju-2026-career-aptitude`
  - `saju-2026-health-balance`
  - legacy: `saju-2026-yearly-outlook`
- 공통 응답 필드:
  - `summary: string`
  - `sections: { title, interpretation, advice, luckyTip? }[]`
  - `reportTemplateVersion`: 기본 `saju-report-v2.9`, 단 `saju-2026-health-balance`는 `saju-report-v2.10-health`, `saju-2026-investment-assets`는 `saju-report-v2.10-investment`
  - `reportPayload.coreQuestion/coreInsights/actionNow/evidence/analysisBlocks`

### 공통 payload
- `reportPayload.quickSummary`:
  - `verdict: string`
  - `keywords: string[3]`
  - `signalTrio: { interpretationIntensityLevel, attentionLevel, changeSignalLevel, reason }`
- `reportPayload.yearTimeline: Array<{ quarter, quarterSummary, opportunity, caution, action }>`
  - `quarter`는 `1분기~4분기` 4개 고정.
  - 각 분기에 `quarterSummary` 1줄을 반드시 포함.
- `reportPayload.actionPlan90: { day30[], day60[], day90[] }`
- `reportPayload.consistencyMeta: { targetYear, ganji, age, generatedAt }`
  - `targetYear=2026`, `ganji="병오"` 고정.

### overview 전용 payload
- 대상:
  - `saju-2026-overview`
  - `saju-2026-yearly-outlook`
- `reportPayload.focusCards: Array<{ focusId, focusLabel, conclusion, dos[], donts[], evidencePrimary, evidenceExtra[] }>`
  - 라벨/순서 고정: `종합 → 시험·학업 → 연애·결혼 → 재물·사업 → 주식·부동산 투자 → 직업·적성 → 건강`
  - `conclusion`은 한 줄 요약이 아니라 `2~4문장` 구체 해석 문단으로 유지한다.
  - `conclusion`에는 가능하면 `기회/실행`과 `주의/속도조절` 신호를 함께 포함한다.
  - 최소 기준: `dos >= 2`, `donts >= 1`, `evidencePrimary + evidenceExtra 합계 >= 2`

### focused 6개 서비스 전용 payload
- `saju-2026-study-exam`
  - `studyRhythm: string`
  - `examWindows: string[]`
  - `mistakeTriggers: string[]`
  - `executionGuide: string[]`
  - `evidenceNotes: string[]`
  - `studyActionReport?: {`
    - `coreDiagnosis: { headline, summary, confidenceNote }`
    - `keyQuestion: string`
    - `keyInsights: string[3]`
    - `immediateActions: { startNow[], stopNow[], prepNow[] }`
    - `yearFlowSummary: { preparationPhase, accelerationPhase, showdownPhase, wrapUpPhase }`
    - `quarterlyDetailed: Array<{ period("1~3월"|"4~6월"|"7~9월"|"10~12월"), strengths[], risks[], recommendedStrategies[], checkQuestionOrTip }>`
    - `examTypeGuides: { writtenExam[], interviewOrOral[], longTermLearning[] }`
    - `failurePatterns: string[]`
    - `performanceStrategy: { studyMethod[], lifeManagement[], mentalManagement[] }`
    - `plainEvidence: string[]`
    - `finalSummary: string[]`
  - `}`
- `saju-love-focus`
  - `relationshipFlow: string`
  - `approachSignals: string[]`
  - `cautionPatterns: string[]`
  - `relationshipGuide: string[]`
  - `marriageDecisionBoard: string[]`
  - `meetingChannelPriority: string[]`
  - `greenFlagChecklist: string[]`
  - `redFlagChecklist: string[]`
  - `conflictProtocol: string[]`
  - `consumerFaq: Array<{ question, answer }>`
  - `evidenceNotes: string[]`
- `saju-2026-wealth-business`
  - `cashflowPulse: string`
  - `growthAxes: string[]`
  - `leakRisks: string[]`
  - `operatingRules: string[]`
  - `evidenceNotes: string[]`
  - `oneLineDiagnosis: string`
  - `keyPoints: string[3]`
  - `easyInterpretationPoints: string[]`
  - `annualFlowSummary: string`
  - `quarterlyFlowCards: Array<{ quarter("1분기"|"2분기"|"3분기"|"4분기"), flowSummary, keyPoint, risk, actionStrategy }>`
  - `revenueFlowDeepDive: string[]`
  - `businessManagementPoints: string[]`
  - `burnoutPreventionStrategies: string[]`
  - `actionChecklist: string[]`
  - `closingLine: string`
- `saju-2026-investment-assets`
  - `entryBias: string`
  - `watchSignals: string[]`
  - `riskAlerts: string[]`
  - `capitalRules: string[]`
  - `evidenceNotes: string[]`
  - `investmentActionReport?: {`
    - `coreDiagnosis: { headline, summary }`
    - `keyQuestion: string`
    - `keyInsights: string[3]`
    - `immediateActions: string[]`
    - `absoluteCautions: string[]`
    - `quarterlyFlow: Array<{ quarter("1분기"|"2분기"|"3분기"|"4분기"), summary, actionFocus[], riskFocus[] }>`
    - `assetClassGuides: { stocksEtf[], realEstate[], cashSavings[], cryptoHighVolatility[] }`
    - `signalBoard: { watchSignals[], entrySignals[] }`
    - `riskAlerts: string[]`
    - `practicalChecklist: string[]`
    - `plainEvidence: string[]`
    - `flowTo2027: string`
    - `finalConclusion: string[]`
  - `}`
- `saju-2026-career-aptitude`
  - `fitRoleSignal: string`
  - `strongWorkModes: string[]`
  - `misfitChoices: string[]`
  - `executionChecklist: string[]`
  - `evidenceNotes: string[]`
- `saju-2026-health-balance`
  - `energyRhythm: string`
  - `bodyPatterns: string[]`
  - `quarterlyFlowCards: Array<{ quarter("1분기"|"2분기"|"3분기"|"4분기"), flowSummary, cautionPoint, recommendedAction }>`
  - `recoveryPriorities: string[]`
  - `overloadSignals: string[]`
  - `overloadChecklist: string[]`
  - `routineChecklist: string[]`
  - `routineGuide: { morning[], daytime[], evening[], weekly[] }`
  - `evidenceNotes: string[]`
- focused 6개 서비스는 `focusCards`를 출력하지 않는다.
- focused 6개 서비스는 다른 6개 영역 요약을 하지 않는다.
- focused 6개 서비스는 선택한 서비스의 핵심 흐름, 강점/주의점, 행동 가이드, 해석 근거를 직접 서술한다.
- focused 6개 서비스의 단일 string 필드(`studyRhythm`, `relationshipFlow`, `cashflowPulse`, `entryBias`, `fitRoleSignal`, `energyRhythm`)는 `2~4문장` 구체 해석 문단으로 작성한다.
- focused 6개 서비스의 배열 필드는 `2~4개` 문장 원소를 유지한다.
- 배열 원소는 키워드/태그가 아니라 실제 판단에 도움이 되는 완결된 문장이어야 한다.
- `saju-love-focus` 추가 규칙:
  - `marriageDecisionBoard`는 진행/보류/중단 신호를 구분해 최소 3문장으로 유지한다.
  - `consumerFaq`는 8개 고정 문항으로 유지하고 각 항목의 `question/answer`를 모두 채운다.
  - 행동 가이드 계열 문장은 `조건 + 행동 + 확인 기준` 구조를 포함한다.
- `saju-2026-health-balance` 추가 규칙:
  - 건강 관련 표현은 진단/치료 단정형 문장을 금지하고 `경향/주의/권장` 톤으로 작성한다.
  - 오행/사주 용어를 사용한 경우 같은 문맥에서 생활관리 언어(수면/피로/예민함/소화/루틴)로 즉시 번역한다.
  - `birthPrecision=unknown|time-block`인 경우 세부 시점 해석은 참고용·보수적 표현으로 완화한다.
- `saju-2026-investment-assets` 추가 규칙:
  - `investmentActionReport`를 우선 출력하고, 진입/관망/회수 기준을 실행 문장으로 작성한다.
  - 분기별 섹션은 `summary + actionFocus + riskFocus` 3요소를 모두 포함한다.
  - 자산군 섹션은 `주식/ETF`, `부동산`, `현금/예금`, `코인/고변동 자산` 4개를 모두 포함한다.
  - 명리 용어를 사용할 경우 같은 문단에서 현실 언어로 즉시 번역한다.
- UI 정책:
  - overview 계열만 `7개 핵심 영역 카드`를 노출한다.
  - focused 6개는 `서비스명 + 심화 해석` 섹션 제목으로 렌더한다.
  - focused 카드 본문은 bullet 리스트가 아니라 문장 블록으로 렌더한다.
  - `saju-2026-wealth-business`는 기존 focused 공통 섹션을 유지하고, 그 아래에 실행형 전용 섹션(한 줄 진단/핵심 포인트 3/쉬운 해석/연간 요약/분기 4카드/수익 심화/사업 관리/번아웃 방지/체크리스트/한 줄 결론)을 append한다.
  - 분기 카드는 동일 템플릿(`핵심 흐름 + 핵심 포인트 + 리스크 + 행동 전략`)으로 통일한다.
  - 체크리스트는 강조 박스 스타일의 리스트로 렌더한다.
  - `saju-love-focus`는 기존 카드 아래 `결혼 전환 판단 보드 / 만남 채널 우선순위 / 그린 플래그 체크리스트 / 레드 플래그 체크리스트 / 갈등 응급 프로토콜 / 소비자 FAQ` 카드를 추가 노출한다.
  - `saju-2026-investment-assets`에서 `investmentActionReport`가 존재하면 전용 실행전략 13개 섹션을 고정 순서로 렌더한다:
    - `한 줄 핵심 진단 -> 핵심 질문 -> 핵심 인사이트 3개 -> 지금 액션 -> 올해 절대 조심할 행동 -> 분기별 흐름(1~4분기) -> 자산군별 해석(주식/ETF·부동산·현금/예금·코인/고변동) -> 관망 신호/진입 신호 -> 리스크 경보 -> 실전 체크리스트 -> 해석 근거를 쉽게 풀어쓴 설명 -> 2027로 이어지는 흐름 -> 최종 결론`
  - 투자 전용 13개 섹션이 렌더될 때는 기존 `주식·부동산 투자 심화 해석` 카드와 공통 상단 카드(`핵심 인사이트/지금 액션/근거`) 및 일반 `analysisBlocks` 카드를 중복 노출하지 않는다.
  - `saju-2026-study-exam`에서 `studyActionReport`가 존재하면 학업 전용 실행전략 11개 섹션을 고정 순서로 렌더한다:
    - `한눈에 보는 핵심 진단 -> 핵심 질문 -> 올해의 핵심 인사이트 3가지 -> 지금 바로 해야 할 것(시작/멈춤/챙김) -> 2026년 전체 흐름 요약(준비기/가속기/승부기/정리기) -> 시기별 상세 해석(1~3/4~6/7~9/10~12, 강점/리스크/추천전략/체크질문) -> 시험 유형별 맞춤 해석(필기/면접·구술/장기학습) -> 실패 패턴 -> 성과 전환 전략(공부/생활/멘탈) -> 쉬운 근거 설명 -> 최종 요약`.
  - 학업 전용 실행전략 섹션이 렌더될 때는 기존 `시험·학업운 심화 해석` 5카드와 공통 상단 카드(`핵심 인사이트/지금 액션/근거`) 및 일반 `analysisBlocks` 카드를 중복 노출하지 않는다.
  - `saju-2026-health-balance`는 전용 실행형 섹션을 사용한다: `상단 요약(한 줄 진단/키워드 3개/신뢰도/출생시간 안내) -> 올해 몸 패턴 -> 분기별 흐름 4카드 -> 과부하 체크리스트 -> 회복 우선순위 -> 추천 생활 루틴(아침/낮/저녁/주간) -> 하단 안내`. 이 섹션이 렌더될 때 기존 `건강운 심화 해석` 카드와 공통 상단 카드/analysisBlocks는 중복 노출하지 않는다.

### 레거시 호환 (v2.4)
- `saju-2026-yearly-outlook`는 신규 판매 라인업에서는 제외한다.
- `saju-2026-yearly-outlook`는 overview payload 계약을 유지한다.
- 기존 저장 결과 조회와 기존 링크 진입 시에는 DB 백필 없이 런타임 fallback으로만 대응한다.
- focused 6개 서비스의 구버전 payload가 `focusCards`만 가진 경우:
  - parser는 선택 서비스의 `focusCard` 1개와 `sections`, `analysisBlocks`, `yearTimeline`을 조합해 전용 심화 필드를 보강한다.
  - `saju-2026-wealth-business`는 신규 필드가 누락된 구버전 payload여도 `cashflowPulse/growthAxes/leakRisks/operatingRules/evidenceNotes + analysisBlocks + yearTimeline + actionPlan90`를 합성해 실행형 전용 섹션을 런타임 생성한다.
  - `saju-2026-investment-assets`는 `investmentActionReport`가 없더라도 `entryBias/watchSignals/riskAlerts/capitalRules/evidenceNotes + analysisBlocks + yearTimeline + actionPlan90`을 조합해 실행전략형 13섹션 구조를 런타임 보강한다.
  - `saju-2026-study-exam`은 `studyActionReport`가 없더라도 parser/UI가 `studyRhythm/examWindows/mistakeTriggers/executionGuide/evidenceNotes + analysisBlocks/yearTimeline/coreInsights/actionNow/evidence`를 조합해 실행전략형 구조를 런타임 합성한다.
  - `saju-love-focus`는 누락된 신규 필드를 `analysisBlocks/yearTimeline/actionNow/evidence` 기반 fallback으로 보강한다.
  - `saju-2026-health-balance`는 구버전 payload에서도 `bodyPatterns/quarterlyFlowCards/overloadChecklist/routineGuide`를 `analysisBlocks/yearTimeline/actionNow/evidence/actionPlan90` 조합으로 런타임 보강한다.
  - UI는 저장된 payload가 구버전이어도 동일한 심화 섹션 라벨로 렌더링한다.

### 표현 정책
- `signalTrio`는 숫자 점수(0~100) 금지.
- 허용값:
  - `interpretationIntensityLevel`: `약/중/강`
  - `attentionLevel`: `낮음/보통/높음`
  - `changeSignalLevel`: `약/중/강`
- 근거 노출 정책:
  - `evidencePrimary`는 기본 노출.
  - `evidenceExtra[]`는 접힘 영역으로 노출.

## v2.1 차트 시계열 계약 (2026-03-24)
- saju-wealth-flow.reportPayload.assetTrendSeries: Array<{ label: string; value: number }>
- saju-energy-balance.reportPayload.energyRhythmSeries: Array<{ label: string; value: number }>
- `value`는 0~100 정수 범위여야 한다.
- 프론트 컴포넌트에서 하드코딩 시계열을 사용하지 않고, payload 시계열만 렌더링한다.
- payload 누락 시 파서 fallback은 만세력 오행 분포(sajuData.oheng)와 용신(sajuData.yongsin) 기반으로 생성한다.

## v2.3.1 라벨 인코딩 정합성 (2026-03-25)
- `src/components/saju/SajuCollectionTabs.tsx`의 정적 라벨은 UTF-8 한글 원문으로 유지한다.
- 깨진 문자열(모지바케) 패턴이 포함된 라벨은 배포 금지한다.
- 고정 라벨 기준:
  - `한눈 요약`, `신호 요약`, `연간 흐름`, `분석 근거`, `세부 해석`, `90일 행동 계획`
  - `7개 핵심 영역 카드`
  - `집중 흐름`, `승부 시점`, `실수 패턴`, `합격 행동`, `해석 근거`
  - `관계 흐름`, `가까워지는 신호`, `주의 패턴`, `관계 운영 가이드`
  - `결혼 전환 판단 보드`, `만남 채널 우선순위`, `그린 플래그 체크리스트`, `레드 플래그 체크리스트`, `갈등 응급 프로토콜`, `소비자 FAQ`
  - `수익 흐름`, `밀어야 할 축`, `새는 지점`, `운영 원칙`
  - `진입 판단`, `관망 신호`, `리스크 경보`, `자금 운용 원칙`
  - `맞는 역할`, `성과 나는 방식`, `엇나가는 선택`, `실행 체크리스트`
  - `컨디션 리듬`, `회복 우선순위`, `과부하 신호`, `생활 루틴`

## v2.1.1 Chart UX contract (2026-03-24)
- Trend charts must render against an explicit time domain, not index spacing.
- Wealth domain default: `현재(0) / 1년 후(1) / 3년 후(3) / 5년 후(5) / 10년 후(10)`.
- Energy domain default: `1주(1) / 2주(2) / 3주(3) / 4주(4) / 8주(8) / 12주(12)`.
- UI must visually separate:
  - full period range
  - analyzed points range
  - missing/no-analysis points (dashed marker + legend text)
- Each chart must include one-line interpretation guidance:
  - what period it covers
  - which checkpoints are sampled
  - that it is an index trend (0~100), not a continuous per-unit forecast.

## v2.2 Deterministic Chart Contract (2026-03-25)
- 범위:
  - `saju-wealth-flow`
  - `saju-energy-balance`
- 차트 수치 정책:
  - `assetTrendSeries`, `energyRhythmSeries`는 Gemini 응답을 사용하지 않는다.
  - 최종 payload는 deterministic trend engine 결과로 강제 덮어쓴다.
  - 계산 근거는 `원국 오행 + 용신 + 세운(연간 간지)`이며 이번 버전에서 대운 계산기는 제외한다.
- Evidence 확장 필드:
  - `assetTrendEvidence[]`
  - `energyRhythmEvidence[]`
- Evidence 스키마:
  - `label: string`
  - `value: number (0~100)`
  - `deltaFromPrev: number`
  - `direction: "up" | "down" | "flat"`
  - `reasonSummary: string`
  - `interpretation: string`
  - `reasonDetails: string[]`
  - `rawBasis: { source: "manseryeok", checkpoint, ohengDistribution, yongsin, seun?, temporalPillars?, factorScores }`
- 레거시 호환:
  - 기존 `assetTrendSeries`, `energyRhythmSeries` 키는 유지한다.
  - 구버전 payload에 evidence가 없으면 렌더 직전 deterministic engine으로 보강 생성한다.

## v2.5 대운 전환 장기흐름 계약 (2026-03-28)
- 대상:
  - `saju-daeun-shift`
- 목적:
  - `2026 단년도 해석` 비중을 줄이고 `인생 전환점의 장기 흐름`을 중심으로 서술한다.
- 필수 구조:
  - `analysisBlocks`는 4단계 고정:
    - `전환 전 준비기`
    - `전환기`
    - `전환 후 재배치기`
    - `전환 후 정착기`
  - `phaseRoadmap[]` 필수:
    - `{ phaseLabel, ageRange, yearRange, coreFlow, evidence, opportunities[], risks[], actionStrategy[] }`
  - `longHorizonDirection[]` 필수:
    - `1~2년`, `3~5년`, `6~10년` 축을 모두 포함한다.
- 표현 정책:
  - `2026`은 전환 촉발 연도로 제한하고, 본문 핵심은 `전환 후 중기/장기 방향`으로 작성한다.
  - `오늘/이번 주/이번 달` 중심 문구가 과밀하지 않도록 제한하며, 중기/장기 타임마커 문장을 반드시 포함한다.
  - `preAtPostDiff[]`는 레거시 비교 카드용 필드로 유지한다.
- 레거시 호환:
  - 기존 저장 payload에 `phaseRoadmap` 또는 `longHorizonDirection`이 없으면 런타임에서 동적 fallback을 생성한다.
  - DB 백필은 수행하지 않는다.


## v2.6 커리어 타이밍 장기흐름 계약 (2026-03-28)
- 대상: `saju-career-timing`
- 목적: 단년도(예: 2026) 중심 설명을 보조 영역으로 내리고, 4단계 장기 커리어 흐름을 본문 중심축으로 고정한다.

### 필드 계약 (하위호환 확장)
- 기존 필드 유지: `careerWindow`, `decisionTree[]`, `executionChecklist[]`, `workModeFit`, `decideNow[]`, `deferNow[]`, `gainVsLossPatterns[]`, `decisionCriteria[]`
- 신규 확장 필드:
  - `careerArcSummary?: string`
  - `stageFlow?: Array<{ stageId, label, timeRange, coreFlow, evidence, opportunities[], risks[], actionStrategy[], transitionSignal }>`
  - `transitionSignal?: string`
  - `currentYearFocus?: string`
- `stageFlow.stageId` 고정값: `build-up | transition | expansion | stabilization`
- `stageFlow.timeRange` 기본축: `0~2년 | 3~5년 | 6~10년 | 10년+`

### 생성/정규화 규칙
- `stageFlow`가 없으면 파서가 4단계를 동적으로 생성한다.
- `analysisBlocks`는 최종적으로 `stageFlow`와 동일 4단계 축으로 정렬한다.
- 단계별 `coreFlow`는 동일 문장 반복을 피하고, 단계별로 분리된 서사를 유지한다.
- `currentYearFocus`는 보조 해석 필드이며, 본문의 장기 단계 서사를 대체할 수 없다.
- 커리어 서비스의 `supplement.executionProtocol` 최소치는 축소 적용한다.
  - `today`: 0~2
  - `thisWeek`: 1~3
  - `thisMonth`: 1~3
  - `avoid`: 1~3

### 표현 규칙
- 단일 연도(예: 2026) 반복은 `currentYearFocus`로 제한한다.
- 본문은 반드시 `초기 축적기 → 전환기 → 확장기 → 안정화기` 순서를 유지한다.
- `decideNow/deferNow`는 결정 매트릭스 보조 블록으로만 사용한다.

## v2.7 재물 흐름 레이더 인생총운형 계약 (2026-03-28)
- 대상: `saju-wealth-flow`
- 목적: 단년도(예: 2026) 실행 지시 중심 문서를 `인생 전체 자산 운영 패턴` 중심 문서로 전환한다.

### 필드 계약 (하위호환 확장)
- 기존 필드 유지:
  - `cashflowMap`, `riskZones[]`, `assetRules[]`, `assetTrendSeries[]`, `assetTrendEvidence[]`, `incomeStructure[]`, `spendingPatterns[]`, `accumulateVsExpand[]`, `financialNoGo[]`
- 신규 확장 필드:
  - `wealthLifecycleStages: Array<{ phaseType, timeRange, ageRange, yearRange, coreObjective, opportunity, risk, operatingRules[], transitionSignal }>`
- `phaseType` 고정값:
  - `accumulation | expansion | defense | volatility`

### 생성/정규화 규칙
- `wealthLifecycleStages`는 4단계를 모두 포함해야 한다.
- `analysisBlocks`는 최종적으로 `wealthLifecycleStages`와 동일 4단계 축으로 정렬한다.
- `wealthLifecycleStages` 누락 시 파서가 `analysisBlocks + assetTrendEvidence` 기반 fallback 4단계를 생성한다.
- 재물 서비스 action 문구는 전용 보정 템플릿을 사용한다.
  - `담당·기한·측정 기준` 후행 반복 문구를 기본 템플릿으로 강제하지 않는다.

### 표현/렌더 규칙
- 상단 구조는 아래 순서를 유지한다.
  - `핵심 질문` → `인생 자산 사이클 4단계` → `10년 추세(근거)` → `구간별 운영 규칙` → `현재 구간 실행`
- 단일 연도(예: 2026)는 현재 앵커 1회로 제한하고, 본문은 단계/구간 중심 서사를 유지한다.
- 차트 체크포인트(`현재/1년/3년/5년/10년`)는 단계 판독(`축적/확장/방어/변동`)과 연결해 해석한다.

## v2.6 관계·귀인 네트워크 장기구조 계약 (2026-03-28)
- 대상: `saju-helper-network`
- 목적: `2026 인간관계 해설` 중심 출력에서 벗어나, `인생 전체 관계 자산과 귀인 운 구조`를 본문 중심으로 고정한다.

### 필드 계약 (하위호환 확장)
- 기존 필드 유지:
  - `helperMap`, `conflictPatterns[]`, `networkGuide[]`, `helperProfiles[]`, `relationExpansionVsEntanglement[]`, `conflictLoops[]`, `helperEntryWindows[]`, `relationLayers[]`
- 신규 확장 필드:
  - `phaseRoadmap?: Array<{ phaseLabel, timeRange, relationshipExpansion, collaborationFlow, mentorInfluxSignal, guardPattern, actionStrategy[] }>`
  - `longHorizonDirection?: string[]`

### 생성/정규화 규칙
- `phaseRoadmap`은 최소 4단계를 유지한다.
  - 기본 축: `관계 기반 정비기` → `협업 확장기` → `귀인 유입기` → `관계 자산 전수기`
- 각 단계는 반드시 아래 4요소를 모두 포함한다.
  - `relationshipExpansion` (관계 확장/정리)
  - `collaborationFlow` (협업 운 운영 기준)
  - `mentorInfluxSignal` (멘토·귀인 유입 시그널)
  - `guardPattern` (경계 패턴)
- `longHorizonDirection`은 `1~2년`, `3~5년`, `6~10년` 축을 모두 포함한다.
- 구버전 payload에 `phaseRoadmap` 또는 `longHorizonDirection`이 없으면 런타임 fallback을 생성한다.

### 표현/렌더 규칙
- 본문 상단 구조는 아래 순서를 유지한다.
  - `인생 단계별 관계 확장/정리` → `협업 운 운영 기준` → `멘토·귀인 유입 시그널` → `경계 패턴`
- `오늘/이번 주 실행`은 보조 영역(`현재연도 실행 포인트`)으로 하단에 유지한다.
- 단일 연도(예: 2026) 직접 언급은 보조 섹션 중심으로 제한하고, 본문은 단계/다년 흐름으로 유지한다.
