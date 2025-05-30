
import React from 'react';
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Histórico Financeiro</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="text-center py-8">Carregando histórico...</div>
        ) : (
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
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum histórico encontrado
                  </TableCell>
                </TableRow>
              ) : (
                history.map(item => (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FinancialHistoryModal;
