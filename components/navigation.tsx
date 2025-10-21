"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ConnectWalletButton } from "@/components/wallet-button"

export function Navigation() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg className="h-5 w-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <span className="text-lg font-bold">DataVault</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/bounties" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Bounties
            </Link>
            <Link href="/marketplace" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Marketplace
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              How It Works
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ConnectWalletButton />
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
