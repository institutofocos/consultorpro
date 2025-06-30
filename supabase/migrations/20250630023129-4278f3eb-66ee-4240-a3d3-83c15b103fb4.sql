
-- Remove a inserção de logs do trigger para evitar erro de RLS
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
  
  -- Removido o INSERT em system_logs para evitar erro de RLS
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
