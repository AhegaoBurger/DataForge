import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user (may be null for unauthenticated requests)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch bounty without status filter
  const { data: bounty, error } = await supabase
    .from("bounties")
    .select("*, profiles:creator_id(display_name, avatar_url, wallet_address)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If bounty is not active, only allow creator to view it
  if (bounty.status !== "active") {
    if (!user || bounty.creator_id !== user.id) {
      return NextResponse.json({ error: "Bounty not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ bounty });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // First check if user is the creator of the bounty
  const { data: existingBounty, error: fetchError } = await supabase
    .from("bounties")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existingBounty.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: bounty, error } = await supabase
    .from("bounties")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bounty });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // First check if user is the creator of the bounty
  const { data: existingBounty, error: fetchError } = await supabase
    .from("bounties")
    .select("creator_id")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existingBounty.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("bounties").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
