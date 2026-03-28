-- Fix: Replace partial unique indexes with full UNIQUE constraints
-- Reason: PostgreSQL ON CONFLICT requires exact full unique constraints (no WHERE clause)

-- 1. Remove any previous uniqueness shape first.
-- Remote environments may already have these names as UNIQUE constraints
-- instead of standalone indexes, so handle both safely.
ALTER TABLE astrology_reports
  DROP CONSTRAINT IF EXISTS ux_astrology_reports_user_fingerprint;
ALTER TABLE astrology_reports
  DROP CONSTRAINT IF EXISTS ux_astrology_reports_guest_fingerprint;

DROP INDEX IF EXISTS ux_astrology_reports_user_fingerprint;
DROP INDEX IF EXISTS ux_astrology_reports_guest_fingerprint;

-- 2. Clean up any accidental duplicates that might have been created while partial indexes were active
-- (Keep the most recent one by created_at)
DELETE FROM astrology_reports
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY user_id, service_type, template_version, input_fingerprint 
             ORDER BY created_at DESC
           ) as rn
    FROM astrology_reports
    WHERE user_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);

DELETE FROM astrology_reports
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY guest_id, service_type, template_version, input_fingerprint 
             ORDER BY created_at DESC
           ) as rn
    FROM astrology_reports
    WHERE guest_id IS NOT NULL
  ) t
  WHERE t.rn > 1
);

-- 3. Add full UNIQUE constraints for ON CONFLICT to work
ALTER TABLE astrology_reports
  ADD CONSTRAINT ux_astrology_reports_user_fingerprint
  UNIQUE (user_id, service_type, template_version, input_fingerprint);
ALTER TABLE astrology_reports
  ADD CONSTRAINT ux_astrology_reports_guest_fingerprint
  UNIQUE (guest_id, service_type, template_version, input_fingerprint);
