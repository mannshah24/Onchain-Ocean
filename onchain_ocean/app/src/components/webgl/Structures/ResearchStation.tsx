import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useOceanStore } from '../../../store/useOceanStore';
import type { BuilderProfile } from '../../../types';

interface ResearchStationProps {
  profile: BuilderProfile;
}

export default function ResearchStation({ profile }: ResearchStationProps) {
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);
  const [x, z] = profile.coordinates;

  const stationRef    = useRef<THREE.Group>(null);
  const observeRef    = useRef<THREE.Group>(null);
  const antennaRingRef = useRef<THREE.Mesh>(null);
  const corePulseRef  = useRef<THREE.MeshStandardMaterial>(null);
  const dishesRef     = useRef<THREE.Group>(null);

  const isSelected = selectedAddress === profile.address;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (stationRef.current) {
      stationRef.current.rotation.y = t * 0.02 + x * 0.01;
    }
    if (antennaRingRef.current) {
      antennaRingRef.current.rotation.y = t * 0.9;
      antennaRingRef.current.rotation.x = t * 0.35;
    }
    if (corePulseRef.current) {
      corePulseRef.current.emissiveIntensity = 1.2 + Math.sin(t * 1.5) * 0.5;
    }
    if (observeRef.current) {
      observeRef.current.rotation.y = t * 0.04;
    }
    if (dishesRef.current) {
      dishesRef.current.rotation.y = t * 0.06;
    }
  });

  return (
    <group
      ref={stationRef}
      position={[x / 3, 0, z / 3]}
      onClick={(e) => { e.stopPropagation(); setSelectedAddress(profile.address); }}
    >
      {/* ══════════════════════════════════════════════════════
          HEXAGONAL PLATFORM BASE
          ══════════════════════════════════════════════════════ */}
      <group>
        {/* Main hex platform */}
        <mesh castShadow receiveShadow position={[0, 1.0, 0]}>
          <cylinderGeometry args={[10, 11, 2, 6]} />
          <meshStandardMaterial color="#0a1824" roughness={0.84} metalness={0.30} />
        </mesh>
        {/* Lower step */}
        <mesh castShadow receiveShadow position={[0, 0.25, 0]}>
          <cylinderGeometry args={[11, 12.5, 0.5, 6]} />
          <meshStandardMaterial color="#060e18" roughness={0.9} />
        </mesh>
        {/* Platform gold trim */}
        <mesh position={[0, 2.05, 0]}>
          <torusGeometry args={[10.2, 0.12, 6, 36]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glow strip */}
        <mesh position={[0, 0.28, 0]}>
          <torusGeometry args={[10.8, 0.08, 4, 36]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.4} />
        </mesh>
        {/* Interior grid lines */}
        {[0, 1, 2].map((i) => {
          const ang = (i / 3) * Math.PI;
          return (
            <mesh key={`grid-${i}`} position={[0, 2.06, 0]} rotation={[0, ang, 0]}>
              <boxGeometry args={[0.05, 0.03, 20]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.9} />
            </mesh>
          );
        })}
        {/* 6 support legs */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const ang = (i / 6) * Math.PI * 2;
          return (
            <mesh key={`leg-${i}`} castShadow position={[Math.cos(ang) * 9, -4, Math.sin(ang) * 9]}>
              <cylinderGeometry args={[0.45, 0.7, 8, 6]} />
              <meshStandardMaterial color="#0a1824" roughness={0.85} metalness={0.4} />
            </mesh>
          );
        })}
      </group>

      {/* ══════════════════════════════════════════════════════
          CENTRAL RESEARCH BLOCK
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 2.0, 0]}>
        {/* Main lab building */}
        <mesh castShadow receiveShadow position={[0, 6, 0]}>
          <boxGeometry args={[8, 12, 7]} />
          <meshStandardMaterial color="#0d2035" roughness={0.78} metalness={0.35} />
        </mesh>
        {/* Second lab floor */}
        <mesh castShadow position={[0, 15.5, 0]}>
          <boxGeometry args={[5.5, 7, 5]} />
          <meshStandardMaterial color="#102840" roughness={0.72} metalness={0.40} />
        </mesh>
        {/* Third setback */}
        <mesh castShadow position={[0, 21.5, 0]}>
          <boxGeometry args={[3.5, 5, 3.5]} />
          <meshStandardMaterial color="#142e4a" roughness={0.65} metalness={0.45} />
        </mesh>
        {/* Glass facade panels (front & back) */}
        <mesh position={[0, 6, 3.56]}>
          <boxGeometry args={[6, 10, 0.08]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        <mesh position={[0, 6, -3.56]}>
          <boxGeometry args={[6, 10, 0.08]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.2} transmission={0.88} roughness={0.04} />
        </mesh>
        {/* Interior lab glow */}
        <mesh position={[0, 6, 3.2]}>
          <boxGeometry args={[5.5, 9, 0.05]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
        {/* Glow bands */}
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[8.06, 0.1, 7.06]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <boxGeometry args={[8.06, 0.08, 7.06]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, 19, 0]}>
          <boxGeometry args={[5.55, 0.08, 5.05]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.4} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          OBSERVATORY WING (left side dome)
          ══════════════════════════════════════════════════════ */}
      <group ref={observeRef} position={[-8.5, 2.0, 0]}>
        {/* Observatory drum base */}
        <mesh castShadow receiveShadow position={[0, 4.5, 0]}>
          <cylinderGeometry args={[3, 3.5, 9, 10]} />
          <meshStandardMaterial color="#0d2035" roughness={0.8} metalness={0.35} />
        </mesh>
        {/* Dome */}
        <mesh position={[0, 9.5, 0]}>
          <sphereGeometry args={[3.2, 14, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.22} transmission={0.88} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 9.5, 0]}>
          <sphereGeometry args={[3.25, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} wireframe />
        </mesh>
        {/* Dome equator gold ring */}
        <mesh position={[0, 9.5, 0]}>
          <torusGeometry args={[3.3, 0.12, 6, 24]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Rotating antenna ring on dome */}
        <mesh ref={antennaRingRef} position={[0, 10.5, 0]}>
          <torusGeometry args={[2.2, 0.12, 6, 20]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.2} metalness={0.8} />
        </mesh>
        {/* Internal reactor core */}
        <group position={[0, 10, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[1.4, 10, 10]} />
            <meshStandardMaterial
              ref={corePulseRef}
              color="#06b6d4"
              emissive="#06b6d4"
              emissiveIntensity={1.6}
              roughness={0.04}
              metalness={0.3}
            />
          </mesh>
          <pointLight color="#06b6d4" intensity={5.0} distance={25} decay={1.8} />
        </group>
        {/* Base glow */}
        <mesh position={[0, 2, 0]}>
          <torusGeometry args={[3.3, 0.1, 6, 24]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
        </mesh>
        {/* Skybridge to main block */}
        <mesh position={[4.5, 7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 9, 8]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.26} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[4.5, 7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 9, 4]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          ANALYSIS WING (right side, wide low block)
          ══════════════════════════════════════════════════════ */}
      <group position={[8.5, 2.0, 0]}>
        {/* Main analysis wing block */}
        <mesh castShadow receiveShadow position={[0, 4, 0]}>
          <boxGeometry args={[9, 8, 6.5]} />
          <meshStandardMaterial color="#0d2035" roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Upper mezzanine */}
        <mesh castShadow position={[0, 10, 0]}>
          <boxGeometry args={[6, 4, 4.5]} />
          <meshStandardMaterial color="#102840" roughness={0.72} metalness={0.36} />
        </mesh>
        {/* Glass side panel */}
        <mesh position={[-4.56, 4, 0]}>
          <boxGeometry args={[0.08, 6.5, 5.5]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.22} transmission={0.88} roughness={0.04} />
        </mesh>
        {/* Interior data glow */}
        <mesh position={[-4.2, 4, 0]}>
          <boxGeometry args={[0.05, 5.5, 5]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.6} transparent opacity={0.5} />
        </mesh>
        {/* Glow bands */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[9.06, 0.09, 6.56]} />
          <meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 8.1, 0]}>
          <boxGeometry args={[9.06, 0.08, 6.56]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.4} />
        </mesh>
        {/* Skybridge to main block */}
        <mesh position={[-4.5, 7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.38, 0.38, 9, 8]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.26} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[-4.5, 7, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 9, 4]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          DATA ANTENNA TOWER (rear, tallest feature)
          ══════════════════════════════════════════════════════ */}
      <group position={[0, 2.0, -7]}>
        {/* Base drum */}
        <mesh castShadow receiveShadow position={[0, 4, 0]}>
          <cylinderGeometry args={[1.8, 2.4, 8, 8]} />
          <meshStandardMaterial color="#0d2035" roughness={0.8} metalness={0.4} />
        </mesh>
        {/* Tower shaft */}
        <mesh castShadow receiveShadow position={[0, 14, 0]}>
          <cylinderGeometry args={[0.65, 1.6, 12, 8]} />
          <meshStandardMaterial color="#0f2840" roughness={0.72} metalness={0.45} />
        </mesh>
        {/* Upper thin antenna */}
        <mesh castShadow receiveShadow position={[0, 23, 0]}>
          <cylinderGeometry args={[0.22, 0.6, 10, 6]} />
          <meshStandardMaterial color="#142e4a" roughness={0.65} metalness={0.5} />
        </mesh>
        {/* Tip spike */}
        <mesh castShadow position={[0, 28.5, 0]}>
          <coneGeometry args={[0.35, 2.5, 6]} />
          <meshStandardMaterial color="#d97706" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Glow bands on tower */}
        {[8, 14, 20].map((ty) => (
          <mesh key={`tb-${ty}`} position={[0, ty, 0]}>
            <torusGeometry args={[1.2 - ty * 0.018, 0.09, 6, 16]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
          </mesh>
        ))}
        {/* 3 Signal dish arms */}
        <group ref={dishesRef} position={[0, 18, 0]}>
          {[0, 1, 2].map((i) => {
            const ang = (i / 3) * Math.PI * 2;
            return (
              <group key={`dish-${i}`} position={[Math.cos(ang) * 2.5, 0, Math.sin(ang) * 2.5]} rotation={[Math.PI / 5, ang, 0]}>
                {/* Arm */}
                <mesh>
                  <cylinderGeometry args={[0.06, 0.06, 3, 4]} />
                  <meshStandardMaterial color="#d97706" metalness={0.9} />
                </mesh>
                {/* Dish */}
                <mesh position={[0, 1.8, 0]}>
                  <cylinderGeometry args={[1.1, 1.1, 0.14, 10]} />
                  <meshStandardMaterial color="#1a2a40" roughness={0.55} metalness={0.65} />
                </mesh>
                {/* Dish glow center */}
                <mesh position={[0, 1.9, 0]}>
                  <cylinderGeometry args={[0.35, 0.35, 0.05, 8]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.5} />
                </mesh>
              </group>
            );
          })}
        </group>
        <pointLight position={[0, 28, 0]} color="#06b6d4" intensity={4.0} distance={30} decay={1.8} />
        {/* Skybridge to main block */}
        <mesh position={[0, 8, 5.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.35, 11, 8]} />
          <meshPhysicalMaterial color="#ecfeff" transparent opacity={0.25} transmission={0.88} roughness={0.06} />
        </mesh>
        <mesh position={[0, 8, 5.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 11, 4]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════
          SELECTION HALO
          ══════════════════════════════════════════════════════ */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[12, 13.2, 36]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}
    </group>
  );
}
