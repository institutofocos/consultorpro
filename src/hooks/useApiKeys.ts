
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface APIKey {
  id: string;
  name: string;
  key_value: string;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  created_by?: string;
  last_used_at?: string;
  usage_count?: number;
}

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        toast({
          title: "Erro ao carregar chaves",
          description: "Não foi possível carregar as chaves de API",
          variant: "destructive"
        });
        return;
      }

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Erro ao carregar chaves",
        description: "Erro inesperado ao carregar as chaves de API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_api_key');
      
      if (error) {
        console.error('Error generating API key:', error);
        toast({
          title: "Erro ao gerar chave",
          description: "Não foi possível gerar uma nova chave de API",
          variant: "destructive"
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Erro ao gerar chave",
        description: "Erro inesperado ao gerar a chave de API",
        variant: "destructive"
      });
      return null;
    }
  };

  const createApiKey = async (name: string, description?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar uma chave de API",
          variant: "destructive"
        });
        return null;
      }

      const generatedKey = await generateApiKey();
      if (!generatedKey) return null;

      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          name,
          key_value: generatedKey,
          description: description || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        toast({
          title: "Erro ao criar chave",
          description: "Não foi possível salvar a chave de API",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Chave criada",
        description: "Nova chave de API criada com sucesso",
      });
      
      await fetchApiKeys();
      return data;
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Erro ao criar chave",
        description: "Erro inesperado ao criar a chave de API",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateApiKey = async (id: string, updates: Partial<APIKey>) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating API key:', error);
        toast({
          title: "Erro ao atualizar chave",
          description: "Não foi possível atualizar a chave de API",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Chave atualizada",
        description: "Chave de API atualizada com sucesso",
      });
      
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: "Erro ao atualizar chave",
        description: "Erro inesperado ao atualizar a chave de API",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting API key:', error);
        toast({
          title: "Erro ao excluir chave",
          description: "Não foi possível excluir a chave de API",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Chave excluída",
        description: "A chave de API foi excluída com sucesso",
      });
      
      await fetchApiKeys();
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Erro ao excluir chave",
        description: "Erro inesperado ao excluir a chave de API",
        variant: "destructive"
      });
      return false;
    }
  };

  const validateApiKey = async (apiKey: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_api_key', {
        api_key: apiKey
      });
      
      if (error) {
        console.error('Error validating API key:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error validating API key:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    fetchApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    validateApiKey,
    generateApiKey
  };
};
