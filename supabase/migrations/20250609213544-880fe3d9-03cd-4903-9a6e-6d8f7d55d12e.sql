
-- Atualizar a função para incluir TODOS os campos das etapas do projeto
CREATE OR REPLACE FUNCTION public.get_project_consolidated_data(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  project_data jsonb;
  client_data jsonb;
  service_data jsonb;
  main_consultant_data jsonb;
  support_consultant_data jsonb;
  stages_data jsonb;
  tags_data jsonb;
  consolidated_payload jsonb;
BEGIN
  -- Buscar dados COMPLETOS do projeto
  SELECT jsonb_build_object(
    'id', p.id,
    'project_id', p.project_id,
    'name', p.name,
    'description', p.description,
    'client_id', p.client_id,
    'service_id', p.service_id,
    'main_consultant_id', p.main_consultant_id,
    'main_consultant_commission', p.main_consultant_commission,
    'support_consultant_id', p.support_consultant_id,
    'support_consultant_commission', p.support_consultant_commission,
    'start_date', p.start_date,
    'end_date', p.end_date,
    'total_value', p.total_value,
    'total_hours', p.total_hours,
    'hourly_rate', p.hourly_rate,
    'tax_percent', p.tax_percent,
    'third_party_expenses', p.third_party_expenses,
    'main_consultant_value', p.main_consultant_value,
    'support_consultant_value', p.support_consultant_value,
    'manager_name', p.manager_name,
    'manager_email', p.manager_email,
    'manager_phone', p.manager_phone,
    'status', p.status,
    'tags', p.tags,
    'url', p.url,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO project_data
  FROM projects p
  WHERE p.id = p_project_id;
  
  -- Buscar dados COMPLETOS do cliente
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'contact_name', c.contact_name,
    'email', c.email,
    'phone', c.phone,
    'address', c.address,
    'city', c.city,
    'state', c.state,
    'zip_code', c.zip_code,
    'notes', c.notes,
    'created_at', c.created_at
  ) INTO client_data
  FROM clients c
  JOIN projects p ON p.client_id = c.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados COMPLETOS do serviço
  SELECT jsonb_build_object(
    'id', s.id,
    'name', s.name,
    'description', s.description,
    'total_hours', s.total_hours,
    'hourly_rate', s.hourly_rate,
    'total_value', s.total_value,
    'tax_rate', s.tax_rate,
    'extra_costs', s.extra_costs,
    'net_value', s.net_value,
    'stages', s.stages,
    'url', s.url,
    'created_at', s.created_at,
    'updated_at', s.updated_at
  ) INTO service_data
  FROM services s
  JOIN projects p ON p.service_id = s.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados COMPLETOS do consultor principal
  SELECT jsonb_build_object(
    'id', cons.id,
    'name', cons.name,
    'email', cons.email,
    'phone', cons.phone,
    'pix_key', cons.pix_key,
    'commission_percentage', cons.commission_percentage,
    'salary', cons.salary,
    'hours_per_month', cons.hours_per_month,
    'street', cons.street,
    'city', cons.city,
    'state', cons.state,
    'zip_code', cons.zip_code,
    'education', cons.education,
    'url', cons.url,
    'created_at', cons.created_at,
    'updated_at', cons.updated_at
  ) INTO main_consultant_data
  FROM consultants cons
  JOIN projects p ON p.main_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados COMPLETOS do consultor de apoio
  SELECT jsonb_build_object(
    'id', cons.id,
    'name', cons.name,
    'email', cons.email,
    'phone', cons.phone,
    'pix_key', cons.pix_key,
    'commission_percentage', cons.commission_percentage,
    'salary', cons.salary,
    'hours_per_month', cons.hours_per_month,
    'street', cons.street,
    'city', cons.city,
    'state', cons.state,
    'zip_code', cons.zip_code,
    'education', cons.education,
    'url', cons.url,
    'created_at', cons.created_at,
    'updated_at', cons.updated_at
  ) INTO support_consultant_data
  FROM consultants cons
  JOIN projects p ON p.support_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar TODAS as etapas com TODOS os campos das etapas, INCLUINDO as datas e consultor responsável
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', ps.id,
      'project_id', ps.project_id,
      'name', ps.name,
      'description', ps.description,
      'days', ps.days,
      'hours', ps.hours,
      'value', ps.value,
      'start_date', ps.start_date,
      'end_date', ps.end_date,
      'start_time', ps.start_time,
      'end_time', ps.end_time,
      'consultant_id', ps.consultant_id,
      'completed', ps.completed,
      'client_approved', ps.client_approved,
      'manager_approved', ps.manager_approved,
      'invoice_issued', ps.invoice_issued,
      'payment_received', ps.payment_received,
      'consultants_settled', ps.consultants_settled,
      'attachment', ps.attachment,
      'stage_order', ps.stage_order,
      'status', ps.status,
      'valor_de_repasse', ps.valor_de_repasse,
      'completed_at', ps.completed_at,
      'created_at', ps.created_at,
      'updated_at', ps.updated_at,
      -- Incluir dados COMPLETOS do consultor responsável pela etapa
      'consultant_responsible', CASE 
        WHEN ps.consultant_id IS NOT NULL THEN
          jsonb_build_object(
            'id', cons_stage.id,
            'name', cons_stage.name,
            'email', cons_stage.email,
            'phone', cons_stage.phone,
            'pix_key', cons_stage.pix_key,
            'commission_percentage', cons_stage.commission_percentage
          )
        ELSE NULL
      END,
      -- Formatação amigável das datas
      'formatted_dates', jsonb_build_object(
        'start_date_br', CASE 
          WHEN ps.start_date IS NOT NULL THEN to_char(ps.start_date, 'DD/MM/YYYY')
          ELSE NULL
        END,
        'end_date_br', CASE 
          WHEN ps.end_date IS NOT NULL THEN to_char(ps.end_date, 'DD/MM/YYYY')
          ELSE NULL
        END
      ),
      -- Informações financeiras da etapa
      'financial_info', jsonb_build_object(
        'stage_value', ps.value,
        'valor_de_repasse', COALESCE(ps.valor_de_repasse, 0),
        'margin', ps.value - COALESCE(ps.valor_de_repasse, 0),
        'margin_percentage', CASE 
          WHEN ps.value > 0 THEN ROUND(((ps.value - COALESCE(ps.valor_de_repasse, 0)) / ps.value) * 100, 2)
          ELSE 0
        END
      )
    )
    ORDER BY ps.stage_order ASC
  ) INTO stages_data
  FROM project_stages ps
  LEFT JOIN consultants cons_stage ON ps.consultant_id = cons_stage.id
  WHERE ps.project_id = p_project_id;
  
  -- Buscar tags do projeto
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', pt.id,
      'name', pt.name,
      'color', pt.color
    )
  ) INTO tags_data
  FROM project_tag_relations ptr
  JOIN project_tags pt ON ptr.tag_id = pt.id
  WHERE ptr.project_id = p_project_id;
  
  -- Montar payload consolidado COMPLETO com TODOS os campos
  consolidated_payload := jsonb_build_object(
    'event_type', 'project_created_consolidated',
    'timestamp', NOW(),
    'project_id', p_project_id,
    'project', project_data,
    'client', client_data,
    'service', service_data,
    'main_consultant', main_consultant_data,
    'support_consultant', support_consultant_data,
    'stages', COALESCE(stages_data, '[]'::jsonb),
    'tags', COALESCE(tags_data, '[]'::jsonb),
    'calculated_totals', jsonb_build_object(
      'stages_total_value', (
        SELECT COALESCE(SUM(ps.value), 0)
        FROM project_stages ps
        WHERE ps.project_id = p_project_id
      ),
      'stages_total_hours', (
        SELECT COALESCE(SUM(ps.hours), 0)
        FROM project_stages ps
        WHERE ps.project_id = p_project_id
      ),
      'stages_count', (
        SELECT COUNT(*)
        FROM project_stages ps
        WHERE ps.project_id = p_project_id
      ),
      'total_valor_de_repasse', (
        SELECT COALESCE(SUM(ps.valor_de_repasse), 0)
        FROM project_stages ps
        WHERE ps.project_id = p_project_id
      ),
      'total_margin', (
        SELECT COALESCE(SUM(ps.value - COALESCE(ps.valor_de_repasse, 0)), 0)
        FROM project_stages ps
        WHERE ps.project_id = p_project_id
      ),
      'tax_amount', (project_data->>'total_value')::numeric * (project_data->>'tax_percent')::numeric / 100,
      'net_value', (
        (project_data->>'total_value')::numeric - 
        ((project_data->>'total_value')::numeric * (project_data->>'tax_percent')::numeric / 100) -
        COALESCE((project_data->>'third_party_expenses')::numeric, 0) -
        COALESCE((project_data->>'main_consultant_value')::numeric, 0) -
        COALESCE((project_data->>'support_consultant_value')::numeric, 0)
      )
    ),
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'consolidation_type', 'project_creation_complete',
      'processed_at', NOW(),
      'webhook_version', '3.0_complete_with_all_stage_fields',
      'includes_all_fields', true,
      'includes_all_stages', true,
      'includes_stage_dates', true,
      'includes_stage_consultant', true,
      'includes_valor_de_repasse', true,
      'includes_calculated_totals', true,
      'includes_financial_breakdown', true
    )
  );
  
  RETURN consolidated_payload;
END;
$$;

-- Log de confirmação da atualização
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'webhook_payload_completo_v3', 
  'Função atualizada para incluir TODOS os campos das etapas incluindo datas, consultor e valor de repasse',
  jsonb_build_object(
    'timestamp', NOW(),
    'campos_adicionados', jsonb_build_array(
      'start_date',
      'end_date', 
      'consultant_responsible',
      'valor_de_repasse',
      'formatted_dates',
      'financial_info',
      'margin_calculations'
    ),
    'webhook_version', '3.0_complete_with_all_stage_fields',
    'versao_anterior', '2.0_complete'
  )
);
