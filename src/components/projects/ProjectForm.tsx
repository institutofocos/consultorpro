import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, X, AlertCircle, Edit2, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ServiceStage, BasicService, BasicClient } from "../services/types";

// Modificado o esquema para garantir que o consultor principal é obrigatório
const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  client: z.string({ required_error: 'Selecione um cliente' }),
  service: z.string().optional(),
  mainConsultant: z.string({ required_error: 'Selecione um consultor principal' }),
  supportConsultant: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  totalValue: z.coerce.number().positive({ message: 'Valor deve ser maior que 0' }),
  taxPercent: z.coerce.number().min(0).max(100),
  thirdPartyExpenses: z.coerce.number().min(0),
  mainConsultantValue: z.coerce.number().min(0),
  supportConsultantValue: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

interface ProjectStage extends ServiceStage {
  startDate: string;
  endDate: string;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [totalValue, setTotalValue] = useState(project?.totalValue || 0);
  const [taxPercent, setTaxPercent] = useState(project?.taxPercent || 16);
  const [thirdPartyExpenses, setThirdPartyExpenses] = useState(project?.thirdPartyExpenses || 0);
  const [mainConsultantValue, setMainConsultantValue] = useState(project?.mainConsultantValue || 0);
  const [supportConsultantValue, setSupportConsultantValue] = useState(project?.supportConsultantValue || 0);
  const [netValue, setNetValue] = useState(0);
  const [services, setServices] = useState<BasicService[]>([]);
  const [clients, setClients] = useState<BasicClient[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<BasicService | null>(null);
  const [projectStages, setProjectStages] = useState<ProjectStage[]>(project?.stages || []);
  
  const [stageName, setStageName] = useState("");
  const [stageHours, setStageHours] = useState<number>(0);
  const [stageDays, setStageDays] = useState<number>(0);
  const [stageValue, setStageValue] = useState<number>(0);
  const [stageStartDate, setStageStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [stageEndDate, setStageEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      client: project.client,
      service: project.service,
      mainConsultant: project.mainConsultant,
      supportConsultant: project.supportConsultant || '',
      startDate: project.startDate,
      endDate: project.endDate,
      totalValue: project.totalValue,
      taxPercent: project.taxPercent,
      thirdPartyExpenses: project.thirdPartyExpenses,
      mainConsultantValue: project.mainConsultantValue,
      supportConsultantValue: project.supportConsultantValue || 0,
    } : {
      name: '',
      description: '',
      client: '',
      service: '',
      mainConsultant: '',
      supportConsultant: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalValue: 0,
      taxPercent: 16,
      thirdPartyExpenses: 0,
      mainConsultantValue: 0,
      supportConsultantValue: 0,
    }
  });
  
  // Calculate net value whenever related values change
  React.useEffect(() => {
    const taxAmount = (totalValue * taxPercent) / 100;
    const calculatedNetValue = totalValue - taxAmount - thirdPartyExpenses - mainConsultantValue - supportConsultantValue;
    setNetValue(calculatedNetValue);
  }, [totalValue, taxPercent, thirdPartyExpenses, mainConsultantValue, supportConsultantValue]);
  
  // Fetch available services, clients and consultants
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, name, total_value, tax_rate, stages')
          .order('name');
          
        if (servicesError) throw servicesError;
        setServices(servicesData || []);
        
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, contact_name, email, phone')
          .order('name');
          
        if (clientsError) throw clientsError;
        setClients(clientsData || []);
        
        // Fetch consultants
        const { data: consultantsData, error: consultantsError } = await supabase
          .from('consultants')
          .select('id, name')
          .order('name');
          
        if (consultantsError) throw consultantsError;
        setConsultants(consultantsData || []);
        
        // If editing project, load the selected service
        if (project?.service) {
          const service = servicesData?.find(s => s.id === project.service);
          if (service) {
            setSelectedService(service);
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados');
      }
    };
    
