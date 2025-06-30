
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Requisição recebida:', req.method, req.url)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Parseando JSON do request...')
    const { email } = await req.json()
    console.log('Email recebido:', email)

    if (!email) {
      console.error('Email não fornecido')
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar se o usuário existe usando o admin API
    console.log('Verificando se o usuário existe...')
    const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers()
    
    if (userError) {
      console.error('Erro ao listar usuários:', userError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const user = userData?.users?.find(u => u.email === email)
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não')
    
    if (!user) {
      console.log('Email não encontrado no sistema:', email)
      
      // Buscar emails similares para sugerir
      const similarEmails = userData?.users
        ?.map(u => u.email)
        ?.filter(userEmail => {
          if (!userEmail) return false;
          // Verificar se tem domínio similar
          const emailDomain = email.split('@')[1];
          const userDomain = userEmail.split('@')[1];
          if (emailDomain === userDomain) {
            // Verificar se o nome do usuário é similar (diferença de 1-2 caracteres)
            const emailName = email.split('@')[0];
            const userName = userEmail.split('@')[0];
            const maxDiff = Math.min(2, Math.floor(emailName.length * 0.2));
            let differences = 0;
            for (let i = 0; i < Math.max(emailName.length, userName.length); i++) {
              if (emailName[i] !== userName[i]) differences++;
              if (differences > maxDiff) return false;
            }
            return differences <= maxDiff;
          }
          return false;
        })
        ?.slice(0, 3); // Máximo 3 sugestões

      const errorMessage = similarEmails && similarEmails.length > 0
        ? `Email não encontrado. Você quis dizer: ${similarEmails.join(' ou ')}?`
        : 'Email não encontrado. Verifique se o email está correto e se você possui uma conta cadastrada.';

      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          suggestions: similarEmails 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Invalidar códigos anteriores do mesmo usuário
    console.log('Invalidando códigos anteriores...')
    await supabaseClient
      .from('password_reset_codes')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log('Código gerado:', code)
    
    // Data de expiração (3 minutos)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()
    console.log('Expira em:', expiresAt)

    // Salvar código no banco
    console.log('Salvando código no banco...')
    const { error: insertError } = await supabaseClient
      .from('password_reset_codes')
      .insert({
        user_id: user.id,
        code: code,
        email: email,
        expires_at: expiresAt
      })

    if (insertError) {
      console.error('Erro ao salvar código:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro interno do servidor' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Código salvo com sucesso!')

    // Simular envio de email (em produção, usar um serviço real como SendGrid, Resend, etc.)
    console.log(`=== EMAIL DE RECUPERAÇÃO ===`)
    console.log(`Para: ${email}`)
    console.log(`Código: ${code}`)
    console.log(`Expira em: ${expiresAt}`)
    console.log(`Link para redefinir: ${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}`)
    console.log(`========================`)
    
    // TODO: Implementar envio real de email
    // Exemplo de conteúdo do email:
    const emailContent = `
      Olá!
      
      Você solicitou a redefinição da sua senha no ConsultorPRO.
      
      Seu código de recuperação é: ${code}
      
      Este código expira em 3 minutos.
      
      Use este link para redefinir sua senha:
      ${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}
      
      Se você não solicitou esta redefinição, ignore este email.
      
      Atenciosamente,
      Equipe ConsultorPRO
    `

    console.log('Email simulado enviado com sucesso!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso',
        // Em desenvolvimento, retornar o código para teste
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { code, debug: true })
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função send-reset-code:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message,
        stack: error.stack 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
