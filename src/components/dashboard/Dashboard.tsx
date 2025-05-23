import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { ArrowUpRight, Users, Briefcase, Target, Calendar, Filter, FileText, DollarSign, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter } from "date-fns";
import { Project, Stage } from '../projects/types';
import { toast } from "sonner";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Time period filter options
const TIME_FILTERS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  ALL: 'all'
};

const STATUS_COLORS = {
  active: 'bg-green-500',
  completed: 'bg-blue-500',
  planned: 'bg-gray-400',
  delayed: 'bg-red-500'
};

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

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

const StatCard = ({ title, value, icon, color, change }: { 
  title: string, 
  value: string, 
  icon: React.ReactNode,
  color: string,
  change?: string
}) => (
  <Card className="shadow-card card-hover">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change && (
            <div className="flex items-center mt-2 text-green-500">
              <ArrowUpRight size={16} />
              <span className="text-xs font-medium ml-1">{change}</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

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
  const [openStages, setOpenStages] = useState([]);
  const [completedStages, setCompletedStages] = useState([]);
  const [awaitingInvoice, setAwaitingInvoice] = useState([]);
  const [invoicesIssued, setInvoicesIssued] = useState([]);
  const [awaitingPayment, setAwaitingPayment] = useState([]);
  const [awaitingConsultantPayment, setAwaitingConsultantPayment] = useState([]);
  const [consultantsPaid, setConsultantsPaid] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [upcomingStages, setUpcomingStages] = useState([]);
  const [topConsultants, setTopConsultants] = useState<ConsultantStats[]>([]);
  const [topServices, setTopServices] = useState<ServiceStats[]>([]);
  
  const [stats, setStats] = useState({
    totalConsultants: '0',
    totalClients: '0',
    pendingProjects: '0',
    completedProjects: '0'
  });
  
  // Load dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch consultants
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
        setConsultants(consultantData || []);
        
        // Fetch clients
        const { data: clientData } = await supabase
          .from('clients')
          .select('id, name')
          .order('name');
        setClients(clientData || []);
        
        // Fetch services
        const { data: serviceData } = await supabase
          .from('services')
          .select('id, name')
          .order('name');
        setServices(serviceData || []);
        
        // Fetch projects with all related data
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id, name, description, client_id, service_id, 
            main_consultant_id, support_consultant_id,
            start_date, end_date, total_value, tax_percent,
            third_party_expenses, main_consultant_value, 
            support_consultant_value, net_value, status, stages,
            clients(name),
            services(name),
            main_consultant:consultants!main_consultant_id(name),
            support_consultant:consultants!support_consultant_id(name)
          `)
          .order('end_date');
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          toast.error('Error loading project data');
          return;
        }
        
        setProjects(projectsData || []);
        
        // Calculate stats
        const totalConsultants = consultantData?.length || 0;
        const totalClients = clientData?.length || 0;
        const pendingProjects = projectsData?.filter(p => p.status === 'active' || p.status === 'planned').length || 0;
        const completedProjects = projectsData?.filter(p => p.status === 'completed').length || 0;
        
        setStats({
          totalConsultants: totalConsultants.toString(),
          totalClients: totalClients.toString(),
          pendingProjects: pendingProjects.toString(),
          completedProjects: completedProjects.toString()
        });
        
        // Process stages data
        if (projectsData && projectsData.length > 0) {
          processStagesData(projectsData);
          processTopConsultants(projectsData);
          processTopServices(projectsData, serviceData || []);
        }
        
        // Apply filters and set filtered data
        const filteredProjects = applyFilters(projectsData || []);
        setUpcomingProjects(filteredProjects);
        
        // Extract and filter stages
        const allStages = extractStagesFromProjects(projectsData || []);
        const filteredStages = applyStageFilters(allStages);
        setUpcomingStages(filteredStages);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    };
    
    fetchDashboardData();
  }, [timeFilter, consultantFilter, serviceFilter, dateFrom, dateTo]);
  
  const processStagesData = (projectsData) => {
    const openStagesList = [];
    const completedStagesList = [];
    const awaitingInvoiceList = [];
    const invoicesIssuedList = [];
    const awaitingPaymentList = [];
    const awaitingConsultantPaymentList = [];
    const consultantsPaidList = [];
    
    projectsData.forEach(project => {
      if (project.stages && Array.isArray(project.stages)) {
        project.stages.forEach(stage => {
          const stageData = {
            ...stage,
            projectName: project.name,
            projectId: project.id,
            clientName: project.clients?.name || 'N/A'
          };
          
          // Open stages (not approved by client)
          if (!stage.clientApproved) {
            openStagesList.push(stageData);
          }
          
          // Completed stages (approved by manager)
          if (stage.completed && stage.managerApproved) {
            completedStagesList.push(stageData);
          }
          
          // Awaiting invoice
          if (stage.clientApproved && !stage.invoiceIssued) {
            awaitingInvoiceList.push(stageData);
          }
          
          // Invoices issued
          if (stage.invoiceIssued && !stage.paymentReceived) {
            invoicesIssuedList.push(stageData);
          }
          
          // Awaiting payment
          if (stage.invoiceIssued && !stage.paymentReceived) {
            awaitingPaymentList.push(stageData);
          }
          
          // Awaiting consultant payment
          if (stage.paymentReceived && !stage.consultantPaid) {
            awaitingConsultantPaymentList.push(stageData);
          }
          
          // Consultants paid
          if (stage.consultantPaid) {
            consultantsPaidList.push(stageData);
          }
        });
      }
    });
    
    setOpenStages(openStagesList);
    setCompletedStages(completedStagesList);
    setAwaitingInvoice(awaitingInvoiceList);
    setInvoicesIssued(invoicesIssuedList);
    setAwaitingPayment(awaitingPaymentList);
    setAwaitingConsultantPayment(awaitingConsultantPaymentList);
    setConsultantsPaid(consultantsPaidList);
  };
  
  const processTopConsultants = (projectsData) => {
    const consultantStats: Record<string, ConsultantStats> = {};
    
    projectsData.forEach(project => {
      // Count main consultant projects
      if (project.main_consultant_id) {
        const consultantName = project.main_consultant?.name || 'N/A';
        if (!consultantStats[project.main_consultant_id]) {
          consultantStats[project.main_consultant_id] = {
            name: consultantName,
            projects: 0,
            totalHours: 0,
            totalValue: 0
          };
        }
        consultantStats[project.main_consultant_id].projects++;
        consultantStats[project.main_consultant_id].totalValue += Number(project.main_consultant_value || 0);
      }
      
      // Count support consultant projects
      if (project.support_consultant_id) {
        const consultantName = project.support_consultant?.name || 'N/A';
        if (!consultantStats[project.support_consultant_id]) {
          consultantStats[project.support_consultant_id] = {
            name: consultantName,
            projects: 0,
            totalHours: 0,
            totalValue: 0
          };
        }
        consultantStats[project.support_consultant_id].projects++;
        consultantStats[project.support_consultant_id].totalValue += Number(project.support_consultant_value || 0);
      }
      
      // Calculate hours from stages
      if (project.stages && Array.isArray(project.stages)) {
        project.stages.forEach(stage => {
          const hours = Number(stage.hours || 0);
          if (stage.consultantId && consultantStats[stage.consultantId]) {
            consultantStats[stage.consultantId].totalHours += hours;
          } else if (project.main_consultant_id && consultantStats[project.main_consultant_id]) {
            consultantStats[project.main_consultant_id].totalHours += hours;
          }
        });
      }
    });
    
    const topConsultantsList = Object.values(consultantStats)
      .sort((a, b) => b.projects - a.projects)
      .slice(0, 5);
    
    setTopConsultants(topConsultantsList);
  };
  
  const processTopServices = (projectsData, serviceData) => {
    const serviceStats: Record<string, ServiceStats> = {};
    
    projectsData.forEach(project => {
      if (project.service_id) {
        const serviceName = project.services?.name || 'N/A';
        if (!serviceStats[project.service_id]) {
          serviceStats[project.service_id] = {
            name: serviceName,
            projects: 0,
            totalRevenue: 0
          };
        }
        serviceStats[project.service_id].projects++;
        serviceStats[project.service_id].totalRevenue += Number(project.total_value || 0);
      }
    });
    
    const topServicesList = Object.values(serviceStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);
    
    setTopServices(topServicesList);
  };
  
  const extractStagesFromProjects = (projectsData) => {
    const allStages = [];
    
    projectsData.forEach(project => {
      if (project.stages && Array.isArray(project.stages)) {
        project.stages.forEach(stage => {
          allStages.push({
            ...stage,
            projectName: project.name,
            projectId: project.id,
            clientName: project.clients?.name || 'N/A',
            serviceName: project.services?.name || 'N/A',
            mainConsultantId: project.main_consultant_id,
            supportConsultantId: project.support_consultant_id
          });
        });
      }
    });
    
    return allStages;
  };
  
  const applyFilters = (projectsData) => {
    let filtered = [...projectsData];
    
    // Apply time filter
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (timeFilter === TIME_FILTERS.TODAY) {
      filtered = filtered.filter(p => p.end_date === today);
    } else if (timeFilter === TIME_FILTERS.THIS_WEEK) {
      const weekStart = startOfWeek(now).toISOString().split('T')[0];
      const weekEnd = endOfWeek(now).toISOString().split('T')[0];
      filtered = filtered.filter(p => p.end_date >= weekStart && p.end_date <= weekEnd);
    } else if (timeFilter === TIME_FILTERS.THIS_MONTH) {
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      filtered = filtered.filter(p => p.end_date >= monthStart && p.end_date <= monthEnd);
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(p => p.end_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(p => p.end_date <= dateTo);
    }
    
    // Apply consultant filter
    if (consultantFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.main_consultant_id === consultantFilter || 
        p.support_consultant_id === consultantFilter
      );
    }
    
    // Apply service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(p => p.service_id === serviceFilter);
    }
    
    return filtered;
  };
  
  const applyStageFilters = (stagesData) => {
    let filtered = [...stagesData];
    
    // Apply time filter for stage end dates
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    if (timeFilter === TIME_FILTERS.TODAY) {
      filtered = filtered.filter(s => s.endDate === today);
    } else if (timeFilter === TIME_FILTERS.THIS_WEEK) {
      const weekStart = startOfWeek(now).toISOString().split('T')[0];
      const weekEnd = endOfWeek(now).toISOString().split('T')[0];
      filtered = filtered.filter(s => s.endDate >= weekStart && s.endDate <= weekEnd);
    } else if (timeFilter === TIME_FILTERS.THIS_MONTH) {
      const monthStart = startOfMonth(now).toISOString().split('T')[0];
      const monthEnd = endOfMonth(now).toISOString().split('T')[0];
      filtered = filtered.filter(s => s.endDate >= monthStart && s.endDate <= monthEnd);
    }
    
    // Apply date range filter
    if (dateFrom) {
      filtered = filtered.filter(s => s.endDate >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(s => s.endDate <= dateTo);
    }
    
    // Apply consultant filter
    if (consultantFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.consultantId === consultantFilter ||
        s.mainConsultantId === consultantFilter ||
        s.supportConsultantId === consultantFilter
      );
    }
    
    // Apply service filter
    if (serviceFilter !== 'all') {
      filtered = filtered.filter(s => s.serviceId === serviceFilter);
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
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos projetos e indicadores</p>
      </div>
      
      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="time-filter">Período</Label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TIME_FILTERS.TODAY}>Hoje</SelectItem>
                  <SelectItem value={TIME_FILTERS.THIS_WEEK}>Esta Semana</SelectItem>
                  <SelectItem value={TIME_FILTERS.THIS_MONTH}>Este Mês</SelectItem>
                  <SelectItem value={TIME_FILTERS.ALL}>Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-from">Data Início</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Data Fim</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="consultant-filter">Consultor</Label>
              <Select value={consultantFilter} onValueChange={setConsultantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Consultores</SelectItem>
                  {consultants.map(consultant => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="service-filter">Serviço</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Serviços</SelectItem>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Consultores" 
          value={stats.totalConsultants} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Total Clientes" 
          value={stats.totalClients} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-purple-500"
        />
        <StatCard 
          title="Projetos Pendentes" 
          value={stats.pendingProjects} 
          icon={<Clock size={24} className="text-white" />} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Projetos Concluídos" 
          value={stats.completedProjects} 
          icon={<CheckCircle size={24} className="text-white" />} 
          color="bg-green-500"
        />
      </div>
      
      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Etapas Aguardando NF" 
          value={awaitingInvoice.length.toString()} 
          icon={<FileText size={24} className="text-white" />} 
          color="bg-yellow-500"
        />
        <StatCard 
          title="Notas Fiscais Emitidas" 
          value={invoicesIssued.length.toString()} 
          icon={<FileText size={24} className="text-white" />} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Aguardando Recebimento" 
          value={awaitingPayment.length.toString()} 
          icon={<DollarSign size={24} className="text-white" />} 
          color="bg-orange-500"
        />
        <StatCard 
          title="Aguardando Repasse" 
          value={awaitingConsultantPayment.length.toString()} 
          icon={<AlertCircle size={24} className="text-white" />} 
          color="bg-red-500"
        />
        <StatCard 
          title="Consultores Pagos" 
          value={consultantsPaid.length.toString()} 
          icon={<CheckCircle size={24} className="text-white" />} 
          color="bg-green-500"
        />
      </div>
      
      {/* Open and Completed Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Etapas em Aberto ({openStages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openStages.slice(0, 10).map((stage, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{stage.name}</TableCell>
                      <TableCell>{stage.projectName}</TableCell>
                      <TableCell>{formatCurrency(stage.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Etapas Finalizadas ({completedStages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedStages.slice(0, 10).map((stage, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{stage.name}</TableCell>
                      <TableCell>{stage.projectName}</TableCell>
                      <TableCell>{formatCurrency(stage.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Top Consultants and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top Consultores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topConsultants.map((consultant, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{consultant.name}</div>
                    <div className="text-muted-foreground">
                      {consultant.projects} projetos | {consultant.totalHours}h
                    </div>
                  </div>
                  <Progress value={(consultant.projects / 10) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>{formatCurrency(consultant.totalValue)}</div>
                    <div>{consultant.projects} projetos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Top 5 Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Receita']}
                  />
                  <Bar dataKey="totalRevenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects and Stages Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Projetos a Serem Entregues ({upcomingProjects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingProjects.slice(0, 20).map((project, idx) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.clients?.name || 'N/A'}</TableCell>
                      <TableCell>{formatCurrency(project.total_value)}</TableCell>
                      <TableCell>{formatDate(project.end_date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Etapas a Serem Entregues ({upcomingStages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Entrega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingStages.slice(0, 20).map((stage, idx) => (
                    <TableRow key={`${stage.projectId}-${stage.id}`}>
                      <TableCell className="font-medium">{stage.name}</TableCell>
                      <TableCell>{stage.projectName}</TableCell>
                      <TableCell>{formatCurrency(stage.value)}</TableCell>
                      <TableCell>{formatDate(stage.endDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
