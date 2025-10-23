"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ensureUserProfileClient,
  getUserProfile,
  debugAuthStatus,
} from "@/lib/auth/client";

interface UserData {
  videosSubmitted: number;
  videosApproved: number;
  videosPending: number;
  totalEarned: number;
  currentBalance: number;
  rank: string;
  joinDate: string;
}

interface RecentSubmission {
  id: string;
  bountyTitle: string;
  submittedDate: string;
  status: "approved" | "pending" | "rejected";
  reward: number;
  reason?: string;
}

interface ActiveBounty {
  id: string;
  title: string;
  reward: number;
  progress: number;
  yourSubmissions: number;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<
    RecentSubmission[]
  >([]);
  const [activeBounties, setActiveBounties] = useState<ActiveBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    setProfileError(null);

    try {
      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setUser(session.user);

      // First ensure user has a profile
      const profileResult = await ensureUserProfileClient();

      if (!profileResult.success) {
        setProfileError(profileResult.error || "Failed to create profile");
        setLoading(false);
        return;
      }

      setProfile(profileResult.profile);
      setIsAuthenticated(true);
      fetchDashboardData();
    } catch (error) {
      console.error("Auth check error:", error);
      setProfileError("Authentication failed");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please sign in to view your dashboard");
        }
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setUserData(data.userData);
      setRecentSubmissions(data.recentSubmissions || []);
      setActiveBounties(data.activeBounties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Add retry functionality for profile errors
  const handleRetryProfile = async () => {
    setProfileError(null);
    await checkAuthStatus();
  };

  if (profileError) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <Card className="mx-auto max-w-md border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold">
                Profile Setup Error
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {profileError}
              </p>
              <Button onClick={handleRetryProfile} className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
              <h2 className="mt-4 text-xl font-semibold">Not Signed In</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please sign in to access your dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-4xl font-bold">Dashboard</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Welcome back! Track your earnings and submissions.
              </p>
            </div>
            <Button asChild disabled>
              <Link href="/bounties">Browse Bounties</Link>
            </Button>
          </div>

          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-8 w-24 animate-pulse rounded bg-muted mb-2" />
                  <div className="h-12 w-16 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <h3 className="text-lg font-semibold text-destructive">
              Error Loading Dashboard
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back! Track your earnings and submissions.
            </p>
          </div>
          <Button asChild>
            <Link href="/bounties">Browse Bounties</Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                ${userData.totalEarned}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {userData.videosApproved} videos approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Videos Submitted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userData.videosSubmitted}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {userData.videosPending} pending review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approval Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {userData.videosSubmitted > 0
                  ? Math.round(
                      (userData.videosApproved / userData.videosSubmitted) *
                        100,
                    )
                  : 0}
                %
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {userData.videosApproved}/{userData.videosSubmitted} approved
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-gradient-to-br from-secondary/10 to-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contributor Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">
                {userData.rank}
              </div>
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
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No submissions yet. Start contributing to bounties!
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/bounties">Browse Bounties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {submission.bountyTitle}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Submitted{" "}
                            {new Date(
                              submission.submittedDate,
                            ).toLocaleDateString()}
                          </p>
                          {submission.status === "rejected" &&
                            submission.reason && (
                              <p className="mt-1 text-xs text-destructive">
                                Reason: {submission.reason}
                              </p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                          {submission.status === "approved" && (
                            <>
                              <Badge variant="default" className="bg-secondary">
                                Approved
                              </Badge>
                              <span className="text-sm font-semibold text-secondary">
                                ${submission.reward}
                              </span>
                            </>
                          )}
                          {submission.status === "pending" && (
                            <>
                              <Badge variant="outline">Pending</Badge>
                              <span className="text-sm font-medium text-muted-foreground">
                                ${submission.reward}
                              </span>
                            </>
                          )}
                          {submission.status === "rejected" && (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bounties" className="mt-6">
            {activeBounties.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No active bounties you've contributed to yet.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/bounties">Browse Bounties</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeBounties.map((bounty) => (
                  <Card key={bounty.id} className="border-border/50 bg-card/50">
                    <CardHeader>
                      <CardTitle className="text-lg">{bounty.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-medium">
                            {bounty.progress}%
                          </span>
                        </div>
                        <Progress value={bounty.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            ${bounty.reward}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            per video
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {bounty.yourSubmissions}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            your videos
                          </div>
                        </div>
                      </div>

                      <Button
                        asChild
                        className="w-full bg-transparent"
                        variant="outline"
                      >
                        <Link href={`/bounties/${bounty.id}`}>View Bounty</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
