import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const bountyId = searchParams.get("bountyId")

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let query = supabase.from("submissions").select("*, bounties(title), profiles:contributor_id(display_name)")

  if (bountyId) {
    query = query.eq("bounty_id", bountyId)
  } else {
    query = query.eq("contributor_id", user.id)
  }

  const { data: submissions, error } = await query.order("created_at", {
    ascending: false,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submissions })
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const { data: submission, error } = await supabase
    .from("submissions")
    .insert({
      contributor_id: user.id,
      ...body,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission })
}
