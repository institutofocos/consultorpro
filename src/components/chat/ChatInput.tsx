
import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, Smile, Calendar, Mic, MicOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmojiPicker from './EmojiPicker';
import ScheduleMessageModal from './ScheduleMessageModal';
import ScheduledMessagesTab from './ScheduledMessagesTab';
import AudioRecordingModal from './AudioRecordingModal';

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
  roomId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false, roomId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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

  const handleFileAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: Implementar upload de arquivos
      toast({
        title: "Funcionalidade em desenvolvimento",
        description: "Upload de arquivos será implementado em breve."
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiPickerOpen(false);
    
    // Foco no textarea após inserir emoji
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Parar todas as streams
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setShowAudioModal(true);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível acessar o microfone."
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.resume();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      audioChunksRef.current = [];
    }
    setShowAudioModal(false);
  };

  const handleSendAudio = async (audioBlob: Blob) => {
    // TODO: Implementar envio de áudio
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Envio de áudio será implementado em breve."
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Selecione uma sala para enviar mensagens..." : "Digite sua mensagem..."}
            className="min-h-12 pr-32 resize-none"
            rows={1}
            disabled={disabled || isSending}
          />
          
          <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
            {/* Botão de anexo */}
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 rounded-full"
              onClick={handleFileAttachment}
              disabled={disabled}
            >
              <Paperclip className="h-4 w-4" />
              <span className="sr-only">Anexar arquivo</span>
            </Button>
            
            {/* Picker de emoji */}
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full"
                  disabled={disabled}
                >
                  <Smile className="h-4 w-4" />
                  <span className="sr-only">Adicionar emoji</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
            
            {/* Botão de agendamento */}
            <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full"
                  disabled={disabled || !roomId}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="sr-only">Agendar mensagem</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4">
                <Tabs defaultValue="new" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">Nova Mensagem</TabsTrigger>
                    <TabsTrigger value="list">Agendadas</TabsTrigger>
                  </TabsList>
                  <TabsContent value="new" className="mt-4">
                    <Button 
                      onClick={() => {
                        setShowScheduleModal(true);
                        setSchedulePopoverOpen(false);
                      }}
                      className="w-full"
                    >
                      Agendar Nova Mensagem
                    </Button>
                  </TabsContent>
                  <TabsContent value="list" className="mt-4">
                    {roomId && <ScheduledMessagesTab roomId={roomId} />}
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
            
            {/* Botão de gravação de áudio */}
            <Button 
              type="button" 
              size="icon" 
              variant="ghost" 
              className={`h-8 w-8 rounded-full ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
              onClick={startRecording}
              disabled={disabled || isRecording}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              <span className="sr-only">
                {isRecording ? 'Gravando áudio' : 'Gravar áudio'}
              </span>
            </Button>
            
            {/* Botão de enviar */}
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
          Pressione Enter para enviar, Shift+Enter para nova linha.
        </p>
        
        {/* Input oculto para arquivos */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </form>

      {/* Modal de gravação de áudio */}
      <AudioRecordingModal
        open={showAudioModal}
        onOpenChange={setShowAudioModal}
        onSendAudio={handleSendAudio}
        isRecording={isRecording}
        onStartRecording={resumeRecording}
        onPauseRecording={pauseRecording}
        onStopRecording={stopRecording}
        onCancelRecording={cancelRecording}
      />

      {/* Modal de agendamento */}
      {roomId && (
        <ScheduleMessageModal
          open={showScheduleModal}
          onOpenChange={setShowScheduleModal}
          roomId={roomId}
        />
      )}
    </>
  );
};

export default ChatInput;
