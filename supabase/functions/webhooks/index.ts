import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Brazilian date formatting utility - corrected for proper timezone
const formatDateBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    // Use toLocaleString with Brazilian timezone for accurate time
    const brazilDate = dateObj.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return brazilDate; // Already in DD/MM/YYYY format
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Brazilian datetime formatting utility - corrected for proper timezone
const formatDateTimeBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return '-';
    
    // Use toLocaleString with Brazilian timezone for accurate time
    const brazilDateTime = dateObj.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return brazilDateTime; // Format: DD/MM/YYYY HH:mm
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
          message: 'Teste do sistema de webhook - tudo funcionando!',
          test: true,
          data_sistema: formatDateBR(currentDate),
          hora_sistema: formatDateTimeBR(currentDate),
          project_status_change: {
            project_id: 'test-project-123',
            project_name: 'Projeto de Teste',
            old_status: 'planned',
            new_status: 'in_progress',
            changed_at: formatDateTimeBR(currentDate),
            changed_by: 'Sistema de Teste'
          },
          project: {
            id: 'test-project-id',
            name: 'Projeto de Teste',
            status: 'in_progress',
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
            'User-Agent': 'Supabase-Webhook-Test/1.0',
            'X-Test-Event': 'true'
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
            message: success ? "Teste enviado com sucesso!" : `Teste falhou: ${response.status} ${response.statusText}`,
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
      console.log('Triggering comprehensive test webhook events including project status changes');
      
      const currentDate = new Date();
      
      // Create comprehensive test data with Brazilian date formatting including project status changes
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

      // Project status change test data
      const testProjectStatusChangeData = {
        id: testProjectData.id,
        name: testProjectData.name,
        description: testProjectData.description,
        status: 'in_progress', // Changed from 'planned' to 'in_progress'
        total_value: testProjectData.total_value,
        client_id: testProjectData.client_id,
        main_consultant_id: testProjectData.main_consultant_id,
        created_at: testProjectData.created_at,
        start_date: testProjectData.start_date,
        due_date: testProjectData.due_date,
        updated_at: formatDateTimeBR(currentDate),
        status_change_info: {
          old_status: 'planned',
          new_status: 'in_progress',
          changed_at: formatDateTimeBR(currentDate),
          change_reason: 'Teste de mudança de status via webhook'
        }
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

      // Create webhook logs for all entity types including project status changes
      const testEntities = [
        { table: 'clients', data: testClientData, event: 'INSERT' },
        { table: 'consultants', data: testConsultantData, event: 'INSERT' },
        { table: 'projects', data: testProjectData, event: 'INSERT' },
        { table: 'projects', data: testProjectStatusChangeData, event: 'UPDATE' }, // Status change event
        { table: 'project_stages', data: testStageData, event: 'INSERT' }
      ];

      let logsCreated = 0;

      for (const webhook of webhooks) {
        for (const entity of testEntities) {
          if (webhook.tables.includes(entity.table) && webhook.events.includes(entity.event)) {
            await supabaseClient
              .from('webhook_logs')
              .insert({
                webhook_id: webhook.id,
                event_type: entity.event,
                table_name: entity.table,
                payload: entity.data
              });
            logsCreated++;
            
            console.log(`Created webhook log for ${entity.table} ${entity.event} event`);
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${logsCreated} eventos de teste criados incluindo mudanças de status de projeto para ${webhooks.length} webhook(s) ativos` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "setup_triggers") {
      console.log('Setting up automatic database triggers for webhook system including project status changes');
      
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
        // Enhanced trigger function that captures project status changes specifically
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
            enhanced_payload jsonb;
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
              
              -- Enhanced handling for project status changes
              IF TG_TABLE_NAME = 'projects' AND OLD.status != NEW.status THEN
                payload := payload || jsonb_build_object(
                  'status_change', jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'changed_at', NOW(),
                    'project_id', NEW.id,
                    'project_name', NEW.name
                  )
                );
              END IF;
              
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
              
              -- Log successful webhook queue insertion
              INSERT INTO public.system_logs (log_type, category, message, details)
              VALUES (
                'info', 
                'webhook', 
                'Webhook event queued for processing',
                jsonb_build_object(
                  'webhook_id', webhook_record.id,
                  'event_type', event_type,
                  'table_name', TG_TABLE_NAME,
                  'webhook_url', webhook_record.url
                )
              );
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
          console.error('Error creating enhanced trigger function:', functionError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Error creating enhanced trigger function: ${functionError.message}` 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500 
            }
          );
        }

        console.log('Enhanced webhook trigger function created/updated successfully with project status change detection');

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
              console.log(`Enhanced webhook trigger created for ${tableName}`);
              const message = tableName === 'projects' 
                ? 'Trigger criado com detecção especial de mudanças de status'
                : 'Trigger criado com sucesso - capturando INSERT, UPDATE e DELETE';
              
              results.push({
                table: tableName,
                status: 'created',
                message: message
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

        console.log(`Enhanced triggers setup completed: ${successCount} success, ${errorCount} errors`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Sistema configurado com detecção de mudanças de status: ${successCount} triggers criados, ${errorCount} erros`,
            results: results,
            summary: {
              total: tablesToMonitor.length,
              success: successCount,
              errors: errorCount,
              special_features: ['Detecção de mudanças de status de projetos', 'Log automático de eventos', 'Enriquecimento de dados']
            }
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );

      } catch (error) {
        console.error('Error in enhanced trigger setup:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Erro geral na configuração avançada: ${error.message}`,
            error: error.message
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500 
          }
        );
      }
    }

    if (action === "toggle_active") {
      const { id, is_active } = requestBody;
      console.log('Toggling webhook status:', { id, is_active });
      
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
        .update({ is_active })
        .eq('id', id);

      if (error) {
        console.error('Error toggling webhook:', error);
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

      console.log('Webhook status toggled successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Webhook ${is_active ? 'ativado' : 'desativado'} com sucesso` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
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

// Enhanced function to enrich webhook payload with related data and project status change detection
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

    // Special handling for project status changes
    if (log.table_name === 'projects' && log.event_type === 'UPDATE') {
      const oldData = log.payload?.old;
      const newData = log.payload?.new;
      
      if (oldData && newData && oldData.status !== newData.status) {
        basePayload.data.status_change_detected = true;
        basePayload.data.status_change_details = {
          old_status: oldData.status,
          new_status: newData.status,
          project_id: newData.id,
          project_name: newData.name,
          changed_at: formatDateTimeBR(log.created_at),
          change_type: 'project_status_update'
        };
        
        console.log(`Project status change detected: ${oldData.status} -> ${newData.status} for project ${newData.name}`);
      }
    }

    switch (log.table_name) {
      case 'projects':
        if (log.payload?.client_id || log.payload?.new?.client_id) {
          const clientId = log.payload?.client_id || log.payload?.new?.client_id;
          const { data: client } = await supabaseClient
            .from('clients')
            .select('*')
            .eq('id', clientId)
            .single();
          
          if (client) {
            formatPayloadDates(client);
            basePayload.data.client_details = client;
          }
        }

        if (log.payload?.main_consultant_id || log.payload?.new?.main_consultant_id) {
          const consultantId = log.payload?.main_consultant_id || log.payload?.new?.main_consultant_id;
          const { data: consultant } = await supabaseClient
            .from('consultants')
            .select('*')
            .eq('id', consultantId)
            .single();
          
          if (consultant) {
            formatPayloadDates(consultant);
            basePayload.data.main_consultant_details = consultant;
          }
        }

        if (log.payload?.service_id || log.payload?.new?.service_id) {
          const serviceId = log.payload?.service_id || log.payload?.new?.service_id;
          const { data: service } = await supabaseClient
            .from('services')
            .select('*')
            .eq('id', serviceId)
            .single();
          
          if (service) {
            formatPayloadDates(service);
            basePayload.data.service_details = service;
          }
        }
        break;

      case 'project_stages':
        if (log.payload?.project_id || log.payload?.new?.project_id) {
          const projectId = log.payload?.project_id || log.payload?.new?.project_id;
          const { data: project } = await supabaseClient
            .from('projects')
            .select(`
              *,
              clients(*),
              services(*)
            `)
            .eq('id', projectId)
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
        const clientId = log.payload?.id || log.payload?.new?.id;
        if (log.event_type === 'INSERT' && clientId) {
          const { count } = await supabaseClient
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', clientId);
          
          basePayload.data.project_count = count || 0;
        }
        break;

      case 'consultants':
        // For consultants, include their active projects and stats
        const consultantPayloadId = log.payload?.id || log.payload?.new?.id;
        if (consultantPayloadId) {
          const { data: projects } = await supabaseClient
            .from('projects')
            .select('*')
            .or(`main_consultant_id.eq.${consultantPayloadId},support_consultant_id.eq.${consultantPayloadId}`)
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
        const financialProjectId = log.payload?.project_id || log.payload?.new?.project_id;
        if (financialProjectId) {
          const { data: project } = await supabaseClient
            .from('projects')
            .select('id, name, status, client_id, clients(name)')
            .eq('id', financialProjectId)
            .single();
          
          if (project) {
            formatPayloadDates(project);
            basePayload.data.project_context = project;
          }
        }
        break;

      case 'notes':
        // Add task/note context
        const noteClientId = log.payload?.client_id || log.payload?.new?.client_id;
        if (noteClientId) {
          const { data: client } = await supabaseClient
            .from('clients')
            .select('id, name')
            .eq('id', noteClientId)
            .single();
          
          if (client) {
            basePayload.data.client_context = client;
          }
        }
        break;

      case 'chat_messages':
        // Add chat room context
        const roomId = log.payload?.room_id || log.payload?.new?.room_id;
        if (roomId) {
          const { data: room } = await supabaseClient
            .from('chat_rooms')
            .select('id, name, project_id')
            .eq('id', roomId)
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
