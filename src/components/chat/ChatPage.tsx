import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Plus, Users, Phone, Video, Settings } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import ChatRoomsList from './ChatRoomsList';
import ChatRoom from './ChatRoom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  level: number;
  parent_id?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  projects?: {
    status: string;
  };
}

interface Project {
  id: string;
  name: string;
  status: string;
}

const ChatPage: React.FC = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchChatRooms();
    fetchProjects();
  }, []);

  const fetchChatRooms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          projects:project_id(status)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching chat rooms:', error);
        toast.error('Erro ao carregar salas de chat');
        return;
      }

      // Transform the data to handle the join properly
      const transformedData = data?.map(room => ({
        ...room,
        projects: room.projects ? { status: room.projects.status } : undefined
      })) || [];

      setChatRooms(transformedData);
    } catch (error) {
      console.error('Error in fetchChatRooms:', error);
      toast.error('Erro ao carregar salas de chat');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('name');

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  const handleRoomSelect = (room: ChatRoom) => {
    setSelectedRoom(room);
  };

  const handleCreateRoom = async () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setNewRoomName('');
    setNewRoomDescription('');
    setSelectedProjectId('');
  };

  const handleSaveRoom = async () => {
    if (!newRoomName) {
      toast.error('Nome da sala é obrigatório');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          name: newRoomName,
          description: newRoomDescription,
          project_id: selectedProjectId || null,
          level: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat room:', error);
        toast.error('Erro ao criar sala de chat');
        return;
      }

      fetchChatRooms();
      handleCloseDialog();
      toast.success('Sala de chat criada com sucesso!');
    } catch (error) {
      console.error('Error in handleSaveRoom:', error);
      toast.error('Erro ao criar sala de chat');
    }
  };

  const filteredChatRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen">
      {/* Chat Rooms List */}
      <div className="w-80 border-r bg-gray-50">
        <Card className="h-full rounded-none shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                <span>Salas de Chat</span>
              </div>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleCreateRoom}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Sala
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <Input
              type="text"
              placeholder="Buscar sala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {isLoading ? (
              <div className="text-center py-4">Carregando salas...</div>
            ) : (
              <ChatRoomsList
                chatRooms={filteredChatRooms}
                onRoomSelect={handleRoomSelect}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Room */}
      <div className="flex-1">
        {selectedRoom ? (
          <ChatRoom room={selectedRoom} />
        ) : (
          <Card className="h-full rounded-none shadow-none">
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                Selecione uma sala para começar a conversar.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Room Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Sala de Chat</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Nome
              </label>
              <Input
                type="text"
                id="name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">
                Descrição
              </label>
              <Textarea
                id="description"
                value={newRoomDescription}
                onChange={(e) => setNewRoomDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="project" className="text-right">
                Projeto
              </label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="col-span-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              >
                <option value="">Nenhum projeto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} ({project.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveRoom}>Criar Sala</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatPage;
