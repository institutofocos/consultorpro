
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AccountsPayable, AccountsReceivable, updateAccountsReceivableStatus, updateAccountsPayableStatus } from '@/integrations/supabase/financial';
import { CalendarIcon, CheckCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import MonthNavigation from "./MonthNavigation";

interface AccountsPayableReceivableProps {
  payables: {
    data: AccountsPayable[] | null;
    isLoading: boolean;
  };
  receivables: {
    data: AccountsReceivable[] | null;
    isLoading: boolean;
  };
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const AccountsPayableReceivable: React.FC<AccountsPayableReceivableProps> = ({ 
  payables, 
  receivables, 
  currentMonth, 
  onMonthChange 
}) => {
  const queryClient = useQueryClient();
  const [selectedReceivable, setSelectedReceivable] = useState<string | null>(null);
  const [selectedPayable, setSelectedPayable] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [isMarkingReceived, setIsMarkingReceived] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string, type: 'payable' | 'receivable') => {
    switch(status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Pago</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Recebido</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStageStatusBadge = (status?: string) => {
    if (!status) return null;
    
    const statusMap: Record<string, { label: string; className: string }> = {
      'iniciar_projeto': { label: 'Iniciar Projeto', className: 'bg-blue-100 text-blue-800' },
      'em_producao': { label: 'Em Produção', className: 'bg-orange-100 text-orange-800' },
      'aguardando_aprovacao': { label: 'Aguardando Aprovação', className: 'bg-yellow-100 text-yellow-800' },
      'aguardando_assinatura': { label: 'Aguardando Assinatura', className: 'bg-purple-100 text-purple-800' },
      'concluido': { label: 'Concluído', className: 'bg-green-100 text-green-800' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    
    return (
      <Badge variant="outline" className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const updateReceivableStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'pending' | 'received' | 'canceled', paymentDate?: string }) => 
      updateAccountsReceivableStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const updatePayableStatusMutation = useMutation({
    mutationFn: ({ id, status, paymentDate }: { id: string, status: 'pending' | 'paid' | 'canceled', paymentDate?: string }) => 
      updateAccountsPayableStatus(id, status, paymentDate),
    onSuccess: () => {
      toast.success("Status atualizado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['accounts-payable'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  const handleMarkAsReceived = (receivableId: string) => {
    setSelectedReceivable(receivableId);
    setIsMarkingReceived(true);
  };

  const handleMarkAsPaid = (payableId: string) => {
    setSelectedPayable(payableId);
    setIsMarkingPaid(true);
  };

  const handleConfirmReceived = async () => {
    if (!selectedReceivable) return;
    
    await updateReceivableStatusMutation.mutate({
      id: selectedReceivable, 
      status: 'received',
      paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
    });
    
    setIsMarkingReceived(false);
    setSelectedReceivable(null);
  };

  const handleConfirmPaid = async () => {
    if (!selectedPayable) return;
    
    await updatePayableStatusMutation.mutate({
      id: selectedPayable, 
      status: 'paid',
      paymentDate: paymentDate ? format(paymentDate, 'yyyy-MM-dd') : undefined
    });
    
    setIsMarkingPaid(false);
    setSelectedPayable(null);
  };

  return (
    <>
      <Tabs defaultValue="payable" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="payable">Contas a Pagar</TabsTrigger>
          <TabsTrigger value="receivable">Contas a Receber</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contas a Pagar</CardTitle>
                  <CardDescription>
                    Pagamentos pendentes e realizados para consultores (incluindo repasses automáticos de etapas)
                  </CardDescription>
                </div>
                <MonthNavigation 
                  currentDate={currentMonth}
                  onMonthChange={onMonthChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status da Etapa</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payables.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 9 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !payables.data || payables.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Nenhuma conta a pagar encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    payables.data.map(payable => (
                      <TableRow key={payable.id}>
                        <TableCell>
                          {format(new Date(payable.due_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>{payable.description}</TableCell>
                        <TableCell>{payable.project_name || '-'}</TableCell>
                        <TableCell>{payable.stage_name || '-'}</TableCell>
                        <TableCell>
                          {getStageStatusBadge(payable.stage_status)}
                        </TableCell>
                        <TableCell>{payable.consultant_name || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payable.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(payable.status, 'payable')}
                          {payable.payment_date && (
                            <div className="text-xs text-muted-foreground">
                              Pago em: {format(new Date(payable.payment_date), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {payable.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsPaid(payable.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="receivable">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Contas a Receber</CardTitle>
                  <CardDescription>
                    Recebimentos pendentes e realizados das etapas dos projetos
                  </CardDescription>
                </div>
                <MonthNavigation 
                  currentDate={currentMonth}
                  onMonthChange={onMonthChange}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Status da Etapa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.isLoading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 9 }).map((_, cellIndex) => (
                          <TableCell key={cellIndex}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : !receivables.data || receivables.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Nenhuma conta a receber encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    receivables.data.map(receivable => (
                      <TableRow key={receivable.id}>
                        <TableCell>
                          {format(new Date(receivable.due_date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {receivable.project_name || '-'}
                        </TableCell>
                        <TableCell>
                          {receivable.stage_name || '-'}
                        </TableCell>
                        <TableCell>
                          {getStageStatusBadge(receivable.stage_status)}
                        </TableCell>
                        <TableCell>{receivable.client_name || '-'}</TableCell>
                        <TableCell>{receivable.consultant_name || '-'}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(receivable.amount)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(receivable.status, 'receivable')}
                          {receivable.payment_date && (
                            <div className="text-xs text-muted-foreground">
                              Recebido em: {format(new Date(receivable.payment_date), 'dd/MM/yyyy')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {receivable.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsReceived(receivable.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Recebido
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog for Receivables */}
      <Dialog open={isMarkingReceived} onOpenChange={setIsMarkingReceived}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recebimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Data do recebimento</label>
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
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingReceived(false)}>Cancelar</Button>
            <Button onClick={handleConfirmReceived}>Confirmar recebimento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog for Payables */}
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
                    {paymentDate ? format(paymentDate, "dd/MM/yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={setPaymentDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMarkingPaid(false)}>Cancelar</Button>
            <Button onClick={handleConfirmPaid}>Confirmar pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountsPayableReceivable;
