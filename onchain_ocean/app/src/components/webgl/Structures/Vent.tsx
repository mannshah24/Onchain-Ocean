import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface VentProps {
  profile: BuilderProfile;
}

interface VentParticle {
  position: THREE.Vector3;
  speed: number;
  scale: number;
  maxY: number;
}

export default function Vent({ profile }: VentProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const particleMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const isSelected = selectedAddress === profile.address;
  const isGenesis = profile.address === '11111111111111111111111111111111';

  // Genesis Citadel Refs
  const crystalRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  // Initialize rising light particles
  const particlesCount = isGenesis ? 40 : 20;
  const particles = useMemo<VentParticle[]>(() => {
    const arr: VentParticle[] = [];
    for (let i = 0; i < particlesCount; i++) {
      if (isGenesis) {
        arr.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            4.5 + Math.random() * 25.0,
            (Math.random() - 0.5) * 1.2
          ),
          speed: 3.5 + Math.random() * 4.0,
          scale: 0.12 + Math.random() * 0.22,
          maxY: 35.0 + Math.random() * 10.0,
        });
      } else {
        arr.push({
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 0.7,
            3.2 + Math.random() * 8.0,
            (Math.random() - 0.5) * 0.7
          ),
          speed: 2.2 + Math.random() * 3.0,
          scale: 0.08 + Math.random() * 0.14,
          maxY: 14.0 + Math.random() * 4.0,
        });
      }
    }
    return arr;
  }, [isGenesis, particlesCount]);

  // Frame loops: update rising particles & animate base glow
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.1);

    if (particleMeshRef.current) {
      particles.forEach((p, i) => {
        // Move particle upward
        p.position.y += p.speed * dt;
        
        // Add minor swaying in current
        p.position.x += Math.sin(t * 1.5 + i) * 0.015;
        p.position.z += Math.cos(t * 1.3 + i) * 0.015;

        // Reset if reached max height
        if (p.position.y >= p.maxY) {
          p.position.y = isGenesis ? 4.5 : 3.2;
          p.position.x = (Math.random() - 0.5) * (isGenesis ? 1.0 : 0.6);
          p.position.z = (Math.random() - 0.5) * (isGenesis ? 1.0 : 0.6);
        }

        // Apply matrix transforms to instanced mesh
        dummy.position.copy(p.position);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.rotation.set(t * 0.5, t * 0.2, 0);
        dummy.updateMatrix();
        particleMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      particleMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (isGenesis) {
      if (crystalRef.current) {
        crystalRef.current.rotation.y = t * 0.5;
        crystalRef.current.rotation.z = Math.sin(t * 0.5) * 0.2;
      }
      if (ring1Ref.current) {
        ring1Ref.current.rotation.y = t * 0.3;
        ring1Ref.current.rotation.x = t * 0.1;
      }
      if (ring2Ref.current) {
        ring2Ref.current.rotation.y = -t * 0.45;
        ring2Ref.current.rotation.z = t * 0.15;
      }
    }
  });

  return (
    <group
      position={[x / 3, 0, z / 3]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedAddress(profile.address);
      }}
    >
      {isGenesis ? (
        /* --- Genesis Citadel Geometry --- */
        <group>
          {/* Concentric platforms */}
          {/* Base platform (Tier 1) */}
          <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[6.8, 7.2, 0.6, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.15} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <torusGeometry args={[6.8, 0.08, 8, 48]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Platform tier 2 */}
          <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[5.0, 5.4, 0.8, 24]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.1} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <torusGeometry args={[5.0, 0.07, 8, 36]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Platform tier 3 */}
          <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.4, 3.8, 1.0, 16]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
          </mesh>
          <mesh position={[0, 2.4, 0]}>
            <torusGeometry args={[3.4, 0.06, 8, 30]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Platform tier 4 */}
          <mesh position={[0, 3.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.0, 2.3, 1.2, 12]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.22} metalness={0.1} />
          </mesh>
          <mesh position={[0, 3.6, 0]}>
            <torusGeometry args={[2.0, 0.05, 8, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Supportive columns on platform 1 */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2;
            const cx = Math.cos(angle) * 5.8;
            const cz = Math.sin(angle) * 5.8;
            return (
              <mesh key={`citadel-col-${i}`} position={[cx, 0.9, cz]} castShadow>
                <cylinderGeometry args={[0.12, 0.12, 1.2, 6]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
              </mesh>
            );
          })}

          {/* Bioluminescent runic slits on platform 3 */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
            const sx = Math.cos(angle) * 3.42;
            const sz = Math.sin(angle) * 3.42;
            return (
              <mesh key={`runic-slit-${i}`} position={[sx, 1.9, sz]} rotation={[0, -angle, 0]}>
                <boxGeometry args={[0.08, 0.8, 0.1]} />
                <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={3.0} />
              </mesh>
            );
          })}

          {/* Glass Observation Districts on second platform deck */}
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const dx = Math.cos(angle) * 4.2;
            const dz = Math.sin(angle) * 4.2;
            return (
              <group key={`obs-district-${i}`} position={[dx, 1.4, dz]}>
                {/* Platform base */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.65, 0.7, 0.08, 8]} />
                  <meshStandardMaterial color="#d97706" metalness={0.8} />
                </mesh>
                {/* Glass Dome */}
                <mesh position={[0, 0.3, 0]}>
                  <sphereGeometry args={[0.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                  <meshPhysicalMaterial
                    color="#e0f2fe"
                    transparent
                    opacity={0.25}
                    transmission={0.85}
                    roughness={0.1}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Interior details - tiny central core tower */}
                <mesh position={[0, 0.18, 0]}>
                  <boxGeometry args={[0.15, 0.35, 0.15]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                {/* Tiny internal light */}
                <mesh position={[0, 0.35, 0]}>
                  <sphereGeometry args={[0.07, 4, 4]} />
                  <meshBasicMaterial color="#06b6d4" />
                </mesh>
              </group>
            );
          })}

          {/* Large Central Crystal Energy Core */}
          <group ref={crystalRef} position={[0, 4.4, 0]}>
            {/* Primary rotating crystal */}
            <mesh castShadow>
              <octahedronGeometry args={[0.95]} />
              <meshStandardMaterial
                color="#00f3ff"
                emissive="#06b6d4"
                emissiveIntensity={3.5}
              />
            </mesh>
            {/* Secondary nested crystal */}
            <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
              <octahedronGeometry args={[0.68]} />
              <meshStandardMaterial
                color="#00f3ff"
                emissive="#0891b2"
                emissiveIntensity={2.5}
              />
            </mesh>
          </group>

          {/* Tilted Floating Orbit Rings */}
          <mesh ref={ring1Ref} position={[0, 4.4, 0]} rotation={[Math.PI / 6, 0, 0]}>
            <torusGeometry args={[1.9, 0.05, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh ref={ring2Ref} position={[0, 4.4, 0]} rotation={[-Math.PI / 5, Math.PI / 4, 0]}>
            <torusGeometry args={[2.4, 0.04, 6, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          <pointLight position={[0, 4.4, 0]} color="#06b6d4" intensity={4.5} distance={30} decay={1.5} />
        </group>
      ) : (
        /* --- Standard Protocol Vent Geometry --- */
        <group>
          <group>
            {/* Base tier */}
            <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.4, 1.7, 0.8, 6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.12} />
            </mesh>
            {/* Middle tier */}
            <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[1.15, 1.4, 0.8, 6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.12} />
            </mesh>
            {/* Top tier */}
            <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.9, 1.15, 0.8, 6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.12} />
            </mesh>
          </group>

          {[0, 1, 2, 3].map((idx) => {
            const angle = (idx / 4) * Math.PI * 2;
            const fx = Math.cos(angle) * 0.98;
            const fz = Math.sin(angle) * 0.98;
            return (
              <group key={`fissure-${idx}`} position={[fx * 0.82, 1.5, fz * 0.82]} rotation={[0, -angle, 0.08]}>
                <mesh castShadow>
                  <boxGeometry args={[0.08, 2.4, 0.12]} />
                  <meshStandardMaterial
                    color="#06b6d4"
                    emissive="#06b6d4"
                    emissiveIntensity={2.5}
                  />
                </mesh>
                <mesh position={[0.06, 0, 0]}>
                  <boxGeometry args={[0.03, 2.4, 0.08]} />
                  <meshStandardMaterial color="#d97706" metalness={0.9} />
                </mesh>
              </group>
            );
          })}

          {[0.9, 2.3].map((ry, idx) => (
            <mesh key={`ring-${idx}`} position={[0, ry, 0]}>
              <torusGeometry args={[1.3 - (ry * 0.22), 0.08, 6, 20]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}

          <group position={[1.4, 1.8, 0]}>
            <mesh position={[-0.5, -0.15, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 0.8, 4]} />
              <meshStandardMaterial color="#d97706" metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.05, 0]} castShadow>
              <cylinderGeometry args={[0.45, 0.5, 0.06, 6]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.2} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.42, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color="#e0f2fe"
                transparent
                opacity={0.3}
                transmission={0.85}
                roughness={0.1}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <sphereGeometry args={[0.08, 4, 4]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
          </group>

          <group position={[0, 3.1, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.38, 0.48, 0.32, 6]} />
              <meshStandardMaterial
                color="#06b6d4"
                emissive="#06b6d4"
                emissiveIntensity={2.2}
              />
            </mesh>
            <mesh position={[0, 0.16, 0]}>
              <torusGeometry args={[0.42, 0.05, 4, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <torusGeometry args={[0.62, 0.02, 4, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.95} />
            </mesh>
          </group>
          <pointLight position={[0, 3.5, 0]} color="#06b6d4" intensity={3.5} distance={15} decay={2} />
        </group>
      )}

      {/* --- Rising Particle Instanced Mesh --- */}
      <instancedMesh
        ref={particleMeshRef}
        args={[null as any, null as any, particlesCount]}
      >
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial color="#c2f9ff" transparent opacity={0.5} />
      </instancedMesh>

      {/* --- Selection Outline Halo --- */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
          <ringGeometry args={[isGenesis ? 7.6 : 2.0, isGenesis ? 7.95 : 2.25, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
