use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("CJpjA6x7h3GZZzDnzFggjrV6JG7UVhsX5kCp7N95UDDG");

#[program]
pub mod unimake_backend {
    use super::*;

    // ============================================================================
    // BOUNTY PROGRAM INSTRUCTIONS
    // ============================================================================

    /// Create a new bounty with reward pool
    pub fn create_bounty(
        ctx: Context<CreateBounty>,
        bounty_id: String,
        reward_per_video: u64,
        total_pool: u64,
        videos_target: u32,
        task_description: String,
        min_duration_secs: u32,
        min_resolution: String,
        min_fps: u32,
        expires_at: i64,
    ) -> Result<()> {
        require!(total_pool > 0, ErrorCode::InvalidAmount);
        require!(videos_target > 0, ErrorCode::InvalidTarget);
        require!(reward_per_video > 0, ErrorCode::InvalidAmount);
        require!(
            total_pool >= reward_per_video * videos_target as u64,
            ErrorCode::InsufficientPool
        );

        // Transfer SOL from authority to bounty pool PDA first
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.bounty_pool.to_account_info(),
            },
        );
        transfer(transfer_ctx, total_pool)?;

        // Now initialize the bounty account
        let bounty = &mut ctx.accounts.bounty_pool;
        bounty.authority = ctx.accounts.authority.key();
        bounty.bounty_id = bounty_id.clone();
        bounty.task_description = task_description;
        bounty.reward_per_video = reward_per_video;
        bounty.total_pool = total_pool;
        bounty.remaining_pool = total_pool;
        bounty.videos_target = videos_target;
        bounty.videos_collected = 0;
        bounty.status = BountyStatus::Active;
        bounty.created_at = Clock::get()?.unix_timestamp;
        bounty.expires_at = expires_at;
        bounty.requirements = Requirements {
            min_duration_secs,
            min_resolution,
            min_fps,
        };

        emit!(BountyCreated {
            bounty_id,
            authority: bounty.authority,
            total_pool,
            videos_target,
        });

        Ok(())
    }

    /// Pause an active bounty
    pub fn pause_bounty(ctx: Context<UpdateBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_pool;
        require!(
            bounty.status == BountyStatus::Active,
            ErrorCode::InvalidStatus
        );
        bounty.status = BountyStatus::Paused;

        emit!(BountyStatusChanged {
            bounty_id: bounty.bounty_id.clone(),
            new_status: BountyStatus::Paused,
        });

        Ok(())
    }

    /// Resume a paused bounty
    pub fn resume_bounty(ctx: Context<UpdateBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_pool;
        require!(
            bounty.status == BountyStatus::Paused,
            ErrorCode::InvalidStatus
        );
        bounty.status = BountyStatus::Active;

        emit!(BountyStatusChanged {
            bounty_id: bounty.bounty_id.clone(),
            new_status: BountyStatus::Active,
        });

        Ok(())
    }

    /// Complete a bounty
    pub fn complete_bounty(ctx: Context<UpdateBounty>) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_pool;
        bounty.status = BountyStatus::Completed;

        emit!(BountyStatusChanged {
            bounty_id: bounty.bounty_id.clone(),
            new_status: BountyStatus::Completed,
        });

        Ok(())
    }

    /// Cancel bounty and return remaining funds
    pub fn cancel_bounty(ctx: Context<CancelBounty>) -> Result<()> {
        let bounty = &ctx.accounts.bounty_pool;
        require!(
            bounty.status == BountyStatus::Active || bounty.status == BountyStatus::Paused,
            ErrorCode::InvalidStatus
        );

        let remaining = bounty.remaining_pool;

        // Transfer remaining pool back to authority
        // Can't use system program transfer from PDA with data, must manipulate lamports directly
        **ctx
            .accounts
            .bounty_pool
            .to_account_info()
            .try_borrow_mut_lamports()? -= remaining;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += remaining;

        let bounty = &mut ctx.accounts.bounty_pool;
        bounty.status = BountyStatus::Cancelled;
        bounty.remaining_pool = 0;

        emit!(BountyStatusChanged {
            bounty_id: bounty.bounty_id.clone(),
            new_status: BountyStatus::Cancelled,
        });

        Ok(())
    }

    // ============================================================================
    // ESCROW PROGRAM INSTRUCTIONS
    // ============================================================================

    /// Submit a video for review (creates escrow)
    pub fn submit_video(
        ctx: Context<SubmitVideo>,
        submission_id: String,
        ipfs_hash: String,
        arweave_tx: String,
        metadata_uri: String,
    ) -> Result<()> {
        let bounty = &mut ctx.accounts.bounty_pool;

        require!(
            bounty.status == BountyStatus::Active,
            ErrorCode::BountyNotActive
        );
        require!(
            bounty.videos_collected < bounty.videos_target,
            ErrorCode::BountyFull
        );
        require!(
            bounty.remaining_pool >= bounty.reward_per_video,
            ErrorCode::InsufficientPool
        );
        require!(
            Clock::get()?.unix_timestamp < bounty.expires_at,
            ErrorCode::BountyExpired
        );

        let submission = &mut ctx.accounts.submission;
        submission.submission_id = submission_id;
        submission.contributor = ctx.accounts.contributor.key();
        submission.bounty_id = bounty.bounty_id.clone();
        submission.ipfs_hash = ipfs_hash;
        submission.arweave_tx = arweave_tx;
        submission.metadata_uri = metadata_uri;
        submission.submission_timestamp = Clock::get()?.unix_timestamp;
        submission.status = SubmissionStatus::Pending;
        submission.escrow_amount = bounty.reward_per_video;
        submission.quality_score = 0;
        submission.bump = ctx.bumps.submission;

        // Reserve funds in the bounty pool
        bounty.remaining_pool = bounty
            .remaining_pool
            .checked_sub(bounty.reward_per_video)
            .ok_or(ErrorCode::InsufficientPool)?;

        emit!(VideoSubmitted {
            submission_id: submission.submission_id.clone(),
            bounty_id: bounty.bounty_id.clone(),
            contributor: submission.contributor,
            escrow_amount: submission.escrow_amount,
        });

        Ok(())
    }

    /// Approve a submission and release payment
    pub fn approve_submission(ctx: Context<ReviewSubmission>, quality_score: u8) -> Result<()> {
        let submission = &mut ctx.accounts.submission;
        require!(
            submission.status == SubmissionStatus::Pending,
            ErrorCode::InvalidStatus
        );

        submission.status = SubmissionStatus::Approved;
        submission.quality_score = quality_score;

        let reward = submission.escrow_amount;

        // Transfer reward from bounty pool to contributor
        // Can't use system program transfer from PDA with data, must manipulate lamports directly
        **ctx
            .accounts
            .bounty_pool
            .to_account_info()
            .try_borrow_mut_lamports()? -= reward;
        **ctx
            .accounts
            .contributor
            .to_account_info()
            .try_borrow_mut_lamports()? += reward;

        // Update counters
        let bounty = &mut ctx.accounts.bounty_pool;
        bounty.videos_collected += 1;

        // Update contributor reputation
        let profile = &mut ctx.accounts.contributor_profile;
        profile.total_submissions += 1;
        profile.accepted_submissions += 1;
        profile.total_earnings = profile
            .total_earnings
            .checked_add(reward)
            .ok_or(ErrorCode::Overflow)?;

        // Recalculate reputation score
        profile.recalculate_reputation(quality_score);

        emit!(SubmissionApproved {
            submission_id: submission.submission_id.clone(),
            contributor: submission.contributor,
            reward,
            quality_score,
        });

        Ok(())
    }

    /// Reject a submission and return funds to pool
    pub fn reject_submission(ctx: Context<ReviewSubmission>) -> Result<()> {
        let submission = &mut ctx.accounts.submission;
        require!(
            submission.status == SubmissionStatus::Pending,
            ErrorCode::InvalidStatus
        );

        submission.status = SubmissionStatus::Rejected;

        // Return funds to bounty pool available balance
        let bounty = &mut ctx.accounts.bounty_pool;
        bounty.remaining_pool = bounty
            .remaining_pool
            .checked_add(submission.escrow_amount)
            .ok_or(ErrorCode::Overflow)?;

        // Update contributor reputation
        let profile = &mut ctx.accounts.contributor_profile;
        profile.total_submissions += 1;
        profile.rejected_submissions += 1;
        profile.recalculate_reputation(0);

        emit!(SubmissionRejected {
            submission_id: submission.submission_id.clone(),
            contributor: submission.contributor,
        });

        Ok(())
    }

    // ============================================================================
    // REPUTATION PROGRAM INSTRUCTIONS
    // ============================================================================

    /// Initialize a contributor profile
    pub fn initialize_profile(ctx: Context<InitializeProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.contributor_profile;
        profile.wallet = ctx.accounts.contributor.key();
        profile.total_submissions = 0;
        profile.accepted_submissions = 0;
        profile.rejected_submissions = 0;
        profile.average_quality_score = 0;
        profile.total_earnings = 0;
        profile.reputation_score = 500; // Start at neutral 500
        profile.join_date = Clock::get()?.unix_timestamp;
        profile.last_active = Clock::get()?.unix_timestamp;
        profile.bump = ctx.bumps.contributor_profile;

        emit!(ProfileCreated {
            wallet: profile.wallet,
            reputation_score: profile.reputation_score,
        });

        Ok(())
    }

    /// Award a badge to a contributor
    pub fn award_badge(ctx: Context<AwardBadge>, badge_type: BadgeType) -> Result<()> {
        let profile = &mut ctx.accounts.contributor_profile;

        // Check if badge already exists
        for badge in &profile.badges {
            require!(
                badge.badge_type != badge_type,
                ErrorCode::BadgeAlreadyEarned
            );
        }

        require!(profile.badges.len() < 10, ErrorCode::TooManyBadges);

        let badge = Badge {
            badge_type: badge_type.clone(),
            earned_at: Clock::get()?.unix_timestamp,
        };

        profile.badges.push(badge);

        emit!(BadgeAwarded {
            wallet: profile.wallet,
            badge_type,
        });

        Ok(())
    }

    // ============================================================================
    // NFT/DATASET PROGRAM INSTRUCTIONS
    // ============================================================================

    /// Create a dataset NFT from approved submissions
    pub fn create_dataset(
        ctx: Context<CreateDataset>,
        dataset_id: String,
        license_type: LicenseType,
        price: u64,
        royalty_percentage: u8,
    ) -> Result<()> {
        require!(royalty_percentage <= 100, ErrorCode::InvalidRoyalty);

        let dataset = &mut ctx.accounts.dataset_nft;
        dataset.dataset_id = dataset_id;
        dataset.license_type = license_type;
        dataset.creator = ctx.accounts.creator.key();
        dataset.price = price;
        dataset.royalty_percentage = royalty_percentage;
        dataset.created_at = Clock::get()?.unix_timestamp;
        dataset.total_sales = 0;
        dataset.bump = ctx.bumps.dataset_nft;

        emit!(DatasetCreated {
            dataset_id: dataset.dataset_id.clone(),
            creator: dataset.creator,
            price,
        });

        Ok(())
    }

    /// Purchase a dataset NFT
    pub fn purchase_dataset(ctx: Context<PurchaseDataset>) -> Result<()> {
        let dataset = &ctx.accounts.dataset_nft;
        let price = dataset.price;

        // Transfer payment from buyer to creator
        let transfer_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
        );
        transfer(transfer_ctx, price)?;

        let dataset = &mut ctx.accounts.dataset_nft;
        dataset.total_sales += 1;

        emit!(DatasetPurchased {
            dataset_id: dataset.dataset_id.clone(),
            buyer: ctx.accounts.buyer.key(),
            price,
        });

        Ok(())
    }
}

