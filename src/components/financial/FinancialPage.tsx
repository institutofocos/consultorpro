
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { toast } from 'sonner';
import { 
  fetchFinancialSummary,
  fetchFinancialTransactions,
  fetchManualTransactions, 
  fetchAccountsPayable,
  fetchAccountsReceivable,
  updateTransactionStatus,
  createManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
  FinancialFilter
} from "@/integrations/supabase/financial";
import { fetchConsultants } from "@/integrations/supabase/consultants";
import { fetchServices } from "@/integrations/supabase/services";
import { fetchClients } from "@/integrations/supabase/clients";
import { fetchProjects } from "@/integrations/supabase/projects";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import FinancialSummary from "./FinancialSummary";
import FinancialFilters from "./FinancialFilters";
import FinancialTabs from "./FinancialTabs";
import AccountsPayableReceivable from "./AccountsPayableReceivable";
import ManualTransactionForm from "./ManualTransactionForm";

const FinancialPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FinancialFilter>({});
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Fetch financial data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', filters],
    queryFn: () => fetchFinancialSummary(filters),
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: () => fetchFinancialTransactions(filters),
  });

  const { data: manualTransactions, isLoading: manualTransactionsLoading } = useQuery({
    queryKey: ['manual-transactions', filters],
    queryFn: () => fetchManualTransactions(filters),
  });

  const { data: payables, isLoading: payablesLoading } = useQuery({
    queryKey: ['accounts-payable', filters],
    queryFn: () => fetchAccountsPayable(filters),
  });

  const { data: receivables, isLoading: receivablesLoading } = useQuery({
    queryKey: ['accounts-receivable', filters],
    queryFn: () => fetchAccountsReceivable(filters),
  });

  // Fetch auxiliary data
  const { data: consultants, isLoading: consultantsLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.from('tags').select('id, name');
      return data || [];
    },
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'completed' | 'pending' | 'canceled', paymentDate?: string }) => 
      updateTransactionStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      // Invalidar todas as queries relacionadas ao financeiro para sincronizar
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['manual-transactions'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const createManualTransactionMutation = useMutation({
    mutationFn: createManualTransaction,
    onSuccess: () => {
      toast.success("Transação criada com sucesso");
      // Invalidar todas as queries relacionadas ao financeiro para sincronizar
      queryClient.invalidateQueries({ queryKey: ['manual-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const updateManualTransactionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => updateManualTransaction(id, data),
    onSuccess: () => {
      toast.success("Transação atualizada com sucesso");
      // Invalidar todas as queries relacionadas ao financeiro para sincronizar
      queryClient.invalidateQueries({ queryKey: ['manual-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  const deleteManualTransactionMutation = useMutation({
    mutationFn: deleteManualTransaction,
    onSuccess: () => {
      toast.success("Transação excluída com sucesso");
      // Invalidar todas as queries relacionadas ao financeiro para sincronizar
      queryClient.invalidateQueries({ queryKey: ['manual-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      queryClient.invalidateQueries({ queryKey: ['financial-transactions'] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });

  // Event handlers
  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  const handleStatusChange = (id: string, status: 'completed' | 'pending' | 'canceled') => {
    if (status === 'completed') {
      setSelectedTransaction(id);
      setIsMarkingPaid(true);
    } else {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;
    
    await updateStatusMutation.mutate({
      id: selectedTransaction, 
      status: 'completed',
      paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
    });
    
    setIsMarkingPaid(false);
    setSelectedTransaction(null);
  };

  const handleAddTransaction = async (data: any) => {
    // Format dates correctly for the database
    const formattedData = {
      ...data,
      due_date: format(data.due_date, 'yyyy-MM-dd'),
      payment_date: data.payment_date ? format(data.payment_date, 'yyyy-MM-dd') : null
    };
    
    if (editingTransaction) {
      await updateManualTransactionMutation.mutate({ 
        id: editingTransaction.id, 
        data: formattedData 
      });
      setEditingTransaction(null);
    } else {
      await createManualTransactionMutation.mutate(formattedData);
    }
    
    setShowAddTransaction(false);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowAddTransaction(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteManualTransactionMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle de receitas e pagamentos</p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null);
            setShowAddTransaction(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Summary Cards */}
      <FinancialSummary
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Filters */}
      <FinancialFilters
        consultants={consultants || []}
        services={services || []}
        filters={{
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined,
          consultantId: filters.consultantId,
          serviceId: filters.serviceId,
        }}
        isLoading={{
          consultants: consultantsLoading,
          services: servicesLoading,
        }}
        onFilterChange={handleFilterChange}
        onFilterReset={handleFilterReset}
      />

      {/* Warning about automatic data */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Transações do Sistema</AlertTitle>
        <AlertDescription>
          As transações do sistema são geradas automaticamente a partir das etapas dos projetos. 
          Para criar lançamentos manuais, use o botão "Novo Lançamento". Todas as alterações são automaticamente 
          sincronizadas entre as seções de transações e contas a pagar/receber.
        </AlertDescription>
      </Alert>

      {/* Transactions Tables */}
      <FinancialTabs
        automatedTransactions={{
          data: transactions,
          isLoading: transactionsLoading,
        }}
        manualTransactions={{
          data: manualTransactions,
          isLoading: manualTransactionsLoading,
        }}
        onStatusChange={handleStatusChange}
        onEditManualTransaction={handleEditTransaction}
        onDeleteManualTransaction={handleDeleteTransaction}
      />

      {/* Accounts Payable/Receivable */}
      <AccountsPayableReceivable
        payables={{
          data: payables,
          isLoading: payablesLoading,
        }}
        receivables={{
          data: receivables,
          isLoading: receivablesLoading,
        }}
      />

      {/* Payment Dialog */}
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
                    <Calendar className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingPaid(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPayment}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Transaction Form Dialog */}
      <ManualTransactionForm
        isOpen={showAddTransaction}
        onClose={() => {
          setShowAddTransaction(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleAddTransaction}
        transaction={editingTransaction}
        clients={clients || []}
        consultants={consultants || []}
        projects={projects || []}
        tags={tags || []}
      />
    </div>
  );
};

export default FinancialPage;
