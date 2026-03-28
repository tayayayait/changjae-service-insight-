# Daily Astrology Reliability Notes (2026-03-21)

## Goal
`/astrology/daily` is a public sign-based daily horoscope.
It must return deterministic, actionable output per selected sign and date.

## Runtime Policy
- No client-side fallback report generation for `today` results.
- No server fallback (`meta.source = fallback`) acceptance in the client.
- `astrology-daily-api` is fixed to deterministic `sign_context` generation.
- Profile data is not used for daily content generation.
- Same input (`requestDate + sign`) returns the same markdown output.
- Different sign on the same date must return different actionable content.

## Retry Policy
- Timeout per attempt: `15s`
- Max attempts: `3`
- Delay between attempts: `800ms`

## UI Policy (`src/pages/DailyAstrologyPage.tsx`)
- Keep only two states:
  - success: verified realtime result
  - error: unavailable message
- Profile birthday may be used for initial sign auto-selection only.
- After pressing `다른 별자리 운세 보기`, keep manual sign selection mode for the page session.
- Data provenance card should show:
  - basis: `sign_context`
  - CircularNatalHoroscopeJS usage: `아니오`

## CircularNatalHoroscopeJS Verification Rule (Daily)
- Daily page marks `아니오` when `meta.basis === sign_context`.
- Daily page marks `예` only if backend explicitly returns `circular_natal_chart` (not expected in current policy).
- Daily page marks `확실한 정보 없음` when metadata is missing.
- Current deterministic engine label for daily:
  - `deterministic_sign_context_v1`

## Tests Updated
- `src/test/astrologyClient.today.test.ts`
  - retries on timeout
  - throws on full timeout exhaustion
  - rejects fallback-source payload
  - allows `sign_context` even with profile context provided
  - sends only `requestDate` in `today` payload
- `src/test/daily.astrology.auto-sign.test.tsx`
  - profile auto-select works
  - API context does not include `profile`
- `src/test/daily.astrology.page.test.tsx`
  - renders realtime success with `sign_context` provenance
  - handles unavailable -> retry -> success
  - keeps manual selection after back navigation
