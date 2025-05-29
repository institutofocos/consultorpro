import { supabase } from './client';
import { Project } from '@/components/projects/types';

export const fetchProjects = async () => {
  console.log('Buscando projetos...');
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      services(name),
      consultants!projects_main_consultant_id_fkey(name),
      support_consultants:consultants!projects_support_consultant_id_fkey(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar projetos:', error);
    throw error;
  }

  console.log('Projetos encontrados:', data);
  
  // Transform the data to match Project interface
  const transformedData = data?.map(project => ({
    id: project.id,
    name: project.name,
    description: project.description,
    serviceId: project.service_id,
    clientId: project.client_id,
    mainConsultantId: project.main_consultant_id,
    mainConsultantCommission: project.main_consultant_commission,
    supportConsultantId: project.support_consultant_id,
    supportConsultantCommission: project.support_consultant_commission,
    startDate: project.start_date,
    endDate: project.end_date,
    totalValue: project.total_value,
    taxPercent: project.tax_percent,
    thirdPartyExpenses: project.third_party_expenses,
    consultantValue: project.main_consultant_value,
    supportConsultantValue: project.support_consultant_value,
    totalHours: project.total_hours,
    hourlyRate: project.hourly_rate,
    managerName: project.manager_name,
    managerEmail: project.manager_email,
    managerPhone: project.manager_phone,
    url: project.url,
    status: project.status,
    tags: project.tags,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    clientName: project.clients?.name,
    serviceName: project.services?.name,
    mainConsultantName: project.consultants?.name,
    supportConsultantName: project.support_consultants?.[0]?.name
  })) || [];

  return transformedData;
};

export const fetchProjectById = async (id: string) => {
  console.log('Buscando projeto por ID:', id);
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      services(name),
      consultants!projects_main_consultant_id_fkey(name),
      support_consultants:consultants!projects_support_consultant_id_fkey(name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar projeto:', error);
    throw error;
  }

  return data;
};

