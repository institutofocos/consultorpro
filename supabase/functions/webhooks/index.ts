
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
      
      // Verificar se já existe um webhook com esta URL
      const { data: existingWebhook } = await supabaseClient
        .from('webhooks')
        .select('id, url')
        .eq('url', url)
        .single();

      if (existingWebhook) {
        console.log('Webhook with this URL already exists:', existingWebhook);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Um webhook com esta URL já está registrado. Cada URL pode ter apenas um webhook ativo.",
            existing_webhook_id: existingWebhook.id
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 409 // Conflict
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
        
        // Se o erro for de violação de constraint única, retornar mensagem específica
        if (error.code === '23505' && error.message.includes('webhooks_url_unique')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: "Um webhook com esta URL já está registrado. Cada URL pode ter apenas um webhook ativo."
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 409
            }
          );
        }
        
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
          message: "Webhook registrado com sucesso",
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
        event_type: 'project_created_consolidated',
        timestamp: formatDateTimeBR(currentDate),
        project_id: 'test-project-id',
        project: {
          id: 'test-project-id',
          name: 'Projeto de Teste',
          description: 'Teste do sistema de webhook',
          status: 'planned',
          total_value: 15000,
          created_at: formatDateBR(currentDate)
        },
        client: {
          id: 'test-client-id',
          name: 'Cliente de Teste',
          email: 'cliente@teste.com'
        },
        service: {
          id: 'test-service-id',
          name: 'Serviço de Teste',
          total_value: 15000
        },
        main_consultant: {
          id: 'test-consultant-id',
          name: 'Consultor Principal de Teste',
          email: 'consultor@teste.com'
        },
        system_info: {
          source: 'ConsultorPRO System',
          consolidation_type: 'project_creation',
          processed_at: formatDateBR(currentDate),
          test: true
        }
      };

      try {
        console.log('Sending test payload to:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Webhook/1.0',
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
          message: "Webhook excluído com sucesso" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "process") {
      console.log('Processing webhook queue - INCLUDING STATUS CHANGES');
      
      // Buscar webhooks pendentes (incluindo status changes)
      const { data: logs, error } = await supabaseClient
        .from('webhook_logs')
        .select(`
          *,
          webhooks!inner(*)
        `)
        .eq('success', false)
        .in('event_type', ['project_created_consolidated', 'project_status_changed', 'stage_status_changed'])
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

      console.log(`Processando ${logs?.length || 0} webhook logs (incluindo status changes)`);

      let processedCount = 0;
      let successCount = 0;

      // Para cada log, enviar para TODOS os webhooks ativos
      for (const log of logs || []) {
        try {
          console.log(`Processando webhook ${log.id} - evento: ${log.event_type}`);
          
          // Buscar TODOS os webhooks ativos
          const { data: allWebhooks } = await supabaseClient
            .from('webhooks')
            .select('*')
            .eq('is_active', true);

          if (!allWebhooks || allWebhooks.length === 0) {
            console.log('Nenhum webhook ativo encontrado');
            continue;
          }

          let webhookSuccessCount = 0;
          
          // Enviar para TODOS os webhooks ativos
          for (const webhook of allWebhooks) {
            try {
              // Enriquecer payload com formatação brasileira
              const enrichedPayload = {
                event_type: log.event_type,
                table_name: log.table_name,
                timestamp: formatDateTimeBR(log.created_at),
                webhook_id: webhook.id,
                attempt: log.attempt_count + 1,
                data: log.payload,
                system_info: {
                  source: 'ConsultorPRO System',
                  webhook_type: log.event_type.includes('status') ? 'status_change' : 'consolidated',
                  processed_at: formatDateTimeBR(new Date()),
                  version: '2.0_with_status_changes'
                }
              };
              
              // Formatar datas no payload
              if (enrichedPayload.data) {
                formatPayloadDates(enrichedPayload.data);
              }
              
              const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Agent': 'Supabase-Webhook-StatusChanges/2.0',
                  'X-Webhook-Event': log.event_type,
                  'X-Webhook-Table': log.table_name,
                  'X-Webhook-Timestamp': log.created_at,
                  'X-Webhook-Type': log.event_type.includes('status') ? 'status_change' : 'consolidated',
                  ...(webhook.secret_key && {
                    'Authorization': `Bearer ${webhook.secret_key}`,
                    'X-Webhook-Secret': webhook.secret_key
                  })
                },
                body: JSON.stringify(enrichedPayload)
              });

              const success = response.ok;
              if (success) webhookSuccessCount++;

              console.log(`Webhook ${webhook.id} (${webhook.url}) processado: ${success ? 'SUCCESS' : 'FAILED'} (${response.status})`);
              
            } catch (webhookError) {
              console.error(`Erro ao processar webhook ${webhook.id}:`, webhookError);
            }
          }

          // Marcar o log original como processado se pelo menos um webhook teve sucesso
          const overallSuccess = webhookSuccessCount > 0;
          
          await supabaseClient
            .from('webhook_logs')
            .update({
              success: overallSuccess,
              response_status: overallSuccess ? 200 : 500,
              response_body: `Distribuído para ${allWebhooks.length} webhooks, ${webhookSuccessCount} sucessos`,
              attempt_count: log.attempt_count + 1
            })
            .eq('id', log.id);

          processedCount++;
          if (overallSuccess) successCount++;

          console.log(`Webhook ${log.id} (${log.event_type}) processado: distribuído para ${allWebhooks.length} webhooks (${webhookSuccessCount} sucessos)`);
          
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
          message: `Processados ${processedCount} webhooks (incluindo status changes) - ${successCount} sucessos`,
          processed_count: processedCount,
          success_count: successCount
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
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
  
  const dateFields = ['created_at', 'updated_at', 'due_date', 'start_date', 'end_date', 'completed_at', 'timestamp', 'changed_at'];
  
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
