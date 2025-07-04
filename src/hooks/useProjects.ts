
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  client_id: string;
  service_id: string;
  main_consultant_id?: string;
  support_consultant_id?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  total_hours?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('🚀 Carregando projetos...');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao carregar projetos:', error);
        throw error;
      }

      console.log('✅ Projetos carregados com sucesso:', data?.length || 0);
      return data as Project[];
    },
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'project_id'>) => {
      console.log('🔄 Criando novo projeto:', projectData);
      
      try {
        // Ensure required fields are present
        const dataToInsert = {
          name: projectData.name,
          start_date: projectData.start_date,
          end_date: projectData.end_date,
          total_value: projectData.total_value || 0,
          status: projectData.status || 'ativo',
          client_id: projectData.client_id,
          service_id: projectData.service_id,
          description: projectData.description,
          main_consultant_id: projectData.main_consultant_id,
          support_consultant_id: projectData.support_consultant_id,
          total_hours: projectData.total_hours,
        };

        const { data, error } = await supabase
          .from('projects')
          .insert(dataToInsert)
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao criar projeto:', error);
          throw error;
        }

        console.log('✅ Projeto criado com sucesso:', data);
        return data;
      } catch (error) {
        console.error('❌ Erro na criação do projeto:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Projeto "${data.name}" criado com sucesso!`);
      console.log('✅ Cache invalidado e toast exibido');
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação de criação:', error);
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      console.log('🔄 Atualizando projeto:', id, updates);
      
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar projeto:', error);
        throw error;
      }

      console.log('✅ Projeto atualizado com sucesso:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success(`Projeto "${data.name}" atualizado com sucesso!`);
    },
    onError: (error: any) => {
      console.error('❌ Erro na atualização do projeto:', error);
      toast.error(`Erro ao atualizar projeto: ${error.message}`);
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      console.log('🗑️ Deletando projeto:', projectId);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.error('❌ Erro ao deletar projeto:', error);
        throw error;
      }

      console.log('✅ Projeto deletado com sucesso');
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projeto deletado com sucesso!');
    },
    onError: (error: any) => {
      console.error('❌ Erro na deleção do projeto:', error);
      toast.error(`Erro ao deletar projeto: ${error.message}`);
    },
  });
};
