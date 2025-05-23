
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";
import { Service } from '@/components/services/types';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  hoursPerMonth: z.coerce.number().min(1, { message: 'Horas devem ser maior que 0' }),
  phone: z.string().optional(),
  commissionPercentage: z.coerce.number().min(0).max(100).optional(),
  salary: z.coerce.number().min(0).optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  education: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsultantFormProps {
  consultant?: any;
  onSave: (data: FormValues & { services: string[], documents: File[] }) => void;
  onCancel: () => void;
}

export const ConsultantForm: React.FC<ConsultantFormProps> = ({ consultant, onSave, onCancel }) => {
  const [selectedServices, setSelectedServices] = useState<string[]>(consultant?.services || []);
  const [selectedServiceInput, setSelectedServiceInput] = useState<string>('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const { toast } = useToast();

  // Fetch services from database
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name');
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setAvailableServices(data);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os serviços."
        });
      }
    };

    fetchServices();
  }, [toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: consultant ? {
      name: consultant.name,
      email: consultant.email,
      hoursPerMonth: consultant.hoursPerMonth,
      phone: consultant.phone || '',
      commissionPercentage: consultant.commissionPercentage || 0,
      salary: consultant.salary || 0,
      street: consultant.street || '',
      city: consultant.city || '',
      state: consultant.state || '',
      zipCode: consultant.zipCode || '',
      education: consultant.education || '',
    } : {
      name: '',
      email: '',
      hoursPerMonth: 160,
      phone: '',
      commissionPercentage: 0,
      salary: 0,
      street: '',
      city: '',
      state: '',
      zipCode: '',
      education: '',
    }
  });
  
  const onSubmit = (data: FormValues) => {
    onSave({
      ...data,
      services: selectedServices,
      documents
    });
  };

  const handleServiceAdd = (serviceId: string) => {
    if (!selectedServices.includes(serviceId) && serviceId) {
      setSelectedServices([...selectedServices, serviceId]);
    }
    setSelectedServiceInput('');
  };

  const handleServiceRemove = (serviceId: string) => {
    setSelectedServices(selectedServices.filter(id => id !== serviceId));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocuments([...documents, ...Array.from(e.target.files)]);
    }
  };

  const handleFileRemove = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };
  
  return (
    <Card className="shadow-card animate-slide-in">
      <CardHeader>
        <CardTitle>{consultant ? 'Editar Consultor' : 'Adicionar Consultor'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Seção de Dados Pessoais */}
            <div>
              <h3 className="text-lg font-medium mb-4">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="hoursPerMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária Mensal (horas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="160" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção Financeira */}
            <div>
              <h3 className="text-lg font-medium mb-4">Dados Financeiros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="commissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentual de Repasse (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          max="100" 
                          placeholder="10.00" 
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentual padrão de repasse para este consultor
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salário Base (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Caso aplicável
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção de Endereço */}
            <div>
              <h3 className="text-lg font-medium mb-4">Endereço</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua/Av.</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Seção de Formação */}
            <div>
              <h3 className="text-lg font-medium mb-4">Formação</h3>
              <FormField
                control={form.control}
                name="education"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formação Acadêmica</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a formação acadêmica, cursos, etc." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seção de Documentos */}
            <div>
              <h3 className="text-lg font-medium mb-4">Documentos</h3>
              <div className="space-y-4">
                <div>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full border-dashed h-32"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Anexar Contratos, Diplomas, Certificados
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documentos anexados:</p>
                    <div className="flex flex-wrap gap-2">
                      {documents.map((file, index) => (
                        <Badge key={index} variant="secondary" className="gap-2 px-3 py-1.5">
                          {file.name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleFileRemove(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Serviços */}
            <div>
              <h3 className="text-lg font-medium mb-4">Serviços Prestados</h3>
              <div className="space-y-4">
                <div>
                  <Select
                    value={selectedServiceInput}
                    onValueChange={handleServiceAdd}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableServices.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((serviceId) => {
                      const service = availableServices.find(s => s.id === serviceId);
                      return (
                        <Badge key={serviceId} variant="secondary" className="gap-2 px-3 py-1.5">
                          {service?.name || `Serviço ${serviceId}`}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleServiceRemove(serviceId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
