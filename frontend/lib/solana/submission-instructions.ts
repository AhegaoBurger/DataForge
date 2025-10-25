import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
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

  const tx = await program.methods
    .submitVideo(
      params.submissionId,
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
    .rpc();

  return {
    signature: tx,
    submissionPDA: submissionPDA.toString(),
    submissionId: params.submissionId,
  };
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

  const tx = await program.methods
    .approveSubmission(params.qualityScore)
    .accountsPartial({
      submission: submissionPDA,
      bountyPool: bountyPDA,
      contributorProfile: contributorProfilePDA,
      contributor: contributorPubkey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
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

  const tx = await program.methods
    .rejectSubmission()
    .accountsPartial({
      submission: submissionPDA,
      bountyPool: bountyPDA,
      contributorProfile: contributorProfilePDA,
      contributor: contributorPubkey,
      authority: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
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
