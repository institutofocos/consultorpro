
-- Criar tabela para armazenar códigos temporários de recuperação de senha
CREATE TABLE public.password_reset_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar RLS para segurança
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção (será usada pela edge function)
CREATE POLICY "Allow insert for service role" 
  ON public.password_reset_codes 
  FOR INSERT 
  WITH CHECK (true);

-- Política para permitir leitura e atualização pelo próprio usuário
CREATE POLICY "Users can view their own reset codes" 
  ON public.password_reset_codes 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reset codes" 
  ON public.password_reset_codes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Função para limpar códigos expirados automaticamente
CREATE OR REPLACE FUNCTION public.cleanup_expired_reset_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.password_reset_codes 
  WHERE expires_at < NOW() OR used = true;
END;
$$;

-- Índice para performance
CREATE INDEX idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);
