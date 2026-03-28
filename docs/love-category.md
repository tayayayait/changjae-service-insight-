# 연애·궁합 카테고리 v3

## 1) 서비스 IA
- `미래 배우자` (`/love/future-partner`)
- `커플 궁합` (`/love/couple-report`)
- `재회 가능성` (`/love/crush-reunion`)
- 저장된 리포트 상세: `/love/report/:reportId`
- `별자리 궁합(시나스트리)`는 계속 `점성학` 카테고리로 유지 (`/astrology/synastry`)

## 2) 설계 원칙
- 세 서비스는 공통 셸만 공유하고, 리포트 구조와 핵심 질문은 각자 다르게 구성한다.
- 무료 구간은 빠른 판단과 구매 효용 설명만 담당한다.
- 유료 구간은 본문 밀도, 서비스 전용 산출물, 실행 가능한 행동 가이드로 차별화한다.
- 카드 수를 늘리는 대신 각 섹션의 본문 밀도와 해석 구체성을 높인다.
- v1, v2 저장 리포트는 계속 열람 가능해야 하며, 신규 생성분부터 v3 계약을 적용한다.

## 3) 공통 계약
- `reportVersion`: `v3-differentiated`
- `reportLayout`
  - `future-partner-v3`
  - `couple-report-v3`
  - `crush-reunion-v3`
- 공통 점수축: `overall / pull / pace / alignment / repair / timing`
- `LoveReportSection`
  - `id: string`
  - `navLabel: string`
  - `title: string`
  - `coreQuestion: string`
  - `verdict: string`
  - `analysisParagraphs: string[]`
  - `interpretationPoints: string[]`
  - `actionTitle: string`
  - `actionItems: string[]`
  - `warningNote: string`
- paid section 최소 밀도
  - `analysisParagraphs`: 2~3개
  - `interpretationPoints`: 3~4개
  - `actionItems`: 3개 이상

## 4) Preview 계약
- 공통 필드
  - `headline`
  - `summary`
  - `serviceType`
  - `reportLayout`
  - `scoreSet`
  - `quickCounsel`
  - `previewHighlights`
  - `openSection`
  - `lockedSectionSummaries`
  - `ctaReason`
  - `confidenceSummary`
  - `nextRefreshAt`
- `quickCounsel`
  - `diagnosis`
  - `temperatureLabel`
  - `temperatureText`
  - `immediateAction`
- `previewHighlights`
  - 무료에서 보여주는 2~3개 핵심 포인트
  - `headline`, `quickCounsel`, `openSection.verdict`와 문장 재사용 금지
- `lockedSectionSummaries`
  - `id`
  - `title`
  - `teaser`
  - `benefit`

## 5) Full 계약
- 공통 필드
  - `headline`
  - `summary`
  - `serviceType`
  - `reportLayout`
  - `scoreSet`
  - `sections`
  - `scoreNarratives[]`
  - `actionRoadmap`
  - `serviceInsights`
  - `conversationPrompts`
  - `avoidList`
  - `confidenceNotes`
  - `nextRefreshAt`
- `scoreNarratives[]`
  - 각 점수축별 `label`, `score`, `interpretation`, `why`
- `actionRoadmap`
  - `now[]`
  - `within7Days[]`
  - `within30Days[]`

## 6) 서비스별 구조

### 미래 배우자
- `reportLayout`: `future-partner-v3`
- 섹션 순서
  - `partner-profile`
  - `my-pattern`
  - `meeting-flow`
  - `marriage-timing`
  - `screening-rules`
  - `evidence-note`
- 핵심 질문
  - 누굴 만나야 하는가
  - 어디서 들어오는가
  - 무엇을 기준으로 걸러야 하는가
  - 결혼으로 가려면 무엇이 준비돼야 하는가
- 해석 포인트
  - 배우자상
  - 가치관/생활 합의력
  - 만남 채널
  - 결혼 준비도
  - 연애 반복 패턴
- 행동 가이드
  - 만남 채널
  - 첫 대화 체크 질문
  - 초기 필터링 기준
  - 30일 노출 행동
- `serviceInsights`
  - `partnerProfile`
  - `meetingChannels[]`
  - `greenFlags[]`
  - `redFlags[]`
  - `selfCheckCriteria[]`
- 금지 규칙
  - 특정 현재 상대를 전제하는 문장 금지
  - `상대 정보 부족` 류의 변명 금지

### 커플 궁합
- `reportLayout`: `couple-report-v3`
- 섹션 순서
  - `relationship-state`
  - `conflict-trigger-map`
  - `communication-speed`
  - `agreement-structure`
  - `repair-protocol`
  - `evidence-note`
- 핵심 질문
  - 왜 반복해서 부딪히는가
  - 무엇을 합의하지 못하고 있는가
  - 어떻게 회복해야 하는가
  - 지속 가능성이 어디서 갈리는가
- 해석 포인트
  - 갈등 패턴
  - 기대치 차이
  - 생활 리듬
  - 돈/결혼 의사결정
  - 회복 속도
- 행동 가이드
  - 대화 순서
  - 금지 문장
  - 합의 체크리스트
  - 7일 회복 루틴
- `serviceInsights`
  - `conflictTriggers[]`
  - `repairRituals[]`
  - `agreementChecklist[]`
  - `doNotSay[]`
  - `recoverySignals[]`
- 금지 규칙
  - 단순 `잘 맞음/안 맞음` 판정 금지
  - 감정적인 낙인 문장 금지

### 재회 가능성
- `reportLayout`: `crush-reunion-v3`
- 섹션 순서
  - `chance-verdict`
  - `break-cause`
  - `signal-reading`
  - `contact-window`
  - `attempt-or-stop`
  - `evidence-note`
