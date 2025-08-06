// debug-log/index.ts - Edge function to receive debug logs
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const logData = await req.json();
    
    // Log with clear formatting
    console.log('=====================================');
    console.log(`📱 SW LOG: ${logData.message}`);
    if (logData.data && Object.keys(logData.data).length > 0) {
      console.log('Data:', JSON.stringify(logData.data, null, 2));
    }
    console.log(`Time: ${logData.timestamp}`);
    console.log('=====================================');
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Debug log error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);