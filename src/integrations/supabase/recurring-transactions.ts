
import { supabase } from "./client";
import { addMonths, addWeeks, addDays, addYears, format } from 'date-fns';

export interface RecurringTransactionData {
  type: 'income' | 'expense';
  description: string;
  amount: number;
  due_date: string;
  payment_date?: string | null;
  status: 'pending' | 'paid' | 'received' | 'canceled';
  category_id?: string | null;
  subcategory_id?: string | null;
  payment_method_id?: string | null;
  is_fixed_expense?: boolean;
  client_id?: string | null;
  consultant_id?: string | null;
  project_id?: string | null;
  tag_id?: string | null;
  receipt_url?: string | null;
  recurrence_interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  installments?: number | null;
  current_installment?: number | null;
}

export const createRecurringTransactions = async (
  transactionData: RecurringTransactionData,
  recurringTimes: number
) => {
  const transactions = [];
  const baseDate = new Date(transactionData.due_date);
  
  console.log('Creating recurring transactions:', {
    baseDate,
    recurringTimes,
    interval: transactionData.recurrence_interval,
    type: transactionData.type,
    amount: transactionData.amount
  });

  for (let i = 0; i < recurringTimes; i++) {
    let nextDate = baseDate;
    
    // Calcular a próxima data baseada no intervalo
    switch (transactionData.recurrence_interval) {
      case 'daily':
        nextDate = addDays(baseDate, i);
        break;
      case 'weekly':
        nextDate = addWeeks(baseDate, i);
        break;
      case 'monthly':
        nextDate = addMonths(baseDate, i);
        break;
      case 'yearly':
        nextDate = addYears(baseDate, i);
        break;
    }

    const transaction = {
      ...transactionData,
      due_date: format(nextDate, 'yyyy-MM-dd'),
      is_recurring: true,
      current_installment: i + 1,
      installments: recurringTimes
    };

    transactions.push(transaction);
  }

  console.log('Inserting recurring transactions:', transactions.length, 'transactions');

  // Inserir todas as transações
  const { data, error } = await supabase
    .from('manual_transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Error creating recurring transactions:', error);
    throw error;
  }

  console.log('Successfully created recurring transactions:', data?.length);

  // Criar entradas correspondentes em accounts_payable/receivable
  if (data) {
    for (const transaction of data) {
      try {
        if (transaction.type === 'income') {
          const receivableData = {
            description: `${transaction.description} (${transaction.current_installment}/${transaction.installments})`,
            amount: transaction.amount,
            due_date: transaction.due_date,
            status: transaction.status === 'received' ? 'received' : 'pending',
            client_id: transaction.client_id,
            project_id: transaction.project_id,
            consultant_id: transaction.consultant_id,
            payment_date: transaction.payment_date
          };
          
          console.log('Creating accounts_receivable entry:', receivableData);
          
          const { error: receivableError } = await supabase
            .from('accounts_receivable')
            .insert(receivableData);
            
          if (receivableError) {
            console.error('Error creating accounts_receivable:', receivableError);
          }
        }
        
        if (transaction.type === 'expense') {
          const payableData = {
            description: `${transaction.description} (${transaction.current_installment}/${transaction.installments})`,
            amount: transaction.amount,
            due_date: transaction.due_date,
            status: transaction.status === 'paid' ? 'paid' : 'pending',
            consultant_id: transaction.consultant_id,
            project_id: transaction.project_id,
            payment_date: transaction.payment_date
          };
          
          console.log('Creating accounts_payable entry:', payableData);
          
          const { error: payableError } = await supabase
            .from('accounts_payable')
            .insert(payableData);
            
          if (payableError) {
            console.error('Error creating accounts_payable:', payableError);
          }
        }
      } catch (entryError) {
        console.error('Error creating accounts entry for transaction:', transaction.id, entryError);
      }
    }
  }

  return data;
};

export const createInstallmentTransactions = async (
  transactionData: RecurringTransactionData,
  installments: number
) => {
  const transactions = [];
  const baseDate = new Date(transactionData.due_date);
  const installmentAmount = transactionData.amount / installments;
  
  console.log('Creating installment transactions:', {
    baseDate,
    installments,
    installmentAmount,
    type: transactionData.type,
    totalAmount: transactionData.amount
  });

  for (let i = 0; i < installments; i++) {
    // Para parcelamentos, criar uma por mês
    const nextDate = addMonths(baseDate, i);

    const transaction = {
      ...transactionData,
      amount: installmentAmount,
      due_date: format(nextDate, 'yyyy-MM-dd'),
      is_recurring: false,
      current_installment: i + 1,
      installments: installments
    };

    transactions.push(transaction);
  }

  console.log('Inserting installment transactions:', transactions.length);

  // Inserir todas as transações
  const { data, error } = await supabase
    .from('manual_transactions')
    .insert(transactions)
    .select();

  if (error) {
    console.error('Error creating installment transactions:', error);
    throw error;
  }

  console.log('Successfully created installment transactions:', data?.length);

  // Criar entradas correspondentes em accounts_payable/receivable
  if (data) {
    for (const transaction of data) {
      try {
        if (transaction.type === 'income') {
          const receivableData = {
            description: `${transaction.description} (${transaction.current_installment}/${transaction.installments})`,
            amount: transaction.amount,
            due_date: transaction.due_date,
            status: transaction.status === 'received' ? 'received' : 'pending',
            client_id: transaction.client_id,
            project_id: transaction.project_id,
            consultant_id: transaction.consultant_id,
            payment_date: transaction.payment_date
          };
          
          console.log('Creating accounts_receivable entry for installment:', receivableData);
          
          const { error: receivableError } = await supabase
            .from('accounts_receivable')
            .insert(receivableData);
            
          if (receivableError) {
            console.error('Error creating accounts_receivable for installment:', receivableError);
          }
        }
        
        if (transaction.type === 'expense') {
          const payableData = {
            description: `${transaction.description} (${transaction.current_installment}/${transaction.installments})`,
            amount: transaction.amount,
            due_date: transaction.due_date,
            status: transaction.status === 'paid' ? 'paid' : 'pending',
            consultant_id: transaction.consultant_id,
            project_id: transaction.project_id,
            payment_date: transaction.payment_date
          };
          
          console.log('Creating accounts_payable entry for installment:', payableData);
          
          const { error: payableError } = await supabase
            .from('accounts_payable')
            .insert(payableData);
            
          if (payableError) {
            console.error('Error creating accounts_payable for installment:', payableError);
          }
        }
      } catch (entryError) {
        console.error('Error creating accounts entry for installment transaction:', transaction.id, entryError);
      }
    }
  }

  return data;
};
