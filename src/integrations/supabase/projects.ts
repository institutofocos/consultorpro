import { supabase } from "./client";

export const fetchProjects = async () => {
  try {
    console.log('Fetching projects with consultants only...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name),
        main_consultant:consultants!main_consultant_id(id, name),
        support_consultant:consultants!support_consultant_id(id, name),
        project_stages!project_stages_project_id_fkey(
          id,
          name,
          description,
          status,
          start_date,
          end_date,
          completed,
          value,
          hours,
          days,
          consultant_id,
          stage_order,
          client_approved,
          manager_approved,
          invoice_issued,
          payment_received,
          consultants_settled,
          attachment,
          valor_de_repasse,
          created_at,
          updated_at,
          consultant:consultants!consultant_id(id, name)
        ),
        project_tag_relations(
          tag:project_tags(id, name, color)
        )
      `)
      .not('main_consultant_id', 'is', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }

    console.log('Raw projects data (with consultants only):', data);

    const transformedData = data?.map(project => {
      console.log('Transforming project:', project);
      
      const projectTags = project.project_tag_relations?.map(rel => rel.tag).filter(Boolean) || [];
      console.log('Project tags for', project.name, ':', projectTags);
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        serviceId: project.service_id,
        clientId: project.client_id,
        mainConsultantId: project.main_consultant_id,
        mainConsultantCommission: project.main_consultant_commission || 0,
        supportConsultantId: project.support_consultant_id,
        supportConsultantCommission: project.support_consultant_commission || 0,
        startDate: project.start_date,
        endDate: project.end_date,
        totalValue: project.total_value || 0,
        taxPercent: project.tax_percent || 16,
        thirdPartyExpenses: project.third_party_expenses || 0,
        consultantValue: project.main_consultant_value || 0,
        supportConsultantValue: project.support_consultant_value || 0,
        managerName: project.manager_name,
        managerEmail: project.manager_email,
        managerPhone: project.manager_phone,
        totalHours: project.total_hours || 0,
        hourlyRate: project.hourly_rate || 0,
        url: project.url || '',
        status: project.status,
        tags: projectTags.map(tag => tag.name),
        tagIds: projectTags.map(tag => tag.id),
        tagNames: projectTags.map(tag => tag.name),
        stages: project.project_stages?.map(stage => ({
          id: stage.id,
          projectId: project.id,
          name: stage.name,
          description: stage.description || '',
          days: stage.days || 1,
          hours: stage.hours || 8,
          value: stage.value || 0,
          startDate: stage.start_date,
          endDate: stage.end_date,
          consultantId: stage.consultant_id,
          completed: stage.completed || false,
          clientApproved: stage.client_approved || false,
          managerApproved: stage.manager_approved || false,
          invoiceIssued: stage.invoice_issued || false,
          paymentReceived: stage.payment_received || false,
          consultantsSettled: stage.consultants_settled || false,
          attachment: stage.attachment,
          stageOrder: stage.stage_order || 1,
          status: stage.status || 'iniciar_projeto',
          valorDeRepasse: Number(stage.valor_de_repasse) || 0,
          createdAt: stage.created_at,
          updatedAt: stage.updated_at
        })) || [],
        mainConsultantName: project.main_consultant?.name,
        supportConsultantName: project.support_consultant?.name,
        serviceName: project.services?.name,
        clientName: project.clients?.name,
        completedStages: project.project_stages?.filter(stage => stage.completed).length || 0,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      };
    }) || [];

    console.log('Transformed projects data (with consultants only):', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const fetchDemandsWithoutConsultants = async () => {
  try {
    console.log('Fetching demands (projects without consultants)...');
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        clients:client_id(id, name),
        services:service_id(id, name)
      `)
      .is('main_consultant_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw error;

    console.log('Raw demands data (without consultants):', data);

    const transformedData = data?.map(project => ({
      ...project,
      clientName: project.clients?.name,
      serviceName: project.services?.name
    })) || [];

    console.log('Transformed demands data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching demands:', error);
    return [];
  }
};

// Function to calculate project status based on business rules and configured statuses
export const calculateProjectStatus = async (project: any): Promise<string> => {
  try {
    // First, fetch the configured active statuses
    const { data: activeStatuses, error } = await supabase
      .from('project_status_settings')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching active statuses:', error);
      // Fallback to original logic if can't fetch configured statuses
      return calculateLegacyProjectStatus(project);
    }

    // Check if project has a valid configured status
    const currentStatusSetting = activeStatuses?.find(s => s.name === project.status);
    if (currentStatusSetting) {
      return project.status; // Keep current status if it's valid and active
    }

    // Auto-assign status based on business rules using configured statuses
    
    // Rule 1: If no consultant assigned, look for planning status
    if (!project.main_consultant_id) {
      const planningStatus = activeStatuses?.find(s => 
        s.name.includes('planejamento') || s.name.includes('planning')
      );
      return planningStatus?.name || 'em_planejamento';
    }
    
    // Rule 2: If consultant assigned but not all stages completed, look for production status
    if (project.main_consultant_id && project.project_stages) {
      const totalStages = project.project_stages.length;
      const completedStages = project.project_stages.filter((stage: any) => stage.completed).length;
      
      // Rule 3: If all stages are completed, look for completion status
      if (totalStages > 0 && completedStages === totalStages) {
        const completionStatus = activeStatuses?.find(s => s.is_completion_status);
        return completionStatus?.name || 'concluido';
      }
      
      // Look for production status
      const productionStatus = activeStatuses?.find(s => 
        s.name.includes('producao') || s.name.includes('production')
      );
      return productionStatus?.name || 'em_producao';
    }
    
    // Default to first active status if available
    return activeStatuses?.[0]?.name || 'em_producao';
  } catch (error) {
    console.error('Error in calculateProjectStatus:', error);
    return calculateLegacyProjectStatus(project);
  }
};

