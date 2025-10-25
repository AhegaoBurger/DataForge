# TerraTrain Blockchain Integration Guide

## Overview

This document describes the integration between TerraTrain's smart contracts (Solana/Anchor) and the Next.js frontend with Supabase database.

**Architecture**: Hybrid model where blockchain handles payment escrow only, while the database stores all data (videos, metadata, bounties).

## Smart Contract Deployment

### Prerequisites
- Solana CLI installed and configured
- Anchor 0.32.1 installed
- Devnet SOL for deployment

### Deployment Steps

1. **Get devnet SOL**:
   ```bash
   # Use web faucet: https://faucet.solana.com/
   # Or CLI (may be rate-limited):
   solana airdrop 2 --url devnet
   ```

2. **Deploy contracts**:
   ```bash
   cd unimake_backend
   anchor build
   anchor deploy --provider.cluster devnet
   ```

3. **Update program ID** (if changed):
   - Update in `Anchor.toml`
   - Update `PROGRAM_ID` in `frontend/lib/solana/program.ts`

## Database Migration

Run the migration script in Supabase SQL editor:

```sql
-- Execute frontend/scripts/011_add_blockchain_fields.sql
```

This adds:
- `bounties.on_chain_pool_address` - Bounty PDA address
- `bounties.blockchain_tx_signature` - Creation transaction
- `bounties.is_blockchain_backed` - Boolean flag
- `submissions.on_chain_submission_address` - Submission PDA address
- `submissions.escrow_tx_signature` - Submission transaction
- `submissions.payout_tx_signature` - Approval/payment transaction
- `profiles.on_chain_profile_address` - Profile PDA address

## Frontend Integration

### Created Files

1. **`frontend/lib/solana/program.ts`** - Program instance and IDL
2. **`frontend/lib/solana/utils.ts`** - PDA derivation helpers
3. **`frontend/lib/solana/bounty-instructions.ts`** - Bounty operations
4. **`frontend/lib/solana/submission-instructions.ts`** - Submission operations
5. **`frontend/lib/solana/profile-instructions.ts`** - Profile operations
6. **`frontend/lib/solana/idl.json`** - Program IDL (auto-generated)
7. **`frontend/lib/solana/types.ts`** - TypeScript types

### Workflow Implementation

#### 1. Create Bounty (Buyer Flow)

**Client-side** (`/bounties/create` page):

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createBountyOnChain } from "@/lib/solana/bounty-instructions";

// In component:
const { connection } = useConnection();
const wallet = useWallet();

