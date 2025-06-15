
-- Verificar e corrigir as políticas RLS para as tabelas de configurações financeiras
-- Permitir operações completas nas tabelas de categorias, subcategorias e métodos de pagamento

-- Políticas para transaction_categories
DROP POLICY IF EXISTS "Allow read access to transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Allow insert access to transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Allow update access to transaction_categories" ON public.transaction_categories;
DROP POLICY IF EXISTS "Allow delete access to transaction_categories" ON public.transaction_categories;

CREATE POLICY "Allow all operations on transaction_categories" ON public.transaction_categories FOR ALL USING (true) WITH CHECK (true);

-- Políticas para transaction_subcategories
DROP POLICY IF EXISTS "Allow read access to transaction_subcategories" ON public.transaction_subcategories;
DROP POLICY IF EXISTS "Allow insert access to transaction_subcategories" ON public.transaction_subcategories;
DROP POLICY IF EXISTS "Allow update access to transaction_subcategories" ON public.transaction_subcategories;
DROP POLICY IF EXISTS "Allow delete access to transaction_subcategories" ON public.transaction_subcategories;

CREATE POLICY "Allow all operations on transaction_subcategories" ON public.transaction_subcategories FOR ALL USING (true) WITH CHECK (true);

-- Políticas para payment_methods
DROP POLICY IF EXISTS "Allow read access to payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow insert access to payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow update access to payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow delete access to payment_methods" ON public.payment_methods;

CREATE POLICY "Allow all operations on payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

-- Garantir que as colunas necessárias existam e tenham valores padrão corretos
ALTER TABLE public.transaction_categories 
  ALTER COLUMN type SET DEFAULT 'both',
  ALTER COLUMN color SET DEFAULT '#3b82f6',
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.transaction_subcategories 
  ALTER COLUMN is_active SET DEFAULT true;

ALTER TABLE public.payment_methods 
  ALTER COLUMN type SET DEFAULT 'other',
  ALTER COLUMN is_active SET DEFAULT true;
