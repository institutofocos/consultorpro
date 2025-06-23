import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface DemandRequest {
  nome: string;
  descricao?: string;
  cliente_id?: string;
  cliente_nome?: string;
  servico_id?: string;
  servico_nome?: string;
  data_inicio: string;
  data_fim: string;
  valor_total: number;
  horas_totais?: number;
  valor_hora?: number;
  observacoes?: string;
  url?: string;
  etapas?: Array<{
    nome: string;
    descricao?: string;
    dias: number;
    horas: number;
    valor: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    console.log('📥 Webhook recebido:', {
      method: req.method,
      pathname: pathname,
      timestamp: new Date().toISOString()
    });

    // Endpoint para registro de demandas
    if (req.method === 'POST' && pathname === '/api/demands') {
      return await handleDemandRegistration(req, supabaseClient);
    }

    // Processamento de webhooks existente
    if (req.method === 'POST' && pathname === '/process') {
      return await processWebhookQueue(supabaseClient);
    }

    // Endpoint não encontrado
    return new Response(
      JSON.stringify({ 
        error: 'Endpoint não encontrado',
        available_endpoints: [
          'POST /api/demands - Cadastrar nova demanda',
          'POST /process - Processar fila de webhooks'
        ]
      }), 
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleDemandRegistration(req: Request, supabase: any) {
  try {
    const body: DemandRequest = await req.json();
    
    console.log('📋 Processando nova demanda:', {
      nome: body.nome,
      cliente: body.cliente_nome || body.cliente_id,
      valor: body.valor_total
    });

    // Validações obrigatórias
    const validationErrors = validateDemandRequest(body);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'Dados inválidos',
          validationErrors: validationErrors,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Buscar ou criar cliente
    let clientId = body.cliente_id;
    if (!clientId && body.cliente_nome) {
      const clientResult = await findOrCreateClient(supabase, body.cliente_nome);
      if (!clientResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Erro ao processar cliente',
            message: clientResult.error,
            timestamp: new Date().toISOString()
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      clientId = clientResult.clientId;
    }

    // Buscar serviço se fornecido
    let serviceId = body.servico_id;
    if (!serviceId && body.servico_nome) {
      const serviceResult = await findServiceByName(supabase, body.servico_nome);
      if (serviceResult.success) {
        serviceId = serviceResult.serviceId;
      }
    }

    // Criar projeto (demanda)
    const projectData = {
      name: body.nome,
      description: body.descricao || '',
      client_id: clientId,
      service_id: serviceId,
      start_date: body.data_inicio,
      end_date: body.data_fim,
      total_value: body.valor_total,
      total_hours: body.horas_totais || 0,
      hourly_rate: body.valor_hora || 0,
      status: 'em_planejamento',
      url: body.url || null,
      main_consultant_id: null, // Demanda sem consultor
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('❌ Erro ao criar projeto:', projectError);
      return new Response(
        JSON.stringify({
          error: 'Erro ao criar demanda',
          message: projectError.message,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar etapas se fornecidas
    if (body.etapas && body.etapas.length > 0) {
      const stagesData = body.etapas.map((etapa, index) => ({
        project_id: project.id,
        name: etapa.nome,
        description: etapa.descricao || '',
        days: etapa.dias,
        hours: etapa.horas,
        value: etapa.valor,
        stage_order: index + 1,
        status: 'iniciar_projeto',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: stagesError } = await supabase
        .from('project_stages')
        .insert(stagesData);

      if (stagesError) {
        console.error('⚠️ Erro ao criar etapas:', stagesError);
        // Não falha a demanda por causa das etapas
      }
    }

    console.log('✅ Demanda criada com sucesso:', {
      id: project.id,
      nome: project.name,
      cliente_id: clientId
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demanda cadastrada com sucesso',
        data: {
          demanda_id: project.id,
          nome: project.name,
          cliente_id: clientId,
          servico_id: serviceId,
          status: project.status,
          created_at: project.created_at
        },
        timestamp: new Date().toISOString()
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro ao processar demanda:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Erro ao processar demanda',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

function validateDemandRequest(body: DemandRequest): string[] {
  const errors: string[] = [];

  // Validações obrigatórias
  if (!body.nome || body.nome.trim().length === 0) {
    errors.push('Nome da demanda é obrigatório');
  }

  if (!body.data_inicio) {
    errors.push('Data de início é obrigatória');
  } else {
    const startDate = new Date(body.data_inicio);
    if (isNaN(startDate.getTime())) {
      errors.push('Data de início deve estar no formato YYYY-MM-DD');
    }
  }

  if (!body.data_fim) {
    errors.push('Data de fim é obrigatória');
  } else {
    const endDate = new Date(body.data_fim);
    if (isNaN(endDate.getTime())) {
      errors.push('Data de fim deve estar no formato YYYY-MM-DD');
    }
  }

  if (body.valor_total === undefined || body.valor_total === null) {
    errors.push('Valor total é obrigatório');
  } else if (typeof body.valor_total !== 'number' || body.valor_total < 0) {
    errors.push('Valor total deve ser um número positivo');
  }

  // Pelo menos cliente_id ou cliente_nome deve ser fornecido
  if (!body.cliente_id && !body.cliente_nome) {
    errors.push('É necessário fornecer cliente_id ou cliente_nome');
  }

  // Validar datas
  if (body.data_inicio && body.data_fim) {
    const startDate = new Date(body.data_inicio);
    const endDate = new Date(body.data_fim);
    if (startDate >= endDate) {
      errors.push('Data de fim deve ser posterior à data de início');
    }
  }

  // Validar etapas se fornecidas
  if (body.etapas) {
    body.etapas.forEach((etapa, index) => {
      if (!etapa.nome || etapa.nome.trim().length === 0) {
        errors.push(`Etapa ${index + 1}: Nome é obrigatório`);
      }
      if (typeof etapa.dias !== 'number' || etapa.dias <= 0) {
        errors.push(`Etapa ${index + 1}: Dias deve ser um número positivo`);
      }
      if (typeof etapa.horas !== 'number' || etapa.horas <= 0) {
        errors.push(`Etapa ${index + 1}: Horas deve ser um número positivo`);
      }
      if (typeof etapa.valor !== 'number' || etapa.valor < 0) {
        errors.push(`Etapa ${index + 1}: Valor deve ser um número positivo`);
      }
    });
  }

  return errors;
}

async function findOrCreateClient(supabase: any, clientName: string) {
  try {
    // Buscar cliente existente
    const { data: existingClient, error: searchError } = await supabase
      .from('clients')
      .select('id')
      .ilike('name', clientName)
      .single();

    if (existingClient) {
      return { success: true, clientId: existingClient.id };
    }

    // Criar novo cliente
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert({
        name: clientName,
        contact_name: clientName,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    return { success: true, clientId: newClient.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findServiceByName(supabase: any, serviceName: string) {
  try {
    const { data: service, error } = await supabase
      .from('services')
      .select('id')
      .ilike('name', serviceName)
      .single();

    if (error || !service) {
      return { success: false, error: 'Serviço não encontrado' };
    }

    return { success: true, serviceId: service.id };

  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function processWebhookQueue(supabase: any) {
  console.log('🔄 Processando fila de webhooks...');
  
  const { error } = await supabase.rpc('process_webhook_queue_comprehensive');
  
  if (error) {
    console.error('❌ Erro ao processar fila:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar fila de webhooks',
        message: error.message
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  return new Response(
    JSON.stringify({ 
      message: 'Fila de webhooks processada com sucesso',
      timestamp: new Date().toISOString()
    }), 
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}
