
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import ChatRoomsList from './ChatRoomsList';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Users, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Room = {
  id: string;
  name: string;
  description: string;
  level: number;
  parentId: string | null;
};

// Dados de exemplo até implementar no Supabase
const mockRooms: Room[] = [
  { id: '1', name: 'Geral', description: 'Canal geral para todos os consultores', level: 1, parentId: null },
  { id: '2', name: 'Projetos', description: 'Discussões sobre projetos', level: 1, parentId: null },
  { id: '3', name: 'Vendas', description: 'Discussões sobre vendas e clientes', level: 1, parentId: null },
  { id: '4', name: 'Projeto X', description: 'Detalhes do Projeto X', level: 2, parentId: '2' },
  { id: '5', name: 'Projeto Y', description: 'Detalhes do Projeto Y', level: 2, parentId: '2' },
  { id: '6', name: 'Fase 1', description: 'Fase inicial do Projeto X', level: 3, parentId: '4' },
];

// Dados de exemplo de mensagens
const mockMessages = [
  { id: '1', roomId: '1', senderId: '1', senderName: 'João Silva', content: 'Olá a todos!', timestamp: new Date().toISOString() },
  { id: '2', roomId: '1', senderId: '2', senderName: 'Maria Oliveira', content: 'Bom dia, pessoal!', timestamp: new Date().toISOString() },
  { id: '3', roomId: '1', senderId: '1', senderName: 'João Silva', content: 'Como estão os projetos?', timestamp: new Date().toISOString() },
];

const ChatPage = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showConsultants, setShowConsultants] = useState(false);

  const { data: consultants, isLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants
  });

  const selectedRoom = mockRooms.find(room => room.id === selectedRoomId);
  
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
  };

  const handleSendMessage = (message: string) => {
    if (selectedRoomId) {
      console.log('Enviando mensagem para sala', selectedRoomId, ':', message);
      // Aqui implementaremos o envio da mensagem para o Supabase
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
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando consultores...</p>
                ) : (
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
                )}
              </div>
            ) : (
              <ChatRoomsList 
                rooms={mockRooms}
                selectedRoomId={selectedRoomId}
                onRoomSelect={handleRoomSelect}
              />
            )}
          </CardContent>
        </Card>

        {/* Área de Chat */}
        <Card className="md:col-span-3 shadow-card h-full flex flex-col">
          {selectedRoomId ? (
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
                <ChatMessages 
                  messages={mockMessages.filter(msg => msg.roomId === selectedRoomId)} 
                />
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
