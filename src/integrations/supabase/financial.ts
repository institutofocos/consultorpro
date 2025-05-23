
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

export type FinancialFilter = {
  status?: string[];
  timeframe?: 'today' | 'this_week' | 'this_month' | 'all';
  consultantId?: string;
  serviceId?: string;
};

export const fetchFinancialTransactions = async (filters: FinancialFilter = {}): Promise<FinancialTransaction[]> => {
  try {
    // Use a simpler query format first 
    const query = supabase
      .from('financial_transactions')
      .select();

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      query.in('status', filters.status);
    }
    
    if (filters.timeframe) {
      const today = new Date();
      
      switch (filters.timeframe) {
        case 'today':
          query.eq('due_date', today.toISOString().split('T')[0]);
          break;
        case 'this_week': {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(today);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          
          query
            .gte('due_date', startOfWeek.toISOString().split('T')[0])
            .lte('due_date', endOfWeek.toISOString().split('T')[0]);
          break;
        }
        case 'this_month': {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          
          query
            .gte('due_date', startOfMonth.toISOString().split('T')[0])
            .lte('due_date', endOfMonth.toISOString().split('T')[0]);
          break;
        }
      }
    }
    
    if (filters.consultantId) {
      query.eq('consultant_id', filters.consultantId);
    }

    // Sort by date
    query.order('due_date', { ascending: true });

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
        const { data: projectData } = await supabase
          .from('projects')
          .select('name, client_id, service_id')
          .eq('id', transaction.project_id)
          .single();
          
        if (projectData) {
          projectName = projectData.name;
          
          // Get client name if client_id exists
          if (projectData.client_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('name')
              .eq('id', projectData.client_id)
              .single();
              
            if (clientData) {
              clientName = clientData.name;
            }
          }
        }
      }
      
      // Get consultant name if consultant_id exists
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
