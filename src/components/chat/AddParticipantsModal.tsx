
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { fetchConsultants } from '@/integrations/supabase/consultants';
import { addChatParticipant } from '@/integrations/supabase/chat';

interface AddParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string | null;
  roomName?: string;
  onParticipantsAdded?: () => void;
}

interface Consultant {
  id: string;
  name: string;
  email: string;
}

const AddParticipantsModal: React.FC<AddParticipantsModalProps> = ({
  isOpen,
  onClose,
  roomId,
  roomName,
  onParticipantsAdded
}) => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultants, setSelectedConsultants] = useState<Set<string>>(new Set());
  const [defaultRole, setDefaultRole] = useState<string>('consultor');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingConsultants, setIsLoadingConsultants] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadConsultants();
      setSelectedConsultants(new Set());
      setDefaultRole('consultor');
    }
  }, [isOpen]);

  const loadConsultants = async () => {
    setIsLoadingConsultants(true);
    try {
      const data = await fetchConsultants();
      setConsultants(data);
    } catch (error) {
      console.error('Erro ao carregar consultores:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os consultores."
      });
    } finally {
      setIsLoadingConsultants(false);
    }
  };

  const handleConsultantToggle = (consultantId: string) => {
    const newSelected = new Set(selectedConsultants);
    if (newSelected.has(consultantId)) {
      newSelected.delete(consultantId);
    } else {
      newSelected.add(consultantId);
    }
    setSelectedConsultants(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedConsultants.size === consultants.length) {
      setSelectedConsultants(new Set());
    } else {
      setSelectedConsultants(new Set(consultants.map(c => c.id)));
    }
  };

  const handleSubmit = async () => {
    if (!roomId || selectedConsultants.size === 0) {
      toast({
        variant: "destructive",
        title: "Seleção obrigatória",
        description: "Selecione pelo menos um consultor para adicionar."
      });
      return;
    }

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const consultantId of selectedConsultants) {
        try {
          const consultant = consultants.find(c => c.id === consultantId);
          if (consultant) {
            await addChatParticipant(
              roomId,
              consultantId,
              consultant.name,
              defaultRole
            );
            successCount++;
          }
        } catch (error) {
          console.error(`Erro ao adicionar consultor ${consultantId}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "Participantes adicionados",
          description: `${successCount} participante(s) adicionado(s) com sucesso!${errorCount > 0 ? ` (${errorCount} erro(s))` : ''}`
        });

        if (onParticipantsAdded) {
          onParticipantsAdded();
        }
        
        onClose();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível adicionar nenhum participante."
        });
      }
    } catch (error) {
      console.error('Erro geral ao adicionar participantes:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro inesperado ao adicionar participantes."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Adicionar Participantes
          </DialogTitle>
          {roomName && (
            <p className="text-sm text-muted-foreground">
              Sala: {roomName}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-role">Função padrão</Label>
            <Select value={defaultRole} onValueChange={setDefaultRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultor">Consultor</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="observer">Observador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Consultores disponíveis</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={isLoadingConsultants}
              >
                {selectedConsultants.size === consultants.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            </div>

            <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
              {isLoadingConsultants ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Carregando consultores...
                </div>
              ) : consultants.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum consultor disponível
                </div>
              ) : (
                <div className="space-y-2">
                  {consultants.map((consultant) => (
                    <div key={consultant.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={consultant.id}
                        checked={selectedConsultants.has(consultant.id)}
                        onCheckedChange={() => handleConsultantToggle(consultant.id)}
                      />
                      <Label 
                        htmlFor={consultant.id} 
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        {consultant.name}
                        <span className="text-muted-foreground ml-1">
                          ({consultant.email})
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedConsultants.size > 0 && (
            <div className="text-sm text-muted-foreground">
              {selectedConsultants.size} consultor(es) selecionado(s)
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || selectedConsultants.size === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              `Adicionar ${selectedConsultants.size} participante(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddParticipantsModal;
