
-- Adicionar o status "Iniciar Projeto" nas configurações de status de projetos
INSERT INTO project_status_settings (
  name,
  display_name,
  color,
  is_active,
  is_completion_status,
  is_cancellation_status,
  order_index
) VALUES (
  'iniciar_projeto',
  'Iniciar Projeto',
  '#9CA3AF',
  true,
  false,
  false,
  0
) ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  color = EXCLUDED.color,
  is_active = EXCLUDED.is_active,
  order_index = EXCLUDED.order_index;

-- Atualizar a ordem dos demais status para acomodar o novo status
UPDATE project_status_settings 
SET order_index = order_index + 1 
WHERE name != 'iniciar_projeto' AND order_index >= 0;

-- Garantir que o status "iniciar_projeto" seja o primeiro
UPDATE project_status_settings 
SET order_index = 0 
WHERE name = 'iniciar_projeto';
