# TerraTrain Solana Smart Contracts

This directory contains the Solana smart contracts (Anchor programs) for TerraTrain, a decentralized marketplace connecting data contributors with robotics companies.

## Overview

The smart contracts implement four main programs:

1. **Bounty Program** - Manages data collection tasks and reward pools
2. **Escrow Program** - Handles payment escrow for video submissions
3. **Reputation Program** - Tracks contributor reputation and badges
4. **Dataset NFT Program** - Creates and manages dataset NFTs for licensing

## Architecture

All programs are implemented in a single Anchor program (`unimake_backend`) for gas efficiency and atomic operations. The program uses PDAs (Program Derived Addresses) for secure, deterministic account management.

### Key Account Structures

#### BountyPool
- **PDA Seeds**: `["bounty", bounty_id]`
- **Purpose**: Holds reward pool and bounty configuration
- **Fields**: authority, bounty_id, task_description, requirements, reward_per_video, total_pool, remaining_pool, videos_target, videos_collected, status, timestamps

#### VideoSubmission
- **PDA Seeds**: `["submission", submission_id]`
- **Purpose**: Tracks video submissions and escrow
- **Fields**: submission_id, contributor, bounty_id, ipfs_hash, arweave_tx, metadata_uri, status, escrow_amount, quality_score

#### ContributorProfile
- **PDA Seeds**: `["profile", contributor_wallet]`
- **Purpose**: Stores contributor reputation and statistics
- **Fields**: wallet, total_submissions, accepted_submissions, rejected_submissions, average_quality_score, total_earnings, reputation_score, badges

#### DatasetNFT
- **PDA Seeds**: `["dataset", dataset_id]`
- **Purpose**: Represents a dataset as an NFT for licensing
- **Fields**: dataset_id, license_type, creator, price, royalty_percentage, total_sales

## Instructions

### Bounty Management

#### `create_bounty`
Creates a new bounty with a reward pool.

**Parameters:**
- `bounty_id`: Unique identifier (max 50 chars)
- `reward_per_video`: Lamports per approved video
- `total_pool`: Total lamports in reward pool
- `videos_target`: Number of videos needed
- `task_description`: What contributors should record
- `min_duration_secs`: Minimum video length
- `min_resolution`: Required resolution (e.g., "720p")
- `min_fps`: Minimum frames per second
- `expires_at`: Unix timestamp expiration

**Accounts:**
- `bounty_pool` (init): New bounty PDA
- `authority` (signer, mut): Bounty creator
- `system_program`: Solana system program

