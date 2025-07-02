
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDemandNotifications = () => {
  const [hasNewDemands, setHasNewDemands] = useState(false);
  const [unreadDemands, setUnreadDemands] = useState([]);

  const loadUnreadDemands = async () => {
    try {
      // Simular verificação de demandas não lidas
      // Você pode implementar a lógica real baseada na sua estrutura de dados
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, status, created_at')
        .eq('status', 'planned')
        .order('created_at', { ascending: false })
        .limit(5);

      if (projects && projects.length > 0) {
        setUnreadDemands(projects);
        setHasNewDemands(true);
      } else {
        setUnreadDemands([]);
        setHasNewDemands(false);
      }
    } catch (error) {
      console.error('Erro ao carregar demandas:', error);
      setUnreadDemands([]);
      setHasNewDemands(false);
    }
  };

  const markDemandAsViewed = (demandId: string) => {
    setUnreadDemands(prev => prev.filter((demand: any) => demand.id !== demandId));
    setHasNewDemands(unreadDemands.length > 1);
  };

  const markAllDemandsAsViewed = () => {
    setUnreadDemands([]);
    setHasNewDemands(false);
  };

  useEffect(() => {
    loadUnreadDemands();
  }, []);

  return {
    unreadDemands,
    hasNewDemands,
    markDemandAsViewed,
    markAllDemandsAsViewed,
    loadUnreadDemands
  };
};
