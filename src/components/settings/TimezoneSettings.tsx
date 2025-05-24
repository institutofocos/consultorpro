
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TimezoneConfig {
  timezone: string;
  name: string;
}

interface DateTimeFormat {
  date_format: string;
  time_format: string;
  full_format: string;
}

const TimezoneSettings: React.FC = () => {
  const [timezoneConfig, setTimezoneConfig] = useState<TimezoneConfig>({
    timezone: 'America/Sao_Paulo',
    name: 'Horário de Brasília'
  });
  const [dateTimeFormat, setDateTimeFormat] = useState<DateTimeFormat>({
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    full_format: 'DD/MM/YYYY HH:mm'
  });
  const [isLoading, setIsLoading] = useState(false);

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Horário de Brasília (UTC-3)' },
    { value: 'America/New_York', label: 'Horário do Leste dos EUA (UTC-5)' },
    { value: 'Europe/London', label: 'Horário de Londres (UTC+0)' },
    { value: 'UTC', label: 'UTC (Tempo Universal Coordenado)' },
    { value: 'America/Los_Angeles', label: 'Horário do Pacífico (UTC-8)' },
    { value: 'Asia/Tokyo', label: 'Horário do Japão (UTC+9)' }
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA (brasileiro)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/AAAA (americano)' },
    { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD (ISO)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-AAAA' }
  ];

  const timeFormats = [
    { value: 'HH:mm', label: '24 horas (HH:mm)' },
    { value: 'HH:mm:ss', label: '24 horas com segundos (HH:mm:ss)' },
    { value: 'hh:mm A', label: '12 horas (hh:mm AM/PM)' }
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['timezone', 'datetime_format']);

      if (error) throw error;

      settings?.forEach(setting => {
        if (setting.setting_key === 'timezone') {
          setTimezoneConfig(setting.setting_value as unknown as TimezoneConfig);
        } else if (setting.setting_key === 'datetime_format') {
          setDateTimeFormat(setting.setting_value as unknown as DateTimeFormat);
        }
      });
    } catch (error) {
      console.error('Error loading timezone settings:', error);
      toast.error("Erro ao carregar configurações de horário");
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsLoading(true);

      // Atualizar configuração de timezone
      const { error: timezoneError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'timezone',
          setting_value: timezoneConfig as any
        });

      if (timezoneError) throw timezoneError;

      // Atualizar configuração de formato de data/hora
      const { error: formatError } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'datetime_format',
          setting_value: dateTimeFormat as any
        });

      if (formatError) throw formatError;

      // Log da alteração
      await supabase.rpc('insert_system_log', {
        p_log_type: 'info',
        p_category: 'settings',
        p_message: 'Configurações de horário atualizadas',
        p_details: { timezone: timezoneConfig, datetime_format: dateTimeFormat } as any
      });

      toast.success("Configurações de horário salvas com sucesso");
    } catch (error) {
      console.error('Error saving timezone settings:', error);
      toast.error("Erro ao salvar configurações de horário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimezoneChange = (value: string) => {
    const selected = timezones.find(tz => tz.value === value);
    if (selected) {
      setTimezoneConfig({
        timezone: value,
        name: selected.label
      });
    }
  };

  const handleDateFormatChange = (value: string) => {
    setDateTimeFormat(prev => ({
      ...prev,
      date_format: value,
      full_format: `${value} ${prev.time_format}`
    }));
  };

  const handleTimeFormatChange = (value: string) => {
    setDateTimeFormat(prev => ({
      ...prev,
      time_format: value,
      full_format: `${prev.date_format} ${value}`
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações de Horário</h1>
        <p className="text-muted-foreground">Configure o fuso horário e formato de data/hora do sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Fuso Horário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuso Horário do Sistema</Label>
            <Select value={timezoneConfig.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o fuso horário" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map(tz => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-format">Formato de Data</Label>
            <Select value={dateTimeFormat.date_format} onValueChange={handleDateFormatChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato de data" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-format">Formato de Hora</Label>
            <Select value={dateTimeFormat.time_format} onValueChange={handleTimeFormatChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato de hora" />
              </SelectTrigger>
              <SelectContent>
                {timeFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm font-medium">Pré-visualização:</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleString('pt-BR', {
                timeZone: timezoneConfig.timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <Button onClick={saveSettings} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimezoneSettings;
