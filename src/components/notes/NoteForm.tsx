
import React, { useState, useEffect } from 'react';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Note, NoteCustomField, NoteTag } from "@/integrations/supabase/notes";
import { fetchConsultants, Consultant } from "@/integrations/supabase/consultants";
import { fetchClients } from "@/integrations/supabase/clients";
import { fetchServices } from "@/integrations/supabase/services";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  content: z.string().optional(),
  status: z.enum(['a_fazer', 'em_producao', 'finalizado', 'cancelado']),
  color: z.string().optional(),
  due_date: z.date().optional().nullable(),
  consultant_id: z.string().optional().nullable(),
  client_id: z.string().optional().nullable(),
  service_id: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_COLORS = [
  "#f44336", // Vermelho
  "#e91e63", // Rosa
  "#9c27b0", // Roxo
  "#673ab7", // Roxo escuro
  "#3f51b5", // Índigo
  "#2196f3", // Azul
  "#03a9f4", // Azul claro
  "#00bcd4", // Ciano
  "#009688", // Verde
  "#4caf50", // Verde claro
  "#8bc34a", // Verde limão
  "#cddc39", // Lima
  "#ffeb3b", // Amarelo
  "#ffc107", // Âmbar
  "#ff9800", // Laranja
  "#ff5722", // Laranja escuro
];

interface NoteFormProps {
  initialData?: Note;
  onSave: (note: any) => Promise<void>;
  onClose?: () => void;
}

const NoteForm: React.FC<NoteFormProps> = ({ initialData, onSave, onClose }) => {
  const [open, setOpen] = useState(false);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [tags, setTags] = useState<NoteTag[]>(initialData?.tags || []);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(DEFAULT_COLORS[0]);
  const [customFields, setCustomFields] = useState<NoteCustomField[]>(initialData?.custom_fields || []);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  // Carrega os dados relacionados
  useEffect(() => {
    const loadRelatedData = async () => {
      const [consultantsData, clientsData, servicesData] = await Promise.all([
        fetchConsultants(),
        fetchClients(),
        fetchServices(),
      ]);
      
      setConsultants(consultantsData);
      setClients(clientsData);
      setServices(servicesData);
    };
    
    loadRelatedData();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      status: initialData?.status || "a_fazer",
      color: initialData?.color || DEFAULT_COLORS[0],
      due_date: initialData?.due_date ? new Date(initialData.due_date) : null,
      consultant_id: initialData?.consultant_id || null,
      client_id: initialData?.client_id || null,
      service_id: initialData?.service_id || null,
    },
  });

  // Manipulação de tags
  const addTag = () => {
    if (newTagName.trim()) {
      const newTag: NoteTag = {
        id: `temp-${Date.now()}`, // Será substituído pelo ID real
        note_id: initialData?.id || "",
        name: newTagName,
        color: newTagColor,
      };
      setTags([...tags, newTag]);
      setNewTagName("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  // Manipulação de campos personalizados
  const addCustomField = () => {
    if (newFieldName.trim()) {
      const newField: NoteCustomField = {
        id: `temp-${Date.now()}`, // Será substituído pelo ID real
        note_id: initialData?.id || "",
        field_name: newFieldName,
        field_value: newFieldValue,
      };
      setCustomFields([...customFields, newField]);
      setNewFieldName("");
      setNewFieldValue("");
    }
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      // Combinar dados do formulário com tags e campos personalizados
      const noteData = {
        ...values,
        tags,
        custom_fields: customFields,
      };

      await onSave(noteData);
      setOpen(false);
      if (onClose) onClose();
      toast.success(initialData ? "Anotação atualizada com sucesso!" : "Anotação criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar anotação.");
      console.error("Erro ao salvar anotação:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initialData ? (
          <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
            Editar
          </Button>
        ) : (
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Nova Anotação
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Anotação" : "Nova Anotação"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título da anotação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conteúdo da anotação" 
                      rows={4}
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="a_fazer">A fazer</SelectItem>
                        <SelectItem value="em_producao">Em produção</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-8 gap-1">
                        {DEFAULT_COLORS.map((color) => (
                          <div 
                            key={color}
                            className={cn("w-6 h-6 rounded-full cursor-pointer border-2", {
                              "border-black": field.value === color,
                              "border-transparent": field.value !== color,
                            })}
                            style={{ backgroundColor: color }}
                            onClick={() => form.setValue("color", color)}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Entrega</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value || undefined}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="consultant_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultor</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um consultor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {consultants.map((consultant) => (
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
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {clients.map((client) => (
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
                name="service_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serviço</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {services.map((service) => (
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

            {/* Seção de etiquetas */}
            <div>
              <FormLabel>Etiquetas</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    style={{ backgroundColor: tag.color }}
                    className="px-2 py-1 text-white flex items-center gap-1"
                  >
                    {tag.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Nome da etiqueta"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-grow"
                />
                <Select value={newTagColor} onValueChange={setNewTagColor}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_COLORS.map((color) => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2" 
                            style={{ backgroundColor: color }} 
                          />
                          <span>Cor</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seção de campos personalizados */}
            <div>
              <FormLabel>Campos Personalizados</FormLabel>
              <div className="space-y-2 mb-2">
                {customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{field.field_name}</div>
                      <div className="text-sm text-gray-600">{field.field_value}</div>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCustomField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2 mb-1">
                <Input
                  placeholder="Nome do campo"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="flex-grow"
                />
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Valor do campo"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  className="flex-grow"
                />
                <Button type="button" variant="outline" onClick={addCustomField}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => {
                setOpen(false);
                if (onClose) onClose();
              }}>
                Cancelar
              </Button>
              <Button type="submit">
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NoteForm;
