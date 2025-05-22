
// This file contains services related to services management
import { supabase } from './client';

export interface ServiceData {
  name: string;
  description: string;
  totalHours: number;
  hourlyRate: number;
  totalValue: number;
  taxRate: number;
  extraCosts: number;
  netValue: number;
  stages: string; // JSON string
}

export interface ServiceTag {
  id: string;
  name: string;
}

export interface Service extends ServiceData {
  id: string;
  created_at: string;
  tags?: ServiceTag[];
  stages?: any[];
}

export const getServices = async (): Promise<Service[]> => {
  try {
    // Use 'any' to bypass TypeScript checking since services table isn't in the types
    const { data, error } = await (supabase as any)
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data, error } = await (supabase as any)
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error);
    throw error;
  }
};

export const createService = async (serviceData: ServiceData): Promise<Service> => {
  try {
    const { data, error } = await (supabase as any)
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
};

export const updateService = async (id: string, serviceData: Partial<ServiceData>): Promise<void> => {
  try {
    const { error } = await (supabase as any)
      .from('services')
      .update(serviceData)
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error updating service with ID ${id}:`, error);
    throw error;
  }
};

export const deleteService = async (id: string): Promise<void> => {
  try {
    const { error } = await (supabase as any)
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting service with ID ${id}:`, error);
    throw error;
  }
};
