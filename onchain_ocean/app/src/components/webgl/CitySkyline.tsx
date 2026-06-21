import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Seeded random helper
function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

export default function CitySkyline() {
  const columnsRef = useRef<THREE.InstancedMesh>(null);
  const chimneysRef = useRef<THREE.InstancedMesh>(null);
  const bubbleDomesRef = useRef<THREE.InstancedMesh>(null);
  const ventParticlesRef = useRef<THREE.InstancedMesh>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 1. Generate Basalt Columns (Reef ridges in the background)
  // We place hexagonal basalt columns in arcs around the background.
  const columns = useMemo(() => {
    const result: { pos: [number, number, number]; scale: [number, number, number]; color: string; emissive: string }[] = [];
    const rng = seededRand(12345);

    // Three arcs for the background ridge
    const zones = [
      { centerAngle: -Math.PI / 2, color: '#0a233a', emissive: '#06b6d4', radius: 140, count: 65 }, // Core Reef
      { centerAngle: -Math.PI, color: '#1a0c2e', emissive: '#a855f7', radius: 130, count: 55 },     // DeFi Trench
      { centerAngle: Math.PI / 4, color: '#2a1108', emissive: '#fbbf24', radius: 135, count: 55 },    // Social Shelf
    ];

    zones.forEach((z) => {
      for (let i = 0; i < z.count; i++) {
        const angle = z.centerAngle + (rng() - 0.5) * 1.5;
        const rad = z.radius + (rng() - 0.5) * 30;
        const x = Math.cos(angle) * rad;
        const zPos = Math.sin(angle) * rad;

        const width = 6 + rng() * 8;
        const height = 15 + rng() * 45;
        const depth = 6 + rng() * 8;

        result.push({
          pos: [x, height / 2, zPos],
          scale: [width, height, depth],
          color: z.color,
          emissive: z.emissive,
        });
      }
    });

    return result;
  }, []);

  // 2. Giant Hydrothermal Vents (Landmarks replacement)
  const vents = useMemo(() => {
    return [
      { pos: [-75, 0, -85] as [number, number, number], height: 85, color: '#a855f7', intensity: 8 }, // Aether Vent
      { pos: [85, 0, 75] as [number, number, number], height: 75, color: '#06b6d4', intensity: 8 },   // Helios Vent
      { pos: [0, 0, -105] as [number, number, number], height: 60, color: '#fbbf24', intensity: 6 },  // Core Vent
    ];
  }, []);

  // 3. Giant Energy Bubble Domes (replacing biodomes)
  const bubbleDomes = useMemo(() => {
    return [
      { pos: [0, 5, -135] as [number, number, number], r: 20, color: '#22d3ee' },
      { pos: [-132, 8, -52] as [number, number, number], r: 18, color: '#a855f7' },
      { pos: [48, 6, 128] as [number, number, number], r: 19, color: '#fbbf24' },
    ];
  }, []);

  // 4. Vent Smoke Particles (slowly floating up from vents)
  const smokeCount = 90;
  const smokeParticles = useMemo(() => {
    const result: { pos: THREE.Vector3; speed: number; scale: number; ventIdx: number; phase: number }[] = [];
    const rng = seededRand(999);
    for (let i = 0; i < smokeCount; i++) {
      const ventIdx = i % vents.length;
      const vent = vents[ventIdx];
      const radius = 2 + rng() * 4;
      const angle = rng() * Math.PI * 2;
      result.push({
        pos: new THREE.Vector3(
          vent.pos[0] + Math.cos(angle) * radius,
          vent.height * 0.8 + rng() * 40,
          vent.pos[2] + Math.sin(angle) * radius
        ),
        speed: 2.5 + rng() * 3.5,
        scale: 1.0 + rng() * 2.0,
        ventIdx,
        phase: rng() * Math.PI * 2,
      });
    }
    return result;
  }, [vents]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    // A. Update Basalt Columns
    if (columnsRef.current) {
      columns.forEach((c, i) => {
        dummy.position.set(c.pos[0], c.pos[1], c.pos[2]);
        dummy.scale.set(c.scale[0], c.scale[1], c.scale[2]);
        dummy.rotation.set(0, (i * 0.17) % Math.PI, 0);
        dummy.updateMatrix();
        columnsRef.current!.setMatrixAt(i, dummy.matrix);
        columnsRef.current!.setColorAt(i, new THREE.Color(c.color));
      });
      columnsRef.current.instanceMatrix.needsUpdate = true;
      if (columnsRef.current.instanceColor) columnsRef.current.instanceColor.needsUpdate = true;
    }

    // B. Update Hydrothermal Chimneys (tall, thin basalt pillars)
    if (chimneysRef.current) {
      vents.forEach((v, i) => {
        dummy.position.set(v.pos[0], v.height / 2, v.pos[2]);
        dummy.scale.set(3.5, v.height, 3.5);
        dummy.rotation.set(0, t * 0.05 + i, 0);
        dummy.updateMatrix();
        chimneysRef.current!.setMatrixAt(i, dummy.matrix);
      });
      chimneysRef.current.instanceMatrix.needsUpdate = true;
    }

    // C. Update Bubble Domes (gently pulsating scale)
    if (bubbleDomesRef.current) {
      bubbleDomes.forEach((bd, i) => {
        const pulse = bd.r * (1.0 + Math.sin(t * 0.8 + i) * 0.03);
        dummy.position.set(bd.pos[0], bd.pos[1], bd.pos[2]);
        dummy.scale.set(pulse, pulse, pulse);
        dummy.rotation.set(0, t * 0.02 + i, 0);
        dummy.updateMatrix();
        bubbleDomesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bubbleDomesRef.current.instanceMatrix.needsUpdate = true;
    }

    // D. Update Vent smoke particles
    if (ventParticlesRef.current) {
      smokeParticles.forEach((p, i) => {
        const vent = vents[p.ventIdx];
        p.pos.y += p.speed * dt;
        p.pos.x += Math.sin(t * 1.2 + i) * 0.08;
        p.pos.z += Math.cos(t * 0.9 + i) * 0.08;

        if (p.pos.y > vent.height + 60) {
          p.pos.y = vent.height * 0.8 + Math.random() * 5;
          p.pos.x = vent.pos[0] + (Math.random() - 0.5) * 5;
          p.pos.z = vent.pos[2] + (Math.random() - 0.5) * 5;
        }

        dummy.position.copy(p.pos);
        const relativeHeight = (p.pos.y - vent.height * 0.8) / 60;
        const currentScale = p.scale * (1.0 - relativeHeight) * 0.8;
        dummy.scale.set(currentScale, currentScale, currentScale);
        dummy.updateMatrix();
        ventParticlesRef.current!.setMatrixAt(i, dummy.matrix);
      });
      ventParticlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. Basalt Hex Columns */}
      <instancedMesh ref={columnsRef} args={[null as any, null as any, columns.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.58, 1, 6]} />
        <meshStandardMaterial roughness={0.88} metalness={0.2} />
      </instancedMesh>

      {/* 2. Hydrothermal Vent Chimneys */}
      <instancedMesh ref={chimneysRef} args={[null as any, null as any, vents.length]} castShadow>
        <cylinderGeometry args={[0.3, 1, 1, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.4} />
      </instancedMesh>

      {/* 3. Volumetric Vent Glow Rings */}
      {vents.map((v, i) => (
        <group key={`vent-group-${i}`} position={v.pos}>
          {/* Top glowing furnace element */}
          <mesh position={[0, v.height, 0]}>
            <sphereGeometry args={[1.8, 8, 8]} />
            <meshBasicMaterial color={v.color} />
          </mesh>
          {/* Pulsating energy rings surrounding the chimney apex */}
          {[0, 1, 2].map((rIdx) => {
            const yOffset = v.height - 4 - rIdx * 5;
            const rSize = 2.2 + rIdx * 0.8;
            return (
              <mesh key={`ring-${rIdx}`} position={[0, yOffset, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[rSize, 0.2, 8, 24]} />
                <meshStandardMaterial color={v.color} emissive={v.color} emissiveIntensity={3} />
              </mesh>
            );
          })}
          {/* Vent lighting */}
          <pointLight position={[0, v.height + 4, 0]} color={v.color} intensity={v.intensity} distance={120} decay={1.4} />
        </group>
      ))}

      {/* 4. Giant energy bubble domes */}
      <instancedMesh ref={bubbleDomesRef} args={[null as any, null as any, bubbleDomes.length]}>
        <sphereGeometry args={[1.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.15}
          transmission={0.92}
          roughness={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </instancedMesh>

      {/* 5. Energy dome accent rings & light */}
      {bubbleDomes.map((bd, i) => (
        <group key={`bd-light-${i}`} position={bd.pos}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[bd.r + 0.5, 0.2, 6, 32]} />
            <meshStandardMaterial color={bd.color} emissive={bd.color} emissiveIntensity={2.5} />
          </mesh>
          <pointLight position={[0, bd.r * 0.4, 0]} color={bd.color} intensity={3.5} distance={100} decay={1.5} />
        </group>
      ))}

      {/* 6. Smoke bubble/particle streams rising from vents */}
      <instancedMesh ref={ventParticlesRef} args={[null as any, null as any, smokeCount]}>
        <sphereGeometry args={[1, 5, 5]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
