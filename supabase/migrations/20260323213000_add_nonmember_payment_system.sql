-- Enable pgcrypto for hashing sensitive data (like phone numbers)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- 1. Unified reports table for the new "full generation + itemized locking" logic
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  service_id VARCHAR(100) NOT NULL, -- e.g., 'saju-lifetime-roadmap', 'saju-2026-overview'
  service_type VARCHAR(50) NOT NULL, -- e.g., 'saju', 'astro', 'love'
  
  -- Data Snapshots
  input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- AI generated full content
  preview_payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Summary or teaser
  
  -- Access Control
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_items JSONB NOT NULL DEFAULT '[]'::jsonb, -- List of specific unlocked sub-items
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS reports
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS guest_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS service_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS input_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS report_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preview_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlocked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_guest_id ON reports(guest_id);
CREATE INDEX IF NOT EXISTS idx_reports_service_id ON reports(service_id);
-- 2. Orders table for tracking payments
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Global unique order ID (Merchant UID)
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  guest_id VARCHAR(100),
  
  -- Buyer Info (Stored for lookup/re-access)
  buyer_name VARCHAR(100) NOT NULL,
  buyer_email VARCHAR(255),
  buyer_phone_hash TEXT NOT NULL, -- Hashed phone number for lookup
  
  -- Payment Details
  service_id VARCHAR(100) NOT NULL,
  amount_krw INT NOT NULL CHECK (amount_krw >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, cancelled, refunded
  payment_method VARCHAR(50),
  pg_provider VARCHAR(50), -- e.g., 'portone'
  pg_tid VARCHAR(255), -- PG transaction ID
  
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS order_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS guest_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS buyer_phone_hash TEXT,
  ADD COLUMN IF NOT EXISTS service_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS amount_krw INT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pg_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pg_tid VARCHAR(255),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_report_id ON orders(report_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_phone_hash ON orders(buyer_phone_hash);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
-- 3. Access tokens for email links
CREATE TABLE IF NOT EXISTS report_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL, -- Hashed token for the link
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS report_access_tokens
  ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS token_hash TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_tokens_report_id ON report_access_tokens(report_id);
-- --------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- --------------------------------------------------------

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_tokens ENABLE ROW LEVEL SECURITY;
-- Reports: Allow select by owner or by valid session guest_id
-- We'll also allow some server-side lookups via Edge Functions that bypass RLS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Users can view own reports') THEN
    CREATE POLICY "Users can view own reports"
      ON reports
      FOR SELECT
      USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (guest_id IS NOT NULL AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id'))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Anyone can insert reports') THEN
    CREATE POLICY "Anyone can insert reports"
      ON reports
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can view own orders') THEN
    CREATE POLICY "Users can view own orders"
      ON orders
      FOR SELECT
      USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
        (guest_id IS NOT NULL AND guest_id = (current_setting('request.headers', true)::jsonb ->> 'x-guest-id'))
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Anyone can insert orders') THEN
    CREATE POLICY "Anyone can insert orders"
      ON orders
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
