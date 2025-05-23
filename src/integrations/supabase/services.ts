
import { supabase } from "./client";
import { BasicService, ServiceData } from "@/components/services/types";

// Function to fetch all services
export const fetchServices = async (): Promise<BasicService[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name');
    
  if (error) {
    throw error;
  }
  
  return (data || []).map(service => ({
    id: service.id,
    name: service.name,
    total_value: service.total_value,
    tax_rate: service.tax_rate,
    stages: service.stages
  }));
};

// Function to fetch a single service by ID
export const fetchServiceById = async (id: string): Promise<ServiceData | null> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Service not found
    }
    throw error;
  }
  
  return data;
};
