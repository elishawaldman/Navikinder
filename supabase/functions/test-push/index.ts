import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("🧪 TEST PUSH Function invoked at", new Date().toISOString());
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "support@navikinder.com";
    
    console.log("🔑 Using VAPID public key:", vapidPublicKey.substring(0, 20) + "...");
    
    // Set VAPID details
    webpush.setVapidDetails(
      vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the most recent push subscription from the database
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("❌ Database error:", error);
      throw error;
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No push subscriptions found in database. Please subscribe first." 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const subscription = subscriptions[0];
    console.log("📱 Using subscription:", {
      id: subscription.id,
      endpoint: subscription.endpoint.substring(0, 50) + "...",
      is_ios: subscription.is_ios,
      created_at: subscription.created_at
    });
    
    // Create test payload - exactly like Aleksandrs' working format
    const payload = JSON.stringify({
      notification: {
        title: '🧪 Test Push - Direct',
        body: 'This is a test from your test-push function',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        sound: 'default'
      },
      data: {
        test: true,
        timestamp: Date.now()
      }
    });
    
    console.log("📦 Sending payload:", payload);
    
    // Send push notification - NO OPTIONS (like Aleksandrs' working version)
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      payload
      // NO OPTIONS - this is critical for iOS compatibility
    );
    
    console.log("✅ Push notification sent successfully");
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Test push notification sent successfully",
        subscription: {
          endpoint: subscription.endpoint.substring(0, 50) + "...",
          is_ios: subscription.is_ios
        },
        payload: JSON.parse(payload)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error: any) {
    console.error("❌ Test push error:", error);
    
    let errorMessage = error.message;
    let statusCode = 500;
    
    // Handle specific errors
    if (error.body && error.body.includes('VapidPkHashMismatch')) {
      errorMessage = "VAPID key mismatch - subscription was created with different keys";
      statusCode = 400;
    } else if (error.statusCode === 410) {
      errorMessage = "Subscription has expired";
      statusCode = 410;
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: {
          statusCode: error.statusCode,
          body: error.body
        }
      }),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
};

serve(handler);