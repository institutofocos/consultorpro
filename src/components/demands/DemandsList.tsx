
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DemandViewModal from './DemandViewModal';
import ChatModal from '../chat/ChatModal';

interface Demand {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  client_id?: string;
  consultant_id?: string;
  project_id?: string;
  clients?: { name: string };
  consultants?: { name: string };
  projects?: { name: string };
}

const DemandsList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [chatDemand, setChatDemand] = useState<Demand | null>(null);

  const { data: demands, isLoading } = useQuery({
    queryKey: ['demands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demands')
        .select(`
          *,
          clients(name),
          consultants(name),
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (demandData: Partial<Demand>) => {
      const { error } = await supabase
        .from('demands')
        .insert({
          ...demandData,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demands'] });
      setShowForm(false);
      toast({
        title: "Sucesso",
        description: "Demanda criada com sucesso",
      });
    },
    onError: (error) => {
      console.error('Error creating demand:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar demanda",
        variant: "destructive",
      });
    },
  });

  const handleCreateDemand = () => {
    // For now, create a simple demand - you can enhance this later with a proper form
    const newDemand = {
      title: "Nova Demanda",
      description: "Descrição da demanda",
      status: "open",
      priority: "medium"
    };
    
    createMutation.mutate(newDemand);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-orange-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Demandas</h1>
        <Button onClick={handleCreateDemand}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Demanda
        </Button>
      </div>

      <div className="grid gap-4">
        {demands?.map((demand) => (
          <Card key={demand.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{demand.title}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(demand.priority)}>
                    {demand.priority === 'high' ? 'Alta' : 
                     demand.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                  <Badge className={getStatusColor(demand.status)}>
                    {demand.status === 'open' ? 'Aberto' :
                     demand.status === 'in_progress' ? 'Em Progresso' :
                     demand.status === 'resolved' ? 'Resolvido' : 'Fechado'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{demand.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500 mb-4">
                {demand.clients && (
                  <div>Cliente: {demand.clients.name}</div>
                )}
                {demand.consultants && (
                  <div>Consultor: {demand.consultants.name}</div>
                )}
                {demand.projects && (
                  <div>Projeto: {demand.projects.name}</div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedDemand(demand)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setChatDemand(demand)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedDemand && (
        <DemandViewModal
          demand={selectedDemand}
          isOpen={!!selectedDemand}
          onClose={() => setSelectedDemand(null)}
        />
      )}

      {chatDemand && (
        <ChatModal
          isOpen={!!chatDemand}
          onClose={() => setChatDemand(null)}
          demandId={chatDemand.id}
          demandTitle={chatDemand.title}
        />
      )}
    </div>
  );
};

export default DemandsList;
