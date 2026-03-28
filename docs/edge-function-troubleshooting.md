# Edge Function Troubleshooting

## Canonical Functions

Current guest-callable canonical functions in this repo:

- `secure-results`
- `saju-lifetime-api`
- `saju-daily-api`
- `saju-yearly-api`
- `astrology-daily-api`
- `astrology-cosmic-api`
- `astrology-natal-api`
- `palmistry-scanner-api`
- `saju-chat-api`
- `love-future-partner-api`
- `love-couple-report-api`
- `love-crush-reunion-api`
- `love-reports-center`

If a doc or deploy script still references `analyze-saju`, `daily-fortune`, `yearly-fortune`, `astrology-api`, or `love-reports`, treat it as legacy and update it before deploying.

## Model Baseline

- Canonical Gemini-backed functions target `gemini-3-flash-preview`, except `saju-chat-api` which targets `gemini-2.5-flash-lite`.
- If runtime logs show a different model name than the function baseline, treat the deployed function as stale and redeploy changed slugs.

## Symptom: Profile auto-analysis on `SajuInput` fails with timeout

Example UI messages:

- `회원 정보 자동 분석에 실패했습니다.`
- `요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.`

### Current behavior

- `src/lib/geminiClient.ts`
  - `getSajuAnalysis(req, options?)` accepts `source` and `traceId`.
  - Manual requests use a `60_000ms` watchdog.
  - Profile auto-analysis requests use a `60_000ms` watchdog.
  - `saju-daeun-shift` applies a service-level timeout floor of `65_000ms` to avoid premature client watchdog expiry during cold starts.
  - `saju-lifetime-roadmap` and `saju-yearly-action-calendar` apply a service-level timeout floor of `60_000ms`.
  - `saju-daeun-shift` in `profile-auto` path retries once when a `client_watchdog` timeout occurs.
  - If that watchdog timeout still occurs, client attempts one direct `fetch` fallback to the same `saju-lifetime-api` endpoint (browser runtime only, not test runtime).
  - `503` and transport/network failures retry up to two additional attempts with `1_200ms` delay between attempts.
  - Client watchdog timeouts and edge `504`/`UPSTREAM_TIMEOUT` do not retry.
- `src/lib/resultStore.ts`
  - Remote cache lookup failures (`get_saju`, `get_saju_by_fingerprint`) now emit `console.warn` with request context instead of failing silently.
  - `get_saju_by_fingerprint` timeout budget is reduced to `8_000ms` to avoid long cache-check stalls before analysis.
- `src/pages/SajuInput.tsx`
  - Generates a per-run `traceId`.
  - Sends the same `traceId` into `getSajuAnalysis()`, analytics, and console logs.
- `supabase/functions/saju-lifetime-api/index.ts`
  - Applies a `60_000ms` upstream Gemini timeout.
  - Returns `504` JSON in this shape on upstream timeout:
    - `{ error, code: "UPSTREAM_TIMEOUT", traceId, elapsedMs, serviceType }`
  - Emits structured logs with these stages:
    - `request_parsed`
    - `prompt_built`
    - `gemini_started`
    - `gemini_succeeded`
    - `gemini_timed_out`
    - `response_sent`

### Verification checklist

1. Start a local flow that triggers `/saju` auto-analysis.
2. Copy the `traceId` from browser console output:
   - `[saju-analysis:start]`
   - `[saju-analysis:completed]`
   - `[saju-analysis:failed]`
3. Open Supabase function logs for `saju-lifetime-api`.
4. Filter by the same `traceId`.
5. Confirm which stage is last:
   - Last stage `gemini_timed_out`: upstream Gemini exceeded 60 seconds.
   - Last stage `response_sent` with `status=504`: edge timeout reached the browser correctly.
   - Last browser classification `client_watchdog`: browser-side watchdog expired before a server response arrived.
   - Last browser classification `edge_503`: function or secret availability problem.
   - Last browser classification `transport`: network/request path problem.

### Root-cause guide by classification

- `client_watchdog`
  - Browser waited past its source-specific watchdog.
  - Check whether the edge function logged `gemini_succeeded` or never emitted `response_sent`.
- `edge_504`
  - Gemini exceeded the server-side timeout.
  - Reduce prompt size, simplify schema, or accept a longer server budget.
- `edge_503`
  - Usually missing `GEMINI_API_KEY` or platform/service unavailability.
  - Confirm project secrets and function health.
- `transport`
  - Request did not complete cleanly at the network layer.
  - Check browser network tab, Supabase status, and client connectivity.

## Symptom: UI stays in loading state while a function hangs

### Verified cause

Without an explicit watchdog, `supabase.functions.invoke(...)` can remain pending and keep UI state locked.

### Fix checklist

