import { useOceanStore } from '../../store/useOceanStore';
import { Compass, Move, MousePointer, HelpCircle } from 'lucide-react';

export default function BottomHUD() {
  const cameraState = useOceanStore((state) => state.cameraState);

  // Dynamically calculate ocean depth based on camera height (Y axis)
  // Higher Y => closer to surface (less depth)
  // Lower Y => closer to seabed (more depth)
  const cameraY = cameraState?.position?.[1] ?? 25;
  const depth = Math.round(1600 - cameraY * 12.8);

  return (
    <div className="fixed bottom-4 left-4 right-4 h-14 flex items-center justify-between z-40 select-none pointer-events-none font-mono text-[10px]">

      {/* Left Capsule: Dynamic Ocean Depth */}
      <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 glass-panel shadow-lg">
        <Compass size={12} className="text-cyan-400 animate-spin-slow" />
        <span className="text-slate-400">Depth</span>
        <span className="text-cyan-400 font-bold tracking-wide">{depth.toLocaleString()} m</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
      </div>

      {/* Center: Navigation Instructions */}
      <div className="hidden sm:flex pointer-events-auto items-center gap-6 px-6 py-2.5 rounded-full border border-white/5 bg-ocean-bg/60 backdrop-blur-md shadow-md text-slate-400">
        <div className="flex items-center gap-1.5">
          <Move size={11} className="text-slate-500" />
          <span>Drag to look around</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1.5">
          <HelpCircle size={11} className="text-slate-500" />
          <span>Scroll to zoom</span>
        </div>
        <span className="text-white/10">|</span>
        <div className="flex items-center gap-1.5">
          <MousePointer size={11} className="text-slate-500" />
          <span>Click on any structure</span>
        </div>
      </div>

      {/* Right Capsule: Online counter */}
      <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/10 glass-panel shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-slate-200 font-semibold">2,345 Online explorers</span>
      </div>

    </div>
  );
}
