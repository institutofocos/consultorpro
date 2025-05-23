
import { supabase } from "./client";
import { Project, Stage } from "@/components/projects/types";

export const updateProject = async (project: Project) => {
  try {
    // Convert the Stage[] array to a proper JSON object that Supabase can handle
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        service_id: project.serviceId || null,
        client_id: project.clientId || null,
        main_consultant_id: project.mainConsultantId,
        main_consultant_commission: project.mainConsultantCommission,
        support_consultant_id: project.supportConsultantId || null,
        support_consultant_commission: project.supportConsultantCommission,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses,
        main_consultant_value: project.consultantValue,
        support_consultant_value: project.supportConsultantValue,
        status: project.status,
        // Convert the stages array to a JSON object
        stages: project.stages as unknown as Record<string, any>,
        tags: project.tags || []
      })
      .eq('id', project.id);

    if (error) throw error;
    return project;
  } catch (error) {
    console.error('Error updating project:', error);
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
        clients(name)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the data to include client name
    return (data || []).map(project => ({
      ...project,
      clientName: project.clients ? project.clients.name : null
    }));

  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};
