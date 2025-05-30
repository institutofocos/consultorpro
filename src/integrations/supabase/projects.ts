
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

export const fetchProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients(id, name),
        services(id, name),
        consultants_main:consultants!main_consultant_id(id, name),
        consultants_support:consultants!support_consultant_id(id, name),
        project_stages(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match expected format with proper camelCase mapping
    const transformedData = (data || []).map(project => ({
      ...project,
      // Map snake_case to camelCase for required fields
      mainConsultantCommission: project.main_consultant_commission || 0,
      supportConsultantCommission: project.support_consultant_commission || 0,
      startDate: project.start_date,
      endDate: project.end_date,
      totalValue: project.total_value || 0,
      taxPercent: project.tax_percent || 16,
      thirdPartyExpenses: project.third_party_expenses || 0,
      consultantValue: project.main_consultant_value || 0,
      supportConsultantValue: project.support_consultant_value || 0,
      totalHours: project.total_hours || 0,
      hourlyRate: project.hourly_rate || 0,
      managerName: project.manager_name,
      managerEmail: project.manager_email,
      managerPhone: project.manager_phone,
      // Transform related data
      clientId: project.client_id,
      serviceId: project.service_id,
      mainConsultantId: project.main_consultant_id,
      supportConsultantId: project.support_consultant_id,
      clientName: project.clients?.name || '',
      serviceName: project.services?.name || '',
      mainConsultantName: project.consultants_main?.name || '',
      supportConsultantName: project.consultants_support?.name || '',
      // Transform stages array to match Stage interface
      stages: (project.project_stages || []).map(stage => ({
        id: stage.id,
        projectId: stage.project_id,
        name: stage.name,
        description: stage.description || '',
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        startDate: stage.start_date,
        endDate: stage.end_date,
        consultantId: stage.consultant_id,
        completed: stage.completed,
        clientApproved: stage.client_approved,
        managerApproved: stage.manager_approved,
        invoiceIssued: stage.invoice_issued,
        paymentReceived: stage.payment_received,
        consultantsSettled: stage.consultants_settled,
        attachment: stage.attachment,
        stageOrder: stage.stage_order,
        status: stage.status || 'iniciar_projeto',
        valorDeRepasse: stage.valor_de_repasse,
        createdAt: stage.created_at,
        updatedAt: stage.updated_at
      })),
      tagIds: [] // Will be populated from project_tag_relations if needed
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients(id, name),
        services(id, name)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data to match expected format
    const transformedData = (data || []).map(project => ({
      ...project,
      clientName: project.clients?.name || '',
      serviceName: project.services?.name || '',
      totalDays: Math.ceil((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)),
      totalHours: project.total_hours || 0
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching demands without consultants:', error);
    return [];
  }
};

export const assignConsultantsToDemand = async (
  demandId: string,
  mainConsultantId: string | null,
  mainConsultantCommission: number,
  supportConsultantId: string | null,
  supportConsultantCommission: number
) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        main_consultant_id: mainConsultantId,
        main_consultant_commission: mainConsultantCommission,
        support_consultant_id: supportConsultantId,
        support_consultant_commission: supportConsultantCommission,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', demandId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning consultants to demand:', error);
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    // First delete related project stages
    const { error: stagesError } = await supabase
      .from('project_stages')
      .delete()
      .eq('project_id', id);

    if (stagesError) throw stagesError;

    // Delete project tag relations
    const { error: tagRelationsError } = await supabase
      .from('project_tag_relations')
      .delete()
      .eq('project_id', id);

    if (tagRelationsError) throw tagRelationsError;

    // Delete the project
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const fetchTags = async () => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

export const fetchConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }
};

export const fetchServices = async () => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

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
