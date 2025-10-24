# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TerraTrain** (codenamed DataForge) is a decentralized marketplace on Solana that connects data contributors with robotics companies. Contributors earn cryptocurrency for capturing videos of everyday tasks, while buyers access diverse training datasets.

This is a **monorepo** with two main components:
- `frontend/` - Next.js web application
- `unimake_backend/` - Solana Anchor smart contracts (currently minimal, early stage)

## Commands

### Frontend (Next.js)

```bash
cd frontend

# Development
pnpm dev              # Start dev server on localhost:3000
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database migrations (Supabase)
# Run SQL scripts in frontend/scripts/ directory using Supabase SQL editor
# Scripts are numbered and should be run in order:
# 001_create_tables.sql, 002_create_triggers.sql, etc.
```

### Backend (Solana/Anchor)

```bash
cd unimake_backend

# Development
anchor build          # Build Solana program
anchor test           # Run tests
anchor deploy         # Deploy to configured cluster

# Test specific file
yarn run ts-mocha -p ./tsconfig.json tests/unimake_backend.ts

# Linting
yarn lint             # Check code formatting
yarn lint:fix         # Fix formatting issues

# Solana setup
solana-test-validator # Start local validator (for testing)
solana config set --url localhost  # Switch to localnet
solana config set --url devnet     # Switch to devnet
```

## Architecture

### Monorepo Structure

```
TerraTrain/
├── frontend/          # Next.js 15 web application
├── unimake_backend/   # Anchor/Solana smart contracts
└── PROJECT_SPEC.md    # Comprehensive technical specification
```

### Frontend Architecture

**Framework**: Next.js 15 with App Router, TypeScript, React 19
**Styling**: Tailwind CSS 4.x + Shadcn/ui components
**Database**: Supabase (PostgreSQL with Row Level Security)
**Authentication**: Supabase Auth (email/password or OAuth)
**Payments**: Solana Web3.js + Wallet Adapter (wallet address stored in profile)

#### Key Directories

- `app/` - Next.js App Router pages and API routes
  - `app/api/` - Backend API endpoints (bounties, datasets, submissions, auth)
  - `app/auth/` - Authentication pages (login, sign-up)
  - `app/bounties/` - Bounty browsing and submission pages
  - `app/marketplace/` - Dataset marketplace
  - `app/dashboard/` - User dashboard
  - `app/profile/` - User profile management
- `components/` - React components
  - `components/ui/` - Shadcn/ui primitives (button, card, etc.)
  - `components/wallet-provider.tsx` - Solana wallet context
  - `components/wallet-button.tsx` - Wallet connection UI
- `lib/` - Utility libraries
  - `lib/supabase/` - Database client (client.ts, server.ts)
  - `lib/auth/` - Authentication utilities

#### Database Schema (Supabase)

Key tables in `frontend/scripts/001_create_tables.sql`:
- `profiles` - User profiles with wallet_address, display_name, role (contributor/buyer/both), earnings, reputation
- `bounties` - Data collection tasks with title, category, reward_amount, requirements (JSONB), status
- `submissions` - Video submissions for bounties (video_url, status, metadata JSONB)
- `datasets` - Compiled datasets for sale (price, license_type, metadata JSONB)
- `purchases` - Dataset purchase records with transaction_signature

All tables use Row Level Security (RLS) policies for access control.

#### Authentication Flow

Authentication is handled via **Supabase Auth only** (traditional email/password or OAuth).

Flow:
1. User signs up/logs in via `/auth/login` or `/auth/sign-up` (Supabase Auth)
2. Profile auto-created via database trigger (see `002_create_triggers.sql`)
3. Session managed by Supabase JWT
4. **Wallet linking**: Users can optionally connect their Solana wallet on the profile page
5. Wallet address saved to `profiles.wallet_address` field for payment purposes only

**Important**: The wallet is NOT used for authentication - it's only for receiving payments. Users authenticate with standard Supabase credentials.

#### API Patterns

All API routes follow this pattern (example: `app/api/bounties/route.ts`):
```typescript
// Server-side Supabase client
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  // Query with RLS
  const { data, error } = await supabase.from('table').select()
  return NextResponse.json({ data })
}
```

### Backend Architecture (Solana/Anchor)

**Current State**: The Anchor program is in early/scaffolding stage with only a basic `initialize` instruction.

**Framework**: Anchor 0.32.1 (Rust-based Solana framework)
**Program ID**: `CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG`

Per PROJECT_SPEC.md, the planned smart contracts include:
- Bounty Program - Manage data collection tasks and reward pools
- Escrow Program - Handle payment escrow for submissions
- NFT Minting Program - Mint dataset NFTs for ownership/licensing
- Reputation Program - Track contributor reputation

**Note**: These are not yet implemented. The current `lib.rs` contains only a "Hello World" initialize function.

## Development Workflow

### Working with Bounties

1. Buyers create bounties via `/bounties/create` (stores in Supabase `bounties` table)
2. Contributors browse active bounties at `/bounties`
3. Contributors submit videos via `/bounties/[id]/submit` (stores in `submissions` table)
4. Submissions stored as `video_url` (currently expects external storage like IPFS/Arweave per spec)
5. Status workflow: `pending` → `approved` or `rejected` → payment triggered

