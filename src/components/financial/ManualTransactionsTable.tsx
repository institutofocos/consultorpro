
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
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ManualTransaction } from '@/integrations/supabase/financial';

interface ManualTransactionsTableProps {
  transactions: ManualTransaction[] | null;
  isLoading: boolean;
  onEdit: (transaction: ManualTransaction) => void;
  onDelete: (id: string) => void;
}

const ManualTransactionsTable: React.FC<ManualTransactionsTableProps> = ({ 
  transactions, 
  isLoading, 
  onEdit,
  onDelete
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string, type: string) => {
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

  const getTypeBadge = (type: string) => {
    switch(type) {
      case 'income':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Receita</Badge>;
      case 'expense':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Despesa</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Projeto/Cliente</TableHead>
          <TableHead>Consultor</TableHead>
          <TableHead>Tag</TableHead>
          <TableHead>Valor</TableHead>
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
                {transaction.is_recurring && (
                  <div className="text-xs text-muted-foreground">
                    Recorrente ({
                      transaction.recurrence_interval === 'monthly' ? 'Mensal' : 
                      transaction.recurrence_interval === 'quarterly' ? 'Trimestral' : 
                      'Anual'
                    })
                  </div>
                )}
              </TableCell>
              <TableCell>{getTypeBadge(transaction.type)}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>
                {transaction.project_name && (
                  <div className="font-medium">{transaction.project_name}</div>
                )}
                {transaction.client_name && (
                  <div className="text-sm text-muted-foreground">{transaction.client_name}</div>
                )}
              </TableCell>
              <TableCell>{transaction.consultant_name || '-'}</TableCell>
              <TableCell>{transaction.tag_name || '-'}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(transaction.status, transaction.type)}
                {transaction.payment_date && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(transaction.payment_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default ManualTransactionsTable;
