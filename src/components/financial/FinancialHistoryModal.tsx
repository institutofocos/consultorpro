import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Check, X, Trash, Eye } from "lucide-react";
import { format, isAfter, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from 'sonner';
import FinancialHistoryFilters from './FinancialHistoryFilters';
import { useConsultants } from '@/hooks/useConsultants';

interface HistoryItem {
  id: string;
  type: 'receivable' | 'payable';
  description: string;
  amount: number;
  status: string;
  due_date: string;
  payment_date?: string;
  created_at: string;
  updated_at: string;
  entity_name: string;
  project_name?: string;
  stage_name?: string;
}

interface FinancialHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  isLoading: boolean;
}

const FinancialHistoryModal: React.FC<FinancialHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  isLoading
}) => {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [consultantFilter, setConsultantFilter] = useState('all');

  const { data: consultants = [] } = useConsultants();

  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Filtro por período
    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.due_date);
        return isAfter(itemDate, startDate) || isSameDay(itemDate, startDate);
      });
    }

    if (endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.due_date);
        return isBefore(itemDate, endDate) || isSameDay(itemDate, endDate);
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtro por consultor
    if (consultantFilter !== 'all') {
      const consultantName = consultants.find(c => c.id === consultantFilter)?.name;
      if (consultantName) {
        filtered = filtered.filter(item => 
          item.entity_name.toLowerCase().includes(consultantName.toLowerCase())
        );
      }
    }

    return filtered;
  }, [history, startDate, endDate, statusFilter, consultantFilter, consultants]);

  // Separar os dados filtrados por tipo
  const receivables = filteredHistory.filter(item => item.type === 'receivable');
  const payables = filteredHistory.filter(item => item.type === 'payable');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
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

  const handleGeneratePDF = () => {
    // Implementação básica para gerar PDF
    toast.info("Função de gerar PDF será implementada em breve");
    console.log('Dados para PDF:', filteredHistory);
  };

  const handleViewTransaction = (item: HistoryItem) => {
    // Armazenar informações no sessionStorage para manter estado
    sessionStorage.setItem('highlightTransaction', JSON.stringify({
      id: item.id,
      type: item.type,
      dueDate: item.due_date
    }));

    // Fechar o modal
    onClose();

    // Pequeno delay para garantir que o modal feche antes da navegação
    setTimeout(() => {
      // Redirecionar para a tela financeira com scroll para a seção correta
      window.location.hash = item.type === 'receivable' ? '#accounts-receivable' : '#accounts-payable';
      
      // Scroll suave para a seção
      const targetSection = document.querySelector(item.type === 'receivable' ? '#accounts-receivable' : '#accounts-payable');
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      toast.success(`Redirecionando para ${item.type === 'receivable' ? 'contas a receber' : 'contas a pagar'}`);
    }, 100);
  };

  const renderTable = (data: HistoryItem[], emptyMessage: string) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Projeto/Etapa</TableHead>
          <TableHead>Entidade</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Atualizado em</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-8">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          data.map(item => (
            <TableRow 
              key={`${item.type}-${item.id}`}
              data-transaction-id={item.id}
              data-transaction-type={item.type}
              data-due-date={item.due_date}
            >
              <TableCell>
                {format(new Date(item.due_date), 'dd/MM/yyyy')}
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {item.description}
              </TableCell>
              <TableCell>
                {item.project_name && (
                  <div className="font-medium">{item.project_name}</div>
                )}
                {item.stage_name && (
                  <div className="text-sm text-muted-foreground">{item.stage_name}</div>
                )}
              </TableCell>
              <TableCell>{item.entity_name}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(item.amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(item.status)}
                {item.payment_date && (
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(item.payment_date), 'dd/MM/yyyy')}
                  </div>
                )}
              </TableCell>
              <TableCell>
                {format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewTransaction(item)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors duration-200"
                  aria-label={`Visualizar ${item.type === 'receivable' ? 'conta a receber' : 'conta a pagar'}: ${item.description}`}
                  title="Visualizar detalhes"
                >
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0" size="full">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Histórico Financeiro</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[80vh]">
          <FinancialHistoryFilters
            startDate={startDate}
            endDate={endDate}
            status={statusFilter}
            consultant={consultantFilter}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onStatusChange={setStatusFilter}
            onConsultantChange={setConsultantFilter}
            onGeneratePDF={handleGeneratePDF}
            consultants={consultants}
          />
          
          <div className="flex-1 overflow-auto p-6">
            {isLoading ? (
              <div className="text-center py-8">Carregando histórico...</div>
            ) : (
              <Tabs defaultValue="receivables" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="receivables" className="relative">
                    Contas a Receber
                    {receivables.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {receivables.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="payables" className="relative">
                    Contas a Pagar
                    {payables.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {payables.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="receivables" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {receivables.length} de {history.filter(h => h.type === 'receivable').length} registros de contas a receber
                  </div>
                  {renderTable(receivables, "Nenhuma conta a receber encontrada com os filtros aplicados")}
                </TabsContent>
                
                <TabsContent value="payables" className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    {payables.length} de {history.filter(h => h.type === 'payable').length} registros de contas a pagar
                  </div>
                  {renderTable(payables, "Nenhuma conta a pagar encontrada com os filtros aplicados")}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialHistoryModal;
