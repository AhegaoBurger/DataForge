import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { status, payout_tx_signature } = body

  // Validate status
  const validStatuses = ["pending", "approved", "rejected", "revision_requested"]
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      {
        error:
          "Invalid status. Must be one of: pending, approved, rejected, revision_requested",
      },
      { status: 400 }
    )
  }

  // Get submission details to check permissions
  const { data: submission, error: fetchError } = await supabase
    .from("submissions")
    .select("*, bounties(creator_id, reward_amount, is_blockchain_backed)")
    .eq("id", id)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  // Check if user is the bounty creator
  if (submission.bounties.creator_id !== user.id) {
    return NextResponse.json(
      { error: "Only the bounty creator can update submission status" },
      { status: 403 }
    )
  }

  // For blockchain-backed bounties with approval, require payout tx signature
  if (
    submission.bounties.is_blockchain_backed &&
    status === "approved" &&
    !payout_tx_signature
  ) {
    return NextResponse.json(
      {
        error:
          "Blockchain-backed submissions require payout_tx_signature when approving",
      },
      { status: 400 }
    )
  }

  // Update submission status
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  }

  // Add payout transaction signature if provided (for approvals)
  if (payout_tx_signature) {
    updateData.payout_tx_signature = payout_tx_signature
  }

  const { error: updateError } = await supabase
    .from("submissions")
    .update(updateData)
    .eq("id", id)

  if (updateError) {
    console.error("Submission update error:", updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Fetch the updated submission separately to avoid trigger issues
  const { data: updatedSubmission, error: refetchError } = await supabase
    .from("submissions")
    .select("id, status, payout_tx_signature, updated_at")
    .eq("id", id)
    .single()

  if (refetchError) {
    console.error("Submission fetch error after update:", refetchError);
    // Return success even if fetch fails - the update succeeded
    return NextResponse.json({
      submission: { id, status: updateData.status, payout_tx_signature: updateData.payout_tx_signature }
    })
  }

  // Note: The trigger handle_submission_approval() will automatically
  // update the contributor's earnings when status changes to 'approved'
  // For blockchain-backed bounties, the payment is already released on-chain

  return NextResponse.json({ submission: updatedSubmission })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, bounties(title, creator_id), profiles:contributor_id(display_name, avatar_url)")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Check if user has access (creator or contributor)
  if (submission.contributor_id !== user.id && submission.bounties.creator_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to view this submission" },
      { status: 403 }
    )
  }

  return NextResponse.json({ submission })
}
