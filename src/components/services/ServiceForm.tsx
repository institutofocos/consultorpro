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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { PlusCircle, X, AlertCircle, Edit2, Tag, FileUp, AlignLeft, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ServiceStage, Json } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { uploadServiceFile, downloadServiceFile } from "@/integrations/supabase/services";

const serviceSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  description: z.string().min(10, { message: 'Descrição deve ter pelo menos 10 caracteres' }),
  url: z.string().url({ message: 'URL deve ser válida' }).optional().or(z.literal('')),
  totalHours: z.coerce.number().positive({ message: 'Horas devem ser maior que 0' }),
  hourlyRate: z.coerce.number().positive({ message: 'Valor hora deve ser maior que 0' }).optional(),
  totalValue: z.coerce.number().positive({ message: 'Valor total deve ser maior que 0' }).optional(),
  taxRate: z.coerce.number().min(0, { message: 'Taxa não pode ser negativa' }).max(100, { message: 'Taxa não pode exceder 100%' }),
  extraCosts: z.coerce.number().min(0, { message: 'Custos extras não podem ser negativos' }).default(0),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ExtendedServiceStage extends ServiceStage {
  description?: string;
  attachment?: string;
}

interface ServiceFormProps {
  service?: any;
  onSave: (data: ServiceFormValues & { stages: ServiceStage[], totalValue: number, netValue: number, tags: string[] }) => void;
  onCancel: () => void;
}

