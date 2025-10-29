-- Fix RLS policy to allow bounty creators to update submission status
-- This is needed so bounty creators can approve/reject submissions

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "submissions_update_own" ON public.submissions;

-- Create new policy that allows:
-- 1. Contributors to update their own submissions
-- 2. Bounty creators to update submissions for their bounties
CREATE POLICY "submissions_update_own_or_bounty_creator" ON public.submissions FOR UPDATE
  USING (
    auth.uid() = contributor_id OR
    EXISTS (
      SELECT 1 FROM public.bounties
      WHERE bounties.id = submissions.bounty_id
      AND bounties.creator_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON POLICY "submissions_update_own_or_bounty_creator" ON public.submissions IS
'Allows contributors to update their own submissions, and bounty creators to update submissions for their bounties (for approval/rejection)';
