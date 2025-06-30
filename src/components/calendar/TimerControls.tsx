
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
  const [displayTime, setDisplayTime] = useState(timeSpent);

  // Update display time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerStatus === 'running' && initialTimerStartedAt) {
      interval = setInterval(() => {
        const startTime = new Date(initialTimerStartedAt).getTime();
        const currentTime = new Date().getTime();
        const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));
        setDisplayTime(timeSpent + elapsedMinutes);
      }, 1000);
    } else {
      setDisplayTime(timeSpent);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerStatus, initialTimerStartedAt, timeSpent]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const startTimer = async () => {
    try {
      const now = new Date().toISOString();
      
      // Create new work session
      const { data: sessionData, error: sessionError } = await supabase
        .from('stage_work_sessions')
        .insert({
          stage_id: taskId,
          start_time: now,
          status: 'active'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update stage timer status
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'running',
          timer_started_at: now
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      setCurrentSessionId(sessionData.id);
      setTimerStatus('running');
      toast.success('Timer iniciado!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Erro ao iniciar timer');
    }
  };

  const pauseTimer = async () => {
    try {
      if (!currentSessionId) return;

      const now = new Date().toISOString();
      const startTime = new Date(initialTimerStartedAt!).getTime();
      const currentTime = new Date().getTime();
      const sessionDuration = Math.floor((currentTime - startTime) / (1000 * 60));
      const newTotalTime = timeSpent + sessionDuration;

      // Update work session
      const { error: sessionError } = await supabase
        .from('stage_work_sessions')
        .update({
          end_time: now,
          duration_minutes: sessionDuration,
          status: 'completed'
        })
        .eq('id', currentSessionId);

      if (sessionError) throw sessionError;

      // Update stage with accumulated time
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'paused',
          timer_started_at: null,
          time_spent_minutes: newTotalTime
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      setTimeSpent(newTotalTime);
      setTimerStatus('paused');
      setCurrentSessionId(null);
      onTimeUpdate?.(newTotalTime);
      toast.success('Timer pausado!');
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Erro ao pausar timer');
    }
  };

  const stopTimer = async () => {
    try {
      if (timerStatus === 'running' && currentSessionId) {
        // First pause to save current session
        await pauseTimer();
      }

      // Reset timer status
      const { error } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'stopped',
          timer_started_at: null
        })
        .eq('id', taskId);

      if (error) throw error;

      setTimerStatus('stopped');
      setCurrentSessionId(null);
      toast.success('Timer parado!');
    } catch (error) {
      console.error('Error stopping timer:', error);
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

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-700 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Controle de Tempo
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono ${getStatusColor()}`}>
            {formatTime(displayTime)}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${getStatusColor()} bg-white`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        {timerStatus === 'stopped' || timerStatus === 'paused' ? (
          <Button
            onClick={startTimer}
            size="sm"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4" />
            {timerStatus === 'paused' ? 'Retomar' : 'Produzir'}
          </Button>
        ) : (
          <Button
            onClick={pauseTimer}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
          >
            <Pause className="h-4 w-4" />
            Pausar
          </Button>
        )}
        
        <Button
          onClick={stopTimer}
          size="sm"
          variant="outline"
          className="flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
          disabled={timerStatus === 'stopped'}
        >
          <Square className="h-4 w-4" />
          Parar
        </Button>
      </div>

      {timeSpent > 0 && (
        <div className="text-sm text-gray-600">
          <span>Tempo total acumulado: </span>
          <span className="font-mono font-medium">{formatTime(timeSpent)}</span>
        </div>
      )}
    </div>
  );
};

export default TimerControls;
