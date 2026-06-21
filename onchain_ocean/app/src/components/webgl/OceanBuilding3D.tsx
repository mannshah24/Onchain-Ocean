import { useMemo, useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { OceanStructure } from '../../types';
import { ZONE_COLORS } from '../../types';

const WHITE = new THREE.Color('#ffffff');
const SHARED_BOX = new THREE.BoxGeometry(1, 1, 1);

// ─── Window Texture Generator (mirrors Git City approach) ────
function createWindowTexture(
  rows: number, cols: number, litPct: number, seed: number,
  litColors: string[], offColor: string, faceColor: string
): THREE.CanvasTexture {
  const WS = 6, GAP = 2, PAD = 3;
  const w = PAD * 2 + cols * WS + Math.max(0, cols - 1) * GAP;
  const h = PAD * 2 + rows * WS + Math.max(0, rows - 1) * GAP;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, w, h);

  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = PAD + c * (WS + GAP);
      const y = PAD + r * (WS + GAP);
      ctx.fillStyle = rand() < litPct
        ? litColors[Math.floor(rand() * litColors.length)]
        : offColor;
      ctx.fillRect(x, y, WS, WS);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Zone-Based Color Palettes ───────────────────────────────
interface BuildingPalette {
  face: string;
  roof: string;
  windowLit: string[];
  windowOff: string;
  accent: string;
}

const ZONE_PALETTES: Record<string, BuildingPalette> = {
  whale_abyss: {
    face: '#0a1628', roof: '#06b6d4',
    windowLit: ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc'],
    windowOff: '#0c1a2e', accent: '#06b6d4',
  },
  defi_trench: {
    face: '#120a24', roof: '#a855f7',
    windowLit: ['#a855f7', '#c084fc', '#d8b4fe', '#8b5cf6'],
    windowOff: '#14082a', accent: '#a855f7',
  },
  nft_reef: {
    face: '#1a0a1e', roof: '#ec4899',
    windowLit: ['#ec4899', '#f472b6', '#fb7185', '#f9a8d4'],
    windowOff: '#1c0820', accent: '#ec4899',
  },
  builders_cove: {
    face: '#0a1230', roof: '#3b82f6',
    windowLit: ['#3b82f6', '#60a5fa', '#93c5fd', '#2563eb'],
    windowOff: '#0c1432', accent: '#3b82f6',
  },
  governance_basin: {
    face: '#1a1008', roof: '#f97316',
    windowLit: ['#f97316', '#fb923c', '#fdba74', '#ea580c'],
    windowOff: '#1c1208', accent: '#f97316',
  },
  degen_depths: {
    face: '#1a0808', roof: '#ef4444',
    windowLit: ['#ef4444', '#f87171', '#fca5a5', '#dc2626'],
    windowOff: '#1c0a08', accent: '#ef4444',
  },
  social_shallows: {
    face: '#081a18', roof: '#14b8a6',
    windowLit: ['#14b8a6', '#2dd4bf', '#5eead4', '#0d9488'],
    windowOff: '#0a1c1a', accent: '#14b8a6',
  },
  validator_ridge: {
    face: '#1a1a08', roof: '#eab308',
    windowLit: ['#eab308', '#facc15', '#fde047', '#ca8a04'],
    windowOff: '#1c1c08', accent: '#eab308',
  },
  gamefi_atoll: {
    face: '#081a0a', roof: '#22c55e',
    windowLit: ['#22c55e', '#4ade80', '#86efac', '#16a34a'],
    windowOff: '#0a1c0c', accent: '#22c55e',
  },
  explorer_expanse: {
    face: '#10082a', roof: '#8b5cf6',
    windowLit: ['#8b5cf6', '#a78bfa', '#c4b5fd', '#7c3aed'],
    windowOff: '#120a2c', accent: '#8b5cf6',
  },
};

const DEFAULT_PALETTE: BuildingPalette = {
  face: '#0a1628', roof: '#06b6d4',
  windowLit: ['#06b6d4', '#22d3ee', '#67e8f9'],
  windowOff: '#0c1a2e', accent: '#06b6d4',
};

// ─── Rise Animation ─────────────────────────────────────────
function BuildingRise({ height, meshRef }: { height: number; meshRef: React.RefObject<THREE.Mesh | null> }) {
  const progress = useRef(0);
  const done = useRef(false);

  useFrame((_, delta) => {
    if (done.current) return;
    progress.current = Math.min(1, progress.current + delta * 1.2);
    const t = 1 - Math.pow(1 - progress.current, 3); // easeOutCubic

    if (meshRef.current) {
      meshRef.current.scale.y = Math.max(0.001, t * height);
      meshRef.current.position.y = (height * t) / 2;
    }

    if (progress.current >= 1) done.current = true;
  });

  return null;
}

// ─── Focus Beacon ────────────────────────────────────────────
export const FocusBeacon = memo(function FocusBeacon({
  height, width, depth, accentColor,
}: { height: number; width: number; depth: number; accentColor: string }) {
  const coneRef = useRef<THREE.Mesh>(null);
  const markerRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (coneRef.current) {
      (coneRef.current.material as THREE.MeshBasicMaterial).opacity = 0.10 + Math.sin(t * 1.5) * 0.03;
    }
    if (markerRef.current) {
      markerRef.current.position.y = height + 35 + Math.sin(t * 2) * 5;
      markerRef.current.rotation.y = t * 1.5;
    }
  });

  const coneRadius = Math.max(width, depth) * 1.2;

  return (
    <group>
      <mesh ref={coneRef} position={[0, 200, 0]}>
        <cylinderGeometry args={[0, coneRadius, 400, 32, 1, true]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.10} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 250, 0]}>
        <boxGeometry args={[2, 500, 2]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <group ref={markerRef} position={[0, height + 35, 0]}>
        <mesh>
          <octahedronGeometry args={[6, 0]} />
          <meshBasicMaterial color={accentColor} />
        </mesh>
        <mesh scale={[1.6, 1.6, 1.6]}>
          <octahedronGeometry args={[6, 0]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.15} />
        </mesh>
      </group>
    </group>
  );
});

