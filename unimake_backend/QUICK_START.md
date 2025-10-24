# Quick Start Guide

## Prerequisites

- Rust installed
- Solana CLI installed (`sh -c "$(curl -sSfL https://release.solana.com/stable/install)"`)
- Anchor CLI installed (`cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install latest && avm use latest`)
- Node.js & Yarn installed

## Development Commands

```bash
# Build the program
anchor build

# Run tests (requires local validator in another terminal)
anchor test

# Start local validator
solana-test-validator

# Deploy to localnet
anchor deploy --provider.cluster localnet

# Deploy to devnet
solana config set --url devnet
solana airdrop 2  # Get some SOL for deployment
anchor deploy --provider.cluster devnet
```

## Program PDAs

All accounts use Program Derived Addresses (PDAs):

```typescript
// Bounty PDA
const [bountyPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("bounty"), Buffer.from(bountyId)],
  programId
);

// Submission PDA
const [submissionPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("submission"), Buffer.from(submissionId)],
  programId
);

// Profile PDA
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), walletPublicKey.toBuffer()],
  programId
);

// Dataset PDA
const [datasetPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("dataset"), Buffer.from(datasetId)],
  programId
);
```

## Quick Integration Checklist

### 1. Copy IDL to Frontend
```bash
cp target/idl/unimake_backend.json ../frontend/lib/solana/idl.json
```

### 2. Install Frontend Dependencies
```bash
cd ../frontend
pnpm add @coral-xyz/anchor @solana/web3.js
```

### 3. Set Environment Variables
```bash
# In frontend/.env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG
```

### 4. Create Program Hook
```typescript
// frontend/lib/solana/program.ts
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import IDL from './idl.json';

const PROGRAM_ID = new PublicKey('CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG');

export function useProgram() {
  const wallet = useAnchorWallet();
  if (!wallet) return null;
  
  const connection = new Connection('https://api.devnet.solana.com');
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(IDL, PROGRAM_ID, provider);
}
```

### 5. Test Integration
```typescript
// Create a bounty
const program = useProgram();
const tx = await program.methods
  .createBounty(/* ... */)
  .accounts({ /* ... */ })
  .rpc();
console.log('Transaction:', tx);
```

## Common Operations

### Create Bounty
```bash
# Test with Anchor CLI
anchor run create-bounty
```

### Submit Video
```bash
# Requires profile initialization first
anchor run submit-video
```

### Approve Submission (Admin)
```bash
# Requires admin wallet
anchor run approve-submission
```

## Debugging

### View Program Logs
```bash
solana logs <PROGRAM_ID> --url devnet
```

### Fetch Account Data
```bash
# Install Anchor CLI helper
anchor account bountyPool <BOUNTY_PDA> --provider.cluster devnet
```

### Check Program Deployment
```bash
solana program show <PROGRAM_ID> --url devnet
```

## Error Codes

Common errors and solutions:

- **InsufficientPool** - Bounty doesn't have enough funds for reward
- **BountyNotActive** - Bounty is paused or completed
- **BountyFull** - All submission slots are filled
- **InvalidStatus** - Operation not allowed for current submission status
- **BadgeAlreadyEarned** - Trying to award duplicate badge

## Gas Optimization Tips

1. Close unused accounts to reclaim rent
2. Batch operations when possible
3. Use smaller string lengths when appropriate
4. Consider account compression for large-scale use

## Resources

- **Full Documentation**: See [README.md](./README.md)
- **Integration Guide**: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Project Spec**: See [../PROJECT_SPEC.md](../PROJECT_SPEC.md)
- **Anchor Docs**: https://www.anchor-lang.com/
- **Solana Docs**: https://docs.solana.com/

## Support

For issues or questions, check the test suite (`tests/unimake_backend.ts`) for working examples.
