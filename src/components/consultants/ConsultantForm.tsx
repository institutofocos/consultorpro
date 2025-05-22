
import React from 'react';
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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'Email inválido' }),
  hoursPerMonth: z.coerce.number().min(1, { message: 'Horas devem ser maior que 0' }),
  phone: z.string().optional(),
  specialization: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ConsultantFormProps {
  consultant?: any;
  onSave: (data: FormValues) => void;
  onCancel: () => void;
}

export const ConsultantForm: React.FC<ConsultantFormProps> = ({ consultant, onSave, onCancel }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: consultant ? {
      name: consultant.name,
      email: consultant.email,
      hoursPerMonth: consultant.hoursPerMonth,
      phone: consultant.phone || '',
      specialization: consultant.specialization || '',
    } : {
      name: '',
      email: '',
      hoursPerMonth: 160,
      phone: '',
      specialization: '',
    }
  });
  
  const onSubmit = (data: FormValues) => {
    onSave(data);
  };
  
  return (
    <Card className="shadow-card animate-slide-in">
      <CardHeader>
        <CardTitle>{consultant ? 'Editar Consultor' : 'Adicionar Consultor'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hoursPerMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária Mensal (horas)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="160" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialização</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Área de especialização" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
