import React, { useState, useEffect } from 'react';
import { 
  Users, Briefcase, Target, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, AlertTriangle, FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore } from "date-fns";
import { Project, Stage } from '../projects/types';
import { toast } from "sonner";
import { fetchProjects } from '@/integrations/supabase/projects';
import { useProjectStatuses } from '@/hooks/useProjectStatuses';

// Import new components
import { StatCard } from './StatCard';
import { FilterSection } from './FilterSection';
import { PriorityTables } from './PriorityTables';
import { TopPerformers } from './TopPerformers';
import { StagesTables } from './StagesTables';
import { DeliveryTables } from './DeliveryTables';

// Time period filter options
const TIME_FILTERS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  ALL: 'all'
};

// Type definitions for statistics
interface ConsultantStats {
  name: string;
  projects: number;
  totalHours: number;
  totalValue: number;
}

interface ServiceStats {
  name: string;
  projects: number;
  totalRevenue: number;
}

export const Dashboard: React.FC = () => {
  // State for filters
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.ALL);
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // State for data
  const [consultants, setConsultants] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectsToDeliver, setProjectsToDeliver] = useState([]);
  const [overdueProjects, setOverdueProjects] = useState([]);
  const [stagesToDeliver, setStagesToDeliver] = useState([]);
  const [overdueStages, setOverdueStages] = useState([]);
  const [openStages, setOpenStages] = useState([]);
  const [completedStages, setCompletedStages] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [upcomingStages, setUpcomingStages] = useState([]);
  const [topConsultants, setTopConsultants] = useState<ConsultantStats[]>([]);
  const [topServices, setTopServices] = useState<ServiceStats[]>([]);
  const [deliveredStages, setDeliveredStages] = useState([]);
  
  // Estados para cartões sincronizados com status configurados
  const [statusBasedCards, setStatusBasedCards] = useState<{[key: string]: any[]}>({});
  
  const { statuses } = useProjectStatuses();
  
  const [stats, setStats] = useState({
    totalConsultants: '0',
    totalClients: '0',
    deliveredStages: '0',
    completedProjects: '0'
  });

  // Função SIMPLIFICADA para buscar dados para Top Performers
  const fetchTopPerformersData = async () => {
    try {
      console.log('=== BUSCANDO DADOS PARA TOP PERFORMERS ===');
      
      // Buscar todos os projetos diretamente
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          total_value,
          main_consultant_id,
          support_consultant_id,
          main_consultant_value,
          support_consultant_value,
          service_id,
          consultants!projects_main_consultant_id_fkey(id, name),
          support_consultant:consultants!projects_support_consultant_id_fkey(id, name),
          services(id, name)
        `);

      if (projectsError) {
        console.error('Erro ao buscar projetos:', projectsError);
        return { projects: [], consultants: [], services: [] };
      }

      // Buscar todos os consultores
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name');

      if (consultantsError) {
        console.error('Erro ao buscar consultores:', consultantsError);
      }

      // Buscar todos os serviços
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name');

      if (servicesError) {
        console.error('Erro ao buscar serviços:', servicesError);
      }

      console.log('Projetos encontrados:', projectsData?.length || 0);
      console.log('Consultores encontrados:', consultantsData?.length || 0);
      console.log('Serviços encontrados:', servicesData?.length || 0);

      return {
        projects: projectsData || [],
        consultants: consultantsData || [],
        services: servicesData || []
      };
    } catch (error) {
      console.error('Erro na busca de dados:', error);
      return { projects: [], consultants: [], services: [] };
    }
  };

  // Função para processar Top Consultants
  const processTopConsultants = (projectsData, consultantsData) => {
    console.log('=== PROCESSANDO TOP CONSULTANTS ===');
    const consultantStats: Record<string, ConsultantStats> = {};
    
    // Inicializar todos os consultores
    consultantsData.forEach(consultant => {
      consultantStats[consultant.id] = {
        name: consultant.name,
        projects: 0,
        totalHours: 0,
        totalValue: 0
      };
    });
    
    // Processar projetos
    projectsData.forEach(project => {
      // Consultor principal
      if (project.main_consultant_id && consultantStats[project.main_consultant_id]) {
        consultantStats[project.main_consultant_id].projects++;
        consultantStats[project.main_consultant_id].totalValue += Number(project.main_consultant_value || 0);
      }
      
      // Consultor de apoio
      if (project.support_consultant_id && consultantStats[project.support_consultant_id]) {
        consultantStats[project.support_consultant_id].projects++;
        consultantStats[project.support_consultant_id].totalValue += Number(project.support_consultant_value || 0);
      }
    });
    
    // Retornar top 5 com pelo menos 1 projeto
    const topList = Object.values(consultantStats)
      .filter(consultant => consultant.projects > 0)
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 5);
    
    console.log('Top Consultants processados:', topList);
    return topList;
  };
  
  // Função para processar Top Services
  const processTopServices = (projectsData, servicesData) => {
    console.log('=== PROCESSANDO TOP SERVICES ===');
    const serviceStats: Record<string, ServiceStats> = {};
    
    // Inicializar todos os serviços
    servicesData.forEach(service => {
      serviceStats[service.id] = {
        name: service.name,
        projects: 0,
        totalRevenue: 0
      };
    });
    
    // Processar projetos
    projectsData.forEach(project => {
      if (project.service_id && serviceStats[project.service_id]) {
        serviceStats[project.service_id].projects++;
        serviceStats[project.service_id].totalRevenue += Number(project.total_value || 0);
      }
    });
    
    // Retornar top 5 com pelo menos 1 projeto
    const topList = Object.values(serviceStats)
      .filter(service => service.projects > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
    
    console.log('Top Services processados:', topList);
    return topList;
  };
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('=== CARREGANDO DADOS DO DASHBOARD ===');
        
        // Fetch consultants
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
        setConsultants(consultantData || []);
        
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');
        setClients(clientData || []);
        
        const { data: serviceData } = await supabase
          .from('services')
          .select('id, name')
          .order('name');
        setServices(serviceData || []);
        
        // Buscar projetos com restrições normais para outras seções
        const projectsData = await fetchProjects();
        setProjects(projectsData || []);
        
        console.log('Projetos carregados:', projectsData?.length || 0);
        console.log('Status configurados:', statuses);
        
        // Mapear status configurados por nome
        const statusMap = statuses.reduce((acc, status) => {
          acc[status.name] = status;
          return acc;
        }, {});
        
        // Determinar quais status são de conclusão
        const completionStatuses = statuses
          .filter(s => s.is_completion_status)
          .map(s => s.name);
        
        console.log('Status de conclusão configurados:', completionStatuses);
        
        // Se não há status de conclusão configurados, usar 'concluido' como fallback
        const finalCompletionStatuses = completionStatuses.length > 0 
          ? completionStatuses 
          : ['concluido', 'completed', 'finalizados'];
        
        console.log('Status de conclusão finais:', finalCompletionStatuses);
        
        // Apply filters to projects data
        const filteredProjectsData = applyFilters(projectsData || []);
        
        const projectsToDeliverList = filteredProjectsData.filter(project => 
          !finalCompletionStatuses.includes(project.status)
        );
        setProjectsToDeliver(projectsToDeliverList);
        
        const today = new Date();
        const overdueProjectsList = filteredProjectsData.filter(project => 
          project.endDate && 
          !finalCompletionStatuses.includes(project.status) &&
          isBefore(new Date(project.endDate), today)
        );
        setOverdueProjects(overdueProjectsList);
        
        const allStages = [];
        const stagesToDeliverList = [];
        const overdueStagesList = [];
        const deliveredStagesList = [];
        
        // NOVA LÓGICA: Agrupar etapas por status sincronizado
        const statusBasedData: {[key: string]: any[]} = {};
        
        // Inicializar arrays para cada status configurado
        statuses.forEach(status => {
          statusBasedData[status.name] = [];
        });
        
        filteredProjectsData.forEach(project => {
          if (project.stages) {
            project.stages.forEach(stage => {
              const stageWithProject = {
                ...stage,
                projectName: project.name,
                clientName: project.clientName,
                consultantName: '',
                serviceName: project.serviceName
              };
              
              // Buscar o nome do consultor responsável pela etapa
              if (stage.consultantId) {
                const consultant = consultantData?.find(c => c.id === stage.consultantId);
                stageWithProject.consultantName = consultant?.name || '';
              }
              
              allStages.push(stageWithProject);
              
              // Agrupar etapas por status configurado
              const stageStatus = stage.status || 'iniciar_projeto';
              
              if (statusBasedData[stageStatus]) {
                statusBasedData[stageStatus].push(stageWithProject);
              }
              
              // Etapas a serem entregues (não concluídas)
              if (!finalCompletionStatuses.includes(stageStatus) && !stage.completed) {
                stagesToDeliverList.push(stageWithProject);
              }
              
              // Etapas entregues (concluídas)
              if (finalCompletionStatuses.includes(stageStatus) || stage.completed) {
                deliveredStagesList.push(stageWithProject);
              }
              
              // Etapas atrasadas (data vencida e não concluídas)
              if (stage.endDate && 
                  !finalCompletionStatuses.includes(stageStatus) && 
                  !stage.completed &&
                  isBefore(new Date(stage.endDate), today)) {
                overdueStagesList.push(stageWithProject);
              }
            });
          }
        });
        
        console.log('=== CARTÕES SINCRONIZADOS COM STATUS CONFIGURADOS ===');
        statuses.forEach(status => {
          const count = statusBasedData[status.name]?.length || 0;
          console.log(`${status.display_name} (${status.name}):`, count);
        });
        
        setStatusBasedCards(statusBasedData);
        setStagesToDeliver(stagesToDeliverList);
        setOverdueStages(overdueStagesList);
        setDeliveredStages(deliveredStagesList);
        
        const totalConsultants = consultantData?.length || 0;
        const totalClients = clientData?.length || 0;
        const deliveredStagesCount = deliveredStagesList.length;
        const completedProjects = (filteredProjectsData?.length || 0) - projectsToDeliverList.length;
        
        setStats({
          totalConsultants: totalConsultants.toString(),
          totalClients: totalClients.toString(),
          deliveredStages: deliveredStagesCount.toString(),
          completedProjects: completedProjects.toString()
        });
        
        // Process stages data for financial information
        if (allStages.length > 0) {
          processStagesData(allStages);
        }
        
        // *** BUSCAR DADOS COMPLETOS PARA TOP PERFORMERS ***
        console.log('=== BUSCANDO DADOS PARA TOP PERFORMERS ===');
        const topPerformersData = await fetchTopPerformersData();
        
        // Process top consultants and services
        const allTopConsultants = processTopConsultants(topPerformersData.projects, topPerformersData.consultants);
        const allTopServices = processTopServices(topPerformersData.projects, topPerformersData.services);
        
        setTopConsultants(allTopConsultants);
        setTopServices(allTopServices);
        
        console.log('=== TOP PERFORMERS ATUALIZADOS ===');
        console.log('Top Consultants:', allTopConsultants.length);
        console.log('Top Services:', allTopServices.length);
        
        // Set filtered data
        setUpcomingProjects(filteredProjectsData);
        
        // Filter stages
        const filteredStages = applyStageFilters(allStages);
        setUpcomingStages(filteredStages);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Erro ao carregar dados do dashboard');
      }
    };
    
    fetchDashboardData();
  }, [timeFilter, consultantFilter, serviceFilter, dateFrom, dateTo, statuses]);
  
  const processStagesData = (stagesData) => {
    const openStagesList = [];
    const completedStagesList = [];
    
    stagesData.forEach(stage => {
      const stageData = {
        ...stage,
        projectName: stage.projectName || 'N/A',
        projectId: stage.projectId,
        clientName: stage.clientName || 'N/A'
      };
      
      // Open stages (not approved by client)
      if (!stage.clientApproved) {
        openStagesList.push(stageData);
      }
      
      // Completed stages (approved by manager)
      if (stage.completed && stage.managerApproved) {
        completedStagesList.push(stageData);
      }
    });
    
    setOpenStages(openStagesList);
    setCompletedStages(completedStagesList);
  };
  
  const applyFilters = (projectsData) => {
    let filtered = [...projectsData];
    
    // Apply time filter
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (timeFilter === TIME_FILTERS.TODAY) {
      filtered = filtered.filter(p => {
        if (!p.endDate) return false;
        return p.endDate === today;
      });
    } else if (timeFilter === TIME_FILTERS.THIS_WEEK) {
      const weekStart = startOfWeek(now).toISOString().split('T')[0];
      const weekEnd = endOfWeek(now).toISOString().split('T')[0];
      filtered = filtered.filter(p => {
        if (!p.endDate) return false;
        return p.endDate >= weekStart && p.endDate <= weekEnd;
      });
    } else if (timeFilter === TIME_FILTERS.THIS_MONTH) {
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      filtered = filtered.filter(p => {
        if (!p.endDate) return false;
        return p.endDate >= monthStart && p.endDate <= monthEnd;
      });
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(p => {
        if (!p.endDate) return false;
        return p.endDate >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter(p => {
        if (!p.endDate) return false;
        return p.endDate <= dateTo;
      });
    }
    
    // Apply consultant filter
    if (consultantFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.mainConsultantId === consultantFilter || 
        p.supportConsultantId === consultantFilter
      );
    }
    
    // Apply service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(p => p.serviceId === serviceFilter);
    }
    
    console.log('Filtros aplicados:', {
      timeFilter,
      dateFrom,
      dateTo,
      consultantFilter,
      serviceFilter,
      originalCount: projectsData.length,
      filteredCount: filtered.length
    });
    
    return filtered;
  };
  
  const applyStageFilters = (stagesData) => {
    let filtered = [...stagesData];
    
    // Apply time filter for stage end dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (timeFilter === TIME_FILTERS.TODAY) {
      filtered = filtered.filter(s => {
        if (!s.endDate) return false;
        return s.endDate === today;
      });
    } else if (timeFilter === TIME_FILTERS.THIS_WEEK) {
      const weekStart = startOfWeek(now).toISOString().split('T')[0];
      const weekEnd = endOfWeek(now).toISOString().split('T')[0];
      filtered = filtered.filter(s => {
        if (!s.endDate) return false;
        return s.endDate >= weekStart && s.endDate <= weekEnd;
      });
    } else if (timeFilter === TIME_FILTERS.THIS_MONTH) {
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      filtered = filtered.filter(s => {
        if (!s.endDate) return false;
        return s.endDate >= monthStart && s.endDate <= monthEnd;
      });
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(s => {
        if (!s.endDate) return false;
        return s.endDate >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter(s => {
        if (!s.endDate) return false;
        return s.endDate <= dateTo;
      });
    }
    
    // Apply consultant filter
    if (consultantFilter !== 'all') {
      filtered = filtered.filter(s => s.consultantId === consultantFilter);
    }
    
    return filtered;
  };
  
  // Format date from ISO string
  const formatDate = (dateString) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  };
  
  // Calcular número de colunas baseado no número de status ativos
  const activeStatuses = statuses.filter(status => status.is_active);
  const statusCount = activeStatuses.length;
  
  // Determinar classes de grid responsivo baseado na quantidade
  const getGridClasses = () => {
    if (statusCount <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (statusCount <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    if (statusCount <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    if (statusCount <= 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6';
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos projetos e indicadores</p>
      </div>
      
      {/* Filters */}
      <FilterSection
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        consultantFilter={consultantFilter}
        setConsultantFilter={setConsultantFilter}
        serviceFilter={serviceFilter}
        setServiceFilter={setServiceFilter}
        consultants={consultants}
        services={services}
      />
      
      {/* Main Priority Cards - Projetos e Etapas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Projetos a Serem Entregues" 
          value={projectsToDeliver.length.toString()} 
          icon={<Briefcase size={24} className="text-white" />} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Projetos Atrasados" 
          value={overdueProjects.length.toString()} 
          icon={<AlertCircle size={24} className="text-white" />} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Etapas a Serem Entregues" 
          value={stagesToDeliver.length.toString()} 
          icon={<Target size={24} className="text-white" />} 
          color="bg-green-500"
        />
        <StatCard 
          title="Etapas Atrasadas" 
          value={overdueStages.length.toString()} 
          icon={<AlertTriangle size={24} className="text-white" />} 
          color="bg-red-500"
        />
      </div>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Consultores" 
          value={stats.totalConsultants} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Total Clientes" 
          value={stats.totalClients} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-indigo-500"
        />
        <StatCard 
          title="Etapas Entregues" 
          value={stats.deliveredStages} 
          icon={<CheckCircle size={24} className="text-white" />} 
          color="bg-green-600"
        />
        <StatCard 
          title="Projetos Concluídos" 
          value={stats.completedProjects} 
          icon={<CheckCircle size={24} className="text-white" />} 
          color="bg-green-600"
        />
      </div>
      
      {/* Top Consultants and Services - SEMPRE VISÍVEL PARA TODOS OS USUÁRIOS COM DADOS COMPLETOS */}
      <TopPerformers
        topConsultants={topConsultants}
        topServices={topServices}
        formatCurrency={formatCurrency}
      />
      
      {/* Priority Tables - Projetos, Etapas a Serem Entregues e Atrasados */}
      <PriorityTables
        projectsToDeliver={projectsToDeliver}
        overdueProjects={overdueProjects}
        stagesToDeliver={stagesToDeliver}
        overdueStages={overdueStages}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
      
      {/* CARTÕES SINCRONIZADOS COM STATUS CONFIGURADOS - GRID RESPONSIVO */}
      {activeStatuses.length > 0 && (
        <div className={`grid ${getGridClasses()} gap-6`}>
          {activeStatuses.map(status => {
            const count = statusBasedCards[status.name]?.length || 0;
            
            // Definir ícone baseado no tipo de status
            let icon = <FileText size={24} className="text-white" />;
            let colorClass = "bg-gray-500";
            
            if (status.is_completion_status) {
              icon = <CheckCircle size={24} className="text-white" />;
              colorClass = "bg-green-500";
            } else if (status.is_cancellation_status) {
              icon = <AlertCircle size={24} className="text-white" />;
              colorClass = "bg-red-500";
            } else if (status.name === 'aguardando_nota_fiscal') {
              icon = <FileText size={24} className="text-white" />;
              colorClass = "bg-yellow-500";
            } else if (status.name === 'aguardando_pagamento') {
              icon = <DollarSign size={24} className="text-white" />;
              colorClass = "bg-orange-500";
            } else if (status.name === 'aguardando_repasse') {
              icon = <Clock size={24} className="text-white" />;
              colorClass = "bg-purple-500";
            } else if (status.name === 'em_producao') {
              icon = <Target size={24} className="text-white" />;
              colorClass = "bg-blue-500";
            }
            
            return (
              <StatCard 
                key={status.id}
                title={status.display_name} 
                value={count.toString()} 
                icon={icon}
                color={colorClass}
              />
            );
          })}
        </div>
      )}
      
      {/* Projects and Stages Delivery */}
      <DeliveryTables
        upcomingProjects={upcomingProjects}
        upcomingStages={upcomingStages}
        formatDate={formatDate}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default Dashboard;
