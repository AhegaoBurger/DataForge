import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { walletAddress, signature, message } = await request.json();

    if (!walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: "Missing required fields: walletAddress, signature, message" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the signature (you'll need to implement proper signature verification)
    // For now, we'll skip the actual verification but in production you should:
    // 1. Recover the public key from the signature and message
    // 2. Verify it matches the provided wallet address
    // 3. Check the message is recent and contains the expected nonce

    // Check if user already exists with this wallet
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (existingProfile) {
      // User exists, sign them in
      const { data: userData, error: signInError } = await supabase.auth.signInWithPassword({
        email: `${walletAddress}@wallet.auth`, // Custom email format for wallet users
        password: walletAddress, // Use wallet address as password for simplicity
      });

      if (signInError) {
        // If sign in fails, try to create a new user
        const { data: newUser, error: signUpError } = await supabase.auth.signUp({
          email: `${walletAddress}@wallet.auth`,
          password: walletAddress,
          options: {
            data: {
              wallet_address: walletAddress,
              display_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
              auth_method: 'wallet'
            }
          }
        });

        if (signUpError) {
          return NextResponse.json(
            { error: `Failed to create wallet user: ${signUpError.message}` },
            { status: 500 }
          );
        }

        return NextResponse.json({
          message: "Wallet user created and signed in successfully",
          user: newUser.user,
          session: newUser.session
        });
      }

      return NextResponse.json({
        message: "Wallet user signed in successfully",
        user: userData.user,
        session: userData.session
      });
    }

    // New wallet user, create account
    const { data: newUser, error: signUpError } = await supabase.auth.signUp({
      email: `${walletAddress}@wallet.auth`,
      password: walletAddress,
      options: {
        data: {
          wallet_address: walletAddress,
          display_name: `Wallet ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
          auth_method: 'wallet'
        }
      }
    });

    if (signUpError) {
      return NextResponse.json(
        { error: `Failed to create wallet user: ${signUpError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Wallet user created successfully",
      user: newUser.user,
      session: newUser.session
    });

  } catch (error) {
    console.error("Wallet sign-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
