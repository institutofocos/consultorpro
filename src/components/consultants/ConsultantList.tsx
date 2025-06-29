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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Search, 
  UserPlus, 
  Edit, 
  Trash,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ConsultantForm from './ConsultantForm';
import ConsultantServicesModal from './ConsultantServicesModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Tables } from '@/integrations/supabase/types';

export type Consultant = {
  id: string;
  name: string;
  email: string;
  hoursPerMonth: number;
  availableHours?: number;
  workedHours?: number;
  phone?: string;
  commissionPercentage?: number;
  salary?: number;
  pixKey?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  education?: string;
  url?: string;
  services: string[];
  activeProjects?: number;
  activeStages?: number;
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
    url: consultant.url || '',
    services: consultant.services || [],
    activeProjects: 0,
    activeStages: 0,
    availableHours: 0,
    workedHours: 0,
  };
};

// Calculate worked hours from non-completed stages
const calculateConsultantWorkedHoursFromStages = async (consultantId: string): Promise<number> => {
  try {
    console.log(`=== CALCULANDO HORAS TRABALHADAS PARA CONSULTOR: ${consultantId} ===`);
    
    const { data: stageHours, error: stageError } = await supabase
      .from('project_stages')
      .select('hours, name, completed, status')
      .eq('consultant_id', consultantId)
      .eq('completed', false); // Apenas etapas não concluídas

    if (stageError) {
      console.error('Error fetching stage hours:', stageError);
      return 0;
    }

    console.log(`Etapas não concluídas para consultor ${consultantId}:`, stageHours);
    
    let totalStageHours = 0;
    if (stageHours && stageHours.length > 0) {
      totalStageHours = stageHours.reduce((sum, stage) => {
        console.log(`  - Etapa "${stage.name}": ${stage.hours || 0}h (concluída: ${stage.completed})`);
        return sum + (stage.hours || 0);
      }, 0);
    }

    console.log(`Total de horas trabalhadas (etapas não concluídas): ${totalStageHours}`);
    return totalStageHours;
  } catch (error) {
    console.error('Error calculating consultant worked hours:', error);
    return 0;
  }
};

// Calculate active projects count (non-completed)
const calculateConsultantActiveProjectsCount = async (consultantId: string): Promise<number> => {
  try {
    console.log(`=== CALCULANDO PROJETOS ATIVOS PARA CONSULTOR: ${consultantId} ===`);
    
    // Buscar projetos onde é consultor principal ou de apoio, excluindo concluídos
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, status')
      .or(`main_consultant_id.eq.${consultantId},support_consultant_id.eq.${consultantId}`)
      .not('status', 'eq', 'concluido')
      .not('status', 'eq', 'completed')
      .not('status', 'eq', 'cancelado');

    if (error) {
      console.error('Error fetching active projects:', error);
      return 0;
    }

    console.log(`Projetos ativos para consultor ${consultantId}:`, projects);
    
    const projectCount = projects?.length || 0;
    console.log(`=== TOTAL DE PROJETOS ATIVOS: ${projectCount} ===`);
    
    return projectCount;
  } catch (error) {
    console.error('Error calculating consultant active projects:', error);
    return 0;
  }
};

// Calculate active stages count (non-completed)
const calculateConsultantActiveStagesCount = async (consultantId: string): Promise<number> => {
  try {
    console.log(`=== CALCULANDO ETAPAS ATIVAS PARA CONSULTOR: ${consultantId} ===`);
    
    // Buscar etapas não concluídas
    const { data: stages, error } = await supabase
      .from('project_stages')
      .select('id, name, completed, status')
      .eq('consultant_id', consultantId)
      .eq('completed', false); // Apenas etapas não concluídas

    if (error) {
      console.error('Error fetching active stages:', error);
      return 0;
    }

    console.log(`Etapas ativas para consultor ${consultantId}:`, stages);
    
    const stageCount = stages?.length || 0;
    console.log(`=== TOTAL DE ETAPAS ATIVAS: ${stageCount} ===`);
    
    return stageCount;
  } catch (error) {
    console.error('Error calculating consultant active stages:', error);
    return 0;
  }
};

