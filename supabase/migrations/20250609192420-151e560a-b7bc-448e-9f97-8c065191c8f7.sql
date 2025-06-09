
-- Verificar se há outras funções que fazem referência ao stage_order problemático
-- e corrigir a função get_project_consolidated_data que pode estar causando o erro

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
  consolidated_payload jsonb;
BEGIN
  -- Buscar dados do projeto
  SELECT to_jsonb(p.*) INTO project_data
  FROM projects p
  WHERE p.id = p_project_id;
  
  -- Buscar dados do cliente
  SELECT to_jsonb(c.*) INTO client_data
  FROM clients c
  JOIN projects p ON p.client_id = c.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do serviço
  SELECT to_jsonb(s.*) INTO service_data
  FROM services s
  JOIN projects p ON p.service_id = s.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do consultor principal
  SELECT to_jsonb(cons.*) INTO main_consultant_data
  FROM consultants cons
  JOIN projects p ON p.main_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar dados do consultor de apoio
  SELECT to_jsonb(cons.*) INTO support_consultant_data
  FROM consultants cons
  JOIN projects p ON p.support_consultant_id = cons.id
  WHERE p.id = p_project_id;
  
  -- Buscar etapas do projeto - REMOVIDO ORDER BY stage_order que estava causando o erro
  SELECT jsonb_agg(to_jsonb(ps.*)) INTO stages_data
  FROM project_stages ps
  WHERE ps.project_id = p_project_id;
  
  -- Montar payload consolidado
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
    'system_info', jsonb_build_object(
      'source', 'ConsultorPRO System',
      'consolidation_type', 'project_creation',
      'processed_at', NOW()
    )
  );
  
  RETURN consolidated_payload;
END;
$$;

-- Verificar e corrigir qualquer outro trigger ou função que possa estar usando stage_order incorretamente
-- Recriar a função populate_gantt_from_project sem referenciar stage_order
CREATE OR REPLACE FUNCTION public.populate_gantt_from_project(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  project_record RECORD;
  stage_record RECORD;
BEGIN
  -- Buscar dados do projeto
  SELECT p.*, c.name as client_name, s.name as service_name, cons.name as consultant_name
  INTO project_record
  FROM projects p
  LEFT JOIN clients c ON p.client_id = c.id
  LEFT JOIN services s ON p.service_id = s.id
  LEFT JOIN consultants cons ON p.main_consultant_id = cons.id
  WHERE p.id = p_project_id;

  -- Se não encontrar o projeto, sair
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Inserir tarefa principal do projeto
  INSERT INTO public.gantt_tasks (
    project_id,
    task_name,
    task_description,
    start_date,
    end_date,
    duration_days,
    assigned_consultant_id,
    status
  ) VALUES (
    p_project_id,
    project_record.name,
    COALESCE(project_record.description, 'Projeto principal'),
    project_record.start_date,
    project_record.end_date,
    (project_record.end_date - project_record.start_date) + 1,
    project_record.main_consultant_id,
    CASE 
      WHEN project_record.status = 'completed' THEN 'completed'
      WHEN project_record.status = 'active' THEN 'in_progress'
      ELSE 'not_started'
    END
  );

  -- Inserir tarefas baseadas nas etapas do projeto - REMOVIDO ORDER BY stage_order
  FOR stage_record IN 
    SELECT * FROM project_stages 
    WHERE project_id = p_project_id 
  LOOP
    INSERT INTO public.gantt_tasks (
      project_id,
      task_name,
      task_description,
      start_date,
      end_date,
      duration_days,
      progress_percentage,
      assigned_consultant_id,
      status
    ) VALUES (
      p_project_id,
      stage_record.name,
      COALESCE(stage_record.description, ''),
      COALESCE(stage_record.start_date, project_record.start_date),
      COALESCE(stage_record.end_date, project_record.end_date),
      stage_record.days,
      CASE 
        WHEN stage_record.completed THEN 100
        ELSE 0
      END,
      stage_record.consultant_id,
      CASE 
        WHEN stage_record.completed THEN 'completed'
        WHEN stage_record.status = 'em_producao' THEN 'in_progress'
        ELSE 'not_started'
      END
    );
  END LOOP;
END;
$$;
