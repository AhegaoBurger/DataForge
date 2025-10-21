"use client";

import { Navigation } from "@/components/navigation";
import { BountyCard } from "@/components/bounty-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: number;
  videosNeeded: number;
  videosSubmitted: number;
  category: string;
  difficulty: string;
  duration: string;
  requirements: string[];
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchBounties();
  }, []);

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
          return b.reward - a.reward;
        case "reward-low":
          return a.reward - b.reward;
        case "popular":
          return b.videosSubmitted - a.videosSubmitted;
        case "newest":
        default:
          return 0; // Assuming server returns in newest order
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
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold lg:text-5xl">
            Active Bounties
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
            Browse available data collection tasks and start earning
            cryptocurrency
          </p>
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
      </div>
    </div>
  );
}
