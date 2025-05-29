
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectStatus {
  id: string;
  name: string;
  display_name: string;
  color: string;
  is_completion_status: boolean;
  is_cancellation_status: boolean;
  is_active: boolean;
  order_index: number;
}

export const useProjectStatuses = () => {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('project_status_settings')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Error fetching project statuses:', error);
      setStatuses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return {
      label: status?.display_name || statusName,
      color: status?.color || '#3b82f6'
    };
  };

  const getStatusBadgeStyle = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return {
      backgroundColor: status?.color || '#3b82f6',
      color: 'white'
    };
  };

  return {
    statuses,
    isLoading,
    getStatusDisplay,
    getStatusBadgeStyle
  };
};
