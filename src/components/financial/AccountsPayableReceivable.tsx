
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye,
  RotateCcw
} from "lucide-react";
import { 
  AccountsPayable, 
  AccountsReceivable,
  updateAccountsPayableStatus,
  updateAccountsReceivableStatus,
  deleteAccountsPayable,
  deleteAccountsReceivable,
  cancelAccountsPayable,
  cancelAccountsReceivable,
  reactivateAccountsPayable,
  reactivateAccountsReceivable,
  fetchAccountsPayable,
  fetchAccountsReceivable,
  FinancialFilter
} from "@/integrations/supabase/financial";
import FinancialHistoryModal from "./FinancialHistoryModal";

interface AccountsPayableReceivableProps {
  payables: {
    data: AccountsPayable[] | undefined;
    isLoading: boolean;
  };
  receivables: {
    data: AccountsReceivable[] | undefined;
    isLoading: boolean;
  };
  filters?: FinancialFilter;
}

const AccountsPayableReceivable: React.FC<AccountsPayableReceivableProps> = ({ 
  payables, 
  receivables,
  filters = {}
}) => {
  const queryClient = useQueryClient();
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [highlightTransactionId, setHighlightTransactionId] = useState<string | null>(null);

  // Buscar todas as transações quando o toggle está ativo (ignorando filtros)
  const { data: allPayables, isLoading: allPayablesLoading } = useQuery({
    queryKey: ['accounts-payable-all'],
    queryFn: () => fetchAccountsPayable({}), // No filters to get all data
    enabled: showAllTransactions,
  });

  const { data: allReceivables, isLoading: allReceivablesLoading } = useQuery({
    queryKey: ['accounts-receivable-all'],
    queryFn: () => fetchAccountsReceivable({}), // No filters to get all data
    enabled: showAllTransactions,
  });

  // Function to check if a transaction is overdue
  const isOverdue = (dueDate: string, status: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    // Check if due date is before today and status is not completed
    return due < today && status === 'pending';
  };

  // Verificar se há uma transação para destacar quando o componente carregar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = urlParams.get('highlight');
    const transactionType = urlParams.get('type');
    
    if (transactionId && transactionType) {
      setHighlightTransactionId(transactionId);
      
      // Scroll para a transação após um delay para garantir que a tabela foi renderizada
      setTimeout(() => {
        const element = document.querySelector(`[data-transaction-id="${transactionId}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Remover o highlight após alguns segundos
          setTimeout(() => {
            setHighlightTransactionId(null);
            // Limpar a URL
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          }, 3000);
        }
      }, 500);
    }
  }, [payables.data, receivables.data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string, type: 'payable' | 'receivable') => {
    if (type === 'payable') {
      switch(status) {
        case 'pending':
          return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
        case 'paid':
          return <Badge variant="outline" className="bg-green-100 text-green-800">Pago</Badge>;
        case 'canceled':
          return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    } else {
      switch(status) {
        case 'pending':
          return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
        case 'received':
          return <Badge variant="outline" className="bg-green-100 text-green-800">Recebido</Badge>;
        case 'canceled':
          return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }
  };

  // Mutations for payables
  const updatePayableStatusMutation = useMutation({
    mutationFn: async ({ id, status, paymentDate }: { id: string, status: string, paymentDate?: string }) => {
      return await updateAccountsPayableStatus(id, status as any, paymentDate);
    },
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deletePayableMutation = useMutation({
    mutationFn: deleteAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar removida com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao remover conta: " + error.message);
    },
  });

  const cancelPayableMutation = useMutation({
    mutationFn: cancelAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao cancelar conta: " + error.message);
    },
  });

  const reactivatePayableMutation = useMutation({
    mutationFn: reactivateAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar reativada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao reativar conta: " + error.message);
    },
  });

  // Mutations for receivables
  const updateReceivableStatusMutation = useMutation({
    mutationFn: async ({ id, status, paymentDate }: { id: string, status: string, paymentDate?: string }) => {
      return await updateAccountsReceivableStatus(id, status as any, paymentDate);
    },
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: deleteAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber removida com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao remover conta: " + error.message);
    },
  });

  const cancelReceivableMutation = useMutation({
    mutationFn: cancelAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao cancelar conta: " + error.message);
    },
  });

  const reactivateReceivableMutation = useMutation({
    mutationFn: reactivateAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber reativada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao reativar conta: " + error.message);
    },
  });

  const handlePayableStatusChange = (payable: AccountsPayable, newStatus: string) => {
    const paymentDate = newStatus === 'paid' ? format(new Date(), 'yyyy-MM-dd') : undefined;
    updatePayableStatusMutation.mutate({ 
      id: payable.id, 
      status: newStatus, 
      paymentDate 
    });
  };

  const handleReceivableStatusChange = (receivable: AccountsReceivable, newStatus: string) => {
    const paymentDate = newStatus === 'received' ? format(new Date(), 'yyyy-MM-dd') : undefined;
    updateReceivableStatusMutation.mutate({ 
      id: receivable.id, 
      status: newStatus, 
      paymentDate 
    });
  };

  const handleDeletePayable = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta conta a pagar?")) {
      deletePayableMutation.mutate(id);
    }
  };

  const handleDeleteReceivable = (id: string) => {
    if (confirm("Tem certeza que deseja remover esta conta a receber?")) {
      deleteReceivableMutation.mutate(id);
    }
  };

  const handleCancelPayable = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta conta a pagar?")) {
      cancelPayableMutation.mutate(id);
    }
  };

  const handleCancelReceivable = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta conta a receber?")) {
      cancelReceivableMutation.mutate(id);
    }
  };

  const handleReactivatePayable = (id: string) => {
    if (confirm("Tem certeza que deseja reativar esta conta a pagar?")) {
      reactivatePayableMutation.mutate(id);
    }
  };

  const handleReactivateReceivable = (id: string) => {
    if (confirm("Tem certeza que deseja reativar esta conta a receber?")) {
      reactivateReceivableMutation.mutate(id);
    }
  };

  // Use filtered data or all data based on toggle
  const displayPayables = showAllTransactions ? allPayables : payables.data;
  const displayReceivables = showAllTransactions ? allReceivables : receivables.data;
  const isPayablesLoading = showAllTransactions ? allPayablesLoading : payables.isLoading;
  const isReceivablesLoading = showAllTransactions ? allReceivablesLoading : receivables.isLoading;

  return (
    <div className="space-y-6">
      {/* Toggle para mostrar todos os lançamentos */}
      <div className="flex items-center space-x-2">
        <Switch
          id="show-all-transactions"
          checked={showAllTransactions}
          onCheckedChange={setShowAllTransactions}
        />
        <Label htmlFor="show-all-transactions">
          Mostrar todos os lançamentos (ignora filtros de período)
        </Label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Pagar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Contas a Pagar
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            </CardTitle>
            <CardDescription>
              Pagamentos pendentes e realizados
              {showAllTransactions && (
                <span className="text-blue-600 font-medium"> (Todos os lançamentos)</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPayablesLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : !displayPayables || displayPayables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhuma conta a pagar encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  displayPayables.map((payable) => (
                    <TableRow 
                      key={payable.id}
                      data-transaction-id={payable.id}
                      data-transaction-type="payable"
                      data-due-date={payable.due_date}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        isOverdue(payable.due_date, payable.status) && "bg-red-50 hover:bg-red-100 border-l-4 border-red-500",
                        highlightTransactionId === payable.id && "bg-blue-50 border-l-4 border-blue-500"
                      )}
                    >
                      <TableCell>
                        {format(new Date(payable.due_date), 'dd/MM/yyyy')}
                        {payable.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Pago em: {format(new Date(payable.payment_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate" title={payable.description}>
                            {payable.description}
                          </div>
                          {payable.consultant_name && (
                            <div className="text-xs text-muted-foreground">
                              {payable.consultant_name}
                            </div>
                          )}
                          {payable.project_name && (
                            <div className="text-xs text-muted-foreground">
                              {payable.project_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payable.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payable.status, 'payable')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {payable.status === 'pending' && (
                            <>
                              <Select
                                onValueChange={(value) => handlePayableStatusChange(payable, value)}
                              >
                                <SelectTrigger className="w-auto h-8 text-xs">
                                  <SelectValue placeholder="Ação" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="paid">Marcar como Pago</SelectItem>
                                  <SelectItem value="canceled">Cancelar</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {payable.status === 'paid' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePayableStatusChange(payable, 'pending')}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          {payable.status === 'canceled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivatePayable(payable.id)}
                              title="Reativar"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Contas a Receber */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Contas a Receber
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoryModal(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Histórico
              </Button>
            </CardTitle>
            <CardDescription>
              Recebimentos pendentes e realizados
              {showAllTransactions && (
                <span className="text-blue-600 font-medium"> (Todos os lançamentos)</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isReceivablesLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : !displayReceivables || displayReceivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhuma conta a receber encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  displayReceivables.map((receivable) => (
                    <TableRow 
                      key={receivable.id}
                      data-transaction-id={receivable.id}
                      data-transaction-type="receivable"
                      data-due-date={receivable.due_date}
                      className={cn(
                        "hover:bg-gray-50 transition-colors",
                        isOverdue(receivable.due_date, receivable.status) && "bg-red-50 hover:bg-red-100 border-l-4 border-red-500",
                        highlightTransactionId === receivable.id && "bg-blue-50 border-l-4 border-blue-500"
                      )}
                    >
                      <TableCell>
                        {format(new Date(receivable.due_date), 'dd/MM/yyyy')}
                        {receivable.payment_date && (
                          <div className="text-xs text-muted-foreground">
                            Recebido em: {format(new Date(receivable.payment_date), 'dd/MM/yyyy')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate" title={receivable.description}>
                            {receivable.description}
                          </div>
                          {receivable.client_name && (
                            <div className="text-xs text-muted-foreground">
                              {receivable.client_name}
                            </div>
                          )}
                          {receivable.project_name && (
                            <div className="text-xs text-muted-foreground">
                              {receivable.project_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(receivable.amount)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(receivable.status, 'receivable')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {receivable.status === 'pending' && (
                            <>
                              <Select
                                onValueChange={(value) => handleReceivableStatusChange(receivable, value)}
                              >
                                <SelectTrigger className="w-auto h-8 text-xs">
                                  <SelectValue placeholder="Ação" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="received">Marcar como Recebido</SelectItem>
                                  <SelectItem value="canceled">Cancelar</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                          {receivable.status === 'received' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReceivableStatusChange(receivable, 'pending')}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          {receivable.status === 'canceled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReactivateReceivable(receivable.id)}
                              title="Reativar"
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Financial History Modal */}
      <FinancialHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        filters={filters}
      />
    </div>
  );
};

export default AccountsPayableReceivable;
