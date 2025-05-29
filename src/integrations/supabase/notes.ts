
import { supabase } from "./client";
import { parseTimeForDB, getCurrentTimestampBR } from "@/utils/dateUtils";

export interface Note {
  id: string;
  title: string;
  content?: string;
  status: 'iniciar_projeto' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'finalizados' | 'cancelados';
  color?: string;
  start_date?: string;
  start_time?: string;
  due_date?: string;
  due_time?: string;
  end_date?: string;
  end_time?: string;
  client_id?: string;
  service_id?: string;
  consultant_id?: string;
  linked_task_id?: string;
  created_at?: string;
  updated_at?: string;
  // Extended properties from joins
  client_name?: string;
  service_name?: string;
  consultant_names?: string[];
  tag_names?: string[];
  checklists?: NoteChecklist[];
  linked_task?: Note;
}

export interface NoteChecklist {
  id: string;
  note_id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  due_time?: string;
  completed_at?: string;
  responsible_consultant_id?: string;
  created_at?: string;
  updated_at?: string;
}

export const fetchNotes = async () => {
  try {
    console.log('Fetching notes...');
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name),
        note_consultants(consultant:consultants(id, name)),
        note_tag_relations(tag:note_tags(id, name)),
        checklists:note_checklists(*),
        linked_task:notes!linked_task_id(id, title, status)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    console.log('Raw notes data:', data);

    const transformedData = data?.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      status: note.status as Note['status'],
      color: note.color,
      start_date: note.start_date,
      start_time: note.start_time,
      due_date: note.due_date,
      due_time: note.due_time,
      end_date: note.end_date,
      end_time: note.end_time,
      client_id: note.client_id,
      service_id: note.service_id,
      consultant_id: note.consultant_id,
      linked_task_id: note.linked_task_id,
      created_at: note.created_at,
      updated_at: note.updated_at,
      client_name: note.clients?.name,
      service_name: note.services?.name,
      consultant_names: note.note_consultants?.map((nc: any) => nc.consultant?.name).filter(Boolean) || [],
      tag_names: note.note_tag_relations?.map((tr: any) => tr.tag?.name).filter(Boolean) || [],
      checklists: note.checklists || [],
      linked_task: note.linked_task
    })) || [];

    console.log('Transformed notes data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching notes:', error);
    return [];
  }
};

