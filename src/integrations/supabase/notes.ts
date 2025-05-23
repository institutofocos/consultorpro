
import { supabase } from "./client";

export type Note = {
  id: string;
  title: string;
  content?: string;
  status: 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado';
  color?: string;
  due_date?: string;
  start_date?: string;
  end_date?: string;
  consultant_ids?: string[];
  client_id?: string;
  service_id?: string;
  tag_ids?: string[];
  has_internal_chat?: boolean;
  chat_room_id?: string;
  created_at?: string;
  updated_at?: string;
  consultant_names?: string[];
  client_name?: string;
  service_name?: string;
  tag_names?: string[];
  checklists?: NoteChecklist[];
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

    // Process notes to add related information
    const notesWithRelations = await Promise.all(
      (data || []).map(async (note) => {
        let consultantNames: string[] = [];
        let clientName: string | null = null;
        let serviceName: string | null = null;
        let tagNames: string[] = [];
        let checklists: NoteChecklist[] = [];
        
        // Fetch consultant names if consultant_id exists
        if (note.consultant_id) {
          const { data: consultant } = await supabase
            .from('consultants')
            .select('name')
            .eq('id', note.consultant_id)
            .single();
          
          if (consultant) {
            consultantNames.push(consultant.name);
          }
        }
        
        // Fetch client name if client_id exists
        if (note.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('name')
            .eq('id', note.client_id)
            .single();
            
          clientName = client?.name || null;
        }
        
        // Fetch service name if service_id exists
        if (note.service_id) {
          const { data: service } = await supabase
            .from('services')
            .select('name')
            .eq('id', note.service_id)
            .single();
            
          serviceName = service?.name || null;
        }

        // For now, return empty checklists array since the table doesn't exist yet
        checklists = [];

        return {
          ...note,
          consultant_names: consultantNames,
          client_name: clientName,
          service_name: serviceName,
          tag_names: tagNames,
          checklists: checklists,
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

    // Similar to fetchNotes, but for a single note
    let consultantNames: string[] = [];
    let clientName: string | null = null;
    let serviceName: string | null = null;
    let tagNames: string[] = [];
    let checklists: NoteChecklist[] = [];

    // Fetch consultant name if consultant_id exists
    if (data.consultant_id) {
      const { data: consultant } = await supabase
        .from('consultants')
        .select('name')
        .eq('id', data.consultant_id)
        .single();
        
      if (consultant) {
        consultantNames.push(consultant.name);
      }
    }
    
    // Fetch client name if client_id exists
    if (data.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', data.client_id)
        .single();
        
      clientName = client?.name || null;
    }
    
    // Fetch service name if service_id exists
    if (data.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', data.service_id)
        .single();
        
      serviceName = service?.name || null;
    }

    // For now, return empty checklists array since the table doesn't exist yet
    checklists = [];

    return {
      ...data,
      consultant_names: consultantNames,
      client_name: clientName,
      service_name: serviceName,
      tag_names: tagNames,
      checklists: checklists,
      status: data.status as 'a_fazer' | 'em_producao' | 'finalizado' | 'cancelado'
    } as Note;
  } catch (error) {
    console.error('Error in fetchNoteById:', error);
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> => {
  try {
    // Extract fields that should be handled separately
    const { consultant_ids, tag_ids, checklists, ...noteFields } = noteData;
    
    // Only include fields that exist in the database
    const dbFields = {
      title: noteFields.title,
      content: noteFields.content,
      status: noteFields.status,
      color: noteFields.color,
      due_date: noteFields.due_date,
      client_id: noteFields.client_id,
      service_id: noteFields.service_id,
      consultant_id: consultant_ids?.[0] || null, // Use first consultant as main consultant
    };

    // Create the note with only the fields that exist in the database
    const { data: noteResult, error } = await supabase
      .from('notes')
      .insert(dbFields)
      .select()
      .single();

    if (error) throw error;

    // Create chat room if requested
    if (noteData.has_internal_chat) {
      try {
        const { data: chatRoom, error: chatError } = await supabase
          .from('chat_rooms')
          .insert({
            name: `Chat: ${noteResult.title}`,
            description: `Chat interno para a anotação: ${noteResult.title}`
          })
          .select()
          .single();
        
        if (!chatError && chatRoom) {
          // Add consultants to chat room if consultant_ids provided
          if (consultant_ids && consultant_ids.length > 0) {
            const participantsData = consultant_ids.map(consultantId => ({
              room_id: chatRoom.id,
              user_id: consultantId,
              user_name: 'Consultor', // We'll fetch the actual name later
              user_role: 'consultant'
            }));
            
            await supabase
              .from('chat_room_participants')
              .insert(participantsData);
          }
        }
      } catch (chatError) {
        console.log('Could not create chat room:', chatError);
      }
    }

    return await fetchNoteById(noteResult.id);
  } catch (error) {
    console.error('Error in createNote:', error);
    return null;
  }
};

export const updateNote = async (id: string, noteData: Partial<Note>): Promise<Note | null> => {
  try {
    // Extract fields that shouldn't be directly updated in the notes table
    const { consultant_ids, tag_ids, checklists, chat_room_id, has_internal_chat, ...noteFields } = noteData;

    // Check if trying to mark as finalizado
    if (noteFields.status === 'finalizado') {
      // Check if all checklists are completed
      const note = await fetchNoteById(id);
      if (note && note.checklists && note.checklists.length > 0) {
        const hasIncompleteChecklists = note.checklists.some(checklist => !checklist.completed);
        if (hasIncompleteChecklists) {
          throw new Error('Não é possível finalizar a anotação. Todas as checklists devem estar concluídas primeiro.');
        }
      }
    }

    // Only include fields that exist in the database
    const dbFields = {
      title: noteFields.title,
      content: noteFields.content,
      status: noteFields.status,
      color: noteFields.color,
      due_date: noteFields.due_date,
      client_id: noteFields.client_id,
      service_id: noteFields.service_id,
      consultant_id: consultant_ids?.[0] || noteFields.consultant_id,
    };

    // Remove undefined values
    Object.keys(dbFields).forEach(key => {
      if (dbFields[key as keyof typeof dbFields] === undefined) {
        delete dbFields[key as keyof typeof dbFields];
      }
    });

    // Update the note
    const { error } = await supabase
      .from('notes')
      .update(dbFields)
      .eq('id', id);

    if (error) throw error;
    
    return await fetchNoteById(id);
  } catch (error) {
    console.error('Error in updateNote:', error);
    throw error;
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

// Checklist functions - These will be implemented once the tables are created
export const createChecklist = async (checklist: Omit<NoteChecklist, 'id' | 'created_at'>): Promise<NoteChecklist | null> => {
  try {
    // For now, return a mock checklist since the table doesn't exist yet
    console.log('Creating checklist:', checklist);
    const mockChecklist: NoteChecklist = {
      id: `temp-${Date.now()}`,
      ...checklist,
      created_at: new Date().toISOString()
    };
    return mockChecklist;
  } catch (error) {
    console.error('Error creating checklist:', error);
    return null;
  }
};

export const updateChecklist = async (id: string, updates: Partial<NoteChecklist>): Promise<boolean> => {
  try {
    // For now, just log the update since the table doesn't exist yet
    console.log('Updating checklist:', id, updates);
    return true;
  } catch (error) {
    console.error('Error updating checklist:', error);
    return false;
  }
};

export const deleteChecklist = async (id: string): Promise<boolean> => {
  try {
    // For now, just log the deletion since the table doesn't exist yet
    console.log('Deleting checklist:', id);
    return true;
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return false;
  }
};

// Helper functions
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
