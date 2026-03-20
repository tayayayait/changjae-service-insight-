# Supabase Manual Deploy (Current)

## 1) Linked Project

- Linked project ref: `wyotcagrklohprtaarqa`
- Current remote migration state already matches local through `20260319013000_add_lifetime_fields_to_saju_results.sql`.
- For this deployment pass, do not run `npx supabase db push`.

## 2) SQL Editor

- `supabase/manual_sql_editor_setup.sql` is retained as a manual recovery/bootstrap script.
- It is not a required step for the current linked project because the remote database schema is already up to date.

## 3) Required Edge Functions For This Deploy

Deploy only these changed functions:

- `supabase/functions/analyze-saju`
- `supabase/functions/daily-fortune`
- `supabase/functions/secure-results`
- `supabase/functions/love-reports`

`_shared` is import-only and is bundled automatically with each function deployment.

## 4) Required Edge Function Secrets

Remote project must have:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `DATA_ENCRYPTION_KEY`

Current linked project already has these secrets configured.

## 5) Function Auth Settings

These functions must remain guest-callable with `verify_jwt = false`:

- `analyze-saju`
- `daily-fortune`
- `secure-results`
- `love-reports`

`love-reports` is invoked directly from the frontend with `supabase.functions.invoke("love-reports")`, so the function must stay in `supabase/config.toml` and must not require JWT verification.

## 6) Deploy Commands

Run:

```bash
npx supabase functions deploy analyze-saju --no-verify-jwt
npx supabase functions deploy daily-fortune --no-verify-jwt
npx supabase functions deploy secure-results --no-verify-jwt
npx supabase functions deploy love-reports --no-verify-jwt
```

## 7) Quick Verification

1. Confirm deploy timestamps or versions changed:
   - `npx supabase functions list`
2. Confirm CORS preflight works:
   - `curl -i -X OPTIONS https://wyotcagrklohprtaarqa.supabase.co/functions/v1/analyze-saju`
3. Confirm app flow:
   - Run local app and execute one Saju analysis and one love report create/list flow.
4. Confirm logs if failure remains:
   - Inspect Supabase logs for `analyze-saju`, `secure-results`, `love-reports`.
