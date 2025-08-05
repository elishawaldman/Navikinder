-- Enable required extensions for cron jobs and HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add email tracking column to dose_instances
ALTER TABLE dose_instances 
ADD COLUMN email_sent_at timestamp with time zone;

-- Create index for efficient cron queries
CREATE INDEX idx_dose_instances_due_datetime_pending 
ON dose_instances (due_datetime) 
WHERE status = 'pending' AND email_sent_at IS NULL;

-- Function to send medication reminder emails
CREATE OR REPLACE FUNCTION send_medication_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  dose_record RECORD;
  email_payload jsonb;
BEGIN
  -- Find dose instances due in exactly 15 minutes that haven't had emails sent
  FOR dose_record IN
    SELECT 
      di.id,
      di.due_datetime,
      di.dose_amount,
      di.dose_unit,
      m.name as medication_name,
      c.first_name as child_name,
      p.email as parent_email,
      p.display_name as parent_name
    FROM dose_instances di
    JOIN medications m ON di.medication_id = m.id
    JOIN children c ON di.child_id = c.id
    JOIN child_profiles cp ON c.id = cp.child_id
    JOIN profiles p ON cp.profile_id = p.id
    WHERE di.status = 'pending'
      AND di.email_sent_at IS NULL
      AND di.due_datetime >= now() + interval '14 minutes 30 seconds'
      AND di.due_datetime <= now() + interval '15 minutes 30 seconds'
      AND p.email IS NOT NULL
      AND cp.role IN ('owner', 'caregiver')
  LOOP
    -- Prepare email payload
    email_payload := jsonb_build_object(
      'dose_instance_id', dose_record.id,
      'due_datetime', dose_record.due_datetime,
      'dose_amount', dose_record.dose_amount,
      'dose_unit', dose_record.dose_unit,
      'medication_name', dose_record.medication_name,
      'child_name', dose_record.child_name,
      'parent_email', dose_record.parent_email,
      'parent_name', dose_record.parent_name
    );

    -- Call edge function to send email
    PERFORM net.http_post(
      url := 'https://nqrtkgxqgenflhpijpxa.supabase.co/functions/v1/send-medication-reminder',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcnRrZ3hxZ2VuZmxocGlqcHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTY4NzcsImV4cCI6MjA2OTI3Mjg3N30.YFkNt9Zz3pG8uVQj6UmsTCWuOswW7wDRSS5GGmELaXI"}'::jsonb,
      body := email_payload
    );

    -- Mark email as sent
    UPDATE dose_instances 
    SET email_sent_at = now() 
    WHERE id = dose_record.id;

    -- Log successful email attempt
    RAISE NOTICE 'Email reminder sent for dose instance % to %', dose_record.id, dose_record.parent_email;
  END LOOP;
END;
$$;

-- Schedule the function to run every minute
SELECT cron.schedule(
  'medication-reminders',
  '* * * * *', -- every minute
  'SELECT send_medication_reminders();'
);