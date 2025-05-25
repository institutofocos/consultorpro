
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Pause, Square, Send, X } from 'lucide-react';

interface AudioRecordingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendAudio: (audioBlob: Blob) => Promise<void>;
  isRecording: boolean;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

const AudioRecordingModal: React.FC<AudioRecordingModalProps> = ({
  open,
  onOpenChange,
  onSendAudio,
  isRecording,
  onStartRecording,
  onPauseRecording,
  onStopRecording,
  onCancelRecording
}) => {
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    setIsPaused(true);
    onPauseRecording();
  };

  const handleResume = () => {
    setIsPaused(false);
    onStartRecording();
  };

  const handleStop = () => {
    onStopRecording();
    setIsPaused(false);
  };

  const handleCancel = () => {
    onCancelRecording();
    setRecordingTime(0);
    setIsPaused(false);
    setAudioBlob(null);
    onOpenChange(false);
  };

  const handleSend = async () => {
    if (audioBlob) {
      await onSendAudio(audioBlob);
      setRecordingTime(0);
      setIsPaused(false);
      setAudioBlob(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-4 right-4 w-80 max-w-80">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-red-500" />
            Gravação de Áudio
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Tempo de gravação */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-red-600">
              {formatTime(recordingTime)}
            </div>
            <div className="text-sm text-muted-foreground">
              {isRecording && !isPaused && (
                <span className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Gravando...
                </span>
              )}
              {isPaused && <span>Pausado</span>}
              {!isRecording && audioBlob && <span>Gravação finalizada</span>}
            </div>
          </div>

          {/* Controles */}
          <div className="flex justify-center gap-2">
            {isRecording && !isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                className="flex items-center gap-1"
              >
                <Pause className="h-4 w-4" />
                Pausar
              </Button>
            )}

            {isPaused && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                className="flex items-center gap-1"
              >
                <Mic className="h-4 w-4" />
                Continuar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="flex items-center gap-1"
              disabled={!isRecording}
            >
              <Square className="h-4 w-4" />
              Parar
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>

            {audioBlob && (
              <Button
                size="sm"
                onClick={handleSend}
                className="flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudioRecordingModal;