**Example:**
```typescript
await program.methods
  .createBounty(
    "bounty-001",
    new BN(0.1 * LAMPORTS_PER_SOL),
    new BN(10 * LAMPORTS_PER_SOL),
    100,
    "Record making coffee",
    30,
    "1080p",
    30,
    new BN(Date.now() / 1000 + 86400 * 30)
  )
  .accounts({
    bountyPool: bountyPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### `pause_bounty` / `resume_bounty`
Temporarily pause or resume an active bounty.

#### `complete_bounty`
Mark bounty as completed (no more submissions accepted).

#### `cancel_bounty`
Cancel bounty and return remaining funds to authority.

### Submission & Escrow

#### `submit_video`
Submit a video for review, creating an escrow lock.

**Parameters:**
- `submission_id`: Unique identifier
- `ipfs_hash`: IPFS content hash
- `arweave_tx`: Arweave transaction ID
- `metadata_uri`: URI to full metadata JSON

**Accounts:**
- `submission` (init): New submission PDA
- `bounty_pool` (mut): Target bounty
- `contributor` (signer, mut): Video submitter
- `system_program`

**Flow:**
1. Validates bounty is active and has space
2. Creates submission account with `Pending` status
3. Reserves `reward_per_video` from bounty's remaining pool
4. Emits `VideoSubmitted` event

**Example:**
```typescript
await program.methods
  .submitVideo(
    "sub-001",
    "QmXxx...",
    "ArweaveTxXxx...",
    "https://arweave.net/metadata"
  )
  .accounts({
    submission: submissionPda,
    bountyPool: bountyPda,
    contributor: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

#### `approve_submission`
Approve a submission and release escrowed payment.

**Parameters:**
- `quality_score`: 0-100 rating

**Accounts:**
- `submission` (mut): Submission to approve
- `bounty_pool` (mut): Source of funds
- `contributor_profile` (mut): Contributor's reputation account
- `contributor` (mut): Receives payment
- `authority` (signer): Bounty creator
- `system_program`

**Flow:**
1. Validates submission is `Pending`
2. Transfers escrowed funds from bounty to contributor
3. Updates bounty's `videos_collected` counter
4. Updates contributor profile statistics and reputation
5. Emits `SubmissionApproved` event

#### `reject_submission`
Reject a submission and return funds to pool.

**Flow:**
1. Validates submission is `Pending`
2. Returns escrowed amount to bounty's `remaining_pool`
3. Updates contributor profile (increments rejections)
4. Recalculates reputation score (penalized)
5. Emits `SubmissionRejected` event

### Reputation System

#### `initialize_profile`
Create a contributor profile (required before first submission).

**Accounts:**
- `contributor_profile` (init): New profile PDA
- `contributor` (signer, mut): Profile owner
- `system_program`

**Initial Values:**
- `reputation_score`: 500 (neutral)
- All counters: 0
- No badges

#### `award_badge`
Grant a badge to a contributor.

**Parameters:**
- `badge_type`: Enum variant (FirstVideo, HundredVideos, ThousandVideos, HighQuality, EarlyAdopter, CategoryExpert)

**Accounts:**
- `contributor_profile` (mut): Profile to update
- `authority` (signer): Admin or automated system

**Validation:**
- Maximum 10 badges per profile
- No duplicate badge types

#### Reputation Calculation

Reputation score (0-1000) is calculated as:

```
base = 500
acceptance_rate = (accepted / total) * 100
quality_avg = average_quality_score (0-100)

acceptance_points = (acceptance_rate * 5) / 2  // Max 250
quality_points = (quality_avg * 250) / 100     // Max 250

reputation = base + acceptance_points + quality_points
```

**Examples:**
- New profile: 500 (neutral)
- 80% acceptance, 85 avg quality: 500 + 200 + 212.5 = 912
- 50% acceptance, 60 avg quality: 500 + 125 + 150 = 775
- 20% acceptance, 40 avg quality: 500 + 50 + 100 = 650

### Dataset NFTs

#### `create_dataset`
Create a dataset NFT from approved submissions.

**Parameters:**
- `dataset_id`: Unique identifier
- `license_type`: Enum (SingleUse, Unlimited, Exclusive, CommercialResale)
- `price`: Sale price in lamports
- `royalty_percentage`: 0-100 (creator royalty on resale)

**Accounts:**
- `dataset_nft` (init): New dataset PDA
- `creator` (signer, mut): Dataset owner
- `system_program`

#### `purchase_dataset`
Purchase access to a dataset.

**Accounts:**
- `dataset_nft` (mut): Dataset being purchased
- `buyer` (signer, mut): Pays for dataset
- `creator` (mut): Receives payment
- `system_program`

**Flow:**
1. Transfers `price` from buyer to creator
2. Increments `total_sales` counter
3. Emits `DatasetPurchased` event

**Note:** Off-chain system should then grant buyer access to dataset files and record purchase in Supabase `purchases` table.

## Integration with Frontend

The frontend (Next.js + Supabase) handles:
- User authentication (Supabase Auth)
- Database records (bounties, submissions, datasets tables)
- File storage (IPFS + Arweave)
- UI/UX

The smart contracts handle:
- Payment escrow and distribution
- Reputation scoring
- On-chain proof of contribution
- Dataset licensing/ownership

### Synchronization Pattern

When creating a bounty:
1. Frontend creates record in Supabase `bounties` table
2. Frontend calls `create_bounty` instruction with same ID
3. Bounty exists both on-chain (with funds) and off-chain (with metadata)

When submitting video:
1. Frontend uploads video to IPFS + Arweave
2. Frontend creates record in Supabase `submissions` table
3. Frontend calls `submit_video` with storage hashes
4. Submission exists on-chain (with escrow) and off-chain (with video URL)

When approving submission:
1. Frontend admin calls `approve_submission` (triggers payment)
2. Frontend updates Supabase `submissions` record status
3. Frontend updates `profiles.total_earnings` from on-chain data

### Event Listening

The frontend should listen to program events for real-time updates:

```typescript
const eventSubscription = program.addEventListener(
  "SubmissionApproved",
  (event, slot) => {
    console.log("Submission approved:", event);
    // Update UI, refresh balances, etc.
  }
);
```

Available events:
- `BountyCreated`
- `BountyStatusChanged`
- `VideoSubmitted`
- `SubmissionApproved`
- `SubmissionRejected`
- `ProfileCreated`
- `BadgeAwarded`
- `DatasetCreated`
- `DatasetPurchased`

## Security Considerations

### Access Control
- Only bounty `authority` can pause/resume/complete/cancel bounties
- Only bounty `authority` can approve/reject submissions
- Contributors can only submit to active bounties
- Profiles are self-custodial (only owner can initialize)

### Fund Safety
- Bounty funds are held in PDA (program-controlled)
- Escrow is atomic: funds reserved on submit, released on approve/reject
- No funds can be withdrawn except through approval or cancellation
- CPI (Cross-Program Invocation) uses signer seeds for secure transfers

### Input Validation
- Bounty IDs limited to 50 chars (prevents excessive rent)
- Strings have max lengths to prevent DoS
- Numeric overflows checked with `checked_add/sub`
- Status transitions validated (e.g., can't approve rejected submission)

### Known Limitations
- No dispute resolution mechanism (future enhancement)
- Badge awards are permissioned (requires authority signer)
- Dataset NFT is simplified (doesn't use Token Program/Metaplex)
- No royalty distribution logic (manual/off-chain for now)

## Testing

Run the comprehensive test suite:

```bash
cd unimake_backend

# Start local validator
solana-test-validator

# In another terminal, run tests
anchor test --skip-local-validator
```

### Test Coverage

The test suite (`tests/unimake_backend.ts`) includes:

1. **Bounty Program Tests**
   - Creating bounties with valid parameters
   - Pausing and resuming bounties
   - Validation of insufficient pool funds
   - Cancelling bounties and fund returns

2. **Reputation Program Tests**
   - Profile initialization
   - Badge awarding
   - Preventing duplicate badges
   - Reputation score calculations

3. **Escrow Program Tests**
   - Video submission and escrow creation
   - Approval workflow and payment release
   - Rejection workflow and fund returns
   - Validation for inactive bounties

4. **Dataset NFT Tests**
   - Dataset creation with licensing terms
   - Purchase workflow and fund transfers
   - Invalid royalty percentage validation

5. **Integration Tests**
   - Complete workflow: bounty → submit → approve → dataset
   - Rejection workflow with reputation updates
   - Multiple submission handling

6. **Cleanup Tests**
   - Bounty cancellation and fund recovery

### Running Specific Tests

```bash
# Test only bounty program
anchor test --skip-local-validator -- --grep "Bounty Program"

# Test integration
anchor test --skip-local-validator -- --grep "Integration"
```

## Deployment

### Localnet (Development)

```bash
# Terminal 1: Start validator
solana-test-validator

# Terminal 2: Deploy
anchor build
anchor deploy --provider.cluster localnet
```

### Devnet (Staging)

```bash
# Configure Solana CLI
solana config set --url devnet

# Request airdrop for deployment
solana airdrop 2

# Deploy
anchor build
anchor deploy --provider.cluster devnet
```

### Mainnet (Production)

```bash
# IMPORTANT: Audit code before mainnet deployment
# Recommend: Trail of Bits, Neodyme, or OtterSec audit

solana config set --url mainnet-beta

# Ensure wallet has sufficient SOL
solana balance

# Deploy
anchor build
anchor deploy --provider.cluster mainnet-beta

# Verify deployment
anchor idl fetch <PROGRAM_ID>
```

## Program ID

The program ID is fixed in `Anchor.toml` and `lib.rs`:

```
CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG
```

This ID is used for all PDA derivations and must match across all deployments.

## Gas Costs (Approximate)

On mainnet (as of 2025):

- `create_bounty`: ~0.002 SOL (rent) + bounty pool amount
- `submit_video`: ~0.002 SOL (rent for submission account)
- `approve_submission`: ~0.0001 SOL (compute + transfer)
- `reject_submission`: ~0.0001 SOL (compute only)
- `initialize_profile`: ~0.003 SOL (rent for profile account)
- `create_dataset`: ~0.002 SOL (rent)
- `purchase_dataset`: ~0.0001 SOL (compute + transfer)

Rent is reclaimable by closing accounts (future enhancement).

## Upgradeability

The program is currently **upgradeable** (default Anchor setting). The deploy authority can:
- Fix bugs
- Add new instructions
- Modify existing logic

**Important:** Before mainnet, consider:
1. Transferring upgrade authority to multisig
2. Implementing time-lock for upgrades
3. Eventually making program immutable (after thorough testing)

## Future Enhancements

### Phase 2
- [ ] Implement dispute resolution (stake-based challenge system)
- [ ] Add governance for parameter tuning (reward amounts, reputation weights)
- [ ] Multi-token support (USDC, USDT, not just SOL)
- [ ] Bounty pools with multiple reward tiers

### Phase 3
- [ ] Integrate Metaplex for proper NFT standard compliance
- [ ] Automated royalty distribution to contributors
- [ ] Fractional dataset ownership
- [ ] Staking mechanism for curators/reviewers
- [ ] Privacy-preserving submissions (zk-proofs for sensitive data)

### Optimizations
- [ ] Account compression (reduce rent)
- [ ] Batch operations (approve multiple submissions at once)
- [ ] Lazy reputation calculation (update only when needed)
- [ ] Close unused accounts to reclaim rent

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Solana Program Library](https://spl.solana.com/)
- [TerraTrain PROJECT_SPEC.md](../PROJECT_SPEC.md)

## Support

For issues or questions:
1. Check [CLAUDE.md](../CLAUDE.md) for project context
2. Review test suite for usage examples
3. Open GitHub issue with reproduction steps

## License

[Specify license here - MIT, Apache 2.0, etc.]
