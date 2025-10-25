"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Bounty {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  reward_amount: number;
  reward_token: string;
  total_slots: number;
  filled_slots: number;
  requirements: string[];
  guidelines: string | null;
  example_video_url: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export default function BountyDetailPage() {
  const params = useParams();
  const bountyId = params.id as string;
  const supabase = createClient();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (bountyId) {
      fetchBounty();
    }
  }, [bountyId]);

  const fetchBounty = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bounties/${bountyId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Bounty not found");
        }
        throw new Error("Failed to fetch bounty");
      }

      const data = await response.json();
      setBounty(data.bounty);

      // Check if current user is the creator
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && data.bounty.creator_id === user.id) {
        setIsCreator(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <div className="h-8 w-32 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-4">
              <div className="h-12 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-64 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <Button variant="ghost" asChild className="mb-6">
              <Link href="/bounties">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Bounties
              </Link>
            </Button>

            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
              <h3 className="text-lg font-semibold text-destructive">
                {error || "Bounty not found"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {error
                  ? "Please try again later"
                  : "This bounty may have been removed or is no longer active"}
              </p>
              <div className="mt-4 flex gap-3 justify-center">
                <Button onClick={fetchBounty} variant="outline">
                  Try Again
                </Button>
                <Button asChild>
                  <Link href="/bounties">Browse All Bounties</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progress = (bounty.filled_slots / bounty.total_slots) * 100;

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/bounties">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
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
                  bounty.difficulty === "easy"
                    ? "border-secondary/50 text-secondary"
                    : bounty.difficulty === "medium"
                      ? "border-primary/50 text-primary"
                      : "border-destructive/50 text-destructive"
                }
              >
                {bounty.difficulty.charAt(0).toUpperCase() +
                  bounty.difficulty.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Posted by {bounty.profiles?.display_name || "Anonymous"}
              </span>
            </div>
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">
              {bounty.title}
            </h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground leading-relaxed">
              {bounty.description}
            </p>
          </div>

          {/* Reward Card */}
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="text-center sm:text-left">
                  <div className="text-5xl font-bold text-primary">
                    {bounty.reward_amount} {bounty.reward_token}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    total reward
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {bounty.filled_slots} / {bounty.total_slots} slots
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
                <div className="flex gap-3">
                  {isCreator ? (
                    <Button size="lg" asChild variant="default">
                      <Link href={`/bounties/${bounty.id}/review`}>
                        Review Submissions
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" asChild>
                      <Link href={`/bounties/${bounty.id}/submit`}>
                        Submit Video
                      </Link>
                    </Button>
                  )}
                </div>
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
                {bounty.requirements?.map((req, index) => (
                  <li key={index} className="flex gap-3">
                    <svg
                      className="h-5 w-5 shrink-0 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Guidelines */}
          {bounty.guidelines && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Recording Guidelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {bounty.guidelines}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Example Video */}
          {bounty.example_video_url && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Example Video</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={bounty.example_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View example video
                </a>
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Bounty Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">
                  {new Date(bounty.created_at).toLocaleDateString()}
                </span>
              </div>
              <Separator />
              {bounty.deadline && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className="font-medium">
                      {new Date(bounty.deadline).toLocaleDateString()}
                    </span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Company</span>
                <span className="font-medium">
                  {bounty.profiles?.display_name || "Anonymous"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          {!isCreator && (
            <div className="mt-8 text-center">
              <Button size="lg" asChild className="min-w-[200px]">
                <Link href={`/bounties/${bounty.id}/submit`}>
                  Submit Your Video
                </Link>
              </Button>
              <p className="mt-3 text-sm text-muted-foreground">
                Connect your wallet to submit and receive instant payment
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
