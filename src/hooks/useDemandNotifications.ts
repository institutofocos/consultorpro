
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DemandNotification {
  id: string;
  name: string;
  created_at: string;
  viewed: boolean;
}

export const useDemandNotifications = () => {
  const [unreadDemands, setUnreadDemands] = useState<DemandNotification[]>([]);
  const [hasNewDemands, setHasNewDemands] = useState(false);
  const { user } = useAuth();

  // Função para tocar o som de notificação
  const playNotificationSound = useCallback(() => {
    try {
      // Criar um tom de campainha usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configurar o som (campainha)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Não foi possível reproduzir o som de notificação:', error);
    }
  }, []);

  // Carregar demandas não lidas ao inicializar
  const loadUnreadDemands = useCallback(async () => {
    if (!user) return;

    try {
      // Buscar demandas criadas nas últimas 24 horas que não foram visualizadas pelo usuário
      const { data: demands, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('status', 'Demanda')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Verificar quais demandas foram visualizadas pelo usuário
      const { data: viewedDemands, error: viewedError } = await supabase
        .from('demand_views')
        .select('demand_id')
        .eq('user_id', user.id);

      if (viewedError) throw viewedError;

      const viewedDemandIds = viewedDemands?.map(v => v.demand_id) || [];
      const unread = demands?.filter(d => !viewedDemandIds.includes(d.id)) || [];

      setUnreadDemands(unread.map(d => ({ ...d, viewed: false })));
      setHasNewDemands(unread.length > 0);
    } catch (error) {
      console.error('Erro ao carregar demandas não lidas:', error);
    }
  }, [user]);

  // Marcar demanda como visualizada
  const markDemandAsViewed = useCallback(async (demandId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('demand_views')
        .upsert({
          demand_id: demandId,
          user_id: user.id,
          viewed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Atualizar estado local
      setUnreadDemands(prev => prev.filter(d => d.id !== demandId));
      setHasNewDemands(prev => {
        const remaining = unreadDemands.filter(d => d.id !== demandId);
        return remaining.length > 0;
      });
    } catch (error) {
      console.error('Erro ao marcar demanda como visualizada:', error);
    }
  }, [user, unreadDemands]);

  // Marcar todas as demandas como visualizadas
  const markAllDemandsAsViewed = useCallback(async () => {
    if (!user || unreadDemands.length === 0) return;

    try {
      const viewRecords = unreadDemands.map(demand => ({
        demand_id: demand.id,
        user_id: user.id,
        viewed_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('demand_views')
        .upsert(viewRecords);

      if (error) throw error;

      setUnreadDemands([]);
      setHasNewDemands(false);
    } catch (error) {
      console.error('Erro ao marcar todas as demandas como visualizadas:', error);
    }
  }, [user, unreadDemands]);

  // Configurar listener para novas demandas
  useEffect(() => {
    if (!user) return;

    loadUnreadDemands();

    const channel = supabase
      .channel('demand-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'projects',
          filter: 'status=eq.Demanda'
        },
        (payload) => {
          console.log('Nova demanda detectada:', payload);
          const newDemand = payload.new as any;
          
          // Adicionar à lista de não lidas
          setUnreadDemands(prev => [{
            id: newDemand.id,
            name: newDemand.name,
            created_at: newDemand.created_at,
            viewed: false
          }, ...prev]);
          
          setHasNewDemands(true);
          playNotificationSound();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadUnreadDemands, playNotificationSound]);

  return {
    unreadDemands,
    hasNewDemands,
    markDemandAsViewed,
    markAllDemandsAsViewed,
    loadUnreadDemands
  };
};
