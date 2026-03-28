-- Backfill-compatible fix for projects created before buyer_email was added
-- to the unified non-member orders schema.
ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
