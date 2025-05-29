import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Trash2, Plus, Eye, Clock, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ServiceForm } from './ServiceForm';
import { Service } from '@/integrations/supabase/services';
import { fetchServices } from '@/integrations/supabase/services';
import { useToast } from "@/components/ui/use-toast";
import { formatDateBR } from '@/utils/dateUtils';

const ServiceList = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const servicesData = await fetchServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleServiceSaved = () => {
    loadServices();
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        // For now, we'll implement a simple delete using supabase directly
        const { supabase } = await import('@/integrations/supabase/client');
        const { error } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId);
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Serviço excluído com sucesso.",
        });
        loadServices();
      } catch (error) {
        console.error('Error deleting service:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível excluir o serviço.",
        });
      }
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerenciamento de serviços oferecidos</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerenciamento de serviços oferecidos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingService(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </DialogTitle>
            </DialogHeader>
            <ServiceForm
              service={editingService}
              onSave={handleServiceSaved}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">Etapas</th>
                  <th className="pb-3 font-medium">Carga Horária</th>
                  <th className="pb-3 font-medium">Valor Total</th>
                  <th className="pb-3 font-medium">Valor Líquido</th>
                  <th className="pb-3 font-medium">Tags</th>
                  <th className="pb-3 font-medium">Ações</th>
                </tr>
              </thead>
            </table>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum serviço encontrado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium">{service.name}</p>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">
                          {service.stages ? `${Array.isArray(service.stages) ? service.stages.length : Object.keys(service.stages).length} etapas` : '0 etapas'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-3 w-3" />
                          {service.total_hours ? `${service.total_hours}h` : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(service.total_value)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-sm">
                          <DollarSign className="h-3 w-3" />
                          {formatCurrency(service.net_value)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">SEBRAE DF</Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedService(service);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingService(service);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Details Dialog - Now wider and with complete information */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Detalhes do Serviço</DialogTitle>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-6">
              {/* Service Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">{selectedService.name}</h3>
                {selectedService.description && (
                  <p className="text-muted-foreground">
                    {selectedService.description}
                  </p>
                )}
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Horas Totais</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {selectedService.total_hours || 0}h
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Taxa por Hora</p>
                  <p className="text-lg font-semibold text-green-900">
                    {formatCurrency(selectedService.hourly_rate)}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-700">Valor Total</p>
                  <p className="text-lg font-semibold text-purple-900">
                    {formatCurrency(selectedService.total_value)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-orange-700">Valor Líquido</p>
                  <p className="text-lg font-semibold text-orange-900">
                    {formatCurrency(selectedService.net_value)}
                  </p>
                </div>
              </div>

              {/* Service Stages */}
              {selectedService.stages && (
                <div>
                  <h4 className="text-lg font-semibold mb-4">Etapas do Serviço</h4>
                  <div className="space-y-3">
                    {Array.isArray(selectedService.stages)
                      ? selectedService.stages.map((stage: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  Etapa {index + 1}: {stage.name}
                                </h5>
                                {stage.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {stage.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {stage.days && (
                                <div>
                                  <span className="font-medium text-gray-700">Dias:</span>
                                  <span className="ml-1 text-gray-600">{stage.days}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-700">Horas:</span>
                                <span className="ml-1 text-gray-600">{stage.hours || 0}h</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Valor:</span>
                                <span className="ml-1 text-gray-600">{formatCurrency(stage.value || 0)}</span>
                              </div>
                              {stage.attachment && (
                                <div>
                                  <span className="font-medium text-gray-700">Anexo:</span>
                                  <span className="ml-1 text-blue-600 underline cursor-pointer">
                                    {stage.attachmentName || 'Ver arquivo'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      : Object.entries(selectedService.stages).map(([key, stage]: [string, any]) => (
                          <div key={key} className="border border-gray-200 rounded-lg p-4 bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">
                                  {stage.name}
                                </h5>
                                {stage.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {stage.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {stage.days && (
                                <div>
                                  <span className="font-medium text-gray-700">Dias:</span>
                                  <span className="ml-1 text-gray-600">{stage.days}</span>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-700">Horas:</span>
                                <span className="ml-1 text-gray-600">{stage.hours || 0}h</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Valor:</span>
                                <span className="ml-1 text-gray-600">{formatCurrency(stage.value || 0)}</span>
                              </div>
                              {stage.attachment && (
                                <div>
                                  <span className="font-medium text-gray-700">Anexo:</span>
                                  <span className="ml-1 text-blue-600 underline cursor-pointer">
                                    {stage.attachmentName || 'Ver arquivo'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                    }
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedService.created_at && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Data de Criação</p>
                    <p className="text-sm text-gray-600">
                      {formatDateBR(selectedService.created_at)}
                    </p>
                  </div>
                )}
                {selectedService.updated_at && (
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm font-medium text-gray-700">Última Atualização</p>
                    <p className="text-sm text-gray-600">
                      {formatDateBR(selectedService.updated_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServiceList;
