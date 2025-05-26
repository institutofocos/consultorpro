

import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
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
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Transform the data for the interface
    const transformedData = data?.map(project => ({
      ...project,
      client_name: project.clients?.name,
      service_name: project.services?.name,
      main_consultant_name: project.main_consultant?.name,
      support_consultant_name: project.support_consultant?.name,
      stages: project.project_stages?.map(stage => ({
        ...stage,
        consultant_name: stage.consultant?.name
      })) || []
    })) || [];

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

