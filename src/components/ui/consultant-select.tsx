
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { fetchConsultants, calculateConsultantAvailableHours } from '@/integrations/supabase/consultants';
import { Consultant } from '@/components/projects/types';

interface ConsultantSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ConsultantSelect({ 
  value, 
  onValueChange, 
  placeholder = "Selecionar consultor...",
  className 
}: ConsultantSelectProps) {
  const [open, setOpen] = useState(false);
  const [consultants, setConsultants] = useState<(Consultant & { availableHours: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    try {
      setLoading(true);
      const consultantList = await fetchConsultants();
      
      // Calcular horas disponíveis para cada consultor
      const consultantsWithHours = await Promise.all(
        consultantList.map(async (consultant) => {
          const availableHours = await calculateConsultantAvailableHours(
            consultant.id,
            consultant.hoursPerMonth || 160
          );
          return {
            ...consultant,
            availableHours
          };
        })
      );
      
      setConsultants(consultantsWithHours);
    } catch (error) {
      console.error('Error loading consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedConsultant = consultants.find(consultant => consultant.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={loading}
        >
          {selectedConsultant ? (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{selectedConsultant.name}</span>
              <span className="text-muted-foreground text-sm">
                ({selectedConsultant.availableHours}h livres)
              </span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar consultor..." />
          <CommandEmpty>Nenhum consultor encontrado.</CommandEmpty>
          <CommandGroup>
            {consultants.map((consultant) => (
              <CommandItem
                key={consultant.id}
                value={consultant.name}
                onSelect={() => {
                  onValueChange(consultant.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === consultant.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span>{consultant.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {consultant.availableHours}h livres
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {consultant.email}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
