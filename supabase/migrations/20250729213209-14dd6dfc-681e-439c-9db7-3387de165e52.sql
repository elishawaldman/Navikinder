-- Update the scheduled times to be due right now
-- Get current time and set up proper due times

DO $$
DECLARE
  current_hour INTEGER := EXTRACT(hour FROM now());
  current_minute INTEGER := EXTRACT(minute FROM now());
  due_now_time TEXT;
  overdue_time TEXT;
  vitamins_med_id UUID;
  iron_med_id UUID;
BEGIN
  -- Get the medication IDs
  SELECT id INTO vitamins_med_id FROM public.medications WHERE name = 'Vitamins' AND child_id = 'bce4dec4-50ae-4c5e-9fe7-d89b5815521e';
  SELECT id INTO iron_med_id FROM public.medications WHERE name = 'Iron Supplement' AND child_id = 'c1af6719-d048-4865-890f-5f92c346ac01';
  
  -- Set up a time that's due now (current time minus 5 minutes)
  IF current_minute >= 5 THEN
    due_now_time := LPAD((current_hour)::TEXT, 2, '0') || ':' || LPAD((current_minute - 5)::TEXT, 2, '0');
  ELSE
    due_now_time := LPAD((current_hour - 1)::TEXT, 2, '0') || ':' || LPAD((current_minute + 55)::TEXT, 2, '0');
  END IF;
  
  -- Set up a time that's overdue (current time minus 30 minutes)
  IF current_minute >= 30 THEN
    overdue_time := LPAD((current_hour)::TEXT, 2, '0') || ':' || LPAD((current_minute - 30)::TEXT, 2, '0');
  ELSE
    overdue_time := LPAD((current_hour - 1)::TEXT, 2, '0') || ':' || LPAD((current_minute + 30)::TEXT, 2, '0');
  END IF;
  
  -- Update the schedules with new times
  UPDATE public.medication_schedules 
  SET specific_times = jsonb_build_array('08:00', due_now_time, '20:00')
  WHERE medication_id = vitamins_med_id;
  
  UPDATE public.medication_schedules 
  SET specific_times = jsonb_build_array('09:00', overdue_time, '21:00')
  WHERE medication_id = iron_med_id;
  
  -- Debug output
  RAISE NOTICE 'Updated vitamins schedule with due_now_time: %', due_now_time;
  RAISE NOTICE 'Updated iron schedule with overdue_time: %', overdue_time;
  RAISE NOTICE 'Current time is: %', now();
END $$;