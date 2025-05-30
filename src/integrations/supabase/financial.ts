
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
  status: 'pending' | 'paid' | 'canceled';
  consultant_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  consultant_name?: string;
  project_name?: string;
};

export type AccountsReceivable = {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'received' | 'canceled';
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
    
    let payableQuery = supabase.from('accounts_payable').select('*');
    let receivableQuery = supabase.from('accounts_receivable').select('*');
    
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
    
    // Calcular totais
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
      let projectName = '';
      
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
      
      // Get project name
      if (payable.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name')
          .eq('id', payable.project_id)
          .single();
          
        if (projectData) {
          projectName = projectData.name;
        }
      }
      
      payables.push({
        ...payable,
        consultant_name: consultantName,
        project_name: projectName
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
  const updates: any = { status };
  
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
