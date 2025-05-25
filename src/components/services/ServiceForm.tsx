
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceStage } from './types';

interface ServiceFormProps {
  service?: Service | null;
  onServiceSaved: (service: Service) => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ 
  service, 
  onServiceSaved, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalHours: 0,
    hourlyRate: 0,
    taxRate: 16,
    extraCosts: 0
  });
  const [stages, setStages] = useState<ServiceStage[]>([]);

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        totalHours: service.totalHours,
        hourlyRate: service.hourlyRate || 0,
        taxRate: service.taxRate,
        extraCosts: service.extraCosts || 0
      });
      setStages(service.stages || []);
    }
  }, [service]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }));
  };

  const calculateTotalValue = () => {
    return stages.reduce((sum, stage) => sum + (stage.value || 0), 0);
  };

  const calculateTotalHours = () => {
    return stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
  };

  const calculateTaxAmount = (totalValue: number) => {
    return (totalValue * formData.taxRate) / 100;
  };

  const calculateNetValue = (totalValue: number, taxAmount: number) => {
    return totalValue - taxAmount - formData.extraCosts;
  };

  const addStage = () => {
    const newStage: ServiceStage = {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      days: 1,
      hours: 8,
      value: 0,
      order: stages.length + 1
    };
    setStages([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof ServiceStage, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    setStages(updatedStages);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    // Reordenar as etapas
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      order: i + 1
    }));
    setStages(reorderedStages);
  };

  const calculateTotals = () => {
    const totalStageHours = stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
    const totalStageValue = stages.reduce((sum, stage) => sum + (stage.value || 0), 0);
    const grossValue = totalStageValue;
    const taxAmount = (grossValue * formData.taxRate) / 100;
    const netValue = grossValue - taxAmount - formData.extraCosts;

    return {
      totalHours: totalStageHours,
      totalValue: grossValue,
      taxAmount,
      netValue
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totals = calculateTotals();
      
      const serviceData = {
        name: formData.name,
        description: formData.description,
        total_hours: totals.totalHours,
        hourly_rate: formData.hourlyRate,
        total_value: totals.totalValue,
        tax_rate: formData.taxRate,
        extra_costs: formData.extraCosts,
        net_value: totals.netValue,
        stages: stages.map(stage => ({
          name: stage.name,
          description: stage.description || '',
          days: stage.days,
          hours: stage.hours,
          value: stage.value,
          order: stage.order || 1
        }))
      };

      let result;
      if (service?.id) {
        result = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      const savedService: Service = {
        id: result.data.id,
        name: result.data.name,
        description: result.data.description,
        totalHours: result.data.total_hours,
        hourlyRate: result.data.hourly_rate,
        totalValue: result.data.total_value,
        taxRate: result.data.tax_rate,
        extraCosts: result.data.extra_costs,
        netValue: result.data.net_value,
        stages: result.data.stages || [],
        tags: []
      };

      toast({
        title: "Sucesso",
        description: `Serviço ${service?.id ? 'atualizado' : 'criado'} com sucesso!`
      });

      onServiceSaved(savedService);
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || `Erro ao ${service?.id ? 'atualizar' : 'criar'} serviço`
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {service?.id ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
          <p className="text-muted-foreground">
            Configure os detalhes e etapas do serviço
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxRate">Taxa de Imposto (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="extraCosts">Custos Extras (R$)</Label>
                <Input
                  id="extraCosts"
                  type="number"
                  step="0.01"
                  value={formData.extraCosts}
                  onChange={(e) => setFormData({ ...formData, extraCosts: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Etapas Sugeridas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Etapas Sugeridas</CardTitle>
              <Button type="button" onClick={addStage} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Etapa
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stages.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
              </p>
            ) : (
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <Card key={stage.id} className="border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Etapa {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStage(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>Nome da Etapa *</Label>
                          <Input
                            value={stage.name}
                            onChange={(e) => updateStage(index, 'name', e.target.value)}
                            placeholder="Ex: Análise inicial"
                            required
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Descrição da Etapa</Label>
                          <Textarea
                            value={stage.description || ''}
                            onChange={(e) => updateStage(index, 'description', e.target.value)}
                            placeholder="Descreva as atividades desta etapa..."
                            rows={2}
                          />
                        </div>
                        
                        <div>
                          <Label>Dias</Label>
                          <Input
                            type="number"
                            min="1"
                            value={stage.days}
                            onChange={(e) => updateStage(index, 'days', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div>
                          <Label>Horas</Label>
                          <Input
                            type="number"
                            min="1"
                            value={stage.hours}
                            onChange={(e) => updateStage(index, 'hours', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <Label>Valor (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={stage.value}
                            onChange={(e) => updateStage(index, 'value', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-muted-foreground">Total de Horas</Label>
                <p className="text-2xl font-bold">{totals.totalHours}h</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor Bruto</Label>
                <p className="text-2xl font-bold">
                  R$ {totals.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Impostos</Label>
                <p className="text-2xl font-bold text-red-600">
                  -R$ {totals.taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Valor Líquido</Label>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totals.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex gap-4 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? 'Salvando...' : (service?.id ? 'Atualizar' : 'Criar')} Serviço
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