export const ConsultantList: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [availableHours, setAvailableHours] = useState<{[key: string]: number}>({});
  const [workedHours, setWorkedHours] = useState<{[key: string]: number}>({});
  const [activeProjects, setActiveProjects] = useState<{[key: string]: number}>({});
  const [activeStages, setActiveStages] = useState<{[key: string]: number}>({});
  const [lastCreatedUser, setLastCreatedUser] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [servicesModal, setServicesModal] = useState<{
    isOpen: boolean;
    consultantId: string;
    consultantName: string;
  }>({
    isOpen: false,
    consultantId: '',
    consultantName: ''
  });
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
        
        // Map consultants
        const mappedConsultants = consultantsWithServices.map(mapConsultantFromDB);
        setConsultants(mappedConsultants);

        // Calculate metrics for each consultant
        const workedHoursMap: {[key: string]: number} = {};
        const availableHoursMap: {[key: string]: number} = {};
        const activeProjectsMap: {[key: string]: number} = {};
        const activeStagesMap: {[key: string]: number} = {};
        
        for (const consultant of mappedConsultants) {
          console.log(`Calculating stats for consultant ${consultant.name} (${consultant.id})`);
          
          const workedHoursValue = await calculateConsultantWorkedHoursFromStages(consultant.id);
          const availableHoursValue = Math.max(0, consultant.hoursPerMonth - workedHoursValue);
          const activeProjectsValue = await calculateConsultantActiveProjectsCount(consultant.id);
          const activeStagesValue = await calculateConsultantActiveStagesCount(consultant.id);
          
          console.log(`Consultant ${consultant.name}: worked=${workedHoursValue}, available=${availableHoursValue}, projects=${activeProjectsValue}, stages=${activeStagesValue}`);
          
          workedHoursMap[consultant.id] = workedHoursValue;
          availableHoursMap[consultant.id] = availableHoursValue;
          activeProjectsMap[consultant.id] = activeProjectsValue;
          activeStagesMap[consultant.id] = activeStagesValue;
        }
        
        setWorkedHours(workedHoursMap);
        setAvailableHours(availableHoursMap);
        setActiveProjects(activeProjectsMap);
        setActiveStages(activeStagesMap);
        
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
  
  const handleAddConsultant = async (consultant: any) => {
    try {
      // Show user creation success if applicable
      if (consultant.userCreated && consultant.defaultPassword) {
        setLastCreatedUser({
          name: consultant.name,
          email: consultant.email,
          password: consultant.defaultPassword
        });
      }

      // Refresh consultant list after saving
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
        
        const mappedConsultants = consultantsWithServices.map(mapConsultantFromDB);
        setConsultants(mappedConsultants);

        // Recalculate metrics for all consultants
        const workedHoursMap: {[key: string]: number} = {};
        const availableHoursMap: {[key: string]: number} = {};
        const activeProjectsMap: {[key: string]: number} = {};
        const activeStagesMap: {[key: string]: number} = {};
        
        for (const consultant of mappedConsultants) {
          const workedHoursValue = await calculateConsultantWorkedHoursFromStages(consultant.id);
          const availableHoursValue = Math.max(0, consultant.hoursPerMonth - workedHoursValue);
          const activeProjectsValue = await calculateConsultantActiveProjectsCount(consultant.id);
          const activeStagesValue = await calculateConsultantActiveStagesCount(consultant.id);
          
          workedHoursMap[consultant.id] = workedHoursValue;
          availableHoursMap[consultant.id] = availableHoursValue;
          activeProjectsMap[consultant.id] = activeProjectsValue;
          activeStagesMap[consultant.id] = activeStagesValue;
        }
        
        setWorkedHours(workedHoursMap);
        setAvailableHours(availableHoursMap);
        setActiveProjects(activeProjectsMap);
        setActiveStages(activeStagesMap);
      }
      
      // Reset form state
      setEditingConsultant(null);
      setShowForm(false);
      
    } catch (error: any) {
      console.error('Error refreshing consultant list:', error);
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

  const handleViewServices = (consultant: Consultant) => {
    setServicesModal({
      isOpen: true,
      consultantId: consultant.id,
      consultantName: consultant.name
    });
  };

  const closeServicesModal = () => {
    setServicesModal({
      isOpen: false,
      consultantId: '',
      consultantName: ''
    });
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Consultores</h1>
        <p className="text-muted-foreground">Gerenciamento de consultores</p>
      </div>

      {lastCreatedUser && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Usuário criado com sucesso!</strong>
            <div className="mt-2 space-y-1">
              <div><strong>Nome:</strong> {lastCreatedUser.name}</div>
              <div><strong>Email:</strong> {lastCreatedUser.email}</div>
              <div><strong>Senha padrão:</strong> {lastCreatedUser.password}</div>
            </div>
            <div className="mt-2 text-sm">
              Informe ao consultor para fazer login e alterar a senha no primeiro acesso.
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setLastCreatedUser(null)}
            >
              Entendi
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {showForm ? (
        <ConsultantForm 
          consultant={editingConsultant} 
          onConsultantSaved={handleAddConsultant} 
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
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Horas/Mês</TableHead>
                    <TableHead>Horas Trabalhadas</TableHead>
                    <TableHead>Horas Livres</TableHead>
                    <TableHead>Projetos</TableHead>
                    <TableHead>Etapas</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Serviços Habilitados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Carregando consultores...
                      </TableCell>
                    </TableRow>
                  ) : filteredConsultants.length > 0 ? (
                    filteredConsultants.map((consultant) => (
                      <TableRow key={consultant.id}>
                        <TableCell className="font-medium">{consultant.name}</TableCell>
                        <TableCell>{consultant.email}</TableCell>
                        <TableCell>{consultant.hoursPerMonth}h</TableCell>
                        <TableCell>{workedHours[consultant.id] || 0}h</TableCell>
                        <TableCell>{availableHours[consultant.id] || consultant.hoursPerMonth}h</TableCell>
                        <TableCell>{activeProjects[consultant.id] || 0}</TableCell>
                        <TableCell>{activeStages[consultant.id] || 0}</TableCell>
                        <TableCell>
                          {consultant.url ? (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => window.open(consultant.url, '_blank')}
                              title="Visitar URL"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleViewServices(consultant)}
                            title="Ver serviços habilitados"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
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
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Nenhum consultor encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ConsultantServicesModal
            isOpen={servicesModal.isOpen}
            onClose={closeServicesModal}
            consultantId={servicesModal.consultantId}
            consultantName={servicesModal.consultantName}
          />
        </>
      )}
    </div>
  );
};

export default ConsultantList;
