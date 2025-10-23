import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  display_name: string;
  wallet_address?: string;
  bio?: string;
  avatar_url?: string;
  role?: string;
  total_earnings?: number;
  total_submissions?: number;
  reputation_score?: number;
  created_at: string;
  updated_at: string;
}

export async function ensureUserProfileClient(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const supabase = createClient();

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "No authenticated user found",
      };
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      return { success: true, profile };
    }

    // Profile doesn't exist, create it
    const displayName =
      user.user_metadata?.display_name ||
      user.user_metadata?.name ||
      `User ${user.id.slice(0, 8)}`;

    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: displayName,
        wallet_address: user.user_metadata?.wallet_address || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Failed to create profile:", createError);
      return {
        success: false,
        error: `Failed to create profile: ${createError.message}`,
      };
    }

    return { success: true, profile: newProfile };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserProfile(): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "No authenticated user found",
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      if (profileError.code === "PGRST116") {
        return {
          success: false,
          error: "Profile not found",
        };
      }
      return {
        success: false,
        error: profileError.message,
      };
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Error getting user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateUserProfile(
  updates: Partial<UserProfile>,
): Promise<{
  success: boolean;
  profile?: UserProfile;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: userError?.message || "No authenticated user found",
      };
    }

    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return { success: true, profile };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function signInWithWallet(
  walletAddress: string,
  signature?: string,
  message?: string,
): Promise<{
  success: boolean;
  user?: any;
  session?: any;
  error?: string;
}> {
  const supabase = createClient();

  try {
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    const email = `${walletAddress}@wallet.auth`;
    const password = walletAddress;

    if (existingProfile) {
      // Sign in existing user
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        return {
          success: false,
          error: `Failed to sign in: ${signInError.message}`,
        };
      }

      return {
        success: true,
        user: signInData.user,
        session: signInData.session,
      };
    }

    // Create new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: {
          data: {
            wallet_address: walletAddress,
            display_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(
              -4,
            )}`,
            auth_method: "wallet",
          },
        },
      },
    );

    if (signUpError) {
      return {
        success: false,
        error: `Failed to create wallet user: ${signUpError.message}`,
      };
    }

    return {
      success: true,
      user: signUpData.user,
      session: signUpData.session,
    };
  } catch (error) {
    console.error("Wallet sign-in error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function debugAuthStatus(): Promise<{
  authenticated: boolean;
  user?: any;
  profile?: UserProfile | null;
  profileError?: string | null;
  userMetadata?: any;
}> {
  const supabase = createClient();

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { authenticated: false };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      authenticated: true,
      user,
      profile: profile || null,
      profileError: profileError?.message || null,
      userMetadata: user.user_metadata,
    };
  } catch (error) {
    console.error("Debug auth status error:", error);
    return { authenticated: false };
  }
}
