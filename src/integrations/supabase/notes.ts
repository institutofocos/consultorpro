
import { supabase } from "./client";

export type Note = {
  id: string;
  title: string;
  content?: string;
  status: 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado';
  color?: string;
  due_date?: string;
  start_date?: string; // Nova: data de início prevista
  end_date?: string; // Nova: data de conclusão prevista
  consultant_ids?: string[]; // Alterado: array de IDs de consultores
  client_id?: string;
  service_id?: string;
  tag_ids?: string[]; // Alterado: array de IDs de tags
  has_internal_chat?: boolean; // Nova: se tem chat interno
  chat_room_id?: string; // Nova: ID da sala de chat
  created_at?: string;
  updated_at?: string;
  consultant_names?: string[]; // Para exibição
  client_name?: string;
  service_name?: string;
  tag_names?: string[]; // Para exibição
  checklists?: NoteChecklist[]; // Nova: checklists
};

export type NoteChecklist = {
  id: string;
  note_id: string;
  title: string;
  description?: string;
  due_date?: string;
  responsible_consultant_id?: string;
  responsible_consultant_name?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
};

export type NoteConsultant = {
  id: string;
  note_id: string;
  consultant_id: string;
  consultant_name?: string;
  created_at?: string;
};

export type NoteTag = {
  id: string;
  note_id: string;
  tag_id: string;
  tag_name?: string;
  created_at?: string;
};

export const fetchNotes = async (): Promise<Note[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }

    // Enriquecer as notas com informações relacionadas
    const notesWithRelations = await Promise.all(
      (data || []).map(async (note) => {
        const [consultants, client, service, tags, checklists] = await Promise.all([
          fetchNoteConsultants(note.id),
          note.client_id ? fetchClientName(note.client_id) : Promise.resolve(null),
          note.service_id ? fetchServiceName(note.service_id) : Promise.resolve(null),
          fetchNoteTags(note.id),
          fetchNoteChecklists(note.id)
        ]);

        return {
          ...note,
          consultant_ids: consultants.map(c => c.consultant_id),
          consultant_names: consultants.map(c => c.consultant_name).filter(Boolean),
          client_name: client,
          service_name: service,
          tag_ids: tags.map(t => t.tag_id),
          tag_names: tags.map(t => t.tag_name).filter(Boolean),
          checklists,
          status: note.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
        } as Note;
      })
    );

    return notesWithRelations;
  } catch (error) {
    console.error('Error in fetchNotes:', error);
    return [];
  }
};

export const fetchNoteById = async (id: string): Promise<Note | null> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching note:', error);
      throw error;
    }

    // Buscar dados relacionados
    const [consultants, client, service, tags, checklists] = await Promise.all([
      fetchNoteConsultants(data.id),
      data.client_id ? fetchClientName(data.client_id) : Promise.resolve(null),
      data.service_id ? fetchServiceName(data.service_id) : Promise.resolve(null),
      fetchNoteTags(data.id),
      fetchNoteChecklists(data.id)
    ]);

    return {
      ...data,
      consultant_ids: consultants.map(c => c.consultant_id),
      consultant_names: consultants.map(c => c.consultant_name).filter(Boolean),
      client_name: client,
      service_name: service,
      tag_ids: tags.map(t => t.tag_id),
      tag_names: tags.map(t => t.tag_name).filter(Boolean),
      checklists,
      status: data.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    } as Note;
  } catch (error) {
    console.error('Error in fetchNoteById:', error);
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> => {
  try {
    // Separar dados da nota dos relacionamentos
    const { consultant_ids, tag_ids, checklists, has_internal_chat, ...noteFields } = noteData;
    
    // Criar a nota
    const { data: noteResult, error } = await supabase
      .from('notes')
      .insert(noteFields)
      .select()
      .single();

    if (error) throw error;

    // Criar chat interno se solicitado
    if (has_internal_chat) {
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: `Chat: ${noteResult.title}`,
          description: `Chat interno para a anotação: ${noteResult.title}`
        })
        .select()
        .single();
      
      if (!chatError && chatRoom) {
        await supabase
          .from('notes')
          .update({ 
            has_internal_chat: true, 
            chat_room_id: chatRoom.id 
          })
          .eq('id', noteResult.id);
      }
    }

    // Criar relacionamentos com consultores
    if (consultant_ids && consultant_ids.length > 0) {
      const consultantRelations = consultant_ids.map(consultantId => ({
        note_id: noteResult.id,
        consultant_id: consultantId
      }));

      await supabase
        .from('note_consultants')
        .insert(consultantRelations);
    }

    // Criar relacionamentos com tags
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        note_id: noteResult.id,
        tag_id: tagId
      }));

      await supabase
        .from('note_tag_relations')
        .insert(tagRelations);
    }

    // Criar checklists
    if (checklists && checklists.length > 0) {
      const checklistsToInsert = checklists.map(checklist => ({
        note_id: noteResult.id,
        title: checklist.title,
        description: checklist.description,
        due_date: checklist.due_date,
        responsible_consultant_id: checklist.responsible_consultant_id,
        completed: checklist.completed || false
      }));

      await supabase
        .from('note_checklists')
        .insert(checklistsToInsert);
    }

    return await fetchNoteById(noteResult.id);
  } catch (error) {
    console.error('Error in createNote:', error);
    return null;
  }
};

