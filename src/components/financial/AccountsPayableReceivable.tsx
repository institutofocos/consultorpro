
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AccountsPayable, AccountsReceivable } from '@/integrations/supabase/financial';

interface AccountsPayableReceivableProps {
  payables: {
    data: AccountsPayable[] | null;
    isLoading: boolean;
  };
  receivables: {
    data: AccountsReceivable[] | null;
    isLoading: boolean;
  };
}

const AccountsPayableReceivable: React.FC<AccountsPayableReceivableProps> = ({ payables, receivables }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string, type: 'payable' | 'receivable') => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Recebido</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Tabs defaultValue="payable" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
        <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
      </TabsList>
      
      <TabsContent value="payable">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar</CardTitle>
            <CardDescription>
              Pagamentos pendentes e realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Consultor</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payables.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !payables.data || payables.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhuma conta a pagar encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  payables.data.map(payable => (
                    <TableRow key={payable.id}>
                      <TableCell>
                        {format(new Date(payable.due_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{payable.description}</TableCell>
                      <TableCell>{payable.project_name || '-'}</TableCell>
                      <TableCell>{payable.consultant_name || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payable.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payable.status, 'payable')}
                        {payable.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Pago em: {format(new Date(payable.payment_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="receivable">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>
              Recebimentos pendentes e realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 6 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !receivables.data || receivables.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhuma conta a receber encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  receivables.data.map(receivable => (
                    <TableRow key={receivable.id}>
                      <TableCell>
                        {format(new Date(receivable.due_date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{receivable.description}</TableCell>
                      <TableCell>{receivable.project_name || '-'}</TableCell>
                      <TableCell>{receivable.client_name || '-'}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(receivable.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receivable.status, 'receivable')}
                        {receivable.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Recebido em: {format(new Date(receivable.payment_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default AccountsPayableReceivable;
