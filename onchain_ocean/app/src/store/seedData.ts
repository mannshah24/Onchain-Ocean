import type { BuilderProfile } from '../types';

export const seedProfiles: BuilderProfile[] = [
  // ─── Whale / Major Player ──────────────────────────────────────
  {
    address: 'DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj',
    domain: 'whale.sol',
    type: 'wallet',
    walletAgeYears: 3.5,
    txCount: 2450,
    solVolume: 18500,
    coordinates: [0, -30],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 420 },
      { name: 'Raydium', txCount: 310 },
      { name: 'Orca', txCount: 180 },
      { name: 'Drift', txCount: 95 },
      { name: 'Meteora', txCount: 75 },
    ],
    communitiesJoined: ['Superteam Reef (Inferred)', 'Jupiter DAO (Inferred)', 'Solana Veterans (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['NiSH...TdMr', 'JUPa...rMn', 'HeLi...WCj', 'JUPD...TMr', 'MaNg...kLp'],
    timeline: [
      { id: 'tx-wh1', timestamp: Date.now() / 1000 - 1800, fromAddress: 'DhRu...BxMj', toAddress: 'JUP6...J3', type: 'interaction', amount: 250, label: 'Swap via Jupiter' },
      { id: 'tx-wh2', timestamp: Date.now() / 1000 - 7200, fromAddress: 'DhRu...BxMj', toAddress: '675k...PP', type: 'interaction', amount: 180, label: 'LP on Raydium' },
      { id: 'tx-wh3', timestamp: Date.now() / 1000 - 14400, fromAddress: 'NiSH...TdMr', toAddress: 'DhRu...BxMj', type: 'transfer', amount: 500, label: 'Transfer Inbound' },
    ],
  },
  // ─── DeFi Protocol ─────────────────────────────────────────────
  {
    address: 'JUP6LkbZbjS1jKKppdH65gC4RCxs7zupBGVfaBNW6J3',
    domain: 'jupiter.sol',
    type: 'startup',
    sector: 'DeFi',
    projectName: 'Jupiter Exchange',
    walletAgeYears: 2.8,
    txCount: 5200,
    solVolume: 42000,
    coordinates: [-75, -85],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 3200 },
      { name: 'Orca', txCount: 450 },
      { name: 'Raydium', txCount: 620 },
    ],
    communitiesJoined: ['Jupiter DAO (Inferred)', 'Solana Veterans (Inferred)', 'Active Builders (Inferred)', 'DeFi Protocol (Inferred)'],
    connectedAddresses: ['DhRu...BxMj', 'whir...bhA', '675k...PP'],
    timeline: [
      { id: 'tx-jup1', timestamp: Date.now() / 1000 - 900, fromAddress: 'JUPa...rMn', toAddress: 'DhRu...BxMj', type: 'interaction', amount: 1200, label: 'Jupiter Aggregate Swap' },
      { id: 'tx-jup2', timestamp: Date.now() / 1000 - 3600, fromAddress: 'JUPa...rMn', toAddress: 'whir...bhA', type: 'interaction', amount: 800, label: 'Orca Route via Jupiter' },
    ],
  },
  // ─── Infrastructure Builder ────────────────────────────────────
  {
    address: 'HeLi5sRtF2yN7vKxJm3pQcB9wGdZ4oTi8eUaLr1XnWCj',
    domain: 'helius.sol',
    type: 'startup',
    sector: 'Infrastructure',
    projectName: 'Helius RPC',
    walletAgeYears: 2.2,
    txCount: 890,
    solVolume: 3200,
    coordinates: [85, 75],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 45 },
    ],
    communitiesJoined: ['Superteam Reef (Inferred)', 'Active Builders (Inferred)', 'Solana Veterans (Inferred)'],
    connectedAddresses: ['DhRu...BxMj', 'JUPa...rMn'],
    timeline: [
      { id: 'tx-hel1', timestamp: Date.now() / 1000 - 5400, fromAddress: 'HeLi...WCj', toAddress: '1111...1111', type: 'deploy', label: 'Smart Contract Deployment' },
    ],
  },
  // ─── Community / DAO ───────────────────────────────────────────
  {
    address: 'JUPyiwrYJFskUP4sfdaavEK29ECj5JQLuUR9kySsaWc',
    domain: 'jupdao.sol',
    type: 'community',
    projectName: 'Jupiter DAO',
    communitySize: 12000,
    walletAgeYears: 1.8,
    txCount: 3400,
    solVolume: 8900,
    coordinates: [-40, 60],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 2800 },
      { name: 'Raydium', txCount: 200 },
    ],
    communitiesJoined: ['Jupiter DAO (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['JUPa...rMn', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-dao1', timestamp: Date.now() / 1000 - 10800, fromAddress: 'JUPD...TMr', toAddress: 'JUPa...rMn', type: 'vote', label: 'DAO Governance Vote' },
    ],
  },
  // ─── Active Degen ──────────────────────────────────────────────
  {
    address: '5tzQ7fQQGSL2i24rGDVfTY1SoMwSpL7B9N76S439v5rW',
    domain: 'degen.sol',
    type: 'wallet',
    walletAgeYears: 0.8,
    txCount: 1200,
    solVolume: 450,
    coordinates: [50, -70],
    protocolInteractions: [
      { name: 'Pump.fun', txCount: 380 },
      { name: 'Jupiter', txCount: 290 },
      { name: 'Raydium', txCount: 210 },
    ],
    communitiesJoined: ['Bonk Nation (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['DhRu...BxMj', '6EF8...t82t7'],
    timeline: [
      { id: 'tx-deg1', timestamp: Date.now() / 1000 - 600, fromAddress: 'NiSH...TdMr', toAddress: '6EF8...t82t7', type: 'interaction', amount: 5, label: 'Interact with Pump.fun' },
      { id: 'tx-deg2', timestamp: Date.now() / 1000 - 2400, fromAddress: 'NiSH...TdMr', toAddress: 'JUP6...J3', type: 'interaction', amount: 12, label: 'Swap via Jupiter' },
    ],
  },
  // ─── NFT Collector ─────────────────────────────────────────────
  {
    address: 'TnSr7xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj',
    domain: 'collector.sol',
    type: 'wallet',
    walletAgeYears: 2.1,
    txCount: 680,
    solVolume: 1250,
    coordinates: [120, -20],
    protocolInteractions: [
      { name: 'Tensor', txCount: 320 },
      { name: 'Jupiter', txCount: 80 },
    ],
    communitiesJoined: ['NFT Collectors (Inferred)', 'Tensorians (Inferred)', 'Superteam Reef (Inferred)'],
    connectedAddresses: ['TSWAPEBwA...Swh', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-nft1', timestamp: Date.now() / 1000 - 4200, fromAddress: 'TnSr...sMj', toAddress: 'TSWAPEBwA...Swh', type: 'interaction', amount: 15, label: 'Trade on Tensor' },
    ],
  },
  // ─── Validator ─────────────────────────────────────────────────
  {
    address: 'Vote111111111111111111111111111111111111111',
    domain: 'validator.sol',
    type: 'blockchain',
    projectName: 'Solana Validator',
    walletAgeYears: 4.2,
    txCount: 450,
    solVolume: 85000,
    coordinates: [-90, -40],
    protocolInteractions: [],
    communitiesJoined: ['Solana Veterans (Inferred)', 'Validator Network (Inferred)'],
    connectedAddresses: ['1111...1111'],
    timeline: [
      { id: 'tx-val1', timestamp: Date.now() / 1000 - 86400, fromAddress: 'VaLd...WCj', toAddress: '1111...1111', type: 'vote', label: 'Validator Vote' },
    ],
  },
  // ─── Social Protocol ───────────────────────────────────────────
  {
    address: 'SoCi3xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj',
    domain: 'social.sol',
    type: 'startup',
    sector: 'Social',
    projectName: 'Social Pod',
    walletAgeYears: 1.2,
    txCount: 320,
    solVolume: 180,
    coordinates: [30, 90],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 30 },
    ],
    communitiesJoined: ['Superteam Reef (Inferred)'],
    connectedAddresses: ['DhRu...BxMj'],
    timeline: [
      { id: 'tx-soc1', timestamp: Date.now() / 1000 - 21600, fromAddress: 'SoCi...sMj', toAddress: '1111...1111', type: 'interaction', label: 'Social Protocol Transaction' },
    ],
  },
  // ─── DeFi Yield Farmer ─────────────────────────────────────────
  {
    address: 'LBRaCzEZKz3tL751KGX9JAT5YqjbzEiYy1wKkAT6Rco',
    domain: 'yieldfarm.sol',
    type: 'wallet',
    walletAgeYears: 1.6,
    txCount: 980,
    solVolume: 5200,
    coordinates: [-55, -100],
    protocolInteractions: [
      { name: 'Meteora', txCount: 280 },
      { name: 'Orca', txCount: 220 },
      { name: 'Jupiter', txCount: 180 },
      { name: 'Raydium', txCount: 150 },
    ],
    communitiesJoined: ['Jupiter DAO (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['LBRa...Rco', 'whir...bhA', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-yf1', timestamp: Date.now() / 1000 - 3000, fromAddress: 'YiELd...WCj', toAddress: 'LBRa...Rco', type: 'interaction', amount: 450, label: 'Interact with Meteora' },
      { id: 'tx-yf2', timestamp: Date.now() / 1000 - 7800, fromAddress: 'YiELd...WCj', toAddress: 'whir...bhA', type: 'interaction', amount: 280, label: 'Trade on Orca' },
    ],
  },
  // ─── Newcomer ──────────────────────────────────────────────────
  {
    address: 'NeWb1xFm2kP9yBvG4wJdN3hC8qRtZ5aE6oUi1LxKsMj',
    domain: 'newbie.sol',
    type: 'wallet',
    walletAgeYears: 0.2,
    txCount: 15,
    solVolume: 12,
    coordinates: [100, 50],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 8 },
    ],
    communitiesJoined: ['Superteam Reef (Inferred)'],
    connectedAddresses: ['DhRu...BxMj'],
    timeline: [
      { id: 'tx-new1', timestamp: Date.now() / 1000 - 43200, fromAddress: 'NeWb...sMj', toAddress: 'JUP6...J3', type: 'interaction', amount: 2, label: 'First Swap on Jupiter' },
    ],
  },
  // ─── GameFi Player ─────────────────────────────────────────────
  {
    address: 'ATLASux5aBK4etrrEsvaSg7Un6ryef57Sbd4xYhSg1sk',
    domain: 'gamer.sol',
    type: 'wallet',
    walletAgeYears: 1.1,
    txCount: 520,
    solVolume: 380,
    coordinates: [-20, 120],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 65 },
    ],
    communitiesJoined: ['NFT Collectors (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['TnSr...sMj', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-gm1', timestamp: Date.now() / 1000 - 16200, fromAddress: 'GaMeR...WCj', toAddress: '1111...1111', type: 'interaction', amount: 0.5, label: 'GameFi Interaction' },
    ],
  },
  // ─── Governance Participant ────────────────────────────────────
  {
    address: 'GovER5nhWYw13spokDgg61XtvJVT1AFrqtrszgCn1bQb',
    domain: 'governor.sol',
    type: 'wallet',
    walletAgeYears: 2.5,
    txCount: 380,
    solVolume: 2800,
    coordinates: [70, 30],
    protocolInteractions: [
      { name: 'Jupiter', txCount: 90 },
    ],
    communitiesJoined: ['Jupiter DAO (Inferred)', 'Pythian Oracle (Inferred)', 'Solana Veterans (Inferred)'],
    connectedAddresses: ['JUPD...TMr', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-gov1', timestamp: Date.now() / 1000 - 28800, fromAddress: 'GoVeRn...WCj', toAddress: 'JUPD...TMr', type: 'vote', label: 'DAO Governance Vote' },
    ],
  },
  // ─── Drift Trader ──────────────────────────────────────────────
  {
    address: 'dRFEymoaaowsjMQ22n664ssd5SXMkz365cVJPHpip8k',
    domain: 'drift.sol',
    type: 'wallet',
    walletAgeYears: 1.9,
    txCount: 1850,
    solVolume: 9200,
    coordinates: [-110, 20],
    protocolInteractions: [
      { name: 'Drift', txCount: 1100 },
      { name: 'Jupiter', txCount: 350 },
      { name: 'Phoenix', txCount: 200 },
    ],
    communitiesJoined: ['Drift Riders (Inferred)', 'Active Builders (Inferred)', 'Solana Veterans (Inferred)'],
    connectedAddresses: ['dRFE...ip8k', 'JUPa...rMn', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-dr1', timestamp: Date.now() / 1000 - 1200, fromAddress: 'DrIfT...WCj', toAddress: 'dRFE...ip8k', type: 'interaction', amount: 85, label: 'Drift Protocol Margin' },
      { id: 'tx-dr2', timestamp: Date.now() / 1000 - 4800, fromAddress: 'DrIfT...WCj', toAddress: 'JUP6...J3', type: 'interaction', amount: 120, label: 'Swap via Jupiter' },
    ],
  },
  // ─── LP Provider ───────────────────────────────────────────────
  {
    address: 'whirLbMiicVdio4tUfT68RJHK79u2sRb6WxST2i6bhA',
    domain: 'lp.sol',
    type: 'wallet',
    walletAgeYears: 2.0,
    txCount: 740,
    solVolume: 15600,
    coordinates: [40, -110],
    protocolInteractions: [
      { name: 'Orca', txCount: 280 },
      { name: 'Raydium', txCount: 220 },
      { name: 'Meteora', txCount: 150 },
    ],
    communitiesJoined: ['Solana Veterans (Inferred)', 'Active Builders (Inferred)'],
    connectedAddresses: ['whir...bhA', '675k...PP', 'LBRa...Rco'],
    timeline: [
      { id: 'tx-lp1', timestamp: Date.now() / 1000 - 5400, fromAddress: 'LiQuId...WCj', toAddress: 'whir...bhA', type: 'interaction', amount: 2000, label: 'Provide Liquidity on Orca' },
    ],
  },
  // ─── Solend User ───────────────────────────────────────────────
  {
    address: 'So1endDq2YkqyJ3Z96T6o3yM4aUqB391zR5XbFqjH7T',
    domain: 'lender.sol',
    type: 'wallet',
    walletAgeYears: 2.4,
    txCount: 290,
    solVolume: 6800,
    coordinates: [-130, -80],
    protocolInteractions: [
      { name: 'Solend', txCount: 180 },
      { name: 'Jupiter', txCount: 60 },
    ],
    communitiesJoined: ['Solana Veterans (Inferred)'],
    connectedAddresses: ['So1e...hh', 'DhRu...BxMj'],
    timeline: [
      { id: 'tx-sl1', timestamp: Date.now() / 1000 - 36000, fromAddress: 'SoLeNd...WCj', toAddress: 'So1e...hh', type: 'interaction', amount: 500, label: 'Deposit on Solend' },
    ],
  },
];

