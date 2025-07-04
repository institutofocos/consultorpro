
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, Key, Plus, RefreshCcw, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface APIKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  expires_at: string | null;
}

const APIKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: "default",
      name: "API Key Padrão",
      key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZnBpb2VwdmtmdnB1cWRiYm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MzQ5NDIsImV4cCI6MjA2MzUxMDk0Mn0.ZD1AuPVDNuqTeYz8Eyt4QZHf_Qt1K-9oZcK3_fxSx-w",
      created_at: new Date().toISOString(),
      expires_at: null,
    }
  ]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Chave copiada",
      description: "A chave da API foi copiada para a área de transferência",
    });
  };

  const generateKey = () => {
    // In a real app, this would be a secure API call to generate a key
    const mockKey = "sk_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return mockKey;
  };

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, forneça um nome para a chave",
        variant: "destructive"
      });
      return;
    }
    
    const newKey = generateKey();
    setNewGeneratedKey(newKey);
  };

  const confirmCreateKey = () => {
    if (!newKeyName || !newGeneratedKey) return;
    
    const newApiKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: newGeneratedKey,
      created_at: new Date().toISOString(),
      expires_at: null
    };
    
    setApiKeys([...apiKeys, newApiKey]);
    toast({
      title: "Chave criada",
      description: "Nova chave de API criada com sucesso",
    });
    
    // Reset state
    setNewKeyName("");
    setNewGeneratedKey(null);
    setIsCreateDialogOpen(false);
  };

  const handleDeleteKey = (id: string) => {
    if (id === "default") {
      toast({
        title: "Operação não permitida",
        description: "A chave padrão não pode ser excluída",
        variant: "destructive"
      });
      return;
    }
    
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast({
      title: "Chave excluída",
      description: "A chave de API foi excluída com sucesso",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Gerenciador de API Keys</h1>
        <p className="text-muted-foreground">Crie e gerencie suas chaves de API</p>
      </div>

      <div className="flex justify-end mb-4">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Dê um nome para sua chave de API para identificá-la facilmente.
              </DialogDescription>
            </DialogHeader>
            
            {!newGeneratedKey ? (
              <>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ex: Aplicação Web"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateKey}>Gerar Chave</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="grid gap-4 py-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-md flex items-start space-x-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-300">
                      <p className="font-medium">Importante!</p>
                      <p>Esta chave será mostrada apenas uma vez. Copie-a agora e guarde em um local seguro.</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="apikey">Sua API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="apikey"
                        readOnly
                        value={newGeneratedKey}
                        className="font-mono text-sm"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCopyKey(newGeneratedKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={confirmCreateKey}>Confirmar</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys.map((apiKey) => (
        <Card key={apiKey.id} className="shadow-sm border">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                <CardTitle className="text-lg">{apiKey.name}</CardTitle>
              </div>
              {apiKey.id !== "default" && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteKey(apiKey.id)}
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
            <CardDescription>
              Criada em {formatDate(apiKey.created_at)}
              {apiKey.expires_at && ` • Expira em ${formatDate(apiKey.expires_at)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={apiKey.key}
                type="password"
                className="font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleCopyKey(apiKey.key)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              {apiKey.id === "default" && (
                <Button 
                  variant="outline" 
                  size="icon"
                  disabled
                  title="Não é possível gerar nova chave padrão"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default APIKeyManager;
