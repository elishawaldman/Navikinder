-- First, let's see what routes currently exist in the table
SELECT DISTINCT route FROM public.medications;

-- Drop the old check constraint first
ALTER TABLE public.medications 
DROP CONSTRAINT IF EXISTS medications_route_check;

-- Update existing data to have capitalized routes
UPDATE public.medications 
SET route = CASE 
  WHEN LOWER(route) = 'oral' THEN 'Oral'
  WHEN LOWER(route) = 'via nasogastic tube' THEN 'Via nasogastic tube'
  WHEN LOWER(route) = 'via nasojejeunal tube' THEN 'Via nasojejeunal tube'
  WHEN LOWER(route) = 'via gastric tube' THEN 'Via gastric tube'
  WHEN LOWER(route) = 'sublingual' THEN 'Sublingual'
  WHEN LOWER(route) = 'subcutaneous' THEN 'Subcutaneous'
  WHEN LOWER(route) = 'intravenous' THEN 'Intravenous'
  WHEN LOWER(route) = 'transdermal' THEN 'Transdermal'
  ELSE route
END;

-- Add new check constraint with capitalized values
ALTER TABLE public.medications 
ADD CONSTRAINT medications_route_check 
CHECK (route IN ('Oral', 'Via nasogastic tube', 'Via nasojejeunal tube', 'Via gastric tube', 'Sublingual', 'Subcutaneous', 'Intravenous', 'Transdermal'));

-- Update the default value to be capitalized
ALTER TABLE public.medications 
ALTER COLUMN route SET DEFAULT 'Oral';