import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { getProgramWithWallet } from "./program";
import { getBountyPDA, getProfilePDA, getSubmissionPDA } from "./utils";

export interface SubmitVideoParams {
  submissionId: string;
  bountyId: string;
  ipfsHash: string;
  arweaveTx: string;
  metadataUri: string;
}

export interface SubmitVideoResult {
  signature: string;
  submissionPDA: string;
  submissionId: string;
}

/**
 * Submit a video for a bounty (creates escrow reservation)
 */
export async function submitVideoOnChain(
  connection: Connection,
  wallet: any,
  params: SubmitVideoParams
): Promise<SubmitVideoResult> {
  const program = getProgramWithWallet(connection, wallet);
  const [submissionPDA] = getSubmissionPDA(params.submissionId);
  const [bountyPDA] = getBountyPDA(params.bountyId);

  // Check if this submission PDA already exists
  console.log("Checking if submission PDA exists:", submissionPDA.toString());
  try {
    const existingAccount = await connection.getAccountInfo(submissionPDA);
    if (existingAccount) {
      console.error("Submission PDA already exists on-chain!");
      throw new Error(
        `Submission with ID "${params.submissionId}" already exists on-chain. Please try again.`
      );
    }
    console.log("Submission PDA is available (account does not exist)");
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      throw error;
    }
    // Other errors (like network errors) are okay - we'll proceed
    console.log("PDA check inconclusive, proceeding with transaction");
  }

  // Convert submission ID to 16-byte array
  // Submission IDs are timestamp-based strings, so we need to pad them
  const encoder = new TextEncoder();
  const idBytes = encoder.encode(params.submissionId);
  const paddedBytes = new Uint8Array(16);
  const copyLength = Math.min(idBytes.length, 16);
  paddedBytes.set(idBytes.slice(0, copyLength));
  const submissionIdArray = Array.from(paddedBytes);

  try {
    // CRITICAL: Get FRESH blockhash for each transaction attempt
    // This ensures retries don't reuse the same transaction signature
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Creating transaction with fresh blockhash:", blockhash.slice(0, 8) + "...");

    // Build the transaction instruction
    const instruction = await program.methods
      .submitVideo(
        submissionIdArray,
        params.ipfsHash,
        params.arweaveTx,
        params.metadataUri
      )
      .accountsPartial({
        submission: submissionPDA,
        bountyPool: bountyPDA,
        contributor: wallet.publicKey,
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
    const memoData = Buffer.from(`TerraTrain Video Submission: ${timestamp}`, 'utf-8');
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

    // CRITICAL: Use wallet.sendTransaction to prevent double-sending
    // Some wallets (like Phantom) auto-send after signTransaction, causing duplicate submissions
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
      submissionPDA: submissionPDA.toString(),
      submissionId: params.submissionId,
    };
  } catch (error: any) {
    console.error("Submit video transaction failed:", error);

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
        "Transaction was already processed. This submission may already exist. Please refresh the page and try again."
      );
    }

    throw error;
  }
}

export interface ApproveSubmissionParams {
  submissionId: string;
  bountyId: string;
  contributorWallet: string; // Public key as string
  qualityScore: number; // 0-100
}

/**
 * Approve a submission and release payment to contributor
 */
export async function approveSubmissionOnChain(
  connection: Connection,
  wallet: any, // Bounty authority wallet
  params: ApproveSubmissionParams
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [submissionPDA] = getSubmissionPDA(params.submissionId);
  const [bountyPDA] = getBountyPDA(params.bountyId);
  const contributorPubkey = new PublicKey(params.contributorWallet);
  const [contributorProfilePDA] = getProfilePDA(contributorPubkey);

  // Check if submission is already approved
  try {
    const submissionAccount = await program.account.videoSubmission.fetch(submissionPDA);
    if (submissionAccount.status.approved) {
      throw new Error("This submission has already been approved on-chain. Please refresh the page and update the database status manually if needed.");
    }
  } catch (error: any) {
    // If we can't fetch the account, it might not exist - let the transaction fail with a better error
    if (!error.message?.includes("already been approved")) {
      console.warn("Could not check submission status:", error);
    } else {
      throw error;
    }
  }

  try {
    // CRITICAL: Get FRESH blockhash for each transaction attempt
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Creating approval transaction with fresh blockhash:", blockhash.slice(0, 8) + "...");

    // Build the transaction instruction
    const instruction = await program.methods
      .approveSubmission(params.qualityScore)
      .accountsPartial({
        submission: submissionPDA,
        bountyPool: bountyPDA,
        contributorProfile: contributorProfilePDA,
        contributor: contributorPubkey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Build transaction with explicit blockhash
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Add memo instruction with timestamp to ensure transaction uniqueness
    const timestamp = Date.now();
    const memoData = Buffer.from(`TerraTrain Approval: ${timestamp}`, 'utf-8');
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
    });

    // Simulate transaction first to catch errors early
    try {
      console.log("Simulating approval transaction...");
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Simulation result:", simulation);

      if (simulation.value.err) {
        console.error("Transaction simulation failed:", simulation.value.err);
        console.error("Simulation logs:", simulation.value.logs);
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
    } catch (simError: any) {
      console.error("Simulation error:", simError);
      // Continue anyway - simulation might fail for various reasons
      if (simError.message?.includes("simulation failed")) {
        throw simError; // Don't continue if simulation explicitly failed
      }
    }

    // Sign and send the transaction
    console.log("Requesting wallet signature...");
    console.log("Wallet details:", {
      hasWallet: !!wallet,
      hasSendTransaction: !!wallet?.sendTransaction,
      hasSignTransaction: !!wallet?.signTransaction,
      publicKey: wallet?.publicKey?.toString(),
    });

    let signature: string;

    try {
      // Try using signTransaction first (more compatible)
      if (wallet.signTransaction) {
        console.log("Using wallet.signTransaction + sendRawTransaction");
        const signedTx = await wallet.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        });
      } else if (wallet.sendTransaction) {
        console.log("Using wallet.sendTransaction (wallet will handle signing and sending)");
        signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        });
      } else {
        throw new Error("Wallet does not support signing transactions");
      }
    } catch (signError: any) {
      console.error("Transaction signing failed:", signError);
      console.error("Error details:", {
        name: signError.name,
        message: signError.message,
        stack: signError.stack,
      });
      throw signError;
    }

    console.log("Approval transaction sent:", signature);

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    console.log("Approval transaction confirmed:", signature);

    return signature;
  } catch (error: any) {
    console.error("Approval transaction error:", error);

    // Enhanced error logging
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    if (error.signature) {
      console.error("Failed transaction signature:", error.signature);
    }

    // Provide more helpful error messages
    if (error.message?.includes("already been processed")) {
      throw new Error("Transaction already processed. This submission may already be approved.");
    }
    if (error.message?.includes("InvalidStatus")) {
      throw new Error("Cannot approve: submission has already been approved or rejected on-chain.");
    }
    if (error.message?.includes("User rejected")) {
      throw new Error("Transaction was cancelled by user.");
    }

    throw error;
  }
}

