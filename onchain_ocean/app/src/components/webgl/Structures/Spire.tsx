import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface SpireProps {
  profile: BuilderProfile;
}

export default function Spire({ profile }: SpireProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const campusRef   = useRef<THREE.Group>(null);
  const helixRef    = useRef<THREE.Group>(null);
  const crownRef    = useRef<THREE.Group>(null);
  const ring1Ref    = useRef<THREE.Mesh>(null);
  const ring2Ref    = useRef<THREE.Mesh>(null);
  const corePulseRef = useRef<THREE.MeshStandardMaterial>(null);

  const isSelected = selectedAddress === profile.address;

  // ── Scale height from txCount (keeps original driver) ────────
  const heightMultiplier = useMemo(() => {
    return Math.min(2.8, Math.max(1.2, Math.log2(profile.txCount + 1) * 0.24));
  }, [profile.txCount]);

  // ── Glow color driven by on-chain metrics ─────────────────────
  const glowColor = useMemo(() => {
    if (profile.solVolume > 20000) return '#06b6d4';  // Cyan  – high volume
    if (profile.txCount    > 500)  return '#c084fc';  // Purple – active
    return '#34d399';                                  // Mint   – normal
  }, [profile.solVolume, profile.txCount]);

  // ── Animation ─────────────────────────────────────────────────
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (ring1Ref.current) {
      ring1Ref.current.rotation.y = t * 0.55;
      ring1Ref.current.rotation.x = t * 0.20;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.40;
      ring2Ref.current.rotation.z = t * 0.25;
    }
    if (helixRef.current) {
      helixRef.current.rotation.y = t * 0.08;
    }
    if (corePulseRef.current) {
      const pulse = profile.txCount > 500 ? 3.5 : 1.8;
      corePulseRef.current.emissiveIntensity = 1.2 + Math.sin(t * pulse) * 0.6;
    }
    if (crownRef.current) {
      crownRef.current.rotation.y = t * 0.18;
    }
  });

  // Scaled total height for dependent geometry
  const coreH1 = 16 * heightMultiplier;
  const coreH2 = 12 * heightMultiplier;
  const coreH3 = 10 * heightMultiplier;
  const totalH  = coreH1 + coreH2 + coreH3;

  return (
    <group
      ref={campusRef}
      position={[x / 3, 0, z / 3]}
      onClick={(e) => { e.stopPropagation(); setSelectedAddress(profile.address); }}
    >
      {/* ══════════════════════════════════════════════════════
          GRAND BASE PLATFORM  
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 0, 0]}>
        {/* Main stone platform */}
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <boxGeometry args={[14, 1.8, 12]} />
          <meshStandardMaterial color="#0b1e38" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Platform step-down edge */}
        <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
          <boxGeometry args={[16, 0.5, 14]} />
          <meshStandardMaterial color="#091829" roughness={0.9} />
        </mesh>
        {/* Gold perimeter railing */}
        <mesh position={[0, 1.82, 0]}>
          <torusGeometry args={[7, 0.07, 6, 32]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Emissive glow trim strip along base */}
        <mesh position={[0, 0.52, 0]}>
          <boxGeometry args={[16.1, 0.06, 14.1]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.6} />
        </mesh>
        {/* 4 corner foundation pillars */}
        {([ [-5.5, -4.5], [5.5, -4.5], [-5.5, 4.5], [5.5, 4.5] ] as [number,number][]).map(([px, pz], i) => (
          <mesh key={`fp-${i}`} castShadow position={[px, 2.2, pz]}>
            <cylinderGeometry args={[0.4, 0.55, 4.4, 6]} />
            <meshStandardMaterial color="#0f2038" roughness={0.8} metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ══════════════════════════════════════════════════════
          SIDE WING BUILDING (connected left)
          ══════════════════════════════════════════════════════ */}
      <group position={[-9, 0, 0]}>
        {/* Wing base */}
        <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
          <boxGeometry args={[7, 2, 8]} />
          <meshStandardMaterial color="#0a1c36" roughness={0.8} />
        </mesh>
        {/* Wing main block */}
        <mesh castShadow receiveShadow position={[0, 8, 0]}>
          <boxGeometry args={[6, 14, 7]} />
          <meshStandardMaterial color="#0d2244" roughness={0.78} metalness={0.3} />
        </mesh>
        {/* Wing upper setback */}
        <mesh castShadow position={[0, 18, 0]}>
          <boxGeometry args={[4, 8, 5]} />
          <meshStandardMaterial color="#102850" roughness={0.7} metalness={0.35} />
        </mesh>
        {/* Wing glow band */}
        <mesh position={[0, 6, 0]}>
          <boxGeometry args={[6.05, 0.1, 7.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.8} />
        </mesh>
        {/* Wing top beacon */}
        <mesh position={[0, 22.5, 0]}>
          <sphereGeometry args={[0.8, 8, 8]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={3.5} />
        </mesh>
        {/* Glass atrium facade on wing front */}
        <mesh position={[3.05, 9, 0]}>
          <boxGeometry args={[0.08, 12, 5.5]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.22} transmission={0.85} roughness={0.05} />
        </mesh>
        {/* Skybridge connecting wing to main tower */}
        <mesh position={[4.5, 14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 9, 8]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.28} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[4.5, 14, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 9, 4]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.2} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          REAR SERVICE BLOCK (connected right, smaller)
          ══════════════════════════════════════════════════════ */}
      <group position={[7, 0, -4]}>
        <mesh castShadow receiveShadow position={[0, 5.5, 0]}>
          <boxGeometry args={[5, 11, 5]} />
          <meshStandardMaterial color="#0a1c36" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 13, 0]}>
          <boxGeometry args={[3.5, 6, 3.5]} />
          <meshStandardMaterial color="#0d2244" roughness={0.72} metalness={0.3} />
        </mesh>
        <mesh position={[0, 4, 0]}>
          <boxGeometry args={[5.05, 0.08, 5.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.5} />
        </mesh>
        {/* Skybridge to main */}
        <mesh position={[-3.5, 11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 7, 6]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.25} transmission={0.85} roughness={0.06} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          MAIN CORE TOWER — 3 stepped segments
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 1.8, 0]}>

        {/* Segment 1 — Wide base section */}
        <mesh castShadow receiveShadow position={[0, coreH1 / 2, 0]}>
          <boxGeometry args={[9, coreH1, 8]} />
          <meshStandardMaterial color="#0c2040" roughness={0.78} metalness={0.32} />
        </mesh>
        {/* S1 glass facade panels (2 sides) */}
        <mesh position={[4.56, coreH1 / 2, 0]}>
          <boxGeometry args={[0.08, coreH1 * 0.85, 6]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        <mesh position={[-4.56, coreH1 / 2, 0]}>
          <boxGeometry args={[0.08, coreH1 * 0.85, 6]} />
          <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        {/* S1 glow band */}
        <mesh position={[0, coreH1 * 0.28, 0]}>
          <boxGeometry args={[9.1, 0.12, 8.1]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={2.0} />
        </mesh>

        {/* ── Observation Deck 1 at ~30% height ─────────── */}
        <group position={[0, coreH1 * 0.32, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[7.5, 7.8, 0.3, 12]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.3} transmission={0.82} roughness={0.08} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[7.6, 0.09, 6, 32]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Deck support ribs */}
          {[0, 1, 2, 3].map((i) => {
            const ang = (i / 4) * Math.PI * 2;
            return (
              <mesh key={`d1rib-${i}`} position={[Math.cos(ang) * 5, 0, Math.sin(ang) * 5]} rotation={[0, ang, Math.PI / 12]}>
                <cylinderGeometry args={[0.06, 0.06, 5.5, 4]} />
                <meshStandardMaterial color="#d97706" metalness={0.9} />
              </mesh>
            );
          })}
        </group>

        {/* Segment 2 — Mid section (setback) */}
        <mesh castShadow receiveShadow position={[0, coreH1 + coreH2 / 2, 0]}>
          <boxGeometry args={[6.5, coreH2, 6]} />
          <meshStandardMaterial color="#0f2a52" roughness={0.72} metalness={0.38} />
        </mesh>
        <mesh position={[0, coreH1 + coreH2 * 0.3, 0]}>
          <boxGeometry args={[6.55, 0.1, 6.05]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.8} />
        </mesh>

        {/* ── Observation Deck 2 at ~62% height ─────────── */}
        <group position={[0, coreH1 + coreH2 * 0.65, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[6, 6.2, 0.25, 10]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.28} transmission={0.82} roughness={0.08} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <torusGeometry args={[6.1, 0.08, 6, 28]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Segment 3 — Apex tower (narrowest) */}
        <mesh castShadow receiveShadow position={[0, coreH1 + coreH2 + coreH3 / 2, 0]}>
          <boxGeometry args={[4, coreH3, 3.8]} />
          <meshStandardMaterial color="#1a3a6a" roughness={0.65} metalness={0.45} />
        </mesh>
        <mesh position={[0, coreH1 + coreH2 + coreH3 * 0.4, 0]}>
          <boxGeometry args={[4.06, 0.1, 3.86]} />
          <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.6} />
        </mesh>

        {/* ── Observation Deck 3 at ~90% height ─────────── */}
        <group position={[0, coreH1 + coreH2 + coreH3 * 0.9, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[4.5, 4.6, 0.22, 10]} />
            <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.32} transmission={0.85} roughness={0.06} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <torusGeometry args={[4.55, 0.07, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* ── Helix External Cage (3 glass pillars) ──────── */}
        <group ref={helixRef}>
          {[0, 1, 2].map((i) => {
            const ang = (i / 3) * Math.PI * 2;
            const cx = Math.cos(ang) * 5.5;
            const cz = Math.sin(ang) * 5.5;
            const h = coreH1 * 0.88;
            return (
              <group key={`helix-${i}`} position={[cx, h / 2, cz]}>
                {/* Glass helix pillar */}
                <mesh castShadow>
                  <cylinderGeometry args={[0.28, 0.45, h, 6]} />
                  <meshPhysicalMaterial color="#e0f2fe" transparent opacity={0.25} transmission={0.85} roughness={0.06} />
                </mesh>
                {/* Gold clamp bands */}
                {[0.25, 0.5, 0.75].map((pct, j) => (
                  <mesh key={`clamp-${j}`} position={[0, h * pct - h / 2, 0]}>
                    <torusGeometry args={[0.4, 0.06, 4, 12]} />
                    <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
                  </mesh>
                ))}
                {/* Glow line inside pillar */}
                <mesh>
                  <cylinderGeometry args={[0.06, 0.06, h, 4]} />
                  <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.8} />
                </mesh>
              </group>
            );
          })}
        </group>

        {/* ══════════════════════════════════════════════════════
            APEX CROWN — Crystal energy core + orbit rings
            ══════════════════════════════════════════════════════ */}
        <group ref={crownRef} position={[0, totalH + 2.5, 0]}>
          {/* Central energy crystal */}
          <mesh castShadow>
            <octahedronGeometry args={[1.8]} />
            <meshStandardMaterial
              ref={corePulseRef}
              color={glowColor}
              emissive={glowColor}
              emissiveIntensity={2.0}
              roughness={0.04}
              metalness={0.4}
            />
          </mesh>
          {/* Secondary crystal spire */}
          <mesh position={[0, 2.2, 0]} castShadow>
            <octahedronGeometry args={[0.9]} />
            <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.6} />
          </mesh>
          {/* Orbit ring 1 */}
          <mesh ref={ring1Ref}>
            <torusGeometry args={[2.8, 0.09, 6, 24]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Orbit ring 2 */}
          <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.6, 0.06, 5, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Crown point light */}
          <pointLight color={glowColor} intensity={6.0} distance={28} decay={1.8} />
        </group>

        {/* Ambient light at base */}
        <pointLight position={[0, 5, 0]} color={glowColor} intensity={2.5} distance={20} decay={2} />
      </group>

      {/* ══════════════════════════════════════════════════════
          SELECTION HALO RING
          ══════════════════════════════════════════════════════ */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[9.5, 10.5, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
