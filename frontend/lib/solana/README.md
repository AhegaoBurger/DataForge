# Solana Integration Library

Quick reference for using TerraTrain smart contracts in the frontend.

## Setup

```typescript
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

function MyComponent() {
  const { connection } = useConnection();
  const wallet = useWallet();

  // Now you can use blockchain functions
}
```

## Bounty Operations

### Create Bounty

```typescript
import { createBountyOnChain } from "@/lib/solana/bounty-instructions";
import { v4 as uuidv4 } from "uuid";

const bountyId = `bounty-${uuidv4()}`;

const result = await createBountyOnChain(connection, wallet, {
  bountyId,
  rewardPerVideo: 0.1, // SOL per video
  totalPool: 1.0, // Total SOL to lock
  videosTarget: 10,
  taskDescription: "Record a video of making coffee",
  minDurationSecs: 30,
  minResolution: "720p",
  minFps: 30,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
});

// Returns:
// {
//   signature: "2jxGN9g...",
//   bountyPDA: "CJpjA6x...",
//   bountyId: "bounty-..."
// }
```

### Pause/Resume/Complete/Cancel Bounty

```typescript
import {
  pauseBountyOnChain,
  resumeBountyOnChain,
  completeBountyOnChain,
  cancelBountyOnChain,
} from "@/lib/solana/bounty-instructions";

// Pause
const sig = await pauseBountyOnChain(connection, wallet, bountyId);

// Resume
const sig = await resumeBountyOnChain(connection, wallet, bountyId);

// Complete
const sig = await completeBountyOnChain(connection, wallet, bountyId);

// Cancel (refunds remaining pool)
const sig = await cancelBountyOnChain(connection, wallet, bountyId);
```

### Fetch Bounty Data

```typescript
import { fetchBountyData } from "@/lib/solana/bounty-instructions";

const bounty = await fetchBountyData(connection, bountyId);

console.log({
  totalPool: bounty.totalPool.toNumber(), // lamports
  remainingPool: bounty.remainingPool.toNumber(),
  videosCollected: bounty.videosCollected,
  videosTarget: bounty.videosTarget,
  status: bounty.status, // { active: {} } | { paused: {} } | etc
});
```

## Submission Operations

### Submit Video

```typescript
import { submitVideoOnChain } from "@/lib/solana/submission-instructions";

const submissionId = `submission-${uuidv4()}`;

const result = await submitVideoOnChain(connection, wallet, {
  submissionId,
  bountyId: "bounty-123",
  ipfsHash: "QmXxx...", // IPFS hash of video
  arweaveTx: "ArweaveTx...", // Arweave transaction ID
  metadataUri: "https://...", // URL to metadata JSON
});

// Returns:
// {
//   signature: "3kxHG...",
//   submissionPDA: "DJpkB7...",
//   submissionId: "submission-..."
// }
```

### Approve Submission

```typescript
import { approveSubmissionOnChain } from "@/lib/solana/submission-instructions";

const signature = await approveSubmissionOnChain(connection, wallet, {
  submissionId: "submission-123",
  bountyId: "bounty-123",
  contributorWallet: "FJpkB7x...", // Contributor's wallet address
  qualityScore: 85, // 0-100 rating
});

// Payment is automatically released from escrow to contributor
```

### Reject Submission

```typescript
import { rejectSubmissionOnChain } from "@/lib/solana/submission-instructions";

const signature = await rejectSubmissionOnChain(connection, wallet, {
  submissionId: "submission-123",
  bountyId: "bounty-123",
  contributorWallet: "FJpkB7x...",
});

// Funds are automatically returned to bounty pool
```

### Fetch Submission Data

```typescript
import { fetchSubmissionData } from "@/lib/solana/submission-instructions";

const submission = await fetchSubmissionData(connection, submissionId);

console.log({
  status: submission.status, // { pending: {} } | { approved: {} } | etc
  escrowAmount: submission.escrowAmount.toNumber(),
  qualityScore: submission.qualityScore,
});
```

## Profile Operations

### Initialize Profile

```typescript
import { initializeProfileOnChain } from "@/lib/solana/profile-instructions";

const result = await initializeProfileOnChain(connection, wallet);

// Returns:
// {
//   signature: "4kxHG...",
//   profilePDA: "EKplC8..."
// }
```

### Check If Profile Exists

```typescript
import { checkProfileExists } from "@/lib/solana/profile-instructions";

const exists = await checkProfileExists(
  connection,
  wallet.publicKey.toString()
);

if (!exists) {
  // Prompt user to initialize profile
}
```

### Fetch Profile Data

