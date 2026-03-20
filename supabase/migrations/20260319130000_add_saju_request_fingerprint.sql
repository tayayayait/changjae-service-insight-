-- Add request-level metadata for deterministic cache lookup
ALTER TABLE saju_results
  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS source_service_id TEXT,
  ADD COLUMN IF NOT EXISTS prompt_version TEXT;

CREATE INDEX IF NOT EXISTS idx_saju_results_fingerprint
  ON saju_results (request_fingerprint, created_at DESC);
