import { Connection, SystemProgram } from "@solana/web3.js";
import { getProgramWithWallet } from "./program";
import { getProfilePDA } from "./utils";

/**
 * Initialize a contributor profile on-chain
 */
export async function initializeProfileOnChain(
  connection: Connection,
  wallet: any
): Promise<{ signature: string; profilePDA: string }> {
  const program = getProgramWithWallet(connection, wallet);
  const [profilePDA] = getProfilePDA(wallet.publicKey);

  const tx = await program.methods
    .initializeProfile()
    .accountsPartial({
      contributorProfile: profilePDA,
      contributor: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return {
    signature: tx,
    profilePDA: profilePDA.toString(),
  };
}

/**
 * Check if a profile exists on-chain for a given wallet
 */
export async function checkProfileExists(
  connection: Connection,
  walletAddress: string
): Promise<boolean> {
  const program = getProgramWithWallet(connection, {} as any);
  const [profilePDA] = getProfilePDA(
    new (await import("@solana/web3.js")).PublicKey(walletAddress)
  );

  try {
    await program.account.contributorProfile.fetch(profilePDA);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch profile data from chain
 */
export async function fetchProfileData(
  connection: Connection,
  walletAddress: string
) {
  const program = getProgramWithWallet(connection, {} as any);
  const [profilePDA] = getProfilePDA(
    new (await import("@solana/web3.js")).PublicKey(walletAddress)
  );

  try {
    const profileAccount = await program.account.contributorProfile.fetch(
      profilePDA
    );
    return profileAccount;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

/**
 * Sync on-chain reputation data to database
 * Returns the reputation data to be written to DB
 */
export async function syncReputationToDatabase(
  connection: Connection,
  walletAddress: string
): Promise<{
  totalSubmissions: number;
  acceptedSubmissions: number;
  rejectedSubmissions: number;
  averageQualityScore: number;
  totalEarnings: number;
  reputationScore: number;
} | null> {
  const profileData = await fetchProfileData(connection, walletAddress);

  if (!profileData) {
    return null;
  }

  // Convert BN values to numbers
  const totalEarningsNum = Number(profileData.totalEarnings) / 1_000_000_000; // Convert lamports to SOL

  return {
    totalSubmissions: profileData.totalSubmissions,
    acceptedSubmissions: profileData.acceptedSubmissions,
    rejectedSubmissions: profileData.rejectedSubmissions,
    averageQualityScore: profileData.averageQualityScore,
    totalEarnings: totalEarningsNum,
    reputationScore: profileData.reputationScore,
  };
}
