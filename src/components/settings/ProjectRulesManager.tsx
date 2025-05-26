
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectStatus {
  id: string;
  name: string;
  display_name: string;
  color: string;
  is_completion_status: boolean;
  is_cancellation_status: boolean;
  is_active: boolean;
  order_index: number;
}

const statusSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").regex(/^[a-z_]+$/, "Use apenas letras minúsculas e underscore"),
  display_name: z.string().min(1, "Nome de exibição é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
  is_completion_status: z.boolean(),
  is_cancellation_status: z.boolean(),
  is_active: z.boolean(),
});

type StatusFormData = z.infer<typeof statusSchema>;

const ProjectRulesManager: React.FC = () => {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ProjectStatus | null>(null);

  const form = useForm<StatusFormData>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: '',
      display_name: '',
      color: '#3b82f6',
      is_completion_status: false,
      is_cancellation_status: false,
      is_active: true,
    },
  });

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('project_status_settings')
        .select('*')
        .order('order_index');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      toast.error('Erro ao carregar status dos projetos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const onSubmit = async (data: StatusFormData) => {
    try {
      if (editingStatus) {
        // Atualizar status existente
        const { error } = await supabase
          .from('project_status_settings')
          .update(data)
          .eq('id', editingStatus.id);

        if (error) throw error;
        toast.success('Status atualizado com sucesso!');
      } else {
        // Criar novo status
        const maxOrder = Math.max(...statuses.map(s => s.order_index), 0);
        const { error } = await supabase
          .from('project_status_settings')
          .insert({ ...data, order_index: maxOrder + 1 });

        if (error) throw error;
        toast.success('Status criado com sucesso!');
      }

      setIsDialogOpen(false);
      setEditingStatus(null);
      form.reset();
      fetchStatuses();
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      toast.error('Erro ao salvar status');
    }
  };

  const handleEdit = (status: ProjectStatus) => {
    setEditingStatus(status);
    form.reset({
      name: status.name,
      display_name: status.display_name,
      color: status.color,
      is_completion_status: status.is_completion_status,
      is_cancellation_status: status.is_cancellation_status,
      is_active: status.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este status?')) {
      try {
        const { error } = await supabase
          .from('project_status_settings')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Status excluído com sucesso!');
        fetchStatuses();
      } catch (error) {
        console.error('Erro ao excluir status:', error);
        toast.error('Erro ao excluir status');
      }
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('project_status_settings')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      toast.success('Status atualizado com sucesso!');
      fetchStatuses();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleNewStatus = () => {
    setEditingStatus(null);
    form.reset({
      name: '',
      display_name: '',
      color: '#3b82f6',
      is_completion_status: false,
      is_cancellation_status: false,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Regras de Projetos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure os status dos projetos e suas regras de negócio
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewStatus}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStatus ? 'Editar Status' : 'Novo Status'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome (identificador)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="ex: em_producao" 
                            {...field}
                            disabled={!!editingStatus}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de Exibição</FormLabel>
                        <FormControl>
                          <Input placeholder="ex: Em Produção" {...field} />
                        </FormControl>
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
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_completion_status"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Status de Conclusão</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_cancellation_status"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Status de Cancelamento</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>Status Ativo</FormLabel>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {editingStatus ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Nome de Exibição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Conclusão</TableHead>
                <TableHead>Cancelamento</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{status.name}</TableCell>
                  <TableCell>{status.display_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">{status.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {status.is_completion_status ? (
                      <span className="text-green-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-gray-400">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {status.is_cancellation_status ? (
                      <span className="text-red-600 font-medium">Sim</span>
                    ) : (
                      <span className="text-gray-400">Não</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={status.is_active}
                      onCheckedChange={() => toggleActive(status.id, status.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(status)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(status.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectRulesManager;
