
import { supabase } from './client';
import { Project, Stage } from '@/components/projects/types';
import { syncStageStatusToKanban } from './kanban-sync';
import { fetchKanbanColumns } from './kanban-columns';

// Helper function to map database row to Project type
const mapDbRowToProject = (row: any): Project => {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    serviceId: row.service_id,
    clientId: row.client_id,
    mainConsultantId: row.main_consultant_id,
    mainConsultantCommission: row.main_consultant_commission,
    supportConsultantId: row.support_consultant_id,
    supportConsultantCommission: row.support_consultant_commission,
    startDate: row.start_date,
    endDate: row.end_date,
    totalValue: row.total_value,
    taxPercent: row.tax_percent,
    thirdPartyExpenses: row.third_party_expenses,
    consultantValue: row.main_consultant_value,
    supportConsultantValue: row.support_consultant_value,
    managerName: row.manager_name,
    managerEmail: row.manager_email,
    managerPhone: row.manager_phone,
    totalHours: row.total_hours,
    hourlyRate: row.hourly_rate,
    status: row.status,
    tags: row.tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Helper function to map database row to Stage type
const mapDbRowToStage = (row: any): Stage => {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    description: row.description,
    days: row.days,
    hours: row.hours,
    value: row.value,
    startDate: row.start_date,
    endDate: row.end_date,
    consultantId: row.consultant_id,
    completed: row.completed,
    clientApproved: row.client_approved,
    managerApproved: row.manager_approved,
    invoiceIssued: row.invoice_issued,
    paymentReceived: row.payment_received,
    consultantsSettled: row.consultants_settled,
    attachment: row.attachment,
    stageOrder: row.stage_order,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

// Helper function to map Project type to database format
const mapProjectToDbFormat = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    project_id: project.projectId,
    name: project.name,
    description: project.description,
    service_id: project.serviceId,
    client_id: project.clientId,
    main_consultant_id: project.mainConsultantId,
    main_consultant_commission: project.mainConsultantCommission,
    support_consultant_id: project.supportConsultantId,
    support_consultant_commission: project.supportConsultantCommission,
    start_date: project.startDate,
    end_date: project.endDate,
    total_value: project.totalValue,
    tax_percent: project.taxPercent,
    third_party_expenses: project.thirdPartyExpenses,
    main_consultant_value: project.consultantValue,
    support_consultant_value: project.supportConsultantValue,
    manager_name: project.managerName,
    manager_email: project.managerEmail,
    manager_phone: project.managerPhone,
    total_hours: project.totalHours,
    hourly_rate: project.hourlyRate,
    status: project.status,
    tags: project.tags
  };
};

// Helper function to map Stage type to database format
const mapStageToDbFormat = (stage: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'>) => {
  return {
    project_id: stage.projectId,
    name: stage.name,
    description: stage.description,
    days: stage.days,
    hours: stage.hours,
    value: stage.value,
    start_date: stage.startDate,
    end_date: stage.endDate,
    consultant_id: stage.consultantId,
    completed: stage.completed,
    client_approved: stage.clientApproved,
    manager_approved: stage.managerApproved,
    invoice_issued: stage.invoiceIssued,
    payment_received: stage.paymentReceived,
    consultants_settled: stage.consultantsSettled,
    attachment: stage.attachment,
    stage_order: stage.stageOrder,
    status: stage.status
  };
};

