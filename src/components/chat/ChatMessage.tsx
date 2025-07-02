
import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: {
    id: string;
    message_text: string;
    message_type: 'user' | 'system';
    created_at: string;
    user_id: string;
  };
  isCurrentUser: boolean;
  userName?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isCurrentUser, userName }) => {
  return (
    <div className={cn(
      "flex mb-4",
      isCurrentUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isCurrentUser 
          ? "bg-blue-500 text-white" 
          : "bg-gray-200 text-gray-800"
      )}>
        {!isCurrentUser && userName && (
          <div className="text-xs text-gray-600 mb-1 font-medium">
            {userName}
          </div>
        )}
        <div className="text-sm">
          {message.message_text}
        </div>
        <div className={cn(
          "text-xs mt-1",
          isCurrentUser ? "text-blue-100" : "text-gray-500"
        )}>
          {format(new Date(message.created_at), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
