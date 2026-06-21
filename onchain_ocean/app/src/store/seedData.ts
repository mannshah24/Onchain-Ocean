import type { BuilderProfile, TransactionRecord } from '../types';

// Helper to generate transaction records
const createTx = (
  id: string,
  ageHoursAgo: number,
  from: string,
  to: string,
  type: TransactionRecord['type'],
  amount?: number,
  label?: string
): TransactionRecord => ({
  id,
  timestamp: Date.now() / 1000 - ageHoursAgo * 3600,
  fromAddress: from,
  toAddress: to,
  type,
  amount,
  label,
});

export const seedProfiles: BuilderProfile[] = [
  // 1. Blockchain Vent (Solana Genesis)
  {
    address: "11111111111111111111111111111111",
    domain: "solana.genesis",
    type: "blockchain",
    walletAgeYears: 6.2,
    txCount: 382941032,
    solVolume: 492048102,
    coordinates: [0, 0],
    protocolInteractions: [],
    communitiesJoined: [],
    connectedAddresses: [
      "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn",
      "HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj",
      "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj"
    ],
    timeline: [
      createTx("genesis-1", 72, "11111111111111111111111111111111", "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "transfer", 5000, "Validator Payout"),
      createTx("genesis-2", 48, "11111111111111111111111111111111", "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn", "transfer", 100000, "Liquidity Boost"),
    ]
  },
  // 2. Developer Spire: dhruv.sol
  {
    address: "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj",
    domain: "dhruv.sol",
    type: "wallet",
    walletAgeYears: 2.4,
    txCount: 1250,
    solVolume: 45800,
    coordinates: [50, 50],
    protocolInteractions: [
      { name: "Jupiter", txCount: 420 },
      { name: "Tensor", txCount: 112 },
      { name: "Orca", txCount: 95 },
      { name: "Raydium", txCount: 45 }
    ],
    communitiesJoined: ["Jupiter DAO", "Superteam Reef", "Mad Lads Shell"],
    connectedAddresses: [
      "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn",
      "HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj"
    ],
    timeline: [
      createTx("tx-dh-1", 2, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn", "interaction", 12.5, "Swap SOL -> USDC"),
      createTx("tx-dh-2", 8, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "11111111111111111111111111111111", "vote", undefined, "Jupiter LFG Launchpad Vote"),
      createTx("tx-dh-3", 24, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj", "interaction", 0.05, "RPC Request Load"),
    ]
  },
  // 3. Developer Spire: nish.sol
  {
    address: "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr",
    domain: "nish.sol",
    type: "wallet",
    walletAgeYears: 1.8,
    txCount: 680,
    solVolume: 12500,
    coordinates: [-20, 30],
    protocolInteractions: [
      { name: "Jupiter", txCount: 210 },
      { name: "Tensor", txCount: 180 },
      { name: "Kamina", txCount: 60 }
    ],
    communitiesJoined: ["Superteam Reef", "Tensorians Reef"],
    connectedAddresses: [
      "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn"
    ],
    timeline: [
      createTx("tx-ns-1", 4, "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn", "interaction", 3.4, "Executed Swap"),
      createTx("tx-ns-2", 12, "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "transfer", 15.0, "Peer-to-Peer Transfer"),
    ]
  },
  // 4. Startup Rig: Jupiter Aggregator
  {
    address: "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn",
    domain: "jup.sol",
    type: "startup",
    projectName: "Jupiter",
    sector: "DeFi",
    walletAgeYears: 4.1,
    txCount: 42938102,
    solVolume: 120489100,
    coordinates: [-40, -60],
    protocolInteractions: [],
    communitiesJoined: ["Jupiter DAO"],
    connectedAddresses: [
      "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj",
      "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr"
    ],
    timeline: [
      createTx("jup-1", 1, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn", "interaction", 12.5, "Incoming Routing"),
      createTx("jup-2", 3, "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "JUPag1h3kX9rY4fQz7cBwLm5eNvT8sGdOi2pUxW6KrMn", "interaction", 3.4, "Incoming Routing"),
    ]
  },
  // 5. Startup Rig: Helius RPC
  {
    address: "HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj",
    domain: "helius.sol",
    type: "startup",
    projectName: "Helius RPC",
    sector: "Infrastructure",
    walletAgeYears: 2.9,
    txCount: 18493018,
    solVolume: 9284102,
    coordinates: [-70, 80],
    protocolInteractions: [],
    communitiesJoined: ["Superteam Reef"],
    connectedAddresses: [
      "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj"
    ],
    timeline: [
      createTx("hl-1", 24, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj", "interaction", 0.05, "API Request Logged"),
    ]
  },
  // 6. Community Reef: Jupiter DAO
  {
    address: "JUPDA0vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr",
    domain: "jupdao.sol",
    type: "community",
    communitySize: 14200,
    walletAgeYears: 1.5,
    txCount: 948102,
    solVolume: 4920402,
    coordinates: [-50, -50],
    protocolInteractions: [],
    communitiesJoined: [],
    connectedAddresses: [
      "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj"
    ],
    timeline: [
      createTx("dao-1", 8, "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj", "JUPDA0vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "vote", undefined, "Governance Proposal #12"),
    ]
  },
  // 7. Community Reef: Superteam Reef
  {
    address: "SuPeRtMvRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr",
    domain: "superteam.sol",
    type: "community",
    communitySize: 840,
    walletAgeYears: 3.1,
    txCount: 148903,
    solVolume: 1849100,
    coordinates: [60, 40],
    protocolInteractions: [],
    communitiesJoined: [],
    connectedAddresses: [
      "DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj",
      "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr"
    ],
    timeline: [
      createTx("st-1", 12, "NiSHuPkL4vRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "SuPeRtMvRtF9yXcBwDm7eGjZ1sHq3oAn6UxW5KdTMr", "interaction", 2.0, "Earned Bounty"),
    ]
  }
];
