-- Add route column to medications table
ALTER TABLE public.medications 
ADD COLUMN route text NOT NULL DEFAULT 'oral';

-- Add a check constraint to ensure only valid routes are stored
ALTER TABLE public.medications 
ADD CONSTRAINT medications_route_check 
CHECK (route IN ('oral', 'via nasogastic tube', 'via nasojejeunal tube', 'via gastric tube', 'sublingual', 'subcutaneous', 'intravenous', 'transdermal'));