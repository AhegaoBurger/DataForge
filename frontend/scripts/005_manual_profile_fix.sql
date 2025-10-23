-- Script to manually create missing profiles for existing users
-- This script finds users without profiles and creates them

-- First, identify users without profiles
SELECT
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    u.raw_user_meta_data,
    CASE
        WHEN p.id IS NOT NULL THEN 'Profile exists'
        ELSE 'Missing profile - WILL BE CREATED'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- Create missing profiles for users who don't have them
INSERT INTO public.profiles (id, display_name, wallet_address, created_at, updated_at)
SELECT
    u.id,
    COALESCE(
        u.raw_user_meta_data ->> 'display_name',
        u.raw_user_meta_data ->> 'name',
        CASE
            WHEN u.email LIKE '%@wallet.auth' THEN
                'Wallet ' || SUBSTRING(u.email FROM 1 FOR 4) || '...' || SUBSTRING(u.email FROM LENGTH(u.email) - 7 FOR 4)
            ELSE
                'User ' || SUBSTRING(u.id::text FROM 1 FOR 8)
        END
    ) as display_name,
    u.raw_user_meta_data ->> 'wallet_address' as wallet_address,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Show results of the operation
SELECT
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    p.display_name,
    p.wallet_address,
    p.created_at as profile_created_at,
    CASE
        WHEN p.id IS NOT NULL THEN 'Profile created/exists'
        ELSE 'Still missing profile'
    END as final_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;

-- Verify all users now have profiles
SELECT
    COUNT(u.id) as total_users,
    COUNT(p.id) as users_with_profiles,
    COUNT(u.id) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;

-- If there are still users without profiles, show them for manual investigation
SELECT
    u.id as user_id,
    u.email,
    u.created_at,
    u.raw_user_meta_data
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Optional: Create a backup of current profiles before making changes
-- CREATE TABLE profiles_backup AS SELECT * FROM public.profiles;

-- Optional: If you need to rollback, you can use:
-- TRUNCATE TABLE public.profiles;
-- INSERT INTO public.profiles SELECT * FROM profiles_backup;
