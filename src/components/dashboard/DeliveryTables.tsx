
import React from 'react';

interface DeliveryTablesProps {
  upcomingProjects: any[];
  upcomingStages: any[];
  formatDate: (dateString: string) => string;
  formatCurrency: (value: number) => string;
}

export const DeliveryTables: React.FC<DeliveryTablesProps> = ({
  upcomingProjects,
  upcomingStages,
  formatDate,
  formatCurrency
}) => {
  // Component removido - não renderiza mais nada
  return null;
};
