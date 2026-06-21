import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface CommunityClusterProps {
  profile: BuilderProfile;
}

export default function CommunityCluster({ profile }: CommunityClusterProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const campusRef  = useRef<THREE.Group>(null);
  const domeSpinRef = useRef<THREE.Mesh>(null);
  const heartRef   = useRef<THREE.MeshStandardMaterial>(null);

  const isSelected = selectedAddress === profile.address;

  // ── Scale from txCount (preserves original driver) ───────────
  const scale = useMemo(() => {
    return Math.min(2.2, Math.max(1.1, Math.log10(profile.txCount + 1) * 0.45));
  }, [profile.txCount]);

  // ── 4 satellite pod buildings ──────────────────────────────────
  const pods = useMemo(() => {
    return [
      { angle: Math.PI * 0.25,  r: 7.5, w: 4.5, h: 9,  d: 4.0, color: '#082016' },
      { angle: Math.PI * 0.75,  r: 7.5, w: 5.0, h: 11, d: 4.2, color: '#082016' },
      { angle: Math.PI * 1.25,  r: 7.5, w: 4.0, h: 8,  d: 3.8, color: '#082016' },
      { angle: Math.PI * 1.75,  r: 7.5, w: 5.5, h: 12, d: 4.5, color: '#082016' },
    ].map((p) => ({
      ...p,
      px: Math.cos(p.angle) * p.r,
      pz: Math.sin(p.angle) * p.r,
    }));
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (campusRef.current) {
      campusRef.current.rotation.y = t * 0.025 + x * 0.01;
    }
    if (domeSpinRef.current) {
      domeSpinRef.current.rotation.y = t * 0.08;
    }
    if (heartRef.current) {
      heartRef.current.emissiveIntensity = 1.2 + Math.sin(t * 1.6) * 0.5;
    }
  });

  return (
    <group
      ref={campusRef}
      position={[x / 3, 0, z / 3]}
      scale={[scale, scale, scale]}
      onClick={(e) => { e.stopPropagation(); setSelectedAddress(profile.address); }}
    >
      {/* ══════════════════════════════════════════════════════
          ELEVATED RING PLATFORM BASE
          ══════════════════════════════════════════════════════ */}
      <group>
        {/* Main platform disk */}
        <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[9, 9.5, 2, 12]} />
          <meshStandardMaterial color="#08180e" roughness={0.84} metalness={0.28} />
        </mesh>
        {/* Outer step ring */}
        <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[9.5, 10.5, 0.6, 12]} />
          <meshStandardMaterial color="#051008" roughness={0.9} />
        </mesh>
        {/* Gold perimeter trim */}
        <mesh position={[0, 2.05, 0]}>
          <torusGeometry args={[9.1, 0.1, 6, 48]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Platform glow ring */}
        <mesh position={[0, 2.07, 0]}>
          <torusGeometry args={[4.5, 0.07, 4, 32]} />
          <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={1.4} />
        </mesh>
        {/* Emissive floor trim */}
        <mesh position={[0, 0.32, 0]}>
          <torusGeometry args={[9.2, 0.08, 4, 48]} />
          <meshStandardMaterial color="#14b8a6" emissive="#0d9488" emissiveIntensity={1.2} />
        </mesh>
        {/* 4 support columns to sea floor */}
        {[0, 1, 2, 3].map((i) => {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          return (
            <mesh key={`supcol-${i}`} castShadow position={[Math.cos(ang) * 7.5, -4.5, Math.sin(ang) * 7.5]}>
              <cylinderGeometry args={[0.5, 0.75, 9, 6]} />
              <meshStandardMaterial color="#0a1e14" roughness={0.85} metalness={0.35} />
            </mesh>
          );
        })}
      </group>

      {/* ══════════════════════════════════════════════════════
          CENTRAL SOCIAL HALL (rounded community center)
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 2.0, 0]}>
        {/* Hall base drum */}
        <mesh castShadow receiveShadow position={[0, 5.5, 0]}>
          <cylinderGeometry args={[3.2, 3.8, 11, 10]} />
          <meshStandardMaterial color="#0c2016" roughness={0.76} metalness={0.38} />
        </mesh>
        {/* Hall upper tier */}
        <mesh castShadow position={[0, 13, 0]}>
          <cylinderGeometry args={[2.2, 3.0, 6, 10]} />
          <meshStandardMaterial color="#102a1c" roughness={0.7} metalness={0.42} />
        </mesh>
        {/* Glass dome cap */}
        <mesh ref={domeSpinRef} position={[0, 16.2, 0]}>
          <sphereGeometry args={[2.8, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#34d399" transparent opacity={0.2} transmission={0.88} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        {/* Dome wireframe */}
        <mesh position={[0, 16.2, 0]}>
          <sphereGeometry args={[2.85, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} wireframe />
        </mesh>
        {/* Dome gold ring at equator */}
        <mesh position={[0, 16.2, 0]}>
          <torusGeometry args={[2.9, 0.12, 6, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glass atrium entrance panels */}
        {[0, 1, 2, 3].map((i) => {
          const ang = (i / 4) * Math.PI * 2;
          return (
            <mesh key={`panel-${i}`} position={[Math.cos(ang) * 3.82, 6, Math.sin(ang) * 3.82]} rotation={[0, ang, 0]}>
              <boxGeometry args={[0.08, 8, 2.8]} />
              <meshPhysicalMaterial color="#e0fdf4" transparent opacity={0.22} transmission={0.88} roughness={0.04} />
            </mesh>
          );
        })}
        {/* Hall glow bands */}
        <mesh position={[0, 3, 0]}>
          <torusGeometry args={[3.6, 0.1, 6, 24]} />
          <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 11, 0]}>
          <torusGeometry args={[3.2, 0.09, 6, 24]} />
          <meshStandardMaterial color="#14b8a6" emissive="#0d9488" emissiveIntensity={1.6} />
        </mesh>
        {/* Community hearth inside dome */}
        <group position={[0, 17.5, 0]}>
          <mesh castShadow>
            <octahedronGeometry args={[1.2]} />
            <meshStandardMaterial
              ref={heartRef}
              color="#34d399"
              emissive="#059669"
              emissiveIntensity={1.6}
              roughness={0.04}
              metalness={0.3}
            />
          </mesh>
          <pointLight color="#34d399" intensity={5.0} distance={28} decay={1.8} />
        </group>
        <pointLight position={[0, 6, 0]} color="#14b8a6" intensity={2.5} distance={20} decay={2} />
      </group>

      {/* ══════════════════════════════════════════════════════
          4 SATELLITE POD BUILDINGS (with glass corridors)
          ══════════════════════════════════════════════════════ */}
      {pods.map((p, i) => (
        <group key={`pod-${i}`} position={[p.px, 2.0, p.pz]}>
          {/* Pod main block */}
          <mesh castShadow receiveShadow position={[0, p.h / 2, 0]}>
            <boxGeometry args={[p.w, p.h, p.d]} />
            <meshStandardMaterial color="#0c2016" roughness={0.8} metalness={0.3} />
          </mesh>
          {/* Pod stepped upper */}
          <mesh castShadow position={[0, p.h + p.h * 0.18, 0]}>
            <boxGeometry args={[p.w * 0.62, p.h * 0.3, p.d * 0.62]} />
            <meshStandardMaterial color="#102a1c" roughness={0.72} metalness={0.36} />
          </mesh>
          {/* Glass facade (facing center) */}
          <mesh position={[p.px > 0 ? -p.w / 2 - 0.04 : p.w / 2 + 0.04, p.h / 2, 0]}>
            <boxGeometry args={[0.08, p.h * 0.85, p.d * 0.9]} />
            <meshPhysicalMaterial color="#e0fdf4" transparent opacity={0.22} transmission={0.88} roughness={0.04} />
          </mesh>
          {/* Interior bioluminescent garden glow */}
          <mesh position={[p.px > 0 ? -p.w / 2 + 0.3 : p.w / 2 - 0.3, p.h * 0.4, 0]}>
            <boxGeometry args={[0.08, p.h * 0.55, p.d * 0.8]} />
            <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={0.7} transparent opacity={0.5} />
          </mesh>
          {/* Glow band */}
          <mesh position={[0, p.h * 0.35, 0]}>
            <boxGeometry args={[p.w * 1.01, 0.09, p.d * 1.01]} />
            <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={1.8} />
          </mesh>
          {/* Beacon top */}
          <mesh position={[0, p.h * 1.32, 0]}>
            <sphereGeometry args={[0.5, 6, 6]} />
            <meshStandardMaterial color="#14b8a6" emissive="#0d9488" emissiveIntensity={3.0} />
          </mesh>
          {/* Hanging garden terrace panels */}
          <mesh castShadow position={[0, p.h * 0.22, 0]}>
            <boxGeometry args={[p.w * 1.25, 0.12, p.d * 1.25]} />
            <meshPhysicalMaterial color="#e0fdf4" transparent opacity={0.18} transmission={0.88} roughness={0.05} />
          </mesh>
          <mesh position={[0, p.h * 0.22, 0]}>
            <torusGeometry args={[p.w * 0.8, 0.06, 4, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.1} />
          </mesh>

          {/* Glass corridor skybridge to central hall */}
          {(() => {
            const toCx = -p.px;
            const toCz = -p.pz;
            const len = Math.sqrt(toCx * toCx + toCz * toCz) - 3.0;
            const ang = Math.atan2(toCz, toCx);
            return (
              <group
                position={[toCx / 2 + p.px * 0.18, p.h * 0.55, toCz / 2 + p.pz * 0.18]}
                rotation={[0, -ang, Math.PI / 2]}
              >
                <mesh castShadow>
                  <cylinderGeometry args={[0.38, 0.38, len, 8]} />
                  <meshPhysicalMaterial color="#e0fdf4" transparent opacity={0.26} transmission={0.88} roughness={0.06} />
                </mesh>
                <mesh>
                  <cylinderGeometry args={[0.08, 0.08, len, 4]} />
                  <meshStandardMaterial color="#34d399" emissive="#059669" emissiveIntensity={1.8} />
                </mesh>
                {/* Bridge gold rings */}
                {[0.25, 0.75].map((t, j) => (
                  <mesh key={`br-${j}`} position={[0, len * (t - 0.5), 0]}>
                    <torusGeometry args={[0.4, 0.05, 4, 12]} />
                    <meshStandardMaterial color="#d97706" metalness={0.9} />
                  </mesh>
                ))}
              </group>
            );
          })()}
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════
          SELECTION HALO
          ══════════════════════════════════════════════════════ */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[11, 12.2, 36]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
