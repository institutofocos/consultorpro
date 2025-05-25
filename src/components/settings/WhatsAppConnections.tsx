
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, QrCode, RefreshCw, Trash2, MessageSquare, Settings } from 'lucide-react';
import { 
  fetchWhatsAppConnections, 
  createWhatsAppConnection, 
  updateWhatsAppConnection,
  deleteWhatsAppConnection,
  generateQRCode,
  checkConnectionStatus,
  type WhatsAppConnection 
} from '@/integrations/supabase/whatsapp';

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000000";

const WhatsAppConnections: React.FC = () => {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newConnectionDialog, setNewConnectionDialog] = useState(false);
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    instance_name: '',
    evolution_api_url: '',
    evolution_api_key: '',
    export_from_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setIsLoading(true);
      const data = await fetchWhatsAppConnections();
      setConnections(data);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as conexões WhatsApp."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async () => {
    try {
      if (!formData.instance_name || !formData.evolution_api_url || !formData.evolution_api_key) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios."
        });
        return;
      }

      setIsLoading(true);
      await createWhatsAppConnection({
        user_id: TEMP_USER_ID,
        instance_name: formData.instance_name,
        evolution_api_url: formData.evolution_api_url,
        evolution_api_key: formData.evolution_api_key,
        export_from_date: formData.export_from_date
      });

      toast({
        title: "Conexão criada",
        description: "Conexão WhatsApp criada com sucesso!"
      });

      setNewConnectionDialog(false);
      setFormData({
        instance_name: '',
        evolution_api_url: '',
        evolution_api_key: '',
        export_from_date: new Date().toISOString().split('T')[0]
      });
      loadConnections();
    } catch (error) {
      console.error('Erro ao criar conexão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar a conexão."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQR = async (connection: WhatsAppConnection) => {
    try {
      setIsLoading(true);
      const qrCode = await generateQRCode(connection);
      setQrCodeData(qrCode);
      setSelectedConnection(connection);
      setQrCodeDialog(true);
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o QR code."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckStatus = async (connection: WhatsAppConnection) => {
    try {
      setIsLoading(true);
      const status = await checkConnectionStatus(connection);
      
      await updateWhatsAppConnection(connection.id, { status });
      
      toast({
        title: "Status atualizado",
        description: `Status da conexão: ${status}`
      });
      
      loadConnections();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConnection = async (connection: WhatsAppConnection) => {
    try {
      setIsLoading(true);
      await deleteWhatsAppConnection(connection.id);
      
      toast({
        title: "Conexão removida",
        description: "Conexão WhatsApp removida com sucesso!"
      });
      
      loadConnections();
    } catch (error) {
      console.error('Erro ao remover conexão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a conexão."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'disconnected': return 'Desconectado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Conexões WhatsApp</h2>
          <p className="text-muted-foreground">
            Configure conexões com WhatsApp através da API Evolution
          </p>
        </div>
        <Button onClick={() => setNewConnectionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Conexão
        </Button>
      </div>

      <div className="grid gap-4">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{connection.instance_name}</h3>
                    <Badge className={getStatusColor(connection.status)}>
                      {getStatusText(connection.status)}
                    </Badge>
                  </div>
                  {connection.phone_number && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Telefone: {connection.phone_number}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    API: {connection.evolution_api_url}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Exportar de: {new Date(connection.export_from_date).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateQR(connection)}
                    disabled={isLoading}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCheckStatus(connection)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteConnection(connection)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {connections.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma conexão configurada</h3>
              <p className="text-muted-foreground mb-4">
                Configure uma conexão com WhatsApp para sincronizar conversas
              </p>
              <Button onClick={() => setNewConnectionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira conexão
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog para nova conexão */}
      <Dialog open={newConnectionDialog} onOpenChange={setNewConnectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância *</Label>
              <Input
                id="instance_name"
                value={formData.instance_name}
                onChange={(e) => setFormData(prev => ({ ...prev, instance_name: e.target.value }))}
                placeholder="ex: whatsapp-principal"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evolution_api_url">URL da API Evolution *</Label>
              <Input
                id="evolution_api_url"
                value={formData.evolution_api_url}
                onChange={(e) => setFormData(prev => ({ ...prev, evolution_api_url: e.target.value }))}
                placeholder="https://api.evolution.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="evolution_api_key">Chave da API *</Label>
              <Input
                id="evolution_api_key"
                type="password"
                value={formData.evolution_api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, evolution_api_key: e.target.value }))}
                placeholder="Sua chave da API Evolution"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="export_from_date">Exportar mensagens a partir de</Label>
              <Input
                id="export_from_date"
                type="date"
                value={formData.export_from_date}
                onChange={(e) => setFormData(prev => ({ ...prev, export_from_date: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewConnectionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConnection} disabled={isLoading}>
              Criar Conexão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para QR Code */}
      <Dialog open={qrCodeDialog} onOpenChange={setQrCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Escaneie o QR code com seu WhatsApp para conectar
            </p>
            
            {qrCodeData && (
              <div className="flex justify-center">
                <img 
                  src={`data:image/png;base64,${qrCodeData}`} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              Instância: {selectedConnection?.instance_name}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setQrCodeDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WhatsAppConnections;
