"use client"

import type React from "react"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SubmitVideoPage() {
  const { connected } = useWallet()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!connected) {
      alert("Please connect your wallet first")
      return
    }
    if (!videoFile) {
      alert("Please select a video file")
      return
    }

    setUploading(true)
    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setUploading(false)

    alert("Video submitted successfully! You'll receive payment once it's reviewed.")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/bounties/1">
              <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Bounty
            </Link>
          </Button>

          <div className="mb-8">
            <h1 className="text-balance text-4xl font-bold">Submit Your Video</h1>
            <p className="mt-3 text-pretty text-muted-foreground">
              Upload your video for the Kitchen Cleaning Tasks bounty
            </p>
          </div>

          {!connected && (
            <Card className="mb-6 border-destructive/50 bg-destructive/10">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground">
                  Please connect your Solana wallet to submit videos and receive payments.
                </p>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Video Upload</CardTitle>
                <CardDescription>
                  Ensure your video meets all the requirements listed in the bounty details
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
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {videoFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Accepted formats: MP4, MOV, AVI. Max size: 500MB</p>
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
                  <p className="text-sm font-medium">Before submitting, verify:</p>
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
                      <span>No personal or sensitive information is visible</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full" size="lg" disabled={!connected || uploading}>
                  {uploading ? "Uploading..." : "Submit Video"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Your video will be reviewed within 24-48 hours. Payment will be sent to your wallet automatically upon
                  approval.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
