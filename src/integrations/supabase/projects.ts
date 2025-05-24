import { supabase } from "./client";
import { Project, Stage } from "@/components/projects/types";
import { createProjectTasks, updateProjectTasks } from "./project-tasks";
import { ensureProjectChatRoom } from "./chat";
import { toast } from "sonner";

// Função para buscar etapas de um projeto
export const fetchProjectStages = async (projectId: string): Promise<Stage[]> => {
  try {
    const { data, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (error) throw error;

    return (data || []).map(stage => ({
      id: stage.id,
      projectId: stage.project_id,
      name: stage.name,
      description: stage.description || '',
      days: stage.days,
      hours: stage.hours,
      value: Number(stage.value),
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
      createdAt: stage.created_at,
      updatedAt: stage.updated_at
    }));
  } catch (error) {
    console.error('Error fetching project stages:', error);
    return [];
  }
};

// Função para criar etapas de um projeto
export const createProjectStages = async (projectId: string, stages: Omit<Stage, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>[]): Promise<Stage[]> => {
  try {
    const stagesToInsert = stages.map((stage, index) => ({
      project_id: projectId,
      name: stage.name,
      description: stage.description || '',
      days: stage.days,
      hours: stage.hours,
      value: stage.value,
      start_date: stage.startDate && stage.startDate !== '' ? stage.startDate : null,
      end_date: stage.endDate && stage.endDate !== '' ? stage.endDate : null,
      consultant_id: stage.consultantId || null,
      completed: stage.completed,
      client_approved: stage.clientApproved,
      manager_approved: stage.managerApproved,
      invoice_issued: stage.invoiceIssued,
      payment_received: stage.paymentReceived,
      consultants_settled: stage.consultantsSettled,
      attachment: stage.attachment || null,
      stage_order: stage.stageOrder || index + 1
    }));

    const { data, error } = await supabase
      .from('project_stages')
      .insert(stagesToInsert)
      .select();

    if (error) throw error;

    return (data || []).map(stage => ({
      id: stage.id,
      projectId: stage.project_id,
      name: stage.name,
      description: stage.description || '',
      days: stage.days,
      hours: stage.hours,
      value: Number(stage.value),
      startDate: stage.start_date || '',
      endDate: stage.end_date || '',
      consultantId: stage.consultant_id,
      completed: stage.completed,
      clientApproved: stage.client_approved,
      managerApproved: stage.manager_approved,
      invoiceIssued: stage.invoice_issued,
      paymentReceived: stage.payment_received,
      consultantsSettled: stage.consultants_settled,
      attachment: stage.attachment,
      stageOrder: stage.stage_order,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at
    }));
  } catch (error) {
    console.error('Error creating project stages:', error);
    throw error;
  }
};

// Função para atualizar etapas de um projeto
export const updateProjectStages = async (projectId: string, stages: Stage[]): Promise<Stage[]> => {
  try {
    // Primeiro, deletar todas as etapas existentes
    await supabase
      .from('project_stages')
      .delete()
      .eq('project_id', projectId);

    // Criar as novas etapas
    const stagesToInsert = stages.map((stage, index) => ({
      project_id: projectId,
      name: stage.name,
      description: stage.description || '',
      days: stage.days,
      hours: stage.hours,
      value: stage.value,
      start_date: stage.startDate && stage.startDate !== '' ? stage.startDate : null,
      end_date: stage.endDate && stage.endDate !== '' ? stage.endDate : null,
      consultant_id: stage.consultantId || null,
      completed: stage.completed,
      client_approved: stage.clientApproved,
      manager_approved: stage.managerApproved,
      invoice_issued: stage.invoiceIssued,
      payment_received: stage.paymentReceived,
      consultants_settled: stage.consultantsSettled,
      attachment: stage.attachment || null,
      stage_order: index + 1
    }));

    const { data, error } = await supabase
      .from('project_stages')
      .insert(stagesToInsert)
      .select();

    if (error) throw error;

    return (data || []).map(stage => ({
      id: stage.id,
      projectId: stage.project_id,
      name: stage.name,
      description: stage.description || '',
      days: stage.days,
      hours: stage.hours,
      value: Number(stage.value),
      startDate: stage.start_date || '',
      endDate: stage.end_date || '',
      consultantId: stage.consultant_id,
      completed: stage.completed,
      clientApproved: stage.client_approved,
      managerApproved: stage.manager_approved,
      invoiceIssued: stage.invoice_issued,
      paymentReceived: stage.payment_received,
      consultantsSettled: stage.consultants_settled,
      attachment: stage.attachment,
      stageOrder: stage.stage_order,
      createdAt: stage.created_at,
      updatedAt: stage.updated_at
    }));
  } catch (error) {
    console.error('Error updating project stages:', error);
    throw error;
  }
};

// Função para atualizar status de uma etapa específica
export const updateStageStatus = async (stageId: string, updates: Partial<Stage>): Promise<void> => {
  try {
    const updateData: any = {};
    
    if (updates.completed !== undefined) updateData.completed = updates.completed;
    if (updates.clientApproved !== undefined) updateData.client_approved = updates.clientApproved;
    if (updates.managerApproved !== undefined) updateData.manager_approved = updates.managerApproved;
    if (updates.invoiceIssued !== undefined) updateData.invoice_issued = updates.invoiceIssued;
    if (updates.paymentReceived !== undefined) updateData.payment_received = updates.paymentReceived;
    if (updates.consultantsSettled !== undefined) updateData.consultants_settled = updates.consultantsSettled;

    const { error } = await supabase
      .from('project_stages')
      .update(updateData)
      .eq('id', stageId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating stage status:', error);
    throw error;
  }
};

// Função para criar transações financeiras do projeto
const createProjectFinancialTransactions = async (project: Project) => {
  try {
    console.log('Verificando necessidade de criar transações financeiras para o projeto:', project.name);
    
    if (!project.stages || !Array.isArray(project.stages)) {
      console.log('Projeto sem etapas, pulando criação de transações');
      return;
    }

    // Verificar se já existem transações para este projeto ANTES de criar
    const { data: existingTransactions, error: checkError } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('project_id', project.id)
      .limit(1);

    if (checkError) {
      console.error('Erro ao verificar transações existentes:', checkError);
      return;
    }

    if (existingTransactions && existingTransactions.length > 0) {
      console.log('Transações já existem para este projeto, pulando criação');
      return;
    }

    console.log('Criando transações financeiras para o projeto:', project.name);

    // Criar transações para cada etapa do projeto
    for (const stage of project.stages) {
      // Transação de receita (a receber do cliente)
      await supabase
        .from('financial_transactions')
        .insert({
          project_id: project.id,
          stage_id: stage.id,
          transaction_type: 'receita',
          stage_name: stage.name,
          amount: stage.value || 0,
          net_amount: stage.value || 0,
          due_date: stage.endDate || project.endDate,
          status: 'pendente'
        });

      // Se há consultor principal, criar transação de pagamento
      if (project.mainConsultantId && project.consultantValue && project.consultantValue > 0) {
        const consultantAmount = (project.consultantValue / project.stages.length);
        await supabase
          .from('financial_transactions')
          .insert({
            project_id: project.id,
            stage_id: stage.id,
            consultant_id: project.mainConsultantId,
            transaction_type: 'despesa',
            stage_name: stage.name,
            amount: consultantAmount,
            net_amount: consultantAmount,
            due_date: stage.endDate || project.endDate,
            status: 'pendente',
            is_support_consultant: false
          });
      }

      // Se há consultor de apoio, criar transação de pagamento
      if (project.supportConsultantId && project.supportConsultantValue && project.supportConsultantValue > 0) {
        const supportAmount = (project.supportConsultantValue / project.stages.length);
        await supabase
          .from('financial_transactions')
          .insert({
            project_id: project.id,
            stage_id: stage.id,
            consultant_id: project.supportConsultantId,
            transaction_type: 'despesa',
            stage_name: stage.name,
            amount: supportAmount,
            net_amount: supportAmount,
            due_date: stage.endDate || project.endDate,
            status: 'pendente',
            is_support_consultant: true
          });
      }
    }

    console.log('Transações financeiras criadas com sucesso para o projeto:', project.name);
  } catch (error) {
    console.error('Erro ao criar transações financeiras:', error);
  }
};

// Função para buscar todos os projetos
export const fetchProjects = async (): Promise<Project[]> => {
  try {
    console.log('Buscando projetos do banco de dados...');
    
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        main_consultant:consultants!main_consultant_id(id, name, pix_key, commission_percentage),
        support_consultant:consultants!support_consultant_id(id, name, pix_key, commission_percentage),
        client:clients(id, name),
        service:services(id, name)
      `)
      .order('created_at', { ascending: false });
    
    if (projectsError) throw projectsError;
    
    if (!projectsData) return [];

    // Buscar etapas para todos os projetos
    const projectsWithStages = await Promise.all(
      projectsData.map(async (project) => {
        const stages = await fetchProjectStages(project.id);
        
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          serviceId: project.service_id,
          serviceName: project.service?.name,
          clientId: project.client_id,
          clientName: project.client?.name,
          mainConsultantId: project.main_consultant_id,
          mainConsultantName: project.main_consultant?.name || 'Não especificado',
          mainConsultantPixKey: project.main_consultant?.pix_key || '',
          mainConsultantCommission: project.main_consultant_commission || 
                                   project.main_consultant?.commission_percentage || 0,
          supportConsultantId: project.support_consultant_id || undefined,
          supportConsultantName: project.support_consultant?.name || undefined,
          supportConsultantPixKey: project.support_consultant?.pix_key || '',
          supportConsultantCommission: project.support_consultant_commission || 
                                      project.support_consultant?.commission_percentage || 0,
          startDate: project.start_date,
          endDate: project.end_date,
          totalValue: Number(project.total_value) || 0,
          taxPercent: Number(project.tax_percent) || 0,
          thirdPartyExpenses: Number(project.third_party_expenses) || 0,
          consultantValue: Number(project.main_consultant_value) || 0,
          supportConsultantValue: Number(project.support_consultant_value) || 0,
          status: project.status as 'planned' | 'active' | 'completed' | 'cancelled',
          stages: stages,
          completedStages: stages.filter(s => s.completed).length,
          tags: project.tags || [],
          createdAt: project.created_at,
          updatedAt: project.updated_at
        } as Project;
      })
    );

    return projectsWithStages;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

// Função para criar um novo projeto
export const createProject = async (project: Project): Promise<Project> => {
  try {
    console.log('=== INÍCIO DA CRIAÇÃO DO PROJETO ===');
    console.log('Criando novo projeto:', project.name);
    
    // 1. Criar o projeto no banco
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description,
        service_id: project.serviceId,
        client_id: project.clientId,
        main_consultant_id: project.mainConsultantId,
        main_consultant_commission: project.mainConsultantCommission || 0,
        support_consultant_id: project.supportConsultantId,
        support_consultant_commission: project.supportConsultantCommission || 0,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses || 0,
        main_consultant_value: project.consultantValue || 0,
        support_consultant_value: project.supportConsultantValue || 0,
        status: project.status,
        tags: project.tags || []
      })
      .select()
      .single();

    if (projectError) {
      console.error('Erro ao criar projeto no banco:', projectError);
      throw projectError;
    }

    console.log('Projeto criado no banco com ID:', projectData.id);

    // 2. Criar etapas se existirem
    let createdStages: Stage[] = [];
    if (project.stages && project.stages.length > 0) {
      console.log('Criando', project.stages.length, 'etapas para o projeto');
      createdStages = await createProjectStages(projectData.id, project.stages);
      console.log('Etapas criadas com sucesso:', createdStages.length);
    }

    const createdProject: Project = {
      ...project,
      id: projectData.id,
      stages: createdStages,
      createdAt: projectData.created_at,
      updatedAt: projectData.updated_at
    };

    // 3. Criar tarefas para o projeto (apenas uma vez, com verificação interna)
    console.log('Iniciando criação de tarefas...');
    try {
      const result = await createProjectTasks(createdProject);
      if (result.mainTask) {
        console.log("Tarefa criada com sucesso para o projeto");
      } else {
        console.log("Tarefa não foi criada (possivelmente já existia)");
      }
    } catch (taskError) {
      console.error('Error creating project tasks:', taskError);
    }

    // 4. Criar sala de chat (apenas uma vez, com verificação interna)
    console.log('Iniciando criação de sala de chat...');
    try {
      await ensureProjectChatRoom(projectData.id, project.name);
      console.log("Sala de chat processada com sucesso");
    } catch (chatError) {
      console.error('Error creating chat room:', chatError);
    }

    // 5. Criar transações financeiras (apenas uma vez, com verificação interna)
    console.log('Iniciando criação de transações financeiras...');
    try {
      await createProjectFinancialTransactions(createdProject);
      console.log("Transações financeiras processadas com sucesso");
    } catch (financialError) {
      console.error('Error creating financial transactions:', financialError);
    }
    
    console.log("=== PROJETO CRIADO COM SUCESSO ===");
    console.log("Nome:", createdProject.name);
    console.log("ID:", createdProject.id);
    console.log("Etapas:", createdProject.stages?.length || 0);
    
    return createdProject;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// Função para atualizar um projeto
export const updateProject = async (project: Project): Promise<Project> => {
  try {
    console.log('Atualizando projeto:', project.name);
    
    const { error: projectError } = await supabase
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        service_id: project.serviceId || null,
        client_id: project.clientId || null,
        main_consultant_id: project.mainConsultantId || null,
        main_consultant_commission: project.mainConsultantCommission || 0,
        support_consultant_id: project.supportConsultantId || null,
        support_consultant_commission: project.supportConsultantCommission || 0,
        start_date: project.startDate,
        end_date: project.endDate,
        total_value: project.totalValue,
        tax_percent: project.taxPercent,
        third_party_expenses: project.thirdPartyExpenses || 0,
        main_consultant_value: project.consultantValue || 0,
        support_consultant_value: project.supportConsultantValue || 0,
        status: project.status,
        tags: project.tags || []
      })
      .eq('id', project.id);

    if (projectError) throw projectError;

    // Atualizar etapas
    let updatedStages: Stage[] = [];
    if (project.stages && project.stages.length > 0) {
      updatedStages = await updateProjectStages(project.id, project.stages);
      console.log('Etapas atualizadas:', updatedStages);
    }

    const updatedProject: Project = {
      ...project,
      stages: updatedStages
    };

    // Atualizar tarefas do projeto
    try {
      await updateProjectTasks(updatedProject);
    } catch (taskError) {
      console.error('Error updating project tasks:', taskError);
    }
    
    return updatedProject;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Função para deletar um projeto
export const deleteProject = async (id: string): Promise<boolean> => {
  try {
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

// Função para buscar um projeto por ID
export const fetchProjectById = async (projectId: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        main_consultant:consultants!main_consultant_id(id, name, pix_key, commission_percentage),
        support_consultant:consultants!support_consultant_id(id, name, pix_key, commission_percentage),
        client:clients(id, name),
        service:services(id, name)
      `)
      .eq('id', projectId)
      .single();

    if (error) return null;

    const stages = await fetchProjectStages(projectId);

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      serviceId: data.service_id,
      serviceName: data.service?.name,
      clientId: data.client_id,
      clientName: data.client?.name,
      mainConsultantId: data.main_consultant_id,
      mainConsultantName: data.main_consultant?.name,
      mainConsultantPixKey: data.main_consultant?.pix_key,
      mainConsultantCommission: data.main_consultant_commission || 0,
      supportConsultantId: data.support_consultant_id,
      supportConsultantName: data.support_consultant?.name,
      supportConsultantPixKey: data.support_consultant?.pix_key,
      supportConsultantCommission: data.support_consultant_commission || 0,
      startDate: data.start_date,
      endDate: data.end_date,
      totalValue: data.total_value,
      taxPercent: data.tax_percent,
      thirdPartyExpenses: data.third_party_expenses || 0,
      consultantValue: data.main_consultant_value || 0,
      supportConsultantValue: data.support_consultant_value || 0,
      status: data.status as 'planned' | 'active' | 'completed' | 'cancelled',
      stages: stages,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
};

// Outras funções auxiliares mantidas iguais
export const fetchTags = async () => {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        description,
        start_date,
        end_date,
        total_value,
        status,
        tags,
        clients(name),
        services:service_id(id, name, total_hours, stages)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(project => ({
      ...project,
      clientName: project.clients ? project.clients.name : null,
      serviceName: project.services ? project.services.name : null,
      totalHours: project.services?.total_hours ? Number(project.services.total_hours) : 0,
      totalDays: 0
    }));

  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};

export const assignConsultantsToDemand = async (
  projectId: string, 
  mainConsultantId: string | null, 
  mainConsultantCommission: number = 0,
  supportConsultantId: string | null = null,
  supportConsultantCommission: number = 0
) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        main_consultant_id: mainConsultantId,
        main_consultant_commission: mainConsultantCommission,
        support_consultant_id: supportConsultantId,
        support_consultant_commission: supportConsultantCommission
      })
      .eq('id', projectId)
      .select();
      
    if (error) throw error;

    try {
      if (data && data[0]) {
        const project = await fetchProjectById(projectId);
        if (project) {
          await updateProjectTasks(project);
        }
      }
    } catch (taskError) {
      console.error('Error updating project tasks after consultant assignment:', taskError);
    }

    return data;
  } catch (error) {
    console.error('Error assigning consultants to demand:', error);
    throw error;
  }
};

export const assignConsultantToStage = async (
  stageId: string,
  consultantId: string | null
) => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .update({ consultant_id: consultantId })
      .eq('id', stageId);
    
    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error assigning consultant to stage:', error);
    throw error;
  }
};
