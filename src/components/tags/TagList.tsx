
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trash, Tag, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome da tag deve ter pelo menos 2 caracteres' })
});

type FormValues = z.infer<typeof formSchema>;

const TagList: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<{id: string, name: string} | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    }
  });
  
  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setTags(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar tags: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTags();
  }, []);

  // Update form when editing tag changes
  useEffect(() => {
    if (editingTag) {
      form.setValue('name', editingTag.name);
    } else {
      form.reset();
    }
  }, [editingTag, form]);
  
  const onSubmit = async (data: FormValues) => {
    try {
      if (editingTag) {
        // Updating existing tag
        const { error } = await supabase
          .from('tags')
          .update({ name: data.name })
          .eq('id', editingTag.id);
          
        if (error) throw error;
        
        toast.success('Tag atualizada com sucesso!');
        // Atualizar a lista localmente para refletir a alteração
        setTags(tags.map(tag => 
          tag.id === editingTag.id ? { ...tag, name: data.name } : tag
        ));
      } else {
        // Creating new tag
        const { data: newTag, error } = await supabase
          .from('tags')
          .insert([{ name: data.name }])
          .select();
          
        if (error) throw error;
        
        toast.success('Tag adicionada com sucesso!');
        // Adicionar a nova tag à lista local
        if (newTag && newTag.length > 0) {
          setTags([...tags, newTag[0]]);
        }
      }
      
      form.reset();
      setEditingTag(null);
    } catch (error: any) {
      toast.error(`Erro ao ${editingTag ? 'atualizar' : 'adicionar'} tag: ` + error.message);
    }
  };
  
  const handleEditTag = (tag: {id: string, name: string}) => {
    setEditingTag(tag);
  };
  
  const handleCancelEdit = () => {
    setEditingTag(null);
    form.reset();
  };
  
  const handleDeleteTag = async (id: string) => {
    try {
      // First verify if the tag is being used in any service
      const { data: usedTags, error: checkError } = await supabase
        .from('service_tags')
        .select('*')
        .eq('tag_id', id);
        
      if (checkError) throw checkError;
      
      if (usedTags && usedTags.length > 0) {
        toast.error('Esta tag não pode ser removida pois está sendo usada em serviços');
        return;
      }
      
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Tag removida com sucesso!');
      // Atualizar lista de tags após exclusão (remove da lista local)
      setTags(tags.filter(tag => tag.id !== id));
    } catch (error: any) {
      toast.error('Erro ao remover tag: ' + error.message);
      console.error('Delete tag error details:', error);
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Tags</h1>
        <p className="text-muted-foreground">Gerenciamento de tags para serviços</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-card md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle>{editingTag ? 'Editar Tag' : 'Adicionar Tag'}</CardTitle>
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
                        <Input placeholder="Ex: Consultoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingTag ? (
                      <>
                        <Pencil className="mr-2 h-4 w-4" /> Atualizar Tag
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Tag
                      </>
                    )}
                  </Button>
                  
                  {editingTag && (
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card className="shadow-card md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Lista de Tags</CardTitle>
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
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : tags.length > 0 ? (
                  tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-blue-500" />
                        {tag.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditTag(tag)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                      Nenhuma tag encontrada
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
