
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SearchableSelect from "@/components/ui/searchable-select";
import { fetchProjectTags } from "@/integrations/supabase/projects";

interface ProjectStage {
  id?: string;
  name: string;
  description: string;
  value: number;
  hours: number;
  days: number;
  start_date: string;
  end_date: string;
  tags?: string[];
  tagIds?: string[];
}

interface ProjectStageFormProps {
  stages: ProjectStage[];
  onStagesChange: (stages: ProjectStage[]) => void;
}

const ProjectStageForm: React.FC<ProjectStageFormProps> = ({ stages, onStagesChange }) => {
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    const loadTags = async () => {
      const tags = await fetchProjectTags();
      setAvailableTags(tags);
    };
    loadTags();
  }, []);

  const addStage = () => {
    const newStage: ProjectStage = {
      name: '',
      description: '',
      value: 0,
      hours: 8,
      days: 1,
      start_date: '',
      end_date: '',
      tags: [],
      tagIds: []
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

  const handleTagSelection = (stageIndex: number, value: string | string[]) => {
    if (typeof value === 'string') {
      const tag = availableTags.find(t => t.id === value);
      if (tag && !stages[stageIndex].tags?.includes(tag.name)) {
        const updatedStages = [...stages];
        updatedStages[stageIndex] = {
          ...updatedStages[stageIndex],
          tags: [...(updatedStages[stageIndex].tags || []), tag.name],
          tagIds: [...(updatedStages[stageIndex].tagIds || []), tag.id]
        };
        onStagesChange(updatedStages);
      }
    }
  };

  const removeTag = (stageIndex: number, tagIndex: number) => {
    const updatedStages = [...stages];
    updatedStages[stageIndex] = {
      ...updatedStages[stageIndex],
      tags: updatedStages[stageIndex].tags?.filter((_, i) => i !== tagIndex),
      tagIds: updatedStages[stageIndex].tagIds?.filter((_, i) => i !== tagIndex)
    };
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

              <div className="md:col-span-2">
                <Label htmlFor={`stage-tags-${index}`}>Tags da Etapa</Label>
                <SearchableSelect
                  options={availableTags}
                  value=""
                  onValueChange={(value) => handleTagSelection(index, value)}
                  placeholder="Adicionar tag à etapa"
                  searchPlaceholder="Pesquisar tags..."
                  emptyText="Nenhuma tag encontrada"
                />
                {stage.tags && stage.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stage.tags.map((tagName, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tagName}
                        <button
                          type="button"
                          onClick={() => removeTag(index, tagIndex)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
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
