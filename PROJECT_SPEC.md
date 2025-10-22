# Technical Specification: Solana Robotics Data Marketplace

**Project Codename:** DataForge
**Version:** 1.0
**Author:** Artur Shirokov
**Date:** October 20, 2025
**Status:** Initial Specification

---

## Executive Summary

A decentralized marketplace built on Solana that connects real-world data contributors (initially smartphone users, later AR glasses) with robotics companies needing diverse training datasets. Contributors earn cryptocurrency for capturing videos of everyday tasks; buyers access high-quality, diverse datasets with transparent licensing.

**Core Value Proposition:**
- **For Contributors:** Turn your smartphone into a data collection device earning $1-2 per accepted video
- **For Robotics Companies:** Access diverse, real-world training data at scale without building collection infrastructure
- **For the Ecosystem:** Decentralized ownership, transparent licensing, and composable data infrastructure

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
├─────────────────────┬───────────────────────────────────────┤
│ Contributor App     │ Marketplace Web App    │ Admin Panel  │
│ (React Native)      │ (Next.js)              │ (SvelteKit)  │
└─────────────────────┴────────────────┬───────┴──────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────┐
│                   API Gateway Layer                           │
│              (Node.js + Express/Fastify)                      │
└─────────────────────┬────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌─────────┐ ┌──────────────┐
│   Solana     │ │ Storage │ │  AI Quality  │
│  Blockchain  │ │  Layer  │ │  Validation  │
└──────────────┘ └─────────┘ └──────────────┘
```

---

## Tech Stack

### Blockchain Layer
- **Blockchain:** Solana (Devnet → Testnet → Mainnet)
- **Smart Contract Framework:** Anchor 0.29+ (Rust)
- **Token Standard:** SPL Token (USDC for payments)
- **NFT Standard:** Metaplex Token Metadata
- **Wallet Integration:** Solana Wallet Adapter, Phantom SDK

### Data Collection App (Mobile)
- **Framework:** React Native 0.73+
- **Language:** TypeScript 5.0+
- **State Management:** Zustand / Redux Toolkit
- **Camera:** react-native-vision-camera
- **Video Compression:** react-native-compressor
- **Wallet:** Solana Mobile SDK (@solana-mobile/mobile-wallet-adapter)
- **Storage:** AsyncStorage / MMKV
- **Network:** Axios / React Query

### Marketplace Web App
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5.0+
- **Styling:** TailwindCSS 3.4+
- **UI Components:** shadcn/ui
- **State Management:** React Context + Zustand
- **Wallet Connection:** Solana Wallet Adapter
- **API Client:** tRPC / REST

### Backend API
- **Runtime:** Node.js 20+ (or Bun for performance)
- **Framework:** Express.js / Fastify
- **Language:** TypeScript 5.0+
- **Database:** PostgreSQL 16+ (primary data)
- **Cache:** Redis 7+ (session, hot data)
- **Queue:** BullMQ (async job processing)
- **ORM:** Prisma / Drizzle

### Storage Layer
- **Hot Storage:** IPFS (via Web3.Storage or Pinata)
- **Cold Storage:** Arweave (via Bundlr for instant uploads)
- **Metadata Storage:** On-chain (Solana) + IPFS (detailed metadata)
- **CDN:** Cloudflare R2 / Bunny CDN (for previews)

### AI/ML Quality Validation
- **Framework:** Python 3.11+ with FastAPI
- **Models:**
  - OpenAI GPT-4 Vision / Anthropic Claude 4 (content validation)
  - Custom YOLO/ViT models (object detection, quality metrics)
- **Video Processing:** FFmpeg, OpenCV
- **ML Ops:** Docker containers, GPU-enabled inference

### DevOps & Infrastructure
- **Hosting:** Vercel (frontend), Railway/Fly.io (backend), Modal/Replicate (ML)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors), Grafana + Prometheus (metrics)
- **Version Control:** Git + GitHub

---

## Smart Contract Architecture

### Contract Programs (Solana/Anchor)

#### 1. **Bounty Program** (`bounty_program`)
Manages data collection tasks and reward pools.

**Accounts:**
```rust
pub struct BountyPool {
    pub authority: Pubkey,           // Buyer who created bounty
    pub bounty_id: u64,              // Unique identifier
    pub task_description: String,    // "Fold laundry - 30s minimum"
    pub requirements: Requirements,   // Video specs (resolution, length, etc.)
    pub reward_per_video: u64,       // Lamports per accepted video
    pub total_pool: u64,             // Total funds deposited
    pub remaining_pool: u64,         // Remaining funds
    pub videos_target: u32,          // Target number of videos
    pub videos_collected: u32,       // Current count
    pub status: BountyStatus,        // Active, Paused, Completed, Cancelled
    pub created_at: i64,
    pub expires_at: i64,
}

pub struct Requirements {
    pub min_duration_secs: u32,
    pub min_resolution: Resolution,  // 720p, 1080p, 4K
    pub min_fps: u32,
    pub required_tags: Vec<String>,
    pub excluded_tags: Vec<String>,
    pub geographic_restrictions: Option<Vec<String>>,
}

