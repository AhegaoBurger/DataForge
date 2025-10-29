# DataForge

**Democratizing robotics training data through decentralized crowdsourcing on Solana**

> **Repository**: TerraTrain | **Project Name**: DataForge

---

## The Problem

Robotics companies need diverse, real-world training data but lack the infrastructure to collect it at scale. Meanwhile, millions of people carry high-quality cameras in their pockets every day.

## Our Solution

DataForge is a decentralized marketplace that connects **data contributors** (smartphone users) with **robotics companies** needing training datasets. Contributors earn cryptocurrency for recording videos of everyday tasks, while companies access high-quality, diverse data with transparent licensing.

**Turn your phone into a data collection device. Earn $1-2 per accepted video.**

---

## Key Features

- **Bounty System**: Companies post bounties for specific tasks (e.g., "Record 30s of folding laundry")
- **AI Quality Validation**: Automated pipeline validates video quality, relevance, and usability for robotics training
- **Crypto Payments**: Instant payments in USDC on Solana to contributors
- **Dataset Marketplace**: Compiled datasets available for purchase with flexible licensing (single-use, unlimited, exclusive)
- **Decentralized Storage**: Videos stored on IPFS (hot storage) + Arweave (permanent)
- **Reputation System**: Track contributor quality scores and earn badges
- **Transparent Licensing**: Smart contracts ensure clear usage rights and royalty splits

---

## Tech Stack

### Blockchain
- **Solana** blockchain for fast, low-cost transactions
- **Anchor 0.32.1** (Rust) for smart contracts
- **SPL Tokens** for payments (USDC)

### Frontend
- **Next.js 15** (App Router) with TypeScript
- **React 19** with Tailwind CSS 4.x
- **Shadcn/ui** components
- **Solana Wallet Adapter** for wallet connection

### Database & Backend
- **Supabase** (PostgreSQL) with Row Level Security
- **Supabase Auth** for authentication
- Next.js API routes

### Storage
- **IPFS** (Web3.Storage) for fast retrieval
- **Arweave** (Bundlr) for permanent storage

### Planned (Not Yet Implemented)
- React Native mobile app for data collection
- AI validation pipeline (GPT-4V/Claude for content analysis)
- NFT minting for dataset ownership

---

## Project Status

**Current Phase**: MVP Development (Early Stage)

### ✅ Implemented
- Frontend skeleton with Next.js + Supabase
- User authentication (email/password + OAuth)
- Wallet linking for payments (Solana)
- Bounty CRUD operations (create, browse, manage)
- Submission system for videos
- Database schema with RLS policies
- User profiles with reputation tracking
- Dashboard for contributors and buyers

### ⏳ In Progress / Planned
- Smart contract implementation (currently scaffolded)
- Mobile app for video recording
- Video upload/storage (IPFS/Arweave integration)
- AI quality validation pipeline
- On-chain payment escrow
- Dataset NFT minting
- Secondary marketplace

---

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm (or npm/yarn)
- Solana CLI (for smart contract development)
- Anchor CLI 0.32.1+ (for smart contract development)

### Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
pnpm dev
```

Visit `http://localhost:3000`

### Database Setup

1. Create a Supabase project at https://supabase.com
2. Run SQL scripts in `frontend/scripts/` in order:
   - `001_create_tables.sql`
   - `002_create_triggers.sql`
3. Add Supabase URL and anon key to `.env.local`

### Smart Contract Development (Optional)

```bash
cd unimake_backend

# Build contracts
anchor build

# Run tests
anchor test

# Deploy to devnet
solana config set --url devnet
anchor deploy
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│            Frontend (Next.js)                        │
│  - Bounty marketplace                                │
│  - Video submission interface                        │
│  - Dataset browsing                                  │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│         Supabase Backend                             │
│  - PostgreSQL database                               │
│  - Authentication                                    │
│  - Row Level Security                                │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
    ┌─────┐  ┌──────┐  ┌──────┐
    │IPFS │  │Solana│  │ AI   │
    │     │  │Chain │  │Valid.│
    └─────┘  └──────┘  └──────┘
```

---

## How It Works

### For Contributors
1. Browse active bounties on the platform
2. Record video matching task requirements
3. Upload video (automatically stored on IPFS)
4. AI validates quality and relevance
5. Receive instant payment in USDC upon approval

### For Companies (Buyers)
1. Create bounty with task description and requirements
2. Set reward amount and target video count
3. Review submitted videos in dashboard
4. Approve/reject submissions
5. Compile approved videos into licensed datasets

---

## Use Cases

**Robotics Training Data:**
- Household tasks (cleaning, cooking, organizing)
- Navigation scenarios (indoor/outdoor environments)
- Manipulation tasks (object handling, assembly)

**Computer Vision:**
- Diverse human poses and activities
- Real-world environment variations
- Edge case scenarios

**Future Applications:**
- AR/VR training data (with AR glasses integration)
- Autonomous vehicle scenarios
- Medical procedure documentation

---

## Documentation

- **[PROJECT_SPEC.md](./PROJECT_SPEC.md)** - Comprehensive technical specification
- **[CLAUDE.md](./CLAUDE.md)** - Developer guide for working with the codebase

---

## Team

**Project Lead**: Artur Shirokov
**Location**: Lisbon, Portugal
**GitHub**: [@AhegaoBurger](https://github.com/AhegaoBurger)
**Email**: artur.wiseman@icloud.com

---

## License

This project is developed as part of a hackathon submission.

---

## Roadmap

### Phase 1 (Months 1-3) - MVP
- Core bounty and submission system ✅
- Wallet integration ✅
- Basic AI validation
- IPFS storage integration
- Payment flow (devnet)

### Phase 2 (Months 4-6) - Growth
- Dataset NFT minting
- Human review system
- Advanced analytics
- Mobile app launch

### Phase 3 (Months 7-12) - Scale
- AR glasses integration
- Multi-chain support
- Data labeling marketplace
- DAO governance

---

## Contributing

This is a hackathon project currently under active development. Contributions, feedback, and suggestions are welcome!

---

**Built with ❤️ on Solana**
