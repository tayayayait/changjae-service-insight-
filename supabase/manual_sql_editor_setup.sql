-- Manual SQL setup for Supabase SQL Editor
-- Safe to run on an existing project (idempotent-focused)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_type VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  day INT NOT NULL,
  hour INT,
  minute INT,
  time_block VARCHAR(50),
  location VARCHAR(100),
  gender VARCHAR(10) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS name TEXT;

CREATE TABLE IF NOT EXISTS saju_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  born_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  palja_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  oheng_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  interests TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  free_question TEXT,
  gemini_summary TEXT,
  gemini_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saju_results
  ADD COLUMN IF NOT EXISTS privacy_mode VARCHAR(20) NOT NULL DEFAULT 'local-only',
  ADD COLUMN IF NOT EXISTS born_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS born_data_iv TEXT,
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(50) DEFAULT 'traditional-saju',
  ADD COLUMN IF NOT EXISTS lifetime_score INT,
  ADD COLUMN IF NOT EXISTS daeun_periods JSONB,
  ADD COLUMN IF NOT EXISTS golden_periods JSONB,
  ADD COLUMN IF NOT EXISTS personality_type JSONB;

CREATE INDEX IF NOT EXISTS idx_saju_results_user_id ON saju_results(user_id);
CREATE INDEX IF NOT EXISTS idx_saju_results_guest_id ON saju_results(guest_id);
CREATE INDEX IF NOT EXISTS idx_saju_results_service_type ON saju_results(service_type);

CREATE TABLE IF NOT EXISTS compatibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  person_a_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  person_b_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  person_a_palja JSONB NOT NULL DEFAULT '{}'::jsonb,
  person_b_palja JSONB NOT NULL DEFAULT '{}'::jsonb,
  person_a_oheng JSONB NOT NULL DEFAULT '[]'::jsonb,
  person_b_oheng JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  cautions JSONB NOT NULL DEFAULT '[]'::jsonb,
  advice TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE compatibility_results
  ADD COLUMN IF NOT EXISTS person_a_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS person_a_data_iv TEXT,
  ADD COLUMN IF NOT EXISTS person_b_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS person_b_data_iv TEXT;

CREATE INDEX IF NOT EXISTS idx_compatibility_results_user_id ON compatibility_results(user_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_results_guest_id ON compatibility_results(guest_id);

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
  dream_input JSONB NOT NULL DEFAULT '{}'::jsonb,
  dream_input_enc TEXT,
  dream_input_iv TEXT,
  interpretation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dream_results_user_id ON dream_results(user_id);
CREATE INDEX IF NOT EXISTS idx_dream_results_guest_id ON dream_results(guest_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  event_name VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_guest_id ON analytics_events(guest_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fortune_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON user_profiles;

CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can insert saju_results" ON saju_results;
DROP POLICY IF EXISTS "Users can view their own saju_results" ON saju_results;
DROP POLICY IF EXISTS "Users can insert own saju_results" ON saju_results;
DROP POLICY IF EXISTS "Users can view own saju_results" ON saju_results;
DROP POLICY IF EXISTS "Users can delete own saju_results" ON saju_results;

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

CREATE POLICY "Users can delete own saju_results"
  ON saju_results
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

DROP POLICY IF EXISTS "Users can insert own compatibility_results" ON compatibility_results;
DROP POLICY IF EXISTS "Users can view own compatibility_results" ON compatibility_results;
DROP POLICY IF EXISTS "Users can delete own compatibility_results" ON compatibility_results;

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

CREATE POLICY "Users can delete own compatibility_results"
  ON compatibility_results
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

DROP POLICY IF EXISTS "Users can insert own analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics_events" ON analytics_events;

CREATE POLICY "Users can insert own analytics_events"
  ON analytics_events
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

CREATE POLICY "Users can view own analytics_events"
  ON analytics_events
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
