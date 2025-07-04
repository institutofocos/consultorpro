
-- Corrigir a função get_available_chat_users para resolver ambiguidade de coluna
CREATE OR REPLACE FUNCTION get_available_chat_users()
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id::UUID as user_id,
    c.name::TEXT,
    c.email::TEXT,
    'consultant'::TEXT as type
  FROM public.consultants c
  WHERE c.id IS NOT NULL
  UNION ALL
  SELECT 
    cl.id::UUID as user_id,
    COALESCE(cl.contact_name, cl.name)::TEXT as name,
    COALESCE(cl.email, '')::TEXT,
    'client'::TEXT as type
  FROM public.clients cl
  WHERE cl.id IS NOT NULL;
END;
$$;
