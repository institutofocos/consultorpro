// This file contains services related to services management
import { supabase } from "./client";
import { Database } from "./types";
import { Service, ServiceData } from "../../components/services/types"; // Fixed import path;

export const getServices = async (): Promise<Service[]> => {
  try {
    // Use 'any' to bypass TypeScript checking since services table isn't in the types
    const { data, error } = await (supabase as any)
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to match the Service interface
    const services: Service[] = (data || []).map((service: any) => {
      let parsedStages = [];
      try {
        parsedStages = JSON.parse(service.stages || '[]');
      } catch (e) {
        console.error('Error parsing stages JSON:', e);
      }
      
      return {
        ...service,
        stages: parsedStages,
        tags: [] // Initialize with empty array
      };
    });
    
    return services;
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
    
    if (!data) return null;
    
    let parsedStages = [];
    try {
      parsedStages = JSON.parse(data.stages || '[]');
    } catch (e) {
      console.error('Error parsing stages JSON:', e);
    }
    
    return {
      ...data,
      stages: parsedStages,
      tags: [] // Initialize with empty array
    };
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
    
    let parsedStages = [];
    try {
      parsedStages = JSON.parse(data.stages || '[]');
    } catch (e) {
      console.error('Error parsing stages JSON:', e);
    }
    
    return {
      ...data,
      stages: parsedStages,
      tags: [] // Initialize with empty array
    };
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
