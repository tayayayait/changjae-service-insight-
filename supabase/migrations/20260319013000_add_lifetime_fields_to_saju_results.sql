-- Add lifetime report fields to saju_results
ALTER TABLE saju_results
  ADD COLUMN IF NOT EXISTS lifetime_score INT,
  ADD COLUMN IF NOT EXISTS daeun_periods JSONB,
  ADD COLUMN IF NOT EXISTS golden_periods JSONB,
  ADD COLUMN IF NOT EXISTS personality_type JSONB;
