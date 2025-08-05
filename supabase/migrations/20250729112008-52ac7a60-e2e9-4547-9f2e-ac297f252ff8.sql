-- Create RPC function to handle child creation with relationship in one transaction
CREATE OR REPLACE FUNCTION public.create_child_with_relationship(
  p_first_name TEXT,
  p_date_of_birth DATE,
  p_profile_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  child_id UUID;
BEGIN
  -- Insert child and get the ID
  INSERT INTO public.children (first_name, date_of_birth)
  VALUES (p_first_name, p_date_of_birth)
  RETURNING id INTO child_id;
  
  -- Create the relationship
  INSERT INTO public.child_profiles (child_id, profile_id, role)
  VALUES (child_id, p_profile_id, 'owner');
  
  -- Return the child ID
  RETURN child_id;
END;
$$;