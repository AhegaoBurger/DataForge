# Authentication Flow Redesign

## Overview

This document outlines the redesigned authentication flow for DataVault, transitioning from a wallet-first approach to a traditional email-based authentication system with optional wallet linking.

## User Flow

### 1. Sign-Up Process

**Email Sign-Up (Primary)**
- User visits `/auth/sign-up`
- Enters email, password, and display name
- Account created with profile automatically generated
- User can immediately access dashboard and features
- Email verification may be required (configurable)

**Wallet Connection (Secondary)**
- After signing in, users can link their wallet in profile settings
- Wallet linking is optional but required for payments/rewards
- Users can link/unlink wallets at any time

### 2. Sign-In Process

**Traditional Sign-In**
- Users sign in with email/password at `/auth/login`
- Password reset functionality available
- "Remember me" option for persistent sessions

**Session Management**
- Sessions managed by Supabase Auth
- Automatic profile creation on first sign-in
- Graceful handling of missing profiles

### 3. Profile Management

**Profile Settings (`/profile`)**
- Edit display name, bio, and location
- Upload avatar images (stored in Supabase Storage)
- Link/unlink wallet addresses
- View account statistics and achievements
- Manage account settings

**Navigation Experience**
- Signed out: Shows "Sign In" button
- Signed in: Shows user avatar with dropdown menu
- Dropdown includes: Profile Settings, Dashboard, Sign Out

## Technical Implementation

### Authentication Components

#### Navigation (`components/navigation.tsx`)
- Detects authentication state via Supabase
- Shows appropriate UI based on auth state
- Handles sign-out functionality
- Real-time auth state updates

#### Sign-In Page (`app/auth/login/page.tsx`)
- Modern, clean design with DataVault branding
- Email/password authentication
- Forgot password functionality
- Link to sign-up page

#### Profile Settings (`app/profile/page.tsx`)
- Comprehensive profile management
- Avatar upload with image preview
- Wallet linking/unlinking interface
- Real-time profile updates
- Error handling and success messages

#### Wallet Integration (`components/wallet-button.tsx`)
- Simplified wallet connection component
- No authentication logic (handled separately)
- Clean integration with Solana wallet adapter

### Backend Components

#### Profile Auto-Creation
- Database trigger: `handle_new_user()`
- API fallback: Dashboard creates profiles if missing
- Middleware ensures profiles exist for protected routes
- Client-side utilities for profile management

#### Storage Setup
- Avatars stored in Supabase Storage bucket
- RLS policies for secure file access
- Automatic cleanup of old avatars
- Public URLs for profile images

### Database Schema

#### Profiles Table
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  bio TEXT,
  location TEXT,
  avatar_url TEXT,
  wallet_address TEXT UNIQUE,
  role TEXT DEFAULT 'contributor',
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  total_submissions INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Storage Bucket
- `avatars` bucket for profile images
- 5MB file size limit
- Supported formats: JPEG, PNG, WebP, GIF
- Public access for profile pictures

### Security Considerations

#### Row Level Security (RLS)
- Profiles table: Users can only access their own profiles
- Storage: Users can only upload/access their own avatars
- Public read access for avatars (profile pictures)

#### Authentication Security
- Password hashing handled by Supabase Auth
- Session tokens with expiration
- CSRF protection via Next.js middleware
- Secure cookie handling

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - Create new user account
- `POST /api/auth/sign-in` - Authenticate user
- `POST /api/auth/sign-out` - End user session
- `POST /api/auth/reset-password` - Password reset

### Profile Management
- `GET /api/auth/create-profile` - Check/create user profile
- `POST /api/auth/create-profile` - Manual profile creation
- `PUT /api/profile` - Update profile information

### Debugging
- `GET /api/debug` - Comprehensive auth status debugging

## User Experience Improvements

### Seamless Onboarding
1. User signs up with email
2. Profile automatically created
3. Immediate access to dashboard
4. Clear prompts to link wallet for payments

### Intuitive Profile Management
1. Visual avatar upload with preview
2. Real-time form validation
3. Clear wallet linking status
4. Success/error feedback

### Persistent Navigation State
1. Real-time auth state updates
2. Smooth transitions between auth states
3. Consistent UI across all pages

## Migration Strategy

### For Existing Users
1. Database script ensures all users have profiles
2. Wallet users can link existing wallets to email accounts
3. No data loss during migration

### Database Scripts
- `004_verify_triggers.sql` - Verify trigger installation
- `005_manual_profile_fix.sql` - Fix missing profiles
- `006_setup_storage.sql` - Create avatar storage
- `007_add_location_field.sql` - Add location field

## Testing Checklist

### Authentication Flow
- [ ] Email sign-up creates profile automatically
- [ ] Sign-in works with valid credentials
- [ ] Password reset sends email
- [ ] Session persistence works correctly
- [ ] Sign-out clears session properly

### Profile Management
- [ ] Profile fields save correctly
- [ ] Avatar upload works and displays
- [ ] Wallet linking functions properly
- [ ] Profile updates reflect immediately

### Navigation
- [ ] Auth state changes update navigation
- [ ] Dropdown menu functions correctly
- [ ] Protected routes redirect appropriately

### Error Handling
- [ ] Invalid credentials show helpful errors
- [ ] Network errors are handled gracefully
- [ ] File upload errors show clear messages

## Future Enhancements

### Planned Features
1. Social authentication (Google, GitHub)
2. Two-factor authentication
3. Profile completion wizard
4. Public profile pages
5. Profile verification system

### Improvements
1. Progressive profile completion
2. Social profile linking
3. Achievement system
4. Profile customization options

## Support and Troubleshooting

### Common Issues
1. **Profile not created**: Check trigger installation with `004_verify_triggers.sql`
2. **Avatar upload fails**: Verify storage bucket setup with `006_setup_storage.sql`
3. **Wallet linking issues**: Check wallet address format and conflicts
4. **Auth state not updating**: Clear browser cache and check Supabase configuration

### Debug Tools
1. `/api/debug` - Comprehensive auth status
2. Browser dev tools - Supabase auth state
3. Database queries - Profile existence checks
4. Network tab - API request debugging

This redesigned authentication flow provides a more traditional and user-friendly experience while maintaining the flexibility for wallet integration when needed for payments and rewards.