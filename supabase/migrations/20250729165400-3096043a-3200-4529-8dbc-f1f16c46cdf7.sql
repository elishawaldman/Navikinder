-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES public.children(id),
  name TEXT NOT NULL,
  dose_amount NUMERIC(10,3) NOT NULL,
  dose_unit TEXT NOT NULL,
  is_prn BOOLEAN NOT NULL,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE,
  stopped_reason TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Create medication_schedules table (only for scheduled medications)
CREATE TABLE public.medication_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id),
  rule_type TEXT NOT NULL CHECK (rule_type IN ('every_x_hours', 'times_per_day', 'specific_times')),
  times_per_day SMALLINT,
  every_x_hours SMALLINT,
  specific_times JSONB,
  active_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active_to TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for medications table
CREATE POLICY "Users can view medications for their children" 
ON public.medications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.child_profiles 
    WHERE child_profiles.child_id = medications.child_id 
    AND child_profiles.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create medications for their children" 
ON public.medications 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
  AND EXISTS (
    SELECT 1 FROM public.child_profiles 
    WHERE child_profiles.child_id = medications.child_id 
    AND child_profiles.profile_id = auth.uid()
    AND child_profiles.role IN ('owner', 'caregiver')
  )
);

CREATE POLICY "Users can update medications for their children" 
ON public.medications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.child_profiles 
    WHERE child_profiles.child_id = medications.child_id 
    AND child_profiles.profile_id = auth.uid()
    AND child_profiles.role IN ('owner', 'caregiver')
  )
);

-- RLS policies for medication_schedules table
CREATE POLICY "Users can view schedules for their children's medications" 
ON public.medication_schedules 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.child_profiles cp ON cp.child_id = m.child_id
    WHERE m.id = medication_schedules.medication_id 
    AND cp.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create schedules for their children's medications" 
ON public.medication_schedules 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.child_profiles cp ON cp.child_id = m.child_id
    WHERE m.id = medication_schedules.medication_id 
    AND cp.profile_id = auth.uid()
    AND cp.role IN ('owner', 'caregiver')
  )
);

CREATE POLICY "Users can update schedules for their children's medications" 
ON public.medication_schedules 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.child_profiles cp ON cp.child_id = m.child_id
    WHERE m.id = medication_schedules.medication_id 
    AND cp.profile_id = auth.uid()
    AND cp.role IN ('owner', 'caregiver')
  )
);

-- Add update triggers for both tables
CREATE TRIGGER update_medications_updated_at
  BEFORE UPDATE ON public.medications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_schedules_updated_at
  BEFORE UPDATE ON public.medication_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_medications_child_id ON public.medications(child_id);
CREATE INDEX idx_medications_created_by ON public.medications(created_by);
CREATE INDEX idx_medications_is_prn ON public.medications(is_prn);
CREATE INDEX idx_medication_schedules_medication_id ON public.medication_schedules(medication_id);