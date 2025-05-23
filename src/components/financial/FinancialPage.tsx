
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  FinancialFilter, 
  fetchFinancialTransactions,
  updateTransactionStatus 
} from "@/integrations/supabase/financial";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { DollarSign, CalendarIcon, Filter, Check, X, RefreshCw } from "lucide-react";
import { fetchConsultants } from "@/integrations/supabase/consultants";
import { fetchServices } from "@/integrations/supabase/services";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Consultant = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  name: string;
};

const FinancialPage = () => {
  const [filters, setFilters] = useState<FinancialFilter>({
    status: ['pending'],
    timeframe: 'all',
  });
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const { data: transactions, isLoading: transactionsLoading, refetch } = useQuery({
    queryKey: ['financial-transactions', filters],
    queryFn: () => fetchFinancialTransactions(filters),
  });

  const { data: consultants, isLoading: consultantsLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: fetchServices,
  });

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    if (!transactions) return {
      totalExpected: 0,
      totalReceived: 0,
      totalPending: 0,
      totalConsultantPayments: 0
    };

    return transactions.reduce((acc, transaction) => {
      if (transaction.transaction_type === 'expected_income') {
        if (transaction.status === 'completed') {
          acc.totalReceived += transaction.amount;
        } else if (transaction.status === 'pending') {
          acc.totalPending += transaction.amount;
        }
        acc.totalExpected += transaction.amount;
      } else if (transaction.transaction_type === 'consultant_payment') {
        acc.totalConsultantPayments += transaction.amount;
      }
      return acc;
    }, {
      totalExpected: 0,
      totalReceived: 0,
      totalPending: 0,
      totalConsultantPayments: 0
    });
  }, [transactions]);

  const handleStatusChange = async (id: string, status: 'completed' | 'pending' | 'canceled') => {
    if (status === 'completed') {
      setSelectedTransaction(id);
      setIsMarkingPaid(true);
    } else {
      try {
        await updateTransactionStatus(id, status);
        toast.success("Status atualizado com sucesso");
        refetch();
      } catch (error) {
        toast.error("Erro ao atualizar status");
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTransaction) return;
    
    try {
      await updateTransactionStatus(
        selectedTransaction, 
        'completed',
        paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
      );
      toast.success("Pagamento registrado com sucesso");
      setIsMarkingPaid(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <p className="text-muted-foreground">Controle de receitas e pagamentos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Previsto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                formatCurrency(summary.totalExpected)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                formatCurrency(summary.totalReceived)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                formatCurrency(summary.totalPending)
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos a Consultores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transactionsLoading ? (
                <Skeleton className="h-8 w-full" />
              ) : (
                formatCurrency(summary.totalConsultantPayments)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" /> Filtros
          </CardTitle>
          <CardDescription>Filtre os dados financeiros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Status</label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant={filters.status?.includes('pending') ? "default" : "outline"}
                  onClick={() => setFilters(prev => {
                    const newStatus = prev.status?.includes('pending')
                      ? prev.status.filter(s => s !== 'pending')
                      : [...(prev.status || []), 'pending'];
                    return { ...prev, status: newStatus };
                  })}
                >
                  Pendentes
                </Button>
                <Button 
                  size="sm" 
                  variant={filters.status?.includes('completed') ? "default" : "outline"}
                  onClick={() => setFilters(prev => {
                    const newStatus = prev.status?.includes('completed')
                      ? prev.status.filter(s => s !== 'completed')
                      : [...(prev.status || []), 'completed'];
                    return { ...prev, status: newStatus };
                  })}
                >
                  Recebidos/Pagos
                </Button>
                <Button 
                  size="sm" 
                  variant={filters.status?.includes('canceled') ? "default" : "outline"}
                  onClick={() => setFilters(prev => {
                    const newStatus = prev.status?.includes('canceled')
                      ? prev.status.filter(s => s !== 'canceled')
                      : [...(prev.status || []), 'canceled'];
                    return { ...prev, status: newStatus };
                  })}
                >
                  Cancelados
                </Button>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Período</label>
              <Select
                value={filters.timeframe || 'all'}
                onValueChange={value => setFilters(prev => ({ ...prev, timeframe: value as any }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="this_week">Esta semana</SelectItem>
                  <SelectItem value="this_month">Este mês</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Consultor</label>
              <Select
                value={filters.consultantId || ''}
                onValueChange={value => setFilters(prev => ({ ...prev, consultantId: value || undefined }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os consultores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os consultores</SelectItem>
                  {!consultantsLoading && consultants?.map((consultant: Consultant) => (
                    <SelectItem key={consultant.id} value={consultant.id}>
                      {consultant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Serviço</label>
              <Select
                value={filters.serviceId || ''}
                onValueChange={value => setFilters(prev => ({ ...prev, serviceId: value || undefined }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os serviços" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os serviços</SelectItem>
                  {!servicesLoading && services?.map((service: Service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-auto flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  status: ['pending'],
                  timeframe: 'all',
                })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
          <CardDescription>
            Receitas e pagamentos previstos e realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Projeto/Cliente</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Consultor</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Valor Líquido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionsLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : transactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Nenhuma transação encontrada para os filtros selecionados
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map(transaction => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.due_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      {transaction.transaction_type === 'expected_income' 
                        ? <Badge className="bg-blue-100 text-blue-800 border-blue-300">Receita</Badge>
                        : transaction.transaction_type === 'consultant_payment'
                          ? <Badge className="bg-purple-100 text-purple-800 border-purple-300">Pagamento</Badge>
                          : transaction.transaction_type}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.project_name}</div>
                      <div className="text-sm text-muted-foreground">{transaction.client_name}</div>
                    </TableCell>
                    <TableCell>{transaction.stage_name}</TableCell>
                    <TableCell>{transaction.consultant_name || '-'}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.net_amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {transaction.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleStatusChange(transaction.id, 'completed')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleStatusChange(transaction.id, 'canceled')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {transaction.status === 'canceled' && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleStatusChange(transaction.id, 'pending')}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isMarkingPaid} onOpenChange={setIsMarkingPaid}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pagamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data do pagamento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, "PPP") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingPaid(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPayment}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialPage;
