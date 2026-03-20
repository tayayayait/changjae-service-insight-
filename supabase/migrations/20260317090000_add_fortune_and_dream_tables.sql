-- Fortune and dream result storage

CREATE TABLE IF NOT EXISTS fortune_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  base_result_id UUID REFERENCES saju_results(id) ON DELETE SET NULL,
  period VARCHAR(20) NOT NULL,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  lucky_color TEXT,
  lucky_item TEXT,
  source_kind VARCHAR(20) NOT NULL DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fortune_results_user_id ON fortune_results(user_id);
CREATE INDEX IF NOT EXISTS idx_fortune_results_guest_id ON fortune_results(guest_id);

CREATE TABLE IF NOT EXISTS dream_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  dream_input JSONB NOT NULL,
  dream_input_enc TEXT,
  dream_input_iv TEXT,
  interpretation JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dream_results_user_id ON dream_results(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_results_guest_id ON dream_results(guest_id);

ALTER TABLE fortune_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own fortune_results" ON fortune_results;
DROP POLICY IF EXISTS "Users can view own fortune_results" ON fortune_results;
DROP POLICY IF EXISTS "Users can delete own fortune_results" ON fortune_results;

CREATE POLICY "Users can insert own fortune_results"
  ON fortune_results
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

CREATE POLICY "Users can view own fortune_results"
  ON fortune_results
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

CREATE POLICY "Users can delete own fortune_results"
  ON fortune_results
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );

DROP POLICY IF EXISTS "Users can insert own dream_results" ON dream_results;
DROP POLICY IF EXISTS "Users can view own dream_results" ON dream_results;
DROP POLICY IF EXISTS "Users can delete own dream_results" ON dream_results;

CREATE POLICY "Users can insert own dream_results"
  ON dream_results
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

CREATE POLICY "Users can view own dream_results"
  ON dream_results
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

CREATE POLICY "Users can delete own dream_results"
  ON dream_results
  FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    (
      auth.uid() IS NULL
      AND user_id IS NULL
      AND guest_id IS NOT NULL
      AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id')
    )
  );
