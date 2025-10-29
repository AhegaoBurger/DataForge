import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Header */}
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold lg:text-6xl">
              How DataForge Works
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              A decentralized marketplace connecting data contributors with
              robotics companies. Transparent, secure, and built on Solana.
            </p>
          </div>

          {/* Process Flow */}
          <div className="mt-20 space-y-24">
            {/* Step 1 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                  1
                </div>
                <h2 className="mt-6 text-3xl font-bold">Browse Bounties</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Robotics companies post bounties for specific types of video
                  data they need. Each bounty includes detailed requirements,
                  example videos, and reward amounts. Filter by category,
                  location, difficulty, and reward to find bounties that match
                  your interests.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Clear requirements and acceptance criteria
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Example videos to guide your submissions
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Transparent reward amounts in cryptocurrency
                    </span>
                  </li>
                </ul>
              </div>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-8">
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step 2 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <Card className="order-2 border-border/50 bg-card/50 lg:order-1">
                <CardContent className="p-8">
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
              <div className="order-1 flex flex-col justify-center lg:order-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-2xl font-bold text-secondary">
                  2
                </div>
                <h2 className="mt-6 text-3xl font-bold">Record & Submit</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Use your smartphone to record videos following the bounty
                  guidelines. Our mobile app provides real-time feedback on
                  video quality, lighting, and framing. Submit directly from
                  your phone with automatic metadata capture.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Real-time quality validation
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Automatic metadata and location capture
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Secure upload to decentralized storage
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-2xl font-bold text-accent">
                  3
                </div>
                <h2 className="mt-6 text-3xl font-bold">AI Validation</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Our AI system automatically validates your submission against
                  bounty requirements. It checks video quality, content
                  accuracy, and compliance with guidelines. Most validations
                  complete within minutes.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">Automated quality checks</span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Content verification and compliance
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Fast processing (typically under 5 minutes)
                    </span>
                  </li>
                </ul>
              </div>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-8">
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step 4 */}
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
              <Card className="order-2 border-border/50 bg-card/50 lg:order-1">
                <CardContent className="p-8">
                  <div className="aspect-video rounded-lg bg-muted" />
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-4 w-1/2 rounded bg-muted" />
                  </div>
                </CardContent>
              </Card>
              <div className="order-1 flex flex-col justify-center lg:order-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl font-bold text-primary">
                  4
                </div>
                <h2 className="mt-6 text-3xl font-bold">Get Paid Instantly</h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Once validated, payment is automatically sent to your Solana
                  wallet. All transactions are recorded on-chain for complete
                  transparency. You maintain ownership rights and can earn
                  additional royalties if your data is resold.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Instant cryptocurrency payments
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      On-chain transaction records
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <svg
                      className="h-6 w-6 shrink-0 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Ongoing royalties for data resale
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24 text-center">
            <h2 className="text-3xl font-bold">Ready to Start?</h2>
            <p className="mt-4 text-muted-foreground">
              Connect your wallet and start earning today
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
