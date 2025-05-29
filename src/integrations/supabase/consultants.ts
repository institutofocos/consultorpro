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
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];

    // Buscar todas as etapas onde o consultor está vinculado no mês vigente
    const { data, error } = await supabase
      .from('project_stages')
      .select('hours')
      .eq('consultant_id', consultantId)
      .gte('start_date', firstDayStr)
      .lte('end_date', lastDayStr);

    if (error) throw error;
    
    const totalHours = data?.reduce((sum, stage) => sum + (stage.hours || 0), 0) || 0;
    return totalHours;
  } catch (error) {
    console.error('Error calculating consultant worked hours:', error);
    return 0;
  }
};

export const calculateConsultantAvailableHours = async (consultantId: string, hoursPerMonth: number = 160): Promise<number> => {
  try {
    const workedHours = await calculateConsultantWorkedHours(consultantId);
    return Math.max(0, hoursPerMonth - workedHours);
  } catch (error) {
    console.error('Error calculating consultant available hours:', error);
    return hoursPerMonth;
  }
};

export const calculateConsultantActiveProjects = async (consultantId: string): Promise<number> => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const firstDayStr = firstDayOfMonth.toISOString().split('T')[0];
    const lastDayStr = lastDayOfMonth.toISOString().split('T')[0];

    // Buscar projetos únicos onde o consultor tem etapas no mês vigente
    const { data, error } = await supabase
      .from('project_stages')
      .select('project_id')
      .eq('consultant_id', consultantId)
      .gte('start_date', firstDayStr)
      .lte('end_date', lastDayStr);

    if (error) throw error;
    
    // Contar projetos únicos
    const uniqueProjects = new Set(data?.map(stage => stage.project_id) || []);
    return uniqueProjects.size;
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
