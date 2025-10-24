# Frontend Integration Guide

This guide shows how to integrate the Solana smart contracts with your Next.js frontend.

## Installation

In your frontend directory, install required packages:

```bash
cd frontend
pnpm add @coral-xyz/anchor @solana/web3.js
```

## Program Configuration

Create a configuration file for the program:

```typescript
// frontend/lib/solana/config.ts
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG');

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export const RPC_ENDPOINT = 
  SOLANA_NETWORK === 'mainnet-beta' 
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com';
```

## Initialize Anchor Program

```typescript
// frontend/lib/solana/program.ts
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, RPC_ENDPOINT } from './config';
import IDL from './idl.json'; // Copy from target/idl/unimake_backend.json

export function useProgram() {
  const wallet = useAnchorWallet();
  
  if (!wallet) return null;
  
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  
  return new Program(IDL, PROGRAM_ID, provider);
}
```

## Copy IDL File

After building the program, copy the IDL to your frontend:

```bash
cp unimake_backend/target/idl/unimake_backend.json frontend/lib/solana/idl.json
```

## Example: Create Bounty

```typescript
// frontend/app/bounties/create/actions.ts
'use client';

import { useProgram } from '@/lib/solana/program';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function createBountyOnChain(bountyData: {
  bountyId: string;
  rewardPerVideo: number; // in SOL
  totalPool: number; // in SOL
  videosTarget: number;
  taskDescription: string;
  minDurationSecs: number;
  minResolution: string;
  minFps: number;
  expiresInDays: number;
}) {
  const program = useProgram();
  const { publicKey } = useWallet();
  
  if (!program || !publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Calculate PDA for bounty
  const [bountyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bounty'), Buffer.from(bountyData.bountyId)],
    program.programId
  );
  
  // Calculate expiration timestamp
  const expiresAt = new BN(
    Math.floor(Date.now() / 1000) + (bountyData.expiresInDays * 86400)
  );
  
  // Create bounty on-chain
  const tx = await program.methods
    .createBounty(
      bountyData.bountyId,
      new BN(bountyData.rewardPerVideo * LAMPORTS_PER_SOL),
      new BN(bountyData.totalPool * LAMPORTS_PER_SOL),
      bountyData.videosTarget,
      bountyData.taskDescription,
      bountyData.minDurationSecs,
      bountyData.minResolution,
      bountyData.minFps,
      expiresAt
    )
    .accounts({
      bountyPool: bountyPda,
      authority: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
    
  return { signature: tx, bountyPda: bountyPda.toString() };
}
```

## Example: Submit Video

```typescript
// frontend/app/bounties/[id]/submit/actions.ts
'use client';

import { useProgram } from '@/lib/solana/program';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';

export async function submitVideoOnChain(submissionData: {
  submissionId: string;
  bountyId: string;
  ipfsHash: string;
  arweaveTx: string;
  metadataUri: string;
}) {
  const program = useProgram();
  const { publicKey } = useWallet();
  
  if (!program || !publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Calculate PDAs
  const [submissionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('submission'), Buffer.from(submissionData.submissionId)],
    program.programId
  );
  
  const [bountyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bounty'), Buffer.from(submissionData.bountyId)],
    program.programId
  );
  
  // Submit video
  const tx = await program.methods
    .submitVideo(
      submissionData.submissionId,
      submissionData.ipfsHash,
      submissionData.arweaveTx,
      submissionData.metadataUri
    )
    .accounts({
      submission: submissionPda,
      bountyPool: bountyPda,
      contributor: publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
    
  return { signature: tx, submissionPda: submissionPda.toString() };
}
```

## Example: Initialize Profile (First Time)

```typescript
// frontend/lib/solana/profile.ts
'use client';

import { useProgram } from '@/lib/solana/program';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';

export async function initializeProfileOnChain() {
  const program = useProgram();
  const { publicKey } = useWallet();
  
  if (!program || !publicKey) {
    throw new Error('Wallet not connected');
  }
  
  // Calculate profile PDA
  const [profilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('profile'), publicKey.toBuffer()],
    program.programId
  );
  
  // Check if profile already exists
  try {
    await program.account.contributorProfile.fetch(profilePda);
    return { exists: true, profilePda: profilePda.toString() };
  } catch {
    // Profile doesn't exist, create it
    const tx = await program.methods
      .initializeProfile()
      .accounts({
        contributorProfile: profilePda,
        contributor: publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    return { exists: false, signature: tx, profilePda: profilePda.toString() };
  }
}
```

## Example: Approve Submission (Admin)

