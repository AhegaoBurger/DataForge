# Database Migration Scripts

This directory contains SQL migration scripts for setting up the TerraTrain database in Supabase.

## Migration Order

Run these scripts in order using the Supabase SQL Editor:

1. **001_create_tables.sql** - Creates all main database tables (profiles, bounties, submissions, datasets, purchases)
2. **002_create_triggers.sql** - Sets up database triggers for automated profile creation
3. **003_seed_data.sql** - Seeds initial test data (optional for development)
4. **004_verify_triggers.sql** - Verification queries to check trigger functionality
5. **005_manual_profile_fix.sql** - Manual fix for existing users without profiles
6. **006_setup_storage.sql** - Sets up Supabase Storage bucket for avatar uploads
7. **007_add_location_field.sql** - Adds location field to profiles (now deprecated)
8. **008_setup_video_storage.sql** - **NEW** Sets up video storage and submission functions

## Required Setup for Video Submissions

To enable video submissions, you must run **008_setup_video_storage.sql** in your Supabase SQL Editor. This script:

### Storage Bucket
- Creates a `videos` bucket in Supabase Storage
- Sets 500MB file size limit
- Allows MP4, MOV, AVI, and WebM formats
- Configures RLS policies for authenticated users

### Database Functions
- `increment_submissions(user_id)` - Increments user's total_submissions counter
- `increment_earnings(user_id, amount)` - Increments user's total_earnings when submission approved
- `handle_submission_approval()` - Trigger function that automatically updates earnings on approval

### Triggers
- Automatically updates user earnings when a submission status changes to 'approved'

## How to Run

### Step 1: Run SQL Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of **008_setup_video_storage.sql**
4. Click **Run** to execute

### Step 2: Configure Storage Policies (via Dashboard)

Since RLS policies for `storage.objects` require special permissions, you need to create them via the Supabase Dashboard:

1. Go to **Storage** in your Supabase dashboard
2. Click on the **videos** bucket (it should now exist after running the SQL)
3. Go to **Policies** tab
4. Click **New Policy**
5. Create these three policies:

#### Policy 1: Allow Uploads
- **Policy Name**: `Authenticated users can upload videos`
- **Allowed Operation**: `INSERT`
- **Policy Definition**:
  ```sql
  bucket_id = 'videos'
  ```

#### Policy 2: Allow Public Reading
- **Policy Name**: `Videos are publicly accessible`
- **Allowed Operation**: `SELECT`
- **Policy Definition**:
  ```sql
  bucket_id = 'videos'
  ```

#### Policy 3: Allow Users to Delete Their Videos
- **Policy Name**: `Users can delete their own videos`
- **Allowed Operation**: `DELETE`
- **Policy Definition**:
  ```sql
  bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```

## Verification

After running the migration, verify the setup:

```sql
-- Check if videos bucket exists
SELECT * FROM storage.buckets WHERE id = 'videos';

-- Check if functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('increment_submissions', 'increment_earnings', 'handle_submission_approval');

-- Check if trigger exists
SELECT trigger_name
FROM information_schema.triggers
WHERE trigger_name = 'handle_submission_approval_trigger';
```

## Testing Video Upload

Once the migration is complete:

1. Navigate to `/bounties/[id]/submit`
2. Select a video file (MP4, MOV, AVI, or WebM, max 500MB)
3. Fill out the submission form
4. Click "Submit Video"
5. The video will be uploaded to Supabase Storage and a submission record created

## Troubleshooting

### Upload Fails
- Check that the `videos` bucket exists in Supabase Storage
- Verify RLS policies are set correctly
- Ensure file size is under 500MB
- Confirm file type is supported

### Submission Record Not Created
- Check that the API route `/api/submissions` is accessible
- Verify user is authenticated
- Ensure bounty exists and is active
- Check that bounty has available slots

### Earnings Not Updated on Approval
- Verify the `handle_submission_approval_trigger` trigger exists
- Check that the bounty has a valid `reward_amount`
- Ensure the submission status changed from non-approved to 'approved'

## Environment Variables

Ensure these are set in your frontend `.env` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
