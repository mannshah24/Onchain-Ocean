const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');

async function run() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const programId = new PublicKey("BfZLHQYYggHG3gyiEU4Yd8yFxpSdQM6Tyat7QcX6z8nf");
  
  // We can use Anchor's Program.fetchIdl or construct a Provider and fetch
  const wallet = {
    signTransaction: async (tx) => tx,
    signAllTransactions: async (txs) => txs,
    publicKey: PublicKey.default
  };
  const provider = new anchor.AnchorProvider(connection, wallet, {});
  
  console.log("Fetching IDL from devnet for", programId.toBase58());
  try {
    const idl = await anchor.Program.fetchIdl(programId, provider);
    console.log("IDL:", JSON.stringify(idl, null, 2));
  } catch (e) {
    console.error("Failed to fetch IDL:", e);
  }
}

run().catch(console.error);
