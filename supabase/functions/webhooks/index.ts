
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
    console.log(`=== WEBHOOK ACTION CONSOLIDADO: ${action} ===`);
    
    if (action === "register") {
      const { url, events, tables } = requestBody;
      console.log('Registering consolidated webhook:', { url, events, tables });
      
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
        console.error('Error registering consolidated webhook:', error);
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

      console.log('Consolidated webhook registered successfully:', data);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook consolidado registrado com sucesso",
          webhook: data
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "list") {
      console.log('Fetching consolidated webhooks list');
      
      const { data, error } = await supabaseClient
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consolidated webhooks:', error);
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

      console.log('Consolidated webhooks fetched:', data?.length || 0);
      
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
      console.log('Testing consolidated webhook:', url);
      
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
          name: 'Projeto de Teste Consolidado',
          description: 'Teste do sistema de webhook consolidado',
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
        stages: [
          {
            id: 'test-stage-1',
            name: 'Etapa 1 - Análise',
            value: 5000,
            status: 'iniciar_projeto'
          },
          {
            id: 'test-stage-2',
            name: 'Etapa 2 - Desenvolvimento',
            value: 7000,
            status: 'iniciar_projeto'
          },
          {
            id: 'test-stage-3',
            name: 'Etapa 3 - Entrega',
            value: 3000,
            status: 'iniciar_projeto'
          }
        ],
        system_info: {
          source: 'ConsultorPRO System',
          consolidation_type: 'project_creation',
          processed_at: formatDateTimeBR(currentDate),
          test: true,
          webhook_consolidado: true
        }
      };

      try {
        console.log('Sending consolidated test payload to:', url);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Webhook-Consolidated/1.0',
            'X-Test-Event': 'true',
            'X-Webhook-Type': 'consolidated'
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
        
        console.log('Consolidated webhook test result:', { 
          success, 
          status: response.status, 
          responseBody: responseText
        });
        
        return new Response(
          JSON.stringify({ 
            success, 
            message: success ? "Teste consolidado enviado com sucesso!" : `Teste consolidado falhou: ${response.status}`,
            status: response.status,
            responseBody: responseText
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      } catch (error) {
        console.error('Error testing consolidated webhook:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Teste consolidado falhou: " + errorMessage,
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
      console.log('Deleting consolidated webhook:', id);
      
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
        console.error('Error deleting consolidated webhook:', error);
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

      console.log('Consolidated webhook deleted successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook consolidado excluído com sucesso" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "process") {
      console.log('Processing consolidated webhook queue');
      
      // Buscar webhooks pendentes (incluindo consolidados)
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
        console.error('Error fetching consolidated webhook logs:', error);
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

      console.log(`Processando ${logs?.length || 0} webhook logs consolidados`);

      let processedCount = 0;
      let successCount = 0;
      let consolidatedCount = 0;

      for (const log of logs || []) {
        try {
          console.log(`Processando webhook log ${log.id} para ${log.webhooks.url}`);
          
          // Identificar se é um webhook consolidado
          const isConsolidated = log.event_type === 'project_created_consolidated' || 
                                log.table_name === 'projects_consolidated';
          
          if (isConsolidated) {
            consolidatedCount++;
          }
          
          // Enriquecer payload com formatação brasileira
          const enrichedPayload = {
            event_type: log.event_type,
            table_name: log.table_name,
            timestamp: formatDateTimeBR(log.created_at),
            webhook_id: log.webhook_id,
            attempt: log.attempt_count + 1,
            data: log.payload,
            system_info: {
              source: 'ConsultorPRO System',
              webhook_type: isConsolidated ? 'consolidated' : 'standard',
              processed_at: formatDateTimeBR(new Date()),
              version: 'consolidated_2.0'
            }
          };
          
          // Formatar datas no payload
          if (enrichedPayload.data) {
            formatPayloadDates(enrichedPayload.data);
          }
          
          const response = await fetch(log.webhooks.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Supabase-Webhook-Consolidated/2.0',
              'X-Webhook-Event': log.event_type,
              'X-Webhook-Table': log.table_name,
              'X-Webhook-Timestamp': log.created_at,
              'X-Webhook-Type': isConsolidated ? 'consolidated' : 'standard',
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

          console.log(`Webhook ${log.id} processado: ${success ? 'SUCCESS' : 'FAILED'} (${response.status}) ${isConsolidated ? '[CONSOLIDATED]' : ''}`);
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
          message: `Processados ${processedCount} webhooks (${successCount} sucessos, ${consolidatedCount} consolidados)`,
          processed_count: processedCount,
          success_count: successCount,
          consolidated_count: consolidatedCount
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "trigger_test") {
      console.log('Triggering consolidated test webhook events');
      
      const currentDate = new Date();
      
      const testProjectData = {
        event_type: 'project_created_consolidated',
        timestamp: formatDateTimeBR(currentDate),
        project_id: 'test-project-consolidated-' + Date.now(),
        project: {
          id: 'test-project-id',
          name: 'Projeto de Teste Consolidado - Sistema Atualizado',
          description: 'Teste do sistema consolidado funcionando',
          status: 'planned',
          total_value: 25000,
          created_at: formatDateBR(currentDate)
        },
        client: {
          id: 'test-client-id',
          name: 'Cliente Teste Consolidado',
          email: 'cliente@consolidado.com',
          phone: '(11) 99999-9999'
        },
        service: {
          id: 'test-service-id',
          name: 'Serviço Consolidado de Teste',
          total_value: 25000,
          description: 'Serviço de teste para webhook consolidado'
        },
        main_consultant: {
          id: 'test-consultant-main',
          name: 'Consultor Principal Consolidado',
          email: 'principal@consolidado.com'
        },
        support_consultant: {
          id: 'test-consultant-support',
          name: 'Consultor de Apoio Consolidado',
          email: 'apoio@consolidado.com'
        },
        stages: [
          {
            id: 'stage-1',
            name: 'Análise Inicial',
            value: 8000,
            status: 'iniciar_projeto',
            days: 5
          },
          {
            id: 'stage-2',
            name: 'Desenvolvimento',
            value: 12000,
            status: 'iniciar_projeto',
            days: 10
          },
          {
            id: 'stage-3',
            name: 'Testes e Entrega',
            value: 5000,
            status: 'iniciar_projeto',
            days: 3
          }
        ],
        system_info: {
          source: 'ConsultorPRO System',
          consolidation_type: 'project_creation',
          processed_at: formatDateTimeBR(currentDate),
          test: true,
          webhook_consolidado: true,
          total_stages: 3
        }
      };

      const { data: webhooks } = await supabaseClient
        .from('webhooks')
        .select('*')
        .eq('is_active', true);

      if (!webhooks || webhooks.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Nenhum webhook consolidado ativo encontrado" 
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
              event_type: 'project_created_consolidated',
              table_name: 'projects_consolidated',
              payload: testProjectData
            });
          logsCreated++;
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `${logsCreated} eventos consolidados de teste criados para ${webhooks.length} webhook(s) ativos` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "setup_triggers") {
      console.log('Setting up consolidated database triggers');
      
      try {
        // Verificar se os triggers consolidados já estão configurados
        const { data: settings } = await supabaseClient
          .from('system_settings')
          .select('*')
          .eq('setting_key', 'webhook_consolidation_enabled')
          .single();

        if (settings && settings.setting_value === 'true') {
          console.log('Consolidated triggers already configured');
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: "Triggers consolidados já estão configurados e funcionando!"
            }),
            { 
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200 
            }
          );
        }

        // Se não estiver configurado, ativar
        await supabaseClient
          .from('system_settings')
          .upsert({
            setting_key: 'webhook_consolidation_enabled',
            setting_value: 'true',
            description: 'Habilita o envio de webhooks consolidados para criação de projetos'
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Triggers consolidados ativados com sucesso! Sistema de webhooks consolidados funcionando."
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );

      } catch (error) {
        console.error('Error in consolidated trigger setup:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: `Erro na configuração consolidada: ${error.message}`
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
      console.log('Toggling consolidated webhook status:', { id, is_active });
      
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
        console.error('Error toggling consolidated webhook:', error);
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

      console.log('Consolidated webhook status toggled successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Webhook consolidado ${is_active ? 'ativado' : 'desativado'} com sucesso` 
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
        message: "Invalid action for consolidated webhooks" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
    
  } catch (error) {
    console.error("Consolidated webhook error:", error);
    
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
  
  const dateFields = ['created_at', 'updated_at', 'due_date', 'start_date', 'end_date', 'completed_at', 'timestamp'];
  
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
