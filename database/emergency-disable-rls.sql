-- EMERGENCY FIX: Temporarily disable RLS for testing
-- Use this ONLY if the trigger approach doesn't work

-- Disable RLS temporarily to allow profile creation
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pergola_logs DISABLE ROW LEVEL SECURITY;

-- Test user creation - after this works, we can re-enable RLS with better policies
