"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"

// Mock user data
const userData = {
  videosSubmitted: 47,
  videosApproved: 42,
  videosPending: 5,
  totalEarned: 105.5,
  currentBalance: 105.5,
  rank: "Gold Contributor",
  joinDate: "2024-11-15",
}

const recentSubmissions = [
  {
    id: "1",
    bountyTitle: "Kitchen Cleaning Tasks",
    submittedDate: "2025-01-18",
    status: "approved",
    reward: 2.5,
  },
  {
    id: "2",
    bountyTitle: "Door Opening Scenarios",
    submittedDate: "2025-01-17",
    status: "approved",
    reward: 1.5,
  },
  {
    id: "3",
    bountyTitle: "Folding Laundry",
    submittedDate: "2025-01-17",
    status: "pending",
    reward: 2.0,
  },
  {
    id: "4",
    bountyTitle: "Kitchen Cleaning Tasks",
    submittedDate: "2025-01-16",
    status: "approved",
    reward: 2.5,
  },
  {
    id: "5",
    bountyTitle: "Object Manipulation - Tools",
    submittedDate: "2025-01-15",
    status: "rejected",
    reward: 0,
    reason: "Insufficient lighting",
  },
]

const activeBounties = [
  {
    id: "1",
    title: "Kitchen Cleaning Tasks",
    reward: 2.5,
    progress: 68,
    yourSubmissions: 3,
  },
  {
    id: "5",
    title: "Door Opening Scenarios",
    reward: 1.5,
    progress: 74,
    yourSubmissions: 2,
  },
  {
    id: "4",
    title: "Folding Laundry",
    reward: 2.0,
    progress: 75,
    yourSubmissions: 1,
  },
]

export default function DashboardPage() {
  const { connected, publicKey } = useWallet()

  if (!connected) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <Card className="mx-auto max-w-md border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold">Wallet Not Connected</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please connect your Solana wallet to access your dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">Welcome back! Track your earnings and submissions.</p>
          </div>
          <Button asChild>
            <Link href="/bounties">Browse Bounties</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">${userData.totalEarned}</div>
              <p className="mt-1 text-xs text-muted-foreground">{userData.videosApproved} videos approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Videos Submitted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{userData.videosSubmitted}</div>
              <p className="mt-1 text-xs text-muted-foreground">{userData.videosPending} pending review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Approval Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round((userData.videosApproved / userData.videosSubmitted) * 100)}%
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {userData.videosApproved}/{userData.videosSubmitted} approved
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contributor Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{userData.rank}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Member since {new Date(userData.joinDate).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="submissions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="submissions">My Submissions</TabsTrigger>
            <TabsTrigger value="bounties">Active Bounties</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{submission.bountyTitle}</h4>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(submission.submittedDate).toLocaleDateString()}
                        </p>
                        {submission.status === "rejected" && submission.reason && (
                          <p className="mt-1 text-xs text-destructive">Reason: {submission.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {submission.status === "approved" && (
                          <>
                            <Badge variant="default" className="bg-secondary">
                              Approved
                            </Badge>
                            <span className="text-sm font-semibold text-secondary">${submission.reward}</span>
                          </>
                        )}
                        {submission.status === "pending" && (
                          <>
                            <Badge variant="outline">Pending</Badge>
                            <span className="text-sm font-medium text-muted-foreground">${submission.reward}</span>
                          </>
                        )}
                        {submission.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bounties" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeBounties.map((bounty) => (
                <Card key={bounty.id} className="border-border/50 bg-card/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{bounty.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{bounty.progress}%</span>
                      </div>
                      <Progress value={bounty.progress} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">${bounty.reward}</div>
                        <div className="text-xs text-muted-foreground">per video</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">{bounty.yourSubmissions}</div>
                        <div className="text-xs text-muted-foreground">your videos</div>
                      </div>
                    </div>

                    <Button asChild className="w-full bg-transparent" variant="outline">
                      <Link href={`/bounties/${bounty.id}`}>View Bounty</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
