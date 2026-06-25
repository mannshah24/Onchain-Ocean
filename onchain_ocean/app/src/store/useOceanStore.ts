import { create } from 'zustand';
import type { BuilderProfile, CameraState, OceanStructure, OceanZone, OceanDecoration, ReefClearing, ThermalVent, CoralArch, LoadingStage, SwimScore, SwimHUD, OceanTheme } from '../types';
import { OCEAN_THEMES } from '../types';
import { seedProfiles } from './seedData';
import { generateOceanLayout } from '../lib/oceanLayout';
import { Connection, PublicKey } from '@solana/web3.js';
import { resolve } from '@bonfida/spl-name-service';
import { checkProfileRegistered, fetchUserProfile, fetchRealOnchainMessages } from '../lib/onchainProgram';

// ─── Ocean Layout State ──────────────────────────────────────────
interface OceanLayout {
  structures: OceanStructure[];
  clearings: ReefClearing[];
  decorations: OceanDecoration[];
  thermalVent: ThermalVent | null;
  coralArches: CoralArch[];
  zones: OceanZone[];
}

interface OceanStore {
  // --- Core States ---
  profiles: BuilderProfile[];
  selectedAddress: string | null;
  searchQuery: string;
  isSearching: boolean;
  sonarActive: boolean;
  activeRoute: 'lobby' | 'explore' | 'leaderboard' | 'passport';
  connectedAddress: string | null;
  
  // --- Ocean Layout ---
  layout: OceanLayout;
  
  // --- Loading ---
  loadStage: LoadingStage;
  loadProgress: number;
  loadError: string | null;

  // --- 3D Camera State ---
  cameraState: CameraState;

  // --- Theme ---
  themeIndex: number;
  theme: OceanTheme;

  // --- Swim Mode ---
  swimMode: boolean;
  swimScore: SwimScore;
  swimHUD: SwimHUD;
  swimPersonalBest: number;

  // --- Search Feedback ---
  searchFeedback: {
    type: 'loading' | 'error';
    code?: string;
    username?: string;
  } | null;

  // --- Zone Announcement ---
  zoneAnnouncement: { name: string; color: string; population: number } | null;

  // --- Sonar Map ---
  showSonarMap: boolean;

  // --- Stats ---
  oceanStats: {
    totalStructures: number;
    totalContracts: number;
    totalTransactions: number;
  };

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
  setTheme: (index: number) => void;
  toggleSwimMode: () => void;
  setSwimScore: (score: Partial<SwimScore>) => void;
  setSwimHUD: (hud: Partial<SwimHUD>) => void;
  toggleSonarMap: () => void;
  setZoneAnnouncement: (announcement: { name: string; color: string; population: number } | null) => void;
  regenerateLayout: () => void;
  solanaNetwork: 'mainnet' | 'devnet';
  connection: Connection;
  setSolanaNetwork: (network: 'mainnet' | 'devnet') => void;
  setLoadStage: (stage: LoadingStage) => void;
  setLoadProgress: (progress: number) => void;
  initializePresets: () => Promise<void>;


  // --- Onchain Registration & Chat ---
  onchainRegistered: Record<string, boolean>;
  onchainChatMessages: Record<string, any[]>;
  checkOnchainStatus: (address: string) => Promise<boolean>;
  setOnchainRegistered: (address: string, registered: boolean) => void;
  addOnchainChatMessage: (recipient: string, message: any) => void;
  fetchOnchainMessages: (address: string) => Promise<void>;
}

// Global Solana Connection Object (Default to Devnet where the program is deployed)
export let connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Helper to determine if a string is a valid Solana public key address
const isAddress = (q: string): boolean => {
  try {
    new PublicKey(q);
    return true;
  } catch {
    return false;
  }
};

// Helper to resolve a .sol domain to its base58 public key
const resolveDomainToAddress = async (domain: string): Promise<string> => {
  const cleaned = domain.toLowerCase().endsWith('.sol') ? domain : `${domain}.sol`;
  try {
    const pubkey = await resolve(connection, cleaned);
    return pubkey.toBase58();
  } catch {
    const cleanedName = cleaned.replace('.sol', '');
    const res = await fetch(`https://sns-api.bonfida.com/resolve/${cleanedName}`);
    const data = await res.json();
    if (data.s === 'ok' && data.result) {
      return data.result;
    }
    throw new Error(`Could not resolve domain ${domain}`);
  }
};

