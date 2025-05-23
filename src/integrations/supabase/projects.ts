
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
        main_consultant_id: project.mainConsultantId || null, // Now properly supports null consultants
        main_consultant_commission: project.mainConsultantCommission || 0,
        support_consultant_id: project.supportConsultantId || null,
        support_consultant_commission: project.supportConsultantCommission || 0,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses || 0,
        main_consultant_value: project.consultantValue || 0,
        support_consultant_value: project.supportConsultantValue || 0,
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
        clients(name),
        services:service_id(id, name, total_hours, stages)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the data to include client name and service information
    return (data || []).map(project => {
      // Calculate total days from the service stages if available
      let totalDays = 0;
      let totalHours = 0;
      
      if (project.services?.stages) {
        try {
          const stages = typeof project.services.stages === 'string' 
            ? JSON.parse(project.services.stages) 
            : project.services.stages;
          
          if (Array.isArray(stages)) {
            totalDays = stages.reduce((sum, stage) => sum + (stage.days || 0), 0);
            totalHours = stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
          }
        } catch (e) {
          console.error('Error parsing service stages:', e);
        }
      }
      
      // Use service total_hours if available
      if (project.services?.total_hours) {
        totalHours = Number(project.services.total_hours);
      }
      
      return {
        ...project,
        clientName: project.clients ? project.clients.name : null,
        serviceName: project.services ? project.services.name : null,
        totalHours: totalHours,
        totalDays: totalDays
      };
    });

  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};

// New function to assign consultants to a demand
export const assignConsultantsToDemand = async (
  projectId: string, 
  mainConsultantId: string | null, 
  mainConsultantCommission: number = 0,
  supportConsultantId: string | null = null,
  supportConsultantCommission: number = 0
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
      .eq('id', projectId)
      .select();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning consultants to demand:', error);
    throw error;
  }
};
