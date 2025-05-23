
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Calendar, User, CheckCircle } from 'lucide-react';
import { NoteChecklist, updateChecklist } from '@/integrations/supabase/notes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChecklistItemProps {
  checklist: NoteChecklist;
  onUpdate: () => void;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ checklist, onUpdate }) => {
  const handleToggleComplete = async () => {
    try {
      const success = await updateChecklist(checklist.id, {
        completed: !checklist.completed
      });

      if (success) {
        onUpdate();
        toast.success(
          checklist.completed 
            ? 'Checklist marcada como pendente' 
            : 'Checklist concluída com sucesso!'
        );
      }
    } catch (error) {
      toast.error('Erro ao atualizar checklist');
    }
  };

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 border rounded-lg",
      checklist.completed && "bg-muted/50"
    )}>
      <Button
        variant={checklist.completed ? "default" : "outline"}
        size="sm"
        onClick={handleToggleComplete}
        className={cn(
          "min-w-[80px]",
          checklist.completed && "bg-green-600 hover:bg-green-700"
        )}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        {checklist.completed ? 'Feito' : 'Fazer'}
      </Button>

      <div className="flex-1 space-y-1">
        <div className={cn(
          "font-medium",
          checklist.completed && "line-through text-muted-foreground"
        )}>
          {checklist.title}
        </div>
        
        {checklist.description && (
          <div className={cn(
            "text-sm text-muted-foreground",
            checklist.completed && "line-through"
          )}>
            {checklist.description}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {checklist.due_date && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {format(new Date(checklist.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
          
          {checklist.responsible_consultant_name && (
            <Badge variant="outline" className="text-xs">
              <User className="h-3 w-3 mr-1" />
              {checklist.responsible_consultant_name}
            </Badge>
          )}
          
          {checklist.completed && checklist.completed_at && (
            <Badge variant="secondary" className="text-xs">
              Concluído em {format(new Date(checklist.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChecklistItem;
