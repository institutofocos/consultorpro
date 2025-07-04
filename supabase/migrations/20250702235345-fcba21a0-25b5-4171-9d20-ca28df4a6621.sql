
-- Criar tabela para armazenar API Keys
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  key_value text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  last_used_at timestamp with time zone,
  usage_count integer DEFAULT 0
);

-- Adicionar RLS para API Keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy para permitir que usuários autenticados vejam todas as API Keys
CREATE POLICY "Authenticated users can view api keys" 
  ON public.api_keys 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy para permitir que usuários autenticados criem API Keys
CREATE POLICY "Authenticated users can create api keys" 
  ON public.api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

-- Policy para permitir que usuários autenticados atualizem API Keys
CREATE POLICY "Authenticated users can update api keys" 
  ON public.api_keys 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Policy para permitir que usuários autenticados deletem API Keys
CREATE POLICY "Authenticated users can delete api keys" 
  ON public.api_keys 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Função para gerar API Keys únicas
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  key_prefix text := 'sk_';
  key_body text;
  full_key text;
BEGIN
  -- Gerar uma chave aleatória de 32 caracteres
  key_body := encode(gen_random_bytes(24), 'base64');
  key_body := replace(key_body, '/', '_');
  key_body := replace(key_body, '+', '-');
  key_body := replace(key_body, '=', '');
  
  full_key := key_prefix || key_body;
  
  -- Verificar se a chave já existe (muito improvável, mas por segurança)
  WHILE EXISTS (SELECT 1 FROM public.api_keys WHERE key_value = full_key) LOOP
    key_body := encode(gen_random_bytes(24), 'base64');
    key_body := replace(key_body, '/', '_');
    key_body := replace(key_body, '+', '-');
    key_body := replace(key_body, '=', '');
    full_key := key_prefix || key_body;
  END LOOP;
  
  RETURN full_key;
END;
$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Função para validar API Key
CREATE OR REPLACE FUNCTION validate_api_key(api_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a API Key existe e está ativa
  RETURN EXISTS (
    SELECT 1 FROM public.api_keys 
    WHERE key_value = api_key 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- Função para registrar uso da API Key
CREATE OR REPLACE FUNCTION log_api_key_usage(api_key text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.api_keys 
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1
  WHERE key_value = api_key;
END;
$$;
