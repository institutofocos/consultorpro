
// Stub implementation - chat functionality has been removed

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  parent_room_id?: string;
  level: number;
  is_pinned: boolean;
  meeting_link?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ChatUser {
  user_id: string;
  name: string;
  email: string;
  type: 'consultant' | 'client';
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}

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

export const useDeleteChatRoom = () => {
  return {
    mutateAsync: (roomId: string) => Promise.resolve(),
    isPending: false
  };
};

export const usePinChatRoom = () => {
  return {
    mutateAsync: (params: { roomId: string; isPinned: boolean }) => Promise.resolve(),
    isPending: false
  };
};

export const useChatMessages = (roomId: string) => {
  return {
    data: [],
    isLoading: false,
    error: null
  };
};

export const useSendMessage = () => {
  return {
    mutateAsync: (params: { room_id: string; message: string; sender_name: string }) => Promise.resolve(),
    isPending: false
  };
};

export const useCreateChatRoom = () => {
  return {
    mutateAsync: (params: any) => Promise.resolve(),
    isPending: false
  };
};

export const useUpdateChatRoom = () => {
  return {
    mutateAsync: (params: any) => Promise.resolve(),
    isPending: false
  };
};

export const useAvailableUsers = () => {
  return {
    data: [],
    isLoading: false,
    error: null
  };
};

export const useRoomParticipants = (roomId: string) => {
  return {
    data: [],
    isLoading: false,
    error: null
  };
};

export const useUpdateRoomParticipants = () => {
  return {
    mutateAsync: (params: { roomId: string; participants: any[] }) => Promise.resolve(),
    isPending: false
  };
};