// ============================================================================
// ACCOUNT STRUCTURES
// ============================================================================

#[derive(Accounts)]
#[instruction(bounty_id: String)]
pub struct CreateBounty<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BountyPool::INIT_SPACE,
        seeds = [b"bounty", bounty_id.as_bytes()],
        bump
    )]
    pub bounty_pool: Account<'info, BountyPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBounty<'info> {
    #[account(
        mut,
        seeds = [b"bounty", bounty_pool.bounty_id.as_bytes()],
        bump,
        has_one = authority
    )]
    pub bounty_pool: Account<'info, BountyPool>,

    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct CancelBounty<'info> {
    #[account(
        mut,
        seeds = [b"bounty", bounty_pool.bounty_id.as_bytes()],
        bump,
        has_one = authority
    )]
    pub bounty_pool: Account<'info, BountyPool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(submission_id: String)]
pub struct SubmitVideo<'info> {
    #[account(
        init,
        payer = contributor,
        space = 8 + VideoSubmission::INIT_SPACE,
        seeds = [b"submission", submission_id.as_bytes()],
        bump
    )]
    pub submission: Account<'info, VideoSubmission>,

    #[account(
        mut,
        seeds = [b"bounty", bounty_pool.bounty_id.as_bytes()],
        bump
    )]
    pub bounty_pool: Account<'info, BountyPool>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReviewSubmission<'info> {
    #[account(
        mut,
        seeds = [b"submission", submission.submission_id.as_bytes()],
        bump = submission.bump
    )]
    pub submission: Account<'info, VideoSubmission>,

    #[account(
        mut,
        seeds = [b"bounty", bounty_pool.bounty_id.as_bytes()],
        bump,
        has_one = authority
    )]
    pub bounty_pool: Account<'info, BountyPool>,

    #[account(
        mut,
        seeds = [b"profile", contributor.key().as_ref()],
        bump = contributor_profile.bump
    )]
    pub contributor_profile: Account<'info, ContributorProfile>,

    /// CHECK: Contributor receives payment
    #[account(mut)]
    pub contributor: AccountInfo<'info>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeProfile<'info> {
    #[account(
        init,
        payer = contributor,
        space = 8 + ContributorProfile::INIT_SPACE,
        seeds = [b"profile", contributor.key().as_ref()],
        bump
    )]
    pub contributor_profile: Account<'info, ContributorProfile>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AwardBadge<'info> {
    #[account(
        mut,
        seeds = [b"profile", contributor_profile.wallet.as_ref()],
        bump = contributor_profile.bump
    )]
    pub contributor_profile: Account<'info, ContributorProfile>,

    /// CHECK: Admin or automated system
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(dataset_id: String)]
pub struct CreateDataset<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + DatasetNFT::INIT_SPACE,
        seeds = [b"dataset", dataset_id.as_bytes()],
        bump
    )]
    pub dataset_nft: Account<'info, DatasetNFT>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseDataset<'info> {
    #[account(
        mut,
        seeds = [b"dataset", dataset_nft.dataset_id.as_bytes()],
        bump = dataset_nft.bump
    )]
    pub dataset_nft: Account<'info, DatasetNFT>,

    #[account(mut)]
    pub buyer: Signer<'info>,

    /// CHECK: Creator receives payment
    #[account(mut)]
    pub creator: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct BountyPool {
    pub authority: Pubkey,
    #[max_len(50)]
    pub bounty_id: String,
    #[max_len(500)]
    pub task_description: String,
    pub requirements: Requirements,
    pub reward_per_video: u64,
    pub total_pool: u64,
    pub remaining_pool: u64,
    pub videos_target: u32,
    pub videos_collected: u32,
    pub status: BountyStatus,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Requirements {
    pub min_duration_secs: u32,
    #[max_len(20)]
    pub min_resolution: String,
    pub min_fps: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BountyStatus {
    Active,
    Paused,
    Completed,
    Cancelled,
}

#[account]
#[derive(InitSpace)]
pub struct VideoSubmission {
    #[max_len(50)]
    pub submission_id: String,
    pub contributor: Pubkey,
    #[max_len(50)]
    pub bounty_id: String,
    #[max_len(100)]
    pub ipfs_hash: String,
    #[max_len(100)]
    pub arweave_tx: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub submission_timestamp: i64,
    pub status: SubmissionStatus,
    pub escrow_amount: u64,
    pub quality_score: u8,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum SubmissionStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Disputed,
}

#[account]
#[derive(InitSpace)]
pub struct ContributorProfile {
    pub wallet: Pubkey,
    pub total_submissions: u32,
    pub accepted_submissions: u32,
    pub rejected_submissions: u32,
    pub average_quality_score: u8,
    pub total_earnings: u64,
    pub reputation_score: u16, // 0-1000
    #[max_len(10)]
    pub badges: Vec<Badge>,
    pub join_date: i64,
    pub last_active: i64,
    pub bump: u8,
}

impl ContributorProfile {
    pub fn recalculate_reputation(&mut self, new_quality_score: u8) {
        // Calculate acceptance rate (0-100)
        let acceptance_rate = if self.total_submissions > 0 {
            (self.accepted_submissions * 100) / self.total_submissions
        } else {
            0
        };

        // Update average quality score
        if new_quality_score > 0 && self.accepted_submissions > 0 {
            let total_quality = (self.average_quality_score as u32
                * (self.accepted_submissions - 1) as u32)
                + new_quality_score as u32;
            self.average_quality_score = (total_quality / self.accepted_submissions as u32) as u8;
        }

        // Calculate reputation: base 500, +/- based on performance
        // Acceptance rate weight: 50%
        // Quality score weight: 50%
        let acceptance_points = (acceptance_rate as u16 * 5) / 2; // Max 250
        let quality_points = (self.average_quality_score as u16 * 250) / 100; // Max 250

        self.reputation_score = 500 + acceptance_points + quality_points;

        // Cap at 1000
        if self.reputation_score > 1000 {
            self.reputation_score = 1000;
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct Badge {
    pub badge_type: BadgeType,
    pub earned_at: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum BadgeType {
    FirstVideo,
    HundredVideos,
    ThousandVideos,
    HighQuality,
    EarlyAdopter,
    CategoryExpert,
}

#[account]
#[derive(InitSpace)]
pub struct DatasetNFT {
    #[max_len(50)]
    pub dataset_id: String,
    pub license_type: LicenseType,
    pub creator: Pubkey,
    pub price: u64,
    pub royalty_percentage: u8,
    pub created_at: i64,
    pub total_sales: u32,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum LicenseType {
    SingleUse,
    Unlimited,
    Exclusive,
    CommercialResale,
}

// ============================================================================
// EVENTS
// ============================================================================

#[event]
pub struct BountyCreated {
    pub bounty_id: String,
    pub authority: Pubkey,
    pub total_pool: u64,
    pub videos_target: u32,
}

#[event]
pub struct BountyStatusChanged {
    pub bounty_id: String,
    pub new_status: BountyStatus,
}

#[event]
pub struct VideoSubmitted {
    pub submission_id: String,
    pub bounty_id: String,
    pub contributor: Pubkey,
    pub escrow_amount: u64,
}

#[event]
pub struct SubmissionApproved {
    pub submission_id: String,
    pub contributor: Pubkey,
    pub reward: u64,
    pub quality_score: u8,
}

#[event]
pub struct SubmissionRejected {
    pub submission_id: String,
    pub contributor: Pubkey,
}

#[event]
pub struct ProfileCreated {
    pub wallet: Pubkey,
    pub reputation_score: u16,
}

#[event]
pub struct BadgeAwarded {
    pub wallet: Pubkey,
    pub badge_type: BadgeType,
}

#[event]
pub struct DatasetCreated {
    pub dataset_id: String,
    pub creator: Pubkey,
    pub price: u64,
}

#[event]
pub struct DatasetPurchased {
    pub dataset_id: String,
    pub buyer: Pubkey,
    pub price: u64,
}

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid amount provided")]
    InvalidAmount,

    #[msg("Invalid target count")]
    InvalidTarget,

    #[msg("Insufficient pool funds")]
    InsufficientPool,

    #[msg("Invalid status for this operation")]
    InvalidStatus,

    #[msg("Bounty is not active")]
    BountyNotActive,

    #[msg("Bounty is full")]
    BountyFull,

    #[msg("Bounty has expired")]
    BountyExpired,

    #[msg("Arithmetic overflow")]
    Overflow,

    #[msg("Badge already earned")]
    BadgeAlreadyEarned,

    #[msg("Too many badges")]
    TooManyBadges,

    #[msg("Invalid royalty percentage")]
    InvalidRoyalty,
}