// Legacy status calculation for fallback
const calculateLegacyProjectStatus = (project: any): string => {
  // Rule 1: If no consultant assigned, status should be "em_planejamento"
  if (!project.main_consultant_id) {
    return 'em_planejamento';
  }
  
  // Rule 2: If consultant assigned but not all stages completed, status should be "em_producao"
  if (project.main_consultant_id && project.project_stages) {
    const totalStages = project.project_stages.length;
    const completedStages = project.project_stages.filter((stage: any) => stage.completed).length;
    
    // Rule 3: If all stages are completed, status should be "concluido"
    if (totalStages > 0 && completedStages === totalStages) {
      return 'concluido';
    }
    
    return 'em_producao';
  }
  
  // If consultant assigned but no stages, status should be "em_producao"
  return 'em_producao';
};

// Function to update project status automatically
export const updateProjectStatusAutomatically = async (projectId: string) => {
  try {
    // First, fetch the project with its stages
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select(`
        *,
        project_stages(*)
      `)
      .eq('id', projectId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching project for status update:', fetchError);
      return;
    }
    
    // Calculate the new status
    const newStatus = await calculateProjectStatus(project);
    
    // Update the project status if it's different
    if (project.status !== newStatus) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);
      
      if (updateError) {
        console.error('Error updating project status:', updateError);
      } else {
        console.log(`Project ${projectId} status updated to: ${newStatus}`);
      }
    }
    
    return newStatus;
  } catch (error) {
    console.error('Error in updateProjectStatusAutomatically:', error);
  }
};

