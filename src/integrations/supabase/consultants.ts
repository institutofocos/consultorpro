
import { supabase } from "./client";

export type Consultant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  commissionPercentage?: number; // Updated from commission_percentage
  salary?: number;
  pixKey?: string; // Updated from pix_key
  created_at?: string;
  updated_at?: string;
  hoursPerMonth?: number;
  availableHours?: number;
};

export const fetchConsultants = async (): Promise<Consultant[]> => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name, email, phone, commission_percentage, salary, created_at, updated_at, pix_key, hours_per_month')
      .order('name');

    if (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }

    // Map database field names to our TypeScript model field names
    const consultants = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      commissionPercentage: item.commission_percentage,
      salary: item.salary,
      pixKey: item.pix_key,
      created_at: item.created_at,
      updated_at: item.updated_at,
      hoursPerMonth: item.hours_per_month || 160
    }));

    // Fetch and calculate available hours for each consultant
    for (const consultant of consultants) {
      consultant.availableHours = await calculateConsultantAvailableHours(consultant.id, consultant.hoursPerMonth);
    }

    return consultants;
  } catch (error) {
    console.error('Error in fetchConsultants:', error);
    return [];
  }
};

export const calculateConsultantAvailableHours = async (consultantId: string, hoursPerMonth: number = 160): Promise<number> => {
  try {
    // Get all active projects where this consultant is the main or support
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, stages')
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`)
      .eq('status', 'active');
    
    if (projectsError) {
      console.error('Error fetching projects for consultant:', projectsError);
      return hoursPerMonth;
    }

    let allocatedHours = 0;

    // Calculate hours from projects
    for (const project of projects || []) {
      if (project.stages) {
        const stages = typeof project.stages === 'string' 
          ? JSON.parse(project.stages) 
          : project.stages;
        
        if (Array.isArray(stages)) {
          for (const stage of stages) {
            // Only count stages that are not completed and have this consultant assigned
            if (!stage.completed && 
                (stage.consultantId === consultantId || !stage.consultantId)) {
              allocatedHours += Number(stage.hours || 0);
            }
          }
        }
      }
    }

    return Math.max(0, hoursPerMonth - allocatedHours);
  } catch (error) {
    console.error('Error calculating consultant available hours:', error);
    return hoursPerMonth;
  }
};

export const fetchConsultantById = async (id: string): Promise<Consultant | null> => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching consultant:', error);
      throw error;
    }

    if (!data) return null;

    // Map database field names to our TypeScript model field names
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      commissionPercentage: data.commission_percentage,
      salary: data.salary,
      pixKey: data.pix_key,
      created_at: data.created_at,
      updated_at: data.updated_at,
      hoursPerMonth: data.hours_per_month || 160
    };
  } catch (error) {
    console.error('Error in fetchConsultantById:', error);
    return null;
  }
};
