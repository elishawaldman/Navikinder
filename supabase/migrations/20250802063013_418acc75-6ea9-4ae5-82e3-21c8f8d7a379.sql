-- Add DELETE policy for dose_instances table
CREATE POLICY "Users can delete dose instances for their children" 
ON public.dose_instances 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1
  FROM child_profiles
  WHERE child_profiles.child_id = dose_instances.child_id 
    AND child_profiles.profile_id = auth.uid() 
    AND child_profiles.role = ANY (ARRAY['owner'::text, 'caregiver'::text])
));