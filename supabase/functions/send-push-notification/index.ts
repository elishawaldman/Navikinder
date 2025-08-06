import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  dose_instance_id: string;
  due_datetime: string;
  dose_amount: number;
  dose_unit: string;
  medication_name: string;
  child_name: string;
  parent_email: string;
  parent_name: string;
}

// Helper function to convert standard Base64 to URL-safe Base64
function toUrlSafeBase64(base64: string): string {
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function sendWebPushNotification(
  subscription: any,
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidEmail: string
) {
  const endpointUrl = new URL(subscription.endpoint);
  const isApplePush = endpointUrl.hostname.includes('push.apple.com');
  console.log(`📱 Sending to ${isApplePush ? 'Apple' : 'FCM'} push service`);
  
  // Set VAPID details
  webpush.setVapidDetails(
    vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
  
  try {
    // CRITICAL FIX: Convert Base64 to URL-safe format if needed
    const p256dh = toUrlSafeBase64(subscription.p256dh);
    const auth = toUrlSafeBase64(subscription.auth);
    
    console.log('🔐 Keys format check:', {
      p256dh_original: subscription.p256dh.substring(0, 20) + '...',
      p256dh_converted: p256dh.substring(0, 20) + '...',
      auth_original: subscription.auth.substring(0, 10) + '...',
      auth_converted: auth.substring(0, 10) + '...'
    });
    
    // CRITICAL: Send WITHOUT options - exactly like Aleksandrs' working example
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dh,
          auth: auth
        }
      },
      payload
      // NO OPTIONS HERE - this is critical for iOS
    );
    
    console.log(`✅ Successfully sent to ${isApplePush ? 'Apple' : 'FCM'}`);
    return { 
      success: true, 
      platform: isApplePush ? 'iOS' : 'Web', 
      endpoint: subscription.endpoint 
    };
  } catch (error: any) {
    console.error(`❌ Failed to send push:`, error);
    
    // Log detailed error info
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
      console.error(`Headers:`, error.headers);
      console.error(`Body:`, error.body);
      
      // Check for specific VAPID error
      if (error.body && error.body.includes('VapidPkHashMismatch')) {
        console.error('🔴 VAPID KEY MISMATCH - Subscription was created with different VAPID keys!');
      }
    }
    
    return {
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      body: error.body,
      platform: isApplePush ? 'iOS' : 'Web',
      endpoint: subscription.endpoint
    };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 Push notification function invoked at", new Date().toISOString());
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "support@navikinder.com";
    
    console.log("📧 VAPID configured for:", vapidEmail);
    console.log("🔑 Using VAPID public key:", vapidPublicKey.substring(0, 20) + "...");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData: PushNotificationRequest = await req.json();
    console.log(`📱 Processing: ${requestData.child_name}'s ${requestData.medication_name}`);
    
    // Find user
    let userId: string | null = null;
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", requestData.parent_email)
      .single();
    
    if (userProfile) {
      userId = userProfile.id;
      console.log('✅ Found user in profiles:', userId);
    } else {
      // Fallback to auth users
      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find(u =>
        u.email?.toLowerCase() === requestData.parent_email.toLowerCase()
      );
      userId = user?.id || null;
      if (userId) {
        console.log('✅ Found user in auth:', userId);
      }
    }
    
    if (!userId) {
      console.error('❌ User not found for email:', requestData.parent_email);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);
    
    if (subError) {
      console.error('❌ Database error:', subError);
      throw subError;
    }
    
    if (!subscriptions?.length) {
      console.log('⚠️ No subscriptions found for user:', userId);
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`📲 Found ${subscriptions.length} subscription(s)`);
    
    // Create payload - EXACT format that works with Aleksandrs' test
    const notificationPayload = {
      notification: {
        title: `💊 ${requestData.medication_name}`,
        body: `Time for ${requestData.child_name}'s medication (${requestData.dose_amount} ${requestData.dose_unit})`,
        icon: '/navikinder-logo-256.png',
        badge: '/navikinder-logo-256.png',
        sound: 'default'
      },
      data: {
        doseInstanceId: requestData.dose_instance_id,
        medicationName: requestData.medication_name,
        childName: requestData.child_name,
        timestamp: Date.now()
      }
    };
    
    const payloadString = JSON.stringify(notificationPayload);
    console.log('📦 Payload:', payloadString);
    
    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(sub => {
        console.log(`📤 Processing subscription:`, {
          id: sub.id,
          endpoint: sub.endpoint.substring(0, 50) + '...',
          is_ios: sub.is_ios
        });
        
        return sendWebPushNotification(
          sub,
          payloadString,
          vapidPublicKey,
          vapidPrivateKey,
          vapidEmail
        );
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failureDetails = results.filter(r => !r.success);
    
    console.log(`📊 Results: ${successCount}/${results.length} successful`);
    if (failureDetails.length > 0) {
      console.log('❌ Failures:', JSON.stringify(failureDetails, null, 2));
      
      // Check for VAPID mismatch errors
      const vapidErrors = failureDetails.filter(f => 
        f.body && f.body.includes('VapidPkHashMismatch')
      );
      if (vapidErrors.length > 0) {
        console.error('🔴 CRITICAL: VAPID key mismatch detected! Users need to re-subscribe.');
      }
    }
    
    // Clean up failed subscriptions (410 = gone)
    for (let i = 0; i < results.length; i++) {
      if (!results[i].success && results[i].statusCode === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscriptions[i].id);
        console.log('🗑️ Removed expired subscription:', subscriptions[i].id);
      }
    }
    
    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        sent: successCount,
        failed: results.length - successCount,
        results
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message, details: error.toString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);