
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Users, Building2, Link, Unlink, Check } from 'lucide-react';

interface UserLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string;
  };
}

interface Consultant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isLinked?: boolean;
}

interface Client {
  id: string;
  name: string;
  contact_name: string;
  email?: string;
  phone?: string;
  isLinked?: boolean;
}

interface UserLinks {
  consultant_id?: string;
  consultant_name?: string;
  client_id?: string;
  client_name?: string;
}

const UserLinkModal: React.FC<UserLinkModalProps> = ({ isOpen, onClose, user }) => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentLinks, setCurrentLinks] = useState<UserLinks>({});
  const [consultantSearch, setConsultantSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, user.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar consultores
      const { data: consultantsData, error: consultantsError } = await supabase
        .from('consultants')
        .select('id, name, email, phone');

      if (consultantsError) throw consultantsError;

      // Buscar clientes
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, contact_name, email, phone');

      if (clientsError) throw clientsError;

      // Buscar vínculos existentes
      const { data: linksData, error: linksError } = await supabase
        .rpc('get_user_links', { p_user_id: user.id });

      if (linksError) throw linksError;

      // Buscar todos os vínculos para marcar quais já estão em uso
      const { data: allConsultantLinks, error: allConsultantLinksError } = await supabase
        .from('user_consultant_links')
        .select('consultant_id');

      const { data: allClientLinks, error: allClientLinksError } = await supabase
        .from('user_client_links')
        .select('client_id');

      if (allConsultantLinksError) throw allConsultantLinksError;
      if (allClientLinksError) throw allClientLinksError;

      const linkedConsultantIds = new Set(allConsultantLinks?.map(link => link.consultant_id) || []);
      const linkedClientIds = new Set(allClientLinks?.map(link => link.client_id) || []);

      // Marcar consultores já vinculados
      const consultantsWithStatus = consultantsData?.map(consultant => ({
        ...consultant,
        isLinked: linkedConsultantIds.has(consultant.id)
      })) || [];

      // Marcar clientes já vinculados
      const clientsWithStatus = clientsData?.map(client => ({
        ...client,
        isLinked: linkedClientIds.has(client.id)
      })) || [];

      setConsultants(consultantsWithStatus);
      setClients(clientsWithStatus);
      
      // Definir vínculos atuais
      if (linksData && linksData.length > 0) {
        const userLinks = linksData[0];
        setCurrentLinks({
          consultant_id: userLinks.consultant_id,
          consultant_name: userLinks.consultant_name,
          client_id: userLinks.client_id,
          client_name: userLinks.client_name
        });
      } else {
        setCurrentLinks({});
      }

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkConsultant = async (consultantId: string) => {
    try {
      setLoading(true);

      // Se já há um vínculo, remover primeiro
      if (currentLinks.consultant_id) {
        const { error: deleteError } = await supabase
          .from('user_consultant_links')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Criar novo vínculo
      const { error } = await supabase
        .from('user_consultant_links')
        .insert({
          user_id: user.id,
          consultant_id: consultantId
        });

      if (error) throw error;

      toast.success('Consultor vinculado com sucesso!');
      fetchData(); // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao vincular consultor:', error);
      toast.error('Erro ao vincular consultor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClient = async (clientId: string) => {
    try {
      setLoading(true);

      // Se já há um vínculo, remover primeiro
      if (currentLinks.client_id) {
        const { error: deleteError } = await supabase
          .from('user_client_links')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      // Criar novo vínculo
      const { error } = await supabase
        .from('user_client_links')
        .insert({
          user_id: user.id,
          client_id: clientId
        });

      if (error) throw error;

      toast.success('Cliente vinculado com sucesso!');
      fetchData(); // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao vincular cliente:', error);
      toast.error('Erro ao vincular cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkConsultant = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_consultant_links')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Consultor desvinculado com sucesso!');
      fetchData(); // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao desvincular consultor:', error);
      toast.error('Erro ao desvincular consultor: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkClient = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('user_client_links')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Cliente desvinculado com sucesso!');
      fetchData(); // Recarregar dados

    } catch (error: any) {
      console.error('Erro ao desvincular cliente:', error);
      toast.error('Erro ao desvincular cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredConsultants = consultants.filter(consultant =>
    consultant.name.toLowerCase().includes(consultantSearch.toLowerCase()) ||
    consultant.email.toLowerCase().includes(consultantSearch.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.contact_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vincular Usuário: {user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status atual dos vínculos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Status Atual dos Vínculos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consultor:</span>
                {currentLinks.consultant_name ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{currentLinks.consultant_name}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUnlinkConsultant}
                      disabled={loading}
                    >
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline">Não vinculado</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                {currentLinks.client_name ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{currentLinks.client_name}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUnlinkClient}
                      disabled={loading}
                    >
                      <Unlink className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline">Não vinculado</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="consultants" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="consultants" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Consultores
              </TabsTrigger>
              <TabsTrigger value="clients" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Clientes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="consultants" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar consultor por nome ou email..."
                  value={consultantSearch}
                  onChange={(e) => setConsultantSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredConsultants.map((consultant) => (
                  <Card key={consultant.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{consultant.name}</span>
                          {consultant.isLinked && consultant.id !== currentLinks.consultant_id && (
                            <Badge variant="secondary" className="text-xs">Já vinculado</Badge>
                          )}
                          {consultant.id === currentLinks.consultant_id && (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Vinculado a este usuário
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{consultant.email}</p>
                        {consultant.phone && (
                          <p className="text-sm text-muted-foreground">{consultant.phone}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkConsultant(consultant.id)}
                        disabled={loading || (consultant.isLinked && consultant.id !== currentLinks.consultant_id)}
                        variant={consultant.id === currentLinks.consultant_id ? "secondary" : "default"}
                      >
                        {consultant.id === currentLinks.consultant_id ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Vinculado
                          </>
                        ) : (
                          <>
                            <Link className="h-3 w-3 mr-1" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {filteredConsultants.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Nenhum consultor encontrado com os critérios de busca.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>

            <TabsContent value="clients" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente por nome ou email..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredClients.map((client) => (
                  <Card key={client.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.name}</span>
                          {client.isLinked && client.id !== currentLinks.client_id && (
                            <Badge variant="secondary" className="text-xs">Já vinculado</Badge>
                          )}
                          {client.id === currentLinks.client_id && (
                            <Badge variant="default" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Vinculado a este usuário
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">Contato: {client.contact_name}</p>
                        {client.email && (
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleLinkClient(client.id)}
                        disabled={loading || (client.isLinked && client.id !== currentLinks.client_id)}
                        variant={client.id === currentLinks.client_id ? "secondary" : "default"}
                      >
                        {client.id === currentLinks.client_id ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Vinculado
                          </>
                        ) : (
                          <>
                            <Link className="h-3 w-3 mr-1" />
                            Vincular
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
                
                {filteredClients.length === 0 && (
                  <Alert>
                    <AlertDescription>
                      Nenhum cliente encontrado com os critérios de busca.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserLinkModal;
