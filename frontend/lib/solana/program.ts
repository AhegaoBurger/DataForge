import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { UnimakeBackend } from "./types";
import IDL from "./idl.json";

// Program ID - same across all networks as configured in Anchor.toml
export const PROGRAM_ID = new PublicKey(
  "CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG"
);

// Devnet RPC endpoint
export const DEVNET_RPC = "https://api.devnet.solana.com";

/**
 * Get a readonly program instance (for queries, no wallet required)
 */
export function getProgram(connection: Connection): Program<UnimakeBackend> {
  const provider = new AnchorProvider(
    connection,
    {} as any, // No wallet needed for readonly operations
    { commitment: "confirmed" }
  );

  return new Program(IDL as UnimakeBackend, provider);
}

/**
 * Get a program instance with wallet (for transactions)
 */
export function getProgramWithWallet(
  connection: Connection,
  wallet: any
): Program<UnimakeBackend> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });

  return new Program(IDL as UnimakeBackend, provider);
}
