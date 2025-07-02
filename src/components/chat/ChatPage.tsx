
import React from 'react';
import { MessageCircle } from 'lucide-react';
import PermissionGuard from '../auth/PermissionGuard';

const ChatPage: React.FC = () => {
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Sistema de Chat
            </h2>
            <p className="text-gray-500">
              Interface de chat será implementada aqui
            </p>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

export default ChatPage;
