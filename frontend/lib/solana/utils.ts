import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./program";

/**
 * Convert UUID string to 16-byte array for use in Solana PDAs
 * UUID format: "550e8400-e29b-41d4-a716-446655440000"
 * Converts to 16 bytes by parsing the hex representation
 */
export function uuidToBytes(uuid: string): Uint8Array {
  // Remove hyphens from UUID
  const hex = uuid.replace(/-/g, "");

  // Validate UUID format (32 hex chars after removing hyphens)
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID format: ${uuid}`);
  }

  // Convert hex string to bytes
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }

  return bytes;
}

/**
 * Derive the bounty pool PDA from bounty ID
 * Bounty ID is a UUID string that gets converted to 16 bytes
 */
export function getBountyPDA(bountyId: string): [PublicKey, number] {
  const bountyIdBytes = uuidToBytes(bountyId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), bountyIdBytes],
    PROGRAM_ID
  );
}

/**
 * Derive the submission PDA from submission ID
 * For submissions, we use a timestamp-based ID that needs to be padded to 16 bytes
 */
export function getSubmissionPDA(submissionId: string): [PublicKey, number] {
  // For submission IDs (e.g., "1234567890-abc123"), we'll pad to 16 bytes
  // This ensures consistent length for PDA derivation
  const encoder = new TextEncoder();
  const idBytes = encoder.encode(submissionId);

  // Pad or truncate to 16 bytes
  const paddedBytes = new Uint8Array(16);
  const copyLength = Math.min(idBytes.length, 16);
  paddedBytes.set(idBytes.slice(0, copyLength));

  return PublicKey.findProgramAddressSync(
    [Buffer.from("submission"), paddedBytes],
    PROGRAM_ID
  );
}

/**
 * Derive the contributor profile PDA from wallet public key
 */
export function getProfilePDA(walletPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("profile"), walletPubkey.toBuffer()],
    PROGRAM_ID
  );
}

/**
 * Derive the dataset NFT PDA from dataset ID
 * Dataset ID is a UUID string that gets converted to 16 bytes
 */
export function getDatasetPDA(datasetId: string): [PublicKey, number] {
  const datasetIdBytes = uuidToBytes(datasetId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("dataset"), datasetIdBytes],
    PROGRAM_ID
  );
}

/**
 * Convert SOL amount to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1_000_000_000);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
  return Number(lamports) / 1_000_000_000;
}

/**
 * Format transaction signature for Solana Explorer
 */
export function getExplorerUrl(
  signature: string,
  cluster: "devnet" | "mainnet-beta" | "testnet" = "devnet"
): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;
}

/**
 * Format address for Solana Explorer
 */
export function getExplorerAddressUrl(
  address: string,
  cluster: "devnet" | "mainnet-beta" | "testnet" = "devnet"
): string {
  return `https://explorer.solana.com/address/${address}?cluster=${cluster}`;
}

/**
 * Short format for displaying addresses (first 4 + last 4 chars)
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
