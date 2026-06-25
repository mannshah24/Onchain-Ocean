import type {
  BuilderProfile,
  OceanStructure,
  OceanZone,
  OceanDecoration,
  ReefClearing,
  ThermalVent,
  CoralArch,
} from '../types';
import {
  ZONE_NAMES,
  ZONE_COLORS,
  ZONE_DESCRIPTIONS,
  PROTOCOL_TO_ZONE,
  getWalletArchetype,
} from '../types';

// ─── Seeded Random ───────────────────────────────────────────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

// ─── Spiral Coordinate (same algorithm as Git City) ──────────────
function spiralCoord(index: number): [number, number] {
  if (index === 0) return [0, 0];
  let x = 0, y = 0, dx = 1, dy = 0;
  let segLen = 1, segPassed = 0, turns = 0;
  for (let i = 0; i < index; i++) {
    x += dx; y += dy; segPassed++;
    if (segPassed === segLen) {
      segPassed = 0;
      const tmp = dx; dx = -dy; dy = tmp;
      turns++;
      if (turns % 2 === 0) segLen++;
    }
  }
  return [x, y];
}

// ─── Layout Constants ────────────────────────────────────────────
const BLOCK_SIZE = 4;
const LOT_W = 38;
const LOT_D = 32;
const ALLEY_W = 3;
const STREET_W = 12;

const BLOCK_FOOTPRINT_X = BLOCK_SIZE * LOT_W + (BLOCK_SIZE - 1) * ALLEY_W;
const BLOCK_FOOTPRINT_Z = BLOCK_SIZE * LOT_D + (BLOCK_SIZE - 1) * ALLEY_W;

const VENT_MARGIN = 8;
const VENT_WIDTH = 40;


// ─── Zone Assignment ─────────────────────────────────────────────
export function inferZone(profile: BuilderProfile): string {
  // Check protocol interactions for zone assignment
  for (const proto of profile.protocolInteractions) {
    const zone = PROTOCOL_TO_ZONE[proto.name.replace(' (Detected)', '')];
    if (zone) return zone;
  }

  // Check communities
  const communityStr = profile.communitiesJoined.join(' ').toLowerCase();
  if (communityStr.includes('nft')) return 'nft_reef';
  if (communityStr.includes('dao') || communityStr.includes('governance')) return 'governance_basin';
  if (communityStr.includes('validator') || communityStr.includes('staking')) return 'validator_ridge';
  if (communityStr.includes('builder') || communityStr.includes('active')) return 'builders_cove';

  // Default by type
  if (profile.type === 'community') return 'governance_basin';
  if (profile.type === 'blockchain') return 'builders_cove';
  if (profile.type === 'startup') {
    if (profile.sector === 'DeFi') return 'defi_trench';
    if (profile.sector === 'Social') return 'social_shallows';
    if (profile.sector === 'Infrastructure') return 'builders_cove';
  }

  return 'explorer_expanse';
}

// ─── Composite Score ─────────────────────────────────────────────
function calcComposite(profile: BuilderProfile, maxTx: number, maxVol: number): number {
  const effMaxTx = Math.min(maxTx, 5000);
  const effMaxVol = Math.min(maxVol, 50000);

  const txNorm = profile.txCount / Math.max(1, effMaxTx);
  const volNorm = profile.solVolume / Math.max(1, effMaxVol);
  const ageNorm = Math.min(profile.walletAgeYears / 5, 1);
  const protoNorm = Math.min(profile.protocolInteractions.length / 10, 1);

  const txScore = Math.pow(Math.min(txNorm, 3), 0.55);
  const volScore = Math.pow(Math.min(volNorm, 3), 0.45);
  const ageScore = Math.pow(ageNorm, 0.5);
  const protoScore = Math.pow(protoNorm, 0.5);

  return txScore * 0.35 + volScore * 0.30 + ageScore * 0.20 + protoScore * 0.15;
}

// ─── Structure Dimensions ────────────────────────────────────────
function calcHeight(composite: number): number {
  return 100 + composite * 500;
}

