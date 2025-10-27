"use client";

import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ensureUserProfileClient,
  updateUserProfile,
  signInWithWallet,
} from "@/lib/auth/client";
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
  created_at: string;
  updated_at: string;
}

export default function ProfilePage() {
  const { connected, publicKey, disconnect } = useWallet();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkingWallet, setLinkingWallet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/auth/login");
      return;
    }

    setUser(session.user);

    // Ensure profile exists
    const profileResult = await ensureUserProfileClient();
    if (!profileResult.success) {
      setError("Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(profileResult.profile || null);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateUserProfile({
        display_name: formData.display_name,
        bio: formData.bio,
      });

      if (result.success) {
        setProfile(result.profile || null);
        setEditing(false);
        setSuccess("Profile updated successfully!");
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleLinkWallet = async () => {
    if (!publicKey || !profile) return;

    setLinkingWallet(true);
    setError(null);
    setSuccess(null);

    try {
      const walletAddress = publicKey.toBase58();

      // Check if wallet is already linked to another account
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("wallet_address", walletAddress)
        .neq("id", profile.id)
        .single();

      if (existingProfile) {
        setError(
          `This wallet is already linked to ${existingProfile.display_name}`,
        );
        return;
      }

      // Link wallet to current profile
      const result = await updateUserProfile({
        wallet_address: walletAddress,
      });

      if (result.success) {
        setProfile(result.profile || null);
        setSuccess("Wallet linked successfully!");
      } else {
        setError(result.error || "Failed to link wallet");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleUnlinkWallet = async () => {
    if (!profile) return;

    setLinkingWallet(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await updateUserProfile({
        wallet_address: null as any,
      });

      if (result.success) {
        setProfile(result.profile || null);
        setSuccess("Wallet unlinked successfully!");
        disconnect();
      } else {
        setError(result.error || "Failed to unlink wallet");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLinkingWallet(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setSaving(true);
    setError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const result = await updateUserProfile({
        avatar_url: publicUrlData.publicUrl,
      });

      if (result.success) {
        setProfile(result.profile || null);
        setSuccess("Avatar updated successfully!");
      } else {
        setError(result.error || "Failed to update avatar");
      }
    } catch (error) {
      setError("Failed to upload avatar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="h-8 w-48 animate-pulse rounded bg-muted mb-8" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="h-96 animate-pulse rounded-lg bg-muted" />
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
                <div className="h-64 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Profile Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your account information and wallet settings
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-card">
                <CardContent className="pt-6 text-center">
                  <div className="relative mx-auto">
                    <Avatar className="mx-auto h-24 w-24 border-2 border-primary">
                      <AvatarImage
                        src={profile?.avatar_url}
                        alt={profile?.display_name}
                      />
                      <AvatarFallback className="bg-primary/20 text-2xl font-bold text-primary">
                        {profile?.display_name
                          ? getInitials(profile.display_name)
                          : getInitials(user?.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 cursor-pointer rounded-full bg-primary p-1 text-primary-foreground hover:bg-primary/90"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <input
                        id="avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={saving}
                      />
                    </label>
                  </div>
                  <h2 className="mt-4 text-xl font-bold">
                    {profile?.display_name || "Anonymous User"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                  <Badge variant="secondary" className="mt-3">
                    {profile?.role || "Contributor"}
                  </Badge>

                  <Separator className="my-6" />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Submissions
                      </span>
                      <span className="font-semibold">
                        {profile?.total_submissions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total Earned
                      </span>
                      <span className="font-semibold text-primary">
                        ${profile?.total_earnings || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reputation</span>
                      <span className="font-semibold">
                        {profile?.reputation_score || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Member Since
                      </span>
                      <span className="font-semibold">
                        {profile?.created_at
                          ? new Date(profile.created_at).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditing(!editing)}
                    disabled={saving}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      value={formData.display_name || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          display_name: e.target.value,
                        })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      disabled={!editing}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  {editing && (
                    <Button
                      className="w-full"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Wallet Linking */}
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.wallet_address ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Linked Wallet
                        </Label>
                        <div className="mt-1 flex items-center gap-2">
                          <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm">
                            {profile.wallet_address}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              navigator.clipboard.writeText(
                                profile.wallet_address || "",
                              )
                            }
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="mt-2 text-xs text-green-600">
                          ✓ Wallet is linked and ready for transactions
                        </p>
                      </div>

                      <Separator />

                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleUnlinkWallet}
                        disabled={linkingWallet}
                      >
                        {linkingWallet ? "Unlinking..." : "Unlink Wallet"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Wallet Status
                        </Label>
                        <p className="mt-1 text-sm text-orange-600">
                          No wallet linked. Link your wallet to enable payments
                          and rewards.
                        </p>
                      </div>

                      {!connected ? (
                        <div className="rounded-lg border border-dashed border-border p-6 text-center">
                          <div className="mb-4">
                            <svg
                              className="mx-auto h-12 w-12 text-muted-foreground"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          </div>
                          <p className="mb-4 text-sm text-muted-foreground">
                            Connect your wallet to link it to your account
                          </p>
                          <WalletButton />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Connected Wallet
                            </Label>
                            <div className="mt-1 rounded bg-muted p-3">
                              <code className="font-mono text-sm">
                                {publicKey?.toBase58()}
                              </code>
                            </div>
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleLinkWallet}
                            disabled={linkingWallet}
                          >
                            {linkingWallet ? "Linking..." : "Link This Wallet"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Account ID
                    </Label>
                    <code className="mt-1 block rounded bg-muted p-2 font-mono text-xs">
                      {profile?.id}
                    </code>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Email Address
                    </Label>
                    <p className="mt-1 text-sm">{user?.email}</p>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Account Created
                    </Label>
                    <p className="mt-1 text-sm">
                      {user?.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
