import { supabase } from "./client";
import { Project, Stage } from "@/components/projects/types";
import { createProjectTasks, updateProjectTasks } from "./project-tasks";
import { toast } from "sonner";

export const updateProject = async (project: Project) => {
  try {
    // Convert the Stage[] array to a proper JSON string that Supabase can handle
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        service_id: project.serviceId || null,
        client_id: project.clientId || null,
        main_consultant_id: project.mainConsultantId || null,
        main_consultant_commission: project.mainConsultantCommission || 0,
        support_consultant_id: project.supportConsultantId || null,
        support_consultant_commission: project.supportConsultantCommission || 0,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses || 0,
        main_consultant_value: project.consultantValue || 0,
        support_consultant_value: project.supportConsultantValue || 0,
        status: project.status,
        // Convert the stages array to a JSON string
        stages: JSON.stringify(project.stages),
        tags: project.tags || []
      })
      .eq('id', project.id);

    if (error) throw error;
    
    // Create or update tasks for this project
    try {
      await updateProjectTasks(project);
    } catch (taskError) {
      console.error('Error updating project tasks:', taskError);
      // Don't throw here, we want to still return the project
    }
    
    return project;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Function to fetch all projects
export const fetchProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        service_id,
        client_id,
        main_consultant_id,
        main_consultant_commission,
        support_consultant_id,
        support_consultant_commission,
        start_date,
        end_date,
        total_value,
        tax_percent,
        third_party_expenses,
        main_consultant_value,
        support_consultant_value,
        status,
        stages,
        tags,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match the Project type
    return (data || []).map(project => {
      // Safely parse stages from JSON with improved error handling
      let stages: Stage[] = [];
      if (project.stages) {
        try {
          if (typeof project.stages === 'string') {
            // If it's a JSON string, parse it
            stages = JSON.parse(project.stages) as Stage[];
          } else if (Array.isArray(project.stages)) {
            // If it's already an array, cast it properly
            stages = project.stages as unknown as Stage[];
          } else if (typeof project.stages === 'object' && project.stages !== null) {
            // If it's an object, try to extract array or convert
            const stagesObj = project.stages as any;
            if ('stages' in stagesObj && Array.isArray(stagesObj.stages)) {
              stages = stagesObj.stages as Stage[];
            } else {
              // Try to convert object to array
              const values = Object.values(stagesObj).filter(item => 
                item && typeof item === 'object' && 'id' in item
              );
              stages = values as Stage[];
            }
          }
          
          // Ensure stages is actually an array
          if (!Array.isArray(stages)) {
            console.warn('Stages is not an array after parsing:', stages);
            stages = [];
          }
          
          // Validate and clean stage data
          stages = stages.map((stage, index) => ({
            id: stage.id || `stage-${index}`,
            name: stage.name || `Etapa ${index + 1}`,
            description: stage.description || '',
            days: Number(stage.days) || 1,
            hours: Number(stage.hours) || 8,
            value: Number(stage.value) || 0,
            startDate: stage.startDate || '',
            endDate: stage.endDate || '',
            consultantId: stage.consultantId || undefined,
            completed: Boolean(stage.completed),
            clientApproved: Boolean(stage.clientApproved),
            managerApproved: Boolean(stage.managerApproved),
            invoiceIssued: Boolean(stage.invoiceIssued),
            paymentReceived: Boolean(stage.paymentReceived),
            consultantsSettled: Boolean(stage.consultantsSettled),
            attachment: stage.attachment || ''
          }));
          
        } catch (e) {
          console.error('Error parsing stages for project:', project.id, e);
          console.error('Raw stages data:', project.stages);
          stages = [];
        }
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        serviceId: project.service_id,
        clientId: project.client_id,
        mainConsultantId: project.main_consultant_id,
        mainConsultantCommission: project.main_consultant_commission || 0,
        supportConsultantId: project.support_consultant_id,
        supportConsultantCommission: project.support_consultant_commission || 0,
        startDate: project.start_date,
        endDate: project.end_date,
        totalValue: project.total_value,
        taxPercent: project.tax_percent,
        thirdPartyExpenses: project.third_party_expenses || 0,
        consultantValue: project.main_consultant_value || 0,
        supportConsultantValue: project.support_consultant_value || 0,
        status: project.status,
        stages: stages,
        tags: project.tags || [],
        createdAt: project.created_at,
        updatedAt: project.updated_at
      };
    }) as Project[];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

