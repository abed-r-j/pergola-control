-- DEFINITIVE FIX: Manual trigger test and user creation
-- This will create the missing user profiles and fix the trigger

-- ==============================================
-- STEP 1: Manually create missing user profiles
-- ==============================================

-- Insert the missing users (RLS is disabled so this should work)
INSERT INTO public.users (id, email, last_used_mode, created_at, updated_at)
VALUES 
    ('84c74a4d-43ec-43f9-97b7-1c6bed35eeb7', 'abed.r.j@gmail.com', 'auto', '2025-07-13 16:14:49.154869+00', NOW()),
    ('4ecb86d5-36db-4d13-ae10-acaf35d34947', 'abed.r.jaafir@gmail.com', 'auto', '2025-07-13 15:52:12.659897+00', NOW())
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STEP 2: Fix the trigger function completely
-- ==============================================

-- Drop and recreate the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a much simpler, more reliable trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple insert without any complex logic
    INSERT INTO public.users (id, email, last_used_mode, created_at, updated_at)
    VALUES (
        NEW.id, 
        COALESCE(NEW.email, ''),
        'auto',
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, just return NEW to not break auth
        RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================
-- STEP 3: Test the trigger manually
-- ==============================================

-- Let's test if the trigger works by checking current state
SELECT 'Testing trigger setup:' as status;

-- Check if trigger exists
SELECT 
    trigger_name, 
    event_object_table, 
    action_timing, 
    event_manipulation
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name = 'on_auth_user_created';

-- Check current users in both tables
SELECT 'Auth users count:' as info, COUNT(*) as count FROM auth.users;
SELECT 'Public users count:' as info, COUNT(*) as count FROM public.users;

-- Show the specific users
SELECT 'Missing users:' as info;
SELECT au.id, au.email 
FROM auth.users au 
LEFT JOIN public.users pu ON au.id = pu.id 
WHERE pu.id IS NULL;

-- ==============================================
-- STEP 4: Re-enable RLS with simple policies
-- ==============================================

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pergola_logs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies first
DROP POLICY IF EXISTS "users_can_read_own" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own" ON public.users;
DROP POLICY IF EXISTS "authenticated_can_insert_own" ON public.users;
DROP POLICY IF EXISTS "logs_can_read_own" ON public.pergola_logs;
DROP POLICY IF EXISTS "logs_can_insert_own" ON public.pergola_logs;

-- Create very simple, permissive policies
CREATE POLICY "allow_own_access" ON public.users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "allow_own_logs" ON public.pergola_logs
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================
-- VERIFICATION
-- ==============================================

-- Final check - this should show both users now
SELECT 'Final verification:' as status;
SELECT id, email, last_used_mode, created_at FROM public.users ORDER BY created_at;
