import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Users, AlertCircle, RefreshCw, UserPlus } from 'lucide-react';
import { fetchConsultants, fetchDemandsWithoutConsultants, assignConsultantsToDemand } from '@/integrations/supabase/projects';
import { toast } from 'sonner';

const DemandsList: React.FC = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [selectedConsultant, setSelectedConsultant] = useState<string>('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [demandsData, consultantsData] = await Promise.all([
        fetchDemandsWithoutConsultants(),
        fetchConsultants()
      ]);

      setDemands(demandsData);
      setConsultants(consultantsData);
    } catch (error: any) {
      console.error('Erro ao buscar dados iniciais:', error);
      setError(error.message || 'Erro ao carregar dados');
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDemands = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const demandsData = await fetchDemandsWithoutConsultants();
      setDemands(demandsData);
    } catch (error: any) {
      console.error('Erro ao buscar demandas:', error);
      setError(error.message || 'Erro ao carregar demandas');
      toast.error('Erro ao carregar demandas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssignModal = (demand: any) => {
    setSelectedDemand(demand);
    setIsAssignModalOpen(true);
  };

  const handleCloseAssignModal = () => {
    setSelectedDemand(null);
    setSelectedConsultant('');
    setIsAssignModalOpen(false);
  };

  const handleAssignConsultants = async (demandId: string) => {
    const demand = demands.find(d => d.id === demandId);
    if (!demand) return;

    const consultant = consultants.find(c => c.id === selectedConsultant);
    if (!consultant) {
      toast.error('Selecione um consultor');
      return;
    }

    setIsAssigning(true);
    try {
      // Fix: Use only 2 arguments as expected by the function
      await assignConsultantsToDemand(demandId, [selectedConsultant]);
      
      toast.success(`Consultor ${consultant.name} atribuído à demanda "${demand.title}"`);
      
      // Reset state
      setSelectedDemand(null);
      setSelectedConsultant('');
      setIsAssignModalOpen(false);
      
      // Refresh demands list
      fetchDemands();
    } catch (error) {
      console.error('Erro ao atribuir consultor:', error);
      toast.error('Erro ao atribuir consultor');
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-semibold mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar as demandas.
          </p>
          <Button onClick={() => fetchInitialData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Demandas sem Consultor
          </CardTitle>
          <Button onClick={() => fetchDemands()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar Lista
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de demandas sem consultor atribuído.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demands.map((demand) => (
                <TableRow key={demand.id}>
                  <TableCell className="font-medium">{demand.title}</TableCell>
                  <TableCell>{demand.description}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenAssignModal(demand)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Atribuir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Atribuição */}
      {selectedDemand && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => e.target === e.currentTarget && handleCloseAssignModal()}
        >
          <div className="relative p-4 w-full max-w-md h-full md:h-auto m-auto mt-20">
            <Card className="relative">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Atribuir Consultor
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseAssignModal}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="demandTitle">Demanda</Label>
                    <Input
                      type="text"
                      id="demandTitle"
                      value={selectedDemand.title}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consultant">Consultor</Label>
                    <Select
                      value={selectedConsultant}
                      onValueChange={(value) => setSelectedConsultant(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um consultor" />
                      </SelectTrigger>
                      <SelectContent>
                        {consultants.map((consultant) => (
                          <SelectItem key={consultant.id} value={consultant.id}>
                            {consultant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleAssignConsultants(selectedDemand.id)}
                    disabled={isAssigning || !selectedConsultant}
                  >
                    {isAssigning ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      'Atribuir'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default DemandsList;
