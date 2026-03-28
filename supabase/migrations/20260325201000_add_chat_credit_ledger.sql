-- Chat credit ledger (owner-key authoritative)
-- Policy:
-- - Free allowance: 3 questions per owner_key
-- - Paid pack: +10 questions per successful chat order
-- - Canonical source is server ledger (not localStorage)

ALTER TABLE IF EXISTS orders
  ADD COLUMN IF NOT EXISTS owner_key TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_owner_key ON orders(owner_key);
CREATE TABLE IF NOT EXISTS chat_credit_wallets (
  owner_key TEXT PRIMARY KEY,
  free_used INT NOT NULL DEFAULT 0 CHECK (free_used >= 0),
  paid_remaining INT NOT NULL DEFAULT 0 CHECK (paid_remaining >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS chat_credit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('consume', 'refund', 'grant_pack')),
  usage_id TEXT,
  order_number TEXT,
  source TEXT,
  profile_key TEXT,
  delta_free INT NOT NULL DEFAULT 0,
  delta_paid INT NOT NULL DEFAULT 0,
  remaining_total INT NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_credit_events_owner_time
  ON chat_credit_events(owner_key, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_credit_consume_usage
  ON chat_credit_events(usage_id)
  WHERE event_type = 'consume' AND usage_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_credit_grant_order
  ON chat_credit_events(order_number)
  WHERE event_type = 'grant_pack' AND order_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_credit_refund_usage
  ON chat_credit_events(usage_id)
  WHERE event_type = 'refund' AND usage_id IS NOT NULL;
CREATE OR REPLACE FUNCTION chat_credit_status(p_owner_key TEXT)
RETURNS TABLE (
  owner_key TEXT,
  free_used INT,
  paid_remaining INT,
  total INT,
  remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_key TEXT := btrim(COALESCE(p_owner_key, ''));
  v_wallet chat_credit_wallets%ROWTYPE;
  v_free_remaining INT;
BEGIN
  IF v_owner_key = '' THEN
    RAISE EXCEPTION 'owner_key is required';
  END IF;

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM chat_credit_wallets
  WHERE chat_credit_wallets.owner_key = v_owner_key;

  v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);

  RETURN QUERY
  SELECT
    v_wallet.owner_key,
    v_wallet.free_used,
    v_wallet.paid_remaining,
    3 + v_wallet.paid_remaining,
    v_free_remaining + v_wallet.paid_remaining;
END;
$$;
CREATE OR REPLACE FUNCTION chat_credit_consume(
  p_owner_key TEXT,
  p_usage_id TEXT,
  p_source TEXT,
  p_profile_key TEXT
)
RETURNS TABLE (
  charged BOOLEAN,
  reason TEXT,
  free_used INT,
  paid_remaining INT,
  total INT,
  remaining INT,
  charged_from TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_key TEXT := btrim(COALESCE(p_owner_key, ''));
  v_usage_id TEXT := btrim(COALESCE(p_usage_id, ''));
  v_source TEXT := btrim(COALESCE(p_source, ''));
  v_profile_key TEXT := btrim(COALESCE(p_profile_key, ''));
  v_wallet chat_credit_wallets%ROWTYPE;
  v_free_remaining INT;
  v_charged_from TEXT := NULL;
  v_delta_free INT := 0;
  v_delta_paid INT := 0;
BEGIN
  IF v_owner_key = '' THEN
    RAISE EXCEPTION 'owner_key is required';
  END IF;
  IF v_usage_id = '' THEN
    RAISE EXCEPTION 'usage_id is required';
  END IF;
  IF v_source = '' THEN
    RAISE EXCEPTION 'source is required';
  END IF;
  IF v_profile_key = '' THEN
    RAISE EXCEPTION 'profile_key is required';
  END IF;

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM chat_credit_wallets
  WHERE chat_credit_wallets.owner_key = v_owner_key
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'consume'
      AND usage_id = v_usage_id
  ) THEN
    v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);
    RETURN QUERY
    SELECT
      FALSE,
      'duplicate_usage',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      3 + v_wallet.paid_remaining,
      v_free_remaining + v_wallet.paid_remaining,
      NULL::TEXT;
    RETURN;
  END IF;

  IF v_wallet.free_used < 3 THEN
    UPDATE chat_credit_wallets
    SET free_used = free_used + 1,
        updated_at = NOW()
    WHERE owner_key = v_owner_key
    RETURNING * INTO v_wallet;

    v_charged_from := 'free';
    v_delta_free := 1;
  ELSIF v_wallet.paid_remaining > 0 THEN
    UPDATE chat_credit_wallets
    SET paid_remaining = paid_remaining - 1,
        updated_at = NOW()
    WHERE owner_key = v_owner_key
    RETURNING * INTO v_wallet;

    v_charged_from := 'paid';
    v_delta_paid := -1;
  ELSE
    v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);
    RETURN QUERY
    SELECT
      FALSE,
      'no_credits',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      3 + v_wallet.paid_remaining,
      v_free_remaining + v_wallet.paid_remaining,
      NULL::TEXT;
    RETURN;
  END IF;

  v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);

  INSERT INTO chat_credit_events (
    owner_key,
    event_type,
    usage_id,
    source,
    profile_key,
    delta_free,
    delta_paid,
    remaining_total,
    metadata
  ) VALUES (
    v_owner_key,
    'consume',
    v_usage_id,
    v_source,
    v_profile_key,
    v_delta_free,
    v_delta_paid,
    v_free_remaining + v_wallet.paid_remaining,
    jsonb_build_object('charged_from', v_charged_from)
  );

  RETURN QUERY
  SELECT
    TRUE,
    'charged',
    v_wallet.free_used,
    v_wallet.paid_remaining,
    3 + v_wallet.paid_remaining,
    v_free_remaining + v_wallet.paid_remaining,
    v_charged_from;
