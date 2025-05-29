
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Clock, Clock3, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DemandViewModalProps {
  demand: any;
  isOpen: boolean;
  onClose: () => void;
}

const DemandViewModal: React.FC<DemandViewModalProps> = ({ demand, isOpen, onClose }) => {
  if (!demand) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{demand.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Informações Gerais</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Cliente:</span>
                    <span className="text-sm text-gray-600">{demand.clientName || "Não especificado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Serviço:</span>
                    <span className="text-sm text-gray-600">{demand.serviceName || "Não especificado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Valor Total:</span>
                    <span className="text-sm text-gray-600">{formatCurrency(demand.total_value)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Cronograma</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Data de Início:</span>
                    <span className="text-sm text-gray-600">
                      {format(new Date(demand.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Data de Fim:</span>
                    <span className="text-sm text-gray-600">
                      {format(new Date(demand.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Total de Horas:</span>
                    <span className="text-sm text-gray-600">{demand.totalHours || 0}h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Total de Dias:</span>
                    <span className="text-sm text-gray-600">{demand.totalDays || 0} dias</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Tags */}
              {demand.tags && demand.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {demand.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição */}
              {demand.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Descrição</h3>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {demand.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Etapas */}
          {demand.stages && demand.stages.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Etapas do Projeto</h3>
              <div className="space-y-3">
                {demand.stages.map((stage: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800">{stage.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Etapa {index + 1}
                      </Badge>
                    </div>
                    
                    {stage.description && (
                      <p className="text-sm text-gray-600 mb-3">{stage.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-700">Duração:</span>
                        <p className="text-gray-600">{stage.days || 1} dias</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Horas:</span>
                        <p className="text-gray-600">{stage.hours || 8}h</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Valor:</span>
                        <p className="text-gray-600">{formatCurrency(stage.value || 0)}</p>
                      </div>
                      {stage.startDate && stage.endDate && (
                        <div>
                          <span className="font-medium text-gray-700">Período:</span>
                          <p className="text-gray-600">
                            {format(new Date(stage.startDate), 'dd/MM', { locale: ptBR })} - {format(new Date(stage.endDate), 'dd/MM', { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informações do Gestor */}
          {(demand.manager_name || demand.manager_email || demand.manager_phone) && (
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Informações do Gestor</h3>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="space-y-1 text-sm">
                  {demand.manager_name && (
                    <div>
                      <span className="font-medium">Nome:</span> {demand.manager_name}
                    </div>
                  )}
                  {demand.manager_email && (
                    <div>
                      <span className="font-medium">Email:</span> {demand.manager_email}
                    </div>
                  )}
                  {demand.manager_phone && (
                    <div>
                      <span className="font-medium">Telefone:</span> {demand.manager_phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemandViewModal;
