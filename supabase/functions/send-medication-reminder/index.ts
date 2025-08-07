import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@4.0.0"
import { renderAsync } from "npm:@react-email/components@0.0.22"
import * as React from "npm:react@18.3.1"
import { MedicationReminderEmail } from "./_templates/medication-reminder.tsx"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MedicationReminderRequest {
  dose_instance_id: string
  due_datetime: string
  dose_amount: number
  dose_unit: string
  medication_name: string
  child_name: string
  parent_email: string
  parent_name?: string
  parent_timezone?: string
}

const handler = async (req: Request): Promise<Response> => {
  console.log('🚀 Medication reminder function invoked')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const {
      dose_instance_id,
      due_datetime,
      dose_amount,
      dose_unit,
      medication_name,
      child_name,
      parent_email,
      parent_name,
      parent_timezone = 'UTC',
    }: MedicationReminderRequest = await req.json()

    console.log(`📧 Sending reminder for ${child_name}'s ${medication_name} to ${parent_email} (timezone: ${parent_timezone})`)

    // Get app domain from environment or use default
    const app_domain = Deno.env.get('APP_DOMAIN') || 'navikinder.com';

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(MedicationReminderEmail, {
        child_name,
        medication_name,
        dose_amount,
        dose_unit,
        due_datetime,
        dose_instance_id,
        parent_name,
        parent_timezone,
        app_domain,
      })
    )

    // Format subject line with user's timezone
    const dueTime = new Date(due_datetime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: parent_timezone,
    })

    const subject = `💊 Reminder: ${child_name}'s ${medication_name} due at ${dueTime}`

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: 'Navikinder <info@navikinder.com>',
      to: [parent_email],
      subject: subject,
      html: html,
    })

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error)
      throw emailResponse.error
    }

    console.log('✅ Email sent successfully:', emailResponse.data?.id)

    // Also send push notification
    let pushNotificationResult = null;
    try {
      const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dose_instance_id,
          due_datetime,
          dose_amount,
          dose_unit,
          medication_name,
          child_name,
          parent_email,
          parent_name,
        }),
      });

      if (pushResponse.ok) {
        pushNotificationResult = await pushResponse.json();
        console.log('✅ Push notification sent successfully');
      } else {
        console.log('⚠️ Push notification failed, but email was sent');
      }
    } catch (pushError) {
      console.error('⚠️ Push notification error:', pushError);
      // Don't fail the whole request if push notification fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.data?.id,
        push_notification: pushNotificationResult,
        dose_instance_id 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error in send-medication-reminder function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send medication reminder',
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    )
  }
}

serve(handler)