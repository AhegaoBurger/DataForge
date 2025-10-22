# Profile Creation Fix

## Problem Description

The dashboard API was expecting a profile to exist in the database for authenticated users, but the sign-up authentication flow wasn't reliably creating profiles. This caused the dashboard to return errors when users tried to access it after signing up.

## Root Causes

1. **Database Trigger Issues**: The `handle_new_user()` trigger that should automatically create profiles on user signup may not be properly installed or functioning in all environments.

2. **Wallet Authentication Gap**: Users connecting via wallet weren't being properly authenticated in Supabase, bypassing the profile creation process.

3. **Race Conditions**: The dashboard API could be called before the database trigger completed profile creation.

4. **Missing Fallbacks**: No automatic fallback mechanism to create profiles when they're missing.

## Solutions Implemented

### 1. Enhanced Dashboard API (`/app/api/dashboard/route.ts`)
- Added automatic profile creation when profile is missing
- Graceful handling of profile creation errors
- Detailed logging for debugging

```typescript
// If profile doesn't exist, create it automatically
if (profileError && profileError.code === "PGRST116") {
  console.log("Profile not found, creating one for user:", user.id);
  
  const displayName = user.user_metadata?.display_name || 
                     user.user_metadata?.name || 
                     "Anonymous User";

  const { data: newProfile, error: createError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: displayName,
      wallet_address: user.user_metadata?.wallet_address || null,
    })
    .select("display_name, avatar_url, created_at")
    .single();
  // ... error handling
}
```

### 2. Wallet Authentication Integration (`/components/wallet-button.tsx`)
- Added automatic Supabase authentication when wallet connects
- Creates user accounts for wallet connections
- Handles both new and existing wallet users

```typescript
const handleWalletAuth = async () => {
  if (!publicKey) return;
  
  const walletAddress = publicKey.toBase58();
  
  // Create or sign in user with wallet
  const { data: userData, error: authError } = await supabase.auth.signUp({
    email: `${walletAddress}@wallet.auth`,
    password: walletAddress,
    options: {
      data: {
        wallet_address: walletAddress,
        display_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
        auth_method: "wallet",
      },
    },
  });
};
```

### 3. Client-Side Auth Utilities (`/lib/auth/client.ts`)
- `ensureUserProfileClient()`: Creates profile if missing
- `getUserProfile()`: Safely retrieves user profile
- `signInWithWallet()`: Handles wallet authentication
- `updateUserProfile()`: Updates profile information
- `debugAuthStatus()`: Debugging utility

### 4. Server-Side Auth Utilities (`/lib/auth/utils.ts`)
- `ensureUserProfile()`: Server-side profile creation
- `getCurrentUserWithProfile()`: Gets user with guaranteed profile

### 5. Enhanced Middleware (`/lib/supabase/middleware.ts`)
- Automatically creates profiles for authenticated users accessing protected routes
- Ensures profile exists before allowing access to dashboard, bounties, etc.

```typescript
// Ensure user has a profile when accessing protected routes
if (user && isProtectedPath) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  // If profile doesn't exist, create it
  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      display_name: displayName,
      wallet_address: user.user_metadata?.wallet_address || null,
    });
  }
}
```

### 6. Dashboard Enhancements (`/app/dashboard/page.tsx`)
- Uses client-side auth utilities for better UX
- Provides retry functionality for profile errors
- Better error handling and user feedback
- Checks authentication status before fetching data

### 7. Debug Endpoints
- `/api/debug/route.ts`: Comprehensive debugging endpoint
- `/api/auth/create-profile/route.ts`: Manual profile creation endpoint

### 8. Database Scripts
- `004_verify_triggers.sql`: Verify trigger installation
- `005_manual_profile_fix.sql`: Fix existing users without profiles

## Usage

### For Developers

1. **Debug Profile Issues**: Visit `/api/debug` to check current auth status
2. **Manual Profile Creation**: Use `/api/auth/create-profile` endpoints
3. **Database Verification**: Run the SQL scripts to verify triggers

### For Users

1. **Email Sign-up**: Profile created automatically via trigger
2. **Wallet Connection**: Profile created automatically on connection
3. **Dashboard Access**: Profile created if missing when accessing dashboard

## Testing

### Manual Testing Steps

1. **Email Sign-up Flow**:
   - Sign up with email
   - Verify profile is created in database
   - Access dashboard

2. **Wallet Connection Flow**:
   - Connect wallet
   - Verify Supabase user is created
   - Verify profile is created
   - Access dashboard

3. **Missing Profile Recovery**:
   - Delete user profile from database
   - Access dashboard
   - Verify profile is automatically recreated

### Database Verification

```sql
-- Check users without profiles
SELECT u.id, u.email, u.created_at, p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify trigger exists
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

## Security Considerations

1. **RLS Policies**: All profile operations respect Row Level Security
2. **User Ownership**: Users can only create/modify their own profiles
3. **Wallet Authentication**: Simplified for demo - production should implement proper signature verification

## Future Improvements

1. **Enhanced Wallet Auth**: Implement proper signature verification
2. **Profile Completion Flow**: Guide users to complete their profiles
3. **Profile Settings UI**: Allow users to update their profile information
4. **Social Auth**: Add Google, GitHub, etc. authentication options

## Troubleshooting

### Common Issues

1. **Profile Not Created**: Check if trigger is installed using `004_verify_triggers.sql`
2. **Wallet Auth Fails**: Verify wallet address format and Supabase configuration
3. **Dashboard Errors**: Use `/api/debug` to check auth status
4. **Permission Errors**: Check RLS policies on profiles table

### Debug Commands

```bash
# Check debug endpoint
curl http://localhost:3000/api/debug

# Create profile manually
curl -X POST http://localhost:3000/api/auth/create-profile

# Check profile status
curl http://localhost:3000/api/auth/create-profile
```

This comprehensive fix ensures that all authentication flows properly create user profiles, eliminating the dashboard access issues while maintaining security and providing good user experience.