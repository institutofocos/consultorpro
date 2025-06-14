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
  const createManualTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      console.log('Creating transaction with data:', transaction);
      
      // Validar e limpar dados UUID antes de enviar
      const cleanTransaction = {
        ...transaction,
        client_id: transaction.client_id || null,
        consultant_id: transaction.consultant_id || null,
        project_id: transaction.project_id || null,
        tag_id: transaction.tag_id || null,
        category_id: null,
        subcategory_id: null,
        payment_method_id: null,
      };
      
      console.log('Clean transaction data:', cleanTransaction);
      
      // Se for transação recorrente, criar múltiplas transações
      if (cleanTransaction.is_recurring && cleanTransaction.recurrence_interval) {
        const { createRecurringTransactions } = await import('@/integrations/supabase/recurring-transactions');
        return await createRecurringTransactions(cleanTransaction, cleanTransaction.installments || 12);
      }
      
      // Se for parcelamento, criar múltiplas transações com valores divididos
      if (cleanTransaction.installments && cleanTransaction.installments > 1 && !cleanTransaction.is_recurring) {
        const { createInstallmentTransactions } = await import('@/integrations/supabase/recurring-transactions');
        return await createInstallmentTransactions(cleanTransaction, cleanTransaction.installments);
      }
      
      // Transação única
      const result = await createManualTransaction(cleanTransaction);
      
      // Se for receita, criar entrada em accounts_receivable
      if (cleanTransaction.type === 'income') {
        const { supabase } = await import('@/integrations/supabase/client');
        const receivableData = {
          description: cleanTransaction.description,
          amount: cleanTransaction.amount,
          due_date: format(cleanTransaction.due_date, 'yyyy-MM-dd'),
          status: cleanTransaction.status === 'received' ? 'received' : 'pending',
          client_id: cleanTransaction.client_id,
          project_id: cleanTransaction.project_id,
          consultant_id: cleanTransaction.consultant_id,
          payment_date: cleanTransaction.payment_date ? format(cleanTransaction.payment_date, 'yyyy-MM-dd') : null
        };
        
        console.log('Creating single accounts_receivable entry:', receivableData);
        
        const { error: receivableError } = await supabase
          .from('accounts_receivable')
          .insert(receivableData);
          
        if (receivableError) {
          console.error('Error creating accounts_receivable:', receivableError);
          throw receivableError;
        }
      }
      
      // Se for despesa, criar entrada em accounts_payable
      if (cleanTransaction.type === 'expense') {
        const { supabase } = await import('@/integrations/supabase/client');
        const payableData = {
          description: cleanTransaction.description,
          amount: cleanTransaction.amount,
          due_date: format(cleanTransaction.due_date, 'yyyy-MM-dd'),
          status: cleanTransaction.status === 'paid' ? 'paid' : 'pending',
          consultant_id: cleanTransaction.consultant_id,
          project_id: cleanTransaction.project_id,
          payment_date: cleanTransaction.payment_date ? format(cleanTransaction.payment_date, 'yyyy-MM-dd') : null
        };
        
        console.log('Creating single accounts_payable entry:', payableData);
        
        const { error: payableError } = await supabase
          .from('accounts_payable')
          .insert(payableData);
          
        if (payableError) {
          console.error('Error creating accounts_payable:', payableError);
          throw payableError;
        }
      }
      
      return result;
    },
    onSuccess: () => {
      toast.success("Transação(ões) criada(s) com sucesso");
      // Invalidar apenas as queries das contas a pagar/receber e resumo financeiro
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      console.error('Error in createManualTransactionMutation:', error);
      toast.error("Erro ao criar transação: " + (error.message || 'Erro desconhecido'));
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
    console.log('Transaction data received:', data);
    
    // Format dates correctly for the database
    const formattedData = {
      ...data,
      due_date: format(data.due_date, 'yyyy-MM-dd'),
      payment_date: data.payment_date ? format(data.payment_date, 'yyyy-MM-dd') : null
    };
    
    console.log('Formatted transaction data:', formattedData);
    
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
        clients={clients || []}
        consultants={consultants || []}
        projects={projects || []}
        tags={tags || []}
      />
    </div>
  );
};

export default FinancialPage;
