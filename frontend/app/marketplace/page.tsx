"use client";

import { Navigation } from "@/components/navigation";
import { DatasetCard } from "@/components/dataset-card";
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

interface Dataset {
  id: string;
  title: string;
  description: string;
  price: number;
  videoCount: number;
  contributors: number;
  category: string;
  size: string;
  tags: string[];
}

export default function MarketplacePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/datasets");

      if (!response.ok) {
        throw new Error("Failed to fetch datasets");
      }

      const data = await response.json();
      setDatasets(data.datasets || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedDatasets = datasets
    .filter((dataset) => {
      const matchesSearch =
        dataset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dataset.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" ||
        dataset.category.toLowerCase() === categoryFilter.toLowerCase();

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-high":
          return b.price - a.price;
        case "price-low":
          return a.price - b.price;
        case "videos-high":
          return b.videoCount - a.videoCount;
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
              Dataset Marketplace
            </h1>
            <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
              Purchase high-quality, diverse training datasets for your robotics
              and AI projects
            </p>
          </div>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row">
            <Input
              placeholder="Search datasets..."
              className="sm:max-w-xs"
              value=""
              disabled
            />
            <Select value="all" disabled>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
            </Select>
            <Select value="newest" disabled>
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
              Dataset Marketplace
            </h1>
          </div>

          <div className="mx-auto max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
            <h3 className="text-lg font-semibold text-destructive">
              Error Loading Datasets
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchDatasets} className="mt-4">
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
            Dataset Marketplace
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground lg:text-lg">
            Purchase high-quality, diverse training datasets for your robotics
            and AI projects
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <Input
            placeholder="Search datasets..."
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-high">Highest Price</SelectItem>
              <SelectItem value="price-low">Lowest Price</SelectItem>
              <SelectItem value="videos-high">Most Videos</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dataset Grid */}
        {filteredAndSortedDatasets.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No datasets found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your filters or search terms
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedDatasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
