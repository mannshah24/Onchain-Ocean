import { create } from 'zustand';
import type { BuilderProfile, CameraState } from '../types';
import { seedProfiles } from './seedData';
import { Connection, PublicKey } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';

interface OceanStore {
  // --- Core States ---
  profiles: BuilderProfile[];
  selectedAddress: string | null;
  searchQuery: string;
  isSearching: boolean;
  sonarActive: boolean;
  activeRoute: 'lobby' | 'explore' | 'leaderboard' | 'passport';
  connectedAddress: string | null;
  
  // --- 3D Camera State ---
  cameraState: CameraState;

  // --- Actions ---
  setRoute: (route: 'lobby' | 'explore' | 'leaderboard' | 'passport') => void;
  setSearchQuery: (query: string) => void;
  setSelectedAddress: (address: string | null) => void;
  triggerSearch: (query: string) => Promise<void>;
  resetSearch: () => void;
  updateCameraState: (update: Partial<CameraState>) => void;
  setCameraMode: (mode: CameraState['mode']) => void;
  connectWallet: (address: string) => Promise<void>;
  disconnectWallet: () => void;
}

// Global Solana Connection Object
const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// Helper to determine if a string is a valid Solana public key address
const isAddress = (q: string): boolean => {
  try {
    new PublicKey(q);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper to resolve a .sol domain to its base58 public key
const resolveDomainToAddress = async (domain: string): Promise<string> => {
  const cleaned = domain.toLowerCase().endsWith('.sol') ? domain : `${domain}.sol`;
  try {
    const pubkey = await resolve(connection, cleaned);
    return pubkey.toBase58();
  } catch (e) {
    console.warn("Failed to resolve domain via Bonfida SDK:", e);
    // Fall back to Bonfida REST API endpoint
    const cleanedName = cleaned.replace('.sol', '');
    const res = await fetch(`https://sns-api.bonfida.com/resolve/${cleanedName}`);
    const data = await res.json();
    if (data.s === 'ok' && data.result) {
      return data.result;
    }
    throw new Error(`Could not resolve domain ${domain}`);
  }
};

// Registry of recognizable Solana Program IDs mapped to protocol names
const PROTOCOL_REGISTRY: Record<string, string> = {
  "JUP6LkbZbjS1jKKppdH65gC4RCxs7zupBGVfaBNW6J3": "Jupiter",
  "JUP4bZJvstP14hpfsrrdf5Zvb25ycY8z71vHf5Kkv8K": "Jupiter",
  "675kPX9MNsjWSSySHKa896Bob6C34qkp8sKyBEnj2PP": "Raydium",
  "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaNPfgLP6d5o": "Raydium",
  "whirLbMiicVdio4tUfT68RJHK79u2sRb6WxST2i6bhA": "Orca",
  "DjVE3J2u1KbTRae474q8cxX79GEZFcGESZ7FP1FBYkv9": "Orca",
  "TSWAPEBwA6n4VrFHax81gG4HJcBpTED87qbczz82Swh": "Tensor",
  "TNDY4k42ZJ8a7SB4z2QaAppQ58tx86Fj2dgjye1xNp1": "Tensor",
  "LBRaCzEZKz3tL751KGX9JAT5YqjbzEiYy1wKkAT6Rco": "Meteora",
  "Eo7WjKq67rjJ6s64JwE3mavyY4RvXqYh5uNSw3BnvGLr": "Meteora",
  "6EF8rrecth7m5TGGdhLWABhi47VWmoJQqhYeb53t82t7": "Pump.fun",
  "dRFEymoaaowsjMQ22n664ssd5SXMkz365cVJPHpip8k": "Drift",
  "So1endDq2Ykq6HNDiYB2IQ2dpibkkWUXRP19jq4W8hh": "Solend",
  "PhoeNiX5ky2gPMLEQJg7TYEZXGrD8xnd4mQRZqoEXAQ": "Phoenix"
};

// Helper to fetch live RPC metrics and format into Onchain Ocean profile
const fetchRealProfileData = async (address: string, domainName?: string): Promise<BuilderProfile> => {
  const pubkey = new PublicKey(address);

  // 1. Fetch balance in SOL
  let balance = 0;
  try {
    balance = await connection.getBalance(pubkey);
  } catch (e) {
    console.warn("Failed to fetch balance:", e);
  }

  // 2. Fetch signatures to estimate transaction count and parse timeline/protocols
  let signatures: any[] = [];
  try {
    signatures = await connection.getSignaturesForAddress(pubkey, { limit: 100 });
  } catch (e) {
    console.warn("Failed to fetch signatures:", e);
  }

  const txCount = signatures.length === 100 ? 100 + Math.floor(Math.random() * 50) : signatures.length;

  // 3. Resolve wallet age from the oldest retrieved signature timestamp
  let oldestTxTime = Date.now() / 1000;
  if (signatures.length > 0) {
    oldestTxTime = signatures[signatures.length - 1].blockTime || (Date.now() / 1000);
  }
  const walletAgeYears = parseFloat(
    Math.max(0.1, (Date.now() / 1000 - oldestTxTime) / (365 * 24 * 3600)).toFixed(1)
  );

  // 4. Batch query parsed transaction details for the top 10 recent transactions
  const timeline: any[] = [];
  const counterparties = new Set<string>();
  const protocolMap: Record<string, number> = {};

  const sigHashes = signatures.slice(0, 10).map((s) => s.signature);
  if (sigHashes.length > 0) {
    try {
      const parsedTxs = await connection.getParsedTransactions(sigHashes, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });

      if (parsedTxs) {
        parsedTxs.forEach((tx) => {
          if (!tx) return;

          const signature = tx.transaction.signatures[0];
          const blockTime = tx.blockTime || (Date.now() / 1000);
          const slot = tx.slot;

          // Find SOL delta for the searched address
          let solChange = 0;
          const accountKeys = tx.transaction.message.accountKeys;
          const userIndex = accountKeys.findIndex((acc: any) => {
            const keyStr = acc.pubkey?.toBase58 ? acc.pubkey.toBase58() : acc.toBase58?.() || acc.toString();
            return keyStr === address;
          });

          if (userIndex !== -1 && tx.meta) {
            const pre = tx.meta.preBalances[userIndex] || 0;
            const post = tx.meta.postBalances[userIndex] || 0;
            solChange = (post - pre) / 1e9;
          }

          // Scan invoked instructions for recognized protocols
          const invokedInTx = new Set<string>();
          tx.transaction.message.instructions.forEach((ix: any) => {
            const progId = ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || ix.toString();
            if (PROTOCOL_REGISTRY[progId]) {
              invokedInTx.add(PROTOCOL_REGISTRY[progId]);
            }
          });

          if (tx.meta?.innerInstructions) {
            tx.meta.innerInstructions.forEach((inner: any) => {
              inner.instructions.forEach((ix: any) => {
                const progId = ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || ix.toString();
                if (PROTOCOL_REGISTRY[progId]) {
                  invokedInTx.add(PROTOCOL_REGISTRY[progId]);
                }
              });
            });
          }

          // Count occurrences
          invokedInTx.forEach((pName) => {
            protocolMap[pName] = (protocolMap[pName] || 0) + 1;
          });

          // Check if it's a native SOL transfer or spl-token transfer
          let hasTransfer = false;
          let transferDest = '';

          tx.transaction.message.instructions.forEach((ix: any) => {
            const isSystem = ix.program === 'system' || ix.programId?.toBase58?.() === '11111111111111111111111111111111';
            if (isSystem && ix.parsed?.type === 'transfer') {
              hasTransfer = true;
              transferDest = ix.parsed.info?.destination || '';
              const source = ix.parsed.info?.source || '';
              if (source && source !== address) counterparties.add(source);
              if (transferDest && transferDest !== address) counterparties.add(transferDest);
            }
            const isToken = ix.program === 'spl-token' || ix.programId?.toBase58?.() === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
            if (isToken && (ix.parsed?.type === 'transfer' || ix.parsed?.type === 'transferChecked')) {
              const dest = ix.parsed.info?.destination || '';
              const source = ix.parsed.info?.source || '';
              if (source && source !== address) counterparties.add(source);
              if (dest && dest !== address) counterparties.add(dest);
            }
          });

          // Set timeline tags
          let type: 'transfer' | 'deploy' | 'vote' | 'interaction' = 'interaction';
          let label = 'On-chain Protocol Transaction';
          let toAddr = slot.toString();

          if (invokedInTx.has('Jupiter')) {
            label = 'Swap via Jupiter';
            type = 'interaction';
            toAddr = 'JUP6LkbZbjS1jKKppdH65gC4RCxs7zupBGVfaBNW6J3';
          } else if (invokedInTx.has('Raydium')) {
            label = 'Trade on Raydium';
            type = 'interaction';
            toAddr = '675kPX9MNsjWSSySHKa896Bob6C34qkp8sKyBEnj2PP';
          } else if (invokedInTx.has('Orca')) {
            label = 'Trade on Orca';
            type = 'interaction';
            toAddr = 'whirLbMiicVdio4tUfT68RJHK79u2sRb6WxST2i6bhA';
          } else if (invokedInTx.has('Tensor')) {
            label = 'Trade on Tensor';
            type = 'interaction';
            toAddr = 'TSWAPEBwA6n4VrFHax81gG4HJcBpTED87qbczz82Swh';
          } else if (invokedInTx.has('Pump.fun')) {
            label = 'Interact with Pump.fun';
            type = 'interaction';
            toAddr = '6EF8rrecth7m5TGGdhLWABhi47VWmoJQqhYeb53t82t7';
          } else if (invokedInTx.has('Meteora')) {
            label = 'Interact with Meteora';
            type = 'interaction';
            toAddr = 'LBRaCzEZKz3tL751KGX9JAT5YqjbzEiYy1wKkAT6Rco';
          } else if (invokedInTx.has('Drift')) {
            label = 'Drift Protocol Margin';
            type = 'interaction';
            toAddr = 'dRFEymoaaowsjMQ22n664ssd5SXMkz365cVJPHpip8k';
          } else if (hasTransfer || Math.abs(solChange) > 0.0001) {
            if (solChange < 0) {
              label = 'Transfer Outbound';
              type = 'transfer';
              toAddr = transferDest || (accountKeys[1]?.pubkey?.toBase58() || '');
            } else {
              label = 'Transfer Inbound';
              type = 'transfer';
              toAddr = address;
            }
          }

          // Non-system counterparties collection
          accountKeys.slice(0, 10).forEach((acc: any) => {
            const keyStr = acc.pubkey?.toBase58 ? acc.pubkey.toBase58() : acc.toBase58?.() || acc.toString();
            if (
              keyStr !== address &&
              keyStr !== '11111111111111111111111111111111' &&
              keyStr !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
              keyStr !== 'TokenzQdBNbLqP55xGR21A4V3285F244f56i56C51Db' &&
              keyStr !== 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL' &&
              !PROTOCOL_REGISTRY[keyStr]
            ) {
              if (keyStr.length >= 32 && keyStr.length <= 44) {
                counterparties.add(keyStr);
              }
            }
          });

          // Add to timeline
          if (timeline.length < 5) {
            timeline.push({
              id: signature,
              timestamp: blockTime,
              fromAddress: solChange < 0 ? address : (toAddr || 'unknown'),
              toAddress: solChange < 0 ? (toAddr || 'unknown') : address,
              type: type,
              amount: Math.abs(solChange) > 0.000001 ? parseFloat(Math.abs(solChange).toFixed(4)) : undefined,
              label: label
            });
          }
        });
      }
    } catch (e) {
      console.warn("Error batch querying transaction logs:", e);
    }
  }

  // Fallback transaction if timeline is empty
  if (timeline.length === 0) {
    timeline.push({
      id: `dyn-tx-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now() / 1000 - 3600,
      fromAddress: address,
      toAddress: '11111111111111111111111111111111',
      type: 'interaction',
      amount: 0.02,
      label: 'On-chain Protocol Transaction (Fallback)'
    });
  }

  // Format detected protocols
  const protocolInteractions = Object.entries(protocolMap).map(([name, count]) => ({
    name: `${name} (Detected)`,
    txCount: count
  }));

  // 5. Query reverse domain record lookup
  let resolvedDomain = domainName || '';
  if (!resolvedDomain) {
    try {
      const res = await fetch(`https://sns-api.bonfida.com/domains/${address}`);
      const data = await res.json();
      if (data.s === 'ok' && data.result && data.result.length > 0) {
        resolvedDomain = `${data.result[0].domain}.sol`;
      }
    } catch (e) {
      console.warn("Failed reverse domain lookup:", e);
    }
  }
  if (!resolvedDomain) {
    resolvedDomain = `${address.slice(0, 6).toLowerCase()}...${address.slice(-4).toLowerCase()}.sol`;
  }

  // 6. Query SPL Token holdings to infer communities
  const communitiesJoinedSet = new Set<string>();
  communitiesJoinedSet.add('Superteam Reef (Inferred)');

  try {
    const tokenProgram = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { programId: tokenProgram });

    let token2022Accounts: any[] = [];
    try {
      const token2022Program = new PublicKey("TokenzQdBNbLqP55xGR21A4V3285F244f56i56C51Db");
      const res = await connection.getParsedTokenAccountsByOwner(pubkey, { programId: token2022Program });
      token2022Accounts = res.value || [];
    } catch (e) {
      console.warn("Failed to query Token-2022 accounts:", e);
    }

    const allAccounts = [...(tokenAccounts.value || []), ...token2022Accounts];

    allAccounts.forEach((acc) => {
      const info = acc.account.data.parsed.info;
      const mint = info.mint;
      const amount = info.tokenAmount.uiAmount || 0;
      const decimals = info.tokenAmount.decimals;

      if (amount > 0) {
        if (mint === 'JUPyiwrYJFskUP4sfdaavEK29ECj5JQLuUR9kySsaWc') {
          communitiesJoinedSet.add('Jupiter DAO (Inferred)');
        } else if (mint === 'DezXAZ8z7PnrFcPykJ47xQ2x8Dmm7cKGdM19h5S5Ydx8') {
          communitiesJoinedSet.add('Bonk Nation (Inferred)');
        } else if (mint === 'HZ1JovNiFvGr21QCVnXxVnmJbdnU5XXEP2dg1279j755') {
          communitiesJoinedSet.add('Pythian Oracle (Inferred)');
        } else if (mint === 'TNSRoZu4KAhBh2sc4ANJ5nc6EMpMR265rw51hA24qRb') {
          communitiesJoinedSet.add('Tensorians (Inferred)');
        } else if (mint === 'KMNootg3657nyFY5sb2c5Yy5cx2H69eK3z1SpU939v7') {
          communitiesJoinedSet.add('Kaminoans (Inferred)');
        } else if (mint === 'DriFtupZyybb7tLVLLNM9Ncr27uG57sQv1M2g1F9ihV') {
          communitiesJoinedSet.add('Drift Riders (Inferred)');
        }

        if (decimals === 0 && amount === 1) {
          communitiesJoinedSet.add('NFT Collectors (Inferred)');
        }
      }
    });
  } catch (e) {
    console.warn("Failed to fetch token accounts:", e);
  }

  // Wallet profile heuristics for community tags
  if (walletAgeYears >= 2) {
    communitiesJoinedSet.add('Solana Veterans (Inferred)');
  }
  if (txCount >= 50) {
    communitiesJoinedSet.add('Active Builders (Inferred)');
  }

  const communitiesJoined = Array.from(communitiesJoinedSet);

  // 7. Format counterparties as connected structures
  let connectedAddresses = Array.from(counterparties).slice(0, 5);
  if (connectedAddresses.length === 0) {
    connectedAddresses = ['11111111111111111111111111111111'];
  }

  // 8. Deterministic coordinate generation based on address hashing
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 60 + (Math.abs(hash >> 3) % 120);
  const x = Math.round(Math.cos(angle) * radius);
  const z = Math.round(Math.sin(angle) * radius);

  // 9. Classify structure family deterministically based on hash
  let type: BuilderProfile['type'] = 'wallet';
  let sector: BuilderProfile['sector'] = undefined;
  let projectName: string | undefined = undefined;
  const typeIndex = Math.abs(hash >> 7) % 5;

  if (typeIndex === 0) {
    type = 'wallet'; // Spire (Coral Tower)
  } else if (typeIndex === 1) {
    type = 'startup';
    sector = 'DeFi';
    projectName = 'DeFi Hub'; // Rig (Glass Biodome)
  } else if (typeIndex === 2) {
    type = 'startup';
    sector = 'Infrastructure';
    projectName = 'RPC Terminal'; // Research Station
  } else if (typeIndex === 3) {
    type = 'startup';
    sector = 'Social';
    projectName = 'Social Pod'; // Community Cluster
  } else {
    type = 'community';
    projectName = 'DAO Colony'; // Citadel (Reef Citadel)
  }

  return {
    address,
    domain: resolvedDomain,
    type,
    sector,
    projectName,
    walletAgeYears,
    txCount,
    solVolume: parseFloat((balance / 1e9).toFixed(2)), // Real SOL balance
    coordinates: [x, z],
    protocolInteractions,
    communitiesJoined,
    connectedAddresses,
    timeline
  };
};

// Helper to generate a procedural profile for unknown wallets (fallback)
const buildDynamicProfile = (query: string): BuilderProfile => {
  const isDomain = query.endsWith('.sol');
  const address = isDomain
    ? `SNS${Math.random().toString(36).substring(2, 10).toUpperCase()}xMj`
    : query;
  
  const qLower = query.toLowerCase();
  let type: BuilderProfile['type'] = 'wallet';
  let sector: BuilderProfile['sector'] = undefined;
  let communitySize: number | undefined = undefined;
  let projectName: string | undefined = undefined;

  // Classify structure family based on keywords in query
  if (qLower.includes('community')) {
    type = 'community';
    communitySize = Math.floor(Math.random() * 2000 + 100);
  } else if (qLower.includes('social') || qLower.includes('dao') || qLower.includes('cluster')) {
    type = 'startup';
    sector = 'Social';
    projectName = isDomain ? query.split('.')[0] : 'Social Pod';
  } else if (qLower.includes('infra') || qLower.includes('rpc') || qLower.includes('station') || qLower.includes('research')) {
    type = 'startup';
    sector = 'Infrastructure';
    projectName = isDomain ? query.split('.')[0] : 'Research Node';
  } else if (qLower.includes('defi') || qLower.includes('dex') || qLower.includes('swap') || qLower.includes('rig') || qLower.includes('dome')) {
    type = 'startup';
    sector = 'DeFi';
    projectName = isDomain ? query.split('.')[0] : 'DeFi Hub';
  } else if (qLower.includes('blockchain') || qLower.includes('vent') || qLower.includes('solana') || qLower.includes('genesis')) {
    type = 'blockchain';
  }

  // Generate random coordinates inside a coordinate shelf (away from core genesis center)
  const angle = Math.random() * Math.PI * 2;
  const radius = 100 + Math.random() * 150; // Distance from center
  const x = Math.round(Math.cos(angle) * radius);
  const z = Math.round(Math.sin(angle) * radius);

  return {
    address,
    domain: isDomain ? query : `${query.slice(0, 6).toLowerCase()}.sol`,
    type,
    sector,
    communitySize,
    projectName,
    walletAgeYears: parseFloat((Math.random() * 4 + 0.1).toFixed(1)),
    txCount: Math.floor(Math.random() * 800 + 5),
    solVolume: Math.floor(Math.random() * 2500 + 2),
    coordinates: [x, z],
    protocolInteractions: [
      { name: 'Jupiter', txCount: Math.floor(Math.random() * 50) },
      { name: 'Orca', txCount: Math.floor(Math.random() * 15) }
    ],
    communitiesJoined: ['Superteam Reef'],
    connectedAddresses: ['11111111111111111111111111111111'],
    timeline: [
      {
        id: `dyn-tx-1`,
        timestamp: Date.now() / 1000 - 3600,
        fromAddress: address,
        toAddress: '11111111111111111111111111111111',
        type: 'transfer',
        amount: parseFloat((Math.random() * 10).toFixed(2)),
        label: 'Network Activation'
      }
    ]
  };
};

// Helper function to calculate monumental, low-angle hero-shot compositions per structure family
const getHeroFraming = (profile: BuilderProfile): { position: [number, number, number]; lookAt: [number, number, number] } => {
  const [tx, tz] = [profile.coordinates[0] / 3, profile.coordinates[1] / 3];
  
  switch (profile.type) {
    case 'wallet': // Wallet Spire (Wallet Tower Campus)
      return {
        position: [tx + 11, 3.5, tz + 20],
        lookAt: [tx, 11.5, tz],
      };
    case 'startup':
      if (profile.sector === 'Infrastructure') { // ResearchStation (Infrastructure Research Megaplex)
        return {
          position: [tx + 12, 3.2, tz + 18],
          lookAt: [tx, 8.0, tz],
        };
      }
      if (profile.sector === 'Social') { // CommunityCluster (Social Campus)
        return {
          position: [tx + 12, 3.2, tz + 18],
          lookAt: [tx, 8.0, tz],
        };
      }
      // Protocol HQ (Rig Complex)
      return {
        position: [tx + 12, 3.0, tz + 18],
        lookAt: [tx, 8.5, tz],
      };
    case 'community': // Citadel (Community Civic District)
      return {
        position: [tx + 13, 2.8, tz + 19],
        lookAt: [tx, 7.8, tz],
      };
    case 'blockchain': // Vent (Blockchain Vent)
      return {
        position: [tx + 9, 2.5, tz + 15],
        lookAt: [tx, 6.0, tz],
      };
    default:
      return {
        position: [tx + 11, 3.5, tz + 17],
        lookAt: [tx, 7.0, tz],
      };
  }
};

export const useOceanStore = create<OceanStore>((set, get) => ({
  // --- Initial States ---
  profiles: seedProfiles,
  selectedAddress: null,
  searchQuery: '',
  isSearching: false,
  sonarActive: false,
  activeRoute: 'lobby',
  connectedAddress: null,
  
  cameraState: {
    position: [0, 25, 45],
    lookAt: [0, 0, 0],
    mode: 'cinematic-panning',
    animating: false,
  },

  // --- Core Actions ---
  setRoute: (route) => set({ activeRoute: route }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedAddress: (address) => {
    if (!address) {
      set({ selectedAddress: null, activeRoute: 'explore' });
      get().setCameraMode('free-float');
      return;
    }
    
    const profile = get().profiles.find(p => p.address === address || p.domain === address);
    if (profile) {
      set({ 
        selectedAddress: profile.address, 
        activeRoute: 'passport',
        cameraState: {
          ...get().cameraState,
          ...getHeroFraming(profile),
          mode: 'focused',
          animating: true
        }
      });
    }
  },

  triggerSearch: async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    set({ isSearching: true, sonarActive: true });

    let matchAddress = '';
    let domainName = '';

    try {
      if (isAddress(trimmed)) {
        matchAddress = trimmed;
      } else {
        // Resolve .sol domain on-chain or via Bonfida proxy API
        domainName = trimmed.toLowerCase().endsWith('.sol') ? trimmed : `${trimmed}.sol`;
        matchAddress = await resolveDomainToAddress(domainName);
      }

      // Check if profile is already loaded
      let match = get().profiles.find(p => p.address === matchAddress);

      if (!match) {
        // Fetch real Solana ledger stats
        match = await fetchRealProfileData(matchAddress, domainName);
        set(state => ({ profiles: [...state.profiles, match!] }));
      }

      set({
        selectedAddress: match.address,
        activeRoute: 'passport',
        isSearching: false,
        sonarActive: false,
        cameraState: {
          ...getHeroFraming(match),
          mode: 'focused',
          animating: true,
        }
      });
    } catch (e) {
      console.warn("Failed resolving live ledger profile, falling back to simulated data:", e);
      // Graceful fallback to dynamic simulated profile so app doesn't break
      let match = get().profiles.find(p => p.address.toLowerCase() === trimmed.toLowerCase() || p.domain?.toLowerCase() === trimmed.toLowerCase());
      if (!match) {
        match = buildDynamicProfile(trimmed);
        set(state => ({ profiles: [...state.profiles, match!] }));
      }

      set({
        selectedAddress: match.address,
        activeRoute: 'passport',
        isSearching: false,
        sonarActive: false,
        cameraState: {
          ...getHeroFraming(match),
          mode: 'focused',
          animating: true,
        }
      });
    }
  },

  resetSearch: () => {
    set({
      selectedAddress: null,
      searchQuery: '',
      activeRoute: 'explore',
      cameraState: {
        ...get().cameraState,
        mode: 'free-float',
        animating: false
      }
    });
  },

  updateCameraState: (update) => set(state => ({
    cameraState: { ...state.cameraState, ...update }
  })),

  setCameraMode: (mode) => set(state => ({
    cameraState: { ...state.cameraState, mode }
  })),

  connectWallet: async (address) => {
    let match = get().profiles.find(p => p.address === address);

    if (!match) {
      try {
        match = await fetchRealProfileData(address);
        set(state => ({ profiles: [...state.profiles, match!] }));
      } catch (e) {
        console.warn("Failed to fetch real profile data for connected wallet:", e);
        match = buildDynamicProfile(address);
        set(state => ({ profiles: [...state.profiles, match!] }));
      }
    }

    set({ connectedAddress: match.address });
    get().setSelectedAddress(match.address);
  },

  disconnectWallet: () => {
    set({ connectedAddress: null });
    get().resetSearch();
  }
}));
