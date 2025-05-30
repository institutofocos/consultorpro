import { supabase } from "./client";

export type FinancialSummary = {
  total_expected: number;
  total_received: number;
  total_pending: number;
  consultant_payments_made: number;
  consultant_payments_pending: number;
};

export type ManualTransaction = {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'received' | 'canceled';
  is_recurring: boolean;
  recurrence_interval: 'monthly' | 'quarterly' | 'yearly' | null;
  tag_id: string | null;
  client_id: string | null;
  consultant_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  consultant_name?: string;
  project_name?: string;
  tag_name?: string;
};

export type AccountsPayable = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'canceled' | 'deleted';
  consultant_id: string | null;
  project_id: string | null;
  project_name: string | null;
  stage_id: string | null;
  stage_name: string | null;
  stage_status: string | null;
  valor_de_repasse: number | null;
  created_at: string;
  updated_at: string;
  consultant_name?: string;
};

export type AccountsReceivable = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'received' | 'canceled' | 'deleted';
  client_id: string | null;
  project_id: string | null;
  project_name?: string;
  stage_name?: string;
  stage_status?: string;
  stage_id?: string;
  consultant_id?: string;
  created_at: string;
  updated_at: string;
  client_name?: string;
  consultant_name?: string;
};

export type FinancialFilter = {
  startDate?: string;
  endDate?: string;
  consultantId?: string;
  serviceId?: string;
};

export const fetchFinancialSummary = async (filters: FinancialFilter = {}): Promise<FinancialSummary> => {
  try {
    // Calcular resumo baseado em contas a pagar/receber
    const { startDate, endDate, consultantId } = filters;
    
    let payableQuery = supabase.from('accounts_payable').select('*').neq('status', 'deleted');
    let receivableQuery = supabase.from('accounts_receivable').select('*').neq('status', 'deleted');
    
    if (startDate) {
      payableQuery = payableQuery.gte('due_date', startDate);
      receivableQuery = receivableQuery.gte('due_date', startDate);
    }
    
    if (endDate) {
      payableQuery = payableQuery.lte('due_date', endDate);
      receivableQuery = receivableQuery.lte('due_date', endDate);
    }
    
    if (consultantId) {
      payableQuery = payableQuery.eq('consultant_id', consultantId);
      receivableQuery = receivableQuery.eq('consultant_id', consultantId);
    }
    
    const [payableData, receivableData] = await Promise.all([
      payableQuery,
      receivableQuery
    ]);
    
    const payables = payableData.data || [];
    const receivables = receivableData.data || [];
    
    // Calcular totais - excluindo itens com status 'deleted'
    const totalExpected = receivables.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalReceived = receivables.filter(item => item.status === 'received').reduce((sum, item) => sum + Number(item.amount), 0);
    const totalPending = receivables.filter(item => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0);
    const consultantPaymentsMade = payables.filter(item => item.status === 'paid').reduce((sum, item) => sum + Number(item.amount), 0);
    const consultantPaymentsPending = payables.filter(item => item.status === 'pending').reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      total_expected: totalExpected,
      total_received: totalReceived,
      total_pending: totalPending,
      consultant_payments_made: consultantPaymentsMade,
      consultant_payments_pending: consultantPaymentsPending
    };
  } catch (error) {
    console.error('Error in fetchFinancialSummary:', error);
    return { 
      total_expected: 0, 
      total_received: 0, 
      total_pending: 0, 
      consultant_payments_made: 0, 
      consultant_payments_pending: 0 
    };
  }
};

export const fetchAccountsPayable = async (filters: FinancialFilter = {}): Promise<AccountsPayable[]> => {
  try {
    const { startDate, endDate, consultantId } = filters;
    
    let query = supabase.from('accounts_payable').select();
    
    if (startDate) {
      query = query.gte('due_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('due_date', endDate);
    }
    
    if (consultantId) {
      query = query.eq('consultant_id', consultantId);
    }
    
    query = query.order('due_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const payables: AccountsPayable[] = [];
    
    for (const payable of (data || [])) {
      let consultantName = '';
      
      // Get consultant name
      if (payable.consultant_id) {
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('name')
          .eq('id', payable.consultant_id)
          .single();
          
        if (consultantData) {
          consultantName = consultantData.name;
        }
      }
      
      payables.push({
        ...payable,
        consultant_name: consultantName
      } as AccountsPayable);
    }
    
    return payables;
  } catch (error) {
    console.error('Error in fetchAccountsPayable:', error);
    return [];
  }
};

export const fetchAccountsReceivable = async (filters: FinancialFilter = {}): Promise<AccountsReceivable[]> => {
  try {
    const { startDate, endDate } = filters;
    
    let query = supabase.from('accounts_receivable').select();
    
    if (startDate) {
      query = query.gte('due_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('due_date', endDate);
    }
    
    query = query.order('due_date', { ascending: true });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    const receivables: AccountsReceivable[] = [];
    
    for (const receivable of (data || [])) {
      let clientName = '';
      let consultantName = '';
      
      // Get client name
      if (receivable.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', receivable.client_id)
          .single();
          
        if (clientData) {
          clientName = clientData.name;
        }
      }
      
      // Get consultant name
      if (receivable.consultant_id) {
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('name')
          .eq('id', receivable.consultant_id)
          .single();
          
        if (consultantData) {
          consultantName = consultantData.name;
        }
      }
      
      receivables.push({
        ...receivable,
        client_name: clientName,
        consultant_name: consultantName
      } as AccountsReceivable);
    }
    
    return receivables;
  } catch (error) {
    console.error('Error in fetchAccountsReceivable:', error);
    return [];
  }
};

export const updateAccountsReceivableStatus = async (id: string, status: 'pending' | 'received' | 'canceled', paymentDate?: string) => {
  const updates: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (paymentDate) {
    updates.payment_date = paymentDate;
  }

  const { data, error } = await supabase
    .from('accounts_receivable')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating accounts receivable:', error);
    throw error;
  }

  return data;
};

export const updateAccountsPayableStatus = async (id: string, status: 'pending' | 'paid' | 'canceled', paymentDate?: string) => {
  const updates: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (paymentDate) {
    updates.payment_date = paymentDate;
  }

  const { data, error } = await supabase
    .from('accounts_payable')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating accounts payable:', error);
    throw error;
  }

  return data;
};

export const createManualTransaction = async (transaction: Omit<ManualTransaction, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('manual_transactions')
    .insert(transaction)
    .select();
    
  if (error) {
    console.error('Error creating manual transaction:', error);
    throw error;
  }
  
  return data;
};

export const updateManualTransaction = async (id: string, transaction: Partial<ManualTransaction>) => {
  const updates = {
    ...transaction,
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('manual_transactions')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Error updating manual transaction:', error);
    throw error;
  }
  
  return data;
};

export const deleteManualTransaction = async (id: string) => {
  const { error } = await supabase
    .from('manual_transactions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting manual transaction:', error);
    throw error;
  }
  
  return true;
};

