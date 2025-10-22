-- Script to verify that triggers are properly installed and working
-- This script checks if the handle_new_user trigger exists and is functioning

-- Check if the trigger function exists
SELECT
    proname as function_name,
    pronargs as num_args,
    prorettype::regtype as return_type,
    prosecdef as security_definer,
    proconfig as search_path
FROM pg_proc
WHERE proname = 'handle_new_user';

-- Check if the trigger exists on auth.users
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    tgtype as trigger_type,
    tgenabled as trigger_enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass;

-- Check if the profiles table exists and has the right structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test the trigger function manually (this won't actually create a user, just tests the function)
-- Note: This will fail if the function doesn't exist or has issues
DO $$
BEGIN
    -- Try to call the function with test data
    -- This simulates what would happen when a new user is created
    PERFORM public.handle_new_user();
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- Check RLS policies on profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- Show current users and their profiles (for debugging)
SELECT
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    u.raw_user_meta_data,
    p.id as profile_id,
    p.display_name,
    p.wallet_address,
    p.created_at as profile_created_at,
    CASE
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'Missing profile'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Check for any recent authentication events
SELECT
    created_at,
    event_type,
    user_id,
    details
FROM auth.audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
