
-- Remover triggers relacionados ao chat
DROP TRIGGER IF EXISTS chat_messages_updated_at ON public.chat_messages;
DROP TRIGGER IF EXISTS chat_rooms_updated_at ON public.chat_rooms;
DROP TRIGGER IF EXISTS chat_room_participants_updated_at ON public.chat_room_participants;

-- Remover tabelas de chat (na ordem correta devido às foreign keys)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_room_participants CASCADE; 
DROP TABLE IF EXISTS public.chat_rooms CASCADE;

-- Remover tabelas de mensagens de demanda (se existirem)
DROP TABLE IF EXISTS public.demand_chat_messages CASCADE;

-- Limpar logs do sistema relacionados ao chat
DELETE FROM public.system_logs 
WHERE category LIKE '%chat%' 
   OR message LIKE '%chat%' 
   OR details::text LIKE '%chat%';

-- Remover configurações do sistema relacionadas ao chat
DELETE FROM public.system_settings 
WHERE setting_key LIKE '%chat%';
