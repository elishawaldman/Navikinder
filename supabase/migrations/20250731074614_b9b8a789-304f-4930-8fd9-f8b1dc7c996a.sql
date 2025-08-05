-- Create dose_instances table for pre-generated expected doses (scheduled meds)
CREATE TABLE public.dose_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL,
  schedule_id UUID NOT NULL,
  child_id UUID NOT NULL, -- denormalized for quick filters
  due_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE,
  window_end TIMESTAMP WITH TIME ZONE,
  dose_amount NUMERIC(10,3) NOT NULL,
  dose_unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'given', 'skipped', 'late')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.dose_instances
ADD CONSTRAINT fk_dose_instances_medication 
FOREIGN KEY (medication_id) REFERENCES public.medications(id) ON DELETE CASCADE;

ALTER TABLE public.dose_instances
ADD CONSTRAINT fk_dose_instances_schedule 
FOREIGN KEY (schedule_id) REFERENCES public.medication_schedules(id) ON DELETE CASCADE;

ALTER TABLE public.dose_instances
ADD CONSTRAINT fk_dose_instances_child 
FOREIGN KEY (child_id) REFERENCES public.children(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.dose_instances ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view dose instances for their children" 
ON public.dose_instances 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM child_profiles 
  WHERE child_profiles.child_id = dose_instances.child_id 
  AND child_profiles.profile_id = auth.uid()
));

CREATE POLICY "Users can create dose instances for their children" 
ON public.dose_instances 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM child_profiles 
  WHERE child_profiles.child_id = dose_instances.child_id 
  AND child_profiles.profile_id = auth.uid() 
  AND child_profiles.role IN ('owner', 'caregiver')
));

CREATE POLICY "Users can update dose instances for their children" 
ON public.dose_instances 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM child_profiles 
  WHERE child_profiles.child_id = dose_instances.child_id 
  AND child_profiles.profile_id = auth.uid() 
  AND child_profiles.role IN ('owner', 'caregiver')
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dose_instances_updated_at
BEFORE UPDATE ON public.dose_instances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_dose_instances_medication_id ON public.dose_instances(medication_id);
CREATE INDEX idx_dose_instances_child_id ON public.dose_instances(child_id);
CREATE INDEX idx_dose_instances_due_datetime ON public.dose_instances(due_datetime);
CREATE INDEX idx_dose_instances_status ON public.dose_instances(status);