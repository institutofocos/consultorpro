
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
  key_value: string;
  description?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  created_by?: string;
  last_used_at?: string;
  usage_count?: number;
}

const APIKeyManager: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        toast({
          title: "Erro ao carregar chaves",
          description: "Não foi possível carregar as chaves de API",
          variant: "destructive"
        });
        return;
      }

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: "Erro ao carregar chaves",
        description: "Erro inesperado ao carregar as chaves de API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNewApiKey = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_api_key');
      
      if (error) {
        console.error('Error generating API key:', error);
        toast({
          title: "Erro ao gerar chave",
          description: "Não foi possível gerar uma nova chave de API",
          variant: "destructive"
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: "Erro ao gerar chave",
        description: "Erro inesperado ao gerar a chave de API",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Chave copiada",
      description: "A chave da API foi copiada para a área de transferência",
    });
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Nome inválido",
        description: "Por favor, forneça um nome para a chave",
        variant: "destructive"
      });
      return;
    }
    
    const generatedKey = await generateNewApiKey();
    if (generatedKey) {
      setNewGeneratedKey(generatedKey);
    }
  };

  const confirmCreateKey = async () => {
    if (!newKeyName || !newGeneratedKey) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar uma chave de API",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('api_keys')
        .insert({
          name: newKeyName,
          key_value: newGeneratedKey,
          description: newKeyDescription || null,
          created_by: user.id
        });

      if (error) {
        console.error('Error creating API key:', error);
        toast({
          title: "Erro ao criar chave",
          description: "Não foi possível salvar a chave de API",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Chave criada",
        description: "Nova chave de API criada com sucesso",
      });
      
      // Reset state
      setNewKeyName("");
      setNewKeyDescription("");
      setNewGeneratedKey(null);
      setIsCreateDialogOpen(false);
      
      // Refresh the list
      await fetchApiKeys();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Erro ao criar chave",
        description: "Erro inesperado ao criar a chave de API",
        variant: "destructive"
      });
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting API key:', error);
        toast({
          title: "Erro ao excluir chave",
          description: "Não foi possível excluir a chave de API",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Chave excluída",
        description: "A chave de API foi excluída com sucesso",
      });
      
      // Refresh the list
      await fetchApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Erro ao excluir chave",
        description: "Erro inesperado ao excluir a chave de API",
        variant: "destructive"
      });
    }
  };

  const toggleKeyStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating API key status:', error);
        toast({
          title: "Erro ao atualizar chave",
          description: "Não foi possível atualizar o status da chave",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Status atualizado",
        description: `Chave ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`,
      });
      
      // Refresh the list
      await fetchApiKeys();
    } catch (error) {
      console.error('Error updating API key status:', error);
      toast({
        title: "Erro ao atualizar chave",
        description: "Erro inesperado ao atualizar o status da chave",
        variant: "destructive"
      });
    }
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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Gerenciador de API Keys</h1>
          <p className="text-muted-foreground">Carregando chaves de API...</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <RefreshCcw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
                    <Label htmlFor="name">Nome*</Label>
                    <Input
                      id="name"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ex: Aplicação Web Principal"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Input
                      id="description"
                      value={newKeyDescription}
                      onChange={(e) => setNewKeyDescription(e.target.value)}
                      placeholder="Ex: Chave para integração com sistema de terceiros"
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
                  <Button onClick={confirmCreateKey}>Salvar Chave</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma API Key encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira chave de API para começar a usar o sistema.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar primeira API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="shadow-sm border">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apiKey.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {apiKey.is_active ? 'Ativa' : 'Inativa'}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleKeyStatus(apiKey.id, apiKey.is_active)}
                      title={apiKey.is_active ? 'Desativar chave' : 'Ativar chave'}
                    >
                      {apiKey.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteKey(apiKey.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  <div className="space-y-1">
                    <div>Criada em {formatDate(apiKey.created_at)}</div>
                    {apiKey.description && <div className="text-sm">{apiKey.description}</div>}
                    {apiKey.last_used_at && (
                      <div className="text-xs text-muted-foreground">
                        Último uso: {formatDate(apiKey.last_used_at)} 
                        {apiKey.usage_count && ` (${apiKey.usage_count} usos)`}
                      </div>
                    )}
                    {apiKey.expires_at && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        Expira em: {formatDate(apiKey.expires_at)}
                      </div>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={apiKey.key_value}
                    type="password"
                    className="font-mono"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handleCopyKey(apiKey.key_value)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default APIKeyManager;
