
import React, { useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from 'lucide-react';
import { ChatMessage } from '@/integrations/supabase/chat';

interface ChatNotificationProps {
  userId?: string;  // Opcional para quando não temos autenticação
}

const ChatNotification: React.FC<ChatNotificationProps> = ({ userId = "temp-user-id" }) => {
  useEffect(() => {
    // Inscrever-se para receber novas mensagens de chat
    const subscription = supabase
      .channel('all-chat-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        
        // Não notificar sobre mensagens enviadas pelo próprio usuário
        if (newMessage.sender_id !== userId) {
          // Mostrar notificação
          toast({
            title: `Nova mensagem de ${newMessage.sender_name}`,
            description: newMessage.content.length > 50 
              ? `${newMessage.content.substring(0, 50)}...` 
              : newMessage.content,
            action: (
              <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4" />
              </div>
            ),
          });
          
          // Também usar a API de Notificação do navegador se disponível e permitida
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`Nova mensagem de ${newMessage.sender_name}`, {
              body: newMessage.content,
              icon: '/favicon.ico'  // Você pode usar um ícone personalizado
            });
          }
        }
      })
      .subscribe();
    
    // Solicitar permissão de notificação se ainda não foi decidido
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return null;  // Este componente não renderiza nada visualmente
};

export default ChatNotification;
