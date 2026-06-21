import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface RigProps {
  profile: BuilderProfile;
}

export default function Rig({ profile }: RigProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const domeRef       = useRef<THREE.Group>(null);
  const antennaRef    = useRef<THREE.Group>(null);
  const reactorRef    = useRef<THREE.Mesh>(null);
  const corePulseRef  = useRef<THREE.MeshStandardMaterial>(null);
  const orbitRingRef  = useRef<THREE.Mesh>(null);

  const isSelected = selectedAddress === profile.address;

  // ── Scale from SOL volume (preserves original driver) ────────
  const scaleMultiplier = useMemo(() => {
    return Math.min(2.2, Math.max(1.1, Math.log10(profile.solVolume + 1) * 0.42));
  }, [profile.solVolume]);

  // ── Sector color palette ──────────────────────────────────────
  const colors = useMemo(() => {
    switch (profile.sector) {
      case 'DeFi':         return { base: '#fb7185', glow: '#fb7185', glass: '#ffe4e6', dark: '#2a0a14' };
      case 'Infrastructure': return { base: '#06b6d4', glow: '#06b6d4', glass: '#ecfeff', dark: '#0a1e24' };
      case 'Social':       return { base: '#34d399', glow: '#34d399', glass: '#f0fdf4', dark: '#082016' };
      default:             return { base: '#c084fc', glow: '#c084fc', glass: '#faf5ff', dark: '#160a28' };
    }
  }, [profile.sector]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (orbitRingRef.current) {
      orbitRingRef.current.rotation.y = t * 0.6;
      orbitRingRef.current.rotation.x = t * 0.25;
    }
    if (corePulseRef.current) {
      corePulseRef.current.emissiveIntensity = 1.4 + Math.sin(t * 2.2) * 0.5;
    }
    if (domeRef.current) {
      domeRef.current.rotation.y = t * 0.04;
    }
    if (antennaRef.current) {
      antennaRef.current.rotation.y = t * 0.12;
    }
  });

  return (
    <group
      position={[x / 3, 0, z / 3]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onClick={(e) => { e.stopPropagation(); setSelectedAddress(profile.address); }}
    >
      {/* ══════════════════════════════════════════════════════
          GRAND CAMPUS PLATFORM BASE
          ══════════════════════════════════════════════════════ */}
      <group>
        {/* Main campus platform */}
        <mesh castShadow receiveShadow position={[0, 0.8, 0]}>
          <boxGeometry args={[22, 1.6, 17]} />
          <meshStandardMaterial color={colors.dark} roughness={0.85} metalness={0.25} />
        </mesh>
        {/* Lower step-out */}
        <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
          <boxGeometry args={[24, 0.4, 19]} />
          <meshStandardMaterial color="#060e1a" roughness={0.9} />
        </mesh>
        {/* Gold perimeter trim */}
        <mesh position={[0, 1.62, 0]}>
          <boxGeometry args={[22.1, 0.08, 0.1]} />
          <meshStandardMaterial color="#d97706" emissive="#d97706" emissiveIntensity={1.2} metalness={0.9} />
        </mesh>
        {/* Campus glow grid on ground (courtyard lines) */}
        {[-5, 0, 5].map((gx) => (
          <mesh key={`gg-${gx}`} position={[gx, 0.42, 0]}>
            <boxGeometry args={[0.06, 0.02, 16]} />
            <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.0} />
          </mesh>
        ))}
        {/* Corner columns */}
        {([ [-9, -7], [9, -7], [-9, 7], [9, 7] ] as [number,number][]).map(([cx, cz], i) => (
          <mesh key={`col-${i}`} castShadow position={[cx, 3.2, cz]}>
            <cylinderGeometry args={[0.45, 0.6, 6.4, 8]} />
            <meshStandardMaterial color="#0a1e30" roughness={0.8} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ══════════════════════════════════════════════════════
          CENTRAL HQ DOME BUILDING
          ══════════════════════════════════════════════════════ */}
      <group ref={domeRef} position={[0, 1.6, 0]}>
        {/* HQ building base cylinder */}
        <mesh castShadow receiveShadow position={[0, 7, 0]}>
          <cylinderGeometry args={[4.5, 5.2, 14, 10]} />
          <meshStandardMaterial color={colors.dark} roughness={0.75} metalness={0.42} />
        </mesh>
        {/* HQ mid-level observation ring */}
        <mesh position={[0, 14, 0]}>
          <torusGeometry args={[5.5, 0.2, 6, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* HQ glass dome cap */}
        <mesh position={[0, 14.5, 0]}>
          <sphereGeometry args={[4.8, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color={colors.glass}
            transparent opacity={0.22}
            transmission={0.88}
            roughness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Dome gold geodesic cage */}
        <mesh position={[0, 14.5, 0]}>
          <sphereGeometry args={[4.85, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} wireframe />
        </mesh>
        {/* HQ reactor core inside dome */}
        <group position={[0, 15.5, 0]}>
          <mesh castShadow ref={reactorRef}>
            <sphereGeometry args={[1.6, 10, 10]} />
            <meshStandardMaterial
              ref={corePulseRef}
              color={colors.glow}
              emissive={colors.glow}
              emissiveIntensity={1.8}
              roughness={0.04}
              metalness={0.3}
            />
          </mesh>
          <mesh ref={orbitRingRef}>
            <torusGeometry args={[2.5, 0.1, 6, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
          <pointLight color={colors.glow} intensity={5.0} distance={30} decay={1.8} />
        </group>
        {/* Glow band on HQ base */}
        <mesh position={[0, 4, 0]}>
          <torusGeometry args={[5.0, 0.1, 6, 24]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          LEFT OFFICE WING
          ══════════════════════════════════════════════════════ */}
      <group position={[-8, 1.6, 0]}>
        {/* Main office block */}
        <mesh castShadow receiveShadow position={[0, 7, 0]}>
          <boxGeometry args={[8, 14, 7]} />
          <meshStandardMaterial color={colors.dark} roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Stepped upper floor */}
        <mesh castShadow position={[0, 17.5, 0]}>
          <boxGeometry args={[5.5, 7, 5]} />
          <meshStandardMaterial color={colors.dark} roughness={0.72} metalness={0.36} />
        </mesh>
        {/* Stepped top */}
        <mesh castShadow position={[0, 23, 0]}>
          <boxGeometry args={[3, 4, 3]} />
          <meshStandardMaterial color={colors.dark} roughness={0.65} metalness={0.42} />
        </mesh>
        {/* Glass atrium facade */}
        <mesh position={[4.06, 7, 0]}>
          <boxGeometry args={[0.08, 12, 5.5]} />
          <meshPhysicalMaterial color={colors.glass} transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        {/* Interior glow (simulated lit windows) */}
        <mesh position={[3.8, 7, 0]}>
          <boxGeometry args={[0.05, 10, 5]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
        {/* Wing glow bands */}
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[8.05, 0.1, 7.05]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 13, 0]}>
          <boxGeometry args={[8.05, 0.08, 7.05]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.4} />
        </mesh>
        {/* Top beacon */}
        <mesh position={[0, 25.5, 0]}>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={3.5} />
        </mesh>
        {/* Skybridge to HQ */}
        <mesh position={[4.5, 13, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 9, 8]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.28} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[4.5, 13, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 9, 4]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={2.2} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          RIGHT OFFICE WING
          ══════════════════════════════════════════════════════ */}
      <group position={[8, 1.6, 0]}>
        {/* Main office block */}
        <mesh castShadow receiveShadow position={[0, 9, 0]}>
          <boxGeometry args={[7, 18, 7]} />
          <meshStandardMaterial color={colors.dark} roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Stepped upper */}
        <mesh castShadow position={[0, 21, 0]}>
          <boxGeometry args={[5, 8, 5]} />
          <meshStandardMaterial color={colors.dark} roughness={0.72} metalness={0.36} />
        </mesh>
        {/* Glass atrium */}
        <mesh position={[-3.56, 9, 0]}>
          <boxGeometry args={[0.08, 15, 5.5]} />
          <meshPhysicalMaterial color={colors.glass} transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        <mesh position={[-3.35, 9, 0]}>
          <boxGeometry args={[0.05, 13, 5]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
        {/* Glow bands */}
        <mesh position={[0, 5.5, 0]}>
          <boxGeometry args={[7.05, 0.1, 7.05]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 16, 0]}>
          <boxGeometry args={[7.05, 0.08, 7.05]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={1.4} />
        </mesh>
        {/* Top beacon */}
        <mesh position={[0, 25.5, 0]}>
          <sphereGeometry args={[0.7, 8, 8]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={3.5} />
        </mesh>
        {/* Skybridge to HQ */}
        <mesh position={[-4, 14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.4, 0.4, 8, 8]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.28} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[-4, 14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 8, 4]} />
          <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={2.2} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          REAR ANTENNA TOWER (corporate signature spire)
          ══════════════════════════════════════════════════════ */}
      <group ref={antennaRef} position={[0, 1.6, -6.5]}>
        {/* Tower base drum */}
        <mesh castShadow receiveShadow position={[0, 5, 0]}>
          <cylinderGeometry args={[2, 2.5, 10, 8]} />
          <meshStandardMaterial color={colors.dark} roughness={0.8} metalness={0.4} />
        </mesh>
        {/* Tower shaft */}
        <mesh castShadow receiveShadow position={[0, 18, 0]}>
          <cylinderGeometry args={[0.7, 1.8, 16, 8]} />
          <meshStandardMaterial color={colors.dark} roughness={0.72} metalness={0.45} />
        </mesh>
        {/* Upper shaft */}
        <mesh castShadow receiveShadow position={[0, 30, 0]}>
          <cylinderGeometry args={[0.25, 0.65, 14, 6]} />
          <meshStandardMaterial color="#0f2038" roughness={0.65} metalness={0.5} />
        </mesh>
        {/* Tip */}
        <mesh castShadow position={[0, 37.5, 0]}>
          <coneGeometry args={[0.5, 3, 6]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glow bands on tower */}
        {[10, 18, 26].map((ty) => (
          <mesh key={`ab-${ty}`} position={[0, ty, 0]}>
            <torusGeometry args={[1.5 - ty * 0.02, 0.08, 6, 16]} />
            <meshStandardMaterial color={colors.glow} emissive={colors.glow} emissiveIntensity={2.0} />
          </mesh>
        ))}
        {/* Signal dish arms */}
        {[0, 1, 2].map((i) => {
          const ang = (i / 3) * Math.PI * 2;
          return (
            <group key={`dish-${i}`} position={[Math.cos(ang) * 2, 22, Math.sin(ang) * 2]} rotation={[Math.PI / 4, ang, 0]}>
              <mesh>
                <cylinderGeometry args={[0.06, 0.06, 2.5, 4]} />
                <meshStandardMaterial color="#d97706" metalness={0.9} />
              </mesh>
              <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0.9, 0.9, 0.12, 8]} />
                <meshStandardMaterial color="#1a2a40" roughness={0.6} metalness={0.6} />
              </mesh>
            </group>
          );
        })}
        <pointLight position={[0, 37, 0]} color={colors.glow} intensity={3.5} distance={25} decay={1.8} />
      </group>

      {/* ══════════════════════════════════════════════════════
          SELECTION HALO
          ══════════════════════════════════════════════════════ */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[12.5, 13.5, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