export interface RejectSubmissionParams {
  submissionId: string;
  bountyId: string;
  contributorWallet: string; // Public key as string
}

/**
 * Reject a submission and return funds to bounty pool
 */
export async function rejectSubmissionOnChain(
  connection: Connection,
  wallet: any, // Bounty authority wallet
  params: RejectSubmissionParams
): Promise<string> {
  const program = getProgramWithWallet(connection, wallet);
  const [submissionPDA] = getSubmissionPDA(params.submissionId);
  const [bountyPDA] = getBountyPDA(params.bountyId);
  const contributorPubkey = new PublicKey(params.contributorWallet);
  const [contributorProfilePDA] = getProfilePDA(contributorPubkey);

  try {
    // CRITICAL: Get FRESH blockhash for each transaction attempt
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    console.log("Creating rejection transaction with fresh blockhash:", blockhash.slice(0, 8) + "...");

    // Build the transaction instruction
    const instruction = await program.methods
      .rejectSubmission()
      .accountsPartial({
        submission: submissionPDA,
        bountyPool: bountyPDA,
        contributorProfile: contributorProfilePDA,
        contributor: contributorPubkey,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Build transaction with explicit blockhash
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Add memo instruction with timestamp to ensure transaction uniqueness
    const timestamp = Date.now();
    const memoData = Buffer.from(`TerraTrain Rejection: ${timestamp}`, 'utf-8');
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
    });

    // Simulate transaction first to catch errors early
    try {
      console.log("Simulating rejection transaction...");
      const simulation = await connection.simulateTransaction(transaction);
      console.log("Simulation result:", simulation);

      if (simulation.value.err) {
        console.error("Transaction simulation failed:", simulation.value.err);
        console.error("Simulation logs:", simulation.value.logs);
        throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
      }
    } catch (simError: any) {
      console.error("Simulation error:", simError);
      // Continue anyway - simulation might fail for various reasons
      if (simError.message?.includes("simulation failed")) {
        throw simError; // Don't continue if simulation explicitly failed
      }
    }

    // Sign and send the transaction
    console.log("Requesting wallet signature...");
    console.log("Wallet details:", {
      hasWallet: !!wallet,
      hasSendTransaction: !!wallet?.sendTransaction,
      hasSignTransaction: !!wallet?.signTransaction,
      publicKey: wallet?.publicKey?.toString(),
    });

    let signature: string;

    try {
      // Try using signTransaction first (more compatible)
      if (wallet.signTransaction) {
        console.log("Using wallet.signTransaction + sendRawTransaction");
        const signedTx = await wallet.signTransaction(transaction);
        signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        });
      } else if (wallet.sendTransaction) {
        console.log("Using wallet.sendTransaction (wallet will handle signing and sending)");
        signature = await wallet.sendTransaction(transaction, connection, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 0,
        });
      } else {
        throw new Error("Wallet does not support signing transactions");
      }
    } catch (signError: any) {
      console.error("Transaction signing failed:", signError);
      console.error("Error details:", {
        name: signError.name,
        message: signError.message,
        stack: signError.stack,
      });
      throw signError;
    }

    console.log("Rejection transaction sent:", signature);

    // Wait for confirmation
    await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    }, 'confirmed');

    console.log("Rejection transaction confirmed:", signature);

    return signature;
  } catch (error: any) {
    console.error("Rejection transaction error:", error);

    // Enhanced error logging
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
    if (error.signature) {
      console.error("Failed transaction signature:", error.signature);
    }

    // Provide more helpful error messages
    if (error.message?.includes("already been processed")) {
      throw new Error("Transaction already processed. This submission may already be rejected.");
    }
    if (error.message?.includes("InvalidStatus")) {
      throw new Error("Cannot reject: submission has already been approved or rejected on-chain.");
    }
    if (error.message?.includes("User rejected")) {
      throw new Error("Transaction was cancelled by user.");
    }

    throw error;
  }
}

/**
 * Fetch submission account data from chain
 */
export async function fetchSubmissionData(
  connection: Connection,
  submissionId: string
) {
  const program = getProgramWithWallet(connection, {} as any);
  const [submissionPDA] = getSubmissionPDA(submissionId);

  try {
    const submissionAccount = await program.account.videoSubmission.fetch(
      submissionPDA
    );
    return submissionAccount;
  } catch (error) {
    console.error("Error fetching submission:", error);
    return null;
  }
}
