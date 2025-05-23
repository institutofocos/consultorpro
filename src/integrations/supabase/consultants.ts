
import { supabase } from "./client";

export type Consultant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  commission_percentage?: number;
  salary?: number;
  created_at?: string;
  updated_at?: string;
};

export const fetchConsultants = async (): Promise<Consultant[]> => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name, email, phone, commission_percentage, salary, created_at, updated_at')
      .order('name');

    if (error) {
      console.error('Error fetching consultants:', error);
      throw error;
    }

    return data || [];
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

    return data;
  } catch (error) {
    console.error('Error in fetchConsultantById:', error);
    return null;
  }
};
