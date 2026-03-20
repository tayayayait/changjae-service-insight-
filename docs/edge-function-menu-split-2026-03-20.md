# Edge Function 메뉴 1:1 분리 적용 (2026-03-20)

## 변경 요약
- 메뉴 기준 분리 원칙을 적용해 신규 Edge Function 엔드포인트를 추가했다.
- 기존 함수는 코어로 유지하고, 신규 함수는 래퍼(프록시) 방식으로 연결했다.
- 레거시 기능은 즉시 삭제하지 않고 Soft-Deprecate 정책으로 운영한다.

## 신규 함수 매핑
- `saju-lifetime-api` -> `analyze-saju`
- `saju-daily-api` -> `daily-fortune`
- `saju-yearly-api` -> `yearly-fortune`
- `astrology-natal-api` -> `astrology-api` (`birth/birth_report/synastry/transit/ai_*`)
- `astrology-cosmic-api` -> `astrology-api` (`ai_calendar`)
- `astrology-daily-api` -> `astrology-api` (`today`)
- `palmistry-scanner-api` -> `astrology-api` (`palm_analyze/ai_palm_qa`)
- `love-future-partner-api` -> `love-reports` (`create`, serviceType 강제)
- `love-couple-report-api` -> `love-reports` (`create`, serviceType 강제)
- `love-crush-reunion-api` -> `love-reports` (`create`, serviceType 강제)
- `love-reports-center` -> `love-reports` (`create/get_preview/unlock/list/delete`)

## 프론트 호출 변경
- `src/lib/astrologyClient.ts`:
  - action별 함수명을 분리했다.
  - `today`는 `astrology-daily-api`, 손금은 `palmistry-scanner-api`로 호출한다.
- `src/lib/geminiClient.ts`:
  - 사주 호출을 `saju-lifetime-api`, `saju-daily-api`, `saju-yearly-api`로 전환했다.
  - 연간 운세 `months` 정렬을 `1월 -> 12월` 오름차순으로 강제했다.
- `src/lib/loveReportStore.ts`:
  - `create`는 서비스 타입별 함수로 분기한다.
  - 나머지 액션은 `love-reports-center`를 사용한다.

## 레거시 라우트 처리
- `/compatibility` -> `/love/couple-report`
- `/astrology/synastry` -> `/love/couple-report`
- `/fortune/quick` -> `/category/saju?tab=today`
- `/fortune/good-days` -> `/astrology/calendar`
- `/fortune/dream` -> `/category/saju?tab=today`

위 경로는 즉시 차단하지 않고 안내 메시지 후 리다이렉트한다.

## 배포 대상 함수
```bash
supabase functions deploy saju-lifetime-api --no-verify-jwt
supabase functions deploy saju-daily-api --no-verify-jwt
supabase functions deploy saju-yearly-api --no-verify-jwt
supabase functions deploy astrology-natal-api --no-verify-jwt
supabase functions deploy astrology-cosmic-api --no-verify-jwt
supabase functions deploy astrology-daily-api --no-verify-jwt
supabase functions deploy palmistry-scanner-api --no-verify-jwt
supabase functions deploy love-future-partner-api --no-verify-jwt
supabase functions deploy love-couple-report-api --no-verify-jwt
supabase functions deploy love-crush-reunion-api --no-verify-jwt
supabase functions deploy love-reports-center --no-verify-jwt
```

## 유지/정리 정책
- 즉시 유지(코어): `analyze-saju`, `daily-fortune`, `yearly-fortune`, `astrology-api`, `love-reports`, `secure-results`
- Soft-Deprecate: `zodiac-fortune`, `star-sign-fortune`, `good-day-calendar`, `dream-interpretation`, `analyze-compatibility`
- 하드 삭제는 트래픽/로그 확인 후 별도 배치에서 진행한다.
