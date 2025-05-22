
import { supabase } from "./client";

// Define service type
export interface Service {
  id: string;
  name: string;
  description: string;
  totalHours: number;
  hourlyRate: number;
  totalValue: number;
  taxRate: number;
  extraCosts: number;
  netValue: number;
  stages: string; // JSON string of stages
  created_at: string;
}

// Define tag type
export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

// Define service tag relationship type
export interface ServiceTag {
  id: string;
  service_id: string;
  tag_id: string;
  created_at: string;
}

// Create initial services table (run once)
export const createServicesTable = async () => {
  const { error } = await supabase.rpc('create_services_table');
  return { error };
};

// Get all services
export const getServices = async () => {
  return await supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: false });
};

// Get a specific service by ID
export const getServiceById = async (id: string) => {
  return await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();
};

// Create a new service
export const createService = async (service: Omit<Service, 'id' | 'created_at'>) => {
  return await supabase
    .from('services')
    .insert([service])
    .select();
};

// Update an existing service
export const updateService = async (id: string, service: Partial<Service>) => {
  return await supabase
    .from('services')
    .update(service)
    .eq('id', id);
};

// Delete a service
export const deleteService = async (id: string) => {
  return await supabase
    .from('services')
    .delete()
    .eq('id', id);
};

// Get all tags
export const getTags = async () => {
  return await supabase
    .from('tags')
    .select('*')
    .order('name');
};

// Create a new tag
export const createTag = async (name: string) => {
  return await supabase
    .from('tags')
    .insert([{ name }])
    .select();
};

// Delete a tag
export const deleteTag = async (id: string) => {
  return await supabase
    .from('tags')
    .delete()
    .eq('id', id);
};

// Get tags for a specific service
export const getServiceTags = async (serviceId: string) => {
  return await supabase
    .from('service_tags')
    .select('tag_id, tags(id, name)')
    .eq('service_id', serviceId);
};

// Add tags to a service
export const addTagsToService = async (serviceId: string, tagIds: string[]) => {
  const serviceTags = tagIds.map(tagId => ({
    service_id: serviceId,
    tag_id: tagId
  }));
  
  return await supabase
    .from('service_tags')
    .insert(serviceTags);
};

// Remove tags from a service
export const removeTagsFromService = async (serviceId: string) => {
  return await supabase
    .from('service_tags')
    .delete()
    .eq('service_id', serviceId);
};