export const createNote = async (note: Partial<Note>) => {
  try {
    console.log('Creating note with data:', note);
    
    // Preparar dados para inserção com timestamp brasileiro
    const noteData = {
      title: note.title,
      content: note.content || null,
      status: note.status || 'iniciar_projeto',
      color: note.color || null,
      start_date: note.start_date || null,
      start_time: parseTimeForDB(note.start_time),
      due_date: note.due_date || null,
      due_time: parseTimeForDB(note.due_time),
      end_date: note.end_date || null,
      end_time: parseTimeForDB(note.end_time),
      client_id: note.client_id || null,
      service_id: note.service_id || null,
      consultant_id: note.consultant_id || null,
      linked_task_id: note.linked_task_id || null,
      created_at: getCurrentTimestampBR(),
      updated_at: getCurrentTimestampBR()
    };
    
    console.log('Processed note data for insertion:', noteData);

    const { data, error } = await supabase
      .from('notes')
      .insert(noteData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }

    console.log('Note created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

export const updateNote = async (id: string, note: Partial<Note>) => {
  try {
    console.log('Updating note with data:', note);
    
    // Preparar dados para atualização com timestamp brasileiro
    const noteData = {
      title: note.title,
      content: note.content,
      status: note.status,
      color: note.color,
      start_date: note.start_date,
      start_time: parseTimeForDB(note.start_time),
      due_date: note.due_date,
      due_time: parseTimeForDB(note.due_time),
      end_date: note.end_date,
      end_time: parseTimeForDB(note.end_time),
      client_id: note.client_id,
      service_id: note.service_id,
      consultant_id: note.consultant_id,
      linked_task_id: note.linked_task_id,
      updated_at: getCurrentTimestampBR()
    };
    
    console.log('Processed note data for update:', noteData);

    const { data, error } = await supabase
      .from('notes')
      .update(noteData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating note:', error);
      throw error;
    }

    console.log('Note updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const updateNoteStatus = async (id: string, status: Note['status']) => {
  try {
    console.log('Updating note status:', id, status);
    
    // Check if there are incomplete checklists when trying to finalize
    if (status === 'finalizados') {
      const { data: note } = await supabase
        .from('notes')
        .select('*, checklists:note_checklists(*)')
        .eq('id', id)
        .single();
      
      if (note?.checklists && note.checklists.length > 0) {
        const incompleteChecklists = note.checklists.filter((c: any) => !c.completed);
        if (incompleteChecklists.length > 0) {
          throw new Error('Não é possível finalizar. Existem checklists pendentes.');
        }
      }
    }

    const updateData: any = {
      status,
      updated_at: getCurrentTimestampBR()
    };

    // Se estiver finalizando, adicionar data/hora de fim
    if (status === 'finalizados') {
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      updateData.end_date = brazilTime.toISOString().split('T')[0]; // YYYY-MM-DD
      updateData.end_time = `${String(brazilTime.getHours()).padStart(2, '0')}:${String(brazilTime.getMinutes()).padStart(2, '0')}`;
    }

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating note status:', error);
      throw error;
    }

    console.log('Note status updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error updating note status:', error);
    throw error;
  }
};

export const deleteNote = async (id: string) => {
  try {
    console.log('Deleting note:', id);
    
    // Delete related checklists first
    const { error: checklistError } = await supabase
      .from('note_checklists')
      .delete()
      .eq('note_id', id);
    
    if (checklistError) {
      console.error('Error deleting note checklists:', checklistError);
    }

    // Delete consultant relations
    const { error: consultantError } = await supabase
      .from('note_consultants')
      .delete()
      .eq('note_id', id);
    
    if (consultantError) {
      console.error('Error deleting note consultants:', consultantError);
    }

    // Delete tag relations
    const { error: tagError } = await supabase
      .from('note_tag_relations')
      .delete()
      .eq('note_id', id);
    
    if (tagError) {
      console.error('Error deleting note tags:', tagError);
    }

    // Delete the note
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }

    console.log('Note deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const updateChecklist = async (checklistId: string, updates: Partial<NoteChecklist>) => {
  try {
    console.log('Updating checklist:', checklistId, updates);
    
    const updateData = {
      ...updates,
      updated_at: getCurrentTimestampBR()
    };
    
    // Se estiver marcando como concluído, adicionar timestamp de conclusão
    if (updates.completed) {
      updateData.completed_at = getCurrentTimestampBR();
    } else if (updates.completed === false) {
      updateData.completed_at = null;
    }

    const { error } = await supabase
      .from('note_checklists')
      .update(updateData)
      .eq('id', checklistId);
    
    if (error) {
      console.error('Error updating checklist:', error);
      throw error;
    }

    console.log('Checklist updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating checklist:', error);
    throw error;
  }
};

// Add the missing export for updateChecklistStatus
export const updateChecklistStatus = async (checklistId: string, completed: boolean, noteId: string) => {
  try {
    console.log('Updating checklist status:', checklistId, completed);
    
    const updateData = {
      completed,
      completed_at: completed ? getCurrentTimestampBR() : null,
      updated_at: getCurrentTimestampBR()
    };

    const { error } = await supabase
      .from('note_checklists')
      .update(updateData)
      .eq('id', checklistId);
    
    if (error) {
      console.error('Error updating checklist status:', error);
      throw error;
    }

    console.log('Checklist status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating checklist status:', error);
    throw error;
  }
};

// Add the missing export for createChecklist
export const createChecklist = async (noteId: string, checklist: Partial<NoteChecklist>) => {
  try {
    console.log('Creating checklist:', noteId, checklist);
    
    const checklistData = {
      note_id: noteId,
      title: checklist.title,
      description: checklist.description || null,
      completed: false,
      due_date: checklist.due_date || null,
      due_time: parseTimeForDB(checklist.due_time),
      responsible_consultant_id: checklist.responsible_consultant_id || null,
      created_at: getCurrentTimestampBR(),
      updated_at: getCurrentTimestampBR()
    };

    const { data, error } = await supabase
      .from('note_checklists')
      .insert(checklistData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating checklist:', error);
      throw error;
    }

    console.log('Checklist created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating checklist:', error);
    throw error;
  }
};

// Additional utility functions for notes
export const fetchClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const fetchServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

export const fetchConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }
};

export const fetchNoteTags = async () => {
  try {
    const { data, error } = await supabase
      .from('note_tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching note tags:', error);
    return [];
  }
};
