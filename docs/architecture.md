# 사주 플랫폼 아키텍처 (v4)

## 기술 스택
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui
- Backend: Supabase (PostgreSQL + Edge Functions)
- AI: Gemini (`analyze-saju`, `daily-fortune`, `zodiac-fortune`, `star-sign-fortune`, `dream-interpretation`, `yearly-fortune`, `analyze-compatibility`, `love-reports`)
- 사주 계산: `@fullstackfamily/manseryeok`

## 제품 구조
- 제품 유형: `포털형 홈 + 퍼널형 입력 + 질문형 결과 + 허브형 운세`
- 핵심 가치: 사주 초보자가 3분 내 핵심 해석을 이해하도록 설계
- 저장 정책:
  - 저장형: 사주, 연애 리포트, 레거시 궁합, 개인 운세, 꿈해몽
  - 비저장형: 간편 운세, 길일 캘린더

## 프런트엔드 IA
- 최상위 메뉴: `홈 / 내 사주 / 운세 / 궁합 / 보관함`
- 주요 라우트:
  - `/` 홈
  - `/saju` 내 사주 입력 퍼널
  - `/result/:resultId` 사주 결과
  - `/fortune` 운세 허브
  - `/fortune/quick` 간편 운세
  - `/fortune/personal` 내 사주 운세
  - `/fortune/yearly` 연간운
  - `/fortune/good-days` 길일
  - `/fortune/dream` 꿈해몽
  - `/love/future-partner` 미래 배우자 리포트
  - `/love/couple-report` 커플 궁합 리포트
  - `/love/crush-reunion` 짝사랑·재회 가능성 리포트
  - `/love/report/:reportId` 저장된 연애 리포트 상세
  - `/compatibility` 레거시 경로 (현재 `/love/couple-report`로 리다이렉트)
  - `/mypage` 보관함
  - `/help`, `/privacy`, `/terms`, `/login`

## 화면 책임 분리
- 홈(`/`):
  - 첫 행동 선택(내 사주 시작)을 최우선으로 하는 진입 페이지
  - 관심사 필터와 해석 피드로 보조 탐색 제공
- 내 사주(`/saju`):
  - 단일 질문형 멀티 스텝 입력 퍼널
  - 마지막 단계에서 저장 방식 선택과 결과 미리보기 제공
- 결과(`/result/:resultId`):
  - 질문형 요약 우선 출력
  - 전통 해석(팔자/오행/대운)은 하위 레이어(접기)로 제공
  - 인생 총운(`saju-lifetime-roadmap`)은 Gemini lifetime 응답의 `daeunPeriods`/`goldenPeriods`를 그대로 렌더링
- 운세(`/fortune`):
  - 하위 운세 기능 디렉토리 역할만 수행
  - 실제 데이터 호출은 하위 페이지에서 수행
- 연애(`/love/*`):
  - 사주 중심 3개 서비스(`미래 배우자`, `커플 궁합`, `짝사랑·재회`) 제공
  - 결과는 `상담형 리포트 + 무료 미리보기 + 유료 해제` 구조
  - `reportVersion` 기준으로 `v1-story`와 `v2-counsel`을 동시 조회
- 보관함(`/mypage`):
  - 최근 결과/연애 리포트/레거시 궁합/저장 설정/정책 링크 관리
  - 내 정보 수정(이름/성별/생년월일/태어난 시간/지역) 및 `user_profiles` 동기화

## 핵심 모듈
- `src/components/layout/*`
  - GNB/BottomTab/AppLayout
  - IA 라벨과 모바일/데스크톱 진입 동선 제어
- `src/components/home/*`
  - 홈 Hero, 서비스 카드, 피드, 디렉토리, 신뢰 섹션
- `src/components/fortune/*`
  - 운세 허브/하위 페이지 보조 컴포넌트
- `src/components/love/*`
  - 연애 입력 스텝퍼, 상담형 미리보기 카드, 잠금/해제 UI, 저장 상세 뷰
- `src/components/charts/*`
  - 팔자/오행/대운 시각화 (`대운`은 저장된 lifetime 데이터 기반)
- `src/lib/sajuEngine.ts`
  - 팔자/오행 계산
- `src/lib/loveFeatureEngine.ts`
  - 연애 파생 특징 추출 + 상담형 6축 점수 산출 규칙
- `src/lib/loveReportAdapters.ts`
  - v1/v2 리포트 스키마 호환 및 점수 정규화
- `src/lib/resultStore.ts`
  - secure-results 및 localStorage 저장/조회
- `src/lib/loveReportStore.ts`
  - `love-reports` 호출 및 연애 리포트 로컬 캐시
