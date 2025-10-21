"use client"

import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { useState } from "react"

// Mock dataset data
const dataset = {
  id: "1",
  title: "Kitchen Cleaning Activities Dataset",
  description:
    "A comprehensive collection of 500+ videos showcasing diverse kitchen cleaning tasks performed by 200+ contributors from 15 different countries. This dataset provides rich, real-world examples perfect for training household robotics AI systems.",
  price: 1250,
  videoCount: 542,
  contributors: 218,
  category: "Household",
  format: "MP4, JSON metadata",
  size: "45 GB",
  license: "Commercial Use",
  tags: ["cleaning", "kitchen", "household", "manipulation", "robotics", "AI training"],
  features: [
    "High-resolution video (1080p minimum)",
    "Diverse lighting conditions and kitchen layouts",
    "Multiple camera angles per task",
    "Detailed JSON metadata for each video",
    "Annotated hand positions and object interactions",
    "Demographic diversity across contributors",
  ],
  useCases: [
    "Training household cleaning robots",
    "Computer vision model development",
    "Action recognition systems",
    "Human-robot interaction research",
    "Manipulation planning algorithms",
  ],
  sampleVideos: [
    { id: "1", title: "Counter Wiping - Modern Kitchen", duration: "2:34" },
    { id: "2", title: "Dish Washing - Traditional Sink", duration: "3:12" },
    { id: "3", title: "Cabinet Organization - Multiple Angles", duration: "2:45" },
  ],
  metadata: {
    totalDuration: "18.5 hours",
    avgVideoDuration: "2.5 minutes",
    resolution: "1080p - 4K",
    fps: "30-60 fps",
    countries: 15,
    ageRange: "18-65",
  },
}

export default function DatasetDetailPage() {
  const { connected } = useWallet()
  const [purchasing, setPurchasing] = useState(false)

  const handlePurchase = async () => {
    if (!connected) {
      alert("Please connect your wallet first")
      return
    }

    setPurchasing(true)
    // Simulate purchase transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setPurchasing(false)
    alert("Purchase successful! Download link has been sent to your wallet address.")
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/marketplace">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Marketplace
            </Link>
          </Button>

          {/* Header */}
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge variant="secondary">{dataset.category}</Badge>
              <Badge variant="outline">{dataset.license}</Badge>
            </div>
            <h1 className="text-balance text-4xl font-bold lg:text-5xl">{dataset.title}</h1>
            <p className="mt-4 text-pretty text-lg text-muted-foreground leading-relaxed">{dataset.description}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="samples">Samples</TabsTrigger>
                  <TabsTrigger value="metadata">Metadata</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Features</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {dataset.features.map((feature, index) => (
                          <li key={index} className="flex gap-3">
                            <svg
                              className="h-5 w-5 shrink-0 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm leading-relaxed">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Use Cases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {dataset.useCases.map((useCase, index) => (
                          <li key={index} className="flex gap-3 text-sm">
                            <span className="text-muted-foreground">•</span>
                            <span>{useCase}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {dataset.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="samples" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sample Videos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dataset.sampleVideos.map((video) => (
                        <div
                          key={video.id}
                          className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <svg
                                className="h-5 w-5 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{video.title}</p>
                              <p className="text-xs text-muted-foreground">{video.duration}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Preview
                          </Button>
                        </div>
                      ))}
                      <p className="pt-2 text-xs text-muted-foreground">
                        Purchase the full dataset to access all {dataset.videoCount} videos
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metadata" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Dataset Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total videos</span>
                        <span className="font-medium">{dataset.videoCount.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total duration</span>
                        <span className="font-medium">{dataset.metadata.totalDuration}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg video duration</span>
                        <span className="font-medium">{dataset.metadata.avgVideoDuration}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Resolution</span>
                        <span className="font-medium">{dataset.metadata.resolution}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frame rate</span>
                        <span className="font-medium">{dataset.metadata.fps}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contributors</span>
                        <span className="font-medium">{dataset.contributors.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Countries</span>
                        <span className="font-medium">{dataset.metadata.countries}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Age range</span>
                        <span className="font-medium">{dataset.metadata.ageRange}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total size</span>
                        <span className="font-medium">{dataset.size}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Format</span>
                        <span className="font-medium">{dataset.format}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/10">
                <CardContent className="p-6">
                  <div className="mb-6 text-center">
                    <div className="text-5xl font-bold text-primary">${dataset.price}</div>
                    <div className="mt-1 text-sm text-muted-foreground">one-time purchase</div>
                  </div>

                  <div className="mb-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Videos</span>
                      <span className="font-medium">{dataset.videoCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size</span>
                      <span className="font-medium">{dataset.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License</span>
                      <span className="font-medium">{dataset.license}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handlePurchase} disabled={purchasing}>
                    {purchasing ? "Processing..." : "Purchase Dataset"}
                  </Button>

                  {!connected && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">Connect wallet to purchase</p>
                  )}

                  <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Instant download access
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Commercial use allowed
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Blockchain-verified ownership
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
