import { supabase } from "./client";

export type FinancialTransaction = {
  id: string;
  project_id: string;
  transaction_type: 'expected_income' | 'received_payment' | 'consultant_payment' | 'canceled';
  amount: number;
  net_amount: number;
  due_date: string;
  payment_date: string | null;
  stage_name: string;
  consultant_id: string | null;
  is_support_consultant: boolean;
  status: 'pending' | 'completed' | 'canceled';
  created_at: string;
  updated_at: string;
  project_name?: string;
  consultant_name?: string;
  client_name?: string;
};

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
    const { startDate, endDate, consultantId, serviceId } = filters;
    
    const { data, error } = await supabase.rpc('calculate_financial_summary', {
      start_date: startDate || null,
      end_date: endDate || null,
      consultant_filter: consultantId || null,
      service_filter: serviceId || null
    });

    if (error) {
      console.error('Error fetching financial summary:', error);
      throw error;
    }

    return data && data.length > 0 
      ? data[0] as FinancialSummary 
      : { 
          total_expected: 0, 
          total_received: 0, 
          total_pending: 0, 
          consultant_payments_made: 0, 
          consultant_payments_pending: 0 
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

export const fetchFinancialTransactions = async (filters: FinancialFilter = {}): Promise<FinancialTransaction[]> => {
  try {
    const { startDate, endDate, consultantId, serviceId } = filters;
    
    // Use a simpler query format first 
    let query = supabase
      .from('financial_transactions')
      .select();
    
    // Apply date filters if provided
    if (startDate) {
      query = query.gte('due_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('due_date', endDate);
    }
    
    if (consultantId) {
      query = query.eq('consultant_id', consultantId);
    }

    // Sort by date
    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financial transactions:', error);
      throw error;
    }

    // Fetch additional data for each transaction
    const transactions: FinancialTransaction[] = [];
    
    for (const transaction of (data || [])) {
      let projectName = '';
      let consultantName = '';
      let clientName = '';
      
      // Get project details if project_id exists
      if (transaction.project_id) {
        const projectQuery = supabase
          .from('projects')
          .select('name, client_id, service_id')
          .eq('id', transaction.project_id)
          .single();
          
        const { data: projectData, error: projectError } = await projectQuery;
          
        if (projectData && !projectError) {
          projectName = projectData.name;
          
          // Get client name if client_id exists
          if (projectData.client_id) {
            const clientQuery = supabase
              .from('clients')
              .select('name')
              .eq('id', projectData.client_id)
              .single();
              
            const { data: clientData } = await clientQuery;
              
            if (clientData) {
              clientName = clientData.name;
            }
          }
          
          // Filter by service if needed
          if (serviceId && projectData.service_id !== serviceId) {
            continue; // Skip this transaction if service doesn't match
          }
        }
      }
      
      // Get consultant name if consultant_id exists
      if (transaction.consultant_id) {
        const consultantQuery = supabase
          .from('consultants')
          .select('name')
          .eq('id', transaction.consultant_id)
          .single();
          
        const { data: consultantData } = await consultantQuery;
          
        if (consultantData) {
          consultantName = consultantData.name;
        }
      }
      
      transactions.push({
        ...transaction,
        project_name: projectName,
        consultant_name: consultantName,
        client_name: clientName
      } as FinancialTransaction);
    }

    return transactions;
  } catch (error) {
    console.error('Error in fetchFinancialTransactions:', error);
    return [];
  }
};

export const fetchManualTransactions = async (filters: FinancialFilter = {}): Promise<ManualTransaction[]> => {
  try {
    const { startDate, endDate, consultantId } = filters;
    
    let query = supabase.from('manual_transactions').select();
    
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
    
    const transactions: ManualTransaction[] = [];
    
    for (const transaction of (data || [])) {
      let clientName = '';
      let consultantName = '';
      let projectName = '';
      let tagName = '';
      
      // Get client name
      if (transaction.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('name')
          .eq('id', transaction.client_id)
          .single();
          
        if (clientData) {
          clientName = clientData.name;
        }
      }
      
      // Get consultant name
      if (transaction.consultant_id) {
        const { data: consultantData } = await supabase
          .from('consultants')
          .select('name')
          .eq('id', transaction.consultant_id)
          .single();
          
        if (consultantData) {
          consultantName = consultantData.name;
        }
      }
      
      // Get project name
      if (transaction.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('name')
          .eq('id', transaction.project_id)
          .single();
          
        if (projectData) {
          projectName = projectData.name;
        }
      }
      
      // Get tag name
      if (transaction.tag_id) {
        const { data: tagData } = await supabase
          .from('tags')
          .select('name')
          .eq('id', transaction.tag_id)
          .single();
          
        if (tagData) {
          tagName = tagData.name;
        }
      }
      
      transactions.push({
        ...transaction,
        client_name: clientName,
        consultant_name: consultantName,
        project_name: projectName,
        tag_name: tagName
      } as ManualTransaction);
    }
    
    return transactions;
  } catch (error) {
    console.error('Error in fetchManualTransactions:', error);
    return [];
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

export const updateTransactionStatus = async (id: string, status: 'pending' | 'completed' | 'canceled', paymentDate?: string) => {
  const updates: any = { status };
  
  if (paymentDate) {
    updates.payment_date = paymentDate;
  }

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }

  return data;
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
