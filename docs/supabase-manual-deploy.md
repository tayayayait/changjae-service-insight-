# Supabase Manual Deploy

## Linked project

- Project ref: `wyotcagrklohprtaarqa`
- Current deploy notes assume the remote database schema is already up to date.
- Do not run `supabase db push` unless a migration was explicitly added and reviewed.

## Canonical function set

Deploy only canonical function slugs from `supabase/config.toml`:

- `secure-results`
- `saju-lifetime-api`
- `saju-daily-api`
- `saju-yearly-api`
- `astrology-daily-api`
- `astrology-cosmic-api`
- `astrology-natal-api`
- `palmistry-scanner-api`
- `saju-chat-api`
- `chat-credit-status`
- `create-order`
- `payment-webhook`
- `lookup-reports`
- `love-future-partner-api`
- `love-couple-report-api`
- `love-crush-reunion-api`
- `love-reports-center`

Do not deploy removed legacy slugs such as `analyze-saju`, `daily-fortune`, `yearly-fortune`, `astrology-api`, or `love-reports`.

## Secrets

Remote project must have:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `DATA_ENCRYPTION_KEY`

## Auth settings

Guest-callable canonical functions must keep `verify_jwt = false` in `supabase/config.toml` and in remote deploy settings.

Relevant guest-callable functions:

- `secure-results`
- `saju-lifetime-api`
- `saju-daily-api`
- `saju-yearly-api`
- `astrology-daily-api`
- `astrology-cosmic-api`
- `astrology-natal-api`
- `palmistry-scanner-api`
- `saju-chat-api`
- `chat-credit-status`
- `create-order`
- `payment-webhook`
- `lookup-reports`
- `love-future-partner-api`
- `love-couple-report-api`
- `love-crush-reunion-api`
- `love-reports-center`

## Deploy commands

If only the timeout stabilization change was made, redeploy:

```bash
npx supabase functions deploy saju-lifetime-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

If the chat credit ledger change was made, apply migration and redeploy:

```bash
# db push는 --project-ref 플래그를 지원하지 않으므로, 패스워드를 사용하거나 링크된 상태여야 함
npx supabase db push --password <database-password>
npx supabase functions deploy saju-chat-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy chat-credit-status --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy create-order --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy payment-webhook --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

If chat quota APIs fail with `42702 ambiguous` (e.g. `owner_key` / `free_used`), apply the RPC hotfix migration and redeploy chat functions:

```bash
npx supabase db push --password <database-password>
npx supabase functions deploy chat-credit-status --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy saju-chat-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

Hotfix migration file:

- `supabase/migrations/20260327192000_fix_chat_credit_rpc_ambiguity.sql`

`20260323213000_add_nonmember_payment_system.sql` is written to backfill missing columns on pre-existing `reports`, `orders`, and `report_access_tokens` tables before creating indexes or RLS policies. This prevents older remote projects with partial manual schema from failing on `db push`.

`20260326063239_add_user_profiles_geo_columns.sql` adds `user_profiles.lat`, `user_profiles.lng`, and `user_profiles.timezone`. Apply it before testing auth profile bootstrap or astrology flows that read profile coordinates.

Latest credit migration set also includes `chat_credit_refund` RPC for atomic AI-failure refunds:

- `supabase/migrations/20260325201000_add_chat_credit_ledger.sql`
- `supabase/migrations/20260325223000_add_chat_credit_refund_rpc.sql`

If `_shared/prompt-templates.ts` changed, redeploy every function that imports it:

```bash
npx supabase functions deploy saju-lifetime-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy saju-daily-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
npx supabase functions deploy saju-yearly-api --no-verify-jwt --project-ref wyotcagrklohprtaarqa
```

## Post-deploy verification

1. Confirm remote versions changed:
   - `npx supabase functions list --project-ref wyotcagrklohprtaarqa`
2. Run one `saju-lifetime-roadmap` request.
3. Copy the client `traceId` from browser console.
4. Confirm `saju-lifetime-api` logs show:
   - `request_parsed`
   - `prompt_built`
   - `gemini_started`
   - one of `gemini_succeeded` or `gemini_timed_out`
   - `response_sent`
5. If the browser still shows timeout, compare client timeout class with the last edge log stage before changing timeout budgets again.
6. Run one `/chat` request and copy the client `traceId` from `[chat:start]`.
7. Confirm `saju-chat-api` logs show:
   - `request_parsed`
   - `prompt_built`
   - `gemini_started`
   - one of `gemini_succeeded` or `gemini_timed_out`
   - `response_sent`
8. Verify successful `/chat` response payload includes `quota.remaining`, `quota.total`, `quota.charged`.
9. Verify `chat-credit-status` returns same `remaining` on both `localhost:8080` and `127.0.0.1:5173` for the same owner input.
10. SQL smoke checks after applying `20260327192000_fix_chat_credit_rpc_ambiguity.sql`:
    - `select * from public.chat_credit_status('owner:user:test-hotfix');`
    - `select * from public.chat_credit_consume('owner:user:test-hotfix','u1','input','profile:test');`
    - `select * from public.chat_credit_consume('owner:user:test-hotfix','u2','input','profile:test');`
    - Third consume should return `charged=false` and `reason='no_credits'`.