pub enum BountyStatus {
    Active,
    Paused,
    Completed,
    Cancelled,
}
```

**Instructions:**
- `create_bounty` - Buyer creates new bounty with fund deposit
- `update_bounty` - Modify requirements or add more funds
- `pause_bounty` / `resume_bounty` - Temporary suspension
- `cancel_bounty` - Refund remaining funds to buyer
- `close_bounty` - Mark as completed

#### 2. **Escrow Program** (`escrow_program`)
Manages payment escrow for video submissions.

**Accounts:**
```rust
pub struct VideoSubmission {
    pub submission_id: u64,
    pub contributor: Pubkey,
    pub bounty_id: u64,
    pub ipfs_hash: String,           // Content hash
    pub arweave_tx: String,          // Permanent storage transaction
    pub metadata_uri: String,        // Link to detailed metadata JSON
    pub submission_timestamp: i64,
    pub status: SubmissionStatus,
    pub escrow_amount: u64,          // Lamports held in escrow
    pub quality_score: Option<u8>,   // 0-100 from AI validation
    pub reviewer_votes: Vec<Vote>,
}

pub enum SubmissionStatus {
    Pending,           // Awaiting validation
    UnderReview,       // In quality check pipeline
    Approved,          // Passed validation
    Rejected,          // Failed validation
    Disputed,          // Contributor disputes rejection
    PayoutComplete,    // Funds released
}

pub struct Vote {
    pub reviewer: Pubkey,
    pub approved: bool,
    pub reason: Option<String>,
    pub timestamp: i64,
}
```

**Instructions:**
- `submit_video` - Contributor submits video, creates escrow
- `validate_submission` - AI oracle posts validation result
- `approve_submission` - Release payment to contributor
- `reject_submission` - Return funds to bounty pool
- `dispute_submission` - Contributor initiates dispute
- `resolve_dispute` - DAO or admin resolves

#### 3. **NFT Minting Program** (`dataset_nft_program`)
Mints dataset NFTs for ownership and licensing.

**Accounts:**
```rust
pub struct DatasetNFT {
    pub mint: Pubkey,                // NFT mint address
    pub dataset_id: u64,
    pub video_submissions: Vec<u64>, // Array of submission IDs
    pub license_type: LicenseType,
    pub creator: Pubkey,             // Original buyer who assembled dataset
    pub contributors: Vec<Contributor>, // Array of contributors with splits
    pub usage_rights: UsageRights,
    pub price: Option<u64>,          // If reselling on secondary market
    pub royalty_percentage: u16,     // Basis points (e.g., 500 = 5%)
}

pub struct Contributor {
    pub wallet: Pubkey,
    pub contribution_count: u32,
    pub royalty_share: u16,          // Basis points
}

pub enum LicenseType {
    SingleUse,      // One-time training run
    Unlimited,      // Unlimited internal use
    Exclusive,      // Exclusive rights, no other licenses
    CommercialResale, // Can sublicense to others
}

pub struct UsageRights {
    pub allow_commercial: bool,
    pub allow_modification: bool,
    pub allow_redistribution: bool,
    pub attribution_required: bool,
    pub expire_date: Option<i64>,
}
```

**Instructions:**
- `mint_dataset_nft` - Create NFT from approved submissions
- `transfer_license` - Transfer NFT with license
- `update_price` - Change secondary market price
- `distribute_royalty` - Split royalty payment among contributors

#### 4. **Reputation Program** (`reputation_program`)
Tracks contributor and buyer reputation scores.

**Accounts:**
```rust
pub struct ContributorProfile {
    pub wallet: Pubkey,
    pub total_submissions: u32,
    pub accepted_submissions: u32,
    pub rejected_submissions: u32,
    pub average_quality_score: u8,
    pub total_earnings: u64,
    pub reputation_score: u16,       // 0-1000
    pub badges: Vec<Badge>,
    pub join_date: i64,
    pub last_active: i64,
}

pub struct Badge {
    pub badge_type: BadgeType,
    pub earned_at: i64,
}

