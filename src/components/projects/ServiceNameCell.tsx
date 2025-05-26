
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ServiceNameCellProps {
  serviceName: string;
}

const ServiceNameCell: React.FC<ServiceNameCellProps> = ({ serviceName }) => {
  const truncateServiceName = (name: string) => {
    const words = name.split(' ');
    if (words.length > 3) {
      return words.slice(0, 3).join(' ') + '...';
    }
    return name;
  };

  const truncatedName = truncateServiceName(serviceName);
  const shouldTruncate = truncatedName !== serviceName;

  if (!shouldTruncate) {
    return <span>{serviceName}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{truncatedName}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{serviceName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ServiceNameCell;
