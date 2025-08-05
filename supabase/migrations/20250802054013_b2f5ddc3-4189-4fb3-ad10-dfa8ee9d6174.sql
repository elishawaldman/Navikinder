-- First, update existing data to have capitalized routes
UPDATE public.medications 
SET route = CASE 
  WHEN route = 'oral' THEN 'Oral'
  WHEN route = 'via nasogastic tube' THEN 'Via nasogastic tube'
  WHEN route = 'via nasojejeunal tube' THEN 'Via nasojejeunal tube'
  WHEN route = 'via gastric tube' THEN 'Via gastric tube'
  WHEN route = 'sublingual' THEN 'Sublingual'
  WHEN route = 'subcutaneous' THEN 'Subcutaneous'
  WHEN route = 'intravenous' THEN 'Intravenous'
  WHEN route = 'transdermal' THEN 'Transdermal'
  ELSE route
END;

-- Drop the old check constraint
ALTER TABLE public.medications 
DROP CONSTRAINT medications_route_check;

-- Add new check constraint with capitalized values
ALTER TABLE public.medications 
ADD CONSTRAINT medications_route_check 
CHECK (route IN ('Oral', 'Via nasogastic tube', 'Via nasojejeunal tube', 'Via gastric tube', 'Sublingual', 'Subcutaneous', 'Intravenous', 'Transdermal'));

-- Update the default value to be capitalized
ALTER TABLE public.medications 
ALTER COLUMN route SET DEFAULT 'Oral';