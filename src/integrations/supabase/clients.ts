
import { supabase } from "./client";

export type Client = {
  id: string;
  name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  created_at?: string;
};

export const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchClients:', error);
    return [];
  }
};

export const fetchClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching client:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchClientById:', error);
    return null;
  }
};

export const createClient = async (clientData: Omit<Client, 'id' | 'created_at'>): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createClient:', error);
    throw error;
  }
};

export const updateClient = async (id: string, clientData: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<Client> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateClient:', error);
    throw error;
  }
};
