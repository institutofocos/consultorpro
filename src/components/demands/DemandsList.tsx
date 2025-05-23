
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { FileCheck, Calendar, DollarSign, Users, Clock } from 'lucide-react';
import { fetchDemandsWithoutConsultants } from '@/integrations/supabase/projects';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const DemandsList = () => {
  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemands = async () => {
      try {
        setLoading(true);
        const demandsData = await fetchDemandsWithoutConsultants();
        setDemands(demandsData);
      } catch (error) {
        console.error('Error fetching demands:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDemands();
    
    // Set up a periodic refresh to check for changes
    const interval = setInterval(fetchDemands, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Function to format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Demandas</h1>
        <p className="text-muted-foreground">Gerencie todas as demandas de clientes</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <FileCheck className="h-5 w-5 mr-2" />
              <span>Lista de Demandas</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Carregando demandas...</p>
            </div>
          ) : demands.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground">Não há demandas disponíveis no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {demands.map((demand) => (
                <Card key={demand.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{demand.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{demand.description || "Sem descrição"}</p>
                        </div>
                        <Badge variant={demand.status === 'planned' ? 'outline' : demand.status === 'active' ? 'default' : demand.status === 'completed' ? 'secondary' : 'destructive'}>
                          {demand.status === 'planned' ? 'Planejado' : 
                           demand.status === 'active' ? 'Em Andamento' : 
                           demand.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Início</p>
                            <p className="text-muted-foreground">{format(new Date(demand.start_date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Fim</p>
                            <p className="text-muted-foreground">{format(new Date(demand.end_date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Valor</p>
                            <p className="text-muted-foreground">{formatCurrency(demand.total_value)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">Cliente</p>
                            <p className="text-muted-foreground">{demand.clientName || "Sem cliente"}</p>
                          </div>
                        </div>
                      </div>
                      
                      {demand.tags && demand.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {demand.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Estas demandas estão aguardando associação a um consultor. Uma vez atribuídas, serão movidas para Projetos.
        </CardFooter>
      </Card>
    </div>
  );
};

export default DemandsList;
