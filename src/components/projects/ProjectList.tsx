
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
  PlusCircle, 
  Edit, 
  Trash,
  Check,
  Clock
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectForm } from './ProjectForm';

// Mock data
const mockProjects = [
  { 
    id: 1, 
    name: 'Implementação ERP', 
    description: 'Implementação de sistema ERP para controle financeiro',
    mainConsultant: 'Ana Silva',
    startDate: '2023-06-10',
    endDate: '2023-12-20',
    totalValue: 85000,
    taxPercent: 16,
    thirdPartyExpenses: 12000,
    consultantValue: 35000,
    status: 'active',
    stages: 5,
    completedStages: 3
  },
  { 
    id: 2, 
    name: 'Consultoria Processos', 
    description: 'Mapeamento e otimização de processos internos',
    mainConsultant: 'Carlos Mendes',
    startDate: '2023-08-15',
    endDate: '2024-01-15',
    totalValue: 63000,
    taxPercent: 16,
    thirdPartyExpenses: 5000,
    consultantValue: 25000,
    status: 'active',
    stages: 4,
    completedStages: 2
  },
  { 
    id: 3, 
    name: 'Treinamento Liderança', 
    description: 'Programa de desenvolvimento de líderes',
    mainConsultant: 'Patricia Lemos',
    startDate: '2023-09-01',
    endDate: '2023-11-30',
    totalValue: 42000,
    taxPercent: 16,
    thirdPartyExpenses: 8000,
    consultantValue: 18000,
    status: 'completed',
    stages: 3,
    completedStages: 3
  },
  { 
    id: 4, 
    name: 'Gestão de Riscos', 
    description: 'Implementação de estrutura de gestão de riscos',
    mainConsultant: 'Roberto Gomes',
    startDate: '2023-10-05',
    endDate: '2024-04-05',
    totalValue: 79000,
    taxPercent: 16,
    thirdPartyExpenses: 15000,
    consultantValue: 30000,
    status: 'active',
    stages: 6,
    completedStages: 2
  },
  { 
    id: 5, 
    name: 'Rebranding', 
    description: 'Renovação da identidade visual e posicionamento',
    mainConsultant: 'Juliana Alves',
    startDate: '2023-11-01',
    endDate: '2024-02-28',
    totalValue: 56000,
    taxPercent: 16,
    thirdPartyExpenses: 18000,
    consultantValue: 20000,
    status: 'planned',
    stages: 4,
    completedStages: 0
  },
];

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState(mockProjects);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.mainConsultant.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddProject = (project: any) => {
    if (editingProject) {
      setProjects(projects.map(p => 
        p.id === editingProject.id ? { ...project, id: p.id } : p
      ));
      setEditingProject(null);
    } else {
      setProjects([...projects, { 
        ...project, 
        id: projects.length + 1, 
        stages: 1,
        completedStages: 0,
      }]);
    }
    setShowForm(false);
  };
  
  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setShowForm(true);
  };
  
  const handleDeleteProject = (id: number) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Projetos</h1>
        <p className="text-muted-foreground">Gerenciamento de projetos e serviços</p>
      </div>
      
      {showForm ? (
        <ProjectForm 
          project={editingProject} 
          onSave={handleAddProject} 
          onCancel={() => {
            setShowForm(false);
            setEditingProject(null);
          }} 
        />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Buscar projetos..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Projeto
            </Button>
          </div>
          
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle>Lista de Projetos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>{project.mainConsultant}</TableCell>
                        <TableCell>{formatCurrency(project.totalValue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="text-sm mr-2">
                              {project.completedStages}/{project.stages}
                            </span>
                            <div className="bg-muted h-2 w-16 rounded-full overflow-hidden">
                              <div 
                                className="bg-blue-500 h-full rounded-full"
                                style={{ width: `${(project.completedStages / project.stages) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {project.status === 'active' && (
                            <Badge className="bg-green-500">
                              <Clock className="mr-1 h-3 w-3" />
                              Em Andamento
                            </Badge>
                          )}
                          {project.status === 'completed' && (
                            <Badge className="bg-blue-500">
                              <Check className="mr-1 h-3 w-3" />
                              Concluído
                            </Badge>
                          )}
                          {project.status === 'planned' && (
                            <Badge variant="outline">
                              Planejado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditProject(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProject(project.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum projeto encontrado
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

export default ProjectList;
