
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ManualTransactionsTable from './ManualTransactionsTable';
import { ManualTransaction } from '@/integrations/supabase/financial';

interface FinancialTabsProps {
  manualTransactions: {
    data: ManualTransaction[] | null;
    isLoading: boolean;
  };
  onEditManualTransaction: (transaction: ManualTransaction) => void;
  onDeleteManualTransaction: (id: string) => void;
}

const FinancialTabs: React.FC<FinancialTabsProps> = ({ 
  manualTransactions,
  onEditManualTransaction, 
  onDeleteManualTransaction 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamentos Manuais</CardTitle>
        <CardDescription>
          Transações financeiras adicionadas manualmente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ManualTransactionsTable 
          transactions={manualTransactions.data}
          isLoading={manualTransactions.isLoading}
          onEdit={onEditManualTransaction}
          onDelete={onDeleteManualTransaction}
        />
      </CardContent>
    </Card>
  );
};

export default FinancialTabs;
