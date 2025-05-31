
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
  { id: 'users', label: 'Usuários', description: 'Remover perfis de usuários (exceto admin)', table: 'user_profiles' },
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

        switch (itemId) {
          case 'consultants':
            await supabase.from('consultant_services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('consultant_documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('consultants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'projects':
            await supabase.from('project_stages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('project_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('project_tag_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('gantt_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'services':
            await supabase.from('service_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'clients':
            await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'financial':
            await supabase.from('accounts_payable').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('accounts_receivable').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('manual_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('financial_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'users':
            await supabase.from('user_profiles').delete().neq('role', 'admin');
            break;

          case 'webhooks':
            await supabase.from('webhooks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;

          case 'tags':
            await supabase.from('stage_tag_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('project_tag_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('service_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('project_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            await supabase.from('tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            break;
        }
      }

      toast.success(`Reset realizado com sucesso! ${selectedItems.length} categoria(s) foram resetadas.`);
      setIsOpen(false);
      setSelectedItems([]);
      setPin('');
    } catch (error) {
      console.error('Erro ao resetar dados:', error);
      toast.error('Erro ao resetar dados. Tente novamente.');
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