### Working with Profiles

- Profile auto-created on first auth via database trigger
- `ensureUserProfileClient()` utility handles profile existence check
- Profile fields: `wallet_address`, `display_name`, `bio`, `avatar_url`, `role`, `total_earnings`, `reputation_score`
- **Wallet linking**: Users link their Solana wallet on the profile page to receive payments
- **Recent change**: `location` field was removed (see git history: "Remove location field from profile")

### Wallet Integration (Payments Only)

The wallet is used for **payments only**, not authentication. Uses `@solana/wallet-adapter-react`:
```typescript
// In layout.tsx, wrap with WalletProvider
import { WalletProvider } from '@/components/wallet-provider'

// In components, use hooks for payment operations
import { useWallet } from '@solana/wallet-adapter-react'
const { publicKey, signMessage } = useWallet()
```

When a user links their wallet on the profile page, the `wallet_address` is saved to their profile for future payment processing.

## Key Files to Understand

1. `PROJECT_SPEC.md` - Complete technical specification (database schemas, API design, smart contract architecture)
2. `frontend/scripts/001_create_tables.sql` - Database schema and RLS policies
3. `frontend/lib/auth/client.ts` - Authentication logic (Supabase auth, profile management)
4. `frontend/app/api/bounties/route.ts` - Example API route pattern
5. `unimake_backend/programs/unimake_backend/src/lib.rs` - Solana program (currently minimal)

## Important Context

### Blockchain Integration Status
- Frontend has full Solana wallet integration
- Smart contracts are scaffolded but NOT implemented yet
- Current payment flow is **database-only** (no on-chain escrow)
- Per spec, future implementation will add on-chain bounty pools, escrow, and NFT minting

### Data Storage
- Videos: Per spec, should use IPFS (hot storage) + Arweave (permanent)
- Currently: `video_url` field suggests external storage, implementation TBD
- Metadata: JSONB fields in Supabase for flexible schema (bounties.requirements, submissions.metadata, datasets.metadata)

### User Roles
Three roles in `profiles.role`:
- `contributor` - Submits videos, earns rewards
- `buyer` - Creates bounties, purchases datasets
- `both` - Can do both

### Status Enums
- Bounties: `active`, `paused`, `completed`, `cancelled`
- Submissions: `pending`, `approved`, `rejected`, `revision_requested`
- Datasets: `draft`, `published`, `archived`

## Common Tasks

### Adding a New Bounty Field
1. Update `frontend/scripts/001_create_tables.sql` (or create new migration)
2. Run SQL in Supabase SQL editor
3. Update TypeScript types if needed
4. Update API routes (`app/api/bounties/route.ts`)
5. Update UI forms (`app/bounties/create`)

### Adding a New API Endpoint
1. Create file in `app/api/{resource}/route.ts`
2. Import `createClient` from `@/lib/supabase/server`
3. Add auth check with `supabase.auth.getUser()`
4. Use Supabase query builders (RLS enforced automatically)
5. Return `NextResponse.json()`

### Implementing Smart Contract Logic
1. Edit `unimake_backend/programs/unimake_backend/src/lib.rs`
2. Define accounts with `#[derive(Accounts)]`
3. Add instructions in `#[program]` module
4. Write tests in `tests/unimake_backend.ts`
5. Run `anchor build && anchor test`
6. Deploy with `anchor deploy --provider.cluster devnet`

## Configuration

### Environment Variables (Frontend)

Required in `frontend/.env`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Solana Configuration (Backend)

In `unimake_backend/Anchor.toml`:
- Cluster: Currently `localnet`, switch to `devnet` or `mainnet` for deployment
- Wallet: `~/.config/solana/id.json`
- Program ID: `CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG`

## Testing

### Frontend
Currently no test suite configured. Consider adding:
- Jest + React Testing Library for component tests
- Playwright/Cypress for E2E tests

### Backend
```bash
cd unimake_backend
anchor test  # Runs Mocha tests in tests/ directory
```

Test framework: Mocha + Chai (TypeScript)
Current test: Basic initialization test in `tests/unimake_backend.ts`

## Deployment

### Frontend
- Deployed on Vercel: v0-decentralized-data-marketplace
- Auto-deploys from main branch via GitHub integration
- Uses v0.app for design iteration (auto-synced)

### Backend
- Not yet deployed to devnet/mainnet
- Use `anchor deploy` when ready for testnet/mainnet

## Project Status

**Phase**: MVP Development (Early Stage)
- ✅ Frontend skeleton with Next.js + Supabase
- ✅ Authentication (wallet + database)
- ✅ Basic bounty CRUD operations
- ✅ Database schema with RLS
- ⏳ Smart contract implementation (scaffolded only)
- ⏳ Video upload/storage (IPFS/Arweave integration)
- ⏳ Payment processing (on-chain escrow)
- ⏳ Dataset NFT minting
- ⏳ AI quality validation pipeline

See PROJECT_SPEC.md for full feature roadmap and implementation plan.
