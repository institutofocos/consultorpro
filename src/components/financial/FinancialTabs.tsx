
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import FinancialTransactionsTable from './FinancialTransactionsTable';
import ManualTransactionsTable from './ManualTransactionsTable';
import { FinancialTransaction, ManualTransaction } from '@/integrations/supabase/financial';

interface FinancialTabsProps {
  automatedTransactions: {
    data: FinancialTransaction[] | null;
    isLoading: boolean;
  };
  manualTransactions: {
    data: ManualTransaction[] | null;
    isLoading: boolean;
  };
  onStatusChange: (id: string, status: 'completed' | 'pending' | 'canceled') => void;
  onEditManualTransaction: (transaction: ManualTransaction) => void;
  onDeleteManualTransaction: (id: string) => void;
}

const FinancialTabs: React.FC<FinancialTabsProps> = ({ 
  automatedTransactions,
  manualTransactions,
  onStatusChange, 
  onEditManualTransaction, 
  onDeleteManualTransaction 
}) => {
  return (
    <Tabs defaultValue="automated" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="automated">Transações do Sistema</TabsTrigger>
        <TabsTrigger value="manual">Lançamentos Manuais</TabsTrigger>
      </TabsList>
      <TabsContent value="automated">
        <Card>
          <CardHeader>
            <CardTitle>Transações Financeiras</CardTitle>
            <CardDescription>
              Receitas e pagamentos previstos e realizados baseados nos projetos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FinancialTransactionsTable 
              transactions={automatedTransactions.data} 
              isLoading={automatedTransactions.isLoading}
              onStatusChange={onStatusChange}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="manual">
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
      </TabsContent>
    </Tabs>
  );
};

export default FinancialTabs;
