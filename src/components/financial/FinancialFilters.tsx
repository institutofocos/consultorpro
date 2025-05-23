
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Filter, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Consultant {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface FinancialFiltersProps {
  consultants: Consultant[];
  services: Service[];
  filters: {
    startDate?: Date;
    endDate?: Date;
    consultantId?: string;
    serviceId?: string;
  };
  isLoading: {
    consultants: boolean;
    services: boolean;
  };
  onFilterChange: (filters: any) => void;
  onFilterReset: () => void;
}

const FinancialFilters: React.FC<FinancialFiltersProps> = ({ 
  consultants, 
  services, 
  filters,
  isLoading, 
  onFilterChange, 
  onFilterReset
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-5 w-5 mr-2" /> Filtros
        </CardTitle>
        <CardDescription>Filtre os dados financeiros</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Período</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !filters.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "dd/MM/yyyy") : <span>Data Inicial</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => onFilterChange({ startDate: date })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !filters.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : <span>Data Final</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => onFilterChange({ endDate: date })}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Consultor</label>
            <Select
              value={filters.consultantId || ''}
              onValueChange={(value) => onFilterChange({ consultantId: value || undefined })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os consultores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os consultores</SelectItem>
                {!isLoading.consultants && consultants?.map((consultant: Consultant) => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Serviço</label>
            <Select
              value={filters.serviceId || ''}
              onValueChange={(value) => onFilterChange({ serviceId: value || undefined })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os serviços" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os serviços</SelectItem>
                {!isLoading.services && services?.map((service: Service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-auto flex items-end">
            <Button
              variant="outline"
              onClick={onFilterReset}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialFilters;
