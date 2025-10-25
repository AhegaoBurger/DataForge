import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./program";

/**
 * Derive the bounty pool PDA from bounty ID
 * Note: bountyId must be <= 32 bytes (Solana PDA seed limit)
 */
export function getBountyPDA(bountyId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), Buffer.from(bountyId)],
    PROGRAM_ID
  );
}

/**
 * Derive the submission PDA from submission ID
 */
export function getSubmissionPDA(submissionId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("submission"), Buffer.from(submissionId)],
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
 */
export function getDatasetPDA(datasetId: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("dataset"), Buffer.from(datasetId)],
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