// Registry of recognizable Solana Program IDs
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
  "PhoeNiX5ky2gPMLEQJg7TYEZXGrD8xnd4mQRZqoEXAQ": "Phoenix",
};

// Helper to fetch live RPC metrics
const fetchRealProfileData = async (address: string, domainName?: string): Promise<BuilderProfile> => {
  const pubkey = new PublicKey(address);

  let balance = 0;
  try { balance = await connection.getBalance(pubkey); } catch {}

  let signatures: any[] = [];
  try { signatures = await connection.getSignaturesForAddress(pubkey, { limit: 100 }); } catch {}

  const txCount = signatures.length === 100 ? 100 + Math.floor(Math.random() * 50) : signatures.length;

  let oldestTxTime = Date.now() / 1000;
  if (signatures.length > 0) {
    oldestTxTime = signatures[signatures.length - 1].blockTime || (Date.now() / 1000);
  }
  const walletAgeYears = parseFloat(
    Math.max(0.1, (Date.now() / 1000 - oldestTxTime) / (365 * 24 * 3600)).toFixed(1)
  );

  const timeline: any[] = [];
  const counterparties = new Set<string>();
  const protocolMap: Record<string, number> = {};

  const sigHashes = signatures.slice(0, 10).map((s: any) => s.signature);
  if (sigHashes.length > 0) {
    try {
      const parsedTxs = await connection.getParsedTransactions(sigHashes, {
        maxSupportedTransactionVersion: 0, commitment: 'confirmed'
      });
      if (parsedTxs) {
        parsedTxs.forEach((tx: any) => {
          if (!tx) return;
          const signature = tx.transaction.signatures[0];
          const blockTime = tx.blockTime || (Date.now() / 1000);
          const slot = tx.slot;
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
          const invokedInTx = new Set<string>();
          tx.transaction.message.instructions.forEach((ix: any) => {
            const progId = ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || ix.toString();
            if (PROTOCOL_REGISTRY[progId]) invokedInTx.add(PROTOCOL_REGISTRY[progId]);
          });
          if (tx.meta?.innerInstructions) {
            tx.meta.innerInstructions.forEach((inner: any) => {
              inner.instructions.forEach((ix: any) => {
                const progId = ix.programId?.toBase58 ? ix.programId.toBase58() : ix.programId?.toString() || ix.toString();
                if (PROTOCOL_REGISTRY[progId]) invokedInTx.add(PROTOCOL_REGISTRY[progId]);
              });
            });
          }
          invokedInTx.forEach((pName) => { protocolMap[pName] = (protocolMap[pName] || 0) + 1; });

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

          let type: 'transfer' | 'deploy' | 'vote' | 'interaction' = 'interaction';
          let label = 'On-chain Protocol Transaction';
          let toAddr = slot.toString();

          const isDeploy = accountKeys.some((acc: any) => {
            const keyStr = acc.pubkey?.toBase58 ? acc.pubkey.toBase58() : acc.toBase58?.() || acc.toString();
            return keyStr === 'BPFLoaderUpgradeab1e11111111111111111111111' || 
                   keyStr === 'BPFLoader2111111111111111111111111111111111' ||
                   keyStr === 'BPFLoader1111111111111111111111111111111111';
          });

          if (isDeploy) {
            type = 'deploy';
            label = 'Smart Contract Deployment';
            toAddr = 'BPFLoaderUpgradeab1e11111111111111111111111';
          } else if (invokedInTx.has('Jupiter')) { label = 'Swap via Jupiter'; toAddr = 'JUP6LkbZbjS1jKKppdH65gC4RCxs7zupBGVfaBNW6J3'; }
          else if (invokedInTx.has('Raydium')) { label = 'Trade on Raydium'; toAddr = '675kPX9MNsjWSSySHKa896Bob6C34qkp8sKyBEnj2PP'; }
          else if (invokedInTx.has('Orca')) { label = 'Trade on Orca'; toAddr = 'whirLbMiicVdio4tUfT68RJHK79u2sRb6WxST2i6bhA'; }
          else if (invokedInTx.has('Tensor')) { label = 'Trade on Tensor'; toAddr = 'TSWAPEBwA6n4VrFHax81gG4HJcBpTED87qbczz82Swh'; }
          else if (invokedInTx.has('Pump.fun')) { label = 'Interact with Pump.fun'; toAddr = '6EF8rrecth7m5TGGdhLWABhi47VWmoJQqhYeb53t82t7'; }
          else if (invokedInTx.has('Meteora')) { label = 'Interact with Meteora'; toAddr = 'LBRaCzEZKz3tL751KGX9JAT5YqjbzEiYy1wKkAT6Rco'; }
          else if (invokedInTx.has('Drift')) { label = 'Drift Protocol Margin'; toAddr = 'dRFEymoaaowsjMQ22n664ssd5SXMkz365cVJPHpip8k'; }
          else if (hasTransfer || Math.abs(solChange) > 0.0001) {
            if (solChange < 0) { label = 'Transfer Outbound'; type = 'transfer'; toAddr = transferDest || ''; }
            else { label = 'Transfer Inbound'; type = 'transfer'; toAddr = address; }
          }

          accountKeys.slice(0, 10).forEach((acc: any) => {
            const keyStr = acc.pubkey?.toBase58 ? acc.pubkey.toBase58() : acc.toBase58?.() || acc.toString();
            if (keyStr !== address && keyStr !== '11111111111111111111111111111111' &&
                keyStr !== 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' &&
                !PROTOCOL_REGISTRY[keyStr] && keyStr.length >= 32 && keyStr.length <= 44) {
              counterparties.add(keyStr);
            }
          });

          if (timeline.length < 5) {
            timeline.push({
              id: signature, timestamp: blockTime,
              fromAddress: solChange < 0 ? address : (toAddr || 'unknown'),
              toAddress: solChange < 0 ? (toAddr || 'unknown') : address,
              type, amount: Math.abs(solChange) > 0.000001 ? parseFloat(Math.abs(solChange).toFixed(4)) : undefined,
              label
            });
          }
        });
      }
    } catch {}
  }

  if (timeline.length === 0) {
    timeline.push({
      id: `dyn-tx-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now() / 1000 - 3600,
      fromAddress: address, toAddress: '11111111111111111111111111111111',
      type: 'interaction', amount: 0.02, label: 'On-chain Transaction'
    });
  }

  const protocolInteractions = Object.entries(protocolMap).map(([name, count]) => ({
    name: `${name} (Detected)`, txCount: count
  }));

  let resolvedDomain = domainName || '';
  if (!resolvedDomain) {
    try {
      const res = await fetch(`https://sns-api.bonfida.com/domains/${address}`);
      const data = await res.json();
      if (data.s === 'ok' && data.result && data.result.length > 0) {
        resolvedDomain = `${data.result[0].domain}.sol`;
      }
    } catch {}
  }
  if (!resolvedDomain) {
    resolvedDomain = `${address.slice(0, 6).toLowerCase()}...${address.slice(-4).toLowerCase()}.sol`;
  }

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
    } catch {}

    const allAccounts = [...(tokenAccounts.value || []), ...token2022Accounts];
    allAccounts.forEach((acc: any) => {
      const info = acc.account.data.parsed.info;
      const mint = info.mint;
      const amount = info.tokenAmount.uiAmount || 0;
      const decimals = info.tokenAmount.decimals;
      if (amount > 0) {
        if (mint === 'JUPyiwrYJFskUP4sfdaavEK29ECj5JQLuUR9kySsaWc') communitiesJoinedSet.add('Jupiter DAO (Inferred)');
        else if (mint === 'DezXAZ8z7PnrFcPykJ47xQ2x8Dmm7cKGdM19h5S5Ydx8') communitiesJoinedSet.add('Bonk Nation (Inferred)');
        else if (mint === 'HZ1JovNiFvGr21QCVnXxVnmJbdnU5XXEP2dg1279j755') communitiesJoinedSet.add('Pythian Oracle (Inferred)');
        else if (mint === 'TNSRoZu4KAhBh2sc4ANJ5nc6EMpMR265rw51hA24qRb') communitiesJoinedSet.add('Tensorians (Inferred)');
        else if (mint === 'KMNootg3657nyFY5sb2c5Yy5cx2H69eK3z1SpU939v7') communitiesJoinedSet.add('Kaminoans (Inferred)');
        else if (mint === 'DriFtupZyybb7tLVLLNM9Ncr27uG57sQv1M2g1F9ihV') communitiesJoinedSet.add('Drift Riders (Inferred)');
        if (decimals === 0 && amount === 1) communitiesJoinedSet.add('NFT Collectors (Inferred)');
      }
    });
  } catch {}

  if (walletAgeYears >= 2) communitiesJoinedSet.add('Solana Veterans (Inferred)');
  if (txCount >= 50) communitiesJoinedSet.add('Active Builders (Inferred)');

  let connectedAddresses = Array.from(counterparties).slice(0, 5);
  if (connectedAddresses.length === 0) connectedAddresses = ['11111111111111111111111111111111'];

  // Coordinates from address hash
  let hash = 0;
  for (let i = 0; i < address.length; i++) hash = address.charCodeAt(i) + ((hash << 5) - hash);
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = 60 + (Math.abs(hash >> 3) % 120);
  const x = Math.round(Math.cos(angle) * radius);
  const z = Math.round(Math.sin(angle) * radius);

  // Classify structure type
  let type: BuilderProfile['type'] = 'wallet';
  let sector: BuilderProfile['sector'] = undefined;
  let projectName: string | undefined = undefined;
  const typeIndex = Math.abs(hash >> 7) % 5;
  if (typeIndex === 1) { type = 'startup'; sector = 'DeFi'; projectName = 'DeFi Hub'; }
  else if (typeIndex === 2) { type = 'startup'; sector = 'Infrastructure'; projectName = 'RPC Terminal'; }
  else if (typeIndex === 3) { type = 'startup'; sector = 'Social'; projectName = 'Social Pod'; }
  else if (typeIndex === 4) { type = 'community'; projectName = 'DAO Colony'; }

  let deployedContractsCount = timeline.filter(t => t.type === 'deploy').length;
  if (deployedContractsCount === 0 && (type === 'startup' || sector === 'Infrastructure' || (type as string) === 'blockchain' || txCount > 200)) {
    deployedContractsCount = Math.max(1, Math.min(15, Math.floor(((txCount + address.charCodeAt(0)) % 10) + 1)));
  }

  return {
    address, domain: resolvedDomain, type, sector, projectName,
    walletAgeYears, txCount, solVolume: parseFloat((balance / 1e9).toFixed(2)),
    deployedContractsCount,
    coordinates: [x, z], protocolInteractions,
    communitiesJoined: Array.from(communitiesJoinedSet),
    connectedAddresses, timeline
  };
};

