// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import webpush from "npm:web-push@3.6.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

const handler = async (req: Request): Promise<Response> => {
  console.log("🚀 Push notification function invoked at", new Date().toISOString());

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidEmailRaw = Deno.env.get("VAPID_EMAIL") || "support@medication-tracker.com";
    const vapidEmail = vapidEmailRaw.startsWith("mailto:") ? vapidEmailRaw : `mailto:${vapidEmailRaw}`;

    console.log("📧 VAPID email configured:", vapidEmail);
    
    // Configure VAPID details with increased TTL for iOS
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    
    // iOS needs longer TTL - set to 12 hours
    webpush.setGCMAPIKey(null); // Clear any GCM key
    const options = {
      TTL: 43200, // 12 hours for iOS compatibility
      urgency: 'high',
      topic: 'medication-reminder'
    };

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: PushNotificationRequest = await req.json();
    console.log(`📱 Preparing push for: ${requestData.child_name}'s ${requestData.medication_name}`);
    console.log(`📧 Looking for user with email: ${requestData.parent_email}`);

    // Get user ID from email - try both auth and profiles
    let userId: string | null = null;
    
    // First try to get from profiles table
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", requestData.parent_email)
      .single();

    if (userProfile) {
      userId = userProfile.id;
      console.log("✅ Found user in profiles:", userId);
    } else {
      console.log("⚠️ User not found in profiles, checking auth...");
      
      // Try to find by auth email (case-insensitive)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authData?.users) {
        const user = authData.users.find(u => 
          u.email?.toLowerCase() === requestData.parent_email.toLowerCase()
        );
        if (user) {
          userId = user.id;
          console.log("✅ Found user in auth:", userId);
        }
      }
    }

    if (!userId) {
      console.error("❌ User not found with email:", requestData.parent_email);
      return new Response(
        JSON.stringify({ 
          message: "User not found",
          email: requestData.parent_email 
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);

    if (subscriptionError) {
      console.error("❌ Error fetching subscriptions:", subscriptionError);
      throw subscriptionError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("📭 No push subscriptions found for user:", userId);
      return new Response(
        JSON.stringify({ 
          message: "No push subscriptions found",
          user_id: userId 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📲 Found ${subscriptions.length} subscription(s) for user`);

    // Format notification
    const dueTime = new Date(requestData.due_datetime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // iOS-optimized payload structure
    const payload = JSON.stringify({
      title: `💊 ${requestData.medication_name} Reminder`,
      body: `Time for ${requestData.child_name}'s medication (${requestData.dose_amount} ${requestData.dose_unit})`,
      data: {
        doseInstanceId: requestData.dose_instance_id,
        medicationName: requestData.medication_name,
        childName: requestData.child_name,
        doseAmount: requestData.dose_amount,
        doseUnit: requestData.dose_unit,
        dueTime: requestData.due_datetime,
        timestamp: Date.now()
      }
    });

    // Send to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          const isIOS = subscription.is_ios || 
                       subscription.endpoint.includes('push.apple.com');
          
          console.log(`📤 Sending to ${isIOS ? 'iOS' : 'Web'} device:`, 
                     subscription.endpoint.substring(0, 50) + '...');

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          // Send with iOS-specific options if needed
          const sendOptions = isIOS ? {
            ...options,
            headers: {
              'apns-priority': '10',
              'apns-push-type': 'alert',
              'apns-topic': 'web.com.navikinder' // Adjust if you have a different bundle ID
            }
          } : options;

          await webpush.sendNotification(
            pushSubscription, 
            payload,
            sendOptions
          );
          
          console.log(`✅ Push sent successfully to ${isIOS ? 'iOS' : 'Web'} device`);
          return { 
            success: true, 
            endpoint: subscription.endpoint,
            platform: isIOS ? 'iOS' : 'Web'
          };
        } catch (error: any) {
          console.error(`❌ Failed to send to ${subscription.endpoint.substring(0, 50)}...`);
          console.error('Error details:', {
            statusCode: error.statusCode,
            message: error.message,
            body: error.body
          });
          
          // Remove invalid subscriptions
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log("🗑️ Removing invalid subscription");
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          }
          
          return { 
            success: false, 
            endpoint: subscription.endpoint, 
            error: error.message,
            statusCode: error.statusCode 
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`📊 Results: ${successCount} sent, ${failCount} failed`);
    console.log('Detailed results:', JSON.stringify(results, null, 2));

    return new Response(
      JSON.stringify({
        message: "Push notifications processed",
        sent: successCount,
        failed: failCount,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);