async function handleCreateBounty(formData) {
  // 1. Create bounty on blockchain
  const result = await createBountyOnChain(connection, wallet, {
    bountyId: `bounty-${Date.now()}`,
    rewardPerVideo: formData.rewardAmount, // in SOL
    totalPool: formData.rewardAmount * formData.totalSlots,
    videosTarget: formData.totalSlots,
    taskDescription: formData.description,
    minDurationSecs: 30,
    minResolution: "720p",
    minFps: 30,
    expiresAt: new Date(formData.deadline),
  });

  // 2. Write to database with blockchain data
  const response = await fetch("/api/bounties", {
    method: "POST",
    body: JSON.stringify({
      ...formData,
      on_chain_pool_address: result.bountyPDA,
      blockchain_tx_signature: result.signature,
      is_blockchain_backed: true,
    }),
  });

  // 3. Show transaction on Solana Explorer
  console.log(`View transaction: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
}
```

**Server-side** (Already implemented in `/api/bounties/route.ts`):
- Validates blockchain fields
- Stores bounty with on-chain addresses

#### 2. Submit Video (Contributor Flow)

**Client-side** (`/bounties/[id]/submit` page):

```typescript
import { submitVideoOnChain } from "@/lib/solana/submission-instructions";
import { v4 as uuidv4 } from "uuid";

async function handleSubmitVideo(bountyId, videoFile) {
  const submissionId = `submission-${uuidv4()}`;

  // 1. Upload video to storage (existing flow)
  const videoUrl = await uploadVideo(videoFile);

  // 2. Submit on-chain (reserves escrow)
  const result = await submitVideoOnChain(connection, wallet, {
    submissionId,
    bountyId,
    ipfsHash: "TBD", // Implement IPFS upload
    arweaveTx: "TBD", // Implement Arweave upload
    metadataUri: videoUrl,
  });

  // 3. Write to database with blockchain data
  await fetch("/api/submissions", {
    method: "POST",
    body: JSON.stringify({
      bounty_id: bountyId,
      video_url: videoUrl,
      on_chain_submission_address: result.submissionPDA,
      escrow_tx_signature: result.signature,
    }),
  });
}
```

**Server-side** (Already implemented in `/api/submissions/route.ts`):
- Checks if bounty is blockchain-backed
- Requires blockchain fields for blockchain bounties
- Stores submission with on-chain addresses

#### 3. Approve Submission (Buyer Flow)

**Client-side** (Buyer dashboard or submission review page):

```typescript
import { approveSubmissionOnChain } from "@/lib/solana/submission-instructions";

async function handleApproveSubmission(submission) {
  // 1. Get contributor's wallet address from profile
  const { data: profile } = await fetch(`/api/profiles/${submission.contributor_id}`);

  // 2. Approve on-chain (releases payment)
  const txSignature = await approveSubmissionOnChain(connection, wallet, {
    submissionId: submission.on_chain_submission_address,
    bountyId: submission.bounty_id,
    contributorWallet: profile.wallet_address,
    qualityScore: 85, // 0-100 rating
  });

  // 3. Update database with payout transaction
  await fetch(`/api/submissions/${submission.id}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "approved",
      payout_tx_signature: txSignature,
    }),
  });

  console.log(`Payment released: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
}
```

**Server-side** (Already implemented in `/api/submissions/[id]/route.ts`):
- Validates payout transaction signature for blockchain bounties
- Updates submission status
- Records transaction signature

#### 4. Reject Submission (Buyer Flow)

```typescript
import { rejectSubmissionOnChain } from "@/lib/solana/submission-instructions";

async function handleRejectSubmission(submission) {
  const { data: profile } = await fetch(`/api/profiles/${submission.contributor_id}`);

  // 1. Reject on-chain (returns funds to pool)
  const txSignature = await rejectSubmissionOnChain(connection, wallet, {
    submissionId: submission.on_chain_submission_address,
    bountyId: submission.bounty_id,
    contributorWallet: profile.wallet_address,
  });

  // 2. Update database
  await fetch(`/api/submissions/${submission.id}`, {
    method: "PUT",
    body: JSON.stringify({
      status: "rejected",
    }),
  });
}
```

## Profile Initialization

Contributors must have an on-chain profile to receive payments. Implement profile initialization:

```typescript
import { initializeProfileOnChain, checkProfileExists } from "@/lib/solana/profile-instructions";

async function ensureProfileExists() {
  const exists = await checkProfileExists(connection, wallet.publicKey.toString());

  if (!exists) {
    const result = await initializeProfileOnChain(connection, wallet);

    // Update database profile with on-chain address
    await fetch("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        on_chain_profile_address: result.profilePDA,
      }),
    });
  }
}
```

## Error Handling

### Blockchain Errors

```typescript
try {
  await createBountyOnChain(connection, wallet, params);
} catch (error) {
  if (error.message.includes("insufficient funds")) {
    alert("Insufficient SOL balance");
  } else if (error.message.includes("User rejected")) {
    alert("Transaction cancelled");
  } else {
    console.error("Blockchain error:", error);
    alert("Failed to create bounty on blockchain");
  }
}
```

### Hybrid Failure Handling

**Problem**: Blockchain transaction succeeds but database write fails.

**Solution**: Implement retry logic or manual recovery:

```typescript
async function createBountyWithRetry(formData) {
  let blockchainResult;

  try {
    // Step 1: Blockchain transaction
    blockchainResult = await createBountyOnChain(connection, wallet, params);
  } catch (error) {
    // Blockchain failed - nothing to clean up
    throw new Error("Failed to create bounty on blockchain");
  }

  try {
    // Step 2: Database write
    await fetch("/api/bounties", { method: "POST", body: JSON.stringify({...}) });
  } catch (error) {
    // Database failed - blockchain already committed
    // Log for manual recovery or implement retry
    console.error("Database write failed but blockchain succeeded", {
      signature: blockchainResult.signature,
      bountyPDA: blockchainResult.bountyPDA,
    });

    // Optionally: Cancel bounty on-chain
    await cancelBountyOnChain(connection, wallet, blockchainResult.bountyId);

    throw new Error("Failed to save bounty to database");
  }
}
```

## Testing

### Local Testing

1. **Start local validator**:
   ```bash
   solana-test-validator
   ```

2. **Deploy to localnet**:
   ```bash
   cd unimake_backend
   # Update Anchor.toml cluster to localnet
   anchor deploy
   ```

3. **Update frontend**:
   - Set `DEVNET_RPC = "http://localhost:8899"` in `program.ts`
   - Run frontend: `pnpm dev`

### Devnet Testing

1. **Get test SOL**: https://faucet.solana.com/
2. **Use Phantom/Solflare wallet** on devnet
3. **Test full workflow**:
   - Connect wallet
   - Create bounty (check tx on explorer)
   - Submit video (check tx on explorer)
   - Approve submission (check payment on explorer)

## Monitoring

### Track On-Chain State

```typescript
import { fetchBountyData } from "@/lib/solana/bounty-instructions";

const bountyState = await fetchBountyData(connection, bountyId);
console.log({
  totalPool: bountyState.totalPool.toString(),
  remainingPool: bountyState.remainingPool.toString(),
  videosCollected: bountyState.videosCollected,
  status: bountyState.status,
});
```

### Sync Database with Blockchain

Periodically sync reputation data:

```typescript
import { syncReputationToDatabase } from "@/lib/solana/profile-instructions";

const reputationData = await syncReputationToDatabase(connection, walletAddress);

if (reputationData) {
  await fetch("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(reputationData),
  });
}
```

## Security Considerations

1. **Wallet Connection**: Always verify wallet is connected before blockchain operations
2. **Transaction Signatures**: Validate signatures exist in database for audit trail
3. **Amount Validation**: Ensure reward amounts match between frontend, blockchain, and database
4. **PDA Derivation**: Use consistent PDA seeds (implemented in utils.ts)
5. **Rate Limiting**: Implement rate limits on API routes to prevent spam

## Migration from Database-Only Bounties

Existing bounties (created before blockchain integration) will have:
- `is_blockchain_backed = false`
- `on_chain_pool_address = null`

These bounties continue to work as before, with database-only payments.

New bounties created after deployment will be blockchain-backed.

## Next Steps

1. **Deploy smart contracts to devnet** - Waiting for SOL airdrop or use web faucet
2. **Run database migration** - Execute `011_add_blockchain_fields.sql`
3. **Update bounty creation UI** - Implement client-side blockchain integration
4. **Update submission UI** - Implement client-side blockchain integration
5. **Add transaction confirmations** - Show Solana Explorer links
6. **Implement profile initialization** - Ensure contributors have on-chain profiles
7. **Add loading states** - Show transaction pending states
8. **Error handling** - User-friendly error messages
9. **Testing** - End-to-end testing on devnet

## Support

For blockchain-related issues:
- Check Solana Explorer for transaction details
- Verify wallet has sufficient SOL for gas fees
- Ensure correct network (devnet vs mainnet)
- Check program logs in Anchor test output
