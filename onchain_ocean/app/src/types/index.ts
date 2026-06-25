// ─── Transaction Record ──────────────────────────────────────────
export interface TransactionRecord {
  id: string;
  timestamp: number; // UNIX timestamp (s)
  fromAddress: string;
  fromDomain?: string;
  toAddress: string;
  toDomain?: string;
  type: 'transfer' | 'deploy' | 'vote' | 'interaction';
  amount?: number; // in SOL
  label?: string; // e.g. "Interact with Jupiter"
}

// ─── Structure Types ─────────────────────────────────────────────
export type StructureType = 'wallet' | 'startup' | 'community' | 'blockchain';

// ─── Wallet Archetypes (like Git City's Dev Classes) ─────────────
export const WALLET_ARCHETYPES = [
  'Diamond Hands 💎',
  'Degen Diver 🐙',
  'Whale Watcher 🐋',
  'Yield Farmer 🌾',
  'NFT Collector 🖼️',
  'Governance Governor 🏛️',
  'DeFi Scientist 🧪',
  'Airdrop Hunter 🎯',
  'Liquidity Provider 💧',
  'Chain Hopper 🌊',
  'Gas Optimizer ⛽',
  'Smart Contract Whisperer 🔮',
  'Token Sniper 🎯',
  'Memecoin Surfer 🏄',
  'Protocol Explorer 🧭',
  'Staking Sentinel 🛡️',
  'Bridge Builder 🌉',
  'DAO Delegate 📜',
  'On-Chain Oracle 🔱',
  'Solana Maxi ☀️',
  'Paper Hands 📄',
  'Bot Operator 🤖',
  'MEV Enjoyer ⚡',
  'Validator Runner 🖥️',
  'Retroactive Claimer 🎰',
  'Rug Pull Survivor 🏊',
  'Copy Trader 📋',
  'Whale Alert 🚨',
  'Compressed NFT Chad 🗜️',
  'cNFT Minter 🎨',
] as const;

export function getWalletArchetype(address: string): string {
  let h = 0;
  for (let i = 0; i < address.length; i++) h = ((h << 5) - h + address.charCodeAt(i)) | 0;
  return WALLET_ARCHETYPES[((h % WALLET_ARCHETYPES.length) + WALLET_ARCHETYPES.length) % WALLET_ARCHETYPES.length];
}

// ─── Ocean Zone (≡ Git City District) ────────────────────────────
export interface OceanZone {
  id: string;
  name: string;
  center: [number, number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  population: number;
  color: string;
  description: string;
}

export const ZONE_NAMES: Record<string, string> = {
  whale_abyss: "Whale's Abyss",
  defi_trench: 'DeFi Trench',
  nft_reef: 'NFT Reef',
  gamefi_atoll: 'GameFi Atoll',
  governance_basin: 'Governance Basin',
  builders_cove: "Builder's Cove",
  degen_depths: 'Degen Depths',
  validator_ridge: 'Validator Ridge',
  social_shallows: 'Social Shallows',
  explorer_expanse: 'Explorer Expanse',
};

export const ZONE_COLORS: Record<string, string> = {
  whale_abyss: '#06b6d4',
  defi_trench: '#a855f7',
  nft_reef: '#ec4899',
  gamefi_atoll: '#22c55e',
  governance_basin: '#f97316',
  builders_cove: '#3b82f6',
  degen_depths: '#ef4444',
  validator_ridge: '#eab308',
  social_shallows: '#14b8a6',
  explorer_expanse: '#8b5cf6',
};

export const ZONE_DESCRIPTIONS: Record<string, string> = {
  whale_abyss: 'The elite deep. Top wallets by total volume.',
  defi_trench: 'Swaps, yields, and protocol mastery.',
  nft_reef: 'Collectors, minters, and digital art.',
  gamefi_atoll: 'Gaming protocols and play-to-earn.',
  governance_basin: 'DAOs, voting, and on-chain governance.',
  builders_cove: 'Deployers, devs, and smart contract creators.',
  degen_depths: 'Memecoins, pump.fun, and high-risk plays.',
  validator_ridge: 'Stakers, validators, and network security.',
  social_shallows: 'Social protocols and community engagement.',
  explorer_expanse: 'General explorers and newcomers.',
};

// Map protocols to zones
export const PROTOCOL_TO_ZONE: Record<string, string> = {
  Jupiter: 'defi_trench',
  Raydium: 'defi_trench',
  Orca: 'defi_trench',
  Meteora: 'defi_trench',
  Drift: 'defi_trench',
  Solend: 'defi_trench',
  Phoenix: 'defi_trench',
  Tensor: 'nft_reef',
  'Pump.fun': 'degen_depths',
};

// ─── Ocean Decoration (≡ Git City CityDecoration) ────────────────
export interface OceanDecoration {
  type: 'kelp' | 'coral' | 'biolumNode' | 'seaPlant' | 'rock' | 'anemone' | 'currentMarking';
  position: [number, number, number];
  rotation: number;
  variant: number;
  size?: [number, number];
}

// ─── Ocean Structure (≡ Git City CityBuilding) ──────────────────
export interface OceanStructure {
  address: string;
  addressLower: string;
  rank: number;
  domain?: string;
  type: StructureType;
  sector?: 'DeFi' | 'Infrastructure' | 'Social';
  projectName?: string;

