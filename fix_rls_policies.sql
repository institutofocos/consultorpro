
-- Remover políticas problemáticas e recriar sem recursão
DROP POLICY IF EXISTS "Admins can view all logs" ON public.system_logs;
DROP POLICY IF EXISTS "Only admins can modify system settings" ON public.system_settings;

-- Política mais simples para logs - permitir visualização para usuários autenticados
CREATE POLICY "Authenticated users can view logs" 
  ON public.system_logs 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Política mais simples para configurações - permitir visualização para usuários autenticados
CREATE POLICY "Authenticated users can view settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Política para modificar configurações - permitir para usuários autenticados
CREATE POLICY "Authenticated users can modify settings" 
  ON public.system_settings 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Inserir alguns logs de exemplo para teste
INSERT INTO public.system_logs (log_type, category, message, details) VALUES
('info', 'system', 'Sistema iniciado com sucesso', '{"timestamp": "2025-01-24T12:00:00Z"}'),
('warning', 'webhook', 'Webhook processado com atraso', '{"webhook_id": "test-webhook", "delay": "5s"}'),
('error', 'auth', 'Falha na autenticação', '{"user": "test@example.com", "reason": "invalid_password"}'),
('success', 'settings', 'Configurações atualizadas', '{"setting": "timezone", "value": "America/Sao_Paulo"}');
