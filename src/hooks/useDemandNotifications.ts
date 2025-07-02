
// Este hook foi removido - funcionalidade de notificações de demandas descontinuada
export const useDemandNotifications = () => {
  return {
    unreadDemands: [],
    hasNewDemands: false,
    markDemandAsViewed: () => {},
    markAllDemandsAsViewed: () => {},
    loadUnreadDemands: () => {}
  };
};
