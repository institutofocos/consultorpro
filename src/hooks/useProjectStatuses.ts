
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface ProjectStatusSetting {
  id: string;
  name: string;
  display_name: string;
  color: string;
  is_active: boolean;
  is_completion_status: boolean;
  is_cancellation_status: boolean;
  order_index: number;
}

export const useProjectStatuses = () => {
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading, refetch } = useQuery({
    queryKey: ['project-statuses'],
    queryFn: async () => {
      console.log('Fetching project statuses...');
      const { data, error } = await supabase
        .from('project_status_settings')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Erro ao buscar status dos projetos:', error);
        throw error;
      }
      
      console.log('Active statuses fetched:', data);
      return data || [];
    },
    staleTime: 0, // Always refetch to ensure fresh data
    gcTime: 0, // Don't cache to prevent stale data (renamed from cacheTime)
  });

  const getStatusDisplay = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        label: statusSetting.display_name,
        color: statusSetting.color
      };
    }
    
    // Fallback para status antigos não configurados
    const fallbackStatuses: { [key: string]: { label: string; color: string } } = {
      'em_planejamento': { label: 'Em Planejamento', color: '#3b82f6' },
      'em_producao': { label: 'Em Produção', color: '#f59e0b' },
      'concluido': { label: 'Concluído', color: '#10b981' },
      'cancelado': { label: 'Cancelado', color: '#ef4444' },
    };
    
    return fallbackStatuses[statusName] || { label: statusName, color: '#6b7280' };
  };

  const getStatusColorClass = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      // Create dynamic inline styles based on the actual color from database
      return `text-white border-transparent shadow`;
    }

    // Fallback para status antigos
    const fallbackColorClasses: { [key: string]: string } = {
      'em_planejamento': 'bg-blue-100 text-blue-800',
      'em_producao': 'bg-yellow-100 text-yellow-800',
      'concluido': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    
    return fallbackColorClasses[statusName] || 'bg-gray-100 text-gray-800';
  };

  // Function to get badge style with dynamic background color
  const getStatusBadgeStyle = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        backgroundColor: statusSetting.color,
        color: '#ffffff',
        border: 'transparent'
      };
    }
    return {};
  };

  // Function to invalidate and refetch statuses
  const invalidateStatuses = () => {
    console.log('Invalidating project statuses cache...');
    queryClient.invalidateQueries({ queryKey: ['project-statuses'] });
  };

  return {
    statuses,
    isLoading,
    refetch,
    getStatusDisplay,
    getStatusColorClass,
    getStatusBadgeStyle,
    invalidateStatuses
  };
};
