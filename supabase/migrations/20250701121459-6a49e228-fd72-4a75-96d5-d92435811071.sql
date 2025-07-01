
-- Create SQL functions for demand notifications

-- Function to get viewed demands for a user
CREATE OR REPLACE FUNCTION get_viewed_demands(p_user_id uuid)
RETURNS TABLE(demand_id uuid, viewed_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT dv.demand_id, dv.viewed_at
  FROM demand_views dv
  WHERE dv.user_id = p_user_id;
END;
$$;

-- Function to mark a single demand as viewed
CREATE OR REPLACE FUNCTION mark_demand_as_viewed(p_demand_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO demand_views (demand_id, user_id, viewed_at)
  VALUES (p_demand_id, p_user_id, NOW())
  ON CONFLICT (demand_id, user_id) DO UPDATE SET
    viewed_at = NOW();
END;
$$;

-- Function to mark multiple demands as viewed
CREATE OR REPLACE FUNCTION mark_all_demands_as_viewed(p_user_id uuid, p_demand_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demand_id uuid;
BEGIN
  FOREACH demand_id IN ARRAY p_demand_ids
  LOOP
    INSERT INTO demand_views (demand_id, user_id, viewed_at)
    VALUES (demand_id, p_user_id, NOW())
    ON CONFLICT (demand_id, user_id) DO UPDATE SET
      viewed_at = NOW();
  END LOOP;
END;
$$;
