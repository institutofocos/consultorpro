import { supabase } from "./client";

export interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  serviceId?: string | null;
  clientId?: string | null;
  mainConsultantId?: string | null;
  mainConsultantCommission?: number;
  supportConsultantId?: string | null;
  supportConsultantCommission?: number;
  startDate: string;
  endDate: string;
  totalValue: number;
  taxPercent?: number;
  thirdPartyExpenses?: number;
  consultantValue?: number;
  supportConsultantValue?: number;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  totalHours?: number;
  hourlyRate?: number;
  status?: string;
  tags?: string[];
  tagIds?: string[];
  stages?: any[];
  url?: string;
}

export const createProject = async (projectData: ProjectData) => {
  console.log('=== CREATEPROJECT INICIADO ===');
  console.log('Dados recebidos:', JSON.stringify(projectData, null, 2));

  try {
    // Preparar dados para a tabela projects (mapeamento para snake_case)
    const projectPayload = {
      name: projectData.name,
      description: projectData.description || '',
      service_id: projectData.serviceId || null,
      client_id: projectData.clientId || null,
      main_consultant_id: projectData.mainConsultantId || null,
      main_consultant_commission: Number(projectData.mainConsultantCommission || 0),
      support_consultant_id: projectData.supportConsultantId || null,
      support_consultant_commission: Number(projectData.supportConsultantCommission || 0),
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      total_value: Number(projectData.totalValue || 0),
      tax_percent: Number(projectData.taxPercent || 16),
      third_party_expenses: Number(projectData.thirdPartyExpenses || 0),
      main_consultant_value: Number(projectData.consultantValue || 0),
      support_consultant_value: Number(projectData.supportConsultantValue || 0),
      manager_name: projectData.managerName || '',
      manager_email: projectData.managerEmail || '',
      manager_phone: projectData.managerPhone || '',
      total_hours: Number(projectData.totalHours || 0),
      hourly_rate: Number(projectData.hourlyRate || 0),
      status: projectData.status || 'planned',
      tags: projectData.tags || [],
      url: projectData.url || ''
    };

    console.log('Payload do projeto (snake_case):', JSON.stringify(projectPayload, null, 2));

    // Criar o projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectPayload)
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao criar projeto:', projectError);
      throw projectError;
    }

    console.log('Projeto criado com sucesso:', project);

    // Criar as etapas se existirem
    if (projectData.stages && projectData.stages.length > 0) {
      console.log('Criando etapas do projeto...');
      
      for (const stage of projectData.stages) {
        console.log('Processando etapa:', stage);
        
        const stagePayload = {
          project_id: project.id,
          name: stage.name,
          description: stage.description || '',
          days: Number(stage.days || 1),
          hours: Number(stage.hours || 8),
          value: Number(stage.value || 0),
          start_date: stage.startDate || null,
          end_date: stage.endDate || null,
          stage_order: Number(stage.stageOrder || 1),
          consultant_id: stage.consultantId || null,
          status: stage.status || 'iniciar_projeto',
          valor_de_repasse: Number(stage.valorDeRepasse || 0), // Campo crítico para o valor de repasse
          completed: false,
          client_approved: false,
          manager_approved: false,
          invoice_issued: false,
          payment_received: false,
          consultants_settled: false
        };

        console.log('Payload da etapa:', JSON.stringify(stagePayload, null, 2));
        console.log('valor_de_repasse sendo salvo:', stagePayload.valor_de_repasse);

        const { data: createdStage, error: stageError } = await supabase
          .from('project_stages')
          .insert(stagePayload)
          .select()
          .single();

        if (stageError) {
          console.error('Erro ao criar etapa:', stageError);
          throw stageError;
        }

        console.log('Etapa criada com sucesso:', createdStage);
        console.log('Valor de repasse salvo:', createdStage.valor_de_repasse);
      }
    }

    // Criar relações de tags se existirem
    if (projectData.tagIds && projectData.tagIds.length > 0) {
      console.log('Criando relações de tags...');
      
      const tagRelations = projectData.tagIds.map(tagId => ({
        project_id: project.id,
        tag_id: tagId
      }));

      const { error: tagError } = await supabase
        .from('project_tag_relations')
        .insert(tagRelations);

      if (tagError) {
        console.error('Erro ao criar relações de tags:', tagError);
        // Não falhar por causa das tags, apenas logar
      }
    }

    console.log('=== CREATEPROJECT FINALIZADO COM SUCESSO ===');
    return project;

  } catch (error) {
    console.error('=== ERRO NO CREATEPROJECT ===');
    console.error('Erro completo:', error);
    throw error;
  }
};

