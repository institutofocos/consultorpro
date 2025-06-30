
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: string;
  action?: 'view' | 'edit' | 'delete';
  fallback?: React.ReactNode;
  showAlert?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action = 'view',
  fallback,
  showAlert = true
}) => {
  const { hasModulePermission, isLoading } = useUserPermissions();

  if (isLoading) {
    return <div className="flex items-center justify-center p-4">Carregando...</div>;
  }

  const hasPermission = hasModulePermission(module, action);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAlert) {
      return (
        <Alert variant="destructive" className="max-w-md mx-auto">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para {action === 'view' ? 'visualizar' : action === 'edit' ? 'editar' : 'excluir'} este módulo.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

export default PermissionGuard;
