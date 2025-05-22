
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus,
  Edit, 
  Trash,
  Clock,
  DollarSign
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ServiceForm } from './ServiceForm';

// Mock data
const mockServices = [
  { id: 1, name: 'Consultoria Estratégica', totalHours: 120, totalValue: 15000, stages: [
    { id: 1, name: 'Diagnóstico Inicial', hours: 40, value: 5000 },
    { id: 2, name: 'Desenvolvimento de Estratégia', hours: 60, value: 7500 },
    { id: 3, name: 'Implementação e Monitoramento', hours: 20, value: 2500 }
  ]},
  { id: 2, name: 'Gestão de Projetos', totalHours: 160, totalValue: 18000, stages: [
    { id: 1, name: 'Planejamento', hours: 40, value: 4500 },
    { id: 2, name: 'Execução', hours: 100, value: 11250 },
    { id: 3, name: 'Encerramento', hours: 20, value: 2250 }
  ]},
  { id: 3, name: 'Análise de Dados', totalHours: 80, totalValue: 12000, stages: [
    { id: 1, name: 'Coleta de Dados', hours: 20, value: 3000 },
    { id: 2, name: 'Processamento e Análise', hours: 40, value: 6000 },
    { id: 3, name: 'Elaboração de Relatórios', hours: 20, value: 3000 }
  ]}
];

export const ServiceList: React.FC = () => {
  const [services, setServices] = useState(mockServices);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddService = (service: any) => {
    if (editingService) {
      setServices(services.map(s => 
        s.id === editingService.id ? { ...service, id: s.id } : s
      ));
      setEditingService(null);
    } else {
      setServices([...services, { ...service, id: services.length + 1 }]);
    }
    setShowForm(false);
  };
  
  const handleEditService = (service: any) => {
    setEditingService(service);
    setShowForm(true);
  };
  
  const handleDeleteService = (id: number) => {
    setServices(services.filter(s => s.id !== id));
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Serviços</h1>
        <p className="text-muted-foreground">Gerenciamento de serviços oferecidos</p>
      </div>
      
      {showForm ? (
        <ServiceForm 
          service={editingService} 
          onSave={handleAddService} 
          onCancel={() => {
            setShowForm(false);
            setEditingService(null);
          }} 
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar serviços..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Serviços</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Etapas</TableHead>
                    <TableHead>Carga Horária</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.stages?.length || 0} etapas</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            {service.totalHours}h
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            R$ {service.totalValue.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditService(service)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteService(service.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum serviço encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ServiceList;
