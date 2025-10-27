import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
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
  try {
    const existingAccount = await connection.getAccountInfo(bountyPDA);
    if (existingAccount) {
      throw new Error(
        `Bounty with ID "${params.bountyId}" already exists. Please try again with a different ID.`
      );
    }
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
    const tx = await program.methods
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
      .rpc();

    console.log("Transaction sent:", tx);

    // Wait for confirmation
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature: tx,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    console.log("Transaction confirmed:", tx);

    return {
      signature: tx,
      bountyPDA: bountyPDA.toString(),
      bountyId: params.bountyId,
    };
  } catch (error: any) {
    console.error("Create bounty transaction failed:", error);
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
