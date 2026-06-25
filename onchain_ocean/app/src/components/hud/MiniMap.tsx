import { useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useOceanStore } from '../../store/useOceanStore';
import type { OceanStructure } from '../../types';

interface MiniMapProps {
  buildings: OceanStructure[];
  playerX: number;
  playerZ: number;
  visible: boolean;
}

const RES = 64;
const DISPLAY = 128;
const PAD = 3;

const ZONE_RGB: Record<string, [number, number, number]> = {
  whale_abyss: [6, 182, 212],
  defi_trench: [168, 85, 247],
  nft_reef: [236, 72, 153],
  gamefi_atoll: [34, 197, 94],
  governance_basin: [249, 115, 22],
  builders_cove: [59, 130, 246],
  degen_depths: [239, 68, 68],
  validator_ridge: [234, 179, 8],
  social_shallows: [20, 184, 166],
  explorer_expanse: [139, 92, 246],
};

export default function MiniMap({ buildings, playerX, playerZ, visible }: MiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useOceanStore((state) => state.theme);
  const cameraState = useOceanStore((state) => state.cameraState);

  // Track player yaw angle from lookAt and position
  const playerAngle = useMemo(() => {
    const dx = cameraState.lookAt[0] - cameraState.position[0];
    const dz = cameraState.lookAt[2] - cameraState.position[2];
    // In canvas space, 0 is up (negative Y/Z), so we adjust angle calculation
    return Math.atan2(dx, -dz);
  }, [cameraState.lookAt, cameraState.position]);

  const playerXRef = useRef(playerX);
  const playerZRef = useRef(playerZ);
  const playerAngleRef = useRef(playerAngle);

  useLayoutEffect(() => {
    playerXRef.current = playerX;
    playerZRef.current = playerZ;
    playerAngleRef.current = playerAngle;
  }, [playerX, playerZ, playerAngle]);

  const bufRef = useRef<Uint8ClampedArray | null>(null);

  // Calculate world bounds from unscaled positions
  const wb = useMemo(() => {
    if (buildings.length === 0) return null;
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const b of buildings) {
      const bx = b.position[0], bz = b.position[2];
      if (bx < x0) x0 = bx;
      if (bx > x1) x1 = bx;
      if (bz < z0) z0 = bz;
      if (bz > z1) z1 = bz;
    }
    const margin = 50;
    return { x0: x0 - margin, x1: x1 + margin, z0: z0 - margin, z1: z1 + margin };
  }, [buildings]);

  const wbRef = useRef(wb);
  useLayoutEffect(() => {
    wbRef.current = wb;
  }, [wb]);

  // Pre-calculate pixel positions on canvas
  const bPixels = useMemo(() => {
    if (!wb || buildings.length === 0) return [];
    const ww = wb.x1 - wb.x0;
    const wh = wb.z1 - wb.z0;
    const ds = RES - PAD * 2;
    const s = Math.min(ds / ww, ds / wh);
    const ox = PAD + (ds - ww * s) / 2;
    const oy = PAD + (ds - wh * s) / 2;

    return buildings.map((b) => ({
      px: Math.round(ox + (b.position[0] - wb.x0) * s),
      py: Math.round(oy + (b.position[2] - wb.z0) * s),
      zone: b.zone || 'explorer_expanse',
    }));
  }, [buildings, wb]);

  // World to canvas coordinate transform (handles player position scale)
  const w2p = useCallback((wx: number, wz: number): [number, number] => {
    const wb = wbRef.current;
    if (!wb) return [RES / 2, RES / 2];
    const ww = wb.x1 - wb.x0;
    const wh = wb.z1 - wb.z0;
    const ds = RES - PAD * 2;
    const s = Math.min(ds / ww, ds / wh);
    const ox = PAD + (ds - ww * s) / 2;
    const oy = PAD + (ds - wh * s) / 2;

    // Convert player scaled coordinate to unscaled layout coordinate
    const unscaledWx = wx / 0.06;
    const unscaledWz = wz / 0.06;

    return [
      Math.round(ox + (unscaledWx - wb.x0) * s),
      Math.round(oy + (unscaledWz - wb.z0) * s),
    ];
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || bPixels.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    if (!bufRef.current) {
      bufRef.current = new Uint8ClampedArray(RES * RES * 4);
    }
    const buf = bufRef.current;

    // Clear buffer (dark background matching theme shadow)
    const baseColor = new THREE.Color(theme.shadow).multiplyScalar(0.2);
    const r = Math.round(baseColor.r * 255);
    const g = Math.round(baseColor.g * 255);
    const b = Math.round(baseColor.b * 255);

    for (let i = 0; i < buf.length; i += 4) {
      buf[i] = r;
      buf[i + 1] = g;
      buf[i + 2] = b;
      buf[i + 3] = 220; // translucent background
    }

    // Draw building dots
    for (const { px, py, zone } of bPixels) {
      if (px < 0 || px >= RES || py < 0 || py >= RES) continue;
      const idx = (py * RES + px) * 4;
      const rgb = ZONE_RGB[zone] || [120, 120, 120];
      buf[idx] = rgb[0];
      buf[idx + 1] = rgb[1];
      buf[idx + 2] = rgb[2];
      buf[idx + 3] = 255;
    }

    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(buf.buffer as ArrayBuffer), RES, RES),
      0,
      0
    );

    // Draw player arrow/pointer on top
    const [ppx, ppy] = w2p(playerXRef.current, playerZRef.current);
    ctx.save();
    ctx.translate(ppx, ppy);
    ctx.rotate(playerAngleRef.current);
    
    // Draw crisp triangle matching Git City
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -4);  // Forward point
    ctx.lineTo(-3, 3);  // Back left
    ctx.lineTo(3, 3);   // Back right
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();
  }, [bPixels, w2p, theme]);

  // Redraw loop
  useEffect(() => {
    if (visible) {
      draw();
    }
  }, [visible, draw, playerX, playerZ, playerAngle]);

  if (!visible || buildings.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 z-40 pointer-events-auto flex flex-col items-center">
      {/* N compass indicator badge */}
      <div 
        className="px-2 py-0.5 border text-[8px] font-mono font-bold tracking-widest bg-black/95 rounded-t-md border-b-0 uppercase select-none"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)', color: theme.accent }}
      >
        N
      </div>

      <div 
        className="p-0.5 border bg-black/90 shadow-2xl rounded-sm"
        style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <canvas
          ref={canvasRef}
          width={RES}
          height={RES}
          style={{
            width: DISPLAY,
            height: DISPLAY,
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
