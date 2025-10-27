import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data: bounties, error } = await supabase
    .from("bounties")
    .select("*, profiles:creator_id(display_name, avatar_url)")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bounties })
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

  // Extract blockchain-related fields from the body
  const {
    bounty_id,
    on_chain_pool_address,
    blockchain_tx_signature,
    is_blockchain_backed,
    ...bountyData
  } = body

  // Validate blockchain fields if provided
  if (is_blockchain_backed) {
    if (!bounty_id || !on_chain_pool_address || !blockchain_tx_signature) {
      return NextResponse.json(
        {
          error:
            "Blockchain-backed bounties require bounty_id, on_chain_pool_address and blockchain_tx_signature",
        },
        { status: 400 }
      )
    }

    // TODO: Optionally verify the transaction signature on-chain
    // This would require a Solana connection and checking the transaction exists
  }

  const { data: bounty, error } = await supabase
    .from("bounties")
    .insert({
      creator_id: user.id,
      ...bountyData,
      bounty_id: bounty_id || null,
      on_chain_pool_address: on_chain_pool_address || null,
      blockchain_tx_signature: blockchain_tx_signature || null,
      is_blockchain_backed: is_blockchain_backed || false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bounty })
}
