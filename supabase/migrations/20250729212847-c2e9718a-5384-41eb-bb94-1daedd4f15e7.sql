-- Get current user ID and children for inserting sample medications
-- Add sample scheduled medications that will be due now

-- Insert a medication that should be due now for Watson
INSERT INTO public.medications (
  name,
  dose_amount,
  dose_unit,
  is_prn,
  child_id,
  notes,
  start_datetime,
  created_by
) VALUES (
  'Vitamins',
  2,
  'tablets',
  false,
  'bce4dec4-50ae-4c5e-9fe7-d89b5815521e', -- Watson
  'Daily vitamins with breakfast',
  now() - interval '1 hour',
  '5fd562a5-6998-40ae-a088-cebaddda4891' -- William's user ID from the logs
);

-- Insert another medication that should be overdue for Johnson
INSERT INTO public.medications (
  name,
  dose_amount,
  dose_unit,
  is_prn,
  child_id,
  notes,
  start_datetime,
  created_by
) VALUES (
  'Iron Supplement',
  5,
  'ml',
  false,
  'c1af6719-d048-4865-890f-5f92c346ac01', -- Johnson
  'Take with orange juice',
  now() - interval '2 hours',
  '5fd562a5-6998-40ae-a088-cebaddda4891' -- William's user ID
);

-- Create schedules for these medications
-- Get the current time to set up due medications
DO $$
DECLARE
  current_hour INTEGER := EXTRACT(hour FROM now());
  current_minute INTEGER := EXTRACT(minute FROM now());
  due_time TEXT;
  overdue_time TEXT;
  vitamins_med_id UUID;
  iron_med_id UUID;
BEGIN
  -- Get the medication IDs we just inserted
  SELECT id INTO vitamins_med_id FROM public.medications WHERE name = 'Vitamins' AND child_id = 'bce4dec4-50ae-4c5e-9fe7-d89b5815521e';
  SELECT id INTO iron_med_id FROM public.medications WHERE name = 'Iron Supplement' AND child_id = 'c1af6719-d048-4865-890f-5f92c346ac01';
  
  -- Set up a time that's due now (within 15 minutes)
  due_time := LPAD((current_hour)::TEXT, 2, '0') || ':' || LPAD((current_minute + 5)::TEXT, 2, '0');
  
  -- Set up a time that's overdue (30 minutes ago)
  IF current_minute >= 30 THEN
    overdue_time := LPAD((current_hour)::TEXT, 2, '0') || ':' || LPAD((current_minute - 30)::TEXT, 2, '0');
  ELSE
    overdue_time := LPAD((current_hour - 1)::TEXT, 2, '0') || ':' || LPAD((current_minute + 30)::TEXT, 2, '0');
  END IF;
  
  -- Create schedule for vitamins (due now)
  INSERT INTO public.medication_schedules (
    medication_id,
    rule_type,
    specific_times,
    active_from
  ) VALUES (
    vitamins_med_id,
    'specific_times',
    jsonb_build_array('08:00', due_time, '20:00'),
    now() - interval '1 day'
  );
  
  -- Create schedule for iron supplement (overdue)
  INSERT INTO public.medication_schedules (
    medication_id,
    rule_type,
    specific_times,
    active_from
  ) VALUES (
    iron_med_id,
    'specific_times',
    jsonb_build_array('09:00', overdue_time, '21:00'),
    now() - interval '1 day'
  );
END $$;