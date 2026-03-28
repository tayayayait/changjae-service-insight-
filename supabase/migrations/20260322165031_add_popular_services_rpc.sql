-- Create RPC to aggregate popular services based on analytics events efficiently
-- Run in Supabase SQL Editor or via Migrations

CREATE OR REPLACE FUNCTION get_popular_services_stats()
RETURNS TABLE(service_id TEXT, use_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    payload->>'serviceId' as service_id,
    COUNT(*) as use_count
  FROM analytics_events
  WHERE event_name IN ('analysis_completed', 'input_started')
    AND payload->>'serviceId' IS NOT NULL
  GROUP BY payload->>'serviceId'
  ORDER BY use_count DESC
  LIMIT 5;
$$;
-- Grant execute to authenticated and anon (or just anon since it's used by Edge Function mostly)
-- Assuming Edge Function uses service_role, this grant is optional but good practice if called from client
GRANT EXECUTE ON FUNCTION get_popular_services_stats() TO authenticated, anon;
