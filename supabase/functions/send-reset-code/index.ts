
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
    
    // Data de expiração (10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
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

    // Verificar se temos a chave da API do Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY não configurado')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Código gerado, mas email não configurado!',
          code: code, // Mostrar código APENAS quando não há configuração de email
          debug: true,
          warning: 'Email não enviado - RESEND_API_KEY não configurado'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Tentar enviar email usando Resend
    try {
      console.log('Tentando enviar email via Resend...')
      
      const resetLink = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.vercel.app') || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}`
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Código de Recuperação - ConsultorPRO</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">ConsultorPRO</h1>
            <h2>Código de Recuperação de Senha</h2>
            
            <p>Olá!</p>
            
            <p>Você solicitou a redefinição da sua senha no ConsultorPRO.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Seu código de recuperação:</h3>
              <p style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; text-align: center; margin: 10px 0;">
                ${code}
              </p>
            </div>
            
            <p><strong>Este código expira em 10 minutos.</strong></p>
            
            <p>Use este link para redefinir sua senha:</p>
            <p><a href="${resetLink}" style="color: #2563eb;">${resetLink}</a></p>
            
            <p>Se você não solicitou esta redefinição, ignore este email.</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Atenciosamente,<br>
              Equipe ConsultorPRO
            </p>
          </div>
        </body>
        </html>
      `

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ConsultorPRO <noreply@focos.online>',
          to: [email],
          subject: 'Código de Recuperação de Senha - ConsultorPRO',
          html: emailHtml
        })
      })

      const emailResult = await emailResponse.json()
      console.log('Resposta do Resend:', emailResponse.status, emailResult)
      
      if (!emailResponse.ok) {
        console.error('Erro ao enviar email via Resend:', emailResult)
        
        // Retornar erro específico SEM mostrar o código
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Erro ao enviar email: ' + (emailResult.message || 'Erro desconhecido'),
            details: emailResult
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Email enviado com sucesso via Resend:', emailResult.id)

      // Sucesso completo - NÃO mostrar o código
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Código de recuperação enviado para seu email!',
          emailSent: true,
          emailId: emailResult.id
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (emailError) {
      console.error('Erro ao tentar enviar email:', emailError)
      
      // Em caso de erro no envio - NÃO mostrar o código
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Erro ao enviar email: ' + emailError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Erro na função send-reset-code:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
