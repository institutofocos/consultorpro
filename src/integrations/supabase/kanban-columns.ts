
import { supabase } from './client';

export interface KanbanColumn {
  id: string;
  column_id: string;
  title: string;
  bg_color: string;
  order_index: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const fetchKanbanColumns = async (): Promise<KanbanColumn[]> => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .order('order_index');

  if (error) {
    console.error('Error fetching kanban columns:', error);
    throw error;
  }

  return data || [];
};

export const createKanbanColumn = async (column: Omit<KanbanColumn, 'id' | 'created_at' | 'updated_at'>): Promise<KanbanColumn> => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .insert(column)
    .select()
    .single();

  if (error) {
    console.error('Error creating kanban column:', error);
    throw error;
  }

  return data;
};

export const updateKanbanColumn = async (id: string, updates: Partial<KanbanColumn>): Promise<KanbanColumn> => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating kanban column:', error);
    throw error;
  }

  return data;
};

export const deleteKanbanColumn = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting kanban column:', error);
    throw error;
  }
};

export const updateColumnOrder = async (columns: { id: string; order_index: number }[]): Promise<void> => {
  const updates = columns.map(col => 
    supabase
      .from('kanban_columns')
      .update({ order_index: col.order_index })
      .eq('id', col.id)
  );

  const results = await Promise.all(updates);
  
  for (const result of results) {
    if (result.error) {
      console.error('Error updating column order:', result.error);
      throw result.error;
    }
  }
};

// Função para gerar cores aleatórias para novas colunas
export const getRandomColumnColor = (): string => {
  const colors = [
    'bg-purple-50',
    'bg-pink-50',
    'bg-indigo-50',
    'bg-cyan-50',
    'bg-teal-50',
    'bg-orange-50',
    'bg-lime-50',
    'bg-emerald-50',
    'bg-violet-50',
    'bg-fuchsia-50',
    'bg-rose-50',
    'bg-sky-50',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
};
