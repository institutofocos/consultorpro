
-- Criar tabela para tarefas internas dos projetos
CREATE TABLE project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_consultant_id UUID REFERENCES consultants(id),
  start_date DATE,
  end_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo para hierarquia de projetos
ALTER TABLE projects 
ADD COLUMN parent_project_id UUID REFERENCES projects(id);

-- Habilitar RLS para project_tasks
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para project_tasks
CREATE POLICY "Permitir visualização de tarefas" ON project_tasks FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de tarefas" ON project_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de tarefas" ON project_tasks FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de tarefas" ON project_tasks FOR DELETE USING (true);

-- Criar índices para performance
CREATE INDEX idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX idx_projects_parent_id ON projects(parent_project_id);

-- Adicionar trigger para atualizar updated_at nas tarefas
CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_project_tasks_updated_at();
