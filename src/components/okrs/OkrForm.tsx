
import React, { useState } from 'react';
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
import { ArrowLeft, Save, Plus, TrashIcon } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createIndicator, updateIndicator } from "@/integrations/supabase/indicators";
import { OKR, IndicatorCategory, IndicatorPeriod, KeyResult, IndicatorStatus } from '../indicators/types';

interface OkrFormProps {
  okr?: OKR | null;
  onSave: () => void;
  onCancel: () => void;
}

const keyResultSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nome é obrigatório (mínimo 3 caracteres)"),
  description: z.string().optional(),
  target: z.coerce.number().positive("Meta deve ser um número positivo"),
  current: z.coerce.number().min(0, "Valor atual não pode ser negativo"),
  unit: z.string().min(1, "Unidade é obrigatória"),
});

type KeyResultFormData = z.infer<typeof keyResultSchema>;

const formSchema = z.object({
  name: z.string().min(3, "Nome é obrigatório (mínimo 3 caracteres)"),
  description: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  period: z.string().min(1, "Período é obrigatório"),
  startDate: z.string().min(1, "Data inicial é obrigatória"),
  endDate: z.string().min(1, "Data final é obrigatória"),
  dataSource: z.string().min(1, "Fonte de dados é obrigatória"),
  responsible: z.string().optional(),
  keyResults: z.array(keyResultSchema).min(1, "Adicione ao menos um Resultado-Chave")
});

type FormData = z.infer<typeof formSchema>;

const OkrForm: React.FC<OkrFormProps> = ({ okr, onSave, onCancel }) => {
  const isEditing = !!okr;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, control } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: isEditing ? {
      name: okr.name,
      description: okr.description,
      category: okr.category,
      period: okr.period,
      startDate: new Date(okr.startDate).toISOString().split('T')[0],
      endDate: new Date(okr.endDate).toISOString().split('T')[0],
      dataSource: okr.dataSource,
      responsible: okr.responsible,
      keyResults: okr.keyResults.map(kr => ({
        id: kr.id,
        name: kr.name,
        description: kr.description || '',
        target: kr.target,
        current: kr.current,
        unit: kr.unit
      }))
    } : {
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
      keyResults: [
        {
          id: `new-${Date.now()}`,
          name: '',
          description: '',
          target: 100,
          current: 0,
          unit: '%'
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyResults"
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const indicator: any = {
        name: data.name,
        description: data.description || '',
        type: 'okr',
        category: data.category as IndicatorCategory,
        target: 100, // OKRs always have 100% as target
        current: 0, // Current will be calculated from key results
        unit: '%',
        period: data.period as IndicatorPeriod,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'not_started' as IndicatorStatus,
        dataSource: data.dataSource,
        formula: '', // OKRs don't use formulas
        responsible: data.responsible || ''
      };

      const keyResultsData: KeyResult[] = data.keyResults.map(kr => ({
        id: kr.id ?? `new-${Date.now()}-${Math.random()}`,
        name: kr.name,
        description: kr.description || '',
        target: kr.target,
        current: kr.current,
        unit: kr.unit,
        status: 'not_started' as IndicatorStatus
      }));

      let success = false;

      if (isEditing && okr) {
        indicator.id = okr.id;
        success = await updateIndicator(indicator, keyResultsData);
      } else {
        const id = await createIndicator(indicator, data.keyResults as Omit<KeyResult, 'id' | 'status'>[]);
        success = !!id;
      }

      if (success) {
        toast.success(`OKR ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
        onSave();
      } else {
        toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} OKR`);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} OKR:`, error);
      toast.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} OKR`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addKeyResult = () => {
    append({
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      target: 100,
      current: 0,
      unit: '%'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Editar' : 'Novo'} OKR</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Objetivo <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Aumentar receita da empresa em 30%" 
                  {...register("name")} 
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria <span className="text-red-500">*</span></Label>
                  <Select defaultValue={isEditing ? okr?.category : undefined} {...register("category")}>
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
                
                <div className="space-y-2">
                  <Label htmlFor="period">Período <span className="text-red-500">*</span></Label>
                  <Select defaultValue={isEditing ? okr?.period : undefined} {...register("period")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.period && <p className="text-sm text-red-500">{errors.period.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descreva o objetivo deste OKR" 
                  className="resize-none" 
                  {...register("description")} 
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsável</Label>
                  <Input 
                    id="responsible" 
                    placeholder="Ex: Diretoria" 
                    {...register("responsible")} 
                  />
                  {errors.responsible && <p className="text-sm text-red-500">{errors.responsible.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataSource">Fonte de Dados <span className="text-red-500">*</span></Label>
                <Select defaultValue={isEditing ? okr?.dataSource : undefined} {...register("dataSource")}>
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
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Resultados-Chave</h3>
                <Button type="button" variant="outline" onClick={addKeyResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resultado-Chave
                </Button>
              </div>
              
              {errors.keyResults?.message && (
                <p className="text-sm text-red-500">{errors.keyResults.message}</p>
              )}
              
              {fields.map((field, index) => (
                <Card key={field.id} className="border border-muted">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base">Resultado-Chave #{index + 1}</CardTitle>
                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => remove(index)} 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`keyResults.${index}.name`}>Nome <span className="text-red-500">*</span></Label>
                      <Input 
                        id={`keyResults.${index}.name`} 
                        placeholder="Ex: Aumentar número de clientes" 
                        {...register(`keyResults.${index}.name`)} 
                      />
                      {errors.keyResults?.[index]?.name && (
                        <p className="text-sm text-red-500">{errors.keyResults[index]?.name?.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`keyResults.${index}.description`}>Descrição</Label>
                      <Textarea 
                        id={`keyResults.${index}.description`} 
                        placeholder="Descreva detalhes deste resultado-chave" 
                        className="resize-none" 
                        {...register(`keyResults.${index}.description`)} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`keyResults.${index}.target`}>Meta <span className="text-red-500">*</span></Label>
                        <Input 
                          id={`keyResults.${index}.target`} 
                          type="number" 
                          step="any"
                          placeholder="Ex: 10" 
                          {...register(`keyResults.${index}.target`)} 
                        />
                        {errors.keyResults?.[index]?.target && (
                          <p className="text-sm text-red-500">{errors.keyResults[index]?.target?.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`keyResults.${index}.current`}>Valor Atual</Label>
                        <Input 
                          id={`keyResults.${index}.current`} 
                          type="number" 
                          step="any"
                          placeholder="Ex: 5" 
                          {...register(`keyResults.${index}.current`)} 
                        />
                        {errors.keyResults?.[index]?.current && (
                          <p className="text-sm text-red-500">{errors.keyResults[index]?.current?.message}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`keyResults.${index}.unit`}>Unidade <span className="text-red-500">*</span></Label>
                        <Input 
                          id={`keyResults.${index}.unit`} 
                          placeholder="Ex: clientes, %" 
                          {...register(`keyResults.${index}.unit`)} 
                        />
                        {errors.keyResults?.[index]?.unit && (
                          <p className="text-sm text-red-500">{errors.keyResults[index]?.unit?.message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                : `${isEditing ? 'Atualizar' : 'Criar'} OKR`
              }
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default OkrForm;
