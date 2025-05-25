
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UserPlus, Calendar, DollarSign, Clock, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { fetchDemandsWithoutConsultants, assignConsultantsToDemand } from "@/integrations/supabase/projects";
import { ConsultantSelect } from "@/components/ui/consultant-select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Demand {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  status: string;
  tags?: string[];
  clientName?: string;
  serviceName?: string;
  totalHours: number;
}

export const DemandsList: React.FC = () => {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    mainConsultantId: '',
    mainConsultantCommission: 0,
    supportConsultantId: '',
    supportConsultantCommission: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadDemands();
  }, []);

  const loadDemands = async () => {
    try {
      setLoading(true);
      const demandsData = await fetchDemandsWithoutConsultants();
      setDemands(demandsData);
    } catch (error) {
      console.error('Error loading demands:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as demandas"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignConsultant = (demand: Demand) => {
    setSelectedDemand(demand);
    setAssignmentData({
      mainConsultantId: '',
      mainConsultantCommission: 0,
      supportConsultantId: '',
      supportConsultantCommission: 0
    });
    setAssignModalOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedDemand || !assignmentData.mainConsultantId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione pelo menos o consultor principal"
      });
      return;
    }

    try {
      await assignConsultantsToDemand(
        selectedDemand.id,
        assignmentData.mainConsultantId,
        assignmentData.mainConsultantCommission,
        assignmentData.supportConsultantId || null,
        assignmentData.supportConsultantCommission
      );

      toast({
        title: "Sucesso",
        description: "Consultores atribuídos com sucesso!"
      });

      setAssignModalOpen(false);
      loadDemands(); // Recarregar lista
    } catch (error) {
      console.error('Error assigning consultants:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atribuir consultores"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planejado';
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-3"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Demandas</h1>
        <p className="text-muted-foreground">
          Projetos aguardando atribuição de consultores
        </p>
      </div>

      {demands.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Nenhuma demanda encontrada
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Todos os projetos já possuem consultores atribuídos ou não há projetos cadastrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demands.map((demand) => (
            <Card key={demand.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-tight">{demand.name}</CardTitle>
                  <Badge className={getStatusColor(demand.status)}>
                    {getStatusText(demand.status)}
                  </Badge>
                </div>
                {demand.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {demand.description}
                  </p>
                )}
              </CardHeader>
              
              <CardContent className="pt-0 space-y-3">
                {/* Informações do Cliente e Serviço */}
                {(demand.clientName || demand.serviceName) && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {demand.clientName} • {demand.serviceName}
                    </span>
                  </div>
                )}

                {/* Cronograma */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(new Date(demand.start_date), 'dd/MM/yy', { locale: ptBR })} - {format(new Date(demand.end_date), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                </div>

                {/* Valor e Horas */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-medium">
                      R$ {demand.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>{demand.totalHours}h</span>
                  </div>
                </div>

                {/* Tags */}
                {demand.tags && demand.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {demand.tags.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {demand.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{demand.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Botão de Ação */}
                <Button
                  onClick={() => handleAssignConsultant(demand)}
                  className="w-full mt-4"
                  size="sm"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Atribuir Consultor
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Atribuição */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atribuir Consultores ao Projeto</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDemand && (
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedDemand.name}</h4>
                <p className="text-sm text-muted-foreground">
                  R$ {selectedDemand.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {selectedDemand.totalHours}h
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label>Consultor Principal *</Label>
                <ConsultantSelect
                  value={assignmentData.mainConsultantId}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, mainConsultantId: value }))}
                  placeholder="Selecionar consultor principal..."
                />
              </div>

              <div>
                <Label>Comissão Principal (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={assignmentData.mainConsultantCommission}
                  onChange={(e) => setAssignmentData(prev => ({ ...prev, mainConsultantCommission: parseFloat(e.target.value) || 0 }))}
                />
              </div>

              <div>
                <Label>Consultor de Apoio (Opcional)</Label>
                <ConsultantSelect
                  value={assignmentData.supportConsultantId}
                  onValueChange={(value) => setAssignmentData(prev => ({ ...prev, supportConsultantId: value }))}
                  placeholder="Selecionar consultor de apoio..."
                />
              </div>

              {assignmentData.supportConsultantId && (
                <div>
                  <Label>Comissão Apoio (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={assignmentData.supportConsultantCommission}
                    onChange={(e) => setAssignmentData(prev => ({ ...prev, supportConsultantCommission: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveAssignment}>
                Atribuir Consultores
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandsList;
