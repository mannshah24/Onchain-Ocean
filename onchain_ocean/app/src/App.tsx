import { useEffect } from 'react';
import { useOceanStore } from './store/useOceanStore';
import WorldCanvas from './components/webgl/WorldCanvas';
import HeaderHUD from './components/hud/HeaderHUD';
import SidebarHUD from './components/hud/SidebarHUD';
import BottomHUD from './components/hud/BottomHUD';
import HomepageOverlay from './components/hud/HomepageOverlay';
import SonarHUD from './components/hud/SonarHUD';
import Leaderboard from './components/hud/Leaderboard';
import RightInfoPanel from './components/hud/RightInfoPanel';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
  const activeRoute = useOceanStore((state) => state.activeRoute);
  const cameraState = useOceanStore((state) => state.cameraState);

  // Global ESC Key Listener to close panels / exit focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const state = useOceanStore.getState();
        if (state.selectedAddress) {
          state.setSelectedAddress(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showInstructions = activeRoute === 'explore' || cameraState.mode === 'free-float';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-ocean-bg select-none">
      
      {/* --- R3F 3D Viewport Backdrop (Real-time active ocean world) --- */}
      <WorldCanvas />

      {/* --- Global HUD Header Overlay --- */}
      <HeaderHUD />

      {/* --- Left Navigation Sidebar HUD --- */}
      <SidebarHUD />

      {/* --- Bottom Status & Control HUD --- */}
      <BottomHUD />

      {/* --- Homepage Overlay (Sits on top of Canvas) --- */}
      <HomepageOverlay />

      {/* --- Sonar Scan Transition HUD --- */}
      <SonarHUD />

      {/* --- Leaderboard Modal --- */}
      <Leaderboard />

      {/* --- Sliding Right Profile Info Panel --- */}
      <RightInfoPanel />

      {/* --- Floating Swimming Control Instructions HUD --- */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-20 left-6 z-30 max-w-xs p-4 rounded-2xl border border-white/5 bg-ocean-bg/70 backdrop-blur-md shadow-2xl pointer-events-none font-mono text-[10px] text-slate-400 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold uppercase tracking-wider text-[11px]">
              <span>🏊</span>
              <span>Navigation Active</span>
            </div>
            <div>• Move/Swim: <span className="text-white">W A S D</span></div>
            <div>• Vertical lift: <span className="text-white">Space / Shift</span></div>
            <div>• Look: <span className="text-white">Drag Mouse</span></div>
            <div className="mt-1 text-[9px] text-slate-500 italic border-t border-white/5 pt-1.5">
              Double-click seabed to return to lobby
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
