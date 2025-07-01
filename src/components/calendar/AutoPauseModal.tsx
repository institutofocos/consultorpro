
import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Clock, AlertTriangle } from 'lucide-react';

interface AutoPauseModalProps {
  isOpen: boolean;
  onResume: () => void;
  onStop: () => void;
}

const AutoPauseModal: React.FC<AutoPauseModalProps> = ({
  isOpen,
  onResume,
  onStop
}) => {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Pausa Automática Ativada
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Clock className="h-5 w-5" />
              Você ainda está trabalhando?
            </div>
            <p className="text-sm text-gray-600">
              O timer foi pausado automaticamente após 4 horas de atividade contínua para evitar registros incorretos de tempo.
            </p>
            <p className="text-sm text-gray-600">
              Escolha uma opção para continuar:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
          <AlertDialogAction 
            onClick={onResume}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Sim, continuar trabalhando
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={onStop}
            className="bg-red-500 hover:bg-red-600 text-white border-red-500"
          >
            Não, finalizar timer
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AutoPauseModal;
