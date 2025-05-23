
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebhookManager from './WebhookManager';
import SwaggerDocs from './SwaggerDocs';
import APIKeyManager from './APIKeyManager';
import UserManagement from './UserManagement';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("general");
  const { checkPermission } = useAuth();
  const canViewUsers = checkPermission('settings', 'view');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações do sistema</p>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            Geral
          </TabsTrigger>
          {canViewUsers && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
          )}
          <TabsTrigger value="api_keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">Recurso em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {canViewUsers && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
        
        <TabsContent value="api_keys">
          <APIKeyManager />
        </TabsContent>
        
        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>
        
        <TabsContent value="api">
          <SwaggerDocs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
