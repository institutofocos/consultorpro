
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
  let query = supabase
    .from('financial_transactions')
    .select(`
      *,
      projects:project_id (
        name,
        client_id,
        service_id,
        clients:client_id (name),
        services:service_id (name)
      ),
      consultants:consultant_id (name)
    `);

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  
  if (filters.timeframe) {
    const today = new Date();
    let startDate;
    
    switch (filters.timeframe) {
      case 'today':
        query = query.eq('due_date', today.toISOString().split('T')[0]);
        break;
      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        query = query
          .gte('due_date', startOfWeek.toISOString().split('T')[0])
          .lte('due_date', endOfWeek.toISOString().split('T')[0]);
        break;
      }
      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        query = query
          .gte('due_date', startOfMonth.toISOString().split('T')[0])
          .lte('due_date', endOfMonth.toISOString().split('T')[0]);
        break;
      }
    }
  }
  
  if (filters.consultantId) {
    query = query.eq('consultant_id', filters.consultantId);
  }

  if (filters.serviceId) {
    query = query.eq('project.service_id', filters.serviceId);
  }

  // Sort by date
  query = query.order('due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching financial transactions:', error);
    throw error;
  }

  // Transform data for easier consumption
  return data.map(item => ({
    ...item,
    project_name: item.projects?.name || '',
    consultant_name: item.consultants?.name || '',
    client_name: item.projects?.clients?.name || ''
  }));
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
