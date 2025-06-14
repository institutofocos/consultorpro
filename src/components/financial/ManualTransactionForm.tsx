
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { 
  ManualTransaction, 
  TransactionCategory, 
  TransactionSubcategory, 
  PaymentMethod,
  fetchTransactionCategories,
  fetchTransactionSubcategories,
  fetchPaymentMethods
} from '@/integrations/supabase/financial';

interface Client {
  id: string;
  name: string;
}

interface Consultant {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface ManualTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  transaction?: ManualTransaction;
  clients: Client[];
  consultants: Consultant[];
  projects: Project[];
  tags: Tag[];
}

const formSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(3, { message: 'Descrição é obrigatória' }),
  amount: z.coerce.number().min(0.01, { message: 'Valor deve ser maior que zero' }),
  due_date: z.date(),
  payment_date: z.date().optional().nullable(),
  status: z.enum(['pending', 'paid', 'received', 'canceled']),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['monthly', 'quarterly', 'yearly']).optional().nullable(),
  client_id: z.string().optional().nullable(),
  consultant_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  tag_id: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  subcategory_id: z.string().optional().nullable(),
  payment_method_id: z.string().optional().nullable(),
  installments: z.coerce.number().min(1).max(60).optional().nullable(),
  is_fixed_expense: z.boolean().default(false),
  receipt_url: z.string().optional().nullable(),
});

const ManualTransactionForm: React.FC<ManualTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  clients,
  consultants,
  projects,
  tags,
}) => {
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [subcategories, setSubcategories] = useState<TransactionSubcategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction?.type || 'expense',
      description: transaction?.description || '',
      amount: transaction?.amount || 0,
      due_date: transaction?.due_date ? new Date(transaction.due_date) : new Date(),
      payment_date: transaction?.payment_date ? new Date(transaction.payment_date) : null,
      status: transaction?.status || 'pending',
      is_recurring: transaction?.is_recurring || false,
      recurrence_interval: transaction?.recurrence_interval || null,
      client_id: transaction?.client_id || null,
      consultant_id: transaction?.consultant_id || null,
      project_id: transaction?.project_id || null,
      tag_id: transaction?.tag_id || null,
      category_id: transaction?.category_id || null,
      subcategory_id: transaction?.subcategory_id || null,
      payment_method_id: transaction?.payment_method_id || null,
      installments: transaction?.installments || 1,
      is_fixed_expense: transaction?.is_fixed_expense || false,
      receipt_url: transaction?.receipt_url || null,
    },
  });

  const isEditing = !!transaction;
  const transactionType = form.watch('type');
  const isRecurring = form.watch('is_recurring');
  const selectedCategoryId = form.watch('category_id');
  const installments = form.watch('installments');

  // Carregar dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      const [categoriesData, paymentMethodsData] = await Promise.all([
        fetchTransactionCategories(),
        fetchPaymentMethods()
      ]);
      
      setCategories(categoriesData);
      setPaymentMethods(paymentMethodsData);
    };
    
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  // Atualizar categorias quando o tipo muda
  useEffect(() => {
    const loadCategories = async () => {
      const data = await fetchTransactionCategories(transactionType);
      setCategories(data);
      
      // Reset category and subcategory when type changes
      if (!isEditing) {
        form.setValue('category_id', null);
        form.setValue('subcategory_id', null);
      }
    };
    
    loadCategories();
  }, [transactionType, form, isEditing]);

  // Atualizar subcategorias quando a categoria muda
  useEffect(() => {
    const loadSubcategories = async () => {
      if (selectedCategoryId) {
        const data = await fetchTransactionSubcategories(selectedCategoryId);
        setSubcategories(data);
      } else {
        setSubcategories([]);
        form.setValue('subcategory_id', null);
      }
    };
    
    loadSubcategories();
  }, [selectedCategoryId, form]);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes da transação abaixo'
              : 'Preencha os detalhes para adicionar uma nova transação'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">💰 Receita</SelectItem>
                          <SelectItem value="expense">💸 Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0,00" 
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a transação" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Seção: Categorização */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Categorização</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.icon} {category.name}
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
                  name="subcategory_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subcategoria</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                        disabled={!selectedCategoryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Seção: Pagamento */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Detalhes do Pagamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="payment_method_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.id} value={method.id}>
                              {method.icon} {method.name}
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
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          max="60"
                          placeholder="1" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">⏳ Pendente</SelectItem>
                          {transactionType === 'income' ? (
                            <SelectItem value="received">✅ Recebido</SelectItem>
                          ) : (
                            <SelectItem value="paid">✅ Pago</SelectItem>
                          )}
                          <SelectItem value="canceled">❌ Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Seção: Datas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Datas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Vencimento</FormLabel>
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
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de {transactionType === 'income' ? 'Recebimento' : 'Pagamento'}</FormLabel>
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
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Seção: Opções Avançadas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Opções Avançadas</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-6">
                  <FormField
                    control={form.control}
                    name="is_recurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                        <div className="space-y-0.5">
                          <FormLabel>Transação Recorrente</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  {transactionType === 'expense' && (
                    <FormField
                      control={form.control}
                      name="is_fixed_expense"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 flex-1">
                          <div className="space-y-0.5">
                            <FormLabel>Despesa Fixa</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="recurrence_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">📅 Mensal</SelectItem>
                            <SelectItem value="quarterly">📊 Trimestral</SelectItem>
                            <SelectItem value="yearly">🗓️ Anual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>
            
            {/* Seção: Vínculos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Vínculos (Opcional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="consultant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultor</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o consultor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {consultants.map((consultant) => (
                            <SelectItem key={consultant.id} value={consultant.id}>{consultant.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Projeto</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o projeto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tag_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a tag" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhuma</SelectItem>
                          {tags.map((tag) => (
                            <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Seção: Comprovante */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">Comprovante</h3>
              
              <FormField
                control={form.control}
                name="receipt_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Comprovante</FormLabel>
                    <FormControl>
                      <div className="flex space-x-2">
                        <Input 
                          placeholder="https://exemplo.com/comprovante.pdf" 
                          {...field} 
                          value={field.value || ''}
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Resumo */}
            {installments && installments > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📊 Resumo do Parcelamento</h4>
                <p className="text-sm text-blue-700">
                  Será criada {installments}x de R$ {(form.watch('amount') / installments).toFixed(2)} cada
                </p>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {isEditing ? '💾 Atualizar' : '➕ Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualTransactionForm;
