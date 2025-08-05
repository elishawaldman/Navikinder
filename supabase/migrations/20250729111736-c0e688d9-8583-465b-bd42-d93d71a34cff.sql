-- Fix RLS policy for children table to allow proper creation
-- The current policy conflicts because SELECT requires child_profiles relationship
-- but we need to create the child first before creating the relationship

-- Drop the current INSERT policy that might be causing issues
DROP POLICY IF EXISTS "Users can create children" ON public.children;

-- Create a proper INSERT policy that allows authenticated users to create children
CREATE POLICY "Authenticated users can create children" 
ON public.children 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Ensure the existing policies work correctly by checking them
-- The SELECT policy should work after the child_profiles relationship is created