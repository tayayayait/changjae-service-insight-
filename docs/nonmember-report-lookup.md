# Non-member Report Re-access

## Policy

- Re-access is based on purchase-time buyer info.
- Required lookup fields:
  - `buyerName`
  - `buyerPhone`
- Optional lookup field:
  - `buyerEmail` (when provided at purchase time, it is used as an additional filter)
- `AI 사주상담(/chat)` is excluded from non-member access and requires login.
- Lookup UI must explicitly show: `구매한 리포트는 결제일 기준 30일간 홈페이지에 보관됩니다.`

## Implementation Notes

- `create-order` stores:
  - normalized `buyer_name` (trim + collapsed spaces)
  - normalized `buyer_email` (trim + lowercase, nullable)
  - `buyer_phone_hash` (SHA-256 of digits-only phone)
  - `owner_key` (same hashing policy as frontend owner identity)

- owner key normalization policy:
  - `owner:user:<auth-id>`
  - `owner:phone:<sha256("phone:<digits-only-phone>")>`
  - `owner:email:<sha256("email:<lowercase-email>")>`
  - fallback guest key for unauthenticated local flow

- `lookup-reports` matches:
  - `buyer_name` (case-insensitive exact text)
  - `buyer_phone_hash`
  - and `buyer_email` when user provides it
- `lookup-reports(mode="list")` excludes `service_id = "saju-ai-chat"` from response.
- `lookup-reports(mode="report")` returns `EXCLUDED_SERVICE` for `saju-ai-chat`.

- Lookup result card routing:
  - `service_type = astro` -> `/astrology/purchased/:reportId`
  - `service_type = saju` -> `/saju/purchased/:reportId`
  - other types keep legacy fallback route (`/result/:reportId`)
  - buyer verification state (`buyerName`, `buyerPhone`, `buyerEmail`) is forwarded in route state for re-verification.

- Lookup result returns paid orders only (`status = paid`) and includes:
  - order number
  - paid timestamp
  - retention expiry date (`paid_at + 30 days`) shown in UI card
  - amount
  - linked report id for reopening

## Retention Policy

- Purchased report reopening window is `30 days` from payment date.
- `lookup-reports` applies retention at read time:
  - list mode returns only orders within 30 days (`paid_at`, fallback `created_at`).
  - report mode returns `ok: false` with code `EXPIRED` when over 30 days.
- DB cleanup job:
  - migration `20260328010000_add_report_retention_30days.sql` adds
    `public.cleanup_expired_paid_reports(30)`.
  - scheduled daily (`03:17`) via `pg_cron` when available.
  - cleanup scrubs `reports.report_payload`, `reports.preview_payload`,
    `reports.input_snapshot` for expired paid reports.

## Legacy Schema Fallback

- Some deployed projects may have an older payment schema missing one or more of:
  - `orders.buyer_email`
  - `orders.paid_at`
  - `orders.owner_key`
  - `orders.user_id`
- Edge Functions handle this gracefully:
  - `create-order`: retries insert after removing missing columns when schema-cache missing-column errors are returned.
  - `payment-webhook`: retries updates without legacy-missing columns (`pg_tid`, `paid_at`, `reports.updated_at`) when needed.
  - `lookup-reports`: retries when `buyer_email` or `paid_at` is missing (including PostgreSQL `42703` / `column does not exist` errors), and falls back to `created_at` ordering/timestamp when `paid_at` is absent.

- Recommended permanent fix:
  - apply migrations so `orders.buyer_email`, `orders.paid_at`, `orders.owner_key`, and `orders.user_id` exist.
  - for older projects, run `20260328003000_backfill_payment_user_id_columns.sql` to backfill `orders.user_id`/`reports.user_id`.
