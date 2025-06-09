import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...params } = await req.json()
    console.log('Webhook action:', action, 'Params:', params)

    switch (action) {
      case 'send_project_webhook':
        return await sendProjectWebhook(supabaseClient, params)
      case 'list':
        return await listWebhooks(supabaseClient)
      case 'register':
        return await registerWebhook(supabaseClient, params)
      case 'delete':
        return await deleteWebhook(supabaseClient, params)
      case 'test':
        return await testWebhook(supabaseClient, params)
      case 'process':
        return await processWebhookQueue(supabaseClient)
      case 'setup_triggers':
        return await setupDatabaseTriggers(supabaseClient)
      case 'trigger_test':
        return await triggerTestEvents(supabaseClient)
      case 'toggle_active':
        return await toggleWebhookActive(supabaseClient, params)
      default:
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Webhook function error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendProjectWebhook(supabaseClient: any, params: any) {
  const { project_id } = params
  
  if (!project_id) {
    return new Response(
      JSON.stringify({ success: false, message: 'project_id é obrigatório' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    console.log('Buscando dados completos do projeto:', project_id)
    
    // Buscar dados consolidados do projeto
    const { data: projectData, error: projectError } = await supabaseClient
      .rpc('get_project_webhook_data', { project_uuid: project_id })
    
    if (projectError) {
      throw new Error(`Erro ao buscar dados do projeto: ${projectError.message}`)
    }

    // Buscar webhooks ativos que devem receber o evento PROJECT_CREATED
    const { data: webhooks, error: webhooksError } = await supabaseClient
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', ['INSERT'])
      .contains('tables', ['projects'])

    if (webhooksError) {
      throw new Error(`Erro ao buscar webhooks: ${webhooksError.message}`)
    }

    if (!webhooks || webhooks.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum webhook ativo encontrado para projetos',
          webhooks_sent: 0
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let successCount = 0
    let errorCount = 0

    // Enviar para cada webhook ativo
    for (const webhook of webhooks) {
      try {
        console.log(`Enviando webhook consolidado para: ${webhook.url}`)
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Webhook/1.0'
          },
          body: JSON.stringify(projectData)
        })

        const success = response.ok
        
        // Log do envio
        await supabaseClient
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            event_type: 'PROJECT_CREATED',
            table_name: 'projects',
            success: success,
            response_status: response.status,
            response_body: success ? await response.text() : null,
            error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
            attempt_count: 1,
            payload: projectData
          })

        if (success) {
          successCount++
          console.log(`Webhook enviado com sucesso para: ${webhook.url}`)
        } else {
          errorCount++
          console.error(`Erro no webhook para ${webhook.url}: ${response.status} ${response.statusText}`)
        }
        
      } catch (error) {
        errorCount++
        console.error(`Erro ao enviar webhook para ${webhook.url}:`, error)
        
        // Log do erro
        await supabaseClient
          .from('webhook_logs')
          .insert({
            webhook_id: webhook.id,
            event_type: 'PROJECT_CREATED',
            table_name: 'projects',
            success: false,
            response_status: null,
            response_body: null,
            error_message: error.message,
            attempt_count: 1,
            payload: projectData
          })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Webhook consolidado enviado para ${successCount} destinos`,
        webhooks_sent: successCount,
        webhooks_failed: errorCount,
        total_webhooks: webhooks.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Erro no envio de webhook consolidado:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function listWebhooks(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('webhooks')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao listar webhooks: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, webhooks: data || [] }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function registerWebhook(supabaseClient: any, params: any) {
  const { url, events, tables } = params

  if (!url || !events || !tables) {
    throw new Error('URL, events e tables são obrigatórios')
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
    .single()

  if (error) {
    throw new Error(`Erro ao registrar webhook: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, webhook: data }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function deleteWebhook(supabaseClient: any, params: any) {
  const { id } = params

  if (!id) {
    throw new Error('ID é obrigatório')
  }

  const { error } = await supabaseClient
    .from('webhooks')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar webhook: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ success: true, message: 'Webhook deletado com sucesso' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function testWebhook(supabaseClient: any, params: any) {
  const { url } = params

  if (!url) {
    throw new Error('URL é obrigatória')
  }

  const testPayload = {
    event_type: 'TEST',
    table_name: 'test',
    timestamp: new Date().toISOString(),
    test: true,
    message: 'Este é um teste de webhook'
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Webhook-Test/1.0'
    },
    body: JSON.stringify(testPayload)
  })

  return new Response(
    JSON.stringify({ 
      success: response.ok, 
      status: response.status,
      message: response.ok ? 'Teste bem-sucedido' : 'Teste falhou'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function processWebhookQueue(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('webhook_queue')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Erro ao selecionar webhooks da fila:', error);
    throw new Error(`Erro ao processar fila de webhooks: ${error.message}`);
  }

  if (!data || data.length === 0) {
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Fila de webhooks vazia',
        processed_count: 0
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let successCount = 0;
  let errorCount = 0;

  for (const webhookQueueItem of data) {
    try {
      const { data: webhook, error: webhookError } = await supabaseClient
        .from('webhooks')
        .select('*')
        .eq('id', webhookQueueItem.webhook_id)
        .single();

      if (webhookError) {
        console.error(`Erro ao buscar webhook ${webhookQueueItem.webhook_id}:`, webhookError);
        errorCount++;
        continue;
      }

      if (!webhook) {
        console.error(`Webhook não encontrado: ${webhookQueueItem.webhook_id}`);
        errorCount++;
        continue;
      }

      console.log(`Enviando webhook da fila para: ${webhook.url}`);

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Supabase-Webhook/1.0'
        },
        body: webhookQueueItem.payload
      });

      const success = response.ok;

      // Log do envio
      await supabaseClient
        .from('webhook_logs')
        .insert({
          webhook_id: webhook.id,
          event_type: webhookQueueItem.event_type,
          table_name: webhookQueueItem.table_name,
          success: success,
          response_status: response.status,
          response_body: success ? await response.text() : null,
          error_message: success ? null : `HTTP ${response.status}: ${response.statusText}`,
          attempt_count: 1,
          payload: webhookQueueItem.payload
        });

      if (success) {
        successCount++;
        console.log(`Webhook da fila enviado com sucesso para: ${webhook.url}`);
      } else {
        errorCount++;
        console.error(`Erro no webhook da fila para ${webhook.url}: ${response.status} ${response.statusText}`);
      }

      // Remover da fila
      const { error: deleteError } = await supabaseClient
        .from('webhook_queue')
        .delete()
        .eq('id', webhookQueueItem.id);

      if (deleteError) {
        console.error(`Erro ao remover webhook da fila ${webhookQueueItem.id}:`, deleteError);
      }

    } catch (error) {
      errorCount++;
      console.error(`Erro ao processar webhook da fila ${webhookQueueItem.id}:`, error);

      // Log do erro
      await supabaseClient
        .from('webhook_logs')
        .insert({
          webhook_id: webhookQueueItem.webhook_id,
          event_type: webhookQueueItem.event_type,
          table_name: webhookQueueItem.table_name,
          success: false,
          response_status: null,
          response_body: null,
          error_message: error.message,
          attempt_count: 1,
          payload: webhookQueueItem.payload
        });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Processados ${data.length} webhooks (${successCount} sucessos, ${errorCount} falhas)`,
      processed_count: data.length,
      success_count: successCount,
      error_count: errorCount
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function setupDatabaseTriggers(supabaseClient: any) {
  const tables = [
    'consultants',
    'clients',
    'projects',
    'services',
    'project_stages',
    'financial_transactions',
    'accounts_payable',
    'accounts_receivable',
    'manual_transactions',
    'user_profiles',
    'project_status_settings',
    'webhooks',
    'project_tags'
  ];

  const results = [];

  for (const table of tables) {
    try {
      // Verificar se a tabela existe
      const { data: tableExists, error: tableExistsError } = await supabaseClient
        .from('pg_tables')
        .select('*')
        .eq('tablename', table)
        .eq('schemaname', 'public');

      if (tableExistsError) {
        throw new Error(`Erro ao verificar se a tabela ${table} existe: ${tableExistsError.message}`);
      }

      if (!tableExists || tableExists.length === 0) {
        console.warn(`Tabela ${table} não encontrada. Ignorando trigger.`);
        results.push({ table, status: 'skipped', message: 'Tabela não encontrada' });
        continue;
      }

      // Construir o nome do trigger
      const triggerName = `${table}_webhooks_trigger`;

      // Verificar se o trigger já existe
      const { data: triggerExists, error: triggerExistsError } = await supabaseClient
        .from('pg_trigger')
        .select('*')
        .eq('tgname', triggerName);

      if (triggerExistsError) {
        throw new Error(`Erro ao verificar se o trigger ${triggerName} existe: ${triggerExistsError.message}`);
      }

      if (triggerExists && triggerExists.length > 0) {
        console.log(`Trigger ${triggerName} já existe. Ignorando.`);
        results.push({ table, trigger: triggerName, status: 'exists', message: 'Trigger já existe' });
        continue;
      }

      // Criar o trigger
      const { error: createError } = await supabaseClient.rpc('create_trigger', {
        table_name: table,
        trigger_name: triggerName
      });

      if (createError) {
        throw new Error(`Erro ao criar trigger para a tabela ${table}: ${createError.message}`);
      }

      console.log(`Trigger criado com sucesso para a tabela ${table}`);
      results.push({ table, trigger: triggerName, status: 'created', message: 'Trigger criado com sucesso' });

    } catch (error) {
      console.error(`Erro ao configurar trigger para a tabela ${table}:`, error);
      results.push({ table, status: 'error', message: error.message });
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Triggers configurados',
      results: results
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function triggerTestEvents(supabaseClient: any) {
  const testEvents = [
    { table: 'consultants', event_type: 'INSERT', payload: { name: 'Test Consultant', email: 'test@example.com' } },
    { table: 'clients', event_type: 'UPDATE', payload: { id: 'uuid-example', name: 'Test Client Updated' } },
    { table: 'projects', event_type: 'DELETE', payload: { id: 'uuid-example' } }
  ];

  for (const event of testEvents) {
    try {
      // Inserir na fila de webhooks
      const { error } = await supabaseClient
        .from('webhook_queue')
        .insert({
          webhook_id: '00000000-0000-0000-0000-000000000000', // ID temporário
          event_type: event.event_type,
          table_name: event.table,
          payload: event.payload
        });

      if (error) {
        console.error(`Erro ao inserir evento de teste na fila para ${event.table}:`, error);
        continue;
      }

      console.log(`Evento de teste inserido na fila para ${event.table}`);

    } catch (error) {
      console.error(`Erro ao criar evento de teste para ${event.table}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Eventos de teste criados'
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function toggleWebhookActive(supabaseClient: any, params: any) {
  const { id, is_active } = params

  if (!id || typeof is_active !== 'boolean') {
    throw new Error('ID e is_active são obrigatórios')
  }

  const { error } = await supabaseClient
    .from('webhooks')
    .update({ is_active })
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao alterar status do webhook: ${error.message}`)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: `Webhook ${is_active ? 'ativado' : 'desativado'} com sucesso`
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
