
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
    // Parse the request body once
    const requestBody = await req.json();
    const { action } = requestBody;
    console.log(`=== WEBHOOK ACTION: ${action} ===`);
    
    // Handle different webhook actions
    if (action === "register") {
      const { url, events, tables } = requestBody;
      console.log('Registering webhook:', { url, events, tables });
      
      // Validate input
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
      
      // Insert webhook into database
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
      
      const testPayload = {
        event_type: 'TEST',
        table_name: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'This is a test webhook payload',
          test: true
        }
      };

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testPayload)
        });

        const success = response.ok;
        console.log('Webhook test result:', { success, status: response.status });
        
        return new Response(
          JSON.stringify({ 
            success, 
            message: success ? "Test message sent successfully" : "Test failed",
            status: response.status,
            statusText: response.statusText
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200 
          }
        );
      } catch (error) {
        console.error('Error testing webhook:', error);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Test failed: " + error.message 
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
      console.log('Processing webhook queue');
      
      // Fetch pending webhook logs
      const { data: logs, error } = await supabaseClient
        .from('webhook_logs')
        .select(`
          *,
          webhooks!inner(*)
        `)
        .eq('success', false)
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

      console.log(`Processing ${logs?.length || 0} webhook logs`);

      for (const log of logs || []) {
        try {
          console.log(`Processing webhook log ${log.id} for ${log.webhooks.url}`);
          
          const response = await fetch(log.webhooks.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(log.webhooks.secret_key && {
                'Authorization': `Bearer ${log.webhooks.secret_key}`
              })
            },
            body: JSON.stringify({
              event_type: log.event_type,
              table_name: log.table_name,
              timestamp: log.created_at,
              data: log.payload
            })
          });

          const success = response.ok;
          const responseBody = await response.text();

          // Update log
          await supabaseClient
            .from('webhook_logs')
            .update({
              success,
              response_status: response.status,
              response_body: responseBody.substring(0, 1000), // Limit size
              attempt_count: log.attempt_count + 1
            })
            .eq('id', log.id);

          console.log(`Webhook ${log.id} processed: ${success ? 'SUCCESS' : 'FAILED'}`);
        } catch (error) {
          console.error(`Error processing webhook ${log.id}:`, error);
          
          // Update attempt count
          await supabaseClient
            .from('webhook_logs')
            .update({
              attempt_count: log.attempt_count + 1,
              response_body: error.message
            })
            .eq('id', log.id);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Processed ${logs?.length || 0} webhook logs`
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
