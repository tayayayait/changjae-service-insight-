-- Secure storage and analytics patch
-- Run in Supabase SQL Editor

ALTER TABLE saju_results
  ADD COLUMN IF NOT EXISTS privacy_mode VARCHAR(20) NOT NULL DEFAULT 'local-only',
  ADD COLUMN IF NOT EXISTS born_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS born_data_iv TEXT;
ALTER TABLE compatibility_results
  ADD COLUMN IF NOT EXISTS person_a_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS person_a_data_iv TEXT,
  ADD COLUMN IF NOT EXISTS person_b_data_enc TEXT,
  ADD COLUMN IF NOT EXISTS person_b_data_iv TEXT;
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
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
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