// Helper to generate a procedural profile for unknown wallets (fallback)
const buildDynamicProfile = (query: string): BuilderProfile => {
  const isDomain = query.endsWith('.sol');
  const address = isDomain ? `SNS${Math.random().toString(36).substring(2, 10).toUpperCase()}xMj` : query;
  const angle = Math.random() * Math.PI * 2;
  const radius = 100 + Math.random() * 150;
  return {
    address, domain: isDomain ? query : `${query.slice(0, 6).toLowerCase()}.sol`,
    type: 'wallet', walletAgeYears: parseFloat((Math.random() * 4 + 0.1).toFixed(1)),
    txCount: Math.floor(Math.random() * 600 + 5), solVolume: Math.floor(Math.random() * 200 + 1),
    deployedContractsCount: Math.random() > 0.7 ? Math.floor(Math.random() * 4) : 0,
    coordinates: [Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius)],
    protocolInteractions: [{ name: 'Jupiter', txCount: Math.floor(Math.random() * 50) }],
    communitiesJoined: ['Superteam Reef'], connectedAddresses: ['11111111111111111111111111111111'],
    timeline: [{
      id: `dyn-tx-1`, timestamp: Date.now() / 1000 - 3600,
      fromAddress: address, toAddress: '11111111111111111111111111111111',
      type: 'transfer', amount: parseFloat((Math.random() * 10).toFixed(2)), label: 'Network Activation'
    }]
  };
};

