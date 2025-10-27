"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensureUserProfileClient } from "@/lib/auth/client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  submitVideoOnChain,
  type SubmitVideoParams,
} from "@/lib/solana/submission-instructions";
import {
  initializeProfileOnChain,
  checkProfileExists,
} from "@/lib/solana/profile-instructions";
import { getExplorerUrl } from "@/lib/solana/utils";
import { WalletButton } from "@/components/wallet-button";

interface UserProfile {
  id: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  wallet_address?: string;
  role?: string;
  total_earnings?: number;
  total_submissions?: number;
  reputation_score?: number;
}

interface Bounty {
  id: string;
  bounty_id: string | null;
  title: string;
  description: string;
  reward_amount: number;
  is_blockchain_backed: boolean;
}

export default function SubmitVideoPage() {
  const router = useRouter();
  const params = useParams();
  const bountyId = params.id as string;
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlockchainStep, setIsBlockchainStep] = useState(false);
  const [blockchainTxSignature, setBlockchainTxSignature] = useState<
    string | null
  >(null);
  const [hasOnChainProfile, setHasOnChainProfile] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const supabase = createClient();
  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    checkProfile();
    fetchBounty();
  }, []);

  useEffect(() => {
    // Check for on-chain profile when wallet is connected
    if (wallet.connected && wallet.publicKey && profile?.wallet_address) {
      // Verify the connected wallet matches the profile wallet
      if (wallet.publicKey.toString() !== profile.wallet_address) {
        alert(
          `Wallet mismatch! You connected ${wallet.publicKey.toString().substring(0, 8)}... but your profile has ${profile.wallet_address.substring(0, 8)}... linked. Please connect the correct wallet or update your profile.`
        );
        wallet.disconnect();
        return;
      }
      checkOnChainProfile();
    }
  }, [wallet.connected, wallet.publicKey, profile]);

  const fetchBounty = async () => {
    try {
      const { data, error } = await supabase
        .from("bounties")
        .select("id, bounty_id, title, description, reward_amount, is_blockchain_backed")
        .eq("id", bountyId)
        .single();

      if (error) {
        console.error("Error fetching bounty:", error);
        alert("Failed to load bounty details");
        return;
      }

      if (!data.is_blockchain_backed || !data.bounty_id) {
        alert("This bounty is not blockchain-backed. Please contact support.");
        router.push("/bounties");
        return;
      }

      setBounty(data);
    } catch (error) {
      console.error("Error fetching bounty:", error);
      alert("Failed to load bounty details");
    }
  };

  const checkProfile = async () => {
    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/auth/login");
      return;
    }

    // Ensure profile exists and get wallet info
    const profileResult = await ensureUserProfileClient();
    if (!profileResult.success) {
      setLoading(false);
      return;
    }

    setProfile(profileResult.profile || null);
    setLoading(false);
  };

  const checkOnChainProfile = async () => {
    if (!wallet.publicKey) return;

    setCheckingProfile(true);
    try {
      const exists = await checkProfileExists(
        connection,
        wallet.publicKey.toString()
      );
      setHasOnChainProfile(exists);
    } catch (error) {
      console.error("Error checking on-chain profile:", error);
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleInitializeProfile = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }

    setCheckingProfile(true);
    try {
      const result = await initializeProfileOnChain(connection, wallet);
      console.log("Profile initialized:", result);

      // Update database profile with on-chain address
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          on_chain_profile_address: result.profilePDA,
        }),
      });

      setHasOnChainProfile(true);
      alert(
        "On-chain profile created successfully! You can now submit videos."
      );
    } catch (error: any) {
      console.error("Profile initialization error:", error);
      alert(
        error?.message || "Failed to initialize profile. Please try again."
      );
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your wallet first");
      return;
    }
    if (!profile?.wallet_address) {
      alert("Please link your wallet in your profile first");
      return;
    }
    // Verify wallet match
    if (wallet.publicKey.toString() !== profile.wallet_address) {
      alert(
        "The connected wallet doesn't match your profile wallet. Please connect the correct wallet or update your profile."
      );
      return;
    }
    if (!hasOnChainProfile) {
      alert(
        "Please initialize your on-chain profile first by clicking the button above"
      );
      return;
    }
    if (!videoFile) {
      alert("Please select a video file");
      return;
    }
    if (!bounty?.bounty_id) {
      alert("Bounty blockchain ID not found. Please try again.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus("Preparing upload...");
    setBlockchainTxSignature(null);

    try {
      // STEP 1: Upload video to Supabase Storage
      setUploadStatus("Uploading video...");
      const fileExt = videoFile.name.split(".").pop();
      const fileName = `${bountyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      setUploadProgress(30);
      const videoPath = fileName;

      // STEP 2: Submit to blockchain (reserve escrow)
      setUploadStatus("Submitting to blockchain...");
      setIsBlockchainStep(true);

      const submissionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // For now, use placeholder values for IPFS/Arweave
      // In production, you would upload to IPFS/Arweave first
      const blockchainResult = await submitVideoOnChain(connection, wallet, {
        submissionId,
        bountyId: bounty.bounty_id, // Use blockchain UUID, not database ID
        ipfsHash: `ipfs-${submissionId}`, // Placeholder
        arweaveTx: `ar-${submissionId}`, // Placeholder
        metadataUri: `https://metadata/${submissionId}`, // Placeholder
      });

      console.log("Blockchain submission result:", blockchainResult);
      setBlockchainTxSignature(blockchainResult.signature);

      setUploadProgress(60);
      setIsBlockchainStep(false);
      setUploadStatus("Saving to database...");

      // STEP 3: Create submission record in database
      const metadata = {
        file_name: videoFile.name,
        file_size: videoFile.size,
        file_type: videoFile.type,
        notes: notes || null,
      };

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bounty_id: bountyId,
          video_url: videoPath,
          metadata,
          on_chain_submission_address: blockchainResult.submissionPDA,
          escrow_tx_signature: blockchainResult.signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Blockchain succeeded but DB failed - log for recovery
        console.error("Database write failed after blockchain success:", {
          signature: blockchainResult.signature,
          submissionPDA: blockchainResult.submissionPDA,
          error: errorData.error,
        });
        throw new Error(
          errorData.error ||
            "Failed to save submission to database. Your blockchain transaction succeeded, please contact support."
        );
      }

      const { submission } = await response.json();

      setUploadProgress(100);
      setUploadStatus("Complete!");

      alert(
        "Video submitted successfully! Escrow has been reserved on-chain. You'll receive payment once it's reviewed and approved."
      );
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      setUploadStatus("");
      setIsBlockchainStep(false);

      let errorMessage = "Failed to submit video. Please try again.";
      if (error?.message?.includes("insufficient funds")) {
        errorMessage =
          "The bounty pool has insufficient funds for this submission.";
      } else if (error?.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled.";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
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

          <div className="mb-8">
            <h1 className="text-balance text-4xl font-bold">
              Submit Your Video
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground">
              Upload your video for the Kitchen Cleaning Tasks bounty
            </p>
          </div>

          {/* Wallet Connection Card */}
          {!loading && profile?.wallet_address && !wallet.connected && (
            <Card className="mb-6 border-primary/50 bg-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Connect Your Wallet
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Connect your Solana wallet to sign transactions and submit
                      videos
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      Expected: {profile.wallet_address.substring(0, 12)}...
                      {profile.wallet_address.substring(profile.wallet_address.length - 4)}
                    </p>
                  </div>
                  <WalletButton />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wrong Wallet Connected Warning */}
          {!loading &&
            profile?.wallet_address &&
            wallet.connected &&
            wallet.publicKey &&
            wallet.publicKey.toString() !== profile.wallet_address && (
              <Card className="mb-6 border-destructive/50 bg-destructive/10">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-foreground mb-2">
                    Wrong Wallet Connected
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    The connected wallet doesn't match your profile. Please
                    disconnect and connect the correct wallet.
                  </p>
                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-muted-foreground">
                      Connected:{" "}
                      <span className="text-destructive">
                        {wallet.publicKey.toString().substring(0, 12)}...
                        {wallet.publicKey.toString().substring(wallet.publicKey.toString().length - 4)}
                      </span>
                    </p>
                    <p className="text-muted-foreground">
                      Expected:{" "}
                      <span className="text-green-500">
                        {profile.wallet_address.substring(0, 12)}...
                        {profile.wallet_address.substring(profile.wallet_address.length - 4)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => wallet.disconnect()}
                      variant="destructive"
                      size="sm"
                    >
                      Disconnect Wallet
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/profile">Update Profile</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

          {!loading && !profile?.wallet_address && (
            <Card className="mb-6 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground">
                  Please link your Solana wallet in your profile to submit
                  videos and receive payments.{" "}
                  <Link href="/profile" className="text-primary underline">
                    Go to Profile
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {!loading &&
            profile?.wallet_address &&
            wallet.connected &&
            !hasOnChainProfile &&
            !checkingProfile && (
              <Card className="mb-6 border-yellow-500/50 bg-yellow-500/10">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-foreground mb-3">
                    On-Chain Profile Required
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    To submit videos and receive payments, you need to
                    initialize your on-chain contributor profile. This is a
                    one-time setup that costs a small transaction fee (~0.001
                    SOL).
                  </p>
                  <Button
                    onClick={handleInitializeProfile}
                    disabled={checkingProfile}
                    size="sm"
                  >
                    {checkingProfile
                      ? "Initializing..."
                      : "Initialize Profile"}
                  </Button>
                </CardContent>
              </Card>
            )}

          {isBlockchainStep && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-blue-500"
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
                <span className="text-sm text-foreground">
                  Reserving escrow on blockchain... Please confirm the
                  transaction in your wallet.
                </span>
              </div>
            </div>
          )}

          {blockchainTxSignature && !isBlockchainStep && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm font-medium text-green-500 mb-1">
                Blockchain Transaction Successful!
              </p>
              <a
                href={getExplorerUrl(blockchainTxSignature, "devnet")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400 hover:text-green-300 underline"
              >
                View on Solana Explorer →
              </a>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Video Upload</CardTitle>
                <CardDescription>
                  Ensure your video meets all the requirements listed in the
                  bounty details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Video Upload */}
                <div className="space-y-2">
                  <Label htmlFor="video">Video File</Label>
                  <div className="flex flex-col gap-3">
                    <input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setVideoFile(e.target.files?.[0] || null)
                      }
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {videoFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {videoFile.name} (
                        {(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted formats: MP4, MOV, AVI. Max size: 500MB
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any relevant information about your video submission..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Checklist */}
                <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
                  <p className="text-sm font-medium">
                    Before submitting, verify:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" required />
                      <span>Video meets all technical requirements</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" required />
                      <span>Task is clearly visible and complete</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" required />
                      <span>I have rights to submit this video</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="rounded" required />
                      <span>
                        No personal or sensitive information is visible
                      </span>
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {uploadStatus}
                      </span>
                      <span className="font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={
                    !profile?.wallet_address ||
                    !wallet.connected ||
                    !hasOnChainProfile ||
                    uploading ||
                    loading ||
                    checkingProfile
                  }
                >
                  {uploading ? (
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
                      {isBlockchainStep ? "Confirming on blockchain..." : uploadStatus}
                    </>
                  ) : loading || checkingProfile ? (
                    "Loading..."
                  ) : !wallet.connected ? (
                    "Connect Wallet to Submit"
                  ) : !hasOnChainProfile ? (
                    "Initialize Profile First"
                  ) : (
                    "Submit Video"
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Your video will be reviewed within 24-48 hours. Payment will
                  be sent to your wallet automatically upon approval.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
