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
  console.log("🚀 Push notification function invoked");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const vapidEmail = Deno.env.get("VAPID_EMAIL") || "mailto:support@medication-tracker.com";

    // Configure VAPID details
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: PushNotificationRequest = await req.json();
    console.log(`📱 Preparing push notification for ${requestData.child_name}'s ${requestData.medication_name}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", requestData.parent_email); // This should be user_id, but we'll need to map email to user_id

    if (subscriptionError) {
      console.error("❌ Error fetching push subscriptions:", subscriptionError);
      throw subscriptionError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("📭 No push subscriptions found for user");
      return new Response(
        JSON.stringify({ message: "No push subscriptions found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Format due time
    const dueTime = new Date(requestData.due_datetime).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create notification payload
    const payload = JSON.stringify({
      title: "Medication Reminder",
      body: `Time for ${requestData.child_name}'s ${requestData.medication_name} (${requestData.dose_amount} ${requestData.dose_unit}) - Due at ${dueTime}`,
      data: {
        doseInstanceId: requestData.dose_instance_id,
        medicationName: requestData.medication_name,
        childName: requestData.child_name,
        doseAmount: requestData.dose_amount,
        doseUnit: requestData.dose_unit,
        dueTime: requestData.due_datetime
      }
    });

    // Send notifications to all user's subscriptions
    const notifications = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        console.log(`✅ Push notification sent successfully to ${subscription.endpoint.substring(0, 50)}...`);
        return { success: true, endpoint: subscription.endpoint };
      } catch (error: any) {
        console.error(`❌ Failed to send push notification to ${subscription.endpoint.substring(0, 50)}...`, error);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log("🗑️ Removing invalid subscription");
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("id", subscription.id);
        }
        
        return { success: false, endpoint: subscription.endpoint, error: error.message };
      }
    });

    const results = await Promise.all(notifications);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`📊 Push notification results: ${successCount} sent, ${failCount} failed`);

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
    console.error("❌ Error in send-push-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);