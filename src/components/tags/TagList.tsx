
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
import { Trash, Tag, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome da tag deve ter pelo menos 2 caracteres' })
});

type FormValues = z.infer<typeof formSchema>;

const TagList: React.FC = () => {
  const [tags, setTags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase
        .from('tags')
        .insert([{ name: data.name }]);
        
      if (error) throw error;
      
      toast.success('Tag adicionada com sucesso!');
      form.reset();
      fetchTags();
    } catch (error: any) {
      toast.error('Erro ao adicionar tag: ' + error.message);
    }
  };
  
  const handleDeleteTag = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success('Tag removida com sucesso!');
      fetchTags();
    } catch (error: any) {
      toast.error('Erro ao remover tag: ' + error.message);
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
            <CardTitle>Adicionar Tag</CardTitle>
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
                
                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Tag
                </Button>
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTag(tag.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
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
