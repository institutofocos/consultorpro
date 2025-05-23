
import { supabase } from "./client";

export type Note = {
  id: string;
  title: string;
  content?: string;
  status: 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado';
  color?: string;
  due_date?: string;
  consultant_id?: string;
  client_id?: string;
  service_id?: string;
  created_at?: string;
  updated_at?: string;
  consultant_name?: string;
  client_name?: string;
  service_name?: string;
  tags?: NoteTag[];
  custom_fields?: NoteCustomField[];
};

export type NoteTag = {
  id: string;
  note_id: string;
  name: string;
  color?: string;
  created_at?: string;
};

export type NoteCustomField = {
  id: string;
  note_id: string;
  field_name: string;
  field_value?: string;
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
        const [consultant, client, service, tags, customFields] = await Promise.all([
          note.consultant_id ? fetchConsultantName(note.consultant_id) : Promise.resolve(null),
          note.client_id ? fetchClientName(note.client_id) : Promise.resolve(null),
          note.service_id ? fetchServiceName(note.service_id) : Promise.resolve(null),
          fetchNoteTags(note.id),
          fetchNoteCustomFields(note.id)
        ]);

        return {
          ...note,
          consultant_name: consultant,
          client_name: client,
          service_name: service,
          tags,
          custom_fields: customFields,
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
    const [consultant, client, service, tags, customFields] = await Promise.all([
      data.consultant_id ? fetchConsultantName(data.consultant_id) : Promise.resolve(null),
      data.client_id ? fetchClientName(data.client_id) : Promise.resolve(null),
      data.service_id ? fetchServiceName(data.service_id) : Promise.resolve(null),
      fetchNoteTags(data.id),
      fetchNoteCustomFields(data.id)
    ]);

    return {
      ...data,
      consultant_name: consultant,
      client_name: client,
      service_name: service,
      tags,
      custom_fields: customFields,
      status: data.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    } as Note;
  } catch (error) {
    console.error('Error in fetchNoteById:', error);
    return null;
  }
};

export const createNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert(note)
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      throw error;
    }

    // Se houver tags, criar tags
    if (note.tags && note.tags.length > 0) {
      const tagsToInsert = note.tags.map(tag => ({
        note_id: data.id,
        name: tag.name,
        color: tag.color
      }));

      const { error: tagsError } = await supabase
        .from('note_tags')
        .insert(tagsToInsert);

      if (tagsError) {
        console.error('Error creating note tags:', tagsError);
      }
    }

    // Se houver campos personalizados, criar campos
    if (note.custom_fields && note.custom_fields.length > 0) {
      const fieldsToInsert = note.custom_fields.map(field => ({
        note_id: data.id,
        field_name: field.field_name,
        field_value: field.field_value
      }));

      const { error: fieldsError } = await supabase
        .from('note_custom_fields')
        .insert(fieldsToInsert);

      if (fieldsError) {
        console.error('Error creating note custom fields:', fieldsError);
      }
    }

    return {
      ...data,
      status: data.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    } as Note;
  } catch (error) {
    console.error('Error in createNote:', error);
    return null;
  }
};

export const updateNote = async (id: string, note: Partial<Note>): Promise<Note | null> => {
  try {
    // Separar tags e campos personalizados do objeto da nota
    const { tags, custom_fields, ...noteData } = note;

    // Atualizar a nota
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

    // Se houver tags para atualizar
    if (tags) {
      // Remover tags existentes
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', id);

      // Adicionar novas tags
      if (tags.length > 0) {
        const tagsToInsert = tags.map(tag => ({
          note_id: id,
          name: tag.name,
          color: tag.color
        }));

        await supabase
          .from('note_tags')
          .insert(tagsToInsert);
      }
    }

    // Se houver campos personalizados para atualizar
    if (custom_fields) {
      // Remover campos existentes
      await supabase
        .from('note_custom_fields')
        .delete()
        .eq('note_id', id);

      // Adicionar novos campos
      if (custom_fields.length > 0) {
        const fieldsToInsert = custom_fields.map(field => ({
          note_id: id,
          field_name: field.field_name,
          field_value: field.field_value
        }));

        await supabase
          .from('note_custom_fields')
          .insert(fieldsToInsert);
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
    // Deletar a nota (as tags e campos personalizados serão automaticamente deletados devido ao CASCADE)
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNote:', error);
    return false;
  }
};

export const updateNoteStatus = async (id: string, status: Note['status']): Promise<Note | null> => {
  return updateNote(id, { status });
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

async function fetchNoteTags(noteId: string): Promise<NoteTag[]> {
  const { data, error } = await supabase
    .from('note_tags')
    .select('*')
    .eq('note_id', noteId);

  if (error) {
    console.error('Error fetching note tags:', error);
    return [];
  }

  return data || [];
}

async function fetchNoteCustomFields(noteId: string): Promise<NoteCustomField[]> {
  const { data, error } = await supabase
    .from('note_custom_fields')
    .select('*')
    .eq('note_id', noteId);

  if (error) {
    console.error('Error fetching note custom fields:', error);
    return [];
  }

  return data || [];
}
