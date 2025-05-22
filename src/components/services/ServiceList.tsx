import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus,
  Edit, 
  Trash,
  Clock,
  DollarSign,
  Calendar,
  Tag
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ServiceForm } from './ServiceForm';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Service, ServiceTag } from './types';

// Mock data - will be replaced with database data
const mockServices = [
  { 
    id: 1, 
    name: 'Consultoria Estratégica', 
    totalHours: 120, 
    hourlyRate: 125, 
    totalValue: 15000, 
    taxRate: 16, 
    extraCosts: 500, 
    netValue: 12100,
    stages: [
      { id: 1, name: 'Diagnóstico Inicial', hours: 40, value: 5000 },
      { id: 2, name: 'Desenvolvimento de Estratégia', hours: 60, value: 7500 },
      { id: 3, name: 'Implementação e Monitoramento', hours: 20, value: 2500 }
    ]
  },
  { 
    id: 2, 
    name: 'Gestão de Projetos', 
    totalHours: 160, 
    hourlyRate: 112.50, 
    totalValue: 18000, 
    taxRate: 16, 
    extraCosts: 800, 
    netValue: 14320,
    stages: [
      { id: 1, name: 'Planejamento', hours: 40, value: 4500 },
      { id: 2, name: 'Execução', hours: 100, value: 11250 },
      { id: 3, name: 'Encerramento', hours: 20, value: 2250 }
    ]
  },
  { 
    id: 3, 
    name: 'Análise de Dados', 
    totalHours: 80, 
    hourlyRate: 150, 
    totalValue: 12000, 
    taxRate: 16, 
    extraCosts: 300, 
    netValue: 9780,
    stages: [
      { id: 1, name: 'Coleta de Dados', hours: 20, value: 3000 },
      { id: 2, name: 'Processamento e Análise', hours: 40, value: 6000 },
      { id: 3, name: 'Elaboração de Relatórios', hours: 20, value: 3000 }
    ]
  }
];

export const ServiceList: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchServices = async () => {
    setIsLoading(true);
    try {
      // Fetch services
      const { data: servicesData, error } = await (supabase as any)
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch tags for each service
      const servicesWithTags = await Promise.all(
        (servicesData || []).map(async (service: any) => {
          // Get service tags
          const { data: serviceTags, error: tagError } = await supabase
            .from('service_tags')
            .select('tag_id, tags(id, name)')
            .eq('service_id', service.id);
            
          if (tagError) console.error('Error fetching tags for service:', tagError);
          
          const tags = (serviceTags || []).map((st: any) => ({
            id: st.tags.id,
            name: st.tags.name
          }));
          
          // Parse stages from JSON
          let stages = [];
          try {
            stages = JSON.parse(service.stages || '[]');
          } catch (e) {
            console.error('Error parsing stages JSON:', e);
          }
          
          return { 
            ...service,
            tags,
            stages
          };
        })
      );
      
      setServices(servicesWithTags || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error(`Erro ao carregar serviços: ${error.message}`);
      // Fallback to mock data for demo purposes
      setServices(mockServices);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchServices();
  }, []);
  
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddService = async (service: any) => {
    if (editingService) {
      try {
        // Update existing service
        const { error } = await (supabase as any)
          .from('services')
          .update({
            name: service.name,
            description: service.description,
            totalHours: service.totalHours,
            hourlyRate: service.hourlyRate,
            totalValue: service.totalValue,
            taxRate: service.taxRate,
            extraCosts: service.extraCosts,
            netValue: service.netValue,
            stages: JSON.stringify(service.stages)
          })
          .eq('id', editingService.id);
          
        if (error) throw error;
        
        // Delete existing tag relationships and add new ones
        await supabase
          .from('service_tags')
          .delete()
          .eq('service_id', editingService.id);
          
        if (service.tags && service.tags.length > 0) {
          const serviceTags = service.tags.map((tagId: string) => ({
            service_id: editingService.id,
            tag_id: tagId
          }));
          
          const { error: tagError } = await supabase
            .from('service_tags')
            .insert(serviceTags);
            
          if (tagError) throw tagError;
        }
        
        toast.success('Serviço atualizado com sucesso!');
        setEditingService(null);
      } catch (error: any) {
        console.error('Error updating service:', error);
        toast.error(`Erro ao atualizar serviço: ${error.message}`);
      }
    }
    
    setShowForm(false);
    fetchServices();
  };
  
  const handleEditService = (service: Service) => {
    setEditingService(service);
    setShowForm(true);
  };
  
  const handleDeleteService = async (id: string) => {
    try {
      // First delete related tags
      await supabase
        .from('service_tags')
        .delete()
        .eq('service_id', id);
        
      // Then delete the service
      const { error } = await (supabase as any)
        .from('services')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Serviço excluído com sucesso!');
      fetchServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      toast.error(`Erro ao excluir serviço: ${error.message}`);
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Serviços</h1>
        <p className="text-muted-foreground">Gerenciamento de serviços oferecidos</p>
      </div>
      
      {showForm ? (
        <ServiceForm 
          service={editingService} 
          onSave={handleAddService} 
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }} 
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar serviços..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Etapas</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Líquido</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.stages?.length || 0} etapas</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            {service.totalHours}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            R$ {service.totalValue?.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            R$ {service.netValue?.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {service.tags && service.tags.length > 0 ? (
                              service.tags.map((tag: any) => (
                                <Badge key={tag.id} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">Nenhuma</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum serviço encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ServiceList;
