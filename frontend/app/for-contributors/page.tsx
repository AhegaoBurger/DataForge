import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"

export default function ForContributorsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-sm font-medium text-secondary">
              For Contributors
            </div>
            <h1 className="mt-6 text-balance text-4xl font-bold lg:text-6xl">
              Turn Your Smartphone Into a Money-Making Machine
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Earn $1-2 per video by capturing everyday tasks. No special equipment needed. Work on your own schedule.
              Get paid instantly in cryptocurrency.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard">Start Earning Now</Link>
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Earn $1-2 Per Video</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Get paid instantly in cryptocurrency for each accepted video. Top contributors earn over $500/month.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Work Anytime</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Complete bounties on your own schedule. No commitments, no minimum hours. Perfect for side income.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Just Your Phone</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  No special equipment required. Any modern smartphone works. Our app guides you through the process.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <svg className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Own Your Data</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Transparent blockchain licensing means you maintain ownership. Earn royalties if your data is resold.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Instant Payments</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Get paid immediately after validation. No waiting for monthly payouts. Funds go directly to your
                  wallet.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Global Community</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Join contributors from around the world. Share tips, compete on leaderboards, and help build the
                  future of AI.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How Much Can You Earn */}
          <div className="mt-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">How Much Can You Earn?</h2>
              <p className="mt-4 text-muted-foreground">
                Earnings depend on bounty complexity and your contribution rate
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-muted-foreground">$50-150</div>
                  <div className="mt-2 text-sm font-medium">Per Month</div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Casual contributors submitting 5-10 videos per week
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-primary">$200-500</div>
                  <div className="mt-2 text-sm font-medium">Per Month</div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Active contributors submitting 15-30 videos per week
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl font-bold text-secondary">$500+</div>
                  <div className="mt-2 text-sm font-medium">Per Month</div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Power contributors with high acceptance rates and volume
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-24">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-center text-3xl font-bold lg:text-4xl">Frequently Asked Questions</h2>

              <div className="mt-12 space-y-6">
                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">What kind of videos do I need to record?</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Everyday tasks like opening doors, picking up objects, pouring liquids, folding clothes, and more.
                      Each bounty has specific requirements and example videos.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">Do I need a special phone or camera?</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      No! Any modern smartphone (iPhone 8+ or Android from 2018+) works great. Our app provides
                      real-time feedback on video quality.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">How long does it take to get paid?</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      Payment is instant once your video is validated (typically 5-10 minutes). Funds go directly to
                      your Solana wallet.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border/50 bg-card/50">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold">What if my video is rejected?</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      You'll receive detailed feedback on why it was rejected and can resubmit. Common issues include
                      poor lighting, not following guidelines, or low video quality.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
              <CardContent className="p-12 text-center lg:p-16">
                <h2 className="text-3xl font-bold lg:text-4xl">Ready to Start Earning?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                  Connect your Solana wallet and complete your first bounty in minutes
                </p>
                <Button size="lg" className="mt-8" asChild>
                  <Link href="/dashboard">Get Started Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
