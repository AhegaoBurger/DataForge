# Video Upload Setup Guide

This guide will help you set up video submissions for TerraTrain bounties.

## Quick Start (2 Steps)

### Step 1: Create Storage Bucket (Supabase Dashboard)

1. Open your **Supabase Dashboard**
2. Navigate to **Storage** → Click **New Bucket**
3. Configure the bucket:
   - **Name**: `videos`
   - **Public bucket**: ✅ YES (check this box)
   - **File size limit**: `524288000` (this is 500MB in bytes)
   - **Allowed MIME types**: Add these four types:
     - `video/mp4`
     - `video/quicktime`
     - `video/x-msvideo`
     - `video/webm`
4. Click **Create Bucket**

### Step 2: Configure Bucket Policies

After creating the bucket, you need to add three policies:

1. Click on the **videos** bucket → Go to **Policies** tab
2. Click **New Policy** for each of these:

#### Policy A: Allow Uploads
- **Name**: `Authenticated users can upload videos`
- **Allowed operation**: `INSERT`
- **Policy definition**:
  ```sql
  bucket_id = 'videos'
  ```
- Click **Review** → **Save Policy**

#### Policy B: Allow Public Reading
- **Name**: `Videos are publicly accessible`
- **Allowed operation**: `SELECT`
- **Policy definition**:
  ```sql
  bucket_id = 'videos'
  ```
- Click **Review** → **Save Policy**

#### Policy C: Allow Deletion
- **Name**: `Users can delete their own videos`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
  ```
- Click **Review** → **Save Policy**

### Step 3: Run SQL Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `frontend/scripts/008_setup_video_storage.sql`
4. Click **Run**
5. You should see: "Setup complete! Functions and triggers created successfully."

## What This Sets Up

✅ **Storage Bucket**: Stores uploaded video files (max 500MB each)
✅ **Database Functions**: Automatic user stats tracking
✅ **Automatic Earnings**: Users get paid when submissions are approved
✅ **Security**: Row-level security policies protect user data

## Testing

1. Start your frontend: `cd frontend && pnpm dev`
2. Navigate to any bounty page
3. Click "Submit Video"
4. Upload a video file (MP4, MOV, AVI, or WebM)
5. Submit the form

The video should upload successfully and create a submission record.

## Troubleshooting

### Error: "Upload failed: new row violates row-level security policy"
- Make sure you created all three storage policies correctly
- Verify the bucket is marked as "public"

### Error: "Failed to create submission"
- Check that the SQL migration ran successfully
- Verify the functions exist: Run this in SQL Editor:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('increment_submissions', 'increment_earnings');
  ```

### Video uploads but submission not created
- Check browser console for errors
- Verify you're logged in with a valid Supabase session
- Ensure your user has a profile with a linked wallet

### Earnings not updating on approval
- Verify the trigger exists:
  ```sql
  SELECT trigger_name FROM information_schema.triggers
  WHERE trigger_name = 'handle_submission_approval_trigger';
  ```

## Manual Verification

Check if everything is set up correctly:

```sql
-- Check storage bucket (run in browser console with Supabase client)
const { data } = await supabase.storage.listBuckets()
console.log(data.find(b => b.id === 'videos'))

-- Check functions (run in SQL Editor)
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'increment%'
OR routine_name = 'handle_submission_approval';

-- Check trigger (run in SQL Editor)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'handle_submission_approval_trigger';
```

## File Locations

- **SQL Migration**: `frontend/scripts/008_setup_video_storage.sql`
- **Submission Page**: `frontend/app/bounties/[id]/submit/page.tsx`
- **API Route**: `frontend/app/api/submissions/route.ts`

## Need Help?

- Check the detailed README: `frontend/scripts/README.md`
- Review the Supabase Storage documentation
- Ensure all environment variables are set in `frontend/.env`
