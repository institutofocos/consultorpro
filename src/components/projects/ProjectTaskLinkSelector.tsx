
import React, { useState, useEffect } from 'react';
import { fetchNotes } from '@/integrations/supabase/notes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectTaskLinkSelectorProps {
  projectId: string;
  taskId: string;
  linkedTaskId?: string | null;
  onLinkChange: (linkedTaskId: string | null) => void;
}

const ProjectTaskLinkSelector: React.FC<ProjectTaskLinkSelectorProps> = ({
  projectId,
  taskId,
  linkedTaskId,
  onLinkChange,
}) => {
  const [availableTasks, setAvailableTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(linkedTaskId || null);

  // Load available tasks from the same project
  useEffect(() => {
    const loadTasks = async () => {
      setLoading(true);
      try {
        const allNotes = await fetchNotes();
        // Filter tasks from the same project, excluding the current task
        const projectTasks = allNotes.filter(note => 
          note.id !== taskId && 
          (note.title.includes('Projeto:') || note.service_id || note.client_id)
        );
        setAvailableTasks(projectTasks);
      } catch (error) {
        console.error('Error loading project tasks:', error);
        toast.error('Erro ao carregar tarefas do projeto');
      } finally {
        setLoading(false);
      }
    };
    
    loadTasks();
  }, [taskId, projectId]);

  const handleLinkTask = async (id: string | null) => {
    if (id === selectedTaskId) return;
    
    setSelectedTaskId(id);
    onLinkChange(id);
    
    if (id) {
      toast.success('Tarefas vinculadas com sucesso');
    } else {
      toast.success('Vínculo removido com sucesso');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <LinkIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Vincular a outra tarefa do projeto</span>
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

export default ProjectTaskLinkSelector;
