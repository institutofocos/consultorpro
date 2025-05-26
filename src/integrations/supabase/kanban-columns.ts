
import { supabase } from './client';

export interface KanbanColumn {
  id: string;
  column_id: string;
  title: string;
  bg_color: string;
  order_index: number;
  is_default: boolean;
  is_completion_column: boolean;
  column_type: 'normal' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

export const fetchKanbanColumns = async (): Promise<KanbanColumn[]> => {
  try {
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('*')
      .order('order_index');

    if (error) throw error;

    return (data || []).map(column => ({
      id: column.id,
      column_id: column.column_id,
      title: column.title,
      bg_color: column.bg_color,
      order_index: column.order_index,
      is_default: column.is_default,
      is_completion_column: column.is_completion_column || false,
      column_type: (column.column_type as 'normal' | 'completed' | 'cancelled') || 'normal',
      created_at: column.created_at,
      updated_at: column.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching kanban columns:', error);
    return [];
  }
};

export const createKanbanColumn = async (column: Omit<KanbanColumn, 'id' | 'created_at' | 'updated_at'>): Promise<KanbanColumn | null> => {
  try {
    const { data, error } = await supabase
      .from('kanban_columns')
      .insert({
        column_id: column.column_id,
        title: column.title,
        bg_color: column.bg_color,
        order_index: column.order_index,
        is_default: column.is_default,
        is_completion_column: column.is_completion_column || false,
        column_type: column.column_type || 'normal',
      })
      .select()
      .single();

    if (error) throw error;
    return data as KanbanColumn;
  } catch (error) {
    console.error('Error creating kanban column:', error);
    return null;
  }
};

export const updateKanbanColumn = async (id: string, updates: Partial<KanbanColumn>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('kanban_columns')
      .update({
        title: updates.title,
        bg_color: updates.bg_color,
        order_index: updates.order_index,
        is_default: updates.is_default,
        is_completion_column: updates.is_completion_column,
        column_type: updates.column_type,
      })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating kanban column:', error);
    throw error;
  }
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

export const updateColumnOrder = async (updates: { id: string; order_index: number }[]): Promise<void> => {
  console.log('Updating column order:', updates);
  
  for (const update of updates) {
    const { error } = await supabase
      .from('kanban_columns')
      .update({ order_index: update.order_index })
      .eq('id', update.id);
    
    if (error) {
      console.error(`Error updating column ${update.id}:`, error);
      throw error;
    }
  }
  
  console.log('Column order updated successfully');
};

export const swapColumnPositions = async (column1Id: string, column2Id: string): Promise<void> => {
  const { data: columns, error: fetchError } = await supabase
    .from('kanban_columns')
    .select('id, order_index')
    .in('id', [column1Id, column2Id]);

  if (fetchError || !columns || columns.length !== 2) {
    throw new Error('Error fetching columns for swap');
  }

  const [col1, col2] = columns;
  
  await updateColumnOrder([
    { id: col1.id, order_index: col2.order_index },
    { id: col2.id, order_index: col1.order_index }
  ]);
};

export const reorderColumns = async (columnIds: string[]): Promise<void> => {
  const updates = columnIds.map((id, index) => ({
    id,
    order_index: index
  }));
  
  await updateColumnOrder(updates);
};

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
