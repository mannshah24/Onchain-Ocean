import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OceanStructure, OceanZone } from '../../types';
import { ZONE_COLORS } from '../../types';

interface SonarMapProps {
  structures: OceanStructure[];
  zones: OceanZone[];
  cameraPos: { x: number; z: number };
  selectedAddress: string | null;
  accentColor: string;
  onStructureClick?: (address: string) => void;
}

export default function SonarMap({
  structures,
  // zones reserved for future zone boundary rendering
  cameraPos,
  selectedAddress,
  accentColor,
  onStructureClick,
}: SonarMapProps) {
  // Calculate bounds
  const bounds = useMemo(() => {
    if (structures.length === 0) return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const s of structures) {
      minX = Math.min(minX, s.position[0]);
      maxX = Math.max(maxX, s.position[0]);
      minZ = Math.min(minZ, s.position[2]);
      maxZ = Math.max(maxZ, s.position[2]);
    }
    const pad = 50;
    return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
  }, [structures]);

  const mapSize = 160;
  const rangeX = bounds.maxX - bounds.minX;
  const rangeZ = bounds.maxZ - bounds.minZ;

  function toMapX(worldX: number) {
    return ((worldX - bounds.minX) / rangeX) * mapSize;
  }
  function toMapZ(worldZ: number) {
    return ((worldZ - bounds.minZ) / rangeZ) * mapSize;
  }

  const cameraDot = {
    x: toMapX(cameraPos.x / 0.06),
    y: toMapZ(cameraPos.z / 0.06),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-full overflow-hidden border border-white/10 glass-panel shadow-[0_0_20px_rgba(6,182,212,0.1)]"
      style={{ width: mapSize, height: mapSize }}
    >
      {/* Background gradient */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, rgba(3,7,18,0.9) 70%)',
        }}
      />

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <line x1={mapSize / 2} y1={0} x2={mapSize / 2} y2={mapSize} stroke={accentColor} strokeWidth={0.5} />
        <line x1={0} y1={mapSize / 2} x2={mapSize} y2={mapSize / 2} stroke={accentColor} strokeWidth={0.5} />
        <circle cx={mapSize / 2} cy={mapSize / 2} r={mapSize * 0.25} stroke={accentColor} strokeWidth={0.5} fill="none" />
        <circle cx={mapSize / 2} cy={mapSize / 2} r={mapSize * 0.45} stroke={accentColor} strokeWidth={0.5} fill="none" />
      </svg>

      {/* Sonar sweep */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full border sonar-ring pointer-events-none"
        style={{
          width: mapSize * 0.6,
          height: mapSize * 0.6,
          borderColor: `${accentColor}60`,
        }}
      />

      {/* Structure dots */}
      <svg className="absolute inset-0 w-full h-full">
        {structures.map((s) => {
          const x = toMapX(s.position[0]);
          const y = toMapZ(s.position[2]);
          const isSelected = s.address === selectedAddress;
          const color = ZONE_COLORS[s.zone] ?? accentColor;

          return (
            <circle
              key={s.address}
              cx={x}
              cy={y}
              r={isSelected ? 3 : 1.2}
              fill={isSelected ? accentColor : color}
              opacity={isSelected ? 1 : 0.5}
              className="cursor-pointer"
              onClick={() => onStructureClick?.(s.address)}
            >
              {isSelected && (
                <animate
                  attributeName="r"
                  values="3;4.5;3"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          );
        })}
      </svg>

      {/* Camera position */}
      <div
        className="absolute w-2 h-2 rounded-full z-10"
        style={{
          left: cameraDot.x - 4,
          top: cameraDot.y - 4,
          backgroundColor: '#fff',
          boxShadow: `0 0 8px ${accentColor}, 0 0 16px ${accentColor}80`,
        }}
      />

      {/* Label */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] font-mono text-slate-500 tracking-widest uppercase">
        SONAR
      </div>
    </motion.div>
  );
}
