import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

// Mock bounty data - in real app, fetch by ID
const bounty = {
  id: "1",
  title: "Kitchen Cleaning Tasks",
  description:
    "Record videos of various kitchen cleaning activities including wiping counters, washing dishes, and organizing cabinets. We need diverse examples from different kitchens and cleaning styles to train our household robotics AI.",
  reward: 2.5,
  videosNeeded: 500,
  videosSubmitted: 342,
  category: "Household",
  difficulty: "Easy",
  duration: "2-3 min",
  requirements: [
    "Clear lighting - ensure the task area is well-lit",
    "Stable camera - use a tripod or stable surface when possible",
    "Show full task - capture the complete cleaning action from start to finish",
    "Multiple angles - if possible, record from 2-3 different viewpoints",
    "Audio optional - background noise is acceptable",
  ],
  guidelines: [
    "Start recording before beginning the task",
    "Perform the task naturally as you normally would",
    "Ensure hands and objects are clearly visible",
    "Avoid covering the camera lens",
    "End recording after task completion",
  ],
  examples: [
    "Wiping kitchen counters with a cloth",
    "Washing dishes in the sink",
    "Loading/unloading dishwasher",
    "Organizing items in cabinets",
    "Cleaning stovetop or oven",
  ],
  company: "HomeBot Robotics",
  postedDate: "2025-01-15",
  expiryDate: "2025-03-15",
}

export default function BountyDetailPage() {
  const progress = (bounty.videosSubmitted / bounty.videosNeeded) * 100

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/bounties">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Bounties
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{bounty.category}</Badge>
              <Badge
                variant="outline"
                className={
                  bounty.difficulty === "Easy"
                    ? "border-secondary/50 text-secondary"
                    : bounty.difficulty === "Medium"
                      ? "border-primary/50 text-primary"
                      : "border-destructive/50 text-destructive"
                }
              >
                {bounty.difficulty}
              </Badge>
              <span className="text-sm text-muted-foreground">Posted by {bounty.company}</span>
            </div>
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">{bounty.title}</h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground leading-relaxed">{bounty.description}</p>
          </div>

          {/* Reward Card */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-bold text-primary">${bounty.reward}</div>
                  <div className="mt-1 text-sm text-muted-foreground">per accepted video</div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {bounty.videosSubmitted} / {bounty.videosNeeded} videos
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                <Button size="lg" asChild>
                  <Link href={`/bounties/${bounty.id}/submit`}>Submit Video</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {bounty.requirements.map((req, index) => (
                  <li key={index} className="flex gap-3">
                    <svg
                      className="h-5 w-5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recording Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {bounty.guidelines.map((guideline, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-xs font-semibold text-secondary">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-relaxed">{guideline}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {/* Examples */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Example Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {bounty.examples.map((example, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground">•</span>
                    <span>{example}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bounty Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration per video</span>
                <span className="font-medium">{bounty.duration}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Posted date</span>
                <span className="font-medium">{new Date(bounty.postedDate).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-medium">{new Date(bounty.expiryDate).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">{bounty.company}</span>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button size="lg" asChild className="min-w-[200px]">
              <Link href={`/bounties/${bounty.id}/submit`}>Submit Your Video</Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Connect your wallet to submit and receive instant payment
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
