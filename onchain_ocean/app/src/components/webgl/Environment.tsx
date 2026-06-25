import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';

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

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function Environment() {
  const bubblesMeshRef = useRef<THREE.InstancedMesh>(null);
  const planktonRef = useRef<THREE.InstancedMesh>(null);
  const godRay1Ref = useRef<THREE.Mesh>(null);
  const godRay2Ref = useRef<THREE.Mesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const theme = useOceanStore((state) => state.theme);
  const layout = useOceanStore((state) => state.layout);
  const zones = layout.zones;

  // 1. Rising Ambient Bubbles
  const bubbleCount = 80;
  const bubbles = useMemo<RisingParticle[]>(() => {
    const rng = seededRng(42);
    return Array.from({ length: bubbleCount }, () => ({
      position: new THREE.Vector3(
        (rng() - 0.5) * 150,
        rng() * 45,
        (rng() - 0.5) * 150
      ),
      speed: 1.0 + rng() * 2.0,
      scale: 0.05 + rng() * 0.12,
      maxY: 35 + rng() * 15,
      drift: (rng() - 0.5) * 0.3,
    }));
  }, []);

  // 2. Floating Plankton (reads like faint fireflies/stars)
  const planktonCount = 150;
  const plankton = useMemo<PlanktonDrift[]>(() => {
    const rng = seededRng(9001);
    return Array.from({ length: planktonCount }, () => ({
      position: new THREE.Vector3(
        (rng() - 0.5) * 160,
        2 + rng() * 40,
        (rng() - 0.5) * 160
      ),
      phase: rng() * Math.PI * 2,
      speed: 0.03 + rng() * 0.06,
    }));
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    // Update Bubbles
    if (bubblesMeshRef.current) {
      bubbles.forEach((b, i) => {
        b.position.y += b.speed * dt;
        b.position.x += Math.sin(t * 0.5 + i * 0.3) * 0.015 + b.drift * dt;
        if (b.position.y >= b.maxY) {
          b.position.y = 0.2;
          b.position.x = (Math.random() - 0.5) * 150;
          b.position.z = (Math.random() - 0.5) * 150;
        }
        dummy.position.copy(b.position);
        dummy.scale.set(b.scale, b.scale, b.scale);
        dummy.updateMatrix();
        bubblesMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bubblesMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update Plankton
    if (planktonRef.current) {
      plankton.forEach((p, i) => {
        const drift = Math.sin(t * p.speed + p.phase);
        dummy.position.set(
          p.position.x + drift * 0.4,
          p.position.y + Math.sin(t * p.speed * 0.7 + p.phase + 1) * 0.2,
          p.position.z + Math.cos(t * p.speed + p.phase) * 0.3
        );
        const s = 0.03 + Math.abs(drift) * 0.02;
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        planktonRef.current!.setMatrixAt(i, dummy.matrix);
      });
      planktonRef.current.instanceMatrix.needsUpdate = true;
    }

    // Volumetric God Rays Pulse
    if (godRay1Ref.current) {
      (godRay1Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.015 + Math.sin(t * 0.5) * 0.008;
    }
    if (godRay2Ref.current) {
      (godRay2Ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.012 + Math.sin(t * 0.4 + 1.2) * 0.006;
    }
  });

  return (
    <group>
      {/* Dynamic Colored Fog from active theme */}
      <fog attach="fog" args={[theme.fogColor, 40, 220]} />

      {/* Ambient Lights mapped from theme */}
      <ambientLight intensity={1.5} color={theme.accent} />
      <ambientLight intensity={0.5} color={theme.shadow} />

      {/* Main Directional Light */}
      <directionalLight
        position={[40, 100, 30]}
        intensity={2.8}
        color={theme.accent}
      />

      {/* Secondary fill light */}
      <directionalLight
        position={[-40, 60, -30]}
        intensity={1.2}
        color={theme.shadow}
      />

      {/* Dynamic Zone Glow Lights */}
      {zones.slice(0, 8).map((z) => {
        const tx = z.center[0] * 0.06;
        const tz = z.center[2] * 0.06;
        return (
          <pointLight
            key={`zone-light-${z.id}`}
            position={[tx, 8, tz]}
            color={z.color}
            intensity={2.5}
            distance={45}
            decay={1.5}
          />
        );
      })}

      {/* Volumetric Light God Ray Shafts */}
      {zones.slice(0, 2).map((z, idx) => {
        const tx = z.center[0] * 0.06;
        const tz = z.center[2] * 0.06;
        const ref = idx === 0 ? godRay1Ref : godRay2Ref;
        return (
          <mesh
            key={`godray-${z.id}`}
            ref={ref}
            position={[tx, 35, tz]}
            rotation={[0.1, idx * 0.15, -0.06]}
          >
            <coneGeometry args={[10, 80, 8, 1, true]} />
            <meshBasicMaterial
              color={theme.accent}
              transparent
              opacity={0.015}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {/* Instanced Bubbles */}
      <instancedMesh ref={bubblesMeshRef} args={[null as any, null as any, bubbleCount]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.25} depthWrite={false} />
      </instancedMesh>

      {/* Instanced Plankton (reads as stars/fireflies) */}
      <instancedMesh ref={planktonRef} args={[null as any, null as any, planktonCount]}>
        <sphereGeometry args={[1, 3, 3]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.4} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
