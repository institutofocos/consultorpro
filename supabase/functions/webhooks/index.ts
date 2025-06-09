import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const formatDateBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    
    const brazilDate = dateObj.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    return brazilDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

const formatDateTimeBR = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '-';
    
    const brazilDateTime = dateObj.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    return brazilDateTime;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '-';
  }
};

serve(async (req) => {
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
    const requestBody = await req.json();
    const { action } = requestBody;
    console.log(`=== WEBHOOK ACTION: ${action} ===`);
    
    if (action === "register") {
      const { url, events, tables } = requestBody;
      console.log('Registering webhook:', { url, events, tables });
      
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
          message: 'Teste do sistema de webhook - versão simplificada funcionando!',
          test: true,
          sistema_corrigido: true,
          data_sistema: formatDateBR(currentDate),
          hora_sistema: formatDateTimeBR(currentDate)
        }
      };

      try {
        console.log('Sending test payload to:', url);
        
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
          responseBody: responseText
        });
        
        return new Response(
          JSON.stringify({ 
            success, 
            message: success ? "Teste enviado com sucesso!" : `Teste falhou: ${response.status}`,
            status: response.status,
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
      console.log('Processing webhook queue - versão simplificada');
      
      // Buscar webhooks pendentes
      const { data: logs, error } = await supabaseClient
        .from('webhook_logs')
        .select(`
          *,
          webhooks!inner(*)
        `)
        .eq('success', false)
        .lt('attempt_count', 3)
        .order('created_at', { ascending: true })
        .limit(20);

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

      console.log(`Processando ${logs?.length || 0} webhook logs`);

      let processedCount = 0;
      let successCount = 0;

      for (const log of logs || []) {
        try {
          console.log(`Processando webhook log ${log.id} para ${log.webhooks.url}`);
          
          // Enriquecer payload com formatação brasileira
          const enrichedPayload = {
            event_type: log.event_type,
            table_name: log.table_name,
            timestamp: formatDateTimeBR(log.created_at),
            webhook_id: log.webhook_id,
            attempt: log.attempt_count + 1,
            data: log.payload,
            sistema_corrigido: true,
            versao: 'simplificada_2.0'
          };
          
          // Formatar datas no payload
          if (enrichedPayload.data) {
            formatPayloadDates(enrichedPayload.data);
          }
          
          const response = await fetch(log.webhooks.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Supabase-Webhook/2.0',
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

          // Atualizar log
          await supabaseClient
            .from('webhook_logs')
            .update({
              success,
              response_status: response.status,
              response_body: responseBody.substring(0, 1000),
              attempt_count: log.attempt_count + 1
            })
            .eq('id', log.id);

          processedCount++;
          if (success) successCount++;

          console.log(`Webhook ${log.id} processado: ${success ? 'SUCCESS' : 'FAILED'} (${response.status})`);
        } catch (error) {
          console.error(`Error processing webhook ${log.id}:`, error);
          
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
          message: `Processados ${processedCount} webhooks (${successCount} sucessos)`,
          processed_count: processedCount,
          success_count: successCount
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "trigger_test") {
      console.log('Triggering test webhook events');
      
      const currentDate = new Date();
      
      const testProjectData = {
        id: crypto.randomUUID(),
        name: 'Projeto de Teste Webhook - Sistema Corrigido',
        description: 'Teste do sistema simplificado',
        status: 'planned',
        total_value: 5000,
        created_at: formatDateTimeBR(currentDate),
        sistema_corrigido: true
      };

      const testStageData = {
        id: crypto.randomUUID(),
        project_id: testProjectData.id,
        name: 'Etapa de Teste',
        status: 'in_progress',
        value: 1000,
        created_at: formatDateTimeBR(currentDate),
        sistema_corrigido: true
      };

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

      let logsCreated = 0;

      for (const webhook of webhooks) {
        if (webhook.tables.includes('projects') && webhook.events.includes('INSERT')) {
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type: 'INSERT',
              table_name: 'projects',
              payload: testProjectData
            });
          logsCreated++;
        }

        if (webhook.tables.includes('project_stages') && webhook.events.includes('UPDATE')) {
          await supabaseClient
            .from('webhook_logs')
            .insert({
              webhook_id: webhook.id,
              event_type: 'UPDATE',
              table_name: 'project_stages',
              payload: {
                old: { ...testStageData, status: 'planned' },
                new: testStageData
              }
            });
          logsCreated++;
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
      console.log('Setting up simplified database triggers');
      
      try {
        const { error } = await supabaseClient.rpc('execute_sql', { 
          query: `
            -- Recriar triggers simples
            DROP TRIGGER IF EXISTS project_webhooks_trigger ON projects;
            DROP TRIGGER IF EXISTS project_stages_webhooks_trigger ON project_stages;
            
            CREATE TRIGGER project_webhooks_trigger
            AFTER INSERT OR UPDATE OR DELETE ON projects
            FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();
            
            CREATE TRIGGER project_stages_webhooks_trigger
            AFTER INSERT OR UPDATE OR DELETE ON project_stages
            FOR EACH ROW EXECUTE FUNCTION trigger_webhooks();
          `
        });

        if (error) {
          console.error('Error setting up triggers:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: `Error setting up triggers: ${error.message}` 
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 500 
            }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Triggers configurados com sucesso - sistema simplificado funcionando"
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
            message: `Erro na configuração: ${error.message}`
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

function formatPayloadDates(obj: any): void {
  if (!obj || typeof obj !== 'object') return;
  
  const dateFields = ['created_at', 'updated_at', 'due_date', 'start_date', 'end_date', 'completed_at'];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (dateFields.includes(key) && obj[key]) {
        obj[key] = formatDateTimeBR(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        formatPayloadDates(obj[key]);
      }
    }
  }
}
