import { supabase } from "./client";

export const fetchConsultants = async () => {
  try {
    const { data, error } = await supabase
      .from('consultants')
      .select(`
        *,
        consultant_services(
          service_id,
          services(id, name)
        )
      `)
      .order('name');
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultants:', error);
    return [];
  }
};

export const createConsultant = async (consultant: any) => {
  try {
    console.log('=== INICIANDO CRIAÇÃO DE CONSULTOR ===');
    console.log('Dados do consultor:', consultant);

    // Remover campos que não existem na tabela
    const {
      username,
      password,
      profile_photo,
      services,
      activeProjects,
      availableHours,
      workedHours,
      hoursPerMonth,
      commissionPercentage,
      pixKey,
      zipCode,
      ...cleanConsultant
    } = consultant;

    // Mapear campos corretamente
    const consultantData = {
      ...cleanConsultant,
      commission_percentage: commissionPercentage || consultant.commission_percentage,
      pix_key: pixKey || consultant.pix_key,
      zip_code: zipCode || consultant.zip_code,
      hours_per_month: hoursPerMonth || consultant.hours_per_month || 160,
    };

    console.log('Dados limpos do consultor:', consultantData);

    // Primeiro, criar o usuário no Supabase Auth
    const defaultPassword = 'consultor123';
    console.log('Criando usuário no Supabase Auth...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: consultantData.email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: consultantData.name,
        role: 'consultant'
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      throw new Error(`Erro ao criar usuário: ${authError.message}`);
    }

    console.log('Usuário criado no Auth:', authData.user?.id);

    // Usar o ID do usuário criado para o consultor
    const consultantWithUserId = {
      ...consultantData,
      id: authData.user!.id
    };

    console.log('Criando consultor na tabela com ID do usuário...');

    // Criar o consultor na tabela (usando o ID do usuário do Auth)
    const { data: consultantResult, error: consultantError } = await supabase
      .from('consultants')
      .insert(consultantWithUserId)
      .select()
      .single();
    
    if (consultantError) {
      console.error('Erro ao criar consultor na tabela:', consultantError);
      // Se falhou, tentar limpar o usuário criado
      try {
        await supabase.auth.admin.deleteUser(authData.user!.id);
      } catch (cleanupError) {
        console.error('Erro ao limpar usuário:', cleanupError);
      }
      throw consultantError;
    }

    console.log('Consultor criado na tabela:', consultantResult);

    // Criar o perfil do usuário manualmente
    console.log('Criando perfil do usuário...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user!.id,
        full_name: consultantData.name,
        role: 'consultant',
        email: consultantData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Não falhar aqui, apenas logar
    }

    // Criar permissões de módulo para o consultor
    console.log('Criando permissões de módulo...');
    const modulePermissions = [
      { module_name: 'dashboard', can_view: true, can_edit: false },
      { module_name: 'projects', can_view: true, can_edit: false },
      { module_name: 'demands', can_view: true, can_edit: false },
      { module_name: 'calendar', can_view: true, can_edit: false }
    ];

    const permissionsToInsert = modulePermissions.map(permission => ({
      user_id: authData.user!.id,
      module_name: permission.module_name,
      can_view: permission.can_view,
      can_edit: permission.can_edit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: permissionsError } = await supabase
      .from('module_permissions')
      .insert(permissionsToInsert);

    if (permissionsError) {
      console.error('Erro ao criar permissões:', permissionsError);
      // Não falhar aqui, apenas logar
    }

    console.log('=== CONSULTOR E USUÁRIO CRIADOS COM SUCESSO ===');
    console.log('ID do usuário:', authData.user!.id);
    console.log('Email:', consultantData.email);
    console.log('Senha padrão:', defaultPassword);
    
    return {
      ...consultantResult,
      userCreated: true,
      defaultPassword,
      userId: authData.user!.id
    };
  } catch (error) {
    console.error('=== ERRO NA CRIAÇÃO DO CONSULTOR ===', error);
    throw error;
  }
};

export const updateConsultant = async (id: string, consultant: any) => {
  try {
    // Remover campos que não existem na tabela
    const {
      username,
      password,
      profile_photo,
      services,
      activeProjects,
      availableHours,
      workedHours,
      hoursPerMonth,
      commissionPercentage,
      pixKey,
      zipCode,
      ...cleanConsultant
    } = consultant;

    // Mapear campos corretamente
    const consultantData = {
      ...cleanConsultant,
      commission_percentage: commissionPercentage || consultant.commission_percentage,
      pix_key: pixKey || consultant.pix_key,
      zip_code: zipCode || consultant.zip_code,
      hours_per_month: hoursPerMonth || consultant.hours_per_month || 160,
    };

    const { data, error } = await supabase
      .from('consultants')
      .update(consultantData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating consultant:', error);
    throw error;
  }
};

export const deleteConsultant = async (id: string) => {
  try {
    console.log(`=== INICIANDO EXCLUSÃO DE CONSULTOR: ${id} ===`);
    
    // Verificar se o consultor existe
    const { data: consultant, error: consultantError } = await supabase
      .from('consultants')
      .select('name')
      .eq('id', id)
      .single();
    
    if (consultantError) {
      console.error('Erro ao buscar consultor:', consultantError);
      throw new Error('Consultor não encontrado');
    }
    
    console.log(`Consultor encontrado: ${consultant.name}`);
    
    // Verificar se existem projetos vinculados como consultor principal
    const { data: mainConsultantProjects, error: mainError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('main_consultant_id', id);
    
    if (mainError) {
      console.error('Erro ao verificar projetos como consultor principal:', mainError);
      throw new Error('Erro ao verificar dependências do consultor');
    }
    
    console.log(`Projetos como consultor principal:`, mainConsultantProjects);
    
    // Verificar se existem projetos vinculados como consultor de apoio
    const { data: supportConsultantProjects, error: supportError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('support_consultant_id', id);
    
    if (supportError) {
      console.error('Erro ao verificar projetos como consultor de apoio:', supportError);
      throw new Error('Erro ao verificar dependências do consultor');
    }
    
    console.log(`Projetos como consultor de apoio:`, supportConsultantProjects);
    
    // Se existem projetos vinculados, não permitir exclusão
    if (mainConsultantProjects && mainConsultantProjects.length > 0) {
      const projectNames = mainConsultantProjects.map(p => p.name).join(', ');
      throw new Error(`Não é possível excluir o consultor pois ele é consultor principal nos seguintes projetos: ${projectNames}. Remova-o desses projetos antes de excluí-lo.`);
    }
    
    if (supportConsultantProjects && supportConsultantProjects.length > 0) {
      const projectNames = supportConsultantProjects.map(p => p.name).join(', ');
      throw new Error(`Não é possível excluir o consultor pois ele é consultor de apoio nos seguintes projetos: ${projectNames}. Remova-o desses projetos antes de excluí-lo.`);
    }
    
    // Verificar se existem etapas de projeto vinculadas
    const { data: stages, error: stagesError } = await supabase
      .from('project_stages')
      .select('id, name, project_id')
      .eq('consultant_id', id);
    
    if (stagesError) {
      console.error('Erro ao verificar etapas vinculadas:', stagesError);
      throw new Error('Erro ao verificar dependências do consultor');
    }
    
    console.log(`Etapas vinculadas:`, stages);
    
    if (stages && stages.length > 0) {
      const stageNames = stages.map(s => s.name).join(', ');
      throw new Error(`Não é possível excluir o consultor pois ele está vinculado às seguintes etapas: ${stageNames}. Remova-o dessas etapas antes de excluí-lo.`);
    }
    
    // Verificar se existem transações financeiras vinculadas
    const { data: transactions, error: transactionsError } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('consultant_id', id);
    
    if (transactionsError) {
      console.error('Erro ao verificar transações financeiras:', transactionsError);
      throw new Error('Erro ao verificar dependências do consultor');
    }
    
    console.log(`Transações financeiras vinculadas:`, transactions);
    
    if (transactions && transactions.length > 0) {
      throw new Error(`Não é possível excluir o consultor pois existem ${transactions.length} transações financeiras vinculadas a ele.`);
    }
    
    // Remover serviços do consultor primeiro
    console.log('Removendo serviços vinculados...');
    const { error: servicesError } = await supabase
      .from('consultant_services')
      .delete()
      .eq('consultant_id', id);
    
    if (servicesError) {
      console.error('Erro ao remover serviços do consultor:', servicesError);
      throw new Error('Erro ao remover serviços vinculados ao consultor');
    }
    
    // Remover documentos do consultor
    console.log('Removendo documentos vinculados...');
    const { error: documentsError } = await supabase
      .from('consultant_documents')
      .delete()
      .eq('consultant_id', id);
    
    if (documentsError) {
      console.error('Erro ao remover documentos do consultor:', documentsError);
      // Não falhar aqui, apenas logar o erro
      console.warn('Documentos não foram removidos, mas continuando com a exclusão');
    }
    
    // Finalmente, excluir o consultor
    console.log('Excluindo consultor...');
    const { error: deleteError } = await supabase
      .from('consultants')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Erro ao excluir consultor:', deleteError);
      throw new Error(`Erro ao excluir consultor: ${deleteError.message}`);
    }
    
    console.log(`=== CONSULTOR ${consultant.name} EXCLUÍDO COM SUCESSO ===`);
    return true;
  } catch (error) {
    console.error('=== ERRO NA EXCLUSÃO DO CONSULTOR ===', error);
    throw error;
  }
};

export const fetchConsultantServices = async (consultantId: string) => {
  try {
    const { data, error } = await supabase
      .from('consultant_services')
      .select(`
        service_id,
        services(id, name)
      `)
      .eq('consultant_id', consultantId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching consultant services:', error);
    return [];
  }
};

export const updateConsultantServices = async (consultantId: string, serviceIds: string[]) => {
  try {
    // Remover serviços existentes
    await supabase
      .from('consultant_services')
      .delete()
      .eq('consultant_id', consultantId);

    // Adicionar novos serviços
    if (serviceIds.length > 0) {
      const serviceRelations = serviceIds.map(serviceId => ({
        consultant_id: consultantId,
        service_id: serviceId
      }));

      const { error } = await supabase
        .from('consultant_services')
        .insert(serviceRelations);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating consultant services:', error);
    throw error;
  }
};

export const checkConsultantAuthorizedForService = async (consultantId: string, serviceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('consultant_services')
      .select('id')
      .eq('consultant_id', consultantId)
      .eq('service_id', serviceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking consultant authorization:', error);
    return false;
  }
};

export const calculateConsultantWorkedHours = async (consultantId: string): Promise<number> => {
  try {
    console.log(`=== CALCULANDO HORAS TRABALHADAS PARA CONSULTOR: ${consultantId} ===`);
    
    const { data: consultantData, error: consultantError } = await supabase
      .from('consultants')
      .select('name')
      .eq('id', consultantId)
      .single();
    
    const consultantName = consultantData?.name || 'Desconhecido';
    console.log(`Nome do consultor: ${consultantName}`);
    
    const { data: stageHours, error: stageError } = await supabase
      .from('project_stages')
      .select('hours, project_id, name, consultant_id')
      .eq('consultant_id', consultantId);

    if (stageError) {
      console.error('Error fetching stage hours:', stageError);
      throw stageError;
    }

    console.log(`Etapas encontradas para ${consultantName}:`, stageHours);
    
    let totalStageHours = 0;
    if (stageHours && stageHours.length > 0) {
      totalStageHours = stageHours.reduce((sum, stage) => {
        console.log(`  - Etapa "${stage.name}": ${stage.hours || 0}h (projeto: ${stage.project_id})`);
        return sum + (stage.hours || 0);
      }, 0);
    } else {
      console.log(`Nenhuma etapa encontrada para ${consultantName}`);
    }

    const { data: mainConsultantProjects, error: mainProjectError } = await supabase
      .from('projects')
      .select('total_hours, id, name, main_consultant_id')
      .eq('main_consultant_id', consultantId);

    if (mainProjectError) {
      console.error('Error fetching main consultant projects:', mainProjectError);
    } else {
      console.log(`Projetos como consultor principal para ${consultantName}:`, mainConsultantProjects);
    }

    const { data: supportConsultantProjects, error: supportProjectError } = await supabase
      .from('projects')
      .select('total_hours, id, name, support_consultant_id')
      .eq('support_consultant_id', consultantId);

    if (supportProjectError) {
      console.error('Error fetching support consultant projects:', supportProjectError);
    } else {
      console.log(`Projetos como consultor de apoio para ${consultantName}:`, supportConsultantProjects);
    }

    const allProjects = [
      ...(mainConsultantProjects || []),
      ...(supportConsultantProjects || [])
    ];

    console.log(`Total de projetos encontrados para ${consultantName}:`, allProjects);

    let totalProjectHours = 0;
    if (allProjects && allProjects.length > 0) {
      totalProjectHours = allProjects.reduce((sum, project) => {
        console.log(`  - Projeto "${project.name}": ${project.total_hours || 0}h`);
        return sum + (project.total_hours || 0);
      }, 0);
    } else {
      console.log(`Nenhum projeto encontrado para ${consultantName}`);
    }

    const totalHours = Math.max(totalStageHours, totalProjectHours);
    
    console.log(`=== RESUMO PARA ${consultantName} ===`);
    console.log(`Total de horas das etapas: ${totalStageHours}`);
    console.log(`Total de horas dos projetos: ${totalProjectHours}`);
    console.log(`Total final de horas trabalhadas: ${totalHours}`);
    console.log(`=== FIM DO CÁLCULO ===`);
    
    return totalHours;
  } catch (error) {
    console.error('Error calculating consultant worked hours:', error);
    return 0;
  }
};

export const calculateConsultantAvailableHours = async (consultantId: string, hoursPerMonth: number = 160): Promise<number> => {
  try {
    const workedHours = await calculateConsultantWorkedHours(consultantId);
    const available = Math.max(0, hoursPerMonth - workedHours);
    console.log(`Horas disponíveis para consultor ${consultantId}: ${available} (total: ${hoursPerMonth}, trabalhadas: ${workedHours})`);
    return available;
  } catch (error) {
    console.error('Error calculating consultant available hours:', error);
    return hoursPerMonth;
  }
};

export const calculateConsultantActiveProjects = async (consultantId: string): Promise<number> => {
  try {
    console.log(`=== CALCULANDO PROJETOS ATIVOS PARA CONSULTOR: ${consultantId} ===`);
    
    const { data: consultantData, error: consultantError } = await supabase
      .from('consultants')
      .select('name')
      .eq('id', consultantId)
      .single();
    
    const consultantName = consultantData?.name || 'Desconhecido';
    console.log(`Nome do consultor: ${consultantName}`);
    
    const { data: mainProjects, error: mainError } = await supabase
      .from('projects')
      .select('id, name, status, main_consultant_id')
      .eq('main_consultant_id', consultantId)
      .in('status', ['active', 'em_producao', 'em_planejamento', 'planned']);

    if (mainError) {
      console.error('Error fetching main consultant projects:', mainError);
    } else {
      console.log(`Projetos como consultor principal para ${consultantName}:`, mainProjects);
    }

    const { data: supportProjects, error: supportError } = await supabase
      .from('projects')
      .select('id, name, status, support_consultant_id')
      .eq('support_consultant_id', consultantId)
      .in('status', ['active', 'em_producao', 'em_planejamento', 'planned']);

    if (supportError) {
      console.error('Error fetching support consultant projects:', supportError);
    } else {
      console.log(`Projetos como consultor de apoio para ${consultantName}:`, supportProjects);
    }

    const allProjects = [
      ...(mainProjects || []),
      ...(supportProjects || [])
    ];

    const uniqueProjects = allProjects.filter((project, index, self) => 
      self.findIndex(p => p.id === project.id) === index
    );
    
    console.log(`Projetos únicos ativos para ${consultantName}:`, uniqueProjects);
    
    const projectCount = uniqueProjects.length;
    console.log(`=== TOTAL DE PROJETOS ATIVOS PARA ${consultantName}: ${projectCount} ===`);
    
    return projectCount;
  } catch (error) {
    console.error('Error calculating consultant active projects:', error);
    return 0;
  }
};

export const fetchConsultantProjects = async (consultantId: string) => {
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, name, description, start_date, end_date, total_value, status,
        clients(name),
        services(name)
      `)
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`)
      .order('start_date', { ascending: false });

    if (projectsError) throw projectsError;

    const projectIds = projects?.map(p => p.id) || [];
    let stages = [];
    
    if (projectIds.length > 0) {
      const { data: stagesData, error: stagesError } = await supabase
        .from('project_stages')
        .select('*')
        .in('project_id', projectIds);

      if (stagesError) throw stagesError;
      stages = stagesData || [];
    }

    const totalProjects = projects?.length || 0;
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
    const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;
    
    const totalHours = stages.reduce((sum, stage) => sum + (stage.hours || 0), 0);
    const totalValue = projects?.reduce((sum, project) => sum + (project.total_value || 0), 0) || 0;

    return {
      projects: projects || [],
      stats: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalHours,
        totalValue
      }
    };
  } catch (error) {
    console.error('Error fetching consultant projects:', error);
    return {
      projects: [],
      stats: {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalHours: 0,
        totalValue: 0
      }
    };
  }
};
