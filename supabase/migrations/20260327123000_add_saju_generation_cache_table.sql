-- Stage 1 (no-quality-loss) generation cache for saju lifetime/yearly edge functions
CREATE TABLE IF NOT EXISTS saju_generation_cache (
  cache_key TEXT PRIMARY KEY,
  service_type TEXT NOT NULL,
  report_template_version TEXT NOT NULL,
  response_payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saju_generation_cache_service_type
  ON saju_generation_cache (service_type);

CREATE INDEX IF NOT EXISTS idx_saju_generation_cache_updated_at
  ON saju_generation_cache (updated_at DESC);

ALTER TABLE saju_generation_cache ENABLE ROW LEVEL SECURITY;
