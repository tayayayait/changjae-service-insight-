ALTER TABLE love_reports
  ADD COLUMN IF NOT EXISTS report_version VARCHAR(30) NOT NULL DEFAULT 'v1-story',
  ADD COLUMN IF NOT EXISTS menu_variant VARCHAR(40);
UPDATE love_reports
SET
  report_version = COALESCE(report_version, 'v1-story'),
  menu_variant = COALESCE(menu_variant, service_type)
WHERE report_version IS NULL OR menu_variant IS NULL;
CREATE INDEX IF NOT EXISTS idx_love_reports_report_version ON love_reports(report_version);
