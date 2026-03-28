# 데이터 플로우 (UTF-8 정리본, 2026-03-25)

## 1) 사주 분석 플로우
1. 입력: 달력 모드, 생년월일시, 출생지, 성별, 관심사
2. 계산: `calculateSaju()`
3. 해석 요청: `analyze-saju`
4. 저장: `secure-results(save_saju)`
5. 출력: `ResultPage`

### 1-1) 사주 결과 화면 CTA/잠금 UI 정책 (2026-03-27)
- 결제 전(`result.isLocked=true`) 하단 고정 액션바:
  - 좌측: `조건 다시 입력`
  - 우측: `전체 리포트 열기 · 2,900원`
  - `저장 및 공유` 버튼은 노출하지 않는다.
- 결제 후(`result.isLocked=false`) 전체 리포트 화면:
  - `저장 및 공유` 버튼을 노출한다.
- 전체 리포트/결제 유도 영역의 잠금 아이콘은 단일 컴포넌트(`PaywallLockIcon`)로 통일한다.

## 2) 운세 허브 플로우
1. 진입: `/fortune`
2. 서비스:
   - `quick` (비회원 가능)
   - `personal` (저장 가능)
   - `dream` (저장 가능)
   - `yearly` (비회원 가능)
   - `good-days` (비회원 가능)
3. 실패 처리:
   - 에러 상태 + 재시도 UI
   - 임의 점수/문구 자동 생성 없음

## 2-1) 유료 리포트 통합 가격 정책 (2026-03-27)
- 대상: `인생 총운` 7개 서비스, `2026 신년 운세` 7개 서비스, `오늘의 운세` 전체, `연애/궁합`(미래 배우자·커플 궁합·재회 가능성), `점성학`(인생 설계도).
- 기준 가격: 모든 대상 서비스 결제 금액은 `2,900원`으로 고정.
- 노출 기준:
  - 서비스 소개 배지/문구는 `₩2,900`으로 통일.
  - 결제창 금액/결제 버튼 텍스트도 동일 기준 적용.
  - 오늘의 운세 카테고리 카드는 `/service/saju-today-briefing`으로 진입해 결제를 선행한다.

## 2-2) AI 사주상담 채팅 플로우 (2026-03-27)
1. 접근 제어: `/chat`는 `RequireAuth(requireProfile=true)`로 보호된다.
2. 소유자 키: 채팅 차감/결제 모두 `owner:user:<auth-id>` 기준으로 동작한다.
3. 무료 정책:
   - 무료 질문은 24시간 윈도우에서 `2회` 제공된다.
   - 첫 무료 사용 시각이 `free_window_started_at`으로 기록된다.
   - `free_window_started_at + 24시간`이 지나면 무료 사용량이 자동 복구된다.
4. 차감/복구:
   - 차감은 `saju-chat-api -> chat_credit_consume` 경로만 사용한다.
   - AI 실패 환불은 `chat_credit_refund` RPC로 처리한다.
5. 유료 정책:
   - 추가 질문은 `saju-ai-chat` 10회권 `2,000원` 결제로 충전된다.
   - 결제 주문 생성 시 `PaymentCheckoutSheet.ownerKeyOverride`로 auth owner key를 강제한다.
   - `create-order`는 `owner:user:<uuid>` 입력 시 `orders.user_id`/`reports.user_id`를 함께 저장한다.
   - `saju-ai-chat` 주문은 `owner_key` 또는 `user_id`를 주문 레코드에 남기지 못하면 생성 실패 처리한다.
6. UI 타이머:
   - `chat_credit_status`/chat 응답의 `next_free_reset_at`을 `nextFreeResetAt`으로 사용한다.
   - 무료 사용 이력이 있을 때만 `ChatSessionToolbar` 우측 상단에 `다음 무료 복구 HH:MM:SS`를 노출한다.
   - 타이머가 0에 도달하면 `refreshQuota()`를 1회 호출해 복구 상태를 동기화한다.
7. 결제 성공 직후 반영:
   - `payment-webhook` 응답에 `chatCredit`이 포함되면 클라이언트가 즉시 `remaining/total`을 갱신한다.
   - 이후 `refreshQuota()`를 백그라운드로 재호출해 서버 정합성을 검증한다.
   - webhook 재시도 시 owner 해석 우선순위는 `orders.owner_key` -> `owner:user:${orders.user_id}`이다.

