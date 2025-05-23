
import { supabase } from "./client";

export const fetchConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('*')
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
