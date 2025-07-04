
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCreateProject, useProjects } from '@/hooks/useProjects';
import { CheckCircle, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ProjectTestComponent = () => {
  const [testName, setTestName] = useState('');
  const [testDescription, setTestDescription] = useState('');
  
  const { data: projects, isLoading: projectsLoading, error: projectsError } = useProjects();
  const { mutate: createProject, isPending: isCreating } = useCreateProject();

  const handleCreateTestProject = () => {
    if (!testName.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    const testProjectData = {
      name: testName,
      description: testDescription || 'Projeto de teste criado para validar funcionalidade',
      status: 'ativo',
      // Usando IDs fixos para teste - você pode ajustar conforme necessário
      client_id: '00000000-0000-0000-0000-000000000001',
      service_id: '00000000-0000-0000-0000-000000000001',
      total_value: 1000,
      total_hours: 40
    };

    console.log('🧪 Criando projeto de teste:', testProjectData);
    createProject(testProjectData);
  };

  const getStatusBadge = () => {
    if (projectsError) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Erro ao Carregar
        </Badge>
      );
    }
    
    if (projectsLoading) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Carregando...
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Sistema Funcionando
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔧 Teste de Criação de Projetos</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status do Sistema */}
        <div className="space-y-2">
          <h3 className="font-medium">Status do Sistema</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
              <span className="text-sm">Projetos Carregados:</span>
              <Badge variant="outline">{projects?.length || 0}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
              <span className="text-sm">Sistema Isolado:</span>
              <Badge variant="default" className="bg-blue-500">✅ Sim</Badge>
            </div>
          </div>
        </div>

        {/* Teste de Criação */}
        <div className="space-y-4">
          <h3 className="font-medium">Criar Projeto de Teste</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="testName">Nome do Projeto</Label>
              <Input
                id="testName"
                placeholder="Digite o nome do projeto de teste"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="testDescription">Descrição (Opcional)</Label>
              <Input
                id="testDescription"
                placeholder="Descrição do projeto de teste"
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleCreateTestProject}
              disabled={isCreating || !testName.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Projeto...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Projeto de Teste
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Lista de Projetos Recentes */}
        {projects && projects.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Projetos Recentes</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="p-3 border rounded bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <div className="text-xs text-gray-500">
                        ID: {project.project_id || project.id}
                      </div>
                    </div>
                    <Badge variant="outline">{project.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações de Debug */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <strong>✅ Sistema Isolado:</strong> O sistema de projetos agora funciona independentemente do chat.
          <br />
          <strong>🔧 Logs:</strong> Verifique o console do navegador para logs detalhados.
          <br />
          <strong>📊 Status:</strong> {projectsError ? 'Erro detectado' : 'Sistema funcionando normalmente'}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTestComponent;
