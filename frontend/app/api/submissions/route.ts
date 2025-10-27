import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const bountyId = searchParams.get("bountyId");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let query = supabase
    .from("submissions")
    .select(
      "*, bounties(title), profiles:contributor_id(display_name, wallet_address)",
    );

  if (bountyId) {
    query = query.eq("bounty_id", bountyId);
  } else {
    query = query.eq("contributor_id", user.id);
  }

  const { data: submissions, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    bounty_id,
    video_url,
    metadata,
    submission_id,
    on_chain_submission_address,
    escrow_tx_signature,
  } = body;

  // Validate required fields
  if (!bounty_id || !video_url) {
    return NextResponse.json(
      { error: "bounty_id and video_url are required" },
      { status: 400 },
    );
  }

  // Check if bounty exists and is active
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, status, total_slots, filled_slots, is_blockchain_backed")
    .eq("id", bounty_id)
    .single();

  if (bountyError || !bounty) {
    return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
  }

  if (bounty.status !== "active") {
    return NextResponse.json(
      { error: "This bounty is no longer active" },
      { status: 400 },
    );
  }

  if (bounty.filled_slots >= bounty.total_slots) {
    return NextResponse.json(
      { error: "This bounty has reached its maximum submissions" },
      { status: 400 },
    );
  }

  // For blockchain-backed bounties, require blockchain fields
  if (bounty.is_blockchain_backed) {
    if (!submission_id || !on_chain_submission_address || !escrow_tx_signature) {
      return NextResponse.json(
        {
          error:
            "Blockchain-backed bounties require submission_id, on_chain_submission_address and escrow_tx_signature",
        },
        { status: 400 },
      );
    }
  }

  // Check if user already submitted to this bounty
  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("id")
    .eq("bounty_id", bounty_id)
    .eq("contributor_id", user.id)
    .single();

  if (existingSubmission) {
    return NextResponse.json(
      { error: "You have already submitted to this bounty" },
      { status: 400 },
    );
  }

  // Create submission
  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      contributor_id: user.id,
      bounty_id,
      video_url,
      metadata: metadata || {},
      status: "pending",
      submission_id: submission_id || null,
      on_chain_submission_address: on_chain_submission_address || null,
      escrow_tx_signature: escrow_tx_signature || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment bounty filled_slots
  const { error: updateError } = await supabase
    .from("bounties")
    .update({ filled_slots: bounty.filled_slots + 1 })
    .eq("id", bounty_id);

  if (updateError) {
    console.error("Failed to update bounty filled_slots:", updateError);
    // Don't fail the request if this update fails
  }

  // Increment user's total_submissions
  const { error: profileError } = await supabase.rpc("increment_submissions", {
    user_id: user.id,
  });

  if (profileError) {
    console.error("Failed to increment user submissions:", profileError);
    // Don't fail the request if this update fails
  }

  return NextResponse.json({ submission });
}
