
import { supabase } from "./client";
import { Consultant } from "@/components/projects/types";

export const fetchConsultants = async (): Promise<Consultant[]> => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('*')
      .order('name');
    
    if (error) throw error;
    
    return (data || []).map(consultant => ({
      id: consultant.id,
      name: consultant.name,
      email: consultant.email,
      phone: consultant.phone || '',
      pixKey: consultant.pix_key || '',
      commissionPercentage: consultant.commission_percentage || 0,
      salary: consultant.salary || 0,
      hoursPerMonth: consultant.hours_per_month || 160,
      street: consultant.street || '',
      city: consultant.city || '',
      state: consultant.state || '',
      zipCode: consultant.zip_code || '',
      education: consultant.education || '',
      createdAt: consultant.created_at,
      updatedAt: consultant.updated_at
    }));
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }
};

export const calculateConsultantAvailableHours = async (
  consultantId: string,
  hoursPerMonth: number
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_consultant_monthly_hours', {
        consultant_id: consultantId
      });

    if (error) {
      console.error('Error calculating consultant hours:', error);
      return hoursPerMonth; // Retorna o total se houver erro
    }

    const workedHours = data || 0;
    return Math.max(0, hoursPerMonth - workedHours);
  } catch (error) {
    console.error('Error calculating available hours:', error);
    return hoursPerMonth;
  }
};

export const calculateConsultantActiveProjects = async (consultantId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_consultant_active_projects', {
        consultant_id: consultantId
      });

    if (error) {
      console.error('Error calculating active projects:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error calculating active projects:', error);
    return 0;
  }
};

export const calculateConsultantWorkedHours = async (
  consultantId: string,
  targetMonth?: Date
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .rpc('calculate_consultant_monthly_hours', {
        consultant_id: consultantId,
        target_month: targetMonth || new Date()
      });

    if (error) {
      console.error('Error calculating worked hours:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('Error calculating worked hours:', error);
    return 0;
  }
};
