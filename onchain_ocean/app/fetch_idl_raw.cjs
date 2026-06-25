const { Connection, PublicKey } = require('@solana/web3.js');
const { Buffer } = require('buffer/');
const zlib = require('zlib');

async function run() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("BfZLHQYYggHG3gyiEU4Yd8yFxpSdQM6Tyat7QcX6z8nf");
  
  const [idlPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("anchor:idl"), programId.toBuffer()],
    programId
  );
  
  console.log("IDL PDA:", idlPda.toBase58());
  const accountInfo = await connection.getAccountInfo(idlPda);
  if (!accountInfo) {
    console.log("No IDL account found on devnet.");
    return;
  }
  
  console.log("Account data size:", accountInfo.data.length);
  // Anchor IDL account format:
  // 8 bytes discriminator
  // 32 bytes authority
  // u32 length of data
  // data bytes (deflate compressed)
  const data = accountInfo.data;
  const authority = new PublicKey(data.slice(8, 40));
  const idlDataLen = data.readUInt32LE(40);
  const compressedIdl = data.slice(44, 44 + idlDataLen);
  
  console.log("Authority:", authority.toBase58());
  console.log("Compressed IDL length:", idlDataLen);
  
  zlib.inflate(compressedIdl, (err, decompressed) => {
    if (err) {
      console.error("Failed to decompress IDL:", err);
      return;
    }
    const idlStr = decompressed.toString('utf-8');
    console.log("Decompressed IDL:");
    console.log(idlStr);
  });
}

run().catch(console.error);
