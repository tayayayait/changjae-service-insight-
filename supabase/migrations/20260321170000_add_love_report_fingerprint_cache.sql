-- Add deterministic cache metadata for love reports
ALTER TABLE love_reports
  ADD COLUMN IF NOT EXISTS input_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS template_version VARCHAR(40);
UPDATE love_reports
SET
  report_version = COALESCE(report_version, 'v2-counsel'),
  template_version = COALESCE(template_version, 'legacy')
WHERE report_version IS NULL OR template_version IS NULL;
CREATE INDEX IF NOT EXISTS idx_love_reports_cache_lookup
  ON love_reports (service_type, report_version, template_version, input_fingerprint, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ux_love_reports_user_fingerprint
  ON love_reports (user_id, service_type, report_version, template_version, input_fingerprint)
  WHERE user_id IS NOT NULL AND input_fingerprint IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_love_reports_guest_fingerprint
  ON love_reports (guest_id, service_type, report_version, template_version, input_fingerprint)
  WHERE guest_id IS NOT NULL AND input_fingerprint IS NOT NULL;
