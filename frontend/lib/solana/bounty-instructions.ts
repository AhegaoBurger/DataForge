import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgramWithWallet } from "./program";
import { getBountyPDA, solToLamports, uuidToBytes } from "./utils";

export interface CreateBountyParams {
  bountyId: string;
  rewardPerVideo: number; // in SOL
  totalPool: number; // in SOL
  videosTarget: number;
  taskDescription: string;
  minDurationSecs: number;
  minResolution: string; // e.g., "720p", "1080p"
  minFps: number;
  expiresAt: Date;
}

export interface CreateBountyResult {
  signature: string;
  bountyPDA: string;
  bountyId: string;
}

/**
 * Create a bounty on-chain with SOL escrow pool
 */
export async function createBountyOnChain(
  connection: Connection,
  wallet: any, // AnchorWallet or similar
  params: CreateBountyParams
): Promise<CreateBountyResult> {
  const program = getProgramWithWallet(connection, wallet);
  const [bountyPDA] = getBountyPDA(params.bountyId);

  // Check if this bounty PDA already exists
  console.log("Checking if bounty PDA exists:", bountyPDA.toString());
  try {
    const existingAccount = await connection.getAccountInfo(bountyPDA);
    if (existingAccount) {
      console.error("Bounty PDA already exists on-chain!");
      throw new Error(
        `Bounty with ID "${params.bountyId}" already exists on-chain. Please try again with a different ID.`
      );
    }
    console.log("Bounty PDA is available (account does not exist)");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      throw error;
    }
    // Account doesn't exist, which is what we want
  }

  const rewardPerVideoLamports = new BN(solToLamports(params.rewardPerVideo));
  const totalPoolLamports = new BN(solToLamports(params.totalPool));
  const expiresAtUnix = new BN(Math.floor(params.expiresAt.getTime() / 1000));

  // Convert UUID string to bytes for on-chain storage
  const bountyIdBytes = Array.from(uuidToBytes(params.bountyId));

  try {
    // CRITICAL: Get FRESH blockhash for each transaction attempt
    // This ensures retries don't reuse the same transaction signature
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Creating transaction with fresh blockhash:", blockhash.slice(0, 8) + "...");

    // Build the transaction instruction
    const instruction = await program.methods
      .createBounty(
        bountyIdBytes,
        rewardPerVideoLamports,
        totalPoolLamports,
        params.videosTarget,
        params.taskDescription,
        params.minDurationSecs,
        params.minResolution,
        params.minFps,
        expiresAtUnix
      )
      .accountsPartial({
        bountyPool: bountyPDA,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Build transaction with explicit blockhash
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Add memo instruction with timestamp to ensure transaction uniqueness
    // This prevents wallet caching and ensures each attempt is unique
    const timestamp = Date.now();
    const memoData = Buffer.from(`TerraTrain Bounty Creation: ${timestamp}`, 'utf-8');
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program
      data: memoData,
    });

    transaction.add(memoInstruction);
    transaction.add(instruction);

    console.log("Transaction uniqueness timestamp:", timestamp);
    console.log("Transaction details:", {
      blockhash: blockhash.slice(0, 12) + "...",
      feePayer: wallet.publicKey.toString().slice(0, 12) + "...",
      instructionCount: transaction.instructions.length,
      memoData: memoData.toString().slice(0, 50) + "...",
    });

    // Sign and send the transaction
    console.log("Requesting wallet signature...");
    console.log("Wallet adapter name:", wallet.adapter?.name);

    // Use wallet's sendTransaction if available (some wallets require this)
    // Otherwise fall back to manual signing + sending
    let signature: string;

    if (wallet.sendTransaction) {
      console.log("Using wallet.sendTransaction (wallet will handle signing and sending)");
      signature = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 0, // Don't retry - we handle retries at higher level
      });
    } else {
      console.log("Using manual signing + sendRawTransaction");
      const signedTx = await wallet.signTransaction(transaction);
      signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 0,
      });
    }

    console.log("Transaction sent:", signature);

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    console.log("Transaction confirmed:", signature);

    return {
      signature,
      bountyPDA: bountyPDA.toString(),
      bountyId: params.bountyId,
    };
  } catch (error: any) {
    console.error("Create bounty transaction failed:", error);

    // Enhanced error logging for debugging
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    if (error.signature) {
      console.error("Failed transaction signature:", error.signature);
    }

    // Provide more helpful error messages
    if (error.message?.includes("already been processed")) {
      throw new Error(
        "Transaction was already processed. This bounty may already exist. Please refresh the page and try again."
      );
    }

    throw error;
  }
}

/**
 * Pause an active bounty
 */
export async function pauseBountyOnChain(
  connection: Connection,
  wallet: any,
  bountyId: string
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [bountyPDA] = getBountyPDA(bountyId);

  const tx = await program.methods
    .pauseBounty()
    .accountsPartial({
      bountyPool: bountyPDA,
      authority: wallet.publicKey,
    })
    .rpc();

  return tx;
}

/**
 * Resume a paused bounty
 */
export async function resumeBountyOnChain(
  connection: Connection,
  wallet: any,
  bountyId: string
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [bountyPDA] = getBountyPDA(bountyId);

  const tx = await program.methods
    .resumeBounty()
    .accountsPartial({
      bountyPool: bountyPDA,
      authority: wallet.publicKey,
    })
    .rpc();

  return tx;
}

/**
 * Complete a bounty
 */
export async function completeBountyOnChain(
  connection: Connection,
  wallet: any,
  bountyId: string
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [bountyPDA] = getBountyPDA(bountyId);

  const tx = await program.methods
    .completeBounty()
    .accountsPartial({
      bountyPool: bountyPDA,
      authority: wallet.publicKey,
    })
    .rpc();

  return tx;
}

/**
 * Cancel a bounty and return remaining funds
 */
export async function cancelBountyOnChain(
  connection: Connection,
  wallet: any,
  bountyId: string
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [bountyPDA] = getBountyPDA(bountyId);

  const tx = await program.methods
    .cancelBounty()
    .accountsPartial({
      bountyPool: bountyPDA,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

/**
 * Fetch bounty account data from chain
 */
export async function fetchBountyData(
  connection: Connection,
  bountyId: string
) {
  const program = getProgramWithWallet(connection, {} as any);
  const [bountyPDA] = getBountyPDA(bountyId);

  try {
    const bountyAccount = await program.account.bountyPool.fetch(bountyPDA);
    return bountyAccount;
  } catch (error) {
    console.error("Error fetching bounty:", error);
    return null;
  }
}
