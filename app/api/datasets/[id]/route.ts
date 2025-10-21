import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { id } = params

  const { data: dataset, error } = await supabase
    .from("datasets")
    .select("*, profiles:creator_id(display_name, avatar_url)")
    .eq("id", id)
    .eq("status", "published")
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dataset })
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { id } = params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  // First check if user is the creator of the dataset
  const { data: existingDataset, error: fetchError } = await supabase
    .from("datasets")
    .select("creator_id")
    .eq("id", id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (existingDataset.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { data: dataset, error } = await supabase
    .from("datasets")
    .update(body)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ dataset })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { id } = params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // First check if user is the creator of the dataset
  const { data: existingDataset, error: fetchError } = await supabase
    .from("datasets")
    .select("creator_id")
    .eq("id", id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (existingDataset.creator_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabase
    .from("datasets")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
