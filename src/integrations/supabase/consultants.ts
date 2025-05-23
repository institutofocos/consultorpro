
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
};

export const fetchConsultants = async (): Promise<Consultant[]> => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name, email, phone, commission_percentage, salary, created_at, updated_at, pix_key')
      .order('name');

    if (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }

    // Map database field names to our TypeScript model field names
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      commissionPercentage: item.commission_percentage,
      salary: item.salary,
      pixKey: item.pix_key,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('Error in fetchConsultants:', error);
    return [];
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
      updated_at: data.updated_at
    };
  } catch (error) {
    console.error('Error in fetchConsultantById:', error);
    return null;
  }
};
