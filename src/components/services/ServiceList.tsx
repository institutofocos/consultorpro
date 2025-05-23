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
  Tag
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ServiceForm } from './ServiceForm';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Service, ServiceTag } from './types';

// Mock data - will be replaced with database data
const mockServices: Service[] = [
  { 
    id: "1", 
    name: 'Consultoria Estratégica', 
    totalHours: 120, 
    hourlyRate: 125, 
    totalValue: 15000, 
    taxRate: 16, 
    extraCosts: 500, 
    netValue: 12100,
    stages: [
      { id: 1, name: 'Diagnóstico Inicial', hours: 40, value: 5000, days: 5 },
      { id: 2, name: 'Desenvolvimento de Estratégia', hours: 60, value: 7500, days: 7 },
      { id: 3, name: 'Implementação e Monitoramento', hours: 20, value: 2500, days: 3 }
    ],
    tags: [] // Added empty tags array to comply with Service type
  },
  { 
    id: "2", 
    name: 'Gestão de Projetos', 
    totalHours: 160, 
    hourlyRate: 112.50, 
    totalValue: 18000, 
    taxRate: 16, 
    extraCosts: 800, 
    netValue: 14320,
    stages: [
      { id: 1, name: 'Planejamento', hours: 40, value: 4500, days: 5 },
      { id: 2, name: 'Execução', hours: 100, value: 11250, days: 12 },
      { id: 3, name: 'Encerramento', hours: 20, value: 2250, days: 3 }
    ],
    tags: [] // Added empty tags array to comply with Service type
  },
  { 
    id: "3", 
    name: 'Análise de Dados', 
    totalHours: 80, 
    hourlyRate: 150, 
    totalValue: 12000, 
    taxRate: 16, 
    extraCosts: 300, 
    netValue: 9780,
    stages: [
      { id: 1, name: 'Coleta de Dados', hours: 20, value: 3000, days: 3 },
      { id: 2, name: 'Processamento e Análise', hours: 40, value: 6000, days: 5 },
      { id: 3, name: 'Elaboração de Relatórios', hours: 20, value: 3000, days: 2 }
    ],
    tags: [] // Added empty tags array to comply with Service type
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
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log('Services data:', servicesData);
      
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
            if (typeof service.stages === 'string') {
              stages = JSON.parse(service.stages);
            } else if (service.stages) {
              stages = service.stages;
            }
          } catch (e) {
            console.error('Error parsing stages JSON:', e);
          }
          
          return { 
            ...service,
            // Map database column names to our component property names for consistency
            id: service.id,
            name: service.name,
            description: service.description,
            totalHours: service.total_hours,
            hourlyRate: service.hourly_rate,
            totalValue: service.total_value,
            taxRate: service.tax_rate,
            extraCosts: service.extra_costs,
            netValue: service.net_value,
            tags,
            stages
          };
        })
      );
      
      console.log('Services with tags:', servicesWithTags);
      setServices(servicesWithTags || []);
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error(`Erro ao carregar serviços: ${error.message}`);
      setServices([]);
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
    setShowForm(false);
    fetchServices(); // Refresh the list
  };
  
  const handleEditService = (service: Service) => {
    console.log('Editing service:', service);
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
      const { error } = await supabase
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
                              service.tags.map((tag: ServiceTag) => (
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