```typescript
// frontend/app/api/admin/approve-submission/route.ts
import { NextResponse } from 'next/server';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { PROGRAM_ID, RPC_ENDPOINT } from '@/lib/solana/config';
import IDL from '@/lib/solana/idl.json';

export async function POST(request: Request) {
  // This should run server-side with admin wallet
  const { submissionId, bountyId, contributorAddress, qualityScore } = await request.json();
  
  // Load admin keypair from environment
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.ADMIN_WALLET_SECRET_KEY!))
  );
  
  const connection = new Connection(RPC_ENDPOINT, 'confirmed');
  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  const program = new Program(IDL, PROGRAM_ID, provider);
  
  // Calculate PDAs
  const [submissionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('submission'), Buffer.from(submissionId)],
    program.programId
  );
  
  const [bountyPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bounty'), Buffer.from(bountyId)],
    program.programId
  );
  
  const contributorPubkey = new PublicKey(contributorAddress);
  const [profilePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('profile'), contributorPubkey.toBuffer()],
    program.programId
  );
  
  // Approve submission
  const tx = await program.methods
    .approveSubmission(qualityScore)
    .accounts({
      submission: submissionPda,
      bountyPool: bountyPda,
      contributorProfile: profilePda,
      contributor: contributorPubkey,
      authority: adminKeypair.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
    
  return NextResponse.json({ signature: tx });
}
```

## Listening to Events

```typescript
// frontend/lib/solana/events.ts
import { useEffect } from 'react';
import { useProgram } from './program';

export function useSubmissionEvents(callback: (event: any) => void) {
  const program = useProgram();
  
  useEffect(() => {
    if (!program) return;
    
    const listener = program.addEventListener('SubmissionApproved', (event) => {
      console.log('Submission approved:', event);
      callback(event);
    });
    
    return () => {
      program.removeEventListener(listener);
    };
  }, [program, callback]);
}

// Usage in a component:
export function SubmissionStatus({ submissionId }: { submissionId: string }) {
  useSubmissionEvents((event) => {
    if (event.submissionId === submissionId) {
      // Refresh UI, show notification, etc.
      toast.success(`Submission approved! Earned ${event.reward} lamports`);
    }
  });
  
  return <div>Waiting for approval...</div>;
}
```

## Fetching On-Chain Data

```typescript
// frontend/lib/solana/queries.ts
import { useProgram } from './program';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';

export function useBountyOnChain(bountyId: string) {
  const program = useProgram();
  
  return useQuery({
    queryKey: ['bounty', bountyId],
    queryFn: async () => {
      if (!program) return null;
      
      const [bountyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('bounty'), Buffer.from(bountyId)],
        program.programId
      );
      
      return await program.account.bountyPool.fetch(bountyPda);
    },
    enabled: !!program,
  });
}

export function useContributorProfile(walletAddress: string) {
  const program = useProgram();
  
  return useQuery({
    queryKey: ['profile', walletAddress],
    queryFn: async () => {
      if (!program) return null;
      
      const [profilePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('profile'), new PublicKey(walletAddress).toBuffer()],
        program.programId
      );
      
      try {
        return await program.account.contributorProfile.fetch(profilePda);
      } catch {
        return null; // Profile doesn't exist
      }
    },
    enabled: !!program && !!walletAddress,
  });
}
```

## Synchronization Pattern

### When creating a bounty:

1. **Frontend creates Supabase record first:**
```typescript
const { data: bounty } = await supabase
  .from('bounties')
  .insert({ 
    id: bountyId,
    creator_id: userId,
    ...bountyData 
  })
  .select()
  .single();
```

2. **Then create on-chain:**
```typescript
const { signature } = await createBountyOnChain({
  bountyId,
  ...bountyData
});
```

3. **Update Supabase with transaction signature:**
```typescript
await supabase
  .from('bounties')
  .update({ transaction_signature: signature })
  .eq('id', bountyId);
```

### When submitting a video:

1. **Upload to IPFS/Arweave** (get hashes)
2. **Create Supabase submission record**
3. **Submit on-chain** (creates escrow)
4. **Update Supabase with transaction signature**

### When approving submission:

1. **Admin approves on-chain** (triggers payment)
2. **Listen to `SubmissionApproved` event**
3. **Update Supabase submission status**
4. **Update profile earnings from on-chain data**

## Error Handling

```typescript
import { AnchorError } from '@coral-xyz/anchor';

try {
  await program.methods.submitVideo(...).rpc();
} catch (error) {
  if (error instanceof AnchorError) {
    switch (error.error.errorCode.code) {
      case 'BountyNotActive':
        toast.error('This bounty is not currently accepting submissions');
        break;
      case 'BountyFull':
        toast.error('This bounty has reached its submission limit');
        break;
      case 'InsufficientPool':
        toast.error('Bounty has insufficient funds');
        break;
      default:
        toast.error(`Error: ${error.error.errorMessage}`);
    }
  } else {
    toast.error('Transaction failed');
  }
}
```

## Testing

Before integrating with production, test on devnet:

1. Set network to devnet in config
2. Request devnet SOL: `solana airdrop 2 <YOUR_WALLET_ADDRESS> --url devnet`
3. Deploy program to devnet: `anchor deploy --provider.cluster devnet`
4. Test all flows in your frontend

## Next Steps

1. Copy `target/idl/unimake_backend.json` to `frontend/lib/solana/idl.json`
2. Implement the program hook in your wallet provider
3. Add on-chain calls to your existing API routes
4. Set up event listeners for real-time updates
5. Test thoroughly on devnet before mainnet

## Questions?

See the main [README.md](./README.md) for more details on program instructions and architecture.