pub enum BadgeType {
    FirstVideo,
    HundredVideos,
    ThousandVideos,
    HighQuality,      // >95% acceptance rate
    EarlyAdopter,
    CategoryExpert,   // Specialized in specific task type
}
```

**Instructions:**
- `create_profile` - Initialize contributor profile
- `update_reputation` - Automated after each submission result
- `award_badge` - Grant achievement badge
- `slash_reputation` - Penalize for spam/fraud

---

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- Users (off-chain identity data)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    email VARCHAR(255),
    username VARCHAR(50),
    kyc_status VARCHAR(20) DEFAULT 'none', -- none, pending, verified
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Bounties (mirrors on-chain data with additional metadata)
CREATE TABLE bounties (
    id BIGSERIAL PRIMARY KEY,
    bounty_id BIGINT UNIQUE NOT NULL, -- Matches on-chain
    creator_wallet VARCHAR(44) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- household, navigation, manipulation, etc.
    reward_per_video BIGINT NOT NULL,
    total_pool BIGINT NOT NULL,
    videos_target INTEGER,
    videos_collected INTEGER DEFAULT 0,
    status VARCHAR(20), -- active, paused, completed, cancelled
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    tx_signature VARCHAR(88) -- Solana transaction hash
);

-- Video Submissions (detailed off-chain data)
CREATE TABLE video_submissions (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT UNIQUE NOT NULL, -- Matches on-chain
    bounty_id BIGINT REFERENCES bounties(id),
    contributor_wallet VARCHAR(44) NOT NULL,
    ipfs_hash VARCHAR(100) NOT NULL,
    arweave_tx VARCHAR(100),
    file_size_bytes BIGINT,
    duration_seconds DECIMAL(10,2),
    resolution VARCHAR(20), -- 1920x1080, etc.
    fps INTEGER,
    codec VARCHAR(20),
    thumbnail_url TEXT,
    metadata_json JSONB, -- Additional flexible metadata
    status VARCHAR(20), -- pending, under_review, approved, rejected, disputed
    ai_quality_score INTEGER, -- 0-100
    ai_validation_details JSONB,
    human_review_score INTEGER,
    rejection_reason TEXT,
    submitted_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    tx_signature VARCHAR(88)
);

-- Dataset NFTs (tracks minted datasets)
CREATE TABLE dataset_nfts (
    id BIGSERIAL PRIMARY KEY,
    mint_address VARCHAR(44) UNIQUE NOT NULL,
    dataset_id BIGINT UNIQUE NOT NULL,
    creator_wallet VARCHAR(44) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    video_count INTEGER,
    total_duration_hours DECIMAL(10,2),
    license_type VARCHAR(50),
    price_lamports BIGINT,
    royalty_percentage INTEGER, -- basis points
    created_at TIMESTAMP DEFAULT NOW(),
    mint_tx_signature VARCHAR(88)
);

-- Dataset Videos (many-to-many relationship)
CREATE TABLE dataset_videos (
    dataset_id BIGINT REFERENCES dataset_nfts(id),
    submission_id BIGINT REFERENCES video_submissions(id),
    PRIMARY KEY (dataset_id, submission_id)
);

-- Contributor Profiles (off-chain extended data)
CREATE TABLE contributor_profiles (
    wallet_address VARCHAR(44) PRIMARY KEY,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    location_country VARCHAR(2), -- ISO country code
    location_city VARCHAR(100),
    preferred_categories TEXT[], -- Array of categories
    device_info JSONB, -- Phone model, camera specs
    total_submissions INTEGER DEFAULT 0,
    accepted_submissions INTEGER DEFAULT 0,
    total_earnings_lamports BIGINT DEFAULT 0,
    average_quality_score DECIMAL(5,2),
    reputation_score INTEGER DEFAULT 500, -- 0-1000
    badges TEXT[],
    referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(44),
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

-- Transactions (audit log of all payments)
CREATE TABLE transactions (
    id BIGSERIAL PRIMARY KEY,
    tx_signature VARCHAR(88) UNIQUE NOT NULL,
    tx_type VARCHAR(50), -- bounty_create, video_payout, nft_mint, etc.
    from_wallet VARCHAR(44),
    to_wallet VARCHAR(44),
    amount_lamports BIGINT,
    related_bounty_id BIGINT,
    related_submission_id BIGINT,
    status VARCHAR(20), -- confirmed, failed, pending
    block_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Quality Reviews (human reviewer votes)
CREATE TABLE quality_reviews (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT REFERENCES video_submissions(id),
    reviewer_wallet VARCHAR(44) NOT NULL,
    approved BOOLEAN NOT NULL,
    quality_score INTEGER, -- 0-100
    feedback TEXT,
    review_duration_seconds INTEGER,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Disputes (contributor appeals)
CREATE TABLE disputes (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT REFERENCES video_submissions(id),
    contributor_wallet VARCHAR(44) NOT NULL,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    status VARCHAR(20), -- pending, under_review, resolved
    resolution TEXT,
    resolved_by VARCHAR(44), -- Admin or DAO
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Referrals (tracking referral program)
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    referrer_wallet VARCHAR(44) NOT NULL,
    referee_wallet VARCHAR(44) NOT NULL,
    referral_code VARCHAR(20),
    referee_earnings_lamports BIGINT DEFAULT 0,
    referrer_earnings_lamports BIGINT DEFAULT 0, -- 10% of referee earnings
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(referrer_wallet, referee_wallet)
);

-- Platform Analytics (aggregate metrics)
CREATE TABLE daily_metrics (
    date DATE PRIMARY KEY,
    new_users INTEGER DEFAULT 0,
    active_contributors INTEGER DEFAULT 0,
    videos_submitted INTEGER DEFAULT 0,
    videos_approved INTEGER DEFAULT 0,
    total_volume_lamports BIGINT DEFAULT 0,
    new_bounties INTEGER DEFAULT 0,
    avg_quality_score DECIMAL(5,2)
);

-- Indexes for performance
CREATE INDEX idx_submissions_contributor ON video_submissions(contributor_wallet);
CREATE INDEX idx_submissions_bounty ON video_submissions(bounty_id);
CREATE INDEX idx_submissions_status ON video_submissions(status);
CREATE INDEX idx_bounties_status ON bounties(status);
CREATE INDEX idx_bounties_creator ON bounties(creator_wallet);
CREATE INDEX idx_transactions_from ON transactions(from_wallet);
CREATE INDEX idx_transactions_to ON transactions(to_wallet);
CREATE INDEX idx_video_submissions_ipfs ON video_submissions(ipfs_hash);
```

