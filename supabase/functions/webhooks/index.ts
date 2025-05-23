
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { action } = await req.json();
    
    // Handle different webhook actions
    if (action === "register") {
      const { url, events, tables } = await req.json();
      
      // Here we would register the webhook in the database
      // For now, we'll just return a success response
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Webhook registered successfully",
          webhook: { id: crypto.randomUUID(), url, events, tables }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "list") {
      // Here we would get the webhooks from the database
      // For now, we'll just return an empty array
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          webhooks: []
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "test") {
      const { url } = await req.json();
      
      // Here we would send a test message to the webhook URL
      // For now, we'll just return a success response
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Test message sent successfully" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }
    
    if (action === "delete") {
      const { id } = await req.json();
      
      // Here we would delete the webhook from the database
      // For now, we'll just return a success response
      
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
