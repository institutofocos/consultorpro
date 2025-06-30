import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Clock, History, AlertTriangle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import TimeTrackingHistory from './TimeTrackingHistory';

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
  const [displaySeconds, setDisplaySeconds] = useState((initialTimeSpent || 0) * 60);
  const [timerStartedAt, setTimerStartedAt] = useState<Date | null>(
    initialTimerStartedAt ? new Date(initialTimerStartedAt) : null
  );
  const [showHistory, setShowHistory] = useState(false);
  const [stageName, setStageName] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(0);

  // Buscar dados da etapa e tempo atualizado do banco
  useEffect(() => {
    const fetchStageData = async () => {
      try {
        const { data: stageData, error } = await supabase
          .from('project_stages')
          .select('name, time_spent_minutes, timer_status, timer_started_at, hours')
          .eq('id', taskId)
          .single();

        if (error) {
          console.error('Erro ao buscar dados da etapa:', error);
          return;
        }

        if (stageData) {
          console.log('Dados da etapa atualizados:', stageData);
          setStageName(stageData.name);
          setEstimatedHours(stageData.hours || 0);
          
          // Atualizar tempo do banco (que já é calculado automaticamente pelo trigger)
          const dbTimeSpent = stageData.time_spent_minutes || 0;
          setTimeSpent(dbTimeSpent);
          setDisplaySeconds(dbTimeSpent * 60);
          
          // Atualizar status do timer
          setTimerStatus(stageData.timer_status || 'stopped');
          
          // Atualizar timer started at
          if (stageData.timer_started_at) {
            setTimerStartedAt(new Date(stageData.timer_started_at));
          } else {
            setTimerStartedAt(null);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados da etapa:', error);
      }
    };

    fetchStageData();
  }, [taskId]);

  // Timer effect que atualiza a cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerStatus === 'running' && timerStartedAt) {
      console.log('=== TIMER INICIADO - ATUALIZANDO A CADA SEGUNDO ===');
      console.log('Hora de início:', timerStartedAt.toLocaleString());
      console.log('Tempo base acumulado:', timeSpent, 'minutos');
      
      // Atualizar imediatamente
      const now = new Date();
      const elapsedMs = now.getTime() - timerStartedAt.getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const newDisplaySeconds = (timeSpent * 60) + elapsedSeconds;
      setDisplaySeconds(newDisplaySeconds);
      
      // Configurar interval para atualizar a cada segundo
      interval = setInterval(() => {
        const currentTime = new Date();
        const totalElapsedMs = currentTime.getTime() - timerStartedAt.getTime();
        const totalElapsedSeconds = Math.floor(totalElapsedMs / 1000);
        const currentDisplaySeconds = (timeSpent * 60) + totalElapsedSeconds;
        
        console.log('⏱️  Tick do timer:', {
          horaAtual: currentTime.toLocaleString(),
          tempoDecorrido: totalElapsedSeconds + ' segundos',
          tempoBase: timeSpent + ' min',
          tempoDisplay: formatTime(currentDisplaySeconds),
        });
        
        setDisplaySeconds(currentDisplaySeconds);
      }, 1000); // Atualiza a cada 1 segundo
      
    } else {
      console.log('Timer parado/pausado - display fixo em:', timeSpent);
      setDisplaySeconds(timeSpent * 60);
    }

    return () => {
      if (interval) {
        console.log('🛑 Limpando interval do timer');
        clearInterval(interval);
      }
    };
  }, [timerStatus, timerStartedAt, timeSpent]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const refreshTimeFromDatabase = async () => {
    try {
      const { data: stageData, error } = await supabase
        .from('project_stages')
        .select('time_spent_minutes')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Erro ao buscar tempo atualizado:', error);
        return;
      }

      if (stageData) {
        const dbTimeSpent = stageData.time_spent_minutes || 0;
        console.log('Tempo atualizado do banco:', dbTimeSpent);
        setTimeSpent(dbTimeSpent);
        setDisplaySeconds(dbTimeSpent * 60);
        onTimeUpdate?.(dbTimeSpent);
      }
    } catch (error) {
      console.error('Erro ao atualizar tempo do banco:', error);
    }
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
      
      console.log('✅ Estados locais atualizados - timer deve começar a contar');
      
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

      console.log('=== PAUSANDO TIMER ===');
      console.log('Duração da sessão (minutos):', sessionDuration);

      // Update work session - O trigger irá atualizar automaticamente o time_spent_minutes
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

      // Update stage timer status
      const { error: updateError } = await supabase
        .from('project_stages')
        .update({
          timer_status: 'paused',
          timer_started_at: null
        })
        .eq('id', taskId);

      if (updateError) {
        console.error('Erro ao atualizar status da etapa:', updateError);
        throw updateError;
      }

      // Update local state
      setTimerStatus('paused');
      setCurrentSessionId(null);
      setTimerStartedAt(null);
      
      // Aguardar um momento e buscar o tempo atualizado do banco
      setTimeout(() => {
        refreshTimeFromDatabase();
      }, 500);
      
      console.log('Timer pausado com sucesso');
      toast.success('Timer pausado! Tempo salvo automaticamente.');
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

  // Calcular se o tempo excedeu o estimado
  const totalMinutesSpent = Math.floor(displaySeconds / 60);
  const estimatedMinutes = estimatedHours * 60;
  const isTimeExceeded = totalMinutesSpent > estimatedMinutes;
  const timeExceededBy = isTimeExceeded ? totalMinutesSpent - estimatedMinutes : 0;

  console.log('🔄 TimerControls render:', {
    taskId,
    timeSpent,
    displaySeconds,
    timerStatus,
    timerStartedAt: timerStartedAt?.toLocaleString(),
    currentSessionId,
    formattedTime: formatTime(displaySeconds),
    estimatedHours,
    estimatedMinutes,
    totalMinutesSpent,
    isTimeExceeded
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
              {formatTime(displaySeconds)}
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

        <Button
          onClick={() => setShowHistory(true)}
          size="default"
          variant="outline"
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium px-4 py-2"
        >
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>

      {/* Campo para horas estimadas vs executadas */}
      <div className="bg-white rounded-lg p-4 border-2 border-blue-200 mb-3">
        <div className="space-y-3">
          {/* Tempo estimado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-gray-800">Tempo Estimado:</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-blue-600">
                {formatTime(estimatedMinutes * 60)}
              </div>
              <div className="text-xs text-gray-500">
                {estimatedHours} {estimatedHours === 1 ? 'hora' : 'horas'} estimadas
              </div>
            </div>
          </div>
          
          {/* Line separator */}
          <div className="border-t border-gray-200"></div>
          
          {/* Tempo total acumulado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-gray-800">Tempo Total Acumulado:</span>
              {isTimeExceeded && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-mono font-bold ${isTimeExceeded ? 'text-red-600' : 'text-green-600'}`}>
                {formatTime(timeSpent * 60)}
              </div>
              <div className={`text-xs ${isTimeExceeded ? 'text-red-500' : 'text-gray-500'}`}>
                {timeSpent} minutos trabalhados
                {isTimeExceeded && (
                  <div className="font-medium">
                    Excedeu em {Math.floor(timeExceededBy / 60)}h {timeExceededBy % 60}min
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Indicador visual de progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isTimeExceeded ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((totalMinutesSpent / estimatedMinutes) * 100, 100)}%` 
              }}
            ></div>
          </div>
          
          {/* Percentual de conclusão */}
          <div className="text-center">
            <span className={`text-sm font-medium ${isTimeExceeded ? 'text-red-600' : 'text-gray-600'}`}>
              {estimatedMinutes > 0 ? Math.round((totalMinutesSpent / estimatedMinutes) * 100) : 0}% do tempo estimado
              {isTimeExceeded && ' (EXCEDIDO)'}
            </span>
          </div>
        </div>
      </div>

      {/* Informação adicional sobre sessão atual */}
      {timerStatus === 'running' && timerStartedAt && (
        <div className="text-sm text-gray-600 bg-green-50 rounded p-2 border border-green-200">
          <span className="font-medium">Sessão atual iniciada às: </span>
          <span className="font-mono">{timerStartedAt.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Modal de histórico */}
      <TimeTrackingHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        stageId={taskId}
        stageName={stageName}
      />
    </div>
  );
};

export default TimerControls;
