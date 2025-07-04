
-- Criar tabela para armazenar grupos de projetos
CREATE TABLE IF NOT EXISTS public.project_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar tabela para relacionar projetos com grupos
CREATE TABLE IF NOT EXISTS public.project_group_relations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.project_groups(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, project_id)
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.project_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_group_relations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para project_groups
CREATE POLICY "Users can manage their own project groups"
  ON public.project_groups
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para project_group_relations
CREATE POLICY "Users can manage their own project group relations"
  ON public.project_group_relations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.project_groups pg 
      WHERE pg.id = group_id AND pg.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_groups pg 
      WHERE pg.id = group_id AND pg.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_project_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_project_groups_updated_at
  BEFORE UPDATE ON public.project_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_project_groups_updated_at();
