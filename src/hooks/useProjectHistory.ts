
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectHistory } from '@/types/project-history';

export const useProjectHistory = (projectId?: string) => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjectHistory = async (): Promise<ProjectHistory[]> => {
    try {
      console.log('Fetching project history for project:', projectId);
      
      let query = supabase
        .from('project_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching project history:', error);
        throw error;
      }

      console.log('Project history fetched:', data);
      return data || [];
    } catch (error) {
      console.error('Error in fetchProjectHistory:', error);
      return [];
    }
  };

  const { 
    data: history = [], 
    isLoading: queryLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['project-history', projectId],
    queryFn: fetchProjectHistory,
    enabled: !!projectId,
  });

  const addHistoryEntry = async (
    projectId: string,
    actionType: string,
    description: string,
    stageId?: string,
    fieldChanged?: string,
    oldValue?: string,
    newValue?: string,
    userName?: string
  ) => {
    setIsLoading(true);
    try {
      console.log('Adding project history entry:', {
        projectId,
        actionType,
        description,
        stageId,
        fieldChanged,
        oldValue,
        newValue,
        userName
      });

      const { data, error } = await supabase.rpc('insert_project_history', {
        p_project_id: projectId,
        p_action_type: actionType,
        p_description: description,
        p_stage_id: stageId || null,
        p_field_changed: fieldChanged || null,
        p_old_value: oldValue || null,
        p_new_value: newValue || null,
        p_user_name: userName || 'Sistema'
      });

      if (error) {
        console.error('Error adding project history:', error);
        throw error;
      }

      console.log('Project history entry added:', data);
      await refetch();
      return data;
    } catch (error) {
      console.error('Error in addHistoryEntry:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    history,
    isLoading: queryLoading || isLoading,
    isError,
    refetch,
    addHistoryEntry
  };
};
