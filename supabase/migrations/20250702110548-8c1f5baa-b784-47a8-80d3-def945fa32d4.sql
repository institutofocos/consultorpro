
-- Criar tabela para demandas (será usada como base para o chat)
CREATE TABLE IF NOT EXISTS public.demands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  client_id UUID REFERENCES public.clients(id),
  consultant_id UUID REFERENCES public.consultants(id),
  project_id UUID REFERENCES public.projects(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para visualizações de demandas
CREATE TABLE IF NOT EXISTS public.demand_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(demand_id, user_id)
);

-- Criar tabela para mensagens de chat das demandas
CREATE TABLE IF NOT EXISTS public.demand_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demand_id UUID NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para demands
CREATE POLICY "Users can view demands" ON public.demands FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create demands" ON public.demands FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update demands" ON public.demands FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Políticas para demand_views
CREATE POLICY "Users can view their own demand views" ON public.demand_views FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own demand views" ON public.demand_views FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own demand views" ON public.demand_views FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para demand_chat_messages
CREATE POLICY "Users can view chat messages" ON public.demand_chat_messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create chat messages" ON public.demand_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