---

## API Specification

### REST API Endpoints

**Base URL:** `https://api.dataforge.io/v1`

#### Authentication
- **Type:** JWT (JSON Web Tokens) + Solana Wallet Signature
- **Flow:**
  1. Client signs message with wallet
  2. Server verifies signature
  3. Server issues JWT with 24h expiration
- **Header:** `Authorization: Bearer <JWT_TOKEN>`

#### Bounties

```
GET    /bounties                    # List all active bounties
GET    /bounties/:id                # Get bounty details
POST   /bounties                    # Create new bounty (buyer only)
PATCH  /bounties/:id                # Update bounty
DELETE /bounties/:id                # Cancel bounty

Query params for listing:
- status: active | paused | completed
- category: string
- min_reward: number
- max_reward: number
- page: number
- limit: number (max 100)
```

#### Submissions

```
GET    /submissions                 # List all submissions (admin/buyer)
GET    /submissions/:id             # Get submission details
POST   /submissions                 # Submit new video
GET    /submissions/mine            # Get contributor's submissions
PATCH  /submissions/:id/dispute     # Create dispute

Query params for listing:
- bounty_id: number
- status: pending | approved | rejected
- contributor: wallet_address
- min_quality_score: number
- date_from: ISO8601
- date_to: ISO8601
```

#### Uploads

```
POST   /upload/init                 # Initialize upload, get presigned URL
POST   /upload/complete             # Mark upload complete
GET    /upload/status/:upload_id    # Check upload processing status
```

#### Profiles

```
GET    /profiles/:wallet            # Get public profile
GET    /profiles/me                 # Get own profile
PATCH  /profiles/me                 # Update own profile
GET    /profiles/:wallet/stats      # Get contributor statistics
```

#### Datasets

```
GET    /datasets                    # List available datasets
GET    /datasets/:id                # Get dataset details
POST   /datasets                    # Create dataset from submissions (buyer)
GET    /datasets/:id/download       # Get download credentials (buyer)
```

#### Analytics

```
GET    /analytics/contributor/:wallet  # Contributor earnings/performance
GET    /analytics/platform             # Platform-wide metrics (admin)
GET    /analytics/bounty/:id           # Bounty performance
```

### WebSocket Events

```
ws://api.dataforge.io/ws
```

**Client → Server:**
```json
{
  "type": "subscribe",
  "channel": "submissions",
  "bounty_id": 123
}
```

**Server → Client:**
```json
{
  "type": "submission_status_update",
  "submission_id": 456,
  "status": "approved",
  "quality_score": 87,
  "timestamp": "2025-10-20T10:30:00Z"
}
```

**Channels:**
- `submissions` - Real-time submission status updates
- `bounties` - New bounties, bounty updates
- `payouts` - Payment confirmations
- `notifications` - General user notifications

---

## Mobile App Architecture

### React Native App Structure

```
/mobile
├── /src
│   ├── /screens
│   │   ├── OnboardingScreen.tsx      # Wallet setup, intro
│   │   ├── HomeScreen.tsx            # Browse bounties
│   │   ├── BountyDetailScreen.tsx    # View bounty requirements
│   │   ├── CameraScreen.tsx          # Record video
│   │   ├── SubmissionReviewScreen.tsx # Preview before submit
│   │   ├── SubmissionsScreen.tsx     # View own submissions
│   │   ├── EarningsScreen.tsx        # Track earnings, withdraw
│   │   └── ProfileScreen.tsx         # Edit profile, settings
│   ├── /components
│   │   ├── BountyCard.tsx            # Bounty listing item
│   │   ├── VideoPlayer.tsx           # Video preview
│   │   ├── QualityIndicator.tsx      # Real-time quality feedback
│   │   └── WalletButton.tsx          # Connect/disconnect wallet
│   ├── /services
│   │   ├── api.ts                    # API client
│   │   ├── solana.ts                 # Blockchain interactions
│   │   ├── storage.ts                # IPFS/Arweave uploads
│   │   └── camera.ts                 # Camera utilities
│   ├── /hooks
│   │   ├── useWallet.ts              # Wallet connection hook
│   │   ├── useBounties.ts            # Fetch bounties
│   │   └── useSubmissions.ts         # Manage submissions
│   ├── /store
│   │   └── index.ts                  # Zustand store
│   └── /utils
│       ├── validation.ts             # Video quality validation
│       ├── compression.ts            # Video compression
│       └── encryption.ts             # Local data encryption
├── App.tsx
└── package.json
```

### Camera Screen Flow

