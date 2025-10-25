"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Bounty {
  id: string;
  creator_id: string;
  title: string;
  reward_amount: number;
  reward_token: string;
}

interface Submission {
  id: string;
  contributor_id: string;
  bounty_id: string;
  video_url: string;
  status: string;
  metadata: {
    file_name?: string;
    file_size?: number;
    notes?: string;
  };
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
  signedVideoUrl?: string; // Add this for the signed URL
}

export default function BountyReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bountyId = params.id as string;
  const supabase = createClient();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
  }, [bountyId]);

  const checkAccess = async () => {
    try {
      setLoading(true);

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Fetch bounty details
      const bountyResponse = await fetch(`/api/bounties/${bountyId}`);
      if (!bountyResponse.ok) {
        throw new Error("Bounty not found");
      }
      const bountyData = await bountyResponse.json();

      // Check if user is the creator
      if (bountyData.bounty.creator_id !== user.id) {
        setError("You don't have permission to review this bounty");
        return;
      }

      setBounty(bountyData.bounty);

      // Fetch submissions
      await fetchSubmissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/submissions?bountyId=${bountyId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }
      const data = await response.json();
      const subs = data.submissions || [];

      // Generate signed URLs for each submission
      const subsWithUrls = await Promise.all(
        subs.map(async (sub: Submission) => {
          try {
            // Extract just the file path from video_url
            // It might be a full URL or just a path
            let filePath = sub.video_url;

            // If it's a full URL, extract the path after /videos/
            if (filePath.includes('/storage/v1/object/')) {
              const match = filePath.match(/\/videos\/(.+)$/);
              if (match) {
                filePath = match[1];
              }
            }

            // Try to create a signed URL (valid for 1 hour)
            const { data: signedData, error } = await supabase.storage
              .from("videos")
              .createSignedUrl(filePath, 3600);

            if (error) {
              console.error("Error creating signed URL:", error);
              // Fallback to public URL if signed URL fails
              const { data: publicData } = supabase.storage
                .from("videos")
                .getPublicUrl(filePath);
              return { ...sub, signedVideoUrl: publicData.publicUrl };
            }

            return { ...sub, signedVideoUrl: signedData.signedUrl };
          } catch (err) {
            console.error("Error generating URL for video:", err);
            // Last resort: use original URL
            return { ...sub, signedVideoUrl: sub.video_url };
          }
        })
      );

      setSubmissions(subsWithUrls);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  const handleStatusUpdate = async (submissionId: string, newStatus: string) => {
    setProcessingId(submissionId);
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update submission");
      }

      // Refresh submissions
      await fetchSubmissions();

      alert(`Submission ${newStatus}!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update submission");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="h-8 w-64 animate-pulse rounded bg-muted mb-8" />
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded bg-muted" />
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
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
              <h3 className="text-lg font-semibold text-destructive">
                {error || "Access Denied"}
              </h3>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/bounties">Back to Bounties</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter((s) => s.status === "pending");
  const approvedSubmissions = submissions.filter((s) => s.status === "approved");
  const rejectedSubmissions = submissions.filter((s) => s.status === "rejected");

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/bounties/${bountyId}`}>
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
                Back to Bounty
              </Link>
            </Button>
            <h1 className="text-4xl font-bold">Review Submissions</h1>
            <p className="mt-2 text-lg text-muted-foreground">{bounty.title}</p>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingSubmissions.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Pending Review
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {approvedSubmissions.length}
                </div>
                <div className="text-sm text-muted-foreground">Approved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">
                  {rejectedSubmissions.length}
                </div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Submissions */}
          {pendingSubmissions.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                Pending Submissions
              </h2>
              <div className="space-y-4">
                {pendingSubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {submission.profiles?.display_name || "Anonymous"}
                        </CardTitle>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                          Pending
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Video */}
                        <div>
                          {submission.signedVideoUrl ? (
                            <video
                              src={submission.signedVideoUrl}
                              controls
                              className="w-full max-w-2xl rounded-lg border"
                            />
                          ) : (
                            <div className="w-full max-w-2xl rounded-lg border p-8 text-center bg-muted">
                              <p className="text-muted-foreground">Loading video...</p>
                            </div>
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="text-sm text-muted-foreground space-y-1">
                          {submission.metadata?.file_name && (
                            <p>File: {submission.metadata.file_name}</p>
                          )}
                          {submission.metadata?.file_size && (
                            <p>
                              Size:{" "}
                              {(submission.metadata.file_size / 1024 / 1024).toFixed(2)}{" "}
                              MB
                            </p>
                          )}
                          <p>
                            Submitted:{" "}
                            {new Date(submission.created_at).toLocaleString()}
                          </p>
                          {submission.metadata?.notes && (
                            <div className="mt-2 p-3 bg-muted rounded">
                              <p className="font-medium">Notes from contributor:</p>
                              <p className="mt-1">{submission.metadata.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() =>
                              handleStatusUpdate(submission.id, "approved")
                            }
                            disabled={processingId === submission.id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === submission.id
                              ? "Processing..."
                              : `Approve & Pay ${bounty.reward_amount} ${bounty.reward_token}`}
                          </Button>
                          <Button
                            onClick={() =>
                              handleStatusUpdate(submission.id, "rejected")
                            }
                            disabled={processingId === submission.id}
                            variant="destructive"
                          >
                            {processingId === submission.id
                              ? "Processing..."
                              : "Reject"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Approved Submissions */}
          {approvedSubmissions.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                Approved Submissions
              </h2>
              <div className="space-y-4">
                {approvedSubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {submission.profiles?.display_name || "Anonymous"}
                        </CardTitle>
                        <Badge className="bg-green-600">Approved</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {submission.signedVideoUrl ? (
                          <video
                            src={submission.signedVideoUrl}
                            controls
                            className="w-full max-w-2xl rounded-lg border"
                          />
                        ) : (
                          <div className="w-full max-w-2xl rounded-lg border p-8 text-center bg-muted">
                            <p className="text-muted-foreground">Loading video...</p>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Approved on{" "}
                          {new Date(submission.created_at).toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Submissions */}
          {rejectedSubmissions.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-4 text-2xl font-semibold">
                Rejected Submissions
              </h2>
              <div className="space-y-4">
                {rejectedSubmissions.map((submission) => (
                  <Card key={submission.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {submission.profiles?.display_name || "Anonymous"}
                        </CardTitle>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Rejected on{" "}
                        {new Date(submission.created_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No submissions */}
          {submissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  No submissions yet. Share your bounty link to get contributors!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
