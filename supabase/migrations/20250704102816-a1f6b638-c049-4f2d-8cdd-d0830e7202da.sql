
-- Adicionar coluna meeting_link à tabela chat_rooms
ALTER TABLE public.chat_rooms 
ADD COLUMN meeting_link TEXT;

-- Criar índice para melhor performance em consultas por meeting_link
CREATE INDEX idx_chat_rooms_meeting_link ON public.chat_rooms(meeting_link) WHERE meeting_link IS NOT NULL;
