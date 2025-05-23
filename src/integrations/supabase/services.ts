
import { supabase } from "./client";

export type Service = {
  id: string;
  name: string;
  description?: string;
  tax_rate: number;
  total_hours: number;
  hourly_rate?: number;
  total_value?: number;
  net_value?: number;
  extra_costs?: number;
  stages?: any;
  created_at?: string;
  updated_at?: string;
};

export const fetchServices = async (): Promise<Service[]> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching services:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchServices:', error);
    return [];
  }
};

export const fetchServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchServiceById:', error);
    return null;
  }
};