function calcWidth(profile: BuilderProfile): number {
  const protoNorm = Math.min(1, profile.protocolInteractions.length / 10);
  const commNorm = Math.min(1, profile.communitiesJoined.length / 8);
  const score = Math.pow(protoNorm, 0.5) * 0.60 + Math.pow(commNorm, 0.5) * 0.40;
  const jitter = (seededRandom(hashStr(profile.address)) - 0.5) * 4;
  return Math.round(14 + score * 24 + jitter);
}

function calcDepth(profile: BuilderProfile): number {
  const connNorm = Math.min(1, profile.connectedAddresses.length / 20);
  const ageNorm = Math.min(1, profile.walletAgeYears / 5);
  const score = Math.pow(connNorm, 0.5) * 0.50 + Math.pow(ageNorm, 0.5) * 0.50;
  const jitter = (seededRandom(hashStr(profile.address) + 99) - 0.5) * 4;
  return Math.round(12 + score * 20 + jitter);
}

function calcLitPercentage(profile: BuilderProfile): number {
  // Activity-based: more recent tx = more lit
  const recentTx = profile.timeline.filter(
    (t) => t.timestamp > Date.now() / 1000 - 30 * 24 * 3600
  ).length;
  const recentNorm = Math.min(1, recentTx / 10);
  const txNorm = Math.min(1, profile.txCount / 200);
  return 0.05 + (recentNorm * 0.60 + txNorm * 0.40) * 0.90;
}

function calcBadges(profile: BuilderProfile): string[] {
  const badges: string[] = [];
  if (profile.solVolume >= 10000) badges.push('whale');
  else if (profile.solVolume >= 1000) badges.push('dolphin');
  else if (profile.solVolume >= 100) badges.push('fish');
  if (profile.txCount >= 500) badges.push('power_user');
  else if (profile.txCount >= 100) badges.push('active');
  else if (profile.txCount >= 10) badges.push('explorer');
  if (profile.walletAgeYears >= 3) badges.push('og');
  else if (profile.walletAgeYears >= 1) badges.push('veteran');
  if (profile.protocolInteractions.length >= 5) badges.push('protocol_master');
  if (profile.communitiesJoined.length >= 4) badges.push('community_builder');
  if (profile.connectedAddresses.length >= 10) badges.push('networker');
  const hasNft = profile.communitiesJoined.some((c) => c.toLowerCase().includes('nft'));
  if (hasNft) badges.push('collector');
  const hasDefi = profile.protocolInteractions.some((p) =>
    ['Jupiter', 'Raydium', 'Orca', 'Meteora', 'Drift'].some((d) => p.name.includes(d))
  );
  if (hasDefi) badges.push('defi_diver');
  return badges;
}

function calcReputationScore(profile: BuilderProfile): number {
  return Math.min(
    99.9,
    Math.round(
      (75 + profile.walletAgeYears * 4.5 + Math.min(20, profile.txCount * 0.04)) * 10
    ) / 10
  );
}

function calcDepthLevel(composite: number): number {
  return Math.max(1, Math.min(100, Math.floor(composite * 100)));
}

// ─── Grid helpers ────────────────────────────────────────────────
function localBlockAxisPos(idx: number, footprint: number): number {
  if (idx === 0) return 0;
  const abs = Math.abs(idx);
  const sign = idx >= 0 ? 1 : -1;
  return sign * (abs * footprint + abs * STREET_W);
}

