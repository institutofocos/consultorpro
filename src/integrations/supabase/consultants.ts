
import { supabase } from "./client";

export const fetchConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select(`
        *,
        consultant_services(
          service_id,
          services(id, name)
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }
};

export const createConsultant = async (consultant: any) => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .insert(consultant)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating consultant:', error);
    throw error;
  }
};

export const updateConsultant = async (id: string, consultant: any) => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .update(consultant)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating consultant:', error);
    throw error;
  }
};

export const deleteConsultant = async (id: string) => {
  try {
    const { error } = await supabase
      .from('consultants')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting consultant:', error);
    throw error;
  }
};

export const fetchConsultantServices = async (consultantId: string) => {
  try {
    const { data, error } = await supabase
      .from('consultant_services')
      .select(`
        service_id,
        services(id, name)
      `)
      .eq('consultant_id', consultantId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultant services:', error);
    return [];
  }
};

export const updateConsultantServices = async (consultantId: string, serviceIds: string[]) => {
  try {
    // Remover serviços existentes
    await supabase
      .from('consultant_services')
      .delete()
      .eq('consultant_id', consultantId);

    // Adicionar novos serviços
    if (serviceIds.length > 0) {
      const serviceRelations = serviceIds.map(serviceId => ({
        consultant_id: consultantId,
        service_id: serviceId
      }));

      const { error } = await supabase
        .from('consultant_services')
        .insert(serviceRelations);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating consultant services:', error);
    throw error;
  }
};

export const checkConsultantAuthorizedForService = async (consultantId: string, serviceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('consultant_services')
      .select('id')
      .eq('consultant_id', consultantId)
      .eq('service_id', serviceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking consultant authorization:', error);
    return false;
  }
};

export const calculateConsultantWorkedHours = async (consultantId: string): Promise<number> => {
  try {
    console.log(`Calculating worked hours for consultant: ${consultantId}`);
    
    // Buscar todas as etapas onde o consultor está diretamente alocado
    const { data: stageHours, error: stageError } = await supabase
      .from('project_stages')
      .select('hours, project_id, name')
      .eq('consultant_id', consultantId);

    if (stageError) {
      console.error('Error fetching stage hours:', stageError);
      throw stageError;
    }

    console.log(`Stage hours for consultant ${consultantId}:`, stageHours);
    
    let totalStageHours = 0;
    if (stageHours && stageHours.length > 0) {
      totalStageHours = stageHours.reduce((sum, stage) => sum + (stage.hours || 0), 0);
    }

    // Buscar projetos onde o consultor é principal ou de apoio e somar as horas totais
    const { data: projectHours, error: projectError } = await supabase
      .from('projects')
      .select('total_hours, id, name')
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`);

    if (projectError) {
      console.error('Error fetching project hours:', projectError);
      throw projectError;
    }

    console.log(`Project hours for consultant ${consultantId}:`, projectHours);

    let totalProjectHours = 0;
    if (projectHours && projectHours.length > 0) {
      totalProjectHours = projectHours.reduce((sum, project) => sum + (project.total_hours || 0), 0);
    }

    // Usar o maior valor entre horas das etapas e horas dos projetos
    const totalHours = Math.max(totalStageHours, totalProjectHours);
    
    console.log(`Total worked hours for consultant ${consultantId}: ${totalHours} (stage: ${totalStageHours}, project: ${totalProjectHours})`);
    
    return totalHours;
  } catch (error) {
    console.error('Error calculating consultant worked hours:', error);
    return 0;
  }
};

export const calculateConsultantAvailableHours = async (consultantId: string, hoursPerMonth: number = 160): Promise<number> => {
  try {
    const workedHours = await calculateConsultantWorkedHours(consultantId);
    const available = Math.max(0, hoursPerMonth - workedHours);
    console.log(`Available hours for consultant ${consultantId}: ${available} (total: ${hoursPerMonth}, worked: ${workedHours})`);
    return available;
  } catch (error) {
    console.error('Error calculating consultant available hours:', error);
    return hoursPerMonth;
  }
};

export const calculateConsultantActiveProjects = async (consultantId: string): Promise<number> => {
  try {
    console.log(`Calculating active projects for consultant: ${consultantId}`);
    
    // Buscar projetos onde o consultor é principal ou de apoio
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`)
      .in('status', ['active', 'em_producao', 'em_planejamento']);

    if (error) {
      console.error('Error fetching consultant projects:', error);
      throw error;
    }
    
    console.log(`Active projects for consultant ${consultantId}:`, projects);
    
    const projectCount = projects?.length || 0;
    console.log(`Total active projects for consultant ${consultantId}: ${projectCount}`);
    
    return projectCount;
  } catch (error) {
    console.error('Error calculating consultant active projects:', error);
    return 0;
  }
};

export const fetchConsultantProjects = async (consultantId: string) => {
  try {
    // Buscar projetos onde o consultor é principal ou de apoio
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, name, description, start_date, end_date, total_value, status,
        clients(name),
        services(name)
      `)
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`)
      .order('start_date', { ascending: false });

    if (projectsError) throw projectsError;

    // Buscar etapas dos projetos onde o consultor está envolvido
    const projectIds = projects?.map(p => p.id) || [];
    let stages = [];
    
    if (projectIds.length > 0) {
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .in('project_id', projectIds);

      if (stagesError) throw stagesError;
      stages = stagesData || [];
    }

    // Calcular estatísticas
    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    
    const totalHours = stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
    const totalValue = projects?.reduce((sum, project) => sum + (project.total_value || 0), 0) || 0;

    return {
      projects: projects || [],
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalHours,
        totalValue
      }
    };
  } catch (error) {
    console.error('Error fetching consultant projects:', error);
    return {
      projects: [],
      stats: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalHours: 0,
        totalValue: 0
      }
    };
  }
};
