
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { AccountsPayable, AccountsReceivable } from "@/integrations/supabase/financial";

interface AccountsPayableReceivableProps {
  payables: {
    data: AccountsPayable[] | undefined;
    isLoading: boolean;
  };
  receivables: {
    data: AccountsReceivable[] | undefined;
    isLoading: boolean;
  };
  monthNavigation?: React.ReactNode;
}

const AccountsPayableReceivable: React.FC<AccountsPayableReceivableProps> = ({
  payables,
  receivables,
  monthNavigation
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'destructive' as const, label: 'Pendente' },
      paid: { variant: 'default' as const, label: 'Pago' },
      received: { variant: 'default' as const, label: 'Recebido' },
      canceled: { variant: 'secondary' as const, label: 'Cancelado' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Accounts Payable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contas a Pagar</CardTitle>
        </CardHeader>
        <CardContent>
          {payables.isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {payables.data && payables.data.length > 0 ? (
                payables.data.map((payable) => (
                  <div key={payable.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{payable.description}</h4>
                      {getStatusBadge(payable.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Valor: {formatCurrency(payable.amount)}</p>
                      <p>Vencimento: {new Date(payable.due_date).toLocaleDateString('pt-BR')}</p>
                      {payable.consultant_name && (
                        <p>Consultor: {payable.consultant_name}</p>
                      )}
                      {payable.project_name && (
                        <p>Projeto: {payable.project_name}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma conta a pagar encontrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accounts Receivable */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Contas a Receber</CardTitle>
            {monthNavigation}
          </div>
        </CardHeader>
        <CardContent>
          {receivables.isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {receivables.data && receivables.data.length > 0 ? (
                receivables.data.map((receivable) => (
                  <div key={receivable.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{receivable.description}</h4>
                      {getStatusBadge(receivable.status)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Valor: {formatCurrency(receivable.amount)}</p>
                      <p>Vencimento: {new Date(receivable.due_date).toLocaleDateString('pt-BR')}</p>
                      {receivable.client_name && (
                        <p>Cliente: {receivable.client_name}</p>
                      )}
                      {receivable.consultant_name && (
                        <p>Consultor: {receivable.consultant_name}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma conta a receber encontrada
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPayableReceivable;
