import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
    console.log('Fetching projects with consultants only...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name),
        main_consultant:consultants!main_consultant_id(id, name),
        support_consultant:consultants!support_consultant_id(id, name),
        project_stages!project_stages_project_id_fkey(
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          completed,
          value,
          hours,
          days,
          consultant_id,
          stage_order,
          client_approved,
          manager_approved,
          invoice_issued,
          payment_received,
          consultants_settled,
          attachment,
          created_at,
          updated_at,
          consultant:consultants!consultant_id(id, name)
        ),
        project_tag_relations(
          tag:project_tags(id, name, color)
        )
      `)
      .not('main_consultant_id', 'is', null) // Only fetch projects with main consultant
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    console.log('Raw projects data (with consultants only):', data);

    // Transform the data to match the Project interface
    const transformedData = data?.map(project => {
      console.log('Transforming project:', project);
      
      // Extract tags from the relation table
      const projectTags = project.project_tag_relations?.map(rel => rel.tag).filter(Boolean) || [];
      console.log('Project tags for', project.name, ':', projectTags);
      
      return {
        id: project.id,
        projectId: project.project_id,
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
        totalValue: project.total_value || 0,
        taxPercent: project.tax_percent || 16,
        thirdPartyExpenses: project.third_party_expenses || 0,
        // CORREÇÃO: usar main_consultant_value para o campo consultantValue
        consultantValue: project.main_consultant_value || 0,
        supportConsultantValue: project.support_consultant_value || 0,
        managerName: project.manager_name,
        managerEmail: project.manager_email,
        managerPhone: project.manager_phone,
        totalHours: project.total_hours || 0,
        hourlyRate: project.hourly_rate || 0,
        url: project.url || '',
        status: project.status,
        tags: projectTags.map(tag => tag.name),
        tagIds: projectTags.map(tag => tag.id),
        tagNames: projectTags.map(tag => tag.name),
        stages: project.project_stages?.map(stage => ({
          id: stage.id,
          projectId: project.id,
          name: stage.name,
          description: stage.description || '',
          days: stage.days || 1,
          hours: stage.hours || 8,
          value: stage.value || 0,
          startDate: stage.start_date,
          endDate: stage.end_date,
          consultantId: stage.consultant_id,
          completed: stage.completed || false,
          clientApproved: stage.client_approved || false,
          managerApproved: stage.manager_approved || false,
          invoiceIssued: stage.invoice_issued || false,
          paymentReceived: stage.payment_received || false,
          consultantsSettled: stage.consultants_settled || false,
          attachment: stage.attachment,
          stageOrder: stage.stage_order || 1,
          status: stage.status || 'iniciar_projeto',
          createdAt: stage.created_at,
          updatedAt: stage.updated_at
        })) || [],
        // Extended properties from joins
        mainConsultantName: project.main_consultant?.name,
        supportConsultantName: project.support_consultant?.name,
        serviceName: project.services?.name,
        clientName: project.clients?.name,
        completedStages: project.project_stages?.filter(stage => stage.completed).length || 0,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      };
    }) || [];

    console.log('Transformed projects data (with consultants only):', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  try {
    console.log('Fetching demands (projects without consultants)...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    console.log('Raw demands data (without consultants):', data);

    const transformedData = data?.map(project => ({
      ...project,
      clientName: project.clients?.name,
      serviceName: project.services?.name
    })) || [];

    console.log('Transformed demands data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};

// Function to calculate project status based on business rules and configured statuses
export const calculateProjectStatus = async (project: any): Promise<string> => {
  try {
    // First, fetch the configured active statuses
    const { data: activeStatuses, error } = await supabase
      .from('project_status_settings')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching active statuses:', error);
      // Fallback to original logic if can't fetch configured statuses
      return calculateLegacyProjectStatus(project);
    }

    // Check if project has a valid configured status
    const currentStatusSetting = activeStatuses?.find(s => s.name === project.status);
    if (currentStatusSetting) {
      return project.status; // Keep current status if it's valid and active
    }

    // Auto-assign status based on business rules using configured statuses
    
    // Rule 1: If no consultant assigned, look for planning status
    if (!project.main_consultant_id) {
      const planningStatus = activeStatuses?.find(s => 
        s.name.includes('planejamento') || s.name.includes('planning')
      );
      return planningStatus?.name || 'em_planejamento';
    }
    
    // Rule 2: If consultant assigned but not all stages completed, look for production status
    if (project.main_consultant_id && project.project_stages) {
      const totalStages = project.project_stages.length;
      const completedStages = project.project_stages.filter((stage: any) => stage.completed).length;
      
      // Rule 3: If all stages are completed, look for completion status
      if (totalStages > 0 && completedStages === totalStages) {
        const completionStatus = activeStatuses?.find(s => s.is_completion_status);
        return completionStatus?.name || 'concluido';
      }
      
      // Look for production status
      const productionStatus = activeStatuses?.find(s => 
        s.name.includes('producao') || s.name.includes('production')
      );
      return productionStatus?.name || 'em_producao';
    }
    
    // Default to first active status if available
    return activeStatuses?.[0]?.name || 'em_producao';
  } catch (error) {
    console.error('Error in calculateProjectStatus:', error);
    return calculateLegacyProjectStatus(project);
  }
};

// Legacy status calculation for fallback
const calculateLegacyProjectStatus = (project: any): string => {
  // Rule 1: If no consultant assigned, status should be "em_planejamento"
  if (!project.main_consultant_id) {
    return 'em_planejamento';
  }
  
  // Rule 2: If consultant assigned but not all stages completed, status should be "em_producao"
  if (project.main_consultant_id && project.project_stages) {
    const totalStages = project.project_stages.length;
    const completedStages = project.project_stages.filter((stage: any) => stage.completed).length;
    
    // Rule 3: If all stages are completed, status should be "concluido"
    if (totalStages > 0 && completedStages === totalStages) {
      return 'concluido';
    }
    
    return 'em_producao';
  }
  
  // If consultant assigned but no stages, status should be "em_producao"
  return 'em_producao';
};

// Function to update project status automatically
export const updateProjectStatusAutomatically = async (projectId: string) => {
  try {
    // First, fetch the project with its stages
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        project_stages(*)
      `)
      .eq('id', projectId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching project for status update:', fetchError);
      return;
    }
    
    // Calculate the new status
    const newStatus = await calculateProjectStatus(project);
    
    // Update the project status if it's different
    if (project.status !== newStatus) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (updateError) {
        console.error('Error updating project status:', updateError);
      } else {
        console.log(`Project ${projectId} status updated to: ${newStatus}`);
      }
    }
    
    return newStatus;
  } catch (error) {
    console.error('Error in updateProjectStatusAutomatically:', error);
  }
};

