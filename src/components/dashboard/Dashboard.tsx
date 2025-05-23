
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
import { ArrowUpRight, Users, Briefcase, Target, Calendar, Filter } from "lucide-react";
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
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter } from "date-fns";
import { Project, ProjectStage } from '../services/types';
import { toast } from "sonner";

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

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

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
  const [tagFilter, setTagFilter] = useState('all');
  const [showDelayed, setShowDelayed] = useState(false);
  
  // State for data
  const [projectData, setProjectData] = useState([]);
  const [kpiData, setKpiData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [tags, setTags] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [upcomingStages, setUpcomingStages] = useState([]);
  const [stats, setStats] = useState({
    consultantCount: '0',
    activeProjectsCount: '0',
    kpiCount: '0',
    activitiesCount: '0'
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
        
        // Fetch tags
        const { data: tagData } = await supabase
          .from('tags')
          .select('id, name')
          .order('name');
        setTags(tagData || []);
        
        // Fetch projects with type assertion to help TypeScript understand the shape
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select(`
            id, name, description, client_id, service_id, 
            main_consultant_id, support_consultant_id,
            start_date, end_date, total_value, tax_percent,
            third_party_expenses, main_consultant_value, 
            support_consultant_value, net_value, status, stages
          `)
          .order('end_date');
          
        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
          toast.error('Error loading project data');
          return;
        }
          
        // Format project data for charts
        if (projectsData && projectsData.length > 0) {
          const formattedProjects = projectsData.slice(0, 5).map(project => ({
            name: project.name,
            value: project.total_value || 0
          }));
          
          setProjectData(formattedProjects);
          
          // Calculate upcoming projects based on filters
          const filtered = filterProjectsByTime(projectsData, timeFilter);
          setUpcomingProjects(filtered);
          
          // Extract stages from projects
          const allStages: any[] = [];
          projectsData.forEach(project => {
            if (project.stages && Array.isArray(project.stages)) {
              project.stages.forEach(stage => {
                allStages.push({
                  ...stage,
                  projectName: project.name,
                  projectId: project.id
                });
              });
            }
          });
          
          // Filter and set upcoming stages
          const filteredStages = filterStagesByTime(allStages, timeFilter);
          setUpcomingStages(filteredStages);
          
          // Set statistics
          setStats({
            consultantCount: (consultantData || []).length.toString(),
            activeProjectsCount: projectsData.filter(p => p.status === 'active').length.toString(),
            kpiCount: '36', // This would come from a KPIs table in a real implementation
            activitiesCount: '128' // This would come from an activities table in a real implementation
          });
        } else {
          console.log('No projects found or empty result');
          toast.info('No project data available');
        }
        
        // Mock KPI data for now
        setKpiData([
          { name: 'Jan', value: 65 },
          { name: 'Fev', value: 72 },
          { name: 'Mar', value: 68 },
          { name: 'Abr', value: 80 },
          { name: 'Mai', value: 85 },
          { name: 'Jun', value: 82 }
        ]);
        
        // Mock pie data for now
        setPieData([
          { name: 'Financeiro', value: 45 },
          { name: 'Qualidade', value: 30 },
          { name: 'Processos', value: 15 },
          { name: 'Pessoas', value: 10 }
        ]);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    };
    
    fetchDashboardData();
  }, [timeFilter, consultantFilter, tagFilter, showDelayed]);
  
  // Helper functions for date filtering
  const filterProjectsByTime = (projects, timeFilter) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let filtered = [...projects];
    
    // Apply time filter
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
    
    // Apply consultant filter
    if (consultantFilter !== 'all') {
      filtered = filtered.filter(p => 
        p.main_consultant_id === consultantFilter || 
        p.support_consultant_id === consultantFilter
      );
    }
    
    // Apply delayed filter
    if (showDelayed) {
      filtered = filtered.filter(p => {
        // Consider a project delayed if the current date is after the end date and status is not 'completed'
        const isDelayed = p.end_date < today && p.status !== 'completed';
        return isDelayed;
      });
    }
    
    return filtered;
  };
  
  const filterStagesByTime = (stages, timeFilter) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    let filtered = [...stages];
    
    // Apply time filter
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Consultores" 
          value={stats.consultantCount} 
          icon={<Users size={24} className="text-white" />} 
          color="bg-blue-500"
          change="Dados atualizados" 
        />
        <StatCard 
          title="Projetos Ativos" 
          value={stats.activeProjectsCount} 
          icon={<Briefcase size={24} className="text-white" />} 
          color="bg-purple-500"
          change="Em andamento" 
        />
        <StatCard 
          title="KPIs" 
          value={stats.kpiCount} 
          icon={<Target size={24} className="text-white" />} 
          color="bg-green-500"
          change="82% na meta" 
        />
        <StatCard 
          title="Lançamentos" 
          value={stats.activitiesCount} 
          icon={<Calendar size={24} className="text-white" />} 
          color="bg-orange-500"
          change="Este mês" 
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>Valor dos Projetos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={500}
                  height={300}
                  data={projectData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Valor']}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>Evolução dos KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={kpiData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Desempenho']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Projects Delivery Section */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <CardTitle>Projetos a Serem Entregues</CardTitle>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select
              value={timeFilter}
              onValueChange={setTimeFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_FILTERS.TODAY}>Hoje</SelectItem>
                <SelectItem value={TIME_FILTERS.THIS_WEEK}>Esta Semana</SelectItem>
                <SelectItem value={TIME_FILTERS.THIS_MONTH}>Este Mês</SelectItem>
                <SelectItem value={TIME_FILTERS.ALL}>Todos</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={consultantFilter}
              onValueChange={setConsultantFilter}
            >
              <SelectTrigger className="w-[180px]">
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
            <Button 
              variant={showDelayed ? "default" : "outline"} 
              onClick={() => setShowDelayed(!showDelayed)}
              className={showDelayed ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Filter className="mr-2 h-4 w-4" />
              Atrasados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium">Projeto</th>
                  <th className="p-2 text-left font-medium">Cliente</th>
                  <th className="p-2 text-left font-medium">Responsável</th>
                  <th className="p-2 text-right font-medium">Valor</th>
                  <th className="p-2 text-center font-medium">Entrega</th>
                  <th className="p-2 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingProjects.length > 0 ? (
                  upcomingProjects.map((project, idx) => (
                    <tr key={project.id} className="border-t">
                      <td className="p-2">{project.name}</td>
                      <td className="p-2">{project.client_id}</td>
                      <td className="p-2">{project.main_consultant_id}</td>
                      <td className="p-2 text-right">{formatCurrency(project.total_value)}</td>
                      <td className="p-2 text-center">{formatDate(project.end_date)}</td>
                      <td className="p-2 text-center">
                        <Badge className={STATUS_COLORS[project.status] || "bg-gray-500"}>
                          {project.status === 'active' ? 'Em Andamento' : 
                           project.status === 'completed' ? 'Concluído' : 
                           project.status === 'planned' ? 'Planejado' : 
                           project.status === 'delayed' ? 'Atrasado' : project.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                      Nenhum projeto encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Stages Delivery Section */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div>
            <CardTitle>Etapas a Serem Entregues</CardTitle>
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <Select
              value={timeFilter}
              onValueChange={setTimeFilter}
            >
              <SelectTrigger className="w-[180px]">
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-medium">Etapa</th>
                  <th className="p-2 text-left font-medium">Projeto</th>
                  <th className="p-2 text-right font-medium">Horas</th>
                  <th className="p-2 text-right font-medium">Valor</th>
                  <th className="p-2 text-center font-medium">Entrega</th>
                </tr>
              </thead>
              <tbody>
                {upcomingStages.length > 0 ? (
                  upcomingStages.map((stage, idx) => (
                    <tr key={`${stage.projectId}-${stage.id}`} className="border-t">
                      <td className="p-2">{stage.name}</td>
                      <td className="p-2">{stage.projectName}</td>
                      <td className="p-2 text-right">{stage.hours}h</td>
                      <td className="p-2 text-right">{formatCurrency(stage.value)}</td>
                      <td className="p-2 text-center">{formatDate(stage.endDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      Nenhuma etapa encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI por pilar */}
        <Card className="shadow-card card-hover">
          <CardHeader>
            <CardTitle>KPIs por Pilar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Top consultores */}
        <Card className="shadow-card card-hover col-span-2">
          <CardHeader>
            <CardTitle>Top Consultores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Ana Silva', value: 92, projects: 5 },
                { name: 'Carlos Mendes', value: 86, projects: 4 },
                { name: 'Patricia Lemos', value: 78, projects: 3 },
                { name: 'Roberto Gomes', value: 74, projects: 3 },
              ].map((consultant, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <div className="font-medium">{consultant.name}</div>
                    <div className="text-muted-foreground">{consultant.projects} projetos</div>
                  </div>
                  <Progress value={consultant.value} className="h-2" />
                  <div className="flex justify-end text-xs text-muted-foreground">
                    <div>{consultant.value}% performance</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
