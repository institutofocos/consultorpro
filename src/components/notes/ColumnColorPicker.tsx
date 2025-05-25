
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ColumnColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  onClose: () => void;
}

const colors = [
  'bg-purple-50',
  'bg-pink-50',
  'bg-indigo-50',
  'bg-cyan-50',
  'bg-teal-50',
  'bg-orange-50',
  'bg-lime-50',
  'bg-emerald-50',
  'bg-violet-50',
  'bg-fuchsia-50',
  'bg-rose-50',
  'bg-sky-50',
  'bg-gray-50',
  'bg-yellow-50',
  'bg-green-50',
  'bg-blue-50',
];

const ColumnColorPicker: React.FC<ColumnColorPickerProps> = ({
  currentColor,
  onColorChange,
  onClose,
}) => {
  return (
    <div className="absolute top-12 right-0 z-50">
      <Card className="w-48 shadow-lg">
        <CardContent className="p-3">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${color} ${
                  currentColor === color 
                    ? 'border-gray-800 ring-2 ring-blue-500' 
                    : 'border-gray-300 hover:border-gray-500'
                }`}
                onClick={() => onColorChange(color)}
                title={color}
              />
            ))}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="w-full"
          >
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ColumnColorPicker;
