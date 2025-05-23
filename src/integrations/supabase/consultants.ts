
import { supabase } from "./client";

export type Consultant = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  education?: string;
  hours_per_month?: number;
  commission_percentage?: number;
  salary?: number;
  pix_key?: string;
  created_at?: string;
  updated_at?: string;
};

export const fetchConsultants = async (): Promise<Consultant[]> => {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching consultants:', error);
    throw error;
  }

  return data || [];
};

export const fetchConsultantById = async (id: string): Promise<Consultant | null> => {
  const { data, error } = await supabase
    .from('consultants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching consultant with ID ${id}:`, error);
    throw error;
  }

  return data;
};
