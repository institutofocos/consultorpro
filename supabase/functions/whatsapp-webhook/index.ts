
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  pushName?: string;
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

    const body = await req.json()
    console.log('Webhook recebido:', JSON.stringify(body, null, 2))

    // Verificar se é uma mensagem
    if (body.event === 'messages.upsert' && body.data?.messages) {
      for (const message of body.data.messages) {
        await processWhatsAppMessage(supabaseClient, message, body.instance)
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      },
    )
  }
})

async function processWhatsAppMessage(supabaseClient: any, message: WhatsAppMessage, instanceName: string) {
  try {
    // Buscar a conexão WhatsApp correspondente
    const { data: connection, error: connectionError } = await supabaseClient
      .from('whatsapp_connections')
      .select('*')
      .eq('instance_name', instanceName)
      .eq('status', 'connected')
      .single()

    if (connectionError || !connection) {
      console.error('Conexão não encontrada:', instanceName)
      return
    }

    // Extrair o texto da mensagem
    let messageText = ''
    if (message.message?.conversation) {
      messageText = message.message.conversation
    } else if (message.message?.extendedTextMessage?.text) {
      messageText = message.message.extendedTextMessage.text
    }

    if (!messageText) {
      console.log('Mensagem sem texto, ignorando')
      return
    }

    // Verificar se o contato já existe
    let contact
    const { data: existingContact } = await supabaseClient
      .from('whatsapp_contacts')
      .select('*')
      .eq('connection_id', connection.id)
      .eq('whatsapp_id', message.key.remoteJid)
      .single()

    if (existingContact) {
      contact = existingContact
    } else {
      // Criar novo contato
      const isGroup = message.key.remoteJid.includes('@g.us')
      const { data: newContact, error: contactError } = await supabaseClient
        .from('whatsapp_contacts')
        .insert({
          connection_id: connection.id,
          whatsapp_id: message.key.remoteJid,
          name: message.pushName || (isGroup ? 'Grupo WhatsApp' : 'Contato WhatsApp'),
          is_group: isGroup
        })
        .select()
        .single()

      if (contactError) {
        console.error('Erro ao criar contato:', contactError)
        return
      }
      contact = newContact
    }

    console.log('Mensagem WhatsApp processada com sucesso:', {
      messageId: message.key.id,
      contactName: contact.name,
      messageText: messageText.substring(0, 50) + '...'
    })
  } catch (error) {
    console.error('Erro ao processar mensagem WhatsApp:', error)
  }
}
