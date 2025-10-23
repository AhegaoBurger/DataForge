import { createClient } from "@/lib/supabase/server";

export async function ensureUserProfile(userId: string, userMetadata?: any) {
  const supabase = await createClient();

  try {
    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      return { success: true, profile: existingProfile };
    }

    // Profile doesn't exist, create it
    const displayName =
      userMetadata?.display_name ||
      userMetadata?.name ||
      `User ${userId.slice(0, 8)}`;

    const { data: profile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        display_name: displayName,
        wallet_address: userMetadata?.wallet_address || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create profile:", createError);
      return { success: false, error: createError.message };
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

export async function getCurrentUserWithProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  // Ensure profile exists
  const profileResult = await ensureUserProfile(user.id, user.user_metadata);

  if (!profileResult.success) {
    console.error("Failed to ensure profile:", profileResult.error);
    return { user, profile: null };
  }

  return { user, profile: profileResult.profile };
}
