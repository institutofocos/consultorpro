
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter } from "lucide-react";

const TIME_FILTERS = {
  TODAY: 'today',
  THIS_WEEK: 'thisWeek',
  THIS_MONTH: 'thisMonth',
  ALL: 'all'
};

interface FilterSectionProps {
  timeFilter: string;
  setTimeFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  consultantFilter: string;
  setConsultantFilter: (value: string) => void;
  serviceFilter: string;
  setServiceFilter: (value: string) => void;
  consultants: Array<{ id: string; name: string }>;
  services: Array<{ id: string; name: string }>;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  timeFilter,
  setTimeFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  consultantFilter,
  setConsultantFilter,
  serviceFilter,
  setServiceFilter,
  consultants,
  services
}) => {
  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="time-filter">Período</Label>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIME_FILTERS.TODAY}>Hoje</SelectItem>
                <SelectItem value={TIME_FILTERS.THIS_WEEK}>Esta Semana</SelectItem>
                <SelectItem value={TIME_FILTERS.THIS_MONTH}>Este Mês</SelectItem>
                <SelectItem value={TIME_FILTERS.ALL}>Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date-from">Data Início</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="date-to">Data Fim</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="consultant-filter">Consultor</Label>
            <Select value={consultantFilter} onValueChange={setConsultantFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Consultor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Consultores</SelectItem>
                {consultants.map(consultant => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="service-filter">Serviço</Label>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Serviços</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
