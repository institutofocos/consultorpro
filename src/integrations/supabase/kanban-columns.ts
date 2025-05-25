
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

export const updateKanbanColumn = async (id: string, updates: Partial<Omit<KanbanColumn, 'id' | 'created_at' | 'updated_at'>>): Promise<KanbanColumn> => {
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

export const updateColumnOrder = async (updates: { id: string; order_index: number }[]): Promise<void> => {
  console.log('Atualizando ordem das colunas:', updates);
  
  for (const update of updates) {
    const { error } = await supabase
      .from('kanban_columns')
      .update({ order_index: update.order_index })
      .eq('id', update.id);
    
    if (error) {
      console.error(`Erro ao atualizar coluna ${update.id}:`, error);
      throw error;
    }
  }
  
  console.log('Ordem das colunas atualizada com sucesso');
};

export const swapColumnPositions = async (column1Id: string, column2Id: string): Promise<void> => {
  // Buscar as duas colunas
  const { data: columns, error: fetchError } = await supabase
    .from('kanban_columns')
    .select('id, order_index')
    .in('id', [column1Id, column2Id]);

  if (fetchError || !columns || columns.length !== 2) {
    throw new Error('Erro ao buscar colunas para troca');
  }

  const [col1, col2] = columns;
  
  // Trocar as posições
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
