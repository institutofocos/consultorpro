
-- Limpar webhooks duplicados e implementar constraint de URL única
BEGIN;

-- 1. Limpar webhooks duplicados, mantendo apenas o mais recente de cada URL
DELETE FROM webhooks 
WHERE id NOT IN (
  SELECT DISTINCT ON (url) id
  FROM webhooks 
  ORDER BY url, created_at DESC
);

-- 2. Adicionar constraint de URL única para evitar futuros duplicados
ALTER TABLE webhooks 
ADD CONSTRAINT webhooks_url_unique UNIQUE (url);

-- 3. Log de limpeza
INSERT INTO public.system_logs (log_type, category, message, details)
VALUES (
  'success', 
  'webhook_duplicados_removidos', 
  'Webhooks duplicados removidos e constraint de URL única adicionada',
  jsonb_build_object(
    'timestamp', NOW(),
    'action', 'remove_duplicates_and_add_constraint',
    'constraint_added', 'webhooks_url_unique'
  )
);

COMMIT;
