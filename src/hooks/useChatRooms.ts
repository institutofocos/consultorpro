
// Este hook foi removido - funcionalidade de chat descontinuada
// Mantendo interfaces para compatibilidade com imports existentes

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  level: number;
  parent_room_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_pinned?: boolean;
  meeting_link?: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
  edited_at?: string;
  is_deleted: boolean;
}

export interface ChatUser {
  user_id: string;
  name: string;
  email: string;
  type: 'consultant' | 'client';
}

// Stub implementations - retornam dados vazios
export const useChatRooms = () => {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

export const useChatMessages = (roomId: string | null) => {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

export const useAvailableUsers = () => {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

export const useCreateChatRoom = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => ({ id: '', name: '', created_at: '', updated_at: '', level: 0, created_by: '', is_active: false }),
    isLoading: false,
    error: null
  };
};

export const useSendMessage = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => ({ id: '', room_id: '', sender_id: '', sender_name: '', message: '', created_at: '', is_deleted: false }),
    isLoading: false,
    error: null
  };
};

export const useDeleteChatRoom = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isLoading: false,
    error: null
  };
};

export const useUpdateChatRoom = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => ({ id: '', name: '', created_at: '', updated_at: '', level: 0, created_by: '', is_active: false }),
    isLoading: false,
    error: null
  };
};

export const usePinChatRoom = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => ({ roomId: '', isPinned: false }),
    isLoading: false,
    error: null
  };
};

export const useRoomParticipants = (roomId: string | null) => {
  return {
    data: [],
    isLoading: false,
    error: null,
    refetch: () => {}
  };
};

export const useUpdateRoomParticipants = () => {
  return {
    mutate: () => {},
    mutateAsync: async () => {},
    isLoading: false,
    error: null
  };
};
