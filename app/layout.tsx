import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { WalletProvider } from "@/components/wallet-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DataVault - Decentralized Robotics Training Data Marketplace",
  description:
    "Turn your smartphone into a data collection device. Earn cryptocurrency for capturing videos of everyday tasks. Built on Solana.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`}>
        <WalletProvider>{children}</WalletProvider>
        <Analytics />
      </body>
    </html>
  )
}
