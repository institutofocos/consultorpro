
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";
import { getCurrentDateTimeBR } from "@/utils/dateUtils";

const TimezoneSettings: React.FC = () => {
  const getCurrentTime = () => {
    try {
      // Use the Brazilian formatting utility
      return getCurrentDateTimeBR();
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: '', time: '' };
    }
  };

  const currentDateTime = getCurrentTime();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Horário</h1>
        <p className="text-muted-foreground">Visualize as configurações de horário do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fuso Horário do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Fuso Horário Configurado</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Horário de Brasília (America/Sao_Paulo)</p>
              <p className="text-xs text-muted-foreground">UTC-3 (Horário Padrão de Brasília)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Formato de Data e Hora</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">DD/MM/AAAA HH:mm (Formato Brasileiro)</p>
              <p className="text-xs text-muted-foreground">Formato de 24 horas</p>
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <Label className="text-sm font-medium">Horário Atual do Sistema:</Label>
            <p className="text-lg font-mono mt-1">
              {currentDateTime.date} {currentDateTime.time}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Atualizado automaticamente com o fuso horário de Brasília
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Informações do Sistema</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• O sistema utiliza automaticamente o horário de Brasília</p>
              <p>• Todos os registros são salvos com o fuso horário correto</p>
              <p>• O horário é ajustado automaticamente para horário de verão</p>
              <p>• Webhooks e relatórios usam este fuso horário</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimezoneSettings;
