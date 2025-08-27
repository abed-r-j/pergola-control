-- Supabase setup script for Pergola Control App
-- Run this in your Supabase SQL editor

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    last_used_mode TEXT NOT NULL DEFAULT 'auto' CHECK (last_used_mode IN ('auto', 'manual', 'off')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to insert (for the trigger function)
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, last_used_mode)
    VALUES (NEW.id, NEW.email, 'auto');
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- User already exists, do nothing
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth user creation
        RAISE LOG 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger for automatic user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Create a table for pergola logs (for analytics)
CREATE TABLE IF NOT EXISTS public.pergola_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('auto', 'manual', 'off')),
    horizontal_angle NUMERIC(5,2),
    vertical_angle NUMERIC(5,2),
    actuator_height NUMERIC(6,2),
    light_sensor_reading NUMERIC(8,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on pergola_logs
ALTER TABLE public.pergola_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for pergola_logs
CREATE POLICY "Users can view own logs" ON public.pergola_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON public.pergola_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_pergola_logs_user_id ON public.pergola_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_pergola_logs_timestamp ON public.pergola_logs(timestamp);

-- Create a view for recent pergola activity
CREATE OR REPLACE VIEW public.recent_pergola_activity AS
SELECT 
    pl.*,
    u.email
FROM public.pergola_logs pl
JOIN public.users u ON pl.user_id = u.id
WHERE pl.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY pl.timestamp DESC;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.pergola_logs TO authenticated;
GRANT SELECT ON public.recent_pergola_activity TO authenticated;
