import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"
import { StatsTicker } from "@/components/stats-ticker"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight lg:text-7xl">
              Turn Your Phone Into a <span className="text-primary">Data Collection</span> Device
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground lg:text-xl">
              Earn cryptocurrency by capturing videos of everyday tasks. Robotics companies get diverse, real-world
              training data. Built on Solana for transparent, decentralized ownership.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="min-w-[200px]">
                <Link href="/dashboard">Start Earning</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-w-[200px] bg-transparent">
                <Link href="/for-buyers">Post a Bounty</Link>
              </Button>
            </div>
          </div>

          <div className="mt-20">
            <StatsTicker />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-3xl font-bold lg:text-5xl">How It Works</h2>
            <p className="mt-4 text-pretty text-muted-foreground lg:text-lg">
              Three simple steps to start earning with your smartphone
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">1. Record</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Browse available bounties and record videos of everyday tasks using your smartphone. Follow simple
                  guidelines for each bounty.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">2. Submit</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Upload your videos to the decentralized network. Our AI validates quality and compliance with bounty
                  requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">3. Earn</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Get paid instantly in cryptocurrency once your video is accepted. Earn $1-2 per video with
                  transparent, on-chain payments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
            {/* For Contributors */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                For Contributors
              </div>
              <h2 className="mt-6 text-balance text-3xl font-bold lg:text-4xl">Monetize Your Daily Activities</h2>
              <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
                Your everyday actions have value. Turn routine tasks into income by contributing to the future of
                robotics and AI.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex gap-3">
                  <svg
                    className="h-6 w-6 shrink-0 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Earn $1-2 per video</strong> with instant cryptocurrency
                    payments
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg
                    className="h-6 w-6 shrink-0 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Flexible work</strong> - contribute anytime, anywhere
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg
                    className="h-6 w-6 shrink-0 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Own your data</strong> with transparent blockchain licensing
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg
                    className="h-6 w-6 shrink-0 text-secondary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">No special equipment</strong> - just your smartphone
                  </span>
                </li>
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/for-contributors">Learn More</Link>
              </Button>
            </div>

            {/* For Buyers */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary">
                For Robotics Companies
              </div>
              <h2 className="mt-6 text-balance text-3xl font-bold lg:text-4xl">
                Access Diverse Training Data at Scale
              </h2>
              <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
                Get high-quality, diverse datasets without building collection infrastructure. Focus on building better
                robots.
              </p>
              <ul className="mt-8 space-y-4">
                <li className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Global diversity</strong> - data from contributors worldwide
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Transparent licensing</strong> - clear on-chain ownership
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Custom bounties</strong> - specify exactly what you need
                  </span>
                </li>
                <li className="flex gap-3">
                  <svg className="h-6 w-6 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">
                    <strong className="text-foreground">Quality guaranteed</strong> - AI-validated submissions
                  </span>
                </li>
              </ul>
              <Button className="mt-8" asChild>
                <Link href="/for-buyers">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <CardContent className="p-12 text-center lg:p-16">
              <h2 className="text-balance text-3xl font-bold lg:text-4xl">Ready to Get Started?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground lg:text-lg">
                Join thousands of contributors earning cryptocurrency or post your first bounty to access diverse
                training data.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href="/dashboard">Connect Wallet</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/how-it-works">Learn More</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <svg
                    className="h-5 w-5 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <span className="text-lg font-bold">DataVault</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Decentralized marketplace for robotics training data. Built on Solana.
              </p>
            </div>

            <div>
              <h3 className="font-semibold">Product</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/for-contributors"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    For Contributors
                  </Link>
                </li>
                <li>
                  <Link href="/for-buyers" className="text-muted-foreground transition-colors hover:text-foreground">
                    For Buyers
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Resources</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground transition-colors hover:text-foreground">
                    Licensing
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-border/40 pt-8 text-center text-sm text-muted-foreground">
            © 2025 DataVault. Built on Solana. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
