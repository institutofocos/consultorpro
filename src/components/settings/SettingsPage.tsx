
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimezoneSettings from './TimezoneSettings';
import WebhookManagement from './WebhookManagement';
import ProjectRulesManager from './ProjectRulesManager';
import APIKeyManager from './APIKeyManager';
import SwaggerDocs from './SwaggerDocs';
import SystemReset from './SystemReset';
import TagList from '../tags/TagList';
import FinancialSettingsTab from './FinancialSettingsTab';
import UserManagement from './UserManagement';
import AccessProfilesManagement from './AccessProfilesManagement';

const SettingsPage = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
      </div>

      <Tabs defaultValue="project-rules" className="space-y-4">
        <TabsList className="grid grid-cols-3 lg:grid-cols-10">
          <TabsTrigger value="project-rules">Regras</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="timezone">Horário</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="access-profiles">Perfis</TabsTrigger>
          <TabsTrigger value="docs">Docs</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="project-rules">
          <ProjectRulesManager />
        </TabsContent>

        <TabsContent value="api-keys">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookManagement />
        </TabsContent>

        <TabsContent value="timezone">
          <TimezoneSettings />
        </TabsContent>

        <TabsContent value="tags">
          <TagList />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialSettingsTab />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="access-profiles">
          <AccessProfilesManagement />
        </TabsContent>

        <TabsContent value="docs">
          <SwaggerDocs />
        </TabsContent>

        <TabsContent value="system">
          <SystemReset />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
