# Saju Generation Cache Stage 1 (2026-03-27)

## Goal
- Improve report generation latency without changing model, prompt strategy, or output schema quality policy.
- Apply cache only when the request context is effectively the same.

## Scope
- `supabase/functions/saju-lifetime-api/index.ts`
- `supabase/functions/saju-yearly-api/index.ts`
- Shared helper: `supabase/functions/_shared/saju-generation-cache.ts`

## Data Model
- New table: `saju_generation_cache`
  - `cache_key` (PK)
  - `service_type`
  - `report_template_version`
  - `response_payload` (JSONB)
  - `created_at`, `updated_at`, `last_hit_at`
- Migration: `supabase/migrations/20260327123000_add_saju_generation_cache_table.sql`

## Cache Key Policy
- Deterministic SHA-256 hash over canonicalized JSON payload.
- Key inputs include:
  - cache version
  - service type
  - report template version
  - request context (`sajuData`, `interests`, `freeQuestion`, `targetYear`, and lifetime time-anchor fields)
- `requestMeta.traceId` is excluded.

## Runtime Behavior
1. Compute key.
2. Try cache read.
3. On hit, return cached `response_payload` immediately.
4. On miss, call Gemini as before.
5. If Gemini output is valid JSON, upsert cache row.

## Quality Guard
- No model downgrade.
- No schema contract change.
- No parser normalization rule change.
- Cache stores and replays model JSON payload only for identical key context.