export const assignConsultantsToDemand = async (
  projectId: string,
  mainConsultantId: string | null,
  mainConsultantCommission: number,
  supportConsultantId: string | null,
  supportConsultantCommission: number
) => {
  try {
    console.log('=== INICIANDO ATRIBUIÇÃO DE CONSULTOR (COMPLETAMENTE INDEPENDENTE) ===');
    console.log('Dados recebidos:', {
      projectId,
      mainConsultantId,
      mainConsultantCommission,
      supportConsultantId,
      supportConsultantCommission
    });

    // Verificar se o projeto existe antes de tentar atualizar
    const { data: existingProject, error: checkError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .maybeSingle();

    if (checkError) {
      console.error('Erro ao verificar projeto:', checkError);
      throw new Error(`Erro ao verificar projeto: ${checkError.message}`);
    }

    if (!existingProject) {
      throw new Error(`Projeto com ID ${projectId} não encontrado`);
    }

    console.log('Projeto encontrado:', existingProject.name);

    // Atualizar APENAS o projeto principal - TOTALMENTE INDEPENDENTE
    const updateData: any = {
      main_consultant_id: mainConsultantId,
      main_consultant_commission: mainConsultantCommission,
      status: mainConsultantId ? 'em_producao' : 'em_planejamento'
    };

    if (supportConsultantId) {
      updateData.support_consultant_id = supportConsultantId;
      updateData.support_consultant_commission = supportConsultantCommission;
    }

    console.log('Dados para atualização do projeto (TOTALMENTE INDEPENDENTE):', updateData);

    const { data: updatedProject, error: updateProjectError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .maybeSingle();
    
    if (updateProjectError) {
      console.error('Erro na atualização do projeto:', updateProjectError);
      throw new Error(`Erro ao atualizar projeto: ${updateProjectError.message}`);
    }

    if (!updatedProject) {
      throw new Error('Nenhum projeto foi atualizado. Verifique se o ID está correto.');
    }
    
    console.log('Projeto atualizado com sucesso (TOTALMENTE INDEPENDENTE):', updatedProject);

    // Atribuir consultor às etapas do projeto
    if (mainConsultantId) {
      console.log('Atribuindo consultor às etapas...');
      
      const { data: stages, error: stagesError } = await supabase
        .from('project_stages')
        .select('id, name')
        .eq('project_id', projectId);

      if (stagesError) {
        console.error('Erro ao buscar etapas:', stagesError);
      } else if (stages && stages.length > 0) {
        console.log(`Encontradas ${stages.length} etapas para atribuir consultor`);
        
        const { error: updateStagesError } = await supabase
          .from('project_stages')
          .update({ consultant_id: mainConsultantId })
          .eq('project_id', projectId);

        if (updateStagesError) {
          console.error('Erro ao atribuir consultor às etapas:', updateStagesError);
        } else {
          console.log('Consultor atribuído com sucesso a todas as etapas');
        }
      } else {
        console.log('Nenhuma etapa encontrada para este projeto');
      }
    }
    
    // Update status automatically after consultant assignment
    await updateProjectStatusAutomatically(projectId);
    
    console.log('=== ATRIBUIÇÃO CONCLUÍDA (TOTALMENTE INDEPENDENTE) ===');
    console.log('✅ Processo completado sem qualquer referência a chat');
    return updatedProject;
  } catch (error) {
    console.error('=== ERRO NA ATRIBUIÇÃO ===');
    console.error('Error assigning consultants:', error);
    throw error;
  }
};

export const createProject = async (project: any) => {
  try {
    console.log('=== CRIANDO PROJETO E ETAPAS (DEBUG COMPLETO) ===');
    console.log('Dados originais recebidos:', JSON.stringify(project, null, 2));
    
    // VALIDAR DADOS DE ENTRADA
    if (!project.name || project.name.trim() === '') {
      throw new Error('Nome do projeto é obrigatório');
    }
    
    // CRIAR OBJETO COMPLETAMENTE LIMPO - APENAS CAMPOS DA TABELA PROJECTS
    const cleanProjectData = {
      name: String(project.name || ''),
      description: String(project.description || ''),
      status: 'iniciar_projeto', // SEMPRE INICIAR COM STATUS "iniciar_projeto"  
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate || null,
      end_date: project.endDate || null,
      total_value: Number(project.totalValue || 0),
      total_hours: Number(project.totalHours || 0),
      hourly_rate: Number(project.hourlyRate || 0),
      main_consultant_commission: Number(project.mainConsultantCommission || 0),
      support_consultant_commission: Number(project.supportConsultantCommission || 0),
      main_consultant_value: Number(project.consultantValue || 0),
      support_consultant_value: Number(project.supportConsultantValue || 0),
      third_party_expenses: Number(project.thirdPartyExpenses || 0),
      tax_percent: Number(project.taxPercent || 16),
      manager_name: String(project.managerName || ''),
      manager_email: String(project.managerEmail || ''),
      manager_phone: String(project.managerPhone || ''),
      url: project.url || null,
    };

    console.log('=== DADOS PARA INSERÇÃO DO PROJETO ===');
    console.log('Objeto limpo para inserção na tabela PROJECTS:', JSON.stringify(cleanProjectData, null, 2));
    
    // INSERIR PROJETO
    const { data: createdProject, error: projectError } = await supabase
      .from('projects')
      .insert(cleanProjectData)
      .select()
      .single();
    
    if (projectError) {
      console.error('❌ ERRO ao inserir projeto:', projectError);
      console.error('Dados que causaram erro:', JSON.stringify(cleanProjectData, null, 2));
      throw new Error(`Erro ao criar projeto: ${projectError.message}`);
    }

    console.log('✅ Projeto criado com sucesso:', createdProject);
    console.log('ID do projeto criado:', createdProject.id);

    // CRIAR ETAPAS SE EXISTIREM
    if (project.stages && Array.isArray(project.stages) && project.stages.length > 0) {
      console.log('=== CRIANDO ETAPAS DO PROJETO ===');
      console.log(`Número de etapas a criar: ${project.stages.length}`);
      console.log('Etapas recebidas:', JSON.stringify(project.stages, null, 2));
      
      // PREPARAR DADOS DAS ETAPAS COM VALIDAÇÃO RIGOROSA
      const stagesData = project.stages.map((stage: any, index: number) => {
        console.log(`Processando etapa ${index + 1}:`, stage);
        
        // VALIDAR CAMPOS OBRIGATÓRIOS
        if (!stage.name || stage.name.trim() === '') {
          throw new Error(`Nome da etapa ${index + 1} é obrigatório`);
        }
        
        const stageData = {
          project_id: createdProject.id, // ID do projeto recém-criado
          name: String(stage.name).trim(),
          description: String(stage.description || ''),
          days: Math.max(1, Number(stage.days) || 1),
          hours: Math.max(1, Number(stage.hours) || 8),
          value: Number(stage.value) || 0,
          start_date: stage.startDate || null,
          end_date: stage.endDate || null,
          stage_order: Number(stage.stageOrder) || (index + 1),
          consultant_id: stage.consultantId || project.mainConsultantId || null,
          status: stage.status || 'iniciar_projeto',
          completed: Boolean(stage.completed) || false,
          client_approved: Boolean(stage.clientApproved) || false,
          manager_approved: Boolean(stage.managerApproved) || false,
          invoice_issued: Boolean(stage.invoiceIssued) || false,
          payment_received: Boolean(stage.paymentReceived) || false,
          consultants_settled: Boolean(stage.consultantsSettled) || false,
          valor_de_repasse: Number(stage.valorDeRepasse) || 0
        };
        
        console.log(`Dados limpos da etapa ${index + 1}:`, stageData);
        return stageData;
      });

      console.log('=== DADOS FINAIS PARA INSERÇÃO DAS ETAPAS ===');
      console.log('Array de etapas para inserção:', JSON.stringify(stagesData, null, 2));

      // INSERIR ETAPAS EM LOTE
      const { data: createdStages, error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData)
        .select();

      if (stagesError) {
        console.error('❌ ERRO ao criar etapas:', stagesError);
        console.error('Dados das etapas que causaram erro:', JSON.stringify(stagesData, null, 2));
        
        // Se falhou ao criar etapas, deletar o projeto para manter consistência
        console.log('Deletando projeto devido ao erro nas etapas...');
        await supabase.from('projects').delete().eq('id', createdProject.id);
        
        throw new Error(`Erro ao criar etapas: ${stagesError.message}`);
      } else {
        console.log('✅ Etapas criadas com sucesso:', createdStages);
        console.log(`✅ Total de etapas criadas: ${createdStages?.length || 0}`);
      }
    } else {
      console.log('⚠️ Nenhuma etapa foi fornecida para criação');
    }

    // VINCULAR TAGS SE EXISTIREM
    if (project.tagIds && Array.isArray(project.tagIds) && project.tagIds.length > 0) {
      console.log('Vinculando tags ao projeto:', project.tagIds);
      try {
        await linkProjectToTags(createdProject.id, project.tagIds);
        console.log('✅ Tags vinculadas com sucesso');
      } catch (tagError) {
        console.error('⚠️ Erro ao vincular tags (não crítico):', tagError);
      }
    }

    console.log('=== PROJETO E ETAPAS CRIADOS COM SUCESSO ===');
    console.log('✅ Projeto ID:', createdProject.id);
    console.log('✅ Nome do projeto:', createdProject.name);
    console.log('✅ Status do projeto:', createdProject.status);
    
    return createdProject;
  } catch (error) {
    console.error('=== ERRO CRÍTICO NA CRIAÇÃO DO PROJETO ===');
    console.error('Erro detalhado:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
};

export const updateProject = async (project: any) => {
  try {
    console.log('=== ATUALIZANDO PROJETO E ETAPAS (DEBUG COMPLETO) ===');
    console.log('Dados originais recebidos:', JSON.stringify(project, null, 2));
    
    if (!project.id) {
      throw new Error('ID do projeto é obrigatório para atualização');
    }
    
    // CRIAR OBJETO COMPLETAMENTE LIMPO - APENAS CAMPOS DA TABELA PROJECTS
    const cleanProjectData = {
      name: String(project.name || ''),
      description: String(project.description || ''),
      client_id: project.clientId || null,
      service_id: project.serviceId || null,
      main_consultant_id: project.mainConsultantId || null,
      support_consultant_id: project.supportConsultantId || null,
      start_date: project.startDate || null,
      end_date: project.endDate || null,
      total_value: Number(project.totalValue || 0),
      total_hours: Number(project.totalHours || 0),
      hourly_rate: Number(project.hourlyRate || 0),
      main_consultant_commission: Number(project.mainConsultantCommission || 0),
      support_consultant_commission: Number(project.supportConsultantCommission || 0),
      main_consultant_value: Number(project.consultantValue || 0),
      support_consultant_value: Number(project.supportConsultantValue || 0),
      third_party_expenses: Number(project.thirdPartyExpenses || 0),
      tax_percent: Number(project.taxPercent || 16),
      manager_name: String(project.managerName || ''),
      manager_email: String(project.managerEmail || ''),
      manager_phone: String(project.managerPhone || ''),
      url: project.url || null,
    };

    console.log('=== DADOS PARA ATUALIZAÇÃO DO PROJETO ===');
    console.log('Objeto limpo para atualização na tabela PROJECTS:', JSON.stringify(cleanProjectData, null, 2));

    // ATUALIZAR PROJETO
    const { data: updatedProject, error: projectError } = await supabase
      .from('projects')
      .update(cleanProjectData)
      .eq('id', project.id)
      .select()
      .single();
    
    if (projectError) {
      console.error('❌ ERRO ao atualizar projeto:', projectError);
      console.error('Dados que causaram erro:', JSON.stringify(cleanProjectData, null, 2));
      throw new Error(`Erro ao atualizar projeto: ${projectError.message}`);
    }

    console.log('✅ Projeto atualizado com sucesso:', updatedProject);

    // ATUALIZAR ETAPAS SE EXISTIREM
    if (project.stages && Array.isArray(project.stages)) {
      console.log('=== ATUALIZANDO ETAPAS DO PROJETO ===');
      console.log(`Número de etapas a atualizar: ${project.stages.length}`);
      
      // PRIMEIRO, DELETAR TODAS AS ETAPAS EXISTENTES
      console.log('Deletando etapas existentes...');
      const { error: deleteError } = await supabase
        .from('project_stages')
        .delete()
        .eq('project_id', project.id);

      if (deleteError) {
        console.error('Erro ao deletar etapas existentes:', deleteError);
        throw new Error(`Erro ao deletar etapas existentes: ${deleteError.message}`);
      }

      if (project.stages.length > 0) {
        // PREPARAR DADOS DAS ETAPAS COM VALIDAÇÃO RIGOROSA
        const stagesData = project.stages.map((stage: any, index: number) => {
          console.log(`Processando etapa ${index + 1}:`, stage);
          
          // VALIDAR CAMPOS OBRIGATÓRIOS
          if (!stage.name || String(stage.name).trim() === '') {
            throw new Error(`Nome da etapa ${index + 1} é obrigatório`);
          }
          
          const stageData = {
            project_id: project.id,
            name: String(stage.name).trim(),
            description: String(stage.description || ''),
            days: Math.max(1, Number(stage.days) || 1),
            hours: Math.max(1, Number(stage.hours) || 8),
            value: Number(stage.value) || 0,
            start_date: stage.startDate || null,
            end_date: stage.endDate || null,
            stage_order: Number(stage.stageOrder) || (index + 1),
            consultant_id: stage.consultantId || project.mainConsultantId || null,
            status: stage.status || 'iniciar_projeto',
            completed: Boolean(stage.completed) || false,
            client_approved: Boolean(stage.clientApproved) || false,
            manager_approved: Boolean(stage.managerApproved) || false,
            invoice_issued: Boolean(stage.invoiceIssued) || false,
            payment_received: Boolean(stage.paymentReceived) || false,
            consultants_settled: Boolean(stage.consultantsSettled) || false,
            valor_de_repasse: Number(stage.valorDeRepasse) || 0
          };
          
          console.log(`Dados limpos da etapa ${index + 1}:`, stageData);
          return stageData;
        });

        console.log('=== DADOS FINAIS PARA INSERÇÃO DAS ETAPAS ===');
        console.log('Array de etapas para inserção:', JSON.stringify(stagesData, null, 2));

        // INSERIR NOVAS ETAPAS
        const { data: createdStages, error: stagesError } = await supabase
          .from('project_stages')
          .insert(stagesData)
          .select();

        if (stagesError) {
          console.error('❌ ERRO ao criar novas etapas:', stagesError);
          console.error('Dados das etapas que causaram erro:', JSON.stringify(stagesData, null, 2));
          throw new Error(`Erro ao criar novas etapas: ${stagesError.message}`);
        } else {
          console.log('✅ Novas etapas criadas com sucesso:', createdStages);
          console.log(`✅ Total de etapas criadas: ${createdStages?.length || 0}`);
        }
      }
    }

    // ATUALIZAR TAGS SE EXISTIREM
    if (project.tagIds) {
      try {
        await linkProjectToTags(project.id, project.tagIds);
        console.log('✅ Tags atualizadas com sucesso');
      } catch (tagError) {
        console.error('⚠️ Erro ao atualizar tags (não crítico):', tagError);
      }
    }

    await updateProjectStatusAutomatically(project.id);

    console.log('=== PROJETO E ETAPAS ATUALIZADOS COM SUCESSO ===');
    console.log('✅ Projeto ID:', updatedProject.id);
    return updatedProject;
  } catch (error) {
    console.error('=== ERRO CRÍTICO NA ATUALIZAÇÃO DO PROJETO ===');
    console.error('Erro detalhado:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    // First, check if the project has "cancelado" status
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('status, name')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching project for deletion:', fetchError);
      throw fetchError;
    }

    // Allow deletion only for projects with "cancelado" status
    if (project.status !== 'cancelado') {
      throw new Error('Apenas projetos com status "cancelado" podem ser removidos. Altere o status do projeto para "cancelado" antes de excluí-lo.');
    }

    console.log(`Deleting project "${project.name}" with cancelado status...`);

    // Delete all related project stages
    const { error: stagesError } = await supabase
      .from('project_stages')
      .delete()
      .eq('project_id', id);
    
    if (stagesError) {
      console.error('Error deleting project stages:', stagesError);
      throw stagesError;
    }

    // Delete project tag relations
    const { error: tagsError } = await supabase
      .from('project_tag_relations')
      .delete()
      .eq('project_id', id);
    
    if (tagsError) {
      console.error('Error deleting project tag relations:', tagsError);
      throw tagsError;
    }

    // Delete financial transactions related to the project
    const { error: transactionsError } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('project_id', id);
    
    if (transactionsError) {
      console.error('Error deleting financial transactions:', transactionsError);
      // Don't throw error here, continue with deletion
    }

    // Delete project history
    const { error: historyError } = await supabase
      .from('project_history')
      .delete()
      .eq('project_id', id);
    
    if (historyError) {
      console.error('Error deleting project history:', historyError);
      // Don't throw error here, continue with deletion
    }

    // Finally delete the project - ZERO CHAT REFERENCES
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }

    console.log(`Project "${project.name}" deleted successfully (ZERO CHAT INVOLVED)`);
    console.log('✅ Exclusão completada sem qualquer referência a chat');
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
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

export const createProjectTag = async (tag: { name: string; color?: string }) => {
  try {
    const { data, error } = await supabase
      .from('project_tags')
      .insert({
        name: tag.name,
        color: tag.color || '#3b82f6'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating project tag:', error);
    throw error;
  }
};

export const linkProjectToTags = async (projectId: string, tagIds: string[]) => {
  try {
    // First, remove existing tag relations for this project
    await supabase
      .from('project_tag_relations')
      .delete()
      .eq('project_id', projectId);

    // Then, create new relations
    if (tagIds.length > 0) {
      const relations = tagIds.map(tagId => ({
        project_id: projectId,
        tag_id: tagId
      }));

      const { error } = await supabase
        .from('project_tag_relations')
        .insert(relations);

      if (error) throw error;
    }
  } catch (error) {
    console.error('Error linking project to tags:', error);
    throw error;
  }
};

// Fetch basic tags for filters - update to use project_tags
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

// Fetch consultants for filters
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

// Fetch services for filters
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