```typescript
// Pseudocode for camera recording flow
const CameraScreen = ({ bounty }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [videoPath, setVideoPath] = useState(null);
  const [qualityChecks, setQualityChecks] = useState({
    duration: false,
    resolution: false,
    lighting: false,
    stability: false
  });

  const startRecording = async () => {
    // Start camera recording
    await camera.startRecording({
      onRecordingFinished: (video) => {
        setVideoPath(video.path);
        validateVideo(video);
      }
    });
    setIsRecording(true);
  };

  const validateVideo = async (video) => {
    // Client-side validation before upload
    const checks = {
      duration: video.duration >= bounty.requirements.min_duration,
      resolution: video.width >= 1280 && video.height >= 720,
      lighting: await analyzeLighting(video), // ML model
      stability: await analyzeStability(video) // ML model
    };
    setQualityChecks(checks);
  };

  const submitVideo = async () => {
    // 1. Compress video
    const compressed = await compressVideo(videoPath);

    // 2. Upload to IPFS
    const ipfsHash = await uploadToIPFS(compressed);

    // 3. Upload to Arweave for permanence
    const arweaveTx = await uploadToArweave(compressed);

    // 4. Submit on-chain
    await submitVideoOnChain(bounty.id, ipfsHash, arweaveTx);

    // 5. Navigate to submissions screen
    navigation.navigate('Submissions');
  };
};
```

### Key Features

1. **Real-time Quality Feedback:**
   - Show duration counter
   - Overlay grid for composition
   - Lighting indicator (too dark/bright)
   - Stability warning (shaky footage)

2. **Offline Support:**
   - Queue videos for upload when back online
   - Local SQLite storage for drafts
   - Background upload with retry logic

3. **Gamification:**
   - Show XP bar for reputation progress
   - Badge notifications
   - Daily streak tracker
   - Earnings leaderboard (opt-in)

---

## Web Marketplace Architecture

### Next.js App Structure

```
/web
├── /app
│   ├── /(marketing)
│   │   ├── page.tsx                 # Landing page
│   │   ├── how-it-works/page.tsx
│   │   ├── for-contributors/page.tsx
│   │   └── for-buyers/page.tsx
│   ├── /(app)
│   │   ├── dashboard/page.tsx       # User dashboard
│   │   ├── bounties
│   │   │   ├── page.tsx             # Browse bounties
│   │   │   ├── [id]/page.tsx        # Bounty detail
│   │   │   └── create/page.tsx      # Create bounty (buyer)
│   │   ├── datasets
│   │   │   ├── page.tsx             # Browse datasets
│   │   │   ├── [id]/page.tsx        # Dataset detail
│   │   │   └── purchase/[id]/page.tsx
│   │   ├── submissions
│   │   │   ├── page.tsx             # Manage submissions
│   │   │   └── [id]/page.tsx        # Submission detail
│   │   ├── profile
│   │   │   └── [wallet]/page.tsx    # Public profile
│   │   └── settings/page.tsx
│   ├── /api
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── bounties/route.ts
│   │   ├── submissions/route.ts
│   │   └── webhooks/route.ts
│   └── layout.tsx
├── /components
│   ├── /ui                          # shadcn components
│   ├── BountyGrid.tsx
│   ├── DatasetCard.tsx
│   ├── VideoPreview.tsx
│   ├── WalletConnectButton.tsx
│   └── StatsDashboard.tsx
├── /lib
│   ├── solana.ts                    # Solana Web3.js setup
│   ├── db.ts                        # Prisma client
│   └── api.ts                       # API helpers
└── next.config.js
```

### Key Pages

#### Landing Page
- Hero: "Turn Your Phone Into a Data Collection Device"
- Stats: Total earned by contributors, videos collected, active bounties
- How It Works: 3-step process (Record → Submit → Earn)
- Social proof: Testimonials, buyer logos
- CTA: "Start Earning" / "Post a Bounty"

#### Bounty Browse Page
- Filters: Category, reward range, difficulty, location
- Sort: Highest reward, newest, ending soon
- Map view: Show bounties by location
- Search: Full-text search on descriptions

#### Bounty Detail Page
- Requirements visualization
- Example videos (if available)
- Reward breakdown
- Acceptance criteria
- Submit button (if contributor)
- Video gallery (submitted videos for buyer)

#### Dataset Marketplace
- Browse compiled datasets
- Filter by: Category, size, price, license type
- Sample previews (first 3 seconds of random videos)
- License comparison table
- "Add to Cart" → Checkout with crypto

---

## AI Quality Validation Pipeline

### Architecture

```
┌─────────────────┐
│  Video Upload   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pre-Processing │  ← Extract frames, metadata
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 1:       │
│  Technical QA   │  ← Resolution, codec, duration, file size
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 2:       │
│  Content QA     │  ← Object detection, scene classification
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 3:       │
│  LLM Analysis   │  ← GPT-4V / Claude: "Does this show folding clothes?"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stage 4:       │
│ Human Review    │  ← If confidence < 90%, flag for human
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Accept/Reject   │
└─────────────────┘
```

### Validation Checks

**Technical Quality (Automated):**
```python
def validate_technical_quality(video_path: str) -> dict:
    checks = {
        "resolution": check_resolution(video_path),  # >= 720p
        "duration": check_duration(video_path),      # >= min_duration
        "fps": check_fps(video_path),                # >= 24fps
        "codec": check_codec(video_path),            # H.264/H.265
        "file_size": check_file_size(video_path),    # Reasonable for duration
        "corruption": check_corruption(video_path),  # Is file readable?
        "lighting": analyze_lighting(video_path),    # Not too dark/bright
        "stability": analyze_stability(video_path),  # Not too shaky
        "audio_sync": check_audio_sync(video_path),  # If audio present
    }
    return checks
```