export const fetchProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return (data || []).map(mapDbRowToProject);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchProjectById = async (id: string): Promise<Project | null> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching project by ID:', error);
      return null;
    }

    return data ? mapDbRowToProject(data) : null;
  } catch (error) {
    console.error('Error fetching project by ID:', error);
    return null;
  }
};

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> => {
  try {
    const dbProject = mapProjectToDbFormat(project);
    const { data, error } = await supabase
      .from('projects')
      .insert([dbProject])
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    return data ? mapDbRowToProject(data) : null;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<void> => {
  try {
    const dbUpdates: any = {};
    
    // Map the updates to database format
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.serviceId !== undefined) dbUpdates.service_id = updates.serviceId;
    if (updates.clientId !== undefined) dbUpdates.client_id = updates.clientId;
    if (updates.mainConsultantId !== undefined) dbUpdates.main_consultant_id = updates.mainConsultantId;
    if (updates.mainConsultantCommission !== undefined) dbUpdates.main_consultant_commission = updates.mainConsultantCommission;
    if (updates.supportConsultantId !== undefined) dbUpdates.support_consultant_id = updates.supportConsultantId;
    if (updates.supportConsultantCommission !== undefined) dbUpdates.support_consultant_commission = updates.supportConsultantCommission;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;
    if (updates.taxPercent !== undefined) dbUpdates.tax_percent = updates.taxPercent;
    if (updates.thirdPartyExpenses !== undefined) dbUpdates.third_party_expenses = updates.thirdPartyExpenses;
    if (updates.consultantValue !== undefined) dbUpdates.main_consultant_value = updates.consultantValue;
    if (updates.supportConsultantValue !== undefined) dbUpdates.support_consultant_value = updates.supportConsultantValue;
    if (updates.managerName !== undefined) dbUpdates.manager_name = updates.managerName;
    if (updates.managerEmail !== undefined) dbUpdates.manager_email = updates.managerEmail;
    if (updates.managerPhone !== undefined) dbUpdates.manager_phone = updates.managerPhone;
    if (updates.totalHours !== undefined) dbUpdates.total_hours = updates.totalHours;
    if (updates.hourlyRate !== undefined) dbUpdates.hourly_rate = updates.hourlyRate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

export const fetchStagesByProjectId = async (projectId: string): Promise<Stage[]> => {
  try {
    const { data, error } = await supabase
      .from('project_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_order');

    if (error) {
      console.error('Error fetching stages:', error);
      return [];
    }

    return (data || []).map(mapDbRowToStage);
  } catch (error) {
    console.error('Error fetching stages:', error);
    return [];
  }
};

export const createStage = async (stage: Omit<Stage, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stage | null> => {
  try {
    const dbStage = mapStageToDbFormat(stage);
    const { data, error } = await supabase
      .from('project_stages')
      .insert([dbStage])
      .select()
      .single();

    if (error) {
      console.error('Error creating stage:', error);
      return null;
    }

    return data ? mapDbRowToStage(data) : null;
  } catch (error) {
    console.error('Error creating stage:', error);
    return null;
  }
};

export const updateStage = async (id: string, updates: Partial<Stage>): Promise<void> => {
  try {
    const dbUpdates: any = {};
    
    // Map the updates to database format
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.days !== undefined) dbUpdates.days = updates.days;
    if (updates.hours !== undefined) dbUpdates.hours = updates.hours;
    if (updates.value !== undefined) dbUpdates.value = updates.value;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.consultantId !== undefined) dbUpdates.consultant_id = updates.consultantId;
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.clientApproved !== undefined) dbUpdates.client_approved = updates.clientApproved;
    if (updates.managerApproved !== undefined) dbUpdates.manager_approved = updates.managerApproved;
    if (updates.invoiceIssued !== undefined) dbUpdates.invoice_issued = updates.invoiceIssued;
    if (updates.paymentReceived !== undefined) dbUpdates.payment_received = updates.paymentReceived;
    if (updates.consultantsSettled !== undefined) dbUpdates.consultants_settled = updates.consultantsSettled;
    if (updates.attachment !== undefined) dbUpdates.attachment = updates.attachment;
    if (updates.stageOrder !== undefined) dbUpdates.stage_order = updates.stageOrder;
    if (updates.status !== undefined) dbUpdates.status = updates.status;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('project_stages')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating stage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating stage:', error);
    throw error;
  }
};

export const deleteStage = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting stage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting stage:', error);
    throw error;
  }
};

export const updateStageStatus = async (
  stageId: string, 
  updates: Partial<Stage>,
  projectName?: string,
  stageName?: string
): Promise<void> => {
  try {
    console.log('Atualizando status da etapa:', { stageId, updates });

    // Map updates to database format
    const dbUpdates: any = {};
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.clientApproved !== undefined) dbUpdates.client_approved = updates.clientApproved;
    if (updates.managerApproved !== undefined) dbUpdates.manager_approved = updates.managerApproved;
    if (updates.invoiceIssued !== undefined) dbUpdates.invoice_issued = updates.invoiceIssued;
    if (updates.paymentReceived !== undefined) dbUpdates.payment_received = updates.paymentReceived;
    if (updates.consultantsSettled !== undefined) dbUpdates.consultants_settled = updates.consultantsSettled;
    
    dbUpdates.updated_at = new Date().toISOString();

    // Atualizar a etapa no banco
    const { error } = await supabase
      .from('project_stages')
      .update(dbUpdates)
      .eq('id', stageId);

    if (error) throw error;

    // Se o status foi atualizado para finalizados ou cancelados, sincronizar com Kanban
    if (updates.status && (updates.status === 'finalizados' || updates.status === 'cancelados')) {
      try {
        const kanbanColumns = await fetchKanbanColumns();
        await syncStageStatusToKanban(stageId, updates.status, kanbanColumns);
      } catch (syncError) {
        console.error('Erro na sincronização com Kanban:', syncError);
        // Não falhar a operação principal por causa do erro de sincronização
      }
    }

    console.log(`Status da etapa atualizado com sucesso`);
    
    if (projectName && stageName) {
      console.log(`Etapa "${stageName}" do projeto "${projectName}" atualizada`);
    }
  } catch (error) {
    console.error('Erro ao atualizar status da etapa:', error);
    throw error;
  }
};

export const updateStageOrder = async (stageId: string, newOrder: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('project_stages')
      .update({ stage_order: newOrder })
      .eq('id', stageId);

    if (error) {
      console.error('Error updating stage order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating stage order:', error);
    throw error;
  }
};

// Add missing demand-related functions that are imported in DemandsList.tsx
export const fetchDemandsWithoutConsultants = async () => {
  // This function should return projects that don't have consultants assigned
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .or('main_consultant_id.is.null,support_consultant_id.is.null')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching demands without consultants:', error);
      return [];
    }

    return (data || []).map(mapDbRowToProject);
  } catch (error) {
    console.error('Error fetching demands without consultants:', error);
    return [];
  }
};

export const assignConsultantsToDemand = async (
  projectId: string,
  mainConsultantId?: string,
  supportConsultantId?: string
): Promise<void> => {
  try {
    const updates: any = {};
    if (mainConsultantId) updates.main_consultant_id = mainConsultantId;
    if (supportConsultantId) updates.support_consultant_id = supportConsultantId;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId);

    if (error) {
      console.error('Error assigning consultants to demand:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error assigning consultants to demand:', error);
    throw error;
  }
};
