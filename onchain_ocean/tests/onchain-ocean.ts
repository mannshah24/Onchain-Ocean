import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainOcean } from "../target/types/onchain_ocean";
import { assert, expect } from "chai";
import { 
  getAssociatedTokenAddressSync, 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID 
} from "@solana/spl-token";

describe("onchain_ocean", () => {
  // Configure the client to use the local cluster provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.OnchainOcean as Program<OnchainOcean>;

  // User A details
  const userA = anchor.web3.Keypair.generate();
  let userAProfilePda: anchor.web3.PublicKey;
  let userAProfileBump: number;
  let nftMintKeypairA = anchor.web3.Keypair.generate();
  let nftTokenAccountA: anchor.web3.PublicKey;

  // User B details (for multi-user tests)
  const userB = anchor.web3.Keypair.generate();
  let userBProfilePda: anchor.web3.PublicKey;
  let userBProfileBump: number;
  let nftMintKeypairB = anchor.web3.Keypair.generate();
  let nftTokenAccountB: anchor.web3.PublicKey;

  // Additional test wallets
  const unauthorizedUser = anchor.web3.Keypair.generate();
  const testRecipient = anchor.web3.Keypair.generate();

  before(async () => {
    // Airdrop SOL to test wallets so they can pay for transaction fees
    const airdropSignatures = await Promise.all([
      provider.connection.requestAirdrop(userA.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(userB.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
      provider.connection.requestAirdrop(unauthorizedUser.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
    ]);

    await Promise.all(
      airdropSignatures.map((sig) =>
        provider.connection.confirmTransaction(sig, "confirmed")
      )
    );

    // Derive PDA for User A
    [userAProfilePda, userAProfileBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), userA.publicKey.toBuffer()],
      program.programId
    );

    // Derive the Associated Token Account for User A's NFT
    nftTokenAccountA = getAssociatedTokenAddressSync(
      nftMintKeypairA.publicKey,
      userA.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Derive PDA for User B
    [userBProfilePda, userBProfileBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-profile"), userB.publicKey.toBuffer()],
      program.programId
    );

    // Derive the Associated Token Account for User B's NFT
    nftTokenAccountB = getAssociatedTokenAddressSync(
      nftMintKeypairB.publicKey,
      userB.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  });

  describe("register_user", () => {
    it("successfully registers User A, initializes profile, and mints registration NFT", async () => {
      const transactionCount = 42;
      const contractTypes = new anchor.BN(5);
      const onchainDataUri = "https://api.onchainocean.xyz/profiles/userA";

      await program.methods
        .registerUser(transactionCount, contractTypes, onchainDataUri)
        .accounts({
          userProfile: userAProfilePda,
          nftMint: nftMintKeypairA.publicKey,
          nftTokenAccount: nftTokenAccountA,
          user: userA.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([userA, nftMintKeypairA])
        .rpc();

      // Fetch and assert UserProfile PDA state
      const profile = await program.account.userProfile.fetch(userAProfilePda);
      expect(profile.authority.toBase58()).to.equal(userA.publicKey.toBase58());
      expect(profile.nftMint.toBase58()).to.equal(nftMintKeypairA.publicKey.toBase58());
      expect(profile.messageCount.toNumber()).to.equal(0);
      expect(profile.lastMessageTime.toNumber()).to.equal(0);
      expect(profile.transactionCount).to.equal(transactionCount);
      expect(profile.contractTypes.toString()).to.equal(contractTypes.toString());
      expect(profile.onchainDataUri).to.equal(onchainDataUri);
      expect(profile.bump).to.equal(userAProfileBump);

      // Verify the NFT was minted (token balance is 1)
      const tokenAccountInfo = await provider.connection.getParsedAccountInfo(nftTokenAccountA);
      const parsedData = (tokenAccountInfo.value?.data as anchor.web3.ParsedAccountData).parsed;
      expect(parsedData.info.tokenAmount.uiAmount).to.equal(1);

      // Verify the Mint supply is 1 and mint authority is null
      const mintInfo = await provider.connection.getParsedAccountInfo(nftMintKeypairA.publicKey);
      const parsedMintData = (mintInfo.value?.data as anchor.web3.ParsedAccountData).parsed;
      expect(parsedMintData.info.supply).to.equal("1");
      expect(parsedMintData.info.mintAuthority).to.be.null;
    });

    it("successfully registers User B with another wallet", async () => {
      const transactionCount = 100;
      const contractTypes = new anchor.BN(10);
      const onchainDataUri = "https://api.onchainocean.xyz/profiles/userB";

      await program.methods
        .registerUser(transactionCount, contractTypes, onchainDataUri)
        .accounts({
          userProfile: userBProfilePda,
          nftMint: nftMintKeypairB.publicKey,
          nftTokenAccount: nftTokenAccountB,
          user: userB.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([userB, nftMintKeypairB])
        .rpc();

      const profile = await program.account.userProfile.fetch(userBProfilePda);
      expect(profile.authority.toBase58()).to.equal(userB.publicKey.toBase58());
      expect(profile.nftMint.toBase58()).to.equal(nftMintKeypairB.publicKey.toBase58());
    });

    it("succeeds when registering with a URI of exactly 64 characters (boundary test)", async () => {
      const boundaryUser = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(boundaryUser.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      );

      const [boundaryProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user-profile"), boundaryUser.publicKey.toBuffer()],
        program.programId
      );

      const boundaryMint = anchor.web3.Keypair.generate();
      const boundaryAta = getAssociatedTokenAddressSync(boundaryMint.publicKey, boundaryUser.publicKey);

      // Exactly 64 chars
      const exact64CharUri = "https://example.org/path/exact-64-character-uri-metadata-link/12";
      expect(exact64CharUri.length).to.equal(64);

      await program.methods
        .registerUser(0, new anchor.BN(0), exact64CharUri)
        .accounts({
          userProfile: boundaryProfilePda,
          nftMint: boundaryMint.publicKey,
          nftTokenAccount: boundaryAta,
          user: boundaryUser.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([boundaryUser, boundaryMint])
        .rpc();

      const profile = await program.account.userProfile.fetch(boundaryProfilePda);
      expect(profile.onchainDataUri).to.equal(exact64CharUri);
    });

    it("fails if user tries to register again with same wallet (duplicate seeds check)", async () => {
      const duplicateMint = anchor.web3.Keypair.generate();
      const duplicateAta = getAssociatedTokenAddressSync(duplicateMint.publicKey, userA.publicKey);

      try {
        await program.methods
          .registerUser(10, new anchor.BN(0), "https://api.xyz")
          .accounts({
            userProfile: userAProfilePda,
            nftMint: duplicateMint.publicKey,
            nftTokenAccount: duplicateAta,
            user: userA.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([userA, duplicateMint])
          .rpc();
        
        assert.fail("Should have failed with duplicate seed error");
      } catch (err: any) {
        expect(err.logs.toString()).to.include("already in use");
      }
    });

    it("fails if metadata URI exceeds 64 characters", async () => {
      const invalidMint = anchor.web3.Keypair.generate();
      const freshUser = anchor.web3.Keypair.generate();
      await provider.connection.confirmTransaction(
        await provider.connection.requestAirdrop(freshUser.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL),
        "confirmed"
      );
      const [freshProfilePda] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from("user-profile"), freshUser.publicKey.toBuffer()],
        program.programId
      );
      const freshAta = getAssociatedTokenAddressSync(invalidMint.publicKey, freshUser.publicKey);
      const longUri = "https://api.onchainocean.xyz/profiles/user-long-metadata-uri-that-is-over-64-characters-limit-invalid";

      try {
        await program.methods
          .registerUser(10, new anchor.BN(0), longUri)
          .accounts({
            userProfile: freshProfilePda,
            nftMint: invalidMint.publicKey,
            nftTokenAccount: freshAta,
            user: freshUser.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([freshUser, invalidMint])
          .rpc();

        assert.fail("Should have failed due to URI length constraint");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("UriTooLong");
      }
    });
  });

  describe("send_batch_messages", () => {
    it("successfully sends a batch of messages and emits events on-chain", async () => {
      const messages = [
        {
          recipient: testRecipient.publicKey,
          content: "Hello onchain ocean!",
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
        },
        {
          recipient: testRecipient.publicKey,
          content: "How is the water today?",
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000) + 10),
        }
      ];

      let receivedEvents: any[] = [];
      const listenerId = program.addEventListener("messageSent", (event) => {
        receivedEvents.push(event);
      });

      await program.methods
        .sendBatchMessages(messages)
        .accounts({
          userProfile: userAProfilePda,
          authority: userA.publicKey,
        })
        .signers([userA])
        .rpc();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await program.removeEventListener(listenerId);

      // Verify stats
      const profile = await program.account.userProfile.fetch(userAProfilePda);
      expect(profile.messageCount.toNumber()).to.equal(2);

      // Verify events
      expect(receivedEvents.length).to.equal(2);
      expect(receivedEvents[0].sender.toBase58()).to.equal(userA.publicKey.toBase58());
      expect(receivedEvents[0].recipient.toBase58()).to.equal(testRecipient.publicKey.toBase58());
      expect(receivedEvents[0].content).to.equal("Hello onchain ocean!");
      expect(receivedEvents[1].content).to.equal("How is the water today?");
    });

    it("succeeds when sending a message of exactly 256 characters (boundary test)", async () => {
      const exact256CharMsg = "m".repeat(256);
      const messages = [
        {
          recipient: testRecipient.publicKey,
          content: exact256CharMsg,
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
        }
      ];

      await program.methods
        .sendBatchMessages(messages)
        .accounts({
          userProfile: userAProfilePda,
          authority: userA.publicKey,
        })
        .signers([userA])
        .rpc();

      const profile = await program.account.userProfile.fetch(userAProfilePda);
      expect(profile.messageCount.toNumber()).to.equal(3);
    });

    it("fails when attempting to send an empty message batch", async () => {
      try {
        await program.methods
          .sendBatchMessages([])
          .accounts({
            userProfile: userAProfilePda,
            authority: userA.publicKey,
          })
          .signers([userA])
          .rpc();
        
        assert.fail("Should have failed for empty message batch");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("EmptyMessageBatch");
      }
    });

    it("fails if any message in the batch exceeds 256 character length", async () => {
      const longMessage = "a".repeat(257);
      const invalidMessages = [
        {
          recipient: testRecipient.publicKey,
          content: longMessage,
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
        }
      ];

      try {
        await program.methods
          .sendBatchMessages(invalidMessages)
          .accounts({
            userProfile: userAProfilePda,
            authority: userA.publicKey,
          })
          .signers([userA])
          .rpc();
        
        assert.fail("Should have failed due to message length limits");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("MessageTooLong");
      }
    });

    it("fails if recipient public key is default/empty", async () => {
      const invalidMessages = [
        {
          recipient: anchor.web3.PublicKey.default,
          content: "Valid text content.",
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
        }
      ];

      try {
        await program.methods
          .sendBatchMessages(invalidMessages)
          .accounts({
            userProfile: userAProfilePda,
            authority: userA.publicKey,
          })
          .signers([userA])
          .rpc();
        
        assert.fail("Should have failed due to default pubkey recipient");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("InvalidRecipient");
      }
    });

    it("reverts atomically (all-or-nothing check) if one message in the batch is invalid", async () => {
      const startProfile = await program.account.userProfile.fetch(userAProfilePda);
      const startCount = startProfile.messageCount.toNumber();

      const batch = [
        {
          recipient: testRecipient.publicKey,
          content: "Valid message 1",
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
        },
        {
          recipient: testRecipient.publicKey,
          content: "a".repeat(257), // INVALID (too long)
          timestamp: new anchor.BN(Math.floor(Date.now() / 1000) + 1),
        }
      ];

      try {
        await program.methods
          .sendBatchMessages(batch)
          .accounts({
            userProfile: userAProfilePda,
            authority: userA.publicKey,
          })
          .signers([userA])
          .rpc();

        assert.fail("Should have failed batch validation");
      } catch (err: any) {
        // Assert that the transaction failed
        expect(err.error.errorCode.code).to.equal("MessageTooLong");

        // Verify that no message from this batch was saved/counted (message count is unchanged)
        const endProfile = await program.account.userProfile.fetch(userAProfilePda);
        expect(endProfile.messageCount.toNumber()).to.equal(startCount);
      }
    });
  });

  describe("multi-user interaction test", () => {
    it("allows two registered users to exchange messages on-chain", async () => {
      // Fetch starting message counts
      const profileAStart = await program.account.userProfile.fetch(userAProfilePda);
      const countA = profileAStart.messageCount.toNumber();

      const profileBStart = await program.account.userProfile.fetch(userBProfilePda);
      const countB = profileBStart.messageCount.toNumber();

      // User A sends message to User B
      await program.methods
        .sendBatchMessages([
          {
            recipient: userB.publicKey,
            content: "Hey User B, how are you?",
            timestamp: new anchor.BN(Math.floor(Date.now() / 1000)),
          }
        ])
        .accounts({
          userProfile: userAProfilePda,
          authority: userA.publicKey,
        })
        .signers([userA])
        .rpc();

      // User B sends message to User A
      await program.methods
        .sendBatchMessages([
          {
            recipient: userA.publicKey,
            content: "Hey User A! All good here.",
            timestamp: new anchor.BN(Math.floor(Date.now() / 1000) + 5),
          }
        ])
        .accounts({
          userProfile: userBProfilePda,
          authority: userB.publicKey,
        })
        .signers([userB])
        .rpc();

      // Assert counts are incremented correctly for each profile separately
      const profileAEnd = await program.account.userProfile.fetch(userAProfilePda);
      expect(profileAEnd.messageCount.toNumber()).to.equal(countA + 1);

      const profileBEnd = await program.account.userProfile.fetch(userBProfilePda);
      expect(profileBEnd.messageCount.toNumber()).to.equal(countB + 1);
    });
  });

  describe("update_profile_stats", () => {
    it("successfully updates User A stats", async () => {
      const newTxCount = 105;
      const newContractTypes = new anchor.BN(12);
      const newUri = "https://api.onchainocean.xyz/profiles/userA-new";

      await program.methods
        .updateProfileStats(newTxCount, newContractTypes, newUri)
        .accounts({
          userProfile: userAProfilePda,
          authority: userA.publicKey,
        })
        .signers([userA])
        .rpc();

      const profile = await program.account.userProfile.fetch(userAProfilePda);
      expect(profile.transactionCount).to.equal(newTxCount);
      expect(profile.contractTypes.toString()).to.equal(newContractTypes.toString());
      expect(profile.onchainDataUri).to.equal(newUri);
    });

    it("fails when an unauthorized wallet tries to change profile stats", async () => {
      try {
        await program.methods
          .updateProfileStats(999, new anchor.BN(99), "https://malicious.org")
          .accounts({
            userProfile: userAProfilePda,
            authority: unauthorizedUser.publicKey,
          })
          .signers([unauthorizedUser])
          .rpc();

        assert.fail("Should have failed unauthorized access");
      } catch (err: any) {
        expect(err.logs.toString()).to.include("ConstraintSeeds");
      }
    });
  });
});
