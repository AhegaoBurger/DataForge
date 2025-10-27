-- Add submission_id field to store the blockchain submission ID used for PDA derivation
-- This mirrors the bounty_id field solution for bounties

ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS submission_id TEXT;

-- Create index for blockchain lookups
CREATE INDEX IF NOT EXISTS idx_submissions_submission_id ON public.submissions(submission_id) WHERE submission_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.submissions.submission_id IS 'Blockchain submission ID (timestamp-based) used for PDA derivation (e.g., "1761583530500-qf4bc9")';