    fetchData();
  }, [project]);
  
  // Handle service selection
  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    setSelectedService(service || null);
    
    if (service) {
      // Set project values based on selected service
      form.setValue('totalValue', service.total_value);
      setTotalValue(service.total_value);
      form.setValue('taxPercent', service.tax_rate);
      setTaxPercent(service.tax_rate);
      
      // Convert service stages to project stages if they exist
      if (service.stages) {
        try {
          const serviceStages = typeof service.stages === 'string' 
            ? JSON.parse(service.stages) 
            : service.stages;
          
          const today = new Date();
          let currentDate = new Date();
          
          const newProjectStages: ProjectStage[] = serviceStages.map((stage: ServiceStage, index: number) => {
            // Calculate stage dates
            const startDate = new Date(currentDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + stage.days);
            
            // Update currentDate for next stage
            currentDate = new Date(endDate);
            currentDate.setDate(currentDate.getDate() + 1);
            
            return {
              ...stage,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate.toISOString().split('T')[0]
            };
          });
          
          setProjectStages(newProjectStages);
        } catch (error) {
          console.error('Error parsing service stages:', error);
        }
      }
    }
  };
  
  // Reset the stage form
  const resetStageForm = () => {
    setStageName("");
    setStageHours(0);
    setStageDays(0);
    setStageValue(0);
    setStageStartDate(new Date().toISOString().split('T')[0]);
    setStageEndDate(new Date().toISOString().split('T')[0]);
    setEditingStage(null);
    setError(null);
  };

  const handleAddOrUpdateStage = () => {
    if (!stageName.trim()) {
      setError("Nome da etapa é obrigatório");
      return;
    }
    
    if (stageHours <= 0) {
      setError("Horas da etapa devem ser maior que 0");
      return;
    }

    if (stageDays <= 0) {
      setError("Dias da etapa devem ser maior que 0");
      return;
    }
    
    if (new Date(stageEndDate) < new Date(stageStartDate)) {
      setError("Data de término deve ser após a data de início");
      return;
    }
    
    if (editingStage) {
      // Update existing stage
      setProjectStages(projectStages.map(stage => 
        stage.id === editingStage.id 
          ? { 
              ...stage, 
              name: stageName, 
              hours: stageHours, 
              days: stageDays, 
              value: stageValue,
              startDate: stageStartDate,
              endDate: stageEndDate
            } 
          : stage
      ));
      toast.success("Etapa atualizada com sucesso");
    } else {
      // Add new stage
      setProjectStages([
        ...projectStages,
        {
          id: Date.now(), // Use timestamp for unique ID
          name: stageName,
          hours: stageHours,
          days: stageDays,
          value: stageValue,
          startDate: stageStartDate,
          endDate: stageEndDate
        }
      ]);
    }
    
    resetStageForm();
  };
  
  const handleEditStage = (stage: ProjectStage) => {
    setStageName(stage.name);
    setStageHours(stage.hours);
    setStageDays(stage.days || 0);
    setStageValue(stage.value);
    setStageStartDate(stage.startDate);
    setStageEndDate(stage.endDate);
    setEditingStage(stage);
    setError(null);
  };
  
  const handleRemoveStage = (id: number) => {
    setProjectStages(projectStages.filter((stage) => stage.id !== id));
    if (editingStage?.id === id) {
      resetStageForm();
    }
  };
  
  const onSubmit = async (data: FormValues) => {
    // Verificando explicitamente se o consultor principal está definido
    if (!data.mainConsultant) {
      toast.error("Consultor principal é obrigatório");
      return;
    }
    
    const projectData = {
      ...data,
      status: 'planned',
      netValue,
      stages: projectStages,
      // Garantindo que o ID do consultor principal é passado corretamente
      mainConsultantId: data.mainConsultant
    };
    onSave(projectData);
  };

  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <Card className="shadow-card animate-slide-in">
      <CardHeader>
        <CardTitle>{project ? 'Editar Projeto' : 'Adicionar Projeto'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Projeto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do projeto ou serviço" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o projeto..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map(client => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serviço</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleServiceChange(value);
                        }} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map(service => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="mainConsultant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor Principal *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um consultor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {consultants.map(consultant => (
                            <SelectItem key={consultant.id} value={consultant.id}>
                              {consultant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="supportConsultant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor de Apoio</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um consultor (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {consultants.map(consultant => (
                            <SelectItem key={consultant.id} value={consultant.id}>
                              {consultant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Financeiras</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total do Projeto</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            setTotalValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual de Imposto (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="16%" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setTaxPercent(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="thirdPartyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gastos com Terceiros</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setThirdPartyExpenses(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mainConsultantValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Repasse ao Consultor Principal</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setMainConsultantValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="supportConsultantValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Repasse ao Consultor de Apoio</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSupportConsultantValue(Number(e.target.value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Valor Líquido do Projeto:</span>
                  <span className="text-lg font-bold">{formatCurrency(netValue)}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Calculado como: Valor Total - Impostos - Gastos com Terceiros - Repasse aos Consultores
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Etapas do Projeto</h3>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div className="md:col-span-2">
                    <FormLabel>Nome da Etapa</FormLabel>
                    <Input
                      placeholder="Nome da etapa"
                      value={stageName}
                      onChange={(e) => setStageName(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Horas</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageHours || ""}
                      onChange={(e) => setStageHours(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <FormLabel>Dias</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageDays || ""}
                      onChange={(e) => setStageDays(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Valor</FormLabel>
                    <Input
                      type="number"
                      placeholder="0"
                      value={stageValue || ""}
                      onChange={(e) => setStageValue(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Data de Início</FormLabel>
                    <Input
                      type="date"
                      value={stageStartDate}
                      onChange={(e) => setStageStartDate(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <FormLabel>Data de Término</FormLabel>
                    <Input
                      type="date"
                      value={stageEndDate}
                      onChange={(e) => setStageEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={handleAddOrUpdateStage}
                  size="sm" 
                  className="w-full"
                >
                  {editingStage ? (
                    <>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Atualizar Etapa
                    </>
                  ) : (
                    <>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar Etapa
                    </>
                  )}
                </Button>
                
                {editingStage && (
                  <Button
                    type="button"
                    onClick={resetStageForm}
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Cancelar Edição
                  </Button>
                )}
                
                {projectStages.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left">Etapa</th>
                          <th className="px-4 py-2 text-right">Horas</th>
                          <th className="px-4 py-2 text-right">Dias</th>
                          <th className="px-4 py-2 text-right">Valor (R$)</th>
                          <th className="px-4 py-2 text-center">Período</th>
                          <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectStages.map((stage) => (
                          <tr key={stage.id} className="border-t">
                            <td className="px-4 py-3">{stage.name}</td>
                            <td className="px-4 py-3 text-right">{stage.hours}h</td>
                            <td className="px-4 py-3 text-right">{stage.days} dias</td>
                            <td className="px-4 py-3 text-right">R${stage.value.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-xs">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span>{stage.startDate} a {stage.endDate}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditStage(stage)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveStage(stage.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {project ? 'Atualizar' : 'Criar'} Projeto
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
