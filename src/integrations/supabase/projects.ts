
import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name),
        main_consultant:main_consultant_id(id, name),
        support_consultant:support_consultant_id(id, name),
        project_stages(
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          completed,
          completed_at,
          value,
          consultant_id,
          consultants:consultant_id(id, name)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    // Transformar os dados para o formato esperado pela interface
    const transformedData = data?.map(project => ({
      ...project,
      client_name: project.clients?.name,
      service_name: project.services?.name,
      main_consultant_name: project.main_consultant?.name,
      support_consultant_name: project.support_consultant?.name,
      stages: project.project_stages?.map(stage => ({
        ...stage,
        consultant_name: stage.consultants?.name
      })) || []
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
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
    // Definir status inicial como 'em_producao'
    const projectData = {
      ...project,
      status: 'em_producao'
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (id: string, project: any) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(project)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};
