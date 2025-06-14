
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
import { CalendarIcon, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import FrequencySelector, { FrequencyType, RecurringInterval } from './FrequencySelector';
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
  category_id: z.string().min(1, { message: 'Categoria é obrigatória' }),
  subcategory_id: z.string().optional().nullable(),
  payment_method_id: z.string().optional().nullable(),
  is_fixed_expense: z.boolean().default(false),
  client_id: z.string().optional().nullable(),
  consultant_id: z.string().optional().nullable(),
  project_id: z.string().optional().nullable(),
  tag_id: z.string().optional().nullable(),
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
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  // Estados para frequência
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('unique');
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
  const [installments, setInstallments] = useState(2);
  const [recurringTimes, setRecurringTimes] = useState(12);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: transaction?.type || 'expense',
      description: transaction?.description || '',
      amount: transaction?.amount || 0,
      due_date: transaction?.due_date ? new Date(transaction.due_date) : new Date(),
      payment_date: transaction?.payment_date ? new Date(transaction.payment_date) : null,
      status: transaction?.status || 'pending',
      category_id: transaction?.category_id || '',
      subcategory_id: transaction?.subcategory_id || null,
      payment_method_id: transaction?.payment_method_id || null,
      is_fixed_expense: transaction?.is_fixed_expense || false,
      client_id: transaction?.client_id || null,
      consultant_id: transaction?.consultant_id || null,
      project_id: transaction?.project_id || null,
      tag_id: transaction?.tag_id || null,
      receipt_url: transaction?.receipt_url || null,
    },
  });

  const isEditing = !!transaction;
  const transactionType = form.watch('type');
  const selectedCategoryId = form.watch('category_id');
  const currentAmount = form.watch('amount');
  const isFixedExpense = form.watch('is_fixed_expense');

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
      
      if (!isEditing) {
        form.setValue('category_id', '');
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
    // Validação personalizada
    if (data.amount <= 0) {
      form.setError('amount', { message: 'Valor deve ser maior que zero' });
      return;
    }

    if (!data.category_id) {
      form.setError('category_id', { message: 'Por favor, selecione uma categoria' });
      return;
    }

    // Preparar dados incluindo informações de frequência
    const submissionData = {
      ...data,
      frequency_info: {
        type: frequencyType,
        recurring_interval: recurringInterval,
        installments: installments,
        recurring_times: recurringTimes,
      }
    };

    await onSubmit(submissionData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[95vh] overflow-y-auto" size="full">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? '✏️ Editar Transação' : '➕ Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize os detalhes da transação abaixo'
              : 'Preencha os detalhes para adicionar uma nova transação'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Seção: Informações Essenciais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna 1: Valor, Descrição, Categoria */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">Tipo</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="income">
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600">💰</span>
                                <span>Receita</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="expense">
                              <div className="flex items-center space-x-2">
                                <span className="text-red-600">💸</span>
                                <span>Despesa</span>
                              </div>
                            </SelectItem>
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
                      <FormItem className="flex-1">
                        <FormLabel className="font-medium">Valor (R$)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0,00" 
                            className="h-11 text-lg font-medium"
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
                      <FormLabel className="font-medium">Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva a transação" 
                          className="min-h-[80px] resize-none"
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
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Categoria *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{category.icon}</span>
                                  <span>{category.name}</span>
                                </div>
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
                        <FormLabel className="font-medium">Subcategoria</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                          disabled={!selectedCategoryId}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Subcategoria" />
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

                {/* Tags visuais */}
                <div className="flex flex-wrap gap-2">
                  {isFixedExpense && transactionType === 'expense' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      📌 Despesa Fixa
                    </Badge>
                  )}
                  {frequencyType !== 'unique' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      🔄 Recorrente
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Coluna 2: Data, Frequência, Pagamento */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="font-medium">Data de Vencimento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full h-11 pl-3 text-left font-normal",
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
                
                {/* Seletor de Frequência */}
                <div className="space-y-2">
                  <FormLabel className="font-medium">Frequência</FormLabel>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <FrequencySelector
                      frequencyType={frequencyType}
                      onFrequencyTypeChange={setFrequencyType}
                      recurringInterval={recurringInterval}
                      onRecurringIntervalChange={setRecurringInterval}
                      installments={installments}
                      onInstallmentsChange={setInstallments}
                      recurringTimes={recurringTimes}
                      onRecurringTimesChange={setRecurringTimes}
                      amount={currentAmount}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_method_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Forma de Pagamento</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhuma</SelectItem>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{method.icon}</span>
                                  <span>{method.name}</span>
                                </div>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Status</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Status" />
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

                {/* Switch para Despesa Fixa */}
                {transactionType === 'expense' && (
                  <FormField
                    control={form.control}
                    name="is_fixed_expense"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-white">
                        <div className="space-y-0.5">
                          <FormLabel className="font-medium">📌 Despesa Fixa</FormLabel>
                          <div className="text-sm text-gray-600">
                            Marque se é uma despesa recorrente mensal
                          </div>
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
            </div>
            
            {/* Seção: Mais Detalhes (Recolhível) */}
            <Collapsible open={showMoreDetails} onOpenChange={setShowMoreDetails}>
              <CollapsibleTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full justify-between"
                >
                  <span>🔧 Mais detalhes</span>
                  {showMoreDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                {/* Data de Pagamento */}
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
                
                {/* Vínculos */}
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                {/* Comprovante */}
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
              </CollapsibleContent>
            </Collapsible>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {isEditing ? '💾 Atualizar Transação' : '➕ Criar Transação'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualTransactionForm;
