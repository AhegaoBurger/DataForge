"use client"

import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useWallet } from "@solana/wallet-adapter-react"
import { useState } from "react"

export default function ProfilePage() {
  const { connected, publicKey } = useWallet()
  const [editing, setEditing] = useState(false)

  const [profile, setProfile] = useState({
    username: "DataCollector47",
    bio: "Passionate about contributing to the future of robotics and AI. Specializing in household and kitchen tasks.",
    location: "San Francisco, CA",
    joinDate: "2024-11-15",
  })

  const stats = {
    totalVideos: 47,
    totalEarned: 105.5,
    approvalRate: 89,
    rank: "Gold Contributor",
    badges: ["Early Adopter", "Top 10%", "Kitchen Expert", "Consistent Contributor"],
  }

  if (!connected) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <Card className="mx-auto max-w-md border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold">Wallet Not Connected</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please connect your Solana wallet to view your profile
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage your account and view your achievements</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card">
                <CardContent className="pt-6 text-center">
                  <Avatar className="mx-auto h-24 w-24 border-2 border-primary">
                    <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                      {profile.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-xl font-bold">{profile.username}</h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                  </p>
                  <Badge variant="secondary" className="mt-3">
                    {stats.rank}
                  </Badge>

                  <Separator className="my-6" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Videos</span>
                      <span className="font-semibold">{stats.totalVideos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Earned</span>
                      <span className="font-semibold text-primary">${stats.totalEarned}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval Rate</span>
                      <span className="font-semibold">{stats.approvalRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Member Since</span>
                      <span className="font-semibold">{new Date(profile.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {stats.badges.map((badge) => (
                      <Badge key={badge} variant="outline" className="border-secondary/50 text-secondary">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!editing}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  {editing && (
                    <Button className="w-full" onClick={() => setEditing(false)}>
                      Save Changes
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Info */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Wallet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Wallet Address</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                        {publicKey?.toBase58()}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(publicKey?.toBase58() || "")}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-muted-foreground">Network</Label>
                    <p className="mt-1 text-sm font-medium">Solana Devnet</p>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs text-muted-foreground">Current Balance</Label>
                    <p className="mt-1 text-2xl font-bold text-primary">${stats.totalEarned}</p>
                  </div>

                  <Button variant="outline" className="w-full bg-transparent">
                    Withdraw Funds
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
