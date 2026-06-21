import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── District type ──────────────────────────────────────────────
type District = 'core' | 'defi' | 'social';

// ── Campus building block (one floor of a complex) ─────────────
interface CampusBuilding {
  pos: [number, number, number];
  size: [number, number, number]; // width, height, depth
  color: THREE.Color;
  glowColor: THREE.Color;
  topColor: THREE.Color;
  district: District;
}

interface CampusDome {
  pos: [number, number, number];
  radius: number;
  color: THREE.Color;
}

// ── 24 Campus center positions (world‑space XZ, Y=0) ───────────
const CAMPUS_CENTERS: { cx: number; cz: number; district: District; layer: number }[] = [
  // ── Core Reef District (north arc, cyan) ──────────────
  { cx:   0, cz: -100, district: 'core', layer: 1 },
  { cx:  35, cz:  -98, district: 'core', layer: 1 },
  { cx: -35, cz:  -98, district: 'core', layer: 1 },
  { cx:  18, cz: -140, district: 'core', layer: 2 },
  { cx: -18, cz: -140, district: 'core', layer: 2 },
  { cx:   0, cz: -175, district: 'core', layer: 3 },
  { cx:  60, cz: -125, district: 'core', layer: 2 },
  { cx: -60, cz: -125, district: 'core', layer: 2 },

  // ── DeFi Trench District (west arc, magenta/purple) ───
  { cx: -100, cz: -55, district: 'defi', layer: 1 },
  { cx: -120, cz:   0, district: 'defi', layer: 1 },
  { cx:  -98, cz:  55, district: 'defi', layer: 1 },
  { cx: -145, cz: -30, district: 'defi', layer: 2 },
  { cx: -145, cz:  30, district: 'defi', layer: 2 },
  { cx: -185, cz:   0, district: 'defi', layer: 3 },
  { cx: -130, cz:  85, district: 'defi', layer: 2 },
  { cx: -130, cz: -85, district: 'defi', layer: 2 },

  // ── Social Shelf District (east/south arc, gold/teal) ──
  { cx: 110, cz:  55, district: 'social', layer: 1 },
  { cx:  95, cz:  95, district: 'social', layer: 1 },
  { cx:  55, cz: 110, district: 'social', layer: 1 },
  { cx: 140, cz:  25, district: 'social', layer: 2 },
  { cx: 140, cz:  80, district: 'social', layer: 2 },
  { cx: 175, cz:  55, district: 'social', layer: 3 },
  { cx:  80, cz: 145, district: 'social', layer: 2 },
  { cx:  25, cz: 155, district: 'social', layer: 3 },
];

// ── District palette ────────────────────────────────────────────
const DISTRICT_PALETTE = {
  core:   { base: '#0a1d3a', accent: '#22d3ee', glow: '#06b6d4', top: '#e2e8f0' },
  defi:   { base: '#180f2d', accent: '#a855f7', glow: '#ec4899', top: '#f0abfc' },
  social: { base: '#201408', accent: '#fbbf24', glow: '#14b8a6', top: '#fde68a' },
};

