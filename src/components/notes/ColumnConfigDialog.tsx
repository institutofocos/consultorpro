
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KanbanColumn } from '@/integrations/supabase/kanban-columns';

interface ColumnConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: KanbanColumn;
  onSave: (updates: Partial<KanbanColumn>) => void;
}

const ColumnConfigDialog: React.FC<ColumnConfigDialogProps> = ({
  open,
  onOpenChange,
  column,
  onSave
}) => {
  const [title, setTitle] = useState(column.title);
  const [isCompletionColumn, setIsCompletionColumn] = useState(column.is_completion_column);
  const [columnType, setColumnType] = useState(column.column_type);

  const handleSave = () => {
    onSave({
      title: title.trim(),
      is_completion_column: isCompletionColumn,
      column_type: columnType
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configurar Coluna</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Coluna</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da coluna"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="completion-column"
                checked={isCompletionColumn}
                onCheckedChange={setIsCompletionColumn}
              />
              <Label htmlFor="completion-column">
                Esta coluna representa finalização de projetos
              </Label>
            </div>

            {isCompletionColumn && (
              <div className="space-y-3 ml-6">
                <Label>Tipo de finalização:</Label>
                <RadioGroup 
                  value={columnType} 
                  onValueChange={(value) => setColumnType(value as 'normal' | 'completed' | 'cancelled')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completed" id="completed" />
                    <Label htmlFor="completed">Projeto Concluído/Finalizado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cancelled" id="cancelled" />
                    <Label htmlFor="cancelled">Projeto Cancelado</Label>
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ColumnConfigDialog;
