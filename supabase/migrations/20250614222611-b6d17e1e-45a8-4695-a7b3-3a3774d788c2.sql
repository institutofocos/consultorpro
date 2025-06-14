
-- Criar tabela para categorias de transações
CREATE TABLE public.transaction_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#3b82f6',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para subcategorias
CREATE TABLE public.transaction_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.transaction_categories(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para formas de pagamento
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  type TEXT NOT NULL CHECK (type IN ('cash', 'card', 'pix', 'transfer', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar campos à tabela manual_transactions
ALTER TABLE public.manual_transactions 
ADD COLUMN category_id UUID REFERENCES public.transaction_categories(id),
ADD COLUMN subcategory_id UUID REFERENCES public.transaction_subcategories(id),
ADD COLUMN payment_method_id UUID REFERENCES public.payment_methods(id),
ADD COLUMN installments INTEGER DEFAULT 1,
ADD COLUMN current_installment INTEGER DEFAULT 1,
ADD COLUMN receipt_url TEXT,
ADD COLUMN is_fixed_expense BOOLEAN DEFAULT false;

-- Inserir categorias padrão
INSERT INTO public.transaction_categories (name, icon, color, type) VALUES
('Alimentação', '🍽️', '#ef4444', 'expense'),
('Transporte', '🚗', '#3b82f6', 'expense'),
('Lazer', '🎮', '#8b5cf6', 'expense'),
('Saúde', '🏥', '#10b981', 'expense'),
('Educação', '📚', '#f59e0b', 'expense'),
('Casa', '🏠', '#6b7280', 'expense'),
('Trabalho', '💼', '#059669', 'both'),
('Investimentos', '📈', '#dc2626', 'income'),
('Outros', '📦', '#9ca3af', 'both');

-- Inserir subcategorias padrão
INSERT INTO public.transaction_subcategories (name, category_id) VALUES
('Restaurante', (SELECT id FROM public.transaction_categories WHERE name = 'Alimentação')),
('Supermercado', (SELECT id FROM public.transaction_categories WHERE name = 'Alimentação')),
('Combustível', (SELECT id FROM public.transaction_categories WHERE name = 'Transporte')),
('Uber/Taxi', (SELECT id FROM public.transaction_categories WHERE name = 'Transporte')),
('Cinema', (SELECT id FROM public.transaction_categories WHERE name = 'Lazer')),
('Streaming', (SELECT id FROM public.transaction_categories WHERE name = 'Lazer'));

-- Inserir formas de pagamento padrão
INSERT INTO public.payment_methods (name, icon, type) VALUES
('Dinheiro', '💵', 'cash'),
('Cartão de Débito', '💳', 'card'),
('Cartão de Crédito', '💳', 'card'),
('PIX', '📱', 'pix'),
('Transferência', '🏦', 'transfer'),
('Outros', '📦', 'other');

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (públicas para leitura, sem autenticação necessária para este caso)
CREATE POLICY "Allow read access to transaction_categories" ON public.transaction_categories FOR SELECT USING (true);
CREATE POLICY "Allow read access to transaction_subcategories" ON public.transaction_subcategories FOR SELECT USING (true);
CREATE POLICY "Allow read access to payment_methods" ON public.payment_methods FOR SELECT USING (true);
