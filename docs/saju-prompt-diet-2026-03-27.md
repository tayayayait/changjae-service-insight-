# Saju Prompt Diet (2026-03-27)

## Goal
- Reduce first-generation latency by lowering prompt token volume.
- Keep model, response schema contracts, and parser normalization rules unchanged.

## Scope
- `supabase/functions/_shared/prompt-templates.ts`
- `supabase/functions/saju-lifetime-api/index.ts`
- `supabase/functions/saju-yearly-api/index.ts`

## Changes
1. Output guard compression (`prompt-templates.ts`)
- Kept core constraints.
- Removed duplicated or verbose guard phrasing.
- Preserved critical quality constraints:
  - required JSON shape and non-empty required arrays
  - deterministic chart-number rule
  - 2026 overview/focused branching rules
  - daeun enum validity
  - cross-service duplication limit

2. Prompt context compacting (`saju-lifetime-api`, `saju-yearly-api`)
- Replaced full `profileMeta` dump with compact anchor subset:
  - `timezone`
  - `solarDate`
  - `birthPrecision`
  - `currentYear`
- Removed duplicated `Current Date (ISO)` line where local time-anchor context already exists.

## Quality Guard
- No model switch.
- No schema key removal.
- No parser/normalizer logic change.
- Only prompt verbosity reduced.

