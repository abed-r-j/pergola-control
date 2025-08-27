-- Updated Supabase setup script for Pergola Control App
-- This fixes the RLS policy issues for user creation

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop existing policies (all possible variations)
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can view own logs" ON public.pergola_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON public.pergola_logs;

-- Create or update users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    last_used_mode TEXT NOT NULL DEFAULT 'auto' CHECK (last_used_mode IN ('auto', 'manual', 'off')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies
CREATE POLICY "Enable read access for users based on user_id" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a function that bypasses RLS for user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert with explicit RLS bypass
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create or update pergola_logs table
DROP TABLE IF EXISTS public.pergola_logs CASCADE;
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

-- Enable RLS on pergola_logs
ALTER TABLE public.pergola_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for pergola_logs
CREATE POLICY "Users can view own logs" ON public.pergola_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.pergola_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant permissions for pergola_logs
GRANT ALL ON public.pergola_logs TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Test: Allow viewing of table structures
GRANT SELECT ON information_schema.tables TO authenticated;
GRANT SELECT ON information_schema.columns TO authenticated;
