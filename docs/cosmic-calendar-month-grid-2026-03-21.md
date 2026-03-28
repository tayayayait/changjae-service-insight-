# Cosmic Monthly Guide Deterministic Redesign (2026-03-21)

## Summary
- Endpoint: `/functions/v1/astrology-cosmic-api`
- Page: `/astrology/calendar`
- Goal: same profile + same year/month must return the same monthly guide.
- Basis: `CircularNatalHoroscopeJS@1.1.0` transit calculations only.
- AI narrative generation is removed from cosmic monthly flow.

## What Changed
- Server path is now single-path deterministic:
  - `buildNatalChart` -> `buildTransitMonth` -> `buildCalendarFallback`
  - No Gemini call and no AI merge step.
- `buildTransitMonth` now analyzes all days of target month at local `12:00` instead of fixed 3 days.
- Transit dedupe key is fixed:
  - `transitPlanet + natalPlanet + aspectType`
  - winner rule: higher impact first, then lower orb.
- Phase guide signals are selected per fixed bucket:
  - `early: 1-10`
  - `mid: 11-20`
  - `late: 21-end`

## Contract Update
`AstrologyCalendarResult` top-level stays the same.
`deepData` is expanded and required in deterministic payload:
- `generationMode: "deterministic"`
- `calculationBasis: "CircularNatalHoroscopeJS@1.1.0"`
- `analysisWindow: { year, month, daysAnalyzed, transitTime: "12:00", phaseBuckets: ["1-10","11-20","21-end"] }`
- `birthTimeAccuracy: "known" | "unknown"`
- `sourceNotes`, `transits`, `rawReport?` 유지

## Error Handling
- If circular engine calculation fails, server returns explicit error payload:
  - `code: CALC_ENGINE_UNAVAILABLE`
  - HTTP `503`
- Client no longer synthesizes generic monthly fallback text.
- Page shows engine-unavailable state message instead of fake guide data.

## Client Normalization Policy
- Calendar payload normalization is strict.
- Missing required blocks now throw errors instead of auto-filling with client fallback content.
- This prevents mixed outputs and enforces deterministic contract integrity.

## Access Control (2026-03-21)
- Route `/astrology/calendar` is now protected by auth guard.
- Guest direct access is blocked and redirected to `/login`.
- Personalized monthly report visibility is now limited to authenticated users.

## Tests Updated
- `src/test/astrologyClient.calendar.test.ts`
  - accepts complete deterministic payload
  - rejects incomplete contract payload
  - keeps empty `expertNotes` valid
- `src/test/cosmic.calendar.page.test.tsx`
  - deterministic content render
  - empty `expertNotes` safe render
  - engine unavailable error-state render

## Input Isolation Update (2026-03-24)
- Cosmic calendar execution no longer starts automatically on page enter.
- The service runs only after the user manually submits profile fields on `/astrology/calendar`.
- Input source for this service is now page-local only:
  - no `useAuthStore.profile` prefill
  - no `useConsultStore.userProfile` prefill
- Refresh/retry uses only the last profile that was manually submitted on the same screen.
- This change blocks cross-service personal-data carry-over in multi-user environments.

## KST Month Rollover Policy (2026-03-27)
- Month heading now follows KST (`Asia/Seoul`) even when the tab stays open.
- At KST month boundary, the page updates heading year/month automatically without reload.
- Cosmic data is not auto-regenerated at boundary:
  - monthly report generation still requires manual user input + run action.
  - existing result and submitted profile state are cleared on month rollover.
- Re-run dedupe policy:
  - same `year/month + same input profile` in the same tab reuses in-memory result.
  - this avoids duplicate API recalculation for repeated identical submissions.
  - cache scope is in-memory only (no `sessionStorage`/`localStorage` persistence).
