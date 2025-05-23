
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { FinancialTransaction } from '@/integrations/supabase/financial';

interface FinancialTransactionsTableProps {
  transactions: FinancialTransaction[] | null;
  isLoading: boolean;
  onStatusChange: (id: string, status: 'completed' | 'pending' | 'canceled') => void;
}

const FinancialTransactionsTable: React.FC<FinancialTransactionsTableProps> = ({ 
  transactions, 
  isLoading, 
  onStatusChange 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Projeto/Cliente</TableHead>
          <TableHead>Etapa</TableHead>
          <TableHead>Consultor</TableHead>
          <TableHead>Valor Bruto</TableHead>
          <TableHead>Valor Líquido</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 9 }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : !transactions || transactions.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8">
              Nenhuma transação encontrada para os filtros selecionados
            </TableCell>
          </TableRow>
        ) : (
          transactions.map(transaction => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.due_date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell>
                {transaction.transaction_type === 'expected_income' 
                  ? <Badge className="bg-blue-100 text-blue-800 border-blue-300">Receita</Badge>
                  : transaction.transaction_type === 'consultant_payment'
                    ? <Badge className="bg-purple-100 text-purple-800 border-purple-300">Pagamento</Badge>
                    : transaction.transaction_type}
              </TableCell>
              <TableCell>
                <div className="font-medium">{transaction.project_name}</div>
                <div className="text-sm text-muted-foreground">{transaction.client_name}</div>
              </TableCell>
              <TableCell>{transaction.stage_name}</TableCell>
              <TableCell>{transaction.consultant_name || '-'}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(transaction.net_amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction.status)}
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  {transaction.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onStatusChange(transaction.id, 'completed')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => onStatusChange(transaction.id, 'canceled')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {transaction.status === 'canceled' && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onStatusChange(transaction.id, 'pending')}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default FinancialTransactionsTable;
