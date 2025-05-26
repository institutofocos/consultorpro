import { supabase } from "./client";

export type Note = {
  id: string;
  title: string;
  content?: string;
  status: 'iniciar_projeto' | 'em_producao' | 'aguardando_assinatura' | 'aguardando_aprovacao' | 'aguardando_nota_fiscal' | 'aguardando_pagamento' | 'aguardando_repasse' | 'finalizados' | 'cancelados';
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
  custom_fields?: NoteCustomField[];
  linked_task_id?: string | null;
  linked_task?: Note | null;
};

export type NoteCustomField = {
  id: string;
  note_id: string;
  field_name: string;
  field_value?: string;
  created_at?: string;
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
    const { data: notes, error } = await supabase
      .from('notes')
      .select(`
        *,
        client:client_id(name),
        service:service_id(name),
        consultants:note_consultants(consultant:consultant_id(name)),
        tags:note_tag_relations(tag:tag_id(name)),
        checklists:note_checklists(
          id, 
          note_id, 
          title, 
          description, 
          completed, 
          completed_at, 
          due_date, 
          created_at, 
          updated_at,
          responsible_consultant:responsible_consultant_id(name)
        ),
        custom_fields:note_custom_fields(
          id,
          note_id,
          field_name,
          field_value,
          created_at
        ),
        linked_task:linked_task_id(id, title, status)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedNotes: Note[] = (notes || []).map(note => {
      const consultantNames = note.consultants
        ? note.consultants
            .filter(c => c.consultant && c.consultant.name)
            .map(c => c.consultant.name)
        : [];

      const tagNames = note.tags
        ? note.tags
            .filter(t => t.tag && t.tag.name)
            .map(t => t.tag.name)
        : [];

      const checklists = note.checklists
        ? note.checklists.map(checklist => ({
            ...checklist,
            responsible_consultant_name: checklist.responsible_consultant ? checklist.responsible_consultant.name : null
          }))
        : [];

      const customFields = note.custom_fields || [];

      let linkedTask = null;
      if (note.linked_task && note.linked_task.id) {
        linkedTask = note.linked_task;
      }

      return {
        ...note,
        status: note.status as Note['status'],
        client_name: note.client ? note.client.name : null,
        service_name: note.service ? note.service.name : null,
        consultant_names: consultantNames,
        tag_names: tagNames,
        checklists: checklists,
        custom_fields: customFields,
        linked_task: linkedTask
      } as Note;
    });

    return transformedNotes;
  } catch (error) {
    console.error('Error fetching notes:', error);
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

    let consultantNames: string[] = [];
    let clientName: string | null = null;
    let serviceName: string | null = null;
    let tagNames: string[] = [];
    let checklists: NoteChecklist[] = [];
    let customFields: NoteCustomField[] = [];

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
    
    if (data.client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', data.client_id)
        .single();
        
      clientName = client?.name || null;
    }
    
    if (data.service_id) {
      const { data: service } = await supabase
        .from('services')
        .select('name')
        .eq('id', data.service_id)
        .single();
        
      serviceName = service?.name || null;
    }

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

    const { data: customFieldsData } = await supabase
      .from('note_custom_fields')
      .select('*')
      .eq('note_id', data.id)
      .order('created_at', { ascending: true });

    if (customFieldsData) {
      customFields = customFieldsData;
    }

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
      custom_fields: customFields,
      status: data.status as Note['status']
    } as Note;
  } catch (error) {
    console.error('Error in fetchNoteById:', error);
    return null;
  }
};

export const createNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<Note | null> => {
  try {
    const { consultant_ids, tag_ids, checklists, custom_fields, ...noteFields } = noteData;
    
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

    const { data: noteResult, error } = await supabase
      .from('notes')
      .insert(dbFields)
      .select()
      .single();

    if (error) throw error;

    if (consultant_ids && consultant_ids.length > 0) {
      const consultantRelations = consultant_ids.map(consultantId => ({
        note_id: noteResult.id,
        consultant_id: consultantId
      }));
      
      await supabase
        .from('note_consultants')
        .insert(consultantRelations);
    }

    if (tag_ids && tag_ids.length > 0) {
      const tagRelations = tag_ids.map(tagId => ({
        note_id: noteResult.id,
        tag_id: tagId
      }));
      
      await supabase
        .from('note_tag_relations')
        .insert(tagRelations);
    }

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

    if (custom_fields && custom_fields.length > 0) {
      const customFieldsData = custom_fields.map(customField => ({
        note_id: noteResult.id,
        field_name: customField.field_name,
        field_value: customField.field_value,
        created_at: new Date().toISOString()
      }));
      
      await supabase
        .from('note_custom_fields')
        .insert(customFieldsData);
    }

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
          await supabase
            .from('notes')
            .update({ chat_room_id: chatRoom.id })
            .eq('id', noteResult.id);

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
    const { consultant_ids, tag_ids, checklists, chat_room_id, consultant_names, client_name, service_name, tag_names, custom_fields, ...noteFields } = noteData;

    if (noteFields.status === 'finalizados') {
      const note = await fetchNoteById(id);
      if (note && note.checklists && note.checklists.length > 0) {
        const hasIncompleteChecklists = note.checklists.some(checklist => !checklist.completed);
        if (hasIncompleteChecklists) {
          throw new Error('Não é possível finalizar a anotação. Todas as checklists devem estar concluídas primeiro.');
        }
      }
    }

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

    Object.keys(dbFields).forEach(key => {
      if (dbFields[key as keyof typeof dbFields] === undefined) {
        delete dbFields[key as keyof typeof dbFields];
      }
    });

    const { error } = await supabase
      .from('notes')
      .update(dbFields)
      .eq('id', id);

    if (error) throw error;

    if (consultant_ids !== undefined) {
      await supabase
        .from('note_consultants')
        .delete()
        .eq('note_id', id);
      
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

    if (tag_ids !== undefined) {
      await supabase
        .from('note_tag_relations')
        .delete()
        .eq('note_id', id);
      
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

    if (checklists !== undefined) {
      await supabase
        .from('note_checklists')
        .delete()
        .eq('note_id', id);
      
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

    if (custom_fields !== undefined) {
      await supabase
        .from('note_custom_fields')
        .delete()
        .eq('note_id', id);
      
      if (custom_fields.length > 0) {
        const customFieldsData = custom_fields.map(customField => ({
          note_id: id,
          field_name: customField.field_name,
          field_value: customField.field_value,
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('note_custom_fields')
          .insert(customFieldsData);
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

// Função para sincronizar checklist com etapas do projeto
export const syncChecklistWithProjectStage = async (noteId: string, checklistId: string, completed: boolean) => {
  try {
    console.log('Sincronizando checklist com etapa do projeto:', { noteId, checklistId, completed });
    
    // Buscar a nota principal e o checklist
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('title')
      .eq('id', noteId)
      .single();

    if (noteError || !note) {
      console.log('Nota não encontrada para sincronização');
      return;
    }

    const { data: checklist, error: checklistError } = await supabase
      .from('note_checklists')
      .select('title')
      .eq('id', checklistId)
      .single();

    if (checklistError || !checklist) {
      console.log('Checklist não encontrado para sincronização');
      return;
    }

    // Verificar se é uma tarefa de projeto
    if (!note.title.startsWith('Projeto: ')) {
      return; // Não é uma tarefa de projeto, não sincronizar
    }

    // Extrair nome do projeto
    const projectName = note.title.replace('Projeto: ', '');
    
    // Buscar o projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('name', projectName)
      .single();

    if (projectError || !project) {
      console.log('Projeto não encontrado para sincronização');
      return;
    }

    // Buscar a etapa correspondente
    const { data: stage, error: stageError } = await supabase
      .from('project_stages')
      .select('id, status')
      .eq('project_id', project.id)
      .eq('name', checklist.title)
      .single();

    if (stageError || !stage) {
      console.log('Etapa não encontrada para sincronização');
      return;
    }

    // Determinar o novo status baseado no completed
    const newStatus = completed ? 'finalizados' : 'em_producao';
    
    // Atualizar apenas se o status for diferente
    if (stage.status !== newStatus) {
      const updates: any = { status: newStatus };
      
      // Se marcando como finalizado, atualizar outros campos
      if (completed) {
        updates.completed = true;
        updates.manager_approved = true;
        updates.client_approved = true;
        updates.invoice_issued = true;
        updates.payment_received = true;
        updates.consultants_settled = true;
      }

      const { error: updateError } = await supabase
        .from('project_stages')
        .update(updates)
        .eq('id', stage.id);

      if (updateError) {
        console.error('Erro ao atualizar etapa do projeto:', updateError);
      } else {
        console.log('Etapa do projeto sincronizada com sucesso');
      }
    }
  } catch (error) {
    console.error('Erro na sincronização checklist-etapa:', error);
  }
};

// Função para atualizar status de checklist com sincronização
export const updateChecklistStatus = async (checklistId: string, completed: boolean, noteId: string) => {
  try {
    const { error } = await supabase
      .from('note_checklists')
      .update({ 
        completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      })
      .eq('id', checklistId);

    if (error) throw error;

    // Sincronizar com etapa do projeto
    await syncChecklistWithProjectStage(noteId, checklistId, completed);
    
    return true;
  } catch (error) {
    console.error('Error updating checklist status:', error);
    throw error;
  }
};
