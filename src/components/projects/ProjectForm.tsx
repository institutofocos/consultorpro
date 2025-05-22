
import React, { useState } from 'react';
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

// Mock consultants for select
const mockConsultants = [
  { id: 1, name: 'Ana Silva' },
  { id: 2, name: 'Carlos Mendes' },
  { id: 3, name: 'Patricia Lemos' },
  { id: 4, name: 'Roberto Gomes' },
  { id: 5, name: 'Juliana Alves' },
];

// Mock KPIs for select
const mockKpis = [
  { id: 1, name: 'Satisfação do cliente', pillar: 'Qualidade' },
  { id: 2, name: 'ROI do projeto', pillar: 'Financeiro' },
  { id: 3, name: 'Cumprimento de prazos', pillar: 'Processos' },
  { id: 4, name: 'Inovação implementada', pillar: 'Inovação' },
];

// Mock OKRs for select
const mockOkrs = [
  { id: 1, name: 'Aumentar satisfação do cliente em 15%' },
  { id: 2, name: 'Reduzir custos operacionais em 20%' },
  { id: 3, name: 'Implementar novo sistema em 6 meses' },
];

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  mainConsultant: z.string({ required_error: 'Selecione um consultor' }),
  startDate: z.string(),
  endDate: z.string(),
  totalValue: z.coerce.number().min(1, { message: 'Valor deve ser maior que 0' }),
  taxPercent: z.coerce.number().min(0).max(100),
  thirdPartyExpenses: z.coerce.number().min(0),
  consultantValue: z.coerce.number().min(0),
  kpis: z.array(z.string()).optional(),
  okrs: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onCancel }) => {
  const [totalValue, setTotalValue] = useState(project?.totalValue || 0);
  const [taxPercent, setTaxPercent] = useState(project?.taxPercent || 16);
  const [thirdPartyExpenses, setThirdPartyExpenses] = useState(project?.thirdPartyExpenses || 0);
  const [consultantValue, setConsultantValue] = useState(project?.consultantValue || 0);
  const [netValue, setNetValue] = useState(0);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: project ? {
      name: project.name,
      description: project.description,
      mainConsultant: project.mainConsultant,
      startDate: project.startDate,
      endDate: project.endDate,
      totalValue: project.totalValue,
      taxPercent: project.taxPercent,
      thirdPartyExpenses: project.thirdPartyExpenses,
      consultantValue: project.consultantValue,
      kpis: project.kpis || [],
      okrs: project.okrs || [],
    } : {
      name: '',
      description: '',
      mainConsultant: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalValue: 0,
      taxPercent: 16,
      thirdPartyExpenses: 0,
      consultantValue: 0,
      kpis: [],
      okrs: [],
    }
  });
  
  // Calculate net value whenever related values change
  React.useEffect(() => {
    const taxAmount = (totalValue * taxPercent) / 100;
    const calculatedNetValue = totalValue - taxAmount - thirdPartyExpenses - consultantValue;
    setNetValue(calculatedNetValue);
  }, [totalValue, taxPercent, thirdPartyExpenses, consultantValue]);
  
  const onSubmit = (data: FormValues) => {
    const projectData = {
      ...data,
      status: 'planned',
      netValue
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
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="mainConsultant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor Principal</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um consultor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockConsultants.map(consultant => (
                            <SelectItem key={consultant.id} value={consultant.name}>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="consultantValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de Repasse ao Consultor</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setConsultantValue(Number(e.target.value));
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
                  Calculado como: Valor Total - Impostos - Gastos com Terceiros - Repasse ao Consultor
                </div>
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
