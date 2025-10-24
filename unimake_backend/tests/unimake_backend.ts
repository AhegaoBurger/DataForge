import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { UnimakeBackend } from "../target/types/unimake_backend";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("TerraTrain Smart Contracts", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.UnimakeBackend as Program<UnimakeBackend>;

  // Test accounts
  const authority = provider.wallet as anchor.Wallet;
  const contributor = Keypair.generate();
  const buyer = Keypair.generate();

  // Test data
  const bountyId = "bounty-test-001";
  const submissionId = "submission-test-001";
  const datasetId = "dataset-test-001";

  // PDAs
  let bountyPda: PublicKey;
  let submissionPda: PublicKey;
  let contributorProfilePda: PublicKey;
  let datasetPda: PublicKey;

  before(async () => {
    // Airdrop SOL to test accounts
    const airdropSig1 = await provider.connection.requestAirdrop(
      contributor.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig1);

    const airdropSig2 = await provider.connection.requestAirdrop(
      buyer.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig2);

    // Calculate PDAs
    [bountyPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bounty"), Buffer.from(bountyId)],
      program.programId
    );

    [submissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("submission"), Buffer.from(submissionId)],
      program.programId
    );

    [contributorProfilePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("profile"), contributor.publicKey.toBuffer()],
      program.programId
    );

    [datasetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("dataset"), Buffer.from(datasetId)],
      program.programId
    );
  });

  // ============================================================================
  // BOUNTY PROGRAM TESTS
  // ============================================================================

  describe("Bounty Program", () => {
    it("Creates a new bounty with reward pool", async () => {
      const rewardPerVideo = new BN(0.1 * LAMPORTS_PER_SOL);
      const videosTarget = 10;
      const totalPool = new BN(1 * LAMPORTS_PER_SOL);
      const expiresAt = new BN(Date.now() / 1000 + 86400 * 30); // 30 days from now

      const tx = await program.methods
        .createBounty(
          bountyId,
          rewardPerVideo,
          totalPool,
          videosTarget,
          "Record a video of making coffee",
          30, // min_duration_secs
          "720p", // min_resolution
          30, // min_fps
          expiresAt
        )
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Create bounty transaction:", tx);

      // Fetch and verify bounty account
      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);

      assert.equal(bountyAccount.bountyId, bountyId);
      assert.equal(
        bountyAccount.authority.toString(),
        authority.publicKey.toString()
      );
      assert.equal(
        bountyAccount.rewardPerVideo.toString(),
        rewardPerVideo.toString()
      );
      assert.equal(bountyAccount.totalPool.toString(), totalPool.toString());
      assert.equal(
        bountyAccount.remainingPool.toString(),
        totalPool.toString()
      );
      assert.equal(bountyAccount.videosTarget, videosTarget);
      assert.equal(bountyAccount.videosCollected, 0);
      assert.deepEqual(bountyAccount.status, { active: {} });
      assert.equal(bountyAccount.requirements.minDurationSecs, 30);
      assert.equal(bountyAccount.requirements.minResolution, "720p");
      assert.equal(bountyAccount.requirements.minFps, 30);
    });

    it("Pauses an active bounty", async () => {
      await program.methods
        .pauseBounty()
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
        })
        .rpc();

      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);
      assert.deepEqual(bountyAccount.status, { paused: {} });
    });

    it("Resumes a paused bounty", async () => {
      await program.methods
        .resumeBounty()
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
        })
        .rpc();

      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);
      assert.deepEqual(bountyAccount.status, { active: {} });
    });

    it("Fails to create bounty with insufficient pool", async () => {
      const insufficientBountyId = "bounty-insufficient";
      const [insufficientBountyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bounty"), Buffer.from(insufficientBountyId)],
        program.programId
      );

      try {
        await program.methods
          .createBounty(
            insufficientBountyId,
            new BN(0.2 * LAMPORTS_PER_SOL), // reward per video
            new BN(0.5 * LAMPORTS_PER_SOL), // total pool (insufficient for 10 videos)
            10, // videos target
            "Test bounty",
            30,
            "720p",
            30,
            new BN(Date.now() / 1000 + 86400)
          )
          .accountsPartial({
            bountyPool: insufficientBountyPda,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "InsufficientPool");
      }
    });
  });

  // ============================================================================
  // REPUTATION PROGRAM TESTS
  // ============================================================================

  describe("Reputation Program", () => {
    it("Initializes a contributor profile", async () => {
      await program.methods
        .initializeProfile()
        .accountsPartial({
          contributorProfile: contributorProfilePda,
          contributor: contributor.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();

      const profile = await program.account.contributorProfile.fetch(
        contributorProfilePda
      );

      assert.equal(profile.wallet.toString(), contributor.publicKey.toString());
      assert.equal(profile.totalSubmissions, 0);
      assert.equal(profile.acceptedSubmissions, 0);
      assert.equal(profile.rejectedSubmissions, 0);
      assert.equal(profile.averageQualityScore, 0);
      assert.equal(profile.totalEarnings.toString(), "0");
      assert.equal(profile.reputationScore, 500); // Neutral start
      assert.equal(profile.badges.length, 0);
    });

    it("Awards a badge to a contributor", async () => {
      await program.methods
        .awardBadge({ firstVideo: {} })
        .accountsPartial({
          contributorProfile: contributorProfilePda,
          authority: authority.publicKey,
        })
        .rpc();

      const profile = await program.account.contributorProfile.fetch(
        contributorProfilePda
      );
      assert.equal(profile.badges.length, 1);
      assert.deepEqual(profile.badges[0].badgeType, { firstVideo: {} });
    });

    it("Prevents duplicate badge awards", async () => {
      try {
        await program.methods
          .awardBadge({ firstVideo: {} })
          .accountsPartial({
            contributorProfile: contributorProfilePda,
            authority: authority.publicKey,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "BadgeAlreadyEarned");
      }
    });
  });

  // ============================================================================
  // ESCROW PROGRAM TESTS
  // ============================================================================

  describe("Escrow Program", () => {
    it("Submits a video and creates escrow", async () => {
      const ipfsHash = "QmTest123456789";
      const arweaveTx = "ArweaveTest123";
      const metadataUri = "https://arweave.net/metadata";

      await program.methods
        .submitVideo(submissionId, ipfsHash, arweaveTx, metadataUri)
        .accountsPartial({
          submission: submissionPda,
          bountyPool: bountyPda,
          contributor: contributor.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();

      const submission = await program.account.videoSubmission.fetch(
        submissionPda
      );

      assert.equal(submission.submissionId, submissionId);
      assert.equal(
        submission.contributor.toString(),
        contributor.publicKey.toString()
      );
      assert.equal(submission.bountyId, bountyId);
      assert.equal(submission.ipfsHash, ipfsHash);
      assert.equal(submission.arweaveTx, arweaveTx);
      assert.equal(submission.metadataUri, metadataUri);
      assert.deepEqual(submission.status, { pending: {} });

      // Verify escrow was deducted from bounty pool
      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);
      assert.equal(
        bountyAccount.remainingPool.toString(),
        new BN(0.9 * LAMPORTS_PER_SOL).toString()
      );
    });

    it("Approves submission and releases payment", async () => {
      const qualityScore = 85;
      const contributorBalanceBefore = await provider.connection.getBalance(
        contributor.publicKey
      );

      await program.methods
        .approveSubmission(qualityScore)
        .accountsPartial({
          submission: submissionPda,
          bountyPool: bountyPda,
          contributorProfile: contributorProfilePda,
          contributor: contributor.publicKey,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify submission status
      const submission = await program.account.videoSubmission.fetch(
        submissionPda
      );
      assert.deepEqual(submission.status, { approved: {} });
      assert.equal(submission.qualityScore, qualityScore);

      // Verify payment was sent
      const contributorBalanceAfter = await provider.connection.getBalance(
        contributor.publicKey
      );
      assert.isTrue(contributorBalanceAfter > contributorBalanceBefore);

      // Verify bounty counter updated
      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);
      assert.equal(bountyAccount.videosCollected, 1);

      // Verify profile updated
      const profile = await program.account.contributorProfile.fetch(
        contributorProfilePda
      );
      assert.equal(profile.totalSubmissions, 1);
      assert.equal(profile.acceptedSubmissions, 1);
      assert.equal(profile.averageQualityScore, qualityScore);
      assert.isTrue(profile.totalEarnings.gt(new BN(0)));
      assert.isTrue(profile.reputationScore > 500); // Should increase from neutral
    });

    it("Fails to submit video to inactive bounty", async () => {
      // Pause the bounty first
      await program.methods
        .pauseBounty()
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
        })
        .rpc();

      const failedSubmissionId = "submission-fail-001";
      const [failedSubmissionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("submission"), Buffer.from(failedSubmissionId)],
        program.programId
      );

      try {
        await program.methods
          .submitVideo(failedSubmissionId, "hash", "tx", "uri")
          .accountsPartial({
            submission: failedSubmissionPda,
            bountyPool: bountyPda,
            contributor: contributor.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .signers([contributor])
          .rpc();

        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "BountyNotActive");
      }

      // Resume bounty for next tests
      await program.methods
        .resumeBounty()
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
        })
        .rpc();
    });
  });

  // ============================================================================
  // DATASET NFT TESTS
  // ============================================================================

  describe("Dataset NFT Program", () => {
    it("Creates a dataset NFT", async () => {
      const price = new BN(5 * LAMPORTS_PER_SOL);
      const royaltyPercentage = 10;

      await program.methods
        .createDataset(
          datasetId,
          { unlimited: {} }, // license type
          price,
          royaltyPercentage
        )
        .accountsPartial({
          datasetNft: datasetPda,
          creator: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const dataset = await program.account.datasetNft.fetch(datasetPda);

      assert.equal(dataset.datasetId, datasetId);
      assert.equal(dataset.creator.toString(), authority.publicKey.toString());
      assert.equal(dataset.price.toString(), price.toString());
      assert.equal(dataset.royaltyPercentage, royaltyPercentage);
      assert.deepEqual(dataset.licenseType, { unlimited: {} });
      assert.equal(dataset.totalSales, 0);
    });

    it("Purchases a dataset NFT", async () => {
      const dataset = await program.account.datasetNft.fetch(datasetPda);
      const creatorBalanceBefore = await provider.connection.getBalance(
        authority.publicKey
      );
      const buyerBalanceBefore = await provider.connection.getBalance(
        buyer.publicKey
      );

      await program.methods
        .purchaseDataset()
        .accountsPartial({
          datasetNft: datasetPda,
          buyer: buyer.publicKey,
          creator: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([buyer])
        .rpc();

      // Verify payment transfer
      const creatorBalanceAfter = await provider.connection.getBalance(
        authority.publicKey
      );
      const buyerBalanceAfter = await provider.connection.getBalance(
        buyer.publicKey
      );

      assert.isTrue(creatorBalanceAfter > creatorBalanceBefore);
      assert.isTrue(buyerBalanceAfter < buyerBalanceBefore);

      // Verify sales counter updated
      const datasetAfter = await program.account.datasetNft.fetch(datasetPda);
      assert.equal(datasetAfter.totalSales, 1);
    });

    it("Fails to create dataset with invalid royalty", async () => {
      const invalidDatasetId = "dataset-invalid";
      const [invalidDatasetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("dataset"), Buffer.from(invalidDatasetId)],
        program.programId
      );

      try {
        await program.methods
          .createDataset(
            invalidDatasetId,
            { unlimited: {} },
            new BN(1 * LAMPORTS_PER_SOL),
            150 // Invalid: > 100%
          )
          .accountsPartial({
            datasetNft: invalidDatasetPda,
            creator: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "InvalidRoyalty");
      }
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe("Integration Tests", () => {
    it("Complete workflow: Create bounty -> Submit -> Approve -> Create dataset", async () => {
      const workflowBountyId = "bounty-workflow";
      const workflowSubmissionId = "submission-workflow";
      const workflowDatasetId = "dataset-workflow";

      const [workflowBountyPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bounty"), Buffer.from(workflowBountyId)],
        program.programId
      );

      const [workflowSubmissionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("submission"), Buffer.from(workflowSubmissionId)],
        program.programId
      );

      const [workflowDatasetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("dataset"), Buffer.from(workflowDatasetId)],
        program.programId
      );

      // Step 1: Create bounty
      await program.methods
        .createBounty(
          workflowBountyId,
          new BN(0.05 * LAMPORTS_PER_SOL),
          new BN(0.5 * LAMPORTS_PER_SOL),
          10,
          "Workflow test bounty",
          20,
          "1080p",
          60,
          new BN(Date.now() / 1000 + 86400 * 30)
        )
        .accountsPartial({
          bountyPool: workflowBountyPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Step 2: Submit video
      await program.methods
        .submitVideo(
          workflowSubmissionId,
          "QmWorkflow",
          "ArweaveWorkflow",
          "https://metadata/workflow"
        )
        .accountsPartial({
          submission: workflowSubmissionPda,
          bountyPool: workflowBountyPda,
          contributor: contributor.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();

      // Step 3: Approve submission
      await program.methods
        .approveSubmission(90)
        .accountsPartial({
          submission: workflowSubmissionPda,
          bountyPool: workflowBountyPda,
          contributorProfile: contributorProfilePda,
          contributor: contributor.publicKey,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Step 4: Create dataset from approved submissions
      await program.methods
        .createDataset(
          workflowDatasetId,
          { commercialResale: {} },
          new BN(10 * LAMPORTS_PER_SOL),
          15
        )
        .accountsPartial({
          datasetNft: workflowDatasetPda,
          creator: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify final state
      const finalBounty = await program.account.bountyPool.fetch(
        workflowBountyPda
      );
      const finalSubmission = await program.account.videoSubmission.fetch(
        workflowSubmissionPda
      );
      const finalDataset = await program.account.datasetNft.fetch(
        workflowDatasetPda
      );
      const finalProfile = await program.account.contributorProfile.fetch(
        contributorProfilePda
      );

      assert.equal(finalBounty.videosCollected, 1);
      assert.deepEqual(finalSubmission.status, { approved: {} });
      assert.equal(
        finalDataset.creator.toString(),
        authority.publicKey.toString()
      );
      assert.equal(finalProfile.acceptedSubmissions, 2); // From previous test + this one
      assert.isTrue(finalProfile.reputationScore >= 500);
    });

    it("Handles rejection workflow correctly", async () => {
      const rejectSubmissionId = "submission-reject";
      const [rejectSubmissionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("submission"), Buffer.from(rejectSubmissionId)],
        program.programId
      );

      // Submit video
      await program.methods
        .submitVideo(
          rejectSubmissionId,
          "QmReject",
          "ArweaveReject",
          "https://metadata/reject"
        )
        .accountsPartial({
          submission: rejectSubmissionPda,
          bountyPool: bountyPda,
          contributor: contributor.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([contributor])
        .rpc();

      const bountyBefore = await program.account.bountyPool.fetch(bountyPda);
      const remainingBefore = bountyBefore.remainingPool;

      // Reject submission
      await program.methods
        .rejectSubmission()
        .accountsPartial({
          submission: rejectSubmissionPda,
          bountyPool: bountyPda,
          contributorProfile: contributorProfilePda,
          contributor: contributor.publicKey,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Verify funds returned to pool
      const bountyAfter = await program.account.bountyPool.fetch(bountyPda);
      assert.isTrue(bountyAfter.remainingPool.gt(remainingBefore));

      // Verify profile updated with rejection
      const profile = await program.account.contributorProfile.fetch(
        contributorProfilePda
      );
      assert.isTrue(profile.rejectedSubmissions > 0);
    });
  });

  // ============================================================================
  // CLEANUP TEST
  // ============================================================================

  describe("Cleanup", () => {
    it("Cancels bounty and returns remaining funds", async () => {
      const authorityBalanceBefore = await provider.connection.getBalance(
        authority.publicKey
      );

      await program.methods
        .cancelBounty()
        .accountsPartial({
          bountyPool: bountyPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const bountyAccount = await program.account.bountyPool.fetch(bountyPda);
      assert.deepEqual(bountyAccount.status, { cancelled: {} });
      assert.equal(bountyAccount.remainingPool.toString(), "0");

      const authorityBalanceAfter = await provider.connection.getBalance(
        authority.publicKey
      );
      assert.isTrue(authorityBalanceAfter > authorityBalanceBefore);
    });
  });
});
