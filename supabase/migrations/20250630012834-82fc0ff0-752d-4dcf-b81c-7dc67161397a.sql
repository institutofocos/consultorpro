
-- Adicionar colunas para controle de tempo nas etapas
ALTER TABLE project_stages 
ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_status TEXT DEFAULT 'stopped',
ADD COLUMN IF NOT EXISTS last_pause_duration INTEGER DEFAULT 0;

-- Criar função para atualizar o tempo total do projeto baseado nas etapas
CREATE OR REPLACE FUNCTION update_project_total_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o total_hours do projeto com base na soma dos tempos das etapas
  UPDATE projects 
  SET total_hours = (
    SELECT COALESCE(SUM(time_spent_minutes), 0) / 60.0
    FROM project_stages 
    WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar automaticamente o tempo do projeto
DROP TRIGGER IF EXISTS trigger_update_project_total_time ON project_stages;
CREATE TRIGGER trigger_update_project_total_time
  AFTER UPDATE OF time_spent_minutes ON project_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_project_total_time();

-- Criar tabela para registrar sessões de trabalho (histórico detalhado)
CREATE TABLE IF NOT EXISTS stage_work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES project_stages(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_stage_work_sessions_stage_id ON stage_work_sessions(stage_id);
CREATE INDEX IF NOT EXISTS idx_stage_work_sessions_start_time ON stage_work_sessions(start_time);
