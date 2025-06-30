import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients(name),
        services(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching projects:", error);
      return [];
    }

    if (!projects) {
      return [];
    }

    // Transform the data to match the expected format
    const transformedProjects = await Promise.all(projects.map(async (project) => {
      // Fetch stages separately
      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .eq('project_id', project.id)
        .order('stage_order');

      if (stagesError) {
        console.error("Error fetching stages for project:", project.id, stagesError);
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        clientId: project.client_id,
        clientName: project.clients?.name || '',
        serviceId: project.service_id,
        serviceName: project.services?.name || '',
        mainConsultantId: project.main_consultant_id,
        mainConsultantCommission: project.main_consultant_commission,
        supportConsultantId: project.support_consultant_id,
        supportConsultantCommission: project.support_consultant_commission,
        startDate: project.start_date,
        endDate: project.end_date,
        totalValue: project.total_value,
        totalHours: project.total_hours,
        hourlyRate: project.hourly_rate,
        taxPercent: project.tax_percent,
        thirdPartyExpenses: project.third_party_expenses,
        mainConsultantValue: project.main_consultant_value,
        supportConsultantValue: project.support_consultant_value,
        managerName: project.manager_name,
        managerEmail: project.manager_email,
        managerPhone: project.manager_phone,
        status: project.status,
        tags: project.tags || [],
        url: project.url,
        projectId: project.project_id,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        stages: stages || []
      };
    }));

    return transformedProjects;
  } catch (error) {
    console.error("Unexpected error fetching projects:", error);
    return [];
  }
};

export const fetchProjectById = async (projectId: string) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients(name),
        services(name)
      `)
      .eq('id', projectId)
      .single();

    if (error) {
      console.error("Error fetching project by ID:", error);
      return null;
    }

    // Fetch stages separately
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', project.id)
      .order('stage_order');

    if (stagesError) {
      console.error("Error fetching stages for project:", project.id, stagesError);
    }

    // Transform the data to match the expected format
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      clientId: project.client_id,
      clientName: project.clients?.name || '',
      serviceId: project.service_id,
      serviceName: project.services?.name || '',
      mainConsultantId: project.main_consultant_id,
      mainConsultantCommission: project.main_consultant_commission,
      supportConsultantId: project.support_consultant_id,
      supportConsultantCommission: project.support_consultant_commission,
      startDate: project.start_date,
      endDate: project.end_date,
      totalValue: project.total_value,
      totalHours: project.total_hours,
      hourlyRate: project.hourly_rate,
      taxPercent: project.tax_percent,
      thirdPartyExpenses: project.third_party_expenses,
      mainConsultantValue: project.main_consultant_value,
      supportConsultantValue: project.support_consultant_value,
      managerName: project.manager_name,
      managerEmail: project.manager_email,
      managerPhone: project.manager_phone,
      status: project.status,
      tags: project.tags || [],
      url: project.url,
      projectId: project.project_id,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      stages: stages || []
    };
  } catch (error) {
    console.error("Unexpected error fetching project by ID:", error);
    return null;
  }
};

export const createProject = async (projectData: any) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error creating project:", error);
    return { data: null, error: { message: 'Unexpected error' } };
  }
};

export const updateProject = async (projectId: string, projectData: any) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Unexpected error updating project:", error);
    return { data: null, error: { message: 'Unexpected error' } };
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error("Error deleting project:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error deleting project:", error);
    return false;
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  console.log('=== fetchDemandsWithoutConsultants: INICIANDO ===');
  
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients(name),
        services(id, name)
      `)
      .is('main_consultant_id', null)
      .is('support_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro na busca de projetos sem consultores:', error);
      throw error;
    }

    console.log('Projetos encontrados (sem consultores):', projects?.length || 0);
    console.log('Primeiros 3 projetos:', projects?.slice(0, 3));

    if (!projects || projects.length === 0) {
      console.log('Nenhum projeto encontrado sem consultores');
      
      // Debug: verificar quantos projetos existem no total
      const { data: allProjects, error: allError } = await supabase
        .from('projects')
        .select('id, name, main_consultant_id, support_consultant_id')
        .order('created_at', { ascending: false });
      
      if (!allError && allProjects) {
        console.log('Total de projetos no sistema:', allProjects.length);
        console.log('Projetos com consultores:', allProjects.filter(p => p.main_consultant_id || p.support_consultant_id).length);
        console.log('Projetos sem consultores:', allProjects.filter(p => !p.main_consultant_id && !p.support_consultant_id).length);
      }
      
      return [];
    }

    // Transformar os dados para o formato esperado
    const transformedData = projects.map(project => {
      console.log('Transformando projeto:', project.name, 'ID:', project.id);
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        start_date: project.start_date,
        end_date: project.end_date,
        total_value: project.total_value,
        totalHours: project.total_hours,
        totalDays: calculateDaysBetweenDates(project.start_date, project.end_date),
        clientName: project.clients?.name || 'Cliente não especificado',
        serviceName: project.services?.name || 'Serviço não especificado',
        services: project.services,
        tags: project.tags || [],
        status: project.status,
        created_at: project.created_at,
        updated_at: project.updated_at
      };
    });

    console.log('Dados transformados:', transformedData.length, 'demandas');
    return transformedData;

  } catch (error) {
    console.error('Erro na função fetchDemandsWithoutConsultants:', error);
    throw error;
  }
};

// Função auxiliar para calcular dias entre datas
const calculateDaysBetweenDates = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const assignConsultantsToDemand = async (
  demandId: string,
  mainConsultantId: string | null,
  mainConsultantCommission: number,
  supportConsultantId: string | null,
  supportConsultantCommission: number
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
      .eq('id', demandId);

    if (error) {
      console.error("Error assigning consultants to demand:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error assigning consultants to demand:", error);
    throw error;
  }
};

export const fetchProjectTags = async () => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching project tags:", error);
    return [];
  }
};

export const fetchTags = fetchProjectTags; // Alias for backward compatibility
