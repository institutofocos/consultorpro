
-- Corrigir o trigger para atualizar corretamente o tempo total
CREATE OR REPLACE FUNCTION update_stage_time_on_session_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  total_time integer;
BEGIN
  -- Calcular o tempo total das sessões para esta etapa
  total_time := calculate_stage_total_time(COALESCE(NEW.stage_id, OLD.stage_id));
  
  -- Log para debug
  RAISE NOTICE 'Atualizando tempo da etapa %. Tempo calculado: % minutos', 
    COALESCE(NEW.stage_id, OLD.stage_id), total_time;
  
  -- Atualizar o time_spent_minutes na etapa
  UPDATE project_stages 
  SET time_spent_minutes = total_time,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.stage_id, OLD.stage_id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Também vamos melhorar a função de cálculo para ser mais robusta
CREATE OR REPLACE FUNCTION calculate_stage_total_time(p_stage_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  total_minutes integer := 0;
BEGIN
  -- Log para debug
  RAISE NOTICE 'Calculando tempo total para etapa: %', p_stage_id;
  
  -- Somar duração de todas as sessões concluídas
  SELECT COALESCE(SUM(duration_minutes), 0)
  INTO total_minutes
  FROM stage_work_sessions
  WHERE stage_id = p_stage_id 
  AND status = 'completed'
  AND duration_minutes IS NOT NULL
  AND duration_minutes > 0;
  
  -- Log do resultado
  RAISE NOTICE 'Tempo total calculado: % minutos para etapa %', total_minutes, p_stage_id;
  
  RETURN total_minutes;
END;
$$;

-- Verificar se há sessões órfãs e recalcular todos os tempos
DO $$
DECLARE
  stage_record RECORD;
  calculated_time integer;
BEGIN
  -- Para cada etapa, recalcular o tempo total
  FOR stage_record IN 
    SELECT DISTINCT stage_id 
    FROM stage_work_sessions 
    WHERE status = 'completed'
  LOOP
    calculated_time := calculate_stage_total_time(stage_record.stage_id);
    
    UPDATE project_stages 
    SET time_spent_minutes = calculated_time,
        updated_at = NOW()
    WHERE id = stage_record.stage_id;
    
    RAISE NOTICE 'Atualizada etapa % com % minutos', stage_record.stage_id, calculated_time;
  END LOOP;
END $$;
