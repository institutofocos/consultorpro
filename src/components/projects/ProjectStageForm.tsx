
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

interface ProjectStage {
  id?: string;
  name: string;
  description: string;
  value: number;
  hours: number;
  days: number;
  start_date: string;
  end_date: string;
  valor_de_repasse?: number;
}

interface ProjectStageFormProps {
  stages: ProjectStage[];
  onStagesChange: (stages: ProjectStage[]) => void;
}

const ProjectStageForm: React.FC<ProjectStageFormProps> = ({ stages, onStagesChange }) => {
  const addStage = () => {
    const newStage: ProjectStage = {
      name: '',
      description: '',
      value: 0,
      hours: 8,
      days: 1,
      start_date: '',
      end_date: '',
      valor_de_repasse: 0
    };
    onStagesChange([...stages, newStage]);
  };

  const updateStage = (index: number, field: keyof ProjectStage, value: string | number) => {
    const updatedStages = [...stages];
    updatedStages[index] = { ...updatedStages[index], [field]: value };
    onStagesChange(updatedStages);
  };

  const removeStage = (index: number) => {
    const updatedStages = stages.filter((_, i) => i !== index);
    onStagesChange(updatedStages);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold">Etapas do Projeto</Label>
        <Button type="button" onClick={addStage} size="sm">
          Adicionar Etapa
        </Button>
      </div>

      {stages.map((stage, index) => (
        <Card key={index} className="p-4">
          <CardContent className="p-0">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Etapa {index + 1}</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeStage(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`stage-name-${index}`}>Nome da Etapa</Label>
                <Input
                  id={`stage-name-${index}`}
                  value={stage.name}
                  onChange={(e) => updateStage(index, 'name', e.target.value)}
                  placeholder="Nome da etapa"
                />
              </div>

              <div>
                <Label htmlFor={`stage-value-${index}`}>Valor (R$)</Label>
                <Input
                  id={`stage-value-${index}`}
                  type="number"
                  step="0.01"
                  value={stage.value}
                  onChange={(e) => updateStage(index, 'value', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor={`stage-start-date-${index}`}>Data de Início</Label>
                <Input
                  id={`stage-start-date-${index}`}
                  type="date"
                  value={stage.start_date}
                  onChange={(e) => updateStage(index, 'start_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`stage-end-date-${index}`}>Data de Fim</Label>
                <Input
                  id={`stage-end-date-${index}`}
                  type="date"
                  value={stage.end_date}
                  onChange={(e) => updateStage(index, 'end_date', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor={`stage-hours-${index}`}>Horas</Label>
                <Input
                  id={`stage-hours-${index}`}
                  type="number"
                  value={stage.hours}
                  onChange={(e) => updateStage(index, 'hours', parseInt(e.target.value) || 8)}
                  placeholder="8"
                />
              </div>

              <div>
                <Label htmlFor={`stage-days-${index}`}>Dias</Label>
                <Input
                  id={`stage-days-${index}`}
                  type="number"
                  value={stage.days}
                  onChange={(e) => updateStage(index, 'days', parseInt(e.target.value) || 1)}
                  placeholder="1"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor={`stage-description-${index}`}>Descrição</Label>
                <Textarea
                  id={`stage-description-${index}`}
                  value={stage.description}
                  onChange={(e) => updateStage(index, 'description', e.target.value)}
                  placeholder="Descrição da etapa"
                  rows={3}
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
                  value={stage.valor_de_repasse || 0}
                  onChange={(e) => updateStage(index, 'valor_de_repasse', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-end">
                <div className="text-sm text-muted-foreground p-2 bg-gray-50 rounded">
                  <p><strong>Valor Total:</strong> R$ {stage.value.toFixed(2)}</p>
                  <p><strong>Valor de Repasse:</strong> R$ {(stage.valor_de_repasse || 0).toFixed(2)}</p>
                  <p><strong>Margem:</strong> R$ {(stage.value - (stage.valor_de_repasse || 0)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {stages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma etapa adicionada. Clique em "Adicionar Etapa" para começar.</p>
        </div>
      )}
    </div>
  );
};

export default ProjectStageForm;
