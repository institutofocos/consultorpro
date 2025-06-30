
-- Adicionar índices para melhorar performance nas consultas de histórico
CREATE INDEX IF NOT EXISTS idx_stage_work_sessions_created_at ON stage_work_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stage_work_sessions_status ON stage_work_sessions(status);

-- Função para calcular o tempo total das sessões de uma etapa
CREATE OR REPLACE FUNCTION calculate_stage_total_time(p_stage_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total_minutes integer := 0;
BEGIN
  -- Somar duração de todas as sessões concluídas
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO total_minutes
  FROM stage_work_sessions
  WHERE stage_id = p_stage_id 
  AND status = 'completed'
  AND duration_minutes > 0;
  
  RETURN total_minutes;
END;
$$;

-- Função trigger para atualizar automaticamente o tempo total na etapa
CREATE OR REPLACE FUNCTION update_stage_time_on_session_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_time integer;
BEGIN
  -- Calcular o tempo total das sessões para esta etapa
  total_time := calculate_stage_total_time(COALESCE(NEW.stage_id, OLD.stage_id));
  
  -- Atualizar o time_spent_minutes na etapa
  UPDATE project_stages 
  SET time_spent_minutes = total_time,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.stage_id, OLD.stage_id);
  
  -- Log da atualização
  INSERT INTO system_logs (log_type, category, message, details)
  VALUES (
    'info',
    'timer_update',
    'Tempo total da etapa atualizado automaticamente',
    jsonb_build_object(
      'stage_id', COALESCE(NEW.stage_id, OLD.stage_id),
      'total_time_minutes', total_time,
      'trigger_event', TG_OP
    )
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Criar trigger para atualizar automaticamente o tempo quando sessões são modificadas
DROP TRIGGER IF EXISTS trigger_update_stage_time_on_session_change ON stage_work_sessions;
CREATE TRIGGER trigger_update_stage_time_on_session_change
  AFTER INSERT OR UPDATE OR DELETE ON stage_work_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_time_on_session_change();