export const deleteAccountsReceivable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update({ 
      status: 'deleted',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error deleting accounts receivable:', error);
    throw error;
  }

  return data;
};

export const deleteAccountsPayable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update({ 
      status: 'deleted',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error deleting accounts payable:', error);
    throw error;
  }

  return data;
};

export const cancelAccountsReceivable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error canceling accounts receivable:', error);
    throw error;
  }

  return data;
};

export const cancelAccountsPayable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update({ 
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error canceling accounts payable:', error);
    throw error;
  }

  return data;
};

export const reactivateAccountsReceivable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update({ 
      status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error reactivating accounts receivable:', error);
    throw error;
  }

  return data;
};

export const reactivateAccountsPayable = async (id: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update({ 
      status: 'pending',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error reactivating accounts payable:', error);
    throw error;
  }

  return data;
};

export const fetchAccountsHistory = async (filters: FinancialFilter = {}) => {
  try {
    const { startDate, endDate, consultantId } = filters;
    
    console.log('Fetching accounts history with filters:', { startDate, endDate, consultantId });
    
    // Buscar todas as contas a receber (incluindo excluídas para o histórico)
    let receivablesQuery = supabase
      .from('accounts_receivable')
      .select(`
        *,
        clients(name)
      `)
      .order('updated_at', { ascending: false });
    
    if (startDate) {
      receivablesQuery = receivablesQuery.gte('due_date', startDate);
    }
    
    if (endDate) {
      receivablesQuery = receivablesQuery.lte('due_date', endDate);
    }

    if (consultantId) {
      receivablesQuery = receivablesQuery.eq('consultant_id', consultantId);
    }

    // Buscar todas as contas a pagar (incluindo excluídas para o histórico)
    let payablesQuery = supabase
      .from('accounts_payable')
      .select(`
        *,
        consultants(name)
      `)
      .order('updated_at', { ascending: false });
    
    if (startDate) {
      payablesQuery = payablesQuery.gte('due_date', startDate);
    }
    
    if (endDate) {
      payablesQuery = payablesQuery.lte('due_date', endDate);
    }

    if (consultantId) {
      payablesQuery = payablesQuery.eq('consultant_id', consultantId);
    }

    const [receivablesData, payablesData] = await Promise.all([
      receivablesQuery,
      payablesQuery
    ]);

    console.log('Raw receivables data:', receivablesData.data?.length || 0, 'items');
    console.log('Raw payables data:', payablesData.data?.length || 0, 'items');

    // Processar contas a receber
    const receivablesHistory = (receivablesData.data || []).map(item => ({
      id: item.id,
      type: 'receivable' as const,
      description: item.description,
      amount: item.amount,
      status: item.status,
      due_date: item.due_date,
      payment_date: item.payment_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      entity_name: item.clients?.name || 'Cliente não informado',
      project_name: item.project_name || '',
      stage_name: item.stage_name || ''
    }));

    // Processar contas a pagar - incluindo todas as entradas (manuais e vinculadas a etapas)
    const payablesHistory = (payablesData.data || []).map(item => ({
      id: item.id,
      type: 'payable' as const,
      description: item.description,
      amount: item.amount,
      status: item.status,
      due_date: item.due_date,
      payment_date: item.payment_date,
      created_at: item.created_at,
      updated_at: item.updated_at,
      entity_name: item.consultants?.name || 'Não informado',
      project_name: item.project_name || '',
      stage_name: item.stage_name || ''
    }));

    // Combinar e ordenar por data de atualização mais recente
    const combinedHistory = [...receivablesHistory, ...payablesHistory]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    console.log('Combined history:', combinedHistory.length, 'total items');
    console.log('Sample items:', combinedHistory.slice(0, 3));

    return combinedHistory;
  } catch (error) {
    console.error('Error fetching accounts history:', error);
    return [];
  }
};
