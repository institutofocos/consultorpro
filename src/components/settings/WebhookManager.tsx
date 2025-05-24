
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, X, RefreshCw, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  tables: string[];
  is_active: boolean;
  created_at: string;
}

const WebhookManager: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedEvents, setSelectedEvents] = useState<Record<string, boolean>>({
    INSERT: true,
    UPDATE: true,
    DELETE: true
  });
  const [selectedTables, setSelectedTables] = useState<Record<string, boolean>>({
    consultants: true,
    projects: true,
    services: true,
    clients: true,
    notes: true,
    project_stages: true,
    financial_transactions: true
  });

  // Load existing webhooks on component mount
  useEffect(() => {
    fetchWebhooks();
    
    // Set up automatic webhook processing every 30 seconds
    const interval = setInterval(() => {
      processWebhookQueue();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const callWebhookFunction = async (action: string, data: any = {}) => {
    console.log(`=== CALLING WEBHOOK FUNCTION: ${action} ===`, data);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('webhooks', {
        body: { action, ...data }
      });

      if (error) {
        console.error('Webhook function error:', error);
        throw error;
      }

      console.log('Webhook function result:', result);
      return result;
    } catch (error) {
      console.error('Error calling webhook function:', error);
      throw error;
    }
  };

  const fetchWebhooks = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching webhooks from database...');
      
      const result = await callWebhookFunction('list');
      
      if (result.success) {
        setWebhooks(result.webhooks);
        console.log('Webhooks loaded:', result.webhooks.length);
      } else {
        throw new Error(result.message || 'Failed to fetch webhooks');
      }
    } catch (error) {
      console.error("Error loading webhooks:", error);
      toast.error("Error loading webhooks", {
        description: "Failed to load registered webhooks",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processWebhookQueue = async () => {
    try {
      console.log('Processing webhook queue...');
      await callWebhookFunction('process');
    } catch (error) {
      console.error('Error processing webhook queue:', error);
    }
  };

  const handleRegisterWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Invalid URL", {
        description: "Please enter a valid webhook URL",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch (e) {
      toast.error("Invalid URL", {
        description: "Please enter a valid URL including http:// or https://",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    const events = Object.keys(selectedEvents).filter(key => selectedEvents[key]);
    const tables = Object.keys(selectedTables).filter(key => selectedTables[key]);

    if (events.length === 0) {
      toast.error("No events selected", {
        description: "Please select at least one event type",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    if (tables.length === 0) {
      toast.error("No tables selected", {
        description: "Please select at least one table",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Registering webhook:', { url: webhookUrl, events, tables });
      
      const result = await callWebhookFunction('register', {
        url: webhookUrl,
        events,
        tables
      });

      if (result.success) {
        toast.success("Webhook registered", {
          description: "Your webhook has been registered successfully",
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });

        // Clear form and reload webhooks
        setWebhookUrl('');
        await fetchWebhooks();
      } else {
        throw new Error(result.message || 'Registration failed');
      }
      
    } catch (error) {
      console.error("Error registering webhook:", error);
      toast.error("Registration failed", {
        description: "Failed to register webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      console.log('Deleting webhook:', webhookId);
      
      const result = await callWebhookFunction('delete', { id: webhookId });
      
      if (result.success) {
        toast.success("Webhook removed", {
          description: "The webhook has been removed successfully"
        });
        
        await fetchWebhooks();
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
      toast.error("Delete failed", {
        description: "Failed to delete webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    }
  };

  const testWebhook = async (url: string) => {
    try {
      console.log('Testing webhook:', url);
      
      toast.info("Testing webhook", {
        description: "Sending test payload to " + url
      });
      
      const result = await callWebhookFunction('test', { url });
      
      if (result.success) {
        toast.success("Test successful", {
          description: "Webhook test completed successfully",
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
      } else {
        toast.error("Test failed", {
          description: result.message || "Failed to test webhook",
          icon: <AlertCircle className="h-5 w-5 text-destructive" />
        });
      }
      
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast.error("Test failed", {
        description: "Failed to test webhook",
        icon: <AlertCircle className="h-5 w-5 text-destructive" />
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">Configure webhooks to receive notifications when data changes</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Register New Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input 
              id="webhook-url"
              type="url" 
              placeholder="https://your-endpoint.com/webhook" 
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Events</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-insert" 
                  checked={selectedEvents.INSERT}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, INSERT: !!checked})
                  }
                />
                <label 
                  htmlFor="event-insert" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Insert
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-update" 
                  checked={selectedEvents.UPDATE}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, UPDATE: !!checked})
                  }
                />
                <label 
                  htmlFor="event-update" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Update
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="event-delete" 
                  checked={selectedEvents.DELETE}
                  onCheckedChange={(checked) => 
                    setSelectedEvents({...selectedEvents, DELETE: !!checked})
                  }
                />
                <label 
                  htmlFor="event-delete" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Delete
                </label>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Tables</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-consultants" 
                  checked={selectedTables.consultants}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, consultants: !!checked})
                  }
                />
                <label 
                  htmlFor="table-consultants" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Consultants
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-projects" 
                  checked={selectedTables.projects}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, projects: !!checked})
                  }
                />
                <label 
                  htmlFor="table-projects" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Projects
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-services" 
                  checked={selectedTables.services}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, services: !!checked})
                  }
                />
                <label 
                  htmlFor="table-services" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Services
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-clients" 
                  checked={selectedTables.clients}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, clients: !!checked})
                  }
                />
                <label 
                  htmlFor="table-clients" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Clients
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-notes" 
                  checked={selectedTables.notes}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, notes: !!checked})
                  }
                />
                <label 
                  htmlFor="table-notes" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Notes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-stages" 
                  checked={selectedTables.project_stages}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, project_stages: !!checked})
                  }
                />
                <label 
                  htmlFor="table-stages" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Project Stages
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="table-financial" 
                  checked={selectedTables.financial_transactions}
                  onCheckedChange={(checked) => 
                    setSelectedTables({...selectedTables, financial_transactions: !!checked})
                  }
                />
                <label 
                  htmlFor="table-financial" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Financial Transactions
                </label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRegisterWebhook} 
            disabled={isLoading}
          >
            Register Webhook
          </Button>
        </CardFooter>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Registered Webhooks</CardTitle>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={processWebhookQueue}
            >
              <Play className="h-4 w-4 mr-2" />
              Process Queue
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={fetchWebhooks}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading webhooks...</p>
          ) : webhooks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No webhooks registered yet</p>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium break-all">{webhook.url}</p>
                    <div className="flex flex-wrap gap-2">
                      <p className="text-xs text-muted-foreground">
                        Events: {webhook.events.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tables: {webhook.tables.join(', ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {webhook.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => testWebhook(webhook.url)}
                    >
                      Test
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleDeleteWebhook(webhook.id)}
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookManager;
