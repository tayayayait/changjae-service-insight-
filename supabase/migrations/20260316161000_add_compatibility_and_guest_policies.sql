-- Compatibility table
CREATE TABLE IF NOT EXISTS compatibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  person_a_data JSONB NOT NULL,
  person_b_data JSONB NOT NULL,
  person_a_palja JSONB NOT NULL,
  person_b_palja JSONB NOT NULL,
  person_a_oheng JSONB NOT NULL,
  person_b_oheng JSONB NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  cautions JSONB NOT NULL DEFAULT '[]'::jsonb,
  advice TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compatibility_results_user_id ON compatibility_results(user_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_results_guest_id ON compatibility_results(guest_id);

ALTER TABLE compatibility_results ENABLE ROW LEVEL SECURITY;

-- Replace permissive guest policies on saju_results
DROP POLICY IF EXISTS "Anyone can insert saju_results" ON saju_results;
DROP POLICY IF EXISTS "Users can view their own saju_results" ON saju_results;

CREATE POLICY "Users can insert own saju_results"
  ON saju_results
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );

CREATE POLICY "Users can view own saju_results"
  ON saju_results
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );

-- Compatibility policies
CREATE POLICY "Users can insert own compatibility_results"
  ON compatibility_results
  FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );

CREATE POLICY "Users can view own compatibility_results"
  ON compatibility_results
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );
