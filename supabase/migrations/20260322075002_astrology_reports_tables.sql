-- Astrology category report storage (Natal, Daily, Transit)

CREATE TABLE IF NOT EXISTS astrology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  service_type VARCHAR(40) NOT NULL,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_fingerprint TEXT NOT NULL,
  report_payload JSONB NOT NULL,
  template_version VARCHAR(40) NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_astrology_reports_user_id ON astrology_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_astrology_reports_guest_id ON astrology_reports(guest_id);
CREATE INDEX IF NOT EXISTS idx_astrology_reports_service_type ON astrology_reports(service_type);
CREATE INDEX IF NOT EXISTS idx_astrology_reports_cache_lookup
  ON astrology_reports (service_type, template_version, input_fingerprint, created_at DESC);
-- Ensure a user/guest only has one cached entry per fingerprint and service_type
CREATE UNIQUE INDEX IF NOT EXISTS ux_astrology_reports_user_fingerprint
  ON astrology_reports (user_id, service_type, template_version, input_fingerprint)
  WHERE user_id IS NOT NULL AND input_fingerprint IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_astrology_reports_guest_fingerprint
  ON astrology_reports (guest_id, service_type, template_version, input_fingerprint)
  WHERE guest_id IS NOT NULL AND input_fingerprint IS NOT NULL;
ALTER TABLE astrology_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own astrology_reports" ON astrology_reports;
DROP POLICY IF EXISTS "Users can view own astrology_reports" ON astrology_reports;
DROP POLICY IF EXISTS "Users can delete own astrology_reports" ON astrology_reports;
CREATE POLICY "Users can insert own astrology_reports"
  ON astrology_reports
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
CREATE POLICY "Users can view own astrology_reports"
  ON astrology_reports
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
CREATE POLICY "Users can delete own astrology_reports"
  ON astrology_reports
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
-- Also allow service roles (like Edge Functions) to bypass RLS securely if needed.
-- Supabase automatically allows the "service_role" role to bypass RLS.;
