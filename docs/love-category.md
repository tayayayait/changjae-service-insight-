# 연애·궁합 카테고리 v2

## 1) 서비스 IA
- `미래 배우자` (`/love/future-partner`)
- `커플 궁합` (`/love/couple-report`)
- `짝사랑·재회` (`/love/crush-reunion`)
- 저장된 리포트 상세: `/love/report/:reportId`
- `별자리 궁합(시나스트리)`는 계속 `점성학` 카테고리로 유지 (`/astrology/synastry`)

## 2) 결과 구조
- 공통 결과 포맷: `상담 세션형 6섹션`
  - `opening`: 오프닝 진단
  - `self-pattern`: 관계 패턴
  - `dynamic`: 상호작용 지도
  - `scenario`: 현실 분기점
  - `prescription`: 상담 처방전
  - `evidence`: 해석 근거 노트
- 공통 점수 포맷: `overall / pull / pace / alignment / repair / timing`
- 모든 섹션 문법은 `결론 -> 이유 -> 행동` 순서를 유지한다.

## 3) 무료/유료 정책
- 무료 미리보기
  - 한 줄 진단
  - 관계 온도
  - 지금 필요한 행동
  - `opening` 섹션 전체
  - `scenarioHint` 1문장
  - 잠금 섹션 효용 카드
- 유료 해제
  - 전체 상담 섹션
  - `actionPlan`
  - `avoidList`
  - `conversationPrompts`
  - `confidenceNotes`
  - 재열람
- 권장 가격
  - 미래 배우자: `4,900원`
  - 커플 궁합: `6,900원`
  - 짝사랑·재회: `5,900원`

## 4) 메뉴별 톤 분기
- `future-partner`
  - 탐색형 상담
  - 현재 특정 상대 비교 문법 금지
  - 질문 중심: `어떤 사람에게 안정적으로 끌리는가`, `어떤 관계 패턴을 피해야 하는가`
- `couple-report`
  - 중립적 관계 상담
  - 생활/돈/결혼/회복 구조 설명 우선
  - 단순 `잘 맞음/안 맞음` 판정 금지
- `crush-reunion`
  - 냉정한 시나리오형 상담
  - `가능성 있음 / 제한적 / 확실한 정보 없음` 판단 언어 강제
  - 희망고문성 표현 금지

## 5) API 계약 (`love-reports`)
- 액션: `create`, `get_preview`, `unlock`, `list`, `delete`
- `create` 응답
  - `reportVersion = v2-counsel`
  - `menuVariant = serviceType`
  - `preview.openSection`
  - `preview.lockedSectionSummaries`
  - `preview.ctaReason`
  - `preview.confidenceSummary`
- `unlock` 응답
  - `fullReport.sections`
  - `fullReport.actionPlan`
  - `fullReport.avoidList`
  - `fullReport.conversationPrompts`
  - `fullReport.confidenceNotes`
- `get_preview`
  - 잠금 리포트는 preview만 반환
  - 해제 리포트는 full report까지 반환하여 저장 상세 경로에서 재열람 가능
- 레거시 v1 리포트는 `reportVersion`이 없거나 `v1-story`이면 기존 스토리형 뷰로 렌더링한다.

## 6) 저장 구조
- `love_reports`
  - `report_version`
  - `menu_variant`
  - `score_set`은 v2 점수 구조 저장
  - `preview_json`은 상담형 preview 구조 저장
  - `full_report_enc`는 상담형 full report 전체 암호화 저장
- `love_report_orders`
  - v2도 기존 entitlement 경계를 유지한다.

## 7) Input UX
- 모든 `love` 서비스는 출생정보 2열 레이아웃을 유지하고, `관계 맥락`만 4-step 선택형으로 처리한다.
  - 좌측: 나의 정보
  - 우측: 상대 정보 또는 미래 배우자 가정 입력
- 관계 맥락 step 구조
  - `Step 1`: 상황 선택
  - `Step 2`: 분기 상세 질문
  - `Step 3`: 원하는 결과/관심 초점
  - `Step 4`: 검토 후 제출
- 각 step은 질문 1개를 원칙으로 하며, 필요 시 보조 질문과 `정확한 날짜(선택)` 입력만 추가한다.
- `모름/애매함` 선택지는 모든 분기에서 항상 노출한다.
- 최종 제출 시 `contextSummary`, `contextAnswers(question+answer 라벨)`, `scenarioKey`, `additionalNote`를 함께 저장한다.
- 레거시 호환 필드(`currentStatus`, `desiredOutcome`, `preferredRelationshipStyle`, `concerns`, `lastContactAt`)는 계속 채운다.
- CTA 문구
  - 미래 배우자: `미래 인연 상담 시작`
  - 커플 궁합: `커플 상담 시작`
  - 짝사랑·재회: `재회 가능성 상담 시작`

## 8) 저장 상세/보관함 정책
- 보관함 `연애` 탭은 `love_reports`를 조회한다.
- 연애 리포트 열기 버튼은 `/love/report/:reportId`로 이동한다.
- 저장된 v1 리포트는 레거시 뷰를 유지한다.
- 신규 생성분만 `v2-counsel` 뷰를 사용한다.
