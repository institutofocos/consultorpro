
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useUserPermissions = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Verificar se é super admin
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select(`
            *,
            access_profiles (
              name,
              is_active
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (userProfile?.access_profiles?.name === 'Super Admin') {
          setIsSuperAdmin(true);
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, [user]);

  const hasModulePermission = (module: string, action: string) => {
    // Por enquanto, permitir acesso a todos os módulos para usuários autenticados
    return !!user;
  };

  return {
    isLoading,
    isSuperAdmin,
    hasModulePermission
  };
};
