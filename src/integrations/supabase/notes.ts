
import { supabase } from "./client";
import { parseTimeForDB, getCurrentTimestampBR, formatDateForDB, formatTimeForDB, separateDateAndTime } from "@/utils/dateUtils";

export interface Note {
  id: string;
  title: string;
  content?: string;
  status: 'iniciar_projeto' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'finalizados' | 'cancelados' | 'a_fazer' | 'em_andamento' | 'concluido';
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
  // Properties for handling multiple consultants and tags
  consultant_ids?: string[];
  tag_ids?: string[];
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
        note_tag_relations(tag:project_tags(id, name)),
        checklists:note_checklists(*),
        linked_task:notes!linked_task_id(id, title, status)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    console.log('Raw notes data:', data);

    const transformedData = data?.map(note => {
      // Separar data e hora dos campos end_date se necessário
      let endDate = note.end_date;
      let endTime = note.end_time;
      
      // Se end_date contém data e hora juntas, separar
      if (endDate && endDate.includes(' ')) {
        const separated = separateDateAndTime(endDate);
        endDate = separated.date;
        endTime = separated.time;
      }

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        status: note.status as Note['status'],
        color: note.color,
        start_date: note.start_date,
        start_time: note.start_time,
        due_date: note.due_date,
        due_time: note.due_time,
        end_date: endDate,
        end_time: endTime,
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
        linked_task: note.linked_task ? {
          ...note.linked_task,
          status: note.linked_task.status as Note['status']
        } : undefined
      };
    }) || [];

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
    
    // Preparar dados para inserção
    const noteData = {
      title: note.title || '',
      content: note.content || null,
      status: note.status || 'iniciar_projeto',
      color: note.color || null,
      start_date: formatDateForDB(note.start_date),
      start_time: parseTimeForDB(note.start_time),
      due_date: formatDateForDB(note.due_date),
      due_time: parseTimeForDB(note.due_time),
      end_date: formatDateForDB(note.end_date),
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

    // Se há consultores para associar, adicionar relações
    if (note.consultant_ids && note.consultant_ids.length > 0) {
      const consultantRelations = note.consultant_ids.map(consultantId => ({
        note_id: data.id,
        consultant_id: consultantId
      }));
      
      const { error: consultantError } = await supabase
        .from('note_consultants')
        .insert(consultantRelations);
      
      if (consultantError) {
        console.error('Error creating consultant relations:', consultantError);
      }
    }

    // Se há tags para associar, adicionar relações
    if (note.tag_ids && note.tag_ids.length > 0) {
      const tagRelations = note.tag_ids.map(tagId => ({
        note_id: data.id,
        tag_id: tagId
      }));
      
      const { error: tagError } = await supabase
        .from('note_tag_relations')
        .insert(tagRelations);
      
      if (tagError) {
        console.error('Error creating tag relations:', tagError);
      }
    }

    // Se há checklists, criar elas
    if (note.checklists && note.checklists.length > 0) {
      const checklistsToCreate = note.checklists.map(checklist => ({
        note_id: data.id,
        title: checklist.title,
        description: checklist.description || null,
        completed: false,
        due_date: formatDateForDB(checklist.due_date),
        due_time: parseTimeForDB(checklist.due_time),
        responsible_consultant_id: checklist.responsible_consultant_id || null,
        created_at: getCurrentTimestampBR(),
        updated_at: getCurrentTimestampBR()
      }));

      const { error: checklistError } = await supabase
        .from('note_checklists')
        .insert(checklistsToCreate);
      
      if (checklistError) {
        console.error('Error creating checklists:', checklistError);
      }
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
    
    // Preparar dados para atualização
    const noteData = {
      title: note.title,
      content: note.content,
      status: note.status,
      color: note.color,
      start_date: formatDateForDB(note.start_date),
      start_time: parseTimeForDB(note.start_time),
      due_date: formatDateForDB(note.due_date),
      due_time: parseTimeForDB(note.due_time),
      end_date: formatDateForDB(note.end_date),
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

    // Atualizar relações de consultores
    if (note.consultant_ids !== undefined) {
      // Remover relações existentes
      await supabase
        .from('note_consultants')
        .delete()
        .eq('note_id', id);
      
      // Adicionar novas relações
      if (note.consultant_ids.length > 0) {
        const consultantRelations = note.consultant_ids.map(consultantId => ({
          note_id: id,
          consultant_id: consultantId
        }));
        
        const { error: consultantError } = await supabase
          .from('note_consultants')
          .insert(consultantRelations);
        
        if (consultantError) {
          console.error('Error updating consultant relations:', consultantError);
        }
      }
    }

    // Atualizar relações de tags
    if (note.tag_ids !== undefined) {
      // Remover relações existentes
      await supabase
        .from('note_tag_relations')
        .delete()
        .eq('note_id', id);
      
      // Adicionar novas relações
      if (note.tag_ids.length > 0) {
        const tagRelations = note.tag_ids.map(tagId => ({
          note_id: id,
          tag_id: tagId
        }));
        
        const { error: tagError } = await supabase
          .from('note_tag_relations')
          .insert(tagRelations);
        
        if (tagError) {
          console.error('Error updating tag relations:', tagError);
        }
      }
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

    // Se estiver finalizando, adicionar data/hora de fim separadamente
    if (status === 'finalizados') {
      const now = new Date();
      const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      
      updateData.end_date = formatDateForDB(brazilTime);
      updateData.end_time = parseTimeForDB(`${String(brazilTime.getHours()).padStart(2, '0')}:${String(brazilTime.getMinutes()).padStart(2, '0')}`);
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
      due_date: formatDateForDB(updates.due_date),
      due_time: parseTimeForDB(updates.due_time),
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

export const createChecklist = async (noteId: string, checklist: Partial<NoteChecklist>) => {
  try {
    console.log('Creating checklist:', noteId, checklist);
    
    const checklistData = {
      note_id: noteId,
      title: checklist.title,
      description: checklist.description || null,
      completed: false,
      due_date: formatDateForDB(checklist.due_date),
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
      .from('project_tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching note tags:', error);
    return [];
  }
};
