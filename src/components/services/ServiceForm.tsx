
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
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const serviceSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  totalHours: z.coerce.number().positive({ message: 'Horas devem ser maior que 0' }),
  totalValue: z.coerce.number().positive({ message: 'Valor deve ser maior que 0' }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceStage {
  id: number;
  name: string;
  hours: number;
  value: number;
}

interface ServiceFormProps {
  service?: any;
  onSave: (data: ServiceFormValues & { stages: ServiceStage[] }) => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSave, onCancel }) => {
  const [stages, setStages] = useState<ServiceStage[]>(
    service?.stages || []
  );
  const [stageName, setStageName] = useState("");
  const [stageHours, setStageHours] = useState<number>(0);
  const [stageValue, setStageValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      description: service.description,
      totalHours: service.totalHours,
      totalValue: service.totalValue,
    } : {
      name: '',
      description: '',
      totalHours: 0,
      totalValue: 0,
    }
  });
  
  const totalValue = form.watch("totalValue");
  const totalHours = form.watch("totalHours");
  
  // Calculate the current sum of stage values
  const currentTotalStageValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const currentTotalStageHours = stages.reduce((sum, stage) => sum + stage.hours, 0);
  
  const remainingValue = totalValue - currentTotalStageValue;
  const remainingHours = totalHours - currentTotalStageHours;
  
  const handleAddStage = () => {
    if (!stageName.trim()) {
      setError("Nome da etapa é obrigatório");
      return;
    }
    
    if (stageHours <= 0) {
      setError("Horas da etapa devem ser maior que 0");
      return;
    }
    
    if (stageValue <= 0) {
      setError("Valor da etapa deve ser maior que 0");
      return;
    }
    
    if (stageHours > remainingHours) {
      setError(`Horas excedem o total disponível (${remainingHours}h restantes)`);
      return;
    }
    
    if (stageValue > remainingValue) {
      setError(`Valor excede o total disponível (R$${remainingValue.toFixed(2)} restantes)`);
      return;
    }
    
    setStages([
      ...stages,
      {
        id: stages.length + 1,
        name: stageName,
        hours: stageHours,
        value: stageValue
      }
    ]);
    
    setStageName("");
    setStageHours(0);
    setStageValue(0);
    setError(null);
  };
  
  const handleRemoveStage = (id: number) => {
    setStages(stages.filter((stage) => stage.id !== id));
  };
  
  const onSubmit = (data: ServiceFormValues) => {
    onSave({
      ...data,
      stages
    });
  };
  
  return (
    <Card className="shadow-card animate-slide-in">
      <CardHeader>
        <CardTitle>{service ? 'Editar Serviço' : 'Adicionar Serviço'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do serviço" {...field} />
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
                    <FormLabel>Descrição Geral</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do serviço" 
                        className="min-h-[120px]"
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
                  name="totalHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária Total (horas)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="totalValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="0.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Etapas do Serviço</h3>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <FormDescription className="text-xs">
                      Restante: {remainingHours}h
                    </FormDescription>
                  </div>
                  
                  <div>
                    <FormLabel>Valor (R$)</FormLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={stageValue || ""}
                      onChange={(e) => setStageValue(parseFloat(e.target.value) || 0)}
                    />
                    <FormDescription className="text-xs">
                      Restante: R${remainingValue.toFixed(2)}
                    </FormDescription>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={handleAddStage}
                  size="sm" 
                  className="w-full"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Etapa
                </Button>
                
                {stages.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left">Etapa</th>
                          <th className="px-4 py-2 text-right">Horas</th>
                          <th className="px-4 py-2 text-right">Valor (R$)</th>
                          <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stages.map((stage) => (
                          <tr key={stage.id} className="border-t">
                            <td className="px-4 py-3">{stage.name}</td>
                            <td className="px-4 py-3 text-right">{stage.hours}h</td>
                            <td className="px-4 py-3 text-right">R${stage.value.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveStage(stage.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50 font-medium">
                          <td className="px-4 py-2">Total</td>
                          <td className="px-4 py-2 text-right">{currentTotalStageHours}h / {totalHours}h</td>
                          <td className="px-4 py-2 text-right">R${currentTotalStageValue.toFixed(2)} / R${totalValue.toFixed(2)}</td>
                          <td></td>
                        </tr>
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
            <Button type="submit">Salvar</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
