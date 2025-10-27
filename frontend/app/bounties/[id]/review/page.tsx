"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  approveSubmissionOnChain,
  rejectSubmissionOnChain,
} from "@/lib/solana/submission-instructions";
import { getExplorerUrl } from "@/lib/solana/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Bounty {
  id: string;
  creator_id: string;
  title: string;
  reward_amount: number;
  reward_token: string;
  is_blockchain_backed: boolean;
  on_chain_pool_address?: string;
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
    wallet_address?: string | null;
  };
  signedVideoUrl?: string;
  on_chain_submission_address?: string;
  escrow_tx_signature?: string;
  payout_tx_signature?: string;
}

export default function BountyReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bountyId = params.id as string;
  const supabase = createClient();
  const { connection } = useConnection();
  const wallet = useWallet();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [qualityScores, setQualityScores] = useState<{ [key: string]: number }>(
    {},
  );
  const [blockchainTx, setBlockchainTx] = useState<string | null>(null);

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
            if (filePath.includes("/storage/v1/object/")) {
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
        }),
      );

      setSubmissions(subsWithUrls);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  const handleApprove = async (submission: Submission) => {
    if (!bounty) return;

    // For blockchain-backed bounties, require wallet connection
    if (bounty.is_blockchain_backed) {
      if (!wallet.connected || !wallet.publicKey) {
        alert(
          "Please connect your wallet to approve blockchain-backed submissions",
        );
        return;
      }

      if (!submission.profiles?.wallet_address) {
        alert("Contributor wallet address not found");
        return;
      }

      if (!submission.on_chain_submission_address) {
        alert("This submission does not have an on-chain address");
        return;
      }
    }

    setProcessingId(submission.id);
    setBlockchainTx(null);

    try {
      let payoutTxSignature: string | undefined;

      // STEP 1: Approve on blockchain (if blockchain-backed)
      if (bounty.is_blockchain_backed) {
        const qualityScore = qualityScores[submission.id] || 80; // Default to 80

        const txSignature = await approveSubmissionOnChain(connection, wallet, {
          submissionId: submission.on_chain_submission_address!.split("-")[0], // Extract submission ID
          bountyId: bountyId, // Always use the UUID for PDA derivation
          contributorWallet: submission.profiles!.wallet_address!,
          qualityScore,
        });

        console.log("Approval transaction:", txSignature);
        setBlockchainTx(txSignature);
        payoutTxSignature = txSignature;
      }

      // STEP 2: Update database
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "approved",
          payout_tx_signature: payoutTxSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Blockchain succeeded but DB failed - log for recovery
        if (payoutTxSignature) {
          console.error("Database update failed after blockchain approval:", {
            signature: payoutTxSignature,
            submissionId: submission.id,
            error: errorData.error,
          });
          throw new Error(
            "Payment released on blockchain but database update failed. Please contact support.",
          );
        }
        throw new Error(errorData.error || "Failed to approve submission");
      }

      // Refresh submissions
      await fetchSubmissions();

      alert(
        bounty.is_blockchain_backed
          ? `Submission approved! Payment of ${bounty.reward_amount} SOL has been sent to the contributor.`
          : "Submission approved!",
      );
    } catch (err: any) {
      console.error("Approval error:", err);
      let errorMessage = "Failed to approve submission";
      if (err?.message?.includes("insufficient funds")) {
        errorMessage = "Bounty pool has insufficient funds for this payment";
      } else if (err?.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submission: Submission) => {
    if (!bounty) return;

    // For blockchain-backed bounties, require wallet connection
    if (bounty.is_blockchain_backed) {
      if (!wallet.connected || !wallet.publicKey) {
        alert(
          "Please connect your wallet to reject blockchain-backed submissions",
        );
        return;
      }

      if (!submission.profiles?.wallet_address) {
        alert("Contributor wallet address not found");
        return;
      }

      if (!submission.on_chain_submission_address) {
        alert("This submission does not have an on-chain address");
        return;
      }
    }

    setProcessingId(submission.id);
    setBlockchainTx(null);

    try {
      // STEP 1: Reject on blockchain (if blockchain-backed)
      if (bounty.is_blockchain_backed) {
        const txSignature = await rejectSubmissionOnChain(connection, wallet, {
          submissionId: submission.on_chain_submission_address!.split("-")[0], // Extract submission ID
          bountyId: bountyId, // Always use the UUID for PDA derivation
          contributorWallet: submission.profiles!.wallet_address!,
        });

        console.log("Rejection transaction:", txSignature);
        setBlockchainTx(txSignature);
      }

      // STEP 2: Update database
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject submission");
      }

      // Refresh submissions
      await fetchSubmissions();

      alert(
        bounty.is_blockchain_backed
          ? "Submission rejected. Funds returned to bounty pool."
          : "Submission rejected.",
      );
    } catch (err: any) {
      console.error("Rejection error:", err);
      let errorMessage = "Failed to reject submission";
      if (err?.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
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
  const approvedSubmissions = submissions.filter(
    (s) => s.status === "approved",
  );
  const rejectedSubmissions = submissions.filter(
    (s) => s.status === "rejected",
  );

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

          {/* Blockchain Transaction Status */}
          {blockchainTx && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-500 mb-1">
                Blockchain Transaction Successful!
              </p>
              <a
                href={getExplorerUrl(blockchainTx, "devnet")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 underline"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}

          {/* Wallet Connection Warning */}
          {bounty && bounty.is_blockchain_backed && !wallet.connected && (
            <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-foreground">
                  Please connect your wallet to approve or reject submissions
                  for this blockchain-backed bounty.
                </p>
              </CardContent>
            </Card>
          )}

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
                        <div>
                          <CardTitle className="text-lg">
                            {submission.profiles?.display_name || "Anonymous"}
                          </CardTitle>
                          {submission.on_chain_submission_address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              On-chain submission
                            </p>
                          )}
                          {submission.escrow_tx_signature && (
                            <a
                              href={getExplorerUrl(
                                submission.escrow_tx_signature,
                                "devnet",
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 underline"
                            >
                              View escrow tx →
                            </a>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-yellow-600 text-yellow-600"
                        >
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
                              <p className="text-muted-foreground">
                                Loading video...
                              </p>
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
                              {(
                                submission.metadata.file_size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </p>
                          )}
                          <p>
                            Submitted:{" "}
                            {new Date(submission.created_at).toLocaleString()}
                          </p>
                          {submission.metadata?.notes && (
                            <div className="mt-2 p-3 bg-muted rounded">
                              <p className="font-medium">
                                Notes from contributor:
                              </p>
                              <p className="mt-1">
                                {submission.metadata.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Quality Score (for blockchain-backed bounties) */}
                        {bounty && bounty.is_blockchain_backed && (
                          <div className="space-y-2">
                            <Label htmlFor={`quality-${submission.id}`}>
                              Quality Score (0-100)
                            </Label>
                            <Input
                              id={`quality-${submission.id}`}
                              type="number"
                              min="0"
                              max="100"
                              value={qualityScores[submission.id] || 80}
                              onChange={(e) =>
                                setQualityScores({
                                  ...qualityScores,
                                  [submission.id]:
                                    parseInt(e.target.value) || 0,
                                })
                              }
                              className="max-w-xs"
                              placeholder="80"
                            />
                            <p className="text-xs text-muted-foreground">
                              This score is recorded on-chain for reputation
                              tracking
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprove(submission)}
                            disabled={
                              processingId === submission.id ||
                              (bounty?.is_blockchain_backed &&
                                !wallet.connected)
                            }
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {processingId === submission.id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Processing...
                              </>
                            ) : (
                              `Approve & Pay ${bounty.reward_amount} ${bounty.reward_token}`
                            )}
                          </Button>
                          <Button
                            onClick={() => handleReject(submission)}
                            disabled={
                              processingId === submission.id ||
                              (bounty?.is_blockchain_backed &&
                                !wallet.connected)
                            }
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
                        <div>
                          <CardTitle className="text-lg">
                            {submission.profiles?.display_name || "Anonymous"}
                          </CardTitle>
                          {submission.payout_tx_signature && (
                            <a
                              href={getExplorerUrl(
                                submission.payout_tx_signature,
                                "devnet",
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-400 hover:text-green-300 underline"
                            >
                              View payout tx →
                            </a>
                          )}
                        </div>
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
                            <p className="text-muted-foreground">
                              Loading video...
                            </p>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Approved on{" "}
                          {new Date(submission.created_at).toLocaleString()}
                        </p>
                        {submission.payout_tx_signature &&
                          bounty?.is_blockchain_backed && (
                            <p className="text-sm text-green-600">
                              Payment of {bounty.reward_amount} SOL sent
                              on-chain
                            </p>
                          )}
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
                  No submissions yet. Share your bounty link to get
                  contributors!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
