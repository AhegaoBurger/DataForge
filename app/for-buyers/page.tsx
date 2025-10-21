import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navigation } from "@/components/navigation"

export default function ForBuyersPage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 lg:px-8">
          {/* Hero */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              For Robotics Companies
            </div>
            <h1 className="mt-6 text-balance text-4xl font-bold lg:text-6xl">Access Diverse Training Data at Scale</h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Get high-quality, diverse datasets from contributors worldwide. Transparent licensing, custom bounties,
              and no infrastructure overhead.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/dashboard">Post Your First Bounty</Link>
            </Button>
          </div>

          {/* Benefits */}
          <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Global Diversity</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Access data from contributors worldwide. Different environments, lighting conditions, and demographics
                  for robust model training.
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
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Transparent Licensing</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  All licensing recorded on-chain. Clear ownership, usage rights, and compliance. No legal ambiguity.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardContent className="pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Fast Collection</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Get thousands of videos in days, not months. Our contributor network scales with your needs.
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">AI-Validated Quality</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Automated quality checks ensure every video meets your requirements. No manual review needed.
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">Custom Bounties</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Specify exactly what you need. Set requirements, provide examples, and control quality standards.
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-semibold">No Infrastructure</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  No need to build data collection systems. We handle storage, validation, and payments.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works for Buyers */}
          <div className="mt-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">How It Works for Buyers</h2>
              <p className="mt-4 text-muted-foreground">Four simple steps to get the data you need</p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      1
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Create a Bounty</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Specify what data you need, set requirements, provide example videos, and set your reward
                        amount.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-lg font-bold text-secondary">
                      2
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Contributors Submit</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Our global network of contributors records and submits videos matching your requirements.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg font-bold text-accent">
                      3
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">AI Validation</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Our AI automatically validates submissions against your requirements. You can also manually
                        review.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      4
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Download Dataset</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        Access your complete dataset with metadata, licensing info, and organized file structure.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Pricing */}
          <div className="mt-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold lg:text-4xl">Transparent Pricing</h2>
              <p className="mt-4 text-muted-foreground">You set the reward per video. We take a 10% platform fee.</p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm font-medium text-muted-foreground">Simple Tasks</div>
                  <div className="mt-2 text-3xl font-bold">$0.50-1.00</div>
                  <div className="mt-1 text-sm text-muted-foreground">per video</div>
                  <ul className="mt-6 space-y-2 text-left text-sm">
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Basic object manipulation</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>10-30 second clips</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Standard quality</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm font-medium text-primary">Most Popular</div>
                  <div className="mt-2 text-3xl font-bold">$1.00-2.00</div>
                  <div className="mt-1 text-sm text-muted-foreground">per video</div>
                  <ul className="mt-6 space-y-2 text-left text-sm">
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Complex tasks</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>30-60 second clips</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>High quality required</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6 text-center">
                  <div className="text-sm font-medium text-muted-foreground">Specialized</div>
                  <div className="mt-2 text-3xl font-bold">$2.00+</div>
                  <div className="mt-1 text-sm text-muted-foreground">per video</div>
                  <ul className="mt-6 space-y-2 text-left text-sm">
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Rare scenarios</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Specific locations</span>
                    </li>
                    <li className="flex gap-2">
                      <svg
                        className="h-5 w-5 shrink-0 text-accent"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Premium quality</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-24">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
              <CardContent className="p-12 text-center lg:p-16">
                <h2 className="text-3xl font-bold lg:text-4xl">Ready to Get Started?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                  Post your first bounty and start collecting diverse training data today
                </p>
                <Button size="lg" className="mt-8" asChild>
                  <Link href="/dashboard">Create a Bounty</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
