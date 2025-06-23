
import React, { useState } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  BarChart2, Users, Building, Briefcase, Layers, 
  FileText, Calendar, DollarSign, Settings 
} from 'lucide-react';

export interface ModulePermission {
  module_name: string;
  can_view: boolean;
  can_edit: boolean;
}

interface ModulePermissionsSelectorProps {
  permissions: ModulePermission[];
  onChange: (permissions: ModulePermission[]) => void;
}

const systemModules = [
  { name: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { name: 'consultants', label: 'Consultores', icon: Users },
  { name: 'clients', label: 'Clientes', icon: Building },
  { name: 'projects', label: 'Projetos', icon: Briefcase },
  { name: 'services', label: 'Serviços', icon: Layers },
  { name: 'demands', label: 'Demandas', icon: FileText },
  { name: 'calendar', label: 'Calendário', icon: Calendar },
  { name: 'financial', label: 'Financeiro', icon: DollarSign },
  { name: 'settings', label: 'Configurações', icon: Settings }
];

const ModulePermissionsSelector: React.FC<ModulePermissionsSelectorProps> = ({
  permissions,
  onChange
}) => {
  const getPermission = (moduleName: string) => {
    return permissions.find(p => p.module_name === moduleName) || {
      module_name: moduleName,
      can_view: false,
      can_edit: false
    };
  };

  const updatePermission = (moduleName: string, field: 'can_view' | 'can_edit', value: boolean) => {
    const updatedPermissions = permissions.filter(p => p.module_name !== moduleName);
    const currentPermission = getPermission(moduleName);
    
    const newPermission = {
      ...currentPermission,
      [field]: value
    };

    // Se can_edit for true, can_view deve ser true também
    if (field === 'can_edit' && value) {
      newPermission.can_view = true;
    }
    
    // Se can_view for false, can_edit deve ser false também
    if (field === 'can_view' && !value) {
      newPermission.can_edit = false;
    }

    updatedPermissions.push(newPermission);
    onChange(updatedPermissions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Permissões de Acesso aos Módulos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {systemModules.map((module) => {
          const permission = getPermission(module.name);
          const Icon = module.icon;
          
          return (
            <div key={module.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">{module.label}</Label>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${module.name}_view`}
                    checked={permission.can_view}
                    onCheckedChange={(checked) => 
                      updatePermission(module.name, 'can_view', checked as boolean)
                    }
                  />
                  <Label htmlFor={`${module.name}_view`} className="text-xs">
                    Visualizar
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${module.name}_edit`}
                    checked={permission.can_edit}
                    onCheckedChange={(checked) => 
                      updatePermission(module.name, 'can_edit', checked as boolean)
                    }
                  />
                  <Label htmlFor={`${module.name}_edit`} className="text-xs">
                    Editar
                  </Label>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default ModulePermissionsSelector;
