
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { FileCheck, Calendar, DollarSign, Users, Clock, Clock3, UserCheck, Filter } from 'lucide-react';
import { fetchDemandsWithoutConsultants, assignConsultantsToDemand } from '@/integrations/supabase/projects';
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { fetchServices } from '@/integrations/supabase/services';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ptBR } from 'date-fns/locale';

const DemandsList = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<{id: string, name: string}[]>([]);
  const [services, setServices] = useState<{id: string, name: string}[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [mainConsultantId, setMainConsultantId] = useState<string>("");
  const [mainConsultantCommission, setMainConsultantCommission] = useState<number>(0);
  const [supportConsultantId, setSupportConsultantId] = useState<string>("");
  const [supportConsultantCommission, setSupportConsultantCommission] = useState<number>(0);
  const { toast } = useToast();
  
  // Filter states
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch demands
        const demandsData = await fetchDemandsWithoutConsultants();
        setDemands(demandsData);
        
        // Fetch consultants for the assignment dialog
        const consultantsData = await fetchConsultants();
        setConsultants(consultantsData);
        
        // Fetch services for filtering
        const servicesData = await fetchServices();
        setServices(servicesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up a periodic refresh to check for changes
    const interval = setInterval(() => fetchData(), 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Function to handle opening the consultant assignment dialog
  const handleOpenAssignmentDialog = (demand: any) => {
    setSelectedDemand(demand);
    setMainConsultantId("");
    setSupportConsultantId("");
    setMainConsultantCommission(0);
    setSupportConsultantCommission(0);
    setDialogOpen(true);
  };
  
  // Function to handle consultant assignment
  const handleAssignConsultants = async () => {
    if (!selectedDemand) return;
    
    try {
      await assignConsultantsToDemand(
        selectedDemand.id,
        mainConsultantId || null,
        mainConsultantCommission,
        supportConsultantId || null,
        supportConsultantCommission
      );
      
      toast({
        title: "Sucesso",
        description: "Consultores atribuídos com sucesso. A demanda foi movida para Projetos.",
      });
      
      // Remove the assigned demand from the list
      setDemands(demands.filter(d => d.id !== selectedDemand.id));
      setDialogOpen(false);
    } catch (error) {
      console.error('Error assigning consultants:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atribuir os consultores.",
      });
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setServiceFilter("");
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
  };
  
  // Filter demands based on selected filters
  const filteredDemands = demands.filter(demand => {
    // Service filter
    const matchesService = !serviceFilter || demand.services?.id === serviceFilter;
    
    // Date range filtering
    let matchesDateRange = true;
    if (startDateFilter) {
      const demandStartDate = new Date(demand.start_date);
      matchesDateRange = matchesDateRange && demandStartDate >= startDateFilter;
    }
    if (endDateFilter) {
      const demandEndDate = new Date(demand.end_date);
      matchesDateRange = matchesDateRange && demandEndDate <= endDateFilter;
    }
    
    return matchesService && matchesDateRange;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Demandas</h1>
        <p className="text-muted-foreground">Gerencie todas as demandas de clientes</p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={serviceFilter} onValueChange={setServiceFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os serviços</SelectItem>
            {services.map(service => (
              <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto flex justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {startDateFilter ? format(startDateFilter, 'dd/MM/yyyy', { locale: ptBR }) : "Data de início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={startDateFilter}
              onSelect={setStartDateFilter}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto flex justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              {endDateFilter ? format(endDateFilter, 'dd/MM/yyyy', { locale: ptBR }) : "Data de fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={endDateFilter}
              onSelect={setEndDateFilter}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Limpar filtros
        </Button>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              <span>Lista de Demandas</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Carregando demandas...</p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Não há demandas disponíveis no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDemands.map((demand) => (
                <Card key={demand.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{demand.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{demand.description || "Sem descrição"}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant={demand.status === 'planned' ? 'outline' : demand.status === 'active' ? 'default' : demand.status === 'completed' ? 'secondary' : 'destructive'}>
                            {demand.status === 'planned' ? 'Planejado' : 
                             demand.status === 'active' ? 'Em Andamento' : 
                             demand.status === 'completed' ? 'Concluído' : 'Cancelado'}
                          </Badge>
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenAssignmentDialog(demand)}
                            className="mt-2"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Atribuir Consultores
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Início</p>
                            <p className="text-muted-foreground">{format(new Date(demand.start_date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Fim</p>
                            <p className="text-muted-foreground">{format(new Date(demand.end_date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Valor</p>
                            <p className="text-muted-foreground">{formatCurrency(demand.total_value)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Cliente</p>
                            <p className="text-muted-foreground">{demand.clientName || "Sem cliente"}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* New service information section */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm border-t pt-3">
                        <div className="flex items-center gap-2">
                          <FileCheck className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Serviço</p>
                            <p className="text-muted-foreground">{demand.serviceName || "Não especificado"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Total de Horas</p>
                            <p className="text-muted-foreground">{demand.totalHours || 0} horas</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Total de Dias</p>
                            <p className="text-muted-foreground">{demand.totalDays || 0} dias</p>
                          </div>
                        </div>
                      </div>
                      
                      {demand.tags && demand.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {demand.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Estas demandas estão aguardando associação a um consultor. Uma vez atribuídas, serão movidas para Projetos.
        </CardFooter>
      </Card>
      
      {/* Consultant Assignment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Consultores ao Projeto</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="main-consultant" className="text-sm font-medium">
                Consultor Principal
              </label>
              <Select value={mainConsultantId} onValueChange={setMainConsultantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum consultor</SelectItem>
                  {consultants.map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {mainConsultantId && (
              <div className="grid gap-2">
                <label htmlFor="main-commission" className="text-sm font-medium">
                  Comissão do Consultor Principal (%)
                </label>
                <Input
                  id="main-commission"
                  type="number"
                  min="0"
                  max="100"
                  value={mainConsultantCommission}
                  onChange={(e) => setMainConsultantCommission(Number(e.target.value))}
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <label htmlFor="support-consultant" className="text-sm font-medium">
                Consultor de Apoio
              </label>
              <Select value={supportConsultantId} onValueChange={setSupportConsultantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um consultor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum consultor</SelectItem>
                  {consultants
                    .filter(c => c.id !== mainConsultantId)
                    .map(consultant => (
                      <SelectItem key={consultant.id} value={consultant.id}>
                        {consultant.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {supportConsultantId && (
              <div className="grid gap-2">
                <label htmlFor="support-commission" className="text-sm font-medium">
                  Comissão do Consultor de Apoio (%)
                </label>
                <Input
                  id="support-commission"
                  type="number"
                  min="0" 
                  max="100"
                  value={supportConsultantCommission}
                  onChange={(e) => setSupportConsultantCommission(Number(e.target.value))}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignConsultants}>
              Atribuir e Mover para Projetos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DemandsList;
