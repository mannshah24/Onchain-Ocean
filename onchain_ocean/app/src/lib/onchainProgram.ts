import { 
  PublicKey, 
  SystemProgram, 
  TransactionInstruction, 
  Connection, 
  SYSVAR_RENT_PUBKEY 
} from '@solana/web3.js';
import { Buffer } from 'buffer/';

// Program ID from targets
export const PROGRAM_ID = new PublicKey("BfZLHQYYggHG3gyiEU4Yd8yFxpSdQM6Tyat7QcX6z8nf");
export const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

export interface MessageInput {
  recipient: string; // Base58 public key string
  content: string;
  timestamp: number; // Unix timestamp
}

export interface OnchainProfileData {
  authority: string;
  nftMint: string;
  registeredAt: number;
  messageCount: number;
  lastMessageTime: number;
  transactionCount: number;
  contractTypes: number;
  onchainDataUri: string;
}

export interface OnchainMessage {
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
}

// ─── PDA Derivations ─────────────────────────────────────────────────────────

export function getUserProfilePDA(userPubKey: PublicKey): PublicKey {
  const [profilePDA] = PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("user-profile"),
      userPubKey.toBuffer()
    ],
    PROGRAM_ID
  );
  return profilePDA;
}

export function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
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

// ─── Account Verification & Deserialization ─────────────────────────────────

export async function checkProfileRegistered(connection: Connection, userPubKey: PublicKey): Promise<boolean> {
  try {
    const profilePDA = getUserProfilePDA(userPubKey);
    const accountInfo = await connection.getAccountInfo(profilePDA);
    return accountInfo !== null;
  } catch (e) {
    console.error("Error checking profile registration:", e);
    return false;
  }
}

export async function fetchUserProfile(connection: Connection, userPubKey: PublicKey): Promise<OnchainProfileData | null> {
  try {
    const profilePDA = getUserProfilePDA(userPubKey);
    const accountInfo = await connection.getAccountInfo(profilePDA);
    if (!accountInfo) return null;
    
    const data = accountInfo.data;
    if (data.length < 112) return null; // Safe minimum bounds check
    
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    
    const authority = new PublicKey(data.slice(8, 40)).toBase58();
    const nftMint = new PublicKey(data.slice(40, 72)).toBase58();
    
    // registeredAt: i64 (8 bytes LE)
    const registeredAtLow = view.getUint32(72, true);
    const registeredAtHigh = view.getUint32(76, true);
    const registeredAt = registeredAtLow + registeredAtHigh * 0x100000000;
    
    // messageCount: u64 (8 bytes LE)
    const msgCountLow = view.getUint32(80, true);
    const msgCountHigh = view.getUint32(84, true);
    const messageCount = msgCountLow + msgCountHigh * 0x100000000;
    
    // lastMessageTime: i64 (8 bytes LE)
    const lastMsgLow = view.getUint32(88, true);
    const lastMsgHigh = view.getUint32(92, true);
    const lastMessageTime = lastMsgLow + lastMsgHigh * 0x100000000;
    
    // transactionCount: u32 (4 bytes LE)
    const transactionCount = view.getUint32(96, true);
    
    // contractTypes: u64 (8 bytes LE)
    const ctLow = view.getUint32(100, true);
    const ctHigh = view.getUint32(104, true);
    const contractTypes = ctLow + ctHigh * 0x100000000;
    
    // onchainDataUri: String (4 bytes length + N bytes data)
    const uriLen = view.getUint32(108, true);
    const uriBytes = data.slice(112, 112 + uriLen);
    const onchainDataUri = new TextDecoder().decode(uriBytes);
    
    return {
      authority,
      nftMint,
      registeredAt,
      messageCount,
      lastMessageTime,
      transactionCount,
      contractTypes,
      onchainDataUri
    };
  } catch (e) {
    console.error("Error parsing user profile PDA:", e);
    return null;
  }
}

// Helper to convert base64 to bytes securely in the browser
function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.charCodeAt(0));
}

/**
 * Parses MessageSent events from a set of parsed transactions.
 * Returns all OnchainMessage objects found in the logs.
 */
