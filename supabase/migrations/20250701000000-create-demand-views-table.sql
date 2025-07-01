
-- Criar tabela para rastrear visualizações de demandas
CREATE TABLE IF NOT EXISTS demand_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(demand_id, user_id)
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_demand_views_demand_id ON demand_views(demand_id);
CREATE INDEX IF NOT EXISTS idx_demand_views_user_id ON demand_views(user_id);
CREATE INDEX IF NOT EXISTS idx_demand_views_viewed_at ON demand_views(viewed_at);

-- Configurar RLS
ALTER TABLE demand_views ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias visualizações
CREATE POLICY "Users can view their own demand views" ON demand_views
  FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir que usuários insiram suas próprias visualizações
CREATE POLICY "Users can insert their own demand views" ON demand_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias visualizações
CREATE POLICY "Users can update their own demand views" ON demand_views
  FOR UPDATE USING (auth.uid() = user_id);

-- Habilitar realtime para a tabela
ALTER TABLE demand_views REPLICA IDENTITY FULL;
