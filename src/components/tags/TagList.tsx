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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash, Tag, Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome da tag deve ter pelo menos 2 caracteres' })
});

type FormValues = z.infer<typeof formSchema>;

const TagList: React.FC = () => {
  const [editingTag, setEditingTag] = useState<{id: string, name: string} | null>(null);
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    }
  });
  
  // Fetch tags with React Query
  const { 
    data: tags = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      console.log('Buscando tags...');
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Erro ao buscar tags:', error);
        throw error;
      }
      
      console.log('Tags encontradas:', data?.length || 0);
      return data || [];
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      console.log('Criando tag:', name);
      
      const { data, error } = await supabase
        .from('tags')
        .insert([{ name: name.trim() }])
        .select()
        .single();
          
      if (error) {
        console.error('Erro ao criar tag:', error);
        throw error;
      }
      
      console.log('Tag criada:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" adicionada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      form.reset();
    },
    onError: (error: any) => {
      console.error('Erro na criação da tag:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma tag com este nome');
      } else {
        toast.error('Erro ao adicionar tag: ' + error.message);
      }
    }
  });

  // Update tag mutation
  const updateTagMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      console.log('Atualizando tag:', id, name);
      
      const { data, error } = await supabase
        .from('tags')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single();
          
      if (error) {
        console.error('Erro ao atualizar tag:', error);
        throw error;
      }
      
      console.log('Tag atualizada:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Tag "${data.name}" atualizada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setEditingTag(null);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Erro na atualização da tag:', error);
      if (error.code === '23505') {
        toast.error('Já existe uma tag com este nome');
      } else {
        toast.error('Erro ao atualizar tag: ' + error.message);
      }
    }
  });

  // Delete tag mutation - REMOVIDA A CONFIRMAÇÃO
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deletando tag com ID:', id);
      
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Erro ao deletar tag:', error);
        throw error;
      }
      
      console.log('Tag deletada com sucesso');
    },
    onSuccess: () => {
      toast.success('Tag removida com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      console.error('Erro na deleção da tag:', error);
      toast.error('Erro ao remover tag: ' + error.message);
    }
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, name: data.name });
    } else {
      createTagMutation.mutate(data.name);
    }
  };
  
  // Edit handler
  const handleEditTag = (tag: {id: string, name: string}) => {
    setEditingTag(tag);
    form.setValue('name', tag.name);
  };
  
  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditingTag(null);
    form.reset();
  };
  
  // Delete handler - REMOVIDA A CONFIRMAÇÃO
  const handleDeleteTag = (id: string, tagName: string) => {
    console.log('Iniciando deleção da tag:', tagName);
    deleteTagMutation.mutate(id);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">Gerenciamento de tags para serviços</p>
        </div>
        <div className="flex justify-center py-8">
          <p>Carregando tags...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">Gerenciamento de tags para serviços</p>
        </div>
        <div className="flex justify-center py-8">
          <p className="text-red-500">Erro ao carregar tags: {error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="text-muted-foreground">Gerenciamento de tags para serviços</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              {editingTag ? 'Editar Tag' : 'Adicionar Tag'}
              {editingTag && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleCancelEdit}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tag</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Consultoria" 
                          {...field} 
                          disabled={createTagMutation.isPending || updateTagMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createTagMutation.isPending || updateTagMutation.isPending}
                >
                  {editingTag ? (
                    <>
                      <Pencil className="mr-2 h-4 w-4" /> 
                      {updateTagMutation.isPending ? 'Atualizando...' : 'Atualizar Tag'}
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" /> 
                      {createTagMutation.isPending ? 'Adicionando...' : 'Adicionar Tag'}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="shadow-card md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Lista de Tags ({tags.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id} className={editingTag?.id === tag.id ? 'bg-muted/50' : ''}>
                      <TableCell className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-blue-500" />
                        {tag.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditTag(tag)}
                            disabled={deleteTagMutation.isPending}
                            title="Editar tag"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteTag(tag.id, tag.name)}
                            disabled={deleteTagMutation.isPending}
                            title="Deletar tag"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="h-8 w-8 text-muted-foreground/50" />
                        <p>Nenhuma tag encontrada</p>
                        <p className="text-sm">Adicione a primeira tag usando o formulário ao lado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TagList;
