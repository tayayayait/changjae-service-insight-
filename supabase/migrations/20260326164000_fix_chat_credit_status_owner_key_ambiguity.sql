-- Fix ambiguous identifier resolution in chat_credit_status.
-- In PL/pgSQL, RETURNS TABLE column names are variables, so unqualified
-- identifiers like owner_key can conflict with table columns.

CREATE OR REPLACE FUNCTION public.chat_credit_status(p_owner_key TEXT)
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
  v_free_used INT := 0;
  v_paid_remaining INT := 0;
BEGIN
  IF v_owner_key = '' THEN
    RAISE EXCEPTION 'owner_key is required';
  END IF;

  INSERT INTO public.chat_credit_wallets AS w (owner_key)
  VALUES (v_owner_key)
  ON CONFLICT (owner_key) DO NOTHING;

  SELECT w.free_used, w.paid_remaining
  INTO v_free_used, v_paid_remaining
  FROM public.chat_credit_wallets AS w
  WHERE w.owner_key = v_owner_key;

  RETURN QUERY
  SELECT
    v_owner_key AS owner_key,
    v_free_used AS free_used,
    v_paid_remaining AS paid_remaining,
    3 + v_paid_remaining AS total,
    GREATEST(0, 3 - v_free_used) + v_paid_remaining AS remaining;
END;
$$;

GRANT EXECUTE ON FUNCTION public.chat_credit_status(TEXT) TO anon, authenticated, service_role;

