
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
    
    onStagesChange([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof Stage, value: any) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    onStagesChange(updatedStages);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    const reorderedStages = updatedStages.map((stage, i) => ({
      ...stage,
      stageOrder: i + 1
    }));
    onStagesChange(reorderedStages);
  };

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
              <div key={stage.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">Etapa {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeStage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Etapa</Label>
                    <Input
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      placeholder="Nome da etapa"
                    />
                  </div>

                  <div>
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={stage.value}
                      onChange={(e) => updateStage(index, 'value', Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={stage.description}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    placeholder="Descrição da etapa"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Dias</Label>
                    <Input
                      type="number"
                      value={stage.days}
                      onChange={(e) => updateStage(index, 'days', Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div>
                    <Label>Horas</Label>
                    <Input
                      type="number"
                      value={stage.hours}
                      onChange={(e) => updateStage(index, 'hours', Number(e.target.value))}
                      min="1"
                    />
                  </div>

                  <div>
                    <Label>Data de Início</Label>
                    <Input
                      type="date"
                      value={stage.startDate}
                      onChange={(e) => updateStage(index, 'startDate', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Data de Término</Label>
                    <Input
                      type="date"
                      value={stage.endDate}
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
                    <Label>
                      Valor de Repasse (R$)
                      <span className="text-sm text-muted-foreground ml-1">- Valor a ser pago ao consultor</span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={stage.valorDeRepasse || 0}
                      onChange={(e) => updateStage(index, 'valorDeRepasse', Number(e.target.value))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="font-medium">Valor Total:</span>
                      <div>R$ {stage.value.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Valor de Repasse:</span>
                      <div>R$ {(stage.valorDeRepasse || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="font-medium">Margem:</span>
                      <div className="text-green-600">R$ {(stage.value - (stage.valorDeRepasse || 0)).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.
          </p>
        )}
        {startDate && (
          <p className="text-xs text-muted-foreground mt-4">
            As datas das etapas são calculadas automaticamente com base na data de início do projeto
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectFormStageSection;
