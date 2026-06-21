import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface CitadelProps {
  profile: BuilderProfile;
}

export default function Citadel({ profile }: CitadelProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const citadelRef  = useRef<THREE.Group>(null);
  const heartRef    = useRef<THREE.Group>(null);
  const cageRing1   = useRef<THREE.Mesh>(null);
  const cageRing2   = useRef<THREE.Mesh>(null);
  const hearPulse   = useRef<THREE.MeshStandardMaterial>(null);
  const domeSpin    = useRef<THREE.Mesh>(null);

  const isSelected = selectedAddress === profile.address;

  // ── Scale from community size (preserves original driver) ────
  const scaleMultiplier = useMemo(() => {
    const size = profile.communitySize || 100;
    return Math.min(3.2, Math.max(1.4, Math.log10(size) * 0.72));
  }, [profile.communitySize]);

  // ── 8 outer tower definitions ──────────────────────────────────
  const outerTowers = useMemo(() => {
    const arr = [];
    const count = 8;
    const radius = 9.5;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      arr.push({
        rx: Math.cos(angle) * radius,
        rz: Math.sin(angle) * radius,
        angle,
        height: 14 + (i % 3) * 4, // 14, 14, 18, 14, 14, 18, 14, 14
        width: 1.8 + (i % 2) * 0.4,
      });
    }
    return arr;
  }, []);

  // ── 6 residential blocks in a semicircle ─────────────────────
  const residentialBlocks = useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i / 6) * Math.PI * 2 + Math.PI / 12;
      const r = 5.5;
      return {
        rx: Math.cos(angle) * r,
        rz: Math.sin(angle) * r,
        angle,
        w: 2.8 + (i % 2) * 0.6,
        h: 6 + (i % 3) * 2,
        d: 2.4,
      };
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (citadelRef.current) {
      citadelRef.current.rotation.y = t * 0.025 + x * 0.01;
    }
    if (hearPulse.current) {
      hearPulse.current.emissiveIntensity = 1.4 + Math.sin(t * 1.8) * 0.6;
    }
    if (cageRing1.current) {
      cageRing1.current.rotation.x = t * 0.7;
      cageRing1.current.rotation.z = t * 0.4;
    }
    if (cageRing2.current) {
      cageRing2.current.rotation.y = -t * 0.6;
      cageRing2.current.rotation.z = t * 0.5;
    }
    if (domeSpin.current) {
      domeSpin.current.rotation.y = t * 0.06;
    }
  });

  return (
    <group
      ref={citadelRef}
      position={[x / 3, 0, z / 3]}
      scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}
      onClick={(e) => { e.stopPropagation(); setSelectedAddress(profile.address); }}
    >
      {/* ══════════════════════════════════════════════════════
          GRAND CIRCULAR CIVIC PLAZA
          ══════════════════════════════════════════════════════ */}
      <group>
        {/* Main plaza slab */}
        <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
          <cylinderGeometry args={[11, 12, 1.8, 16]} />
          <meshStandardMaterial color="#110d28" roughness={0.82} metalness={0.28} />
        </mesh>
        {/* Step-down outer ring */}
        <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
          <cylinderGeometry args={[12, 13, 0.4, 16]} />
          <meshStandardMaterial color="#0d0a20" roughness={0.9} />
        </mesh>
        {/* Plaza gold perimeter trim */}
        <mesh position={[0, 1.82, 0]}>
          <torusGeometry args={[11.2, 0.12, 6, 48]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Plaza glow grid lines (radial) */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const ang = (i / 8) * Math.PI * 2;
          return (
            <mesh key={`grid-${i}`} position={[0, 1.82, 0]} rotation={[0, ang, 0]}>
              <boxGeometry args={[0.05, 0.03, 22]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.8} />
            </mesh>
          );
        })}
        {/* Concentric glow ring on plaza */}
        <mesh position={[0, 1.84, 0]}>
          <torusGeometry args={[5.5, 0.07, 4, 32]} />
          <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          OUTER TOWER RING (8 perimeter civic towers)
          ══════════════════════════════════════════════════════ */}
      {outerTowers.map((t, i) => (
        <group key={`tower-${i}`} position={[t.rx, 1.8, t.rz]}>
          {/* Base column */}
          <mesh castShadow receiveShadow position={[0, t.height / 2, 0]}>
            <boxGeometry args={[t.width, t.height, t.width * 0.9]} />
            <meshStandardMaterial color="#1a0e30" roughness={0.78} metalness={0.35} />
          </mesh>
          {/* Setback upper */}
          <mesh castShadow position={[0, t.height + t.height * 0.15, 0]}>
            <boxGeometry args={[t.width * 0.65, t.height * 0.28, t.width * 0.6]} />
            <meshStandardMaterial color="#250f42" roughness={0.7} metalness={0.4} />
          </mesh>
          {/* Capital gold band */}
          <mesh position={[0, t.height * 0.95, 0]}>
            <torusGeometry args={[t.width * 0.75, 0.07, 4, 12]} />
            <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Base footing */}
          <mesh castShadow position={[0, 0.12, 0]}>
            <cylinderGeometry args={[t.width * 0.9, t.width * 1.1, 0.24, 6]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Bioluminescent lantern crown */}
          <mesh position={[0, t.height * 1.3 + 0.5, 0]}>
            <sphereGeometry args={[t.width * 0.55, 6, 6]} />
            <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.8} roughness={0.1} />
          </mesh>
          {/* Glass observation deck at 70% */}
          <group position={[0, t.height * 0.7, 0]}>
            <mesh>
              <cylinderGeometry args={[t.width * 1.4, t.width * 1.5, 0.1, 8]} />
              <meshPhysicalMaterial color="#e0d4ff" transparent opacity={0.32} transmission={0.82} roughness={0.08} />
            </mesh>
            <mesh>
              <torusGeometry args={[t.width * 1.45, 0.04, 4, 16]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} />
            </mesh>
          </group>
          {/* Glow band */}
          <mesh position={[0, t.height * 0.35, 0]}>
            <boxGeometry args={[t.width * 1.01, 0.09, t.width * 0.91]} />
            <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={1.8} />
          </mesh>
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════
          CIRCULAR GLASS SKYBRIDGE RING
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 11, 0]}>
        {/* Transparent glass tube ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.5, 0.32, 8, 48]} />
          <meshPhysicalMaterial color="#e0d4ff" transparent opacity={0.3} transmission={0.9} roughness={0.06} side={THREE.DoubleSide} />
        </mesh>
        {/* Inner gold railing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.2, 0.05, 4, 48]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Outer gold railing */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.8, 0.05, 4, 48]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Glowing transit line inside */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[9.5, 0.04, 4, 48]} />
          <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          6 RESIDENTIAL BLOCKS around inner ring
          ══════════════════════════════════════════════════════ */}
      {residentialBlocks.map((b, i) => (
        <group key={`res-${i}`} position={[b.rx, 1.8, b.rz]}>
          {/* Block base */}
          <mesh castShadow receiveShadow position={[0, b.h / 2, 0]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color="#1f0e38" roughness={0.82} metalness={0.28} />
          </mesh>
          {/* Upper setback */}
          <mesh castShadow position={[0, b.h + b.h * 0.2, 0]}>
            <boxGeometry args={[b.w * 0.65, b.h * 0.35, b.d * 0.65]} />
            <meshStandardMaterial color="#2a1250" roughness={0.72} metalness={0.35} />
          </mesh>
          {/* Window glow */}
          <mesh position={[0, b.h * 0.38, 0]}>
            <boxGeometry args={[b.w * 1.01, 0.08, b.d * 1.01]} />
            <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.4} />
          </mesh>
          {/* Beacon top */}
          <mesh position={[0, b.h * 1.38, 0]}>
            <sphereGeometry args={[0.35, 6, 6]} />
            <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════
          CENTRAL COMMUNITY HALL
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 1.8, 0]}>
        {/* Hall cylinder */}
        <mesh castShadow receiveShadow position={[0, 5.5, 0]}>
          <cylinderGeometry args={[3.8, 4.5, 11, 10]} />
          <meshStandardMaterial color="#200e3c" roughness={0.75} metalness={0.4} />
        </mesh>
        {/* Hall entrance arch */}
        <mesh castShadow position={[0, 4, 4.2]}>
          <boxGeometry args={[3, 8, 0.5]} />
          <meshPhysicalMaterial color="#e0d4ff" transparent opacity={0.25} transmission={0.85} roughness={0.05} />
        </mesh>
        {/* Hall gold ring deck */}
        <mesh position={[0, 11, 0]}>
          <torusGeometry args={[4.8, 0.18, 6, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glass dome over hall */}
        <mesh ref={domeSpin} position={[0, 11.5, 0]}>
          <sphereGeometry args={[3.8, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#c084fc" transparent opacity={0.2} transmission={0.88} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        {/* Dome wireframe cage */}
        <mesh position={[0, 11.5, 0]}>
          <sphereGeometry args={[3.85, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} wireframe />
        </mesh>
        {/* Hall glow band */}
        <mesh position={[0, 3.5, 0]}>
          <torusGeometry args={[4.3, 0.1, 6, 24]} />
          <meshStandardMaterial color="#a855f7" emissive="#8b5cf6" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          COMMUNITY HEARTH CRYSTAL (enlarged)
          ══════════════════════════════════════════════════════ */}
      <group ref={heartRef} position={[0, 15, 0]}>
        {/* Main crystal */}
        <mesh castShadow>
          <octahedronGeometry args={[1.8]} />
          <meshStandardMaterial
            ref={hearPulse}
            color="#c084fc"
            emissive="#8b5cf6"
            emissiveIntensity={1.8}
            roughness={0.04}
            metalness={0.3}
          />
        </mesh>
        {/* Satellite crystals */}
        {[0, 1, 2].map((i) => {
          const ang = (i / 3) * Math.PI * 2;
          return (
            <mesh key={`sc-${i}`} position={[Math.cos(ang) * 2.5, 0, Math.sin(ang) * 2.5]} castShadow>
              <octahedronGeometry args={[0.9]} />
              <meshStandardMaterial color="#c084fc" emissive="#8b5cf6" emissiveIntensity={1.4} />
            </mesh>
          );
        })}
        {/* Rotating orbit cage rings */}
        <mesh ref={cageRing1}>
          <torusGeometry args={[2.2, 0.1, 5, 20]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        <mesh ref={cageRing2}>
          <torusGeometry args={[3.0, 0.07, 5, 20]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        <pointLight color="#8b5cf6" intensity={8.0} distance={35} decay={1.6} />
      </group>

      {/* ══════════════════════════════════════════════════════
          SELECTION HALO
          ══════════════════════════════════════════════════════ */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[13, 14.2, 40]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
