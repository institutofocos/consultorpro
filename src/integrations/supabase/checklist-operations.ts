
import { supabase } from "./client";
import { getCurrentTimestampBR, parseTimeForDB } from "@/utils/dateUtils";
import { NoteChecklist } from "./notes";

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
