-- Trigger function to handle submission approval
-- Updates bounty filled_slots and contributor earnings
CREATE OR REPLACE FUNCTION public.handle_submission_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bounty_reward DECIMAL(10, 2);
  v_bounty_id UUID;
BEGIN
  -- Only run when status changes TO 'approved' (not when already approved)
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    -- Get bounty details
    SELECT id, reward_amount INTO v_bounty_id, v_bounty_reward
    FROM public.bounties
    WHERE id = NEW.bounty_id;

    -- Increment filled_slots for the bounty
    UPDATE public.bounties
    SET filled_slots = filled_slots + 1
    WHERE id = v_bounty_id;

    -- Update contributor's earnings and submission count
    UPDATE public.profiles
    SET
      total_earnings = total_earnings + v_bounty_reward,
      total_submissions = total_submissions + 1
    WHERE id = NEW.contributor_id;

    RAISE NOTICE 'Submission approved: bounty % filled_slots incremented, contributor % earnings updated by %',
      v_bounty_id, NEW.contributor_id, v_bounty_reward;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_submission_approved ON public.submissions;

-- Create trigger that runs after submission status update
CREATE TRIGGER on_submission_approved
  AFTER INSERT OR UPDATE OF status ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_submission_approval();

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_submission_approval() IS
'Automatically updates bounty filled_slots and contributor earnings when a submission is approved';
