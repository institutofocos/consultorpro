
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const demandSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  client_id: z.string().optional(),
  consultant_id: z.string().optional(),
  project_id: z.string().optional(),
});

type DemandFormData = z.infer<typeof demandSchema>;

interface DemandFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DemandForm: React.FC<DemandFormProps> = ({ onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DemandFormData>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      client_id: '',
      consultant_id: '',
      project_id: ''
    }
  });

  // Fetch clients
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch consultants
  const { data: consultants = [] } = useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consultants')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const onSubmit = async (data: DemandFormData) => {
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('demands')
        .insert({
          title: data.title,
          description: data.description || null,
          priority: data.priority,
          client_id: data.client_id || null,
          consultant_id: data.consultant_id || null,
          project_id: data.project_id || null,
          created_by: (await supabase.auth.getUser()).data.user?.id || ''
        });

      if (error) {
        throw error;
      }

      toast.success('Demanda criada com sucesso!');
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao criar demanda:', error);
      toast.error(error.message || 'Erro ao criar demanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Demanda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Digite o título da demanda"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Descreva a demanda..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={form.watch('priority')}
              onValueChange={(value) => form.setValue('priority', value as 'low' | 'medium' | 'high')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="client_id">Cliente</Label>
            <Select
              value={form.watch('client_id')}
              onValueChange={(value) => form.setValue('client_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum cliente</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="consultant_id">Consultor</Label>
            <Select
              value={form.watch('consultant_id')}
              onValueChange={(value) => form.setValue('consultant_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um consultor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum consultor</SelectItem>
                {consultants.map(consultant => (
                  <SelectItem key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="project_id">Projeto</Label>
            <Select
              value={form.watch('project_id')}
              onValueChange={(value) => form.setValue('project_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um projeto (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum projeto</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Demanda'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DemandForm;
