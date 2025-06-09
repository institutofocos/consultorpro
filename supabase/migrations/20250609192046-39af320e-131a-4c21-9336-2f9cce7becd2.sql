
-- Corrigir a função calculate_financial_summary para remover a referência problemática ao stage_order
CREATE OR REPLACE FUNCTION public.calculate_financial_summary(start_date date DEFAULT NULL::date, end_date date DEFAULT NULL::date, consultant_filter uuid DEFAULT NULL::uuid, service_filter uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_expected numeric, total_received numeric, total_pending numeric, consultant_payments_made numeric, consultant_payments_pending numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH project_stages AS (
    SELECT 
      p.id as project_id,
      p.name as project_name,
      p.client_id,
      p.service_id,
      p.main_consultant_id,
      p.support_consultant_id,
      p.main_consultant_value,
      p.support_consultant_value,
      stage.value::NUMERIC as stage_value,
      (stage->>'managerApproved')::BOOLEAN as manager_approved,
      (stage->>'paymentReceived')::BOOLEAN as payment_received,
      (stage->>'consultantsSettled')::BOOLEAN as consultants_settled,
      (stage->>'endDate')::DATE as stage_end_date
    FROM projects p
    CROSS JOIN LATERAL jsonb_array_elements(p.stages) as stage
    WHERE 
      (start_date IS NULL OR (stage->>'endDate')::DATE >= start_date)
      AND (end_date IS NULL OR (stage->>'endDate')::DATE <= end_date)
      AND (consultant_filter IS NULL OR p.main_consultant_id = consultant_filter OR p.support_consultant_id = consultant_filter)
      AND (service_filter IS NULL OR p.service_id = service_filter)
  )
  SELECT 
    COALESCE(SUM(ps.stage_value), 0) as total_expected,
    COALESCE(SUM(CASE WHEN ps.payment_received THEN ps.stage_value ELSE 0 END), 0) as total_received,
    COALESCE(SUM(CASE WHEN ps.manager_approved AND NOT ps.payment_received THEN ps.stage_value ELSE 0 END), 0) as total_pending,
    COALESCE(SUM(CASE WHEN ps.consultants_settled THEN (ps.main_consultant_value + COALESCE(ps.support_consultant_value, 0)) ELSE 0 END), 0) as consultant_payments_made,
    COALESCE(SUM(CASE WHEN ps.manager_approved AND ps.payment_received AND NOT ps.consultants_settled THEN (ps.main_consultant_value + COALESCE(ps.support_consultant_value, 0)) ELSE 0 END), 0) as consultant_payments_pending
  FROM project_stages ps;
END;
$function$
