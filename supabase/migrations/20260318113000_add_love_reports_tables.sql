-- Love category report storage (preview + unlock)

CREATE TABLE IF NOT EXISTS love_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  service_type VARCHAR(40) NOT NULL,
  relation_mode VARCHAR(40),
  base_saju_result_id UUID REFERENCES saju_results(id) ON DELETE SET NULL,
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  input_snapshot_enc TEXT,
  input_snapshot_iv TEXT,
  feature_set JSONB NOT NULL,
  score_set JSONB NOT NULL,
  preview_json JSONB NOT NULL,
  full_report_enc TEXT NOT NULL,
  full_report_iv TEXT NOT NULL,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_love_reports_user_id ON love_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_love_reports_guest_id ON love_reports(guest_id);
CREATE INDEX IF NOT EXISTS idx_love_reports_service_type ON love_reports(service_type);
CREATE INDEX IF NOT EXISTS idx_love_reports_next_refresh_at ON love_reports(next_refresh_at);

ALTER TABLE love_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own love_reports" ON love_reports;
DROP POLICY IF EXISTS "Users can view own love_reports" ON love_reports;
DROP POLICY IF EXISTS "Users can delete own love_reports" ON love_reports;

CREATE POLICY "Users can insert own love_reports"
  ON love_reports
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

CREATE POLICY "Users can view own love_reports"
  ON love_reports
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

CREATE POLICY "Users can delete own love_reports"
  ON love_reports
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

-- Entitlement/order boundary for v1 (mock provider)

CREATE TABLE IF NOT EXISTS love_report_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES love_reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  product_code VARCHAR(100) NOT NULL,
  amount_krw INT NOT NULL CHECK (amount_krw > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'paid',
  provider VARCHAR(30) NOT NULL DEFAULT 'mock',
  provider_order_id VARCHAR(120),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_love_report_orders_report_id ON love_report_orders(report_id);
CREATE INDEX IF NOT EXISTS idx_love_report_orders_user_id ON love_report_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_love_report_orders_guest_id ON love_report_orders(guest_id);

ALTER TABLE love_report_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own love_report_orders" ON love_report_orders;
DROP POLICY IF EXISTS "Users can view own love_report_orders" ON love_report_orders;

CREATE POLICY "Users can insert own love_report_orders"
  ON love_report_orders
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

CREATE POLICY "Users can view own love_report_orders"
  ON love_report_orders
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

