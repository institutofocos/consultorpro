
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Play, Square } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";

interface WorkSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  status: string;
  created_at: string;
}

interface TimeTrackingHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  stageId: string;
  stageName: string;
}

const TimeTrackingHistory: React.FC<TimeTrackingHistoryProps> = ({
  isOpen,
  onClose,
  stageId,
  stageName
}) => {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    if (isOpen && stageId) {
      fetchSessions();
    }
  }, [isOpen, stageId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      console.log('Buscando histórico de sessões para stage:', stageId);

      const { data: sessionsData, error } = await supabase
        .from('stage_work_sessions')
        .select('*')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar sessões:', error);
        throw error;
      }

      console.log('Sessões encontradas:', sessionsData);
      setSessions(sessionsData || []);

      // Calcular tempo total
      const total = (sessionsData || [])
        .filter(session => session.status === 'completed' && session.duration_minutes > 0)
        .reduce((sum, session) => sum + session.duration_minutes, 0);
      
      setTotalTime(total);
      console.log('Tempo total calculado:', total, 'minutos');

    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast.error('Erro ao carregar histórico de tempo');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 text-white"><Play className="h-3 w-3 mr-1" />Ativa</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500 text-white"><Square className="h-3 w-3 mr-1" />Concluída</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Tempo - {stageName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo do tempo total */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Tempo Total Registrado:</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-blue-600">
                  {formatTime(totalTime)}
                </div>
                <div className="text-sm text-blue-600">
                  {totalTime} minutos • {sessions.length} sessões
                </div>
              </div>
            </div>
          </div>

          {/* Lista de sessões */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Sessões de Trabalho:</h4>
            
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Carregando histórico...</p>
              </div>
            ) : sessions.length > 0 ? (
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {formatDateTime(session.start_time)}
                          </span>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Início:</span><br />
                          {formatDateTime(session.start_time)}
                        </div>
                        <div>
                          <span className="font-medium">Fim:</span><br />
                          {session.end_time ? formatDateTime(session.end_time) : 'Em andamento'}
                        </div>
                      </div>
                      
                      {session.status === 'completed' && session.duration_minutes > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Duração:</span>
                            <span className="font-mono font-bold text-green-600">
                              {formatTime(session.duration_minutes)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Nenhuma sessão de trabalho registrada ainda</p>
              </div>
            )}
          </div>

          {/* Botão de fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeTrackingHistory;
