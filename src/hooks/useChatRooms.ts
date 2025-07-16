
// Stub implementation - chat functionality has been removed
export const useChatRooms = () => {
  return {
    rooms: [],
    isLoading: false,
    error: null,
    createRoom: () => Promise.resolve(),
    updateRoom: () => Promise.resolve(),
    deleteRoom: () => Promise.resolve(),
    refetch: () => Promise.resolve()
  };
};

export const useChatRoomsDebug = () => {
  return {
    rooms: [],
    isLoading: false,
    error: null,
    debug: {
      lastFetch: null,
      fetchCount: 0,
      hasAuthUser: false,
      policies: []
    }
  };
};
