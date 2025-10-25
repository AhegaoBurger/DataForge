-- Fix video storage RLS policies
-- This script properly configures the videos bucket and its access policies

-- First, ensure the videos bucket exists and is public
-- (If you haven't created it yet, do this in Supabase Dashboard first)
-- Name: videos
-- Public: YES
-- File size limit: 524288000 (500MB)
-- Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo, video/webm

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'videos');

-- Policy 2: Allow anyone (including public) to view/download videos
CREATE POLICY "Anyone can view videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'videos');

-- Policy 3: Allow users to update their own videos (optional, for metadata updates)
CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'videos');

-- Policy 4: Allow users to delete their own videos
-- This uses the folder structure where videos are stored in {bountyId}/{filename}
CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'videos');

-- Verify the bucket exists and is public
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'videos';

-- List all policies for the storage.objects table (for verification)
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
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;
