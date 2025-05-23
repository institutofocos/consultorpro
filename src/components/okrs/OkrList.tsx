
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, Plus, Edit, Trash, Filter, ChevronDown, ChevronRight, 
  RefreshCw, BarChart3, LineChart, PieChart, Users, Briefcase
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { fetchIndicators, updateIndicatorValues, deleteIndicator } from "@/integrations/supabase/indicators";
import { OKR, IndicatorCategory, KeyResult } from '../indicators/types';
import OkrForm from './OkrForm';

export const OkrList: React.FC = () => {
  const [okrs, setOkrs] = useState<OKR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<IndicatorCategory | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOkr, setEditingOkr] = useState<OKR | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [okrToDelete, setOkrToDelete] = useState<string | null>(null);

  const loadOkrs = async () => {
    setIsLoading(true);
    try {
      const { okrs } = await fetchIndicators();
      setOkrs(okrs);
    } catch (error) {
      console.error("Error loading OKRs:", error);
      toast.error("Erro ao carregar OKRs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOkrs();
  }, []);

  const handleRefreshValues = async () => {
    try {
      toast.info("Atualizando valores dos OKRs...");
      await updateIndicatorValues();
      await loadOkrs();
      toast.success("OKRs atualizados com sucesso!");
    } catch (error) {
      console.error("Error updating OKR values:", error);
      toast.error("Erro ao atualizar valores dos OKRs");
    }
  };

  const handleDeleteOkr = async (id: string) => {
    setOkrToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteOkr = async () => {
    if (!okrToDelete) return;
    
    try {
      const success = await deleteIndicator(okrToDelete);
      if (success) {
        toast.success("OKR excluído com sucesso!");
        await loadOkrs();
      } else {
        toast.error("Erro ao excluir OKR");
      }
    } catch (error) {
      console.error("Error deleting OKR:", error);
      toast.error("Erro ao excluir OKR");
    } finally {
      setDeleteDialogOpen(false);
      setOkrToDelete(null);
    }
  };

  const handleFormSaved = () => {
    setShowAddForm(false);
    setEditingOkr(null);
    loadOkrs();
  };

  const handleFormCancelled = () => {
    setShowAddForm(false);
    setEditingOkr(null);
  };

  const filteredOkrs = categoryFilter === 'all' 
    ? okrs 
    : okrs.filter(okr => okr.category === categoryFilter);

  const getProgressPercent = (okr: OKR) => {
    if (!okr.keyResults || okr.keyResults.length === 0) return 0;
    
    const totalProgress = okr.keyResults.reduce((sum, kr) => {
      return sum + Math.min(100, (kr.current / kr.target) * 100);
    }, 0);
    
    return Math.round(totalProgress / okr.keyResults.length);
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 70) return "bg-green-500";
    if (percent >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStatusText = (percent: number) => {
    if (percent >= 70) return "No caminho certo";
    if (percent >= 40) return "Precisa de atenção";
    return "Em risco";
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
      consultants: <Users className="h-4 w-4" />,
      projects: <Briefcase className="h-4 w-4" />,
      clients: <PieChart className="h-4 w-4" />,
      services: <LineChart className="h-4 w-4" />,
      quality: <Target className="h-4 w-4" />,
      efficiency: <RefreshCw className="h-4 w-4" />,
      growth: <BarChart3 className="h-4 w-4" />,
      custom: <Target className="h-4 w-4" />
    };

    return icons[category] || <Target className="h-4 w-4" />;
  };

  const getKeyResultStatusColor = (kr: KeyResult) => {
    const percent = (kr.current / kr.target) * 100;
    
    if (percent >= 70) return "bg-green-500";
    if (percent >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (showAddForm || editingOkr) {
    return <OkrForm okr={editingOkr} onSave={handleFormSaved} onCancel={handleFormCancelled} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">OKRs</h1>
          <p className="text-muted-foreground">Objetivos e Resultados-Chave</p>
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
            Novo OKR
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="shadow-card animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-1/3 bg-muted rounded mb-4"></div>
                <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-2 w-full bg-muted rounded-full mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="ml-6">
                      <div className="h-4 w-1/2 bg-muted rounded mb-2"></div>
                      <div className="h-2 w-full bg-muted rounded-full"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredOkrs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredOkrs.map(okr => {
            const progressPercent = getProgressPercent(okr);
            
            return (
              <Card key={okr.id} className="shadow-card overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryBadgeColor(okr.category)}>
                        <span className="flex items-center gap-1">
                          {getCategoryIcon(okr.category)} {okr.category}
                        </span>
                      </Badge>
                      <Badge variant="outline">{okr.period}</Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingOkr(okr)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteOkr(okr.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-xl mt-2">{okr.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{okr.description}</p>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progresso Geral</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                    
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(okr.startDate).toLocaleDateString()} - {new Date(okr.endDate).toLocaleDateString()}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getProgressColor(progressPercent)} text-white`}>
                        {getStatusText(progressPercent)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full" defaultValue="keyResults">
                    <AccordionItem value="keyResults" className="border-none">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <span className="text-sm font-medium">Resultados-Chave ({okr.keyResults.length})</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 mt-2">
                          {okr.keyResults.map((kr, index) => (
                            <div key={kr.id} className="bg-muted/30 p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{index + 1}. {kr.name}</h4>
                                  {kr.description && <p className="text-sm text-muted-foreground">{kr.description}</p>}
                                </div>
                                <Badge className={getKeyResultStatusColor(kr)}>
                                  {Math.round((kr.current / kr.target) * 100)}%
                                </Badge>
                              </div>
                              
                              <Progress value={(kr.current / kr.target) * 100} className="h-1.5" />
                              
                              <div className="flex justify-between text-sm mt-2">
                                <span>Atual: {kr.current} {kr.unit}</span>
                                <span>Meta: {kr.target} {kr.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Nenhum OKR encontrado para a categoria selecionada.
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este OKR? Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteOkr} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OkrList;