// Procedurally expand seedProfiles to match the high density of Git City
const MOCK_PROTOCOLS = ['Jupiter', 'Raydium', 'Orca', 'Meteora', 'Drift', 'Tensor', 'Pump.fun', 'Solend', 'Phoenix'];
const MOCK_COMMUNITIES = ['Superteam Reef (Inferred)', 'Jupiter DAO (Inferred)', 'Solana Veterans (Inferred)', 'Active Builders (Inferred)', 'Bonk Nation (Inferred)', 'Tensorians (Inferred)'];

const generateMockProfiles = (count: number) => {
  let s = 12345;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const makeAddress = () => {
    let addr = '';
    for (let i = 0; i < 44; i++) {
      addr += alphabet[Math.floor(rand() * alphabet.length)];
    }
    return addr;
  };

  for (let i = 0; i < count; i++) {
    const address = makeAddress();
    const domain = `builder_${i + 16}.sol`;
    const walletAgeYears = parseFloat((0.1 + rand() * 4.8).toFixed(1));
    const txCount = Math.floor(5 + rand() * 2400);
    const solVolume = parseFloat((0.1 + rand() * 800).toFixed(2));
    
    // Protocol interactions
    const pCount = Math.floor(1 + rand() * 4);
    const protocolInteractions: { name: string; txCount: number }[] = [];
    const usedProtos = new Set<string>();
    for (let p = 0; p < pCount; p++) {
      const pName = MOCK_PROTOCOLS[Math.floor(rand() * MOCK_PROTOCOLS.length)];
      if (!usedProtos.has(pName)) {
        usedProtos.add(pName);
        protocolInteractions.push({ name: pName, txCount: Math.floor(1 + rand() * (txCount / pCount)) });
      }
    }

    // Communities
    const cCount = Math.floor(rand() * 3);
    const communitiesJoined: string[] = [];
    const usedComms = new Set<string>();
    for (let c = 0; c < cCount; c++) {
      const cName = MOCK_COMMUNITIES[Math.floor(rand() * MOCK_COMMUNITIES.length)];
      if (!usedComms.has(cName)) {
        usedComms.add(cName);
        communitiesJoined.push(cName);
      }
    }

    const typeRandom = rand();
    let type: 'wallet' | 'startup' | 'community' | 'blockchain' = 'wallet';
    let sector: 'DeFi' | 'Infrastructure' | 'Social' | undefined = undefined;
    let projectName: string | undefined = undefined;

    if (typeRandom < 0.08) {
      type = 'startup';
      const sectors: ('DeFi' | 'Infrastructure' | 'Social')[] = ['DeFi', 'Infrastructure', 'Social'];
      sector = sectors[Math.floor(rand() * sectors.length)];
      projectName = `${sector} Project ${i + 1}`;
    } else if (typeRandom < 0.12) {
      type = 'community';
      projectName = `DAO Circle ${i + 1}`;
    } else if (typeRandom < 0.15) {
      type = 'blockchain';
      projectName = `Validator Node ${i + 1}`;
    }

    const isDeployer = type === 'startup' || sector === 'Infrastructure' || type === 'blockchain';
    const deployedContractsCount = isDeployer ? Math.max(1, Math.floor(rand() * 12) + 1) : 0;

    seedProfiles.push({
      address,
      domain,
      type,
      sector,
      projectName,
      walletAgeYears,
      txCount,
      solVolume,
      deployedContractsCount,
      coordinates: [0, 0],
      protocolInteractions,
      communitiesJoined,
      connectedAddresses: ['DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj'],
      timeline: [
        {
          id: `tx-mock-${i}`,
          timestamp: Date.now() / 1000 - rand() * 86400 * 30,
          fromAddress: address,
          toAddress: 'DhRuVqZ3mWJpFb7YtX8S5aNcK2gHd9LrEe1oUvCwBxMj',
          type: 'interaction',
          amount: parseFloat((rand() * 10).toFixed(2)),
          label: 'Interact with Protocol'
        }
      ]
    });
  }
};

// Generate 1200 additional mock profiles to build a very dense map
generateMockProfiles(1200);

