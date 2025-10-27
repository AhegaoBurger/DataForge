"use client";

import { Navigation } from "@/components/navigation";
import { BountyCard } from "@/components/bounty-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { debugAuthStatus } from "@/lib/auth/client";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createBountyOnChain } from "@/lib/solana/bounty-instructions";
import { getExplorerUrl } from "@/lib/solana/utils";
import { v4 as uuidv4 } from "uuid";

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

export default function BountiesPage() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [blockchainTxSignature, setBlockchainTxSignature] = useState<string | null>(null);
  const [isBlockchainStep, setIsBlockchainStep] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "",
    reward_amount: "",
    total_slots: "",
    requirements: "",
    guidelines: "",
    example_video_url: "",
    deadline: "",
  });

  useEffect(() => {
    fetchBounties();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await debugAuthStatus();
      setIsAuthenticated(authStatus.authenticated);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchBounties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bounties");

      if (!response.ok) {
        throw new Error("Failed to fetch bounties");
      }

      const data = await response.json();
      setBounties(data.bounties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBounty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    setBlockchainTxSignature(null);

    // Check authentication
    if (!isAuthenticated) {
      setCreateError("You must be signed in to create a bounty");
      setIsCreating(false);
      return;
    }

    // Check wallet connection
    if (!wallet.connected || !wallet.publicKey) {
      setCreateError("Please connect your wallet to create a blockchain-backed bounty");
      setIsCreating(false);
      return;
    }

    // Validate form data
    try {
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.description.trim()) {
        throw new Error("Description is required");
      }
      if (!formData.category) {
        throw new Error("Category is required");
      }
      if (!formData.difficulty) {
        throw new Error("Difficulty is required");
      }
      if (!formData.reward_amount || parseFloat(formData.reward_amount) <= 0) {
        throw new Error("Reward amount must be greater than 0");
      }
      if (!formData.total_slots || parseInt(formData.total_slots) <= 0) {
        throw new Error("Total slots must be greater than 0");
      }
      if (!formData.requirements.trim()) {
        throw new Error("Requirements are required");
      }

      // Validate requirements JSON
      let parsedRequirements;
      try {
        parsedRequirements = JSON.parse(formData.requirements);
        if (!Array.isArray(parsedRequirements)) {
          throw new Error("Requirements must be a JSON array");
        }
      } catch (parseError) {
        throw new Error("Requirements must be valid JSON array");
      }

      // Validate URL if provided
      if (
        formData.example_video_url &&
        !isValidUrl(formData.example_video_url)
      ) {
        throw new Error("Example video URL must be a valid URL");
      }

      // Validate deadline if provided
      if (formData.deadline && new Date(formData.deadline) <= new Date()) {
        throw new Error("Deadline must be in the future");
      }

      const rewardPerVideo = parseFloat(formData.reward_amount);
      const totalSlots = parseInt(formData.total_slots);
      const totalPool = rewardPerVideo * totalSlots;

      // Check wallet balance
      const balance = await connection.getBalance(wallet.publicKey);
      const balanceInSol = balance / 1_000_000_000;
      if (balanceInSol < totalPool + 0.01) {
        throw new Error(
          `Insufficient balance. You need at least ${totalPool.toFixed(2)} SOL + gas fees. Your balance: ${balanceInSol.toFixed(2)} SOL`
        );
      }

      // STEP 1: Create bounty on blockchain
      setIsBlockchainStep(true);
      // Generate a proper UUID for bounty ID (required for PDA derivation)
      const bountyId = uuidv4();
      const expiresAt = formData.deadline
        ? new Date(formData.deadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

      console.log("Creating bounty with ID:", bountyId);

      const blockchainResult = await createBountyOnChain(connection, wallet, {
        bountyId,
        rewardPerVideo,
        totalPool,
        videosTarget: totalSlots,
        taskDescription: formData.description.trim(),
        minDurationSecs: 30,
        minResolution: "720p",
        minFps: 30,
        expiresAt,
      });

      console.log("Blockchain result:", blockchainResult);

      setBlockchainTxSignature(blockchainResult.signature);
      setIsBlockchainStep(false);

      // STEP 2: Save to database with blockchain info
      const response = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          difficulty: formData.difficulty,
          reward_amount: rewardPerVideo,
          total_slots: totalSlots,
          requirements: parsedRequirements,
          guidelines: formData.guidelines.trim() || null,
          example_video_url: formData.example_video_url.trim() || null,
          deadline: formData.deadline
            ? new Date(formData.deadline).toISOString()
            : null,
          // Blockchain fields
          on_chain_pool_address: blockchainResult.bountyPDA,
          blockchain_tx_signature: blockchainResult.signature,
          is_blockchain_backed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Blockchain succeeded but DB failed - log for recovery
        console.error("Database write failed but blockchain succeeded:", {
          signature: blockchainResult.signature,
          bountyPDA: blockchainResult.bountyPDA,
          bountyId: blockchainResult.bountyId,
        });
        throw new Error(
          errorData.error ||
            "Failed to save bounty to database (blockchain transaction succeeded)"
        );
      }

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        category: "",
        difficulty: "",
        reward_amount: "",
        total_slots: "",
        requirements: "",
        guidelines: "",
        example_video_url: "",
        deadline: "",
      });
      setShowCreateForm(false);
      setCreateSuccess(
        `Bounty created successfully! ${totalPool.toFixed(2)} SOL locked in escrow.`
      );

      // Refresh bounties list
      await fetchBounties();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setCreateSuccess(null);
        setBlockchainTxSignature(null);
      }, 5000);
    } catch (err: any) {
      console.error("Bounty creation error:", err);
      console.error("Error details:", {
        message: err.message,
        logs: err.logs,
        signature: err.signature,
      });

      // Better error messages for common blockchain errors
      let errorMessage = "An error occurred";
      if (err.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled";
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient SOL balance for this transaction";
      } else if (err.message?.includes("already been processed")) {
        errorMessage =
          "This bounty ID already exists. Please try again (a new ID will be generated).";
      } else if (err.message?.includes("Simulation failed")) {
        errorMessage = `Transaction simulation failed: ${err.message}. Check console for details.`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
      setIsBlockchainStep(false);
    }
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.title.trim() &&
      formData.description.trim() &&
      formData.category &&
      formData.difficulty &&
      formData.reward_amount &&
      parseFloat(formData.reward_amount) > 0 &&
      formData.total_slots &&
      parseInt(formData.total_slots) > 0 &&
      formData.requirements.trim() &&
      isValidRequirementsJson(formData.requirements) &&
      (!formData.example_video_url || isValidUrl(formData.example_video_url)) &&
      (!formData.deadline || new Date(formData.deadline) > new Date())
    );
  };

  const isValidRequirementsJson = (jsonString: string) => {
    try {
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  };

  const filteredAndSortedBounties = bounties
    .filter((bounty) => {
      const matchesSearch =
        bounty.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        bounty.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesDifficulty =
        difficultyFilter === "all" ||
        bounty.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesDifficulty;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "reward-high":
          return b.reward_amount - a.reward_amount;
        case "reward-low":
          return a.reward_amount - b.reward_amount;
        case "popular":
          return b.filled_slots - a.filled_slots;
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mb-8">
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">
              Active Bounties
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
              Browse available data collection tasks and start earning
              cryptocurrency
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search bounties..."
              className="sm:max-w-xs"
              disabled
            />
            <Select disabled>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
            </Select>
            <Select disabled>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
            </Select>
            <Select disabled>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mb-8">
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">
              Active Bounties
            </h1>
          </div>

          <div className="mx-auto max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <h3 className="text-lg font-semibold text-destructive">
              Error Loading Bounties
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchBounties} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">
              Active Bounties
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
              Browse available data collection tasks and start earning
              cryptocurrency
            </p>
            {createSuccess && (
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
                <p className="text-green-600 font-medium">{createSuccess}</p>
                {blockchainTxSignature && (
                  <a
                    href={getExplorerUrl(blockchainTxSignature, "devnet")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs mt-1 inline-block"
                  >
                    View transaction on Solana Explorer →
                  </a>
                )}
              </div>
            )}
          </div>
          {authLoading ? (
            <Button disabled className="shrink-0">
              Checking auth...
            </Button>
          ) : isAuthenticated ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="shrink-0"
            >
              Create Bounty
            </Button>
          ) : (
            <Button asChild className="shrink-0">
              <a href="/auth/login">Sign In to Create Bounty</a>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search bounties..."
            className="sm:max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="household">Household</SelectItem>
              <SelectItem value="manufacturing">Manufacturing</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="culinary">Culinary</SelectItem>
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reward-high">Highest Reward</SelectItem>
              <SelectItem value="reward-low">Lowest Reward</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bounty Grid */}
        {filteredAndSortedBounties.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No bounties found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedBounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}

        {/* Create Bounty Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Create New Bounty</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                </div>

                {createError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    {createError}
                  </div>
                )}

                {isBlockchainStep && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-blue-600 text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Creating bounty on blockchain... Please confirm the transaction in your wallet.</span>
                    </div>
                  </div>
                )}

                {blockchainTxSignature && !isBlockchainStep && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-green-600 text-sm">
                    <p className="font-medium mb-1">Blockchain Transaction Successful!</p>
                    <a
                      href={getExplorerUrl(blockchainTxSignature, "devnet")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View on Solana Explorer →
                    </a>
                  </div>
                )}

                <form onSubmit={handleCreateBounty} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      placeholder="Enter bounty title"
                      required
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder="Describe what you need collected"
                      required
                      disabled={isCreating}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                        required
                      >
                        <SelectTrigger disabled={isCreating}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="household">Household</SelectItem>
                          <SelectItem value="manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="navigation">Navigation</SelectItem>
                          <SelectItem value="culinary">Culinary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="difficulty">Difficulty</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value) =>
                          handleInputChange("difficulty", value)
                        }
                        required
                      >
                        <SelectTrigger disabled={isCreating}>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reward_amount">Reward Amount (SOL)</Label>
                      <Input
                        id="reward_amount"
                        type="number"
                        step="0.01"
                        value={formData.reward_amount}
                        onChange={(e) =>
                          handleInputChange("reward_amount", e.target.value)
                        }
                        placeholder="0.00"
                        required
                        disabled={isCreating}
                      />
                    </div>

                    <div>
                      <Label htmlFor="total_slots">Total Slots</Label>
                      <Input
                        id="total_slots"
                        type="number"
                        value={formData.total_slots}
                        onChange={(e) =>
                          handleInputChange("total_slots", e.target.value)
                        }
                        placeholder="Number of videos needed"
                        required
                        disabled={isCreating}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="requirements">
                      Requirements (JSON array)
                    </Label>
                    <Textarea
                      id="requirements"
                      value={formData.requirements}
                      onChange={(e) =>
                        handleInputChange("requirements", e.target.value)
                      }
                      placeholder='["Must be 1080p", "Good lighting", "Clear audio"]'
                      required
                      disabled={isCreating}
                      className={`font-mono text-sm ${
                        formData.requirements &&
                        !isValidRequirementsJson(formData.requirements)
                          ? "border-destructive/50"
                          : ""
                      }`}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter as JSON array of strings
                      {formData.requirements &&
                        !isValidRequirementsJson(formData.requirements) && (
                          <span className="text-destructive ml-1">
                            (Invalid JSON)
                          </span>
                        )}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="guidelines">Guidelines (Optional)</Label>
                    <Textarea
                      id="guidelines"
                      value={formData.guidelines}
                      onChange={(e) =>
                        handleInputChange("guidelines", e.target.value)
                      }
                      placeholder="Additional guidelines for contributors"
                      disabled={isCreating}
                    />
                  </div>

                  <div>
                    <Label htmlFor="example_video_url">
                      Example Video URL (Optional)
                    </Label>
                    <Input
                      id="example_video_url"
                      type="url"
                      value={formData.example_video_url}
                      onChange={(e) =>
                        handleInputChange("example_video_url", e.target.value)
                      }
                      placeholder="https://example.com/video.mp4"
                      disabled={isCreating}
                      className={`${
                        formData.example_video_url &&
                        !isValidUrl(formData.example_video_url)
                          ? "border-destructive/50"
                          : ""
                      }`}
                    />
                    {formData.example_video_url &&
                      !isValidUrl(formData.example_video_url) && (
                        <p className="text-sm text-destructive mt-1">
                          Please enter a valid URL
                        </p>
                      )}
                  </div>

                  <div>
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) =>
                        handleInputChange("deadline", e.target.value)
                      }
                      disabled={isCreating}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`${
                        formData.deadline &&
                        new Date(formData.deadline) <= new Date()
                          ? "border-destructive/50"
                          : ""
                      }`}
                    />
                    {formData.deadline &&
                      new Date(formData.deadline) <= new Date() && (
                        <p className="text-sm text-destructive mt-1">
                          Deadline must be in the future
                        </p>
                      )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={isCreating || !isFormValid()}
                      className="flex-1"
                    >
                      {isCreating ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-3 h-4 w-4"
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
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          {isBlockchainStep
                            ? "Confirming on blockchain..."
                            : "Saving..."}
                        </>
                      ) : (
                        `Create Bounty ${
                          formData.reward_amount && formData.total_slots
                            ? `(Lock ${(parseFloat(formData.reward_amount) * parseInt(formData.total_slots)).toFixed(2)} SOL)`
                            : ""
                        }`
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