  // On-chain metrics
  txCount: number;
  solVolume: number;
  walletAgeYears: number;
  protocolInteractions: { name: string; txCount: number }[];
  communitiesJoined: string[];
  connectedAddresses: string[];
  timeline: TransactionRecord[];

  // Computed 3D properties
  zone: string;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  floors: number;
  windowsPerFloor: number;
  sideWindowsPerFloor: number;
  litPercentage: number;

  // Archetype
  archetype: string;

  // Achievements / badges
  badges: string[];
  reputationScore: number;

  // Swim mode
  depthLevel: number;
}

// ─── Reef Clearing (≡ Git City CityPlaza) ────────────────────────
export interface ReefClearing {
  position: [number, number, number];
  size: number;
  variant: number;
}

// ─── Thermal Vent Trench (≡ Git City CityRiver) ─────────────────
export interface ThermalVent {
  x: number;
  width: number;
  length: number;
  centerZ: number;
}

// ─── Coral Arch (≡ Git City CityBridge) ──────────────────────────
export interface CoralArch {
  position: [number, number, number];
  width: number;
  rotation: number;
}

// ─── Camera State ────────────────────────────────────────────────
export interface CameraState {
  position: [number, number, number];
  lookAt: [number, number, number];
  mode: 'cinematic-panning' | 'free-float' | 'focused' | 'swim';
  animating: boolean;
}

// ─── Swim Mode (≡ Git City Fly Mode) ────────────────────────────
export interface SwimScore {
  score: number;
  earned: number;
  combo: number;
  collected: number;
  maxCombo: number;
}

export interface SwimHUD {
  speed: number;
  depth: number;
}

// ─── Ocean Themes (≡ Git City Themes) ────────────────────────────
export interface OceanTheme {
  name: string;
  accent: string;
  shadow: string;
  fogColor: string;
  bgColor: string;
  building: {
    windowLit: string[];
    windowOff: string;
    face: string;
    roof: string;
    accent: string;
  };
}

export const OCEAN_THEMES: OceanTheme[] = [
  { 
    name: 'Abyssal', 
    accent: '#06b6d4', 
    shadow: '#064e3b', 
    fogColor: '#041029', 
    bgColor: '#030712',
    building: {
      face: '#0a1628', 
      roof: '#06b6d4',
      windowLit: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
      windowOff: '#0c1a2e', 
      accent: '#06b6d4',
    }
  },
  { 
    name: 'Bioluminescent', 
    accent: '#a78bfa', 
    shadow: '#4c1d95', 
    fogColor: '#0c0a1a', 
    bgColor: '#050510',
    building: {
      face: '#120a24', 
      roof: '#a855f7',
      windowLit: ['#a855f7', '#c084fc', '#d8b4fe', '#8b5cf6'],
      windowOff: '#14082a', 
      accent: '#a855f7',
    }
  },
  { 
    name: 'Reef Sunrise', 
    accent: '#f59e0b', 
    shadow: '#78350f', 
    fogColor: '#1a0e04', 
    bgColor: '#0f0a02',
    building: {
      face: '#1a1008', 
      roof: '#f97316',
      windowLit: ['#f97316', '#fb923c', '#fdba74', '#ea580c'],
      windowOff: '#1c1208', 
      accent: '#f97316',
    }
  },
  { 
    name: 'Neon Depths', 
    accent: '#ec4899', 
    shadow: '#831843', 
    fogColor: '#120818', 
    bgColor: '#0a0410',
    building: {
      face: '#180830', 
      roof: '#ec4899',
      windowLit: ['#ec4899', '#f472b6', '#fb7185', '#f9a8d4'],
      windowOff: '#0a0814', 
      accent: '#ec4899',
    }
  },
];

// ─── Loading Stage ───────────────────────────────────────────────
export type LoadingStage =
  | 'init'
  | 'fetching'
  | 'generating'
  | 'rendering'
  | 'ready'
  | 'done'
  | 'error';

// ─── Builder Profile (existing, kept for backward compat) ────────
export interface BuilderProfile {
  address: string;
  domain?: string;
  type: StructureType;

  // Real identity metrics
  walletAgeYears: number;
  txCount: number;
  solVolume: number;
  deployedContractsCount?: number;

  // Specific details
  projectName?: string;
  sector?: 'DeFi' | 'Infrastructure' | 'Social';
  communitySize?: number;

  // 3D Visual mapping coordinates
  coordinates: [number, number];

  // Relational connections
  protocolInteractions: { name: string; txCount: number }[];
  communitiesJoined: string[];
  connectedAddresses: string[];
  timeline: TransactionRecord[];
}
