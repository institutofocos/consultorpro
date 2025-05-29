
import { supabase } from "./client";

export type Service = {
  id: string;
  name: string;
  description?: string;
  url?: string;
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

export const deleteService = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteService:', error);
    throw error;
  }
};

// New function to upload file to Supabase Storage
export const uploadServiceFile = async (file: File, serviceName: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    // Create a unique file path using timestamp and random string
    const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const storagePath = `service-files/${serviceName}/${filePath}`;
    
    const { data, error } = await supabase.storage
      .from('services')
      .upload(storagePath, file);
    
    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
    
    // Return the path to the uploaded file
    return storagePath;
  } catch (error) {
    console.error('Error in uploadServiceFile:', error);
    return null;
  }
};

// Function to get a public URL for a file
export const getServiceFileUrl = async (filePath: string): Promise<string | null> => {
  try {
    const { data } = supabase.storage
      .from('services')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting file URL:', error);
    return null;
  }
};

// Function to download a file
export const downloadServiceFile = async (filePath: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('services')
      .download(filePath);
    
    if (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error in downloadServiceFile:', error);
    return null;
  }
};

// Function to create or update a service
export const createOrUpdateService = async (serviceData: any, isUpdate: boolean = false, serviceId?: string): Promise<any> => {
  try {
    console.log('Creating/updating service with data:', serviceData);
    
    // Ensure required fields have default values
    const sanitizedData = {
      name: serviceData.name || '',
      description: serviceData.description || null,
      url: serviceData.url || null,
      tax_rate: Number(serviceData.tax_rate) || 16,
      total_hours: Number(serviceData.total_hours) || 0,
      hourly_rate: serviceData.hourly_rate ? Number(serviceData.hourly_rate) : null,
      total_value: serviceData.total_value ? Number(serviceData.total_value) : null,
      net_value: serviceData.net_value ? Number(serviceData.net_value) : null,
      extra_costs: Number(serviceData.extra_costs) || 0,
      stages: serviceData.stages || null,
    };
    
    if (isUpdate && serviceId) {
      const { data, error } = await supabase
        .from('services')
        .update(sanitizedData)
        .eq('id', serviceId)
        .select('id')
        .single();
        
      if (error) {
        console.error('Error updating service:', error);
        throw error;
      }
      
      return data;
    } else {
      const { data, error } = await supabase
        .from('services')
        .insert([sanitizedData])
        .select('id')
        .single();
        
      if (error) {
        console.error('Error creating service:', error);
        throw error;
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error in createOrUpdateService:', error);
    throw error;
  }
};

export const createService = async (serviceData: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> => {
  try {
    const sanitizedData = {
      name: serviceData.name || '',
      description: serviceData.description || null,
      url: serviceData.url || null,
      tax_rate: Number(serviceData.tax_rate) || 16,
      total_hours: Number(serviceData.total_hours) || 0,
      hourly_rate: serviceData.hourly_rate ? Number(serviceData.hourly_rate) : null,
      total_value: serviceData.total_value ? Number(serviceData.total_value) : null,
      net_value: serviceData.net_value ? Number(serviceData.net_value) : null,
      extra_costs: Number(serviceData.extra_costs) || 0,
      stages: serviceData.stages || null,
    };

    const { data, error } = await supabase
      .from('services')
      .insert([sanitizedData])
      .select()
      .single();

    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createService:', error);
    throw error;
  }
};

export const updateService = async (id: string, serviceData: Partial<Omit<Service, 'id' | 'created_at' | 'updated_at'>>): Promise<Service> => {
  try {
    const sanitizedData = {
      ...(serviceData.name !== undefined && { name: serviceData.name }),
      ...(serviceData.description !== undefined && { description: serviceData.description || null }),
      ...(serviceData.url !== undefined && { url: serviceData.url || null }),
      ...(serviceData.tax_rate !== undefined && { tax_rate: Number(serviceData.tax_rate) }),
      ...(serviceData.total_hours !== undefined && { total_hours: Number(serviceData.total_hours) }),
      ...(serviceData.hourly_rate !== undefined && { hourly_rate: serviceData.hourly_rate ? Number(serviceData.hourly_rate) : null }),
      ...(serviceData.total_value !== undefined && { total_value: serviceData.total_value ? Number(serviceData.total_value) : null }),
      ...(serviceData.net_value !== undefined && { net_value: serviceData.net_value ? Number(serviceData.net_value) : null }),
      ...(serviceData.extra_costs !== undefined && { extra_costs: Number(serviceData.extra_costs) }),
      ...(serviceData.stages !== undefined && { stages: serviceData.stages }),
    };

    const { data, error } = await supabase
      .from('services')
      .update(sanitizedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateService:', error);
    throw error;
  }
};