// ─── Generate Ocean Layout ───────────────────────────────────────
export function generateOceanLayout(profiles: BuilderProfile[]): {
  structures: OceanStructure[];
  clearings: ReefClearing[];
  decorations: OceanDecoration[];
  thermalVent: ThermalVent;
  coralArches: CoralArch[];
  zones: OceanZone[];
} {
  const structures: OceanStructure[] = [];
  const clearings: ReefClearing[] = [];
  const decorations: OceanDecoration[] = [];
  const zones: OceanZone[] = [];

  const maxTx = profiles.reduce((max, p) => Math.max(max, p.txCount), 1);
  const maxVol = profiles.reduce((max, p) => Math.max(max, p.solVolume), 1);

  // ── 1. Compute composites for all profiles ──
  const composites = new Map<string, number>();
  for (const p of profiles) {
    composites.set(p.address, calcComposite(p, maxTx, maxVol));
  }

  // ── 2. Group by zone, sorted ──
  const ZONE_ORDER = [
    'defi_trench', 'nft_reef', 'builders_cove', 'governance_basin',
    'degen_depths', 'social_shallows', 'validator_ridge', 'gamefi_atoll',
    'explorer_expanse',
  ];

  const WHALE_ABYSS_COUNT = Math.min(50, Math.max(5, Math.floor(profiles.length * 0.1)));
  const allSorted = [...profiles].sort(
    (a, b) => (composites.get(b.address) ?? 0) - (composites.get(a.address) ?? 0)
  );
  const whaleProfiles = allSorted.slice(0, WHALE_ABYSS_COUNT);
  const whaleSet = new Set(whaleProfiles.map((p) => p.address));

  const zoneGroups: Record<string, BuilderProfile[]> = {};
  for (const p of profiles) {
    if (whaleSet.has(p.address)) continue;
    const zone = inferZone(p);
    if (!zoneGroups[zone]) zoneGroups[zone] = [];
    zoneGroups[zone].push(p);
  }

  // Seeded shuffle for deterministic layout
  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i * 7919) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  const zoneDevArrays: { zid: string; profiles: BuilderProfile[] }[] = [];
  for (const zid of ZONE_ORDER) {
    const group = zoneGroups[zid];
    if (!group || group.length === 0) continue;
    zoneDevArrays.push({ zid, profiles: seededShuffle(group, hashStr(zid)) });
  }
  // Catch any zones not in ZONE_ORDER
  for (const [zid, group] of Object.entries(zoneGroups)) {
    if (!ZONE_ORDER.includes(zid) && group.length > 0) {
      zoneDevArrays.push({ zid, profiles: seededShuffle(group, hashStr(zid)) });
    }
  }

  // ── 3. Spiral placement ──
  const BLOCK_STEP_Z = BLOCK_FOOTPRINT_Z + STREET_W;
  const VENT_Z_THRESHOLD = BLOCK_STEP_Z / 2;
  const VENT_PUSH = VENT_WIDTH + 2 * VENT_MARGIN - STREET_W;
  const DISTRICT_GRID_RADIUS = 3;
  const LOTS_PER_BLOCK = BLOCK_SIZE * BLOCK_SIZE;

  const occupiedCells = new Set<string>();
  let globalDevIndex = 0;
  let globalBlockSeed = 0;
  const allBlocks: { cx: number; cz: number; gx: number; gz: number }[] = [];

  function gridToWorld(gx: number, gz: number): [number, number] {
    return [localBlockAxisPos(gx, BLOCK_FOOTPRINT_X), localBlockAxisPos(gz, BLOCK_FOOTPRINT_Z)];
  }

  function placeBlockContent(
    blockCX: number, blockCZ: number,
    blockProfiles: BuilderProfile[],
    seedIdx: number,
    zoneName: string,
  ) {
    for (let i = 0; i < blockProfiles.length; i++) {
      const p = blockProfiles[i];
      const localRow = Math.floor(i / BLOCK_SIZE);
      const localCol = i % BLOCK_SIZE;
      const posX = blockCX + (localCol - (BLOCK_SIZE - 1) / 2) * (LOT_W + ALLEY_W);
      const posZ = blockCZ + (localRow - (BLOCK_SIZE - 1) / 2) * (LOT_D + ALLEY_W);

      const composite = composites.get(p.address) ?? 0;
      let height = calcHeight(composite);
      let w = calcWidth(p);
      let d = calcDepth(p);

      // Prominent baseline scale boost for core protocols/presets (blockchains, startups, DAOs)
      if (p.type === 'blockchain') {
        height = Math.max(height, 420);
        w = Math.max(w, 28);
        d = Math.max(d, 28);
      } else if (p.type === 'startup') {
        height = Math.max(height, 320);
        w = Math.max(w, 24);
        d = Math.max(d, 24);
      } else if (p.type === 'community') {
        height = Math.max(height, 280);
        w = Math.max(w, 22);
        d = Math.max(d, 22);
      }

      const litPercentage = calcLitPercentage(p);
      const floorH = 6;
      const floors = Math.max(3, Math.floor(height / floorH));
      const windowsPerFloor = Math.max(3, Math.floor(w / 5));
      const sideWindowsPerFloor = Math.max(3, Math.floor(d / 5));

      structures.push({
        address: p.address,
        addressLower: p.address.toLowerCase(),
        rank: globalDevIndex + i + 1,
        domain: p.domain,
        type: p.type,
        sector: p.sector,
        projectName: p.projectName,
        txCount: p.txCount,
        solVolume: p.solVolume,
        walletAgeYears: p.walletAgeYears,
        protocolInteractions: p.protocolInteractions,
        communitiesJoined: p.communitiesJoined,
        connectedAddresses: p.connectedAddresses,
        timeline: p.timeline,
        zone: zoneName,
        position: [posX, 0, posZ],
        width: w,
        depth: d,
        height,
        floors,
        windowsPerFloor,
        sideWindowsPerFloor,
        litPercentage,
        archetype: getWalletArchetype(p.address),
        badges: calcBadges(p),
        reputationScore: calcReputationScore(p),
        depthLevel: calcDepthLevel(composite),
      });
    }

    // Bioluminescent nodes (street lamps equiv)
    const lampSeed = seedIdx * 1000 + 31;
    const lampCount = 2 + Math.floor(seededRandom(lampSeed * 311) * 3);
    for (let li = 0; li < lampCount; li++) {
      const seed = lampSeed * 5000 + li;
      const edge = Math.floor(seededRandom(seed) * 4);
      const alongX = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_X;
      const alongZ = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_Z;
      let lx = blockCX, lz = blockCZ;
      if (edge === 0) { lz -= BLOCK_FOOTPRINT_Z / 2 + 4; lx += alongX; }
      else if (edge === 1) { lx += BLOCK_FOOTPRINT_X / 2 + 4; lz += alongZ; }
      else if (edge === 2) { lz += BLOCK_FOOTPRINT_Z / 2 + 4; lx += alongX; }
      else { lx -= BLOCK_FOOTPRINT_X / 2 + 4; lz += alongZ; }
      decorations.push({ type: 'biolumNode', position: [lx, 0, lz], rotation: 0, variant: 0 });
    }

    // Kelp forests (trees equiv)
    const kelpSeed = seedIdx * 2000 + 77;
    const kelpCount = 1 + Math.floor(seededRandom(kelpSeed * 421) * 3);
    for (let ki = 0; ki < kelpCount; ki++) {
      const seed = kelpSeed * 6000 + ki;
      const edge = Math.floor(seededRandom(seed) * 4);
      const alongX = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_X * 0.8;
      const alongZ = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_Z * 0.8;
      let tx = blockCX, tz = blockCZ;
      if (edge === 0) { tz -= BLOCK_FOOTPRINT_Z / 2 + 6; tx += alongX; }
      else if (edge === 1) { tx += BLOCK_FOOTPRINT_X / 2 + 6; tz += alongZ; }
      else if (edge === 2) { tz += BLOCK_FOOTPRINT_Z / 2 + 6; tx += alongX; }
      else { tx -= BLOCK_FOOTPRINT_X / 2 + 6; tz += alongZ; }
      decorations.push({
        type: 'kelp',
        position: [tx, 0, tz],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: Math.floor(seededRandom(seed + 200) * 3),
      });
    }

    // Sea plants near structures (coral equiv)
    for (let bi = 0; bi < blockProfiles.length; bi++) {
      const bld = structures[structures.length - blockProfiles.length + bi];
      const coralSeed = hashStr(blockProfiles[bi].address) + 777;
      if (seededRandom(coralSeed) > 0.5) {
        const side = seededRandom(coralSeed + 1) > 0.5 ? 1 : -1;
        const cx = bld.position[0] + side * (bld.width / 2 + 6);
        decorations.push({
          type: 'coral',
          position: [cx, 0, bld.position[2]],
          rotation: seededRandom(coralSeed + 2) * Math.PI * 2,
          variant: Math.floor(seededRandom(coralSeed + 3) * 4),
        });
      }
    }

    globalDevIndex += blockProfiles.length;
  }

  function placeSpiralCluster(
    clusterProfiles: BuilderProfile[],
    ogx: number, ogz: number,
    addClearing: boolean,
    zoneName: string,
  ) {
    if (addClearing) {
      const key = `${ogx},${ogz}`;
      occupiedCells.add(key);
      const [pcx, initialPcz] = gridToWorld(ogx, ogz);
      let pcz = initialPcz;
      if (pcz > VENT_Z_THRESHOLD) pcz += VENT_PUSH;
      clearings.push({
        position: [pcx, 0, pcz],
        size: Math.min(BLOCK_FOOTPRINT_X, BLOCK_FOOTPRINT_Z) * 0.8,
        variant: seededRandom(globalBlockSeed * 997 + 42),
      });
      allBlocks.push({ cx: pcx, cz: pcz, gx: ogx, gz: ogz });
      globalBlockSeed++;
    }

    let devIdx = 0;
    let spiralIdx = 0;
    while (devIdx < clusterProfiles.length) {
      const [bx, by] = spiralCoord(spiralIdx);
      const gx = ogx + bx;
      const gz = ogz + by;
      const key = `${gx},${gz}`;
      if (occupiedCells.has(key)) { spiralIdx++; continue; }
      occupiedCells.add(key);

      let [blockCX, blockCZ] = gridToWorld(gx, gz);
      if (blockCZ > VENT_Z_THRESHOLD) blockCZ += VENT_PUSH;

      const jitterSeed = globalBlockSeed * 10000;
      blockCX += (seededRandom(jitterSeed) - 0.5) * 6;
      blockCZ += (seededRandom(jitterSeed + 7777) - 0.5) * 6;

      const blockProfiles = clusterProfiles.slice(devIdx, devIdx + LOTS_PER_BLOCK);
      placeBlockContent(blockCX, blockCZ, blockProfiles, globalBlockSeed, zoneName);
      allBlocks.push({ cx: blockCX, cz: blockCZ, gx, gz });

      devIdx += blockProfiles.length;
      spiralIdx++;
      globalBlockSeed++;
    }
  }

  // ── A) Whale's Abyss: spiral at center ──
  placeSpiralCluster(whaleProfiles, 0, 0, false, 'whale_abyss');

  // ── B) Zones: spiral at offset positions ──
  for (let di = 0; di < zoneDevArrays.length; di++) {
    const angle = (di / zoneDevArrays.length) * Math.PI * 2 - Math.PI / 2;
    const ogx = Math.round(Math.cos(angle) * DISTRICT_GRID_RADIUS);
    const ogz = Math.round(Math.sin(angle) * DISTRICT_GRID_RADIUS);
    placeSpiralCluster(zoneDevArrays[di].profiles, ogx, ogz, true, zoneDevArrays[di].zid);
  }

  // ── Current markings (road markings equiv) ──
  const DASH_LENGTH = 6;
  const DASH_GAP = 8;
  const DASH_STEP = DASH_LENGTH + DASH_GAP;
  const blockByGrid = new Map<string, (typeof allBlocks)[0]>();
  for (const b of allBlocks) blockByGrid.set(`${b.gx},${b.gz}`, b);
  for (const block of allBlocks) {
    const halfX = BLOCK_FOOTPRINT_X / 2;
    const halfZ = BLOCK_FOOTPRINT_Z / 2;
    const right = blockByGrid.get(`${block.gx + 1},${block.gz}`);
    if (right) {
      const roadCX = (block.cx + halfX + right.cx - halfX) / 2;
      const zMin = Math.min(block.cz, right.cz) - halfZ;
      const zMax = Math.max(block.cz, right.cz) + halfZ;
      for (let z = zMin; z <= zMax; z += DASH_STEP) {
        decorations.push({ type: 'currentMarking', position: [roadCX, 0.2, z], rotation: 0, variant: 0, size: [2, DASH_LENGTH] });
      }
    }
    const bottom = blockByGrid.get(`${block.gx},${block.gz + 1}`);
    if (bottom) {
      const roadCZ = (block.cz + halfZ + bottom.cz - halfZ) / 2;
      const xMin = Math.min(block.cx, bottom.cx) - halfX;
      const xMax = Math.max(block.cx, bottom.cx) + halfX;
      for (let x = xMin; x <= xMax; x += DASH_STEP) {
        decorations.push({ type: 'currentMarking', position: [x, 0.2, roadCZ], rotation: Math.PI / 2, variant: 0, size: [2, DASH_LENGTH] });
      }
    }
  }

  // ── Clearing decorations ──
  for (let pi = 0; pi < clearings.length; pi++) {
    const clearing = clearings[pi];
    const [px, , pz] = clearing.position;
    const halfSize = clearing.size / 2;
    const kelpCount = 4 + Math.floor(seededRandom(pi * 137 + 7777) * 5);
    for (let t = 0; t < kelpCount; t++) {
      const seed = pi * 10000 + t;
      decorations.push({
        type: 'kelp',
        position: [px + (seededRandom(seed) - 0.5) * halfSize * 1.6, 0, pz + (seededRandom(seed + 50) - 0.5) * halfSize * 1.6],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: Math.floor(seededRandom(seed + 200) * 3),
      });
    }
    const anemoneCount = 2 + Math.floor(seededRandom(pi * 251 + 8888) * 2);
    for (let b = 0; b < anemoneCount; b++) {
      const seed = pi * 20000 + b;
      decorations.push({
        type: 'anemone',
        position: [px + (seededRandom(seed) - 0.5) * halfSize, 0, pz + (seededRandom(seed + 50) - 0.5) * halfSize],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: 0,
      });
    }
  }

  // ── Zone boundaries (computed from structure positions) ──
  const zoneMap: Record<string, OceanStructure[]> = {};
  for (const s of structures) {
    if (!zoneMap[s.zone]) zoneMap[s.zone] = [];
    zoneMap[s.zone].push(s);
  }
  for (const [zid, zStructures] of Object.entries(zoneMap)) {
    let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
    let sX = 0, sZ = 0;
    for (const s of zStructures) {
      mnX = Math.min(mnX, s.position[0]); mxX = Math.max(mxX, s.position[0]);
      mnZ = Math.min(mnZ, s.position[2]); mxZ = Math.max(mxZ, s.position[2]);
      sX += s.position[0]; sZ += s.position[2];
    }
    zones.push({
      id: zid,
      name: ZONE_NAMES[zid] ?? zid,
      center: [sX / zStructures.length, 0, sZ / zStructures.length],
      bounds: { minX: mnX, maxX: mxX, minZ: mnZ, maxZ: mxZ },
      population: zStructures.length,
      color: ZONE_COLORS[zid] ?? '#888888',
      description: ZONE_DESCRIPTIONS[zid] ?? '',
    });
  }

  // ── Thermal Vent Trench (river equiv) ──
  const ventCenterZ = VENT_Z_THRESHOLD + VENT_PUSH / 2 + STREET_W / 2;
  let bMinX = 0, bMaxX = 0;
  for (const s of structures) {
    if (s.position[0] < bMinX) bMinX = s.position[0];
    if (s.position[0] > bMaxX) bMaxX = s.position[0];
  }
  const ventPadding = 80;
  const ventXExtent = (bMaxX - bMinX) + ventPadding * 2;
  const ventCenterX = (bMinX + bMaxX) / 2;
  const thermalVent: ThermalVent = {
    x: ventCenterX - ventXExtent / 2,
    width: ventXExtent,
    length: VENT_WIDTH,
    centerZ: ventCenterZ,
  };

  // ── Coral Arches (bridges equiv) ──
  const archWidth = VENT_WIDTH + 20;
  const archSpacing = ventXExtent / 4;
  const coralArches: CoralArch[] = [
    { position: [ventCenterX, 0, ventCenterZ], width: archWidth, rotation: Math.PI / 2 },
    { position: [ventCenterX + archSpacing, 0, ventCenterZ], width: archWidth, rotation: Math.PI / 2 },
    { position: [ventCenterX - archSpacing, 0, ventCenterZ], width: archWidth, rotation: Math.PI / 2 },
  ];

  return { structures, clearings, decorations, thermalVent, coralArches, zones };
}