- 핵심 질문
  - 지금 가능성이 있는가
  - 왜 막혔는가
  - 언제 시도해야 하는가
  - 어디서 멈춰야 손실이 적은가
- 해석 포인트
  - 가능성 판정
  - 상대 부담 지점
  - 현재 신호 해석
  - 재접촉 시기
  - 손절 기준
- 행동 가이드
  - 연락 전 체크리스트
  - 보내도 되는 문장
  - 보내면 안 되는 문장
  - 중단 조건
- `serviceInsights`
  - `chanceVerdict`
  - `positiveSignals[]`
  - `blockingSignals[]`
  - `contactWindow`
  - `stopLossRules[]`
  - `contactScripts[]`
- 금지 규칙
  - `가능성 있음 / 제한적 / 확실한 정보 없음` 중 하나의 판단 언어를 반드시 사용
  - 희망고문성 문장 금지

## 7) 무료/유료 경계
- 무료 미리보기
  - Hero 요약
  - `quickCounsel`
  - `previewHighlights`
  - `openSection`
  - 잠금 섹션 요약 카드
- 무료 서비스별 노출 포인트
  - 미래 배우자: `배우자상 한 줄`, `인연 준비도`, `들어오는 채널 힌트`
  - 커플 궁합: `관계 온도`, `갈등 핵심 축`, `당장 피해야 할 말`
  - 재회 가능성: `가능성 판정`, `재접촉 위험도`, `지금 움직이면 안 되는 이유`
- 유료 해제
  - 모든 paid section 전체
  - `scoreNarratives`
  - `actionRoadmap`
  - `serviceInsights`
  - `conversationPrompts`
  - `avoidList`
  - `confidenceNotes`
- 무료/유료 경계 규칙
  - 무료에는 실행 가능한 상세 행동 순서와 서비스 전용 산출물 전체를 노출하지 않는다.
  - 유료에는 서비스별 전용 결과물이 반드시 있어야 한다.

## 8) 렌더링 원칙
- Hero는 서비스명, 헤드라인, 2문장 요약만 담당한다.
- Quick Counsel은 무료 진단만 담당한다.
- 본문 섹션 카드는 해석과 행동만 담당한다.
- `ActionRoadmapCard`는 실행 순서만 담당한다.
- `ServiceInsightsCard`는 서비스 전용 결과물만 담당한다.
- `EvidenceCard`는 해석 근거와 신뢰도 메모만 담당한다.
- `RepeatUsePromptCard`는 마지막 운영 카드로만 노출한다.
- 기존 `LoveTimingTimeline`은 제거하고 `ActionRoadmapCard`로 대체한다.

## 9) 저장/호환 정책
- `love_reports.preview_json`과 `love_reports.full_report_enc`에 v3 payload 저장
- DB migration은 하지 않고 JSON payload 확장만 사용
- `report_version`, `template_version`은 신규 생성분부터 v3 값을 사용
- v1, v2 리포트는 레거시 렌더러로 계속 지원
- 캐시 키에는 `template_version`을 포함하여 v2 결과와 혼재되지 않게 한다.

## 10) 테스트 기준
- 서비스별 생성 스키마가 서로 다른 section id, 순서, `serviceInsights`를 반환해야 한다.
- 무료 화면은 서비스별로 서로 다른 카드 조합과 문구를 보여야 한다.
- 유료 화면은 공통 카드 나열이 아니라 서비스 전용 블록을 포함해야 한다.
- paid section은 최소 본문 밀도 규칙을 충족해야 한다.
- 미래 배우자는 `상대 정보 부족` 문구가 없어야 한다.
- 커플 궁합은 단순 판정형 문구가 없어야 한다.
- 재회 가능성은 확정된 3단계 판단 언어 중 하나를 반드시 포함해야 한다.

## 11) 2026-03-25 UI Masking Policy
- Free preview keeps only core blocks readable: `Hero`, `quickCounsel`, `previewHighlights`, and `openSection.verdict`.
- Detailed body in preview cards must be strongly masked with blur + overlay so full text is not immediately readable.
- Locked summary cards (`lockedSectionSummaries`) must also use strong masking in free mode.
- When `isUnlocked=true`, all masks are removed and full report content is rendered normally without blur/overlay.

## 12) 2026-03-26 카드 노출/진입 흐름 보강
- `CategoryPage`는 잘못된 `tab` 쿼리값으로 진입해도 자동으로 유효 탭(`solo`)으로 복구한다.
- 연애 카테고리 탭(`미래 배우자 / 커플 궁합 / 재회 가능성`)은 화면에서 항상 선택 가능해야 한다.
- 3개 핵심 연애 서비스 카드는 모두 `/service/{serviceId}` 경유로 진입한다.
- 서비스 인트로 화면에서는 다음 정보를 사전 안내한다.
  - 이 리포트가 답하는 핵심 질문
  - 다른 연애 리포트와의 차별 포인트
  - 진입 전 확인 가능한 핵심 분석 항목(2~3개)
- 인트로 CTA 실행 시 최종 상세 경로로 handoff 한다.
  - `love-future-partner` → `/love/future-partner`
  - `love-couple-report` → `/love/couple-report`
  - `love-crush-reunion` → `/love/crush-reunion`

## 2026-03-27 Payment Flow Update (2,900 KRW)
- Love paid report unlock entry is now unified to `PaymentCheckoutSheet`.
- Unlock button no longer calls `unlockLoveReport` directly.
- New flow:
  1. Open `PaymentCheckoutSheet` (`assumePaid=false`)
  2. Complete PortOne/KG Inicis checkout
  3. Call `unlockLoveReport` in success callback
  4. Pass payment metadata: `provider=portone`, `providerOrderId=<orderNumber>`
- Compatibility: `unlockLoveReport` still supports old call shape without payment metadata.
