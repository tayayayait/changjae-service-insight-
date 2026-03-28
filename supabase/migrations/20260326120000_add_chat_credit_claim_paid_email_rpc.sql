-- Claim legacy paid chat credits by matching OAuth email owner to auth user owner.
-- Policy:
-- - Transfer only paid credits from owner:email:* wallet to owner:user:* wallet.
-- - Do not transfer free usage state.
-- - Idempotent by move semantics (legacy paid balance is set to 0 after transfer).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
DO $$
BEGIN
  IF to_regclass('public.chat_credit_events') IS NOT NULL THEN
    ALTER TABLE public.chat_credit_events
      DROP CONSTRAINT IF EXISTS chat_credit_events_event_type_check;

    ALTER TABLE public.chat_credit_events
      ADD CONSTRAINT chat_credit_events_event_type_check
      CHECK (event_type IN ('consume', 'refund', 'grant_pack', 'claim_paid_email'));
  END IF;
END $$;
CREATE OR REPLACE FUNCTION chat_credit_claim_paid_email(
  p_auth_owner_key TEXT,
  p_auth_user_id TEXT,
  p_email TEXT,
  p_source TEXT DEFAULT 'auth-login'
)
RETURNS TABLE (
  applied BOOLEAN,
  transferred_paid INT,
  auth_paid_remaining INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_auth_owner_key TEXT := btrim(COALESCE(p_auth_owner_key, ''));
  v_auth_user_id TEXT := btrim(COALESCE(p_auth_user_id, ''));
  v_email TEXT := lower(btrim(COALESCE(p_email, '')));
  v_source TEXT := btrim(COALESCE(p_source, ''));
  v_legacy_owner_key TEXT;
  v_transferred INT := 0;
  v_auth_wallet chat_credit_wallets%ROWTYPE;
  v_legacy_wallet chat_credit_wallets%ROWTYPE;
BEGIN
  IF v_auth_owner_key = '' THEN
    RAISE EXCEPTION 'auth_owner_key is required';
  END IF;

  IF v_auth_user_id = '' THEN
    RAISE EXCEPTION 'auth_user_id is required';
  END IF;

  IF v_auth_owner_key <> ('owner:user:' || v_auth_user_id) THEN
    RAISE EXCEPTION 'auth_owner_key mismatch';
  END IF;

  IF v_source = '' THEN
    v_source := 'auth-login';
  END IF;

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_auth_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_auth_wallet
  FROM chat_credit_wallets
  WHERE owner_key = v_auth_owner_key
  FOR UPDATE;

  IF v_email = '' THEN
    RETURN QUERY
    SELECT FALSE, 0, v_auth_wallet.paid_remaining;
    RETURN;
  END IF;

  v_legacy_owner_key := 'owner:email:' || encode(digest('email:' || v_email, 'sha256'), 'hex');

  IF v_legacy_owner_key = v_auth_owner_key THEN
    RETURN QUERY
    SELECT FALSE, 0, v_auth_wallet.paid_remaining;
    RETURN;
  END IF;

  INSERT INTO chat_credit_wallets (owner_key)
  VALUES (v_legacy_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_legacy_wallet
  FROM chat_credit_wallets
  WHERE owner_key = v_legacy_owner_key
  FOR UPDATE;

  v_transferred := GREATEST(0, v_legacy_wallet.paid_remaining);

  IF v_transferred > 0 THEN
    UPDATE chat_credit_wallets
    SET paid_remaining = paid_remaining + v_transferred,
        updated_at = NOW()
    WHERE owner_key = v_auth_owner_key
    RETURNING * INTO v_auth_wallet;

    UPDATE chat_credit_wallets
    SET paid_remaining = paid_remaining - v_transferred,
        updated_at = NOW()
    WHERE owner_key = v_legacy_owner_key
    RETURNING * INTO v_legacy_wallet;

    INSERT INTO chat_credit_events (
      owner_key,
      event_type,
      source,
      delta_paid,
      remaining_total,
      metadata
    ) VALUES (
      v_auth_owner_key,
      'claim_paid_email',
      v_source,
      v_transferred,
      GREATEST(0, 3 - v_auth_wallet.free_used) + v_auth_wallet.paid_remaining,
      jsonb_build_object(
        'auth_user_id', v_auth_user_id,
        'legacy_owner_key', v_legacy_owner_key,
        'email', v_email
      )
    );

    INSERT INTO chat_credit_events (
      owner_key,
      event_type,
      source,
      delta_paid,
      remaining_total,
      metadata
    ) VALUES (
      v_legacy_owner_key,
      'claim_paid_email',
      v_source,
      -v_transferred,
      GREATEST(0, 3 - v_legacy_wallet.free_used) + v_legacy_wallet.paid_remaining,
      jsonb_build_object(
        'auth_owner_key', v_auth_owner_key,
        'auth_user_id', v_auth_user_id,
        'email', v_email
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    v_transferred > 0,
    v_transferred,
    v_auth_wallet.paid_remaining;
END;
$$;
GRANT EXECUTE ON FUNCTION chat_credit_claim_paid_email(TEXT, TEXT, TEXT, TEXT)
TO anon, authenticated, service_role;