// Function to create a new project
export const createProject = async (project: Project) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        service_id: project.serviceId,
        client_id: project.clientId,
        main_consultant_id: project.mainConsultantId,
        main_consultant_commission: project.mainConsultantCommission || 0,
        support_consultant_id: project.supportConsultantId,
        support_consultant_commission: project.supportConsultantCommission || 0,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses || 0,
        main_consultant_value: project.consultantValue || 0,
        support_consultant_value: project.supportConsultantValue || 0,
        status: project.status,
        // Convert the stages array to a JSON string
        stages: JSON.stringify(project.stages),
        tags: project.tags || []
      })
      .select()
      .single();

    if (error) throw error;

    // Create tasks for this project
    try {
      const result = await createProjectTasks(project);
      if (result.mainTask) {
        toast.success("Projeto e tarefas associadas criados com sucesso!");
      }
    } catch (taskError) {
      console.error('Error creating project tasks:', taskError);
      // Don't throw here, we want to still return the project
    }
    
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Function to delete a project (with proper cleanup)
export const deleteProject = async (id: string) => {
  try {
    // First, get all chat room IDs for this project
    const { data: chatRooms, error: chatRoomsSelectError } = await supabase
      .from('chat_rooms')
      .select('id')
      .eq('project_id', id);
    
    if (chatRoomsSelectError) {
      console.error('Error fetching chat rooms:', chatRoomsSelectError);
      throw chatRoomsSelectError;
    }
    
    // If there are chat rooms, delete their participants and messages
    if (chatRooms && chatRooms.length > 0) {
      const roomIds = chatRooms.map(room => room.id);
      
      // Delete all chat room participants
      const { error: participantsError } = await supabase
        .from('chat_room_participants')
        .delete()
        .in('room_id', roomIds);
      
      if (participantsError) {
        console.error('Error deleting chat room participants:', participantsError);
      }
      
      // Delete all chat messages
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .in('room_id', roomIds);
      
      if (messagesError) {
        console.error('Error deleting chat messages:', messagesError);
      }
    }
    
    // Then delete all chat rooms
    const { error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('project_id', id);
    
    if (chatRoomsError) {
      console.error('Error deleting chat rooms:', chatRoomsError);
      throw chatRoomsError;
    }
    
    // Finally delete the project
    const { error: projectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (projectError) {
      console.error('Error deleting project:', projectError);
      throw projectError;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteProject:', error);
    throw error;
  }
};

// Function to fetch all available tags
export const fetchTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Function to fetch projects without consultants assigned (demands)
export const fetchDemandsWithoutConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        total_value,
        status,
        tags,
        clients(name),
        services:service_id(id, name, total_hours, stages)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the data to include client name and service information
    return (data || []).map(project => {
      // Calculate total days from the service stages if available
      let totalDays = 0;
      let totalHours = 0;
      
      if (project.services?.stages) {
        try {
          const stages = typeof project.services.stages === 'string' 
            ? JSON.parse(project.services.stages) 
            : project.services.stages;
          
          if (Array.isArray(stages)) {
            totalDays = stages.reduce((sum, stage) => sum + (stage.days || 0), 0);
            totalHours = stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
          }
        } catch (e) {
          console.error('Error parsing service stages:', e);
        }
      }
      
      // Use service total_hours if available
      if (project.services?.total_hours) {
        totalHours = Number(project.services.total_hours);
      }
      
      return {
        ...project,
        clientName: project.clients ? project.clients.name : null,
        serviceName: project.services ? project.services.name : null,
        totalHours: totalHours,
        totalDays: totalDays
      };
    });

  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};

// Function to assign consultants to a demand
export const assignConsultantsToDemand = async (
  projectId: string, 
  mainConsultantId: string | null, 
  mainConsultantCommission: number = 0,
  supportConsultantId: string | null = null,
  supportConsultantCommission: number = 0
) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        main_consultant_id: mainConsultantId,
        main_consultant_commission: mainConsultantCommission,
        support_consultant_id: supportConsultantId,
        support_consultant_commission: supportConsultantCommission
      })
      .eq('id', projectId)
      .select();
      
    if (error) throw error;

    // After assigning consultants, update the project tasks
    try {
      if (data && data[0]) {
        const project = await fetchProjectById(projectId);
        if (project) {
          await updateProjectTasks(project);
        }
      }
    } catch (taskError) {
      console.error('Error updating project tasks after consultant assignment:', taskError);
    }

    return data;
  } catch (error) {
    console.error('Error assigning consultants to demand:', error);
    throw error;
  }
};

