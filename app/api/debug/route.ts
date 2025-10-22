import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        authenticated: false,
      },
      { status: 401 },
    );
  }

  try {
    // Check if user has a profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get user metadata
    const { data: userData } = await supabase.auth.admin.getUserById(user.id);

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      email: user.email,
      hasProfile: !!profile,
      profile: profile || null,
      profileError: profileError || null,
      userMetadata: user.user_metadata,
      rawUserData: userData?.user?.user_metadata || null,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        authenticated: true,
        userId: user.id,
      },
      { status: 500 },
    );
  }
}
