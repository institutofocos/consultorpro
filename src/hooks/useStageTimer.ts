
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseStageTimerProps {
  stageId: string;
  initialTimeSpent?: number;
  initialStatus?: string;
  onTimeUpdate?: (minutes: number) => void;
}

export const useStageTimer = ({
  stageId,
  initialTimeSpent = 0,
  initialStatus = 'stopped',
  onTimeUpdate
}: UseStageTimerProps) => {
  const [timeSpent, setTimeSpent] = useState(initialTimeSpent);
  const [timerStatus, setTimerStatus] = useState(initialStatus);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (timerStatus === 'running' && sessionStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const sessionMinutes = Math.floor((now.getTime() - sessionStartTime.getTime()) / 60000);
        const totalMinutes = initialTimeSpent + sessionMinutes;
        setTimeSpent(totalMinutes);
        onTimeUpdate?.(totalMinutes);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timerStatus, sessionStartTime, initialTimeSpent, onTimeUpdate]);

  const startTimer = useCallback(async () => {
    try {
      const now = new Date();
      setSessionStartTime(now);
      setTimerStatus('running');

      // Create new work session
      const { data, error } = await supabase
        .from('stage_work_sessions')
        .insert({
          stage_id: stageId,
          start_time: now.toISOString(),
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      
      setCurrentSessionId(data.id);

      // Update stage timer status
      await supabase
        .from('project_stages')
        .update({
          timer_status: 'running',
          timer_started_at: now.toISOString()
        })
        .eq('id', stageId);

      toast.success('Timer iniciado!');
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Erro ao iniciar timer');
    }
  }, [stageId]);

  const pauseTimer = useCallback(async () => {
    try {
      if (!sessionStartTime || !currentSessionId) return;

      const now = new Date();
      const sessionMinutes = Math.floor((now.getTime() - sessionStartTime.getTime()) / 60000);
      const newTotalMinutes = initialTimeSpent + sessionMinutes;

      setTimerStatus('paused');
      setTimeSpent(newTotalMinutes);

      // Update work session
      await supabase
        .from('stage_work_sessions')
        .update({
          status: 'paused',
          duration_minutes: sessionMinutes,
          updated_at: now.toISOString()
        })
        .eq('id', currentSessionId);

      // Update stage
      await supabase
        .from('project_stages')
        .update({
          timer_status: 'paused',
          time_spent_minutes: newTotalMinutes,
          last_pause_duration: sessionMinutes
        })
        .eq('id', stageId);

      onTimeUpdate?.(newTotalMinutes);
      toast.success('Timer pausado!');
    } catch (error) {
      console.error('Error pausing timer:', error);
      toast.error('Erro ao pausar timer');
    }
  }, [stageId, sessionStartTime, currentSessionId, initialTimeSpent, onTimeUpdate]);

  const stopTimer = useCallback(async () => {
    try {
      if (!sessionStartTime || !currentSessionId) return;

      const now = new Date();
      const sessionMinutes = Math.floor((now.getTime() - sessionStartTime.getTime()) / 60000);
      const newTotalMinutes = initialTimeSpent + sessionMinutes;

      setTimerStatus('stopped');
      setTimeSpent(newTotalMinutes);
      setSessionStartTime(null);

      // Complete work session
      await supabase
        .from('stage_work_sessions')
        .update({
          end_time: now.toISOString(),
          status: 'completed',
          duration_minutes: sessionMinutes,
          updated_at: now.toISOString()
        })
        .eq('id', currentSessionId);

      // Update stage
      await supabase
        .from('project_stages')
        .update({
          timer_status: 'stopped',
          time_spent_minutes: newTotalMinutes,
          timer_started_at: null
        })
        .eq('id', stageId);

      setCurrentSessionId(null);
      onTimeUpdate?.(newTotalMinutes);
      toast.success('Timer parado!');
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Erro ao parar timer');
    }
  }, [stageId, sessionStartTime, currentSessionId, initialTimeSpent, onTimeUpdate]);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeSpent,
    timerStatus,
    formatTime,
    startTimer,
    pauseTimer,
    stopTimer
  };
};