- `src/lib/geminiClient.ts`
  - Edge Function 호출 래퍼

## 백엔드 경로
- `secure-results`
  - 저장/조회/삭제/전체삭제/이벤트
  - `DATA_ENCRYPTION_KEY` 기반 암호화
- `analyze-saju`
  - 관심사 기반 사주 해석
  - `serviceType=saju-lifetime-roadmap`일 때 lifetime 스키마(`lifetimeScore`, `daeunPeriods`, `goldenPeriods`) 반환
- `daily-fortune`
  - 개인 사주 운세
- `zodiac-fortune`, `star-sign-fortune`
  - 간편 운세
- `dream-interpretation`
  - 꿈해몽
- `yearly-fortune`
  - 연간운
- `good-day-calendar`
  - 길일 조회
- `analyze-compatibility`
  - 궁합 해석
- `love-reports`
  - `create/get_preview/unlock/list/delete`
  - 메뉴별 상담형 리포트 생성
  - 전체 리포트 암호화 저장 + 미리보기 분리 응답
  - 해제된 리포트는 저장 상세 경로에서 재열람 가능

## 배포
- Vercel SPA rewrite: `vercel.json`
- Supabase 수동 배포: `docs/supabase-manual-deploy.md`

## 서비스 카탈로그 단일 소스 규칙 (2026-03-19)
- `CategoryPage`와 `ServiceLandingPage`는 동일한 서비스 카탈로그를 참조해야 한다.
- 서비스 카탈로그는 아래 항목을 단일 ID 기준으로 함께 관리한다.
  - 카드 노출 정보(카테고리, 탭, 우선순위, 뱃지, CTA 라벨)
  - 랜딩 상세 정보(제목, 설명, provider, nextPath)
  - 분석용 서비스 ID(`analysisServiceId`) 매핑
- `/service/:serviceId`는 카탈로그에 없는 ID를 직접 처리하지 않는다.
- 과거 ID는 alias 테이블에서 canonical ID로 해석해 하위 호환을 유지한다.
- 목표: 카드 ID, 라우트 ID, 랜딩 데이터 불일치로 인한 미발견 상태를 컴파일/테스트 단계에서 차단.

## 손금 IA 업데이트 (2026-03-19)
- 손금 카테고리는 개별 카드 나열 대신 메인 손금 분석 1개를 중심으로 구성한다.
- 메인 리포트는 성향, 재물/커리어, 관계, 변화시기 4섹션 고정 구조를 사용한다.
- 제공 정책은 무료 요약 + 프리미엄 상세이며, 관상은 face 탭으로 분리 유지한다.
- palmistry 구형 쿼리(mode=billionaire, mode=history)는 mode=main&section 표준으로 호환 매핑한다.

## 사주 7종 리포트 분리 아키텍처 (2026-03-19)
- 7개 총운 서비스는 카드 ID와 동일한 analysisServiceId를 사용한다.
- analyze-saju는 단일 함수 + serviceType 전략 레지스트리로 분기한다.
- 전략 단위는 systemInstruction / responseSchema / postProcessor로 구성한다.
- saju_results에 report_payload(JSONB), report_template_version(TEXT)를 저장한다.
- lifetime 7종은 `ReportRendererRegistry` 기반으로 서비스별 시그니처 섹션을 렌더한다.
- 2026 신년운세는 `src/components/saju/SajuCollectionTabs.tsx` 전용 패널이 렌더를 담당한다.
  - `saju-2026-overview` / `saju-2026-yearly-outlook`: `7개 핵심 영역 카드(focusCards)` 유지
  - focused 6개 서비스: `focusCards` 제거, 선택 서비스 전용 심화 카드 렌더
- reportPayload가 없는 기존 결과는 레거시 템플릿으로 fallback한다.
## Palm Analysis Pipeline Update (2026-03-19)
- Palm analyze action remains unchanged (`palm_analyze`), but internal backend pipeline is upgraded.
- Edge palm proxy no longer returns deterministic fake analysis on upstream failure.
- Backend palm service now exposes:
  - `/api/palm/analyze` (canonical)
  - `/api/palm-analyze` (legacy alias)
  - `/api/palm-health` (model/runtime health)
- Palm response contract includes `classification`, `features`, `quality`, and `handedness`.
- Error contract uses explicit palm codes:
  - `PALM_INPUT_INVALID`
  - `PALM_QUALITY_LOW`
  - `PALM_BACKEND_UNAVAILABLE`
  - `PALM_ANALYSIS_TIMEOUT`

