-- Create children table
CREATE TABLE public.children (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived_at TIMESTAMP WITH TIME ZONE
);

-- Create child_profiles table (many-to-many caregiver ↔ child)
CREATE TABLE public.child_profiles (
  child_id UUID NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'caregiver', 'clinician')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (child_id, profile_id)
);

-- Enable Row Level Security
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.child_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children table
CREATE POLICY "Users can view children they have access to" 
ON public.children 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.child_profiles 
    WHERE child_profiles.child_id = children.id 
    AND child_profiles.profile_id = auth.uid()
  )
);

CREATE POLICY "Users can create children" 
ON public.children 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update children they have access to" 
ON public.children 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.child_profiles 
    WHERE child_profiles.child_id = children.id 
    AND child_profiles.profile_id = auth.uid()
    AND child_profiles.role IN ('owner', 'caregiver')
  )
);

-- RLS Policies for child_profiles table
CREATE POLICY "Users can view their own child relationships" 
ON public.child_profiles 
FOR SELECT 
USING (profile_id = auth.uid());

CREATE POLICY "Users can create child relationships for themselves" 
ON public.child_profiles 
FOR INSERT 
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own child relationships" 
ON public.child_profiles 
FOR UPDATE 
USING (profile_id = auth.uid());

CREATE POLICY "Users can delete their own child relationships" 
ON public.child_profiles 
FOR DELETE 
USING (profile_id = auth.uid());

-- Add trigger for automatic timestamp updates on children table
CREATE TRIGGER update_children_updated_at
BEFORE UPDATE ON public.children
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();