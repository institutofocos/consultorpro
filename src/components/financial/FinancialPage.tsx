import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from 'sonner';
import { 
  fetchFinancialSummary,
  fetchAccountsPayable,
  fetchAccountsReceivable,
  createManualTransaction,
  updateManualTransaction,
  deleteManualTransaction,
  FinancialFilter
} from "@/integrations/supabase/financial";
import { fetchConsultants } from "@/integrations/supabase/consultants";
import { fetchServices } from "@/integrations/supabase/services";
import { fetchClients } from "@/integrations/supabase/clients";
import { fetchProjects } from "@/integrations/supabase/projects";
import FinancialSummary from "./FinancialSummary";
import FinancialFilters from "./FinancialFilters";
import AccountsPayableReceivable from "./AccountsPayableReceivable";
import ManualTransactionForm from "./ManualTransactionForm";

const FinancialPage = () => {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filters, setFilters] = useState<FinancialFilter>({});
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

  // Update filters when month changes
  const getMonthFilters = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return {
      ...filters,
      startDate: format(startOfMonth, 'yyyy-MM-dd'),
      endDate: format(endOfMonth, 'yyyy-MM-dd')
    };
  };

  const activeFilters = getMonthFilters();

  // Fetch financial data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['financial-summary', activeFilters],
    queryFn: () => fetchFinancialSummary(activeFilters),
  });

  const { data: payables, isLoading: payablesLoading } = useQuery({
    queryKey: ['accounts-payable', activeFilters],
    queryFn: () => fetchAccountsPayable(activeFilters),
  });

  const { data: receivables, isLoading: receivablesLoading } = useQuery({
    queryKey: ['accounts-receivable', activeFilters],
    queryFn: () => fetchAccountsReceivable(activeFilters),
  });

  // Fetch auxiliary data
  const { data: consultants = [], isLoading: consultantsLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
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
  const createManualTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      // Criar a transação manual
      const result = await createManualTransaction(transaction);
      
      // Se for receita, criar entrada em accounts_receivable
      if (transaction.type === 'income') {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('accounts_receivable').insert({
          description: transaction.description,
          amount: transaction.amount,
          due_date: transaction.due_date,
          status: transaction.status === 'received' ? 'received' : 'pending',
          client_id: transaction.client_id,
          project_id: transaction.project_id,
          consultant_id: transaction.consultant_id,
          payment_date: transaction.payment_date
        });
      }
      
      // Se for despesa, criar entrada em accounts_payable
      if (transaction.type === 'expense') {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('accounts_payable').insert({
          description: transaction.description,
          amount: transaction.amount,
          due_date: transaction.due_date,
          status: transaction.status === 'paid' ? 'paid' : 'pending',
          consultant_id: transaction.consultant_id,
          project_id: transaction.project_id,
          payment_date: transaction.payment_date
        });
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("Transação criada com sucesso");
      // Invalidar apenas as queries das contas a pagar/receber e resumo financeiro
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao criar transação: " + error.message);
    },
  });

  const updateManualTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const result = await updateManualTransaction(id, data);
      
      // Atualizar também as entradas relacionadas em accounts_payable/receivable
      const { supabase } = await import('@/integrations/supabase/client');
      
      if (data.type === 'income') {
        await supabase
          .from('accounts_receivable')
          .update({
            description: data.description,
            amount: data.amount,
            due_date: data.due_date,
            status: data.status === 'received' ? 'received' : 'pending',
            payment_date: data.payment_date
          })
          .eq('description', data.description);
      }
      
      if (data.type === 'expense') {
        await supabase
          .from('accounts_payable')
          .update({
            description: data.description,
            amount: data.amount,
            due_date: data.due_date,
            status: data.status === 'paid' ? 'paid' : 'pending',
            payment_date: data.payment_date
          })
          .eq('description', data.description);
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("Transação atualizada com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  const deleteManualTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      // Buscar a transação antes de deletar para saber qual entrada remover
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: transaction } = await supabase
        .from('manual_transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      const result = await deleteManualTransaction(id);
      
      if (transaction) {
        // Remover entrada correspondente em accounts_payable/receivable
        if (transaction.type === 'income') {
          await supabase
            .from('accounts_receivable')
            .delete()
            .eq('description', transaction.description);
        }
        
        if (transaction.type === 'expense') {
          await supabase
            .from('accounts_payable')
            .delete()
            .eq('description', transaction.description);
        }
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("Transação excluída com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
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

  const handleMonthChange = (newDate: Date) => {
    setCurrentMonth(newDate);
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
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setShowAddTransaction(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <FinancialSummary
        summary={summary}
        isLoading={summaryLoading}
      />

      {/* Filters */}
      <FinancialFilters
        consultants={consultants}
        services={services}
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
        currentMonth={currentMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Manual Transaction Form Dialog */}
      <ManualTransactionForm
        isOpen={showAddTransaction}
        onClose={() => {
          setShowAddTransaction(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleAddTransaction}
        transaction={editingTransaction}
        clients={clients}
        consultants={consultants}
        projects={projects}
        tags={tags}
      />
    </div>
  );
};

export default FinancialPage;
