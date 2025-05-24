
import { supabase } from './client';
import { Note, NoteChecklist } from './notes';
import { Project } from '@/components/projects/types';

export interface ProjectTaskCreationResult {
  mainTask: Note | null;
  stageTasks: NoteChecklist[];
  error?: string;
}

/**
 * Creates tasks based on a project and its stages
 * - Main project task
 * - Subtasks for each project stage (as checklists)
 */
export const createProjectTasks = async (project: Project): Promise<ProjectTaskCreationResult> => {
  try {
    // Verificar se já existe uma tarefa para este projeto
    const { data: existingTasks, error: checkError } = await supabase
      .from('notes')
      .select('id')
      .ilike('title', `Projeto: ${project.name}%`)
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar tarefas existentes:', checkError);
    }

    if (existingTasks && existingTasks.length > 0) {
      console.log('Tarefa já existe para este projeto, pulando criação');
      return {
        mainTask: null,
        stageTasks: [],
        error: 'Task already exists'
      };
    }

    // Create the main task for the project
    const { data: mainTask, error: mainTaskError } = await supabase
      .from('notes')
      .insert({
        title: `Projeto: ${project.name}`,
        content: project.description || '',
        start_date: project.startDate,
        due_date: project.endDate,
        status: 'a_fazer',
        client_id: project.clientId,
        service_id: project.serviceId,
        consultant_id: project.mainConsultantId || null,
        color: '#3B82F6' // Blue color
      })
      .select()
      .single();

    if (mainTaskError) throw mainTaskError;

    // Add consultant associations
    if (project.mainConsultantId) {
      await supabase
        .from('note_consultants')
        .insert({
          note_id: mainTask.id,
          consultant_id: project.mainConsultantId
        });
    }

    if (project.supportConsultantId) {
      await supabase
        .from('note_consultants')
        .insert({
          note_id: mainTask.id,
          consultant_id: project.supportConsultantId
        });
    }

    // Create subtasks for each stage
    const stageTasks: NoteChecklist[] = [];
    if (project.stages && Array.isArray(project.stages)) {
      for (const stage of project.stages) {
        // Create a checklist item for each stage
        const { data: checklist, error: checklistError } = await supabase
          .from('note_checklists')
          .insert({
            note_id: mainTask.id,
            title: stage.name,
            description: stage.description || '',
            due_date: stage.endDate || project.endDate,
            responsible_consultant_id: stage.consultantId || project.mainConsultantId
          })
          .select()
          .single();

        if (checklistError) {
          console.error('Error creating checklist item for stage:', checklistError);
          continue;
        }

        stageTasks.push(checklist);
      }
    }

    return {
      mainTask: mainTask as Note,
      stageTasks
    };
  } catch (error) {
    console.error('Error creating project tasks:', error);
    return {
      mainTask: null,
      stageTasks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Updates project tasks when a project is updated
 */
export const updateProjectTasks = async (project: Project): Promise<ProjectTaskCreationResult> => {
  try {
    // Find existing task for this project
    const { data: existingTasks, error: queryError } = await supabase
      .from('notes')
      .select('*')
      .ilike('title', `Projeto: ${project.name}%`)
      .limit(1);

    if (queryError) throw queryError;

    if (existingTasks && existingTasks.length > 0) {
      const existingTask = existingTasks[0];
      
      // Update the main task
      const { data: updatedTask, error: updateError } = await supabase
        .from('notes')
        .update({
          content: project.description || '',
          start_date: project.startDate,
          due_date: project.endDate,
          client_id: project.clientId,
          service_id: project.serviceId,
          consultant_id: project.mainConsultantId || null
        })
        .eq('id', existingTask.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Remove existing checklists
      await supabase
        .from('note_checklists')
        .delete()
        .eq('note_id', existingTask.id);

      // Create new checklists for each stage
      const stageTasks: NoteChecklist[] = [];
      if (project.stages && Array.isArray(project.stages)) {
        for (const stage of project.stages) {
          const { data: checklist, error: checklistError } = await supabase
            .from('note_checklists')
            .insert({
              note_id: existingTask.id,
              title: stage.name,
              description: stage.description || '',
              due_date: stage.endDate || project.endDate,
              responsible_consultant_id: stage.consultantId || project.mainConsultantId
            })
            .select()
            .single();

          if (checklistError) {
            console.error('Error creating checklist item for stage:', checklistError);
            continue;
          }

          stageTasks.push(checklist);
        }
      }

      return {
        mainTask: updatedTask as Note,
        stageTasks
      };
    } else {
      // If no task exists for this project, create a new one
      return createProjectTasks(project);
    }
  } catch (error) {
    console.error('Error updating project tasks:', error);
    return {
      mainTask: null,
      stageTasks: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
