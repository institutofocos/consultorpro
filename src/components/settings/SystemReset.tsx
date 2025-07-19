
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ResetOption {
  id: string;
  label: string;
  description: string;
  table: string;
}

const resetOptions: ResetOption[] = [
  { id: 'consultants', label: 'Consultores', description: 'Remover todos os consultores cadastrados', table: 'consultants' },
  { id: 'projects', label: 'Projetos', description: 'Remover todos os projetos e etapas', table: 'projects' },
  { id: 'services', label: 'Serviços', description: 'Remover todos os serviços cadastrados', table: 'services' },
  { id: 'clients', label: 'Clientes', description: 'Remover todos os clientes cadastrados', table: 'clients' },
  { id: 'financial', label: 'Financeiro', description: 'Remover todas as transações financeiras', table: 'financial_transactions' },
  { id: 'webhooks', label: 'Webhooks', description: 'Remover todos os webhooks configurados', table: 'webhooks' },
  { id: 'tags', label: 'Tags', description: 'Remover todas as tags personalizadas', table: 'tags' }
];

const SystemReset = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pin, setPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const resetData = async () => {
    if (pin !== '9136') {
      toast.error('PIN incorreto. Verifique e tente novamente.');
      return;
    }

    if (selectedItems.length === 0) {
      toast.error('Selecione pelo menos um item para resetar.');
      return;
    }

    setIsResetting(true);

    try {
      for (const itemId of selectedItems) {
        const option = resetOptions.find(opt => opt.id === itemId);
        if (!option) continue;

        console.log(`Iniciando reset de: ${option.label}`);

        switch (itemId) {
          case 'consultants':
            // Primeiro remover vínculos de usuários
            const { error: userLinksError } = await supabase.from('user_consultant_links').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (userLinksError) console.error('Erro ao deletar vínculos:', userLinksError);
            
            // Remover relações de serviços
            const { error: servicesError } = await supabase.from('consultant_services').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (servicesError) console.error('Erro ao deletar serviços de consultores:', servicesError);
            
            // Remover documentos
            const { error: docsError } = await supabase.from('consultant_documents').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (docsError) console.error('Erro ao deletar documentos:', docsError);
            
            // Remover consultores
            const { error: consultantsError } = await supabase.from('consultants').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (consultantsError) {
              console.error('Erro ao deletar consultores:', consultantsError);
              throw new Error('Erro ao deletar consultores: ' + consultantsError.message);
            }
            break;

          case 'projects':
            // Remover etapas primeiro
            const { error: stagesError } = await supabase.from('project_stages').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (stagesError) console.error('Erro ao deletar etapas:', stagesError);
            
            // Remover histórico
            const { error: historyError } = await supabase.from('project_history').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (historyError) console.error('Erro ao deletar histórico:', historyError);
            
            // Remover relações de tags
            const { error: tagRelsError } = await supabase.from('project_tag_relations').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (tagRelsError) console.error('Erro ao deletar relações de tags:', tagRelsError);
            
            // Remover tarefas gantt
            const { error: ganttError } = await supabase.from('gantt_tasks').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (ganttError) console.error('Erro ao deletar tarefas gantt:', ganttError);
            
            // Remover projetos
            const { error: projectsError } = await supabase.from('projects').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (projectsError) {
              console.error('Erro ao deletar projetos:', projectsError);
              throw new Error('Erro ao deletar projetos: ' + projectsError.message);
            }
            break;

          case 'services':
            // Remover relações de tags de serviços
            const { error: serviceTagsError } = await supabase.from('service_tags').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (serviceTagsError) console.error('Erro ao deletar tags de serviços:', serviceTagsError);
            
            // Remover serviços
            const { error: servicesDelError } = await supabase.from('services').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (servicesDelError) {
              console.error('Erro ao deletar serviços:', servicesDelError);
              throw new Error('Erro ao deletar serviços: ' + servicesDelError.message);
            }
            break;

          case 'clients':
            // Primeiro remover vínculos de usuários
            const { error: clientLinksError } = await supabase.from('user_client_links').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (clientLinksError) console.error('Erro ao deletar vínculos de clientes:', clientLinksError);
            
            // Remover clientes
            const { error: clientsError } = await supabase.from('clients').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (clientsError) {
              console.error('Erro ao deletar clientes:', clientsError);
              throw new Error('Erro ao deletar clientes: ' + clientsError.message);
            }
            break;

          case 'financial':
            // Remover contas a pagar
            const { error: payableError } = await supabase.from('accounts_payable').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (payableError) console.error('Erro ao deletar contas a pagar:', payableError);
            
            // Remover contas a receber
            const { error: receivableError } = await supabase.from('accounts_receivable').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (receivableError) console.error('Erro ao deletar contas a receber:', receivableError);
            
            // Remover transações manuais
            const { error: manualError } = await supabase.from('manual_transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (manualError) console.error('Erro ao deletar transações manuais:', manualError);
            
            // Remover transações financeiras
            const { error: financialError } = await supabase.from('financial_transactions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (financialError) console.error('Erro ao deletar transações financeiras:', financialError);
            break;

          case 'webhooks':
            const { error: webhooksError } = await supabase.from('webhooks').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (webhooksError) {
              console.error('Erro ao deletar webhooks:', webhooksError);
              throw new Error('Erro ao deletar webhooks: ' + webhooksError.message);
            }
            break;

          case 'tags':
            // Remover relações de tags de etapas
            const { error: stageTagsError } = await supabase.from('stage_tag_relations').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (stageTagsError) console.error('Erro ao deletar relações de tags de etapas:', stageTagsError);
            
            // Remover relações de tags de projetos
            const { error: projectTagsError } = await supabase.from('project_tag_relations').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (projectTagsError) console.error('Erro ao deletar relações de tags de projetos:', projectTagsError);
            
            // Remover relações de tags de serviços
            const { error: serviceTagRelsError } = await supabase.from('service_tags').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (serviceTagRelsError) console.error('Erro ao deletar relações de tags de serviços:', serviceTagRelsError);
            
            // Remover tags de projetos
            const { error: projTagsError } = await supabase.from('project_tags').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (projTagsError) console.error('Erro ao deletar tags de projetos:', projTagsError);
            
            // Remover tags gerais
            const { error: tagsError } = await supabase.from('tags').delete().gte('id', '00000000-0000-0000-0000-000000000000');
            if (tagsError) console.error('Erro ao deletar tags:', tagsError);
            break;
        }

        console.log(`Reset de ${option.label} concluído`);
      }

      toast.success(`Reset realizado com sucesso! ${selectedItems.length} categoria(s) foram resetadas.`);
      setIsOpen(false);
      setSelectedItems([]);
      setPin('');
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      toast.error(`Erro ao resetar dados: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Reset do Sistema
        </CardTitle>
        <CardDescription>
          Resetar categorias específicas de dados do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Resetar Sistema
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Reset Personalizado do Sistema
              </DialogTitle>
              <DialogDescription>
                Selecione as categorias que deseja resetar. Esta ação é irreversível!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium">Categorias para Reset:</Label>
                <div className="grid grid-cols-1 gap-3">
                  {resetOptions.map((option) => (
                    <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={option.id}
                        checked={selectedItems.includes(option.id)}
                        onCheckedChange={() => handleItemToggle(option.id)}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={option.id} 
                          className="text-sm font-medium cursor-pointer"
                        >
                          {option.label}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin">PIN de Confirmação:</Label>
                <Input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Digite o PIN para confirmar"
                  maxLength={4}
                />
                <p className="text-xs text-muted-foreground">
                  Digite o PIN de segurança para confirmar a operação
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700">Atenção!</span>
                </div>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• Esta ação é irreversível e apagará permanentemente os dados selecionados</li>
                  <li>• Apenas dados inseridos pelo usuário serão removidos</li>
                  <li>• Configurações do sistema e estrutura serão preservadas</li>
                  <li>• Recomendamos fazer backup antes de prosseguir</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isResetting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={resetData}
                  disabled={isResetting || selectedItems.length === 0 || !pin}
                >
                  {isResetting ? 'Resetando...' : 'Confirmar Reset'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SystemReset;
