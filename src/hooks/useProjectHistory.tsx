
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectHistoryEntry {
  id: string;
  action_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  field_changed: string | null;
  user_name: string | null;
  created_at: string;
  stage_id: string | null;
}

export const useProjectHistory = (projectId: string) => {
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchHistory();
    }
  }, [projectId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('project_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching project history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStageStatusChangeDate = (stageId: string, status: string) => {
    const statusChange = history.find(entry => 
      entry.stage_id === stageId && 
      entry.field_changed === 'status' && 
      entry.new_value === status
    );
    return statusChange?.created_at || null;
  };

  return {
    history,
    isLoading,
    getStageStatusChangeDate,
    refetch: fetchHistory
  };
};
