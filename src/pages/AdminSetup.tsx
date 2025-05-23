
import React, { useState, useEffect } from 'react';
import { setupAdminUsers } from '@/services/auth';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';

const AdminSetup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [setupComplete, setSetupComplete] = useState(false);
  
  useEffect(() => {
    // Check local storage to see if setup was already completed
    const setupDone = localStorage.getItem('adminSetupComplete');
    if (setupDone === 'true') {
      setSetupComplete(true);
    }
  }, []);
  
  const handleSetupAdmins = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      const setupResults = await setupAdminUsers();
      
      setResults(setupResults);
      setSetupComplete(true);
      
      // Store setup completion in local storage
      localStorage.setItem('adminSetupComplete', 'true');
      
      toast({
        title: "Configuração concluída",
        description: "Os usuários administradores foram configurados com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao configurar administradores:', error);
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Falha ao configurar administradores: ${error.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Configuração de Administradores</CardTitle>
          <CardDescription>
            Configure os usuários administradores do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Esta ferramenta irá configurar os seguintes emails como administradores com a senha definida:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>contato@eron.dev.br</li>
            <li>augusto.andrademelo@gmail.com</li>
            <li>pedroaugusto.andrademelo@gmail.com</li>
          </ul>
          <p className="text-sm font-medium">Senha: 123456789</p>
          
          {results.length > 0 && (
            <Alert className="mt-4">
              <AlertTitle>Resultados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 text-sm mt-2">
                  {results.map((result, index) => (
                    <li key={index}>{result}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {setupComplete ? (
            <div className="py-4 flex flex-col items-center text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-2" />
              <h3 className="text-lg font-medium">Configuração Concluída</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agora você pode voltar à página de login e acessar o sistema com as credenciais de administrador.
              </p>
              <Button 
                className="mt-4"
                onClick={goToLogin}
              >
                Ir para o Login
              </Button>
            </div>
          ) : (
            <div className="pt-4">
              <Button
                onClick={handleSetupAdmins}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Configurar Administradores
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
