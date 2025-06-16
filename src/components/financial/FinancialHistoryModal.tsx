import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from 'sonner';
import FinancialHistoryFilters from './FinancialHistoryFilters';
import { useConsultants } from '@/hooks/useConsultants';
import { 
  updateAccountsReceivableStatus, 
  updateAccountsPayableStatus,
  deleteAccountsReceivable,
  deleteAccountsPayable
} from '@/integrations/supabase/financial';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface HistoryItem {
  id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  entity_name: string;
  project_name?: string;
  stage_name?: string;
}

interface FinancialHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  isLoading: boolean;
}

const FinancialHistoryModal: React.FC<FinancialHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  isLoading
}) => {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');

  const { data: consultants = [] } = useConsultants();

  // Mutations for updating status
  const updateReceivableStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'pending' | 'received' | 'canceled', paymentDate?: string }) =>
      updateAccountsReceivableStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Mutations for deleting
  const deleteReceivableMutation = useMutation({
    mutationFn: (id: string) => deleteAccountsReceivable(id),
    onSuccess: () => {
      toast.success("Conta a receber excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conta: " + error.message);
    },
  });

  const deletePayableMutation = useMutation({
    mutationFn: (id: string) => deleteAccountsPayable(id),
    onSuccess: () => {
      toast.success("Conta a pagar excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conta: " + error.message);
    },
  });

  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filtro por período
    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.due_date);
        return isAfter(itemDate, startDate) || isSameDay(itemDate, startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.due_date);
        return isBefore(itemDate, endDate) || isSameDay(itemDate, endDate);
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtro por consultor
    if (consultantFilter !== 'all') {
      const consultantName = consultants.find(c => c.id === consultantFilter)?.name;
      if (consultantName) {
        filtered = filtered.filter(item => 
          item.entity_name.toLowerCase().includes(consultantName.toLowerCase())
        );
      }
    }

    return filtered;
  }, [history, startDate, endDate, statusFilter, consultantFilter, consultants]);

  // Separar os dados filtrados por tipo
  const receivables = filteredHistory.filter(item => item.type === 'receivable');
  const payables = filteredHistory.filter(item => item.type === 'payable');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
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

  const handleMarkAsReceived = (item: HistoryItem) => {
    if (item.type === 'receivable') {
      updateReceivableStatusMutation.mutate({
        id: item.id,
        status: 'received',
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      });
    } else {
      updatePayableStatusMutation.mutate({
        id: item.id,
        status: 'paid',
        paymentDate: format(new Date(), 'yyyy-MM-dd')
      });
    }
  };

  const handleCancel = (item: HistoryItem) => {
    if (item.type === 'receivable') {
      updateReceivableStatusMutation.mutate({
        id: item.id,
        status: 'canceled'
      });
    } else {
      updatePayableStatusMutation.mutate({
        id: item.id,
        status: 'canceled'
      });
    }
  };

  const handleDelete = (item: HistoryItem) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      if (item.type === 'receivable') {
        deleteReceivableMutation.mutate(item.id);
      } else {
        deletePayableMutation.mutate(item.id);
      }
    }
  };

  const handleGeneratePDF = () => {
    // Implementação básica para gerar PDF
    toast.info("Função de gerar PDF será implementada em breve");
    console.log('Dados para PDF:', filteredHistory);
  };

  const renderTable = (data: HistoryItem[], emptyMessage: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Projeto/Etapa</TableHead>
          <TableHead>Entidade</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Atualizado em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map(item => (
            <TableRow key={`${item.type}-${item.id}`}>
              <TableCell>
                {format(new Date(item.due_date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {item.description}
              </TableCell>
              <TableCell>
                {item.project_name && (
                  <div className="font-medium">{item.project_name}</div>
                )}
                {item.stage_name && (
                  <div className="text-sm text-muted-foreground">{item.stage_name}</div>
                )}
              </TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(item.amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(item.status)}
                {item.payment_date && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(item.payment_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  {item.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsReceived(item)}
                      className="text-green-600 hover:text-green-700"
                      title={item.type === 'receivable' ? 'Marcar como recebido' : 'Marcar como pago'}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status !== 'canceled' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(item)}
                      className="text-orange-600 hover:text-orange-700"
                      title="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item)}
                    className="text-red-600 hover:text-red-700"
                    title="Excluir"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0" size="full">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Histórico Financeiro</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[80vh]">
          <FinancialHistoryFilters
            startDate={startDate}
            endDate={endDate}
            status={statusFilter}
            consultant={consultantFilter}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onStatusChange={setStatusFilter}
            onConsultantChange={setConsultantFilter}
            onGeneratePDF={handleGeneratePDF}
            consultants={consultants}
          />
          
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="text-center py-8">Carregando histórico...</div>
            ) : (
              <Tabs defaultValue="receivables" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="receivables" className="relative">
                    Contas a Receber
                    {receivables.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {receivables.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="payables" className="relative">
                    Contas a Pagar
                    {payables.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {payables.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="receivables" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {receivables.length} de {history.filter(h => h.type === 'receivable').length} registros de contas a receber
                  </div>
                  {renderTable(receivables, "Nenhuma conta a receber encontrada com os filtros aplicados")}
                </TabsContent>
                
                <TabsContent value="payables" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {payables.length} de {history.filter(h => h.type === 'payable').length} registros de contas a pagar
                  </div>
                  {renderTable(payables, "Nenhuma conta a pagar encontrada com os filtros aplicados")}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialHistoryModal;