export const fetchDemandsWithoutConsultants = async () => {
  console.log('Buscando demandas sem consultores...');
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(name),
      services(name)
    `)
    .is('main_consultant_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar demandas:', error);
    throw error;
  }

  console.log('Demandas encontradas:', data);
  
  // Transform data and add calculated fields
  const transformedData = data?.map(demand => ({
    ...demand,
    clientName: demand.clients?.name,
    serviceName: demand.services?.name,
    totalDays: Math.ceil((new Date(demand.end_date).getTime() - new Date(demand.start_date).getTime()) / (1000 * 60 * 60 * 24))
  })) || [];

  return transformedData;
};

export const assignConsultantsToDemand = async (
  demandId: string,
  mainConsultantId: string | null,
  mainConsultantCommission: number,
  supportConsultantId: string | null,
  supportConsultantCommission: number
) => {
  console.log('Atribuindo consultores à demanda:', {
    demandId,
    mainConsultantId,
    mainConsultantCommission,
    supportConsultantId,
    supportConsultantCommission
  });

  const updateData: any = {
    main_consultant_id: mainConsultantId,
    main_consultant_commission: mainConsultantCommission,
    updated_at: new Date().toISOString()
  };

  if (supportConsultantId) {
    updateData.support_consultant_id = supportConsultantId;
    updateData.support_consultant_commission = supportConsultantCommission;
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', demandId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atribuir consultores:', error);
    throw error;
  }

  console.log('Consultores atribuídos com sucesso:', data);
  return data;
};

export const fetchTags = async () => {
  console.log('Buscando tags...');
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar tags:', error);
    throw error;
  }

  console.log('Tags encontradas:', data);
  return data || [];
};

export const fetchConsultants = async () => {
  console.log('Buscando consultores...');
  const { data, error } = await supabase
    .from('consultants')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Erro ao buscar consultores:', error);
    throw error;
  }

  console.log('Consultores encontrados:', data);
  return data || [];
};

export const fetchServices = async () => {
  console.log('Buscando serviços...');
  const { data, error } = await supabase
    .from('services')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Erro ao buscar serviços:', error);
    throw error;
  }

  console.log('Serviços encontrados:', data);
  return data || [];
};

export const updateStageStatus = async (
  stageId: string,
  updates: any,
  projectName: string,
  stageName: string
) => {
  console.log('Atualizando status da etapa:', { stageId, updates, projectName, stageName });

  const { data, error } = await supabase
    .from('project_stages')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', stageId)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar status da etapa:', error);
    throw error;
  }

  console.log('Status da etapa atualizado:', data);
  return data;
};

export const createProject = async (project: Project) => {
  console.log('Criando novo projeto');
  console.log('Dados recebidos para criação:', project);

  try {
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      throw new Error('Usuário não autenticado');
    }

    // Mapear os dados do projeto para o formato do banco
    const projectData = {
      name: project.name,
      description: project.description,
      status: project.status === 'planned' ? 'em_producao' : project.status,
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue,
      total_hours: project.totalHours,
      hourly_rate: project.hourlyRate,
      main_consultant_commission: project.mainConsultantCommission,
      support_consultant_commission: project.supportConsultantCommission,
      main_consultant_value: project.consultantValue,
      support_consultant_value: project.supportConsultantValue,
      third_party_expenses: project.thirdPartyExpenses,
      tax_percent: project.taxPercent,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      url: project.url || null,
      tags: project.tags || [],
      user_id: user?.id || null // Usar o ID do usuário autenticado como UUID
    };

    console.log('Dados mapeados para o banco:', projectData);

    // Inserir o projeto
    const { data: insertedProject, error: insertError } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao inserir projeto:', insertError);
      throw insertError;
    }

    console.log('Projeto inserido:', insertedProject);

    // Criar as etapas do projeto se existirem
    if (project.stages && project.stages.length > 0) {
      const stagesData = project.stages.map((stage) => ({
        project_id: insertedProject.id,
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder,
        consultant_id: stage.consultantId || null,
        status: stage.status || 'iniciar_projeto'
      }));

      console.log('Criando etapas:', stagesData);

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Erro ao criar etapas:', stagesError);
        // Não falhar se as etapas não forem criadas, apenas logar o erro
      }
    }

    return insertedProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

export const updateProject = async (project: Project) => {
  console.log('Atualizando projeto:', project.id);
  console.log('Dados recebidos para atualização:', project);

  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Erro ao obter usuário:', userError);
      throw new Error('Usuário não autenticado');
    }

    // Mapear os dados do projeto para o formato do banco
    const projectData = {
      name: project.name,
      description: project.description,
      status: project.status,
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate,
      end_date: project.endDate,
      total_value: project.totalValue,
      total_hours: project.totalHours,
      hourly_rate: project.hourlyRate,
      main_consultant_commission: project.mainConsultantCommission,
      support_consultant_commission: project.supportConsultantCommission,
      main_consultant_value: project.consultantValue,
      support_consultant_value: project.supportConsultantValue,
      third_party_expenses: project.thirdPartyExpenses,
      tax_percent: project.taxPercent,
      manager_name: project.managerName,
      manager_email: project.managerEmail,
      manager_phone: project.managerPhone,
      url: project.url || null,
      tags: project.tags || [],
      updated_at: new Date().toISOString()
    };

    console.log('Dados mapeados para atualização:', projectData);

    // Atualizar o projeto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(projectData)
      .eq('id', project.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar projeto:', updateError);
      throw updateError;
    }

    console.log('Projeto atualizado:', updatedProject);

    // Atualizar as etapas se existirem
    if (project.stages && project.stages.length > 0) {
      // Primeiro, remover etapas existentes
      await supabase
        .from('project_stages')
        .delete()
        .eq('project_id', project.id);

      // Depois, inserir as novas etapas
      const stagesData = project.stages.map((stage) => ({
        project_id: project.id,
        name: stage.name,
        description: stage.description,
        days: stage.days,
        hours: stage.hours,
        value: stage.value,
        start_date: stage.startDate,
        end_date: stage.endDate,
        stage_order: stage.stageOrder,
        consultant_id: stage.consultantId || null,
        status: stage.status || 'iniciar_projeto',
        completed: stage.completed || false,
        client_approved: stage.clientApproved || false,
        manager_approved: stage.managerApproved || false,
        invoice_issued: stage.invoiceIssued || false,
        payment_received: stage.paymentReceived || false,
        consultants_settled: stage.consultantsSettled || false
      }));

      console.log('Atualizando etapas:', stagesData);

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('Erro ao atualizar etapas:', stagesError);
        // Não falhar se as etapas não forem atualizadas, apenas logar o erro
      }
    }

    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  console.log('Deletando projeto:', id);
  
  try {
    // Primeiro deletar as etapas do projeto
    await supabase
      .from('project_stages')
      .delete()
      .eq('project_id', id);

    // Depois deletar o projeto
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar projeto:', error);
      throw error;
    }

    console.log('Projeto deletado com sucesso');
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const fetchProjectTags = async () => {
  console.log('Buscando tags de projetos...');
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Erro ao buscar tags:', error);
    throw error;
  }

  console.log('Tags encontradas:', data);
  return data || [];
};
