import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existingProfile) {
      return NextResponse.json({
        message: "Profile already exists",
        profile: existingProfile
      });
    }

    // Get user metadata for display name
    const displayName = user.user_metadata?.display_name ||
                       user.user_metadata?.name ||
                       "Anonymous User";

    // Create the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: displayName,
        wallet_address: user.user_metadata?.wallet_address || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Profile created successfully",
      profile
    });

  } catch (error) {
    console.error("Create profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check if user has a profile
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      hasProfile: !!profile,
      profile: profile || null,
      error: profileError || null,
      userMetadata: user.user_metadata
    });

  } catch (error) {
    console.error("Check profile API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
