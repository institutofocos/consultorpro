
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import ConsultantForm from './ConsultantForm';
import PermissionGuard from '@/components/auth/PermissionGuard';
import DataFilter from '@/components/auth/DataFilter';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  commission_percentage?: number;
  hours_per_month?: number;
  created_at: string;
}

const ConsultantList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { hasModulePermission, hasConsultantAccess, isRestrictedToLinked } = useUserPermissions();

  const { data: consultants = [], isLoading, refetch } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Consultant[];
    },
  });

  const filteredConsultants = consultants.filter(consultant =>
    consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setIsFormOpen(true);
  };

  const handleDelete = async (consultant: Consultant) => {
    if (!hasModulePermission('consultants', 'delete')) {
      toast.error('Você não tem permissão para excluir consultores');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${consultant.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('consultants')
        .delete()
        .eq('id', consultant.id);

      if (error) throw error;

      toast.success('Consultor excluído com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error('Erro ao excluir consultor: ' + error.message);
    }
  };

  const handleFormClose = () => {
    setSelectedConsultant(null);
    setIsFormOpen(false);
    refetch();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando consultores...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard module="consultants" action="view">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Consultores</h1>
            <p className="text-muted-foreground">Gerencie os consultores da empresa</p>
          </div>
          <PermissionGuard 
            module="consultants" 
            action="edit" 
            showAlert={false}
            fallback={null}
          >
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Consultor
            </Button>
          </PermissionGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lista de Consultores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar consultores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <DataFilter
              data={filteredConsultants}
              filterFn={(consultant, permissions) => {
                if (permissions.isSuperAdmin) return true;
                if (!permissions.isRestrictedToLinked('consultants')) return true;
                return permissions.hasConsultantAccess(consultant.id);
              }}
            >
              {(filteredData) => (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredData.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {searchTerm ? 'Nenhum consultor encontrado' : 'Nenhum consultor cadastrado'}
                      </p>
                    </div>
                  ) : (
                    filteredData.map((consultant) => (
                      <Card key={consultant.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>{getInitials(consultant.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">{consultant.name}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {consultant.commission_percentage}% comissão
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <PermissionGuard 
                                module="consultants" 
                                action="edit" 
                                showAlert={false}
                                fallback={null}
                              >
                                {(hasModulePermission('consultants', 'edit') || hasConsultantAccess(consultant.id)) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(consultant)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </PermissionGuard>
                              <PermissionGuard 
                                module="consultants" 
                                action="delete" 
                                showAlert={false}
                                fallback={null}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(consultant)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </PermissionGuard>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2" />
                              {consultant.email}
                            </div>
                            {consultant.phone && (
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 mr-2" />
                                {consultant.phone}
                              </div>
                            )}
                            {(consultant.city || consultant.state) && (
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2" />
                                {[consultant.city, consultant.state].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{consultant.hours_per_month || 160}h/mês</span>
                              <span>Cadastrado em {new Date(consultant.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </DataFilter>
          </CardContent>
        </Card>

        {isFormOpen && (
          <ConsultantForm
            consultant={selectedConsultant}
            onClose={handleFormClose}
          />
        )}
      </div>
    </PermissionGuard>
  );
};

export default ConsultantList;