```typescript
import { fetchProfileData } from "@/lib/solana/profile-instructions";

const profile = await fetchProfileData(connection, walletAddress);

console.log({
  totalSubmissions: profile.totalSubmissions,
  acceptedSubmissions: profile.acceptedSubmissions,
  rejectedSubmissions: profile.rejectedSubmissions,
  totalEarnings: profile.totalEarnings.toNumber(), // lamports
  reputationScore: profile.reputationScore, // 0-1000
  badges: profile.badges,
});
```

### Sync Reputation to Database

```typescript
import { syncReputationToDatabase } from "@/lib/solana/profile-instructions";

const data = await syncReputationToDatabase(connection, walletAddress);

// data contains reputation stats in database-friendly format
await fetch("/api/profile", {
  method: "PATCH",
  body: JSON.stringify(data),
});
```

## Utility Functions

```typescript
import {
  solToLamports,
  lamportsToSol,
  getBountyPDA,
  getSubmissionPDA,
  getProfilePDA,
  getExplorerUrl,
  shortenAddress,
} from "@/lib/solana/utils";

// Convert SOL ↔ lamports
const lamports = solToLamports(0.5); // 500000000
const sol = lamportsToSol(500000000); // 0.5

// Get PDA addresses
const [bountyPDA, bump] = getBountyPDA("bounty-123");
const [submissionPDA, bump] = getSubmissionPDA("submission-123");
const [profilePDA, bump] = getProfilePDA(wallet.publicKey);

// Explorer URLs
const url = getExplorerUrl(signature, "devnet");
// https://explorer.solana.com/tx/2jxGN9g...?cluster=devnet

const addressUrl = getExplorerAddressUrl(address, "devnet");
// https://explorer.solana.com/address/CJpjA6x...?cluster=devnet

// Shorten address for display
const short = shortenAddress("CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG");
// "CJpj...UDDG"
```

## Error Handling

```typescript
try {
  const result = await createBountyOnChain(connection, wallet, params);
} catch (error: any) {
  if (error.message?.includes("insufficient funds")) {
    alert("You don't have enough SOL for this transaction");
  } else if (error.message?.includes("User rejected")) {
    alert("Transaction was cancelled");
  } else if (error.error?.errorCode?.code === "InsufficientPool") {
    alert("Total pool must cover all video rewards");
  } else {
    console.error("Blockchain error:", error);
    alert("Transaction failed. Please try again.");
  }
}
```

## Common Patterns

### Ensure Wallet Connected

```typescript
if (!wallet.connected || !wallet.publicKey) {
  alert("Please connect your wallet first");
  return;
}
```

### Check Balance Before Transaction

```typescript
const balance = await connection.getBalance(wallet.publicKey);
const solBalance = lamportsToSol(balance);

if (solBalance < totalPool + 0.01) {
  // 0.01 SOL buffer for fees
  alert(`Insufficient balance. You have ${solBalance} SOL`);
  return;
}
```

### Transaction with Loading State

```typescript
const [loading, setLoading] = useState(false);

async function handleCreateBounty() {
  setLoading(true);
  try {
    const result = await createBountyOnChain(connection, wallet, params);
    toast.success("Bounty created successfully!");
    router.push(`/bounties/${bountyId}`);
  } catch (error) {
    toast.error("Failed to create bounty");
  } finally {
    setLoading(false);
  }
}
```

### Full Workflow Example

```typescript
async function createBountyFullWorkflow(formData) {
  // 1. Validate wallet
  if (!wallet.connected) {
    throw new Error("Wallet not connected");
  }

  // 2. Check balance
  const balance = await connection.getBalance(wallet.publicKey);
  if (lamportsToSol(balance) < formData.totalPool + 0.01) {
    throw new Error("Insufficient balance");
  }

  // 3. Create bounty on blockchain
  const bountyId = `bounty-${uuidv4()}`;
  const blockchainResult = await createBountyOnChain(connection, wallet, {
    bountyId,
    ...formData,
  });

  // 4. Save to database
  const response = await fetch("/api/bounties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...formData,
      on_chain_pool_address: blockchainResult.bountyPDA,
      blockchain_tx_signature: blockchainResult.signature,
      is_blockchain_backed: true,
    }),
  });

  if (!response.ok) {
    // Blockchain succeeded but DB failed - log for recovery
    console.error("Database write failed", {
      signature: blockchainResult.signature,
      bountyPDA: blockchainResult.bountyPDA,
    });
    throw new Error("Failed to save bounty to database");
  }

  const { bounty } = await response.json();

  // 5. Return success
  return {
    bounty,
    explorerUrl: getExplorerUrl(blockchainResult.signature, "devnet"),
  };
}
```

## Constants

```typescript
// Program ID (same across all networks)
export const PROGRAM_ID = "CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG";

// RPC endpoints
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

// Network (change for production)
const CLUSTER = "devnet"; // or "mainnet-beta"
```