function parseMessagesFromTransactions(
  txs: (import('@solana/web3.js').ParsedTransactionWithMeta | null)[]
): OnchainMessage[] {
  const messages: OnchainMessage[] = [];
  
  for (const tx of txs) {
    if (!tx || !tx.meta || !tx.meta.logMessages) continue;
    
    for (const log of tx.meta.logMessages) {
      if (log.includes("Program data: ")) {
        try {
          const prefixIndex = log.indexOf("Program data: ");
          const base64Str = log.substring(prefixIndex + "Program data: ".length).trim();
          const bytes = base64ToBytes(base64Str);
          if (bytes.length < 84) continue;
          
          // Parse sender: offset 8 to 40 (after 8-byte event discriminator)
          const senderBytes = bytes.slice(8, 40);
          const sender = new PublicKey(senderBytes).toBase58();
          
          // Parse recipient: offset 40 to 72
          const recipientBytes = bytes.slice(40, 72);
          const recipient = new PublicKey(recipientBytes).toBase58();
          
          // Parse content: offset 72 (4-byte length + data)
          const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
          const contentLen = view.getUint32(72, true);
          if (76 + contentLen + 8 <= bytes.length) {
            const contentBytes = bytes.slice(76, 76 + contentLen);
            const content = new TextDecoder().decode(contentBytes);
            
            // Parse timestamp: offset 76 + contentLen (8 bytes i64 LE)
            const tsOffset = 76 + contentLen;
            const tsLow = view.getUint32(tsOffset, true);
            const tsHigh = view.getUint32(tsOffset + 4, true);
            const timestamp = tsLow + tsHigh * 0x100000000;
            
            messages.push({ sender, recipient, content, timestamp });
          }
        } catch (e) {
          console.warn("Failed to parse event log:", e);
        }
      }
    }
  }
  
  return messages;
}

/**
 * Fetches on-chain messages for a 1:1 conversation between two wallets.
 * 
 * When `viewerAddress` is provided, returns the full conversation between
 * viewerAddress and targetAddress (messages in both directions).
 * 
 * When `viewerAddress` is omitted, returns all messages sent TO the targetAddress
 * (legacy broadcast-style behavior).
 */
