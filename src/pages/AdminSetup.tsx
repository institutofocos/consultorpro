
import React, { useState } from 'react';
import { setupAdminUsers } from '@/services/auth';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2 } from 'lucide-react';

const AdminSetup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSetupAdmins = async () => {
    setIsLoading(true);
    
    try {
      await setupAdminUsers();
      
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
          </ul>
          <p className="text-sm font-medium">Senha: 123456789</p>
          
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
