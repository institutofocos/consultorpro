
import React, { useEffect, useRef } from 'react';

type Message = {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
};

interface ChatMessagesProps {
  messages: Message[];
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rolar para a última mensagem quando houver novas mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Agrupar mensagens por data
  const groupedMessages: { [date: string]: Message[] } = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as { [date: string]: Message[] });

  // Formatar horário da mensagem
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          Nenhuma mensagem nesta sala ainda. Seja o primeiro a enviar!
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center">
            <div className="h-px flex-1 bg-border"></div>
            <span className="px-2 text-xs text-muted-foreground">{date}</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>
          
          {dateMessages.map((message, index) => {
            // Verificar se esta mensagem é de um remetente diferente do anterior
            const isNewSender = index === 0 || dateMessages[index - 1].senderId !== message.senderId;
            
            return (
              <div key={message.id} className={`flex ${!isNewSender ? 'pl-10 pt-0.5' : 'pt-3'}`}>
                {isNewSender && (
                  <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <span className="text-sm font-medium">
                      {message.senderName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                
                <div className={`flex flex-col ${!isNewSender ? '' : 'flex-1'}`}>
                  {isNewSender && (
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div className="text-sm flex items-center">
                    <span className="break-words">{message.content}</span>
                    {!isNewSender && (
                      <span className="text-xs text-muted-foreground ml-2">{formatTime(message.timestamp)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
