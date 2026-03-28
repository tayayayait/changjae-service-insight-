-- Enforce paid report data retention:
-- Keep report payloads for 30 days from paid date, then scrub sensitive JSON.

CREATE OR REPLACE FUNCTION public.cleanup_expired_paid_reports(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affected INTEGER := 0;
BEGIN
  WITH paid_report_cutoff AS (
    SELECT
      o.report_id,
      MAX(COALESCE(o.paid_at, o.created_at)) AS latest_paid_at
    FROM public.orders o
    WHERE o.status = 'paid'
      AND o.report_id IS NOT NULL
    GROUP BY o.report_id
  ),
  target AS (
    SELECT r.id
    FROM public.reports r
    JOIN paid_report_cutoff p
      ON p.report_id = r.id
    WHERE p.latest_paid_at < (NOW() - make_interval(days => p_retention_days))
      AND (
        COALESCE(r.report_payload, '{}'::jsonb) <> '{}'::jsonb
        OR COALESCE(r.preview_payload, '{}'::jsonb) <> '{}'::jsonb
        OR COALESCE(r.input_snapshot, '{}'::jsonb) <> '{}'::jsonb
      )
  ),
  upd AS (
    UPDATE public.reports r
    SET
      report_payload = '{}'::jsonb,
      preview_payload = '{}'::jsonb,
      input_snapshot = '{}'::jsonb,
      updated_at = NOW()
    FROM target t
    WHERE r.id = t.id
    RETURNING r.id
  )
  SELECT COUNT(*) INTO v_affected FROM upd;

  RETURN v_affected;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_paid_reports(INTEGER)
IS 'Scrubs paid report payload JSON after retention window (default: 30 days from paid_at).';

DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'pg_cron extension not available in this environment.';
  END;

  IF EXISTS (
    SELECT 1
    FROM pg_namespace
    WHERE nspname = 'cron'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM cron.job
      WHERE jobname = 'cleanup-expired-paid-reports'
    ) THEN
      PERFORM cron.unschedule(
        (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-paid-reports' LIMIT 1)
      );
    END IF;

    PERFORM cron.schedule(
      'cleanup-expired-paid-reports',
      '17 3 * * *',
      $job$SELECT public.cleanup_expired_paid_reports(30);$job$
    );
  END IF;
END;
$$;
