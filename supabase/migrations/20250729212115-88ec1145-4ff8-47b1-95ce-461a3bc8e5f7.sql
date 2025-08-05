-- Create dose_logs table for tracking medication administration
CREATE TABLE public.dose_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL,
  child_id UUID NOT NULL,
  dose_instance_id UUID NULL,
  is_prn BOOLEAN NOT NULL,
  amount_given NUMERIC(10,3) NOT NULL,
  unit TEXT NOT NULL,
  given_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  recorded_by UUID NOT NULL,
  was_given BOOLEAN NOT NULL DEFAULT true,
  reason_given TEXT,
  reason_not_given TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for dose_logs
CREATE POLICY "Users can view dose logs for their children" 
ON public.dose_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM child_profiles 
  WHERE child_profiles.child_id = dose_logs.child_id 
  AND child_profiles.profile_id = auth.uid()
));

CREATE POLICY "Users can create dose logs for their children" 
ON public.dose_logs 
FOR INSERT 
WITH CHECK (
  auth.uid() = recorded_by 
  AND EXISTS (
    SELECT 1 FROM child_profiles 
    WHERE child_profiles.child_id = dose_logs.child_id 
    AND child_profiles.profile_id = auth.uid() 
    AND child_profiles.role = ANY(ARRAY['owner', 'caregiver'])
  )
);

CREATE POLICY "Users can update dose logs for their children" 
ON public.dose_logs 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM child_profiles 
  WHERE child_profiles.child_id = dose_logs.child_id 
  AND child_profiles.profile_id = auth.uid() 
  AND child_profiles.role = ANY(ARRAY['owner', 'caregiver'])
));

-- Add foreign key constraints
ALTER TABLE public.dose_logs 
ADD CONSTRAINT fk_dose_logs_medication 
FOREIGN KEY (medication_id) REFERENCES public.medications(id);

ALTER TABLE public.dose_logs 
ADD CONSTRAINT fk_dose_logs_child 
FOREIGN KEY (child_id) REFERENCES public.children(id);

ALTER TABLE public.dose_logs 
ADD CONSTRAINT fk_dose_logs_recorded_by 
FOREIGN KEY (recorded_by) REFERENCES public.profiles(id);

-- Create indexes for better performance
CREATE INDEX idx_dose_logs_medication_id ON public.dose_logs(medication_id);
CREATE INDEX idx_dose_logs_child_id ON public.dose_logs(child_id);
CREATE INDEX idx_dose_logs_given_datetime ON public.dose_logs(given_datetime);
CREATE INDEX idx_dose_logs_was_given ON public.dose_logs(was_given);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dose_logs_updated_at
BEFORE UPDATE ON public.dose_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();