
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
  return data || [];
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
