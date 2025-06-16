import React, { useState, useEffect } from 'react';
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
  AccountsPayable, 
  AccountsReceivable, 
  updateAccountsReceivableStatus, 
  updateAccountsPayableStatus,
  cancelAccountsReceivable,
  cancelAccountsPayable,
  deleteAccountsReceivable,
  deleteAccountsPayable,
  reactivateAccountsReceivable,
  reactivateAccountsPayable,
  fetchAccountsHistory
} from '@/integrations/supabase/financial';
import { CalendarIcon, CheckCircle, CreditCard, X, History, Trash2, RotateCcw, Undo } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import MonthNavigation from "./MonthNavigation";
import FinancialHistoryModal from "./FinancialHistoryModal";

interface AccountsPayableReceivableProps {
  payables: {
    data: AccountsPayable[] | null;
    isLoading: boolean;
  };
  receivables: {
    data: AccountsReceivable[] | null;
    isLoading: boolean;
  };
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const AccountsPayableReceivable: React.FC<AccountsPayableReceivableProps> = ({ 
  payables, 
  receivables, 
  currentMonth, 
  onMonthChange 
}) => {
  const queryClient = useQueryClient();
  const [selectedReceivable, setSelectedReceivable] = useState<string | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isMarkingReceived, setIsMarkingReceived] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [reactivatePin, setReactivatePin] = useState('');
  const [undoPin, setUndoPin] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'payable' | 'receivable' } | null>(null);
  const [reactivateTarget, setReactivateTarget] = useState<{ id: string; type: 'payable' | 'receivable' } | null>(null);
  const [undoTarget, setUndoTarget] = useState<{ id: string; type: 'payable' | 'receivable'; currentStatus: string } | null>(null);
  const [activeTab, setActiveTab] = useState('payable');

  // Verificar se há uma transação para destacar quando o componente carregar
  useEffect(() => {
    const highlightData = sessionStorage.getItem('highlightTransaction');
    if (highlightData) {
      try {
        const transactionToHighlight = JSON.parse(highlightData);
        console.log('🎯 Dados da transação para destacar:', transactionToHighlight);

        // Definir a tab correta
        const correctTab = transactionToHighlight.type === 'receivable' ? 'receivable' : 'payable';
        setActiveTab(correctTab);

        // Aguardar a renderização e então destacar
        setTimeout(() => {
          highlightTransactionRow(transactionToHighlight);
        }, 1000);

        // Limpar o sessionStorage após usar
        sessionStorage.removeItem('highlightTransaction');
      } catch (error) {
        console.error('Erro ao processar dados de destaque:', error);
      }
    }
  }, [payables.data, receivables.data]);

  const highlightTransactionRow = (transactionData: any) => {
    console.log('🔍 Procurando transação para destacar:', transactionData);
    
    // Procurar pela linha da transação
    const transactionRows = document.querySelectorAll(`[data-transaction-type="${transactionData.type}"]`);
    let targetRow = null;

    transactionRows.forEach(row => {
      const rowElement = row as HTMLElement;
      const rowId = rowElement.getAttribute('data-transaction-id');
      const rowDueDate = rowElement.getAttribute('data-due-date');
      const rowText = rowElement.textContent || '';

      console.log('🔍 Verificando linha:', {
        rowId,
        rowDueDate,
        targetId: transactionData.id,
        targetDueDate: transactionData.dueDate,
        descriptionMatch: rowText.includes(transactionData.description?.substring(0, 20) || '')
      });

      // Comparar por ID, data de vencimento e parte da descrição
      if (rowId === transactionData.id || 
          (rowDueDate === transactionData.dueDate && 
           rowText.includes(transactionData.description?.substring(0, 20) || '')) ||
          (rowText.includes(transactionData.entityName || '') && 
           rowDueDate === transactionData.dueDate)) {
        targetRow = rowElement;
        console.log('✅ Linha encontrada para destaque!');
      }
    });

    if (targetRow) {
      // Fazer scroll até a linha
      targetRow.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });

      // Adicionar destaque à linha
      targetRow.classList.add('bg-blue-100', 'border-2', 'border-blue-500', 'shadow-lg', 'transition-all', 'duration-300');
      
      // Remover o destaque após 5 segundos
      setTimeout(() => {
        targetRow?.classList.remove('bg-blue-100', 'border-2', 'border-blue-500', 'shadow-lg');
      }, 5000);

      toast.success(`Transação localizada: ${transactionData.description?.substring(0, 30) || 'Transação'}...`);
    } else {
      console.warn('❌ Transação não encontrada na lista atual');
      toast.error('Transação não encontrada na lista atual. Verifique os filtros de data.');
    }
  };

  // Fetch history data - sempre que o modal for aberto
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['accounts-history'],
    queryFn: () => fetchAccountsHistory(),
    enabled: showHistory,
  });

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
      case 'deleted':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Excluído</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStageStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; className: string }> = {
      'iniciar_projeto': { label: 'Iniciar Projeto', className: 'bg-blue-100 text-blue-800' },
      'em_producao': { label: 'Em Produção', className: 'bg-orange-100 text-orange-800' },
      'aguardando_aprovacao': { label: 'Aguardando Aprovação', className: 'bg-yellow-100 text-yellow-800' },
      'aguardando_assinatura': { label: 'Aguardando Assinatura', className: 'bg-purple-100 text-purple-800' },
      'concluido': { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  // Function to determine what the previous status should be for undo
  const getPreviousStatus = (currentStatus: string, type: 'payable' | 'receivable') => {
    if (type === 'receivable') {
      switch (currentStatus) {
        case 'received':
          return 'pending';
        case 'canceled':
          return 'pending';
        case 'deleted':
          return 'pending';
        default:
          return 'pending';
      }
    } else {
      switch (currentStatus) {
        case 'paid':
          return 'pending';
        case 'canceled':
          return 'pending';
        case 'deleted':
          return 'pending';
        default:
          return 'pending';
      }
    }
  };

  const updateReceivableStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'pending' | 'received' | 'canceled', paymentDate?: string }) => 
      updateAccountsReceivableStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      // Invalidar múltiplas queries para garantir que todos os dados sejam atualizados
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      // Forçar atualização do histórico se o modal estiver aberto
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const updatePayableStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'pending' | 'paid' | 'canceled', paymentDate?: string }) => 
      updateAccountsPayableStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      // Invalidar múltiplas queries para garantir que todos os dados sejam atualizados
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      // Forçar atualização do histórico se o modal estiver aberto
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const cancelReceivableMutation = useMutation({
    mutationFn: cancelAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar conta a receber: " + error.message);
    },
  });

  const cancelPayableMutation = useMutation({
    mutationFn: cancelAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar cancelada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar conta a pagar: " + error.message);
    },
  });

  const deleteReceivableMutation = useMutation({
    mutationFn: deleteAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conta a receber: " + error.message);
    },
  });

  const deletePayableMutation = useMutation({
    mutationFn: deleteAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conta a pagar: " + error.message);
    },
  });

  const reactivateReceivableMutation = useMutation({
    mutationFn: reactivateAccountsReceivable,
    onSuccess: () => {
      toast.success("Conta a receber reativada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao reativar conta a receber: " + error.message);
    },
  });

  const reactivatePayableMutation = useMutation({
    mutationFn: reactivateAccountsPayable,
    onSuccess: () => {
      toast.success("Conta a pagar reativada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-history'] });
      if (showHistory) {
        refetchHistory();
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao reativar conta a pagar: " + error.message);
    },
  });

  const handleMarkAsReceived = (receivableId: string) => {
    setSelectedReceivable(receivableId);
    setIsMarkingReceived(true);
  };

  const handleMarkAsPaid = (payableId: string) => {
    setSelectedPayable(payableId);
    setIsMarkingPaid(true);
  };

  const handleConfirmReceived = async () => {
    if (!selectedReceivable) return;
    
    await updateReceivableStatusMutation.mutate({
      id: selectedReceivable, 
      status: 'received',
      paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
    });
    
    setIsMarkingReceived(false);
    setSelectedReceivable(null);
  };

  const handleConfirmPaid = async () => {
    if (!selectedPayable) return;
    
    await updatePayableStatusMutation.mutate({
      id: selectedPayable, 
      status: 'paid',
      paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
    });
    
    setIsMarkingPaid(false);
    setSelectedPayable(null);
  };

  const handleCancelReceivable = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta conta a receber?")) {
      cancelReceivableMutation.mutate(id);
    }
  };

  const handleCancelPayable = (id: string) => {
    if (confirm("Tem certeza que deseja cancelar esta conta a pagar?")) {
      cancelPayableMutation.mutate(id);
    }
  };

  const handleDeleteClick = (id: string, type: 'payable' | 'receivable') => {
    setDeleteTarget({ id, type });
    setDeletePin('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deletePin !== '9136') {
      toast.error("PIN incorreto");
      return;
    }

    if (!deleteTarget) return;

    if (deleteTarget.type === 'receivable') {
      deleteReceivableMutation.mutate(deleteTarget.id);
    } else {
      deletePayableMutation.mutate(deleteTarget.id);
    }

    setShowDeleteModal(false);
    setDeleteTarget(null);
    setDeletePin('');
  };

  const handleReactivateClick = (id: string, type: 'payable' | 'receivable') => {
    setReactivateTarget({ id, type });
    setReactivatePin('');
    setShowReactivateModal(true);
  };

  const handleReactivateConfirm = () => {
    if (reactivatePin !== '9136') {
      toast.error("PIN incorreto");
      return;
    }

    if (!reactivateTarget) return;

    if (reactivateTarget.type === 'receivable') {
      reactivateReceivableMutation.mutate(reactivateTarget.id);
    } else {
      reactivatePayableMutation.mutate(reactivateTarget.id);
    }

    setShowReactivateModal(false);
    setReactivateTarget(null);
    setReactivatePin('');
  };

  const handleUndoClick = (id: string, type: 'payable' | 'receivable', currentStatus: string) => {
    setUndoTarget({ id, type, currentStatus });
    setUndoPin('');
    setShowUndoModal(true);
  };

  const handleUndoConfirm = () => {
    if (undoPin !== '9136') {
      toast.error("PIN incorreto");
      return;
    }

    if (!undoTarget) return;

    const previousStatus = getPreviousStatus(undoTarget.currentStatus, undoTarget.type);

    if (undoTarget.type === 'receivable') {
      updateReceivableStatusMutation.mutate({
        id: undoTarget.id,
        status: previousStatus as 'pending' | 'received' | 'canceled'
      });
    } else {
      updatePayableStatusMutation.mutate({
        id: undoTarget.id,
        status: previousStatus as 'pending' | 'paid' | 'canceled'
      });
    }

    setShowUndoModal(false);
    setUndoTarget(null);
    setUndoPin('');
  };

  // Função para abrir o histórico e forçar atualização
  const handleOpenHistory = () => {
    console.log('Opening history modal');
    setShowHistory(true);
    // Força buscar os dados mais recentes
    setTimeout(() => {
      refetchHistory();
    }, 100);
  };

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
          </TabsList>
          
          <Button
            variant="outline"
            onClick={handleOpenHistory}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
        </div>
        
        <TabsContent value="payable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>
                    Pagamentos pendentes e realizados para consultores (incluindo repasses automáticos de etapas)
                  </CardDescription>
                </div>
                <MonthNavigation 
                  currentDate={currentMonth}
                  onMonthChange={onMonthChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status da Etapa</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 9 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !payables.data || payables.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Nenhuma conta a pagar encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    payables.data.map(payable => (
                      <TableRow 
                        key={payable.id}
                        data-transaction-id={payable.id}
                        data-transaction-type="payable"
                        data-due-date={payable.due_date}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          {format(new Date(payable.due_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{payable.description}</TableCell>
                        <TableCell>{payable.project_name || '-'}</TableCell>
                        <TableCell>{payable.stage_name || '-'}</TableCell>
                        <TableCell>
                          {getStageStatusBadge(payable.stage_status)}
                        </TableCell>
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
                        <TableCell>
                          <div className="flex gap-1">
                            {payable.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsPaid(payable.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                                  title="Marcar como pago"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelPayable(payable.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(payable.id, 'payable')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {payable.status === 'deleted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReactivateClick(payable.id, 'payable')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                title="Reativar"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {payable.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUndoClick(payable.id, 'payable', payable.status)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2"
                                title="Desfazer última ação"
                              >
                                <Undo className="h-4 w-4" />
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
        </TabsContent>
        
        <TabsContent value="receivable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>
                    Recebimentos pendentes e realizados das etapas dos projetos
                  </CardDescription>
                </div>
                <MonthNavigation 
                  currentDate={currentMonth}
                  onMonthChange={onMonthChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status da Etapa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 10 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !receivables.data || receivables.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        Nenhuma conta a receber encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivables.data.map(receivable => (
                      <TableRow 
                        key={receivable.id}
                        data-transaction-id={receivable.id}
                        data-transaction-type="receivable"
                        data-due-date={receivable.due_date}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          {format(new Date(receivable.due_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{receivable.description}</TableCell>
                        <TableCell className="font-medium">
                          {receivable.project_name || '-'}
                        </TableCell>
                        <TableCell>
                          {receivable.stage_name || '-'}
                        </TableCell>
                        <TableCell>
                          {getStageStatusBadge(receivable.stage_status)}
                        </TableCell>
                        <TableCell>{receivable.client_name || '-'}</TableCell>
                        <TableCell>{receivable.consultant_name || '-'}</TableCell>
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
                        <TableCell>
                          <div className="flex gap-1">
                            {receivable.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMarkAsReceived(receivable.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                                  title="Marcar como recebido"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelReceivable(receivable.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  title="Cancelar"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteClick(receivable.id, 'receivable')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                                  title="Excluir"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {receivable.status === 'deleted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReactivateClick(receivable.id, 'receivable')}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2"
                                title="Reativar"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            {receivable.status !== 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUndoClick(receivable.id, 'receivable', receivable.status)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 p-2"
                                title="Desfazer última ação"
                              >
                                <Undo className="h-4 w-4" />
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
        </TabsContent>
      </Tabs>

      {/* Payment Dialog for Receivables */}
      <Dialog open={isMarkingReceived} onOpenChange={setIsMarkingReceived}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recebimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data do recebimento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingReceived(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReceived}>Confirmar recebimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog for Payables */}
      <Dialog open={isMarkingPaid} onOpenChange={setIsMarkingPaid}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data do pagamento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingPaid(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPaid}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar a exclusão, digite o PIN de segurança:
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium">PIN</label>
              <Input
                type="password"
                value={deletePin}
                onChange={(e) => setDeletePin(e.target.value)}
                placeholder="Digite o PIN"
                maxLength={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleDeleteConfirm}
              variant="destructive"
              disabled={deletePin.length !== 4}
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Modal */}
      <Dialog open={showReactivateModal} onOpenChange={setShowReactivateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reativação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar a reativação, digite o PIN de segurança:
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium">PIN</label>
              <Input
                type="password"
                value={reactivatePin}
                onChange={(e) => setReactivatePin(e.target.value)}
                placeholder="Digite o PIN"
                maxLength={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReactivateModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleReactivateConfirm}
              disabled={reactivatePin.length !== 4}
            >
              Confirmar Reativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo Confirmation Modal */}
      <Dialog open={showUndoModal} onOpenChange={setShowUndoModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Desfazer Ação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Para confirmar que deseja desfazer a última ação, digite o PIN de segurança:
            </p>
            <div className="grid gap-2">
              <label className="text-sm font-medium">PIN</label>
              <Input
                type="password"
                value={undoPin}
                onChange={(e) => setUndoPin(e.target.value)}
                placeholder="Digite o PIN"
                maxLength={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUndoModal(false)}>Cancelar</Button>
            <Button 
              onClick={handleUndoConfirm}
              disabled={undoPin.length !== 4}
            >
              Confirmar Desfazer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Financial History Modal */}
      <FinancialHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={historyData || []}
        isLoading={historyLoading}
      />
    </>
  );
};

export default AccountsPayableReceivable;
