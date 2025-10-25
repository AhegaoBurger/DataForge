-- Add blockchain tracking fields to bounties table
ALTER TABLE public.bounties
ADD COLUMN IF NOT EXISTS on_chain_pool_address TEXT,
ADD COLUMN IF NOT EXISTS blockchain_tx_signature TEXT,
ADD COLUMN IF NOT EXISTS is_blockchain_backed BOOLEAN DEFAULT FALSE;

-- Add blockchain tracking fields to submissions table
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS on_chain_submission_address TEXT,
ADD COLUMN IF NOT EXISTS escrow_tx_signature TEXT,
ADD COLUMN IF NOT EXISTS payout_tx_signature TEXT;

-- Add blockchain tracking fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS on_chain_profile_address TEXT;

-- Create indexes for blockchain lookups
CREATE INDEX IF NOT EXISTS idx_bounties_blockchain_tx ON public.bounties(blockchain_tx_signature) WHERE blockchain_tx_signature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bounties_on_chain_address ON public.bounties(on_chain_pool_address) WHERE on_chain_pool_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_escrow_tx ON public.submissions(escrow_tx_signature) WHERE escrow_tx_signature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_payout_tx ON public.submissions(payout_tx_signature) WHERE payout_tx_signature IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_on_chain_address ON public.profiles(on_chain_profile_address) WHERE on_chain_profile_address IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.bounties.on_chain_pool_address IS 'Solana PDA address of the bounty pool (escrow account)';
COMMENT ON COLUMN public.bounties.blockchain_tx_signature IS 'Transaction signature for bounty creation on-chain';
COMMENT ON COLUMN public.bounties.is_blockchain_backed IS 'True if bounty has on-chain escrow pool';
COMMENT ON COLUMN public.submissions.on_chain_submission_address IS 'Solana PDA address of the submission account';
COMMENT ON COLUMN public.submissions.escrow_tx_signature IS 'Transaction signature for submission (escrow reservation)';
COMMENT ON COLUMN public.submissions.payout_tx_signature IS 'Transaction signature for payment release (approval only)';
COMMENT ON COLUMN public.profiles.on_chain_profile_address IS 'Solana PDA address of the contributor profile';
