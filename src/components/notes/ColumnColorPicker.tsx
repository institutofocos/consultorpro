
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ColumnColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

const COLUMN_COLORS = [
  { value: 'bg-blue-50', label: 'Azul', preview: 'bg-blue-100' },
  { value: 'bg-yellow-50', label: 'Amarelo', preview: 'bg-yellow-100' },
  { value: 'bg-green-50', label: 'Verde', preview: 'bg-green-100' },
  { value: 'bg-red-50', label: 'Vermelho', preview: 'bg-red-100' },
  { value: 'bg-purple-50', label: 'Roxo', preview: 'bg-purple-100' },
  { value: 'bg-pink-50', label: 'Rosa', preview: 'bg-pink-100' },
  { value: 'bg-indigo-50', label: 'Índigo', preview: 'bg-indigo-100' },
  { value: 'bg-cyan-50', label: 'Ciano', preview: 'bg-cyan-100' },
  { value: 'bg-teal-50', label: 'Teal', preview: 'bg-teal-100' },
  { value: 'bg-orange-50', label: 'Laranja', preview: 'bg-orange-100' },
  { value: 'bg-lime-50', label: 'Lima', preview: 'bg-lime-100' },
  { value: 'bg-emerald-50', label: 'Esmeralda', preview: 'bg-emerald-100' },
  { value: 'bg-violet-50', label: 'Violeta', preview: 'bg-violet-100' },
  { value: 'bg-fuchsia-50', label: 'Fúcsia', preview: 'bg-fuchsia-100' },
  { value: 'bg-rose-50', label: 'Rosa Claro', preview: 'bg-rose-100' },
  { value: 'bg-sky-50', label: 'Céu', preview: 'bg-sky-100' },
  { value: 'bg-gray-50', label: 'Cinza', preview: 'bg-gray-100' },
];

const ColumnColorPicker: React.FC<ColumnColorPickerProps> = ({
  currentColor,
  onColorChange,
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Palette className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Escolher cor da coluna</h4>
          <div className="grid grid-cols-4 gap-2">
            {COLUMN_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={`
                  w-12 h-8 rounded-md border-2 transition-all hover:scale-105
                  ${color.preview}
                  ${currentColor === color.value 
                    ? 'border-gray-800 shadow-md' 
                    : 'border-gray-200 hover:border-gray-400'
                  }
                `}
                title={color.label}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnColorPicker;
