
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from 'react-router-dom';
import { Calendar, BarChart2 } from 'lucide-react';

const ReportsList: React.FC = () => {
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    switch (value) {
      case "calendar":
        navigate('/reports/calendar');
        break;
      case "gantt":
        navigate('/reports/gantt');
        break;
      default:
        navigate('/reports');
        break;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Relatórios e análises de projetos</p>
      </div>

      <Tabs defaultValue="default" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Agenda
          </TabsTrigger>
          <TabsTrigger value="gantt">
            <BarChart2 className="h-4 w-4 mr-2" />
            Gantt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Escolha um tipo de relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Card className="flex-1 cursor-pointer hover:bg-muted/50" onClick={() => handleTabChange("calendar")}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      Agenda
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Visualizar eventos e prazos em formato de calendário</p>
                  </CardContent>
                </Card>
                
                <Card className="flex-1 cursor-pointer hover:bg-muted/50" onClick={() => handleTabChange("gantt")}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5" />
                      Gantt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Visualizar projetos em formato de diagrama de Gantt</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsList;
