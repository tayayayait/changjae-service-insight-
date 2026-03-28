# Astrology Backend (v5, 2026-03-28)

## Scope
- `/functions/v1/astrology-natal-api`
  - `birth`: natal chart calculation
  - `birth_report`: v5 report generation and cache write
- `/functions/v1/lookup-reports`
  - paid report reopen
  - returns the stored payload as originally generated

## v5 Contract (`AstrologyBirthReportResult`)
- Core fields:
  - `hero.headline`, `hero.topInsights[3]`
  - `popularQuestions[5]` (`love|work|money|recovery|luck`)
  - `lifePatterns.relationship|work|money|recovery`
    - `pattern`
    - `problemManifestation`
    - `trigger`
    - `recommendedAction`
  - `currentWindow.month|quarter`
    - `focus`, `avoid`, `routine`, `basis[]`, `cacheKey`
  - `confidence`
    - `score`, `level`, `summary`, `reasons[]`, `uncertainAreas[]`, `birthTimeKnown`
  - `deepData`, `meta(templateVersion="v4"|"v5")`
- Compatibility:
  - legacy payloads are still normalized on the frontend

## Generation Flow
1. Normalize request with `normalizeBirthRequest`
2. Look up cached `template_version="v5"` payload
3. On cache miss:
   - build natal fallback with `buildBirthReportFallback`
   - generate `hero`, `popularQuestions`, `lifePatterns` from AI
   - generate `currentWindow` from deterministic transit logic
4. Merge and sanitize into the v5 payload
5. Upsert into `astrology_reports`

## Reopen Policy
- `lookup-reports` does not refresh `currentWindow`
- reopening shows the report exactly as it was generated at purchase time
- if `report_payload` is empty, it can be generated once and then stored

## Reliability Rules
- `birthTimeKnown=false` must not be overstated
- `currentWindow` is transit-based at generation time
- `cacheKey` format remains `YYYY-MM@Asia/Seoul`

## Versioning
- new writes use v5 only
- old v4 payloads are normalized on read in the frontend
