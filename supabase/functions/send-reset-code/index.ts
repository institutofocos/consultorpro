
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { email } = await req.json()

    // Verificar se o usuário existe
    const { data: userData, error: userError } = await supabaseClient.auth.admin.listUsers()
    const user = userData?.users?.find(u => u.email === email)
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Email não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Data de expiração (3 minutos)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()

    // Salvar código no banco
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

    // Simular envio de email (em produção, usar um serviço real como SendGrid, Resend, etc.)
    console.log(`Código de recuperação para ${email}: ${code}`)
    console.log(`Expira em: ${expiresAt}`)
    
    // TODO: Implementar envio real de email
    // Exemplo de conteúdo do email:
    const emailContent = `
      Seu código de recuperação de senha: ${code}
      
      Este código expira em 3 minutos.
      
      Use este link para redefinir sua senha:
      ${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'vercel.app') || 'http://localhost:3000'}/reset-password?email=${encodeURIComponent(email)}
    `

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado com sucesso',
        // Em desenvolvimento, retornar o código para teste
        ...(Deno.env.get('ENVIRONMENT') === 'development' && { code })
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na função:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
