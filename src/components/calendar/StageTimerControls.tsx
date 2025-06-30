
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useStageTimer } from '@/hooks/useStageTimer';

interface StageTimerControlsProps {
  stageId: string;
  stageName: string;
  initialTimeSpent?: number;
  initialStatus?: string;
  onTimeUpdate?: (minutes: number) => void;
}

const StageTimerControls: React.FC<StageTimerControlsProps> = ({
  stageId,
  stageName,
  initialTimeSpent = 0,
  initialStatus = 'stopped',
  onTimeUpdate
}) => {
  const {
    timeSpent,
    timerStatus,
    formatTime,
    startTimer,
    pauseTimer,
    stopTimer
  } = useStageTimer({
    stageId,
    initialTimeSpent,
    initialStatus,
    onTimeUpdate
  });

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
        return 'Em execução';
      case 'paused':
        return 'Pausado';
      default:
        return 'Parado';
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Controle de Tempo</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl font-mono font-bold text-gray-900">
          {formatTime(timeSpent)}
        </div>
        <div className="text-sm text-gray-500">
          Tempo total gasto
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={startTimer}
          disabled={timerStatus === 'running'}
          variant={timerStatus === 'running' ? 'secondary' : 'default'}
          size="sm"
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          Produzir
        </Button>
        
        <Button
          onClick={pauseTimer}
          disabled={timerStatus !== 'running'}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          <Pause className="h-4 w-4 mr-2" />
          Pausar
        </Button>
        
        <Button
          onClick={stopTimer}
          disabled={timerStatus === 'stopped'}
          variant="destructive"
          size="sm"
          className="flex-1"
        >
          <Square className="h-4 w-4 mr-2" />
          Parar
        </Button>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Etapa: {stageName}
      </div>
    </div>
  );
};

export default StageTimerControls;
