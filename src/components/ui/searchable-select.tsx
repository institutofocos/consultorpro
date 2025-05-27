
import React, { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  multiple = false,
  searchPlaceholder = "Pesquisar...",
  emptyText = "Nenhum resultado encontrado.",
  className,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);

  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
  const selectedValue = !multiple ? (typeof value === 'string' ? value : '') : '';

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    
    if (multiple) {
      const newValues = selectedValues.includes(optionId)
        ? selectedValues.filter(v => v !== optionId)
        : [...selectedValues, optionId];
      onValueChange(newValues);
    } else {
      onValueChange(optionId);
      setOpen(false);
    }
  };

  const removeValue = (valueToRemove: string) => {
    if (disabled) return;
    
    if (multiple) {
      onValueChange(selectedValues.filter(v => v !== valueToRemove));
    }
  };

  const getDisplayText = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const option = options.find(opt => opt.id === selectedValues[0]);
        return option?.name || placeholder;
      }
      return `${selectedValues.length} selecionados`;
    } else {
      const option = options.find(opt => opt.id === selectedValue);
      return option?.name || placeholder;
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            {getDisplayText()}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        (multiple ? selectedValues.includes(option.id) : selectedValue === option.id)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Show selected items as badges for multiple select */}
      {multiple && selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedValues.map((valueId) => {
            const option = options.find(opt => opt.id === valueId);
            if (!option) return null;
            
            return (
              <Badge key={valueId} variant="secondary" className="text-xs">
                {option.name}
                <button
                  type="button"
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => removeValue(valueId)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