// ── Seeded random helper (deterministic) ───────────────────────
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function CitySkyline() {
  // ─── Instanced mesh refs ───────────────────────────────────
  const buildingBaseRef   = useRef<THREE.InstancedMesh>(null);
  const buildingTopRef    = useRef<THREE.InstancedMesh>(null);
  const buildingGlowRef   = useRef<THREE.InstancedMesh>(null);
  const domeMeshRef       = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // ─── Landmark animation refs ───────────────────────────────
  const aetherRing1Ref    = useRef<THREE.Mesh>(null);
  const aetherRing2Ref    = useRef<THREE.Mesh>(null);
  const aetherRing3Ref    = useRef<THREE.Mesh>(null);
  const aetherCrystalsRef = useRef<THREE.Group>(null);
  const heliosGeodesicRef = useRef<THREE.Group>(null);

  // ─────────────────────────────────────────────────────────────
  // CAMPUS BUILDING GENERATION
  // Each campus emits 4-12 building "blocks" arranged in a city
  // block pattern around the campus center.
  // ─────────────────────────────────────────────────────────────
  const buildings = useMemo<CampusBuilding[]>(() => {
    const result: CampusBuilding[] = [];

    CAMPUS_CENTERS.forEach((campus, campusIdx) => {
      const { cx, cz, district, layer } = campus;
      const pal = DISTRICT_PALETTE[district];
      const rng = seededRand(campusIdx * 31337 + 7919);

      // Height scale grows with layer depth (distant = taller silhouette)
      const heightScale = 1.0 + (layer - 1) * 0.55;

      // How many buildings in this campus
      const buildingCount = 4 + Math.floor(rng() * 8);

      // Arrange in a rough grid-like cluster within ±18 units of campus center
      for (let b = 0; b < buildingCount; b++) {
        // Grid offset with slight jitter
        const col = (b % 3) - 1;   // -1, 0, 1
        const row = Math.floor(b / 3) - 1;
        const jitterX = (rng() - 0.5) * 6;
        const jitterZ = (rng() - 0.5) * 6;

        const bx = cx + col * 10 + jitterX;
        const bz = cz + row * 10 + jitterZ;

        // Building sizing — mix of wide blocks and thin towers
        const isMegaBlock = b === 0; // First building in campus is always the anchor
        const baseWidth  = isMegaBlock ? 8 + rng() * 6  : 3 + rng() * 4;
        const baseDepth  = isMegaBlock ? 7 + rng() * 5  : 3 + rng() * 4;
        const baseHeight = isMegaBlock
          ? (14 + rng() * 20) * heightScale
          : ( 8 + rng() * 18) * heightScale;

        const baseColor = new THREE.Color(pal.base);
        const topColor  = new THREE.Color(pal.top);
        const glowColor = new THREE.Color(pal.glow);

        // Darken outer‑layer buildings slightly for depth fog effect
        if (layer >= 3) baseColor.multiplyScalar(0.7);

        result.push({
          pos: [bx, baseHeight / 2, bz],
          size: [baseWidth, baseHeight, baseDepth],
          color: baseColor,
          glowColor,
          topColor,
          district,
        });
      }
    });

    return result;
  }, []);

  const buildingCount = buildings.length;

  // ─────────────────────────────────────────────────────────────
  // CAMPUS DOME GENERATION
  // Large glass biodomes anchored at campus centers (every other campus)
  // ─────────────────────────────────────────────────────────────
  const campusDomes = useMemo<CampusDome[]>(() => {
    return CAMPUS_CENTERS.filter((_, i) => i % 3 === 0).map((campus) => {
      const pal = DISTRICT_PALETTE[campus.district];
      return {
        pos: [campus.cx, 4 + campus.layer * 2, campus.cz] as [number, number, number],
        radius: 12 + campus.layer * 3,
        color: new THREE.Color(pal.accent),
      };
    });
  }, []);

  const domeCount = campusDomes.length;

  // ─────────────────────────────────────────────────────────────
  // SKYBRIDGE NETWORK
  // Connect buildings between nearby campuses within the same district
  // ─────────────────────────────────────────────────────────────
  const bridges = useMemo(() => {
    const paths: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    
    // Cross-campus bridge connections (same district)
    for (let i = 0; i < CAMPUS_CENTERS.length; i++) {
      for (let j = i + 1; j < CAMPUS_CENTERS.length; j++) {
        const a = CAMPUS_CENTERS[i];
        const b = CAMPUS_CENTERS[j];
        if (a.district !== b.district) continue;
        const dx = a.cx - b.cx;
        const dz = a.cz - b.cz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 70) continue; // Only connect close campuses

        const pal = DISTRICT_PALETTE[a.district];
        const midY = 18 + a.layer * 5;
        paths.push({
          start: new THREE.Vector3(a.cx, midY, a.cz),
          end: new THREE.Vector3(b.cx, midY, b.cz),
          color: pal.glow,
        });
      }
    }

    // Within-campus internal bridge (anchor to 2nd building)
    CAMPUS_CENTERS.forEach((campus, idx) => {
      const pal = DISTRICT_PALETTE[campus.district];
      const rng = seededRand(idx * 997);
      const ox1 = (rng() - 0.5) * 14;
      const oz1 = (rng() - 0.5) * 14;
      const ox2 = (rng() - 0.5) * 14;
      const oz2 = (rng() - 0.5) * 14;
      const bridgeY = 12 + campus.layer * 4;
      paths.push({
        start: new THREE.Vector3(campus.cx + ox1, bridgeY, campus.cz + oz1),
        end:   new THREE.Vector3(campus.cx + ox2, bridgeY, campus.cz + oz2),
        color: pal.glow,
      });
    });

    return paths;
  }, []);

  // ─────────────────────────────────────────────────────────────
  // ANIMATION FRAME
  // ─────────────────────────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Landmark ring animations
    if (aetherRing1Ref.current) {
      aetherRing1Ref.current.rotation.y = t * 0.4;
      aetherRing1Ref.current.rotation.x = t * 0.15;
    }
    if (aetherRing2Ref.current) {
      aetherRing2Ref.current.rotation.y = -t * 0.3;
      aetherRing2Ref.current.rotation.z = t * 0.2;
    }
    if (aetherRing3Ref.current) {
      aetherRing3Ref.current.rotation.y = t * 0.6;
      aetherRing3Ref.current.rotation.z = -t * 0.3;
    }
    if (heliosGeodesicRef.current) {
      heliosGeodesicRef.current.rotation.y = t * 0.2;
    }
    if (aetherCrystalsRef.current) {
      const heights = [25, 52, 76];
      aetherCrystalsRef.current.children.forEach((child, idx) => {
        child.rotation.y = t * (0.35 + idx * 0.12);
        child.position.y = heights[idx] + Math.sin(t * 0.75 + idx) * 1.3;
      });
    }

    // Update campus building instanced meshes
    if (buildingBaseRef.current && buildingTopRef.current && buildingGlowRef.current) {
      buildings.forEach((b, i) => {
        const [bx, by, bz] = b.pos;
        const [bw, bh, bd] = b.size;

        // Base block
        dummy.position.set(bx, by, bz);
        dummy.scale.set(bw, bh, bd);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        buildingBaseRef.current!.setMatrixAt(i, dummy.matrix);
        buildingBaseRef.current!.setColorAt(i, b.color);

        // Top setback (stepped upper floor — 60% width, 30% extra height)
        const topH = bh * 0.30;
        dummy.position.set(bx, by + bh * 0.5 + topH * 0.5, bz);
        dummy.scale.set(bw * 0.60, topH, bd * 0.60);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        buildingTopRef.current!.setMatrixAt(i, dummy.matrix);
        buildingTopRef.current!.setColorAt(i, b.topColor);

        // Mid glow band (emissive window strip)
        dummy.position.set(bx, by + bh * 0.08, bz);
        dummy.scale.set(bw * 1.01, 0.09, bd * 1.01);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        buildingGlowRef.current!.setMatrixAt(i, dummy.matrix);
        buildingGlowRef.current!.setColorAt(i, b.glowColor);
      });

      buildingBaseRef.current.instanceMatrix.needsUpdate = true;
      if (buildingBaseRef.current.instanceColor) buildingBaseRef.current.instanceColor.needsUpdate = true;
      buildingTopRef.current.instanceMatrix.needsUpdate = true;
      if (buildingTopRef.current.instanceColor) buildingTopRef.current.instanceColor.needsUpdate = true;
      buildingGlowRef.current.instanceMatrix.needsUpdate = true;
      if (buildingGlowRef.current.instanceColor) buildingGlowRef.current.instanceColor.needsUpdate = true;
    }

    // Dome gentle sway
    if (domeMeshRef.current) {
      campusDomes.forEach((d, i) => {
        dummy.position.set(d.pos[0], d.pos[1] + Math.sin(t * 0.35 + i) * 0.12, d.pos[2]);
        dummy.scale.set(d.radius, d.radius, d.radius);
        dummy.rotation.set(0, t * 0.015 + i, 0);
        dummy.updateMatrix();
        domeMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      domeMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  // ─────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────
  return (
    <group>

      {/* ═══════════════════════════════════════════════════════
          INSTANCED CAMPUS BUILDING BASES
          ═══════════════════════════════════════════════════════ */}
      <instancedMesh
        ref={buildingBaseRef}
        args={[null as any, null as any, buildingCount]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} metalness={0.35} />
      </instancedMesh>

      {/* Stepped upper tiers */}
      <instancedMesh
        ref={buildingTopRef}
        args={[null as any, null as any, buildingCount]}
        castShadow
      >
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} metalness={0.55} transparent opacity={0.88} />
      </instancedMesh>

      {/* Window glow bands */}
      <instancedMesh
        ref={buildingGlowRef}
        args={[null as any, null as any, buildingCount]}
      >
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshBasicMaterial color="#ffffff" />
      </instancedMesh>

      {/* ═══════════════════════════════════════════════════════
          INSTANCED CAMPUS GLASS DOMES
          ═══════════════════════════════════════════════════════ */}
      <instancedMesh
        ref={domeMeshRef}
        args={[null as any, null as any, domeCount]}
      >
        <sphereGeometry args={[1.0, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#93c5fd"
          transparent
          opacity={0.13}
          roughness={0.05}
          transmission={0.9}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* ═══════════════════════════════════════════════════════
          SKYBRIDGE NETWORK (inter-campus data lines)
          ═══════════════════════════════════════════════════════ */}
      <group>
        {bridges.map((p, idx) => {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([p.start, p.end]);
          return (
            <lineSegments key={`bridge-${idx}`} geometry={lineGeo}>
              <lineBasicMaterial color={p.color} transparent opacity={0.4} />
            </lineSegments>
          );
        })}
      </group>

      {/* ═══════════════════════════════════════════════════════
          DISTRICT TRANSIT LOOPS (orbital rings at district level)
          ═══════════════════════════════════════════════════════ */}
      <group>
        {/* Core Reef transit ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 12, -125]}>
          <torusGeometry args={[55, 0.18, 8, 64]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.5} />
        </mesh>
        {/* DeFi Trench transit ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-120, 20, 0]}>
          <torusGeometry args={[42, 0.15, 8, 48]} />
          <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2.5} />
        </mesh>
        {/* Social Shelf transit ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[110, 16, 90]}>
          <torusGeometry args={[38, 0.15, 8, 48]} />
          <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════════════
          CORE REEF DISTRICT — Architectural Complex Set
          Capital-city feel, stepped pyramids, civic buildings
          ═══════════════════════════════════════════════════════ */}
      <group>

        {/* ── Core Reef Civic Complex (near, north) ── */}
        <group position={[0, 0, -105]}>
          {/* Giant civic base platform */}
          <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[38, 3, 28]} />
            <meshStandardMaterial color="#0a1c36" roughness={0.75} />
          </mesh>
          {/* Platform railing strips */}
          <mesh position={[0, 3.15, 0]}>
            <boxGeometry args={[38.4, 0.3, 0.3]} />
            <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.0} />
          </mesh>

          {/* West wing — stepped skyscraper A */}
          <group position={[-10, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 12, 0]}>
              <boxGeometry args={[8, 24, 7]} />
              <meshStandardMaterial color="#0c2140" roughness={0.8} metalness={0.3} />
            </mesh>
            {/* Setback floor 2 */}
            <mesh castShadow position={[0, 28, 0]}>
              <boxGeometry args={[5.5, 10, 4.5]} />
              <meshStandardMaterial color="#0f2a52" roughness={0.7} metalness={0.4} />
            </mesh>
            {/* Setback floor 3 */}
            <mesh castShadow position={[0, 38, 0]}>
              <boxGeometry args={[3.5, 8, 3]} />
              <meshStandardMaterial color="#1a3a6a" roughness={0.6} metalness={0.5} />
            </mesh>
            {/* Cyan crown beacon */}
            <mesh position={[0, 42.5, 0]}>
              <sphereGeometry args={[1.2, 8, 8]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3.5} />
            </mesh>
            {/* Window glow band */}
            <mesh position={[0, 8, 0]}>
              <boxGeometry args={[8.05, 0.12, 7.05]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.0} />
            </mesh>
          </group>

          {/* Center building — curved civic hall */}
          <group position={[0, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]}>
              <cylinderGeometry args={[5.5, 7, 16, 8]} />
              <meshStandardMaterial color="#0e2040" roughness={0.75} metalness={0.4} />
            </mesh>
            {/* Glass dome cap */}
            <mesh position={[0, 16.5, 0]}>
              <sphereGeometry args={[5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color="#22d3ee"
                transparent
                opacity={0.22}
                roughness={0.08}
                transmission={0.85}
              />
            </mesh>
            {/* Dome gold ring */}
            <mesh position={[0, 16, 0]}>
              <torusGeometry args={[5.1, 0.15, 6, 24]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>

          {/* East wing — stepped skyscraper B */}
          <group position={[10, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 16, 0]}>
              <boxGeometry args={[7, 32, 6]} />
              <meshStandardMaterial color="#0c2140" roughness={0.8} metalness={0.3} />
            </mesh>
            <mesh castShadow position={[0, 37, 0]}>
              <boxGeometry args={[4.5, 12, 4]} />
              <meshStandardMaterial color="#0f2a52" roughness={0.7} metalness={0.4} />
            </mesh>
            <mesh castShadow position={[0, 49, 0]}>
              <boxGeometry args={[2.5, 8, 2.5]} />
              <meshStandardMaterial color="#1a3a6a" roughness={0.6} metalness={0.5} />
            </mesh>
            {/* Cyan apex */}
            <mesh position={[0, 53.5, 0]}>
              <coneGeometry args={[1.5, 4, 6]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3.0} />
            </mesh>
            {/* Window glow strip */}
            <mesh position={[0, 10, 0]}>
              <boxGeometry args={[7.05, 0.12, 6.05]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={2.0} />
            </mesh>
            {/* Skybridge to west wing */}
            <mesh position={[-5, 16, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 10, 6]} />
              <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.3} transmission={0.85} roughness={0.1} />
            </mesh>
          </group>

          <pointLight position={[0, 20, 0]} color="#22d3ee" intensity={3.0} distance={80} decay={1.5} />
        </group>

        {/* ── Core Reef Secondary Complex (north-east) ── */}
        <group position={[38, 0, -102]}>
          <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
            <boxGeometry args={[22, 2, 18]} />
            <meshStandardMaterial color="#0a1c36" roughness={0.75} />
          </mesh>
          {/* L-shaped office towers */}
          <mesh castShadow receiveShadow position={[-5, 12, -3]}>
            <boxGeometry args={[6, 24, 5]} />
            <meshStandardMaterial color="#0c2140" roughness={0.8} />
          </mesh>
          <mesh castShadow receiveShadow position={[5, 18, 3]}>
            <boxGeometry args={[5, 36, 5]} />
            <meshStandardMaterial color="#0f2a52" roughness={0.75} />
          </mesh>
          {/* Stepped crown on tallest */}
          <mesh castShadow position={[5, 40, 3]}>
            <boxGeometry args={[3, 12, 3]} />
            <meshStandardMaterial color="#1a3a6a" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Skybridge between towers */}
          <mesh position={[0, 18, 0]} rotation={[0, Math.PI / 4, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 14.14, 6]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.25} transmission={0.85} roughness={0.1} />
          </mesh>
          <mesh position={[5, 46, 3]}>
            <sphereGeometry args={[1.0, 8, 8]} />
            <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3.0} />
          </mesh>
        </group>

        {/* ── Core Reef Secondary Complex (north-west) ── */}
        <group position={[-38, 0, -102]}>
          <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
            <boxGeometry args={[20, 2, 16]} />
            <meshStandardMaterial color="#0a1c36" roughness={0.75} />
          </mesh>
          <mesh castShadow receiveShadow position={[4, 10, 0]}>
            <boxGeometry args={[5, 20, 6]} />
            <meshStandardMaterial color="#0c2140" roughness={0.8} />
          </mesh>
          <mesh castShadow receiveShadow position={[-4, 14, 0]}>
            <boxGeometry args={[6, 28, 5]} />
            <meshStandardMaterial color="#0f2a52" roughness={0.75} />
          </mesh>
          <mesh castShadow position={[-4, 32, 0]}>
            <boxGeometry args={[4, 10, 3.5]} />
            <meshStandardMaterial color="#1a3a6a" roughness={0.6} metalness={0.4} />
          </mesh>
          {/* Glass observation deck */}
          <mesh position={[-4, 37, 0]}>
            <cylinderGeometry args={[4.5, 4.5, 0.4, 8]} />
            <meshPhysicalMaterial color="#22d3ee" transparent opacity={0.25} roughness={0.1} transmission={0.8} />
          </mesh>
          <mesh position={[-4, 38, 0]}>
            <torusGeometry args={[4.6, 0.1, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} />
          </mesh>
        </group>

        {/* ── Core Reef Deep Backdrop (layer 2-3 silhouette blocks) ── */}
        {[
          { pos: [-20, 0, -145] as [number,number,number], sz: [16, 42, 12] as [number,number,number], color: '#08172e' },
          { pos: [ 20, 0, -145] as [number,number,number], sz: [18, 52, 14] as [number,number,number], color: '#061526' },
          { pos: [  0, 0, -180] as [number,number,number], sz: [24, 65, 18] as [number,number,number], color: '#04101e' },
          { pos: [-60, 0, -130] as [number,number,number], sz: [20, 38, 14] as [number,number,number], color: '#08172e' },
          { pos: [ 60, 0, -130] as [number,number,number], sz: [18, 45, 14] as [number,number,number], color: '#08172e' },
        ].map((b, i) => (
          <group key={`core-backdrop-${i}`} position={b.pos}>
            {/* Building mass */}
            <mesh castShadow receiveShadow position={[0, b.sz[1] / 2, 0]}>
              <boxGeometry args={b.sz} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </mesh>
            {/* Setback tier */}
            <mesh castShadow position={[0, b.sz[1] * 0.85, 0]}>
              <boxGeometry args={[b.sz[0] * 0.6, b.sz[1] * 0.25, b.sz[2] * 0.6]} />
              <meshStandardMaterial color={b.color} roughness={0.85} />
            </mesh>
            {/* Glow strip */}
            <mesh position={[0, b.sz[1] * 0.45, 0]}>
              <boxGeometry args={[b.sz[0] * 1.01, 0.15, b.sz[2] * 1.01]} />
              <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════
          DEFI TRENCH DISTRICT — Architectural Complex Set
          Gothic / dark-finance aesthetic, purple & magenta
          ═══════════════════════════════════════════════════════ */}
      <group>

        {/* ── DeFi Main Exchange Complex (west) ── */}
        <group position={[-105, 0, -55]}>
          {/* Grand base plinth */}
          <mesh castShadow receiveShadow position={[0, 2, 0]}>
            <boxGeometry args={[32, 4, 24]} />
            <meshStandardMaterial color="#160c28" roughness={0.8} />
          </mesh>
          {/* Plinth accent strip */}
          <mesh position={[0, 4.2, 0]}>
            <boxGeometry args={[32.4, 0.4, 0.4]} />
            <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={2.5} />
          </mesh>

          {/* Left exchange tower */}
          <group position={[-8, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 20, 0]}>
              <boxGeometry args={[7, 40, 6]} />
              <meshStandardMaterial color="#1a0e30" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 44, 0]}>
              <boxGeometry args={[4.5, 12, 4]} />
              <meshStandardMaterial color="#250f42" roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0, 52, 0]}>
              <boxGeometry args={[2.5, 8, 2.5]} />
              <meshStandardMaterial color="#3a1860" roughness={0.6} metalness={0.4} />
            </mesh>
            <mesh position={[0, 57, 0]}>
              <octahedronGeometry args={[1.6]} />
              <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={4.0} />
            </mesh>
            {/* Window glow */}
            <mesh position={[0, 14, 0]}>
              <boxGeometry args={[7.05, 0.12, 6.05]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={2.0} />
            </mesh>
          </group>

          {/* Central vault structure (curved) */}
          <group position={[0, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 12, 0]}>
              <cylinderGeometry args={[4, 6, 24, 8]} />
              <meshStandardMaterial color="#1f0e38" roughness={0.75} metalness={0.5} />
            </mesh>
            {/* Rotating orbit ring */}
            <mesh position={[0, 24, 0]}>
              <torusGeometry args={[5.5, 0.18, 8, 24]} />
              <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={2.5} metalness={0.8} />
            </mesh>
            {/* Glass dome */}
            <mesh position={[0, 25, 0]}>
              <sphereGeometry args={[4.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#a855f7" transparent opacity={0.2} roughness={0.08} transmission={0.85} />
            </mesh>
          </group>

          {/* Right exchange tower */}
          <group position={[8, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 16, 0]}>
              <boxGeometry args={[6, 32, 5]} />
              <meshStandardMaterial color="#1a0e30" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 37, 0]}>
              <boxGeometry args={[4, 12, 3.5]} />
              <meshStandardMaterial color="#250f42" roughness={0.7} />
            </mesh>
            {/* Magenta apex beacon */}
            <mesh position={[0, 43.5, 0]}>
              <sphereGeometry args={[1.2, 8, 8]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={4.0} />
            </mesh>
            {/* Skybridge connecting both towers */}
            <mesh position={[-4, 20, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 8, 6]} />
              <meshPhysicalMaterial color="#e9d5ff" transparent opacity={0.28} transmission={0.85} roughness={0.1} />
            </mesh>
          </group>

          <pointLight position={[0, 30, 0]} color="#8b5cf6" intensity={3.5} distance={90} decay={1.5} />
        </group>

        {/* ── DeFi Trench Deep Silhouette Backdrop ── */}
        {[
          { pos: [-150, 0, -30] as [number,number,number], sz: [20, 56, 14] as [number,number,number], color: '#120826' },
          { pos: [-150, 0,  30] as [number,number,number], sz: [18, 48, 12] as [number,number,number], color: '#0e0620' },
          { pos: [-188, 0,   0] as [number,number,number], sz: [28, 72, 20] as [number,number,number], color: '#0a0418' },
          { pos: [-135, 0,  88] as [number,number,number], sz: [22, 44, 16] as [number,number,number], color: '#120826' },
          { pos: [-135, 0, -88] as [number,number,number], sz: [22, 50, 16] as [number,number,number], color: '#120826' },
        ].map((b, i) => (
          <group key={`defi-backdrop-${i}`} position={b.pos}>
            <mesh castShadow receiveShadow position={[0, b.sz[1] / 2, 0]}>
              <boxGeometry args={b.sz} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, b.sz[1] * 0.82, 0]}>
              <boxGeometry args={[b.sz[0] * 0.55, b.sz[1] * 0.28, b.sz[2] * 0.55]} />
              <meshStandardMaterial color={b.color} roughness={0.85} />
            </mesh>
            {/* Purple glow strip */}
            <mesh position={[0, b.sz[1] * 0.48, 0]}>
              <boxGeometry args={[b.sz[0] * 1.01, 0.15, b.sz[2] * 1.01]} />
              <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL SHELF DISTRICT — Architectural Complex Set
          Warm gold & teal, terraced community campus feel
          ═══════════════════════════════════════════════════════ */}
      <group>

        {/* ── Social Hub Central Complex (south-east) ── */}
        <group position={[112, 0, 58]}>
          {/* Broad community terrace base */}
          <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
            <boxGeometry args={[36, 3, 26]} />
            <meshStandardMaterial color="#1e1108" roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.1, 0]}>
            <boxGeometry args={[36.4, 0.2, 0.2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={2.0} />
          </mesh>

          {/* Left community tower */}
          <group position={[-9, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 14, 0]}>
              <boxGeometry args={[7, 28, 7]} />
              <meshStandardMaterial color="#211208" roughness={0.8} />
            </mesh>
            {/* Terraced setbacks */}
            <mesh castShadow position={[0, 30, 0]}>
              <boxGeometry args={[5, 10, 5]} />
              <meshStandardMaterial color="#2c1a0a" roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0, 39, 0]}>
              <boxGeometry args={[3, 8, 3]} />
              <meshStandardMaterial color="#3a220c" roughness={0.6} metalness={0.3} />
            </mesh>
            {/* Gold crown */}
            <mesh position={[0, 44, 0]}>
              <coneGeometry args={[2, 5, 6]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Window glow */}
            <mesh position={[0, 8, 0]}>
              <boxGeometry args={[7.05, 0.12, 7.05]} />
              <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={2.0} />
            </mesh>
          </group>

          {/* Central community hall (rounded) */}
          <group position={[0, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 10, 0]}>
              <cylinderGeometry args={[5, 7, 20, 10]} />
              <meshStandardMaterial color="#241408" roughness={0.75} metalness={0.35} />
            </mesh>
            {/* Observation tier */}
            <mesh castShadow position={[0, 21, 0]}>
              <cylinderGeometry args={[3.5, 5, 6, 10]} />
              <meshStandardMaterial color="#2e1a0c" roughness={0.65} metalness={0.4} />
            </mesh>
            {/* Glass dome */}
            <mesh position={[0, 27, 0]}>
              <sphereGeometry args={[3.5, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial color="#fbbf24" transparent opacity={0.22} roughness={0.08} transmission={0.85} />
            </mesh>
            {/* Gold ring */}
            <mesh position={[0, 27, 0]}>
              <torusGeometry args={[3.6, 0.12, 6, 24]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>

          {/* Right tower */}
          <group position={[9, 0, 0]}>
            <mesh castShadow receiveShadow position={[0, 18, 0]}>
              <boxGeometry args={[6, 36, 6]} />
              <meshStandardMaterial color="#211208" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[0, 40, 0]}>
              <boxGeometry args={[4, 12, 4]} />
              <meshStandardMaterial color="#2c1a0a" roughness={0.7} />
            </mesh>
            <mesh castShadow position={[0, 51, 0]}>
              <boxGeometry args={[2.5, 8, 2.5]} />
              <meshStandardMaterial color="#3a220c" roughness={0.6} metalness={0.3} />
            </mesh>
            {/* Teal beacon */}
            <mesh position={[0, 55.5, 0]}>
              <sphereGeometry args={[1.3, 8, 8]} />
              <meshStandardMaterial color="#14b8a6" emissive="#0d9488" emissiveIntensity={3.5} />
            </mesh>
            {/* Skybridge */}
            <mesh position={[-4.5, 24, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 9, 6]} />
              <meshPhysicalMaterial color="#fde68a" transparent opacity={0.25} transmission={0.85} roughness={0.1} />
            </mesh>
          </group>

          <pointLight position={[0, 28, 0]} color="#d97706" intensity={3.0} distance={80} decay={1.5} />
        </group>

        {/* ── Social Shelf Deep Silhouette Backdrop ── */}
        {[
          { pos: [145, 0,  28] as [number,number,number], sz: [18, 50, 14] as [number,number,number], color: '#1a1004' },
          { pos: [145, 0,  82] as [number,number,number], sz: [22, 58, 16] as [number,number,number], color: '#140e04' },
          { pos: [178, 0,  58] as [number,number,number], sz: [26, 68, 20] as [number,number,number], color: '#100c02' },
          { pos: [ 82, 0, 148] as [number,number,number], sz: [20, 46, 14] as [number,number,number], color: '#1a1004' },
          { pos: [ 28, 0, 158] as [number,number,number], sz: [24, 62, 18] as [number,number,number], color: '#140e04' },
        ].map((b, i) => (
          <group key={`social-backdrop-${i}`} position={b.pos}>
            <mesh castShadow receiveShadow position={[0, b.sz[1] / 2, 0]}>
              <boxGeometry args={b.sz} />
              <meshStandardMaterial color={b.color} roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, b.sz[1] * 0.82, 0]}>
              <boxGeometry args={[b.sz[0] * 0.58, b.sz[1] * 0.28, b.sz[2] * 0.58]} />
              <meshStandardMaterial color={b.color} roughness={0.85} />
            </mesh>
            {/* Gold glow strip */}
            <mesh position={[0, b.sz[1] * 0.45, 0]}>
              <boxGeometry args={[b.sz[0] * 1.01, 0.15, b.sz[2] * 1.01]} />
              <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={1.5} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════
          LARGE BIODOME CITY ANCHORS
          Massive glass domes with internal city scape at each
          district's primary campus
          ═══════════════════════════════════════════════════════ */}
      <group>
        {[
          { pos: [0,  5, -135] as [number,number,number], r: 18, accent: '#22d3ee', base: '#0a1d3a', emissive: '#06b6d4' },
          { pos: [-132, 8, -52] as [number,number,number], r: 16, accent: '#a855f7', base: '#1a0e30', emissive: '#8b5cf6' },
          { pos: [ 48, 6,  128] as [number,number,number], r: 17, accent: '#fbbf24', base: '#20140a', emissive: '#d97706' },
        ].map((dome, i) => (
          <group key={`primary-dome-${i}`} position={dome.pos}>
            {/* Platform base */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[dome.r, dome.r + 1.5, 1.5, 16]} />
              <meshStandardMaterial color={dome.base} roughness={0.7} />
            </mesh>
            {/* Gold deck ring */}
            <mesh position={[0, 0.75, 0]}>
              <torusGeometry args={[dome.r + 0.15, 0.14, 6, 32]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Glass dome */}
            <mesh position={[0, 0.2, 0]}>
              <sphereGeometry args={[dome.r - 0.3, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color={dome.accent}
                transparent
                opacity={0.18}
                transmission={0.88}
                roughness={0.06}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Internal cityscape — mini-building cluster */}
            {[0, 1, 2, 3, 4, 5].map((j) => {
              const ang = (j / 6) * Math.PI * 2;
              const dist = dome.r * 0.42;
              const tx = Math.cos(ang) * dist;
              const tz = Math.sin(ang) * dist;
              const th = 9 + j * 1.8;
              return (
                <group key={`dome-bld-${j}`} position={[tx, 0.75, tz]}>
                  {/* Building block */}
                  <mesh castShadow>
                    <boxGeometry args={[2.2, th, 2.0]} />
                    <meshStandardMaterial color={dome.base} roughness={0.7} />
                  </mesh>
                  {/* Setback top */}
                  <mesh castShadow position={[0, th * 0.62, 0]}>
                    <boxGeometry args={[1.4, th * 0.28, 1.4]} />
                    <meshStandardMaterial color={dome.base} roughness={0.6} metalness={0.3} />
                  </mesh>
                  {/* Glow beacon */}
                  <mesh position={[0, th * 0.95, 0]}>
                    <sphereGeometry args={[0.45, 6, 6]} />
                    <meshStandardMaterial color={dome.accent} emissive={dome.emissive} emissiveIntensity={3.0} />
                  </mesh>
                </group>
              );
            })}
            <pointLight position={[0, dome.r * 0.5, 0]} color={dome.accent} intensity={2.5} distance={dome.r * 3} decay={1.5} />
          </group>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════
          ELEVATED PLATFORM CITIES (mid-tier, floating)
          ═══════════════════════════════════════════════════════ */}
      <group>
        {[
          { pos: [-95, 14, -45] as [number,number,number], r: 10, accent: '#a855f7', emissive: '#8b5cf6', base: '#1a0e30' },
          { pos: [ 90, 11,  40] as [number,number,number], r: 11, accent: '#fbbf24', emissive: '#d97706', base: '#20140a' },
          { pos: [-25, 15, -97] as [number,number,number], r: 9,  accent: '#22d3ee', emissive: '#06b6d4', base: '#0a1d3a' },
        ].map((plat, i) => (
          <group key={`plat-${i}`} position={plat.pos}>
            {/* Platform */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[plat.r, plat.r, 1.0, 10]} />
              <meshStandardMaterial color={plat.base} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
              <torusGeometry args={[plat.r + 0.1, 0.1, 6, 20]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Support column */}
            <mesh position={[0, -7, 0]}>
              <cylinderGeometry args={[0.35, 0.6, 14, 6]} />
              <meshStandardMaterial color="#0f2038" roughness={0.9} />
            </mesh>
            {/* Buildings on platform */}
            {[0, 1, 2, 3].map((k) => {
              const ang = (k / 4) * Math.PI * 2 + Math.PI / 8;
              const tx = Math.cos(ang) * (plat.r * 0.52);
              const tz = Math.sin(ang) * (plat.r * 0.52);
              const tw = 2.5 + k * 0.5;
              const th = 10 + k * 4;
              return (
                <group key={`plat-bld-${k}`} position={[tx, 0.5, tz]}>
                  <mesh castShadow>
                    <boxGeometry args={[tw, th, tw * 0.85]} />
                    <meshStandardMaterial color={plat.base} roughness={0.75} />
                  </mesh>
                  {/* Setback */}
                  <mesh castShadow position={[0, th * 0.6, 0]}>
                    <boxGeometry args={[tw * 0.6, th * 0.3, tw * 0.6 * 0.85]} />
                    <meshStandardMaterial color={plat.base} roughness={0.65} metalness={0.3} />
                  </mesh>
                  <mesh position={[0, th * 0.95, 0]}>
                    <sphereGeometry args={[0.35, 6, 6]} />
                    <meshStandardMaterial color={plat.accent} emissive={plat.emissive} emissiveIntensity={3.0} />
                  </mesh>
                </group>
              );
            })}
          </group>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════════════
          LANDMARK 1: THE AETHER PILLAR (North-West)
          ═══════════════════════════════════════════════════════ */}
      <group position={[-75, 0, -85]}>
        {/* Segment 1 (Base) */}
        <mesh castShadow receiveShadow position={[0, 10, 0]}>
          <cylinderGeometry args={[2.2, 2.6, 20, 12]} />
          <meshStandardMaterial color="#0f2038" roughness={0.85} metalness={0.5} />
        </mesh>
        {/* Energy conduit gap 1 */}
        <mesh position={[0, 20, 0]}>
          <cylinderGeometry args={[1.9, 1.9, 1.2, 12]} />
          <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={3.5} />
        </mesh>

        {/* Segment 2 */}
        <mesh castShadow receiveShadow position={[0, 31, 0]}>
          <cylinderGeometry args={[1.7, 2.1, 22, 10]} />
          <meshStandardMaterial color="#0f2038" roughness={0.8} metalness={0.5} />
        </mesh>
        {/* Energy conduit gap 2 */}
        <mesh position={[0, 42, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 1.2, 10]} />
          <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={3.5} />
        </mesh>

        {/* Segment 3 */}
        <mesh castShadow receiveShadow position={[0, 53, 0]}>
          <cylinderGeometry args={[1.3, 1.6, 22, 8]} />
          <meshStandardMaterial color="#0f2038" roughness={0.75} metalness={0.5} />
        </mesh>
        {/* Energy conduit gap 3 */}
        <mesh position={[0, 64, 0]}>
          <cylinderGeometry args={[1.1, 1.1, 1.2, 8]} />
          <meshStandardMaterial color="#a78bfa" emissive="#8b5cf6" emissiveIntensity={3.5} />
        </mesh>

        {/* Segment 4 */}
        <mesh castShadow receiveShadow position={[0, 75, 0]}>
          <cylinderGeometry args={[0.9, 1.2, 22, 8]} />
          <meshStandardMaterial color="#0f2038" roughness={0.7} metalness={0.5} />
        </mesh>

        {/* Outer support cage */}
        {([ [-2.5, -2.5], [2.5, -2.5], [2.5, 2.5], [-2.5, 2.5] ] as [number,number][]).map(([ox, oz], i) => (
          <mesh key={`col-${i}`} castShadow receiveShadow position={[ox, 35, oz]}>
            <cylinderGeometry args={[0.3, 0.6, 70, 6]} />
            <meshStandardMaterial color="#0f2038" roughness={0.9} metalness={0.5} />
          </mesh>
        ))}

        {/* Gold structural clamp bands */}
        {[20, 45, 70].map((ry) => (
          <mesh key={`clamp-${ry}`} position={[0, ry, 0]}>
            <torusGeometry args={[3.6, 0.15, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}

        {/* Triple rotating orbit rings */}
        <mesh ref={aetherRing1Ref} position={[0, 20, 0]}>
          <torusGeometry args={[5.2, 0.18, 8, 32]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh ref={aetherRing2Ref} position={[0, 50, 0]}>
          <torusGeometry args={[4.4, 0.14, 8, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh ref={aetherRing3Ref} position={[0, 80, 0]}>
          <torusGeometry args={[3.6, 0.10, 8, 20]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Frosted glass observation decks */}
        {[31, 64].map((dy, idx) => (
          <group key={`deck-${idx}`} position={[0, dy, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[4.5, 4.7, 0.3, 12]} />
              <meshPhysicalMaterial color="#c084fc" transparent opacity={0.3} roughness={0.15} transmission={0.8} />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <torusGeometry args={[4.6, 0.08, 6, 24]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Floating crystal segments */}
        <group ref={aetherCrystalsRef}>
          {[25, 52, 76].map((by, idx) => {
            const angle = (idx / 3) * Math.PI * 2;
            const cx = Math.cos(angle) * 3.4;
            const cz = Math.sin(angle) * 3.4;
            return (
              <group key={`aether-crystal-${idx}`} position={[cx, by, cz]}>
                <mesh castShadow>
                  <octahedronGeometry args={[1.2]} />
                  <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={3.5} />
                </mesh>
                <mesh rotation={[Math.PI / 4, 0, Math.PI / 4]}>
                  <torusGeometry args={[1.8, 0.04, 4, 16]} />
                  <meshStandardMaterial color="#d97706" metalness={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* Glowing apex crown */}
        <mesh position={[0, 90, 0]}>
          <octahedronGeometry args={[3.2]} />
          <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={4.5} />
        </mesh>

        {/* Crown arches */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i / 4) * Math.PI * 2;
          const ax = Math.cos(angle) * 3.4;
          const az = Math.sin(angle) * 3.4;
          return (
            <mesh key={`crown-arch-${i}`} position={[ax / 2, 92, az / 2]} rotation={[0, -angle, Math.PI / 6]}>
              <cylinderGeometry args={[0.15, 0.25, 6.0, 6]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} />
            </mesh>
          );
        })}

        <mesh position={[0, 95, 0]}>
          <torusGeometry args={[1.5, 0.1, 6, 16]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={3.0} />
        </mesh>
        <pointLight position={[0, 90, 0]} color="#8b5cf6" intensity={8.0} distance={120} decay={1.2} />
      </group>

      {/* ═══════════════════════════════════════════════════════
          LANDMARK 2: THE HELIOS TOWER (South-East)
          ═══════════════════════════════════════════════════════ */}
      <group position={[85, 0, 75]}>
        {/* Central Spire segments */}
        <group>
          <mesh castShadow receiveShadow position={[0, 14, 0]}>
            <cylinderGeometry args={[1.8, 2.4, 28, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.1} />
          </mesh>
          <mesh position={[0, 28, 0]}>
            <torusGeometry args={[2.0, 0.15, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 42, 0]}>
            <cylinderGeometry args={[1.2, 1.8, 28, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.1} />
          </mesh>
          <mesh position={[0, 56, 0]}>
            <torusGeometry args={[1.3, 0.12, 6, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 66, 0]}>
            <cylinderGeometry args={[0.7, 1.2, 20, 8]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
          </mesh>
          {/* Emissive cyan rings */}
          {[14, 28, 42, 56].map((ry) => (
            <mesh key={`spire-glow-${ry}`} position={[0, ry, 0]}>
              <torusGeometry args={[1.9 - ry * 0.015, 0.05, 4, 16]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3.0} />
            </mesh>
          ))}
        </group>

        {/* 4 Satellite spires */}
        {[
          { ox: 5.2, oz:  5.2, h: 35 },
          { ox: -5.2, oz:  5.2, h: 45 },
          { ox: -5.2, oz: -5.2, h: 52 },
          { ox:  5.2, oz: -5.2, h: 58 },
        ].map((s, i) => (
          <group key={`sat-${i}`} position={[s.ox, 0, s.oz]}>
            <mesh castShadow receiveShadow position={[0, s.h / 2, 0]}>
              <cylinderGeometry args={[0.15, 0.9, s.h, 6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
            </mesh>
            <mesh position={[0, s.h, 0]}>
              <coneGeometry args={[0.45, 1.5, 6]} />
              <meshStandardMaterial color="#d97706" metalness={0.95} />
            </mesh>
            <mesh position={[0, s.h + 1.2, 0]}>
              <sphereGeometry args={[0.3 + i * 0.05, 8, 8]} />
              <meshStandardMaterial color="#06b6d4" emissive="#00f3ff" emissiveIntensity={2.5} />
            </mesh>
          </group>
        ))}

        {/* Skybridges to satellite spires */}
        {[
          { ox:  5.2, oz:  5.2, y: 20 },
          { ox: -5.2, oz:  5.2, y: 32 },
          { ox: -5.2, oz: -5.2, y: 44 },
          { ox:  5.2, oz: -5.2, y: 56 },
        ].map((bridge, i) => {
          const angle = Math.atan2(bridge.oz, bridge.ox);
          const len = Math.sqrt(bridge.ox * bridge.ox + bridge.oz * bridge.oz);
          return (
            <group key={`bridge-${i}`} position={[bridge.ox / 2, bridge.y, bridge.oz / 2]} rotation={[0, -angle, Math.PI / 2]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.3, 0.3, len, 8]} />
                <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.3} transmission={0.9} roughness={0.1} />
              </mesh>
              <mesh>
                <boxGeometry args={[0.04, len, 0.42]} />
                <meshStandardMaterial color="#d97706" metalness={0.9} />
              </mesh>
              <mesh position={[0.08, 0, 0]}>
                <boxGeometry args={[0.02, len, 0.08]} />
                <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3.0} />
              </mesh>
            </group>
          );
        })}

        {/* Apex Geodesic Dome Reactor */}
        <group position={[0, 76, 0]} ref={heliosGeodesicRef}>
          <mesh>
            <sphereGeometry args={[3.2, 16, 16]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.35} transmission={0.9} roughness={0.05} />
          </mesh>
          <mesh>
            <sphereGeometry args={[3.25, 12, 12]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} wireframe />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.4, 8, 8]} />
            <meshStandardMaterial color="#06b6d4" emissive="#00f3ff" emissiveIntensity={4.0} />
          </mesh>
          <mesh rotation={[Math.PI / 4, 0, 0]}>
            <torusGeometry args={[2.2, 0.06, 4, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} />
          </mesh>
        </group>

        <pointLight position={[0, 76, 0]} color="#06b6d4" intensity={8.0} distance={100} decay={1.3} />
      </group>

    </group>
  );
}
