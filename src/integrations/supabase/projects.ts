
import { supabase } from './client';
import { ensureProjectChatRoom, addChatParticipant } from './chat';

// Função para criar um projeto e automaticamente criar uma sala de chat para ele
export const createProjectWithChat = async (projectData: any) => {
  // Inserir o projeto
  const { data, error } = await supabase
    .from('projects')
    .insert(projectData)
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar projeto:', error);
    throw error;
  }
  
  try {
    // Criar sala de chat para o projeto (mesmo que o trigger também faça isso)
    const chatRoom = await ensureProjectChatRoom(data.id, data.name);
    
    // Adicionar consultores como participantes da sala
    if (data.main_consultant_id) {
      // Buscar informações do consultor principal
      const { data: mainConsultant } = await supabase
        .from('consultants')
        .select('name')
        .eq('id', data.main_consultant_id)
        .single();
      
      if (mainConsultant) {
        await addChatParticipant(
          chatRoom.id, 
          data.main_consultant_id, 
          mainConsultant.name, 
          'consultor'
        );
      }
    }
    
    if (data.support_consultant_id) {
      // Buscar informações do consultor de suporte
      const { data: supportConsultant } = await supabase
        .from('consultants')
        .select('name')
        .eq('id', data.support_consultant_id)
        .single();
      
      if (supportConsultant) {
        await addChatParticipant(
          chatRoom.id, 
          data.support_consultant_id, 
          supportConsultant.name, 
          'consultor'
        );
      }
    }
  } catch (chatError) {
    console.error('Erro ao configurar sala de chat:', chatError);
    // Não lançamos o erro aqui para não impedir a criação do projeto
    // mas ainda registramos para debugging
  }
  
  return data;
};

/**
 * Updates an existing project in the database
 */
export const updateProject = async (id: string, projectData: any) => {
  const { data, error } = await supabase
    .from('projects')
    .update(projectData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }

  return data;
};

// Exportar outras funções relacionadas a projetos, se necessário
