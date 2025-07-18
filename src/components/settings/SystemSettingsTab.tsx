
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimezoneSettings from './TimezoneSettings';
import SystemMonitor from './SystemMonitor';
import SystemReset from './SystemReset';
import WebhookManagement from './WebhookManagement';

const SystemSettingsTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações e monitore o sistema
        </p>
      </div>
      
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="webhooks">Webhooks Consolidados</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="timezone">Timezone</TabsTrigger>
          <TabsTrigger value="reset">Reset</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <WebhookManagement />
        </TabsContent>

        <TabsContent value="monitor">
          <SystemMonitor />
        </TabsContent>

        <TabsContent value="timezone">
          <TimezoneSettings />
        </TabsContent>

        <TabsContent value="reset">
          <SystemReset />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettingsTab;
