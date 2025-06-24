
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
      console.log('=== BUSCANDO STATUS DE PROJETOS CONFIGURADOS ===');
      const { data, error } = await supabase
        .from('project_status_settings')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Erro ao buscar status configurados:', error);
        return [];
      }
      
      console.log('Status configurados encontrados:', data?.length || 0);
      console.log('Status configurados:', data);
      
      // Garantir que sempre temos pelo menos o status "Iniciar Projeto"
      const configuredStatuses = (data || []).map(status => ({
        id: status.id,
        name: status.name,
        display_name: status.display_name,
        color: status.color,
        is_active: status.is_active,
        is_completion_status: status.is_completion_status,
        is_cancellation_status: status.is_cancellation_status,
        order_index: status.order_index
      }));

      // Se não existe o status "iniciar_projeto", adicioná-lo como primeiro
      const hasIniciarProjeto = configuredStatuses.some(s => s.name === 'iniciar_projeto');
      if (!hasIniciarProjeto) {
        configuredStatuses.unshift({
          id: 'temp-iniciar-projeto',
          name: 'iniciar_projeto',
          display_name: 'Iniciar Projeto',
          color: '#9CA3AF',
          is_active: true,
          is_completion_status: false,
          is_cancellation_status: false,
          order_index: 0
        });
      }

      console.log('Status processados para o Kanban:', configuredStatuses);
      return configuredStatuses;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const getStatusDisplay = (statusName: string) => {
    if (!statusName) {
      return { label: 'Sem Status', color: '#6b7280' };
    }

    // Buscar primeiro nos status configurados
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        label: statusSetting.display_name,
        color: statusSetting.color
      };
    }
    
    // Fallback para status não configurados - criar display baseado no nome
    const displayName = statusName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    
    return { 
      label: displayName, 
      color: '#6b7280' 
    };
  };

  const getStatusColorClass = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return `text-white border-transparent shadow`;
    }

    // Fallback para classes CSS baseadas no nome
    const colorClasses: { [key: string]: string } = {
      'iniciar_projeto': 'bg-gray-100 text-gray-800',
      'planned': 'bg-gray-100 text-gray-800',
      'em_producao': 'bg-blue-100 text-blue-800',
      'active': 'bg-blue-100 text-blue-800',
      'em_planejamento': 'bg-blue-100 text-blue-800',
      'aguardando_assinatura': 'bg-yellow-100 text-yellow-800',
      'aguardando_aprovacao': 'bg-orange-100 text-orange-800',
      'aguardando_nota_fiscal': 'bg-purple-100 text-purple-800',
      'aguardando_pagamento': 'bg-pink-100 text-pink-800',
      'aguardando_repasse': 'bg-indigo-100 text-indigo-800',
      'finalizados': 'bg-green-100 text-green-800',
      'concluido': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelados': 'bg-red-100 text-red-800',
      'cancelled': 'bg-red-100 text-red-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    
    return colorClasses[statusName] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeStyle = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        backgroundColor: statusSetting.color,
        color: '#ffffff',
        border: 'transparent'
      };
    }
    
    // Fallback para status não configurados
    return {
      backgroundColor: '#6b7280',
      color: '#ffffff',
      border: 'transparent'
    };
  };

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
