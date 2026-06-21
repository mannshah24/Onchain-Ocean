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

export type StructureType = 'wallet' | 'startup' | 'community' | 'blockchain';

export interface BuilderProfile {
  address: string;
  domain?: string;
  type: StructureType;
  
  // Real identity metrics
  walletAgeYears: number;
  txCount: number;
  solVolume: number;
  
  // Specific details
  projectName?: string; // e.g. "Jupiter" for startup
  sector?: 'DeFi' | 'Infrastructure' | 'Social'; // for startup
  communitySize?: number; // for community
  
  // 3D Visual mapping coordinates
  coordinates: [number, number]; // [X, Z] coordinate grid
  
  // Relational connections
  protocolInteractions: { name: string; txCount: number }[];
  communitiesJoined: string[];
  connectedAddresses: string[]; // Wallets/domains connected via transactions
  timeline: TransactionRecord[];
}

export interface CameraState {
  position: [number, number, number];
  lookAt: [number, number, number];
  mode: 'cinematic-panning' | 'free-float' | 'focused';
  animating: boolean;
}
