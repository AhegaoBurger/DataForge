import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Fetch the bounty to verify ownership and status
  const { data: existingBounty, error: fetchError } = await supabase
    .from("bounties")
    .select("creator_id, status")
    .eq("id", id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 })
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  // Verify user is the creator
  if (existingBounty.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Check if bounty is already closed
  if (existingBounty.status !== "active") {
    return NextResponse.json(
      { error: `Bounty is already ${existingBounty.status}` },
      { status: 400 }
    )
  }

  // Update bounty status to cancelled
  const { data: bounty, error } = await supabase
    .from("bounties")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select("*, profiles:creator_id(display_name, avatar_url)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bounty })
}
