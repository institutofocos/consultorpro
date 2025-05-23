
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, Target, Plus, Edit, Trash, Filter, 
  BarChart3, LineChart, PieChart, TrendingUp, ChevronDown 
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  fetchIndicators, 
  updateIndicatorValues, 
  deleteIndicator 
} from "@/integrations/supabase/indicators";
import { KPI, IndicatorCategory } from '../indicators/types';
import KpiForm from './KpiForm';

export const KpiList: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<IndicatorCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KPI | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [kpiToDelete, setKpiToDelete] = useState<string | null>(null);

  const loadKpis = async () => {
    setIsLoading(true);
    try {
      const { kpis } = await fetchIndicators();
      setKpis(kpis);
    } catch (error) {
      console.error("Error loading KPIs:", error);
      toast.error("Erro ao carregar KPIs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadKpis();
  }, []);

  const handleRefreshValues = async () => {
    try {
      toast.info("Atualizando valores dos KPIs...");
      await updateIndicatorValues();
      await loadKpis();
      toast.success("KPIs atualizados com sucesso!");
    } catch (error) {
      console.error("Error updating KPI values:", error);
      toast.error("Erro ao atualizar valores dos KPIs");
    }
  };

  const handleDeleteKpi = async (id: string) => {
    setKpiToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteKpi = async () => {
    if (!kpiToDelete) return;
    
    try {
      const success = await deleteIndicator(kpiToDelete);
      if (success) {
        toast.success("KPI excluído com sucesso!");
        await loadKpis();
      } else {
        toast.error("Erro ao excluir KPI");
      }
    } catch (error) {
      console.error("Error deleting KPI:", error);
      toast.error("Erro ao excluir KPI");
    } finally {
      setDeleteDialogOpen(false);
      setKpiToDelete(null);
    }
  };

  const handleFormSaved = () => {
    setShowAddForm(false);
    setEditingKpi(null);
    loadKpis();
  };

  const handleFormCancelled = () => {
    setShowAddForm(false);
    setEditingKpi(null);
  };

  const filteredKpis = categoryFilter === 'all' 
    ? kpis 
    : kpis.filter(kpi => kpi.category === categoryFilter);

  const getStatusColor = (kpi: KPI) => {
    const percentage = (kpi.current / kpi.target) * 100;
    
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = (kpi: KPI) => {
    const percentage = (kpi.current / kpi.target) * 100;
    
    if (percentage >= 90) return "Meta atingida";
    if (percentage >= 70) return "Em progresso";
    return "Abaixo da meta";
  };

  const getCategoryBadgeColor = (category: IndicatorCategory) => {
    const colors = {
      financial: "bg-green-100 text-green-800",
      consultants: "bg-purple-100 text-purple-800",
      projects: "bg-blue-100 text-blue-800",
      clients: "bg-orange-100 text-orange-800",
      services: "bg-indigo-100 text-indigo-800",
      quality: "bg-teal-100 text-teal-800",
      efficiency: "bg-cyan-100 text-cyan-800",
      growth: "bg-rose-100 text-rose-800",
      custom: "bg-gray-100 text-gray-800"
    };

    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryIcon = (category: IndicatorCategory) => {
    const icons = {
      financial: <BarChart3 className="h-4 w-4" />,
      consultants: <Activity className="h-4 w-4" />,
      projects: <Target className="h-4 w-4" />,
      clients: <PieChart className="h-4 w-4" />,
      services: <LineChart className="h-4 w-4" />,
      quality: <Activity className="h-4 w-4" />,
      efficiency: <TrendingUp className="h-4 w-4" />,
      growth: <TrendingUp className="h-4 w-4" />,
      custom: <Target className="h-4 w-4" />
    };

    return icons[category] || <Activity className="h-4 w-4" />;
  };

  if (showAddForm || editingKpi) {
    return <KpiForm kpi={editingKpi} onSave={handleFormSaved} onCancel={handleFormCancelled} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">KPIs</h1>
          <p className="text-muted-foreground">Indicadores-chave de performance</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as IndicatorCategory | 'all')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="consultants">Consultores</SelectItem>
                <SelectItem value="projects">Projetos</SelectItem>
                <SelectItem value="clients">Clientes</SelectItem>
                <SelectItem value="services">Serviços</SelectItem>
                <SelectItem value="quality">Qualidade</SelectItem>
                <SelectItem value="efficiency">Eficiência</SelectItem>
                <SelectItem value="growth">Crescimento</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefreshValues}>
            <Filter className="mr-2 h-4 w-4" />
            Atualizar Valores
          </Button>

          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo KPI
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="shadow-card animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-2/3 bg-muted rounded mb-4"></div>
                <div className="h-4 w-1/2 bg-muted rounded mb-6"></div>
                <div className="h-2 w-full bg-muted rounded-full mb-6"></div>
                <div className="flex justify-between">
                  <div className="h-4 w-1/4 bg-muted rounded"></div>
                  <div className="h-4 w-1/4 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredKpis.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKpis.map(kpi => (
            <Card key={kpi.id} className="shadow-card overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryBadgeColor(kpi.category)}>
                      <span className="flex items-center gap-1">
                        {getCategoryIcon(kpi.category)} {kpi.category}
                      </span>
                    </Badge>
                    <Badge variant="outline">{kpi.period}</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingKpi(kpi)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteKpi(kpi.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="mt-2">{kpi.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{kpi.description}</p>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <Progress value={(kpi.current / kpi.target) * 100} className="h-2" />
                  
                  <div className="flex justify-between text-sm">
                    <span>Atual: {kpi.current} {kpi.unit}</span>
                    <span>Meta: {kpi.target} {kpi.unit}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {new Date(kpi.startDate).toLocaleDateString()} - {new Date(kpi.endDate).toLocaleDateString()}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusColor(kpi)} text-white`}>
                      {getStatusText(kpi)}
                    </span>
                  </div>
                  
                  {kpi.responsible && (
                    <div className="text-xs text-right text-muted-foreground">
                      Responsável: {kpi.responsible}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Nenhum KPI encontrado para a categoria selecionada.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este KPI? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteKpi} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KpiList;
