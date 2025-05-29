
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Brazilian date formatting utility - simplified for Deno
const formatDateBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    // Format to Brazilian date format DD/MM/YYYY
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Brazilian datetime formatting utility - simplified for Deno  
const formatDateTimeBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    // Format to Brazilian datetime format DD/MM/YYYY HH:mm
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Parse the request body once
    const requestBody = await req.json();
    const { action } = requestBody;
    console.log(`=== WEBHOOK ACTION: ${action} ===`);
    
    // Handle different webhook actions
    if (action === "register") {
      const { url, events, tables } = requestBody;
      console.log('Registering webhook:', { url, events, tables });
      
      // Validate input
      if (!url || !events || !tables || events.length === 0 || tables.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "URL, events, and tables are required" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      // Insert webhook into database
      const { data, error } = await supabaseClient
        .from('webhooks')
        .insert({
          url,
          events,
          tables,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error registering webhook:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: error.message 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      console.log('Webhook registered successfully:', data);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook registered successfully",
          webhook: data
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "list") {
      console.log('Fetching webhooks list');
      
      const { data, error } = await supabaseClient
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching webhooks:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: error.message 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      console.log('Webhooks fetched:', data?.length || 0);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          webhooks: data || []
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "test") {
      const { url } = requestBody;
      console.log('Testing webhook:', url);
      
      if (!url) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "URL is required for testing" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      const currentDate = new Date();
      const testPayload = {
        event_type: 'TEST',
        table_name: 'test',
        timestamp: formatDateTimeBR(currentDate),
        data: {
          message: 'Este é um payload de teste do webhook',
          test: true,
          data_sistema: formatDateBR(currentDate),
          hora_sistema: formatDateTimeBR(currentDate),
          project: {
            id: 'test-project-id',
            name: 'Projeto de Teste',
            status: 'active',
            created_at: formatDateBR(currentDate),
            due_date: formatDateBR(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000))
          },
          client: {
            id: 'test-client-id',
            name: 'Cliente de Teste',
            email: 'cliente@teste.com',
            created_at: formatDateBR(currentDate)
          },
          consultant: {
            id: 'test-consultant-id',
            name: 'Consultor de Teste',
            email: 'consultor@teste.com',
            created_at: formatDateBR(currentDate)
          }
        }
      };

      try {
        console.log('Sending test payload to:', url);
        console.log('Test payload:', JSON.stringify(testPayload, null, 2));
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Webhook-Test/1.0'
          },
          body: JSON.stringify(testPayload)
        });

        const success = response.ok;
        let responseText = '';
        
        try {
          responseText = await response.text();
        } catch (e) {
          responseText = 'Unable to read response body';
        }
        
        console.log('Webhook test result:', { 
          success, 
          status: response.status, 
          statusText: response.statusText,
          responseBody: responseText
        });
        
        return new Response(
          JSON.stringify({ 
            success, 
            message: success ? "Teste enviado com sucesso" : `Teste falhou: ${response.status} ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            responseBody: responseText
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      } catch (error) {
        console.error('Error testing webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Teste falhou: " + errorMessage,
            error: errorMessage
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }
    }
    
    if (action === "delete") {
      const { id } = requestBody;
      console.log('Deleting webhook:', id);
      
      if (!id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Webhook ID is required" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400 
          }
        );
      }
      
      const { error } = await supabaseClient
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting webhook:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: error.message 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      console.log('Webhook deleted successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook deleted successfully" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "process") {
      console.log('Processing webhook queue');
      
      // Fetch pending webhook logs with webhook details
      const { data: logs, error } = await supabaseClient
        .from('webhook_logs')
        .select(`
          *,
          webhooks!inner(*)
        `)
        .eq('success', false)
        .lt('attempt_count', 3)
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Error fetching webhook logs:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: error.message 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }

      console.log(`Processing ${logs?.length || 0} webhook logs`);

      let processedCount = 0;
      let successCount = 0;

      for (const log of logs || []) {
        try {
          console.log(`Processing webhook log ${log.id} for ${log.webhooks.url}`);
          
          // Enrich payload with additional context for better webhook data
          const enrichedPayload = await enrichWebhookPayload(log, supabaseClient);
          
          const response = await fetch(log.webhooks.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Supabase-Webhook/1.0',
              'X-Webhook-Event': log.event_type,
              'X-Webhook-Table': log.table_name,
              'X-Webhook-Timestamp': log.created_at,
              ...(log.webhooks.secret_key && {
                'Authorization': `Bearer ${log.webhooks.secret_key}`,
                'X-Webhook-Secret': log.webhooks.secret_key
              })
            },
            body: JSON.stringify(enrichedPayload)
          });

          const success = response.ok;
          const responseBody = await response.text();

          // Update log
          await supabaseClient
            .from('webhook_logs')
            .update({
              success,
              response_status: response.status,
              response_body: responseBody.substring(0, 1000), // Limit size
              attempt_count: log.attempt_count + 1
            })
            .eq('id', log.id);

          processedCount++;
          if (success) successCount++;

          console.log(`Webhook ${log.id} processed: ${success ? 'SUCCESS' : 'FAILED'} (${response.status})`);
        } catch (error) {
          console.error(`Error processing webhook ${log.id}:`, error);
          
          // Update attempt count
          await supabaseClient
            .from('webhook_logs')
            .update({
              attempt_count: log.attempt_count + 1,
              response_body: `Error: ${error.message}`
            })
            .eq('id', log.id);
          
          processedCount++;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processados ${processedCount} webhooks (${successCount} sucessos)`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "trigger_test") {
      console.log('Triggering comprehensive test webhook events');
      
      const currentDate = new Date();
      
      // Create comprehensive test data with Brazilian date formatting
      const testClientData = {
        id: crypto.randomUUID(),
        name: 'Cliente de Teste Webhook',
        contact_name: 'João Silva',
        email: 'joao@clienteteste.com',
        phone: '(11) 99999-9999',
        created_at: formatDateTimeBR(currentDate)
      };

      const testConsultantData = {
        id: crypto.randomUUID(),
        name: 'Consultor de Teste Webhook',
        email: 'consultor@teste.com',
        phone: '(11) 88888-8888',
        commission_percentage: 15,
        hours_per_month: 160,
        created_at: formatDateTimeBR(currentDate)
      };

      const testProjectData = {
        id: crypto.randomUUID(),
        name: 'Projeto de Teste Webhook',
        description: 'Este é um projeto criado para testar webhooks',
        status: 'planned',
        total_value: 5000,
        client_id: testClientData.id,
        main_consultant_id: testConsultantData.id,
        created_at: formatDateTimeBR(currentDate),
        start_date: formatDateBR(currentDate),
        due_date: formatDateBR(new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000))
      };

      const testStageData = {
        id: crypto.randomUUID(),
        project_id: testProjectData.id,
        name: 'Etapa de Teste',
        description: 'Etapa criada para teste de webhook',
        value: 1000,
        completed: false,
        created_at: formatDateTimeBR(currentDate),
        due_date: formatDateBR(new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000))
      };

      // Get active webhooks
      const { data: webhooks } = await supabaseClient
        .from('webhooks')
        .select('*')
        .eq('is_active', true);

      if (!webhooks || webhooks.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Nenhum webhook ativo encontrado" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      }

      // Create webhook logs for all entity types
      const testEntities = [
        { table: 'clients', data: testClientData },
        { table: 'consultants', data: testConsultantData },
        { table: 'projects', data: testProjectData },
        { table: 'project_stages', data: testStageData }
      ];

      let logsCreated = 0;

      for (const webhook of webhooks) {
        for (const entity of testEntities) {
          if (webhook.tables.includes(entity.table) && webhook.events.includes('INSERT')) {
            await supabaseClient
              .from('webhook_logs')
              .insert({
                webhook_id: webhook.id,
                event_type: 'INSERT',
                table_name: entity.table,
                payload: entity.data
              });
            logsCreated++;
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${logsCreated} eventos de teste criados para ${webhooks.length} webhook(s) ativos` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "setup_triggers") {
      console.log('Setting up automatic database triggers for webhook system');
      
      const tablesToMonitor = [
        'consultants',
        'clients', 
        'projects',
        'services',
        'project_stages',
        'notes',
        'financial_transactions',
        'accounts_payable',
        'accounts_receivable',
        'manual_transactions',
        'chat_messages',
        'chat_rooms',
        'system_settings'
      ];

      let results = [];

      try {
        // First, ensure the trigger function exists and is updated
        const triggerFunctionSQL = `
          CREATE OR REPLACE FUNCTION public.trigger_webhooks()
          RETURNS trigger
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $function$
          DECLARE
            webhook_record RECORD;
            payload jsonb;
            event_type text;
          BEGIN
            -- Determinar o tipo de evento
            IF TG_OP = 'INSERT' then
              event_type := 'INSERT';
              payload := to_jsonb(NEW);
            ELSIF TG_OP = 'UPDATE' then
              event_type := 'UPDATE';
              payload := jsonb_build_object(
                'old', to_jsonb(OLD),
                'new', to_jsonb(NEW)
              );
            ELSIF TG_OP = 'DELETE' then
              event_type := 'DELETE';
              payload := to_jsonb(OLD);
            END IF;

            -- Buscar webhooks ativos que monitoram esta tabela e evento
            FOR webhook_record IN
              SELECT * FROM public.webhooks 
              WHERE is_active = true 
              AND TG_TABLE_NAME = ANY(tables)
              AND event_type = ANY(events)
            LOOP
              -- Inserir na fila de webhooks para processamento
              INSERT INTO public.webhook_logs (webhook_id, event_type, table_name, payload)
              VALUES (webhook_record.id, event_type, TG_TABLE_NAME, payload);
            END LOOP;

            IF TG_OP = 'DELETE' THEN
              RETURN OLD;
            ELSE
              RETURN NEW;
            END IF;
          END;
          $function$;
        `;

        const { error: functionError } = await supabaseClient.rpc('execute_sql', { 
          query: triggerFunctionSQL 
        });

        if (functionError) {
          console.error('Error creating trigger function:', functionError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Error creating trigger function: ${functionError.message}` 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500 
            }
          );
        }

        console.log('Webhook trigger function created/updated successfully');

        // Now create triggers for each table
        for (const tableName of tablesToMonitor) {
          try {
            // Drop existing trigger if it exists
            const dropTriggerSQL = `
              DROP TRIGGER IF EXISTS webhook_trigger_${tableName} ON public.${tableName};
            `;
            
            await supabaseClient.rpc('execute_sql', { query: dropTriggerSQL });

            // Create comprehensive trigger
            const createTriggerSQL = `
              CREATE TRIGGER webhook_trigger_${tableName}
              AFTER INSERT OR UPDATE OR DELETE ON public.${tableName}
              FOR EACH ROW EXECUTE FUNCTION public.trigger_webhooks();
            `;
            
            const { error: triggerError } = await supabaseClient.rpc('execute_sql', { 
              query: createTriggerSQL 
            });

            if (triggerError) {
              console.error(`Error creating trigger for ${tableName}:`, triggerError);
              results.push({
                table: tableName,
                status: 'error',
                message: triggerError.message
              });
            } else {
              console.log(`Webhook trigger created for ${tableName}`);
              results.push({
                table: tableName,
                status: 'created',
                message: 'Trigger criado com sucesso - capturando INSERT, UPDATE e DELETE'
              });
            }
          } catch (error) {
            console.error(`Error processing table ${tableName}:`, error);
            results.push({
              table: tableName,
              status: 'error',
              message: error.message || 'Erro desconhecido'
            });
          }
        }

        const successCount = results.filter(r => r.status === 'created').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log(`Triggers setup completed: ${successCount} success, ${errorCount} errors`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Sistema configurado: ${successCount} triggers criados, ${errorCount} erros`,
            results: results,
            summary: {
              total: tablesToMonitor.length,
              success: successCount,
              errors: errorCount
            }
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );

      } catch (error) {
        console.error('Error in trigger setup:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Erro geral na configuração: ${error.message}`,
            error: error.message
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Invalid action" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
    
  } catch (error) {
    console.error("Webhook error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
})

// Function to enrich webhook payload with related data
async function enrichWebhookPayload(log: any, supabaseClient: any) {
  const basePayload = {
    event_type: log.event_type,
    table_name: log.table_name,
    timestamp: formatDateTimeBR(log.created_at),
    webhook_id: log.webhook_id,
    attempt: log.attempt_count + 1,
    data: log.payload
  };

  try {
    // Format any date fields in the payload using Brazilian format
    if (basePayload.data) {
      formatPayloadDates(basePayload.data);
    }

    // Enrich based on table type
    switch (log.table_name) {
      case 'projects':
        if (log.payload?.client_id) {
          const { data: client } = await supabaseClient
            .from('clients')
            .select('*')
            .eq('id', log.payload.client_id)
            .single();
          
          if (client) {
            formatPayloadDates(client);
            basePayload.data.client_details = client;
          }
        }

        if (log.payload?.main_consultant_id) {
          const { data: consultant } = await supabaseClient
            .from('consultants')
            .select('*')
            .eq('id', log.payload.main_consultant_id)
            .single();
          
          if (consultant) {
            formatPayloadDates(consultant);
            basePayload.data.main_consultant_details = consultant;
          }
        }

        if (log.payload?.service_id) {
          const { data: service } = await supabaseClient
            .from('services')
            .select('*')
            .eq('id', log.payload.service_id)
            .single();
          
          if (service) {
            formatPayloadDates(service);
            basePayload.data.service_details = service;
          }
        }
        break;

      case 'project_stages':
        if (log.payload?.project_id) {
          const { data: project } = await supabaseClient
            .from('projects')
            .select(`
              *,
              clients(*),
              services(*)
            `)
            .eq('id', log.payload.project_id)
            .single();
          
          if (project) {
            formatPayloadDates(project);
            if (project.clients) formatPayloadDates(project.clients);
            if (project.services) formatPayloadDates(project.services);
            basePayload.data.project_details = project;
          }
        }
        break;

      case 'clients':
        // For new clients, include count of their projects
        if (log.event_type === 'INSERT') {
          const { count } = await supabaseClient
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', log.payload.id);
          
          basePayload.data.project_count = count || 0;
        }
        break;

      case 'consultants':
        // For consultants, include their active projects and stats
        if (log.payload?.id) {
          const { data: projects } = await supabaseClient
            .from('projects')
            .select('*')
            .or(`main_consultant_id.eq.${log.payload.id},support_consultant_id.eq.${log.payload.id}`)
            .eq('status', 'active');
          
          if (projects) {
            projects.forEach(project => formatPayloadDates(project));
          }
          
          basePayload.data.active_projects = projects || [];
          basePayload.data.active_projects_count = projects?.length || 0;
        }
        break;

      case 'financial_transactions':
      case 'accounts_payable':
      case 'accounts_receivable':
      case 'manual_transactions':
        // Add financial context
        if (log.payload?.project_id) {
          const { data: project } = await supabaseClient
            .from('projects')
            .select('id, name, client_id, clients(name)')
            .eq('id', log.payload.project_id)
            .single();
          
          if (project) {
            formatPayloadDates(project);
            basePayload.data.project_context = project;
          }
        }
        break;

      case 'notes':
        // Add task/note context
        if (log.payload?.client_id) {
          const { data: client } = await supabaseClient
            .from('clients')
            .select('id, name')
            .eq('id', log.payload.client_id)
            .single();
          
          if (client) {
            basePayload.data.client_context = client;
          }
        }
        break;

      case 'chat_messages':
        // Add chat room context
        if (log.payload?.room_id) {
          const { data: room } = await supabaseClient
            .from('chat_rooms')
            .select('id, name, project_id')
            .eq('id', log.payload.room_id)
            .single();
          
          if (room) {
            basePayload.data.room_context = room;
          }
        }
        break;
    }

    return basePayload;
  } catch (error) {
    console.error('Error enriching webhook payload:', error);
    return basePayload; // Return base payload if enrichment fails
  }
}

// Helper function to format all date fields in an object to Brazilian format
function formatPayloadDates(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  
  const dateFields = ['created_at', 'updated_at', 'due_date', 'start_date', 'end_date', 'completed_at', 'deleted_at', 'payment_date'];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (dateFields.includes(key) && obj[key]) {
        obj[key] = formatDateTimeBR(obj[key]);
      } else if (key.includes('date') && obj[key]) {
        obj[key] = formatDateBR(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        formatPayloadDates(obj[key]); // Recursively format nested objects
      }
    }
  }
}
