
import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
    console.log('Fetching projects...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name),
        main_consultant:consultants!main_consultant_id(id, name),
        support_consultant:consultants!support_consultant_id(id, name),
        project_stages(
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
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    console.log('Raw projects data:', data);

    // Transform the data to match the Project interface
    const transformedData = data?.map(project => {
      console.log('Transforming project:', project);
      
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
        consultantValue: project.main_consultant_value || 0,
        supportConsultantValue: project.support_consultant_value || 0,
        managerName: project.manager_name,
        managerEmail: project.manager_email,
        managerPhone: project.manager_phone,
        totalHours: project.total_hours || 0,
        hourlyRate: project.hourly_rate || 0,
        status: project.status,
        tags: project.project_tag_relations?.map(rel => rel.tag?.name).filter(Boolean) || [],
        tagIds: project.project_tag_relations?.map(rel => rel.tag?.id).filter(Boolean) || [],
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

    console.log('Transformed projects data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  try {
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

    const transformedData = data?.map(project => ({
      ...project,
      clientName: project.clients?.name,
      serviceName: project.services?.name
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
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
      status: 'em_producao'
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
    // First delete all related project stages
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

    // Finally delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
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
      status: project.status || 'planned',
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
      main_consultant_value: project.mainConsultantValue || 0,
      support_consultant_value: project.supportConsultantValue || 0,
      third_party_expenses: project.thirdPartyExpenses || 0,
      tax_percent: project.taxPercent || 16,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
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
      main_consultant_value: project.mainConsultantValue || 0,
      support_consultant_value: project.supportConsultantValue || 0,
      third_party_expenses: project.thirdPartyExpenses || 0,
      tax_percent: project.taxPercent || 16,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      status: project.status,
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

// Fetch basic tags for filters
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