export const assignConsultantsToDemand = async (
  projectId: string,
  mainConsultantId: string | null,
  mainConsultantCommission: number,
  supportConsultantId: string | null,
  supportConsultantCommission: number
) => {
  try {
    const updateData: any = {
      main_consultant_id: mainConsultantId,
      main_consultant_commission: mainConsultantCommission,
      status: mainConsultantId ? 'em_producao' : 'em_planejamento' // Auto-set status based on consultant
    };

    if (supportConsultantId) {
      updateData.support_consultant_id = supportConsultantId;
      updateData.support_consultant_commission = supportConsultantCommission;
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Update status automatically after consultant assignment
    await updateProjectStatusAutomatically(projectId);
    
    return data;
  } catch (error) {
    console.error('Error assigning consultants:', error);
    throw error;
  }
};

export const updateStageStatus = async (
  stageId: string, 
  updates: any, 
  projectName?: string, 
  stageName?: string
) => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .update(updates)
      .eq('id', stageId);

    if (error) throw error;
    
    // Get the project ID from the stage to update project status
    const { data: stage } = await supabase
      .from('project_stages')
      .select('project_id')
      .eq('id', stageId)
      .single();
    
    if (stage?.project_id) {
      // Update project status automatically after stage update
      await updateProjectStatusAutomatically(stage.project_id);
    }
    
    if (projectName && stageName) {
      console.log(`Stage ${stageName} updated for project ${projectName}`);
    }
  } catch (error) {
    console.error('Error updating stage status:', error);
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    // First, check if the project has "cancelado" status
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('status, name')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching project for deletion:', fetchError);
      throw fetchError;
    }

    // Allow deletion only for projects with "cancelado" status
    if (project.status !== 'cancelado') {
      throw new Error('Apenas projetos com status "cancelado" podem ser removidos. Altere o status do projeto para "cancelado" antes de excluí-lo.');
    }

    console.log(`Deleting project "${project.name}" with cancelado status...`);

    // Delete chat rooms and related data first
    const { error: chatRoomsError } = await supabase
      .from('chat_rooms')
      .delete()
      .eq('project_id', id);
    
    if (chatRoomsError) {
      console.error('Error deleting chat rooms:', chatRoomsError);
      // Don't throw error here, continue with deletion
    }

    // Delete all related project stages
    const { error: stagesError } = await supabase
      .from('project_stages')
      .delete()
      .eq('project_id', id);
    
    if (stagesError) {
      console.error('Error deleting project stages:', stagesError);
      throw stagesError;
    }

    // Delete project tag relations
    const { error: tagsError } = await supabase
      .from('project_tag_relations')
      .delete()
      .eq('project_id', id);
    
    if (tagsError) {
      console.error('Error deleting project tag relations:', tagsError);
      throw tagsError;
    }

    // Delete financial transactions related to the project
    const { error: transactionsError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('project_id', id);
    
    if (transactionsError) {
      console.error('Error deleting financial transactions:', transactionsError);
      // Don't throw error here, continue with deletion
    }

    // Delete project history
    const { error: historyError } = await supabase
      .from('project_history')
      .delete()
      .eq('project_id', id);
    
    if (historyError) {
      console.error('Error deleting project history:', historyError);
      // Don't throw error here, continue with deletion
    }

    // Finally delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    console.log(`Project "${project.name}" deleted successfully`);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const createProject = async (project: any) => {
  try {
    console.log('Dados recebidos para criação:', project);
    
    // Mapear propriedades da interface para colunas do banco
    const projectData = {
      name: project.name,
      description: project.description,
      status: project.mainConsultantId ? 'em_producao' : 'em_planejamento', // Auto-set status based on consultant
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue || 0,
      total_hours: project.totalHours || 0,
      hourly_rate: project.hourlyRate || 0,
      main_consultant_commission: project.mainConsultantCommission || 0,
      support_consultant_commission: project.supportConsultantCommission || 0,
      main_consultant_value: project.consultantValue || 0, // CORREÇÃO: usar consultantValue para main_consultant_value
      support_consultant_value: project.supportConsultantValue || 0,
      third_party_expenses: project.thirdPartyExpenses || 0,
      tax_percent: project.taxPercent || 16,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      url: project.url || null,
      tags: project.tags || []
    };

    console.log('Dados mapeados para o banco:', projectData);

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inserir projeto:', error);
      throw error;
    }

    console.log('Projeto criado com sucesso:', data);

    // Link project to tags if they exist
    if (project.tagIds && project.tagIds.length > 0) {
      await linkProjectToTags(data.id, project.tagIds);
    }

    // Create stages if they exist
    if (project.stages && project.stages.length > 0) {
      console.log('Criando etapas do projeto:', project.stages);
      
      const stagesData = project.stages.map((stage: any) => ({
        project_id: data.id,
        name: stage.name,
        description: stage.description || '',
        days: stage.days || 1,
        hours: stage.hours || 8,
        value: stage.value || 0,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder || 1,
        consultant_id: stage.consultantId || null,
        status: stage.status || 'iniciar_projeto'
      }));

      console.log('Dados das etapas para inserção:', stagesData);

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Error creating stages:', stagesError);
      } else {
        console.log('Etapas criadas com sucesso');
      }
    }

    // Update project status automatically after creation
    await updateProjectStatusAutomatically(data.id);

    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (project: any) => {
  try {
    console.log('Dados recebidos para atualização:', project);
    
    // Mapear propriedades da interface para colunas do banco
    const projectData = {
      name: project.name,
      description: project.description,
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue || 0,
      total_hours: project.totalHours || 0,
      hourly_rate: project.hourlyRate || 0,
      main_consultant_commission: project.mainConsultantCommission || 0,
      support_consultant_commission: project.supportConsultantCommission || 0,
      main_consultant_value: project.consultantValue || 0, // CORREÇÃO: usar consultantValue para main_consultant_value
      support_consultant_value: project.supportConsultantValue || 0,
      third_party_expenses: project.thirdPartyExpenses || 0,
      tax_percent: project.taxPercent || 16,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      url: project.url || null,
      // Don't include status here - it will be calculated automatically
      tags: project.tags || []
    };

    console.log('Dados mapeados para atualização:', projectData);

    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', project.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }

    console.log('Projeto atualizado com sucesso:', data);

    // Update project tags if they exist
    if (project.tagIds) {
      await linkProjectToTags(project.id, project.tagIds);
    }

    // Update stages if they exist
    if (project.stages && project.stages.length > 0) {
      console.log('Atualizando etapas do projeto');
      
      // Delete existing stages
      await supabase
        .from('project_stages')
        .delete()
        .eq('project_id', project.id);

      // Insert new stages
      const stagesData = project.stages.map((stage: any) => ({
        project_id: project.id,
        name: stage.name,
        description: stage.description || '',
        days: stage.days || 1,
        hours: stage.hours || 8,
        value: stage.value || 0,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder || 1,
        consultant_id: stage.consultantId || null,
        status: stage.status || 'iniciar_projeto'
      }));

      console.log('Dados das etapas para atualização:', stagesData);

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Error updating stages:', stagesError);
      } else {
        console.log('Etapas atualizadas com sucesso');
      }
    }

    // Update project status automatically after update
    await updateProjectStatusAutomatically(project.id);

    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// New functions for project tags
export const fetchProjectTags = async () => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project tags:', error);
    return [];
  }
};

export const createProjectTag = async (tag: { name: string; color?: string }) => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .insert({
        name: tag.name,
        color: tag.color || '#3b82f6'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project tag:', error);
    throw error;
  }
};

export const linkProjectToTags = async (projectId: string, tagIds: string[]) => {
  try {
    // First, remove existing tag relations for this project
    await supabase
      .from('project_tag_relations')
      .delete()
      .eq('project_id', projectId);

    // Then, create new relations
    if (tagIds.length > 0) {
      const relations = tagIds.map(tagId => ({
        project_id: projectId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('project_tag_relations')
        .insert(relations);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error linking project to tags:', error);
    throw error;
  }
};

// Fetch basic tags for filters - update to use project_tags
export const fetchTags = async () => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

// Fetch consultants for filters
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

// Fetch services for filters
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
