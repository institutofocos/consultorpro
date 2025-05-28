
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimezoneSettings from './TimezoneSettings';
import WebhookManager from './WebhookManager';
import SystemLogs from './SystemLogs';
import UserManagement from './UserManagement';
import ProjectRulesManager from './ProjectRulesManager';
import APIKeyManager from './APIKeyManager';
import WhatsAppConnections from './WhatsAppConnections';
import SwaggerDocs from './SwaggerDocs';

const SettingsPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="project-rules">Regras</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="timezone">Horário</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="project-rules">
          <ProjectRulesManager />
        </TabsContent>

        <TabsContent value="api-keys">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppConnections />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManager />
        </TabsContent>

        <TabsContent value="timezone">
          <TimezoneSettings />
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs />
        </TabsContent>

        <TabsContent value="docs">
          <SwaggerDocs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
