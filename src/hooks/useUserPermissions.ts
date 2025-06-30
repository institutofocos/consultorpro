
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  user_id: string;
  profile_id: string;
  profile_name: string;
  profile_description: string;
}

interface UserLinks {
  consultant_id: string | null;
  consultant_name: string | null;
  client_id: string | null;
  client_name: string | null;
}

interface ModulePermission {
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
  restrict_to_linked: boolean;
}

export const useUserPermissions = () => {
  const { user } = useAuth();

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_user_profile', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] as UserProfile : null;
    },
    enabled: !!user?.id,
  });

  const { data: userLinks, isLoading: linksLoading } = useQuery({
    queryKey: ['user-links', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_user_links', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data && data.length > 0 ? data[0] as UserLinks : null;
    },
    enabled: !!user?.id,
  });

  const { data: modulePermissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['module-permissions', userProfile?.profile_id],
    queryFn: async () => {
      if (!userProfile?.profile_id) return [];
      
      const { data, error } = await supabase
        .from('profile_module_permissions')
        .select('*')
        .eq('profile_id', userProfile.profile_id);
      
      if (error) throw error;
      return data as ModulePermission[];
    },
    enabled: !!userProfile?.profile_id,
  });

  const isLoading = profileLoading || linksLoading || permissionsLoading;

  // Verificar se é Super Admin
  const isSuperAdmin = userProfile?.profile_name === 'Super Admin';

  // Verificar se é um consultor com acesso restrito
  const isRestrictedConsultant = () => {
    if (isSuperAdmin) return false;
    
    // Se o usuário tem um consultor vinculado e não é Super Admin, é restrito
    return !!userLinks?.consultant_id;
  };

  // Obter o ID do consultor vinculado (para filtros automáticos)
  const getLinkedConsultantId = () => {
    return userLinks?.consultant_id || null;
  };

  // Função para verificar permissão de módulo
  const hasModulePermission = (moduleName: string, permissionType: 'view' | 'edit' | 'delete' = 'view') => {
    if (isSuperAdmin) return true;
    
    const permission = modulePermissions?.find(p => p.module_name === moduleName);
    if (!permission) return false;
    
    switch (permissionType) {
      case 'view':
        return permission.can_view;
      case 'edit':
        return permission.can_edit;
      case 'delete':
        return permission.can_delete;
      default:
        return false;
    }
  };

  // Verificar se deve restringir dados apenas aos vinculados
  const isRestrictedToLinked = (moduleName: string) => {
    if (isSuperAdmin) return false;
    
    const permission = modulePermissions?.find(p => p.module_name === moduleName);
    return permission?.restrict_to_linked || false;
  };

  // Verificar se tem acesso a consultor específico
  const hasConsultantAccess = (consultantId: string) => {
    if (isSuperAdmin) return true;
    return userLinks?.consultant_id === consultantId;
  };

  // Verificar se tem acesso a cliente específico
  const hasClientAccess = (clientId: string) => {
    if (isSuperAdmin) return true;
    return userLinks?.client_id === clientId;
  };

  // Verificar se pode acessar um projeto específico
  const hasProjectAccess = (project: any) => {
    if (isSuperAdmin) return true;
    
    // Se não tem permissão básica para ver projetos, retornar false
    if (!hasModulePermission('projects', 'view')) return false;
    
    // Se não está restrito aos vinculados, pode ver todos os projetos
    if (!isRestrictedToLinked('projects')) return true;
    
    // Verificar se tem acesso via consultor ou cliente vinculado
    const hasConsultorAccess = (project.main_consultant_id && hasConsultantAccess(project.main_consultant_id)) ||
                              (project.support_consultant_id && hasConsultantAccess(project.support_consultant_id));
    
    const hasClienteAccess = project.client_id && hasClientAccess(project.client_id);
    
    return hasConsultorAccess || hasClienteAccess;
  };

  return {
    userProfile,
    userLinks,
    modulePermissions,
    isLoading,
    isSuperAdmin,
    isRestrictedConsultant: isRestrictedConsultant(),
    getLinkedConsultantId,
    hasModulePermission,
    isRestrictedToLinked,
    hasConsultantAccess,
    hasClientAccess,
    hasProjectAccess,
  };
};