## Palm Supabase-Only Runtime (2026-03-19)
- Palm analysis no longer depends on Python proxy from Edge.
- Browser computes palm `clientAnalysis` with MediaPipe (`@mediapipe/tasks-vision`).
- Edge Function `palm_analyze` validates clientAnalysis and returns classification/features/quality.
- `ai_palm_qa` continues to use grounded palmResult context only.

## Lifetime 7-Report Differentiation Upgrade (2026-03-24)
- `saju-lifetime-api` prompt now includes a time-anchor context (`currentDate`, `currentYear`, `currentAge`, `timezone`, `ageUpperBound=89`).
- Lifetime timeline contract keeps legacy fields (`lifetimeScore`, `daeunPeriods`, `goldenPeriods`) while enforcing dynamic normalization.
- Fixed legacy windows are auto-corrected to dynamic windows around current age.
- `isCurrent=true` is unified to exactly one period and age range is capped at 89.
- All 7 lifetime services share `coreQuestion`, `coreInsights`, `actionNow`, `evidence`, and `analysisBlocks`.
- Service-specific payloads are expanded for differentiated value delivery.
- Client quality gate re-requests only duplicated services once with a dedupe directive.
- Tab UI shows service-specific core question and full analysis blocks for independent purchase value.

## 2026-03-24 Single-Service Policy (Saju)
- Saju analysis generation is service-scoped: one request creates one service report.
- If both serviceId and mode are present, serviceId always wins.
- Mode defaults are used only when serviceId is absent:
  - lifetime -> saju-lifetime-roadmap
  - new-year-2026 -> saju-2026-overview
- Result view must render only one selected service, including legacy multi-payload records.
- Selection priority:
  unlockedItems -> sourceServiceId -> consultationType -> mode default order -> first payload key

## 2026-03-25 New-Year 7-Tile Policy
- 2026 신년운세 active lineup은 7개 타일로 고정한다.
  - saju-2026-overview
  - saju-2026-study-exam
  - saju-love-focus
  - saju-2026-wealth-business
  - saju-2026-investment-assets
  - saju-2026-career-aptitude
  - saju-2026-health-balance
- `saju-2026-yearly-outlook`는 신규 추천 타일에서 제외하고 legacy 결과/링크 호환만 유지한다.
- overview 계열(`saju-2026-overview`, legacy `saju-2026-yearly-outlook`)만 `focusCards` 7개 고정 순서를 사용한다.
  - 종합 -> 시험·학업 -> 연애·결혼 -> 재물·사업 -> 주식·부동산 투자 -> 직업·적성 -> 건강
- focused 6개 서비스는 서비스별 전용 심화 payload를 사용한다.
  - 시험·학업: `studyRhythm`, `examWindows`, `mistakeTriggers`, `executionGuide`, `evidenceNotes`, `studyActionReport(optional)`
  - 연애·결혼: `relationshipFlow`, `approachSignals`, `cautionPatterns`, `relationshipGuide`, `evidenceNotes`
  - 재물·사업: `cashflowPulse`, `growthAxes`, `leakRisks`, `operatingRules`, `evidenceNotes`, `oneLineDiagnosis`, `keyPoints(3)`, `easyInterpretationPoints`, `annualFlowSummary`, `quarterlyFlowCards(4)`, `revenueFlowDeepDive`, `businessManagementPoints`, `burnoutPreventionStrategies`, `actionChecklist`, `closingLine`
  - 투자: `entryBias`, `watchSignals`, `riskAlerts`, `capitalRules`, `evidenceNotes`, `investmentActionReport(optional)`
  - 직업·적성: `fitRoleSignal`, `strongWorkModes`, `misfitChoices`, `executionChecklist`, `evidenceNotes`
  - 건강: `energyRhythm`, `recoveryPriorities`, `overloadSignals`, `routineChecklist`, `evidenceNotes`
- focused 6개의 내용 규칙:
  - 단일 string 필드는 2~4문장 구체 해석 문단
  - 배열 필드는 2~4개 구체 해석 문장 배열
  - 키워드/태그/한 줄 요약 스타일 금지
