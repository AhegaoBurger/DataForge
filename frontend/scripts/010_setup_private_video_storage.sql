-- Setup PRIVATE video storage with proper RLS policies
-- This is more secure and gives better control over video access

-- ============================================================================
-- STORAGE BUCKET SETUP (Do this in Supabase Dashboard first!)
-- ============================================================================
--
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New Bucket" or edit existing "videos" bucket
-- 3. Settings:
--    - Name: videos
--    - Public bucket: NO (unchecked) ← IMPORTANT: Keep it private!
--    - File size limit: 524288000 (500MB)
--    - Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo, video/webm
--
-- ============================================================================

-- Drop all existing video storage policies
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Contributors can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Contributors can view their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Buyers can view approved videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all videos" ON storage.objects;

-- ============================================================================
-- RLS POLICIES FOR PRIVATE BUCKET
-- ============================================================================

-- Policy 1: Allow authenticated users to upload videos to the videos bucket
CREATE POLICY "Contributors can upload videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'videos'
);

-- Policy 2: Contributors can view their own uploaded videos
CREATE POLICY "Contributors can view their own videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid() IN (
    -- Allow if user submitted this video (checking via submissions table)
    SELECT contributor_id
    FROM public.submissions
    WHERE video_url LIKE '%' || name || '%'
  )
);

-- Policy 3: Buyers and bounty creators can view videos for their bounties
CREATE POLICY "Buyers can view videos for their bounties"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid() IN (
    -- Allow bounty creators to see submissions for their bounties
    SELECT b.creator_id
    FROM public.bounties b
    JOIN public.submissions s ON s.bounty_id = b.id
    WHERE s.video_url LIKE '%' || name || '%'
  )
);

-- Policy 4: Allow viewing of approved videos (for marketplace/public viewing)
CREATE POLICY "Anyone can view approved videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1
    FROM public.submissions s
    WHERE s.video_url LIKE '%' || name || '%'
      AND s.status = 'approved'
  )
);

-- Policy 5: Allow contributors to delete their own pending/rejected videos
CREATE POLICY "Contributors can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid() IN (
    SELECT contributor_id
    FROM public.submissions
    WHERE video_url LIKE '%' || name || '%'
      AND status IN ('pending', 'rejected')
  )
);

-- Policy 6: Allow updating video metadata
CREATE POLICY "Contributors can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'videos' AND
  auth.uid() IN (
    SELECT contributor_id
    FROM public.submissions
    WHERE video_url LIKE '%' || name || '%'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the bucket configuration
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'videos';

-- List all policies for verification
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%video%'
ORDER BY policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- With a PRIVATE bucket:
-- 1. Videos are only accessible to authorized users based on RLS policies
-- 2. You get signed URLs from Supabase that expire after a set time
-- 3. Better security - can't guess URLs to access videos
-- 4. More control over who sees what
--
-- To get video URLs in your code, use:
--   const { data } = supabase.storage
--     .from('videos')
--     .createSignedUrl(fileName, 3600) // Expires in 1 hour
--
-- Or for authenticated access:
--   const { data: { publicUrl } } = supabase.storage
--     .from('videos')
--     .getPublicUrl(fileName) // Works with RLS policies
--