export const updateNote = async (id: string, noteData: Partial<Note>): Promise<Note | null> => {
  try {
    // Separar dados da nota dos relacionamentos
    const { consultant_ids, tag_ids, checklists, ...noteFields } = noteData;

    // Atualizar a nota
    const { error } = await supabase
      .from('notes')
      .update(noteFields)
      .eq('id', id);

    if (error) throw error;

    // Atualizar relacionamentos com consultores se fornecidos
    if (consultant_ids !== undefined) {
      // Remover relacionamentos existentes
      await supabase
        .from('note_consultants')
        .delete()
        .eq('note_id', id);

      // Adicionar novos relacionamentos
      if (consultant_ids.length > 0) {
        const consultantRelations = consultant_ids.map(consultantId => ({
          note_id: id,
          consultant_id: consultantId
        }));

        await supabase
          .from('note_consultants')
          .insert(consultantRelations);
      }
    }

    // Atualizar relacionamentos com tags se fornecidos
    if (tag_ids !== undefined) {
      // Remover relacionamentos existentes
      await supabase
        .from('note_tag_relations')
        .delete()
        .eq('note_id', id);

      // Adicionar novos relacionamentos
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tagId => ({
          note_id: id,
          tag_id: tagId
        }));

        await supabase
          .from('note_tag_relations')
          .insert(tagRelations);
      }
    }

    return await fetchNoteById(id);
  } catch (error) {
    console.error('Error in updateNote:', error);
    return null;
  }
};

export const deleteNote = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return false;
  }
};

export const updateNoteStatus = async (id: string, status: Note['status']): Promise<Note | null> => {
  return updateNote(id, { status });
};

// Funções para checklists
export const createChecklist = async (checklist: Omit<NoteChecklist, 'id' | 'created_at'>): Promise<NoteChecklist | null> => {
  try {
    const { data, error } = await supabase
      .from('note_checklists')
      .insert(checklist)
      .select()
      .single();

    if (error) throw error;
    return data as NoteChecklist;
  } catch (error) {
    console.error('Error creating checklist:', error);
    return null;
  }
};

export const updateChecklist = async (id: string, updates: Partial<NoteChecklist>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('note_checklists')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating checklist:', error);
    return false;
  }
};

export const deleteChecklist = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('note_checklists')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return false;
  }
};

// Funções auxiliares para buscar dados relacionados
async function fetchConsultantName(consultantId: string): Promise<string | null> {
  const { data } = await supabase
    .from('consultants')
    .select('name')
    .eq('id', consultantId)
    .single();
  
  return data?.name || null;
}

async function fetchClientName(clientId: string): Promise<string | null> {
  const { data } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single();
  
  return data?.name || null;
}

async function fetchServiceName(serviceId: string): Promise<string | null> {
  const { data } = await supabase
    .from('services')
    .select('name')
    .eq('id', serviceId)
    .single();
  
  return data?.name || null;
}

async function fetchNoteConsultants(noteId: string): Promise<NoteConsultant[]> {
  const { data, error } = await supabase
    .from('note_consultants')
    .select(`
      *,
      consultants(name)
    `)
    .eq('note_id', noteId);

  if (error) {
    console.error('Error fetching note consultants:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    consultant_name: item.consultants?.name
  }));
}

async function fetchNoteTags(noteId: string): Promise<NoteTag[]> {
  const { data, error } = await supabase
    .from('note_tag_relations')
    .select(`
      *,
      tags(name)
    `)
    .eq('note_id', noteId);

  if (error) {
    console.error('Error fetching note tags:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    tag_name: item.tags?.name
  }));
}

async function fetchNoteChecklists(noteId: string): Promise<NoteChecklist[]> {
  const { data, error } = await supabase
    .from('note_checklists')
    .select(`
      *,
      consultants(name)
    `)
    .eq('note_id', noteId)
    .order('created_at');

  if (error) {
    console.error('Error fetching note checklists:', error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    responsible_consultant_name: item.consultants?.name
  }));
}
