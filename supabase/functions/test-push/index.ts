// test-push.ts - Deploy this as a separate edge function for testing
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("🧪 TEST PUSH - Matching Aleksandrs' exact format");
    
    // Get YOUR VAPID keys from environment
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    
    // Set VAPID details - exactly like Aleksandrs' send.js
    webpush.setVapidDetails(
      'mailto:support@navikinder.com',
      vapidPublicKey,
      vapidPrivateKey
    );
    
    // Your new subscription from database
    const subscription = {
      endpoint: "https://web.push.apple.com/QBKxtmPq813p2kDfHbxwqtmp34t1ETsTZz4LJkP5G2YtPqpnqhHe9nxfo5o0g3AVZIFLo0epGQRWlVvumK597atfH4IO3NaRgd6tDRvq71I3Q9glj8Z4VicCcA7PXrWix7LDshInOA7rrbHJ1sb0Igu_HQ8kp6zTDSHxV_e97-U",
      keys: {
        // Remove the = padding to make URL-safe
        p256dh: "BJxK5NSaRxp3DQeNQI17xoBClgW3ttRjvIE/dHwkNJyPNZ63m8wDg+7FjoLztPIy4Qb6vs7TJDwcTY6mHeTcSmQ",
        auth: "2AQgZgheEk7fvteskCilDw"
      }
    };
    
    // Payload - EXACTLY like Aleksandrs' format
    const payload = JSON.stringify({
      notification: {
        title: '🔔 Test Push',
        body: 'This is a test from YOUR app with YOUR keys',
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        sound: 'default'
      },
      data: {
        tag: 'test-' + Date.now()
      }
    });
    
    console.log('📤 Sending notification...');
    console.log('Subscription:', JSON.stringify(subscription, null, 2));
    console.log('Payload:', payload);
    
    try {
      // Send EXACTLY like Aleksandrs - NO OPTIONS
      await webpush.sendNotification(subscription, payload);
      
      console.log('✅ Push sent successfully');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Push sent successfully"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      console.error('❌ Send failed:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          statusCode: error.statusCode,
          body: error.body 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("❌ Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);