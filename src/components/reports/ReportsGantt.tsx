
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartGantt } from 'lucide-react';
import { addDays, format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

export default function ReportsGantt() {
  // Data atual para cálculos
  const today = new Date();
  
  // Dados de exemplo para o Gantt
  const projects = [
    {
      id: 1,
      name: "Projeto A",
      start: today,
      end: addDays(today, 30),
      progress: 25,
      color: "bg-blue-500"
    },
    {
      id: 2,
      name: "Projeto B",
      start: addDays(today, 7),
      end: addDays(today, 45),
      progress: 10,
      color: "bg-green-500"
    },
    {
      id: 3,
      name: "Projeto C",
      start: addDays(today, -20),
      end: addDays(today, 10),
      progress: 70,
      color: "bg-purple-500"
    },
    {
      id: 4,
      name: "Projeto D",
      start: addDays(today, 14),
      end: addDays(today, 60),
      progress: 0,
      color: "bg-amber-500"
    }
  ];

  // Calcula total de dias no intervalo para visualização do Gantt
  const minDate = new Date(Math.min(...projects.map(p => p.start.getTime())));
  const maxDate = new Date(Math.max(...projects.map(p => p.end.getTime())));
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  // Função para calcular a posição e tamanho das barras
  const calculateBarStyle = (project: typeof projects[0]) => {
    const startOffset = Math.ceil((project.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((project.end.getTime() - project.start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Gantt</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de diagrama de Gantt</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <ChartGantt className="h-5 w-5 mr-2" />
              <span>Diagrama de Gantt</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[200px_1fr] mb-2">
                <div className="font-medium">Projeto</div>
                <div className="font-medium pl-2">Cronograma</div>
              </div>
              
              {projects.map(project => (
                <div key={project.id} className="grid grid-cols-[200px_1fr] py-3 border-t">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(project.start, 'P', {locale: ptBR})} - {format(project.end, 'P', {locale: ptBR})}
                    </p>
                  </div>
                  
                  <div className="relative h-8">
                    {/* Barra de fundo */}
                    <div className="absolute inset-y-0 bg-muted rounded-full" style={calculateBarStyle(project)}></div>
                    
                    {/* Barra de progresso */}
                    <div 
                      className={`absolute inset-y-0 ${project.color} rounded-full`} 
                      style={{
                        ...calculateBarStyle(project),
                        width: `calc(${calculateBarStyle(project).width} * ${project.progress / 100})`
                      }}
                    ></div>
                    
                    {/* Porcentagem de conclusão */}
                    <div 
                      className="absolute inset-y-0 flex items-center justify-center text-xs font-medium text-white"
                      style={calculateBarStyle(project)}
                    >
                      {project.progress}%
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Linha do tempo atual */}
              <div 
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10" 
                style={{
                  left: `calc(${(Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) / totalDays) * 100}% + 200px)`
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
