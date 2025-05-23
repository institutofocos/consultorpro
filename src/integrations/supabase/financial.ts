
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
    const query = supabase
      .from('financial_transactions')
      .select(`
        *,
        projects!project_id (
          name,
          client_id,
          service_id,
          clients!client_id (name)
        ),
        consultants!consultant_id (name)
      `);

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

    if (filters.serviceId) {
      // We need to filter by projects that have the specified service_id
      query.eq('projects.service_id', filters.serviceId);
    }

    // Sort by date
    query.order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching financial transactions:', error);
      throw error;
    }

    // Transform data for easier consumption
    const result: FinancialTransaction[] = (data || []).map((item: any) => {
      const projects = item.projects || {};
      const consultants = item.consultants || {};
      const clients = projects?.clients || {};
      
      return {
        id: item.id,
        project_id: item.project_id,
        transaction_type: item.transaction_type,
        amount: item.amount,
        net_amount: item.net_amount,
        due_date: item.due_date,
        payment_date: item.payment_date,
        stage_name: item.stage_name,
        consultant_id: item.consultant_id,
        is_support_consultant: item.is_support_consultant,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        project_name: projects?.name || '',
        consultant_name: consultants?.name || '',
        client_name: clients?.name || ''
      };
    });

    return result;
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
