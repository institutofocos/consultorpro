
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Filter, FileText } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FinancialHistoryFiltersProps {
  startDate?: Date;
  endDate?: Date;
  status: string;
  consultant: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStatusChange: (status: string) => void;
  onConsultantChange: (consultant: string) => void;
  onGeneratePDF: () => void;
  consultants: Array<{ id: string; name: string; }>;
}

const FinancialHistoryFilters: React.FC<FinancialHistoryFiltersProps> = ({
  startDate,
  endDate,
  status,
  consultant,
  onStartDateChange,
  onEndDateChange,
  onStatusChange,
  onConsultantChange,
  onGeneratePDF,
  consultants = []
}) => {
  return (
    <div className="w-80 min-w-80 border-r bg-muted/20">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro por Período */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Período</h4>
            
            <div className="space-y-2">
              <label className="text-sm">Data inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={onStartDateChange}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm">Data final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={onEndDateChange}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro por Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="received">Recebido</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Consultor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Consultor</label>
            <Select value={consultant} onValueChange={onConsultantChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os consultores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os consultores</SelectItem>
                {consultants.map((cons) => (
                  <SelectItem key={cons.id} value={cons.id}>
                    {cons.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão Gerar PDF */}
          <div className="pt-4 border-t">
            <Button 
              onClick={onGeneratePDF}
              className="w-full"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>

          {/* Limpar Filtros */}
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={() => {
              onStartDateChange(undefined);
              onEndDateChange(undefined);
              onStatusChange('all');
              onConsultantChange('all');
            }}
          >
            Limpar filtros
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialHistoryFilters;
