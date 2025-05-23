
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { KanbanSquare } from 'lucide-react';

// Componentes de exemplo para o Kanban
const KanbanColumn = ({ title, children, color }: { title: string, children: React.ReactNode, color: string }) => (
  <div className="flex flex-col h-full min-w-[250px] bg-muted/20 rounded-lg p-2">
    <div className="flex items-center mb-2">
      <div className={`w-3 h-3 rounded-full mr-2 ${color}`} />
      <h3 className="font-medium">{title}</h3>
      <span className="ml-auto bg-muted px-2 py-0.5 rounded text-xs">{React.Children.count(children)}</span>
    </div>
    <div className="space-y-2 flex-grow overflow-auto">
      {children}
    </div>
  </div>
);

const KanbanCard = ({ title, description, tags }: { title: string, description: string, tags?: string[] }) => (
  <Card className="bg-card border shadow-sm">
    <CardContent className="p-3">
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default function ReportsKanban() {
  // Dados de exemplo para o Kanban
  const columns = [
    {
      title: "A Fazer",
      color: "bg-blue-500",
      cards: [
        {
          title: "Proposta de Serviço",
          description: "Elaborar proposta para novo cliente",
          tags: ["Comercial", "Urgente"]
        },
        {
          title: "Análise de Requisitos",
          description: "Documentar requisitos do Projeto XYZ",
          tags: ["Documentação"]
        }
      ]
    },
    {
      title: "Em Andamento",
      color: "bg-yellow-500",
      cards: [
        {
          title: "Desenvolvimento Frontend",
          description: "Implementação da interface do usuário",
          tags: ["Código", "Design"]
        }
      ]
    },
    {
      title: "Revisão",
      color: "bg-purple-500",
      cards: [
        {
          title: "Teste de Integração",
          description: "Verificar integrações entre módulos",
          tags: ["Testes"]
        }
      ]
    },
    {
      title: "Concluído",
      color: "bg-green-500",
      cards: [
        {
          title: "Entrega Documentação",
          description: "Entrega da documentação técnica",
          tags: ["Documentação", "Finalizado"]
        },
        {
          title: "Reunião de Kickoff",
          description: "Reunião inicial com equipe do cliente",
          tags: ["Reunião"]
        }
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Relatórios - Kanban</h1>
        <p className="text-muted-foreground">Visualize os projetos em formato de kanban</p>
      </div>
      
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl">
            <div className="flex items-center">
              <KanbanSquare className="h-5 w-5 mr-2" />
              <span>Kanban de Projetos</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-300px)]">
            {columns.map((column, index) => (
              <KanbanColumn key={index} title={column.title} color={column.color}>
                {column.cards.map((card, i) => (
                  <KanbanCard 
                    key={i} 
                    title={card.title} 
                    description={card.description} 
                    tags={card.tags} 
                  />
                ))}
              </KanbanColumn>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
