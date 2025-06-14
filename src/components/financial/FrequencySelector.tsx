
import React from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export type FrequencyType = 'unique' | 'recurring' | 'installment';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface FrequencySelectorProps {
  frequencyType: FrequencyType;
  onFrequencyTypeChange: (type: FrequencyType) => void;
  recurringInterval?: RecurringInterval;
  onRecurringIntervalChange: (interval: RecurringInterval) => void;
  installments?: number;
  onInstallmentsChange: (installments: number) => void;
  recurringTimes?: number;
  onRecurringTimesChange: (times: number) => void;
  amount: number;
}

const FrequencySelector: React.FC<FrequencySelectorProps> = ({
  frequencyType,
  onFrequencyTypeChange,
  recurringInterval = 'monthly',
  onRecurringIntervalChange,
  installments = 2,
  onInstallmentsChange,
  recurringTimes = 12,
  onRecurringTimesChange,
  amount
}) => {
  const getFrequencyDisplay = () => {
    // Ensure amount is a valid number and default to 0 if not
    const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    
    if (frequencyType === 'unique') return 'Lançamento único';
    
    if (frequencyType === 'installment') {
      const installmentValue = validAmount / installments;
      const totalValue = validAmount * installments;
      return `${installments}x de R$ ${installmentValue.toFixed(2)} = R$ ${totalValue.toFixed(2)}`;
    }
    
    if (frequencyType === 'recurring') {
      const intervalText = {
        daily: 'dia',
        weekly: 'semana', 
        monthly: 'mês',
        yearly: 'ano'
      }[recurringInterval];
      
      const totalValue = validAmount * recurringTimes;
      return `${recurringTimes}x de R$ ${validAmount.toFixed(2)} | Todo ${intervalText} = R$ ${totalValue.toFixed(2)}`;
    }
    
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <RadioGroup 
          value={frequencyType} 
          onValueChange={(value: FrequencyType) => onFrequencyTypeChange(value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="unique" id="unique" />
            <Label htmlFor="unique" className="text-sm font-normal">Único</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="recurring" id="recurring" />
            <Label htmlFor="recurring" className="text-sm font-normal">Repetir</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="installment" id="installment" />
            <Label htmlFor="installment" className="text-sm font-normal">Parcelamento</Label>
          </div>
        </RadioGroup>
      </div>
      
      {frequencyType === 'recurring' && (
        <div className="space-y-3 pl-6 border-l-2 border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Repetir a cada</Label>
              <Select value={recurringInterval} onValueChange={onRecurringIntervalChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">📅 Diariamente</SelectItem>
                  <SelectItem value="weekly">📊 Semanalmente</SelectItem>
                  <SelectItem value="monthly">🗓️ Mensalmente</SelectItem>
                  <SelectItem value="yearly">📆 Anualmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs text-gray-600">Quantas vezes</Label>
              <Input
                type="number"
                min="2"
                max="360"
                value={recurringTimes}
                onChange={(e) => onRecurringTimesChange(parseInt(e.target.value) || 2)}
                className="h-9"
              />
            </div>
          </div>
        </div>
      )}
      
      {frequencyType === 'installment' && (
        <div className="space-y-3 pl-6 border-l-2 border-gray-200">
          <div>
            <Label className="text-xs text-gray-600">Número de parcelas</Label>
            <Select 
              value={installments.toString()} 
              onValueChange={(value) => onInstallmentsChange(parseInt(value))}
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 24 }, (_, i) => i + 2).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num}x
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      
      {/* Resumo da frequência */}
      {frequencyType !== 'unique' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-900 font-medium">📊 Resumo</div>
          <div className="text-sm text-blue-700 mt-1">{getFrequencyDisplay()}</div>
        </div>
      )}
    </div>
  );
};

export default FrequencySelector;
