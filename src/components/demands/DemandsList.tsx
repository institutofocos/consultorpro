import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Clock, Clock3, UserCheck, Filter, Plus, X, Eye, Edit, Trash2 } from 'lucide-react';
import { fetchDemandsWithoutConsultants, assignConsultantsToDemand } from '@/integrations/supabase/projects';
import { 
  fetchConsultants, 
  calculateConsultantAvailableHours, 
  calculateConsultantWorkedHours,
  calculateConsultantActiveProjects
} from '@/integrations/supabase/consultants';
import { fetchServices } from '@/integrations/supabase/services';
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ptBR } from 'date-fns/locale';
import SearchableSelect from "@/components/ui/searchable-select";
import DemandForm from './DemandForm';
import DemandViewModal from './DemandViewModal';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface ConsultantInfo {
  id: string;
  name: string;
  hoursPerMonth: number;
  workedHours: number;
  availableHours: number;
  activeProjects: number;
  commissionPercentage: number;
}

const DemandsList = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<{id: string, name: string}[]>([]);
  const [services, setServices] = useState<{id: string, name: string}[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [mainConsultantId, setMainConsultantId] = useState<string>("");
  const [mainConsultantCommission, setMainConsultantCommission] = useState<number>(0);
  const [mainConsultantInfo, setMainConsultantInfo] = useState<ConsultantInfo | null>(null);
  const [filteredConsultants, setFilteredConsultants] = useState<{id: string, name: string}[]>([]);
  const [isDemandDialogOpen, setIsDemandDialogOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDemandForView, setSelectedDemandForView] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDemandForEdit, setSelectedDemandForEdit] = useState<any>(null);
  const { toast } = useToast();
  
  // Filter states
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);

  // Adicionar hook de permissões
  const { userProfile, userLinks, isLoading: permissionsLoading } = useUserPermissions();

  // Verificar se é consultor
  const isConsultant = userProfile?.profile_name === 'Consultor';

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

  // Filter consultants based on selected demand's service - CORRIGIDO
  useEffect(() => {
    const filterConsultantsByService = async () => {
      if (!selectedDemand || !selectedDemand.services?.id) {
        setFilteredConsultants(consultants);
        return;
      }

      try {
        const { data: authorizedConsultants, error } = await supabase
          .from('consultant_services')
          .select(`
            consultant_id,
            consultants(id, name)
          `)
          .eq('service_id', selectedDemand.services.id);

        if (error) {
          console.error('Error fetching authorized consultants:', error);
          setFilteredConsultants(consultants);
          return;
        }

        // CORREÇÃO: Verificar se consultants existe e não é null antes de acessar
        const authorized = authorizedConsultants
          ?.map(item => {
            // Verificar se item.consultants existe e não é null
            if (item.consultants && item.consultants.id && item.consultants.name) {
              return {
                id: item.consultants.id,
                name: item.consultants.name
              };
            }
            return null;
          })
          .filter(Boolean) || [];

        setFilteredConsultants(authorized);
      } catch (error) {
        console.error('Error filtering consultants by service:', error);
        setFilteredConsultants(consultants);
      }
    };

    filterConsultantsByService();
  }, [selectedDemand, consultants]);

  // Function to load consultant detailed information
  const loadConsultantInfo = async (consultantId: string): Promise<ConsultantInfo | null> => {
    if (!consultantId) return null;
    
    try {
      console.log('Carregando informações do consultor:', consultantId);
      
      const consultantData = consultants.find(c => c.id === consultantId);
      if (!consultantData) {
        console.error('Consultor não encontrado na lista:', consultantId);
        return null;
      }

      // Fetch consultant details from the database to get commission
      const { data: consultantDetails, error } = await supabase
        .from('consultants')
        .select('commission_percentage, hours_per_month')
        .eq('id', consultantId)
        .single();

      if (error) {
        console.error('Erro ao buscar detalhes do consultor:', error);
        return null;
      }

      console.log('Detalhes do consultor encontrados:', consultantDetails);

      const [workedHours, availableHours, activeProjects] = await Promise.all([
        calculateConsultantWorkedHours(consultantId),
        calculateConsultantAvailableHours(consultantId, consultantDetails?.hours_per_month || 160),
        calculateConsultantActiveProjects(consultantId)
      ]);

      const consultantInfo = {
        id: consultantId,
        name: consultantData.name,
        hoursPerMonth: consultantDetails?.hours_per_month || 160,
        workedHours,
        availableHours,
        activeProjects,
        commissionPercentage: consultantDetails?.commission_percentage || 0
      };

      console.log('Informações completas do consultor:', consultantInfo);
      return consultantInfo;
    } catch (error) {
      console.error('Error loading consultant info:', error);
      return null;
    }
  };

  // Function to calculate project financial values
  const calculateProjectFinancials = (demand: any, consultantCommission: number) => {
    const valorBruto = demand.total_value || 0;
    const taxPercent = demand.tax_percent || 0;
    const impostos = valorBruto * (taxPercent / 100);
    const valorLiquido = valorBruto - impostos;
    const comissaoConsultor = valorLiquido * (consultantCommission / 100);
    const valorAReceber = valorLiquido - comissaoConsultor;

    return {
      valorBruto,
      impostos,
      valorLiquido,
      comissaoConsultor,
      valorAReceber
    };
  };

  // Handle main consultant selection - FUNÇÃO CORRIGIDA
  const handleMainConsultantChange = async (consultantId: string) => {
    console.log('=== INICIANDO SELEÇÃO DE CONSULTOR ===');
    console.log('ID do consultor:', consultantId);
    
    setMainConsultantId(consultantId);
    
    if (consultantId) {
      try {
        console.log('Carregando informações do consultor...');
        const info = await loadConsultantInfo(consultantId);
        console.log('Informações carregadas:', info);
        
        if (info) {
          setMainConsultantInfo(info);
          setMainConsultantCommission(info.commissionPercentage);
          console.log('✅ Comissão definida:', info.commissionPercentage);
        } else {
          console.log('❌ Falha ao carregar informações do consultor');
          setMainConsultantInfo(null);
          setMainConsultantCommission(0);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar informações do consultor:', error);
        setMainConsultantInfo(null);
        setMainConsultantCommission(0);
        
        toast({
          title: "Aviso",
          description: "Não foi possível carregar todas as informações do consultor, mas a seleção foi mantida.",
          variant: "default",
        });
      }
    } else {
      setMainConsultantInfo(null);
      setMainConsultantCommission(0);
    }
    
    console.log('=== SELEÇÃO DE CONSULTOR CONCLUÍDA ===');
  };

  // Function to format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Function to handle opening the consultant assignment dialog - FUNÇÃO CORRIGIDA PARA CONSULTORES
  const handleOpenAssignmentDialog = async (demand: any) => {
    console.log('=== ABRINDO MODAL DE ATRIBUIÇÃO ===');
    console.log('Demanda:', demand.id);
    console.log('Usuário é consultor:', isConsultant);
    console.log('Links do usuário:', userLinks);
    
    setSelectedDemand(demand);
    
    // Limpar estado inicial ANTES de qualquer operação
    setMainConsultantId("");
    setMainConsultantCommission(0);
    setMainConsultantInfo(null);
    
    // Aguardar um momento para garantir que o estado foi limpo
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // LÓGICA PARA CONSULTOR LOGADO
    if (isConsultant && userLinks?.consultant_id) {
      console.log('=== AUTO-SELEÇÃO PARA CONSULTOR ===');
      const linkedConsultantId = userLinks.consultant_id;
      console.log('ID do consultor vinculado:', linkedConsultantId);
      
      try {
        // Verificar se o serviço da demanda permite este consultor
        if (demand.services?.id) {
          console.log('Verificando autorização para serviço:', demand.services.id);
          
          const { data: consultantService, error } = await supabase
            .from('consultant_services')
            .select('id')
            .eq('consultant_id', linkedConsultantId)
            .eq('service_id', demand.services.id)
            .maybeSingle();

          if (!error && consultantService) {
            console.log('✅ Consultor autorizado - iniciando auto-seleção');
            
            // Fazer a auto-seleção de forma segura
            await handleMainConsultantChange(linkedConsultantId);
            
            toast({
              title: "Consultor selecionado automaticamente",
              description: "Você foi selecionado automaticamente como consultor principal para este projeto.",
            });
          } else {
            console.log('❌ Consultor não autorizado para este serviço');
            
            toast({
              title: "Serviço não autorizado",
              description: "Você não está autorizado para este tipo de serviço.",
              variant: "destructive",
            });
            
            // IMPORTANTE: Mesmo sem autorização, permitir que o consultor abra o modal
            // para que possa ver as informações do projeto
          }
        } else {
          console.log('Sem serviço específico - fazendo auto-seleção');
          await handleMainConsultantChange(linkedConsultantId);
        }
      } catch (error) {
        console.error('Erro na verificação/auto-seleção:', error);
        
        // Em caso de erro, tentar selecionar mesmo assim com tratamento de erro
        try {
          console.log('⚠️ Tentando auto-seleção em modo de fallback');
          await handleMainConsultantChange(linkedConsultantId);
        } catch (fallbackError) {
          console.error('Erro no fallback de auto-seleção:', fallbackError);
          toast({
            title: "Erro",
            description: "Não foi possível fazer a seleção automática do consultor.",
            variant: "destructive",
          });
        }
      }
    } else {
      console.log('=== MODO MANUAL PARA GESTOR/ADMIN ===');
    }
    
    // Abrir o modal sempre - ESTA É A MUDANÇA PRINCIPAL
    console.log('Abrindo modal...');
    setDialogOpen(true);
  };
  
  // Function to handle consultant assignment - CORRIGIDO
  const handleAssignConsultants = async () => {
    if (!selectedDemand || !mainConsultantId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum consultor selecionado.",
      });
      return;
    }
    
    try {
      console.log('Tentando atribuir consultor:', {
        demandId: selectedDemand.id,
        consultantId: mainConsultantId,
        commission: mainConsultantCommission
      });

      // Only pass main consultant data, support consultant is removed
      await assignConsultantsToDemand(
        selectedDemand.id,
        mainConsultantId,
        mainConsultantCommission,
        null, // No support consultant
        0 // No support consultant commission
      );
      
      toast({
        title: "Sucesso",
        description: "Consultor atribuído com sucesso. A demanda foi movida para Projetos.",
      });
      
      // Remove the assigned demand from the list
      setDemands(demands.filter(d => d.id !== selectedDemand.id));
      setDialogOpen(false);
      
      // Reset dialog state
      setSelectedDemand(null);
      setMainConsultantId("");
      setMainConsultantCommission(0);
      setMainConsultantInfo(null);
    } catch (error) {
      console.error('Error assigning consultants:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atribuir o consultor. Tente novamente.",
      });
    }
  };

  // Function to handle demand cancellation
  const handleCancelDemand = async (demandId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', demandId);

      if (error) throw error;

      // Remove the cancelled demand from the list
      setDemands(demands.filter(d => d.id !== demandId));
      
      toast({
        title: "Sucesso",
        description: "Demanda cancelada com sucesso.",
      });
    } catch (error) {
      console.error('Error canceling demand:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar a demanda.",
      });
    }
  };

  // Component to display consultant information
  const ConsultantInfoCard = ({ info, title }: { info: ConsultantInfo | null, title: string }) => {
    if (!info) return null;

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Horas/Mês:</span>
            <span className="ml-1 font-medium">{info.hoursPerMonth}h</span>
          </div>
          <div>
            <span className="text-gray-500">Horas Trabalhadas:</span>
            <span className="ml-1 font-medium">{info.workedHours}h</span>
          </div>
          <div>
            <span className="text-gray-500">Horas Livres:</span>
            <span className="ml-1 font-medium text-green-600">{info.availableHours}h</span>
          </div>
          <div>
            <span className="text-gray-500">Projetos Ativos:</span>
            <span className="ml-1 font-medium">{info.activeProjects}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500">Comissão:</span>
            <span className="ml-1 font-medium text-blue-600">{info.commissionPercentage}%</span>
          </div>
        </div>
      </div>
    );
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

  const handleViewDemand = (demand: any) => {
    setSelectedDemandForView(demand);
    setViewModalOpen(true);
  };

  const handleEditDemand = (demand: any) => {
    setSelectedDemandForEdit(demand);
    setIsEditDialogOpen(true);
  };

  const handleDemandUpdated = async () => {
    setIsEditDialogOpen(false);
    // Refresh the demands list
    const demandsData = await fetchDemandsWithoutConsultants();
    setDemands(demandsData);
    toast({
      title: "Sucesso",
      description: "Demanda atualizada com sucesso.",
    });
  };

  // Component to display project financial information
  const ProjectInfoCard = ({ demand, consultantCommission }: { demand: any, consultantCommission: number }) => {
    if (!demand) return null;

    const financials = calculateProjectFinancials(demand, consultantCommission);
    const totalDays = demand.totalDays || 0;
    const totalHours = demand.totalHours || 0;

    return (
      <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Informações do Projeto</h4>
        
        {/* Carga Horária e Datas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-2">
            <div>
              <span className="text-xs text-blue-600 font-medium">Total de Horas:</span>
              <p className="text-sm text-blue-800">{totalHours}h ({totalDays} dias)</p>
            </div>
            <div>
              <span className="text-xs text-blue-600 font-medium">Data de Início:</span>
              <p className="text-sm text-blue-800">{format(new Date(demand.start_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs text-blue-600 font-medium">Serviço:</span>
              <p className="text-sm text-blue-800">{demand.serviceName || "Não especificado"}</p>
            </div>
            <div>
              <span className="text-xs text-blue-600 font-medium">Data de Fim:</span>
              <p className="text-sm text-blue-800">{format(new Date(demand.end_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
            </div>
          </div>
        </div>

        {/* Valores Financeiros */}
        <div className="border-t border-blue-200 pt-3">
          <h5 className="text-xs font-medium text-blue-900 mb-2">Valores Financeiros</h5>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-600">Valor Bruto:</span>
              <span className="font-medium text-blue-800">{formatCurrency(financials.valorBruto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Impostos ({demand.tax_percent || 0}%):</span>
              <span className="font-medium text-red-600">-{formatCurrency(financials.impostos)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-600">Valor Líquido:</span>
              <span className="font-medium text-blue-800">{formatCurrency(financials.valorLiquido)}</span>
            </div>
            {consultantCommission > 0 && (
              <>
                <div className="flex justify-between border-t border-blue-200 pt-2 font-semibold">
                  <span className="text-blue-700">Valor do Consultor ({consultantCommission}%):</span>
                  <span className="text-green-700">{formatCurrency(financials.comissaoConsultor)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-700">Valor da Prestadora:</span>
                  <span className="text-green-700">{formatCurrency(financials.valorAReceber)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Demandas</h1>
          <p className="text-muted-foreground">Gerencie todas as demandas de clientes</p>
        </div>
        {!isConsultant && (
          <Dialog open={isDemandDialogOpen} onOpenChange={setIsDemandDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="h-4 w-4" />
                <span>Nova Demanda</span>
              </Button>
            </DialogTrigger>
            <DialogContent size="full" className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Demanda</DialogTitle>
              </DialogHeader>
              <DemandForm
                onDemandSaved={() => {
                  setIsDemandDialogOpen(false);
                  // Refresh the demands list
                  const fetchData = async () => {
                    const demandsData = await fetchDemandsWithoutConsultants();
                    setDemands(demandsData);
                  };
                  fetchData();
                }}
                onCancel={() => setIsDemandDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
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
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <span>Demandas Disponíveis</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Carregando demandas...</p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Não há demandas disponíveis no momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDemands.map((demand) => (
                <Card key={demand.id} className="hover:bg-gray-50 transition-colors border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Left section - Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{demand.name}</h3>
                          </div>
                        </div>
                        
                        {/* Compact grid layout for details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Início</p>
                              <p className="text-muted-foreground truncate">{format(new Date(demand.start_date), 'dd/MM/yy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Fim</p>
                              <p className="text-muted-foreground truncate">{format(new Date(demand.end_date), 'dd/MM/yy')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Valor</p>
                              <p className="text-muted-foreground truncate">{formatCurrency(demand.total_value)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Cliente</p>
                              <p className="text-muted-foreground truncate">{demand.clientName || "Sem cliente"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Horas</p>
                              <p className="text-muted-foreground">{demand.totalHours || 0}h</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium">Dias</p>
                              <p className="text-muted-foreground">{demand.totalDays || 0} dias</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Service and tags row */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-medium">Serviço:</span>
                            <span className="text-muted-foreground">{demand.serviceName || "Não especificado"}</span>
                          </div>
                          
                          {demand.tags && demand.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {demand.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Right section - Action icons with conditional rendering */}
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDemand(demand)}
                          className="p-2 h-8 w-8 hover:bg-blue-50"
                          title="Ver detalhes completos"
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                        
                        {/* Ocultar botão de editar para consultores */}
                        {!isConsultant && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditDemand(demand)}
                            className="p-2 h-8 w-8 hover:bg-yellow-50"
                            title="Editar demanda"
                          >
                            <Edit className="h-4 w-4 text-yellow-600" />
                          </Button>
                        )}
                        
                        {/* BOTÃO MANIFESTAR INTERESSE - AGORA SEMPRE HABILITADO */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAssignmentDialog(demand)}
                          className="p-2 h-8 w-8 hover:bg-green-50"
                          title={isConsultant ? "Manifestar interesse" : "Atribuir consultor"}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                        
                        {/* Ocultar botão de cancelar para consultores */}
                        {!isConsultant && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelDemand(demand.id)}
                            className="p-2 h-8 w-8 hover:bg-red-50"
                            title="Cancelar demanda"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t bg-gray-50/50 p-3">
          Estas demandas estão aguardando associação a um consultor. Uma vez atribuídas, serão movidas para Projetos.
        </CardFooter>
      </Card>
      
      {/* Consultant Assignment Dialog - Updated with consultant selection for non-consultants */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{isConsultant ? "Manifestar Interesse no Projeto" : "Atribuir Consultor ao Projeto"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {selectedDemand && selectedDemand.services && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Serviço:</span>
                  <span className="text-blue-700">{selectedDemand.services.name}</span>
                </div>
              </div>
            )}

            {/* Campo de seleção de consultor - Mostrar apenas para não-consultores */}
            {!isConsultant && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Selecionar Consultor Principal
                </label>
                <SearchableSelect
                  options={filteredConsultants}
                  value={mainConsultantId}
                  onValueChange={handleMainConsultantChange}
                  placeholder="Selecione um consultor..."
                  searchPlaceholder="Pesquisar consultor..."
                  emptyText="Nenhum consultor autorizado encontrado para este serviço."
                />
                {filteredConsultants.length === 0 && selectedDemand?.services?.id && (
                  <p className="text-xs text-red-600">
                    Nenhum consultor está autorizado para o serviço "{selectedDemand.services.name}". 
                    Configure as autorizações em Configurações → Consultores.
                  </p>
                )}
              </div>
            )}

            {/* Informações do consultor selecionado ou logado */}
            {mainConsultantInfo && (
              <ConsultantInfoCard 
                info={mainConsultantInfo} 
                title={isConsultant ? "Suas Informações" : "Informações do Consultor Selecionado"}
              />
            )}
            
            {/* Informações do projeto - mostrar quando houver consultor selecionado */}
            {selectedDemand && mainConsultantId && mainConsultantCommission > 0 && (
              <ProjectInfoCard 
                demand={selectedDemand} 
                consultantCommission={mainConsultantCommission}
              />
            )}

            {/* Informações básicas do projeto - quando não há consultor selecionado */}
            {selectedDemand && (!mainConsultantId || mainConsultantCommission === 0) && (
              <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-900 mb-3">Informações do Projeto</h4>
                
                {/* Informações básicas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Total de Horas:</span>
                      <p className="text-sm text-blue-800">{selectedDemand.totalHours || 0}h ({selectedDemand.totalDays || 0} dias)</p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Data de Início:</span>
                      <p className="text-sm text-blue-800">{format(new Date(selectedDemand.start_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Serviço:</span>
                      <p className="text-sm text-blue-800">{selectedDemand.serviceName || "Não especificado"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 font-medium">Data de Fim:</span>
                      <p className="text-sm text-blue-800">{format(new Date(selectedDemand.end_date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  </div>
                </div>

                {/* Valores básicos */}
                <div className="border-t border-blue-200 pt-3">
                  <h5 className="text-xs font-medium text-blue-900 mb-2">Valores</h5>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-600">Valor Bruto:</span>
                      <span className="font-medium text-blue-800">{formatCurrency(selectedDemand.total_value || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssignConsultants} 
              disabled={!mainConsultantId}
            >
              {isConsultant ? "Manifestar Interesse" : "Atribuir Consultor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Demand Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent size="full" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Demanda</DialogTitle>
          </DialogHeader>
          {selectedDemandForEdit && (
            <DemandForm
              demand={selectedDemandForEdit}
              onDemandSaved={handleDemandUpdated}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Modal de visualização da demanda */}
      <DemandViewModal
        demand={selectedDemandForView}
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
      />
    </div>
  );
};

export default DemandsList;
