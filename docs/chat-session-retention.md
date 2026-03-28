# Chat Session and Credit Retention Policy (Updated 2026-03-27)

## Current Decision
- Chat service is account-based and login + profile-required (`/chat`), but guest visit keeps the chat screen and opens login as modal overlay (no forced `/login` route move).
- On `/chat`, the login modal is dismiss-locked to prevent accidental close: backdrop/outside click and `Esc` do not close it.
- Login modal scope is strictly `/chat` only: if route changes to any other menu, modal closes immediately and store state is reset (`isLoginModalOpen=false`).
- First authenticated `/chat` entry implicitly joins AI chat by creating/reading the owner wallet via `chat_credit_status`.
- Manual birth-input form inside chat was removed; chat context is sourced from profile setup data only.
- Chat credit is server-authoritative by auth owner key: `owner:user:<auth-id>`.
- Chat session list/history remains local and scoped by `ownerKey + profileKey`.
- Browser unload warning on `/chat` is shown only while a chat request is in-flight (`isLoading=true`), not just because past messages exist.
- Logout entry point is exposed inside the AI chat service toolbar (`ChatSessionToolbar`) for authenticated users.
- When quota/paywall overlays or checkout is active, logout remains available through in-screen quick action (`chat-overlay-logout`).
- Logout action calls `supabase.auth.signOut()`, keeps user on `/chat`, and immediately reopens the login modal.

## Credit Rules
- Free allowance: `2` questions.
- Free window rule: first free usage starts a rolling 24-hour window (`free_window_started_at`).
- Free reset rule: when `free_window_started_at + 24h` is reached, free usage resets to 0.
- Paid pack: `+10` per successful `saju-ai-chat` payment.
- Deduction path: `saju-chat-api` only.
- Refund path: `chat_credit_refund` RPC (idempotent).
- Client fallback: if chat success response omits `quota`, decrease local `remaining` by `1` once.
- Quota refresh fallback: if direct `chat_credit_status` RPC fails, retry via `chat-credit-status` edge function.
- If both quota refresh paths fail, show retry guidance and do not open payment gate.
- For an unsynced authenticated owner (for example right after signup), if both lookup paths fail, client applies temporary bootstrap quota (`remaining=2`) so chat can start immediately, then re-syncs from server on subsequent responses/refresh.
- After checkout success, client enters post-payment sync mode and suppresses payment CTA/auto-reopen until quota is re-synced; if delayed, retry triggers `payment-webhook` reconcile with the last paid order and then re-syncs quota (not immediate paywall loop).
- If checkout webhook response includes `chatCredit`, client applies it immediately (`setQuotaFromChatResponse`) before background re-sync to prevent instant modal/paywall re-open.
- `payment-webhook` order lookup must tolerate missing `owner_key` column and resolve grant owner in priority order: `orders.owner_key` -> `owner:user:${orders.user_id}`.
- `payment-webhook` updates `reports.is_unlocked=true` idempotently even when `orders.status` is already `paid`.
- 42702 (`owner_key/free_used ambiguous`) is a backend RPC definition issue; it must be fixed by applying migration `20260327192000_fix_chat_credit_rpc_ambiguity.sql` and redeploying `chat-credit-status` + `saju-chat-api`.
- Timer exposure: top-right timer is shown only when `next_free_reset_at` exists.
- Timer auto-sync: when timer reaches 0, client refreshes quota once.

## Owner Policy for Chat
- Allowed owner source: `auth-user` only.
- `guest`, `verified-phone`, `verified-email` owner keys are not used for new chat usage.
- Chat ticket purchase (`saju-ai-chat`) forces order owner key to auth owner key via `ownerKeyOverride`.

## Legacy Paid Credit Claim
- RPC: `chat_credit_claim_paid_email(auth_owner_key, auth_user_id, email, source)`.
- Trigger: login/session bootstrap with provider email.
- Transfer target: from legacy `owner:email:*` wallet to auth `owner:user:*` wallet.
- Transfer scope: `paid_remaining` only.
- Non-transfer scope: free usage counters.
- If provider email is absent or not matched: no-op.

## Rollout Reset (2026-03-27)
- Existing wallets are reset to `free_used=0`, `free_window_started_at=null`.
- All users start from the new free policy baseline (2 free questions).

## Storage Keys
- Chat sessions: `saju:chat:sessions:v3`
- Payment cache: `saju:payment-store:v5`
