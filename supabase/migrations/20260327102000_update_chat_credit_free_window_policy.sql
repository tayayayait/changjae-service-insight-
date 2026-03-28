-- Chat credit policy update (2026-03-27)
-- - Free allowance: 2 questions per rolling 24-hour window
-- - Window starts at first free consume timestamp
-- - Paid pack: +10 questions
-- - Existing free usage is reset for all wallets on rollout

ALTER TABLE IF EXISTS public.chat_credit_wallets
  ADD COLUMN IF NOT EXISTS free_window_started_at TIMESTAMPTZ;

UPDATE public.chat_credit_wallets
SET free_used = 0,
    free_window_started_at = NULL,
    updated_at = NOW();

-- Existing RPCs keep the same argument signatures but change OUT columns,
-- so they must be dropped before recreation.
DROP FUNCTION IF EXISTS public.chat_credit_status(TEXT);
DROP FUNCTION IF EXISTS public.chat_credit_consume(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.chat_credit_refund(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.chat_credit_grant_pack(TEXT, TEXT, INT, TEXT);
DROP FUNCTION IF EXISTS public.chat_credit_claim_paid_email(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.chat_credit_status(p_owner_key TEXT)
RETURNS TABLE (
  owner_key TEXT,
  free_used INT,
  paid_remaining INT,
  total INT,
  remaining INT,
  next_free_reset_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_key TEXT := btrim(COALESCE(p_owner_key, ''));
  v_wallet public.chat_credit_wallets%ROWTYPE;
  v_free_limit INT := 2;
BEGIN
  IF v_owner_key = '' THEN
    RAISE EXCEPTION 'owner_key is required';
  END IF;

  INSERT INTO public.chat_credit_wallets AS w (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM public.chat_credit_wallets AS w
  WHERE w.owner_key = v_owner_key
  FOR UPDATE;

  IF v_wallet.free_window_started_at IS NOT NULL
     AND v_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  END IF;

  RETURN QUERY
  SELECT
    v_wallet.owner_key AS owner_key,
    v_wallet.free_used AS free_used,
    v_wallet.paid_remaining AS paid_remaining,
    v_free_limit + v_wallet.paid_remaining AS total,
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining AS remaining,
    CASE
      WHEN v_wallet.free_window_started_at IS NULL THEN NULL
      ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
    END AS next_free_reset_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_credit_consume(
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
  charged_from TEXT,
  next_free_reset_at TIMESTAMPTZ
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
  v_wallet public.chat_credit_wallets%ROWTYPE;
  v_free_limit INT := 2;
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

  INSERT INTO public.chat_credit_wallets AS w (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM public.chat_credit_wallets AS w
  WHERE w.owner_key = v_owner_key
  FOR UPDATE;

  IF v_wallet.free_window_started_at IS NOT NULL
     AND v_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'consume'
      AND usage_id = v_usage_id
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      'duplicate_usage',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      v_free_limit + v_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
      NULL::TEXT,
      CASE
        WHEN v_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  IF v_wallet.free_used < v_free_limit THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = w.free_used + 1,
        free_window_started_at = COALESCE(w.free_window_started_at, NOW()),
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;

    v_charged_from := 'free';
    v_delta_free := 1;
  ELSIF v_wallet.paid_remaining > 0 THEN
    UPDATE public.chat_credit_wallets AS w
    SET paid_remaining = w.paid_remaining - 1,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;

    v_charged_from := 'paid';
    v_delta_paid := -1;
  ELSE
    RETURN QUERY
    SELECT
      FALSE,
      'no_credits',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      v_free_limit + v_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
      NULL::TEXT,
      CASE
        WHEN v_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  INSERT INTO public.chat_credit_events (
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
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    jsonb_build_object('charged_from', v_charged_from)
  );

  RETURN QUERY
  SELECT
    TRUE,
    'charged',
    v_wallet.free_used,
    v_wallet.paid_remaining,
    v_free_limit + v_wallet.paid_remaining,
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    v_charged_from,
    CASE
      WHEN v_wallet.free_window_started_at IS NULL THEN NULL
      ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_credit_refund(
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
  remaining INT,
  next_free_reset_at TIMESTAMPTZ
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
  v_wallet public.chat_credit_wallets%ROWTYPE;
  v_consume_event RECORD;
  v_charged_from TEXT := 'free';
  v_free_limit INT := 2;
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

  INSERT INTO public.chat_credit_wallets AS w (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM public.chat_credit_wallets AS w
  WHERE w.owner_key = v_owner_key
  FOR UPDATE;

  IF v_wallet.free_window_started_at IS NOT NULL
     AND v_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'refund'
      AND usage_id = v_usage_id
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      'duplicate_refund',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      v_free_limit + v_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
      CASE
        WHEN v_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  SELECT metadata
  INTO v_consume_event
  FROM public.chat_credit_events
  WHERE owner_key = v_owner_key
    AND event_type = 'consume'
    AND usage_id = v_usage_id
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      FALSE,
      'consume_not_found',
      v_wallet.free_used,
      v_wallet.paid_remaining,
      v_free_limit + v_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
      CASE
        WHEN v_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  IF (v_consume_event.metadata ->> 'charged_from') = 'paid' THEN
    v_charged_from := 'paid';
    UPDATE public.chat_credit_wallets AS w
    SET paid_remaining = w.paid_remaining + 1,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  ELSE
    v_charged_from := 'free';
    UPDATE public.chat_credit_wallets AS w
    SET free_used = GREATEST(0, w.free_used - 1),
        free_window_started_at = CASE
          WHEN GREATEST(0, w.free_used - 1) = 0 THEN NULL
          ELSE w.free_window_started_at
        END,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  END IF;

  INSERT INTO public.chat_credit_events (
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
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    jsonb_build_object('charged_from', v_charged_from)
  );

  RETURN QUERY
  SELECT
    TRUE,
    'refunded',
    v_wallet.free_used,
    v_wallet.paid_remaining,
    v_free_limit + v_wallet.paid_remaining,
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    CASE
      WHEN v_wallet.free_window_started_at IS NULL THEN NULL
      ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_credit_grant_pack(
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
  remaining INT,
  next_free_reset_at TIMESTAMPTZ
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
  v_wallet public.chat_credit_wallets%ROWTYPE;
  v_free_limit INT := 2;
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

  INSERT INTO public.chat_credit_wallets AS w (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_wallet
  FROM public.chat_credit_wallets AS w
  WHERE w.owner_key = v_owner_key
  FOR UPDATE;

  IF v_wallet.free_window_started_at IS NOT NULL
     AND v_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_owner_key
    RETURNING * INTO v_wallet;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.chat_credit_events
    WHERE owner_key = v_owner_key
      AND event_type = 'grant_pack'
      AND order_number = v_order_number
  ) THEN
    RETURN QUERY
    SELECT
      FALSE,
      v_wallet.free_used,
      v_wallet.paid_remaining,
      v_free_limit + v_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
      CASE
        WHEN v_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  UPDATE public.chat_credit_wallets AS w
  SET paid_remaining = w.paid_remaining + v_pack_size,
      updated_at = NOW()
  WHERE w.owner_key = v_owner_key
  RETURNING * INTO v_wallet;

  INSERT INTO public.chat_credit_events (
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
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    jsonb_build_object('pack_size', v_pack_size)
  );

  RETURN QUERY
  SELECT
    TRUE,
    v_wallet.free_used,
    v_wallet.paid_remaining,
    v_free_limit + v_wallet.paid_remaining,
    GREATEST(0, v_free_limit - v_wallet.free_used) + v_wallet.paid_remaining,
    CASE
      WHEN v_wallet.free_window_started_at IS NULL THEN NULL
      ELSE v_wallet.free_window_started_at + INTERVAL '24 hours'
    END;
END;
$$;

CREATE OR REPLACE FUNCTION public.chat_credit_claim_paid_email(
  p_auth_owner_key TEXT,
  p_auth_user_id TEXT,
  p_email TEXT,
  p_source TEXT DEFAULT 'auth-login'
)
RETURNS TABLE (
  applied BOOLEAN,
  transferred_paid INT,
  auth_paid_remaining INT,
  auth_free_used INT,
  auth_total INT,
  auth_remaining INT,
  auth_next_free_reset_at TIMESTAMPTZ
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
  v_auth_wallet public.chat_credit_wallets%ROWTYPE;
  v_legacy_wallet public.chat_credit_wallets%ROWTYPE;
  v_free_limit INT := 2;
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

  INSERT INTO public.chat_credit_wallets (owner_key)
  VALUES (v_auth_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_auth_wallet
  FROM public.chat_credit_wallets
  WHERE owner_key = v_auth_owner_key
  FOR UPDATE;

  IF v_auth_wallet.free_window_started_at IS NOT NULL
     AND v_auth_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_auth_owner_key
    RETURNING * INTO v_auth_wallet;
  END IF;

  IF v_email = '' THEN
    RETURN QUERY
    SELECT
      FALSE,
      0,
      v_auth_wallet.paid_remaining,
      v_auth_wallet.free_used,
      v_free_limit + v_auth_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_auth_wallet.free_used) + v_auth_wallet.paid_remaining,
      CASE
        WHEN v_auth_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_auth_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  v_legacy_owner_key := 'owner:email:' || encode(digest('email:' || v_email, 'sha256'), 'hex');

  IF v_legacy_owner_key = v_auth_owner_key THEN
    RETURN QUERY
    SELECT
      FALSE,
      0,
      v_auth_wallet.paid_remaining,
      v_auth_wallet.free_used,
      v_free_limit + v_auth_wallet.paid_remaining,
      GREATEST(0, v_free_limit - v_auth_wallet.free_used) + v_auth_wallet.paid_remaining,
      CASE
        WHEN v_auth_wallet.free_window_started_at IS NULL THEN NULL
        ELSE v_auth_wallet.free_window_started_at + INTERVAL '24 hours'
      END;
    RETURN;
  END IF;

  INSERT INTO public.chat_credit_wallets (owner_key)
  VALUES (v_legacy_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT *
  INTO v_legacy_wallet
  FROM public.chat_credit_wallets
  WHERE owner_key = v_legacy_owner_key
  FOR UPDATE;

  IF v_legacy_wallet.free_window_started_at IS NOT NULL
     AND v_legacy_wallet.free_window_started_at + INTERVAL '24 hours' <= NOW() THEN
    UPDATE public.chat_credit_wallets AS w
    SET free_used = 0,
        free_window_started_at = NULL,
        updated_at = NOW()
    WHERE w.owner_key = v_legacy_owner_key
    RETURNING * INTO v_legacy_wallet;
  END IF;

  v_transferred := GREATEST(0, v_legacy_wallet.paid_remaining);

  IF v_transferred > 0 THEN
    UPDATE public.chat_credit_wallets AS w
    SET paid_remaining = w.paid_remaining + v_transferred,
        updated_at = NOW()
    WHERE w.owner_key = v_auth_owner_key
    RETURNING * INTO v_auth_wallet;

    UPDATE public.chat_credit_wallets AS w
    SET paid_remaining = w.paid_remaining - v_transferred,
        updated_at = NOW()
    WHERE w.owner_key = v_legacy_owner_key
    RETURNING * INTO v_legacy_wallet;

    INSERT INTO public.chat_credit_events (
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
      GREATEST(0, v_free_limit - v_auth_wallet.free_used) + v_auth_wallet.paid_remaining,
      jsonb_build_object(
        'auth_user_id', v_auth_user_id,
        'legacy_owner_key', v_legacy_owner_key,
        'email', v_email
      )
    );

    INSERT INTO public.chat_credit_events (
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
      GREATEST(0, v_free_limit - v_legacy_wallet.free_used) + v_legacy_wallet.paid_remaining,
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
    v_auth_wallet.paid_remaining,
    v_auth_wallet.free_used,
    v_free_limit + v_auth_wallet.paid_remaining,
    GREATEST(0, v_free_limit - v_auth_wallet.free_used) + v_auth_wallet.paid_remaining,
    CASE
      WHEN v_auth_wallet.free_window_started_at IS NULL THEN NULL
      ELSE v_auth_wallet.free_window_started_at + INTERVAL '24 hours'
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chat_credit_status(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_credit_consume(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_credit_refund(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_credit_grant_pack(TEXT, TEXT, INT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chat_credit_claim_paid_email(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
