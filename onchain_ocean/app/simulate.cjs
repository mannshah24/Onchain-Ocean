const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } = require('@solana/web3.js');
const { Buffer } = require('buffer/');

const PROGRAM_ID = new PublicKey("BfZLHQYYggHG3gyiEU4Yd8yFxpSdQM6Tyat7QcX6z8nf");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function getUserProfilePDA(userPubKey) {
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user-profile"),
      userPubKey.toBuffer()
    ],
    PROGRAM_ID
  );
  return profilePDA;
}

function getAssociatedTokenAddress(mint, owner) {
  const [ataAddress] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer()
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return ataAddress;
}

function serializeRegisterUserArgs(txCount, contractTypes, dataUri) {
  const encoder = new TextEncoder();
  const uriBytes = encoder.encode(dataUri);
  const size = 8 + 4 + 8 + 4 + uriBytes.length;
  const data = new Uint8Array(size);
  const view = new DataView(data.buffer);
  
  const disc = [2, 241, 150, 223, 99, 214, 116, 97];
  for (let i = 0; i < 8; i++) data[i] = disc[i];
  
  view.setUint32(8, txCount, true);
  
  const low = contractTypes % 0x100000000;
  const high = Math.floor(contractTypes / 0x100000000);
  view.setUint32(12, low, true);
  view.setUint32(16, high, true);
  
  view.setUint32(20, uriBytes.length, true);
  data.set(uriBytes, 24);
  
  return data;
}

async function run() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const userPubKey = new PublicKey("D5ZPRtsDksYpGAdjgfqo2wTB1KRPjRNp6vVN8rBiNXyz");
  const mintKeypair = Keypair.generate();
  
  const userProfilePDA = getUserProfilePDA(userPubKey);
  const nftTokenAccount = getAssociatedTokenAddress(mintKeypair.publicKey, userPubKey);
  const data = serializeRegisterUserArgs(10, 1, "onchain_ocean_user");

  const inst = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userProfilePDA, isSigner: false, isWritable: true },
      { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
      { pubkey: nftTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userPubKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data),
  });

  const tx = new Transaction().add(inst);
  const latestBlockhash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = userPubKey;
  
  // Sign with the generated mint keypair
  tx.partialSign(mintKeypair);

  console.log("Simulating transaction on devnet...");
  const simulation = await connection.simulateTransaction(tx);
  console.log("Simulation Result:", JSON.stringify(simulation, null, 2));
}

run().catch(console.error);
