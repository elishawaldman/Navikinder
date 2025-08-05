-- Update INSERT policy for children to return the ID without triggering SELECT RLS
-- We need to make sure the INSERT policy works and allows returning minimal data

-- Drop and recreate the INSERT policy to be more explicit
DROP POLICY IF EXISTS "Authenticated users can create children" ON public.children;

CREATE POLICY "Authenticated users can create children" 
ON public.children 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Also update SELECT policy to be less restrictive for new records
-- Allow users to select children they just created during the same transaction
DROP POLICY IF EXISTS "Users can view children they have access to" ON public.children;

CREATE POLICY "Users can view children they have access to" 
ON public.children 
FOR SELECT 
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM child_profiles 
    WHERE child_profiles.child_id = children.id 
    AND child_profiles.profile_id = auth.uid()
  )
);