
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
import { PlusCircle, X, AlertCircle, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const serviceSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  totalHours: z.coerce.number().positive({ message: 'Horas devem ser maior que 0' }),
  totalValue: z.coerce.number().positive({ message: 'Valor deve ser maior que 0' }),
  hourlyRate: z.coerce.number().positive({ message: 'Valor hora deve ser maior que 0' }),
  taxRate: z.coerce.number().min(0, { message: 'Taxa não pode ser negativa' }).max(100, { message: 'Taxa não pode exceder 100%' }),
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
  const [editingStage, setEditingStage] = useState<ServiceStage | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      description: service.description,
      totalHours: service.totalHours,
      totalValue: service.totalValue,
      hourlyRate: service.hourlyRate || 0,
      taxRate: service.taxRate || 16,
    } : {
      name: '',
      description: '',
      totalHours: 0,
      totalValue: 0,
      hourlyRate: 0,
      taxRate: 16,
    }
  });
  
  const totalValue = form.watch("totalValue");
  const totalHours = form.watch("totalHours");
  
  // Calculate the current sum of stage values
  const currentTotalStageValue = stages.reduce((sum, stage) => sum + stage.value, 0);
  const currentTotalStageHours = stages.reduce((sum, stage) => sum + stage.hours, 0);
  
  const remainingValue = totalValue - currentTotalStageValue;
  const remainingHours = totalHours - currentTotalStageHours;
  
  // Reset the stage form
  const resetStageForm = () => {
    setStageName("");
    setStageHours(0);
    setStageValue(0);
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
    
    if (stageValue <= 0) {
      setError("Valor da etapa deve ser maior que 0");
      return;
    }
    
    const newHours = editingStage ? currentTotalStageHours - editingStage.hours + stageHours : currentTotalStageHours + stageHours;
    const newValue = editingStage ? currentTotalStageValue - editingStage.value + stageValue : currentTotalStageValue + stageValue;
    
    if (newHours > totalHours) {
      setError(`Horas excedem o total disponível (${totalHours}h total)`);
      return;
    }
    
    if (newValue > totalValue) {
      setError(`Valor excede o total disponível (R$${totalValue.toFixed(2)} total)`);
      return;
    }

    if (editingStage) {
      // Update existing stage
      setStages(stages.map(stage => 
        stage.id === editingStage.id 
          ? { ...stage, name: stageName, hours: stageHours, value: stageValue } 
          : stage
      ));
      toast.success("Etapa atualizada com sucesso");
    } else {
      // Add new stage
      setStages([
        ...stages,
        {
          id: Date.now(), // Use timestamp for unique ID
          name: stageName,
          hours: stageHours,
          value: stageValue
        }
      ]);
    }
    
    resetStageForm();
  };
  
  const handleEditStage = (stage: ServiceStage) => {
    setStageName(stage.name);
    setStageHours(stage.hours);
    setStageValue(stage.value);
    setEditingStage(stage);
    setError(null);
  };
  
  const handleRemoveStage = (id: number) => {
    setStages(stages.filter((stage) => stage.id !== id));
    if (editingStage?.id === id) {
      resetStageForm();
    }
  };
  
  const onSubmit = (data: ServiceFormValues) => {
    // Validate that all hours are accounted for
    if (currentTotalStageHours < totalHours) {
      toast.error(`A soma das horas das etapas (${currentTotalStageHours}h) é menor que o total definido (${totalHours}h)`);
      return;
    }

    if (currentTotalStageHours > totalHours) {
      toast.error(`A soma das horas das etapas (${currentTotalStageHours}h) é maior que o total definido (${totalHours}h)`);
      return;
    }

    if (currentTotalStageValue < totalValue) {
      toast.error(`A soma dos valores das etapas (R$${currentTotalStageValue.toFixed(2)}) é menor que o valor total definido (R$${totalValue.toFixed(2)})`);
      return;
    }

    if (currentTotalStageValue > totalValue) {
      toast.error(`A soma dos valores das etapas (R$${currentTotalStageValue.toFixed(2)}) é maior que o valor total definido (R$${totalValue.toFixed(2)})`);
      return;
    }

    // Only save if stages exist
    if (stages.length === 0) {
      toast.error("É necessário adicionar pelo menos uma etapa ao serviço");
      return;
    }

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Hora (R$)</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tributação (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="16.00" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="text-xs">
                        Padrão: 16%
                      </FormDescription>
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