END;
$$;
CREATE OR REPLACE FUNCTION chat_credit_grant_pack(
  p_owner_key TEXT,
  p_order_number TEXT,
  p_pack_size INT DEFAULT 10,
  p_source TEXT DEFAULT 'payment-webhook'
)
RETURNS TABLE (
  applied BOOLEAN,
  free_used INT,
  paid_remaining INT,
  total INT,
  remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_key TEXT := btrim(COALESCE(p_owner_key, ''));
  v_order_number TEXT := btrim(COALESCE(p_order_number, ''));
  v_source TEXT := btrim(COALESCE(p_source, ''));
  v_pack_size INT := GREATEST(1, COALESCE(p_pack_size, 10));
  v_wallet chat_credit_wallets%ROWTYPE;
  v_free_remaining INT;
BEGIN
  IF v_owner_key = '' THEN
    RAISE EXCEPTION 'owner_key is required';
  END IF;
  IF v_order_number = '' THEN
    RAISE EXCEPTION 'order_number is required';
  END IF;
  IF v_source = '' THEN
    RAISE EXCEPTION 'source is required';
  END IF;

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM chat_credit_wallets
  WHERE chat_credit_wallets.owner_key = v_owner_key
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'grant_pack'
      AND order_number = v_order_number
  ) THEN
    v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);
    RETURN QUERY
    SELECT
      FALSE,
      v_wallet.free_used,
      v_wallet.paid_remaining,
      3 + v_wallet.paid_remaining,
      v_free_remaining + v_wallet.paid_remaining;
    RETURN;
  END IF;

  UPDATE chat_credit_wallets
  SET paid_remaining = paid_remaining + v_pack_size,
      updated_at = NOW()
  WHERE owner_key = v_owner_key
  RETURNING * INTO v_wallet;

  v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);

  INSERT INTO chat_credit_events (
    owner_key,
    event_type,
    order_number,
    source,
    delta_paid,
    remaining_total,
    metadata
  ) VALUES (
    v_owner_key,
    'grant_pack',
    v_order_number,
    v_source,
    v_pack_size,
    v_free_remaining + v_wallet.paid_remaining,
    jsonb_build_object('pack_size', v_pack_size)
  );

  RETURN QUERY
  SELECT
    TRUE,
    v_wallet.free_used,
    v_wallet.paid_remaining,
    3 + v_wallet.paid_remaining,
    v_free_remaining + v_wallet.paid_remaining;
END;
$$;
GRANT EXECUTE ON FUNCTION chat_credit_status(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION chat_credit_consume(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION chat_credit_grant_pack(TEXT, TEXT, INT, TEXT) TO anon, authenticated, service_role;
