-- UPDATE DATABASE SCHEMA: Remove height columns from pergola_logs
-- Run this script AFTER the definitive-fix.sql to update the schema

-- ==============================================
-- STEP 1: Update pergola_logs table structure
-- ==============================================

-- Drop the actuator_height column from pergola_logs
ALTER TABLE public.pergola_logs DROP COLUMN IF EXISTS actuator_height;

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Check the updated table structure
SELECT 'Updated pergola_logs structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pergola_logs' 
ORDER BY ordinal_position;
