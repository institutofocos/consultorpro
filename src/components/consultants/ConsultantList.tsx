import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ConsultantForm from './ConsultantForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Tables } from '@/integrations/supabase/types';
import { fetchConsultants, calculateConsultantAvailableHours } from "@/integrations/supabase/consultants";

export type Consultant = {
  id: string;
  name: string;
  email: string;
  hoursPerMonth: number;
  availableHours?: number;
  phone?: string;
  commissionPercentage?: number;
  salary?: number;
  pixKey?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  education?: string;
  services: string[];
  activeProjects?: number;
};

// Helper to map database model to frontend model
const mapConsultantFromDB = (consultant: Tables<"consultants"> & { services?: string[] }): Consultant => {
  return {
    id: consultant.id,
    name: consultant.name,
    email: consultant.email,
    hoursPerMonth: consultant.hours_per_month || 160,
    phone: consultant.phone || '',
    commissionPercentage: consultant.commission_percentage ? Number(consultant.commission_percentage) : 0,
    salary: consultant.salary ? Number(consultant.salary) : 0,
    pixKey: consultant.pix_key || '',
    street: consultant.street || '',
    city: consultant.city || '',
    state: consultant.state || '',
    zipCode: consultant.zip_code || '',
    education: consultant.education || '',
    services: consultant.services || [],
    activeProjects: 0, // Default value since we don't have projects implemented yet
    availableHours: 0, // Will be calculated later
  };
};

export const ConsultantList: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [availableHours, setAvailableHours] = useState<{[key: string]: number}>({});
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch consultants from database
  useEffect(() => {
    const fetchConsultantsData = async () => {
      try {
        setIsLoading(true);
        // Fetch consultants
        const { data: consultantData, error: consultantError } = await supabase
          .from('consultants')
          .select('*');
        
        if (consultantError) {
          throw consultantError;
        }
        
        // For each consultant, fetch their services
        const consultantsWithServices = await Promise.all(
          (consultantData || []).map(async (consultant) => {
            const { data: serviceData, error: serviceError } = await supabase
              .from('consultant_services')
              .select('service_id')
              .eq('consultant_id', consultant.id);
              
            if (serviceError) {
              console.error('Error fetching services for consultant:', serviceError);
              return { ...consultant, services: [] };
            }
            
            return { 
              ...consultant, 
              services: (serviceData || []).map(s => s.service_id)
            };
          })
        );
        
        // Map consultants and calculate available hours
        const mappedConsultants = consultantsWithServices.map(mapConsultantFromDB);
        setConsultants(mappedConsultants);

        // Calculate available hours for each consultant
        const hoursMap: {[key: string]: number} = {};
        for (const consultant of mappedConsultants) {
          const hours = await calculateConsultantAvailableHours(
            consultant.id, 
            consultant.hoursPerMonth
          );
          hoursMap[consultant.id] = hours;
        }
        
        setAvailableHours(hoursMap);
      } catch (error) {
        console.error('Error fetching consultants:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os consultores."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchConsultantsData();
  }, [toast]);
  
  const filteredConsultants = consultants.filter(consultant => 
    consultant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    consultant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddConsultant = async (formData: any) => {
    try {
      const consultantData = {
        name: formData.name,
        email: formData.email,
        hours_per_month: formData.hoursPerMonth,
        phone: formData.phone,
        commission_percentage: formData.commissionPercentage,
        salary: formData.salary,
        pix_key: formData.pixKey,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode,
        education: formData.education
      };

      let consultantId: string;
      
      if (editingConsultant) {
        // Update existing consultant
        const { error } = await supabase
          .from('consultants')
          .update(consultantData)
          .eq('id', editingConsultant.id);
          
        if (error) throw error;
        consultantId = editingConsultant.id;
        
        // Delete existing service relationships to replace them
        const { error: deleteError } = await supabase
          .from('consultant_services')
          .delete()
          .eq('consultant_id', consultantId);
          
        if (deleteError) throw deleteError;
      } else {
        // Insert new consultant
        const { data, error } = await supabase
          .from('consultants')
          .insert(consultantData)
          .select('id')
          .single();
          
        if (error) throw error;
        if (!data) throw new Error('Não foi possível criar o consultor');
        
        consultantId = data.id;
      }
      
      // Add selected services
      if (formData.services && formData.services.length > 0) {
        const serviceRelations = formData.services.map((serviceId: string) => ({
          consultant_id: consultantId,
          service_id: serviceId
        }));
        
        const { error: serviceError } = await supabase
          .from('consultant_services')
          .insert(serviceRelations);
          
        if (serviceError) throw serviceError;
      }
      
      // Handle document uploads if needed (this would require storage setup)
      // Not implementing file uploads in this version
      
      toast({
        title: "Sucesso",
        description: `Consultor ${editingConsultant ? 'atualizado' : 'adicionado'} com sucesso!`
      });
      
      // Refresh consultant list
      const { data: updatedData, error: refreshError } = await supabase
        .from('consultants')
        .select('*');
      
      if (!refreshError && updatedData) {
        // Fetch services for each consultant again
        const consultantsWithServices = await Promise.all(
          updatedData.map(async (consultant) => {
            const { data: serviceData } = await supabase
              .from('consultant_services')
              .select('service_id')
              .eq('consultant_id', consultant.id);
              
            return { 
              ...consultant, 
              services: (serviceData || []).map(s => s.service_id)
            };
          })
        );
        
        setConsultants(consultantsWithServices.map(mapConsultantFromDB));
      }
      
      // Reset form state
      setEditingConsultant(null);
      setShowForm(false);
      
    } catch (error: any) {
      console.error('Error saving consultant:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível salvar o consultor."
      });
    }
  };
  
  const handleEditConsultant = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setShowForm(true);
  };
  
  const handleDeleteConsultant = async (id: string) => {
    try {
      const { error } = await supabase
        .from('consultants')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setConsultants(consultants.filter(c => c.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Consultor removido com sucesso!"
      });
    } catch (error: any) {
      console.error('Error deleting consultant:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível remover o consultor."
      });
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Consultores</h1>
        <p className="text-muted-foreground">Gerenciamento de consultores</p>
      </div>
      
      {showForm ? (
        <ConsultantForm 
          consultant={editingConsultant} 
          onSave={handleAddConsultant} 
          onCancel={() => {
            setShowForm(false);
            setEditingConsultant(null);
          }} 
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar consultores..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar Consultor
            </Button>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Consultores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Horas/Mês</TableHead>
                    <TableHead>Projetos</TableHead>
                    <TableHead>Horas Livres</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando consultores...
                      </TableCell>
                    </TableRow>
                  ) : filteredConsultants.length > 0 ? (
                    filteredConsultants.map((consultant) => (
                      <TableRow key={consultant.id}>
                        <TableCell className="font-medium">{consultant.name}</TableCell>
                        <TableCell>{consultant.email}</TableCell>
                        <TableCell>{consultant.hoursPerMonth}h</TableCell>
                        <TableCell>{consultant.activeProjects || 0}</TableCell>
                        <TableCell>
                          {availableHours[consultant.id] !== undefined ? 
                            `${availableHours[consultant.id]}h` : 
                            `${consultant.hoursPerMonth}h`}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditConsultant(consultant)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteConsultant(consultant.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum consultor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ConsultantList;
