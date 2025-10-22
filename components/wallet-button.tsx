"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Dynamically import wallet components with SSR disabled
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then((mod) => ({
      default: mod.WalletMultiButton,
    })),
  { ssr: false },
);

export function WalletButton() {
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after component is mounted
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a placeholder that matches server-side rendering
    return (
      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
        Connect Wallet
      </button>
    );
  }

  return (
    <WalletMultiButton
      style={{
        backgroundColor: "transparent",
        border: "1px solid hsl(var(--border))",
        borderRadius: "var(--radius-lg)",
        color: "hsl(var(--foreground))",
        fontSize: "14px",
        fontWeight: 500,
        height: "40px",
        padding: "0 16px",
      }}
    />
  );
}

// Export a named component for consistency with other exports
export { WalletButton as default };
