
import { supabase } from './client';
import type { Database } from './types';

export type WhatsAppConnection = Database['public']['Tables']['whatsapp_connections']['Row'];
export type WhatsAppContact = Database['public']['Tables']['whatsapp_contacts']['Row'];
export type WhatsAppChatMapping = Database['public']['Tables']['whatsapp_chat_mappings']['Row'];

// Funções para gerenciar conexões WhatsApp
export const fetchWhatsAppConnections = async () => {
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar conexões WhatsApp:', error);
    throw error;
  }
  
  return data;
};

export const createWhatsAppConnection = async (connection: {
  user_id: string;
  instance_name: string;
  evolution_api_url: string;
  evolution_api_key: string;
  export_from_date?: string;
}) => {
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .insert(connection)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar conexão WhatsApp:', error);
    throw error;
  }
  
  return data;
};

export const updateWhatsAppConnection = async (id: string, updates: Partial<WhatsAppConnection>) => {
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao atualizar conexão WhatsApp:', error);
    throw error;
  }
  
  return data;
};

export const deleteWhatsAppConnection = async (id: string) => {
  const { error } = await supabase
    .from('whatsapp_connections')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Erro ao deletar conexão WhatsApp:', error);
    throw error;
  }
};

// Funções para interagir com a API Evolution
export const generateQRCode = async (connection: WhatsAppConnection) => {
  try {
    const response = await fetch(`${connection.evolution_api_url}/instance/connect/${connection.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': connection.evolution_api_key,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Evolution: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.base64; // QR code em base64
  } catch (error) {
    console.error('Erro ao gerar QR code:', error);
    throw error;
  }
};

export const checkConnectionStatus = async (connection: WhatsAppConnection) => {
  try {
    const response = await fetch(`${connection.evolution_api_url}/instance/connectionState/${connection.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': connection.evolution_api_key,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Evolution: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.instance?.state || 'disconnected';
  } catch (error) {
    console.error('Erro ao verificar status da conexão:', error);
    throw error;
  }
};

export const fetchWhatsAppChats = async (connection: WhatsAppConnection) => {
  try {
    const response = await fetch(`${connection.evolution_api_url}/chat/findChats/${connection.instance_name}`, {
      method: 'GET',
      headers: {
        'apikey': connection.evolution_api_key,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Evolution: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar chats do WhatsApp:', error);
    throw error;
  }
};

export const syncWhatsAppMessages = async (connection: WhatsAppConnection, chatId: string, fromDate?: string) => {
  try {
    const response = await fetch(`${connection.evolution_api_url}/chat/findMessages/${connection.instance_name}`, {
      method: 'POST',
      headers: {
        'apikey': connection.evolution_api_key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        where: {
          remoteJid: chatId,
          fromMe: false,
          ...(fromDate && { messageTimestamp: { $gte: new Date(fromDate).getTime() / 1000 } })
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erro na API Evolution: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao sincronizar mensagens do WhatsApp:', error);
    throw error;
  }
};

// Funções para gerenciar contatos WhatsApp
export const createWhatsAppContact = async (contact: {
  connection_id: string;
  whatsapp_id: string;
  name: string;
  phone_number?: string;
  is_group?: boolean;
  group_participants?: any;
}) => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .insert(contact)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar contato WhatsApp:', error);
    throw error;
  }
  
  return data;
};

export const fetchWhatsAppContacts = async (connectionId: string) => {
  const { data, error } = await supabase
    .from('whatsapp_contacts')
    .select('*')
    .eq('connection_id', connectionId)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar contatos WhatsApp:', error);
    throw error;
  }
  
  return data;
};

// Funções para mapeamento de salas de chat
export const createChatMapping = async (mapping: {
  chat_room_id: string;
  whatsapp_contact_id: string;
  connection_id: string;
}) => {
  const { data, error } = await supabase
    .from('whatsapp_chat_mappings')
    .insert(mapping)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar mapeamento de chat:', error);
    throw error;
  }
  
  return data;
};

export const fetchChatMappings = async (connectionId: string) => {
  const { data, error } = await supabase
    .from('whatsapp_chat_mappings')
    .select(`
      *,
      chat_room:chat_rooms(*),
      whatsapp_contact:whatsapp_contacts(*)
    `)
    .eq('connection_id', connectionId);
  
  if (error) {
    console.error('Erro ao buscar mapeamentos de chat:', error);
    throw error;
  }
  
  return data;
};
