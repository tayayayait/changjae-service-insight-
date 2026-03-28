-- Add service-specific report payload columns for saju results
ALTER TABLE saju_results
  ADD COLUMN IF NOT EXISTS report_payload JSONB,
  ADD COLUMN IF NOT EXISTS report_template_version TEXT;
CREATE INDEX IF NOT EXISTS idx_saju_results_report_template_version
  ON saju_results (report_template_version);
