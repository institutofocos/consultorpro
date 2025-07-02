
export interface ChatRoom {
  id: string;
  project_id: string;
  stage_id?: string;
  room_type: 'project' | 'stage';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
    client_id: string;
    clients?: {
      id: string;
      name: string;
    };
  };
  stage?: {
    id: string;
    name: string;
  };
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message_text: string;
  message_type: 'user' | 'ai' | 'system';
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name: string;
  };
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  added_by?: string;
  added_at: string;
  profiles?: {
    id: string;
    full_name: string;
  };
}
