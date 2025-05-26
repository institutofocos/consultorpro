
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
    const projectData = {
      ...project,
      status: project.status || 'planned',
      client_id: project.clientId,
      service_id: project.serviceId,
      main_consultant_id: project.mainConsultantId,
      support_consultant_id: project.supportConsultantId,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue,
      total_hours: project.totalHours,
      hourly_rate: project.hourlyRate,
      main_consultant_commission: project.mainConsultantCommission,
      support_consultant_commission: project.supportConsultantCommission,
      main_consultant_value: project.consultantValue,
      support_consultant_value: project.supportConsultantValue,
      third_party_expenses: project.thirdPartyExpenses,
      tax_percent: project.taxPercent,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) throw error;

    // Create stages if they exist
    if (project.stages && project.stages.length > 0) {
      const stagesData = project.stages.map((stage: any) => ({
        project_id: data.id,
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder,
        consultant_id: stage.consultantId,
        status: stage.status || 'iniciar_projeto'
      }));

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Error creating stages:', stagesError);
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
    const projectData = {
      name: project.name,
      description: project.description,
      client_id: project.clientId,
      service_id: project.serviceId,
      main_consultant_id: project.mainConsultantId,
      support_consultant_id: project.supportConsultantId,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue,
      total_hours: project.totalHours,
      hourly_rate: project.hourlyRate,
      main_consultant_commission: project.mainConsultantCommission,
      support_consultant_commission: project.supportConsultantCommission,
      main_consultant_value: project.consultantValue,
      support_consultant_value: project.supportConsultantValue,
      third_party_expenses: project.thirdPartyExpenses,
      tax_percent: project.taxPercent,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      status: project.status,
      tags: project.tags
    };

    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', project.id)
      .select()
      .single();
    
    if (error) throw error;

    // Update stages if they exist
    if (project.stages && project.stages.length > 0) {
      // Delete existing stages
      await supabase
        .from('project_stages')
        .delete()
        .eq('project_id', project.id);

      // Insert new stages
      const stagesData = project.stages.map((stage: any) => ({
        project_id: project.id,
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder,
        consultant_id: stage.consultantId,
        status: stage.status || 'iniciar_projeto'
      }));

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Error updating stages:', stagesError);
      }
    }

    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