**Content Quality (ML Models):**
```python
def validate_content_quality(video_path: str, task_description: str) -> dict:
    # Extract frames at 1fps
    frames = extract_frames(video_path, fps=1)

    # Run object detection
    detected_objects = run_yolo(frames)

    # Scene classification
    scene_type = classify_scene(frames)  # indoor, outdoor, kitchen, etc.

    # Activity recognition
    detected_activity = recognize_activity(frames)

    # Check if detected activity matches task
    relevance_score = calculate_relevance(
        detected_activity,
        task_description
    )

    return {
        "objects": detected_objects,
        "scene": scene_type,
        "activity": detected_activity,
        "relevance_score": relevance_score,
        "confidence": model_confidence
    }
```

**LLM Validation (High-Level Understanding):**
```python
async def llm_validate(video_path: str, task_description: str) -> dict:
    # Extract 5 representative frames
    frames = extract_key_frames(video_path, num_frames=5)

    # Convert to base64
    frame_images = [encode_image(f) for f in frames]

    # Query GPT-4V / Claude
    prompt = f"""
    Task: {task_description}

    Analyze these video frames and answer:
    1. Does this video show the described task being performed? (Yes/No)
    2. Quality score (0-100): How well is the task demonstrated?
    3. Issues: List any problems (e.g., "hands not visible", "poor lighting")
    4. Usability for robotics training: Can a robot learn from this? (Yes/Partial/No)

    Respond in JSON format.
    """

    response = await anthropic.messages.create(
        model="claude-sonnet-4-5-20250929",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                *[{"type": "image", "source": {"type": "base64", "data": img}}
                  for img in frame_images]
            ]
        }]
    )

    return parse_json_response(response)
```

### Scoring System

```python
def calculate_final_score(
    technical_checks: dict,
    content_checks: dict,
    llm_analysis: dict
) -> dict:
    # Weighted scoring
    weights = {
        "technical": 0.2,
        "content_relevance": 0.4,
        "llm_quality": 0.3,
        "llm_usability": 0.1
    }

    technical_score = sum(technical_checks.values()) / len(technical_checks) * 100
    content_score = content_checks["relevance_score"]
    llm_quality_score = llm_analysis["quality_score"]
    llm_usability_score = {"Yes": 100, "Partial": 50, "No": 0}[llm_analysis["usability"]]

    final_score = (
        technical_score * weights["technical"] +
        content_score * weights["content_relevance"] +
        llm_quality_score * weights["llm_quality"] +
        llm_usability_score * weights["llm_usability"]
    )

    # Decision thresholds
    if final_score >= 70:
        decision = "APPROVE"
    elif final_score >= 50:
        decision = "HUMAN_REVIEW"  # Edge case
    else:
        decision = "REJECT"

    return {
        "score": final_score,
        "decision": decision,
        "breakdown": {
            "technical": technical_score,
            "content": content_score,
            "llm_quality": llm_quality_score,
            "llm_usability": llm_usability_score
        },
        "confidence": min(
            content_checks["confidence"],
            llm_analysis.get("confidence", 0.9)
        )
    }
```

---

## Storage Architecture

### IPFS (Hot Storage)

**Purpose:** Fast retrieval during evaluation period

**Implementation:**
```typescript
import { create } from 'ipfs-http-client';
import { Web3Storage } from 'web3.storage';

// Option 1: Self-hosted IPFS node
const ipfs = create({
  host: 'ipfs.dataforge.io',
  port: 5001,
  protocol: 'https'
});

// Option 2: Web3.Storage (recommended for MVP)
const web3storage = new Web3Storage({
  token: process.env.WEB3_STORAGE_TOKEN
});

async function uploadToIPFS(filePath: string): Promise<string> {
  const file = await File.fromFilePath(filePath);
  const cid = await web3storage.put([file]);
  return cid; // Returns IPFS hash
}

async function retrieveFromIPFS(cid: string): Promise<Blob> {
  const res = await web3storage.get(cid);
  const files = await res.files();
  return files[0];
}
```

**Gateway URLs:**
- `https://ipfs.io/ipfs/{cid}` (public gateway)
- `https://cloudflare-ipfs.com/ipfs/{cid}` (faster)
- `https://gateway.dataforge.io/ipfs/{cid}` (custom domain)

### Arweave (Permanent Storage)

**Purpose:** Permanent, immutable storage with pay-once model

**Implementation:**
```typescript
import Bundlr from '@bundlr-network/client';

const bundlr = new Bundlr(
  'https://node1.bundlr.network',
  'solana',
  privateKey,
  { providerUrl: process.env.SOLANA_RPC }
);

async function uploadToArweave(filePath: string): Promise<string> {
  // Fund bundler if needed
  const price = await bundlr.getPrice(fileSize);
  await bundlr.fund(price);

  // Upload file
  const tx = await bundlr.uploadFile(filePath, {
    tags: [
      { name: 'Content-Type', value: 'video/mp4' },
      { name: 'App-Name', value: 'DataForge' },
      { name: 'Bounty-ID', value: bountyId.toString() },
    ]
  });

  return tx.id; // Arweave transaction ID
}

// Access via: https://arweave.net/{txId}
```

