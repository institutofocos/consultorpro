
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { sendChatMessage } from '@/integrations/supabase/chat';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSending && !disabled) {
      setIsSending(true);
      
      try {
        await onSendMessage(message);
        setMessage('');
        
        // Foco no textarea após enviar
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível enviar a mensagem. Tente novamente."
        });
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar ao pressionar Enter sem shift
    if (e.key === 'Enter' && !e.shiftKey && !isSending && !disabled) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Selecione uma sala para enviar mensagens..." : "Digite sua mensagem..."}
          className="min-h-12 pr-20 resize-none"
          rows={1}
          disabled={disabled || isSending}
        />
        <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
          <Button 
            type="button" 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 rounded-full"
            disabled={true} // Desabilitado temporariamente
          >
            <Paperclip className="h-4 w-4" />
            <span className="sr-only">Anexar arquivo</span>
          </Button>
          <Button 
            type="submit"
            size="icon" 
            className="h-8 w-8 rounded-full"
            disabled={!message.trim() || isSending || disabled}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Enviar mensagem</span>
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Pressione Enter para enviar, Shift+Enter para nova linha
      </p>
    </form>
  );
};

export default ChatInput;
