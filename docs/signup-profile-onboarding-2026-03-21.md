# Signup/Profile Onboarding Flow (Updated 2026-03-27)

## Goal
- Keep login-required policy only for `AI 사주상담 (/chat)`.
- Force first-time users to complete profile setup once, then return to the requested route.

## Main Routes
- `/chat` (protected)
- `/login?next=<safe-path>`
- `/auth/callback?next=<safe-path>`
- `/setup-profile?next=<safe-path>`

## Runtime Rules
1. Guest access to `/chat` keeps the chat route and opens `LoginModal` as an overlay (`RequireAuth(unauthenticatedMode="modal")`).
2. On `/chat`, `LoginModal` is dismiss-locked: backdrop click / outside interaction / `Esc` key cannot close it.
3. Login + profile-complete users are auto-joined to AI chat on first `/chat` visit via server wallet status fetch (`chat_credit_status`).
4. Chat no longer provides a separate manual birth-input form; required profile data must come from `/setup-profile`.
5. Login page offers social-first (`kakao`, `google`) and email login as fallback.
6. Social login uses `redirectTo=/auth/callback?next=...`.
7. Email signup uses `emailRedirectTo=/auth/callback?next=/chat`; if Supabase rejects redirect allow-list (`422 redirect_to`), retry signup without `emailRedirectTo`.
8. Callback page validates session and checks `user_profiles`:
   - profile exists -> move to `next` (fallback: `/chat`)
   - profile missing -> move to `/setup-profile?next=...`
9. Profile setup completion returns to validated `next` (fallback: `/mypage`).
   - `next=/setup-profile` is normalized to `/chat` to prevent setup-loop routing and move directly to AI chat after onboarding.
10. If quota lookup fails, show retry UI and do not open payment gate.
11. If quota lookup fails before first successful sync for the authenticated owner (typical right after signup), client bootstraps `remaining=2` to avoid blocking first chat usage, then re-syncs with server quota.
12. On `/setup-profile`, the top-left back button always routes directly to home (`/`) instead of moving to a previous setup step.
13. Authenticated users can terminate session from the in-chat logout button; successful logout keeps the `/chat` route and reopens `LoginModal`.
14. `refreshProfile` falls back to `auth.getSession()` when local auth user state is not synced yet, preventing false `/setup-profile` routing right after login.

## Safe Next Policy
- Accept only paths starting with `/`.
- Reject protocol-relative paths (`//...`).
- Normalize legacy `next=/setup-profile` to `/chat`.
- Reject empty/invalid values and use fallback route.

## Legacy Credit Migration (Chat Only)
- On login session bootstrap, if provider email exists, call `chat_credit_claim_paid_email` once.
- Transfer only `paid_remaining` from legacy `owner:email:*` to auth `owner:user:*`.
- Do not migrate free allowance usage.
- If provider email is missing (e.g., Kakao email not consented), migration is skipped in v1.

