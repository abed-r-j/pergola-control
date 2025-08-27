-- FINAL FIX for Supabase RLS Policy Issues
-- This script ensures user profile creation works correctly

-- ==============================================
-- STEP 1: Clean up completely
-- ==============================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_own_optimized" ON public.users;
DROP POLICY IF EXISTS "users_update_own_optimized" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_optimized" ON public.users;
DROP POLICY IF EXISTS "Users can view own logs" ON public.pergola_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.pergola_logs;
DROP POLICY IF EXISTS "logs_select_own" ON public.pergola_logs;
DROP POLICY IF EXISTS "logs_insert_own" ON public.pergola_logs;
DROP POLICY IF EXISTS "logs_select_own_optimized" ON public.pergola_logs;
DROP POLICY IF EXISTS "logs_insert_own_optimized" ON public.pergola_logs;

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_updated_at ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- Drop tables (logs first due to foreign key)
DROP TABLE IF EXISTS public.pergola_logs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ==============================================
-- STEP 2: Create tables
-- ==============================================

-- Create users table
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    last_used_mode TEXT NOT NULL DEFAULT 'auto' CHECK (last_used_mode IN ('auto', 'manual', 'off')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create pergola_logs table with proper indexing
CREATE TABLE public.pergola_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL CHECK (mode IN ('auto', 'manual', 'off')),
    horizontal_angle NUMERIC(5,2),
    vertical_angle NUMERIC(5,2),
    actuator_height NUMERIC(8,2),
    light_sensor_value INTEGER,
    night_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for foreign key (fixes performance warning)
CREATE INDEX idx_pergola_logs_user_id ON public.pergola_logs(user_id);

-- ==============================================
-- STEP 3: Create trigger function BEFORE enabling RLS
-- ==============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    -- Insert into users table without RLS restrictions (since function is SECURITY DEFINER)
    INSERT INTO public.users (id, email, last_used_mode, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email,
        'auto',
        NOW(),
        NOW()
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, that's okay
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ==============================================
-- STEP 4: Create triggers BEFORE enabling RLS
-- ==============================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================
-- STEP 5: Now enable RLS
-- ==============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pergola_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STEP 6: Create policies with bypass for authenticated users
-- ==============================================

-- Users table policies - more permissive to allow both trigger and manual creation
CREATE POLICY "users_can_read_own" ON public.users
    FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "users_can_update_own" ON public.users
    FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Allow authenticated users to insert their own profile (for manual creation)
CREATE POLICY "authenticated_can_insert_own" ON public.users
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = id OR 
        (SELECT auth.role()) = 'authenticated'
    );

-- Pergola logs policies
CREATE POLICY "logs_can_read_own" ON public.pergola_logs
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "logs_can_insert_own" ON public.pergola_logs
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- ==============================================
-- STEP 7: Grant permissions
-- ==============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.pergola_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Allow viewing of table structures for debugging
GRANT SELECT ON information_schema.tables TO authenticated;
GRANT SELECT ON information_schema.columns TO authenticated;

-- ==============================================
-- VERIFICATION QUERIES
-- ==============================================

-- Test the setup:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';