export async function fetchRealOnchainMessages(
  connection: Connection,
  targetAddress: string,
  viewerAddress?: string
): Promise<OnchainMessage[]> {
  try {
    if (!targetAddress || targetAddress.includes('.') || targetAddress.length < 32 || targetAddress.length > 44) {
      return [];
    }

    const targetPubkey = new PublicKey(targetAddress);
    const targetPDA = getUserProfilePDA(targetPubkey);
    const allMessages: OnchainMessage[] = [];
    const seenKeys = new Set<string>(); // Deduplicate by sender+content+timestamp

    // Helper to fetch and parse messages from a PDA
    const fetchFromPDA = async (pda: PublicKey) => {
      const signatures = await connection.getSignaturesForAddress(pda, { limit: 25 });
      if (signatures.length === 0) return;
      
      const txs = await connection.getParsedTransactions(
        signatures.map(s => s.signature),
        { maxSupportedTransactionVersion: 0, commitment: 'confirmed' }
      );
      
      const parsed = parseMessagesFromTransactions(txs);
      for (const msg of parsed) {
        const key = `${msg.sender}:${msg.recipient}:${msg.timestamp}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          allMessages.push(msg);
        }
      }
    };

    // Always search the target's PDA
    await fetchFromPDA(targetPDA);

    // If a viewer is provided, also search the viewer's PDA to find
    // messages they sent to the target (which reference the viewer's PDA)
    if (viewerAddress && viewerAddress !== targetAddress) {
      try {
        const viewerPubkey = new PublicKey(viewerAddress);
        const viewerPDA = getUserProfilePDA(viewerPubkey);
        await fetchFromPDA(viewerPDA);
      } catch {
        // Invalid viewer address, skip
      }
    }

    // Filter to only show the 1:1 conversation between the two parties
    let conversationMessages: OnchainMessage[];
    if (viewerAddress) {
      const a = targetAddress.toLowerCase();
      const b = viewerAddress.toLowerCase();
      conversationMessages = allMessages.filter(msg => {
        const s = msg.sender.toLowerCase();
        const r = msg.recipient.toLowerCase();
        return (s === a && r === b) || (s === b && r === a);
      });
    } else {
      // No viewer — show all messages involving the target (sent to them)
      conversationMessages = allMessages.filter(msg =>
        msg.recipient.toLowerCase() === targetAddress.toLowerCase()
      );
    }

    // Sort by timestamp ascending
    return conversationMessages.sort((a, b) => a.timestamp - b.timestamp);
  } catch (e) {
    return [];
  }
}

// ─── Instruction Serializers ────────────────────────────────────────────────

/**
 * Serializes argument data for `register_user` instruction
 */
export function serializeRegisterUserArgs(
  txCount: number,
  contractTypes: number,
  dataUri: string
): Uint8Array {
  const encoder = new TextEncoder();
  const uriBytes = encoder.encode(dataUri);
  
  // Total size: 8 (disc) + 4 (u32 txCount) + 8 (u64 contractTypes) + 4 (string len u32) + N (string bytes)
  const size = 8 + 4 + 8 + 4 + uriBytes.length;
  const data = new Uint8Array(size);
  const view = new DataView(data.buffer);
  
  // 1. Discriminator: SHA256("global:register_user")[0..8]
  // The deployed program uses the standard Anchor sighash, NOT the IDL discriminator
  const disc = [2, 241, 150, 223, 99, 214, 116, 97];
  for (let i = 0; i < 8; i++) data[i] = disc[i];
  
  // 2. transaction_count: u32
  view.setUint32(8, txCount, true);
  
  // 3. contract_types: u64 (safe serialization as two u32 parts)
  const low = contractTypes % 0x100000000;
  const high = Math.floor(contractTypes / 0x100000000);
  view.setUint32(12, low, true);
  view.setUint32(16, high, true);
  
  // 4. onchain_data_uri length: u32
  view.setUint32(20, uriBytes.length, true);
  
  // 5. onchain_data_uri bytes
  data.set(uriBytes, 24);
  
  return data;
}

/**
 * Serializes argument data for `send_batch_messages` instruction
 */
export function serializeSendBatchMessagesArgs(messages: MessageInput[]): Uint8Array {
  const encoder = new TextEncoder();
  
  // 8 (disc) + 4 (vector size u32)
  let size = 8 + 4;
  
  const serializedMessages = messages.map(msg => {
    const recipientKey = new PublicKey(msg.recipient);
    const contentBytes = encoder.encode(msg.content);
    return {
      recipientBytes: recipientKey.toBuffer(),
      contentBytes,
      timestamp: msg.timestamp
    };
  });
  
  serializedMessages.forEach(sm => {
    size += 32; // Pubkey recipient
    size += 4;  // content length u32
    size += sm.contentBytes.length; // content bytes
    size += 8;  // timestamp i64
  });
  
  const data = new Uint8Array(size);
  const view = new DataView(data.buffer);
  
  // 1. Discriminator: SHA256("global:send_batch_messages")[0..8]
  // The deployed program uses the standard Anchor sighash, NOT the IDL discriminator
  const disc = [248, 133, 54, 245, 207, 122, 71, 34];
  for (let i = 0; i < 8; i++) data[i] = disc[i];
  
  // 2. messages length: u32 LE
  view.setUint32(8, messages.length, true);
  
  let offset = 12;
  serializedMessages.forEach(sm => {
    // Write recipient key bytes (32 bytes)
    data.set(sm.recipientBytes, offset);
    offset += 32;
    
    // Write content string length u32 LE
    view.setUint32(offset, sm.contentBytes.length, true);
    offset += 4;
    
    // Write content string bytes
    data.set(sm.contentBytes, offset);
    offset += sm.contentBytes.length;
    
    // Write timestamp i64 LE
    const low = sm.timestamp % 0x100000000;
    const high = Math.floor(sm.timestamp / 0x100000000);
    view.setUint32(offset, low, true);
    view.setUint32(offset + 4, high, true);
    offset += 8;
  });
  
  return data;
}

// ─── Transaction Builders ───────────────────────────────────────────────────

export function buildRegisterUserInstruction(
  userPubKey: PublicKey,
  nftMintPubKey: PublicKey,
  txCount: number,
  contractTypes: number,
  dataUri: string
): TransactionInstruction {
  const userProfilePDA = getUserProfilePDA(userPubKey);
  const nftTokenAccount = getAssociatedTokenAddress(nftMintPubKey, userPubKey);
  const data = serializeRegisterUserArgs(txCount, contractTypes, dataUri);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userProfilePDA, isSigner: false, isWritable: true },
      { pubkey: nftMintPubKey, isSigner: true, isWritable: true },
      { pubkey: nftTokenAccount, isSigner: false, isWritable: true },
      { pubkey: userPubKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.from(data) as any,
  });
}

export function buildSendMessagesInstruction(
  userPubKey: PublicKey,
  messages: MessageInput[]
): TransactionInstruction {
  const userProfilePDA = getUserProfilePDA(userPubKey);
  const data = serializeSendBatchMessagesArgs(messages);

  // Collect unique recipient PDAs so Solana indexes this transaction
  // under each recipient's PDA. This enables 1:1 message retrieval
  // without modifying the on-chain program (they become remaining_accounts).
  const recipientPDAs: { pubkey: PublicKey; isSigner: false; isWritable: false }[] = [];
  const seenRecipients = new Set<string>();
  for (const msg of messages) {
    if (!seenRecipients.has(msg.recipient)) {
      seenRecipients.add(msg.recipient);
      try {
        const recipientPubkey = new PublicKey(msg.recipient);
        const recipientPDA = getUserProfilePDA(recipientPubkey);
        // Don't add if it's the same as the sender's PDA
        if (!recipientPDA.equals(userProfilePDA)) {
          recipientPDAs.push({ pubkey: recipientPDA, isSigner: false, isWritable: false });
        }
      } catch {
        // Skip invalid recipient addresses
      }
    }
  }

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: userProfilePDA, isSigner: false, isWritable: true },
      { pubkey: userPubKey, isSigner: true, isWritable: true },
      // Recipient PDAs as remaining_accounts for indexing
      ...recipientPDAs,
    ],
    data: Buffer.from(data) as any,
  });
}
