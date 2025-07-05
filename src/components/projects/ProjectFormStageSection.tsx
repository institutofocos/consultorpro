
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusIcon } from "lucide-react";
import SearchableSelect from "@/components/ui/searchable-select";
import { Stage } from "./types";

interface ProjectFormStageSectionProps {
  stages: Stage[];
  onStagesChange: (stages: Stage[]) => void;
  consultantOptions: { id: string; name: string; }[];
  startDate?: string;
}

const ProjectFormStageSection: React.FC<ProjectFormStageSectionProps> = ({ 
  stages, 
  onStagesChange,
  consultantOptions,
  startDate
}) => {
  const addStage = () => {
    const newStage: Stage = {
      id: `temp-${Date.now()}`,
      projectId: '',
      name: `Etapa ${stages.length + 1}`,
      description: '',
      days: 1,
      hours: 8,
      value: 0,
      startDate: '',
      endDate: '',
      completed: false,
      clientApproved: false,
      managerApproved: false,
      invoiceIssued: false,
      paymentReceived: false,
      consultantsSettled: false,
      attachment: '',
      stageOrder: stages.length + 1,
      consultantId: '',
      status: 'iniciar_projeto',
      valorDeRepasse: 0
    };
    
    console.log('Adicionando nova etapa:', newStage);
    onStagesChange([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    console.log(`Atualizando etapa ${index}, campo ${field}:`, value);
    
    const updatedStages = [...stages];
    
    // Validação e conversão de tipos
    let processedValue = value;
    
    if (field === 'days' || field === 'hours' || field === 'stageOrder') {
      processedValue = Math.max(1, Number(value) || 1);
    } else if (field === 'value' || field === 'valorDeRepasse') {
      processedValue = Number(value) || 0;
    } else if (['completed', 'clientApproved', 'managerApproved', 'invoiceIssued', 'paymentReceived', 'consultantsSettled'].includes(field)) {
      processedValue = Boolean(value);
    } else if (field === 'name' || field === 'description') {
      processedValue = String(value || '');
    }
    
    updatedStages[index] = { ...updatedStages[index], [field]: processedValue };
    
    console.log(`Etapa ${index} atualizada:`, updatedStages[index]);
    onStagesChange(updatedStages);
  };

  const removeStage = (index: number) => {
    console.log(`Removendo etapa ${index}`);
    const updatedStages = stages.filter((_, i) => i !== index);
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1,
      name: stage.name.startsWith('Etapa ') ? `Etapa ${i + 1}` : stage.name
    }));
    
    console.log('Etapas após remoção e reordenação:', reorderedStages);
    onStagesChange(reorderedStages);
  };

  // Log para debugging
  console.log('ProjectFormStageSection - Etapas atuais:', stages);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Etapas do Projeto</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addStage}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Adicionar Etapa
        </Button>
      </CardHeader>
      <CardContent>
        {stages && stages.length > 0 ? (
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <div key={stage.id || index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-lg">Etapa {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStage(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`stage-name-${index}`}>Nome da Etapa *</Label>
                    <Input
                      id={`stage-name-${index}`}
                      value={stage.name || ''}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      placeholder="Digite o nome da etapa"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stage-value-${index}`}>Valor (R$)</Label>
                    <Input
                      id={`stage-value-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={stage.value || 0}
                      onChange={(e) => updateStage(index, 'value', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor={`stage-description-${index}`}>Descrição</Label>
                  <Textarea
                    id={`stage-description-${index}`}
                    value={stage.description || ''}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    placeholder="Descrição detalhada da etapa"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`stage-days-${index}`}>Dias</Label>
                    <Input
                      id={`stage-days-${index}`}
                      type="number"
                      min="1"
                      value={stage.days || 1}
                      onChange={(e) => updateStage(index, 'days', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stage-hours-${index}`}>Horas</Label>
                    <Input
                      id={`stage-hours-${index}`}
                      type="number"
                      min="1"
                      value={stage.hours || 8}
                      onChange={(e) => updateStage(index, 'hours', parseInt(e.target.value) || 8)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stage-start-date-${index}`}>Data de Início</Label>
                    <Input
                      id={`stage-start-date-${index}`}
                      type="date"
                      value={stage.startDate || ''}
                      onChange={(e) => updateStage(index, 'startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stage-end-date-${index}`}>Data de Término</Label>
                    <Input
                      id={`stage-end-date-${index}`}
                      type="date"
                      value={stage.endDate || ''}
                      onChange={(e) => updateStage(index, 'endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Consultor Responsável</Label>
                    <SearchableSelect
                      options={[{ id: '', name: 'Nenhum' }, ...consultantOptions]}
                      value={stage.consultantId || ''}
                      onValueChange={(value) => updateStage(index, 'consultantId', value as string)}
                      placeholder="Selecione um consultor"
                      searchPlaceholder="Pesquisar consultores..."
                      emptyText="Nenhum consultor encontrado"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`stage-valor-repasse-${index}`}>
                      Valor de Repasse (R$)
                      <span className="text-sm text-muted-foreground ml-1">- Valor a ser pago ao consultor</span>
                    </Label>
                    <Input
                      id={`stage-valor-repasse-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={stage.valorDeRepasse || 0}
                      onChange={(e) => updateStage(index, 'valorDeRepasse', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-white p-3 rounded border text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Valor Total:</span>
                      <div className="text-lg font-semibold text-blue-600">
                        R$ {(stage.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Valor de Repasse:</span>
                      <div className="text-lg font-semibold text-orange-600">
                        R$ {(stage.valorDeRepasse || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Margem:</span>
                      <div className="text-lg font-semibold text-green-600">
                        R$ {((stage.value || 0) - (stage.valorDeRepasse || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <div>Dias: {stage.days || 1} | Horas: {stage.hours || 8} | Ordem: {stage.stageOrder || index + 1}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.</p>
          </div>
        )}
        
        {startDate && (
          <p className="text-xs text-muted-foreground mt-4">
            💡 As datas das etapas podem ser calculadas automaticamente com base na data de início do projeto
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFormStageSection;
