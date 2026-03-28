-- Backfill-compatible hotfix for projects missing user_id columns used by create-order.
-- Safe to run multiple times.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reports_user_id_fkey'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_user_id_fkey'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES public.user_profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
