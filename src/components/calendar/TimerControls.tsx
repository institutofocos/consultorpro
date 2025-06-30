
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TimerControlsProps {
  taskId: string;
  initialTimeSpent: number;
  initialTimerStatus: string;
  initialTimerStartedAt?: string;
  onTimeUpdate?: (timeSpent: number) => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  taskId,
  initialTimeSpent,
  initialTimerStatus,
  initialTimerStartedAt,
  onTimeUpdate
}) => {
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent || 0);
  const [timerStatus, setTimerStatus] = useState(initialTimerStatus || 'stopped');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [displayTime, setDisplayTime] = useState(initialTimeSpent || 0);
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(
    initialTimerStartedAt ? new Date(initialTimerStartedAt) : null
  );

  // Simplified timer effect - updates every second when running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerStatus === 'running' && timerStartedAt) {
      console.log('Timer iniciado - atualizando a cada segundo');
      
      interval = setInterval(() => {
        const now = new Date();
        const elapsedMs = now.getTime() - timerStartedAt.getTime();
        const elapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
        const newDisplayTime = timeSpent + elapsedMinutes;
        
        console.log('Atualizando display:', {
          timeSpent,
          elapsedMinutes,
          newDisplayTime,
          formatted: formatTime(newDisplayTime)
        });
        
        setDisplayTime(newDisplayTime);
      }, 1000);
    } else {
      // When not running, display time equals stored time
      setDisplayTime(timeSpent);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerStatus, timerStartedAt, timeSpent]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const now = new Date();
      const nowISO = now.toISOString();
      console.log('=== INICIANDO TIMER ===');
      console.log('Hora atual:', now.toLocaleString());
      console.log('Tempo acumulado atual:', timeSpent);
      
      // Create new work session
      const { data: sessionData, error: sessionError } = await supabase
        .from('stage_work_sessions')
        .insert({
          stage_id: taskId,
          start_time: nowISO,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Erro ao criar sessão:', sessionError);
        throw sessionError;
      }

      console.log('Sessão criada:', sessionData);

      // Update stage timer status
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'running',
          timer_started_at: nowISO
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Erro ao atualizar status da etapa:', updateError);
        throw updateError;
      }

      console.log('Status da etapa atualizado para running');

      // Update local state
      setCurrentSessionId(sessionData.id);
      setTimerStatus('running');
      setTimerStartedAt(now);
      
      console.log('Estados locais atualizados - timer deve começar a contar');
      
      toast.success('Timer iniciado!');
    } catch (error) {
      console.error('Erro ao iniciar timer:', error);
      toast.error('Erro ao iniciar timer');
    }
  };

  const pauseTimer = async () => {
    try {
      if (!currentSessionId || !timerStartedAt) {
        console.log('Não é possível pausar - faltam dados:', { currentSessionId, timerStartedAt });
        return;
      }

      const now = new Date();
      const nowISO = now.toISOString();
      const elapsedMs = now.getTime() - timerStartedAt.getTime();
      const sessionDuration = Math.floor(elapsedMs / (1000 * 60));
      const newTotalTime = timeSpent + sessionDuration;

      console.log('=== PAUSANDO TIMER ===');
      console.log('Duração da sessão (minutos):', sessionDuration);
      console.log('Tempo anterior:', timeSpent);
      console.log('Novo tempo total:', newTotalTime);

      // Update work session
      const { error: sessionError } = await supabase
        .from('stage_work_sessions')
        .update({
          end_time: nowISO,
          duration_minutes: sessionDuration,
          status: 'completed'
        })
        .eq('id', currentSessionId);

      if (sessionError) {
        console.error('Erro ao finalizar sessão:', sessionError);
        throw sessionError;
      }

      // Update stage with accumulated time
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'paused',
          timer_started_at: null,
          time_spent_minutes: newTotalTime
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Erro ao atualizar tempo da etapa:', updateError);
        throw updateError;
      }

      console.log('Tempo salvo no banco:', newTotalTime);

      // Update local state
      setTimeSpent(newTotalTime);
      setDisplayTime(newTotalTime);
      setTimerStatus('paused');
      setCurrentSessionId(null);
      setTimerStartedAt(null);
      
      // Notify parent component
      onTimeUpdate?.(newTotalTime);
      
      console.log('Timer pausado com sucesso. Novo tempo total:', newTotalTime);
      toast.success('Timer pausado!');
    } catch (error) {
      console.error('Erro ao pausar timer:', error);
      toast.error('Erro ao pausar timer');
    }
  };

  const stopTimer = async () => {
    try {
      console.log('=== PARANDO TIMER ===');
      
      // If timer is running, pause first to save current session
      if (timerStatus === 'running' && currentSessionId) {
        console.log('Timer estava rodando, pausando primeiro...');
        await pauseTimer();
      }

      // Reset timer status to stopped
      const { error } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'stopped',
          timer_started_at: null
        })
        .eq('id', taskId);

      if (error) {
        console.error('Erro ao parar timer:', error);
        throw error;
      }

      setTimerStatus('stopped');
      setCurrentSessionId(null);
      setTimerStartedAt(null);
      
      console.log('Timer parado completamente');
      toast.success('Timer parado!');
    } catch (error) {
      console.error('Erro ao parar timer:', error);
      toast.error('Erro ao parar timer');
    }
  };

  const getStatusColor = () => {
    switch (timerStatus) {
      case 'running':
        return 'text-green-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = () => {
    switch (timerStatus) {
      case 'running':
        return 'Em andamento';
      case 'paused':
        return 'Pausado';
      default:
        return 'Parado';
    }
  };

  console.log('TimerControls render:', {
    taskId,
    timeSpent,
    displayTime,
    timerStatus,
    timerStartedAt: timerStartedAt?.toLocaleString(),
    currentSessionId,
    formattedTime: formatTime(displayTime)
  });

  return (
    <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Controle de Tempo
        </h4>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-3xl font-mono font-bold ${getStatusColor()}`}>
              {formatTime(displayTime)}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor()} bg-white border`}>
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-3">
        {timerStatus === 'stopped' || timerStatus === 'paused' ? (
          <Button
            onClick={startTimer}
            size="default"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2"
          >
            <Play className="h-4 w-4" />
            {timerStatus === 'paused' ? 'Retomar' : 'Produzir'}
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            size="default"
            variant="outline"
            className="flex items-center gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-medium px-4 py-2"
          >
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}
        
        <Button
          onClick={stopTimer}
          size="default"
          variant="outline"
          className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50 font-medium px-4 py-2"
          disabled={timerStatus === 'stopped'}
        >
          <Square className="h-4 w-4" />
          Parar
        </Button>
      </div>

      {timeSpent > 0 && (
        <div className="text-sm text-gray-600 bg-white rounded p-2 border">
          <span className="font-medium">Tempo total acumulado: </span>
          <span className="font-mono font-bold text-blue-600">{formatTime(timeSpent)}</span>
        </div>
      )}
    </div>
  );
};

export default TimerControls;
