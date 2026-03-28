-- Atomic refund RPC for chat credit ledger
-- Purpose:
-- - Make refund idempotent and wallet updates transactionally consistent.
-- - Used by `saju-chat-api` when AI generation fails after consume.

CREATE OR REPLACE FUNCTION chat_credit_refund(
  p_owner_key TEXT,
  p_usage_id TEXT,
  p_profile_key TEXT DEFAULT '',
  p_source TEXT DEFAULT 'ai-failure-refund'
)
RETURNS TABLE (
  applied BOOLEAN,
  reason TEXT,
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
  v_usage_id TEXT := btrim(COALESCE(p_usage_id, ''));
  v_profile_key TEXT := btrim(COALESCE(p_profile_key, ''));
  v_source TEXT := btrim(COALESCE(p_source, ''));
  v_wallet chat_credit_wallets%ROWTYPE;
  v_consume_event RECORD;
  v_charged_from TEXT := 'free';
  v_free_remaining INT;
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

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM chat_credit_wallets
  WHERE owner_key = v_owner_key
  FOR UPDATE;

  IF EXISTS (
    SELECT 1
    FROM chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'refund'
      AND usage_id = v_usage_id
  ) THEN
    v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);
    RETURN QUERY
    SELECT
      FALSE,
      'duplicate_refund',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      3 + v_wallet.paid_remaining,
      v_free_remaining + v_wallet.paid_remaining;
    RETURN;
  END IF;

  SELECT metadata
  INTO v_consume_event
  FROM chat_credit_events
  WHERE owner_key = v_owner_key
    AND event_type = 'consume'
    AND usage_id = v_usage_id
  LIMIT 1;

  IF NOT FOUND THEN
    v_free_remaining := GREATEST(0, 3 - v_wallet.free_used);
    RETURN QUERY
    SELECT
      FALSE,
      'consume_not_found',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      3 + v_wallet.paid_remaining,
      v_free_remaining + v_wallet.paid_remaining;
    RETURN;
  END IF;

  IF (v_consume_event.metadata ->> 'charged_from') = 'paid' THEN
    v_charged_from := 'paid';
    UPDATE chat_credit_wallets
    SET paid_remaining = paid_remaining + 1,
        updated_at = NOW()
    WHERE owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  ELSE
    v_charged_from := 'free';
    UPDATE chat_credit_wallets
    SET free_used = GREATEST(0, free_used - 1),
        updated_at = NOW()
    WHERE owner_key = v_owner_key
    RETURNING * INTO v_wallet;
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
    'refund',
    v_usage_id,
    v_source,
    NULLIF(v_profile_key, ''),
    CASE WHEN v_charged_from = 'free' THEN -1 ELSE 0 END,
    CASE WHEN v_charged_from = 'paid' THEN 1 ELSE 0 END,
    v_free_remaining + v_wallet.paid_remaining,
    jsonb_build_object('charged_from', v_charged_from)
  );

  RETURN QUERY
  SELECT
    TRUE,
    'refunded',
    v_wallet.free_used,
    v_wallet.paid_remaining,
    3 + v_wallet.paid_remaining,
    v_free_remaining + v_wallet.paid_remaining;
END;
$$;
GRANT EXECUTE ON FUNCTION chat_credit_refund(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
