
import { supabase } from './client';
import { Project, Stage } from '@/components/projects/types';

export const fetchProjects = async (): Promise<Project[]> => {
  console.log('=== BUSCANDO PROJETOS ===');
  
  try {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        clients (id, name, contact_name, email, phone),
        services (id, name, description, url),
        consultants!projects_main_consultant_id_fkey (id, name, email, phone),
        support_consultants:consultants!projects_support_consultant_id_fkey (id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (projectsError) {
      console.error('Erro ao buscar projetos:', projectsError);
      throw new Error(projectsError.message);
    }

    console.log('Projetos encontrados:', projectsData?.length || 0);

    if (!projectsData || projectsData.length === 0) {
      console.log('Nenhum projeto encontrado');
      return [];
    }

    // Buscar etapas para todos os projetos
    const { data: stagesData, error: stagesError } = await supabase
      .from('project_stages')
      .select(`
        *,
        consultants (id, name, email, phone)
      `)
      .order('stage_order', { ascending: true });

    if (stagesError) {
      console.error('Erro ao buscar etapas:', stagesError);
      throw new Error(stagesError.message);
    }

    console.log('Etapas encontradas:', stagesData?.length || 0);

    // Buscar tags para todos os projetos
    const { data: tagsData, error: tagsError } = await supabase
      .from('project_tag_relations')
      .select(`
        project_id,
        project_tags (id, name, color)
      `);

    if (tagsError) {
      console.error('Erro ao buscar tags:', tagsError);
      throw new Error(tagsError.message);
    }

    console.log('Tags encontradas:', tagsData?.length || 0);

    // Mapear os dados para o formato esperado
    const projects: Project[] = projectsData.map(project => {
      const projectStages = stagesData?.filter(stage => stage.project_id === project.id) || [];
      const projectTags = tagsData?.filter(tag => tag.project_id === project.id) || [];

      const mappedProject: Project = {
        id: project.id,
        projectId: project.project_id,
        name: project.name,
        description: project.description,
        clientId: project.client_id,
        clientName: project.clients?.name || '',
        clientContactName: project.clients?.contact_name || '',
        clientEmail: project.clients?.email || '',
        clientPhone: project.clients?.phone || '',
        serviceId: project.service_id,
        serviceName: project.services?.name || '',
        serviceDescription: project.services?.description || '',
        serviceUrl: project.services?.url || '',
        mainConsultantId: project.main_consultant_id,
        mainConsultantName: project.consultants?.name || '',
        mainConsultantEmail: project.consultants?.email || '',
        mainConsultantPhone: project.consultants?.phone || '',
        mainConsultantCommission: project.main_consultant_commission || 0,
        supportConsultantId: project.support_consultant_id,
        supportConsultantName: project.support_consultants?.name || '',
        supportConsultantEmail: project.support_consultants?.email || '',
        supportConsultantPhone: project.support_consultants?.phone || '',
        supportConsultantCommission: project.support_consultant_commission || 0,
        startDate: project.start_date,
        endDate: project.end_date,
        totalValue: project.total_value || 0,
        totalHours: project.total_hours || 0,
        hourlyRate: project.hourly_rate || 0,
        taxPercent: project.tax_percent || 0,
        thirdPartyExpenses: project.third_party_expenses || 0,
        mainConsultantValue: project.main_consultant_value || 0,
        supportConsultantValue: project.support_consultant_value || 0,
        managerName: project.manager_name,
        managerEmail: project.manager_email,
        managerPhone: project.manager_phone,
        status: project.status,
        tags: project.tags || [],
        tagIds: projectTags.map(tag => tag.project_tags.id),
        tagNames: projectTags.map(tag => tag.project_tags.name),
        tagColors: projectTags.map(tag => tag.project_tags.color),
        url: project.url,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        stages: projectStages.map(stage => ({
          id: stage.id,
          projectId: stage.project_id,
          name: stage.name,
          description: stage.description,
          days: stage.days,
          hours: stage.hours,
          value: stage.value,
          startDate: stage.start_date,
          endDate: stage.end_date,
          startTime: stage.start_time,
          endTime: stage.end_time,
          consultantId: stage.consultant_id,
          consultantName: stage.consultants?.name || '',
          consultantEmail: stage.consultants?.email || '',
          consultantPhone: stage.consultants?.phone || '',
          completed: stage.completed,
          clientApproved: stage.client_approved,
          managerApproved: stage.manager_approved,
          invoiceIssued: stage.invoice_issued,
          paymentReceived: stage.payment_received,
          consultantsSettled: stage.consultants_settled,
          attachment: stage.attachment,
          stageOrder: stage.stage_order,
          status: stage.status,
          valorDeRepasse: stage.valor_de_repasse,
          completedAt: stage.completed_at,
          createdAt: stage.created_at,
          updatedAt: stage.updated_at
        }))
      };

      return mappedProject;
    });

    console.log('Projetos mapeados com sucesso:', projects.length);
    return projects;
  } catch (error) {
    console.error('Erro na função fetchProjects:', error);
    throw error;
  }
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> => {
  console.log('=== CRIANDO PROJETO ===');
  console.log('Dados do projeto:', project);

  try {
    // Criar o projeto
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        project_id: project.projectId,
        name: project.name,
        description: project.description,
        client_id: project.clientId,
        service_id: project.serviceId,
        main_consultant_id: project.mainConsultantId,
        main_consultant_commission: project.mainConsultantCommission,
        support_consultant_id: project.supportConsultantId,
        support_consultant_commission: project.supportConsultantCommission,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        total_hours: project.totalHours,
        hourly_rate: project.hourlyRate,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses,
        main_consultant_value: project.mainConsultantValue,
        support_consultant_value: project.supportConsultantValue,
        manager_name: project.managerName,
        manager_email: project.managerEmail,
        manager_phone: project.managerPhone,
        status: project.status,
        tags: project.tags,
        url: project.url
      })
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao criar projeto:', projectError);
      throw new Error(projectError.message);
    }

    console.log('Projeto criado com sucesso:', projectData);

    // Criar as etapas se existirem
    if (project.stages && project.stages.length > 0) {
      console.log('Criando etapas do projeto...');
      const stagesData = project.stages.map(stage => ({
        project_id: projectData.id,
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate,
        end_date: stage.endDate,
        start_time: stage.startTime,
        end_time: stage.endTime,
        consultant_id: stage.consultantId,
        stage_order: stage.stageOrder,
        status: stage.status,
        valor_de_repasse: stage.valorDeRepasse
      }));

      const { data: createdStages, error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData)
        .select();

      if (stagesError) {
        console.error('Erro ao criar etapas:', stagesError);
        throw new Error(stagesError.message);
      }

      console.log('Etapas criadas com sucesso:', createdStages);
    }

    // Criar as relações com tags se existirem
    if (project.tagIds && project.tagIds.length > 0) {
      console.log('Criando relações com tags...');
      const tagRelations = project.tagIds.map(tagId => ({
        project_id: projectData.id,
        tag_id: tagId
      }));

      const { error: tagsError } = await supabase
        .from('project_tag_relations')
        .insert(tagRelations);

      if (tagsError) {
        console.error('Erro ao criar relações com tags:', tagsError);
        throw new Error(tagsError.message);
      }

      console.log('Relações com tags criadas com sucesso');
    }

    // Retornar o projeto criado
    const createdProject = await fetchProjects();
    const newProject = createdProject.find(p => p.id === projectData.id);

    if (!newProject) {
      throw new Error('Projeto criado mas não encontrado');
    }

    console.log('Projeto completo criado:', newProject);
    return newProject;
  } catch (error) {
    console.error('Erro na função createProject:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>): Promise<void> => {
  console.log('=== ATUALIZANDO PROJETO ===');
  console.log('ID do projeto:', projectId);
  console.log('Atualizações:', updates);

  try {
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        client_id: updates.clientId,
        service_id: updates.serviceId,
        main_consultant_id: updates.mainConsultantId,
        main_consultant_commission: updates.mainConsultantCommission,
        support_consultant_id: updates.supportConsultantId,
        support_consultant_commission: updates.supportConsultantCommission,
        start_date: updates.startDate,
        end_date: updates.endDate,
        total_value: updates.totalValue,
        total_hours: updates.totalHours,
        hourly_rate: updates.hourlyRate,
        tax_percent: updates.taxPercent,
        third_party_expenses: updates.thirdPartyExpenses,
        main_consultant_value: updates.mainConsultantValue,
        support_consultant_value: updates.supportConsultantValue,
        manager_name: updates.managerName,
        manager_email: updates.managerEmail,
        manager_phone: updates.managerPhone,
        status: updates.status,
        tags: updates.tags,
        url: updates.url
      })
      .eq('id', projectId);

    if (projectError) {
      console.error('Erro ao atualizar projeto:', projectError);
      throw new Error(projectError.message);
    }

    console.log('Projeto atualizado com sucesso');
  } catch (error) {
    console.error('Erro na função updateProject:', error);
    throw error;
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  console.log('=== DELETANDO PROJETO ===');
  console.log('ID do projeto:', projectId);

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Erro ao deletar projeto:', error);
      throw new Error(error.message);
    }

    console.log('Projeto deletado com sucesso');
  } catch (error) {
    console.error('Erro na função deleteProject:', error);
    throw error;
  }
};

