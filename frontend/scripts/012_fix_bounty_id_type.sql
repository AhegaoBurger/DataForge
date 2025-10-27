-- Fix bounty_id column type to TEXT for storing UUIDs
-- The bounty_id field stores the blockchain UUID used for PDA derivation

-- Drop the column if it exists with wrong type and recreate as TEXT
ALTER TABLE public.bounties
DROP COLUMN IF EXISTS bounty_id;

ALTER TABLE public.bounties
ADD COLUMN bounty_id TEXT;

-- Create index for blockchain bounty ID lookups
CREATE INDEX IF NOT EXISTS idx_bounties_bounty_id ON public.bounties(bounty_id) WHERE bounty_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bounties.bounty_id IS 'UUID used as seed for on-chain bounty pool PDA derivation (different from database id)';
