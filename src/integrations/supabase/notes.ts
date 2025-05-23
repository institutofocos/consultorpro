
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
  updated_at?: string;
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
        
        // Fetch consultant names from note_consultants table
        const { data: noteConsultants } = await supabase
          .from('note_consultants')
          .select(`
            consultant_id,
            consultants (name)
          `)
          .eq('note_id', note.id);
        
        if (noteConsultants) {
          consultantNames = noteConsultants.map(nc => (nc.consultants as any)?.name).filter(Boolean);
        }
        
        // If no consultants in junction table, check direct consultant_id
        if (consultantNames.length === 0 && note.consultant_id) {
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

        // Fetch checklists for this note
        const { data: checklistData } = await supabase
          .from('note_checklists')
          .select(`
            *,
            consultants (name)
          `)
          .eq('note_id', note.id)
          .order('created_at', { ascending: true });

        if (checklistData) {
          checklists = checklistData.map(checklist => ({
            ...checklist,
            responsible_consultant_name: (checklist.consultants as any)?.name || null
          }));
        }

        // Fetch tags from note_tag_relations
        const { data: noteTags } = await supabase
          .from('note_tag_relations')
          .select(`
            tag_id,
            tags (name)
          `)
          .eq('note_id', note.id);
        
        if (noteTags) {
          tagNames = noteTags.map(nt => (nt.tags as any)?.name).filter(Boolean);
        }

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

    // Fetch consultant names from note_consultants table
    const { data: noteConsultants } = await supabase
      .from('note_consultants')
      .select(`
        consultant_id,
        consultants (name)
      `)
      .eq('note_id', data.id);
    
    if (noteConsultants) {
      consultantNames = noteConsultants.map(nc => (nc.consultants as any)?.name).filter(Boolean);
    }
    
    // If no consultants in junction table, check direct consultant_id
    if (consultantNames.length === 0 && data.consultant_id) {
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

    // Fetch checklists for this note
    const { data: checklistData } = await supabase
      .from('note_checklists')
      .select(`
        *,
        consultants (name)
      `)
      .eq('note_id', data.id)
      .order('created_at', { ascending: true });

    if (checklistData) {
      checklists = checklistData.map(checklist => ({
        ...checklist,
        responsible_consultant_name: (checklist.consultants as any)?.name || null
      }));
    }

    // Fetch tags from note_tag_relations
    const { data: noteTags } = await supabase
      .from('note_tag_relations')
      .select(`
        tag_id,
        tags (name)
      `)
      .eq('note_id', data.id);
    
    if (noteTags) {
      tagNames = noteTags.map(nt => (nt.tags as any)?.name).filter(Boolean);
    }

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
      start_date: noteFields.start_date,
      end_date: noteFields.end_date,
      client_id: noteFields.client_id,
      service_id: noteFields.service_id,
      consultant_id: consultant_ids?.[0] || null,
      has_internal_chat: noteFields.has_internal_chat,
    };

    // Create the note with only the fields that exist in the database
    const { data: noteResult, error } = await supabase
      .from('notes')
      .insert(dbFields)
      .select()
      .single();

    if (error) throw error;

    // Handle consultants
    if (consultant_ids && consultant_ids.length > 0) {
      const consultantRelations = consultant_ids.map(consultantId => ({
        note_id: noteResult.id,
        consultant_id: consultantId
      }));
      
      await supabase
        .from('note_consultants')
        .insert(consultantRelations);
    }

    // Handle tags
    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        note_id: noteResult.id,
        tag_id: tagId
      }));
      
      await supabase
        .from('note_tag_relations')
        .insert(tagRelations);
    }

    // Handle checklists
    if (checklists && checklists.length > 0) {
      const checklistData = checklists.map(checklist => ({
        note_id: noteResult.id,
        title: checklist.title,
        description: checklist.description,
        due_date: checklist.due_date,
        responsible_consultant_id: checklist.responsible_consultant_id
      }));
      
      await supabase
        .from('note_checklists')
        .insert(checklistData);
    }

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
          // Update note with chat_room_id
          await supabase
            .from('notes')
            .update({ chat_room_id: chatRoom.id })
            .eq('id', noteResult.id);

          // Add consultants to chat room if consultant_ids provided
          if (consultant_ids && consultant_ids.length > 0) {
            const participantsData = consultant_ids.map(consultantId => ({
              room_id: chatRoom.id,
              user_id: consultantId,
              user_name: 'Consultor',
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
    const { consultant_ids, tag_ids, checklists, chat_room_id, consultant_names, client_name, service_name, tag_names, ...noteFields } = noteData;

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
      start_date: noteFields.start_date,
      end_date: noteFields.end_date,
      client_id: noteFields.client_id,
      service_id: noteFields.service_id,
      consultant_id: consultant_ids?.[0] || undefined,
      has_internal_chat: noteFields.has_internal_chat,
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

    // Handle consultants update
    if (consultant_ids !== undefined) {
      // Delete existing consultant relations
      await supabase
        .from('note_consultants')
        .delete()
        .eq('note_id', id);
      
      // Insert new consultant relations
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

    // Handle tags update
    if (tag_ids !== undefined) {
      // Delete existing tag relations
      await supabase
        .from('note_tag_relations')
        .delete()
        .eq('note_id', id);
      
      // Insert new tag relations
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

    // Handle checklists update
    if (checklists !== undefined) {
      // Delete existing checklists
      await supabase
        .from('note_checklists')
        .delete()
        .eq('note_id', id);
      
      // Insert new checklists
      if (checklists.length > 0) {
        const checklistData = checklists.map(checklist => ({
          note_id: id,
          title: checklist.title,
          description: checklist.description,
          due_date: checklist.due_date,
          responsible_consultant_id: checklist.responsible_consultant_id,
          completed: checklist.completed || false,
          completed_at: checklist.completed_at
        }));
        
        await supabase
          .from('note_checklists')
          .insert(checklistData);
      }
    }
    
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

// Checklist functions
export const createChecklist = async (checklist: Omit<NoteChecklist, 'id' | 'created_at' | 'updated_at'>): Promise<NoteChecklist | null> => {
  try {
    const { data, error } = await supabase
      .from('note_checklists')
      .insert(checklist)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating checklist:', error);
    return null;
  }
};

export const updateChecklist = async (id: string, updates: Partial<NoteChecklist>): Promise<boolean> => {
  try {
    const updateData = {
      ...updates,
      completed_at: updates.completed ? new Date().toISOString() : null
    };

    const { error } = await supabase
      .from('note_checklists')
      .update(updateData)
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