**Cost Estimation:**
- 1GB video ≈ 0.007 AR ≈ $0.15 (one-time payment, stored forever)
- IPFS via Web3.Storage: Free tier 1TB, then $5/TB/month

### Metadata Storage

**On-Chain (Solana):**
```json
{
  "submission_id": 123,
  "ipfs_hash": "Qm...",
  "arweave_tx": "abc...",
  "metadata_uri": "https://metadata.dataforge.io/123.json"
}
```

**Off-Chain Metadata (IPFS):**
```json
{
  "name": "Household - Folding Laundry #123",
  "description": "Video demonstrating laundry folding in natural home environment",
  "video": "ipfs://Qm.../video.mp4",
  "thumbnail": "ipfs://Qm.../thumb.jpg",
  "properties": {
    "duration": 45.3,
    "resolution": "1920x1080",
    "fps": 30,
    "codec": "h264",
    "file_size": 87634521,
    "recorded_at": "2025-10-20T14:30:00Z",
    "location": {
      "country": "PT",
      "city": "Lisbon",
      "environment": "indoor"
    },
    "device": {
      "model": "iPhone 15 Pro",
      "camera": "48MP main",
      "os": "iOS 17.5"
    },
    "quality_metrics": {
      "overall_score": 87,
      "lighting_score": 92,
      "stability_score": 85,
      "relevance_score": 89
    },
    "tags": ["laundry", "folding", "clothing", "indoor", "household"],
    "task_category": "household_manipulation"
  },
  "rights": {
    "license": "single-use",
    "commercial_use": true,
    "modification": true,
    "attribution_required": false
  },
  "contributors": [
    {
      "wallet": "7xK...",
      "share": 10000  // basis points (100%)
    }
  ]
}
```

---

## Deployment & DevOps

### Development Environments

**Local Development:**
```bash
# Solana
solana-test-validator

# Backend
docker-compose up -d  # PostgreSQL, Redis
npm run dev

# Frontend
npm run dev  # Next.js on localhost:3000

# Mobile
npx react-native start
npx react-native run-android  # or run-ios
```

**Staging (Solana Testnet):**
- URL: `https://staging.dataforge.io`
- Solana RPC: Testnet
- Database: Supabase staging instance
- Storage: Web3.Storage testnet

**Production (Solana Mainnet):**
- URL: `https://dataforge.io`
- Solana RPC: Mainnet (Helius/Quicknode)
- Database: Supabase production + read replicas
- Storage: Web3.Storage + Arweave
- CDN: Cloudflare

### Infrastructure

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dataforge
      POSTGRES_USER: dataforge
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://dataforge:${DB_PASSWORD}@postgres:5432/dataforge
      REDIS_URL: redis://redis:6379
      SOLANA_RPC_URL: ${SOLANA_RPC_URL}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    ports:
      - "3001:3001"

  ml_validator:
    build: ./ml-validator
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    deploy:
      resources:
        reservations:
          devices:
            - capabilities: [gpu]

