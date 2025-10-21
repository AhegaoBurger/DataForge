import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's submission statistics
    const { data: submissions, error: submissionsError } = await supabase
      .from("submissions")
      .select("*, bounties(reward)")
      .eq("contributor_id", user.id);

    if (submissionsError) {
      return NextResponse.json(
        { error: submissionsError.message },
        { status: 500 },
      );
    }

    // Calculate statistics
    const videosSubmitted = submissions?.length || 0;
    const videosApproved =
      submissions?.filter((s) => s.status === "approved").length || 0;
    const videosPending =
      submissions?.filter((s) => s.status === "pending").length || 0;

    const totalEarned =
      submissions?.reduce((sum, submission) => {
        return submission.status === "approved"
          ? sum + (submission.bounties?.reward || 0)
          : sum;
      }, 0) || 0;

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 },
      );
    }

    // Determine contributor rank based on approved submissions
    let rank = "Bronze Contributor";
    if (videosApproved >= 100) rank = "Platinum Contributor";
    else if (videosApproved >= 50) rank = "Gold Contributor";
    else if (videosApproved >= 25) rank = "Silver Contributor";
    else if (videosApproved >= 10) rank = "Bronze Contributor";

    // Get recent submissions with bounty details
    const recentSubmissions =
      submissions?.slice(0, 10).map((submission) => ({
        id: submission.id,
        bountyTitle: submission.bounties?.title || "Unknown Bounty",
        submittedDate: submission.created_at,
        status: submission.status,
        reward:
          submission.status === "approved"
            ? submission.bounties?.reward || 0
            : 0,
        reason: submission.rejection_reason || null,
      })) || [];

    // Get active bounties that user has contributed to
    const bountyIds = Array.from(
      new Set(submissions?.map((s) => s.bounty_id).filter(Boolean)),
    );
    let activeBounties: Array<{
      id: string;
      title: string;
      reward: number;
      progress: number;
      yourSubmissions: number;
    }> = [];

    if (bountyIds.length > 0) {
      const { data: bountiesData, error: bountiesError } = await supabase
        .from("bounties")
        .select("id, title, reward, videos_needed, videos_submitted")
        .in("id", bountyIds)
        .eq("status", "active");

      if (!bountiesError && bountiesData) {
        activeBounties = bountiesData.map((bounty) => {
          const userSubmissions =
            submissions?.filter((s) => s.bounty_id === bounty.id) || [];
          return {
            id: bounty.id,
            title: bounty.title,
            reward: bounty.reward,
            progress: Math.round(
              (bounty.videos_submitted / bounty.videos_needed) * 100,
            ),
            yourSubmissions: userSubmissions.length,
          };
        });
      }
    }

    const userData = {
      videosSubmitted,
      videosApproved,
      videosPending,
      totalEarned,
      currentBalance: totalEarned,
      rank,
      joinDate: profile?.created_at || user.created_at,
    };

    return NextResponse.json({
      userData,
      recentSubmissions,
      activeBounties,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
