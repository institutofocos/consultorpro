
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthNavigationProps {
  currentDate: Date;
  onMonthChange: (date: Date) => void;
}

const MonthNavigation: React.FC<MonthNavigationProps> = ({ currentDate, onMonthChange }) => {
  const handlePreviousMonth = () => {
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    onMonthChange(previousMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(nextMonth);
  };

  const currentMonthName = format(currentDate, 'MMMM', { locale: ptBR });
  const capitalizedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePreviousMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <span className="text-sm font-medium min-w-[80px] text-center">
        {capitalizedMonthName}
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MonthNavigation;