## 3) 러브 리포트 v3 플로우
1. 입력: 본인/상대 생년월일시 + 관계 맥락
2. 계산: `calculateSaju()` -> `extractLoveFeatureSet()` -> `calculateLoveScoreSet()`
3. 생성: `love-reports(create)` (preview + locked summaries)
4. 결제 후 해제: `love-reports(unlock)` -> `is_unlocked=true`
5. 재열람: `/love/report/:reportId` -> `love-reports(get_preview)`

## 4) 점성 나탈 리포트 v5 플로우 (소비자 중심 9섹션 + 결제 잠금)
1. 입력: 이름, 생년월일시, 좌표, `birthTimeKnown`
2. 요청: `getAstrologyBirthReport()` (`action="birth_report"`)
3. 백엔드 생성:
   - `astrology-natal-api`
   - 캐시 키: `astrology_reports` + `template_version="v5"` + fingerprint
   - 미스 시 fallback + Gemini 병합
4. 응답 계약:
   - `AstrologyBirthReportResult v5`
   - `exclusiveInsights` 포함
5. 화면 렌더:
   - `PersonalitySummary` 다음에 `ExclusiveInsightsSection`
   - 결제 완료 사용자만 리포트 화면 진입
   - 리포트 진입 후 전체 본문 즉시 노출 (부분 잠금 없음)
6. 결제:
   - `PaymentCheckoutSheet` -> `create-order`
   - 성공 후 `payment-webhook` 호출
   - `reports.is_unlocked=true`
   - 라우팅: `/astrology/purchased/:reportId`
   - 로컬 QA 시 `VITE_ASTROLOGY_ASSUME_PAID=true`이면 주문/결제/웹훅을 생략하고 inline payload로 진입
7. 재열람:
   - `/my-reports` -> `lookup-reports(mode="list")`
   - 상세 조회: `lookup-reports(mode="report")`
   - 소유자 검증 통과 + `is_unlocked=true`일 때만 `report_payload` 반환

## 5) 손금 플로우 (v2)
1. 이미지 업로드
2. 분석: `action="palm_analyze_v2"`
3. 오버레이 좌표 sanitize (Edge + Client)
4. 결과: 오버레이 + 4섹션 요약 + Q&A

## 6) 이벤트/삭제/운영
- 이벤트: `trackEvent()` -> `secure-results(track_event)`
- 개별 삭제: `delete_*`
- 전체 삭제: `clear_all`
- Seed: `supabase/config.toml`에서 seed 기본 비활성

## 2026-03-27 Payment Entry Unification (2,900 KRW)
- Scope: Saju + Love + Astrology paid report screens priced at 2,900 KRW.
- Unified entry: every 2,900 KRW unlock button opens `PaymentCheckoutSheet` and triggers PortOne/KG Inicis checkout.
- Forced real checkout: all 2,900 KRW paths now set `assumePaid=false` explicitly.
- Post-payment policy:
  - Saju result page: immediately set local `isLocked=false` and append paid `serviceId` to `unlockedItems`, then reload the same result once.
  - Love reports: call `unlockLoveReport` after payment success, passing `provider=portone` and `providerOrderId=<orderNumber>`.
  - Astrology result page: run existing unlock update (`astrology_reports.is_unlocked=true`) only after payment success.
- Out of scope: webhook-centric backend redesign across all domains.
  - Includes no retroactive auto-recovery for already-paid historical lock mismatches.

## 2026-03-27 Checkout Modal Responsive Fit (AI 사주상담 포함)
- Target: `PaymentCheckoutSheet` (`src/components/common/PaymentCheckoutSheet.tsx`)
- UI sizing update:
  - Width: `w-[calc(100vw-1rem)] max-w-[720px]`로 축소
  - Height: `max-h-[78dvh] sm:max-h-[84dvh]` 적용
  - Mobile density: 패딩/입력 높이/CTA 높이를 모바일 기준으로 한 단계 축소
- Goal: 작은 화면과 좁은 뷰포트에서 결제 정보 입력 카드가 화면 밖으로 잘리지 않도록 안정적으로 노출

## 2026-03-27 Chat Quota Gate CTA Simplification
- Scope: `/chat` quota gate (`src/pages/ChatPage.tsx`).
- Behavior update:
  - When the quota gate is active and `PaymentCheckoutSheet` is open, `ServiceIntroScreen` overlay is hidden.
  - Intro CTA text is now `결제â 다시 열기` and is only shown after the checkout sheet is closed.
- Rationale: prevent duplicate payment prompts because payment info is already entered inside `PaymentCheckoutSheet`.