// ─── Bioluminescent Glow (equiv to ClaimedGlow) ──────────────
export const BioGlow = memo(function BioGlow({
  height, width, depth, color,
}: { height: number; width: number; depth: number; color: string }) {
  const trimH = 2;
  const hw = width / 2 + 0.6;
  const hd = depth / 2 + 0.6;

  return (
    <group position={[0, height - trimH / 2, 0]}>
      <mesh position={[0, 0, hd]}>
        <boxGeometry args={[width + 1.2, trimH, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -hd]}>
        <boxGeometry args={[width + 1.2, trimH, 1.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[-hw, 0, 0]}>
        <boxGeometry args={[1.2, trimH, depth]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[hw, 0, 0]}>
        <boxGeometry args={[1.2, trimH, depth]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
});

// ─── Far Label (Canvas Texture Sprite) ───────────────────────
function createFarLabel(structure: OceanStructure): THREE.CanvasTexture {
  const W = 512, H = 80;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const display = structure.domain || `${structure.address.slice(0, 8)}...`;
  const text = display.length > 16 ? display.slice(0, 16).toUpperCase() + '...' : display.toUpperCase();

  ctx.font = 'bold 36px "Outfit", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth = ctx.measureText(text).width;
  const padX = 20, padY = 8;
  const bgW = textWidth + padX * 2;
  const bgH = 44 + padY * 2;
  const bgX = (W - bgW) / 2;
  const bgY = (H - bgH) / 2;
  ctx.fillStyle = 'rgba(3, 7, 18, 0.75)';
  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgW, bgH, 6);
  ctx.fill();

  const zoneColor = ZONE_COLORS[structure.zone] || '#06b6d4';
  ctx.fillStyle = zoneColor;
  ctx.shadowColor = zoneColor;
  ctx.shadowBlur = 10;
  ctx.fillText(text, W / 2, H / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── Main OceanBuilding3D ─────────────────────────────────────
interface Props {
  structure: OceanStructure;
  focused: boolean;
  dimmed: boolean;
  onClick: (address: string) => void;
}

function OceanBuilding3D({ structure, focused, dimmed, onClick }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const palette = ZONE_PALETTES[structure.zone] || DEFAULT_PALETTE;

  // Scaled dimensions for 3D space (layout engine produces large coords)
  const scaleFactor = 0.06;
  const posX = structure.position[0] * scaleFactor;
  const posZ = structure.position[2] * scaleFactor;
  const height = Math.max(3, structure.height * 0.04);
  const width = Math.max(2, structure.width * 0.15);
  const depth = Math.max(2, structure.depth * 0.15);

  const textures = useMemo(() => {
    const seed = structure.address.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 137;
    const front = createWindowTexture(
      structure.floors, structure.windowsPerFloor, structure.litPercentage, seed,
      palette.windowLit, palette.windowOff, palette.face
    );
    const side = createWindowTexture(
      structure.floors, structure.sideWindowsPerFloor, structure.litPercentage, seed + 7919,
      palette.windowLit, palette.windowOff, palette.face
    );
    return { front, side };
  }, [structure.address, structure.floors, structure.windowsPerFloor, structure.sideWindowsPerFloor, structure.litPercentage, palette]);

  useEffect(() => {
    return () => { textures.front.dispose(); textures.side.dispose(); };
  }, [textures]);

  const materials = useMemo(() => {
    const roof = new THREE.MeshStandardMaterial({
      color: palette.roof,
      emissive: new THREE.Color(palette.roof),
      emissiveIntensity: 1.5,
      roughness: 0.6,
    });
    const make = (tex: THREE.CanvasTexture) =>
      new THREE.MeshStandardMaterial({
        map: tex, emissive: WHITE, emissiveMap: tex,
        emissiveIntensity: 2.0, roughness: 0.85, metalness: 0,
      });
    const side = make(textures.side);
    const front = make(textures.front);
    return [side, side, roof, roof, front, front];
  }, [textures, palette.roof]);

  const labelTexture = useMemo(() => createFarLabel(structure), [structure]);

  useEffect(() => {
    return () => { labelTexture?.dispose(); };
  }, [labelTexture]);

  const labelMaterial = useMemo(
    () => labelTexture ? new THREE.SpriteMaterial({
      map: labelTexture, transparent: true, depthTest: true, sizeAttenuation: true, fog: true,
    }) : null,
    [labelTexture]
  );

  useEffect(() => {
    return () => { for (const mat of materials) mat.dispose(); labelMaterial?.dispose(); };
  }, [materials, labelMaterial]);

  // Dim/focus effect
  useEffect(() => {
    for (const mat of materials) {
      mat.transparent = dimmed;
      mat.opacity = dimmed ? 0.55 : 1;
      mat.emissiveIntensity = dimmed ? 0.3 : (mat.map ? 2.0 : 1.5);
    }
    if (labelMaterial) {
      labelMaterial.opacity = focused ? 0 : dimmed ? 0.15 : 1;
    }
    if (spriteRef.current) spriteRef.current.visible = !focused;
  }, [focused, dimmed, materials, labelMaterial]);

  return (
    <group position={[posX, 0, posZ]}>
      <mesh
        ref={meshRef}
        material={materials}
        geometry={SHARED_BOX}
        scale={[width, 0.001, depth]}
        dispose={null}
        onPointerDown={(e) => { pointerDown.current = { x: e.clientX, y: e.clientY }; }}
        onClick={(e) => {
          e.stopPropagation();
          if (!pointerDown.current) return;
          const dx = e.clientX - pointerDown.current.x;
          const dy = e.clientY - pointerDown.current.y;
          if (dx * dx + dy * dy > 25) return;
          onClick(structure.address);
        }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      />

      {labelMaterial && (
        <sprite
          ref={spriteRef}
          material={labelMaterial}
          position={[0, height + 4, 0]}
          scale={[16, 2.5, 1]}
        />
      )}

      <BuildingRise height={height} meshRef={meshRef} />

      <BioGlow height={height} width={width} depth={depth} color={palette.accent} />

      {focused && (
        <FocusBeacon height={height} width={width} depth={depth} accentColor={palette.accent} />
      )}
    </group>
  );
}

export default memo(OceanBuilding3D);