export const updateProject = async (projectData: ProjectData) => {
  console.log('=== UPDATEPROJECT INICIADO ===');
  console.log('Dados recebidos:', JSON.stringify(projectData, null, 2));

  try {
    if (!projectData.id) {
      throw new Error('ID do projeto é obrigatório para atualização');
    }

    // Preparar dados para a tabela projects (mapeamento para snake_case)
    const projectPayload = {
      name: projectData.name,
      description: projectData.description || '',
      service_id: projectData.serviceId || null,
      client_id: projectData.clientId || null,
      main_consultant_id: projectData.mainConsultantId || null,
      main_consultant_commission: Number(projectData.mainConsultantCommission || 0),
      support_consultant_id: projectData.supportConsultantId || null,
      support_consultant_commission: Number(projectData.supportConsultantCommission || 0),
      start_date: projectData.startDate,
      end_date: projectData.endDate,
      total_value: Number(projectData.totalValue || 0),
      tax_percent: Number(projectData.taxPercent || 16),
      third_party_expenses: Number(projectData.thirdPartyExpenses || 0),
      main_consultant_value: Number(projectData.consultantValue || 0),
      support_consultant_value: Number(projectData.supportConsultantValue || 0),
      manager_name: projectData.managerName || '',
      manager_email: projectData.managerEmail || '',
      manager_phone: projectData.managerPhone || '',
      total_hours: Number(projectData.totalHours || 0),
      hourly_rate: Number(projectData.hourlyRate || 0),
      status: projectData.status || 'planned',
      tags: projectData.tags || [],
      url: projectData.url || '',
      updated_at: new Date().toISOString()
    };

    console.log('Payload do projeto (snake_case):', JSON.stringify(projectPayload, null, 2));

    // Atualizar o projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .update(projectPayload)
      .eq('id', projectData.id)
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao atualizar projeto:', projectError);
      throw projectError;
    }

    console.log('Projeto atualizado com sucesso:', project);

    // Atualizar as etapas
    if (projectData.stages && projectData.stages.length > 0) {
      console.log('Atualizando etapas do projeto...');

      // Primeiro, buscar etapas existentes
      const { data: existingStages } = await supabase
        .from('project_stages')
        .select('id')
        .eq('project_id', projectData.id);

      // Deletar etapas que não estão mais presentes
      const newStageIds = projectData.stages
        .filter(stage => stage.id && !stage.id.startsWith('temp-'))
        .map(stage => stage.id);

      if (existingStages) {
        const stagesToDelete = existingStages.filter(
          stage => !newStageIds.includes(stage.id)
        );

        for (const stageToDelete of stagesToDelete) {
          await supabase
            .from('project_stages')
            .delete()
            .eq('id', stageToDelete.id);
        }
      }

      // Criar ou atualizar etapas
      for (const stage of projectData.stages) {
        console.log('Processando etapa:', stage);
        
        const stagePayload = {
          project_id: projectData.id,
          name: stage.name,
          description: stage.description || '',
          days: Number(stage.days || 1),
          hours: Number(stage.hours || 8),
          value: Number(stage.value || 0),
          start_date: stage.startDate || null,
          end_date: stage.endDate || null,
          stage_order: Number(stage.stageOrder || 1),
          consultant_id: stage.consultantId || null,
          status: stage.status || 'iniciar_projeto',
          valor_de_repasse: Number(stage.valorDeRepasse || 0), // Campo crítico para o valor de repasse
          completed: stage.completed || false,
          client_approved: stage.clientApproved || false,
          manager_approved: stage.managerApproved || false,
          invoice_issued: stage.invoiceIssued || false,
          payment_received: stage.paymentReceived || false,
          consultants_settled: stage.consultantsSettled || false,
          updated_at: new Date().toISOString()
        };

        console.log('Payload da etapa:', JSON.stringify(stagePayload, null, 2));
        console.log('valor_de_repasse sendo salvo:', stagePayload.valor_de_repasse);

        if (stage.id && !stage.id.startsWith('temp-')) {
          // Atualizar etapa existente
          const { data: updatedStage, error: stageError } = await supabase
            .from('project_stages')
            .update(stagePayload)
            .eq('id', stage.id)
            .select()
            .single();

          if (stageError) {
            console.error('Erro ao atualizar etapa:', stageError);
            throw stageError;
          }

          console.log('Etapa atualizada com sucesso:', updatedStage);
          console.log('Valor de repasse salvo:', updatedStage.valor_de_repasse);
        } else {
          // Criar nova etapa
          const { data: createdStage, error: stageError } = await supabase
            .from('project_stages')
            .insert(stagePayload)
            .select()
            .single();

          if (stageError) {
            console.error('Erro ao criar etapa:', stageError);
            throw stageError;
          }

          console.log('Etapa criada com sucesso:', createdStage);
          console.log('Valor de repasse salvo:', createdStage.valor_de_repasse);
        }
      }
    }

    // Atualizar relações de tags
    if (projectData.tagIds !== undefined) {
      // Deletar relações existentes
      await supabase
        .from('project_tag_relations')
        .delete()
        .eq('project_id', projectData.id);

      // Criar novas relações se existirem tags
      if (projectData.tagIds.length > 0) {
        const tagRelations = projectData.tagIds.map(tagId => ({
          project_id: projectData.id,
          tag_id: tagId
        }));

        const { error: tagError } = await supabase
          .from('project_tag_relations')
          .insert(tagRelations);

        if (tagError) {
          console.error('Erro ao criar relações de tags:', tagError);
          // Não falhar por causa das tags, apenas logar
        }
      }
    }

    console.log('=== UPDATEPROJECT FINALIZADO COM SUCESSO ===');
    return project;

  } catch (error) {
    console.error('=== ERRO NO UPDATEPROJECT ===');
    console.error('Erro completo:', error);
    throw error;
  }
};

export const fetchProjectTags = async () => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching project tags:', error);
    return [];
  }
};
