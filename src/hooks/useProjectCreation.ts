
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWebhookProcessor } from './useWebhookProcessor';
import { toast } from 'sonner';

interface ProjectData {
  name: string;
  description?: string;
  client_id?: string;
  service_id?: string;
  main_consultant_id?: string;
  support_consultant_id?: string;
  start_date: string;
  end_date: string;
  total_value: number;
  total_hours?: number;
  hourly_rate?: number;
  tax_percent: number;
  third_party_expenses?: number;
  main_consultant_value?: number;
  support_consultant_value?: number;
  main_consultant_commission?: number;
  support_consultant_commission?: number;
  manager_name?: string;
  manager_email?: string;
  manager_phone?: string;
  url?: string;
  project_id?: string;
  status: string;
}

interface StageData {
  name: string;
  description?: string;
  days: number;
  hours: number;
  value: number;
  start_date?: string;
  end_date?: string;
  consultant_id?: string;
  status: string;
  valor_de_repasse?: number;
  stage_order: number;
}

export const useProjectCreation = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { sendProjectWebhook } = useWebhookProcessor();

  const createProjectWithStages = async (projectData: ProjectData, stages: StageData[]) => {
    setIsCreating(true);
    
    try {
      console.log('Iniciando criação de projeto...');
      
      // 1. Criar o projeto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        throw new Error(`Erro ao criar projeto: ${projectError.message}`);
      }

      console.log('Projeto criado com sucesso:', project.id);

      // 2. Criar as etapas se existirem
      let createdStages = [];
      if (stages && stages.length > 0) {
        const stagesWithProjectId = stages.map(stage => ({
          ...stage,
          project_id: project.id
        }));

        const { data: stagesData, error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesWithProjectId)
          .select();

        if (stagesError) {
          throw new Error(`Erro ao criar etapas: ${stagesError.message}`);
        }

        createdStages = stagesData;
        console.log('Etapas criadas:', createdStages.length);
      }

      // 3. Tentar enviar webhook (sem bloquear o sucesso)
      try {
        await sendProjectWebhook(project.id);
      } catch (webhookError) {
        console.log('Webhook falhou, mas projeto foi criado com sucesso');
      }

      toast.success('Projeto criado com sucesso!', {
        description: `Projeto "${project.name}" foi criado ${createdStages.length > 0 ? `com ${createdStages.length} etapas` : ''}`
      });

      return {
        success: true,
        project,
        stages: createdStages
      };
      
    } catch (error) {
      console.error('Erro na criação do projeto:', error);
      
      toast.error('Erro ao criar projeto', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProjectWithStages,
    isCreating
  };
};