volumes:
  postgres_data:
  redis_data:
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy-contracts:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy Solana Programs
        run: |
          anchor build
          anchor deploy --provider.cluster mainnet

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        run: vercel --prod
```

---

## Security Considerations

### Smart Contract Security

1. **Reentrancy Protection:**
   - Use Anchor's built-in checks
   - Mutex locks on critical sections

2. **Access Control:**
   - Owner-only functions for admin
   - Signature verification for all state changes

3. **Integer Overflow/Underflow:**
   - Rust's type safety prevents most issues
   - Use checked arithmetic for critical calculations

4. **Audit Plan:**
   - Phase 1: Self-audit + automated tools (Soteria, Sec3)
   - Phase 2: Community audit (pay bug bounties)
   - Phase 3: Professional audit before mainnet (budget $15-30K)

### API Security

1. **Authentication:**
   - JWT with short expiration (24h)
   - Wallet signature verification
   - Rate limiting per IP/wallet

2. **Input Validation:**
   - Schema validation on all inputs (Zod)
   - File upload size limits (max 500MB)
   - MIME type verification

3. **Data Protection:**
   - Encrypt sensitive data at rest
   - HTTPS only (TLS 1.3)
   - No PII in logs

4. **DDoS Protection:**
   - Cloudflare in front of all services
   - Rate limiting: 100 req/min per IP
   - Exponential backoff for failures

### Video Content Security

1. **Malware Scanning:**
   - Scan all uploads with ClamAV
   - Quarantine suspicious files

2. **Content Moderation:**
   - AI pre-screening for NSFW content
   - Human review flagging system
   - Takedown request workflow

3. **Copyright Protection:**
   - Watermark detection (prevent stolen content)
   - Contributor attestation: "I own rights to this video"
   - DMCA takedown process

---

## MVP Feature Scope

### Phase 1: Core MVP (Months 1-3)

**Must Have:**
- [ ] Solana smart contracts (Bounty + Escrow programs)
- [ ] React Native app (record, upload, view earnings)
- [ ] Basic bounty creation (web app)
- [ ] IPFS upload integration
- [ ] Simple AI validation (technical checks only)
- [ ] Wallet connection (Phantom)
- [ ] Payment flow (USDC on devnet)
- [ ] PostgreSQL database + API

**Nice to Have:**
- [ ] Arweave permanent storage
- [ ] Advanced AI validation (GPT-4V)
- [ ] Reputation system
- [ ] Referral program

**Explicitly Out of Scope:**
- Dataset NFT minting (Phase 2)
- AR glasses support (Phase 3)
- DAO governance (Phase 3)
- Secondary marketplace (Phase 2)

### Phase 2: Growth Features (Months 4-6)

- [ ] Dataset NFT minting + marketplace
- [ ] Human review system
- [ ] Advanced search/filters
- [ ] Analytics dashboard
- [ ] Email notifications
- [ ] Mobile app v2 (offline mode, gamification)

### Phase 3: Scale & Innovation (Months 7-12)

- [ ] AR glasses integration (Meta, Apple)
- [ ] Multi-chain support (Polygon, Base)
- [ ] Data labeling marketplace
- [ ] API for enterprises
- [ ] DAO governance token
- [ ] Staking/rewards program

---

## Success Metrics

### MVP Success Criteria (Month 3)

- **Contributors:** 50+ active users
- **Videos:** 1,000+ submitted, 700+ approved
- **Buyers:** 2+ paying customers
- **Revenue:** $1,000+ total volume
- **Quality:** >70% acceptance rate
- **Performance:** <10s upload time for 30s video

### Growth Targets (Month 12)

- **Contributors:** 5,000+ active users
- **Videos:** 100,000+ approved
- **Buyers:** 50+ companies
- **Revenue:** $100K+ monthly volume
- **Retention:** >40% monthly active contributors
- **Quality:** >80% acceptance rate

### North Star Metrics

- **Contributor Lifetime Value:** Total earnings per contributor
- **Video Supply Growth Rate:** Week-over-week new videos
- **Buyer Repeat Purchase Rate:** % of buyers who return
- **Platform Take Rate:** % commission of total volume

---

## Open Questions & Decisions Needed

1. **Token Economics:** Should we launch a governance/utility token? If yes, when?
2. **Pricing Strategy:** Fixed pricing vs. dynamic auction-based?
3. **Geographic Focus:** Start globally or focus on specific regions?
4. **Quality Thresholds:** What's the minimum acceptable quality score?
5. **Dispute Resolution:** DAO voting or centralized admin initially?
6. **KYC Requirements:** Required for all users or only high earners?
7. **Data Retention:** How long to keep rejected videos?
8. **Exclusivity:** Can contributors submit same video to multiple bounties?

---

## Next Steps for Implementation

### Week 1: Setup & Planning
1. Set up GitHub organization + repositories
2. Initialize Anchor project for smart contracts
3. Set up development environments (Solana devnet, PostgreSQL)
4. Create detailed task breakdown in GitHub Projects
5. Design database schema (Prisma)

### Week 2: Smart Contracts
1. Implement Bounty Program (create, update, close)
2. Implement Escrow Program (submit, approve, reject)
3. Write unit tests for all instructions
4. Deploy to devnet

### Week 3: Backend API
1. Set up Express.js + TypeScript
2. Implement authentication (JWT + wallet signature)
3. Build REST endpoints for bounties + submissions
4. Set up PostgreSQL with Prisma ORM

### Week 4: Mobile App Foundation
1. Initialize React Native project
2. Set up navigation (React Navigation)
3. Implement wallet connection (Solana Mobile SDK)
4. Build camera screen with basic recording

### Week 5: Upload Pipeline
1. Integrate Web3.Storage for IPFS
2. Build video compression flow
3. Create upload progress UI
4. Test end-to-end video submission

### Week 6: AI Validation
1. Set up Python FastAPI service
2. Implement technical quality checks (FFmpeg)
3. Add basic content validation
4. Connect to backend API

### Week 7: Web App MVP
1. Build Next.js landing page
2. Create bounty browsing page
3. Implement wallet connect (Solana Wallet Adapter)
4. Build bounty creation form

### Week 8: Testing & Launch
1. End-to-end testing
2. Bug fixes
3. Deploy to staging
4. Recruit 10 beta testers
5. Collect feedback & iterate

---

## Resources & Documentation

### Technical References
- **Solana Docs:** https://docs.solana.com
- **Anchor Framework:** https://www.anchor-lang.com
- **Solana Cookbook:** https://solanacookbook.com
- **IPFS Docs:** https://docs.ipfs.tech
- **Arweave Docs:** https://docs.arweave.org

### Similar Projects (Inspiration)
- **Scale AI:** https://scale.com (data labeling, not collection)
- **Hivemapper:** https://hivemapper.com (dash cam data collection)
- **DIMO:** https://dimo.zone (vehicle data marketplace)
- **Ocean Protocol:** https://oceanprotocol.com (data marketplace architecture)

### Developer Communities
- **Solana Discord:** https://discord.gg/solana
- **Anchor Discord:** https://discord.gg/anchor
- **/r/solana:** https://reddit.com/r/solana
- **Superteam:** https://superteam.fun (Solana ecosystem)

---

## Contact & Support

**Project Lead:** Artur Shirokov
**Email:** artur.wiseman@icloud.com
**GitHub:** https://github.com/AhegaoBurger
**Location:** Lisbon, Portugal

---

*This specification is a living document. Update as implementation progresses and requirements evolve.*