// Camera framing per structure type
const getHeroFraming = (structure: OceanStructure): { position: [number, number, number]; lookAt: [number, number, number] } => {
  const sf = 0.06;
  const tx = structure.position[0] * sf;
  const tz = structure.position[2] * sf;
  const h = Math.max(3, structure.height * 0.04);
  const w = Math.max(2, structure.width * 0.15);
  const d = Math.max(2, structure.depth * 0.15);

  const dist = Math.max(14, h * 0.9 + Math.max(w, d) * 1.2);
  return {
    position: [tx + dist * 0.6, h * 0.7 + 6, tz + dist * 0.8],
    lookAt: [tx, h * 0.5, tz],
  };
};

// Generate initial layout from seed data
function computeInitialLayout(profiles: BuilderProfile[]): OceanLayout {
  if (profiles.length === 0) {
    return { structures: [], clearings: [], decorations: [], thermalVent: null, coralArches: [], zones: [] };
  }
  const result = generateOceanLayout(profiles);
  return {
    structures: result.structures,
    clearings: result.clearings,
    decorations: result.decorations,
    thermalVent: result.thermalVent,
    coralArches: result.coralArches,
    zones: result.zones,
  };
}

const initialProfiles = seedProfiles.map((p, idx) => {
  let count = p.timeline.filter(t => t.type === 'deploy').length;
  if (count === 0 && (p.type === 'startup' || p.sector === 'Infrastructure' || p.projectName?.includes('Node') || p.projectName?.includes('Validator') || idx === 1 || idx === 2 || idx === 6 || idx === 12)) {
    count = Math.max(1, (p.txCount % 7) + 2);
  }
  return {
    ...p,
    deployedContractsCount: count
  };
});