export const ServiceForm: React.FC<ServiceFormProps> = ({ service, onSave, onCancel }) => {
  // Parse service stages from JSON if needed
  let initialStages: ServiceStage[] = [];
  if (service?.stages) {
    if (typeof service.stages === 'string') {
      try {
        initialStages = JSON.parse(service.stages);
      } catch (e) {
        console.error('Error parsing stages:', e);
      }
    } else {
      initialStages = service.stages;
    }
  }

  const [stages, setStages] = useState<ExtendedServiceStage[]>(initialStages || []);
  const [stageName, setStageName] = useState("");
  const [stageHours, setStageHours] = useState<number>(0);
  const [stageDays, setStageDays] = useState<number>(0);
  const [stageValue, setStageValue] = useState<number>(0);
  const [stageDescription, setStageDescription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [editingStage, setEditingStage] = useState<ExtendedServiceStage | null>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [fileUploading, setFileUploading] = useState(false);
  
  // Dialog state for description editing
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);
  const [currentDescription, setCurrentDescription] = useState("");
  
  // Dialog for file preview
  const [filePreviewDialogOpen, setFilePreviewDialogOpen] = useState(false);
  const [currentFilePreview, setCurrentFilePreview] = useState<{url: string, name: string, path: string} | null>(null);

  // Set initial selected tags from service
  useEffect(() => {
    if (service?.tags) {
      const tagIds = service.tags.map((tag: any) => tag.id);
      setSelectedTags(tagIds);
    }
  }, [service]);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: service ? {
      name: service.name,
      description: service.description || '',
      url: service.url || '',
      totalHours: service.total_hours || service.totalHours || 0,
      hourlyRate: service.hourly_rate || service.hourlyRate || 0,
      totalValue: service.total_value || service.totalValue || 0,
      taxRate: service.tax_rate || service.taxRate || 16,
      extraCosts: service.extra_costs || service.extraCosts || 0,
    } : {
      name: '',
      description: '',
      url: '',
      totalHours: 0,
      hourlyRate: 0,
      totalValue: 0,
      taxRate: 16,
      extraCosts: 0,
    }
  });
  
  const totalHours = form.watch("totalHours");
  const hourlyRate = form.watch("hourlyRate");
  const totalValue = form.watch("totalValue");
  const taxRate = form.watch("taxRate");
  const extraCosts = form.watch("extraCosts");
  
  // Calculate net value: total value - tax - extra costs
  const calculatedTotalValue = totalHours * (hourlyRate || 0);
  const displayTotalValue = totalValue || calculatedTotalValue;
  const taxAmount = displayTotalValue * (taxRate / 100);
  const netValue = displayTotalValue - taxAmount - extraCosts;
  
  // Calculate the current sum of stage hours
  const currentTotalStageHours = stages.reduce((sum, stage) => sum + stage.hours, 0);
  const remainingHours = totalHours - currentTotalStageHours;

  useEffect(() => {
    // If hourly rate or total hours change, update total value
    if (hourlyRate && totalHours) {
      form.setValue('totalValue', hourlyRate * totalHours);
    }
  }, [hourlyRate, totalHours, form]);

  useEffect(() => {
    // If total value or total hours change and both are greater than 0, update hourly rate
    if (totalValue && totalValue > 0 && totalHours && totalHours > 0) {
      form.setValue('hourlyRate', totalValue / totalHours);
    }
  }, [totalValue, totalHours, form]);
  
  // Update total value and stage values when hourly rate changes
  useEffect(() => {
    if (hourlyRate > 0 && stages.length > 0) {
      // Recalculate stage values based on the new hourly rate
      const updatedStages = stages.map(stage => ({
        ...stage,
        value: stage.hours * hourlyRate
      }));
      setStages(updatedStages);
    }
  }, [hourlyRate]);

  // Fetch tags from database
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setTags(data || []);
      } catch (error: any) {
        console.error('Error fetching tags:', error);
        toast.error('Erro ao carregar tags');
      }
    };
    
    fetchTags();
  }, []);

  // Reset the stage form - updated to include description
  const resetStageForm = () => {
    setStageName("");
    setStageHours(0);
    setStageDays(0);
    setStageValue(0);
    setStageDescription("");
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

    // Calculate value based on hourly rate
    const calculatedValue = stageHours * (hourlyRate || 0);
    
    if (editingStage) {
      // Update existing stage - include description
      setStages(stages.map(stage => 
        stage.id === editingStage.id 
          ? { 
              ...stage, 
              name: stageName, 
              hours: stageHours, 
              days: stageDays, 
              value: calculatedValue,
              description: stageDescription
            } 
          : stage
      ));
      toast.success("Etapa atualizada com sucesso");
    } else {
      // Add new stage - include description
      setStages([
        ...stages,
        {
          id: Date.now(), // Use timestamp for unique ID
          name: stageName,
          hours: stageHours,
          days: stageDays,
          value: calculatedValue,
          description: stageDescription,
          attachment: ''
        }
      ]);
    }
    
    resetStageForm();
  };
  
  const handleEditStage = (stage: ExtendedServiceStage) => {
    setStageName(stage.name);
    setStageHours(stage.hours);
    setStageDays(stage.days || 0);
    setStageValue(stage.value);
    setStageDescription(stage.description || '');
    setEditingStage(stage);
    setError(null);
  };
  
  // Handle opening the description dialog
  const handleOpenDescriptionDialog = (index: number) => {
    setCurrentEditingIndex(index);
    setCurrentDescription(stages[index].description || '');
    setDescriptionDialogOpen(true);
  };
  
  // Handle saving the description
  const handleSaveDescription = () => {
    if (currentEditingIndex !== null) {
      const updatedStages = [...stages];
      updatedStages[currentEditingIndex].description = currentDescription;
      setStages(updatedStages);
      setDescriptionDialogOpen(false);
      setCurrentEditingIndex(null);
      toast.success("Descrição da etapa salva");
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (index: number, files: FileList | null) => {
    if (!files || !files[0]) return;
    
    const file = files[0];
    setFileUploading(true);
    
    try {
      // Use the service to upload the file to Supabase Storage
      const filePath = await uploadServiceFile(file, form.getValues('name') || 'unnamed-service');
      
      if (filePath) {
        const updatedStages = [...stages];
        updatedStages[index].attachment = filePath;
        // Store just the filename for display purposes
        updatedStages[index].attachmentName = file.name;
        setStages(updatedStages);
        
        toast.success("Arquivo anexado com sucesso!");
      } else {
        toast.error("Não foi possível anexar o arquivo.");
      }
    } catch (error) {
      console.error('Error with file:', error);
      toast.error("Não foi possível anexar o arquivo.");
    } finally {
      setFileUploading(false);
    }
  };
  
  const handleRemoveStage = (id: number) => {
    setStages(stages.filter((stage) => stage.id !== id));
    if (editingStage?.id === id) {
      resetStageForm();
    }
  };
  
  const handleTagAdd = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      setSelectedTags([...selectedTags, tagId]);
    }
    setTagInput("");
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(id => id !== tagId));
  };
  
  // Fix validation to properly compare the hours
  const compareHours = (a: number, b: number) => {
    return Math.abs(a - b) < 0.001;
  };
  
  const onSubmit = async (data: ServiceFormValues) => {
    // Fix validation to properly compare the hours
    const currentTotalStageHours = stages.reduce((sum, stage) => sum + stage.hours, 0);
    
    if (!compareHours(currentTotalStageHours, totalHours)) {
      toast.error(`A soma das horas das etapas (${currentTotalStageHours}h) deve ser igual ao total definido (${totalHours}h)`);
      return;
    }

    // Only save if stages exist
    if (stages.length === 0) {
      toast.error("É necessário adicionar pelo menos uma etapa ao serviço");
      return;
    }
    
    // Ensure we have a value for totalValue
    const finalTotalValue = data.totalValue || (data.hourlyRate || 0) * data.totalHours;

    // Calculate net value
    const taxAmount = finalTotalValue * (data.taxRate / 100);
    const calculatedNetValue = finalTotalValue - taxAmount - (data.extraCosts || 0);

    // Save to database
    try {
      // Convert data to match Supabase column names and convert stages to JSON
      const serviceData = {
        name: data.name,
        description: data.description,
        url: data.url || null,
        total_hours: data.totalHours,
        hourly_rate: data.hourlyRate || finalTotalValue / data.totalHours,
        total_value: finalTotalValue,
        tax_rate: data.taxRate,
        extra_costs: data.extraCosts || 0,
        net_value: calculatedNetValue,
        stages: JSON.stringify(stages) // Convert to JSON string
      };
      
      console.log('Saving service data:', serviceData);
      
      // For new service
      let savedServiceId;
      
      if (service) {
        // Update existing service
        const { data: updatedService, error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id)
          .select('id')
          .single();
          
        if (error) throw error;
        savedServiceId = updatedService.id;
      } else {
        // Insert new service
        const { data: newService, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select('id')
          .single();
          
        if (error) throw error;
        savedServiceId = newService.id;
      }
      
      // If we have tags, save the service-tag relationships
      if (selectedTags.length > 0) {
        // First delete existing tags if updating
        if (service) {
          await supabase
            .from('service_tags')
            .delete()
            .eq('service_id', savedServiceId);
        }
        
        // Create unique tag entries to avoid duplicate constraint violations
        const uniqueTagIds = [...new Set(selectedTags)];
        
        const serviceTags = uniqueTagIds.map(tagId => ({
          service_id: savedServiceId,
          tag_id: tagId
        }));
        
        if (serviceTags.length > 0) {
          const { error: tagError } = await supabase
            .from('service_tags')
            .insert(serviceTags);
            
          if (tagError) throw tagError;
        }
      }
      
      toast.success('Serviço cadastrado com sucesso!');
      
      // Pass the data to the parent component
      onSave({
        ...data,
        totalValue: finalTotalValue, 
        stages,
        netValue: calculatedNetValue,
        tags: selectedTags
      });
      
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(`Erro ao cadastrar serviço: ${error.message}`);
    }
  };
  
  // Handle opening the file preview dialog
  const handleOpenFilePreview = async (filePath: string, fileName: string) => {
    try {
      setFileUploading(true);
      const fileBlob = await downloadServiceFile(filePath);
      
      if (fileBlob) {
        // Create an object URL for the downloaded file
        const fileUrl = URL.createObjectURL(fileBlob);
        setCurrentFilePreview({
          url: fileUrl,
          name: fileName,
          path: filePath
        });
        setFilePreviewDialogOpen(true);
      } else {
        toast.error("Não foi possível baixar o arquivo.");
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      toast.error("Erro ao visualizar o arquivo.");
    } finally {
      setFileUploading(false);
    }
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

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://exemplo.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      URL relacionada ao serviço (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tags Selection */}
              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div>
                  <Select
                    value={tagInput}
                    onValueChange={handleTagAdd}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione tags para o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem 
                          key={tag.id} 
                          value={tag.id}
                          disabled={selectedTags.includes(tag.id)}
                        >
                          {tag.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTags.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      return (
                        <Badge key={tagId} variant="secondary" className="gap-2 px-3 py-1.5">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag?.name || 'Tag'}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleTagRemove(tagId)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <FormDescription className="text-xs">
                        Calculado: R$ {calculatedTotalValue.toFixed(2)}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="extraCosts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custos Extras (R$)</FormLabel>
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
                
                <div className="space-y-2">
                  <FormLabel>Valor Líquido (R$)</FormLabel>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                    R$ {netValue.toFixed(2)}
                  </div>
                  <FormDescription className="text-xs">
                    Total: R$ {displayTotalValue.toFixed(2)} | Taxa: R$ {taxAmount.toFixed(2)}
                  </FormDescription>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Etapas Sugeridas</h3>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                        Restante: {remainingHours.toFixed(1)}h
                      </FormDescription>
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
                      <FormLabel>Valor da Etapa</FormLabel>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted/50">
                        R$ {(stageHours * (hourlyRate || 0)).toFixed(2)}
                      </div>
                      <FormDescription className="text-xs">
                        Calculado: Horas × Valor hora
                      </FormDescription>
                    </div>
                  </div>

                  <div>
                    <FormLabel>Descrição da Etapa</FormLabel>
                    <Textarea
                      placeholder="Descrição detalhada da etapa..."
                      value={stageDescription}
                      onChange={(e) => setStageDescription(e.target.value)}
                      rows={3}
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
                
                {stages.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted">
                          <th className="px-4 py-2 text-left">Etapa</th>
                          <th className="px-4 py-2 text-left">Descrição</th>
                          <th className="px-4 py-2 text-right">Horas</th>
                          <th className="px-4 py-2 text-right">Dias</th>
                          <th className="px-4 py-2 text-right">Valor (R$)</th>
                          <th className="px-4 py-2 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stages.map((stage, index) => (
                          <tr key={stage.id} className="border-t">
                            <td className="px-4 py-3 font-medium">{stage.name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px]">
                              {stage.description ? (
                                <div className="truncate" title={stage.description}>
                                  {stage.description}
                                </div>
                              ) : (
                                <span className="italic text-red-500">Sem descrição</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">{stage.hours}h</td>
                            <td className="px-4 py-3 text-right">{stage.days} dias</td>
                            <td className="px-4 py-3 text-right">R${stage.value.toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditStage(stage)}
                                  title="Editar etapa"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDescriptionDialog(index)}
                                  title={stage.description ? "Editar descrição" : "Adicionar descrição"}
                                >
                                  <AlignLeft 
                                    className={`h-4 w-4 ${stage.description ? 'text-green-500' : 'text-red-500'}`} 
                                  />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  title="Anexar arquivo"
                                >
                                  <label htmlFor={`file-upload-${index}`} className="cursor-pointer">
                                    <FileUp 
                                      className={`h-4 w-4 ${stage.attachment ? 'text-green-500' : 'text-red-500'}`} 
                                    />
                                    <input
                                      id={`file-upload-${index}`}
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(index, e.target.files)}
                                      disabled={fileUploading}
                                    />
                                  </label>
                                </Button>
                                {stage.attachment && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenFilePreview(stage.attachment, stage.attachmentName || 'arquivo')}
                                    title="Visualizar anexo"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveStage(stage.id)}
                                  title="Remover etapa"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50 font-medium">
                          <td className="px-4 py-2">Total</td>
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 text-right">{currentTotalStageHours}h / {totalHours}h</td>
                          <td className="px-4 py-2 text-right">{stages.reduce((sum, stage) => sum + (stage.days || 0), 0)} dias</td>
                          <td className="px-4 py-2 text-right">
                            R${stages.reduce((sum, stage) => sum + stage.value, 0).toFixed(2)}
                          </td>
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
            <Button type="submit">{service ? 'Atualizar' : 'Cadastrar'}</Button>
          </CardFooter>
        </form>
      </Form>
      
      {/* Description dialog */}
      <Dialog open={descriptionDialogOpen} onOpenChange={setDescriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descrição da Etapa</DialogTitle>
            <DialogDescription>
              Adicione ou edite a descrição detalhada desta etapa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Digite uma descrição detalhada para esta etapa..."
              className="min-h-[150px]"
              value={currentDescription}
              onChange={(e) => setCurrentDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDescriptionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSaveDescription}>
              Salvar Descrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={filePreviewDialogOpen} onOpenChange={setFilePreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Visualização do Arquivo</DialogTitle>
            <DialogDescription>
              {currentFilePreview?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="border rounded p-4 text-center">
              {currentFilePreview && (
                <div className="max-h-[500px] overflow-auto">
                  {currentFilePreview.url && (
                    /* Handle different file types */
                    currentFilePreview.name.toLowerCase().endsWith('.pdf') ? (
                      <iframe 
                        src={currentFilePreview.url} 
                        className="w-full h-[400px]" 
                        title={currentFilePreview.name}
                      />
                    ) : currentFilePreview.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) ? (
                      <img 
                        src={currentFilePreview.url} 
                        alt={currentFilePreview.name}
                        className="max-w-full" 
                      />
                    ) : (
                      <div className="text-center p-4">
                        <p>Visualização não disponível para este tipo de arquivo</p>
                        <Button 
                          type="button" 
                          onClick={() => {
                            // Create a download link for the file
                            const link = document.createElement('a');
                            link.href = currentFilePreview.url;
                            link.download = currentFilePreview.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="mt-2"
                        >
                          Download
                        </Button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setFilePreviewDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
