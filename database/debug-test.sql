-- DEBUG SCRIPT: Test RLS and trigger functionality
-- Run this in Supabase SQL Editor to debug the issue

-- Check if tables exist
SELECT 'Tables:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check if policies exist  
SELECT 'Policies:' as info;
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Check if triggers exist
SELECT 'Triggers:' as info;
SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check if functions exist
SELECT 'Functions:' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- Test current auth context
SELECT 'Current Auth:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role;

-- Check existing users
SELECT 'Existing Users:' as info;
SELECT id, email, last_used_mode, created_at FROM public.users ORDER BY created_at;

-- Test if we can insert (this will show the exact error)
-- Replace 'test-uuid-here' with an actual UUID from auth.users if needed
-- INSERT INTO public.users (id, email, last_used_mode) 
-- VALUES ('test-uuid-here', 'test@example.com', 'auto');

-- Check auth.users table (to see if users are being created there)
SELECT 'Auth Users:' as info;
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;
