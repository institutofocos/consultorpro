
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

// Status expandido para garantir que TODOS os possíveis status apareçam
const defaultKanbanStatuses = [
  { name: 'planned', display_name: 'Planejado', color: '#6b7280' },
  { name: 'iniciar_projeto', display_name: 'Iniciar Projeto', color: '#6b7280' },
  { name: 'active', display_name: 'Ativo', color: '#3b82f6' },
  { name: 'em_planejamento', display_name: 'Em Planejamento', color: '#3b82f6' },
  { name: 'em_producao', display_name: 'Em Produção', color: '#3b82f6' },
  { name: 'aguardando_assinatura', display_name: 'Aguardando Assinatura', color: '#f59e0b' },
  { name: 'aguardando_aprovacao', display_name: 'Aguardando Aprovação', color: '#f97316' },
  { name: 'aguardando_nota_fiscal', display_name: 'Aguardando Nota Fiscal', color: '#8b5cf6' },
  { name: 'aguardando_pagamento', display_name: 'Aguardando Pagamento', color: '#ec4899' },
  { name: 'aguardando_repasse', display_name: 'Aguardando Repasse', color: '#6366f1' },
  { name: 'completed', display_name: 'Completo', color: '#10b981' },
  { name: 'concluido', display_name: 'Concluído', color: '#10b981' },
  { name: 'finalizados', display_name: 'Finalizados', color: '#10b981' },
  { name: 'cancelled', display_name: 'Cancelado', color: '#ef4444' },
  { name: 'cancelados', display_name: 'Cancelados', color: '#ef4444' },
  { name: 'cancelado', display_name: 'Cancelado', color: '#ef4444' },
];

export const useProjectStatuses = () => {
  const queryClient = useQueryClient();

  const { data: statuses = [], isLoading, refetch } = useQuery({
    queryKey: ['project-statuses'],
    queryFn: async () => {
      console.log('=== BUSCANDO STATUS DE PROJETOS ===');
      const { data, error } = await supabase
        .from('project_status_settings')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) {
        console.error('Erro ao buscar status configurados:', error);
        // Em caso de erro, usar fallback
      }
      
      console.log('Status configurados encontrados:', data?.length || 0);
      
      // SEMPRE retornar os status padrão + os configurados
      const configuredStatuses = data || [];
      const allStatuses = [
        ...defaultKanbanStatuses.map((status, index) => ({
          id: `default-${status.name}`,
          name: status.name,
          display_name: status.display_name,
          color: status.color,
          is_active: true,
          is_completion_status: ['finalizados', 'concluido', 'completed'].includes(status.name),
          is_cancellation_status: ['cancelados', 'cancelled', 'cancelado'].includes(status.name),
          order_index: index
        })),
        ...configuredStatuses.map(status => ({
          ...status,
          id: status.id || `config-${status.name}`
        }))
      ];

      // Remover duplicatas baseado no nome
      const uniqueStatuses = allStatuses.reduce((acc, current) => {
        const existing = acc.find(item => item.name === current.name);
        if (!existing) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof allStatuses);

      console.log('Status únicos processados:', uniqueStatuses.length);
      return uniqueStatuses;
    },
    staleTime: 0,
    gcTime: 0,
  });

  const getStatusDisplay = (statusName: string) => {
    if (!statusName) {
      return { label: 'Sem Status', color: '#6b7280' };
    }

    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        label: statusSetting.display_name,
        color: statusSetting.color
      };
    }
    
    // Fallback para status não configurados
    const fallbackStatus = defaultKanbanStatuses.find(s => s.name === statusName);
    if (fallbackStatus) {
      return {
        label: fallbackStatus.display_name,
        color: fallbackStatus.color
      };
    }
    
    // Fallback final - criar display baseado no nome
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
    
    // Fallback para status padrão
    const fallbackStatus = defaultKanbanStatuses.find(s => s.name === statusName);
    if (fallbackStatus) {
      return {
        backgroundColor: fallbackStatus.color,
        color: '#ffffff',
        border: 'transparent'
      };
    }
    
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
