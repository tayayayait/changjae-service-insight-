-- 20260328_postgres_optimization.sql
-- Description: Supabase Postgres Best Practices Optimization
-- Includes missing indexes for query performance and restrictive RLS policies for security.

-------------------------------------------------------------------------------
-- 1. Schema & Index Optimization (query-missing-indexes)
-------------------------------------------------------------------------------

-- analytics_events: Optimize get_popular_services_stats() RPC and metadata queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date ON public.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_payload_service ON public.analytics_events USING btree ((payload->>'serviceId'));

-- saju_results: Optimize lookups by request_fingerprint
CREATE INDEX IF NOT EXISTS idx_saju_results_fingerprint ON public.saju_results(request_fingerprint);

-- orders: Optimize webhook and lookup queries
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone_status ON public.orders(buyer_phone_hash, status);
CREATE INDEX IF NOT EXISTS idx_orders_report_id ON public.orders(report_id);

-- love_reports: Optimize list endpoint performance
CREATE INDEX IF NOT EXISTS idx_love_reports_user_date ON public.love_reports(user_id, created_at DESC);

-------------------------------------------------------------------------------
-- 2. Security & RLS (security-rls-open)
-------------------------------------------------------------------------------

-- Drop widely open UPDATE/DELETE policies on service_suggestions
DROP POLICY IF EXISTS "Anyone can update suggestions" ON public.service_suggestions;
DROP POLICY IF EXISTS "Anyone can delete suggestions" ON public.service_suggestions;

-- Create restricted policies for Admin ONLY (Option B)
-- Note: Replace 'admin@example.com' with the actual admin email(s).
-- If you use service_role key in the backend for the admin UI, you don't even need these policies!
CREATE POLICY "Enable UPDATE for admins" 
  ON public.service_suggestions 
  FOR UPDATE 
  TO authenticated 
  USING (auth.jwt()->>'email' IN ('admin@example.com'));

CREATE POLICY "Enable DELETE for admins" 
  ON public.service_suggestions 
  FOR DELETE 
  TO authenticated 
  USING (auth.jwt()->>'email' IN ('admin@example.com'));

-------------------------------------------------------------------------------
-- 3. RPC Performance Optimization (query-rpc-fullscan)
-------------------------------------------------------------------------------

-- Redeclare get_popular_services_stats to limit scanning to the last 30 days
CREATE OR REPLACE FUNCTION public.get_popular_services_stats()
RETURNS TABLE (
    service_id text,
    view_count bigint,
    last_viewed_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        payload->>'serviceId' as service_id,
        COUNT(*) as view_count,
        MAX(created_at) as last_viewed_at
    FROM public.analytics_events
    WHERE event_name = 'service_viewed'
      AND payload->>'serviceId' IS NOT NULL
      AND created_at >= NOW() - INTERVAL '30 days' -- Optimization: Limit scan range
    GROUP BY payload->>'serviceId'
    ORDER BY view_count DESC, last_viewed_at DESC
    LIMIT 10;
$$;
