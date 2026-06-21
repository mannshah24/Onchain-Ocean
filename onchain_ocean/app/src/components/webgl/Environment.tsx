import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';
import type { OceanZone } from '../../types';

// ── Typed interfaces ────────────────────────────────────────────
interface RisingParticle {
  position: THREE.Vector3;
  speed: number;
  scale: number;
  maxY: number;
  drift: number;
}

interface PlanktonDrift {
  position: THREE.Vector3;
  phase: number;
  speed: number;
}

// ── Seeded RNG for deterministic particle layout ───────────────
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function Environment() {
  // ── Refs ─────────────────────────────────────────────────────
  const bubblesMeshRef   = useRef<THREE.InstancedMesh>(null);
  const kelpMeshRef      = useRef<THREE.InstancedMesh>(null);
  const coralMeshRef     = useRef<THREE.InstancedMesh>(null);
  const planktonRef      = useRef<THREE.InstancedMesh>(null);
  const microBubbleRef   = useRef<THREE.InstancedMesh>(null);
  const bioGlowRef       = useRef<THREE.InstancedMesh>(null);

  // District caustic light refs
  const caustic1Ref      = useRef<THREE.PointLight>(null);
  const caustic2Ref      = useRef<THREE.PointLight>(null);
  const caustic3Ref      = useRef<THREE.PointLight>(null);
  // God ray column refs
  const godRay1Ref       = useRef<THREE.Mesh>(null);
  const godRay2Ref       = useRef<THREE.Mesh>(null);
  const godRay3Ref       = useRef<THREE.Mesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const layout = useOceanStore((state) => state.layout);

  // ──────────────────────────────────────────────────────────────
  // 1. MAIN RISING BUBBLES (increased to 150 for density)
  // ──────────────────────────────────────────────────────────────
  const bubbleCount = 150;
  const bubbles = useMemo<RisingParticle[]>(() => {
    const rng = seededRng(42);
    return Array.from({ length: bubbleCount }, () => ({
      position: new THREE.Vector3(
        (rng() - 0.5) * 180,
        rng() * 55,
        (rng() - 0.5) * 180
      ),
      speed: 1.2 + rng() * 2.8,
      scale: 0.06 + rng() * 0.18,
      maxY: 48 + rng() * 18,
      drift: (rng() - 0.5) * 0.4,
    }));
  }, []);

  const zones = layout.zones;

  // ─── Resolve anchors from dynamic zones ───
  const anchors = useMemo(() => {
    const list: [number, number][] = [[0, 0]];
    zones.forEach((z: OceanZone) => {
      list.push([z.center[0] * 0.06, z.center[2] * 0.06]);
    });
    while (list.length < 6) {
      list.push([(Math.random() - 0.5) * 50, (Math.random() - 0.5) * 50]);
    }
    return list;
  }, [zones]);

  // ──────────────────────────────────────────────────────────────
  // 2. MICRO BUBBLE STREAMS near dynamic layout zone centers
  // ──────────────────────────────────────────────────────────────
  const microBubbleCount = 200;
  const microBubbles = useMemo<RisingParticle[]>(() => {
    const rng = seededRng(137);
    return Array.from({ length: microBubbleCount }, (_, i) => {
      const anchor = anchors[i % anchors.length];
      return {
        position: new THREE.Vector3(
          anchor[0] + (rng() - 0.5) * 8,
          rng() * 25,
          anchor[1] + (rng() - 0.5) * 8
        ),
        speed: 0.8 + rng() * 1.8,
        scale: 0.02 + rng() * 0.06,
        maxY: 20 + rng() * 20,
        drift: (rng() - 0.5) * 0.15,
      };
    });
  }, [anchors]);

  // ──────────────────────────────────────────────────────────────
  // 3. KELP FOREST (increased, with more variety)
  // ──────────────────────────────────────────────────────────────
  const kelpCount = 80;
  const kelpStalks = useMemo(() => {
    const rng = seededRng(777);
    return Array.from({ length: kelpCount }, () => {
      const angle  = rng() * Math.PI * 2;
      const radius = 28 + rng() * 90;
      const height = 9 + rng() * 14;
      return {
        position: new THREE.Vector3(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius),
        scale: new THREE.Vector3(0.16 + rng() * 0.18, height, 0.16 + rng() * 0.18),
        swayOffset: rng() * Math.PI * 2,
      };
    });
  }, []);

  // ──────────────────────────────────────────────────────────────
  // 4. BIOLUMINESCENT CORAL CLUSTERS (denser, district-colored)
  // ──────────────────────────────────────────────────────────────
  const coralCount = 80;
  const corals = useMemo(() => {
    const rng = seededRng(321);
    return Array.from({ length: coralCount }, () => {
      const angle  = rng() * Math.PI * 2;
      const radius = 12 + rng() * 95;
      const cx     = Math.cos(angle) * radius;
      const cz     = Math.sin(angle) * radius;
      // District color mapping based on position
      let emissive = '#8b5cf6';
      if (cx < -20) emissive = '#ec4899';
      else if (cx > 20) emissive = '#14b8a6';
      return {
        position: new THREE.Vector3(cx, 0.15, cz),
        scale: [0.5 + rng() * 1.0, 0.5 + rng() * 1.0, 0.5 + rng() * 1.0] as [number, number, number],
        emissive,
        phase: rng() * Math.PI * 2,
      };
    });
  }, []);

  // ──────────────────────────────────────────────────────────────
  // 5. FLOATING PLANKTON (dense ambient field)
  // ──────────────────────────────────────────────────────────────
  const planktonCount = 300;
  const plankton = useMemo<PlanktonDrift[]>(() => {
    const rng = seededRng(9001);
    return Array.from({ length: planktonCount }, () => ({
      position: new THREE.Vector3(
        (rng() - 0.5) * 220,
        2 + rng() * 48,
        (rng() - 0.5) * 220
      ),
      phase: rng() * Math.PI * 2,
      speed: 0.04 + rng() * 0.08,
    }));
  }, []);

  // ──────────────────────────────────────────────────────────────
  // 6. BIOLUMINESCENT LANDMARK GLOW ORBS (floating near zone centers)
  // ──────────────────────────────────────────────────────────────
  const bioGlowCount = 60;
  const bioGlows = useMemo(() => {
    const rng = seededRng(1337);
    const glowAnchors = zones.map((z: OceanZone) => ({
      cx: z.center[0] * 0.06,
      cy: 12 + rng() * 15,
      cz: z.center[2] * 0.06,
      color: z.color,
    }));
    if (glowAnchors.length === 0) {
      glowAnchors.push({ cx: 0, cy: 15, cz: 0, color: '#22d3ee' });
    }
    return Array.from({ length: bioGlowCount }, (_, i) => {
      const anchor = glowAnchors[i % glowAnchors.length];
      return {
        position: new THREE.Vector3(
          anchor.cx + (rng() - 0.5) * 12,
          anchor.cy + (rng() - 0.5) * 14,
          anchor.cz + (rng() - 0.5) * 12
        ),
        phase: rng() * Math.PI * 2,
        scale: 0.08 + rng() * 0.18,
        color: anchor.color,
      };
    });
  }, [zones]);

  // ──────────────────────────────────────────────────────────────
  // FRAME LOOP
  // ──────────────────────────────────────────────────────────────
  useFrame((state, delta) => {
    const t  = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    // ── Bubbles ───────────────────────────────────────────────
    if (bubblesMeshRef.current) {
      bubbles.forEach((b, i) => {
        b.position.y += b.speed * dt;
        b.position.x += Math.sin(t * 0.5 + i * 0.3) * 0.018 + b.drift * dt;
        if (b.position.y >= b.maxY) {
          b.position.y = 0.4;
          b.position.x = (Math.random() - 0.5) * 180;
          b.position.z = (Math.random() - 0.5) * 180;
        }
        dummy.position.copy(b.position);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        bubblesMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bubblesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Micro bubbles ────────────────────────────────────────
    if (microBubbleRef.current) {
      microBubbles.forEach((b, i) => {
        b.position.y += b.speed * dt;
        b.position.x += b.drift * dt;
        if (b.position.y >= b.maxY) {
          b.position.y = 0.2;
        }
        dummy.position.copy(b.position);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        microBubbleRef.current!.setMatrixAt(i, dummy.matrix);
      });
      microBubbleRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Kelp sway ────────────────────────────────────────────
    if (kelpMeshRef.current) {
      kelpStalks.forEach((k, i) => {
        const sway = Math.sin(t * 0.55 + k.swayOffset) * 0.055;
        dummy.position.copy(k.position);
        dummy.position.x += sway * k.scale.y;
        dummy.scale.copy(k.scale);
        dummy.rotation.set(sway, t * 0.015 + i * 0.1, sway * 0.5);
        dummy.updateMatrix();
        kelpMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      kelpMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Coral pulse ───────────────────────────────────────────
    if (coralMeshRef.current) {
      corals.forEach((c, i) => {
        const pulse = 1.0 + Math.sin(t * 1.4 + c.phase) * 0.06;
        dummy.position.copy(c.position);
        dummy.scale.set(c.scale[0] * pulse, c.scale[1] * pulse, c.scale[2] * pulse);
        dummy.rotation.set(0, c.phase, 0);
        dummy.updateMatrix();
        coralMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      coralMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Plankton drift ────────────────────────────────────────
    if (planktonRef.current) {
      plankton.forEach((p, i) => {
        const drift = Math.sin(t * p.speed + p.phase);
        dummy.position.set(
          p.position.x + drift * 0.5,
          p.position.y + Math.sin(t * p.speed * 0.7 + p.phase + 1) * 0.3,
          p.position.z + Math.cos(t * p.speed + p.phase) * 0.4
        );
        const s = 0.04 + Math.abs(drift) * 0.03;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        planktonRef.current!.setMatrixAt(i, dummy.matrix);
      });
      planktonRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Bioluminescent Landmark glow orbs ────────────────────
    if (bioGlowRef.current) {
      bioGlows.forEach((g, i) => {
        const float = Math.sin(t * 0.6 + g.phase) * 1.2;
        dummy.position.set(g.position.x, g.position.y + float, g.position.z);
        const s = g.scale * (0.85 + Math.sin(t * 1.2 + g.phase) * 0.2);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        bioGlowRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bioGlowRef.current.instanceMatrix.needsUpdate = true;
    }

    // ── Caustic moving lights ─────────────────────────────────
    if (caustic1Ref.current) {
      caustic1Ref.current.position.x = Math.sin(t * 0.38) * 40;
      caustic1Ref.current.position.z = Math.cos(t * 0.24) * 40;
      caustic1Ref.current.intensity  = 3.8 + Math.sin(t * 1.1) * 0.8;
    }
    if (caustic2Ref.current) {
      caustic2Ref.current.position.x = Math.cos(t * 0.29) * 45 - 40;
      caustic2Ref.current.position.z = Math.sin(t * 0.44) * 45 - 55;
      caustic2Ref.current.intensity  = 4.2 + Math.sin(t * 0.9 + 1) * 0.9;
    }
    if (caustic3Ref.current) {
      caustic3Ref.current.position.x = Math.sin(t * 0.35) * 38 + 85;
      caustic3Ref.current.position.z = Math.cos(t * 0.52) * 38 + 65;
      caustic3Ref.current.intensity  = 3.5 + Math.sin(t * 1.3 + 2) * 0.7;
    }

    // ── God ray shaft pulse ───────────────────────────────────
    if (godRay1Ref.current) {
      (godRay1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.025 + Math.sin(t * 0.6) * 0.012;
    }
    if (godRay2Ref.current) {
      (godRay2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.02 + Math.sin(t * 0.5 + 1) * 0.01;
    }
    if (godRay3Ref.current) {
      (godRay3Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.018 + Math.sin(t * 0.7 + 2) * 0.009;
    }
  });

  return (
    <group>
      {/* ════════════════════════════════════════════════════════
          MULTI-LAYER UNDERWATER FOG
          ════════════════════════════════════════════════════════ */}
      <fog attach="fog" args={['#041029', 35, 190]} />

      {/* ════════════════════════════════════════════════════════
          LIGHTING SYSTEM
          ════════════════════════════════════════════════════════ */}
      <ambientLight intensity={2.8} color="#0e3870" />
      <ambientLight intensity={0.9} color="#1a1040" />

      {/* PRIMARY SUNLIGHT */}
      <directionalLight
        position={[50, 100, 30]}
        intensity={4.5}
        color="#b8f0ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={300}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      
      {/* Secondary fill light */}
      <directionalLight
        position={[-30, 60, -50]}
        intensity={1.8}
        color="#7c3aed"
      />

      {/* DYNAMIC DISTRICT LIGHTS */}
      {zones.map((z: OceanZone) => {
        const tx = z.center[0] * 0.06;
        const tz = z.center[2] * 0.06;
        return (
          <pointLight
            key={`zone-light-${z.id}`}
            position={[tx, 8, tz]}
            color={z.color}
            intensity={6.0}
            distance={85}
            decay={1.4}
          />
        );
      })}

      {/* Center boost light */}
      <pointLight position={[0, 5, 0]} color="#06b6d4" intensity={4.0} distance={40} decay={1.6} />

      {/* ANIMATED CAUSTIC SHIMMER LIGHTS */}
      <pointLight ref={caustic1Ref} position={[0, 25, 0]}     color="#06b6d4" intensity={3.8} distance={80} decay={1.4} />
      <pointLight ref={caustic2Ref} position={[-40, 22, -55]} color="#8b5cf6" intensity={4.2} distance={75} decay={1.4} />
      <pointLight ref={caustic3Ref} position={[85, 20, 65]}   color="#d97706" intensity={3.5} distance={70} decay={1.5} />

      {/* ════════════════════════════════════════════════════════
          GOD RAYS — volumetric light shaft cones from surface
          ════════════════════════════════════════════════════════ */}
      {zones.slice(0, 3).map((z: OceanZone, idx: number) => {
        const tx = z.center[0] * 0.06;
        const tz = z.center[2] * 0.06;
        const ref = idx === 0 ? godRay1Ref : idx === 1 ? godRay2Ref : godRay3Ref;
        return (
          <mesh
            key={`godray-${z.id}`}
            ref={ref}
            position={[tx, 35, tz]}
            rotation={[0.12 - idx * 0.03, idx * 0.1, -0.08 + idx * 0.04]}
          >
            <coneGeometry args={[12 + idx * 2, 70, 10, 1, true]} />
            <meshBasicMaterial
              color={z.color}
              transparent
              opacity={0.022}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* ════════════════════════════════════════════════════════
          SEABED
          ════════════════════════════════════════════════════════ */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onClick={(e) => { e.stopPropagation(); resetSearch(); }}
      >
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial
          color="#091a30"
          roughness={0.88}
          metalness={0.18}
        />
      </mesh>

      {/* ════════════════════════════════════════════════════════
          INSTANCED MAIN BUBBLES
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={bubblesMeshRef} args={[null as any, null as any, bubbleCount]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.32} depthWrite={false} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          MICRO BUBBLE STREAMS (near structures)
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={microBubbleRef} args={[null as any, null as any, microBubbleCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.45} depthWrite={false} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          KELP FOREST
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={kelpMeshRef} args={[null as any, null as any, kelpCount]} castShadow>
        <cylinderGeometry args={[0.18, 0.38, 1.0, 5]} />
        <meshStandardMaterial color="#052e24" roughness={0.9} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          BIOLUMINESCENT CORAL (district-tinted)
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={coralMeshRef} args={[null as any, null as any, coralCount]} castShadow>
        <dodecahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial
          color="#1e293b"
          emissive="#8b5cf6"
          emissiveIntensity={1.6}
          roughness={0.7}
        />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          FLOATING PLANKTON FIELD
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={planktonRef} args={[null as any, null as any, planktonCount]}>
        <sphereGeometry args={[1, 3, 3]} />
        <meshBasicMaterial color="#34d399" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          BIOLUMINESCENT LANDMARK GLOW CLOUDS
          ════════════════════════════════════════════════════════ */}
      <instancedMesh ref={bioGlowRef} args={[null as any, null as any, bioGlowCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#a78bfa" transparent opacity={0.55} depthWrite={false} />
      </instancedMesh>

      {/* ════════════════════════════════════════════════════════
          DECORATIVE SEABED ROCK FORMATIONS
          ════════════════════════════════════════════════════════ */}
      {[
        { p: [-45, 0, -30], s: [4, 2.5, 3.5] as [number,number,number] },
        { p: [35, 0, -55],  s: [3, 2, 2.5] as [number,number,number] },
        { p: [60, 0, 35],   s: [5, 3, 4] as [number,number,number] },
        { p: [-30, 0, 55],  s: [3.5, 2, 3] as [number,number,number] },
        { p: [20, 0, -25],  s: [2.5, 1.5, 2] as [number,number,number] },
        { p: [-65, 0, 20],  s: [4, 2.2, 3.5] as [number,number,number] },
      ].map((r, i) => (
        <mesh key={`rock-${i}`} position={r.p as any} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#0c1f38"
            roughness={0.95}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
