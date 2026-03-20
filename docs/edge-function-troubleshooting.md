# Edge Function Troubleshooting

## Symptom A: Browser shows CORS preflight failure for `analyze-saju`

Example browser errors:

- `Response to preflight request doesn't pass access control check`
- `FunctionsFetchError: Failed to send a request to the Edge Function`

### Verified cause

If the function crashes during module load, the `OPTIONS` handler never runs.  
This appears in the browser as a CORS error, even when CORS headers are correct.

For this project, one confirmed case was `supabase/functions/analyze-saju/index.ts` where `apiKey` declaration was broken, causing boot failure before `serve(...)`.

### Fix checklist

1. Ensure `analyze-saju/index.ts` has a valid top-level `apiKey` declaration.
2. Redeploy `analyze-saju` after code changes.
3. Verify `OPTIONS` returns `200`:
   - `curl -i -X OPTIONS https://<project-ref>.supabase.co/functions/v1/analyze-saju`

## Symptom B: `secure-results` returns HTTP 500

### Common causes

1. Missing required Edge Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (or `SERVICE_ROLE_KEY`)
   - `DATA_ENCRYPTION_KEY`
2. Request sent without both auth token and `x-guest-id`.
3. The database schema is missing required tables such as `analytics_events`.
4. The function creates a service-role client but still forwards the caller `Authorization` header, causing guest writes to run under caller/RLS context instead of admin context.
5. Caller has a valid auth user id but no `user_profiles` row yet, while target table `user_id` foreign key points to `user_profiles(id)`.

## Symptom C: `secure-results` logs `Expected property name or '}' in JSON`

### Verified cause

This is a request body parse failure, not a database or CORS failure.

In this project, browser calls made through `supabase.functions.invoke(...)` send valid JSON. A common way to reproduce this error incorrectly is sending manual `curl` requests from PowerShell with broken quoting.

### Fix checklist

1. If this happened during manual testing, stop using raw PowerShell `curl` with inline JSON unless quoting is verified.
2. Prefer app calls, `supabase.functions.invoke(...)`, or a small `fetch(...)` script for verification.
3. `secure-results` now returns `400 invalid JSON request body` for malformed requests after redeploy.

### Fix checklist

1. Confirm secrets are set in Supabase project secrets.
2. Confirm client includes `x-guest-id` header for guest mode.
3. Check Edge Function logs in Supabase dashboard for the exact thrown error.
4. If log contains `analytics_events_user_id_fkey`, ensure latest `secure-results` is deployed. The current function now checks `user_profiles` existence and falls back to `guest_id` ownership when profile row is missing.

## Symptom D: `analyze-saju` returns HTTP 401

### Verified cause

Function was configured with JWT verification enabled (`verify_jwt = true`) while guest-mode requests call it without a user JWT.

### Fix checklist

1. Set guest-mode AI functions to `verify_jwt = false` in `supabase/config.toml`:
   - `analyze-saju`
   - `daily-fortune`
   - `zodiac-fortune`
   - `star-sign-fortune`
   - `yearly-fortune`
   - `good-day-calendar`
   - `dream-interpretation`
   - `analyze-compatibility`
2. Redeploy those functions with `--no-verify-jwt`.
3. Re-test from browser and confirm relevant `POST /functions/v1/*` calls return `200`.

## Symptom E: `secure-results` logs `invalid claim: missing sub claim`

### Verified cause

This is usually a guest request carrying a non-user token (for example anon key style token) in `Authorization`.
If the function blindly calls `auth.getUser(token)`, Supabase Auth can report `missing sub claim`.

### Fix checklist

1. Extract JWT payload first and check whether `sub` claim exists.
2. If `sub` is missing, skip `auth.getUser()` and treat as guest (`x-guest-id` path).
3. Log this branch as `info`/`warn`, not `error`.

## Symptom F: UI stays on loading forever during report generation

### Verified cause

When an Edge Function request stays pending (no response, no explicit failure), `supabase.functions.invoke(...)` can wait indefinitely and keep submit/loading state locked.

### Fix checklist

1. Add explicit client-side timeout guard for user-facing invoke calls.
2. Convert timeout to a normal rejected error so `catch/finally` paths run.
3. Ensure timeout failure clears submit/loading state and keeps retry available.

### Project status (2026-03-19)

- `src/lib/loveReportStore.ts` enforces invoke timeout by action:
  - `create`: 45 seconds
  - `get_preview`, `unlock`, `list`, `delete`: 15 seconds
- Regression test added: `src/test/loveReportStore.test.ts` verifies unresolved `create` rejects on timeout.

## Symptom G: Lifetime services regenerate the same report repeatedly

### Verified cause

When the same birth profile/interests request is submitted multiple times, previous flow always called `analyze-saju` again because there was no request fingerprint lookup.

### Fix checklist

1. Compute deterministic request fingerprint before analyze call.
2. Query existing result by fingerprint (`get_saju_by_fingerprint`) before generation.
3. On cache hit, route directly to existing `/result/:id`.
4. Persist fingerprint metadata on `save_saju` for future reuse.

## Symptom H: `/astrology/daily`가 무한 로딩에 고정됨

### Verified cause

- `today` 업스트림 응답이 18~20초 구간으로 지연되면, 클라이언트 타임아웃이 먼저 만료되어 간헐 실패가 발생함.
- 배포된 `astrology-api` 버전이 로컬 코드와 다르면(배포 드리프트), 구형 fallback 포맷이 내려와 UI/기대 동작이 불일치할 수 있음.

### Fix checklist

1. `today` 전용 타임아웃 예산을 역전되지 않게 조정한다.
2. 클라이언트는 10초 타임아웃 + 1회 자동 재시도(300ms 지연)를 적용한다.
3. Edge `today` 프록시는 전용 8초 타임아웃을 적용하고 실패 시 즉시 fallback을 반환한다.
4. `today` 응답에 `meta.source/meta.reason`를 추가해 fallback 여부를 추적한다.
5. 최종 실패 시에만 오류 UI를 보이고, 그 외에는 fallback 결과를 성공 화면으로 렌더링한다.

### Project status (2026-03-19)

- `src/lib/astrologyClient.ts`
  - `getSunSignHoroscope()`를 10초 타임아웃 기준 2회 시도로 변경
  - 2회 실패 시 클라이언트 fallback 성공 응답 반환(`meta.source=client_fallback`)
  - 저품질 영어 단문 응답 감지 시 한국어 기본 리포트로 자동 보정
- `src/pages/DailyAstrologyPage.tsx`
  - 단계형 로딩 UI + fallback 안내 배너 + 오류 상태 UI(완전 실패 시만) 적용
- `supabase/functions/astrology-api/index.ts`
  - `today` 전용 프록시 타임아웃 8초 적용
  - `today` 성공/폴백에 `meta.source/meta.reason` 포함
  - `today` 프록시 실패 폴백을 별자리별 한국어 다단 리포트로 유지

## Deploy reminder

After fixing code, redeploy at least:

- `astrology-api`
- `analyze-saju`
- `secure-results` (if related code changed)
