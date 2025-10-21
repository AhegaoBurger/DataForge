"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { Button } from "@/components/ui/button"

export function WalletButton() {
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
  )
}

export function ConnectWalletButton() {
  const { connected, publicKey } = useWallet()

  if (connected && publicKey) {
    return (
      <Button variant="outline" className="font-mono text-xs bg-transparent">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </Button>
    )
  }

  return <WalletButton />
}
