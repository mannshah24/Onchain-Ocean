import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ── Typed interfaces ─────────────────────────────────────────────
interface JellyfishData {
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  color: THREE.Color;
  glowColor: THREE.Color;
}

interface MantaData {
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
  wingPhase: number;
}

interface WhaleData {
  basePos: THREE.Vector3;
  phase: number;
  speed: number;
}

interface FishSchool {
  baseX: number;
  baseY: number;
  baseZ: number;
  phase: number;
  speed: number;
  district: number;
}

// ── Seeded RNG ───────────────────────────────────────────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function OceanLife() {
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // ── Instanced mesh refs ──────────────────────────────────────
  // Jellyfish: 3 layers — bell, inner core glow, tentacles
  const jellyBellRef    = useRef<THREE.InstancedMesh>(null);
  const jellyCoreRef    = useRef<THREE.InstancedMesh>(null);
  const fishRef         = useRef<THREE.InstancedMesh>(null);
  const mantaRef        = useRef<THREE.InstancedMesh>(null);
  const whaleRef        = useRef<THREE.InstancedMesh>(null);

  // ────────────────────────────────────────────────────────────
  // JELLYFISH — 20 large drifters, instanced bell + glow core
  // ────────────────────────────────────────────────────────────
  const jellyCount = 20;
  const jellyfishData = useMemo<JellyfishData[]>(() => {
    const rng = seededRng(4242);
    const palettes = [
      { color: new THREE.Color('#a5f3fc'), glow: new THREE.Color('#06b6d4') },
      { color: new THREE.Color('#e9d5ff'), glow: new THREE.Color('#8b5cf6') },
      { color: new THREE.Color('#fce7f3'), glow: new THREE.Color('#ec4899') },
      { color: new THREE.Color('#d1fae5'), glow: new THREE.Color('#10b981') },
    ];
    return Array.from({ length: jellyCount }, (_, i) => {
      const angle = rng() * Math.PI * 2;
      const r = 18 + rng() * 85;
      const pal = palettes[i % palettes.length];
      return {
        basePos: new THREE.Vector3(Math.cos(angle) * r, 8 + rng() * 28, Math.sin(angle) * r),
        phase:       rng() * Math.PI * 2,
        speed:       0.25 + rng() * 0.22,
        radius:      1.4 + rng() * 2.0,
        orbitRadius: 2 + rng() * 7,
        orbitSpeed:  0.04 + rng() * 0.09,
        orbitAngle:  rng() * Math.PI * 2,
        color:       pal.color,
        glowColor:   pal.glow,
      };
    });
  }, []);

  // ────────────────────────────────────────────────────────────
  // FISH SCHOOLS — 12 schools × 8 fish = 96 fish total
  // ────────────────────────────────────────────────────────────
  const fishSchoolCount = 12;
  const fishPerSchool   = 8;
  const totalFish       = fishSchoolCount * fishPerSchool;

  const fishSchools = useMemo<FishSchool[]>(() => {
    const rng = seededRng(1234);
    const anchors = [
      // Core Reef district (district 0 = cyan)
      { cx:   0,  cz: -80, district: 0 },
      { cx:  40,  cz: -88, district: 0 },
      { cx: -38,  cz: -85, district: 0 },
      { cx:   0,  cz:  38, district: 0 },
      // DeFi Trench (district 1 = purple)
      { cx: -88,  cz: -42, district: 1 },
      { cx: -108, cz:   0, district: 1 },
      { cx: -88,  cz:  42, district: 1 },
      // Social Shelf (district 2 = gold)
      { cx:  88,  cz:  42, district: 2 },
      { cx:  78,  cz:  78, district: 2 },
      { cx:  42,  cz:  90, district: 2 },
      // Mixed / mid-world
      { cx:  45,  cz: -38, district: 0 },
      { cx: -48,  cz:  55, district: 1 },
    ];
    return anchors.map((a) => ({
      baseX:    a.cx / 2,
      baseY:    5 + rng() * 18,
      baseZ:    a.cz / 2,
      phase:    rng() * Math.PI * 2,
      speed:    3.2 + rng() * 3.2,
      district: a.district,
    }));
  }, []);

  const fishColors = useMemo(() => [
    new THREE.Color('#22d3ee'), // core cyan
    new THREE.Color('#a855f7'), // defi purple
    new THREE.Color('#fbbf24'), // social gold
  ], []);

  // ────────────────────────────────────────────────────────────
  // MANTA RAYS — 4 large silhouettes gliding mid-water
  // ────────────────────────────────────────────────────────────
  const mantaCount = 4;
  const mantaData = useMemo<MantaData[]>(() => {
    const rng = seededRng(9876);
    return Array.from({ length: mantaCount }, () => ({
      basePos:   new THREE.Vector3((rng() - 0.5) * 160, 15 + rng() * 22, (rng() - 0.5) * 160),
      phase:     rng() * Math.PI * 2,
      speed:     4.0 + rng() * 2.5,
      wingPhase: rng() * Math.PI * 2,
    }));
  }, []);

  // ────────────────────────────────────────────────────────────
  // WHALES — 2 distant silhouettes deep in the fog
  // ────────────────────────────────────────────────────────────
  const whaleCount = 2;
  const whaleData = useMemo<WhaleData[]>(() => {
    const rng = seededRng(5555);
    return Array.from({ length: whaleCount }, () => ({
      basePos: new THREE.Vector3((rng() - 0.5) * 240, 20 + rng() * 28, (rng() - 0.5) * 240),
      phase:   rng() * Math.PI * 2,
      speed:   2.0 + rng() * 1.5,
    }));
  }, []);

  // ────────────────────────────────────────────────────────────
  // FRAME LOOP
  // ────────────────────────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // ── Jellyfish bell domes ──────────────────────────────────
    if (jellyBellRef.current && jellyCoreRef.current) {
      jellyfishData.forEach((jf, i) => {
        const bobY  = jf.basePos.y + Math.sin(t * jf.speed + jf.phase) * 2.0;
        const ox    = jf.basePos.x + Math.cos(t * jf.orbitSpeed + jf.orbitAngle) * jf.orbitRadius;
        const oz    = jf.basePos.z + Math.sin(t * jf.orbitSpeed + jf.orbitAngle) * jf.orbitRadius;

        // Bell dome (hemispherical — scaled)
        dummy.position.set(ox, bobY, oz);
        dummy.scale.set(jf.radius, jf.radius * 0.6, jf.radius);
        dummy.rotation.set(0, t * jf.orbitSpeed * 0.5, 0);
        dummy.updateMatrix();
        jellyBellRef.current!.setMatrixAt(i, dummy.matrix);
        jellyBellRef.current!.setColorAt(i, jf.color);

        // Glowing inner core
        const corePulse = 0.8 + Math.sin(t * jf.speed * 2 + jf.phase) * 0.2;
        dummy.position.set(ox, bobY - jf.radius * 0.18, oz);
        const cs = jf.radius * 0.32 * corePulse;
        dummy.scale.set(cs, cs, cs);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        jellyCoreRef.current!.setMatrixAt(i, dummy.matrix);
        jellyCoreRef.current!.setColorAt(i, jf.glowColor);
      });

      jellyBellRef.current.instanceMatrix.needsUpdate = true;
      if (jellyBellRef.current.instanceColor) jellyBellRef.current.instanceColor.needsUpdate = true;
      jellyCoreRef.current.instanceMatrix.needsUpdate = true;
      if (jellyCoreRef.current.instanceColor) jellyCoreRef.current.instanceColor.needsUpdate = true;
    }

    // ── Fish schools ──────────────────────────────────────────
    if (fishRef.current) {
      fishSchools.forEach((school, si) => {
        const circleAngle = t * school.speed * 0.06 + school.phase;
        const circleR = 10 + Math.sin(t * 0.08 + school.phase) * 4;
        const lx = school.baseX + Math.cos(circleAngle) * circleR;
        const lz = school.baseZ + Math.sin(circleAngle) * circleR;
        const ly = school.baseY + Math.sin(t * 0.3 + school.phase) * 2.2;

        for (let f = 0; f < fishPerSchool; f++) {
          const fp = (f / fishPerSchool) * Math.PI * 2;
          const sr = 1.4 + Math.sin(t * 0.6 + fp) * 0.5;
          dummy.position.set(
            lx + Math.cos(fp + t * 1.1) * sr,
            ly + Math.sin(fp + t * 0.9) * 0.7,
            lz + Math.sin(fp + t * 1.1) * sr
          );
          dummy.rotation.y = circleAngle + Math.PI / 2;
          dummy.scale.set(0.2, 0.09, 0.38);
          dummy.updateMatrix();
          const idx = si * fishPerSchool + f;
          fishRef.current!.setMatrixAt(idx, dummy.matrix);
          fishRef.current!.setColorAt(idx, fishColors[school.district]);
        }
      });
      fishRef.current.instanceMatrix.needsUpdate = true;
      if (fishRef.current.instanceColor) fishRef.current.instanceColor.needsUpdate = true;
    }

    // ── Manta rays ───────────────────────────────────────────
    if (mantaRef.current) {
      mantaData.forEach((manta, i) => {
        const arc = t * manta.speed * 0.018 + manta.phase;
        const arcR = 60 + Math.sin(t * 0.05 + manta.phase) * 20;
        dummy.position.set(
          manta.basePos.x + Math.cos(arc) * arcR,
          manta.basePos.y + Math.sin(t * 0.14 + manta.phase) * 2.8,
          manta.basePos.z + Math.sin(arc) * arcR
        );
        dummy.rotation.y = arc + Math.PI / 2;
        dummy.rotation.z = Math.sin(t * 0.75 + manta.wingPhase) * 0.22;
        dummy.scale.set(5.5, 0.38, 3.2);
        dummy.updateMatrix();
        mantaRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mantaRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Whale silhouettes ─────────────────────────────────────
    if (whaleRef.current) {
      whaleData.forEach((whale, i) => {
        const arc = t * whale.speed * 0.009 + whale.phase;
        const arcR = 95 + Math.sin(t * 0.04 + whale.phase) * 28;
        dummy.position.set(
          whale.basePos.x + Math.cos(arc) * arcR,
          whale.basePos.y + Math.sin(t * 0.07 + whale.phase) * 3.5,
          whale.basePos.z + Math.sin(arc) * arcR
        );
        dummy.rotation.y = arc + Math.PI / 2;
        dummy.scale.set(3.5, 2.0, 11);
        dummy.updateMatrix();
        whaleRef.current!.setMatrixAt(i, dummy.matrix);
      });
      whaleRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* ════════════════════════════════════════════════════════
          JELLYFISH — glass bell domes (hemisphere, district colors)
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={jellyBellRef} args={[null as any, null as any, jellyCount]}>
        <sphereGeometry args={[1, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.28}
          roughness={0.04}
          transmission={0.75}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Jellyfish inner glow cores */}
      <instancedMesh ref={jellyCoreRef} args={[null as any, null as any, jellyCount]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          FISH SCHOOLS — ellipsoid bodies, district-colored
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={fishRef} args={[null as any, null as any, totalFish]}>
        <sphereGeometry args={[1, 6, 4]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#88ccff"
          emissiveIntensity={0.4}
          metalness={0.55}
          roughness={0.35}
        />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          MANTA RAYS — flat box silhouettes, dark blue
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={mantaRef} args={[null as any, null as any, mantaCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#0a1e30"
          transparent
          opacity={0.65}
          roughness={0.92}
          metalness={0.1}
        />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          WHALE SILHOUETTES — elongated sphere, deep fog
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={whaleRef} args={[null as any, null as any, whaleCount]}>
        <sphereGeometry args={[1, 8, 5]} />
        <meshStandardMaterial
          color="#060e1e"
          transparent
          opacity={0.48}
          roughness={0.96}
        />
      </instancedMesh>
    </group>
  );
}