1. Wrap user-facing invokes with a timeout guard.
2. Convert timeout expiry into a normal rejected error.
3. Ensure `catch/finally` clears loading state.
4. Distinguish local watchdog timeout from edge timeout in logs.

## Symptom: `/chat` AI 사주 상담에서 타임아웃이 가끔 발생

### Current behavior

- `src/lib/geminiClient.ts`
  - `sendChatMessage(req)` sends a per-request `traceId` via `requestMeta.traceId`.
  - Browser runtime calls `saju-chat-api` through direct `fetch` (`/functions/v1/saju-chat-api`) as primary transport to avoid `supabase.functions.invoke(...)` pending hangs.
  - Test runtime keeps `supabase.functions.invoke(...)` path for deterministic mocking.
  - Client watchdog uses `45_000ms`.
  - Browser console logs:
    - `[chat:start]`
    - `[chat:completed]`
    - `[chat:failed]`
    - `[chat:fallback]` (only when invoke path is used and transport fallback is triggered)
  - Timeout class emitted in failed logs:
    - `client_watchdog`
    - `edge_504`
    - `edge_503`
    - `transport`
    - `other`
- `supabase/functions/saju-chat-api/index.ts`
  - Applies a `60_000ms` upstream Gemini timeout.
  - Returns `504` JSON on upstream timeout:
    - `{ error, code: "UPSTREAM_TIMEOUT", traceId, elapsedMs }`
  - Includes `traceId` in `400`, `503`, and `500` JSON responses.
  - Emits structured logs with these stages:
    - `request_parsed`
    - `prompt_built`
    - `gemini_started`
    - `gemini_succeeded`
    - `gemini_timed_out`
    - `request_failed`
    - `response_sent`

### Verification checklist

1. Open `/chat` and send one message.
2. Copy the `traceId` from browser console:
   - `[chat:start]`
   - `[chat:completed]` or `[chat:failed]`
3. Open Supabase function logs for `saju-chat-api`.
4. Filter logs by the same `traceId`.
5. Classify by last stage and timeout class:
   - Last stage `gemini_timed_out`: upstream Gemini exceeded 60 seconds.
   - Last stage `response_sent` with `status=504`: edge timeout returned correctly.
   - Browser `timeoutClass=client_watchdog`: client watchdog expired before response.
   - Browser `timeoutClass=edge_503`: function/service/secrets issue.
   - Browser `timeoutClass=transport`: network/request path issue.

## Symptom: Secure results calls fail with guest/auth confusion

### Common causes

1. Missing secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
   - `DATA_ENCRYPTION_KEY`
2. Caller omitted `x-guest-id`.
3. Caller forwarded a non-user token and the function tried to resolve it as a user JWT.

### Fix checklist

1. Confirm secrets are present in the remote project.
2. Confirm frontend requests include `x-guest-id`.
3. If logs mention missing `sub` claim, treat the request as guest instead of calling `auth.getUser()` with that token.

## Symptom: `astrology-natal-api` CORS preflight fails on `http://localhost:8080`

Example browser error:

- `No 'Access-Control-Allow-Origin' header is present on the requested resource`

### Verified causes

1. Remote function deploy is stale or JWT verification is enabled remotely.
2. Browser preflight fails before the request reaches Edge Function code.
3. After invoke failure, `astrology_reports` query can also fail with `400` if guest session storage key is inconsistent.
4. `POST /rest/v1/astrology_reports?select=*` can fail with `400` when:
   - payload includes non-existent column (`is_unlocked`, `PGRST204`)
   - payload omits required `input_fingerprint` (`23502 not-null violation`)

### Current mitigation in code

- `vite.config.ts`
  - Adds dev proxy: `/__supabase/* -> ${VITE_SUPABASE_URL}/*`
- `src/lib/astrologyClient.ts`
  - In local dev (`localhost` / `127.0.0.1`), astrology calls use direct fetch endpoint `/__supabase/functions/v1/<slug>` to avoid browser CORS preflight to Supabase origin.
- `src/lib/astrologyStore.ts`
  - Uses canonical guest session key `saju:guest-session-id` with legacy fallback `guest_id`.
  - Avoids sending empty `guest_id` filter that causes `400` on `astrology_reports`.
  - Writes `input_fingerprint` on create/upsert and retries without `is_unlocked` when remote schema does not have that column.
- `src/hooks/astrology/useAstrologyUnlockFlow.ts`
  - Handles `PGRST204` on `is_unlocked` update as schema-drift fallback (skip column update, proceed UX flow).

### Deployment check

If CORS still appears, remote settings are likely stale. Redeploy and force guest-callable mode:

```bash
npx supabase functions deploy astrology-natal-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

## Deploy reminder

After changing `saju-lifetime-api` or `_shared/prompt-templates.ts`, redeploy at least:

- `saju-lifetime-api`
- `saju-chat-api` (when chat handler changed)

Also redeploy any other changed canonical function touched in the same branch.