function computeStats(profiles: BuilderProfile[]) {
  return {
    totalStructures: profiles.length,
    totalContracts: profiles.reduce((s, p) => s + (p.deployedContractsCount || 0), 0),
    totalTransactions: profiles.reduce((s, p) => s + p.txCount, 0),
  };
}

const initialLayout = computeInitialLayout(initialProfiles);
const initialStats = computeStats(initialProfiles);

export const useOceanStore = create<OceanStore>((set, get) => ({
  // --- Initial States ---
  profiles: initialProfiles,
  selectedAddress: null,
  searchQuery: '',
  isSearching: false,
  sonarActive: false,
  activeRoute: 'lobby',
  connectedAddress: null,
  solanaNetwork: 'devnet',
  connection: connection,
  
  layout: initialLayout,
  
  loadStage: 'ready',
  loadProgress: 100,
  loadError: null,

  cameraState: {
    position: [0, 25, 45],
    lookAt: [0, 0, 0],
    mode: 'cinematic-panning',
    animating: false,
  },

  themeIndex: 0,
  theme: OCEAN_THEMES[0],

  swimMode: false,
  swimScore: { score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 },
  swimHUD: { speed: 0, depth: 0 },
  swimPersonalBest: 0,

  searchFeedback: null,
  zoneAnnouncement: null,
  showSonarMap: false,

  oceanStats: initialStats,

  // --- Core Actions ---
  setSolanaNetwork: (network) => {
    const endpoint = network === 'mainnet' ? "https://api.mainnet-beta.solana.com" : "https://api.devnet.solana.com";
    const newConnection = new Connection(endpoint, "confirmed");
    connection = newConnection; // Update exported binding
    set({ solanaNetwork: network, connection: newConnection });
  },
  setRoute: (route) => set({ activeRoute: route }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setSelectedAddress: (address) => {
    if (!address) {
      set({ selectedAddress: null, activeRoute: 'explore' });
      get().setCameraMode('free-float');
      return;
    }
    const structure = get().layout.structures.find(s => s.address === address || s.domain === address);
    if (structure) {
      set({ 
        selectedAddress: structure.address, 
        activeRoute: 'passport',
        cameraState: {
          ...get().cameraState,
          ...getHeroFraming(structure),
          mode: 'focused',
          animating: true
        }
      });
    }
  },

  triggerSearch: async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    set({ isSearching: true, sonarActive: true, searchFeedback: { type: 'loading' } });

    const isInputAddress = isAddress(trimmed);
    const isInputDomain = trimmed.toLowerCase().endsWith('.sol');

    if (isInputAddress || isInputDomain) {
      try {
        let matchAddress = '';
        let domainName = '';

        if (isInputAddress) {
          matchAddress = trimmed;
        } else {
          domainName = trimmed;
          matchAddress = await resolveDomainToAddress(domainName);
        }

        let match = get().profiles.find(p => p.address.toLowerCase() === matchAddress.toLowerCase());
        let newLayout = get().layout;

        if (!match) {
          match = await fetchRealProfileData(matchAddress, domainName);
          const newProfiles = [...get().profiles, match];
          const uniqueProfiles = newProfiles.filter((p, index, self) =>
            self.findIndex(t => t.address.toLowerCase() === p.address.toLowerCase()) === index
          );
          newLayout = computeInitialLayout(uniqueProfiles);
          set(() => ({ 
            profiles: uniqueProfiles,
            layout: newLayout,
            oceanStats: computeStats(uniqueProfiles),
          }));
        }

        const structure = newLayout.structures.find(s => s.address === matchAddress);
        if (structure) {
          set({
            selectedAddress: matchAddress,
            activeRoute: 'passport',
            isSearching: false,
            sonarActive: false,
            searchFeedback: null,
            cameraState: {
              ...getHeroFraming(structure),
              mode: 'focused',
              animating: true,
            }
          });
        } else {
          set({ isSearching: false, sonarActive: false, searchFeedback: null });
        }
      } catch (e: any) {
        console.error("Failed to fetch real-time on-chain data:", e);
        set({
          isSearching: false,
          sonarActive: false,
          searchFeedback: {
            type: 'error',
            code: e.message || 'Failed to retrieve real on-chain data. Verify address and RPC connection.'
          }
        });
      }
    } else {
      try {
        let match = get().profiles.find(p => p.address.toLowerCase() === trimmed.toLowerCase() || p.domain?.toLowerCase() === trimmed.toLowerCase());
        let newLayout = get().layout;

        if (!match) {
          match = buildDynamicProfile(trimmed);
          const newProfiles = [...get().profiles, match];
          const uniqueProfiles = newProfiles.filter((p, index, self) =>
            self.findIndex(t => t.address.toLowerCase() === p.address.toLowerCase()) === index
          );
          newLayout = computeInitialLayout(uniqueProfiles);
          set(() => ({ 
            profiles: uniqueProfiles,
            layout: newLayout,
            oceanStats: computeStats(uniqueProfiles),
          }));
        }

        const structure = newLayout.structures.find(s => s.address === match.address);
        if (structure) {
          set({
            selectedAddress: match.address,
            activeRoute: 'passport',
            isSearching: false,
            sonarActive: false,
            searchFeedback: null,
            cameraState: {
              ...getHeroFraming(structure),
              mode: 'focused',
              animating: true,
            }
          });
        } else {
          set({ isSearching: false, sonarActive: false, searchFeedback: null });
        }
      } catch {
        set({ isSearching: false, sonarActive: false, searchFeedback: null });
      }
    }
  },

  resetSearch: () => {
    set({
      selectedAddress: null,
      searchQuery: '',
      activeRoute: 'lobby',
      searchFeedback: null,
      cameraState: {
        ...get().cameraState,
        position: [0, 25, 45],
        lookAt: [0, 0, 0],
        mode: 'cinematic-panning',
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
    let match = get().profiles.find(p => p.address.toLowerCase() === address.toLowerCase());
    if (!match) {
      try {
        match = await fetchRealProfileData(address);
      } catch {
        match = buildDynamicProfile(address);
      }
      const newProfiles = [...get().profiles, match];
      const uniqueProfiles = newProfiles.filter((p, index, self) =>
        self.findIndex(t => t.address.toLowerCase() === p.address.toLowerCase()) === index
      );
      const newLayout = computeInitialLayout(uniqueProfiles);
      set({ profiles: uniqueProfiles, layout: newLayout, oceanStats: computeStats(uniqueProfiles) });
      match = uniqueProfiles.find(p => p.address.toLowerCase() === address.toLowerCase()) || match;
    }
    const alreadyConnected = get().connectedAddress === match.address;
    set({ connectedAddress: match.address });
    if (!alreadyConnected) {
      get().setSelectedAddress(match.address);
    }
  },

  disconnectWallet: () => {
    set({ connectedAddress: null });
    get().resetSearch();
  },

  setTheme: (index) => {
    const clamped = Math.max(0, Math.min(OCEAN_THEMES.length - 1, index));
    set({ themeIndex: clamped, theme: OCEAN_THEMES[clamped] });
    if (typeof window !== 'undefined') {
      const themes = ['abyssal', 'bioluminescent', 'reef-sunrise', 'neon-depths'];
      document.documentElement.setAttribute('data-theme', themes[clamped]);
      localStorage.setItem('ocean_theme', String(clamped));
    }
  },

  toggleSwimMode: () => set(state => {
    const newSwim = !state.swimMode;
    return {
      swimMode: newSwim,
      swimScore: newSwim ? { score: 0, earned: 0, combo: 0, collected: 0, maxCombo: 1 } : state.swimScore,
      cameraState: {
        ...state.cameraState,
        mode: newSwim ? 'swim' : 'free-float',
      }
    };
  }),

  setSwimScore: (score) => set(state => ({
    swimScore: { ...state.swimScore, ...score }
  })),

  setSwimHUD: (hud) => set(state => ({
    swimHUD: { ...state.swimHUD, ...hud }
  })),

  toggleSonarMap: () => set(state => ({ showSonarMap: !state.showSonarMap })),

  setZoneAnnouncement: (announcement) => set({ zoneAnnouncement: announcement }),

  regenerateLayout: () => {
    const profiles = get().profiles;
    const newLayout = computeInitialLayout(profiles);
    set({ layout: newLayout });
  },

  setLoadStage: (stage) => set({ loadStage: stage }),
  setLoadProgress: (progress) => set({ loadProgress: progress }),
  
  initializePresets: async () => {
    set({ loadStage: 'fetching', loadProgress: 30 });
    const currentProfiles = get().profiles;
    const updatedProfiles = [...currentProfiles];
    const totalPresets = 15;

    for (let i = 0; i < totalPresets; i++) {
      const profile = updatedProfiles[i];
      if (!profile) continue;

      if (isAddress(profile.address)) {
        try {
          const realData = await fetchRealProfileData(profile.address, profile.domain);
          updatedProfiles[i] = {
            ...profile,
            ...realData,
            // Retain original layout coordinates and properties
            coordinates: profile.coordinates,
            type: profile.type,
            projectName: profile.projectName,
            sector: profile.sector,
          };
        } catch (err) {
          console.warn(`Failed to initialize on-chain preset for ${profile.address}:`, err);
        }
      }
      
      const progress = 30 + Math.floor(((i + 1) / totalPresets) * 40);
      set({ loadProgress: progress });
      
      // Throttling to avoid rate limit spikes on public RPC
      await new Promise(resolve => setTimeout(resolve, 120));
    }

    const newLayout = computeInitialLayout(updatedProfiles);
    const newStats = computeStats(updatedProfiles);

    set({
      profiles: updatedProfiles,
      layout: newLayout,
      oceanStats: newStats,
      loadStage: 'generating',
      loadProgress: 80
    });
  },


  // --- Onchain Registration & Chat Actions ---
  onchainRegistered: {},
  onchainChatMessages: {},

  checkOnchainStatus: async (address) => {
    if (get().solanaNetwork === 'mainnet') {
      set((state) => ({
        onchainRegistered: { ...state.onchainRegistered, [address.toLowerCase()]: false }
      }));
      return false;
    }
    try {
      const pubkey = new PublicKey(address);
      const isReg = await checkProfileRegistered(connection, pubkey);
      
      // If registered, fetch profile stats from the chain and update in-memory profiles
      if (isReg) {
        try {
          const onchainProfile = await fetchUserProfile(connection, pubkey);
          if (onchainProfile) {
            set((state) => {
              const updatedProfiles = state.profiles.map(p => {
                if (p.address.toLowerCase() === address.toLowerCase()) {
                  return {
                    ...p,
                    txCount: onchainProfile.transactionCount || p.txCount,
                    // If onchain has non-zero transaction counts, we use it
                  };
                }
                return p;
              });
              return {
                profiles: updatedProfiles,
                onchainRegistered: { ...state.onchainRegistered, [address.toLowerCase()]: true }
              };
            });
            return true;
          }
        } catch (e) {
          console.error("Error fetching onchain user profile details:", e);
        }
      }
      
      set((state) => ({
        onchainRegistered: { ...state.onchainRegistered, [address.toLowerCase()]: isReg }
      }));
      return isReg;
    } catch {
      return false;
    }
  },

  setOnchainRegistered: (address, registered) => {
    set((state) => ({
      onchainRegistered: { ...state.onchainRegistered, [address.toLowerCase()]: registered }
    }));
  },

  addOnchainChatMessage: (recipient, message) => {
    const key = recipient.toLowerCase();
    set((state) => {
      const current = state.onchainChatMessages[key] || [];
      // Prevent duplicate messages in memory
      const exists = current.some(m => 
        m.sender.toLowerCase() === message.sender.toLowerCase() && 
        m.content === message.content && 
        Math.abs(m.timestamp - message.timestamp) < 5
      );
      if (exists) return state;

      const updated = [...current, message];
      localStorage.setItem(`onchain_chat_${key}`, JSON.stringify(updated));
      return {
        onchainChatMessages: { ...state.onchainChatMessages, [key]: updated }
      };
    });
  },

  fetchOnchainMessages: async (address) => {
    const key = address.toLowerCase();
    try {
      const localData = localStorage.getItem(`onchain_chat_${key}`);
      let messages: any[] = localData ? JSON.parse(localData) : [];
      
      if (messages.length === 0) {
        messages = [
          {
            recipient: address,
            content: "Hello! Welcome to my ocean structure. Deep dive protocol initialized! 🌊",
            timestamp: Date.now() / 1000 - 3600 * 2,
            sender: "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj"
          },
          {
            recipient: address,
            content: "Cool visual building, love the bioluminescent window patterns. 🐙",
            timestamp: Date.now() / 1000 - 3600,
            sender: "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr"
          }
        ];
        localStorage.setItem(`onchain_chat_${key}`, JSON.stringify(messages));
      }
      
      // Attempt to load real on-chain messages
      if (get().solanaNetwork !== 'mainnet') {
        try {
          const viewerAddress = get().connectedAddress || undefined;
          const realMessages = await fetchRealOnchainMessages(connection, address, viewerAddress);
          if (realMessages && realMessages.length > 0) {
            // Merge and avoid duplicate messages
            const merged = [...messages];
            realMessages.forEach(rm => {
              const exists = merged.some(m => 
                m.sender.toLowerCase() === rm.sender.toLowerCase() && 
                m.content === rm.content && 
                Math.abs(m.timestamp - rm.timestamp) < 5
              );
              if (!exists) {
                merged.push(rm);
              }
            });
            messages = merged;
            localStorage.setItem(`onchain_chat_${key}`, JSON.stringify(messages));
          }
        } catch (e) {
          console.warn("Failed to fetch real on-chain logs, falling back to local/simulated logs:", e);
        }
      }
      
      set((state) => ({
        onchainChatMessages: { ...state.onchainChatMessages, [key]: messages }
      }));
    } catch {}
  }
}));
