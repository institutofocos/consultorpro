
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WebhookManager from './WebhookManager';
import SwaggerDocs from './SwaggerDocs';
import APIKeyManager from './APIKeyManager';
import UserManagement from './UserManagement';
import TimezoneSettings from './TimezoneSettings';
import SystemLogs from './SystemLogs';
import WebhookSettings from './WebhookSettings';
import WhatsAppConnections from './WhatsAppConnections';
import TagList from '@/components/tags/TagList';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Users, Clock, FileText, Zap, MessageSquare, Tag } from 'lucide-react';

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
          <TabsTrigger value="tags">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="timezone">
            <Clock className="h-4 w-4 mr-2" />
            Horário
          </TabsTrigger>
          <TabsTrigger value="connections">
            <MessageSquare className="h-4 w-4 mr-2" />
            Conexões
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
          {canViewUsers && (
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
          )}
          <TabsTrigger value="api_keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">
            <Zap className="h-4 w-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <div className="space-y-6">
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
            
            <WebhookSettings />
          </div>
        </TabsContent>

        <TabsContent value="tags">
          <TagList />
        </TabsContent>

        <TabsContent value="timezone">
          <TimezoneSettings />
        </TabsContent>

        <TabsContent value="connections">
          <WhatsAppConnections />
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs />
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
