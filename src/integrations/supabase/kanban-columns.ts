
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

// Função para criar as colunas padrão se não existirem
export const ensureDefaultColumns = async (): Promise<void> => {
  try {
    const { data: existingColumns } = await supabase
      .from('kanban_columns')
      .select('*')
      .eq('is_default', true);

    if (!existingColumns || existingColumns.length === 0) {
      const defaultColumns = [
        {
          column_id: 'iniciar_projeto',
          title: 'Iniciar Projeto',
          bg_color: 'bg-blue-50',
          order_index: 0,
          is_default: true,
        },
        {
          column_id: 'em_producao',
          title: 'Em Produção',
          bg_color: 'bg-yellow-50',
          order_index: 1,
          is_default: true,
        },
        {
          column_id: 'aguardando_assinatura',
          title: 'Aguardando Assinatura',
          bg_color: 'bg-orange-50',
          order_index: 2,
          is_default: true,
        },
        {
          column_id: 'aguardando_aprovacao',
          title: 'Aguardando Aprovação',
          bg_color: 'bg-purple-50',
          order_index: 3,
          is_default: true,
        },
        {
          column_id: 'aguardando_nota_fiscal',
          title: 'Aguardando Nota Fiscal',
          bg_color: 'bg-indigo-50',
          order_index: 4,
          is_default: true,
        },
        {
          column_id: 'aguardando_pagamento',
          title: 'Aguardando Pagamento',
          bg_color: 'bg-pink-50',
          order_index: 5,
          is_default: true,
        },
        {
          column_id: 'aguardando_repasse',
          title: 'Aguardando Repasse',
          bg_color: 'bg-cyan-50',
          order_index: 6,
          is_default: true,
        },
        {
          column_id: 'finalizados',
          title: 'Finalizados',
          bg_color: 'bg-green-50',
          order_index: 7,
          is_default: true,
        },
        {
          column_id: 'cancelados',
          title: 'Cancelados',
          bg_color: 'bg-red-50',
          order_index: 8,
          is_default: true,
        },
      ];

      console.log('Criando colunas padrão do Kanban...');
      for (const column of defaultColumns) {
        try {
          await supabase.from('kanban_columns').insert(column);
        } catch (error) {
          console.error('Erro ao criar coluna padrão:', column.title, error);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao verificar/criar colunas padrão:', error);
  }
};

export const fetchKanbanColumns = async (): Promise<KanbanColumn[]> => {
  try {
    // Primeiro, garante que as colunas padrão existem
    await ensureDefaultColumns();
    
    const { data, error } = await supabase
      .from('kanban_columns')
      .select('*')
      .order('order_index');

    if (error) {
      console.error('Error fetching kanban columns:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchKanbanColumns:', error);
    return [];
  }
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
