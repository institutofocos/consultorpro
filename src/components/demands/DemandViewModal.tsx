
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, Clock, Clock3, FileCheck, Download, User, Mail, Phone } from 'lucide-react';
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

  const generatePDF = () => {
    // Create a clean HTML version for PDF generation
    const printContent = `
      <html>
        <head>
          <title>Demanda - ${demand.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .info-item { margin-bottom: 8px; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .description { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .stage { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .stage-header { font-weight: bold; margin-bottom: 10px; }
            .stage-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; }
            .tags { display: flex; flex-wrap: wrap; gap: 5px; }
            .tag { background-color: #e5e5e5; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${demand.name}</h1>
            <p>Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Informações Gerais</div>
            <div class="info-grid">
              <div>
                <div class="info-item"><span class="label">Cliente:</span> <span class="value">${demand.clientName || "Não especificado"}</span></div>
                <div class="info-item"><span class="label">Serviço:</span> <span class="value">${demand.serviceName || "Não especificado"}</span></div>
                <div class="info-item"><span class="label">Valor Total:</span> <span class="value">${formatCurrency(demand.total_value)}</span></div>
              </div>
              <div>
                <div class="info-item"><span class="label">Data de Início:</span> <span class="value">${format(new Date(demand.start_date), 'dd/MM/yyyy', { locale: ptBR })}</span></div>
                <div class="info-item"><span class="label">Data de Fim:</span> <span class="value">${format(new Date(demand.end_date), 'dd/MM/yyyy', { locale: ptBR })}</span></div>
                <div class="info-item"><span class="label">Total de Horas:</span> <span class="value">${demand.totalHours || 0}h</span></div>
                <div class="info-item"><span class="label">Total de Dias:</span> <span class="value">${demand.totalDays || 0} dias</span></div>
              </div>
            </div>
          </div>

          ${demand.description ? `
            <div class="section">
              <div class="section-title">Descrição</div>
              <div class="description">${demand.description}</div>
            </div>
          ` : ''}

          ${demand.tags && demand.tags.length > 0 ? `
            <div class="section">
              <div class="section-title">Tags</div>
              <div class="tags">
                ${demand.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          ${demand.stages && demand.stages.length > 0 ? `
            <div class="section">
              <div class="section-title">Etapas do Projeto</div>
              ${demand.stages.map((stage: any, index: number) => `
                <div class="stage">
                  <div class="stage-header">Etapa ${index + 1}: ${stage.name}</div>
                  ${stage.description ? `<p>${stage.description}</p>` : ''}
                  <div class="stage-grid">
                    <div><span class="label">Duração:</span> ${stage.days || 1} dias</div>
                    <div><span class="label">Horas:</span> ${stage.hours || 8}h</div>
                    <div><span class="label">Valor:</span> ${formatCurrency(stage.value || 0)}</div>
                    ${stage.startDate && stage.endDate ? `<div><span class="label">Período:</span> ${format(new Date(stage.startDate), 'dd/MM', { locale: ptBR })} - ${format(new Date(stage.endDate), 'dd/MM', { locale: ptBR })}</div>` : '<div></div>'}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${(demand.manager_name || demand.manager_email || demand.manager_phone) ? `
            <div class="section">
              <div class="section-title">Informações do Gestor</div>
              ${demand.manager_name ? `<div class="info-item"><span class="label">Nome:</span> <span class="value">${demand.manager_name}</span></div>` : ''}
              ${demand.manager_email ? `<div class="info-item"><span class="label">Email:</span> <span class="value">${demand.manager_email}</span></div>` : ''}
              ${demand.manager_phone ? `<div class="info-item"><span class="label">Telefone:</span> <span class="value">${demand.manager_phone}</span></div>` : ''}
            </div>
          ` : ''}
        </body>
      </html>
    `;

    // Open in new window for printing/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent size="full" className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-800">{demand.name}</DialogTitle>
            <Button 
              onClick={generatePDF}
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 hover:bg-blue-50"
            >
              <Download className="h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-1">
          <div className="space-y-6">
            {/* Informações Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coluna Esquerda - Informações Básicas */}
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Informações Gerais
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Cliente:</span>
                      <span className="text-sm text-blue-800 font-medium">{demand.clientName || "Não especificado"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">Serviço:</span>
                      <span className="text-sm text-blue-800 font-medium">{demand.serviceName || "Não especificado"}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                      <span className="text-sm font-medium text-blue-700">Valor Total:</span>
                      <span className="text-lg font-bold text-green-600">{formatCurrency(demand.total_value)}</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {demand.tags && demand.tags.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="font-semibold text-purple-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {demand.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Coluna Direita - Cronograma */}
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Cronograma
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-green-700 block">Data de Início</span>
                        <span className="text-sm text-green-800 font-medium">
                          {format(new Date(demand.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-green-700 block">Total de Horas</span>
                        <span className="text-sm text-green-800 font-medium">{demand.totalHours || 0}h</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-green-700 block">Data de Fim</span>
                        <span className="text-sm text-green-800 font-medium">
                          {format(new Date(demand.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-green-700 block">Total de Dias</span>
                        <span className="text-sm text-green-800 font-medium">{demand.totalDays || 0} dias</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações do Gestor */}
                {(demand.manager_name || demand.manager_email || demand.manager_phone) && (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Gestor do Projeto
                    </h3>
                    <div className="space-y-2">
                      {demand.manager_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-orange-600" />
                          <span className="text-sm text-orange-800">{demand.manager_name}</span>
                        </div>
                      )}
                      {demand.manager_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-orange-600" />
                          <span className="text-sm text-orange-800">{demand.manager_email}</span>
                        </div>
                      )}
                      {demand.manager_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-orange-600" />
                          <span className="text-sm text-orange-800">{demand.manager_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            {demand.description && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Descrição do Projeto
                </h3>
                <div className="bg-white p-4 rounded border text-sm text-gray-700 leading-relaxed">
                  {demand.description}
                </div>
              </div>
            )}

            {/* Etapas */}
            {demand.stages && demand.stages.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                <h3 className="font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Etapas do Projeto ({demand.stages.length})
                </h3>
                <div className="space-y-4">
                  {demand.stages.map((stage: any, index: number) => (
                    <div key={index} className="bg-white border border-indigo-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-indigo-900 text-base">{stage.name}</h4>
                          <Badge variant="outline" className="text-xs mt-1 border-indigo-300 text-indigo-700">
                            Etapa {index + 1} de {demand.stages.length}
                          </Badge>
                        </div>
                      </div>
                      
                      {stage.description && (
                        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded border">{stage.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-2 rounded">
                          <span className="text-xs font-medium text-blue-700 block">Duração</span>
                          <span className="text-sm font-bold text-blue-900">{stage.days || 1} dias</span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-xs font-medium text-green-700 block">Horas</span>
                          <span className="text-sm font-bold text-green-900">{stage.hours || 8}h</span>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <span className="text-xs font-medium text-purple-700 block">Valor</span>
                          <span className="text-sm font-bold text-purple-900">{formatCurrency(stage.value || 0)}</span>
                        </div>
                        {stage.startDate && stage.endDate && (
                          <div className="bg-orange-50 p-2 rounded">
                            <span className="text-xs font-medium text-orange-700 block">Período</span>
                            <span className="text-sm font-bold text-orange-900">
                              {format(new Date(stage.startDate), 'dd/MM', { locale: ptBR })} - {format(new Date(stage.endDate), 'dd/MM', { locale: ptBR })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemandViewModal;
