
import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import PermissionGuard from '../auth/PermissionGuard';
import ChatRoomList from './ChatRoomList';
import ChatWindow from './ChatWindow';

const ChatPage: React.FC = () => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomInfo, setSelectedRoomInfo] = useState<any>(null);

  const handleSelectRoom = (roomId: string, roomInfo: any) => {
    setSelectedRoomId(roomId);
    setSelectedRoomInfo(roomInfo);
  };

  return (
    <PermissionGuard module="chat" action="view">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center">
            <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex gap-6 p-6">
          {/* Room List - Left Side */}
          <div className="w-1/3 min-w-[300px]">
            <ChatRoomList 
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
            />
          </div>
          
          {/* Chat Window - Right Side */}
          <div className="flex-1">
            <ChatWindow 
              roomId={selectedRoomId}
              roomInfo={selectedRoomInfo}
            />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ChatPage;