// Helper function to fetch a single project by ID
export const fetchProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        service_id,
        client_id,
        main_consultant_id,
        main_consultant_commission,
        support_consultant_id,
        support_consultant_commission,
        start_date,
        end_date,
        total_value,
        tax_percent,
        third_party_expenses,
        main_consultant_value,
        support_consultant_value,
        status,
        stages,
        tags,
        created_at,
        updated_at
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }

    let stages: Stage[] = [];
    if (data.stages) {
      try {
        // Parse stages from JSON if needed with proper type casting
        if (typeof data.stages === 'string') {
          stages = JSON.parse(data.stages) as Stage[];
        } else if (Array.isArray(data.stages)) {
          stages = data.stages as unknown as Stage[];
        } else {
          // Handle other potential formats
          stages = [];
        }
      } catch (e) {
        console.error('Error parsing stages for project:', data.id, e);
        stages = [];
      }
    }

    // Map the status to a valid project status
    let projectStatus: 'planned' | 'active' | 'completed' | 'cancelled';
    
    // Ensure the status is one of the allowed values
    switch(data.status) {
      case 'planned':
      case 'active':
      case 'completed': 
      case 'cancelled':
        projectStatus = data.status;
        break;
      default:
        projectStatus = 'planned'; // Default to planned if unknown status
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      serviceId: data.service_id,
      clientId: data.client_id,
      mainConsultantId: data.main_consultant_id,
      mainConsultantCommission: data.main_consultant_commission || 0,
      supportConsultantId: data.support_consultant_id,
      supportConsultantCommission: data.support_consultant_commission || 0,
      startDate: data.start_date,
      endDate: data.end_date,
      totalValue: data.total_value,
      taxPercent: data.tax_percent,
      thirdPartyExpenses: data.third_party_expenses || 0,
      consultantValue: data.main_consultant_value || 0,
      supportConsultantValue: data.support_consultant_value || 0,
      status: projectStatus,
      stages: stages,
      tags: data.tags || []
    };
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
};

// Function to assign consultant to a specific stage
export const assignConsultantToStage = async (
  projectId: string,
  stageId: string,
  consultantId: string | null
) => {
  try {
    // First, fetch the current project
    const { data: projectData, error: fetchError } = await supabase
      .from('projects')
      .select('stages')
      .eq('id', projectId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!projectData) throw new Error('Project not found');
    
    // Parse the stages with proper type handling
    let stages: Stage[];
    if (typeof projectData.stages === 'string') {
      stages = JSON.parse(projectData.stages) as Stage[];
    } else if (Array.isArray(projectData.stages)) {
      stages = projectData.stages as unknown as Stage[];
    } else {
      throw new Error('Invalid stages format');
    }
    
    if (!Array.isArray(stages)) {
      throw new Error('Invalid stages format');
    }
    
    // Find and update the specific stage
    const updatedStages = stages.map(stage => {
      if (stage.id === stageId) {
        return { ...stage, consultantId };
      }
      return stage;
    });
    
    // Update the project with the modified stages
    const { error: updateError } = await supabase
      .from('projects')
      .update({ stages: JSON.stringify(updatedStages) })
      .eq('id', projectId);
    
    if (updateError) throw updateError;

    // After updating the stage consultant, update the project tasks
    try {
      const project = await fetchProjectById(projectId);
      if (project) {
        await updateProjectTasks(project);
      }
    } catch (taskError) {
      console.error('Error updating project tasks after stage consultant assignment:', taskError);
    }
    
    return updatedStages;
  } catch (error) {
    console.error('Error assigning consultant to stage:', error);
    throw error;
  }
};
