-- Simplified version: Only creates database functions and triggers
-- Create the storage bucket via Supabase Dashboard instead (see instructions below)

-- ============================================================================
-- STORAGE BUCKET SETUP (Do this in Supabase Dashboard first!)
-- ============================================================================
--
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Settings:
--    - Name: videos
--    - Public bucket: YES (checked)
--    - File size limit: 524288000 (500MB)
--    - Allowed MIME types: video/mp4, video/quicktime, video/x-msvideo, video/webm
-- 4. After creating, go to bucket Policies tab and add:
--
--    Policy 1: "Allow authenticated uploads"
--      - Operation: INSERT
--      - Policy: bucket_id = 'videos'
--
--    Policy 2: "Allow public reads"
--      - Operation: SELECT
--      - Policy: bucket_id = 'videos'
--
--    Policy 3: "Allow users to delete own videos"
--      - Operation: DELETE
--      - Policy: bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
--
-- ============================================================================
-- DATABASE FUNCTIONS (Run this SQL below)
-- ============================================================================

-- Function to increment user's total_submissions
CREATE OR REPLACE FUNCTION public.increment_submissions(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_submissions = COALESCE(total_submissions, 0) + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission for the function
GRANT EXECUTE ON FUNCTION public.increment_submissions(UUID) TO authenticated;

-- Function to increment user's total_earnings when submission is approved
CREATE OR REPLACE FUNCTION public.increment_earnings(user_id UUID, amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    total_earnings = COALESCE(total_earnings, 0) + amount,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permission for the function
GRANT EXECUTE ON FUNCTION public.increment_earnings(UUID, DECIMAL) TO authenticated;

-- Create trigger to update user earnings when submission is approved
CREATE OR REPLACE FUNCTION public.handle_submission_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bounty_reward DECIMAL;
BEGIN
  -- Only process if status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get the bounty reward amount
    SELECT reward_amount INTO bounty_reward
    FROM public.bounties
    WHERE id = NEW.bounty_id;

    IF FOUND AND bounty_reward > 0 THEN
      -- Increment the contributor's earnings
      PERFORM public.increment_earnings(NEW.contributor_id, bounty_reward);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for submission approval
DROP TRIGGER IF EXISTS handle_submission_approval_trigger ON public.submissions;
CREATE TRIGGER handle_submission_approval_trigger
  AFTER UPDATE ON public.submissions
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.handle_submission_approval();

-- Verify functions were created
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('increment_submissions', 'increment_earnings', 'handle_submission_approval')
ORDER BY routine_name;
