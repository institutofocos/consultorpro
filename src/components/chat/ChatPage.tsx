
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { fetchChatRooms, fetchChatMessages, sendChatMessage, ChatMessage, ChatRoom } from '@/integrations/supabase/chat';
import { useToast } from "@/hooks/use-toast";
import ChatRoomsList from './ChatRoomsList';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Users, MessageSquare, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

type LocationState = {
  initialRoomId?: string;
};

// Create a valid temporary UUID for development
const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";
const TEMP_USER_NAME = "Usuário Teste";

const ChatPage = () => {
  const location = useLocation();
  const locationState = location.state as LocationState;
  const initialRoomId = locationState?.initialRoomId;
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  const [showConsultants, setShowConsultants] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { toast } = useToast();

  // Buscar consultores
  const { 
    data: consultants,
    isLoading: isLoadingConsultants 
  } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants
  });

  // Buscar salas de chat
  const { 
    data: rooms = [],
    isLoading: isLoadingRooms,
    refetch: refetchRooms
  } = useQuery({
    queryKey: ['chat_rooms'],
    queryFn: fetchChatRooms
  });

  // Verificar se initialRoomId existe nas salas carregadas
  useEffect(() => {
    if (initialRoomId && rooms.length > 0) {
      if (!rooms.some(room => room.id === initialRoomId)) {
        setSelectedRoomId(null);
      }
    }
  }, [initialRoomId, rooms]);

  // Buscar mensagens e configurar real-time quando uma sala é selecionada
  useEffect(() => {
    let subscription: any;
    
    const loadMessages = async () => {
      if (selectedRoomId) {
        try {
          const chatMessages = await fetchChatMessages(selectedRoomId);
          setMessages(chatMessages);
          
          // Configurar escuta em tempo real para novas mensagens
          subscription = supabase
            .channel(`room-${selectedRoomId}-messages`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `room_id=eq.${selectedRoomId}`
            }, (payload) => {
              console.log('Nova mensagem recebida:', payload.new);
              const newMessage = payload.new as ChatMessage;
              setMessages(prev => [...prev, newMessage]);
            })
            .subscribe();

          console.log('Subscription configurada para sala:', selectedRoomId);
        } catch (error) {
          console.error('Erro ao carregar mensagens:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível carregar as mensagens."
          });
        }
      } else {
        setMessages([]);
      }
    };
    
    loadMessages();
    
    return () => {
      // Limpar subscription ao desmontar ou trocar de sala
      if (subscription) {
        console.log('Removendo subscription da sala:', selectedRoomId);
        subscription.unsubscribe();
      }
    };
  }, [selectedRoomId, toast]);

  const selectedRoom = rooms.find(room => room.id === selectedRoomId);
  
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleSendMessage = async (messageContent: string) => {
    if (selectedRoomId) {
      try {
        console.log('Enviando mensagem:', messageContent);
        await sendChatMessage(selectedRoomId, TEMP_USER_ID, TEMP_USER_NAME, messageContent);
        console.log('Mensagem enviada com sucesso');
        // A mensagem aparecerá automaticamente através do subscription
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível enviar a mensagem."
        });
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Chat Interno</h1>
        <p className="text-muted-foreground">Comunique-se com outros consultores em tempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-240px)]">
        {/* Painel Lateral - Salas e Consultores */}
        <Card className="md:col-span-1 shadow-card h-full">
          <CardHeader className="px-4 py-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">
                {showConsultants ? (
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Consultores</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>Salas</span>
                  </div>
                )}
              </CardTitle>
              
              <div className="flex space-x-1">
                <button 
                  onClick={() => setShowConsultants(false)}
                  className={`p-1 rounded ${!showConsultants ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  <MessageSquare size={18} />
                </button>
                <button 
                  onClick={() => setShowConsultants(true)}
                  className={`p-1 rounded ${showConsultants ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                >
                  <Users size={18} />
                </button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0 overflow-y-auto h-[calc(100%-56px)]">
            {showConsultants ? (
              <div className="p-4 space-y-2">
                {isLoadingConsultants ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : consultants?.length ? (
                  consultants?.map(consultant => (
                    <div 
                      key={consultant.id}
                      className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer"
                    >
                      <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                        <span className="text-sm font-medium">
                          {consultant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{consultant.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum consultor encontrado
                  </p>
                )}
              </div>
            ) : (
              <ChatRoomsList 
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onRoomSelect={handleRoomSelect}
                isLoading={isLoadingRooms}
                onRoomCreated={refetchRooms}
              />
            )}
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="md:col-span-3 shadow-card h-full flex flex-col">
          {selectedRoomId && selectedRoom ? (
            <>
              <CardHeader className="px-6 py-3">
                <CardTitle className="text-lg">
                  {selectedRoom?.name}
                  {selectedRoom?.description && (
                    <span className="text-sm font-normal ml-2 text-muted-foreground">
                      {selectedRoom.description}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-6 flex-grow overflow-y-auto">
                <ChatMessages messages={messages} />
              </CardContent>
              <div className="p-4 border-t">
                <ChatInput onSendMessage={handleSendMessage} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Selecione uma sala</h3>
                <p className="text-muted-foreground">
                  Escolha uma sala no painel lateral para começar a conversar
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ChatPage;