- `SajuCollectionTabs` 렌더링 규칙:
  - overview 계열만 `7개 핵심 영역 카드` 섹션을 렌더
  - focused 6개는 `서비스명 + 심화 해석` 제목으로 별도 섹션 렌더
  - focused 카드의 배열 본문은 bullet이 아닌 문장 블록으로 렌더
  - `saju-2026-wealth-business`는 기존 focused 공통 섹션을 유지하고 그 아래에 실행형 10섹션(한 줄 진단, 핵심 포인트 3, 쉬운 해석, 연간 요약, 분기 4카드, 수익 심화, 사업 관리, 번아웃 방지, 체크리스트, 한 줄 결론)을 append
  - `saju-2026-wealth-business`의 분기 카드는 동일 템플릿(`핵심 흐름 + 핵심 포인트 + 리스크 + 행동 전략`)으로 통일하고 체크리스트는 강조 박스로 노출
  - `saju-2026-investment-assets`에서 `investmentActionReport`가 있으면 투자 전용 13개 섹션(핵심 진단/핵심 질문/인사이트 3/지금 액션/절대 조심할 행동/분기별 흐름/자산군별 해석/관망·진입 신호/리스크 경보/실전 체크리스트/쉬운 근거/2027 연결 흐름/최종 결론)을 우선 렌더
  - 투자 전용 13개 섹션이 활성화되면 기존 투자 focused 카드(`진입 판단/관망 신호/리스크 경보/자금 운용 원칙`)와 공통 상단 카드(`핵심 인사이트/지금 액션/근거`) 및 일반 `analysisBlocks`를 중복 노출하지 않는다.
  - `saju-2026-study-exam`에서 `studyActionReport`가 있으면 학업 전용 11개 섹션(핵심 진단/핵심 질문/인사이트 3/즉시 행동 3축/연간 4단계/분기 4구간 상세/시험유형 3종/실패 패턴/성과 전환 전략 3축/쉬운 근거/최종 요약)을 우선 렌더
  - 학업 전용 11개 섹션이 활성화될 때는 기존 학업 5카드(`집중 흐름/승부 시점/실수 패턴/합격 행동/해석 근거`)와 공통 상단 카드(`핵심 인사이트/지금 액션/근거`) 및 일반 `analysisBlocks`를 중복 노출하지 않는다.
- 기존 저장 결과에 전용 필드가 없으면 parser/UI가 `focusCards + sections + analysisBlocks + yearTimeline`을 조합해 런타임 fallback 심화 뷰를 만든다.
  - `investmentActionReport`가 없는 구버전 투자 payload는 parser가 `entryBias/watchSignals/riskAlerts/capitalRules/evidenceNotes + analysisBlocks/yearTimeline/actionPlan90`을 조합해 동일한 13섹션 구조로 보강한다.
  - `studyActionReport`가 없는 구버전 학업 payload는 parser가 `studyRhythm/examWindows/mistakeTriggers/executionGuide/evidenceNotes + analysisBlocks/yearTimeline/coreInsights/actionNow/evidence`를 합성해 동일한 실행전략 섹션 구조로 렌더한다.

## 2026-03-25 Deterministic Trend Pipeline (Wealth/Energy)
- Data flow:
  - Input context: `palja`, `oheng`, `yongsin`, `profileMeta(timezone/currentYear)`.
  - Engine: `src/lib/sajuTrendEngine.ts`
    - `buildDeterministicWealthTrend`
    - `buildDeterministicEnergyTrend`
  - Output: `series(0~100)` + `pointEvidence[]` with `rawBasis.source="manseryeok"`.
- Parser rule:
  - `src/lib/geminiClient.ts` ignores model-provided chart series for wealth/energy.
  - parser always writes deterministic series and evidence into final payload.
  - model output remains limited to narrative fields (`cashflowMap`, `energyCurve`, `analysisBlocks`, etc.).
- UI rule:
  - `src/components/saju/SajuCollectionTabs.tsx` reuses deterministic engine for render-time hydration.
  - `src/components/saju/SajuTrendChart.tsx` renders chart + evidence table + expandable `근거 보기`.
  - legacy payloads without evidence are automatically supplemented at render path.


## 2026-03-28 Career Timing Long-Flow Rendering
- 대상 컴포넌트:
  - `src/components/saju/SajuCollectionTabs.tsx`
  - `src/lib/reportRenderers.ts`
- 렌더 순서(커리어 서비스 전용):
  1. `careerArcSummary` (커리어 장기축 요약)
  2. `stageFlow[4]` (초기 축적기/전환기/확장기/안정화기)
  3. `transitionSignal` + `stageFlow[].transitionSignal` (단계 전환 신호)
  4. `decideNow/deferNow/decisionCriteria` (결정 매트릭스)
  5. `currentYearFocus` (현재 연도 적용 포인트, 보조)
  6. `supplement.executionProtocol` (단기 실행, 최하단 보조)
- 공통 상단 카드(`coreInsights/actionNow/evidence`)는 커리어 서비스에서 비활성화한다.
- 하위호환 정책:
  - 구버전 payload(`stageFlow` 없음)도 파서 fallback으로 4단계를 생성해 동일 UI 순서로 렌더한다.
