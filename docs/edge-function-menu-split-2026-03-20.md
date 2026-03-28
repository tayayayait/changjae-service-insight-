# Edge Function Canonical 운영 기준 (2026-03-20)

## 목적
- `supabase/functions`를 메뉴/도메인 기준 Canonical 함수만 유지하도록 정리한다.
- 하나의 함수에 다기능을 몰아넣던 구조를 제거해 배포/디버깅 리스크를 낮춘다.
- 이번 기준에서는 레거시 함수도 소스에서 제거하고 Canonical만 재배포한다.

## 최종 유지 함수 (Canonical)
- `secure-results`
- `saju-lifetime-api`
- `saju-daily-api`
- `saju-yearly-api`
- `astrology-daily-api`
- `astrology-cosmic-api`
- `astrology-natal-api`
- `palmistry-scanner-api`
- `love-future-partner-api`
- `love-couple-report-api`
- `love-crush-reunion-api`
- `love-reports-center`

## 제거 대상 함수
- `analyze-saju`
- `daily-fortune`
- `yearly-fortune`
- `astrology-api`
- `love-reports`
- `palmistry-vision-api`
- `analyze-compatibility`
- `zodiac-fortune`
- `star-sign-fortune`
- `dream-interpretation`
- `good-day-calendar`

## config.toml 기준
- `[functions.*]` 블록은 Canonical 12개만 남긴다.
- 제거 대상 함수 블록은 모두 삭제한다.

## 배포 순서
```bash
npx supabase functions deploy saju-lifetime-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy saju-daily-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy saju-yearly-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy astrology-daily-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy astrology-cosmic-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy astrology-natal-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy palmistry-scanner-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy love-future-partner-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy love-couple-report-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy love-crush-reunion-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy love-reports-center --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy secure-results --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

## 비고
- `/fortune/quick`, `/fortune/good-days`, `/fortune/dream`, `/compatibility`는 앱 라우터에서 LegacyRedirect로 우회된다.
- 프론트 메인 동선은 Canonical 함수만 사용한다.
