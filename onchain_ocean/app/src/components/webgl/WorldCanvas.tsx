import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useOceanStore } from '../../store/useOceanStore';
import CameraController from './CameraController';
import Environment from './Environment';
import CitySkyline from './CitySkyline';
import OceanLife from './OceanLife';
import TrafficSystem from './TrafficSystem';
import Spire from './Structures/Spire';
import Rig from './Structures/Rig';
import Citadel from './Structures/Citadel';
import Vent from './Structures/Vent';
import ResearchStation from './Structures/ResearchStation';
import CommunityCluster from './Structures/CommunityCluster';

export default function WorldCanvas() {
  const profiles = useOceanStore((state) => state.profiles);
  const resetSearch = useOceanStore((state) => state.resetSearch);
  const selectedAddress = useOceanStore((state) => state.selectedAddress);
  const setSelectedAddress = useOceanStore((state) => state.setSelectedAddress);

  // Helper to resolve badge labels and emojis per structure type
  const getLabelInfo = (profile: typeof profiles[0]) => {
    switch (profile.type) {
      case 'wallet':
        return { emoji: '🧬', category: 'Developer', name: profile.domain || 'Dev Spire' };
      case 'startup':
        if (profile.sector === 'Infrastructure') {
          return { emoji: '📡', category: 'Infrastructure', name: profile.projectName || 'Research Node' };
        }
        if (profile.sector === 'Social') {
          return { emoji: '🌱', category: 'Social Shelf', name: profile.projectName || 'Social Campus' };
        }
        return { emoji: '💸', category: 'DeFi Hub', name: profile.projectName || 'Startup Rig' };
      case 'community':
        return { emoji: '🏛️', category: 'Community', name: profile.projectName || 'Reef Citadel' };
      case 'blockchain':
        return { emoji: '💎', category: 'Blockchain L1', name: profile.projectName || 'Genesis crystal' };
      default:
        return { emoji: '⚓', category: 'Structure', name: profile.domain || 'Ocean Node' };
    }
  };

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none"
      onDoubleClick={resetSearch} // Double click background to return home
    >
      <Canvas
        camera={{ position: [0, 25, 45], fov: 50, near: 0.1, far: 350 }}
        gl={{ antialias: true, toneMapping: 3 /* ACESFilmic */ }}
        shadows
      >
        {/* --- Background deep ocean color (matches fog) --- */}
        <color attach="background" args={['#041029']} />

        {/* --- Ambient Scene Environment --- */}
        <Environment />

        {/* --- City Skyline Silhouettes & Landmark Pillars --- */}
        <CitySkyline />

        {/* --- Living Ocean Marine Life & Atmosphere --- */}
        <OceanLife />

        {/* --- Glowing Transaction Traffic System --- */}
        <TrafficSystem />

        {/* --- Smooth Motion Camera Controller --- */}
        <CameraController />

        {/* --- Floating 3D Billboard Labels --- */}
        <group>
          {profiles.map((profile) => {
            const [x, z] = profile.coordinates;
            const tx = x / 3;
            const tz = z / 3;
            
            // Adjust height based on structure type
            let labelY = 12;
            if (profile.type === 'wallet') labelY = 28;
            else if (profile.type === 'startup' && profile.sector === 'Infrastructure') labelY = 18;
            else if (profile.type === 'startup' && profile.sector === 'Social') labelY = 14;
            else if (profile.type === 'startup') labelY = 16;
            else if (profile.type === 'community') labelY = 16;
            else if (profile.type === 'blockchain') labelY = 9;

            const isSelected = selectedAddress === profile.address;
            const info = getLabelInfo(profile);

            return (
              <Html
                key={`label-${profile.address}`}
                position={[tx, labelY, tz]}
                center
                distanceFactor={18}
                style={{
                  pointerEvents: 'auto',
                }}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAddress(profile.address);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full border bg-slate-950/80 backdrop-blur-md shadow-lg transition-all duration-300 font-mono text-[9px] cursor-pointer whitespace-nowrap text-white ${
                    isSelected
                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105'
                      : 'border-white/10 hover:border-cyan-400/40 hover:scale-105'
                  }`}
                >
                  <span className="text-xs">{info.emoji}</span>
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="font-heading font-bold text-[9px] text-white leading-none">
                      {info.name}
                    </span>
                    <span className="text-[7.5px] text-slate-400 font-medium leading-none tracking-wide">
                      {info.category}
                    </span>
                  </div>
                </div>
              </Html>
            );
          })}
        </group>

        {/* --- Core Civilization Structures Mapping --- */}
        <group>
          {profiles.map((profile) => {
            switch (profile.type) {
              case 'wallet':
                return <Spire key={profile.address} profile={profile} />;
              case 'startup':
                if (profile.sector === 'Infrastructure') {
                  return <ResearchStation key={profile.address} profile={profile} />;
                }
                if (profile.sector === 'Social') {
                  return <CommunityCluster key={profile.address} profile={profile} />;
                }
                return <Rig key={profile.address} profile={profile} />;
              case 'community':
                return <Citadel key={profile.address} profile={profile} />;
              case 'blockchain':
                return <Vent key={profile.address} profile={profile} />;
              default:
                return null;
            }
          })}
        </group>
      </Canvas>
    </div>
  );
}
