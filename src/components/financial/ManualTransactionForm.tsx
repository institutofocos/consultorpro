
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import FrequencySelector, { FrequencyType, RecurringInterval } from './FrequencySelector';
import { fetchTransactionCategories, fetchTransactionSubcategories, fetchPaymentMethods } from '@/integrations/supabase/financial';

interface ManualTransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  transaction?: any;
  clients: any[];
  consultants: any[];
  projects: any[];
  tags: any[];
}

const ManualTransactionForm: React.FC<ManualTransactionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  clients,
  consultants,
  projects,
  tags
}) => {
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    description: '',
    amount: 0,
    due_date: new Date(),
    payment_date: null as Date | null,
    status: 'pending' as 'pending' | 'paid' | 'received' | 'canceled',
    client_id: '',
    consultant_id: '',
    project_id: '',
    tag_id: '',
    category_id: '',
    subcategory_id: '',
    payment_method_id: '',
    is_fixed_expense: false,
    receipt_url: ''
  });

  const [frequencyType, setFrequencyType] = useState<FrequencyType>('unique');
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
  const [installments, setInstallments] = useState(2);
  const [recurringTimes, setRecurringTimes] = useState(12);

  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadPaymentMethods();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.category_id) {
      loadSubcategories(formData.category_id);
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [formData.category_id]);

  const loadCategories = async () => {
    try {
      const data = await fetchTransactionCategories(formData.type);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    try {
      const data = await fetchTransactionSubcategories(categoryId);
      setSubcategories(data);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await fetchPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    }
  };

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type || 'income',
        description: transaction.description || '',
        amount: transaction.amount || 0,
        due_date: transaction.due_date ? new Date(transaction.due_date) : new Date(),
        payment_date: transaction.payment_date ? new Date(transaction.payment_date) : null,
        status: transaction.status || 'pending',
        client_id: transaction.client_id || '',
        consultant_id: transaction.consultant_id || '',
        project_id: transaction.project_id || '',
        tag_id: transaction.tag_id || '',
        category_id: transaction.category_id || '',
        subcategory_id: transaction.subcategory_id || '',
        payment_method_id: transaction.payment_method_id || '',
        is_fixed_expense: transaction.is_fixed_expense || false,
        receipt_url: transaction.receipt_url || ''
      });
      
      if (transaction.is_recurring) {
        setFrequencyType('recurring');
        setRecurringInterval(transaction.recurrence_interval || 'monthly');
        setRecurringTimes(transaction.installments || 12);
      } else if (transaction.installments && transaction.installments > 1) {
        setFrequencyType('installment');
        setInstallments(transaction.installments);
      }
    } else {
      // Reset form when creating new transaction
      setFormData({
        type: 'income',
        description: '',
        amount: 0,
        due_date: new Date(),
        payment_date: null,
        status: 'pending',
        client_id: '',
        consultant_id: '',
        project_id: '',
        tag_id: '',
        category_id: '',
        subcategory_id: '',
        payment_method_id: '',
        is_fixed_expense: false,
        receipt_url: ''
      });
      setFrequencyType('unique');
      setInstallments(2);
      setRecurringTimes(12);
    }
  }, [transaction, isOpen]);

  // Recarregar categorias quando o tipo mudar
  useEffect(() => {
    if (isOpen) {
      loadCategories();
      // Limpar categoria e subcategoria quando mudar o tipo
      setFormData(prev => ({ ...prev, category_id: '', subcategory_id: '' }));
    }
  }, [formData.type, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form data before processing:', formData);
    console.log('Frequency type:', frequencyType);
    
    // Função para converter string vazia em null para campos UUID
    const sanitizeUUID = (value: string) => {
      return value && value.trim() !== '' ? value : null;
    };

    // Preparar dados básicos da transação
    const transactionData = {
      type: formData.type,
      description: formData.description,
      amount: Number(formData.amount),
      due_date: formData.due_date,
      payment_date: formData.payment_date,
      status: formData.status,
      client_id: sanitizeUUID(formData.client_id),
      consultant_id: sanitizeUUID(formData.consultant_id),
      project_id: sanitizeUUID(formData.project_id),
      tag_id: sanitizeUUID(formData.tag_id),
      category_id: sanitizeUUID(formData.category_id),
      subcategory_id: sanitizeUUID(formData.subcategory_id),
      payment_method_id: sanitizeUUID(formData.payment_method_id),
      is_fixed_expense: formData.is_fixed_expense,
      receipt_url: formData.receipt_url || null,
      // Campos específicos para frequência
      is_recurring: frequencyType === 'recurring',
      recurrence_interval: frequencyType === 'recurring' ? recurringInterval : null,
      installments: frequencyType === 'installment' ? installments : (frequencyType === 'recurring' ? recurringTimes : 1),
      current_installment: 1
    };

    console.log('Transaction data to submit:', transactionData);
    
    onSubmit(transactionData);
  };

  const handleClose = () => {
    setFormData({
      type: 'income',
      description: '',
      amount: 0,
      due_date: new Date(),
      payment_date: null,
      status: 'pending',
      client_id: '',
      consultant_id: '',
      project_id: '',
      tag_id: '',
      category_id: '',
      subcategory_id: '',
      payment_method_id: '',
      is_fixed_expense: false,
      receipt_url: ''
    });
    setFrequencyType('unique');
    setInstallments(2);
    setRecurringTimes(12);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Primeira linha: Tipo, Valor e Data de Vencimento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="income" id="income" />
                  <Label htmlFor="income" className="text-sm">Receita</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="expense" id="expense" />
                  <Label htmlFor="expense" className="text-sm">Despesa</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? (
                      format(formData.due_date, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => date && setFormData(prev => ({ ...prev, due_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva a transação..."
              required
              className="min-h-[80px]"
            />
          </div>

          {/* Categoria e Subcategoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Select 
                value={formData.subcategory_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subcategory_id: value }))}
                disabled={!formData.category_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a subcategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma subcategoria</SelectItem>
                  {subcategories.map((subcategory) => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Frequência</Label>
            <FrequencySelector
              frequencyType={frequencyType}
              onFrequencyTypeChange={setFrequencyType}
              recurringInterval={recurringInterval}
              onRecurringIntervalChange={setRecurringInterval}
              installments={installments}
              onInstallmentsChange={setInstallments}
              recurringTimes={recurringTimes}
              onRecurringTimesChange={setRecurringTimes}
              amount={formData.amount}
            />
          </div>

          {/* Status, Data de Pagamento e Forma de Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'paid' | 'received' | 'canceled') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {formData.type === 'income' ? (
                    <>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="received">Recebido</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Data de Pagamento (condicional) */}
            {(formData.status === 'paid' || formData.status === 'received') && (
              <div className="space-y-2">
                <Label>Data de Pagamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.payment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.payment_date ? (
                        format(formData.payment_date, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecionar data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.payment_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, payment_date: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select 
                value={formData.payment_method_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma forma</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.icon && <span className="mr-2">{method.icon}</span>}
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cliente (se receita), Consultor e Projeto */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formData.type === 'income' && (
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select 
                  value={formData.client_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Consultor</Label>
              <Select 
                value={formData.consultant_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, consultant_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum consultor</SelectItem>
                  {consultants.map((consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select 
                value={formData.project_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum projeto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tag e URL do Comprovante */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tag</Label>
              <Select 
                value={formData.tag_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, tag_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma tag</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_url">URL do Comprovante</Label>
              <Input
                id="receipt_url"
                type="url"
                value={formData.receipt_url}
                onChange={(e) => setFormData(prev => ({ ...prev, receipt_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {transaction ? 'Atualizar' : 'Criar'} Transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManualTransactionForm;
