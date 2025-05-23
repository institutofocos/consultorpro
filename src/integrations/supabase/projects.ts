import { supabase } from "./client";

export const updateProject = async (project: any) => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        service_id: project.serviceId || null,
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
        stages: project.stages,
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

// New function to fetch all available tags
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