export const fetchTags = async () => {
  console.log('=== BUSCANDO TAGS ===');
  
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .select('id, name, color')
      .order('name');

    if (error) {
      console.error('Erro ao buscar tags:', error);
      throw new Error(error.message);
    }

    console.log('Tags encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Erro na função fetchTags:', error);
    throw error;
  }
};

export const fetchConsultants = async () => {
  console.log('=== BUSCANDO CONSULTORES ===');
  
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select('id, name, email, phone')
      .order('name');

    if (error) {
      console.error('Erro ao buscar consultores:', error);
      throw new Error(error.message);
    }

    console.log('Consultores encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Erro na função fetchConsultants:', error);
    throw error;
  }
};

export const fetchServices = async () => {
  console.log('=== BUSCANDO SERVIÇOS ===');
  
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, url')
      .order('name');

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      throw new Error(error.message);
    }

    console.log('Serviços encontrados:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Erro na função fetchServices:', error);
    throw error;
  }
};

// Add missing exports for demands
export const fetchDemandsWithoutConsultants = async () => {
  console.log('=== BUSCANDO DEMANDAS SEM CONSULTORES ===');
  
  try {
    const { data, error } = await supabase
      .from('demands')
      .select('*')
      .is('consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar demandas:', error);
      throw new Error(error.message);
    }

    console.log('Demandas encontradas:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Erro na função fetchDemandsWithoutConsultants:', error);
    throw error;
  }
};

export const assignConsultantsToDemand = async (demandId: string, consultantIds: string[]) => {
  console.log('=== ATRIBUINDO CONSULTORES À DEMANDA ===');
  
  try {
    const { error } = await supabase
      .from('demands')
      .update({ consultant_id: consultantIds[0] || null })
      .eq('id', demandId);

    if (error) {
      console.error('Erro ao atribuir consultores:', error);
      throw new Error(error.message);
    }

    console.log('Consultores atribuídos com sucesso');
  } catch (error) {
    console.error('Erro na função assignConsultantsToDemand:', error);
    throw error;
  }
};

// Add fetchProjectTags as alias for fetchTags
export const fetchProjectTags = fetchTags;
