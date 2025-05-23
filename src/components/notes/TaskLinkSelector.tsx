
import React, { useState, useEffect } from 'react';
import { fetchTasksForLinking, linkTasks, unlinkTask, Note } from '@/integrations/supabase/note-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TaskLinkSelectorProps {
  taskId: string;
  linkedTaskId?: string | null;
  onLinkChange: (linkedTaskId: string | null) => void;
}

const TaskLinkSelector: React.FC<TaskLinkSelectorProps> = ({
  taskId,
  linkedTaskId,
  onLinkChange,
}) => {
  const [availableTasks, setAvailableTasks] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(linkedTaskId || null);

  // Load available tasks to link with
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const tasks = await fetchTasksForLinking(taskId);
        setAvailableTasks(tasks);
      } catch (error) {
        console.error('Error loading tasks for linking:', error);
        toast.error('Erro ao carregar tarefas disponíveis');
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, [taskId]);

  const handleLinkTask = async (id: string | null) => {
    if (id === selectedTaskId) return;
    
    setLoading(true);
    try {
      let success: boolean;
      
      if (id) {
        // Link to a new task
        success = await linkTasks(taskId, id);
        if (success) {
          toast.success('Tarefas vinculadas com sucesso');
        }
      } else if (selectedTaskId) {
        // Unlink from current task
        success = await unlinkTask(taskId);
        if (success) {
          toast.success('Vínculo removido com sucesso');
        }
      } else {
        success = true; // No change needed
      }
      
      if (success) {
        setSelectedTaskId(id);
        onLinkChange(id);
      }
    } catch (error) {
      console.error('Error linking task:', error);
      toast.error('Erro ao vincular tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Vincular a outra tarefa</span>
      </div>
      
      <div className="flex gap-2 items-center">
        <Select 
          value={selectedTaskId || ''} 
          onValueChange={(value) => handleLinkTask(value || null)}
          disabled={loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecionar tarefa dependente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma</SelectItem>
            {availableTasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedTaskId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => handleLinkTask(null)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      {selectedTaskId && (
        <p className="text-xs text-muted-foreground">
          Esta tarefa só poderá ser concluída após a conclusão da tarefa vinculada.
        </p>
      )}
    </div>
  );
};

export default TaskLinkSelector;
