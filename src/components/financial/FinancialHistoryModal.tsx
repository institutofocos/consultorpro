
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

  const getTypeBadge = (type: string) => {
    return type === 'receivable' 
      ? <Badge className="bg-blue-100 text-blue-800 border-blue-300">A Receber</Badge>
      : <Badge className="bg-orange-100 text-orange-800 border-orange-300">A Pagar</Badge>;
  };

  const handleGeneratePDF = () => {
    // Implementação básica para gerar PDF
    toast.info("Função de gerar PDF será implementada em breve");
    console.log('Dados para PDF:', filteredHistory);
  };

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
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {filteredHistory.length} de {history.length} registros
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Projeto/Etapa</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Atualizado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Nenhum histórico encontrado com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHistory.map(item => (
                        <TableRow key={`${item.type}-${item.id}`}>
                          <TableCell>
                            {format(new Date(item.due_date), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{getTypeBadge(item.type)}</TableCell>
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialHistoryModal;
