
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

// Status padrão para o Kanban - incluindo os status que vi na imagem
const defaultKanbanStatuses = [
  { name: 'iniciar_projeto', display_name: 'Iniciar Projeto', color: '#6b7280' },
  { name: 'em_producao', display_name: 'Em Produção', color: '#3b82f6' },
  { name: 'aguardando_assinatura', display_name: 'Aguardando Assinatura', color: '#f59e0b' },
  { name: 'aguardando_aprovacao', display_name: 'Aguardando Aprovação', color: '#f97316' },
  { name: 'aguardando_nota_fiscal', display_name: 'Aguardando Nota Fiscal', color: '#8b5cf6' },
  { name: 'aguardando_pagamento', display_name: 'Aguardando Pagamento', color: '#ec4899' },
  { name: 'aguardando_repasse', display_name: 'Aguardando Repasse', color: '#6366f1' },
  { name: 'finalizados', display_name: 'Finalizados', color: '#10b981' },
  { name: 'cancelados', display_name: 'Cancelados', color: '#ef4444' },
  { name: 'concluido', display_name: 'Concluído', color: '#10b981' },
  { name: 'planned', display_name: 'Planejado', color: '#6b7280' },
  { name: 'active', display_name: 'Ativo', color: '#3b82f6' },
  { name: 'completed', display_name: 'Completo', color: '#10b981' },
  { name: 'cancelled', display_name: 'Cancelado', color: '#ef4444' },
];

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
        // Não lançar erro, usar fallback
      }
      
      console.log('Active statuses fetched:', data);
      
      // Se não há status configurados, retornar os padrão do Kanban
      if (!data || data.length === 0) {
        return defaultKanbanStatuses.map((status, index) => ({
          id: `default-${index}`,
          name: status.name,
          display_name: status.display_name,
          color: status.color,
          is_active: true,
          is_completion_status: status.name === 'finalizados' || status.name === 'concluido' || status.name === 'completed',
          is_cancellation_status: status.name === 'cancelados' || status.name === 'cancelled',
          order_index: index
        }));
      }
      
      return data || [];
    },
    staleTime: 0,
    gcTime: 0,
  });

  const getStatusDisplay = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return {
        label: statusSetting.display_name,
        color: statusSetting.color
      };
    }
    
    // Fallback para status do Kanban
    const kanbanStatus = defaultKanbanStatuses.find(s => s.name === statusName);
    if (kanbanStatus) {
      return {
        label: kanbanStatus.display_name,
        color: kanbanStatus.color
      };
    }
    
    // Fallback geral expandido
    const fallbackStatuses: { [key: string]: { label: string; color: string } } = {
      'planned': { label: 'Planejado', color: '#6b7280' },
      'active': { label: 'Ativo', color: '#3b82f6' },
      'em_planejamento': { label: 'Em Planejamento', color: '#3b82f6' },
      'em_producao': { label: 'Em Produção', color: '#f59e0b' },
      'concluido': { label: 'Concluído', color: '#10b981' },
      'completed': { label: 'Completo', color: '#10b981' },
      'cancelado': { label: 'Cancelado', color: '#ef4444' },
      'cancelled': { label: 'Cancelado', color: '#ef4444' },
    };
    
    return fallbackStatuses[statusName] || { label: statusName, color: '#6b7280' };
  };

  const getStatusColorClass = (statusName: string) => {
    const statusSetting = statuses.find(s => s.name === statusName);
    if (statusSetting) {
      return `text-white border-transparent shadow`;
    }

    // Fallback para status antigos
    const fallbackColorClasses: { [key: string]: string } = {
      'iniciar_projeto': 'bg-gray-100 text-gray-800',
      'em_producao': 'bg-blue-100 text-blue-800',
      'aguardando_assinatura': 'bg-yellow-100 text-yellow-800',
      'aguardando_aprovacao': 'bg-orange-100 text-orange-800',
      'aguardando_nota_fiscal': 'bg-purple-100 text-purple-800',
      'aguardando_pagamento': 'bg-pink-100 text-pink-800',
      'aguardando_repasse': 'bg-indigo-100 text-indigo-800',
      'finalizados': 'bg-green-100 text-green-800',
      'cancelados': 'bg-red-100 text-red-800',
      'planned': 'bg-gray-100 text-gray-800',
      'active': 'bg-blue-100 text-blue-800',
      'em_planejamento': 'bg-blue-100 text-blue-800',
      'concluido': 'bg-green-100 text-green-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
      'cancelled': 'bg-red-100 text-red-800',
    };
    
    return fallbackColorClasses[statusName] || 'bg-gray-100 text-gray-800';
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
    
    // Fallback para status do Kanban
    const kanbanStatus = defaultKanbanStatuses.find(s => s.name === statusName);
    if (kanbanStatus) {
      return {
        backgroundColor: kanbanStatus.color,
        color: '#ffffff',
        border: 'transparent'
      };
    }
    
    return {};
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
