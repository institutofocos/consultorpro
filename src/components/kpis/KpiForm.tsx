
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIndicator, updateIndicator } from "@/integrations/supabase/indicators";
import { KPI, IndicatorCategory, IndicatorPeriod, IndicatorStatus } from '../indicators/types';

interface KpiFormProps {
  kpi?: KPI | null;
  onSave: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório (mínimo 3 caracteres)"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  target: z.coerce.number().positive("Meta deve ser um número positivo"),
  current: z.coerce.number().min(0, "Valor atual não pode ser negativo"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  period: z.string().min(1, "Período é obrigatório"),
  startDate: z.string().min(1, "Data inicial é obrigatória"),
  endDate: z.string().min(1, "Data final é obrigatória"),
  dataSource: z.string().min(1, "Fonte de dados é obrigatória"),
  formula: z.string().optional(),
  responsible: z.string().optional()
});

type FormData = z.infer<typeof formSchema>;

const KpiForm: React.FC<KpiFormProps> = ({ kpi, onSave, onCancel }) => {
  const isEditing = !!kpi;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
      name: kpi.name,
      description: kpi.description,
      category: kpi.category,
      target: kpi.target,
      current: kpi.current,
      unit: kpi.unit,
      period: kpi.period,
      startDate: new Date(kpi.startDate).toISOString().split('T')[0],
      endDate: new Date(kpi.endDate).toISOString().split('T')[0],
      dataSource: kpi.dataSource,
      formula: kpi.formula,
      responsible: kpi.responsible
    } : {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      current: 0
    }
  });

  const onSubmit = async (data: FormData) => {
    try {
      const indicator: any = {
        name: data.name,
        description: data.description || '',
        type: 'kpi',
        category: data.category as IndicatorCategory,
        target: data.target,
        current: data.current,
        unit: data.unit,
        period: data.period as IndicatorPeriod,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'not_started' as IndicatorStatus,
        dataSource: data.dataSource,
        formula: data.formula || '',
        responsible: data.responsible || ''
      };

      let success = false;

      if (isEditing && kpi) {
        indicator.id = kpi.id;
        success = await updateIndicator(indicator);
      } else {
        const id = await createIndicator(indicator);
        success = !!id;
      }

      if (success) {
        toast.success(`KPI ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        onSave();
      } else {
        toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} KPI`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} KPI:`, error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} KPI`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Novo'} KPI</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do KPI <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Receita Mensal" 
                  {...register("name")} 
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria <span className="text-red-500">*</span></Label>
                <Select defaultValue={isEditing ? kpi?.category : undefined} {...register("category")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="consultants">Consultores</SelectItem>
                    <SelectItem value="projects">Projetos</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="services">Serviços</SelectItem>
                    <SelectItem value="quality">Qualidade</SelectItem>
                    <SelectItem value="efficiency">Eficiência</SelectItem>
                    <SelectItem value="growth">Crescimento</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea 
                id="description" 
                placeholder="Descreva o objetivo deste KPI" 
                className="resize-none" 
                {...register("description")} 
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="target">Meta <span className="text-red-500">*</span></Label>
                <Input 
                  id="target" 
                  type="number" 
                  step="any"
                  placeholder="Ex: 50000" 
                  {...register("target")} 
                />
                {errors.target && <p className="text-sm text-red-500">{errors.target.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current">Valor Atual</Label>
                <Input 
                  id="current" 
                  type="number" 
                  step="any"
                  placeholder="Ex: 30000" 
                  {...register("current")} 
                />
                {errors.current && <p className="text-sm text-red-500">{errors.current.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade <span className="text-red-500">*</span></Label>
                <Input 
                  id="unit" 
                  placeholder="Ex: R$, %, horas" 
                  {...register("unit")} 
                />
                {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period">Período <span className="text-red-500">*</span></Label>
                <Select defaultValue={isEditing ? kpi?.period : undefined} {...register("period")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.period && <p className="text-sm text-red-500">{errors.period.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial <span className="text-red-500">*</span></Label>
                <Input 
                  id="startDate" 
                  type="date" 
                  {...register("startDate")} 
                />
                {errors.startDate && <p className="text-sm text-red-500">{errors.startDate.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final <span className="text-red-500">*</span></Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  {...register("endDate")} 
                />
                {errors.endDate && <p className="text-sm text-red-500">{errors.endDate.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dataSource">Fonte de Dados <span className="text-red-500">*</span></Label>
                <Select defaultValue={isEditing ? kpi?.dataSource : undefined} {...register("dataSource")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projetos</SelectItem>
                    <SelectItem value="consultants">Consultores</SelectItem>
                    <SelectItem value="clients">Clientes</SelectItem>
                    <SelectItem value="services">Serviços</SelectItem>
                    <SelectItem value="financial">Financeiro</SelectItem>
                    <SelectItem value="manual">Entrada Manual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.dataSource && <p className="text-sm text-red-500">{errors.dataSource.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsável</Label>
                <Input 
                  id="responsible" 
                  placeholder="Ex: Departamento Financeiro" 
                  {...register("responsible")} 
                />
                {errors.responsible && <p className="text-sm text-red-500">{errors.responsible.message}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="formula">Fórmula de Cálculo</Label>
              <Textarea 
                id="formula" 
                placeholder="Ex: SUM(project.total_value WHERE status = 'completed')" 
                className="resize-none" 
                {...register("formula")} 
              />
              {errors.formula && <p className="text-sm text-red-500">{errors.formula.message}</p>}
              <p className="text-xs text-muted-foreground">
                Descreva como este KPI deve ser calculado. Esta fórmula pode ser usada para calcular automaticamente o valor.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting 
                ? `${isEditing ? 'Atualizando' : 'Criando'}...` 
                : `${isEditing ? 'Atualizar' : 'Criar'} KPI`
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default KpiForm;
